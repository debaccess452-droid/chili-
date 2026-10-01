import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { UserProfile, UserSession, AppRole } from '../types';

export interface SignUpParams {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}

export interface AuthResult {
  session: any | null;
  user: any | null;
  profile: UserProfile | null;
  role: AppRole;
  requiresEmailConfirmation?: boolean;
}

/**
 * Register a new customer via Supabase Auth and initialize user profile
 */
export async function signUpCustomer({
  fullName,
  email,
  phone,
  password,
}: SignUpParams): Promise<AuthResult> {
  if (!isSupabaseConfigured) {
    throw new Error(
      'Supabase is not configured. Please define VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.'
    );
  }

  // 1. Call Supabase Auth signUp
  const cleanEmail = email.trim().toLowerCase();
  const cleanPhone = phone.trim().replace(/\D/g, '');
  const cleanName = fullName.trim();

  const { data, error } = await supabase.auth.signUp({
    email: cleanEmail,
    password,
    options: {
      data: {
        full_name: cleanName,
        phone: cleanPhone,
      },
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data.user) {
    throw new Error('Failed to create account. Please try again.');
  }

  // 2. Synchronize profile into `profiles` table
  let profile: UserProfile | null = {
    id: data.user.id,
    full_name: cleanName,
    email: cleanEmail,
    phone: cleanPhone,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  try {
    const { data: upsertedProfile } = await supabase
      .from('profiles')
      .upsert({
        id: data.user.id,
        full_name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        updated_at: new Date().toISOString(),
      })
      .select('*')
      .maybeSingle();

    if (upsertedProfile) {
      profile = upsertedProfile;
    }
  } catch (err) {
    console.warn('Could not upsert profile directly (handled by DB trigger or rules):', err);
  }

  const requiresEmailConfirmation = !data.session;

  return {
    session: data.session,
    user: data.user,
    profile,
    role: 'customer',
    requiresEmailConfirmation,
  };
}

/**
 * Authenticate customer with email and password
 */
export async function signInCustomer(email: string, password: string): Promise<AuthResult> {
  if (!isSupabaseConfigured) {
    throw new Error(
      'Supabase is not configured. Please define VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.'
    );
  }

  const cleanEmail = email.trim().toLowerCase();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: cleanEmail,
    password,
  });

  if (error) {
    if (error.message.includes('Invalid login credentials')) {
      throw new Error('Invalid email or password. Please verify your credentials.');
    }
    throw new Error(error.message);
  }

  if (!data.user) {
    throw new Error('Login failed: user not found.');
  }

  // Fetch profile
  const profile = await fetchUserProfile(data.user.id);
  const role = await fetchUserRole(data.user.id);

  return {
    session: data.session,
    user: data.user,
    profile,
    role,
  };
}

/**
 * Authenticate admin with email and password, verifying `admin` role in database
 */
export async function signInAdmin(email: string, password: string): Promise<AuthResult> {
  if (!isSupabaseConfigured) {
    throw new Error(
      'Supabase is not configured. Please define VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.'
    );
  }

  const cleanEmail = email.trim().toLowerCase();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: cleanEmail,
    password,
  });

  if (error) {
    if (error.message.includes('Invalid login credentials')) {
      throw new Error('Invalid admin email or password.');
    }
    throw new Error(error.message);
  }

  if (!data.user) {
    throw new Error('Authentication failed: user not found.');
  }

  // Authorize: check if user has 'admin' role in user_roles table
  const isAdmin = await checkIsAdmin(data.user.id);

  if (!isAdmin) {
    // Immediately terminate session since this user does not have admin permissions
    await supabase.auth.signOut();
    throw new Error('Access Denied: Your account does not have administrator authorization.');
  }

  const profile = await fetchUserProfile(data.user.id);

  return {
    session: data.session,
    user: data.user,
    profile,
    role: 'admin',
  };
}

/**
 * Check if a given user has the 'admin' role in the database
 */
export async function checkIsAdmin(userId: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false;

  try {
    // 1. Query user_roles table
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();

    if (!error && data && data.role === 'admin') {
      return true;
    }

    // 2. Query has_role RPC if present in database
    try {
      const { data: rpcResult } = await supabase.rpc('has_role', { role: 'admin' });
      if (rpcResult === true) return true;
    } catch {
      // RPC might not exist, proceed
    }

    return false;
  } catch (err) {
    console.error('Error verifying admin authorization:', err);
    return false;
  }
}

/**
 * Fetch profile data for a user
 */
export async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  if (!isSupabaseConfigured) return null;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return data as UserProfile;
  } catch {
    return null;
  }
}

/**
 * Fetch role for a user ('admin' or default to 'customer')
 */
export async function fetchUserRole(userId: string): Promise<AppRole> {
  const isAdmin = await checkIsAdmin(userId);
  return isAdmin ? 'admin' : 'customer';
}

/**
 * Sign out current user from Supabase
 */
export async function signOutUser(): Promise<void> {
  if (isSupabaseConfigured) {
    await supabase.auth.signOut();
  }
}

/**
 * Helper to build UserSession object from Supabase user and profile
 */
export function buildUserSession(user: any, profile: UserProfile | null, role: AppRole = 'customer'): UserSession {
  return {
    id: user.id,
    email: user.email || profile?.email || '',
    phone: profile?.phone || user.user_metadata?.phone || '',
    fullName: profile?.full_name || user.user_metadata?.full_name || '',
    role,
    time: new Date().toLocaleTimeString(),
  };
}
