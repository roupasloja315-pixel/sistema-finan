import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase environment variables not configured. Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in .env file'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
