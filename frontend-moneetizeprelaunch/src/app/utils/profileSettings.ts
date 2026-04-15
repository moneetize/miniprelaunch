import { avatarImageMap, getSelectedAvatarImage } from './avatarUtils';
import { safeGetItem, safeSetItem } from './storage';

export const PROFILE_SETTINGS_UPDATED_EVENT = 'moneetize:profile-settings-updated';
export const PROFILE_COMPLETION_STORAGE_KEY = 'moneetizeProfileComplete';
export const PROFILE_PHOTO_OWNER_STORAGE_KEY = 'userPhotoOwnerId';
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
  PROFILE_PHOTO_OWNER_STORAGE_KEY,
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

export type ProfileSettingsSnapshot = Partial<StoredProfileSettings> & {
  profileComplete?: boolean;
  completedAt?: string;
};

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

function getCurrentProfileOwnerId() {
  return safeGetItem('user_id') || safeGetItem('user_email') || '';
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
  const storedPhoto = sessionStorage.getItem('userPhoto') || safeGetItem('userPhoto') || '';
  const photoOwner = safeGetItem(PROFILE_PHOTO_OWNER_STORAGE_KEY) || '';
  const currentOwner = getCurrentProfileOwnerId();
  const uploadedPhoto = storedPhoto && photoOwner && currentOwner && photoOwner === currentOwner ? storedPhoto : '';
  const userProfile = safeParseJson<Record<string, unknown>>(safeGetItem('userProfile'), {});
  const profileInvestment =
    typeof userProfile.investmentProfile === 'string' ? userProfile.investmentProfile : '';

  return {
    name,
    handle: normalizeUserHandle(safeGetItem('userHandle') || options.fallbackHandle, name),
    email: localStorage.getItem('user_email') || options.fallbackEmail || 'user@gmail.com',
    photo: uploadedPhoto ? resolveProfilePhoto(uploadedPhoto, selectedAvatar) : '',
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

export function markProfileIncomplete() {
  try {
    localStorage.removeItem(PROFILE_COMPLETION_STORAGE_KEY);
  } catch (error) {
    console.error('Error resetting profile completion:', error);
  }
}

export function writeStoredProfileSettings(settings: ProfileSettingsSnapshot) {
  if (typeof settings.name === 'string' && settings.name.trim()) {
    safeSetItem('userName', settings.name.trim());
  }

  if (typeof settings.handle === 'string' && settings.handle.trim()) {
    const name = settings.name || safeGetItem('userName') || 'Moneetize User';
    safeSetItem('userHandle', normalizeUserHandle(settings.handle, name));
  }

  if (typeof settings.email === 'string' && settings.email.trim()) {
    safeSetItem('user_email', settings.email.trim().toLowerCase());
  }

  if (typeof settings.selectedAvatar === 'string' && settings.selectedAvatar.trim()) {
    safeSetItem('selectedAvatar', settings.selectedAvatar.trim());
  }

  if (Array.isArray(settings.interests)) {
    safeSetItem('selectedInterests', JSON.stringify(settings.interests));
  }

  if (typeof settings.investmentProfile === 'string') {
    safeSetItem('investmentProfile', settings.investmentProfile);
  }

  if (Array.isArray(settings.tags)) {
    safeSetItem('profileTags', JSON.stringify(settings.tags));
  }

  if (typeof settings.agentName === 'string' && settings.agentName.trim()) {
    safeSetItem('agentName', settings.agentName.trim());
  }

  if (typeof settings.photo === 'string') {
    if (settings.photo.trim()) {
      saveProfilePhoto(settings.photo.trim());
    } else {
      clearProfilePhoto();
    }
  }

  const profile = safeParseJson<Record<string, unknown>>(safeGetItem('userProfile'), {});
  const nextProfile = {
    ...profile,
    ...(typeof settings.investmentProfile === 'string' ? { investmentProfile: settings.investmentProfile } : {}),
    ...(settings.completedAt ? { completedAt: settings.completedAt } : {}),
  };

  if (Object.keys(nextProfile).length) {
    safeSetItem('userProfile', JSON.stringify(nextProfile));
  }

  if (settings.profileComplete === true) {
    safeSetItem(PROFILE_COMPLETION_STORAGE_KEY, 'true');
  } else if (settings.profileComplete === false) {
    markProfileIncomplete();
  }
}

export function saveProfilePhoto(photo: string) {
  const ownerId = getCurrentProfileOwnerId();
  safeSetItem('userPhoto', photo);
  if (ownerId) {
    safeSetItem(PROFILE_PHOTO_OWNER_STORAGE_KEY, ownerId);
  }

  try {
    sessionStorage.setItem('userPhoto', photo);
  } catch {
    // localStorage copy is the durable source.
  }
}

export function clearProfilePhoto() {
  try {
    localStorage.removeItem('userPhoto');
    localStorage.removeItem(PROFILE_PHOTO_OWNER_STORAGE_KEY);
    sessionStorage.removeItem('userPhoto');
  } catch (error) {
    console.error('Error clearing profile photo:', error);
  }
}

export function notifyProfileSettingsUpdated() {
  window.dispatchEvent(
    new CustomEvent<StoredProfileSettings>(PROFILE_SETTINGS_UPDATED_EVENT, {
      detail: getStoredProfileSettings(),
    }),
  );
}
