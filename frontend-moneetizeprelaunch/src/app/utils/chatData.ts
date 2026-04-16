export type ChatKind = 'agent' | 'member' | 'team';

export interface ChatPreview {
  id: string;
  type: ChatKind;
  name: string;
  handle?: string;
  avatar?: string;
  lastMessage: string;
  timestamp: string;
  unreadCount?: number;
  isOnline?: boolean;
}

export const teamMemberChats: ChatPreview[] = [];

export const agentChatPreview: ChatPreview = {
  id: 'agent',
  type: 'agent',
  name: 'Your Agent',
  lastMessage: 'Ask anything.',
  timestamp: '',
};

export const teamChatPreview: ChatPreview = {
  id: 'my-team',
  type: 'team',
  name: 'My team',
  handle: '',
  lastMessage: 'Start a team chat.',
  timestamp: '',
};

export const allMessageChats: ChatPreview[] = [agentChatPreview, ...teamMemberChats, teamChatPreview];

export function getMemberChatById(id?: string) {
  return teamMemberChats.find((member) => member.id === id);
}
