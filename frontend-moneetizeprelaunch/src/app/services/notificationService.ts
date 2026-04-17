import { projectId, publicAnonKey } from '/utils/supabase/info';
import { safeGetItem } from '../utils/storage';

const BASE_API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-7a79873f`;

export interface NetworkNotification {
  id: string;
  title: string;
  message: string;
  imageUrl?: string;
  createdAt: string;
  createdByEmail?: string;
  recipientCount?: number;
  emailSummary?: {
    sent?: number;
    queued?: number;
    failed?: number;
  };
}

type NotificationsResponse = {
  success?: boolean;
  data?: {
    notifications?: NetworkNotification[];
    notification?: NetworkNotification;
  };
  error?: string;
};

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

export async function loadProfileNotifications(): Promise<NetworkNotification[]> {
  if (!safeGetItem('access_token')) return [];

  const response = await fetch(`${BASE_API_URL}/profile/notifications`, {
    method: 'GET',
    headers: authHeaders(),
  });
  const result = await readJson<NotificationsResponse>(response);

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Failed to load notifications.');
  }

  return result.data?.notifications || [];
}

export async function loadAdminNotifications(): Promise<NetworkNotification[]> {
  const response = await fetch(`${BASE_API_URL}/admin/notifications`, {
    method: 'GET',
    headers: authHeaders(),
  });
  const result = await readJson<NotificationsResponse>(response);

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Failed to load admin notifications.');
  }

  return result.data?.notifications || [];
}

export async function sendAdminNetworkNotification({
  title,
  message,
  imageUrl,
}: {
  title: string;
  message: string;
  imageUrl?: string;
}) {
  const response = await fetch(`${BASE_API_URL}/admin/notifications`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ title, message, imageUrl }),
  });
  const result = await readJson<NotificationsResponse>(response);

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Failed to send network notification.');
  }

  return {
    notification: result.data?.notification || null,
    notifications: result.data?.notifications || [],
  };
}
