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

export interface UpdateProfileParams {
  fullName?: string;
  phone?: string;
}

/**
 * Register a new customer via Supabase Auth and initialize user metadata.
 * The database trigger creates the profile and customer role.
 * Does NOT write to profiles.email or perform client upsert with email.
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

  const cleanEmail = email.trim().toLowerCase();
  const cleanPhone = phone.trim().replace(/\D/g, '');
  const cleanName = fullName.trim();

  // Call Supabase Auth signUp with metadata in options.data
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
    console.warn('[AuthService] signUpCustomer error message:', error.message);
    const msg = error.message.toLowerCase();
    if (
      msg.includes('already registered') ||
      msg.includes('already exists') ||
      msg.includes('user already exists')
    ) {
      throw new Error('An account with this email already exists. Please sign in instead.');
    }
    if (msg.includes('password')) {
      throw new Error('Password must be at least 6 characters long.');
    }
    throw new Error(error.message || 'Unable to connect to the authentication service.');
  }

  if (!data.user) {
    throw new Error('Failed to create customer account. Please try again.');
  }

  console.log('[AuthService] signUpCustomer created user ID:', data.user.id, 'session exists:', Boolean(data.session));

  // After signup, fetch the profile using its id created by the database trigger
  let profile: UserProfile | null = await fetchUserProfile(data.user.id);

  if (!profile) {
    // Graceful fallback for initial UI state before confirmation/trigger propagation
    profile = {
      id: data.user.id,
      full_name: cleanName,
      phone: cleanPhone,
      role: 'customer',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
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
    console.warn('[AuthService] signInCustomer failed:', error.message);
    const msg = error.message.toLowerCase();
    if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
      throw new Error('Invalid email or password.');
    }
    if (msg.includes('email not confirmed')) {
      throw new Error('Please check your email to confirm your account.');
    }
    if (msg.includes('password')) {
      throw new Error('Invalid password provided.');
    }
    throw new Error(error.message || 'Unable to connect to the authentication service.');
  }

  if (!data.user) {
    throw new Error('Login failed: user not found.');
  }

  console.log('[AuthService] signInCustomer authenticated user ID:', data.user.id);

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
 * Authenticate admin with email and password, verifying `admin` role in user_roles table.
 * Admin login succeeds ONLY when the authenticated user has role='admin' in user_roles.
 * If no admin role exists: immediately sign out and throw an administrator-access error.
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
    console.warn('[AuthService] signInAdmin failed:', error.message);
    const msg = error.message.toLowerCase();
    if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
      throw new Error('Invalid email or password.');
    }
    if (msg.includes('email not confirmed')) {
      throw new Error('Please check your email to confirm your account.');
    }
    throw new Error(error.message || 'Unable to connect to the authentication service.');
  }

  if (!data.user) {
    throw new Error('Authentication failed: user not found.');
  }

  // Query user_roles directly for verified admin role
  const { data: roleRecord, error: roleError } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', data.user.id)
    .eq('role', 'admin')
    .maybeSingle();

  if (roleError) {
    console.error('[AuthService] signInAdmin role verification query error:', roleError.message);
  }

  if (roleError || !roleRecord || roleRecord.role !== 'admin') {
    console.warn('[AuthService] Access Denied: User ID', data.user.id, 'does not have admin role in user_roles. Signing out.');
    // Non-admin attempting admin login must be signed out immediately
    await supabase.auth.signOut();
    throw new Error('Access Denied: Your account does not have administrator authorization.');
  }

  console.log('[AuthService] Admin verified in user_roles for user ID:', data.user.id);
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
 * Directly queries the `user_roles` table for role='admin'.
 * No RPC or public has_role call is used.
 */
export async function checkIsAdmin(userId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !userId) return false;

  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();

    if (error) {
      console.warn('[AuthService] checkIsAdmin query error for user ID:', userId, error.message);
      return false;
    }

    const isAdmin = Boolean(data && data.role === 'admin');
    console.log('[AuthService] checkIsAdmin result for user ID:', userId, 'isAdmin:', isAdmin);
    return isAdmin;
  } catch (err) {
    console.error('[AuthService] Error verifying admin authorization for user ID:', userId, err);
    return false;
  }
}

/**
 * Fetch profile data for a user from Supabase profiles table.
 * Note: profiles schema contains id, full_name, phone, role, created_at, updated_at (no email).
 */
