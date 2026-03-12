import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder';

export const supabaseConfigured = !!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseConfigured) {
  console.warn(
    'Supabase environment variables not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Promise that resolves once the Supabase client has finished restoring
 * the auth session from localStorage. All service queries should await
 * this before making requests so RLS policies see the authenticated role.
 */
export const sessionReady: Promise<void> = supabase.auth.getSession().then(() => {});
