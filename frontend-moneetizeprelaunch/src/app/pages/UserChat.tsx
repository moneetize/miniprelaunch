import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft, Mic, Send, Heart, ThumbsUp, Fire, Smile } from 'lucide-react';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: string;
  hasCard?: boolean;
  cardImage?: string;
  buttons?: { label: string; action: string }[];
  reactions?: string[];
  isTeamUpdate?: boolean;
  updateIcon?: string;
  updateTitle?: string;
  updateDescription?: string;
}

export function UserChat() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const chat = location.state?.chat;
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isGroup = chat?.type === 'group' || chat?.type === 'team';
  const chatName = chat?.name || 'Chat';
  const chatHandle = chat?.handle || '';
  const chatAvatar = chat?.avatar;

  const [messages, setMessages] = useState<Message[]>([
    ...(isGroup && chat?.type === 'team'
      ? [
          {
            id: 'team-update-1',
            senderId: 'system',
            senderName: 'System',
            content: "Jim just earned 30 points today towards your team challenge! You're getting closer to your goal — keep up the great work!",
            timestamp: '10:04 AM',
            isTeamUpdate: true,
            updateIcon: '🏆',
            updateTitle: 'Team Update!',
            updateDescription: "Jim just earned 30 points today towards your team challenge! You're getting closer to your goal — keep up the great work!",
            buttons: [{ label: 'Check Progress', action: 'progress' }],
          },
        ]
      : []),
    {
      id: '1',
      senderId: isGroup ? 'user-olivia' : 'other-user',
      senderName: 'Olivia Bennett',
      senderAvatar: 'https://images.unsplash.com/photo-1769636929132-e4e7b50cfac0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMGZlbWFsZSUyMGJ1c2luZXNzfGVufDF8fHx8MTc3NDEyNTQ5OXww&ixlib=rb-4.1.0&q=80&w=1080',
      content: "Hey, everyone! I just found this product and thought you'd like it. Tap the image to check it out and add it to your portfolio!",
      timestamp: '10:04 AM',
      hasCard: true,
      buttons: [{ label: 'Join', action: 'join' }],
      reactions: ['❤️'],
    },
    ...(isGroup
      ? [
          {
            id: '2',
            senderId: 'user-jack',
            senderName: 'Jack Nichols',
            senderAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
            content: "I just took this survey, and I'd love to hear your thoughts too! Tap the link to share your insights and earn points for participating!",
            timestamp: '10:04 AM',
            hasCard: true,
          },
        ]
      : []),
    {
      id: '3',
      senderId: 'current-user',
      senderName: 'You',
      content: "I just took this survey, and I'd love to hear your thoughts too! Tap the link to share your insights and earn points for participating!",
      timestamp: '10:02 AM',
      hasCard: true,
      reactions: ['😊', '❤️', '🔥', '😄'],
    },
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Simulate typing indicator
    if (isGroup) {
      setTimeout(() => setIsTyping(true), 2000);
      setTimeout(() => setIsTyping(false), 5000);
    }
  }, [isGroup]);

  const handleSend = () => {
    if (inputValue.trim()) {
      const newMessage: Message = {
        id: Date.now().toString(),
        senderId: 'current-user',
        senderName: 'You',
        content: inputValue,
        timestamp: new Date().toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
        }),
      };
      setMessages([...messages, newMessage]);
      setInputValue('');
    }
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
        <div className="text-center">
          <h1 className="text-white text-lg font-semibold">{chatName}</h1>
          {chatHandle && <p className="text-gray-400 text-xs">{chatHandle}</p>}
        </div>
        <div>
          {typeof chatAvatar === 'string' && chatAvatar.startsWith('http') ? (
            <img src={chatAvatar} alt={chatName} className="w-12 h-12 rounded-full object-cover" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-2xl">
              {chatAvatar}
            </div>
          )}
        </div>
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
            className="space-y-2"
          >
            {/* Team Update Card */}
            {message.isTeamUpdate && (
              <div className="bg-gradient-to-br from-[#2a2d3e] to-[#1a1d2e] rounded-2xl p-6 text-center border border-white/10">
                <div className="text-5xl mb-3">{message.updateIcon}</div>
                <h3 className="text-white font-bold text-lg mb-2">{message.updateTitle}</h3>
                <p className="text-gray-400 text-sm mb-4 leading-relaxed">
                  {message.updateDescription}
                </p>
                {message.buttons && (
                  <button className="w-full bg-white text-black py-3 rounded-full font-semibold text-sm hover:bg-gray-100 transition-colors">
                    {message.buttons[0].label}
                  </button>
                )}
              </div>
            )}

            {/* Regular Messages */}
            {!message.isTeamUpdate && (
              <div className={`flex gap-3 ${message.senderId === 'current-user' ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar (for group chats) */}
                {isGroup && message.senderId !== 'current-user' && message.senderAvatar && (
                  <img
                    src={message.senderAvatar}
                    alt={message.senderName}
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                  />
                )}

                <div className={`flex-1 max-w-[75%] ${message.senderId === 'current-user' ? 'items-end' : 'items-start'} flex flex-col`}>
                  {/* Sender Name (for group chats) */}
                  {isGroup && message.senderId !== 'current-user' && (
                    <span className="text-emerald-400 text-xs font-semibold mb-1 px-2">
                      {message.senderName}
                    </span>
                  )}

                  {/* Message Bubble */}
                  <div
                    className={`rounded-2xl p-4 ${
                      message.senderId === 'current-user'
                        ? 'bg-white text-black rounded-br-sm'
                        : 'bg-gradient-to-br from-[#2a2d3e] to-[#1a1d2e] text-white rounded-bl-sm'
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>

                    {/* Card Image */}
                    {message.hasCard && (
                      <div className="mt-3 bg-[#3a3d4e] rounded-xl h-32 flex items-center justify-center">
                        <span className="text-gray-600 text-sm">Card Content</span>
                      </div>
                    )}

                    {/* Buttons */}
                    {message.buttons && (
                      <button className="w-full mt-3 bg-white text-black py-2.5 rounded-full font-semibold text-sm hover:bg-gray-100 transition-colors">
                        {message.buttons[0].label}
                      </button>
                    )}
                  </div>

                  {/* Reactions */}
                  {message.reactions && message.reactions.length > 0 && (
                    <div className={`flex items-center gap-1 mt-1 ${message.senderId === 'current-user' ? 'justify-end' : 'justify-start'}`}>
                      {message.reactions.map((reaction, idx) => (
                        <div
                          key={idx}
                          className="w-7 h-7 rounded-full bg-[#1a1d2e] border border-white/10 flex items-center justify-center text-sm"
                        >
                          {reaction}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Timestamp */}
                  <div className={`mt-1 px-2 flex items-center gap-2 ${message.senderId === 'current-user' ? 'justify-end' : 'justify-start'}`}>
                    <span className="text-gray-500 text-xs">{message.timestamp}</span>
                    {message.senderId === 'current-user' && (
                      <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2"
          >
            <div className="flex gap-1">
              <img
                src="https://images.unsplash.com/photo-1769636929132-e4e7b50cfac0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMGZlbWFsZSUyMGJ1c2luZXNzfGVufDF8fHx8MTc3NDEyNTQ5OXww&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Olivia"
                className="w-6 h-6 rounded-full object-cover"
              />
              <img
                src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop"
                alt="Jack"
                className="w-6 h-6 rounded-full object-cover -ml-2"
              />
            </div>
            <span className="text-gray-400 text-xs">Olivia, Jack are typing...</span>
          </motion.div>
        )}

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
