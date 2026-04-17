import { projectId, publicAnonKey } from '/utils/supabase/info';
import { agentChatPreview, teamChatPreview, teamMemberChats, type ChatPreview } from '../utils/chatData';
import { getPendingTeamInviteMembers } from '../utils/inviteSync';
import { getStoredProfileSettings } from '../utils/profileSettings';
import { safeGetItem, safeSetItem } from '../utils/storage';
import { loadNetworkFollowStates, loadRecommendedFriends, type RecommendedFriendProfile } from './networkService';

export type { ChatPreview } from '../utils/chatData';

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: string;
  createdAt: string;
  role?: 'agent' | 'user' | 'member' | 'system';
  hasCard?: boolean;
  hasJoinButton?: boolean;
}

type ChatMessagesResponse = {
  success?: boolean;
  data?: {
    messages?: ChatMessage[];
    message?: ChatMessage;
    reply?: ChatMessage;
  };
  error?: string;
};

type ChatThreadsResponse = {
  success?: boolean;
  data?: {
    threads?: Array<{
      threadId: string;
      type?: 'agent' | 'member' | 'team';
      name?: string;
      handle?: string;
      avatar?: string;
      lastMessage?: string;
      lastMessageAt?: string;
      updatedAt?: string;
    }>;
  };
  error?: string;
};

const CHAT_API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-7a79873f/chat`;
const CHAT_THREAD_STORAGE_PREFIX = 'moneetizeChatThread:';
const LEGACY_DEMO_MESSAGE_IDS = new Set([
  'boost-income',
  'action-needed',
  'team-olivia',
  'team-jack',
  'team-you',
  'member-1',
  'member-2',
  'member-you',
]);

function isLegacyDemoContent(value?: string) {
  const content = `${value || ''}`;
  return (
    content.includes('Triple Your Earnings') ||
    content.includes('Action Needed!') ||
    content.includes('I just took this survey') ||
    content.includes('Hey, everyone! I just found this product') ||
    content.includes('A useful starting point') ||
    content.includes('Here is a practical way to think about it') ||
    content.includes('Here is a direct starting point') ||
    content.includes('Ask me a follow-up and I can go deeper')
  );
}

function isLegacyDemoMessage(message: ChatMessage) {
  return (
    LEGACY_DEMO_MESSAGE_IDS.has(message.id) ||
    isLegacyDemoContent(message.content)
  );
}

function getAccessToken() {
  return safeGetItem('access_token') || '';
}

function authHeaders() {
  const accessToken = getAccessToken();

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

function formatTimestamp(date = new Date()) {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function toSlug(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'member';
}

function profileToChat(profile: RecommendedFriendProfile): ChatPreview {
  return {
    id: profile.id || toSlug(profile.name),
    type: 'member',
    name: profile.name,
    handle: profile.handle,
    avatar: profile.avatar,
    lastMessage: profile.followsMe ? `${profile.name.split(' ')[0]} follows you.` : 'Tap to start a message.',
    timestamp: 'now',
    isOnline: Boolean(profile.followsMe),
  };
}

function mergeChats(...groups: ChatPreview[][]) {
  const merged = new Map<string, ChatPreview>();

  groups.flat().forEach((chat) => {
    if (!chat.id || merged.has(chat.id)) return;
    merged.set(chat.id, chat);
  });

  return [...merged.values()];
}

export async function loadTeamChatContacts(): Promise<ChatPreview[]> {
  const pendingInvites = getPendingTeamInviteMembers().map((invite): ChatPreview => ({
    id: invite.id,
    type: 'member',
    name: invite.name,
    handle: invite.email || invite.phone || invite.contact,
    lastMessage: 'Invite pending.',
    timestamp: 'pending',
  }));

  try {
    const [profiles, followStates] = await Promise.all([
      loadRecommendedFriends(),
      loadNetworkFollowStates(),
    ]);
    const teamProfiles = profiles
      .filter((profile) => followStates[profile.id] || profile.followsMe)
      .map(profileToChat);

    return mergeChats(teamProfiles, pendingInvites);
  } catch {
    return mergeChats(pendingInvites);
  }
}

async function loadRemoteThreadIndex() {
  if (!getAccessToken()) return [];

  try {
    const response = await fetch(`${CHAT_API_URL}/threads`, {
      method: 'GET',
      headers: authHeaders(),
    });
    const result = await readJson<ChatThreadsResponse>(response);

    if (!response.ok || !result.success || !result.data?.threads) return [];
    return result.data.threads;
  } catch {
    return [];
  }
}

function applyRemoteThreadIndex(chats: ChatPreview[], threads: Awaited<ReturnType<typeof loadRemoteThreadIndex>>) {
  if (!threads.length) return chats;

  const threadsById = new Map(threads.map((thread) => [thread.threadId, thread]));

  return chats.map((chat) => {
    const thread = threadsById.get(getThreadId(chat));
    if (!thread) return chat;

    return {
      ...chat,
      lastMessage: isLegacyDemoContent(thread.lastMessage) ? chat.lastMessage : thread.lastMessage || chat.lastMessage,
      timestamp: thread.updatedAt || thread.lastMessageAt ? 'now' : chat.timestamp,
    };
  });
}

export async function loadChatPreviews(tab: 'all' | 'members' | 'teams' = 'all') {
  const contacts = await loadTeamChatContacts();
  const profile = getStoredProfileSettings();
  const teamPreview: ChatPreview = {
    ...teamChatPreview,
    name: `${profile.name.split(' ')[0] || 'My'} team`,
    handle: profile.handle,
    lastMessage: contacts.length ? 'Start a team conversation.' : 'Invite teammates to start a team chat.',
  };
  const remoteThreads = await loadRemoteThreadIndex();

  if (tab === 'members') return applyRemoteThreadIndex(contacts, remoteThreads);
  if (tab === 'teams') return applyRemoteThreadIndex([teamPreview], remoteThreads);
  return applyRemoteThreadIndex([agentChatPreview, ...contacts, teamPreview], remoteThreads);
}

export async function getChatPreviewById(id?: string, isTeam = false): Promise<ChatPreview> {
  if (isTeam) return (await loadChatPreviews('teams'))[0] || teamChatPreview;

  const contacts = await loadTeamChatContacts();
  return contacts.find((contact) => contact.id === id) || teamMemberChats.find((member) => member.id === id) || {
    id: id || 'member',
    type: 'member',
    name: 'Member',
    handle: '',
    lastMessage: 'Start a message.',
    timestamp: '',
  };
}

export function getThreadId(chat: ChatPreview) {
  const currentUserId = safeGetItem('user_id') || safeGetItem('user_email') || 'current-user';

  if (chat.type === 'agent') return `agent:${currentUserId}`;
  if (chat.type === 'team') return `team:${currentUserId}:${chat.id}`;

  return ['member', currentUserId, chat.id].sort().join(':');
}

function getThreadStorageKey(threadId: string) {
  return `${CHAT_THREAD_STORAGE_PREFIX}${threadId}`;
}

function parseMessages(value: string | null): ChatMessage[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as ChatMessage[]).filter((message) => !isLegacyDemoMessage(message)) : [];
  } catch {
    return [];
  }
}

export function createCurrentUserMessage(content: string): ChatMessage {
  const profile = getStoredProfileSettings();
  const createdAt = new Date().toISOString();

  return {
    id: `message-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    senderId: safeGetItem('user_id') || 'current-user',
    senderName: profile.name || 'You',
    senderAvatar: profile.photo,
    content,
    timestamp: formatTimestamp(new Date(createdAt)),
    createdAt,
    role: 'user',
  };
}

