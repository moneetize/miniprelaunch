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

export const teamMemberChats: ChatPreview[] = [
  {
    id: 'caleb-miller',
    type: 'member',
    name: 'Caleb Miller',
    handle: '@calebm',
    avatar: 'https://images.unsplash.com/photo-1651684215020-f7a5b6610f23?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMG1hbGUlMjBidXNpbmVzc3xlbnwxfHx8fDE3NzQxMjU0OTl8MA&ixlib=rb-4.1.0&q=80&w=1080',
    lastMessage: 'Caleb sent a connection request.',
    timestamp: '2 min ago',
    unreadCount: 1,
    isOnline: true,
  },
  {
    id: 'john-abraham',
    type: 'member',
    name: 'John Abraham',
    handle: '@johnabraham',
    avatar: 'https://images.unsplash.com/photo-1760830840470-8b2eedc5d2b7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMG1hbiUyMGhlYWRzaG90JTIwcG9ydHJhaXR8ZW58MXx8fHwxNzc0MzM3NTMxfDA&ixlib=rb-4.1.0&q=80&w=1080',
    lastMessage: 'Caleb sent a connection request.',
    timestamp: '4 min ago',
  },
  {
    id: 'olivia-bennett',
    type: 'member',
    name: 'Olivia Bennett',
    handle: '@missdo90',
    avatar: 'https://images.unsplash.com/photo-1769636929132-e4e7b50cfac0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMGZlbWFsZSUyMGJ1c2luZXNzfGVufDF8fHx8MTc3NDEyNTQ5OXww&ixlib=rb-4.1.0&q=80&w=1080',
    lastMessage: 'Olivia has invited you to join...',
    timestamp: '6 min ago',
  },
  {
    id: 'jack-nichols',
    type: 'member',
    name: 'Jack Nichols',
    handle: '@jacknichols',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
    lastMessage: 'Caleb sent a connection req...',
    timestamp: '8 min ago',
    unreadCount: 10,
  },
];

export const agentChatPreview: ChatPreview = {
  id: 'agent',
  type: 'agent',
  name: 'Your Agent',
  lastMessage: 'Triple Your Earnings: Invest $15...',
  timestamp: '1 min ago',
};

export const teamChatPreview: ChatPreview = {
  id: 'my-team',
  type: 'team',
  name: 'My team',
  handle: '@UrbanFit',
  lastMessage: 'Jack: I just took this survey...',
  timestamp: '10 min ago',
};

export const allMessageChats: ChatPreview[] = [agentChatPreview, ...teamMemberChats, teamChatPreview];

export function getMemberChatById(id?: string) {
  return teamMemberChats.find((member) => member.id === id) || teamMemberChats[2];
}
