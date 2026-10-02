import { createClient } from '@supabase/supabase-js';

// Environment variables for Supabase - single source of truth
const rawUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || '';
const rawAnonKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || '';

// Target project URL
export const SUPABASE_URL = 
  rawUrl && rawUrl !== 'https://your-project.supabase.co' && rawUrl !== 'https://placeholder.supabase.co'
    ? rawUrl.trim().replace(/\/+$/, '')
    : 'https://fxuyajecvbgtqdfiyvcm.supabase.co';

// Helper to detect placeholder credentials
function isPlaceholder(value: string): boolean {
  if (!value) return true;
  const lower = value.toLowerCase().trim();
  return (
    lower === 'your-anon-key' ||
    lower === 'your_anon_key' ||
    lower === 'placeholder' ||
    lower === 'placeholder-anon-key' ||
    lower === 'your-anon-key-here' ||
    lower === 'anon_key'
  );
}

// Security guard: Reject service-role / sb_secret credentials from being used in browser client
function isServiceRoleKey(key: string): boolean {
  if (!key) return false;
  const trimmed = key.trim();
  if (trimmed.startsWith('sb_secret_') || trimmed.toLowerCase().includes('service_role')) {
    return true;
  }
  return false;
}

if (isServiceRoleKey(rawAnonKey)) {
  console.error(
    '[Supabase Security Alert] Service-role credentials (sb_secret / service_role) must NEVER be exposed in frontend client code. Only use the public anon key.'
  );
}

export const isSupabaseConfigured = Boolean(
  rawAnonKey &&
  !isPlaceholder(rawAnonKey) &&
  !isServiceRoleKey(rawAnonKey)
);

if (!isSupabaseConfigured) {
  console.warn(
    '[Supabase] VITE_SUPABASE_ANON_KEY is not configured or is using placeholder credentials. ' +
    'Set VITE_SUPABASE_ANON_KEY to your public anon key to connect to live Supabase services.'
  );
}

// Single reusable Supabase client instance
export const supabase = createClient(
  SUPABASE_URL,
  isSupabaseConfigured ? rawAnonKey.trim() : 'public-anon-key-unconfigured',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);
