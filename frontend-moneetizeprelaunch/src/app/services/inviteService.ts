import { projectId, publicAnonKey } from '/utils/supabase/info';
import { recordSentInvites, type InviteRecord } from '../utils/inviteSync';
import { setUserPoints } from '../utils/pointsManager';
import { safeGetItem } from '../utils/storage';

const INVITES_API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-7a79873f/invites`;

export interface InviteSendResult {
  invitesSent: number;
  records: InviteRecord[];
  pointsEarned: number;
  newTotalPoints?: number;
  emailDeliveries?: Array<{ to: string; status: 'sent' | 'queued' | 'failed'; error?: string }>;
  smsDeliveries?: Array<{ to: string; status: 'sent' | 'queued' | 'failed'; error?: string }>;
}

interface InviteResponse {
  success?: boolean;
  data?: InviteSendResult;
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

export async function sendInvitesFromServer({
  emails = [],
  phones = [],
  inviteLink,
  message,
}: {
  emails?: string[];
  phones?: string[];
  inviteLink: string;
  message: string;
}) {
  const accessToken = safeGetItem('access_token');
  if (!accessToken) {
    throw new Error('Log in before sending invites.');
  }

  const response = await fetch(`${INVITES_API_URL}/send`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ emails, phones, inviteLink, message }),
  });
  const result = await readJson<InviteResponse>(response);

  if (!response.ok || !result.success || !result.data) {
    throw new Error(result.error || 'Failed to send invites.');
  }

  if (typeof result.data.newTotalPoints === 'number') {
    setUserPoints(result.data.newTotalPoints);
  }

  const emailRecipients = result.data.records
    .filter((record) => record.type === 'email' && record.email)
    .map((record) => record.email as string);
  const smsRecipients = result.data.records
    .filter((record) => record.type === 'sms' && record.phone)
    .map((record) => record.phone as string);

  if (emailRecipients.length) recordSentInvites(emailRecipients, 'email', inviteLink);
  if (smsRecipients.length) recordSentInvites(smsRecipients, 'sms', inviteLink);

  return result.data;
}