export async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  if (!isSupabaseConfigured || !userId) return null;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, phone, role, created_at, updated_at')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.warn('[AuthService] fetchUserProfile error for user ID:', userId, error.message);
      return null;
    }

    if (!data) {
      console.log('[AuthService] fetchUserProfile: no row returned for user ID:', userId);
      return null;
    }

    return data as UserProfile;
  } catch (err) {
    console.error('[AuthService] fetchUserProfile exception for user ID:', userId, err);
    return null;
  }
}

/**
 * Fetch role for a user ('admin' from user_roles or default to 'customer')
 */
export async function fetchUserRole(userId: string): Promise<AppRole> {
  if (!isSupabaseConfigured || !userId) return 'customer';

  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.warn('[AuthService] fetchUserRole error for user ID:', userId, error.message);
      return 'customer';
    }

    if (data?.role === 'admin') {
      return 'admin';
    }
    return 'customer';
  } catch (err) {
    console.error('[AuthService] fetchUserRole exception for user ID:', userId, err);
    return 'customer';
  }
}

/**
 * Update authenticated customer's own profile (full_name and phone only).
 * Customers must never be able to change id or role.
 */
export async function updateCustomerProfile(
  userId: string,
  params: UpdateProfileParams
): Promise<UserProfile | null> {
  if (!isSupabaseConfigured || !userId) {
    throw new Error('Authentication required to update profile.');
  }

  const updates: { full_name?: string; phone?: string; updated_at: string } = {
    updated_at: new Date().toISOString(),
  };

  if (params.fullName !== undefined) {
    updates.full_name = params.fullName.trim();
  }
  if (params.phone !== undefined) {
    updates.phone = params.phone.trim().replace(/\D/g, '');
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select('id, full_name, phone, role, created_at, updated_at')
    .maybeSingle();

  if (error) {
    throw new Error('Failed to update profile. Please try again.');
  }

  return data as UserProfile;
}

/**
 * Fetch all registered customer profiles from Supabase profiles table for Admin display.
 * Does not read or query profiles.email.
 */
export async function fetchAllCustomerProfiles(): Promise<UserSession[]> {
  if (!isSupabaseConfigured) return [];

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, phone, role, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (error || !data) {
      return [];
    }

    return data.map((p: UserProfile) => ({
      id: p.id,
      email: '', // profiles table does not store email; auth.users is the source of truth
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
  console.log('[AuthService] signOutUser called');
  if (isSupabaseConfigured) {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.warn('[AuthService] signOutUser error:', error.message);
    } else {
      console.log('[AuthService] signOutUser completed successfully');
    }
  }
}

/**
 * Helper to build UserSession object from Supabase user and profile.
 * Email is derived exclusively from user.email (auth.users source of truth).
 */
export function buildUserSession(
  user: User,
  profile: UserProfile | null,
  role: AppRole = 'customer'
): UserSession {
  return {
    id: user.id,
    email: user.email || '',
    phone: profile?.phone || (user.user_metadata?.phone as string | undefined) || '',
    fullName: profile?.full_name || (user.user_metadata?.full_name as string | undefined) || '',
    role,
    time: new Date().toLocaleTimeString(),
  };
}

/**
 * Send password reset email to customer via Supabase resetPasswordForEmail
 */
export async function sendPasswordResetEmail(email: string): Promise<void> {
  console.log('[AuthService] sendPasswordResetEmail called');
  if (!isSupabaseConfigured) {
    throw new Error(
      'Unable to connect to the authentication service. Supabase environment variables are missing.'
    );
  }

  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
    throw new Error('Please enter a valid email address.');
  }

  const redirectTo = `${window.location.origin}/`;

  const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
    redirectTo,
  });

  if (error) {
    console.warn('[AuthService] sendPasswordResetEmail error:', error.message);
    const msg = error.message.toLowerCase();
    if (msg.includes('rate limit')) {
      throw new Error('Too many requests. Please wait a few moments before trying again.');
    }
    throw new Error(error.message || 'Failed to send password reset email. Please try again.');
  }

  console.log('[AuthService] sendPasswordResetEmail: password recovery email dispatched');
}

/**
 * Update user password after recovery via Supabase updateUser({ password })
 */
export async function updateUserPassword(newPassword: string): Promise<void> {
  console.log('[AuthService] updateUserPassword called');
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
    console.warn('[AuthService] updateUserPassword error:', error.message);
    const msg = error.message.toLowerCase();
    if (msg.includes('same password')) {
      throw new Error('New password must be different from previous password.');
    }
    if (msg.includes('expired') || msg.includes('invalid token') || msg.includes('otp')) {
      throw new Error('Password reset link has expired. Please request a new one.');
    }
    throw new Error(error.message || 'Failed to update password. Please try again.');
  }

  console.log('[AuthService] updateUserPassword completed successfully');
}
