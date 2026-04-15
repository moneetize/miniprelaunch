import { projectId, publicAnonKey } from '/utils/supabase/info';
import {
  getStoredProfileSettings,
  isStoredProfileComplete,
  writeStoredProfileSettings,
  type ProfileSettingsSnapshot,
} from '../utils/profileSettings';
import { safeGetItem } from '../utils/storage';

type ProfileSettingsResponse = {
  success?: boolean;
  data?: {
    settings?: ProfileSettingsSnapshot | null;
  };
  error?: string;
};

const PROFILE_API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-7a79873f/profile`;

function getAccessToken() {
  return safeGetItem('access_token') || '';
}

function authHeaders() {
  const accessToken = getAccessToken();

  return {
    Authorization: `Bearer ${accessToken || publicAnonKey}`,
    apikey: publicAnonKey,
    'Content-Type': 'application/json',
  };
}

async function readJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  return text ? (JSON.parse(text) as T) : ({} as T);
}

function getProfileCompletedAt() {
  try {
    const parsed = JSON.parse(safeGetItem('userProfile') || '{}');
    return typeof parsed?.completedAt === 'string' ? parsed.completedAt : '';
  } catch {
    return '';
  }
}

export function getCurrentProfileSettingsSnapshot(overrides: ProfileSettingsSnapshot = {}): ProfileSettingsSnapshot {
  const stored = getStoredProfileSettings();

  return {
    ...stored,
    profileComplete: isStoredProfileComplete(),
    completedAt: getProfileCompletedAt(),
    ...overrides,
  };
}

export async function loadRemoteProfileSettings(): Promise<ProfileSettingsSnapshot | null> {
  if (!getAccessToken()) return null;

  const response = await fetch(`${PROFILE_API_URL}/settings`, {
    method: 'GET',
    headers: authHeaders(),
  });

  const result = await readJson<ProfileSettingsResponse>(response);

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Failed to load profile settings.');
  }

  return result.data?.settings || null;
}

export async function hydrateRemoteProfileSettings(): Promise<ProfileSettingsSnapshot | null> {
  const settings = await loadRemoteProfileSettings();

  if (settings) {
    writeStoredProfileSettings(settings);
  }

  return settings;
}

export async function saveRemoteProfileSettings(
  overrides: ProfileSettingsSnapshot = {},
): Promise<ProfileSettingsSnapshot | null> {
  if (!getAccessToken()) return null;

  const settings = getCurrentProfileSettingsSnapshot(overrides);
  const response = await fetch(`${PROFILE_API_URL}/settings`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ settings }),
  });

  const result = await readJson<ProfileSettingsResponse>(response);

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Failed to save profile settings.');
  }

  const savedSettings = result.data?.settings || settings;
  writeStoredProfileSettings(savedSettings);

  return savedSettings;
}
