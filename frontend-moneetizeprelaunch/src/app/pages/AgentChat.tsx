import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { ChevronLeft, Send } from 'lucide-react';
import { getSelectedAvatarImage } from '../utils/avatarUtils';
import { agentChatPreview } from '../utils/chatData';
import { getStoredProfileSettings } from '../utils/profileSettings';
import {
  createCurrentUserMessage,
  clearLegacyAgentChat,
  getThreadId,
  loadThreadMessages,
  saveLocalThreadMessages,
  sendAgentChatMessage,
  type ChatMessage,
} from '../services/chatService';

type AgentUiMessage = ChatMessage;

const createInitialAgentMessages = (): AgentUiMessage[] => [];

export function AgentChat() {
  const navigate = useNavigate();
  const threadId = useMemo(() => getThreadId(agentChatPreview), []);
  const [messages, setMessages] = useState<AgentUiMessage[]>(() => createInitialAgentMessages());
  const [inputValue, setInputValue] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [chatError, setChatError] = useState('');
  const agentAvatar = getSelectedAvatarImage();
  const agentName = getStoredProfileSettings().agentName || 'Your Agent';

  useEffect(() => {
    let cancelled = false;
    const fallbackMessages = createInitialAgentMessages();

    clearLegacyAgentChat(threadId);

    void loadThreadMessages(threadId, fallbackMessages).then((threadMessages) => {
      if (!cancelled) setMessages(threadMessages as AgentUiMessage[]);
    });

    return () => {
      cancelled = true;
    };
  }, [threadId]);

  const handleSend = async (overrideMessage?: string) => {
    const trimmedMessage = (overrideMessage || inputValue).trim();
    if (!trimmedMessage || isThinking) return;

    setChatError('');
    const userMessage = createCurrentUserMessage(trimmedMessage);
    const nextMessages = [...messages, userMessage] as AgentUiMessage[];
    setMessages(nextMessages);
    saveLocalThreadMessages(threadId, nextMessages);
    setInputValue('');
    setIsThinking(true);

    try {
      const responseMessages = await sendAgentChatMessage(threadId, nextMessages, trimmedMessage);
      setMessages(responseMessages as AgentUiMessage[]);
    } catch (error) {
      setChatError(error instanceof Error ? error.message : 'Agent chat failed.');
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="absolute inset-0 flex h-full w-full flex-col overflow-hidden bg-[#07090c] text-white">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_50%_0%,rgba(42,48,61,0.24),transparent_74%)]" />

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
          <h1 className="text-lg font-black text-white">{agentName}</h1>
          <p className="mt-1 text-[11px] font-bold text-white/42">Ask anything</p>
        </div>

        <span className="relative block h-12 w-12 justify-self-end">
          <motion.span
            className="absolute inset-0 rounded-full bg-cyan-300/40 blur-lg"
            animate={{ opacity: [0.28, 0.58, 0.28], scale: [0.95, 1.08, 0.95] }}
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
            <img src={agentAvatar} alt={agentName} className="h-full w-full object-cover opacity-90" />
          </motion.span>
        </span>
      </header>

      <main className="relative z-10 flex-1 overflow-y-auto px-4 pb-28 pt-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <p className="mb-4 text-center text-xs font-bold text-white/42">Today</p>

        <div className="space-y-5">
          {messages.map((message) => {
            const isUserMessage = message.role === 'user' || message.senderId === localStorage.getItem('user_id');

            return (
              <motion.article
                key={message.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className={`max-w-[390px] ${isUserMessage ? 'ml-auto' : 'ml-auto mr-auto'}`}
              >
                <div
                  className={`rounded-[1.2rem] px-4 py-4 text-sm font-bold leading-relaxed text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_12px_34px_rgba(0,0,0,0.34)] ${
                    isUserMessage ? 'rounded-br-[0.35rem] bg-[#1d3930]' : 'bg-[#25272b]'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
                <p className="mt-2 text-right text-xs font-bold text-white/36">{message.timestamp}</p>
              </motion.article>
            );
          })}

          {isThinking && (
            <motion.article
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-auto max-w-[390px] rounded-[1.2rem] bg-[#25272b] px-4 py-4 text-sm font-bold text-white/62"
            >
              {agentName} is thinking...
            </motion.article>
          )}

          {chatError && (
            <motion.article
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-auto max-w-[390px] rounded-[1.2rem] border border-red-300/20 bg-red-500/10 px-4 py-4 text-sm font-bold text-red-100"
            >
              {chatError}
            </motion.article>
          )}
        </div>
      </main>

      <footer className="fixed inset-x-0 bottom-0 z-20 mx-auto flex w-full max-w-md items-center gap-3 bg-gradient-to-t from-[#07090c] via-[#07090c]/95 to-transparent px-4 pb-5 pt-8">
        <label className="flex min-h-[52px] flex-1 items-center rounded-full border border-white/8 bg-white/8 px-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
          <input
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && void handleSend()}
            placeholder="Message your agent..."
            className="min-w-0 flex-1 bg-transparent text-sm font-bold text-white outline-none placeholder:text-white/42"
          />
        </label>
        <button
          type="button"
          onClick={() => void handleSend()}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-black transition-colors hover:bg-gray-100 disabled:opacity-50"
          disabled={!inputValue.trim() || isThinking}
          aria-label="Send message"
        >
          <Send className="h-5 w-5" />
        </button>
      </footer>
    </div>
  );
}
