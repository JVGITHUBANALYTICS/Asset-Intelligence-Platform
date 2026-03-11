import type { LoginCredentials, RegisterData, AuthUser } from '../types';
import { mockDelay } from './api';

export async function loginUser(credentials: LoginCredentials): Promise<AuthUser | null> {
  await mockDelay(800);

  if (credentials.email && credentials.password.length >= 6) {
    return {
      id: '1',
      name: 'Sarah Johnson',
      email: credentials.email,
      role: 'admin',
      title: 'Senior Asset Manager',
      organization: 'PPL Electric Utilities',
    };
  }
  return null;
}

export async function registerUser(data: RegisterData): Promise<AuthUser | null> {
  await mockDelay(800);

  if (data.email && data.password.length >= 6 && data.password === data.confirmPassword) {
    return {
      id: '2',
      name: data.name,
      email: data.email,
      role: 'viewer',
      title: 'Senior Asset Manager',
      organization: 'PPL Electric Utilities',
    };
  }
  return null;
}

export function logoutUser(): void {
  localStorage.removeItem('auth_user');
}
