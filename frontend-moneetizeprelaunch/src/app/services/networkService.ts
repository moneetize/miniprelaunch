import { projectId, publicAnonKey } from '/utils/supabase/info';

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
}

type RecommendedFriendsResponse = {
  success?: boolean;
  data?: {
    profiles?: RecommendedFriendProfile[];
    total?: number;
  };
  error?: string;
};

const NETWORK_API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-7a79873f/network`;

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
  return {
    Authorization: `Bearer ${publicAnonKey}`,
    apikey: publicAnonKey,
    'Content-Type': 'application/json',
  };
}

async function readJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  return text ? (JSON.parse(text) as T) : ({} as T);
}

export function getDefaultRecommendedFriends(): RecommendedFriendProfile[] {
  return defaultRecommendedFriends;
}

export async function loadRecommendedFriends(): Promise<RecommendedFriendProfile[]> {
  try {
    const response = await fetch(`${NETWORK_API_URL}/recommended-friends`, {
      method: 'GET',
      headers: authHeaders(),
    });

    const result = await readJson<RecommendedFriendsResponse>(response);

    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Failed to load recommended friends.');
    }

    return result.data?.profiles?.length ? result.data.profiles : defaultRecommendedFriends;
  } catch (error) {
    console.warn('Recommended friends fallback loaded:', error);
    return defaultRecommendedFriends;
  }
}
