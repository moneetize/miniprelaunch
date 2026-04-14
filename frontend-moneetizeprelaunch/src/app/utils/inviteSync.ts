import { getInviteInitials } from './invitationLinks';
import { safeGetItem, safeSetItem } from './storage';

export const SENT_INVITES_STORAGE_KEY = 'sentInvites';
export const PENDING_INVITATIONS_STORAGE_KEY = 'pendingInvitations';
export const PENDING_TEAM_INVITES_STORAGE_KEY = 'pendingTeamInvites';
export const INVITES_UPDATED_EVENT = 'moneetizeInvitesUpdated';

export type InviteDeliveryType = 'email' | 'sms';

export interface InviteRecord {
  id: string;
  type: InviteDeliveryType;
  email?: string;
  phone?: string;
  name: string;
  username: string;
  description: string;
  image: string;
  interests: string[];
  inviteUrl: string;
  sentAt: string;
  invitedAt: string;
  points: number;
  status: 'pending' | 'accepted' | 'dismissed';
  source: 'share-invites' | 'team-invites' | 'imported';
  initials: string;
}

export interface PendingTeamInviteMember {
  contact: string;
  email?: string;
  phone?: string;
  name: string;
  sentAt: string;
  inviteUrl?: string;
}

const parseJsonArray = <T,>(key: string): T[] => {
  try {
    const stored = safeGetItem(key);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const createInviteId = (type: InviteDeliveryType, contact: string) => {
  const seed =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  return `invite-${type}-${contact.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48)}-${seed}`;
};

const titleCase = (value: string) =>
  value
    .replace(/[._-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase());

const getDisplayName = (contact: string, type: InviteDeliveryType) => {
  if (type === 'email') {
    const localPart = contact.split('@')[0] || contact;
    return titleCase(localPart) || contact;
  }

  const digits = contact.replace(/\D/g, '');
  return digits.length >= 4 ? `Invite ${digits.slice(-4)}` : 'SMS Invite';
};

const getUsername = (contact: string, type: InviteDeliveryType) => {
  if (type === 'email') {
    return `@${(contact.split('@')[0] || 'invite').replace(/[^a-zA-Z0-9_]+/g, '').slice(0, 18).toLowerCase()}`;
  }

  const digits = contact.replace(/\D/g, '');
  return digits.length >= 4 ? `@sms${digits.slice(-4)}` : '@smsinvite';
};

const getContactKey = (record: Partial<InviteRecord> & Record<string, unknown>) => {
  const email = typeof record.email === 'string' ? record.email.trim().toLowerCase() : '';
  const phone = typeof record.phone === 'string' ? record.phone.replace(/\D/g, '') : '';
  const type = record.type === 'sms' ? 'sms' : 'email';

  if (email) return `email:${email}`;
  if (phone) return `sms:${phone}`;
  if (typeof record.id === 'string' && record.id) return `id:${record.id}`;
  if (typeof record.id === 'number') return `id:${record.id}`;

  return '';
};

const mergeByContact = <T extends object>(existing: T[], incoming: T[]) => {
  const merged = [...existing];
  const indexByKey = new Map<string, number>();

  merged.forEach((record, index) => {
    const key = getContactKey(record as Partial<InviteRecord> & Record<string, unknown>);
    if (key) indexByKey.set(key, index);
  });

  incoming.forEach((record) => {
    const key = getContactKey(record as Partial<InviteRecord> & Record<string, unknown>);
    const existingIndex = key ? indexByKey.get(key) : undefined;

    if (existingIndex === undefined) {
      indexByKey.set(key, merged.length);
      merged.push(record);
      return;
    }

    merged[existingIndex] = {
      ...merged[existingIndex],
      ...record,
    };
  });

  return merged;
};

const normalizeLegacyRecord = (record: any, fallbackType: InviteDeliveryType): InviteRecord | null => {
  const type: InviteDeliveryType = record?.type === 'sms' ? 'sms' : fallbackType;
  const email = typeof record?.email === 'string' ? record.email.trim() : '';
  const phone = typeof record?.phone === 'string' ? record.phone.trim() : '';
  const contact = type === 'sms' ? phone : email;

  if (!contact) return null;

  const name = typeof record?.name === 'string' && record.name.trim()
    ? record.name.trim()
    : getDisplayName(contact, type);
  const sentAt = typeof record?.sentAt === 'string' ? record.sentAt : record?.invitedAt || new Date().toISOString();

  return {
    id: typeof record?.id === 'string' ? record.id : createInviteId(type, contact),
    type,
    email: email || undefined,
    phone: phone || undefined,
    name,
    username: typeof record?.username === 'string' ? record.username : getUsername(contact, type),
    description:
      typeof record?.description === 'string'
        ? record.description
        : `${type === 'sms' ? 'SMS' : 'Email'} invitation sent from Share Invites`,
    image: typeof record?.image === 'string' ? record.image : '',
    interests: Array.isArray(record?.interests) ? record.interests : [],
    inviteUrl: typeof record?.inviteUrl === 'string' ? record.inviteUrl : '',
    sentAt,
    invitedAt: typeof record?.invitedAt === 'string' ? record.invitedAt : sentAt,
    points: typeof record?.points === 'number' ? record.points : 5,
    status: record?.status === 'accepted' || record?.status === 'dismissed' ? record.status : 'pending',
    source: record?.source === 'team-invites' ? 'team-invites' : record?.source === 'imported' ? 'imported' : 'share-invites',
    initials: typeof record?.initials === 'string' ? record.initials : getInviteInitials(name),
  };
};

const createInviteRecord = (contact: string, type: InviteDeliveryType, inviteUrl: string, sentAt: string): InviteRecord => {
  const trimmedContact = contact.trim();
  const name = getDisplayName(trimmedContact, type);

  return {
    id: createInviteId(type, trimmedContact),
    type,
    email: type === 'email' ? trimmedContact : undefined,
    phone: type === 'sms' ? trimmedContact : undefined,
    name,
    username: getUsername(trimmedContact, type),
    description: `${type === 'sms' ? 'SMS' : 'Email'} invitation sent from Share Invites`,
    image: '',
    interests: [],
    inviteUrl,
    sentAt,
    invitedAt: sentAt,
    points: 5,
    status: 'pending',
    source: 'share-invites',
    initials: getInviteInitials(name),
  };
};

const toTeamInviteRecord = (record: InviteRecord) => ({
  id: record.id,
  email: record.email || '',
  phone: record.phone || '',
  type: record.type,
  name: record.name,
  sentAt: record.sentAt,
  invitedAt: record.invitedAt,
  teamName: 'Moneetize Network',
  inviteUrl: record.inviteUrl,
  status: record.status,
});

export function recordSentInvites(recipients: string[], type: InviteDeliveryType, inviteUrl: string) {
  const sentAt = new Date().toISOString();
  const records = recipients.map((recipient) => createInviteRecord(recipient, type, inviteUrl, sentAt));

  const existingSent = parseJsonArray<any>(SENT_INVITES_STORAGE_KEY)
    .map((record) => normalizeLegacyRecord(record, record?.type === 'sms' ? 'sms' : 'email'))
    .filter(Boolean) as InviteRecord[];
  const nextSent = mergeByContact(existingSent, records);
  safeSetItem(SENT_INVITES_STORAGE_KEY, JSON.stringify(nextSent));

  const existingPendingNetwork = parseJsonArray<Record<string, unknown>>(PENDING_INVITATIONS_STORAGE_KEY);
  const nextPendingNetwork = mergeByContact(existingPendingNetwork, records as unknown as Record<string, unknown>[]);
  safeSetItem(PENDING_INVITATIONS_STORAGE_KEY, JSON.stringify(nextPendingNetwork));

  const existingPendingTeam = parseJsonArray<Record<string, unknown>>(PENDING_TEAM_INVITES_STORAGE_KEY);
  const nextPendingTeam = mergeByContact(existingPendingTeam, records.map(toTeamInviteRecord));
  safeSetItem(PENDING_TEAM_INVITES_STORAGE_KEY, JSON.stringify(nextPendingTeam));

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(INVITES_UPDATED_EVENT, { detail: { records } }));
  }

  return records;
}

export function getPendingTeamInviteMembers(limit = 1): PendingTeamInviteMember[] {
  const pendingTeamInvites = parseJsonArray<any>(PENDING_TEAM_INVITES_STORAGE_KEY)
    .map((record) => normalizeLegacyRecord(record, record?.type === 'sms' ? 'sms' : 'email'))
    .filter(Boolean) as InviteRecord[];
  const sentInvites = parseJsonArray<any>(SENT_INVITES_STORAGE_KEY)
    .map((record) => normalizeLegacyRecord(record, record?.type === 'sms' ? 'sms' : 'email'))
    .filter(Boolean) as InviteRecord[];

  const merged = mergeByContact(pendingTeamInvites, sentInvites).filter((record) => record.status === 'pending');

  return merged.slice(0, limit).map((record) => ({
    contact: record.email || record.phone || record.name,
    email: record.email,
    phone: record.phone,
    name: record.name,
    sentAt: record.sentAt,
    inviteUrl: record.inviteUrl,
  }));
}
