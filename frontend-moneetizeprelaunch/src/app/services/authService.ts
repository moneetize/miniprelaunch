import { projectId, publicAnonKey } from '/utils/supabase/info';
import { safeSetItem, safeGetItem } from '../utils/storage';
import { initializeUserPoints } from '../utils/pointsManager';
import { markProfileIncomplete } from '../utils/profileSettings';
import { getOAuthRedirectTo, supabase, type SocialAuthProvider } from './supabaseClient';
import type { Session, User } from '@supabase/supabase-js';

export type { SocialAuthProvider };

/**
 * Authentication Service - Handles user registration, login, and session management.
 */

export interface UserData {
  id: string;
  email: string;
  name: string;
  created_at?: string;
  points?: number;
  isAdmin?: boolean;
}

export interface AuthResponse {
  success: boolean;
  data?: {
    user: UserData;
    session: {
      access_token: string;
      refresh_token: string;
    };
  };
  error?: string;
  code?: string;
}

type AdminMetadataValue = boolean | string | undefined;

type AuthMetadata = {
  name?: string;
  full_name?: string;
  preferred_username?: string;
  user_name?: string;
  isAdmin?: AdminMetadataValue;
  role?: string;
  app_role?: string;
  roles?: string[];
};

type BackendAuthResult = {
  success?: boolean;
  data?: {
    user?: Partial<UserData> & {
      user_metadata?: AuthMetadata;
      app_metadata?: AuthMetadata;
    };
    session?: {
      access_token?: string;
      refresh_token?: string;
    };
  };
  error?: string;
  code?: string;
  status?: number;
};

type SupabaseUserResult = {
  id?: string;
  email?: string;
  created_at?: string;
  isAdmin?: boolean;
  points?: number;
  user_metadata?: AuthMetadata;
  app_metadata?: AuthMetadata;
  error?: string;
  msg?: string;
};

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-7a79873f/auth`;
const SUPABASE_AUTH_URL = `https://${projectId}.supabase.co/auth/v1`;

function authHeaders(token = publicAnonKey) {
  return {
    Authorization: `Bearer ${token}`,
    apikey: publicAnonKey,
    'Content-Type': 'application/json',
  };
}

async function readJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  return text ? (JSON.parse(text) as T) : ({} as T);
}

function getMetadataName(user?: BackendAuthResult['data']['user'] | SupabaseUserResult) {
  return (
    user?.user_metadata?.name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.user_name ||
    user?.user_metadata?.preferred_username
  );
}

function isAdminValue(value: AdminMetadataValue) {
  return value === true || `${value}`.toLowerCase() === 'true';
}

function hasAdminRole(metadata?: AuthMetadata) {
  if (!metadata) return false;

  const roles = [
    metadata.role,
    metadata.app_role,
    ...(Array.isArray(metadata.roles) ? metadata.roles : []),
  ];

  return roles.some(role => `${role}`.toLowerCase() === 'admin');
}

function getMetadataIsAdmin(user?: BackendAuthResult['data']['user'] | SupabaseUserResult) {
  return Boolean(
    isAdminValue(user?.isAdmin) ||
    isAdminValue(user?.user_metadata?.isAdmin) ||
    isAdminValue(user?.app_metadata?.isAdmin) ||
    hasAdminRole(user?.user_metadata) ||
    hasAdminRole(user?.app_metadata),
  );
}

function normalizeUser(
  user?: BackendAuthResult['data']['user'] | SupabaseUserResult,
  fallbackEmail = '',
  fallbackName = '',
): UserData {
  const email = user?.email || fallbackEmail;
  const name = user?.name || getMetadataName(user) || fallbackName || email.split('@')[0] || 'Moneetize User';

  return {
    id: user?.id || safeGetItem('user_id') || `user-${Date.now()}`,
    email,
    name,
    created_at: user?.created_at,
    points: 'points' in (user || {}) ? (user as UserData).points : undefined,
    isAdmin: getMetadataIsAdmin(user),
  };
}

function persistUserProfile(
  user?: BackendAuthResult['data']['user'] | SupabaseUserResult,
  fallbackEmail = '',
  fallbackName = '',
) {
  const normalizedUser = normalizeUser(user, fallbackEmail, fallbackName);

  safeSetItem('user_email', normalizedUser.email);
  safeSetItem('userName', normalizedUser.name);
  safeSetItem('user_id', normalizedUser.id);
  setAdminStatus(Boolean(normalizedUser.isAdmin));

  return normalizedUser;
}

