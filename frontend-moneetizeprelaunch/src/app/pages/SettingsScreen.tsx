import { useState, useEffect, useRef, type ChangeEvent } from 'react';
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
  Check,
  Shirt,
  Car
} from 'lucide-react';
import { safeGetItem, safeSetItem } from '../utils/storage';
import { clearProfilePhoto, getStoredProfileSettings, markProfileCompleted, notifyProfileSettingsUpdated, saveProfilePhoto, writeStoredProfileSettings, type StoredProfileSettings } from '../utils/profileSettings';
import { loadRecommendedFriends, syncCurrentUserNetworkProfile } from '../services/networkService';
import { logoutUser, updateUserProfile } from '../services/authService';
import { hydrateRemoteProfileSettings, saveRemoteProfileSettings } from '../services/profilePersistenceService';

// Import AI agent avatars - the original two plus generated variants in the settings selector.
import aiBubble from 'figma:asset/36fff8878cf3ea6d1ef44d3f08bbc2346c733ebc.png';
import greenMorphicBall from 'figma:asset/8fd559d05db8d67dee13e79dc6418365220fd613.png';

const SHOW_THIRD_PARTY_LOGINS = false;

const aiAgentAvatars = [
  {
    id: 'blueAvatar',
    image: aiBubble,
    name: 'Prism Orb',
    accent: '#9b87f5',
    glow: 'rgba(139, 116, 246, 0.54)',
    visual: 'image',
  },
  {
    id: 'mazeAvatar',
    name: 'Signal Maze',
    accent: '#8b8f98',
    glow: 'rgba(169, 172, 180, 0.36)',
    visual: 'generated',
    background:
      'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.2), rgba(40,43,48,0.08) 34%, rgba(6,7,8,0.96) 72%), repeating-conic-gradient(from 45deg, rgba(230,230,230,0.55) 0deg 9deg, rgba(12,13,14,0.95) 9deg 18deg)',
  },
  {
    id: 'latticeAvatar',
    name: 'Lattice Core',
    accent: '#a6a6a6',
    glow: 'rgba(190, 190, 190, 0.34)',
    visual: 'generated',
    background:
      'radial-gradient(circle at 52% 48%, rgba(255,255,255,0.25), rgba(95,97,102,0.22) 28%, rgba(10,11,12,0.96) 74%), repeating-radial-gradient(circle at 50% 50%, rgba(255,255,255,0.42) 0 3px, rgba(0,0,0,0.68) 3px 8px)',
  },
  {
    id: 'greenAvatar',
    image: greenMorphicBall,
    name: 'Aurora Orb',
    accent: '#10b981',
    glow: 'rgba(16, 185, 129, 0.5)',
    visual: 'image',
  },
  {
    id: 'vortexAvatar',
    image: aiBubble,
    name: 'Vortex Agent',
    accent: '#4664f0',
    glow: 'rgba(78, 97, 242, 0.45)',
    visual: 'image',
    imageClass: 'hue-rotate-[70deg] saturate-150 contrast-125',
  },
  {
    id: 'weaveAvatar',
    name: 'Weave Mind',
    accent: '#72c7a2',
    glow: 'rgba(114, 199, 162, 0.42)',
    visual: 'generated',
    background:
      'radial-gradient(circle at 42% 35%, rgba(119,255,188,0.7), transparent 23%), radial-gradient(circle at 66% 58%, rgba(92,111,255,0.46), transparent 26%), repeating-linear-gradient(150deg, rgba(120,255,183,0.32) 0 3px, rgba(32,43,50,0.8) 3px 7px), #151a1c',
  },
  {
    id: 'bloomAvatar',
    image: greenMorphicBall,
    name: 'Bloom Agent',
    accent: '#4fbf87',
    glow: 'rgba(79, 191, 135, 0.42)',
    visual: 'image',
    imageClass: 'hue-rotate-[35deg] saturate-125 contrast-110',
  },
  {
    id: 'sandAvatar',
    image: aiBubble,
    name: 'Wave Agent',
    accent: '#9c7d68',
    glow: 'rgba(156, 125, 104, 0.4)',
    visual: 'image',
    imageClass: 'hue-rotate-[145deg] saturate-90 contrast-125',
  },
  {
    id: 'crystalAvatar',
    image: greenMorphicBall,
    name: 'Crystal Agent',
    accent: '#7fb8b7',
    glow: 'rgba(127, 184, 183, 0.4)',
    visual: 'image',
    imageClass: 'hue-rotate-[300deg] saturate-125 brightness-110',
  },
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
  { id: 'fashion', name: 'Fashion', icon: Shirt },
  { id: 'car', name: 'Car', icon: Car },
  { id: 'food', name: 'Food', icon: Apple }
];

