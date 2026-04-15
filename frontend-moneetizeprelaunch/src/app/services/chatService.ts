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

const CHAT_API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-7a79873f/chat`;
const CHAT_THREAD_STORAGE_PREFIX = 'moneetizeChatThread:';

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
  const fallbackMembers = teamMemberChats;
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

    return mergeChats(teamProfiles, pendingInvites, fallbackMembers);
  } catch {
    return mergeChats(pendingInvites, fallbackMembers);
  }
}

export async function loadChatPreviews(tab: 'all' | 'members' | 'teams' = 'all') {
  const contacts = await loadTeamChatContacts();
  const profile = getStoredProfileSettings();
  const teamPreview: ChatPreview = {
    ...teamChatPreview,
    name: `${profile.name.split(' ')[0] || 'My'} team`,
    handle: profile.handle,
    lastMessage: contacts.length ? `${contacts[0].name}: Tap to start the team thread.` : teamChatPreview.lastMessage,
  };

  if (tab === 'members') return contacts;
  if (tab === 'teams') return [teamPreview];
  return [agentChatPreview, ...contacts, teamPreview];
}

export async function getChatPreviewById(id?: string, isTeam = false): Promise<ChatPreview> {
  if (isTeam) return (await loadChatPreviews('teams'))[0] || teamChatPreview;

  const contacts = await loadTeamChatContacts();
  return contacts.find((contact) => contact.id === id) || teamMemberChats.find((member) => member.id === id) || teamMemberChats[0];
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
    return Array.isArray(parsed) ? parsed as ChatMessage[] : [];
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

    const messages = result.data.messages.length ? result.data.messages : localMessages;
    saveLocalThreadMessages(threadId, messages);
    return messages;
  } catch {
    return localMessages;
  }
}

export async function sendThreadMessage(threadId: string, message: ChatMessage) {
  const nextMessages = [...loadLocalThreadMessages(threadId), message];
  saveLocalThreadMessages(threadId, nextMessages);

  if (!getAccessToken()) return nextMessages;

  try {
    const response = await fetch(`${CHAT_API_URL}/thread/${encodeURIComponent(threadId)}`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ message }),
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

export function createFallbackAgentReply(prompt: string): ChatMessage {
  const createdAt = new Date().toISOString();
  const normalizedPrompt = prompt.toLowerCase();
  const content = normalizedPrompt.includes('invest') || normalizedPrompt.includes('market') || normalizedPrompt.includes('stock')
    ? 'I can help you think through investing education, risk, diversification, time horizon, and questions to ask before making a decision. I cannot promise returns or tell you what to buy. Share your goal, timeline, and risk comfort and I will help you compare options.'
    : 'I can help with rewards, marketplace questions, profile setup, and general money education. What would you like to work through?';

  return {
    id: `agent-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    senderId: 'agent',
    senderName: 'Your Agent',
    content,
    timestamp: formatTimestamp(new Date(createdAt)),
    createdAt,
    role: 'agent',
  };
}

export async function sendAgentChatMessage(threadId: string, messages: ChatMessage[], prompt: string) {
  if (!getAccessToken()) {
    const reply = createFallbackAgentReply(prompt);
    const nextMessages = [...messages, reply];
    saveLocalThreadMessages(threadId, nextMessages);
    return nextMessages;
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
  } catch {
    const reply = createFallbackAgentReply(prompt);
    const nextMessages = [...messages, reply];
    saveLocalThreadMessages(threadId, nextMessages);
    return nextMessages;
  }
}