function persistAuthSession(
  user: BackendAuthResult['data']['user'] | undefined,
  session: BackendAuthResult['data']['session'] | undefined,
  fallbackEmail = '',
  fallbackName = '',
) {
  if (!session?.access_token) {
    throw new Error('Auth response did not include an access token.');
  }

  const normalizedUser = persistUserProfile(user, fallbackEmail, fallbackName);

  safeSetItem('access_token', session.access_token);
  if (session.refresh_token) {
    safeSetItem('refresh_token', session.refresh_token);
  }
  localStorage.removeItem('user_password');

  initializeUserPoints(normalizedUser.points || parseInt(safeGetItem('userPoints') || '10', 10));

  return normalizedUser;
}

function toSupabaseUserResult(user: User): SupabaseUserResult {
  return {
    id: user.id,
    email: user.email || '',
    created_at: user.created_at,
    user_metadata: user.user_metadata as SupabaseUserResult['user_metadata'],
    app_metadata: user.app_metadata as SupabaseUserResult['app_metadata'],
  };
}

function persistSupabaseSession(session: Session) {
  const normalizedUser = persistUserProfile(toSupabaseUserResult(session.user));

  safeSetItem('access_token', session.access_token);
  safeSetItem('refresh_token', session.refresh_token);
  localStorage.removeItem('user_password');

  initializeUserPoints(normalizedUser.points || parseInt(safeGetItem('userPoints') || '10', 10));

  return normalizedUser;
}

async function syncSupabaseUserFromAccessToken(accessToken?: string) {
  if (!accessToken) return undefined;

  try {
    const response = await fetch(`${SUPABASE_AUTH_URL}/user`, {
      method: 'GET',
      headers: authHeaders(accessToken),
    });

    if (!response.ok) return undefined;

    const result = await readJson<SupabaseUserResult>(response);
    return persistUserProfile(result);
  } catch (err) {
    console.warn('Unable to refresh Supabase user profile after auth:', err);
    return undefined;
  }
}

function toAuthResponse(
  user: UserData,
  session: BackendAuthResult['data']['session'] | undefined,
): AuthResponse {
  return {
    success: true,
    data: {
      user,
      session: {
        access_token: session?.access_token || safeGetItem('access_token') || '',
        refresh_token: session?.refresh_token || safeGetItem('refresh_token') || '',
      },
    },
  };
}

function isNetworkError(err: unknown) {
  return err instanceof TypeError && err.message.toLowerCase().includes('fetch');
}

/**
 * Start a Supabase OAuth redirect for Google, Apple, or Facebook.
 */
export async function signInWithSocialProvider(
  provider: SocialAuthProvider,
  options: { nextPath?: string } = {},
): Promise<AuthResponse> {
  try {
    const nextPath = options.nextPath || '/profile-screen';
    safeSetItem('oauth_next_path', nextPath);

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: getOAuthRedirectTo(),
        scopes: provider === 'facebook' ? 'email,public_profile' : undefined,
      },
    });

    if (error) {
      return {
        success: false,
        error: error.message,
        code: 'oauth_start_failed',
      };
    }

    return {
      success: true,
      data: {
        user: normalizeUser(undefined, '', provider),
        session: {
          access_token: '',
          refresh_token: '',
        },
      },
    };
  } catch (err) {
    console.error('Social auth start error:', err);

    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unable to start social sign-in',
      code: 'oauth_start_failed',
    };
  }
}

/**
 * Complete an OAuth redirect and persist the returned Supabase session.
 */
