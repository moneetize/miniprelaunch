import { projectId, publicAnonKey } from '/utils/supabase/info';
import { setUserPoints } from '../utils/pointsManager';
import { safeGetItem } from '../utils/storage';

const GAMEPLAY_API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-7a79873f/gameplay`;

interface GameplayProgressResponse {
  success?: boolean;
  data?: {
    pointsAwarded?: number;
    newTotalPoints?: number;
    progress?: {
      quests?: Record<string, unknown>;
    };
  };
  error?: string;
}

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

export async function syncGameplayQuestCompletion({
  questId,
  title,
  points,
  source,
  progress = 1,
  completed = true,
}: {
  questId: string | number;
  title: string;
  points: number;
  source: string;
  progress?: number;
  completed?: boolean;
}) {
  if (!safeGetItem('access_token')) return null;

  const response = await fetch(`${GAMEPLAY_API_URL}/progress`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      questId: `${questId}`,
      title,
      points,
      source,
      progress,
      completed,
    }),
  });
  const result = await readJson<GameplayProgressResponse>(response);

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Failed to sync gameplay progress.');
  }

  if (typeof result.data?.newTotalPoints === 'number') {
    setUserPoints(result.data.newTotalPoints);
  }

  return result.data || null;
}
