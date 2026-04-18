import { projectId, publicAnonKey } from '/utils/supabase/info';
import { recordSentInvites, type InviteRecord } from '../utils/inviteSync';
import { setUserPoints } from '../utils/pointsManager';
import { resolveInvitationContext } from '../utils/invitationLinks';
import { safeGetItem, safeSetItem } from '../utils/storage';

const INVITES_API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-7a79873f/invites`;

export interface InviteSendResult {
  invitesSent: number;
  records: InviteRecord[];
  pointsEarned: number;
  newTotalPoints?: number;
  emailDeliveries?: Array<{ to: string; status: 'sent' | 'queued' | 'failed'; error?: string; messageId?: string }>;
  smsDeliveries?: Array<{ to: string; status: 'sent' | 'queued' | 'failed'; error?: string }>;
}

export interface InviteTeamMember {
  id: string;
  name: string;
  handle?: string;
  email?: string;
  phone?: string;
  contact?: string;
  avatar?: string;
  points: number;
  status: 'active' | 'pending';
  type?: 'email' | 'sms';
  inviteUrl?: string;
  sentAt?: string;
}

interface InviteResponse {
  success?: boolean;
  data?: InviteSendResult;
  error?: string;
}

interface TrackUrlInviteResponse {
  success?: boolean;
  data?: {
    tracked: boolean;
    pointsEarned: number;
    newTotalPoints?: number;
    scratchUnlock?: {
      unlocked: boolean;
      reason?: string;
      message?: string;
      credits?: {
        available: number;
        used: number;
        totalEarned: number;
        max: number;
        canScratch: boolean;
      };
    } | null;
  };
  error?: string;
}

interface InviteTeamResponse {
  success?: boolean;
  data?: {
    members?: InviteTeamMember[];
    pending?: InviteTeamMember[];
    acceptedCount?: number;
    pendingCount?: number;
    teamProgressPoints?: number;
    maxAccepted?: number;
  };
  error?: string;
}

const INVITE_VISITOR_STORAGE_KEY = 'moneetizeInviteVisitorId';

function getOrCreateInviteVisitorId() {
  const storedVisitorId = safeGetItem(INVITE_VISITOR_STORAGE_KEY);
  if (storedVisitorId) return storedVisitorId;

  const nextVisitorId =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  safeSetItem(INVITE_VISITOR_STORAGE_KEY, nextVisitorId);
  return nextVisitorId;
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

export async function loadInviteTeam() {
  if (!getAccessToken()) {
    return null;
  }

  const response = await fetch(`${INVITES_API_URL}/team`, {
    method: 'GET',
    headers: authHeaders(),
  });
  const result = await readJson<InviteTeamResponse>(response);

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Failed to load invite team.');
  }

  return result.data || null;
}

export async function trackUrlInviteOpen({
  inviterId,
  inviterName,
  promptId,
  inviteUrl,
}: {
  inviterId?: string;
  inviterName?: string;
  promptId?: string;
  inviteUrl?: string;
}) {
  const cleanInviterId = `${inviterId || ''}`.trim();
  if (!cleanInviterId) return null;

  const response = await fetch(`${INVITES_API_URL}/track-url`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      inviterId: cleanInviterId,
      inviterName,
      promptId,
      inviteUrl,
      visitorId: getOrCreateInviteVisitorId(),
    }),
  });
  const result = await readJson<TrackUrlInviteResponse>(response);

  if (!response.ok || !result.success || !result.data) {
    throw new Error(result.error || 'Failed to track invite link.');
  }

  if (safeGetItem('user_id') === cleanInviterId && typeof result.data.newTotalPoints === 'number') {
    setUserPoints(result.data.newTotalPoints);
  }

  return result.data;
}

export async function trackStoredInviteAcceptance(inviteUrl?: string) {
  const accessToken = safeGetItem('access_token');
  const currentUserId = safeGetItem('user_id') || '';

  if (!accessToken || !currentUserId) return null;

  const invitationContext = resolveInvitationContext();
  const inviterId = invitationContext.inviterId || '';

  if (!inviterId || inviterId === currentUserId) return null;

  return trackUrlInviteOpen({
    inviterId,
    inviterName: invitationContext.inviterName,
    promptId: invitationContext.promptId,
    inviteUrl,
  });
}
