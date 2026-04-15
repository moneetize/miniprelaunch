import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { ChevronLeft, Headphones, Send } from 'lucide-react';
import { getSelectedAvatarImage } from '../utils/avatarUtils';
import { agentChatPreview } from '../utils/chatData';
import {
  createCurrentUserMessage,
  getThreadId,
  loadThreadMessages,
  saveLocalThreadMessages,
  sendAgentChatMessage,
  type ChatMessage,
} from '../services/chatService';

type AgentButton = { label: string; response: string };
type AgentUiMessage = ChatMessage & {
  isAlert?: boolean;
  buttons?: AgentButton[];
};

const createInitialAgentMessages = (): AgentUiMessage[] => {
  const createdAt = new Date().toISOString();

  return [
    {
      id: 'boost-income',
      senderId: 'agent',
      senderName: 'Your Agent',
      content: 'Triple Your Earnings: Invest $15 & Boost Income by 300%!',
      timestamp: '10:00 AM',
      createdAt,
      role: 'agent',
      buttons: [{ label: 'Boost Your Income', response: 'Help me think through safer ways to boost income.' }],
    },
    {
      id: 'action-needed',
      senderId: 'agent',
      senderName: 'Your Agent',
      content: 'A product in your portfolio is now outside your investment range. We recommend reviewing it against your goals before making a decision.',
      timestamp: '10:00 AM',
      createdAt,
      role: 'agent',
      isAlert: true,
      buttons: [
        { label: 'Keep', response: 'Help me evaluate whether keeping this still fits my risk profile.' },
        { label: 'Sell', response: 'Help me understand what to consider before selling.' },
      ],
    },
  ];
};

export function AgentChat() {
  const navigate = useNavigate();
  const threadId = useMemo(() => getThreadId(agentChatPreview), []);
  const [messages, setMessages] = useState<AgentUiMessage[]>(() => createInitialAgentMessages());
  const [inputValue, setInputValue] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const agentAvatar = getSelectedAvatarImage();

  useEffect(() => {
    let cancelled = false;
    const fallbackMessages = createInitialAgentMessages();

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

    const userMessage = createCurrentUserMessage(trimmedMessage);
    const nextMessages = [...messages, userMessage] as AgentUiMessage[];
    setMessages(nextMessages);
    saveLocalThreadMessages(threadId, nextMessages);
    setInputValue('');
    setIsThinking(true);

    const responseMessages = await sendAgentChatMessage(threadId, nextMessages, trimmedMessage);
    setMessages(responseMessages as AgentUiMessage[]);
    setIsThinking(false);
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
          <h1 className="text-lg font-black text-white">Your Agent</h1>
          <p className="mt-1 text-[11px] font-bold text-white/42">Education only, not financial advice</p>
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
            <img src={agentAvatar} alt="Your Agent" className="h-full w-full object-cover opacity-90" />
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
                  <p>
                    {message.isAlert && <span className="text-[#df555a]">Action Needed! </span>}
                    {message.content}
                  </p>

                  {!isUserMessage && <div className="mt-5 h-40 rounded-[0.7rem] bg-[#3a3d40]" />}

                  {message.buttons && (
                    <div className={`mt-3 grid gap-2 ${message.buttons.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                      {message.buttons.map((button) => (
                        <button
                          key={button.label}
                          type="button"
                          onClick={() => void handleSend(button.response)}
                          className="rounded-full bg-white px-4 py-3 text-xs font-black text-black shadow-[0_10px_22px_rgba(255,255,255,0.12)] transition-colors hover:bg-gray-100"
                        >
                          {button.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <p className="mt-2 text-right text-xs font-bold text-white/36">{message.timestamp}</p>

                {message.isAlert && (
                  <div className="mt-3 flex justify-center">
                    <button
                      type="button"
                      className="flex items-center justify-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-black text-black shadow-[0_16px_38px_rgba(0,0,0,0.34)] transition-colors hover:bg-gray-100"
                    >
                      Contact support
                      <Headphones className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </motion.article>
            );
          })}

          {isThinking && (
            <motion.article
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-auto max-w-[390px] rounded-[1.2rem] bg-[#25272b] px-4 py-4 text-sm font-bold text-white/62"
            >
              Your agent is thinking...
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
            placeholder="Ask about goals, risk, markets..."
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
