import { safeGetItem, safeSetItem } from './storage';

/**
 * Points Manager - Handles user points with localStorage fallback and Supabase sync
 */

// Mock Supabase client state
let supabaseConnected = false;

/**
 * Initialize points for a new user
 */
export function initializeUserPoints(initialPoints: number = 10): void {
  const existingPoints = safeGetItem('userPoints');
  if (!existingPoints) {
    safeSetItem('userPoints', initialPoints.toString());
  }
}

/**
 * Get current user points
 */
export function getUserPoints(): number {
  const points = safeGetItem('userPoints');
  return points ? parseInt(points, 10) : 10;
}

/**
 * Add points to user account (from scratch ticket, check-in, etc.)
 */
export async function addUserPoints(
  pointsToAdd: number,
  source: 'scratch-ticket' | 'check-in' | 'quiz' | 'referral' | 'other' = 'other'
): Promise<{ success: boolean; newTotal: number }> {
  try {
    const currentPoints = getUserPoints();
    const newTotal = currentPoints + pointsToAdd;
    
    // Update localStorage
    safeSetItem('userPoints', newTotal.toString());
    
    // Log the transaction
    logPointsTransaction({
      type: 'add',
      amount: pointsToAdd,
      source,
      timestamp: Date.now(),
      oldBalance: currentPoints,
      newBalance: newTotal,
    });
    
    // Sync with Supabase if connected
    if (supabaseConnected) {
      await syncPointsToSupabase(newTotal, pointsToAdd, source);
    }
    
    console.log(`✅ Added ${pointsToAdd} points from ${source}. New total: ${newTotal}`);
    
    return { success: true, newTotal };
  } catch (error) {
    console.error('Error adding points:', error);
    return { success: false, newTotal: getUserPoints() };
  }
}

/**
 * Subtract points from user account (for purchases, etc.)
 */
export async function subtractUserPoints(
  pointsToSubtract: number,
  reason: string = 'purchase'
): Promise<{ success: boolean; newTotal: number }> {
  try {
    const currentPoints = getUserPoints();
    
    if (currentPoints < pointsToSubtract) {
      console.warn('Insufficient points');
      return { success: false, newTotal: currentPoints };
    }
    
    const newTotal = currentPoints - pointsToSubtract;
    
    // Update localStorage
    safeSetItem('userPoints', newTotal.toString());
    
    // Log the transaction
    logPointsTransaction({
      type: 'subtract',
      amount: pointsToSubtract,
      source: reason,
      timestamp: Date.now(),
      oldBalance: currentPoints,
      newBalance: newTotal,
    });
    
    // Sync with Supabase if connected
    if (supabaseConnected) {
      await syncPointsToSupabase(newTotal, -pointsToSubtract, reason);
    }
    
    console.log(`✅ Subtracted ${pointsToSubtract} points for ${reason}. New total: ${newTotal}`);
    
    return { success: true, newTotal };
  } catch (error) {
    console.error('Error subtracting points:', error);
    return { success: false, newTotal: getUserPoints() };
  }
}

/**
 * Set points directly (admin function or initial setup)
 */
export function setUserPoints(points: number): void {
  safeSetItem('userPoints', points.toString());
  console.log(`✅ Set user points to ${points}`);
}

interface PointsTransaction {
  type: 'add' | 'subtract';
  amount: number;
  source: string;
  timestamp: number;
  oldBalance: number;
  newBalance: number;
}

/**
 * Log points transaction to localStorage for history tracking
 */
function logPointsTransaction(transaction: PointsTransaction): void {
  try {
    const historyJson = safeGetItem('pointsHistory');
    const history: PointsTransaction[] = historyJson ? JSON.parse(historyJson) : [];
    
    history.push(transaction);
    
    // Keep only last 100 transactions
    if (history.length > 100) {
      history.shift();
    }
    
    safeSetItem('pointsHistory', JSON.stringify(history));
  } catch (error) {
    console.error('Error logging points transaction:', error);
  }
}

/**
 * Get points transaction history
 */
export function getPointsHistory(): PointsTransaction[] {
  try {
    const historyJson = safeGetItem('pointsHistory');
    return historyJson ? JSON.parse(historyJson) : [];
  } catch (error) {
    console.error('Error getting points history:', error);
    return [];
  }
}

/**
 * Sync points to Supabase database
 * This is a mock implementation - will connect to real Supabase when configured
 */
async function syncPointsToSupabase(
  newTotal: number,
  pointsChanged: number,
  source: string
): Promise<void> {
  try {
    // Mock Supabase update
    // In real implementation, this would use Supabase client:
    // const { data, error } = await supabase
    //   .from('users')
    //   .update({ points: newTotal })
    //   .eq('id', userId);
    
    // Also log transaction to Supabase:
    // await supabase.from('points_transactions').insert({
    //   user_id: userId,
    //   amount: pointsChanged,
    //   source,
    //   created_at: new Date().toISOString()
    // });
    
    console.log(`📊 [Mock] Synced ${newTotal} points to Supabase database (${source})`);
  } catch (error) {
    console.error('Error syncing to Supabase:', error);
  }
}

/**
 * Enable Supabase connection
 */
export function enableSupabaseSync(): void {
  supabaseConnected = true;
  console.log('✅ Supabase sync enabled');
}

/**
 * Disable Supabase connection
 */
export function disableSupabaseSync(): void {
  supabaseConnected = false;
  console.log('❌ Supabase sync disabled');
}

/**
 * Check if Supabase is connected
 */
export function isSupabaseConnected(): boolean {
  return supabaseConnected;
}
