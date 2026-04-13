import { createClient, type Provider } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '/utils/supabase/info';

export type SocialAuthProvider = Extract<Provider, 'apple' | 'facebook' | 'google'>;

export const supabaseUrl = `https://${projectId}.supabase.co`;

export const supabase = createClient(supabaseUrl, publicAnonKey, {
  auth: {
    autoRefreshToken: true,
    detectSessionInUrl: true,
    persistSession: true,
  },
});

export function getOAuthRedirectTo() {
  return `${window.location.origin}/auth/callback`;
}
