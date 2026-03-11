// Mock API base - simulates network delay for realistic feel
export async function mockDelay(ms: number = 500): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// In a real app, this would be an axios/fetch instance
export const API_BASE_URL = '/api';

export async function apiGet<T>(data: T, delay: number = 500): Promise<T> {
  await mockDelay(delay);
  return data;
}

export async function apiPost<T>(data: T, delay: number = 500): Promise<T> {
  await mockDelay(delay);
  return data;
}
