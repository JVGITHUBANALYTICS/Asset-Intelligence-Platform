import type { LoginCredentials, RegisterData, AuthUser } from '../types';
import { supabase } from '../lib/supabase';

export async function loginUser(credentials: LoginCredentials): Promise<AuthUser | null> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  });

  if (error || !data.user) return null;

  // Fetch profile for role/title/organization
  const { data: profile } = await supabase
    .from('profiles')
    .select('name, role, title, organization')
    .eq('id', data.user.id)
    .single();

  return {
    id: data.user.id,
    name: profile?.name ?? data.user.user_metadata?.name ?? '',
    email: data.user.email ?? '',
    role: profile?.role ?? 'viewer',
    title: profile?.title ?? '',
    organization: profile?.organization ?? '',
  };
}

export async function registerUser(data: RegisterData): Promise<AuthUser | null> {
  if (data.password !== data.confirmPassword) return null;

  const { data: authData, error } = await supabase.auth.signUp({
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

  if (error || !authData.user) return null;

  return {
    id: authData.user.id,
    name: data.name,
    email: data.email,
    role: 'viewer',
    title: '',
    organization: 'PPL Electric Utilities',
  };
}

export async function logoutUser(): Promise<void> {
  await supabase.auth.signOut();
}
