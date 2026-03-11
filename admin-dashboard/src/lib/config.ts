/**
 * Feature flag for gradual migration from mock data to Supabase.
 * Set VITE_USE_SUPABASE=true in .env.local to use real backend.
 * Set to false (or omit) to fall back to mock data.
 */
export const USE_SUPABASE = import.meta.env.VITE_USE_SUPABASE === 'true';
