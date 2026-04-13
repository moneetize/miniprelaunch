/**
 * Legacy admin helper utilities.
 *
 * Admin access is now controlled by Supabase user metadata. These helpers are
 * kept as harmless console shims in case an older bundle imports them.
 */

export function grantCurrentUserAdminAccess(): void {
  console.warn('Admin access is managed in Supabase. Set user_metadata.isAdmin=true or user_metadata.role=admin.');
}

export function revokeAdminAccess(): void {
  localStorage.removeItem('isAdmin');
  sessionStorage.removeItem('isAdmin');
  console.log('Local admin UI flag cleared. Supabase metadata is unchanged.');
}

export function checkAdminStatus(): void {
  const isAdminLocal = localStorage.getItem('isAdmin') === 'true';
  const isAdminSession = sessionStorage.getItem('isAdmin') === 'true';
  const userEmail = localStorage.getItem('user_email');

  console.log('Current User:', userEmail || 'Not logged in');
  console.log('Admin UI Flag:', isAdminLocal || isAdminSession ? 'Yes' : 'No');
  console.log('Source of truth: Supabase user metadata.');
}

if (typeof window !== 'undefined') {
  (window as any).grantAdminAccess = grantCurrentUserAdminAccess;
  (window as any).revokeAdminAccess = revokeAdminAccess;
  (window as any).checkAdminStatus = checkAdminStatus;
}