export async function handleOAuthCallback(): Promise<AuthResponse> {
  try {
    const url = new URL(window.location.href);
    const hashParams = new URLSearchParams(url.hash.replace(/^#/, ''));
    const error = url.searchParams.get('error') || hashParams.get('error');
    const errorDescription = url.searchParams.get('error_description') || hashParams.get('error_description');

    if (error) {
      return {
        success: false,
        error: errorDescription || error,
        code: 'oauth_provider_error',
      };
    }

    const code = url.searchParams.get('code');
    if (code) {
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError || !data.session) {
        return {
          success: false,
          error: exchangeError?.message || 'OAuth callback did not include a session.',
          code: 'oauth_callback_failed',
        };
      }

      const user = persistSupabaseSession(data.session);
      return toAuthResponse(user, data.session);
    }

    const hashAccessToken = hashParams.get('access_token');
    const hashRefreshToken = hashParams.get('refresh_token');
    if (hashAccessToken && hashRefreshToken) {
      const { data, error: sessionError } = await supabase.auth.setSession({
        access_token: hashAccessToken,
        refresh_token: hashRefreshToken,
      });

      if (sessionError || !data.session) {
        return {
          success: false,
          error: sessionError?.message || 'OAuth callback did not include a valid session.',
          code: 'oauth_callback_failed',
        };
      }

      const user = persistSupabaseSession(data.session);
      return toAuthResponse(user, data.session);
    }

    const { data, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !data.session) {
      return {
        success: false,
        error: sessionError?.message || 'No OAuth session found after provider redirect.',
        code: 'oauth_callback_failed',
      };
    }

    const user = persistSupabaseSession(data.session);
    return toAuthResponse(user, data.session);
  } catch (err) {
    console.error('OAuth callback error:', err);

    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unable to complete social sign-in',
      code: 'oauth_callback_failed',
    };
  }
}

export function consumeOAuthNextPath() {
  const nextPath = safeGetItem('oauth_next_path') || '/profile-screen';
  localStorage.removeItem('oauth_next_path');
  return nextPath.startsWith('/') ? nextPath : '/profile-screen';
}

/**
 * Register a new user account in Supabase.
 */
export async function registerUser(
  name: string,
  email: string,
  password: string
): Promise<AuthResponse> {
  try {
    console.log('Registration attempt:', { name, email });

    if (!name || !email || !password) {
      return {
        success: false,
        error: 'Name, email, and password are required',
        code: 'validation_error'
      };
    }

    if (name.trim().length < 2) {
      return {
        success: false,
        error: 'Name must be at least 2 characters long',
        code: 'validation_error'
      };
    }

    if (password.length < 6) {
      return {
        success: false,
        error: 'Password must be at least 6 characters long',
        code: 'validation_error'
      };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        success: false,
        error: 'Please enter a valid email address',
        code: 'validation_error'
      };
    }

    const requestBody = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
    };

    console.log('Sending registration request to:', `${API_BASE_URL}/signup`);

    const response = await fetch(`${API_BASE_URL}/signup`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(requestBody),
    });

    const result = await readJson<BackendAuthResult>(response);
    console.log('Registration response status:', response.status);
    console.log('Registration response data:', result);

    if (!response.ok || !result.success) {
      return {
        success: false,
        error: result.error || 'Registration failed',
        code: result.code || 'unknown_error'
      };
    }

    const user = persistAuthSession(result.data?.user, result.data?.session, requestBody.email, requestBody.name);
    const syncedUser = await syncSupabaseUserFromAccessToken(result.data?.session?.access_token);
    markProfileIncomplete();

    console.log('Registration successful, user logged in');
    return toAuthResponse(syncedUser || user, result.data?.session);
  } catch (err) {
    console.error('Registration error:', err);

    if (isNetworkError(err)) {
      return {
        success: false,
        error: 'Network error. Please check your connection and try again.',
        code: 'network_error'
      };
    }

    return {
      success: false,
      error: err instanceof Error ? err.message : 'An error occurred during registration',
      code: 'unknown_error'
    };
  }
}

/**
 * Login an existing user with Supabase.
 */
export async function loginUser(
  email: string,
  password: string
): Promise<AuthResponse> {
  try {
    console.log('Login attempt:', { email });

    if (!email || !password) {
      return {
        success: false,
        error: 'Email and password are required',
        code: 'validation_error'
      };
    }

    const requestBody = {
      email: email.toLowerCase().trim(),
      password,
    };

    console.log('Sending login request to:', `${API_BASE_URL}/login`);

    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(requestBody),
    });

    const result = await readJson<BackendAuthResult>(response);
    console.log('Login response status:', response.status);
    console.log('Login response data:', result);

    if (!response.ok || !result.success) {
      return {
        success: false,
        error: result.error || 'Login failed',
        code: result.code || 'unknown_error'
      };
    }

    const user = persistAuthSession(result.data?.user, result.data?.session, requestBody.email);
    const syncedUser = await syncSupabaseUserFromAccessToken(result.data?.session?.access_token);

    console.log('Login successful');
    return toAuthResponse(syncedUser || user, result.data?.session);
  } catch (err) {
    console.error('Login error:', err);

    if (isNetworkError(err)) {
      return {
        success: false,
        error: 'Network error. Please check your connection and try again.',
        code: 'network_error'
      };
    }

    return {
      success: false,
      error: err instanceof Error ? err.message : 'An error occurred during login',
      code: 'unknown_error'
    };
  }
}

