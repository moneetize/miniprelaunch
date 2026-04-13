import { avatarImageMap, getSelectedAvatarImage } from './avatarUtils';
import { safeGetItem, safeSetItem } from './storage';

export const PROFILE_SETTINGS_UPDATED_EVENT = 'moneetize:profile-settings-updated';
export const PROFILE_COMPLETION_STORAGE_KEY = 'moneetizeProfileComplete';
export const PROFILE_SETTINGS_STORAGE_KEYS = [
  'selectedInterests',
  'userProfile',
  'investmentProfile',
  'userName',
  'userHandle',
  'userPhoto',
  'selectedAvatar',
  'profileTags',
  'agentName',
  'user_email',
  PROFILE_COMPLETION_STORAGE_KEY,
];

export interface StoredProfileSettings {
  name: string;
  handle: string;
  email: string;
  photo: string;
  selectedAvatar: string;
  interests: string[];
  investmentProfile: string;
  tags: string[];
  agentName: string;
}

interface StoredProfileSettingsOptions {
  fallbackName?: string;
  fallbackHandle?: string;
  fallbackEmail?: string;
}

const DEFAULT_PROFILE_TAGS = ['Football', 'Designer', 'Dogs', 'Tech'];

function safeParseJson<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function parseStringArray(value: string | null, fallback: string[] = []) {
  const parsed = safeParseJson<unknown>(value, fallback);
  return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : fallback;
}

function looksLikeImageSource(value: string) {
  return /^(https?:|data:|blob:|\/|figma:asset\/)/.test(value);
}

export function formatUserHandle(name: string) {
  const cleanedName = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
  return cleanedName ? `@${cleanedName}` : '@healthyhabits';
}

export function normalizeUserHandle(handle: string | null | undefined, name: string) {
  const cleanedHandle = handle?.trim();
  if (!cleanedHandle) return formatUserHandle(name);

  return cleanedHandle.startsWith('@') ? cleanedHandle : `@${cleanedHandle}`;
}

export function resolveProfilePhoto(photo: string | null | undefined, selectedAvatar: string) {
  const cleanedPhoto = photo?.trim() || '';
  if (cleanedPhoto && avatarImageMap[cleanedPhoto]) return avatarImageMap[cleanedPhoto];
  if (cleanedPhoto && looksLikeImageSource(cleanedPhoto)) return cleanedPhoto;
  if (selectedAvatar && avatarImageMap[selectedAvatar]) return avatarImageMap[selectedAvatar];
  if (selectedAvatar && looksLikeImageSource(selectedAvatar)) return selectedAvatar;

  return getSelectedAvatarImage();
}

export function getStoredProfileSettings(options: StoredProfileSettingsOptions = {}): StoredProfileSettings {
  const name = safeGetItem('userName') || options.fallbackName || 'Jess Wu';
  const selectedAvatar = safeGetItem('selectedAvatar') || 'blueAvatar';
  const uploadedPhoto = sessionStorage.getItem('userPhoto') || safeGetItem('userPhoto') || '';
  const userProfile = safeParseJson<Record<string, unknown>>(safeGetItem('userProfile'), {});
  const profileInvestment =
    typeof userProfile.investmentProfile === 'string' ? userProfile.investmentProfile : '';

  return {
    name,
    handle: normalizeUserHandle(safeGetItem('userHandle') || options.fallbackHandle, name),
    email: localStorage.getItem('user_email') || options.fallbackEmail || 'user@gmail.com',
    photo: resolveProfilePhoto(uploadedPhoto, selectedAvatar),
    selectedAvatar,
    interests: parseStringArray(safeGetItem('selectedInterests')),
    investmentProfile: profileInvestment || safeGetItem('investmentProfile') || '',
    tags: parseStringArray(safeGetItem('profileTags'), DEFAULT_PROFILE_TAGS),
    agentName: safeGetItem('agentName') || 'My AI Agent',
  };
}

export function isStoredProfileComplete() {
  return safeGetItem(PROFILE_COMPLETION_STORAGE_KEY) === 'true';
}

export function markProfileCompleted() {
  safeSetItem(PROFILE_COMPLETION_STORAGE_KEY, 'true');

  const profile = safeParseJson<Record<string, unknown>>(safeGetItem('userProfile'), {});
  safeSetItem('userProfile', JSON.stringify({
    ...profile,
    completedAt: typeof profile.completedAt === 'string' ? profile.completedAt : new Date().toISOString(),
  }));
}

export function notifyProfileSettingsUpdated() {
  window.dispatchEvent(
    new CustomEvent<StoredProfileSettings>(PROFILE_SETTINGS_UPDATED_EVENT, {
      detail: getStoredProfileSettings(),
    }),
  );
}
