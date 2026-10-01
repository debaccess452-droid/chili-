import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';
import { UserProfile, UserSession, AppRole } from '../types';

export interface SignUpParams {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}

export interface AuthResult {
  session: Session | null;
  user: User | null;
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
      'Unable to connect to the authentication service. Supabase environment variables are missing.'
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
    if (error.message.toLowerCase().includes('already registered')) {
      throw new Error('An account with this email already exists. Please sign in instead.');
    }
    if (error.message.toLowerCase().includes('password')) {
      throw new Error('Password must be at least 6 characters long.');
    }
    throw new Error(error.message || 'Unable to connect to the authentication service.');
  }

  if (!data.user) {
    throw new Error('Failed to create customer account. Please try again.');
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
  } catch {
    // If backend DB trigger handles profile insertion or RLS restricts client upsert
    try {
      const existing = await fetchUserProfile(data.user.id);
      if (existing) profile = existing;
    } catch {
      // Continue gracefully with metadata fallback
    }
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
      'Unable to connect to the authentication service. Supabase environment variables are missing.'
    );
  }

  const cleanEmail = email.trim().toLowerCase();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: cleanEmail,
    password,
  });

  if (error) {
    if (error.message.includes('Invalid login credentials')) {
      throw new Error('Invalid email or password.');
    }
    if (error.message.toLowerCase().includes('email not confirmed')) {
      throw new Error('Please check your email to confirm your account.');
    }
    throw new Error(error.message || 'Unable to connect to the authentication service.');
  }

  if (!data.user) {
    throw new Error('Login failed: user not found.');
  }

  // Fetch profile and role from Supabase
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
      'Unable to connect to the authentication service. Supabase environment variables are missing.'
    );
  }

  const cleanEmail = email.trim().toLowerCase();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: cleanEmail,
    password,
  });

  if (error) {
    if (error.message.includes('Invalid login credentials')) {
      throw new Error('Invalid email or password.');
    }
    throw new Error(error.message || 'Unable to connect to the authentication service.');
  }

  if (!data.user) {
    throw new Error('Authentication failed: user not found.');
  }

  // Authorize: check if user has 'admin' role in user_roles table or via has_role RPC
  const isAdmin = await checkIsAdmin(data.user.id);

  if (!isAdmin) {
    // Immediately terminate session since this user does not have admin permissions
    await supabase.auth.signOut();
    throw new Error('Your account does not have administrator access.');
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
 * Check if a given user has the 'admin' role in the database.
 * Verifies against has_role(_user_id, _role) RPC with user_roles table query fallback.
 */
export async function checkIsAdmin(userId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !userId) return false;

  try {
    // 1. Primary check: Call database function has_role(_user_id, _role)
    const { data: rpcResult, error: rpcError } = await supabase.rpc('has_role', {
      _user_id: userId,
      _role: 'admin',
    });

    if (!rpcError && typeof rpcResult === 'boolean') {
      return rpcResult;
    }

    // 2. Direct user_roles table query fallback / verification
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();

    if (!error && data && data.role === 'admin') {
      return true;
    }

    return false;
  } catch (err) {
    console.error('Error verifying admin authorization:', err);
    return false;
  }
}

/**
 * Fetch profile data for a user from Supabase profiles table
 */
export async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  if (!isSupabaseConfigured || !userId) return null;

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
 * Fetch all registered customer profiles from Supabase profiles table for Admin display
 */
export async function fetchAllCustomerProfiles(): Promise<UserSession[]> {
  if (!isSupabaseConfigured) return [];

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) {
      return [];
    }

    return data.map((p: UserProfile) => ({
      id: p.id,
      email: p.email || '',
      phone: p.phone || '',
      fullName: p.full_name || '',
      role: 'customer' as AppRole,
      time: p.created_at ? new Date(p.created_at).toLocaleDateString() : undefined,
    }));
  } catch (err) {
    console.error('Error fetching customer profiles:', err);
    return [];
  }
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
export function buildUserSession(
  user: User,
  profile: UserProfile | null,
  role: AppRole = 'customer'
): UserSession {
  return {
    id: user.id,
    email: user.email || profile?.email || '',
    phone: profile?.phone || (user.user_metadata?.phone as string | undefined) || '',
    fullName: profile?.full_name || (user.user_metadata?.full_name as string | undefined) || '',
    role,
    time: new Date().toLocaleTimeString(),
  };
}

/**
 * Send password reset email to customer
 */
export async function sendPasswordResetEmail(email: string): Promise<void> {
  if (!isSupabaseConfigured) {
    throw new Error(
      'Unable to connect to the authentication service. Supabase environment variables are missing.'
    );
  }

  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
    throw new Error('Please enter a valid email address.');
  }

  // Use dynamic browser origin so it functions on localhost and deployed Vercel domain
  const redirectTo = `${window.location.origin}/`;

  const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
    redirectTo,
  });

  if (error) {
    throw new Error(error.message || 'Failed to send password reset email. Please try again.');
  }
}

/**
 * Update user password after password recovery
 */
export async function updateUserPassword(newPassword: string): Promise<void> {
  if (!isSupabaseConfigured) {
    throw new Error(
      'Unable to connect to the authentication service. Supabase environment variables are missing.'
    );
  }

  if (!newPassword || newPassword.length < 6) {
    throw new Error('Password must be at least 6 characters long.');
  }

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    if (error.message.toLowerCase().includes('same password')) {
      throw new Error('New password must be different from previous password.');
    }
    throw new Error(error.message || 'Failed to update password. Please try again.');
  }
}