const interestBubbleLayout = [
  { id: 'art', left: '0%', top: '3%', size: 94, opacity: 0.38 },
  { id: 'fitness', left: '34%', top: '0%', size: 92, opacity: 0.55 },
  { id: 'grocery', left: '69%', top: '4%', size: 94, opacity: 0.38 },
  { id: 'pets', left: '16%', top: '24%', size: 94, opacity: 1 },
  { id: 'beauty', left: '51%', top: '24%', size: 94, opacity: 0.62 },
  { id: 'photo', left: '0%', top: '46%', size: 94, opacity: 1 },
  { id: 'books', left: '34%', top: '46%', size: 92, opacity: 0.62 },
  { id: 'home', left: '69%', top: '46%', size: 94, opacity: 1 },
  { id: 'tech', left: '16%', top: '68%', size: 88, opacity: 0.42 },
  { id: 'movies', left: '51%', top: '68%', size: 88, opacity: 1 },
  { id: 'gaming', left: '0%', top: '88%', size: 94, opacity: 0.2 },
  { id: 'fashion', left: '34%', top: '88%', size: 92, opacity: 0.24 },
  { id: 'car', left: '69%', top: '88%', size: 94, opacity: 0.2 },
] as const;

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'ME';
}

function resizeProfilePhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('Unable to read this photo.'));
    reader.onload = () => {
      const image = new Image();

      image.onerror = () => reject(new Error('Unable to load this photo.'));
      image.onload = () => {
        const outputSize = 240;
        const cropSize = Math.min(image.width, image.height);
        const sourceX = Math.max(0, Math.round((image.width - cropSize) / 2));
        const sourceY = Math.max(0, Math.round((image.height - cropSize) / 2));
        const canvas = document.createElement('canvas');
        canvas.width = outputSize;
        canvas.height = outputSize;

        const context = canvas.getContext('2d');
        if (!context) {
          reject(new Error('Unable to process this photo.'));
          return;
        }

        context.drawImage(image, sourceX, sourceY, cropSize, cropSize, 0, 0, outputSize, outputSize);

        let quality = 0.78;
        let photo = canvas.toDataURL('image/jpeg', quality);
        while (photo.length > 80000 && quality > 0.48) {
          quality -= 0.08;
          photo = canvas.toDataURL('image/jpeg', quality);
        }

        resolve(photo);
      };

      image.src = `${reader.result || ''}`;
    };

    reader.readAsDataURL(file);
  });
}

