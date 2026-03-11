import { createContext, useState, useEffect, type ReactNode } from 'react';
import type { AuthContextType, AuthUser, LoginCredentials, RegisterData } from '../types';

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => false,
  register: async () => false,
  logout: () => {},
});

const MOCK_USER: AuthUser = {
  id: '1',
  name: 'Sarah Chen',
  email: 'schen@pplelectric.com',
  role: 'asset_manager',
  title: 'Senior Asset Manager',
  organization: 'PPL Electric Utilities',
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('auth_user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem('auth_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    setIsLoading(true);
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    if (credentials.email && credentials.password.length >= 6) {
      const authUser: AuthUser = {
        ...MOCK_USER,
        email: credentials.email,
      };
      setUser(authUser);
      localStorage.setItem('auth_user', JSON.stringify(authUser));
      setIsLoading(false);
      return true;
    }

    setIsLoading(false);
    return false;
  };

  const register = async (data: RegisterData): Promise<boolean> => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 800));

    if (data.email && data.password.length >= 6 && data.password === data.confirmPassword) {
      const authUser: AuthUser = {
        id: '2',
        name: data.name,
        email: data.email,
        role: 'viewer',
        title: 'Utility Analyst',
        organization: 'PPL Electric Utilities',
      };
      setUser(authUser);
      localStorage.setItem('auth_user', JSON.stringify(authUser));
      setIsLoading(false);
      return true;
    }

    setIsLoading(false);
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth_user');
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
