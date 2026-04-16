import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
import { motion } from 'motion/react';
import { ChevronLeft, Check, Paperclip, Send, Users } from 'lucide-react';
import { teamChatPreview, type ChatPreview } from '../utils/chatData';
import { createCurrentUserMessage, getChatPreviewById, getThreadId, loadThreadMessages, sendThreadMessage, type ChatMessage } from '../services/chatService';

function createFallbackMemberChat(id?: string): ChatPreview {
  return {
    id: id || 'member',
    type: 'member',
    name: 'Member',
    handle: '',
    lastMessage: 'Start a message.',
    timestamp: '',
  };
}

export function UserChat() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const routeChat = location.state?.chat as ChatPreview | undefined;
  const isTeamRoute = location.pathname.includes('/chat/team/');
  const fallbackChat = routeChat || (isTeamRoute ? teamChatPreview : createFallbackMemberChat(id));
  const [chat, setChat] = useState<ChatPreview>(fallbackChat);
  const isTeamChat = chat.type === 'team';
  const [inputValue, setInputValue] = useState('');
  const threadId = useMemo(() => getThreadId(chat), [chat]);

  useEffect(() => {
    let cancelled = false;

    void getChatPreviewById(id, isTeamRoute).then((nextChat) => {
      if (!cancelled) setChat(nextChat);
    });

    return () => {
      cancelled = true;
    };
  }, [id, isTeamRoute]);

  const baseMessages = useMemo<ChatMessage[]>(() => [], [threadId]);

  const [messages, setMessages] = useState<ChatMessage[]>(baseMessages);

  useEffect(() => {
    let cancelled = false;

    void loadThreadMessages(threadId, baseMessages).then((threadMessages) => {
      if (!cancelled) setMessages(threadMessages);
    });

    return () => {
      cancelled = true;
    };
  }, [baseMessages, threadId]);

  const handleSend = () => {
    const trimmedMessage = inputValue.trim();
    if (!trimmedMessage) return;

    const nextMessage = createCurrentUserMessage(trimmedMessage);
    const nextMessages = [...messages, nextMessage];
    setMessages(nextMessages);
    setInputValue('');
    void sendThreadMessage(threadId, nextMessage, chat).then(setMessages);
  };

  const renderHeaderAvatar = () => {
    if (isTeamChat) {
      return (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f18f31] text-black shadow-[0_0_24px_rgba(241,143,49,0.28)]">
          <Users className="h-6 w-6" />
        </div>
      );
    }

    return (
      <div className="relative h-12 w-12 overflow-hidden rounded-full bg-white/10">
        {chat.avatar && <img src={chat.avatar} alt={chat.name} className="h-full w-full object-cover" />}
        <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-[#07090c] bg-[#5dea86]" />
      </div>
    );
  };

  const renderMessage = (message: ChatMessage) => {
    const currentUserId = localStorage.getItem('user_id') || 'current-user';
    const isCurrentUser = message.role === 'user' || message.senderId === currentUserId || message.senderId === 'current-user';
    const showSender = isTeamChat && !isCurrentUser;

    return (
      <motion.div
        key={message.id}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex items-start gap-2 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
      >
        {showSender && (
          <img src={message.senderAvatar} alt={message.senderName} className="mt-1 h-7 w-7 shrink-0 rounded-full object-cover" />
        )}

        <div className={`${isCurrentUser ? 'max-w-[72%]' : isTeamChat ? 'max-w-[78%]' : 'max-w-[74%]'}`}>
          <div
            className={`rounded-[1.15rem] px-4 py-3 text-sm font-bold leading-relaxed shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_12px_28px_rgba(0,0,0,0.22)] ${
              isCurrentUser
                ? 'rounded-br-[0.35rem] bg-[#25272b] text-white'
                : 'rounded-bl-[0.35rem] bg-[#25272b] text-white'
            }`}
          >
            {showSender && <p className="mb-1 text-xs font-black text-[#7eea91]">{message.senderName}</p>}
            <p>{message.content}</p>

            {message.hasCard && <div className="mt-4 h-28 rounded-[0.7rem] bg-[#3a3d40]" />}

            {message.hasJoinButton && (
              <button
                type="button"
                className="mt-3 w-full rounded-full bg-white py-2.5 text-xs font-black text-black transition-colors hover:bg-gray-100"
              >
                Join
              </button>
            )}
          </div>

          <div className={`mt-2 flex items-center gap-1.5 text-xs font-bold text-white/38 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
            <span>{message.timestamp}</span>
            {isCurrentUser && <Check className="h-3.5 w-3.5 text-[#6bd886]" />}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="absolute inset-0 flex h-full w-full flex-col overflow-hidden bg-[#07090c] text-white">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-44 bg-[radial-gradient(circle_at_50%_0%,rgba(42,48,61,0.48),transparent_72%)]" />

      <div className="relative z-10 flex h-7 shrink-0 items-center justify-between px-4 pt-5 text-sm text-white">
        <span className="font-semibold">9:41</span>
        <div className="flex items-center gap-2">
          <div className="h-3 w-4 rounded-sm bg-white/80" />
          <div className="h-3 w-4 rounded-sm bg-white/80" />
          <div className="h-3 w-6 overflow-hidden rounded-sm bg-white/80">
            <div className="h-full w-3/4 bg-yellow-400" />
          </div>
        </div>
      </div>

      <header className="relative z-10 mx-auto grid w-full max-w-[340px] shrink-0 grid-cols-[48px_minmax(0,1fr)_48px] items-center pb-5 pt-8">
        <button
          type="button"
          onClick={() => navigate('/chat-list')}
          className="flex h-12 w-12 items-center justify-center rounded-full border border-white/8 bg-white/8 text-white transition-colors hover:bg-white/14"
          aria-label="Back to messages"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="text-center">
          <h1 className="text-lg font-black text-white">{isTeamChat ? 'My team' : chat.name}</h1>
          {(isTeamChat ? chat.handle : chat.handle) && (
            <p className="mt-1 rounded-full bg-white/8 px-3 py-1 text-xs font-bold text-white/45">{chat.handle}</p>
          )}
        </div>

        <span className="relative h-12 w-12 shrink-0 justify-self-end">
          {renderHeaderAvatar()}
        </span>
      </header>

      <main className="relative z-10 flex-1 overflow-y-auto px-4 pb-28 pt-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <p className="mb-4 text-center text-xs font-bold text-white/42">Today</p>

        {messages.length ? (
          <div className="space-y-4">{messages.map(renderMessage)}</div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto mt-8 max-w-[320px] rounded-[1.2rem] border border-white/8 bg-white/6 px-5 py-5 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
          >
            <p className="text-base font-black text-white">{isTeamChat ? 'Start the team chat' : `Message ${chat.name}`}</p>
            <p className="mt-2 text-sm font-semibold leading-relaxed text-white/52">
              {isTeamChat ? 'Messages you send here are saved to your team thread.' : 'Send the first message when you are ready.'}
            </p>
          </motion.div>
        )}
      </main>

      <footer className="fixed inset-x-0 bottom-0 z-20 mx-auto flex w-full max-w-md items-center gap-3 bg-gradient-to-t from-[#07090c] via-[#07090c]/95 to-transparent px-4 pb-5 pt-8">
        <label className="flex min-h-[52px] flex-1 items-center gap-3 rounded-full border border-white/8 bg-white/8 px-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
          <input
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && handleSend()}
            placeholder={isTeamChat ? 'Message your team...' : 'Type a message...'}
            className="min-w-0 flex-1 bg-transparent text-sm font-bold text-white outline-none placeholder:text-white/42"
          />
          {!isTeamChat && <Paperclip className="h-5 w-5 text-white/42" />}
        </label>
        <button
          type="button"
          onClick={handleSend}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-black transition-colors hover:bg-gray-100 disabled:bg-white/8 disabled:text-white/38"
          disabled={!inputValue.trim()}
          aria-label="Send message"
        >
          <Send className="h-5 w-5" />
        </button>
      </footer>
    </div>
  );
}