export function SettingsScreen() {
  const navigate = useNavigate();
  const photoInputRef = useRef<HTMLInputElement>(null);
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
  const [profileSaveMessage, setProfileSaveMessage] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [handleSuggestions, setHandleSuggestions] = useState<string[]>([]);
  const [isCheckingHandle, setIsCheckingHandle] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const applyProfileSettings = (profileSettings: StoredProfileSettings) => {
      if (cancelled) return;

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

      const savedAvatarId = profileSettings.selectedAvatar || 'blueAvatar';
      const avatarIndex = aiAgentAvatars.findIndex(avatar => avatar.id === savedAvatarId);
      if (avatarIndex !== -1) {
        setSelectedAgent(avatarIndex);
      }
    };

    const loadStoredSettings = () => getStoredProfileSettings({
      fallbackName: 'Jess Wu',
      fallbackEmail: 'user@gmail.com',
    });

    // Load user data
    applyProfileSettings(loadStoredSettings());
    
    // Determine auth method
    const method = localStorage.getItem('authMethod') || 'email';
    setAuthMethod(method);

    void hydrateRemoteProfileSettings()
      .then((settings) => {
        if (!settings || cancelled) return;
        writeStoredProfileSettings(settings);
        applyProfileSettings(loadStoredSettings());
        notifyProfileSettingsUpdated();
        syncCurrentUserNetworkProfile();
      })
      .catch((error) => {
        console.warn('Remote profile settings sync skipped:', error);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const saveInvestmentProfile = (investmentProfile: string) => {
    setSelectedInvestment(investmentProfile);

    const userProfileData = safeGetItem('userProfile');
    const parsedProfile = userProfileData ? JSON.parse(userProfileData) : {};
    parsedProfile.investmentProfile = investmentProfile;
    safeSetItem('userProfile', JSON.stringify(parsedProfile));
    safeSetItem('investmentProfile', investmentProfile);
    notifyProfileSettingsUpdated();
    void saveRemoteProfileSettings({ investmentProfile }).catch((error) => {
      console.warn('Remote investment profile sync skipped:', error);
    });
  };

  const saveTags = (nextTags: string[]) => {
    setTags(nextTags);
    safeSetItem('profileTags', JSON.stringify(nextTags));
    notifyProfileSettingsUpdated();
    void saveRemoteProfileSettings({ tags: nextTags }).catch((error) => {
      console.warn('Remote profile tags sync skipped:', error);
    });
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
    logoutUser();
    navigate('/login');
  };

  const formatHandleInput = (value: string) => {
    const cleaned = value.trim().replace(/^@+/, '').toLowerCase().replace(/[^a-z0-9_]+/g, '');
    return cleaned ? `@${cleaned}` : '';
  };

  const getHandleStem = (value: string) => (
    value
      .trim()
      .replace(/^@+/, '')
      .toLowerCase()
      .replace(/[^a-z0-9_]+/g, '')
      .slice(0, 22)
  );

  const isCurrentUserProfile = (profile: { id?: string; name?: string; handle?: string }) => {
    const currentUserId = safeGetItem('user_id') || '';
    const currentEmail = safeGetItem('user_email') || '';
    const currentName = (userName || safeGetItem('userName') || '').trim().toLowerCase();
    const currentHandle = (safeGetItem('userHandle') || userHandle || '').trim().toLowerCase();
    const profileId = `${profile.id || ''}`.trim().toLowerCase();
    const profileName = `${profile.name || ''}`.trim().toLowerCase();
    const profileHandle = `${profile.handle || ''}`.trim().toLowerCase();

    return Boolean(
      (currentUserId && profileId === currentUserId.toLowerCase()) ||
      (currentEmail && profileId === currentEmail.toLowerCase()) ||
      (currentHandle && profileHandle === currentHandle && currentName && profileName === currentName)
    );
  };

  const getAvailableHandleSuggestions = (
    requestedHandle: string,
    profiles: Array<{ id?: string; name?: string; handle?: string }>,
  ) => {
    const normalizedRequested = formatHandleInput(requestedHandle);
    const takenHandles = new Set(
      profiles
        .filter((profile) => !isCurrentUserProfile(profile))
        .map((profile) => formatHandleInput(profile.handle || '').toLowerCase())
        .filter(Boolean),
    );

    const seedStems = [
      getHandleStem(normalizedRequested),
      getHandleStem(userName),
      getHandleStem(userEmail.split('@')[0] || ''),
      'moneetize',
    ].filter(Boolean);
    const uniqueStems = [...new Set(seedStems)];
    const suffixes = ['pre', 'team', 'wins', 'app', 'club', 'official'];
    const suggestions: string[] = [];

    const addCandidate = (candidateStem: string) => {
      const candidate = formatHandleInput(candidateStem);
      if (
        candidate &&
        candidate !== normalizedRequested.toLowerCase() &&
        !takenHandles.has(candidate.toLowerCase()) &&
        !suggestions.includes(candidate)
      ) {
        suggestions.push(candidate);
      }
    };

    uniqueStems.forEach((stem) => {
      suffixes.forEach((suffix) => addCandidate(`${stem}${suffix}`));
      for (let index = 2; index <= 25; index += 1) {
        addCandidate(`${stem}${index}`);
      }
    });

    for (let index = 26; suggestions.length < 3 && index < 200; index += 1) {
      addCandidate(`moneetize${index}`);
    }

    return suggestions.slice(0, 3);
  };

  const showHandleUnavailable = async (handle: string, message?: string) => {
    const normalizedHandle = formatHandleInput(handle);
    const profiles = await loadRecommendedFriends().catch(() => []);
    const suggestions = getAvailableHandleSuggestions(normalizedHandle, profiles);

    setHandleSuggestions(suggestions);
    setProfileSaveMessage(
      message ||
      `${normalizedHandle} is not available. Choose one of these available profile names.`
    );
  };

  const ensureHandleAvailable = async (handle: string) => {
    const normalizedHandle = formatHandleInput(handle);
    if (!normalizedHandle) {
      setProfileSaveMessage('Choose a profile handle before saving.');
      setHandleSuggestions([]);
      return false;
    }

    setIsCheckingHandle(true);

    try {
      const profiles = await loadRecommendedFriends();
      const duplicate = profiles.find((profile) => (
        !isCurrentUserProfile(profile) &&
        profile.handle.trim().toLowerCase() === normalizedHandle.toLowerCase()
      ));

      if (duplicate) {
        const suggestions = getAvailableHandleSuggestions(normalizedHandle, profiles);
        setHandleSuggestions(suggestions);
        setProfileSaveMessage(`${normalizedHandle} is already in use. Choose one of these available profile names.`);
        return false;
      }

      setHandleSuggestions([]);
      setProfileSaveMessage('');
      return true;
    } catch (error) {
      console.warn('Profile handle availability check skipped:', error);
      setProfileSaveMessage('We could not check that profile name yet. Please try again.');
      return false;
    } finally {
      setIsCheckingHandle(false);
    }
  };

  const handleSaveName = () => {
    if (tempName.trim()) {
      setUserName(tempName.trim());
      safeSetItem('userName', tempName.trim());
      notifyProfileSettingsUpdated();
      void saveRemoteProfileSettings({ name: tempName.trim() }).catch((error) => {
        console.warn('Remote profile name sync skipped:', error);
      });
      setEditingName(false);
    }
  };

  const saveHandleValue = async (value: string) => {
    const formattedHandle = formatHandleInput(value);
    if (!formattedHandle) {
      setProfileSaveMessage('Choose a profile handle before saving.');
      return;
    }

    const isAvailable = await ensureHandleAvailable(formattedHandle);
    if (!isAvailable) return;

    try {
      await saveRemoteProfileSettings({ handle: formattedHandle });
      setUserHandle(formattedHandle);
      setTempHandle(formattedHandle);
      safeSetItem('userHandle', formattedHandle);
      notifyProfileSettingsUpdated();
      setHandleSuggestions([]);
      setProfileSaveMessage('');
      setEditingHandle(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save this handle.';
      console.warn('Remote profile handle sync skipped:', error);
      await showHandleUnavailable(formattedHandle, message);
    }
  };

  const handleSaveHandle = async () => {
    if (tempHandle.trim()) {
      await saveHandleValue(tempHandle);
    }
  };

  const handleCancelEdit = () => {
    setTempName(userName);
    setTempHandle(userHandle);
    setEditingName(false);
    setEditingHandle(false);
  };

  const handleSaveProfile = async () => {
    if (isSavingProfile) return;

    setProfileSaveMessage('');
    const selectedAvatarId = aiAgentAvatars[selectedAgent]?.id || 'blueAvatar';
    const formattedHandle = formatHandleInput(userHandle || userName);
    const isHandleAvailable = await ensureHandleAvailable(formattedHandle);
    if (!isHandleAvailable) return;

    if (!safeGetItem('access_token')) {
      setProfileSaveMessage('Please log in again before saving your profile.');
      return;
    }

    const nextSettings = {
      name: userName.trim() || 'Moneetize User',
      handle: formattedHandle,
      email: userEmail.trim(),
      interests: selectedInterests,
      investmentProfile: selectedInvestment,
      tags,
      agentName,
      selectedAvatar: selectedAvatarId,
      photo: userPhoto,
      profileComplete: true,
      completedAt: new Date().toISOString(),
    };

    try {
      setIsSavingProfile(true);
      const savedSettings = await saveRemoteProfileSettings(nextSettings);
      writeStoredProfileSettings(savedSettings || nextSettings);
      markProfileCompleted();
      notifyProfileSettingsUpdated();
      syncCurrentUserNetworkProfile();
    } catch (error) {
      console.warn('Remote profile settings save skipped:', error);
      const message = error instanceof Error ? error.message : 'Unable to save profile settings.';
      if (message.toLowerCase().includes('handle') || message.toLowerCase().includes('profile name')) {
        await showHandleUnavailable(formattedHandle, message);
      } else {
        setProfileSaveMessage(message);
      }
      setIsSavingProfile(false);
      return;
    }

    if (safeGetItem('access_token')) {
      try {
        await updateUserProfile({ name: userName.trim() });
      } catch (error) {
        console.warn('Supabase profile name sync skipped:', error);
      }
    }

    const nextPath = sessionStorage.getItem('moneetizeProfileCompletionReturnPath') || '/profile-screen';
    sessionStorage.removeItem('moneetizeProfileCompletionReturnPath');
    navigate(nextPath.startsWith('/') ? nextPath : '/profile-screen');
    setIsSavingProfile(false);
  };

  const handleChooseProfilePhoto = () => {
    photoInputRef.current?.click();
  };

  const handleProfilePhotoChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const photo = await resizeProfilePhoto(file);
      setUserPhoto(photo);
      const savedLocally = saveProfilePhoto(photo);
      notifyProfileSettingsUpdated();
      syncCurrentUserNetworkProfile();
      setProfileSaveMessage(savedLocally ? 'Saving profile photo...' : 'Photo was compressed, but local storage is full. Saving remotely...');

      try {
        const savedSettings = await saveRemoteProfileSettings({ photo });
        if (savedSettings) {
          writeStoredProfileSettings(savedSettings);
          setUserPhoto(getStoredProfileSettings({ fallbackName: userName, fallbackEmail: userEmail }).photo || photo);
          notifyProfileSettingsUpdated();
          syncCurrentUserNetworkProfile();
        }
        setProfileSaveMessage('');
      } catch (error) {
        console.warn('Remote profile photo sync skipped:', error);
        setProfileSaveMessage('Photo is ready locally. Tap Save Profile to retry saving it to your account.');
      }
    } catch (error) {
      console.error('Profile photo update failed:', error);
      setProfileSaveMessage(error instanceof Error ? error.message : 'Profile photo update failed.');
    } finally {
      event.target.value = '';
    }
  };

  const handleRemoveProfilePhoto = () => {
    setUserPhoto('');
    clearProfilePhoto();
    notifyProfileSettingsUpdated();
    syncCurrentUserNetworkProfile();
    void saveRemoteProfileSettings({ photo: '' }).catch((error) => {
      console.warn('Remote profile photo removal sync skipped:', error);
    });
  };

  const renderAgentVisual = (avatar = aiAgentAvatars[selectedAgent]) => {
    if (avatar.image) {
      return (
        <img
          src={avatar.image}
          alt={avatar.name}
          className={`h-full w-full object-cover opacity-90 ${avatar.imageClass || ''}`}
        />
      );
    }

    return (
      <>
        <span className="absolute inset-0" style={{ background: avatar.background }} />
        <span
          className="absolute inset-0 opacity-70 mix-blend-screen"
          style={{
            background:
              'radial-gradient(circle at 30% 24%, rgba(255,255,255,0.26), transparent 20%), radial-gradient(circle at 70% 72%, rgba(255,255,255,0.18), transparent 24%)',
          }}
        />
        <span className="absolute inset-0 rounded-full shadow-[inset_0_0_24px_rgba(255,255,255,0.2),inset_0_-20px_28px_rgba(0,0,0,0.55)]" />
      </>
    );
  };

  const renderAnimatedAgentAvatar = (
    sizeClass = 'h-12 w-12',
    avatar = aiAgentAvatars[selectedAgent],
    isSelected = false,
  ) => {
    const accent = avatar.accent || '#9b87f5';
    const glow = avatar.glow || 'rgba(139, 116, 246, 0.54)';

    return (
      <span className={`relative block ${sizeClass}`}>
        <motion.span
          className="absolute inset-0 rounded-full blur-lg opacity-40"
          style={{ background: glow }}
          animate={{ opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.span
          animate={{
            rotate: 360,
            scale: [1, 1.05, 1],
          }}
          transition={{
            rotate: { duration: 20, repeat: Infinity, ease: 'linear' },
            scale: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
          }}
          className="relative block h-full w-full overflow-hidden rounded-full border transition-colors"
          style={{
            borderColor: isSelected ? '#ffffff' : accent,
            boxShadow: isSelected ? `0 0 0 2px rgba(255,255,255,0.82), 0 0 26px ${glow}` : `0 0 22px ${glow}`,
            maskImage: 'radial-gradient(circle at center, black 40%, transparent 90%)',
            WebkitMaskImage: 'radial-gradient(circle at center, black 40%, transparent 90%)',
          }}
        >
          {renderAgentVisual(avatar)}
        </motion.span>
      </span>
    );
  };

  const renderUserAvatar = (sizeClass = 'h-20 w-20', ringClass = 'border-white/80') => (
    <div className={`${sizeClass} overflow-hidden rounded-full border-2 ${ringClass} bg-[#2d3035] shadow-[0_0_24px_rgba(255,255,255,0.18)]`}>
      {userPhoto ? (
        <img src={userPhoto} alt={userName} className="h-full w-full object-cover" />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-sm font-black text-white/70">
          {getInitials(userName)}
        </span>
      )}
    </div>
  );

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
      {SHOW_THIRD_PARTY_LOGINS && (
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
      )}

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
        className="pb-28"
      >
        <section className="min-h-[calc(100dvh-3rem)] overflow-hidden rounded-[1.55rem] border border-white/8 bg-gradient-to-b from-[#1c1f22] via-[#17191c] to-[#121416] px-4 pb-5 pt-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_22px_80px_rgba(0,0,0,0.54)]">
          <div className="mb-4 flex items-center justify-center gap-5">
            <button
              onClick={() => navigate(-1)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/8 text-white/80 transition-colors hover:bg-white/14"
              aria-label="Go back"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={handleChooseProfilePhoto}
                className="h-[68px] w-[68px] overflow-hidden rounded-full border-2 border-orange-400/80 bg-[#2d3035] shadow-[0_0_20px_rgba(255,136,22,0.28)]"
                aria-label="Change profile photo"
              >
                {userPhoto ? (
                  <img src={userPhoto} alt={userName} className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-lg font-black text-white/70">
                    {getInitials(userName)}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={handleChooseProfilePhoto}
                className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-white text-black shadow-lg"
                aria-label="Upload profile photo"
              >
                <Edit3 className="h-3 w-3" />
              </button>
              {userPhoto && (
                <button
                  type="button"
                  onClick={handleRemoveProfilePhoto}
                  className="absolute -left-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#df555a] text-white shadow-lg"
                  aria-label="Remove profile photo"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            <button
              onClick={() => setCurrentView('agent')}
              className="relative h-11 w-11"
              aria-label="Edit AI agent"
            >
              {renderAnimatedAgentAvatar('h-11 w-11')}
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

          {SHOW_THIRD_PARTY_LOGINS && (
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
          )}

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

          {profileSaveMessage && (
            <p className="mx-auto mb-3 max-w-[280px] rounded-full border border-red-300/18 bg-red-400/[0.08] px-4 py-2 text-center text-[11px] font-bold text-red-100/88">
              {profileSaveMessage}
            </p>
          )}

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
      className="pb-4 pt-5"
    >
      <section className="min-h-[calc(100dvh-4.25rem)] overflow-hidden rounded-[1.6rem] border border-white/8 bg-gradient-to-b from-[#1b1d1f] via-[#17191b] to-[#111315] px-5 pb-8 pt-9 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_24px_78px_rgba(0,0,0,0.62)]">
        <div className="mb-12 flex items-center justify-center gap-5">
          <button
            onClick={() => setCurrentView('main')}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white/8 text-white/82 transition-colors hover:bg-white/14"
            aria-label="Back to profile settings"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          {renderAnimatedAgentAvatar('h-[76px] w-[76px]', aiAgentAvatars[selectedAgent], true)}

          {renderUserAvatar('h-12 w-12', 'border-white/82')}
        </div>

        <h2 className="mb-5 text-center text-xl font-black text-white">Personal Agent Information</h2>

        <div className="mb-9 flex min-h-[60px] items-center gap-3 rounded-full border border-white/8 bg-white/[0.07] px-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
          <input
            type="text"
            value={agentName}
            onChange={(e) => {
              setAgentName(e.target.value);
              safeSetItem('agentName', e.target.value);
              notifyProfileSettingsUpdated();
            }}
            className="min-w-0 flex-1 bg-transparent text-base font-semibold text-white outline-none placeholder:text-white/38"
            placeholder="My AI Agent"
            aria-label="AI agent name"
          />
          <Edit3 className="h-4 w-4 shrink-0 text-white/54" />
        </div>

        <div className="mx-auto grid max-w-[286px] grid-cols-3 gap-x-9 gap-y-9">
          {aiAgentAvatars.map((avatar, idx) => {
            const isSelected = selectedAgent === idx;

            return (
              <button
                key={avatar.id}
                type="button"
                onClick={() => {
                  setSelectedAgent(idx);
                  safeSetItem('selectedAvatar', avatar.id);
                  notifyProfileSettingsUpdated();
                  void saveRemoteProfileSettings({ selectedAvatar: avatar.id }).catch((error) => {
                    console.warn('Remote AI avatar sync skipped:', error);
                  });
                }}
                className="relative h-[70px] w-[70px] rounded-full transition-transform hover:scale-105"
                aria-pressed={isSelected}
                aria-label={`Choose ${avatar.name}`}
              >
                {renderAnimatedAgentAvatar('h-[70px] w-[70px]', avatar, isSelected)}
                {isSelected && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white text-black shadow-[0_8px_18px_rgba(0,0,0,0.35)]"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </motion.span>
                )}
              </button>
            );
          })}
        </div>
      </section>
    </motion.div>
  );

  // Interests View
  const renderInterestsView = () => {
    const quickInterestDefaults = ['home', 'photo', 'pets', 'grocery'];
    const quickInterestIds = [...selectedInterests, ...quickInterestDefaults.filter((interestId) => !selectedInterests.includes(interestId))].slice(0, 4);
    const quickInterestCategories = quickInterestIds
      .map((interestId) => interestCategories.find((category) => category.id === interestId))
      .filter((category): category is (typeof interestCategories)[number] => Boolean(category));

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="pb-4 pt-5"
      >
        <section className="min-h-[calc(100dvh-4.25rem)] overflow-hidden rounded-[1.6rem] border border-white/8 bg-gradient-to-b from-[#1b1d1f] via-[#17191b] to-[#111315] px-5 pb-6 pt-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_24px_78px_rgba(0,0,0,0.62)]">
          <div className="mb-4 flex items-center justify-center gap-5">
            <button
              onClick={() => setCurrentView('main')}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-white/8 text-white/82 transition-colors hover:bg-white/14"
              aria-label="Back to profile settings"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <div className="h-[76px] w-[76px] overflow-hidden rounded-full border-2 border-white/80 bg-gradient-to-br from-purple-500 to-pink-500 shadow-[0_0_24px_rgba(255,255,255,0.18)]">
              {userPhoto && <img src={userPhoto} alt={userName} className="h-full w-full object-cover" />}
            </div>

            <button
              onClick={() => setCurrentView('agent')}
              className="relative h-12 w-12"
              aria-label="Edit AI agent"
            >
              {renderAnimatedAgentAvatar('h-12 w-12')}
            </button>
          </div>

          <h2 className="mb-5 text-center text-xl font-black text-white">What inspires you</h2>

          <div className="mb-7 flex items-center justify-center gap-3">
            {quickInterestCategories.map((category) => {
              const IconComponent = category.icon;

              return (
                <button
                  key={category.id}
                  onClick={() => toggleInterest(category.id)}
                  className={`flex h-11 w-11 items-center justify-center rounded-full border transition-colors ${
                    selectedInterests.includes(category.id)
                      ? 'border-white/24 bg-white/14 text-white'
                      : 'border-white/8 bg-white/8 text-white/68 hover:bg-white/14 hover:text-white'
                  }`}
                  aria-label={`Toggle ${category.name}`}
                >
                  <IconComponent className="h-4.5 w-4.5" />
                </button>
              );
            })}
          </div>

          <div className="relative mx-auto h-[545px] max-w-[320px]">
            {interestBubbleLayout.map((bubble, index) => {
              const category = interestCategories.find((item) => item.id === bubble.id);
              if (!category) return null;

              const IconComponent = category.icon;
              const isSelected = selectedInterests.includes(category.id);
              const isFeatured = isSelected || bubble.opacity >= 0.95;

              return (
                <motion.button
                  key={category.id}
                  type="button"
                  onClick={() => toggleInterest(category.id)}
                  className={`absolute flex flex-col items-center justify-center rounded-full border text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.07),0_16px_42px_rgba(0,0,0,0.34)] transition-all ${
                    isSelected
                      ? 'border-white/30 bg-gradient-to-b from-[#303235] to-[#17191b] text-white'
                      : 'border-white/7 bg-gradient-to-b from-[#1d2023]/90 to-[#101214]/96 text-white/42 hover:border-white/16 hover:text-white/76'
                  }`}
                  style={{
                    left: bubble.left,
                    top: bubble.top,
                    width: bubble.size,
                    height: bubble.size,
                    opacity: isSelected ? 1 : bubble.opacity,
                  }}
                  animate={{ y: [0, index % 2 === 0 ? -4 : 4, 0] }}
                  transition={{
                    duration: 4 + (index % 4) * 0.45,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: index * 0.08,
                  }}
                  aria-pressed={isSelected}
                  aria-label={`Toggle ${category.name}`}
                >
                  <IconComponent className={`mb-2 h-5 w-5 ${isFeatured ? 'text-white' : 'text-white/42'}`} />
                  <span className={`text-[12px] font-black ${isFeatured ? 'text-white' : 'text-white/42'}`}>
                    {category.name}
                  </span>
                </motion.button>
              );
            })}
          </div>

          <button
            onClick={() => {
              safeSetItem('selectedInterests', JSON.stringify(selectedInterests));
              notifyProfileSettingsUpdated();
              void saveRemoteProfileSettings({ interests: selectedInterests }).catch((error) => {
                console.warn('Remote interests sync skipped:', error);
              });
              setCurrentView('main');
            }}
            className="mt-6 w-full rounded-full bg-white px-6 py-3.5 text-sm font-black text-black shadow-[0_16px_38px_rgba(0,0,0,0.34)] transition-colors hover:bg-gray-100"
          >
            Save Changes
          </button>
        </section>
      </motion.div>
    );
  };

  // Password Change View
  const renderPasswordView = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pb-4 pt-5"
    >
      <section className="min-h-[calc(100dvh-4.25rem)] overflow-hidden rounded-[1.6rem] border border-white/8 bg-gradient-to-b from-[#1b1d1f] via-[#17191b] to-[#111315] px-5 pb-8 pt-9 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_24px_78px_rgba(0,0,0,0.62)]">
      <div className="mb-12 flex items-center justify-center gap-5">
        <button
          onClick={() => setCurrentView('main')}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-white/8 text-white/82 transition-colors hover:bg-white/14"
          aria-label="Back to profile settings"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        {renderUserAvatar('h-[76px] w-[76px]', 'border-white/82')}

        <button
          onClick={() => setCurrentView('agent')}
          className="relative h-12 w-12"
          aria-label="Edit AI agent"
        >
          {renderAnimatedAgentAvatar('h-12 w-12')}
        </button>
      </div>

      <h2 className="mb-5 text-center text-xl font-black text-white">Change Password</h2>

      <div className="space-y-3">
      <div className="flex min-h-[60px] items-center gap-3 rounded-full border border-white/8 bg-white/[0.07] px-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
        <Lock className="h-5 w-5 shrink-0 text-white/72" />
        <input
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••••"
          className="min-w-0 flex-1 bg-transparent text-base font-semibold text-white outline-none placeholder:text-white/78"
          aria-label="New password"
        />
        <button
          onClick={() => setShowPassword(!showPassword)}
          type="button"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/58 transition-colors hover:bg-white/10 hover:text-white"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>

      <div className="flex min-h-[60px] items-center gap-3 rounded-full border border-white/8 bg-white/[0.07] px-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
        <Lock className="h-5 w-5 shrink-0 text-white/72" />
        <input
          type={showConfirmPassword ? 'text' : 'password'}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm Password"
          className="min-w-0 flex-1 bg-transparent text-base font-semibold text-white outline-none placeholder:text-white/46"
          aria-label="Confirm password"
        />
        <button
          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          type="button"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/58 transition-colors hover:bg-white/10 hover:text-white"
          aria-label={showConfirmPassword ? 'Hide confirmation password' : 'Show confirmation password'}
        >
          {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>
      </div>

      <div className="mt-10 flex justify-center">
      <button
        onClick={() => {
          if (password && password === confirmPassword) {
            setCurrentView('main');
          }
        }}
        disabled={!password || password !== confirmPassword}
        className="rounded-full bg-white px-9 py-3.5 text-base font-black text-black shadow-[0_16px_38px_rgba(0,0,0,0.34)] transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Confirm
      </button>
      </div>
      </section>
    </motion.div>
  );

  return (
    <div className="absolute inset-0 flex h-full w-full flex-col overflow-hidden bg-black">
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        onChange={handleProfilePhotoChange}
        className="hidden"
      />
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

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-32 pt-8 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="mx-auto max-w-md">
        <AnimatePresence mode="wait">
          {currentView === 'main' && renderUpdatedMainView()}
          {currentView === 'agent' && renderAgentView()}
          {currentView === 'interests' && renderInterestsView()}
          {currentView === 'password' && renderPasswordView()}
        </AnimatePresence>
        </div>
      </div>

      {currentView === 'main' && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[70] mx-auto max-w-md bg-gradient-to-t from-black via-black/92 to-transparent px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-7">
          {profileSaveMessage && (
            <p className="mx-auto mb-2 max-w-[310px] rounded-full border border-red-300/18 bg-red-400/[0.12] px-4 py-2 text-center text-[11px] font-bold text-red-100/90">
              {profileSaveMessage}
            </p>
          )}
          <button
            onClick={handleSaveProfile}
            disabled={isSavingProfile}
            className="pointer-events-auto mx-auto flex w-full max-w-[260px] items-center justify-center rounded-full bg-white px-10 py-3.5 text-[13px] font-black text-black shadow-[0_14px_34px_rgba(255,255,255,0.16)] transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-65"
          >
            {isSavingProfile ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      )}

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
                  onChange={(e) => {
                    setTempHandle(e.target.value);
                    setHandleSuggestions([]);
                    setProfileSaveMessage('');
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && void handleSaveHandle()}
                  placeholder="username"
                  className="flex-1 bg-transparent text-white outline-none placeholder:text-gray-500"
                  autoFocus
                />
              </div>

              {profileSaveMessage && (
                <p className="mb-3 rounded-2xl border border-red-300/18 bg-red-400/[0.08] px-4 py-3 text-center text-[12px] font-bold leading-snug text-red-100/88">
                  {profileSaveMessage}
                </p>
              )}

              {handleSuggestions.length > 0 && (
                <div className="mb-5">
                  <p className="mb-2 text-center text-[11px] font-bold uppercase tracking-[0.08em] text-white/42">
                    Available now
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {handleSuggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => void saveHandleValue(suggestion)}
                        disabled={isCheckingHandle}
                        className="rounded-full border border-[#83e6d2]/30 bg-[#83e6d2]/12 px-3.5 py-2 text-[12px] font-black text-[#bffcf1] transition-colors hover:bg-[#83e6d2]/20 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleCancelEdit}
                  className="flex-1 bg-[#2a2d3e] text-white py-3 rounded-full font-semibold hover:bg-[#35384a] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => void handleSaveHandle()}
                  disabled={!tempHandle.trim() || isCheckingHandle}
                  className="flex-1 bg-white text-black py-3 rounded-full font-bold hover:bg-gray-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCheckingHandle ? 'Checking...' : 'Save'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
