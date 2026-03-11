import { createContext, useState, useEffect, type ReactNode } from 'react';
import type { AuthContextType, AuthUser, LoginCredentials, RegisterData } from '../types';
import { supabase } from '../lib/supabase';

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => false,
  register: async () => false,
  logout: () => {},
});

async function fetchProfile(userId: string): Promise<Partial<AuthUser>> {
  const { data } = await supabase
    .from('profiles')
    .select('name, role, title, organization')
    .eq('id', userId)
    .single();

  return data ?? {};
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Listen for auth state changes (session restore, login, logout)
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        setUser({
          id: session.user.id,
          name: profile.name ?? session.user.user_metadata?.name ?? '',
          email: session.user.email ?? '',
          role: (profile.role as AuthUser['role']) ?? 'viewer',
          title: profile.title ?? '',
          organization: profile.organization ?? '',
        });
      }
      setIsLoading(false);
    }).catch((err) => {
      console.error('Failed to get session:', err);
      setIsLoading(false);
    });

    // Subscribe to future auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const profile = await fetchProfile(session.user.id);
          setUser({
            id: session.user.id,
            name: profile.name ?? session.user.user_metadata?.name ?? '',
            email: session.user.email ?? '',
            role: (profile.role as AuthUser['role']) ?? 'viewer',
            title: profile.title ?? '',
            organization: profile.organization ?? '',
          });
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      },
    );

    return () => subscription.unsubscribe();
  }, []);

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    setIsLoading(true);
    const { data: signInData, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (error || !signInData.user) {
      setIsLoading(false);
      return false;
    }

    // Set user immediately so navigation works (don't wait for onAuthStateChange)
    const profile = await fetchProfile(signInData.user.id);
    setUser({
      id: signInData.user.id,
      name: profile.name ?? signInData.user.user_metadata?.name ?? '',
      email: signInData.user.email ?? '',
      role: (profile.role as AuthUser['role']) ?? 'viewer',
      title: profile.title ?? '',
      organization: profile.organization ?? '',
    });
    setIsLoading(false);
    return true;
  };

  const register = async (data: RegisterData): Promise<boolean> => {
    if (data.password !== data.confirmPassword) return false;

    setIsLoading(true);
    const { data: signUpData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          name: data.name,
          role: 'viewer',
          title: '',
          organization: 'PPL Electric Utilities',
        },
      },
    });

    if (error || !signUpData.user) {
      setIsLoading(false);
      return false;
    }

    // Set user immediately so navigation works
    const profile = await fetchProfile(signUpData.user.id);
    setUser({
      id: signUpData.user.id,
      name: profile.name ?? data.name,
      email: signUpData.user.email ?? data.email,
      role: (profile.role as AuthUser['role']) ?? 'viewer',
      title: profile.title ?? '',
      organization: profile.organization ?? 'PPL Electric Utilities',
    });
    setIsLoading(false);
    return true;
  };

  const logout = () => {
    supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
