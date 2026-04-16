import { projectId, publicAnonKey } from '/utils/supabase/info';
import { getUserPoints, setUserPoints } from '../utils/pointsManager';
import { safeGetItem, safeSetItem } from '../utils/storage';

export interface RecommendedFriendProfile {
  id: string;
  name: string;
  handle: string;
  bio: string;
  avatar: string;
  interests: string[];
  followers: number;
  following: number;
  points: number;
  followsMe?: boolean;
}

type RecommendedFriendsResponse = {
  success?: boolean;
  data?: {
    profiles?: RecommendedFriendProfile[];
    total?: number;
  };
  error?: string;
};

type NetworkFollowStatesResponse = {
  success?: boolean;
  data?: {
    states?: Record<string, boolean>;
    pointsAward?: {
      pointsAwarded?: number;
      newTotalPoints?: number | null;
    } | null;
  };
  error?: string;
};

const NETWORK_API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-7a79873f/network`;
const LOCAL_NETWORK_PROFILES_KEY = 'moneetizeRegisteredProfiles';
export const LOCAL_NETWORK_PROFILES_UPDATED_EVENT = 'moneetize-local-network-profiles-updated';

const defaultRecommendedFriends: RecommendedFriendProfile[] = [
  {
    id: 'network-amari-cole',
    name: 'Amari Cole',
    handle: '@amaricole',
    bio: 'Marketplace builder focused on creators, wellness drops, and community rewards.',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
    interests: ['Creator Economy', 'Wellness', 'Cash Rewards'],
    followers: 214,
    following: 96,
    points: 1280,
  },
  {
    id: 'network-maya-stone',
    name: 'Maya Stone',
    handle: '@mayastone',
    bio: 'Beauty and lifestyle curator helping friends discover products before they trend.',
    avatar: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=256&q=80',
    interests: ['Beauty', 'Lifestyle', 'Social Commerce'],
    followers: 348,
    following: 121,
    points: 1425,
  },
  {
    id: 'network-luca-reed',
    name: 'Luca Reed',
    handle: '@lucareed',
    bio: 'Tech shopper, points collector, and early adopter of reward-driven launches.',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=256&q=80',
    interests: ['Tech', 'Gaming', 'Rewards'],
    followers: 189,
    following: 144,
    points: 1120,
  },
  {
    id: 'network-sofia-vale',
    name: 'Sofia Vale',
    handle: '@sofiavale',
    bio: 'Fashion, home, and gifting scout building launch teams around shared taste.',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=256&q=80',
    interests: ['Fashion', 'Home', 'Gifting'],
    followers: 421,
    following: 172,
    points: 1565,
  },
  {
    id: 'network-nia-brooks',
    name: 'Nia Brooks',
    handle: '@niabrooks',
    bio: 'Fitness shopper and team captain stacking launch rewards with friends.',
    avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=256&q=80',
    interests: ['Fitness', 'Health', 'Team Rewards'],
    followers: 276,
    following: 118,
    points: 1335,
  },
];

function authHeaders() {
  const accessToken = safeGetItem('access_token');

  return {
    Authorization: `Bearer ${publicAnonKey}`,
    apikey: publicAnonKey,
    'Content-Type': 'application/json',
    ...(accessToken ? { 'x-user-token': accessToken } : {}),
  };
}

async function readJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  return text ? (JSON.parse(text) as T) : ({} as T);
}

export function getDefaultRecommendedFriends(): RecommendedFriendProfile[] {
  return defaultRecommendedFriends;
}

function parseProfileList(value: string | null) {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed as RecommendedFriendProfile[] : [];
  } catch {
    return [];
  }
}

function formatHandle(name: string) {
  const cleaned = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
  return cleaned ? `@${cleaned}` : '@moneetize';
}

function normalizeNetworkProfile(profile: Partial<RecommendedFriendProfile> & { id?: string; email?: string }, index: number): RecommendedFriendProfile | null {
  const id = profile.id || profile.email || '';
  const emailName = profile.email?.split('@')[0]?.replace(/[._-]+/g, ' ').trim() || '';
  const name = profile.name || emailName || 'Moneetize Member';

  if (!id) return null;

  return {
    id,
    name,
    handle: profile.handle || formatHandle(name),
    bio: profile.bio || 'Moneetize prelaunch member',
    avatar: profile.avatar || '',
    interests: Array.isArray(profile.interests) ? profile.interests : [],
    followers: Number.isFinite(Number(profile.followers)) ? Number(profile.followers) : 0,
    following: Number.isFinite(Number(profile.following)) ? Number(profile.following) : 0,
    points: Number.isFinite(Number(profile.points)) ? Number(profile.points) : Math.max(0, 10 + (index * 5)),
  };
}

function mergeProfiles(...profileGroups: RecommendedFriendProfile[][]) {
  const merged = new Map<string, RecommendedFriendProfile>();

  profileGroups.flat().forEach((profile, index) => {
    const normalized = normalizeNetworkProfile(profile, index);
    if (normalized) merged.set(normalized.id, normalized);
  });

  return [...merged.values()];
}

export function loadLocalNetworkProfiles() {
  return parseProfileList(safeGetItem(LOCAL_NETWORK_PROFILES_KEY))
    .map((profile, index) => normalizeNetworkProfile(profile, index))
    .filter((profile): profile is RecommendedFriendProfile => Boolean(profile));
}

export function saveLocalNetworkProfile(profile: Partial<RecommendedFriendProfile> & { id: string; email?: string }) {
  const existingProfiles = loadLocalNetworkProfiles();
  const normalizedProfile = normalizeNetworkProfile(profile, existingProfiles.length);

  if (!normalizedProfile) return existingProfiles;

  const nextProfiles = [
    normalizedProfile,
    ...existingProfiles.filter((entry) => entry.id !== normalizedProfile.id),
  ].slice(0, 100);

  safeSetItem(LOCAL_NETWORK_PROFILES_KEY, JSON.stringify(nextProfiles));

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(LOCAL_NETWORK_PROFILES_UPDATED_EVENT));
  }

  return nextProfiles;
}

export function syncCurrentUserNetworkProfile() {
  const id = safeGetItem('user_id') || safeGetItem('user_email') || '';
  if (!id) return loadLocalNetworkProfiles();

  const name = safeGetItem('userName') || safeGetItem('user_email')?.split('@')[0] || 'Moneetize Member';
  const avatar = sessionStorage.getItem('userPhoto') || safeGetItem('userPhoto') || '';
  const interests = (() => {
    try {
      const parsed = JSON.parse(safeGetItem('selectedInterests') || '[]');
      return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
    } catch {
      return [];
    }
  })();

  return saveLocalNetworkProfile({
    id,
    name,
    handle: safeGetItem('userHandle') || formatHandle(name),
    avatar,
    interests,
    followers: 0,
    following: 0,
    points: getUserPoints(),
  });
}

export async function loadRecommendedFriends(): Promise<RecommendedFriendProfile[]> {
  const currentUserId = safeGetItem('user_id') || '';
  const localProfiles = loadLocalNetworkProfiles().filter((profile) => profile.id !== currentUserId);
  const currentUserQuery = currentUserId ? `?current_user_id=${encodeURIComponent(currentUserId)}` : '';

  try {
    const response = await fetch(`${NETWORK_API_URL}/profiles${currentUserQuery}`, {
      method: 'GET',
      headers: authHeaders(),
    });

    const result = await readJson<RecommendedFriendsResponse>(response);

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Failed to load network profiles.');
    }

    const databaseProfiles = (result.data?.profiles || []).filter((profile) => profile.id !== currentUserId);
    return mergeProfiles(databaseProfiles, localProfiles, defaultRecommendedFriends);
  } catch (error) {
    console.warn('Database network profiles unavailable:', error);
    return mergeProfiles(localProfiles, defaultRecommendedFriends);
  }
}

export async function loadNetworkFollowStates(): Promise<Record<string, boolean>> {
  if (!safeGetItem('access_token')) return {};

  try {
    const response = await fetch(`${NETWORK_API_URL}/follows`, {
      method: 'GET',
      headers: authHeaders(),
    });

    const result = await readJson<NetworkFollowStatesResponse>(response);

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Failed to load network follows.');
    }

    return result.data?.states || {};
  } catch (error) {
    console.warn('Database network follows unavailable:', error);
    return {};
  }
}

export async function saveNetworkFollowState(
  targetProfileId: string,
  following: boolean,
): Promise<Record<string, boolean>> {
  if (!safeGetItem('access_token')) return { [targetProfileId]: following };

  const response = await fetch(`${NETWORK_API_URL}/follows`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ targetProfileId, following }),
  });

  const result = await readJson<NetworkFollowStatesResponse>(response);

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Failed to save network follow state.');
  }

  const remotePointBalance = result.data?.pointsAward?.newTotalPoints;
  if (typeof remotePointBalance === 'number') {
    setUserPoints(remotePointBalance);
  }

  return result.data?.states || { [targetProfileId]: following };
}
