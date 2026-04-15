import { safeGetItem, safeSetItem } from './storage';
import { projectId, publicAnonKey } from '/utils/supabase/info';

/**
 * Points Manager - Handles user points with localStorage fallback and Supabase sync.
 */

let supabaseConnected = false;

const USER_POINTS_KEY = 'userPoints';
const POINTS_HISTORY_KEY = 'pointsHistory';
const SCRATCH_HISTORY_KEY = 'scratchHistory';
const LAST_SCRATCH_REWARD_KEY = 'lastScratchReward';
const POINTS_API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-7a79873f/points`;

export const POINTS_UPDATED_EVENT = 'moneetize-points-updated';

export interface PointsTransaction {
  type: 'add' | 'subtract';
  amount: number;
  source: string;
  timestamp: number;
  oldBalance: number;
  newBalance: number;
}

interface StoredScratchDraw {
  id?: string;
  reward?: {
    moneetizePoints?: number;
  };
}

function parsePointValue(value: string | null): number | null {
  if (value === null || value === '') return null;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : null;
}

function readScratchDraws(): StoredScratchDraw[] {
  const draws = new Map<string, StoredScratchDraw>();

  try {
    const history = safeGetItem(SCRATCH_HISTORY_KEY);
    const parsedHistory = history ? JSON.parse(history) : [];
    if (Array.isArray(parsedHistory)) {
      parsedHistory.forEach((draw) => {
        if (draw?.id) draws.set(draw.id, draw);
      });
    }
  } catch {
    // Ignore malformed local scratch history.
  }

  try {
    const latestReward = safeGetItem(LAST_SCRATCH_REWARD_KEY);
    const parsedLatestReward = latestReward ? JSON.parse(latestReward) : null;
    if (parsedLatestReward?.id) draws.set(parsedLatestReward.id, parsedLatestReward);
  } catch {
    // Ignore malformed legacy reward data.
  }

  return [...draws.values()];
}

function getScratchPointsEarned() {
  return readScratchDraws().reduce((total, draw) => (
    total + (Number(draw?.reward?.moneetizePoints) || 0)
  ), 0);
}

function getLedgerDeltaExcludingScratchAdds() {
  return getPointsHistory().reduce((total, transaction) => {
    const amount = Number(transaction.amount) || 0;
    if (transaction.type === 'add' && transaction.source === 'scratch-ticket') return total;
    return transaction.type === 'add' ? total + amount : total - amount;
  }, 0);
}

function getEarnedPointsFloor() {
  return Math.max(0, Math.round(getScratchPointsEarned() + getLedgerDeltaExcludingScratchAdds()));
}

function emitPointsUpdate() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(POINTS_UPDATED_EVENT, { detail: { points: getUserPoints() } }));
}

/**
 * Initialize points for a new user.
 */
export function initializeUserPoints(initialPoints: number = 10): void {
  const existingPoints = safeGetItem(USER_POINTS_KEY);
  if (!existingPoints) {
    safeSetItem(USER_POINTS_KEY, Math.max(0, Math.round(initialPoints)).toString());
    emitPointsUpdate();
  }
}

/**
 * Get current user points.
 *
 * The stored balance is treated as the live wallet, but we also keep a floor
 * from known scratch wins plus point transactions so a backend default cannot
 * overwrite earned pre-registration points.
 */
export function getUserPoints(): number {
  const storedPoints = parsePointValue(safeGetItem(USER_POINTS_KEY));
  return Math.max(storedPoints ?? 0, getEarnedPointsFloor());
}

/**
 * Add points to user account (from scratch ticket, check-in, invites, etc.).
 */
export async function addUserPoints(
  pointsToAdd: number,
  source: string = 'other'
): Promise<{ success: boolean; newTotal: number }> {
  try {
    const currentPoints = getUserPoints();
    const points = Math.max(0, Math.round(pointsToAdd));
    const newTotal = currentPoints + points;

    safeSetItem(USER_POINTS_KEY, newTotal.toString());

    logPointsTransaction({
      type: 'add',
      amount: points,
      source,
      timestamp: Date.now(),
      oldBalance: currentPoints,
      newBalance: newTotal,
    });
    emitPointsUpdate();

    if (supabaseConnected || safeGetItem('access_token')) {
      await syncPointsToSupabase(newTotal, points, source);
    }

    console.log(`Added ${points} points from ${source}. New total: ${newTotal}`);

    return { success: true, newTotal };
  } catch (error) {
    console.error('Error adding points:', error);
    return { success: false, newTotal: getUserPoints() };
  }
}

/**
 * Subtract points from user account (for purchases, etc.).
 */
export async function subtractUserPoints(
  pointsToSubtract: number,
  reason: string = 'purchase'
): Promise<{ success: boolean; newTotal: number }> {
  try {
    const currentPoints = getUserPoints();
    const points = Math.max(0, Math.round(pointsToSubtract));

    if (currentPoints < points) {
      console.warn('Insufficient points');
      return { success: false, newTotal: currentPoints };
    }

    const newTotal = currentPoints - points;

    safeSetItem(USER_POINTS_KEY, newTotal.toString());

    logPointsTransaction({
      type: 'subtract',
      amount: points,
      source: reason,
      timestamp: Date.now(),
      oldBalance: currentPoints,
      newBalance: newTotal,
    });
    emitPointsUpdate();

    if (supabaseConnected) {
      await syncPointsToSupabase(newTotal, -points, reason);
    }

    console.log(`Subtracted ${points} points for ${reason}. New total: ${newTotal}`);

    return { success: true, newTotal };
  } catch (error) {
    console.error('Error subtracting points:', error);
    return { success: false, newTotal: getUserPoints() };
  }
}

/**
 * Set points directly (admin function or initial setup).
 */
export function setUserPoints(points: number): void {
  safeSetItem(USER_POINTS_KEY, Math.max(0, Math.round(points)).toString());
  emitPointsUpdate();
  console.log(`Set user points to ${points}`);
}

/**
 * Log points transaction to localStorage for history tracking.
 */
function logPointsTransaction(transaction: PointsTransaction): void {
  try {
    const historyJson = safeGetItem(POINTS_HISTORY_KEY);
    const history: PointsTransaction[] = historyJson ? JSON.parse(historyJson) : [];

    history.push(transaction);

    if (history.length > 100) {
      history.shift();
    }

    safeSetItem(POINTS_HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Error logging points transaction:', error);
  }
}

/**
 * Get points transaction history.
 */
export function getPointsHistory(): PointsTransaction[] {
  try {
    const historyJson = safeGetItem(POINTS_HISTORY_KEY);
    const history = historyJson ? JSON.parse(historyJson) : [];
    return Array.isArray(history) ? history : [];
  } catch (error) {
    console.error('Error getting points history:', error);
    return [];
  }
}

/**
 * Sync points to Supabase database.
 * This is a mock implementation - will connect to real Supabase when configured.
 */
async function syncPointsToSupabase(
  newTotal: number,
  pointsChanged: number,
  source: string
): Promise<void> {
  const accessToken = safeGetItem('access_token');
  if (!accessToken || pointsChanged <= 0) return;

  try {
    const response = await fetch(`${POINTS_API_URL}/adjust`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey: publicAnonKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: pointsChanged,
        source,
        expectedLocalTotal: newTotal,
      }),
    });

    const text = await response.text();
    const result = text ? JSON.parse(text) : {};

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Remote points sync failed.');
    }

    const remotePoints = Number(result.data?.points);
    if (Number.isFinite(remotePoints) && remotePoints > newTotal) {
      safeSetItem(USER_POINTS_KEY, Math.round(remotePoints).toString());
      emitPointsUpdate();
    }

    console.log(`Synced ${newTotal} points to Supabase database (${source}, delta ${pointsChanged})`);
  } catch (error) {
    console.error('Error syncing to Supabase:', error);
  }
}

/**
 * Enable Supabase connection.
 */
export function enableSupabaseSync(): void {
  supabaseConnected = true;
  console.log('Supabase sync enabled');
}

/**
 * Disable Supabase connection.
 */
export function disableSupabaseSync(): void {
  supabaseConnected = false;
  console.log('Supabase sync disabled');
}

/**
 * Check if Supabase is connected.
 */
export function isSupabaseConnected(): boolean {
  return supabaseConnected;
}