/**
 * Get current user profile from Supabase Auth.
 */
export async function getUserProfile(): Promise<AuthResponse> {
  try {
    const accessToken = safeGetItem('access_token');

    if (!accessToken) {
      return {
        success: false,
        error: 'Not authenticated',
        code: 'no_token'
      };
    }

    console.log('Fetching user profile');

    const response = await fetch(`${SUPABASE_AUTH_URL}/user`, {
      method: 'GET',
      headers: authHeaders(accessToken),
    });

    const result = await readJson<SupabaseUserResult>(response);
    console.log('Profile response status:', response.status);
    console.log('Profile response data:', result);

    if (!response.ok) {
      return {
        success: false,
        error: result.error || result.msg || 'Failed to fetch profile',
        code: 'profile_fetch_failed'
      };
    }

    const user = persistUserProfile(result);

    return toAuthResponse(user, undefined);
  } catch (err) {
    console.error('Profile fetch error:', err);

    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to load profile',
      code: 'unknown_error'
    };
  }
}

/**
 * Update current user profile metadata in Supabase Auth.
 */
export async function updateUserProfile(updates: { name?: string }): Promise<AuthResponse> {
  try {
    const accessToken = safeGetItem('access_token');

    if (!accessToken) {
      return {
        success: false,
        error: 'Not authenticated',
        code: 'no_token'
      };
    }

    const response = await fetch(`${SUPABASE_AUTH_URL}/user`, {
      method: 'PUT',
      headers: authHeaders(accessToken),
      body: JSON.stringify({ data: updates }),
    });

    const result = await readJson<SupabaseUserResult>(response);

    if (!response.ok) {
      return {
        success: false,
        error: result.error || result.msg || 'Failed to update profile',
        code: 'profile_update_failed',
      };
    }

    const user = persistUserProfile(result);

    return toAuthResponse(user, undefined);
  } catch (err) {
    console.error('Profile update error:', err);

    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to update profile',
      code: 'unknown_error',
    };
  }
}

/**
 * Logout current user.
 */
export function logoutUser(): void {
  console.log('Logging out user');

  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user_email');
  localStorage.removeItem('userName');
  localStorage.removeItem('user_id');
  localStorage.removeItem('user_password');
  localStorage.removeItem('oauth_next_path');
  localStorage.removeItem('isAdmin');
  sessionStorage.removeItem('isAdmin');
  void supabase.auth.signOut({ scope: 'local' });

  console.log('User logged out');
}

/**
 * Check if user is authenticated.
 */
export function isAuthenticated(): boolean {
  const accessToken = safeGetItem('access_token');
  return !!accessToken;
}

/**
 * Get current user ID.
 */
export function getCurrentUserId(): string | null {
  return safeGetItem('user_id');
}

/**
 * Get current user email.
 */
export function getCurrentUserEmail(): string | null {
  return safeGetItem('user_email');
}

/**
 * Get current user name.
 */
export function getCurrentUserName(): string | null {
  return safeGetItem('userName');
}

/**
 * Check if current user is admin.
 */
export function isUserAdmin(): boolean {
  return safeGetItem('isAdmin') === 'true' || sessionStorage.getItem('isAdmin') === 'true';
}

/**
 * Set admin status for current user.
 */
export function setAdminStatus(isAdmin: boolean): void {
  if (isAdmin) {
    safeSetItem('isAdmin', 'true');
    sessionStorage.setItem('isAdmin', 'true');
    console.log('Admin permissions granted');
  } else {
    localStorage.removeItem('isAdmin');
    sessionStorage.removeItem('isAdmin');
    console.log('Admin permissions revoked');
  }
}

/**
 * Grant admin access to current user.
 */
export function grantAdminAccess(): void {
  console.warn('Admin access is managed in Supabase user metadata. Set isAdmin=true or role=admin on the user account instead.');
}
