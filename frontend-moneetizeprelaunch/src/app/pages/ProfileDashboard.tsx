import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft, Settings, Bell, ChevronRight, Trophy, Users, Gift, Star, TrendingUp, User, Mail, Calendar, Heart, Target, Award, Share2, LogOut } from 'lucide-react';
import gemIcon from 'figma:asset/296d8aa06fd9c7e60192bc7368a4a032ec5bc17e.png';
import { getUserPoints, POINTS_UPDATED_EVENT } from '../utils/pointsManager';
import { safeGetItem } from '../utils/storage';
import { getUserProfile, logoutUser } from '../services/authService';
import { getSelectedAvatarImage } from '../utils/avatarUtils';
import { hydrateRemoteProfileSettings } from '../services/profilePersistenceService';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  created_at?: string;
  interests?: string[];
  investmentProfile?: string;
  hasPhoto?: boolean;
}

export function ProfileDashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userPhoto, setUserPhoto] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userPoints, setUserPoints] = useState(10);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const accessToken = localStorage.getItem('access_token');
        
        console.log('Profile - Has access token:', !!accessToken);
        
        if (!accessToken) {
          console.log('Profile - No access token, redirecting to login');
          navigate('/login');
          return;
        }

        const profileResult = await getUserProfile();
        await hydrateRemoteProfileSettings().catch((syncError) => {
          console.warn('Remote profile settings hydration skipped:', syncError);
        });

        if (!profileResult.success || !profileResult.data?.user) {
          throw new Error(profileResult.error || 'Failed to fetch profile');
        }

        console.log('Live Supabase profile loaded:', profileResult.data.user);

        const liveUserProfileData = safeGetItem('userProfile');
        const liveParsedProfile = liveUserProfileData ? JSON.parse(liveUserProfileData) : {};
        const liveInterests = safeGetItem('selectedInterests');
        const liveParsedInterests = liveInterests ? JSON.parse(liveInterests) : [];
        const livePhoto = sessionStorage.getItem('userPhoto') || safeGetItem('userPhoto') || '';
        const liveSelectedAvatar = safeGetItem('selectedAvatar') || '';

        if (livePhoto) {
          setUserPhoto(livePhoto);
        } else if (liveSelectedAvatar) {
          setUserPhoto(getSelectedAvatarImage(liveSelectedAvatar));
        }

        const livePoints = getUserPoints();
        setUserPoints(livePoints);

        setProfile({
          id: profileResult.data.user.id,
          email: profileResult.data.user.email,
          name: profileResult.data.user.name,
          created_at: profileResult.data.user.created_at || liveParsedProfile.completedAt,
          interests: liveParsedInterests,
          investmentProfile: liveParsedProfile.investmentProfile || 'Not set',
          hasPhoto: !!(livePhoto || liveSelectedAvatar),
        });

        return;
      } catch (err) {
        console.error('Profile fetch error:', err);
        
        if (err instanceof TypeError && err.message.includes('fetch')) {
          setError('Network error. Please check your connection.');
        } else {
          setError(err instanceof Error ? err.message : 'Failed to load profile');
        }
        
        // If unauthorized, redirect to login
        if (err instanceof Error && (err.message.includes('token') || err.message.includes('Unauthorized'))) {
          console.log('Profile - Unauthorized, clearing tokens and redirecting to login');
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          setTimeout(() => navigate('/login'), 2000);
        }
      } finally {
        setLoading(false);
      }
    };

    const syncPointBalance = () => setUserPoints(getUserPoints());

    fetchProfile();
    window.addEventListener(POINTS_UPDATED_EVENT, syncPointBalance);
    window.addEventListener('storage', syncPointBalance);

    return () => {
      window.removeEventListener(POINTS_UPDATED_EVENT, syncPointBalance);
      window.removeEventListener('storage', syncPointBalance);
    };
  }, [navigate]);

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-gradient-to-b from-[#0a0e1a] via-[#0f1623] to-[#0a0e1a]">
        <div className="text-white text-lg">Loading profile...</div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-gradient-to-b from-[#0a0e1a] via-[#0f1623] to-[#0a0e1a]">
        <div className="text-center px-4">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-white text-black px-6 py-2 rounded-full font-semibold"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 w-full h-full overflow-y-auto bg-gradient-to-b from-[#0a0e1a] via-[#0f1623] to-[#0a0e1a]">
      {/* Status Bar */}
      <div className="absolute top-0 left-0 right-0 h-11 flex items-center justify-between px-4 sm:px-6 text-white text-sm z-50">
        <span className="font-semibold">9:41</span>
        <div className="flex items-center gap-1">
          <div className="w-4 h-3 bg-white/80 rounded-sm" />
          <div className="w-4 h-3 bg-white/80 rounded-sm" />
          <div className="w-6 h-3 bg-white/80 rounded-sm" />
        </div>
      </div>

      <div className="pt-16 sm:pt-20 pb-20 sm:pb-24 px-4 sm:px-6 max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h1 className="text-white text-2xl sm:text-3xl font-bold mb-2">Profile</h1>
          <p className="text-gray-400 text-sm">Manage your account and preferences</p>
        </motion.div>

        {/* Profile Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md rounded-2xl p-6 mb-6 border border-white/10"
        >
          <div className="flex items-center gap-4 mb-4">
            {userPhoto ? (
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white/20">
                <img 
                  src={userPhoto} 
                  alt={profile?.name} 
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <User className="w-10 h-10 text-white" />
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-white text-xl font-bold">{profile?.name || 'User'}</h2>
              <p className="text-gray-400 text-sm flex items-center gap-1.5 mt-1">
                <Mail className="w-3.5 h-3.5" />
                {profile?.email}
              </p>
            </div>
          </div>
          
          {profile?.created_at && (
            <div className="flex items-center gap-1.5 text-gray-400 text-xs mt-3 pt-3 border-t border-white/10">
              <Calendar className="w-3.5 h-3.5" />
              Member since {new Date(profile.created_at).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          )}
        </motion.div>

        {/* User Interests */}
        {profile?.interests && profile.interests.length > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md rounded-2xl p-6 mb-6 border border-white/10"
          >
            <div className="flex items-center gap-2 mb-4">
              <Heart className="w-5 h-5 text-pink-400" />
              <h3 className="text-white text-lg font-semibold">Interests</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {profile.interests.map((interest, idx) => (
                <span 
                  key={idx}
                  className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-white text-sm capitalize"
                >
                  {interest}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* Investment Profile */}
        {profile?.investmentProfile && profile.investmentProfile !== 'Not set' && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.18, duration: 0.5 }}
            className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md rounded-2xl p-6 mb-6 border border-white/10"
          >
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-5 h-5 text-blue-400" />
              <h3 className="text-white text-lg font-semibold">Investment Profile</h3>
            </div>
            <p className="text-gray-300 text-base capitalize">{profile.investmentProfile}</p>
          </motion.div>
        )}

        {/* Points & Rewards Summary */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="grid grid-cols-2 gap-4 mb-6"
        >
          <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md rounded-xl p-5 border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <motion.div 
                className="w-11 h-11 relative"
                animate={{ 
                  y: [0, -4, 0],
                  rotate: [0, 3, -3, 0],
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <div className="absolute inset-0 bg-emerald-400 rounded-lg blur-lg opacity-60" />
                <img 
                  src={gemIcon} 
                  alt="Gem" 
                  className="relative w-full h-full object-contain"
                />
              </motion.div>
            </div>
            <p className="text-white text-2xl font-bold mb-1">{userPoints}</p>
            <p className="text-gray-400 text-xs">Total Points</p>
          </div>

          <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md rounded-xl p-5 border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-8 h-8 text-yellow-400" />
            </div>
            <p className="text-white text-2xl font-bold mb-1">02</p>
            <p className="text-gray-400 text-xs">Current Level</p>
          </div>
        </motion.div>

        {/* Menu Options */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="space-y-3 mb-6"
        >
          <button
            onClick={() => navigate('/rewards')}
            className="w-full bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 flex items-center justify-between hover:bg-white/15 transition-all"
          >
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <span className="text-white font-medium">Rewards & Progress</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>

          <button
            onClick={() => navigate('/onboarding-interests')}
            className="w-full bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 flex items-center justify-between hover:bg-white/15 transition-all"
          >
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5 text-blue-400" />
              <span className="text-white font-medium">Update Interests</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>

          <button
            onClick={() => navigate('/share-invites')}
            className="w-full bg-gradient-to-br from-emerald-500/10 to-green-500/10 backdrop-blur-md rounded-xl p-4 border border-emerald-500/30 flex items-center justify-between hover:bg-emerald-500/20 transition-all"
          >
            <div className="flex items-center gap-3">
              <Share2 className="w-5 h-5 text-emerald-400" />
              <div className="flex flex-col items-start">
                <span className="text-white font-medium">Share Invites</span>
                <span className="text-emerald-400 text-xs">Earn 5 pts per invite</span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>

          <button
            onClick={() => navigate('/groups')}
            className="w-full bg-gradient-to-br from-purple-500/10 to-violet-500/10 backdrop-blur-md rounded-xl p-4 border border-purple-500/30 flex items-center justify-between hover:bg-purple-500/20 transition-all"
          >
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-purple-400" />
              <span className="text-white font-medium">Groups</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        </motion.div>

        {/* Logout Button */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <button
            onClick={handleLogout}
            className="w-full bg-red-500/10 border border-red-500/30 text-red-400 py-3.5 rounded-full font-semibold text-base hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </motion.div>
      </div>
    </div>
  );
}
