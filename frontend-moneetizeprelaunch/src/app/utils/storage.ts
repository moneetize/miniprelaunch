/**
 * Safely set an item in localStorage with error handling
 */
export function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    if (error instanceof DOMException && (
      error.name === 'QuotaExceededError' ||
      error.name === 'NS_ERROR_DOM_QUOTA_REACHED'
    )) {
      console.warn(`localStorage quota exceeded for key: ${key}`);
      // Try to clear some space
      clearOldData();
      // Try one more time
      try {
        localStorage.setItem(key, value);
        return true;
      } catch {
        return false;
      }
    }
    console.error('Error setting localStorage:', error);
    return false;
  }
}

/**
 * Safely get an item from localStorage
 */
export function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.error('Error getting localStorage:', error);
    return null;
  }
}

/**
 * Clear old/unnecessary data from localStorage
 */
function clearOldData() {
  try {
    // Remove the large photo if it exists
    localStorage.removeItem('userPhoto');
  } catch (error) {
    console.error('Error clearing old data:', error);
  }
}
