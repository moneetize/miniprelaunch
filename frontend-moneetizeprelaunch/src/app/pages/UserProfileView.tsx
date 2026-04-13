import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, MoreHorizontal, Share2, Camera, UserPlus, MessageCircle } from 'lucide-react';
import gemIcon from 'figma:asset/296d8aa06fd9c7e60192bc7368a4a032ec5bc17e.png';
import exampleImage from 'figma:asset/89bac269bad2dedcf9a324c0699dd743958a38b9.png';

interface TeamMember {
  id: string;
  name: string;
  email?: string;
  points: number;
  avatar?: string;
  status: 'active' | 'pending';
  isCurrentUser?: boolean;
  handle?: string;
}

interface InventoryItem {
  id: string;
  name: string;
  icon: string;
  type: 'booster' | 'extender' | 'multiplier' | 'merchandise';
}

export function UserProfileView() {
  const navigate = useNavigate();
  const location = useLocation();
  const member = location.state?.member as TeamMember | undefined;
  
  const [activeTab, setActiveTab] = useState<'user-team' | 'invited-team' | 'inventory' | 'gameplay'>('inventory');
  const [isConnected, setIsConnected] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);

  // Default data if no member is passed
  const userName = member?.name || 'John Black';
  const userHandle = member?.handle || '@healthyhabits';
  const userPoints = member?.points || 30;
  const userAvatar = member?.avatar || 'https://images.unsplash.com/photo-1651684215020-f7a5b6610f23?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMG1hbGUlMjBidXNpbmVzc3xlbnwxfHx8fDE3NzQxMjU0OTl8MA&ixlib=rb-4.1.0&q=80&w=1080';

  // Mock inventory items
  const inventoryItems: InventoryItem[] = [
    { id: '1', name: 'Tripto Multiplier', icon: '📦', type: 'multiplier' },
    { id: '2', name: 'Shopping Spree Extender', icon: '📦', type: 'extender' },
    { id: '3', name: 'Team Sync Booster', icon: '📦', type: 'booster' },
    { id: '4', name: 'Founder\'s Grace', icon: '📦', type: 'booster' },
    { id: '5', name: 'Golden Window Extender', icon: '📦', type: 'extender' },
    { id: '6', name: 'Boost Amplifier', icon: '📦', type: 'booster' },
    { id: '7', name: 'Token Early Access', icon: '📦', type: 'booster' },
    { id: '8', name: 'Moneetize T-Shirt', icon: '👕', type: 'merchandise' },
  ];

  const handleConnect = () => {
    setIsConnected(!isConnected);
    setShowConnectModal(true);
    setTimeout(() => setShowConnectModal(false), 2000);
  };

  const handleShare = () => {
    // Share functionality
    if (navigator.share) {
      navigator.share({
        title: `${userName} on Moneetize`,
        text: `Check out ${userName}'s profile on Moneetize!`,
        url: window.location.href,
      }).catch(err => console.log('Share failed:', err));
    }
  };

  return (
    <div className="absolute inset-0 w-full h-full overflow-y-auto bg-[#0a0e1a]">
      {/* Status Bar */}
      <div className="absolute top-0 left-0 right-0 h-11 flex items-center justify-between px-4 sm:px-6 text-white text-sm z-50">
        <div className="flex items-center gap-2">
          <span className="font-semibold">9:41</span>
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
          </svg>
        </div>
        <div className="flex items-center gap-2">
          <svg className="w-4 h-3" fill="currentColor" viewBox="0 0 16 12">
            <rect width="14" height="10" x="1" y="1" rx="1.5" stroke="currentColor" fill="none" strokeWidth="1.5" />
            <rect width="3" height="3" x="2.5" y="3.5" rx="0.5" />
            <rect width="3" height="3" x="6.5" y="3.5" rx="0.5" />
            <rect width="3" height="3" x="10.5" y="3.5" rx="0.5" />
          </svg>
          <div className="flex items-center gap-0.5">
            <div className="w-1 h-1 rounded-full bg-yellow-400" />
            <div className="w-3.5 h-3.5 rounded-sm border-2 border-white flex items-center justify-center">
              <div className="w-full h-2 bg-yellow-400 rounded-sm" />
            </div>
          </div>
        </div>
      </div>

      <div className="pt-11 pb-6 px-4 max-w-md mx-auto">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-b from-[#1a1d2e] to-[#0f1318] rounded-3xl p-6 mb-4 relative overflow-hidden border border-white/5"
        >
          {/* Top Icons */}
          <div className="flex items-center justify-between mb-6">
            <button 
              onClick={() => navigate(-1)}
              className="w-12 h-12 rounded-full bg-[#2a2d3e] flex items-center justify-center hover:bg-[#35384a] transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
            <button className="w-12 h-12 rounded-full bg-[#2a2d3e] flex items-center justify-center hover:bg-[#35384a] transition-colors">
              <MoreHorizontal className="w-6 h-6 text-white" />
            </button>
          </div>

          {/* Profile Photo with Rookie Badge */}
          <div className="flex justify-center mb-4">
            <div className="relative">
              {/* Orange ring */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-b from-orange-400 to-orange-600 p-1 -m-1">
                <div className="w-full h-full rounded-full bg-[#1a1d2e]" />
              </div>
              
              {/* Profile photo */}
              <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-[#1a1d2e]">
                <img 
                  src={userAvatar} 
                  alt={userName}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Rookie Badge */}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-1 rounded-full border-2 border-[#1a1d2e]">
                <span className="text-white text-xs font-bold">Rookie</span>
              </div>
            </div>
          </div>

          {/* Action Icons */}
          <div className="flex items-center justify-center gap-3 mb-4 mt-6">
            <button 
              onClick={handleShare}
              className="w-10 h-10 rounded-full bg-[#2a2d3e] flex items-center justify-center hover:bg-[#35384a] transition-colors"
            >
              <Share2 className="w-4 h-4 text-white" />
            </button>
            <button className="w-10 h-10 rounded-full bg-[#2a2d3e] flex items-center justify-center hover:bg-[#35384a] transition-colors">
              <Camera className="w-4 h-4 text-white" />
            </button>
            <button 
              onClick={handleConnect}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                isConnected 
                  ? 'bg-emerald-500 hover:bg-emerald-600' 
                  : 'bg-[#2a2d3e] hover:bg-[#35384a]'
              }`}
            >
              <UserPlus className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Name and Points */}
          <div className="text-center mb-2">
            <div className="flex items-center justify-center gap-2 mb-1">
              <h2 className="text-white text-xl font-bold">{userName}</h2>
              <div className="flex items-center gap-1">
                <img src={gemIcon} alt="Gem" className="w-5 h-5" />
                <span className="text-emerald-400 font-bold">{userPoints}</span>
              </div>
              <button className="text-gray-400 hover:text-white">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" strokeWidth="2" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 16v-4m0-4h.01" />
                </svg>
              </button>
            </div>
            <p className="text-gray-400 text-sm">{userHandle}</p>
          </div>
        </motion.div>

        {/* Tab Navigation - Hidden for user profile views */}
        {/* Removed tab navigation to provide cleaner profile viewing experience */}

        {/* Inventory Tab - Default View */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-3 gap-4"
        >
          {inventoryItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="flex flex-col items-center"
            >
              {/* Item Icon */}
              <div className="w-full aspect-square bg-gradient-to-b from-[#2a2d5e] via-[#1a1d3e] to-[#0f1318] rounded-2xl mb-2 flex items-center justify-center border border-purple-500/20 relative overflow-hidden">
                {item.type === 'merchandise' ? (
                  <div className="text-5xl">👕</div>
                ) : (
                  <>
                    {/* Purple box design */}
                    <div className="absolute inset-4 bg-gradient-to-br from-purple-600/40 to-purple-900/40 rounded-xl border-t-4 border-purple-400/60" />
                    <div className="absolute bottom-4 left-4 right-4 h-3 bg-purple-900/60 rounded-b-xl" />
                  </>
                )}
              </div>
              
              {/* Item Name */}
              <p className="text-white text-xs text-center font-medium leading-tight">
                {item.name}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Connection Success Modal */}
      <AnimatePresence>
        {showConnectModal && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-6 py-3 rounded-full shadow-2xl z-50"
          >
            <p className="font-semibold">
              {isConnected ? `Connected with ${userName}!` : `Disconnected from ${userName}`}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}