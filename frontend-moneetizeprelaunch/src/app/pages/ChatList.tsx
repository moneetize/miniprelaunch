import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronUp, Search, Trash2, Users } from 'lucide-react';
import { loadChatPreviews, type ChatPreview } from '../services/chatService';
import { getSelectedAvatarImage } from '../utils/avatarUtils';

type MessageTab = 'all' | 'members' | 'teams';

const profileCollapseDragConstraints = { top: -46, bottom: 0 } as const;

export function ChatList() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<MessageTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCollapsing, setIsCollapsing] = useState(false);
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const agentAvatar = getSelectedAvatarImage();

  useEffect(() => {
    let cancelled = false;

    void loadChatPreviews(activeTab).then((nextChats) => {
      if (!cancelled) setChats(nextChats);
    });

    return () => {
      cancelled = true;
    };
  }, [activeTab]);

  const filteredChats = useMemo(() => (
    chats.filter((chat) =>
      `${chat.name} ${chat.handle || ''} ${chat.lastMessage}`.toLowerCase().includes(searchQuery.toLowerCase()),
    )
  ), [chats, searchQuery]);

  const handleChatClick = (chat: ChatPreview) => {
    if (chat.type === 'agent') {
      navigate('/chat/agent');
      return;
    }

    if (chat.type === 'team') {
      navigate(`/chat/team/${chat.id}`, { state: { chat } });
      return;
    }

    navigate(`/chat/user/${chat.id}`, { state: { chat } });
  };

  const collapseToProfile = () => setIsCollapsing(true);

  const renderAvatar = (chat: ChatPreview) => {
    if (chat.type === 'agent') {
      return (
        <span className="relative block h-12 w-12">
          <motion.span
            className="absolute inset-0 rounded-full bg-cyan-300/40 blur-lg"
            animate={{ opacity: [0.25, 0.55, 0.25], scale: [0.95, 1.08, 0.95] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.span
            className="relative block h-12 w-12 overflow-hidden rounded-full border border-white/18 shadow-[0_0_24px_rgba(101,202,255,0.34)]"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            style={{
              maskImage: 'radial-gradient(circle at center, black 42%, transparent 90%)',
              WebkitMaskImage: 'radial-gradient(circle at center, black 42%, transparent 90%)',
            }}
          >
            <img src={agentAvatar} alt="Your Agent" className="h-full w-full object-cover opacity-90" />
          </motion.span>
        </span>
      );
    }

    if (chat.type === 'team') {
      return (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f18f31] text-black shadow-[0_0_24px_rgba(241,143,49,0.28)]">
          <Users className="h-6 w-6" />
        </div>
      );
    }

    return (
      <div className="relative h-12 w-12 overflow-hidden rounded-full bg-white/10">
        {chat.avatar && <img src={chat.avatar} alt={chat.name} className="h-full w-full object-cover" />}
        {chat.isOnline && <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-[#17191c] bg-[#5dea86]" />}
      </div>
    );
  };

  return (
    <motion.div
      animate={isCollapsing ? { y: '-72%', opacity: 0, scale: 0.96 } : { y: 0, opacity: 1, scale: 1 }}
      transition={{ duration: 0.28, ease: 'easeInOut' }}
      onAnimationComplete={() => {
        if (isCollapsing) navigate('/profile-screen');
      }}
      className="absolute inset-0 h-full w-full overflow-y-auto bg-[#07090c] text-white [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
    >
      <div className="pointer-events-none fixed inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_50%_0%,rgba(42,48,61,0.5),transparent_70%)]" />

      <div className="relative mx-auto min-h-full w-full max-w-md px-4 pb-28 pt-5">
        <div className="mb-5 flex h-7 items-center justify-between text-sm text-white">
          <span className="font-semibold">9:41</span>
          <div className="flex items-center gap-2">
            <div className="h-3 w-4 rounded-sm bg-white/80" />
            <div className="h-3 w-4 rounded-sm bg-white/80" />
            <div className="h-3 w-6 overflow-hidden rounded-sm bg-white/80">
              <div className="h-full w-3/4 bg-yellow-400" />
            </div>
          </div>
        </div>

        <header className="mx-auto mb-5 grid w-full max-w-[320px] grid-cols-[48px_minmax(0,1fr)_48px] items-center">
          <button
            type="button"
            onClick={() => navigate('/profile-screen')}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/8 bg-white/8 text-white transition-colors hover:bg-white/14"
            aria-label="Back to profile"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="min-w-0 text-center">
            <h1 className="text-lg font-black text-white">Messages</h1>
            <p className="mt-1 text-xs font-bold text-white/42">Agent, team, and members</p>
          </div>

          <span className="h-12 w-12" aria-hidden="true" />
        </header>

        <div className="mx-auto mb-6 grid w-[248px] grid-cols-3 rounded-full border border-white/8 bg-[#101215]/95 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_12px_36px_rgba(0,0,0,0.28)]">
          {[
            { id: 'all' as const, label: 'All' },
            { id: 'members' as const, label: 'Members' },
            { id: 'teams' as const, label: 'Teams' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-full px-3 py-2.5 text-xs font-black transition-colors ${
                activeTab === tab.id ? 'bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]' : 'text-white/70 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <label className="mb-4 flex min-h-[58px] items-center gap-3 rounded-full border border-white/8 bg-gradient-to-b from-[#1d2024] to-[#15171a] px-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
          <Search className="h-5 w-5 shrink-0 text-white/52" />
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Test text something..."
            className="min-w-0 flex-1 bg-transparent text-sm font-bold text-white outline-none placeholder:text-white/40"
          />
        </label>

        <div className="space-y-1.5">
          {filteredChats.map((chat, index) => (
            <motion.button
              key={chat.id}
              type="button"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              onClick={() => handleChatClick(chat)}
              className={`group flex min-h-[74px] w-full items-center gap-3 rounded-[1rem] border px-4 py-3 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-colors ${
                chat.type === 'agent'
                  ? 'border-white/10 bg-gradient-to-r from-[#202138] to-[#191b25]'
                  : 'border-white/7 bg-gradient-to-r from-[#202225] to-[#15171a] hover:bg-white/10'
              }`}
            >
              {renderAvatar(chat)}

              <span className="min-w-0 flex-1">
                <span className="mb-1 flex items-center justify-between gap-3">
                  <span className="truncate text-base font-black text-white">{chat.name}</span>
                  <span className="shrink-0 text-xs font-bold text-white/42">{chat.timestamp}</span>
                </span>
                <span className="block truncate text-sm font-semibold text-white/50">{chat.lastMessage}</span>
              </span>

              {chat.unreadCount ? (
                <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-[#df3f45] px-2 text-xs font-black text-white">
                  {chat.unreadCount}
                </span>
              ) : null}

              {chat.id === 'jack-nichols' && (
                <span className="ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-red-400/75 opacity-90">
                  <Trash2 className="h-4 w-4" />
                </span>
              )}
            </motion.button>
          ))}
        </div>
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-6 z-30 flex justify-center">
        <motion.button
          type="button"
          drag="y"
          dragConstraints={profileCollapseDragConstraints}
          dragElastic={0.18}
          onDragEnd={(_, info) => {
            if (info.offset.y < -14 || info.velocity.y < -260) {
              collapseToProfile();
            }
          }}
          onClick={collapseToProfile}
          whileTap={{ scale: 0.94 }}
          className="pointer-events-auto flex h-12 w-20 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white shadow-[0_18px_42px_rgba(0,0,0,0.42)] backdrop-blur transition-colors hover:bg-white/16"
          aria-label="Swipe up or click to collapse messages to profile"
        >
          <ChevronUp className="h-6 w-6" />
        </motion.button>
      </div>
    </motion.div>
  );
}
