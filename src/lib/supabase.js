import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing Supabase configuration. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local or the deployment environment.'
  );
}

const isBrowser = typeof window !== 'undefined';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: isBrowser
    ? {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      }
    : {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
});

export const MEDIA_BUCKET = 'media';

export function resolveImageUrl(value) {
  if (!value) return null;
  if (/^(https?:)?\/\//.test(value) || value.startsWith('/')) return value;
  const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(value);
  return data?.publicUrl || null;
}
