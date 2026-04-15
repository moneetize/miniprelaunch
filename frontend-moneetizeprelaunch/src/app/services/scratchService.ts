import { projectId, publicAnonKey } from '/utils/supabase/info';
import { safeGetItem, safeSetItem } from '../utils/storage';
import { setUserPoints } from '../utils/pointsManager';
import { supabase } from './supabaseClient';

export interface ScratchTicket {
  id: string;
  title: string;
  displayName: string;
  theme: string;
  isGolden: boolean;
  borderColor: string;
  glowColor: string;
  cardGradient: string;
  scratchGradient: string;
  scratchBaseColor: string;
  particleColors: string[];
  countdown?: {
    hours: number;
    minutes: number;
    seconds: number;
  };
}

export interface ScratchReward {
  moneetizePoints: number;
  participationLevel?: number;
  participationScore?: number;
  participationBoost?: string;
  participationImpact?: string;
  goldenEligibility?: boolean;
  goldenWindow?: ScratchGoldenWindow | null;
  triptoPoints: number;
  usdt: number;
  wildCard: {
    name: string;
    description: string;
  };
  expiresIn: number;
  items?: ScratchRewardItem[];
}

export interface ScratchGoldenWindow {
  active: boolean;
  eyebrow?: string;
  title: string;
  subtext: string;
  topRewards: string[];
  remaining: {
    hours?: number;
    minutes: number;
    seconds: number;
  };
  cta: string;
}

export interface ScratchRewardItem {
  id: string;
  type: 'points' | 'usdt' | 'tripto' | 'wildcard' | 'merch';
  label: string;
  description?: string;
  amount?: number;
  unit?: string;
  icon: 'gem' | 'wildcard' | 'usdt' | 'tripto' | 'shirt';
}

export interface ScratchBalances {
  points: number;
  usdt: number;
}

export interface ScratchDrawResult {
  id: string;
  userId: string;
  ticket: ScratchTicket;
  reward: ScratchReward;
  balances: ScratchBalances;
  createdAt: string;
  expiresAt: string;
}

type ScratchDrawResponse = {
  success?: boolean;
  data?: ScratchDrawResult;
  error?: string;
};

type ScratchProfileResponse = {
  success?: boolean;
  data?: {
    balances?: ScratchBalances;
    history?: ScratchDrawResult[];
  };
  error?: string;
};

const SCRATCH_API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-7a79873f/scratch`;
const USER_USDT_BALANCE_KEY = 'userUsdtBalance';
const SCRATCH_HISTORY_KEY = 'scratchHistory';
const LAST_SCRATCH_REWARD_KEY = 'lastScratchReward';
const AUTH_ERROR_MESSAGE = 'Please log in again to play Scratch and Win.';

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
    Authorization: `Bearer ${publicAnonKey}`,
    apikey: publicAnonKey,
    'Content-Type': 'application/json',
    'x-user-token': accessToken,
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

function normalizeScratchError(response: Response, error?: string) {
  if (isAuthFailure(response, error)) return AUTH_ERROR_MESSAGE;
  return error || 'Failed to load scratch data.';
}

async function readJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  return text ? (JSON.parse(text) as T) : ({} as T);
}

async function fetchScratch<T>(path: string, init: RequestInit = {}) {
  const send = async (forceRefresh = false) => {
    return fetch(`${SCRATCH_API_URL}${path}`, {
      ...init,
      headers: await authHeaders(forceRefresh),
    });
  };

  let response = await send();
  let result = await readJson<T & { error?: string }>(response);

  if (isAuthFailure(response, result.error)) {
    response = await send(true);
    result = await readJson<T & { error?: string }>(response);
  }

  return { response, result };
}

function persistBalances(balances?: ScratchBalances) {
  if (!balances) return;

  setUserPoints(balances.points);
  safeSetItem(USER_USDT_BALANCE_KEY, balances.usdt.toFixed(2));
}

function getStoredScratchHistory(): ScratchDrawResult[] {
  try {
    const history = safeGetItem(SCRATCH_HISTORY_KEY);
    const parsed = history ? JSON.parse(history) : [];
    if (Array.isArray(parsed) && parsed.length) return parsed;
  } catch {
    // Fall back to the last reward below for sessions created before history existed.
  }

  try {
    const lastReward = safeGetItem(LAST_SCRATCH_REWARD_KEY);
    const parsedLastReward = lastReward ? JSON.parse(lastReward) : null;
    return parsedLastReward?.id ? [parsedLastReward] : [];
  } catch {
    return [];
  }
}

function mergeScratchHistory(...sources: ScratchDrawResult[][]) {
  const merged = new Map<string, ScratchDrawResult>();

  sources.flat().forEach((draw) => {
    if (!draw?.id || merged.has(draw.id)) return;
    merged.set(draw.id, draw);
  });

  return [...merged.values()].sort((first, second) => {
    const firstTime = new Date(first.createdAt).getTime() || 0;
    const secondTime = new Date(second.createdAt).getTime() || 0;
    return secondTime - firstTime;
  });
}

function persistScratchDraw(draw: ScratchDrawResult) {
  persistBalances(draw.balances);
  safeSetItem(LAST_SCRATCH_REWARD_KEY, JSON.stringify(draw));

  const history = getStoredScratchHistory();
  const nextHistory = [draw, ...history.filter(item => item.id !== draw.id)].slice(0, 50);
  safeSetItem(SCRATCH_HISTORY_KEY, JSON.stringify(nextHistory));
}

export function getStoredUsdtBalance(): number {
  const storedBalance = Number(safeGetItem(USER_USDT_BALANCE_KEY) || '0');
  return Number.isFinite(storedBalance) ? storedBalance : 0;
}

export async function drawScratchTicket(): Promise<ScratchDrawResult> {
  const { response, result } = await fetchScratch<ScratchDrawResponse>('/draw', {
    method: 'POST',
    body: JSON.stringify({}),
  });

  if (!response.ok || !result.success || !result.data) {
    throw new Error(normalizeScratchError(response, result.error || 'Failed to draw scratch reward.'));
  }

  persistScratchDraw(result.data);
  return result.data;
}

export async function loadScratchProfile(): Promise<ScratchProfileResponse['data']> {
  const { response, result } = await fetchScratch<ScratchProfileResponse>('/profile', {
    method: 'GET',
  });

  if (!response.ok || !result.success) {
    throw new Error(normalizeScratchError(response, result.error || 'Failed to load scratch profile.'));
  }

  persistBalances(result.data?.balances);

  if (result.data?.history) {
    const mergedHistory = mergeScratchHistory(result.data.history, getStoredScratchHistory());
    result.data.history = mergedHistory;
    safeSetItem(SCRATCH_HISTORY_KEY, JSON.stringify(mergedHistory));
  }

  return result.data;
}
