import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  AtSign,
  Home, 
  Camera, 
  Heart, 
  FileText,
  Edit3,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ChevronRight,
  Search,
  X,
  Sparkles,
  PawPrint,
  Book,
  Tv,
  Monitor,
  Smartphone,
  ShoppingBag,
  Palette,
  Dumbbell,
  Apple,
  Zap,
  LogOut,
  Plus,
  User,
  DollarSign,
  TrendingUp,
  Check
} from 'lucide-react';
import { safeGetItem, safeSetItem } from '../utils/storage';
import { getStoredProfileSettings, notifyProfileSettingsUpdated, resolveProfilePhoto } from '../utils/profileSettings';

// Import AI agent avatars - only the two main ones (purple and green)
import aiBubble from 'figma:asset/36fff8878cf3ea6d1ef44d3f08bbc2346c733ebc.png';
import greenMorphicBall from 'figma:asset/8fd559d05db8d67dee13e79dc6418365220fd613.png';

const aiAgentAvatars = [
  { id: 'blueAvatar', image: aiBubble, name: 'Purple Avatar', color: '#9b87f5' },
  { id: 'greenAvatar', image: greenMorphicBall, name: 'Green Avatar', color: '#10b981' }
];

// Glow colors for avatar animations
const glowColors: Record<string, { primary: string; secondary: string }> = {
  purple: { primary: 'from-purple-400 via-blue-500 to-cyan-400', secondary: 'from-pink-400 via-purple-400 to-blue-500' },
  green: { primary: 'from-green-400 via-emerald-500 to-lime-400', secondary: 'from-teal-400 via-green-400 to-emerald-500' },
};

interface InvestmentOption {
  id: string;
  title: string;
  description: string;
  icon: any;
}

const investmentOptions: InvestmentOption[] = [
  {
    id: 'passion',
    title: 'Support passion projects',
    description: 'Fund interests like travel or education',
    icon: Heart
  },
  {
    id: 'income',
    title: 'Earn supplemental income',
    description: 'Small steady returns',
    icon: DollarSign
  },
  {
    id: 'save',
    title: 'Save for a big goal',
    description: 'Long-term growth',
    icon: TrendingUp
  },
  {
    id: 'maximize',
    title: 'Maximize returns quickly',
    description: 'High risk, high reward',
    icon: Zap
  }
];

const interestCategories = [
  { id: 'art', name: 'Art', icon: Palette },
  { id: 'fitness', name: 'Fitness', icon: Dumbbell },
  { id: 'grocery', name: 'Grocery', icon: ShoppingBag },
  { id: 'pets', name: 'Pets', icon: PawPrint },
  { id: 'beauty', name: 'Beauty', icon: Sparkles },
  { id: 'photo', name: 'Photo', icon: Camera },
  { id: 'books', name: 'Books', icon: Book },
  { id: 'home', name: 'Home', icon: Home },
  { id: 'tech', name: 'Tech', icon: Monitor },
  { id: 'movies', name: 'Movies', icon: Tv },
  { id: 'gaming', name: 'Gaming', icon: Smartphone },
  { id: 'food', name: 'Food', icon: Apple }
];

