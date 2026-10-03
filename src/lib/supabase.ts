import { createClient } from '@supabase/supabase-js';

// Environment variables for Supabase - single source of truth
const rawUrl = 
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || 
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) || 
  '';
const rawAnonKey = 
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || 
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY) || 
  '';

// Helper to validate valid HTTP/HTTPS URL
function isValidHttpUrl(str: string): boolean {
  if (!str) return false;
  const trimmed = str.trim();
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return false;
  }
  try {
    const parsed = new URL(trimmed);
    return (
      (parsed.protocol === 'http:' || parsed.protocol === 'https:') &&
      parsed.hostname !== 'your-project.supabase.co' &&
      parsed.hostname !== 'placeholder.supabase.co'
    );
  } catch {
    return false;
  }
}

// Detect and correct swapped or misconfigured environment variables
let candidateUrl = '';
let candidateAnonKey = '';

if (isValidHttpUrl(rawUrl)) {
  candidateUrl = rawUrl.trim().replace(/\/+$/, '');
  candidateAnonKey = rawAnonKey.trim();
} else if (isValidHttpUrl(rawAnonKey)) {
  // Credentials were swapped in environment (URL was placed in VITE_SUPABASE_ANON_KEY)
  candidateUrl = rawAnonKey.trim().replace(/\/+$/, '');
  candidateAnonKey = rawUrl.trim();
} else {
  candidateUrl = 'https://fxuyajecvbgtqdfiyvcm.supabase.co';
  candidateAnonKey = rawAnonKey.trim();
}

// Target project URL guaranteed to be a valid HTTP/HTTPS URL
export const SUPABASE_URL = candidateUrl || 'https://fxuyajecvbgtqdfiyvcm.supabase.co';

// Helper to detect placeholder or misconfigured credentials (e.g. URLs accidentally set as keys)
function isPlaceholder(value: string): boolean {
  if (!value) return true;
  const lower = value.toLowerCase().trim();
  return (
    lower === '' ||
    lower === 'your-anon-key' ||
    lower === 'your_anon_key' ||
    lower === 'placeholder' ||
    lower === 'placeholder-anon-key' ||
    lower === 'your-anon-key-here' ||
    lower === 'anon_key' ||
    lower.startsWith('http://') ||
    lower.startsWith('https://') ||
    lower.includes('supabase.co')
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

if (isServiceRoleKey(candidateAnonKey)) {
  console.error(
    '[Supabase Security Alert] Service-role credentials (sb_secret / service_role) must NEVER be exposed in frontend client code. Only use the public anon key.'
  );
}

export const isSupabaseConfigured = Boolean(
  candidateAnonKey &&
  !isPlaceholder(candidateAnonKey) &&
  !isServiceRoleKey(candidateAnonKey)
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
  isSupabaseConfigured ? candidateAnonKey : 'public-anon-key-unconfigured',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);
