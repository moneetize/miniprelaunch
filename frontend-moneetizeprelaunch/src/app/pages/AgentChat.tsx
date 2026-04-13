import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Mic, Send } from 'lucide-react';

interface Message {
  id: string;
  type: 'agent' | 'user';
  content: string;
  timestamp: string;
  hasCard?: boolean;
  cardImage?: string;
  buttons?: { label: string; action: string }[];
  isAlert?: boolean;
}

export function AgentChat() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'agent',
      content: 'Triple Your Earnings: Invest $15 & Boost Income by 300%!',
      timestamp: '10:00 AM',
      hasCard: true,
      buttons: [{ label: 'Boost Your Income', action: 'boost' }],
    },
    {
      id: '2',
      type: 'agent',
      content: 'Action Needed! A product in your portfolio, is now outside your investment range. We recommend selling to stay aligned with your profile.',
      timestamp: '10:00 AM',
      hasCard: true,
      buttons: [
        { label: 'Keep', action: 'keep' },
        { label: 'Sell', action: 'sell' },
      ],
      isAlert: true,
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (inputValue.trim()) {
      const newMessage: Message = {
        id: Date.now().toString(),
        type: 'user',
        content: inputValue,
        timestamp: new Date().toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
        }),
      };
      setMessages([...messages, newMessage]);
      setInputValue('');

      // Simulate agent response
      setTimeout(() => {
        const agentResponse: Message = {
          id: (Date.now() + 1).toString(),
          type: 'agent',
          content: "I'm here to help you maximize your earnings! Would you like to explore more investment opportunities?",
          timestamp: new Date().toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
          }),
        };
        setMessages(prev => [...prev, agentResponse]);
      }, 1000);
    }
  };

  const handleButtonClick = (action: string) => {
    console.log('Button clicked:', action);
    // Handle button actions here
  };

  return (
    <div className="absolute inset-0 w-full h-full flex flex-col bg-[#0a0e1a]">
      {/* Status Bar */}
      <div className="h-11 flex items-center justify-between px-4 text-white text-sm flex-shrink-0">
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
          <div className="w-6 h-3 bg-white/80 rounded-sm relative overflow-hidden">
            <div className="absolute inset-0 bg-yellow-400 w-3/4" />
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-white/5 flex-shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-[#1a1d2e] flex items-center justify-center hover:bg-[#252837] transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="text-white text-lg font-semibold">Your Agent</h1>
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500 animate-pulse" />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {/* Today Label */}
        <div className="text-center">
          <span className="text-gray-500 text-xs">Today</span>
        </div>

        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
              {/* Message Bubble */}
              <div
                className={`rounded-2xl p-4 ${
                  message.type === 'agent'
                    ? 'bg-gradient-to-br from-[#2a2d3e] to-[#1a1d2e] text-white'
                    : 'bg-white text-black ml-auto'
                }`}
              >
                {message.isAlert && (
                  <span className="text-red-400 font-semibold">Action Needed! </span>
                )}
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>

                {/* Card Image */}
                {message.hasCard && (
                  <div className="mt-4 bg-[#3a3d4e] rounded-xl h-40 flex items-center justify-center">
                    <span className="text-gray-600 text-sm">Card Content</span>
                  </div>
                )}

                {/* Action Buttons */}
                {message.buttons && message.buttons.length > 0 && (
                  <div className={`mt-4 flex gap-2 ${message.buttons.length === 1 ? 'flex-col' : 'flex-row'}`}>
                    {message.buttons.map((button, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleButtonClick(button.action)}
                        className={`flex-1 py-3 rounded-full font-semibold text-sm transition-all ${
                          message.buttons!.length === 1
                            ? 'bg-white text-black hover:bg-gray-100'
                            : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                      >
                        {button.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Timestamp */}
              <div className={`mt-1 px-2 flex items-center gap-2 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <span className="text-gray-500 text-xs">{message.timestamp}</span>
                {message.type === 'user' && (
                  <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>

              {/* Contact Support Button (for alert messages) */}
              {message.isAlert && (
                <button
                  className="w-full mt-4 bg-white text-black py-3 rounded-full font-semibold text-sm flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors"
                >
                  Contact support
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </button>
              )}
            </div>
          </motion.div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-4 border-t border-white/5 bg-[#0a0e1a] flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-[#1a1d2e] rounded-full px-4 py-3 flex items-center gap-3">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type a message..."
              className="flex-1 bg-transparent text-white outline-none placeholder-gray-500 text-sm"
            />
            <button className="text-gray-400 hover:text-white transition-colors">
              <Mic className="w-5 h-5" />
            </button>
          </div>
          <button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className="w-12 h-12 rounded-full bg-white flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5 text-black" />
          </button>
        </div>
      </div>
    </div>
  );
}