export function SettingsScreen() {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<'main' | 'agent' | 'interests' | 'password'>('main');
  const [userPhoto, setUserPhoto] = useState<string>('');
  const [userName, setUserName] = useState('');
  const [userHandle, setUserHandle] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [selectedInvestment, setSelectedInvestment] = useState('income');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>(['Football', 'Designer', 'Dogs', 'Tech']);
  const [newTag, setNewTag] = useState('');
  const [agentName, setAgentName] = useState('My AI Agent');
  const [selectedAgent, setSelectedAgent] = useState(0);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [editingHandle, setEditingHandle] = useState(false);
  const [authMethod, setAuthMethod] = useState<string>(''); // 'email', 'google', 'apple', 'facebook'
  const [tempName, setTempName] = useState('');
  const [tempHandle, setTempHandle] = useState('');

  useEffect(() => {
    // Load user data
    const profileSettings = getStoredProfileSettings({
      fallbackName: 'Jess Wu',
      fallbackHandle: '@healthyhabits',
      fallbackEmail: 'user@gmail.com',
    });

    setUserName(profileSettings.name);
    setTempName(profileSettings.name);
    setUserHandle(profileSettings.handle);
    setTempHandle(profileSettings.handle);
    setUserEmail(profileSettings.email);
    setUserPhoto(profileSettings.photo);
    setSelectedInterests(profileSettings.interests);
    setSelectedInvestment(profileSettings.investmentProfile || 'income');
    setTags(profileSettings.tags);
    setAgentName(profileSettings.agentName);
    
    // Determine auth method
    const method = localStorage.getItem('authMethod') || 'email';
    setAuthMethod(method);

    // Load selected AI agent avatar from registration
    const savedAvatarId = profileSettings.selectedAvatar || 'blueAvatar';
    const avatarIndex = aiAgentAvatars.findIndex(avatar => avatar.id === savedAvatarId);
    if (avatarIndex !== -1) {
      setSelectedAgent(avatarIndex);
    }
  }, []);

  const saveInvestmentProfile = (investmentProfile: string) => {
    setSelectedInvestment(investmentProfile);

    const userProfileData = safeGetItem('userProfile');
    const parsedProfile = userProfileData ? JSON.parse(userProfileData) : {};
    parsedProfile.investmentProfile = investmentProfile;
    safeSetItem('userProfile', JSON.stringify(parsedProfile));
    safeSetItem('investmentProfile', investmentProfile);
    notifyProfileSettingsUpdated();
  };

  const saveTags = (nextTags: string[]) => {
    setTags(nextTags);
    safeSetItem('profileTags', JSON.stringify(nextTags));
    notifyProfileSettingsUpdated();
  };

  const toggleInterest = (interestId: string) => {
    if (selectedInterests.includes(interestId)) {
      setSelectedInterests(selectedInterests.filter(id => id !== interestId));
    } else {
      if (selectedInterests.length < 5) {
        setSelectedInterests([...selectedInterests, interestId]);
      }
    }
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      saveTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    saveTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_email');
    navigate('/login');
  };

  const handleSaveName = () => {
    if (tempName.trim()) {
      setUserName(tempName.trim());
      safeSetItem('userName', tempName.trim());
      notifyProfileSettingsUpdated();
      setEditingName(false);
    }
  };

  const handleSaveHandle = () => {
    if (tempHandle.trim()) {
      // Ensure handle starts with @
      const formattedHandle = tempHandle.startsWith('@') ? tempHandle : `@${tempHandle}`;
      setUserHandle(formattedHandle);
      safeSetItem('userHandle', formattedHandle);
      notifyProfileSettingsUpdated();
      setEditingHandle(false);
    }
  };

  const handleCancelEdit = () => {
    setTempName(userName);
    setTempHandle(userHandle);
    setEditingName(false);
    setEditingHandle(false);
  };

  // Main Settings View
  const renderMainView = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pb-6"
    >
      {/* Header with Photos */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="w-12 h-12 rounded-full bg-[#2a2d3e] flex items-center justify-center hover:bg-[#35384a] transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>

        {/* User Photo */}
        <div className="relative">
          <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white/20">
            {userPhoto ? (
              <img src={userPhoto} alt={userName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500" />
            )}
          </div>
          <button className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-white flex items-center justify-center">
            <Edit3 className="w-3 h-3 text-black" />
          </button>
        </div>

        {/* AI Agent Photo - Animated */}
        <button
          onClick={() => setCurrentView('agent')}
          className="relative w-12 h-12"
        >
          {/* Glow Effect */}
          <motion.div
            className={`absolute inset-0 rounded-full bg-gradient-to-br ${
              aiAgentAvatars[selectedAgent].id === 'blueAvatar' 
                ? glowColors.purple.primary 
                : glowColors.green.primary
            } blur-lg opacity-40`}
            animate={{ opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            animate={{ 
              rotate: 360,
              scale: [1, 1.05, 1],
            }}
            transition={{ 
              rotate: { duration: 20, repeat: Infinity, ease: "linear" },
              scale: { duration: 3, repeat: Infinity, ease: "easeInOut" }
            }}
            className="relative w-full h-full rounded-full overflow-hidden border-2 border-purple-500 hover:border-purple-400 transition-colors"
            style={{
              maskImage: 'radial-gradient(circle at center, black 40%, transparent 90%)',
              WebkitMaskImage: 'radial-gradient(circle at center, black 40%, transparent 90%)',
            }}
          >
            <img src={aiAgentAvatars[selectedAgent].image} alt="AI Agent" className="w-full h-full object-cover opacity-90" />
          </motion.div>
        </button>
      </div>

      {/* What Inspires You */}
      <div className="mb-6">
        <h3 className="text-white text-center mb-3">What inspires you</h3>
        <div className="flex items-center justify-center gap-3">
          {/* Display up to 4 selected interest icons */}
          {selectedInterests.slice(0, 4).map((interestId) => {
            const category = interestCategories.find(cat => cat.id === interestId);
            if (!category) return null;
            const IconComponent = category.icon;
            
            return (
              <div
                key={interestId}
                className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center"
              >
                <IconComponent className="w-5 h-5" />
              </div>
            );
          })}
          
          {/* Plus button to add/change interests */}
          <button
            onClick={() => setCurrentView('interests')}
            className="w-12 h-12 rounded-full bg-[#2a2d3e] flex items-center justify-center hover:bg-[#35384a] transition-colors"
          >
            <Plus className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Investment Profile Options */}
      <div className="mb-6">
        <h3 className="text-white font-bold text-center mb-4">Investment Profile Options</h3>
        <div className="space-y-3">
          {investmentOptions.map((option) => {
            const IconComponent = option.icon;
            return (
              <button
                key={option.id}
                onClick={() => saveInvestmentProfile(option.id)}
                className={`w-full rounded-2xl p-4 flex items-center justify-between transition-all ${
                  selectedInvestment === option.id
                    ? 'bg-[#35384a] border border-white/20'
                    : 'bg-[#2a2d3e] border border-transparent hover:bg-[#2f3240]'
                }`}
              >
                <div className="text-left flex-1">
                  <h4 className="text-white font-semibold text-sm mb-0.5">{option.title}</h4>
                  <p className="text-gray-400 text-xs">{option.description}</p>
                </div>
                <IconComponent className="w-6 h-6 text-white ml-3" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Profile Information */}
      <div className="mb-6">
        <h3 className="text-white font-bold text-center mb-4">Profile Information</h3>
        <div className="space-y-3">
          <button
            onClick={() => setEditingName(true)}
            className="w-full bg-[#2a2d3e] rounded-2xl p-4 flex items-center justify-between hover:bg-[#2f3240] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 flex items-center justify-center">
                <span className="text-white">👤</span>
              </div>
              <span className="text-white text-sm">{userName}</span>
            </div>
            <Edit3 className="w-4 h-4 text-gray-400" />
          </button>

          <button
            onClick={() => setEditingHandle(true)}
            className="w-full bg-[#2a2d3e] rounded-2xl p-4 flex items-center justify-between hover:bg-[#2f3240] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 flex items-center justify-center">
                <span className="text-white">@</span>
              </div>
              <span className="text-white text-sm">{userHandle}</span>
            </div>
            <Edit3 className="w-4 h-4 text-gray-400" />
          </button>

          <button className="w-full bg-[#2a2d3e] rounded-2xl p-4 flex items-center justify-between hover:bg-[#2f3240] transition-colors">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-white" />
              <span className="text-gray-400 text-sm flex-1 text-left">{userEmail}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>

          <button
            onClick={() => setCurrentView('password')}
            className="w-full bg-[#2a2d3e] rounded-2xl p-4 flex items-center justify-between hover:bg-[#2f3240] transition-colors"
          >
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-white" />
              <span className="text-white text-sm">Password</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Connect Account */}
      <div className="mb-6">
        <h3 className="text-white font-bold text-center mb-4">Connect account</h3>
        <div className="space-y-3">
          <button className="w-full bg-[#2a2d3e] rounded-2xl p-4 flex items-center justify-between hover:bg-[#2f3240] transition-colors">
            <div className="flex items-center gap-3">
              <Apple className="w-5 h-5 text-white" />
              <span className="text-white text-sm">Apple</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>

          <button className="w-full bg-[#2a2d3e] rounded-2xl p-4 flex items-center justify-between hover:bg-[#2f3240] transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 flex items-center justify-center">
                <span className="text-white">G</span>
              </div>
              <span className="text-white text-sm">Google</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>

          <button className="w-full bg-[#2a2d3e] rounded-2xl p-4 flex items-center justify-between hover:bg-[#2f3240] transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 flex items-center justify-center">
                <span className="text-white">f</span>
              </div>
              <span className="text-white text-sm">Facebook</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Tags That Describe You */}
      <div className="mb-6">
        <h3 className="text-white font-bold text-center mb-2">Tags that describe you</h3>
        <p className="text-gray-400 text-xs text-center mb-4">Maximum 5 tags</p>
        
        {/* Tag Input */}
        <div className="bg-[#2a2d3e] rounded-2xl p-3 flex items-center gap-2 mb-3">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addTag()}
            placeholder="Add tag"
            className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-gray-500"
          />
          <button onClick={addTag} className="text-gray-400 hover:text-white">
            <Search className="w-4 h-4" />
          </button>
        </div>

        {/* Selected Tags */}
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, idx) => (
            <div
              key={idx}
              className="bg-[#2a2d3e] rounded-full px-4 py-2 flex items-center gap-2 border border-white/10"
            >
              <span className="text-white text-sm">{tag}</span>
              <button
                onClick={() => removeTag(tag)}
                className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600 transition-colors"
              >
                <X className="w-2.5 h-2.5 text-white" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-3.5 rounded-full font-semibold flex items-center justify-center gap-2 hover:from-red-600 hover:to-red-700 transition-all"
      >
        Log out
        <LogOut className="w-4 h-4" />
      </button>
    </motion.div>
  );

  const renderUpdatedMainView = () => {
    const visibleInterestIds = selectedInterests.length ? selectedInterests.slice(0, 3) : ['home', 'photo', 'fitness'];
    const visibleInterestCategories = visibleInterestIds
      .map((interestId) => interestCategories.find((category) => category.id === interestId))
      .filter((category): category is (typeof interestCategories)[number] => Boolean(category));
    const handleLabel = userHandle.replace(/^@/, '') || 'healthyhabits';

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="pb-4"
      >
        <section className="min-h-[calc(100vh-3rem)] overflow-hidden rounded-[1.55rem] border border-white/8 bg-gradient-to-b from-[#1c1f22] via-[#17191c] to-[#121416] px-4 pb-5 pt-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_22px_80px_rgba(0,0,0,0.54)]">
          <div className="mb-4 flex items-center justify-center gap-5">
            <button
              onClick={() => navigate(-1)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/8 text-white/80 transition-colors hover:bg-white/14"
              aria-label="Go back"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="relative">
              <div className="h-[68px] w-[68px] overflow-hidden rounded-full border-2 border-orange-400/80 bg-gradient-to-br from-purple-500 to-pink-500 shadow-[0_0_20px_rgba(255,136,22,0.28)]">
                {userPhoto && <img src={userPhoto} alt={userName} className="h-full w-full object-cover" />}
              </div>
              <button className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-white text-black shadow-lg">
                <Edit3 className="h-3 w-3" />
              </button>
            </div>

            <button
              onClick={() => setCurrentView('agent')}
              className="relative h-11 w-11"
              aria-label="Edit AI agent"
            >
              <motion.div
                className={`absolute inset-0 rounded-full bg-gradient-to-br ${
                  aiAgentAvatars[selectedAgent].id === 'blueAvatar'
                    ? glowColors.purple.primary
                    : glowColors.green.primary
                } blur-lg opacity-40`}
                animate={{ opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.div
                animate={{
                  rotate: 360,
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  rotate: { duration: 20, repeat: Infinity, ease: 'linear' },
                  scale: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
                }}
                className="relative h-full w-full overflow-hidden rounded-full border border-purple-400/70"
                style={{
                  maskImage: 'radial-gradient(circle at center, black 40%, transparent 90%)',
                  WebkitMaskImage: 'radial-gradient(circle at center, black 40%, transparent 90%)',
                }}
              >
                <img src={aiAgentAvatars[selectedAgent].image} alt="AI Agent" className="h-full w-full object-cover opacity-90" />
              </motion.div>
            </button>
          </div>

          <div className="mb-4 text-center">
            <h3 className="mb-3 text-[13px] font-black text-white">What inspires you</h3>
            <div className="flex items-center justify-center gap-2.5">
              {visibleInterestCategories.map((category) => {
                const IconComponent = category.icon;

                return (
                  <button
                    key={category.id}
                    onClick={() => setCurrentView('interests')}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white/8 text-white/86 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-colors hover:bg-white/14"
                    aria-label={`Edit ${category.name} interest`}
                  >
                    <IconComponent className="h-4 w-4" />
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentView('interests')}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/8 text-white/86 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-colors hover:bg-white/14"
                aria-label="Add interests"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mb-4">
            <h3 className="mb-2 text-center text-base font-black text-white">Investment Profile Options</h3>
            <div className="space-y-1.5">
              {investmentOptions.map((option) => {
                const IconComponent = option.icon;
                const isSelected = selectedInvestment === option.id;

                return (
                  <button
                    key={option.id}
                    onClick={() => saveInvestmentProfile(option.id)}
                    className={`flex w-full items-center justify-between rounded-[1rem] px-4 py-3 text-left transition-colors ${
                      isSelected
                        ? 'bg-[#24272a] ring-1 ring-white/10'
                        : 'bg-[#202326]/95 hover:bg-[#26292d]'
                    }`}
                  >
                    <span>
                      <span className="block text-[12px] font-black leading-tight text-white/86">{option.title}</span>
                      <span className="mt-1 block text-[10px] font-semibold leading-tight text-white/35">{option.description}</span>
                    </span>
                    <IconComponent className="h-4 w-4 text-white/58" />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mb-4">
            <h3 className="mb-2 text-center text-base font-black text-white">Profile Information</h3>
            <div className="space-y-1.5">
              <button
                onClick={() => setEditingName(true)}
                className="flex w-full items-center justify-between rounded-full bg-[#202326]/95 px-4 py-3 text-left transition-colors hover:bg-[#26292d]"
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <User className="h-3.5 w-3.5 shrink-0 text-white/55" />
                  <span className="truncate text-[12px] font-semibold text-white/86">{userName}</span>
                </span>
                <Edit3 className="h-3.5 w-3.5 shrink-0 text-white/42" />
              </button>

              <button
                onClick={() => setEditingHandle(true)}
                className="flex w-full items-center justify-between rounded-full bg-[#202326]/95 px-4 py-3 text-left transition-colors hover:bg-[#26292d]"
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <AtSign className="h-3.5 w-3.5 shrink-0 text-white/55" />
                  <span className="truncate text-[12px] font-semibold text-white/86">{handleLabel}</span>
                </span>
                <Edit3 className="h-3.5 w-3.5 shrink-0 text-white/42" />
              </button>

              <button className="flex w-full items-center justify-between rounded-full bg-[#202326]/95 px-4 py-3 text-left transition-colors hover:bg-[#26292d]">
                <span className="flex items-center gap-2.5">
                  <Mail className="h-3.5 w-3.5 text-white/55" />
                  <span className="text-[12px] font-semibold text-white/86">E-Mail</span>
                </span>
                <span className="flex min-w-0 items-center gap-2">
                  <span className="max-w-[130px] truncate text-[11px] font-semibold text-white/48">{userEmail}</span>
                  <ChevronRight className="h-3.5 w-3.5 text-white/42" />
                </span>
              </button>

              <button
                onClick={() => setCurrentView('password')}
                className="flex w-full items-center justify-between rounded-full bg-[#202326]/95 px-4 py-3 text-left transition-colors hover:bg-[#26292d]"
              >
                <span className="flex items-center gap-2.5">
                  <Lock className="h-3.5 w-3.5 text-white/55" />
                  <span className="text-[12px] font-semibold text-white/86">Password</span>
                </span>
                <ChevronRight className="h-3.5 w-3.5 text-white/42" />
              </button>
            </div>
          </div>

          <div className="mb-4">
            <h3 className="mb-2 text-center text-base font-black text-white">Connect account</h3>
            <div className="space-y-1.5">
              {[
                { label: 'Apple', icon: <Apple className="h-3.5 w-3.5" /> },
                { label: 'Google', icon: <span className="text-[12px] font-black">G</span> },
                { label: 'Facebook', icon: <span className="text-[12px] font-black">f</span> },
              ].map((account) => (
                <button
                  key={account.label}
                  className="flex w-full items-center justify-between rounded-full bg-[#202326]/95 px-4 py-3 text-left transition-colors hover:bg-[#26292d]"
                >
                  <span className="flex items-center gap-2.5 text-white/86">
                    <span className="flex h-3.5 w-3.5 items-center justify-center text-white/70">{account.icon}</span>
                    <span className="text-[12px] font-semibold">{account.label}</span>
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 text-white/42" />
                </button>
              ))}
            </div>
          </div>

          <div className="mb-5">
            <h3 className="text-center text-base font-black text-white">Tags that describe you</h3>
            <p className="mb-3 text-center text-[10px] font-semibold text-white/42">Maximum 5 tags</p>

            <div className="mb-3 flex items-center gap-2 rounded-full bg-[#202326]/95 px-4 py-3">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTag()}
                placeholder="Add tag"
                className="min-w-0 flex-1 bg-transparent text-[12px] font-semibold text-white outline-none placeholder:text-white/35"
              />
              <button onClick={addTag} className="text-white/60 transition-colors hover:text-white" aria-label="Add tag">
                <Search className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              {tags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => removeTag(tag)}
                  className="relative rounded-full bg-[#202326]/95 px-4 py-2 text-[11px] font-semibold text-white/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-colors hover:bg-[#26292d]"
                  aria-label={`Remove ${tag} tag`}
                >
                  <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[#e64f5d]" />
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 rounded-full bg-[#df555a] px-9 py-3 text-[12px] font-black text-white shadow-[0_14px_34px_rgba(223,85,90,0.24)] transition-colors hover:bg-[#ef6266]"
            >
              Log out
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </section>
      </motion.div>
    );
  };

  // AI Agent View
  const renderAgentView = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pb-6"
    >
      {/* Header */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <button
          onClick={() => setCurrentView('main')}
          className="w-12 h-12 rounded-full bg-[#2a2d3e] flex items-center justify-center hover:bg-[#35384a] transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>

        {/* AI Agent Photo (Large) */}
        <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-purple-500">
          <img src={aiAgentAvatars[selectedAgent].image} alt="AI Agent" className="w-full h-full object-cover" />
        </div>

        {/* User Photo */}
        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/20">
          {userPhoto ? (
            <img src={userPhoto} alt={userName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500" />
          )}
        </div>
      </div>

      <h2 className="text-white text-2xl font-bold text-center mb-6">Personal Agent Information</h2>

      {/* Agent Name Input */}
      <div className="bg-[#2a2d3e] rounded-2xl p-4 flex items-center justify-between mb-6">
        <input
          type="text"
          value={agentName}
          onChange={(e) => {
            setAgentName(e.target.value);
            safeSetItem('agentName', e.target.value);
            notifyProfileSettingsUpdated();
          }}
          className="flex-1 bg-transparent text-white outline-none"
        />
        <Edit3 className="w-4 h-4 text-gray-400" />
      </div>

      {/* Agent Avatar Grid */}
      <div className="grid grid-cols-2 gap-6 max-w-xs mx-auto">
        {aiAgentAvatars.map((avatar, idx) => {
          const isSelected = selectedAgent === idx;
          const colorKey = avatar.id === 'blueAvatar' ? 'purple' : 'green';
          const glowGradients = glowColors[colorKey];
          
          return (
            <button
              key={idx}
              onClick={() => {
                setSelectedAgent(idx);
                safeSetItem('selectedAvatar', avatar.id);
                if (!sessionStorage.getItem('userPhoto') && !safeGetItem('userPhoto')) {
                  setUserPhoto(resolveProfilePhoto('', avatar.id));
                }
                notifyProfileSettingsUpdated();
              }}
              className="relative aspect-square"
            >
              {/* Glow Effect */}
              <motion.div
                className={`absolute inset-0 rounded-full bg-gradient-to-br ${glowGradients.primary} blur-2xl transition-opacity duration-300`}
                style={{ opacity: isSelected ? 0.6 : 0.3 }}
                animate={isSelected ? { opacity: [0.4, 0.6, 0.4] } : {}}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                className={`absolute inset-0 rounded-full bg-gradient-to-tr ${glowGradients.secondary} blur-xl transition-opacity duration-300`}
                style={{ opacity: isSelected ? 0.5 : 0.2 }}
              />

              {/* Avatar Image Container */}
              <motion.div
                animate={isSelected ? { 
                  rotate: 360,
                  scale: [1, 1.05, 1],
                } : {}}
                transition={isSelected ? { 
                  rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                  scale: { duration: 3, repeat: Infinity, ease: "easeInOut" }
                } : {}}
                className={`relative w-full h-full rounded-full overflow-hidden shadow-2xl transition-all duration-300 ${
                  isSelected
                    ? 'ring-4 ring-purple-500 scale-105'
                    : 'ring-2 ring-white/10 hover:ring-white/30 hover:scale-105'
                }`}
                style={{
                  maskImage: 'radial-gradient(circle at center, black 40%, transparent 90%)',
                  WebkitMaskImage: 'radial-gradient(circle at center, black 40%, transparent 90%)',
                }}
              >
                <img 
                  src={avatar.image} 
                  alt={avatar.name} 
                  className="w-full h-full object-cover opacity-90" 
                />
                {/* Ethereal overlay blend */}
                <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-[#0a0e1a] opacity-50" />
              </motion.div>

              {/* Selection Check Mark */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-2 -right-2 w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center z-10 shadow-lg"
                >
                  <Check className="w-5 h-5 text-white" />
                </motion.div>
              )}
            </button>
          );
        })}
      </div>
    </motion.div>
  );

  // Interests View
  const renderInterestsView = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pb-6"
    >
      {/* Header */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <button
          onClick={() => setCurrentView('main')}
          className="w-12 h-12 rounded-full bg-[#2a2d3e] flex items-center justify-center hover:bg-[#35384a] transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>

        {/* User Photo */}
        <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white/20">
          {userPhoto ? (
            <img src={userPhoto} alt={userName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500" />
          )}
        </div>

        {/* AI Agent Photo */}
        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-purple-500">
          <img src={aiAgentAvatars[selectedAgent].image} alt="AI Agent" className="w-full h-full object-cover" />
        </div>
      </div>

      <h2 className="text-white text-2xl font-bold text-center mb-3">What inspires you</h2>

      {/* Interest Categories Grid */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {interestCategories.map((category) => {
          const isSelected = selectedInterests.includes(category.id);
          const IconComponent = category.icon;
          
          return (
            <button
              key={category.id}
              onClick={() => toggleInterest(category.id)}
              className={`aspect-square rounded-3xl flex flex-col items-center justify-center gap-2 transition-all ${
                isSelected
                  ? 'bg-white text-black scale-105'
                  : 'bg-[#2a2d3e] text-gray-400 hover:bg-[#35384a] hover:text-white'
              }`}
            >
              <IconComponent className="w-8 h-8" />
              <span className="text-xs font-medium">{category.name}</span>
            </button>
          );
        })}
      </div>

      {/* Save Button */}
      <button
        onClick={() => {
          // Save interests to localStorage
          safeSetItem('selectedInterests', JSON.stringify(selectedInterests));
          notifyProfileSettingsUpdated();
          // Navigate back to main view
          setCurrentView('main');
        }}
        className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white py-4 rounded-full font-bold hover:from-purple-600 hover:to-blue-600 transition-all shadow-lg shadow-purple-500/30"
      >
        Save Changes
      </button>
    </motion.div>
  );

  // Password Change View
  const renderPasswordView = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pb-6"
    >
      {/* Header */}
      <div className="flex items-center justify-center gap-4 mb-8">
        <button
          onClick={() => setCurrentView('main')}
          className="w-12 h-12 rounded-full bg-[#2a2d3e] flex items-center justify-center hover:bg-[#35384a] transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>

        {/* User Photo */}
        <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white/20">
          {userPhoto ? (
            <img src={userPhoto} alt={userName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500" />
          )}
        </div>

        {/* AI Agent Photo */}
        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-purple-500">
          <img src={aiAgentAvatars[selectedAgent].image} alt="AI Agent" className="w-full h-full object-cover" />
        </div>
      </div>

      <h2 className="text-white text-2xl font-bold text-center mb-8">Change Password</h2>

      {/* Password Input */}
      <div className="bg-[#2a2d3e] rounded-2xl p-4 flex items-center gap-3 mb-4">
        <Lock className="w-5 h-5 text-gray-400" />
        <input
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••••"
          className="flex-1 bg-transparent text-white outline-none placeholder:text-gray-600"
        />
        <button
          onClick={() => setShowPassword(!showPassword)}
          className="text-gray-400 hover:text-white transition-colors"
        >
          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>

      {/* Confirm Password Input */}
      <div className="bg-[#2a2d3e] rounded-2xl p-4 flex items-center gap-3 mb-8">
        <Lock className="w-5 h-5 text-gray-400" />
        <input
          type={showConfirmPassword ? 'text' : 'password'}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm Password"
          className="flex-1 bg-transparent text-white outline-none placeholder:text-gray-600"
        />
        <button
          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          className="text-gray-400 hover:text-white transition-colors"
        >
          {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>

      {/* Confirm Button */}
      <button
        onClick={() => {
          if (password && password === confirmPassword) {
            // Save password logic here
            setCurrentView('main');
          }
        }}
        disabled={!password || password !== confirmPassword}
        className="w-full bg-white text-black py-3.5 rounded-full font-bold hover:bg-gray-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Confirm
      </button>
    </motion.div>
  );

  return (
    <div className="absolute inset-0 w-full h-full overflow-y-auto bg-black">
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

      <div className="pt-8 px-4 max-w-md mx-auto">
        <AnimatePresence mode="wait">
          {currentView === 'main' && renderUpdatedMainView()}
          {currentView === 'agent' && renderAgentView()}
          {currentView === 'interests' && renderInterestsView()}
          {currentView === 'password' && renderPasswordView()}
        </AnimatePresence>
      </div>

      {/* Edit Name Modal */}
      <AnimatePresence>
        {editingName && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4"
            onClick={handleCancelEdit}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#1a1d2e] rounded-3xl p-6 w-full max-w-sm"
            >
              <h3 className="text-white text-xl font-bold text-center mb-6">Edit Name</h3>
              
              <div className="bg-[#2a2d3e] rounded-2xl p-4 mb-6">
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSaveName()}
                  placeholder="Enter your name"
                  className="w-full bg-transparent text-white outline-none placeholder:text-gray-500"
                  autoFocus
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCancelEdit}
                  className="flex-1 bg-[#2a2d3e] text-white py-3 rounded-full font-semibold hover:bg-[#35384a] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveName}
                  disabled={!tempName.trim()}
                  className="flex-1 bg-white text-black py-3 rounded-full font-bold hover:bg-gray-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Handle Modal */}
      <AnimatePresence>
        {editingHandle && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4"
            onClick={handleCancelEdit}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#1a1d2e] rounded-3xl p-6 w-full max-w-sm"
            >
              <h3 className="text-white text-xl font-bold text-center mb-6">Edit Handle</h3>
              
              <div className="bg-[#2a2d3e] rounded-2xl p-4 mb-6 flex items-center gap-2">
                <span className="text-gray-400">@</span>
                <input
                  type="text"
                  value={tempHandle.startsWith('@') ? tempHandle.slice(1) : tempHandle}
                  onChange={(e) => setTempHandle(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSaveHandle()}
                  placeholder="username"
                  className="flex-1 bg-transparent text-white outline-none placeholder:text-gray-500"
                  autoFocus
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCancelEdit}
                  className="flex-1 bg-[#2a2d3e] text-white py-3 rounded-full font-semibold hover:bg-[#35384a] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveHandle}
                  disabled={!tempHandle.trim()}
                  className="flex-1 bg-white text-black py-3 rounded-full font-bold hover:bg-gray-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
