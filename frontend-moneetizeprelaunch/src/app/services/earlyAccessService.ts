import { projectId, publicAnonKey } from '/utils/supabase/info';
import { safeGetItem, safeSetItem } from '../utils/storage';
import { setUserPoints } from '../utils/pointsManager';
import { supabase } from './supabaseClient';

export interface EarlyAccessRequest {
  id: string;
  userId: string;
  userEmail?: string;
  name: string;
  email: string;
  status: 'pending' | 'granted';
  requestedAt: string;
  grantedAt?: string;
  grantedBy?: string;
  pointsAwarded: number;
  emailDelivery?: 'sent' | 'queued' | 'failed';
}

interface EarlyAccessResponse {
  success?: boolean;
  data?: {
    request?: EarlyAccessRequest;
    requests?: EarlyAccessRequest[];
    pointsEarned?: number;
    newTotalPoints?: number;
    emailDelivery?: EarlyAccessRequest['emailDelivery'];
  };
  error?: string;
}

const EARLY_ACCESS_API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-7a79873f`;
const AUTH_ERROR_MESSAGE = 'Please log in again to request early token access.';

function persistSessionTokens(session?: { access_token?: string; refresh_token?: string }) {
  if (!session?.access_token) return;

  safeSetItem('access_token', session.access_token);

  if (session.refresh_token) {
    safeSetItem('refresh_token', session.refresh_token);
  }
}

async function refreshStoredSession(): Promise<string | null> {
  const refreshToken = safeGetItem('refresh_token');

  if (refreshToken) {
    const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });

    if (!error && data.session?.access_token) {
      persistSessionTokens(data.session);
      return data.session.access_token;
    }
  }

  const { data } = await supabase.auth.getSession();

  if (data.session?.access_token) {
    persistSessionTokens(data.session);
    return data.session.access_token;
  }

  return null;
}

async function getAccessToken(forceRefresh = false) {
  if (!forceRefresh) {
    const accessToken = safeGetItem('access_token');
    if (accessToken) return accessToken;
  }

  const refreshedToken = await refreshStoredSession();

  if (!refreshedToken) {
    throw new Error(AUTH_ERROR_MESSAGE);
  }

  return refreshedToken;
}

async function authHeaders(forceRefresh = false) {
  const accessToken = await getAccessToken(forceRefresh);

  return {
    Authorization: `Bearer ${accessToken}`,
    apikey: publicAnonKey,
    'Content-Type': 'application/json',
  };
}

function isAuthFailure(response: Response, error?: string) {
  const normalizedError = `${error || ''}`.toLowerCase();
  return (
    response.status === 401 ||
    normalizedError.includes('unauthorized') ||
    normalizedError.includes('invalid or expired') ||
    normalizedError.includes('authorization header required')
  );
}

async function readJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  return text ? (JSON.parse(text) as T) : ({} as T);
}

async function fetchEarlyAccess(path: string, init: RequestInit = {}) {
  const send = async (forceRefresh = false) => {
    return fetch(`${EARLY_ACCESS_API_URL}${path}`, {
      ...init,
      headers: await authHeaders(forceRefresh),
    });
  };

  let response = await send();
  let result = await readJson<EarlyAccessResponse>(response);

  if (isAuthFailure(response, result.error)) {
    response = await send(true);
    result = await readJson<EarlyAccessResponse>(response);
  }

  return { response, result };
}

export async function submitEarlyAccessRequest(input: { name: string; email: string }) {
  const { response, result } = await fetchEarlyAccess('/early-access/request', {
    method: 'POST',
    body: JSON.stringify(input),
  });

  if (!response.ok || !result.success || !result.data?.request) {
    throw new Error(isAuthFailure(response, result.error) ? AUTH_ERROR_MESSAGE : result.error || 'Failed to submit early access request.');
  }

  if (typeof result.data.newTotalPoints === 'number') {
    setUserPoints(result.data.newTotalPoints);
  }

  return result.data;
}

export async function loadEarlyAccessRequests(): Promise<EarlyAccessRequest[]> {
  const { response, result } = await fetchEarlyAccess('/admin/early-access-requests', {
    method: 'GET',
  });

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Failed to load early access requests.');
  }

  return result.data?.requests || [];
}

export async function grantEarlyAccessRequest(requestId: string): Promise<EarlyAccessRequest> {
  const { response, result } = await fetchEarlyAccess(`/admin/early-access-requests/${requestId}/grant`, {
    method: 'POST',
    body: JSON.stringify({}),
  });

  if (!response.ok || !result.success || !result.data?.request) {
    throw new Error(result.error || 'Failed to grant early access.');
  }

  return result.data.request;
}
