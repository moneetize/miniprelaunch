import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft, Edit3, Search } from 'lucide-react';

interface ChatPreview {
  id: string;
  type: 'agent' | 'user' | 'group' | 'team';
  name: string;
  handle?: string;
  avatar: string;
  lastMessage: string;
  timestamp: string;
  unreadCount?: number;
  isOnline?: boolean;
}

export function ChatList() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'all' | 'groups' | 'teams'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const allChats: ChatPreview[] = [
    {
      id: 'agent-1',
      type: 'agent',
      name: 'Your Agent',
      avatar: 'https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?w=100&h=100&fit=crop',
      lastMessage: 'Triple Your Earnings: Invest $15...',
      timestamp: '1 min ago',
    },
    {
      id: 'user-1',
      type: 'user',
      name: 'Caleb Miller',
      avatar: 'https://images.unsplash.com/photo-1651684215020-f7a5b6610f23?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMG1hbGUlMjBidXNpbmVzc3xlbnwxfHx8fDE3NzQxMjU0OTl8MA&ixlib=rb-4.1.0&q=80&w=1080',
      lastMessage: 'Caleb sent a connection request.',
      timestamp: '2 min ago',
      unreadCount: 1,
      isOnline: true,
    },
    {
      id: 'user-2',
      type: 'user',
      name: 'John Abraham',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
      lastMessage: 'Caleb sent a connection request.',
      timestamp: '4 min ago',
    },
    {
      id: 'user-3',
      type: 'user',
      name: 'Olivia Bennett',
      handle: '@missdo90',
      avatar: 'https://images.unsplash.com/photo-1769636929132-e4e7b50cfac0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMGZlbWFsZSUyMGJ1c2luZXNzfGVufDF8fHx8MTc3NDEyNTQ5OXww&ixlib=rb-4.1.0&q=80&w=1080',
      lastMessage: 'Olivia has invited you to join...',
      timestamp: '6 min ago',
    },
    {
      id: 'user-4',
      type: 'user',
      name: 'Jack Nichols',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
      lastMessage: 'Caleb sent a connection re...',
      timestamp: '8 min ago',
      unreadCount: 10,
    },
  ];

  const groupChats: ChatPreview[] = [
    {
      id: 'group-1',
      type: 'group',
      name: 'Urban Fitness',
      handle: '@UrbanFit',
      avatar: '🏋️',
      lastMessage: 'Jack: I just took this survey...',
      timestamp: '5 min ago',
      unreadCount: 3,
    },
  ];

  const teamChats: ChatPreview[] = [
    {
      id: 'team-1',
      type: 'team',
      name: 'The Warriors',
      avatar: '👥',
      lastMessage: 'Team Update! Jim just earned 30 points...',
      timestamp: '10 min ago',
      unreadCount: 2,
    },
  ];

  const getChatsToDisplay = () => {
    if (activeTab === 'groups') return groupChats;
    if (activeTab === 'teams') return teamChats;
    return [...allChats, ...groupChats, ...teamChats];
  };

  const filteredChats = getChatsToDisplay().filter(chat =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleChatClick = (chat: ChatPreview) => {
    if (chat.type === 'agent') {
      navigate('/chat/agent');
    } else if (chat.type === 'user') {
      navigate(`/chat/user/${chat.id}`, { state: { chat } });
    } else if (chat.type === 'group') {
      navigate(`/chat/group/${chat.id}`, { state: { chat } });
    } else if (chat.type === 'team') {
      navigate(`/chat/team/${chat.id}`, { state: { chat } });
    }
  };

  return (
    <div className="absolute inset-0 w-full h-full overflow-y-auto bg-[#0a0e1a]">
      {/* Status Bar */}
      <div className="absolute top-0 left-0 right-0 h-11 flex items-center justify-between px-4 text-white text-sm z-50">
        <div className="flex items-center gap-2">
          <span className="font-semibold">9:41</span>
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
          </svg>
        </div>
        <div className="flex items-center gap-2">
          <svg className="w-4 h-3" fill="currentColor" viewBox="0 0 16 12">
            <rect width="2" height="6" x="0" y="3" rx="0.5" />
            <rect width="2" height="8" x="3" y="2" rx="0.5" />
            <rect width="2" height="10" x="6" y="1" rx="0.5" />
            <rect width="2" height="7" x="9" y="2.5" rx="0.5" />
          </svg>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
          </svg>
          <div className="flex items-center gap-1">
            <div className="w-6 h-3 bg-white/80 rounded-sm relative overflow-hidden">
              <div className="absolute inset-0 bg-yellow-400 w-3/4" />
            </div>
          </div>
        </div>
      </div>

      <div className="pt-11 pb-6 px-4 max-w-md mx-auto">
        {/* Header with Back, Title, Search, and Edit */}
        <div className="flex items-center justify-between mb-6 mt-4">
          <button
            onClick={() => navigate('/profile')}
            className="w-9 h-9 rounded-full bg-[#1a1d2e] flex items-center justify-center hover:bg-[#252837] transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-white" />
          </button>
          
          <h1 className="text-white text-xl font-bold">Messages</h1>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="w-8 h-8 rounded-full bg-[#1a1d2e] flex items-center justify-center hover:bg-[#252837] transition-colors"
            >
              <Search className="w-4 h-4 text-white" />
            </button>
            <button
              className="w-8 h-8 rounded-full bg-[#1a1d2e] flex items-center justify-center hover:bg-[#252837] transition-colors"
            >
              <Edit3 className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-2 mb-6"
        >
          <button
            onClick={() => setActiveTab('all')}
            className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${
              activeTab === 'all'
                ? 'bg-white text-black'
                : 'bg-[#1a1d2e] text-gray-400 hover:text-white'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveTab('groups')}
            className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${
              activeTab === 'groups'
                ? 'bg-white text-black'
                : 'bg-[#1a1d2e] text-gray-400 hover:text-white'
            }`}
          >
            Groups
          </button>
          <button
            onClick={() => setActiveTab('teams')}
            className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${
              activeTab === 'teams'
                ? 'bg-white text-black'
                : 'bg-[#1a1d2e] text-gray-400 hover:text-white'
            }`}
          >
            Teams
          </button>
        </motion.div>

        {/* Search Bar */}
        {showSearch && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4"
          >
            <div className="bg-[#1a1d2e] rounded-full px-4 py-3 flex items-center gap-3">
              <Search className="w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Test text something..."
                className="flex-1 bg-transparent text-white outline-none placeholder-gray-500"
              />
            </div>
          </motion.div>
        )}

        {/* Chat List */}
        <div className="space-y-3">
          {filteredChats.map((chat, index) => (
            <motion.div
              key={chat.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handleChatClick(chat)}
              className="bg-gradient-to-br from-[#1a1d2e] to-[#0f1318] rounded-2xl p-4 flex items-center gap-4 cursor-pointer hover:bg-[#252837] transition-all border border-white/5"
            >
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                {typeof chat.avatar === 'string' && chat.avatar.startsWith('http') ? (
                  <div className="relative">
                    <img
                      src={chat.avatar}
                      alt={chat.name}
                      className="w-14 h-14 rounded-full object-cover"
                    />
                    {chat.isOnline && (
                      <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#1a1d2e]" />
                    )}
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-2xl">
                    {chat.avatar}
                  </div>
                )}
              </div>

              {/* Chat Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-white font-semibold truncate">{chat.name}</h3>
                  <span className="text-gray-400 text-xs flex-shrink-0 ml-2">
                    {chat.timestamp}
                  </span>
                </div>
                <p className="text-gray-400 text-sm truncate">{chat.lastMessage}</p>
              </div>

              {/* Unread Badge */}
              {chat.unreadCount && chat.unreadCount > 0 && (
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">{chat.unreadCount}</span>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}