export function saveLocalThreadMessages(threadId: string, messages: ChatMessage[]) {
  safeSetItem(getThreadStorageKey(threadId), JSON.stringify(messages.slice(-100)));
  return messages;
}

export function loadLocalThreadMessages(threadId: string, fallback: ChatMessage[] = []) {
  const messages = parseMessages(safeGetItem(getThreadStorageKey(threadId)));
  return messages.length ? messages : fallback;
}

export async function loadThreadMessages(threadId: string, fallback: ChatMessage[] = []) {
  const localMessages = loadLocalThreadMessages(threadId, fallback);
  if (!getAccessToken()) return localMessages;

  try {
    const response = await fetch(`${CHAT_API_URL}/thread/${encodeURIComponent(threadId)}`, {
      method: 'GET',
      headers: authHeaders(),
    });
    const result = await readJson<ChatMessagesResponse>(response);

    if (!response.ok || !result.success || !result.data?.messages) {
      return localMessages;
    }

    const remoteMessages = result.data.messages.filter((message) => !isLegacyDemoMessage(message));
    const messages = remoteMessages.length ? remoteMessages : localMessages;
    saveLocalThreadMessages(threadId, messages);
    return messages;
  } catch {
    return localMessages;
  }
}

export async function sendThreadMessage(threadId: string, message: ChatMessage, metadata?: Partial<ChatPreview>) {
  const nextMessages = [...loadLocalThreadMessages(threadId), message];
  saveLocalThreadMessages(threadId, nextMessages);

  if (!getAccessToken()) return nextMessages;

  try {
    const response = await fetch(`${CHAT_API_URL}/thread/${encodeURIComponent(threadId)}`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ message, metadata }),
    });
    const result = await readJson<ChatMessagesResponse>(response);

    if (response.ok && result.success && result.data?.messages) {
      saveLocalThreadMessages(threadId, result.data.messages);
      return result.data.messages;
    }
  } catch {
    // Local persistence already captured the sent message.
  }

  return nextMessages;
}

export async function sendAgentChatMessage(threadId: string, messages: ChatMessage[], prompt: string) {
  if (!getAccessToken()) {
    throw new Error('Please log in to use your AI agent.');
  }

  try {
    const response = await fetch(`${CHAT_API_URL}/agent`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ threadId, messages, prompt }),
    });
    const result = await readJson<ChatMessagesResponse>(response);

    if (!response.ok || !result.success || !result.data?.messages) {
      throw new Error(result.error || 'Agent chat failed.');
    }

    saveLocalThreadMessages(threadId, result.data.messages);
    return result.data.messages;
  } catch (error) {
    throw error instanceof Error ? error : new Error('Agent chat failed.');
  }
}
