import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft, UserPlus, UserCheck, MessageCircle } from 'lucide-react';
import { safeGetItem } from '../utils/storage';
import { getSelectedAvatarImage } from '../utils/avatarUtils';
import { getUserPoints } from '../utils/pointsManager';
import gemIcon from 'figma:asset/296d8aa06fd9c7e60192bc7368a4a032ec5bc17e.png';

interface User {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  isFollowing: boolean;
  isVerified?: boolean;
  bio?: string;
}

export function FollowListsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialTab = (location.state?.tab as 'following' | 'followers') || 'followers';
  const [activeTab, setActiveTab] = useState<'following' | 'followers'>(initialTab);
  const [userName, setUserName] = useState('');
  const [userPhoto, setUserPhoto] = useState<string>('');
  const [balance, setBalance] = useState(0);

  // Load user data on mount
  useEffect(() => {
    const storedName = safeGetItem('userName') || 'User';
    const storedPhoto = safeGetItem('userPhoto') || '';
    const points = getUserPoints();
    const avatar = getSelectedAvatarImage();

    setUserName(storedName);
    setUserPhoto(storedPhoto || avatar);
    setBalance(points);
  }, []);

  // Mock data for followers
  const [followers, setFollowers] = useState<User[]>([
    {
      id: '1',
      name: 'Sarah Johnson',
      handle: '@sarahjay',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
      isFollowing: true,
      isVerified: true,
      bio: 'Digital creator & lifestyle enthusiast',
    },
    {
      id: '2',
      name: 'Mike Chen',
      handle: '@mikechen',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
      isFollowing: false,
      bio: 'Tech enthusiast | Coffee lover',
    },
    {
      id: '3',
      name: 'Emma Wilson',
      handle: '@emmawilson',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
      isFollowing: true,
      isVerified: true,
      bio: 'Photographer & traveler',
    },
    {
      id: '4',
      name: 'Alex Rodriguez',
      handle: '@alexr',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
      isFollowing: false,
      bio: 'Fitness coach | Motivational speaker',
    },
    {
      id: '5',
      name: 'Olivia Bennett',
      handle: '@missdo90',
      avatar: 'https://images.unsplash.com/photo-1769636929132-e4e7b50cfac0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMGZlbWFsZSUyMGJ1c2luZXNzfGVufDF8fHx8MTc3NDEyNTQ5OXww&ixlib=rb-4.1.0&q=80&w=1080',
      isFollowing: true,
      bio: 'Entrepreneur | Investor',
    },
    {
      id: '6',
      name: 'David Kim',
      handle: '@davidkim',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
      isFollowing: false,
      bio: 'Designer & artist',
    },
    {
      id: '7',
      name: 'Jessica Martinez',
      handle: '@jessicam',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop',
      isFollowing: true,
      isVerified: true,
      bio: 'Music lover | Content creator',
    },
    {
      id: '8',
      name: 'Ryan Thompson',
      handle: '@ryant',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop',
      isFollowing: false,
      bio: 'Gamer | Streamer',
    },
  ]);

  // Mock data for following
  const [following, setFollowing] = useState<User[]>([
    {
      id: '1',
      name: 'Sarah Johnson',
      handle: '@sarahjay',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
      isFollowing: true,
      isVerified: true,
      bio: 'Digital creator & lifestyle enthusiast',
    },
    {
      id: '3',
      name: 'Emma Wilson',
      handle: '@emmawilson',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
      isFollowing: true,
      isVerified: true,
      bio: 'Photographer & traveler',
    },
    {
      id: '5',
      name: 'Olivia Bennett',
      handle: '@missdo90',
      avatar: 'https://images.unsplash.com/photo-1769636929132-e4e7b50cfac0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMGZlbWFsZSUyMGJ1c2luZXNzfGVufDF8fHx8MTc3NDEyNTQ5OXww&ixlib=rb-4.1.0&q=80&w=1080',
      isFollowing: true,
      bio: 'Entrepreneur | Investor',
    },
    {
      id: '7',
      name: 'Jessica Martinez',
      handle: '@jessicam',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop',
      isFollowing: true,
      isVerified: true,
      bio: 'Music lover | Content creator',
    },
    {
      id: '10',
      name: 'Caleb Miller',
      handle: '@calebm',
      avatar: 'https://images.unsplash.com/photo-1651684215020-f7a5b6610f23?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMG1hbGUlMjBidXNpbmVzc3xlbnwxfHx8fDE3NzQxMjU0OTl8MA&ixlib=rb-4.1.0&q=80&w=1080',
      isFollowing: true,
      bio: 'Business strategist',
    },
  ]);

  const handleFollowToggle = (userId: string) => {
    if (activeTab === 'followers') {
      setFollowers(followers.map(user => 
        user.id === userId ? { ...user, isFollowing: !user.isFollowing } : user
      ));
    } else {
      setFollowing(following.map(user => 
        user.id === userId ? { ...user, isFollowing: !user.isFollowing } : user
      ));
    }
  };

  const currentList = activeTab === 'followers' ? followers : following;

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
        {/* Header with Figma Design Style */}
        <div className="flex items-center justify-between gap-2 mb-6 mt-4">
          {/* Left: Back Button with Points */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/10 backdrop-blur-md shadow-lg hover:bg-white/15 transition-colors"
            style={{
              backgroundImage: "url('data:image/svg+xml;utf8,<svg viewBox=\\'0 0 85 40\\' xmlns=\\'http://www.w3.org/2000/svg\\' preserveAspectRatio=\\'none\\'><rect x=\\'0\\' y=\\'0\\' height=\\'100%\\' width=\\'100%\\' fill=\\'url(%23grad)\\' opacity=\\'0.1\\'/><defs><radialGradient id=\\'grad\\' gradientUnits=\\'userSpaceOnUse\\' cx=\\'0\\' cy=\\'0\\' r=\\'10\\' gradientTransform=\\'matrix(-3.3452e-14 4 -8.5 2.4493e-16 42.5 0.00021696)\\'><stop stop-color=\\'rgba(255,255,255,1)\\' offset=\\'0.2\\'/><stop stop-color=\\'rgba(255,255,255,0.4)\\' offset=\\'1\\'/></radialGradient></defs></svg>')"
            }}
          >
            <ArrowLeft className="w-4 h-4 text-white" />
            <span className="text-[#8fe7a1] font-bold text-sm">{balance}</span>
            <img src={gemIcon} alt="gem" className="w-5 h-5" />
          </button>

          {/* Center: User Name */}
          <div
            className="flex items-center gap-2.5 px-4 py-2 bg-white rounded-full shadow-lg"
          >
            {userPhoto && (
              <img
                src={userPhoto}
                alt={userName}
                className="w-8 h-8 rounded-full object-cover"
              />
            )}
            <span className="text-[#0e0f12] font-bold text-sm whitespace-nowrap">
              {userName}
            </span>
          </div>

          {/* Right: Message Button */}
          <button
            onClick={() => navigate('/chat-list')}
            className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md shadow-lg flex items-center justify-center hover:bg-white/15 transition-colors"
            style={{
              backgroundImage: "url('data:image/svg+xml;utf8,<svg viewBox=\\'0 0 40 40\\' xmlns=\\'http://www.w3.org/2000/svg\\' preserveAspectRatio=\\'none\\'><rect x=\\'0\\' y=\\'0\\' height=\\'100%\\' width=\\'100%\\' fill=\\'url(%23grad)\\' opacity=\\'0.1\\'/><defs><radialGradient id=\\'grad\\' gradientUnits=\\'userSpaceOnUse\\' cx=\\'0\\' cy=\\'0\\' r=\\'10\\' gradientTransform=\\'matrix(-1.5742e-14 4 -4 2.4493e-16 20 0.00021696)\\'><stop stop-color=\\'rgba(255,255,255,1)\\' offset=\\'0.2\\'/><stop stop-color=\\'rgba(255,255,255,0.4)\\' offset=\\'1\\'/></radialGradient></defs></svg>')"
            }}
          >
            <MessageCircle className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <button
            onClick={() => setActiveTab('followers')}
            className={`flex-1 py-3 rounded-full text-sm font-semibold transition-all ${
              activeTab === 'followers'
                ? 'bg-white text-black'
                : 'bg-[#1a1d2e] text-gray-400 hover:text-white'
            }`}
          >
            {followers.length} Followers
          </button>
          <button
            onClick={() => setActiveTab('following')}
            className={`flex-1 py-3 rounded-full text-sm font-semibold transition-all ${
              activeTab === 'following'
                ? 'bg-white text-black'
                : 'bg-[#1a1d2e] text-gray-400 hover:text-white'
            }`}
          >
            {following.length} Following
          </button>
        </div>

        {/* User List */}
        <div className="space-y-3">
          {currentList.map((user, index) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-gradient-to-br from-[#1a1d2e] to-[#0f1318] rounded-2xl p-4 border border-white/5"
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  {user.isVerified && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center border-2 border-[#1a1d2e]">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 mb-0.5">
                    <h3 className="text-white font-semibold text-sm truncate">{user.name}</h3>
                    {user.isVerified && (
                      <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <p className="text-gray-400 text-xs mb-1">{user.handle}</p>
                  {user.bio && (
                    <p className="text-gray-500 text-xs line-clamp-1">{user.bio}</p>
                  )}
                </div>

                {/* Follow Button */}
                <button
                  onClick={() => handleFollowToggle(user.id)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                    user.isFollowing
                      ? 'bg-[#2a2d3e] text-white hover:bg-[#35384a]'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {user.isFollowing ? (
                    <div className="flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Following</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Follow</span>
                    </div>
                  )}
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {currentList.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 bg-[#1a1d2e] rounded-full flex items-center justify-center mx-auto mb-4">
              <UserPlus className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-white text-lg font-semibold mb-2">
              No {activeTab} yet
            </h3>
            <p className="text-gray-400 text-sm">
              {activeTab === 'followers' 
                ? 'When people follow you, they will appear here.'
                : 'Start following people to see them here.'}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}