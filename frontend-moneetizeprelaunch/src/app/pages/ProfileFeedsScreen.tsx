import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Home, 
  Plus, 
  User,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Award,
  ChevronLeft,
  ChevronRight,
  X,
  UserPlus,
  Users,
  Camera,
  MapPin,
  Shield
} from 'lucide-react';
import { safeGetItem } from '../utils/storage';
import { getStoredProfileSettings, PROFILE_SETTINGS_UPDATED_EVENT } from '../utils/profileSettings';
import { getUserPoints } from '../utils/pointsManager';
import { getQuests, initializeQuests, Quest, getQuestStats } from '../utils/questManager';
import { 
  PersonalityQuizModal, 
  DailyCheckInModal, 
  ShareProductsModal, 
  ReviewItemsModal, 
  SurveyModal, 
  ContentCreationModal, 
  PortfolioActivityModal 
} from '../components/QuestModals';
import { QuestToast } from '../components/QuestToast';
import gemIcon from 'figma:asset/296d8aa06fd9c7e60192bc7368a4a032ec5bc17e.png';
import levelToken from 'figma:asset/deed11003559fbb0587b8eda69aec64d766851f5.png';
import networkImage from 'figma:asset/a6df038d85b40a458dd7a92387ec7182f8ab913f.png';
import svgPaths from '../../imports/svg-vs14lwuhcw';
import GemBadge from '../../imports/Frame2147225422';
import { isUserAdmin } from '../services/authService';
import { loadProductCatalog, type Product } from '../services/productService';
import { PROFILE_FEED_FALLBACK_PRODUCTS } from '../data/portfolioProducts';
import { getAgentAvatarTone, getSelectedAvatarImage } from '../utils/avatarUtils';
import { hydrateRemoteProfileSettings } from '../services/profilePersistenceService';

interface Post {
  id: string;
  author: {
    name: string;
    username: string;
    avatar: string;
  };
  content: string;
  product: Product;
  likes: number;
  comments: number;
  shares: number;
  timestamp: string;
  hashtags: string[];
}

export function ProfileFeedsScreen() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'feed' | 'network' | 'saved' | 'leaderboard' | 'quests' | 'gameplay'>('feed');
  const [leaderboardView, setLeaderboardView] = useState<'personal' | 'team'>('team');
  const [roiTriptoMode, setRoiTriptoMode] = useState(true);
  const [userName, setUserName] = useState('Jess Wu');
  const [userHandle, setUserHandle] = useState('@healthyhabits');
  const [userPhoto, setUserPhoto] = useState<string>('');
  const [balance, setBalance] = useState(345);
  const [followers, setFollowers] = useState(78);
  const [following, setFollowing] = useState(46);
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedAvatar, setSelectedAvatar] = useState<string>('');
  const [userInterests, setUserInterests] = useState<string[]>([]);
  const [investmentProfile, setInvestmentProfile] = useState<string>('');
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set());
  const [quests, setQuests] = useState<Quest[]>([]);
  const [activeQuestModal, setActiveQuestModal] = useState<{ type: string; questId: number } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [networkSuccess, setNetworkSuccess] = useState<{ name: string; image: string } | null>(null);
  const [networkRefreshKey, setNetworkRefreshKey] = useState(0);

  // Define loadQuests as a ref callback to avoid dependency issues
  const loadQuestsRef = useRef<() => void>();
  loadQuestsRef.current = () => {
    const loadedQuests = getQuests();
    setQuests(loadedQuests);
  };

  // Component-level quest completion handler
  const handleQuestComplete = useCallback(() => {
    if (loadQuestsRef.current) {
      loadQuestsRef.current();
    }
    setBalance(getUserPoints());
  }, []);

  useEffect(() => {
    // Initialize quests on component mount
    initializeQuests();
    if (loadQuestsRef.current) {
      loadQuestsRef.current();
    }
    
    // Listen for quest completion events
    const handleQuestCompleteEvent = (event: CustomEvent) => {
      handleQuestComplete();
    };
    
    window.addEventListener('questCompleted', handleQuestCompleteEvent as EventListener);
    
    // Load user points from pointsUtils
    const points = getUserPoints();
    
    // Check if user is admin
    setIsAdmin(isUserAdmin());
    
    const applyStoredProfileSettings = () => {
      const profileSettings = getStoredProfileSettings({
        fallbackName: 'User',
        fallbackHandle: '@healthyhabits',
      });

      setUserName(profileSettings.name);
      setUserHandle(profileSettings.handle);
      setUserPhoto(profileSettings.photo);
      setSelectedAvatar(profileSettings.selectedAvatar);
      setUserInterests(profileSettings.interests);
      setInvestmentProfile(profileSettings.investmentProfile);

      return profileSettings;
    };

    const loadedProfileSettings = applyStoredProfileSettings();

    void hydrateRemoteProfileSettings()
      .then((settings) => {
        if (!settings) return;
        const profileSettings = applyStoredProfileSettings();
        loadProducts(profileSettings.interests, profileSettings.investmentProfile);
      })
      .catch((error) => {
        console.warn('Remote profile settings hydration skipped:', error);
      });

    // Set balance from points
    setBalance(points);

    // Load products from IndexedDB with the loaded interests
    loadProducts(loadedProfileSettings.interests, loadedProfileSettings.investmentProfile);
    
    // Listen for storage changes (when interests are updated in settings)
    const handleStorageChange = (e: StorageEvent) => {
      const syncedKeys = ['selectedInterests', 'userProfile', 'investmentProfile', 'userName', 'userHandle', 'userPhoto', 'selectedAvatar', 'profileTags', 'agentName'];
      if (!e.key || syncedKeys.includes(e.key)) {
        const profileSettings = applyStoredProfileSettings();
        loadProducts(profileSettings.interests, profileSettings.investmentProfile);
      }
    };
    
    const handleProfileSettingsUpdated = () => {
      const profileSettings = applyStoredProfileSettings();
      loadProducts(profileSettings.interests, profileSettings.investmentProfile);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener(PROFILE_SETTINGS_UPDATED_EVENT, handleProfileSettingsUpdated);
    
    // Also listen for visibility change to reload when returning from settings
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const profileSettings = applyStoredProfileSettings();
        loadProducts(profileSettings.interests, profileSettings.investmentProfile);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('questCompleted', handleQuestCompleteEvent as EventListener);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener(PROFILE_SETTINGS_UPDATED_EVENT, handleProfileSettingsUpdated);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const loadProducts = async (interests: string[] = userInterests, investProfile: string = investmentProfile) => {
    let products: Product[] = [];

    try {
      products = await loadProductCatalog();
    } catch (error) {
      console.error('Failed to load product catalog:', error);
      products = PROFILE_FEED_FALLBACK_PRODUCTS;
    }

    if (products.length === 0) {
      products = PROFILE_FEED_FALLBACK_PRODUCTS;
    }
    
    console.log('Total products loaded:', products.length);
    console.log('User interests:', interests);
    console.log('Investment profile:', investProfile);
    
    // Create mapping between interest IDs and categories/keywords for better matching
    const interestMapping: { [key: string]: string[] } = {
      'pets': ['pets', 'pet', 'animal', 'dog', 'cat', 'puppy', 'kitten'],
      'beauty': ['beauty', 'makeup', 'cosmetics', 'skincare'],
      'photo': ['camera', 'photography', 'photo'],
      'books': ['books', 'book', 'reading', 'novel', 'publisher', 'literature', 'fiction', 'non-fiction'],
      'home': ['home', 'furniture', 'decor', 'house', 'kitchen'],
      'tech': ['tech', 'technology', 'electronics', 'computer', 'gadgets', 'gadget', 'device', 'smartphone', 'laptop', 'tablet'],
      'tech & gadgets': ['tech', 'technology', 'electronics', 'computer', 'gadgets', 'gadget', 'device', 'smartphone', 'laptop', 'tablet'],
      'movies': ['movies', 'movie', 'film', 'cinema', 'dvd', 'blu-ray', 'streaming service', 'netflix', 'disney'],
      'art': ['art', 'craft', 'creative', 'painting', 'drawing'],
      'fitness': ['fitness', 'exercise', 'workout', 'gym', 'sports'],
      'food': ['food', 'snack', 'cooking'],
      'grocery': ['grocery', 'groceries'],
      'gaming': ['gaming', 'game', 'video game', 'console', 'playstation', 'xbox'],
      'lifestyle': ['lifestyle', 'fashion', 'style', 'clothing', 'apparel'],
      'recreation & hobbies': ['recreation', 'hobby', 'hobbies', 'outdoor', 'camping', 'hiking']
    };

    // Create exclusion map - categories to exclude if user doesn't have that interest
    const categoryExclusions: { [key: string]: string[] } = {
      'tech & gadgets': ['television', 'tv', 'monitor', 'laptop', 'computer', 'tablet', 'smartphone', 'electronics', 'gadget', 'tech'],
      'recreation & hobbies': ['recreation', 'hobby', 'hobbies', 'outdoor', 'camping', 'hiking'],
      'fitness': ['fitness', 'exercise', 'workout', 'gym', 'sports equipment'],
      'gaming': ['gaming', 'game', 'console', 'playstation', 'xbox', 'nintendo'],
      'home': ['furniture', 'home decor', 'appliance'],
      'art': ['art supplies', 'craft', 'painting'],
      'lifestyle': ['fashion', 'clothing', 'apparel'],
      'beauty': ['beauty', 'makeup', 'cosmetic'],
      'food': ['food', 'snack', 'cooking'],
      'grocery': ['grocery', 'groceries']
    };

    // Filter products based on user interests and investment profile
    const filteredProducts = products.filter(product => {
      // If user has no interests selected, show all products
      if (interests.length === 0) {
        return true;
      }

      // Get all user interests in lowercase
      const userInterestsLower = interests.map(i => i.toLowerCase());

      // EXCLUSION PHASE: Remove products from categories user doesn't have
      const productText = `${product.name} ${product.category} ${product.tags.join(' ')}`.toLowerCase();
      
      // Check each exclusion category
      for (const [category, exclusionKeywords] of Object.entries(categoryExclusions)) {
        // If user doesn't have this category as an interest
        if (!userInterestsLower.includes(category)) {
          // Check if product matches this excluded category
          const matchesExcludedCategory = exclusionKeywords.some(keyword => {
            // Use word boundary matching for more precision
            const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');
            return regex.test(productText);
          });
          
          if (matchesExcludedCategory) {
            return false; // Exclude this product
          }
        }
      }

      // INCLUSION PHASE: Check if product matches any user interest
      const matchesInterests = interests.some(interest => {
        const interestLower = interest.toLowerCase();
        const keywords = interestMapping[interestLower] || [interestLower];
        
        // Check product tags - use exact matching for better precision
        const matchesTags = product.tags.length > 0 && product.tags.some(tag => {
          const tagLower = tag.toLowerCase().trim();
          // Skip empty tags
          if (!tagLower) return false;
          
          return keywords.some(keyword => {
            // Check for whole word matches
            const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');
            return regex.test(tagLower);
          });
        });
        
        // Check product category - must contain the keyword as a whole word
        const matchesCategory = product.category && keywords.some(keyword => {
          const categoryLower = product.category.toLowerCase().trim();
          const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');
          return regex.test(categoryLower);
        });
        
        // Check product name for keyword matches
        const matchesName = product.name && keywords.some(keyword => {
          const nameLower = product.name.toLowerCase();
          const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');
          return regex.test(nameLower);
        });
        
        return matchesTags || matchesCategory || matchesName;
      });
      
      // Check investment profile match
      const matchesInvestment = !investProfile || 
        !product.investmentType || 
        product.investmentType.length === 0 ||
        product.investmentType.includes(investProfile);
      
      return matchesInterests && matchesInvestment;
    });

    console.log('=== PRODUCT FILTERING DEBUG ===');
    console.log('User interests:', interests);
    console.log('Total products before filter:', products.length);
    console.log('Filtered products:', filteredProducts.length);
    const feedProducts = filteredProducts.length ? filteredProducts : products.slice(0, 6);
    console.log('Products displayed in profile feed:', feedProducts.length);
    console.log('Sample filtered products:', filteredProducts.slice(0, 10).map(p => ({
      name: p.name,
      category: p.category,
      tags: p.tags,
      investmentType: p.investmentType
    })));
    
    // Show excluded products for debugging
    const excludedProducts = products.filter(p => !filteredProducts.includes(p));
    console.log('Excluded products count:', excludedProducts.length);
    console.log('Sample excluded products:', excludedProducts.slice(0, 10).map(p => ({
      name: p.name,
      category: p.category,
      tags: p.tags
    })));
    console.log('==============================');

    // Convert products to posts
    const generatedPosts: Post[] = feedProducts.map((product, idx) => ({
      id: `post-${product.id}-${idx}`,
      author: {
        name: 'Rashida Khan',
        username: '@skinnyluxus',
        avatar: userPhoto || ''
      },
      content: product.description,
      product: product,
      likes: Math.floor(Math.random() * 100),
      comments: Math.floor(Math.random() * 50),
      shares: Math.floor(Math.random() * 20),
      timestamp: `${Math.floor(Math.random() * 5) + 1} min ago`,
      hashtags: product.tags.map(tag => `#${tag}`)
    }));

    setPosts(generatedPosts);
  };

  const aiAgentImage = getSelectedAvatarImage(selectedAvatar);
  const aiAgentTone = getAgentAvatarTone(selectedAvatar);
  const renderAnimatedAiAvatar = (sizeClass = 'h-12 w-12', imageClass = 'h-full w-full') => {
    return (
      <span className={`relative block ${sizeClass}`}>
        <motion.span
          className={`absolute inset-0 rounded-full bg-gradient-to-br ${aiAgentTone.gradientClass} blur-lg opacity-40`}
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
          className={`relative block overflow-hidden rounded-full border-2 ${aiAgentTone.borderClass} transition-colors ${sizeClass}`}
          style={{
            maskImage: 'radial-gradient(circle at center, black 40%, transparent 90%)',
            WebkitMaskImage: 'radial-gradient(circle at center, black 40%, transparent 90%)',
          }}
        >
          <img src={aiAgentImage} alt="AI Agent" className={`${imageClass} object-cover opacity-90 ${aiAgentTone.imageClass}`} />
        </motion.span>
      </span>
    );
  };

  const renderHeader = () => (
    <div className="bg-[#0a0e1a]">
      {/* Status Bar */}
      <div className="h-11 flex items-center justify-between px-4 text-white text-sm">
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

      {/* Compact Profile Controls */}
      <div className="flex items-center justify-between px-4 pb-4 pt-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/8 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-colors hover:bg-white/14"
            aria-label="Go back"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex h-9 items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
            <span className="text-sm font-black text-[#8ff0a8]">{balance}</span>
            <img src={gemIcon} alt="Gem" className="h-5 w-5" />
          </div>
        </div>

        <button
          onClick={() => navigate('/profile-screen')}
          className="flex h-10 items-center gap-3 rounded-full bg-white px-4 text-black shadow-[0_8px_24px_rgba(0,0,0,0.32)]"
        >
          <div className="h-7 w-7 overflow-hidden rounded-full bg-gradient-to-br from-orange-300 to-orange-600">
            {userPhoto ? (
              <img src={userPhoto} alt={userName} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full" />
            )}
          </div>
          <span className="max-w-[112px] truncate text-sm font-bold">{userName}</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/chat/agent')}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-transparent"
            aria-label="AI chat"
          >
            {renderAnimatedAiAvatar()}
          </button>
          <button
            onClick={() => navigate('/chat-list')}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/8 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
            aria-label="Messages"
          >
            <MessageCircle className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Profile Section */}
      {activeTab === 'feed' && (
      <div className="px-4 pb-5">
        <div className="relative overflow-hidden rounded-[1.9rem] border border-white/10 bg-gradient-to-b from-[#25282d] via-[#1d2023] to-[#17191c] px-7 pb-8 pt-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_22px_70px_rgba(0,0,0,0.44)]">
          <div className="pointer-events-none absolute -left-20 top-16 h-40 w-40 rounded-full bg-white/5 blur-3xl" />
          <div className="pointer-events-none absolute -right-16 bottom-8 h-36 w-36 rounded-full bg-emerald-300/8 blur-3xl" />

          {/* Avatar Row */}
          <div className="relative mb-8 flex items-start justify-center">
            <button
              onClick={() => navigate(-1)}
              className="absolute left-0 top-5 flex h-12 w-12 items-center justify-center rounded-full bg-white/8 text-white ring-1 ring-white/8 transition-colors hover:bg-white/14"
              aria-label="Go back"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <div className="relative">
              <div className="absolute inset-0 -m-1 rounded-full bg-gradient-to-b from-[#ffd23f] via-[#ff8d25] to-[#ef3d28] p-1 shadow-[0_0_26px_rgba(255,136,22,0.36)]">
                <div className="h-full w-full rounded-full bg-[#1a1d20]" />
              </div>
              <div className="relative h-[76px] w-[76px] overflow-hidden rounded-full border-[3px] border-[#1a1d20]">
                {userPhoto ? (
                  <img src={userPhoto} alt={userName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500" />
                )}
              </div>
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 px-3 py-1 text-xs font-black text-white shadow-[0_8px_20px_rgba(234,88,12,0.32)]">
                Rookie
              </div>
            </div>

            <button
              onClick={() => navigate('/settings')}
              className="absolute right-0 top-5 flex h-12 w-12 items-center justify-center rounded-full bg-white text-black transition-colors hover:bg-gray-100"
              aria-label="Profile options"
            >
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </div>

          {/* Admin Panel Button - Only visible for admin accounts */}
          {isAdmin && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="mb-4 flex justify-center"
            >
              <button
                onClick={() => navigate('/admin-panel')}
                className="flex items-center gap-2 rounded-full border border-blue-300/30 bg-blue-400/10 px-5 py-2 text-white shadow-lg transition-all hover:bg-blue-400/20"
              >
                <Shield className="w-4 h-4" />
                <span className="text-sm font-semibold">Admin Panel</span>
              </button>
            </motion.div>
          )}

          {/* Action Buttons - Icons from Figma */}
          <div className="mb-4 flex items-center justify-center gap-2">
            <button 
              onClick={() => navigate('/profile')}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 shadow-lg ring-1 ring-white/10 backdrop-blur-sm"
            >
              <Home className="w-3 h-3 text-white" />
            </button>
            <button className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 shadow-lg ring-1 ring-white/10 backdrop-blur-sm">
              <Camera className="w-3 h-3 text-white" />
            </button>
            <button className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 shadow-lg ring-1 ring-white/10 backdrop-blur-sm">
              <svg className="w-3 h-3" fill="none" preserveAspectRatio="none" viewBox="0 0 12 12">
                <path clipRule="evenodd" d={svgPaths.p12878080} fill="white" fillRule="evenodd" />
                <path clipRule="evenodd" d={svgPaths.pde67cf0} fill="white" fillRule="evenodd" />
              </svg>
            </button>
          </div>

          {/* User Info */}
          <div className="text-center">
            <div className="mb-3 flex items-center justify-center gap-2">
              <h2 className="text-white font-bold text-base">{userName}</h2>
              <img src={gemIcon} alt="Gem" className="h-6 w-6 drop-shadow-[0_0_16px_rgba(134,255,166,0.58)]" />
              <span className="font-black text-[#8ff0a8]">{balance}</span>
              <button className="text-white/40 hover:text-white" aria-label="Points information">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" strokeWidth="2" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 16v-4m0-4h.01" />
                </svg>
              </button>
            </div>
            <button className="rounded-full border border-white/12 bg-white/8 px-4 py-1.5 text-xs font-semibold text-white/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
              {userHandle}
            </button>
          </div>
        </div>
      </div>
      )}

      {/* Tab Navigation */}
      <div className="px-4 pb-5">
        <div className="flex overflow-x-auto rounded-full border border-white/10 bg-[#101215]/95 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_10px_32px_rgba(0,0,0,0.22)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {[
          { id: 'feed', label: 'Feed' },
          { id: 'network', label: 'Network' },
          { id: 'saved', label: 'Saved' },
          { id: 'leaderboard', label: 'Leader Board' },
          { id: 'quests', label: 'Quests' },
          { id: 'gameplay', label: 'Gameplay' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              if (tab.id === 'leaderboard') {
                setLeaderboardView('team');
              }
              setActiveTab(tab.id as 'feed' | 'network' | 'saved' | 'leaderboard' | 'quests' | 'gameplay');
            }}
            className={`min-w-fit rounded-full px-4 py-2.5 text-xs font-semibold transition-colors ${
              activeTab === tab.id
                ? 'bg-white/10 text-white'
                : 'text-white/70 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
        </div>
      </div>
    </div>
  );

  const renderPost = (post: Post) => (
    <div key={post.id} className="bg-[#1a1d2e] rounded-3xl overflow-hidden mb-4">
      {/* Post Header */}
      <div className="flex items-center justify-between p-4 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500">
            {post.author.avatar ? (
              <img src={post.author.avatar} alt={post.author.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full" />
            )}
          </div>
          <div>
            <p className="text-white font-bold text-sm">{post.author.name}</p>
            <p className="text-gray-400 text-xs">{post.author.username}</p>
          </div>
        </div>
        <button className="px-4 py-1.5 bg-white text-black rounded-full text-xs font-bold hover:bg-gray-100 transition-colors">
          Follow
        </button>
      </div>

      {/* Post Content */}
      <div className="px-4 pb-3">
        <p className="text-gray-300 text-sm leading-relaxed line-clamp-3">
          {post.content}
        </p>
        <div className="flex flex-wrap gap-1 mt-2">
          {post.hashtags.slice(0, 3).map((tag, idx) => (
            <span key={idx} className="text-purple-400 text-xs">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Product Image */}
      <div 
        className="relative w-full aspect-[4/3] overflow-hidden rounded-2xl"
        style={{
          background: 'linear-gradient(135deg, #1a3a35 0%, #2d5a4f 25%, #4a7d6e 50%, #5d9080 75%, #7ab09f 100%)'
        }}
      >
        <img 
          src={post.product.image} 
          alt={post.product.name}
          className="w-full h-full object-contain"
        />
        
        {/* AI Badge - Top Left */}
        <div className="absolute top-3 left-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full px-3 py-1.5 flex items-center gap-1.5 shadow-lg">
          {renderAnimatedAiAvatar('h-5 w-5')}
          <span className="text-white text-xs font-bold">AI Pick</span>
        </div>

        {/* Product Info Badge - Bottom */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/60 to-transparent p-4 pt-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center overflow-hidden">
                <img 
                  src={post.product.image} 
                  alt={post.product.brand}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <p className="text-white font-bold text-sm">{post.product.brand}</p>
                <p className="text-gray-200 text-xs line-clamp-1">recently recommended</p>
              </div>
            </div>
            <button
              onClick={() => navigate(`/product/${encodeURIComponent(post.product.id)}`, { state: { product: post.product } })}
              className="px-4 py-2 bg-white text-black rounded-full text-xs font-bold hover:bg-gray-100 transition-colors shadow-lg"
            >
              Invest
            </button>
          </div>
        </div>

        {/* Rating Badge - Top Right */}
        <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm rounded-full px-2.5 py-1.5 flex items-center gap-1">
          <span className="text-white text-xs font-bold">{post.product.rating}</span>
          <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </div>
      </div>

      {/* Post Actions */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => {
              const newLiked = new Set(likedPosts);
              if (newLiked.has(post.id)) {
                newLiked.delete(post.id);
              } else {
                newLiked.add(post.id);
              }
              setLikedPosts(newLiked);
            }}
            className="flex items-center gap-1.5 text-gray-400 hover:text-red-500 transition-colors"
          >
            <Heart className={`w-5 h-5 ${likedPosts.has(post.id) ? 'fill-red-500 text-red-500' : ''}`} />
            <span className="text-xs font-medium">{post.likes}</span>
          </button>
          <button className="flex items-center gap-1.5 text-gray-400 hover:text-blue-500 transition-colors">
            <MessageCircle className="w-5 h-5" />
            <span className="text-xs font-medium">{post.comments}</span>
          </button>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-gray-500 text-xs">{post.timestamp}</span>
          <button 
            onClick={() => {
              const newSaved = new Set(savedPosts);
              if (newSaved.has(post.id)) {
                newSaved.delete(post.id);
              } else {
                newSaved.add(post.id);
              }
              setSavedPosts(newSaved);
            }}
            className="text-gray-400 hover:text-purple-500 transition-colors"
          >
            <Bookmark className={`w-5 h-5 ${savedPosts.has(post.id) ? 'fill-purple-500 text-purple-500' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );

  const renderNetworkTab = () => {
    void networkRefreshKey;

    // Load user's interests from registration
    const userInterestsRaw = safeGetItem('selectedInterests');
    const userInterests = userInterestsRaw ? JSON.parse(userInterestsRaw) : [];
    
    // Load user's investment profile
    const investmentProfile = safeGetItem('investmentProfile') || '';
    
    // All available mock users (simulating network)
    const allNetworkUsers = [
      { 
        id: 1, 
        name: 'John Black', 
        username: '@healthyhabits',
        description: 'Fashion, fitness, and marketplace launches',
        image: 'https://images.unsplash.com/photo-1655249493799-9cee4fe983bb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=400',
        interests: ['tech', 'beauty', 'lifestyle'],
        investmentType: 'aggressive'
      },
      { 
        id: 2, 
        name: 'Andrew Smith', 
        username: '@andrew',
        description: 'Clean eating, home products, and team plays',
        image: 'https://images.unsplash.com/photo-1768853972795-2739a9685567?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=400',
        interests: ['pets', 'lifestyle', 'home'],
        investmentType: 'conservative'
      },
      { 
        id: 3, 
        name: 'Jim Kenry', 
        username: '@jimkenry',
        description: 'Beauty launches and early product scouting',
        image: 'https://images.unsplash.com/photo-1758876204244-930299843f07?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=400',
        interests: ['beauty', 'fashion', 'lifestyle'],
        investmentType: 'moderate'
      },
      { 
        id: 4, 
        name: 'Russell Westbrook', 
        username: '@russell',
        description: 'Team captain for product discovery streaks',
        image: 'https://images.unsplash.com/photo-1629507208649-70919ca33793?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=400',
        interests: ['tech', 'gaming', 'electronics'],
        investmentType: 'aggressive'
      },
      { 
        id: 5, 
        name: 'Olivia Martinez', 
        username: '@oliviam',
        description: '10 friends in common | Home Decor | Moderate Investor',
        image: userPhoto,
        interests: ['home', 'lifestyle', 'beauty'],
        investmentType: 'moderate'
      },
      { 
        id: 6, 
        name: 'David Brown', 
        username: '@dbrown',
        description: '4 friends in common | Sports & Fitness | Conservative',
        image: userPhoto,
        interests: ['sports', 'fitness', 'lifestyle'],
        investmentType: 'conservative'
      },
    ];

    const defaultPendingInvitations = [
      {
        id: 101,
        name: 'Olivia Bennet',
        username: '@olivia',
        description: 'Softcore Engineer | AI Enthusiast | Transforming',
        image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=400',
        interests: ['beauty', 'lifestyle', 'tech'],
      },
      {
        id: 102,
        name: 'Olivia Bennet',
        username: '@olivia',
        description: 'Softcore Engineer | AI Enthusiast | Transforming',
        image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=400',
        interests: ['home', 'lifestyle', 'beauty'],
      },
      {
        id: 103,
        name: 'Olivia Bennet',
        username: '@olivia',
        description: 'Softcore Engineer | AI Enthusiast | Transforming',
        image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=400',
        interests: ['fashion', 'beauty', 'lifestyle'],
      },
    ];

    // All available groups
    const allGroups = [
      { id: 1, name: 'Tech Innovators', members: 234, image: 'https://images.unsplash.com/photo-1760842543713-108c3cadbba1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWNoJTIwaW5ub3ZhdGlvbiUyMGNpcmN1aXQlMjBib2FyZHxlbnwxfHx8fDE3NzQxMzkzODh8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral', category: 'tech', interests: ['tech', 'electronics', 'gaming'] },
      { id: 2, name: 'Beauty Insiders', members: 189, image: 'https://images.unsplash.com/photo-1586495487593-1e01d9890cd6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiZWF1dHklMjBjb3NtZXRpY3MlMjBtYWtldXB8ZW58MXx8fHwxNzc0MTIxMjc1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral', category: 'beauty', interests: ['beauty', 'fashion', 'lifestyle'] },
      { id: 3, name: 'Pet Lovers United', members: 156, image: 'https://images.unsplash.com/photo-1718885433034-908d5bca08cf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjdXRlJTIwcGV0cyUyMGRvZ3MlMjBjYXRzfGVufDF8fHx8MTc3NDEzOTM4OHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral', category: 'pets', interests: ['pets', 'lifestyle', 'home'] },
      { id: 4, name: 'Home & Garden', members: 203, image: networkImage, category: 'home', interests: ['home', 'lifestyle', 'gardening'] },
      { id: 5, name: 'Fitness Warriors', members: 178, image: networkImage, category: 'fitness', interests: ['fitness', 'sports', 'lifestyle'] },
      { id: 6, name: 'Smart Investors', members: 312, image: networkImage, category: 'finance', interests: ['tech', 'lifestyle', 'business'] },
      { id: 7, name: 'Fashion Forward', members: 245, image: networkImage, category: 'fashion', interests: ['fashion', 'beauty', 'lifestyle'] },
      { id: 8, name: 'Gaming Community', members: 267, image: networkImage, category: 'gaming', interests: ['gaming', 'tech', 'electronics'] },
      { id: 9, name: 'Clean Eating', members: 198, image: networkImage, category: 'lifestyle', interests: ['lifestyle', 'fitness', 'health'] },
      { id: 10, name: 'Travel Enthusiasts', members: 223, image: networkImage, category: 'travel', interests: ['lifestyle', 'adventure', 'culture'] },
    ];

    // Function to calculate interest match score
    const getInterestMatchScore = (itemInterests: string[]) => {
      if (!userInterests.length) return 0;
      const matches = itemInterests.filter(interest => 
        userInterests.some((ui: string) => 
          ui.toLowerCase().includes(interest.toLowerCase()) || 
          interest.toLowerCase().includes(ui.toLowerCase())
        )
      );
      return matches.length;
    };

    // Get pending invitations. Seeded defaults match the profile-feed design mocks.
    const pendingInvitations = JSON.parse(safeGetItem('pendingInvitations') || 'null') || defaultPendingInvitations;

    // Get user connections. Default people keep the first-run network tab populated.
    const storedConnections = JSON.parse(safeGetItem('userConnections') || 'null');
    const userConnections = storedConnections || allNetworkUsers.slice(0, 4);

    // Get user's groups from localStorage
    const myGroups = JSON.parse(safeGetItem('myGroups') || '[]');

    // Recommend groups based on user interests (top 3)
    const recommendedGroups = allGroups
      .map(group => ({
        ...group,
        matchScore: getInterestMatchScore(group.interests)
      }))
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 3)
      .map(({ matchScore, ...group }) => group);

    // Find users you may know (based on similar interests, excluding already connected)
    const connectedUserIds = userConnections.map((c: any) => c.id);
    const youMayKnow = allNetworkUsers
      .filter(user => !connectedUserIds.includes(user.id))
      .map(user => ({
        ...user,
        matchScore: getInterestMatchScore(user.interests)
      }))
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 2);

    // Groups you might like (based on interests, excluding already joined)
    const myGroupIds = myGroups.map((g: any) => g.id);
    const groupsYouMightLike = allGroups
      .filter(group => !myGroupIds.includes(group.id))
      .map(group => ({
        ...group,
        matchScore: getInterestMatchScore(group.interests)
      }))
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 3)
      .map(({ matchScore, ...group }) => group);

    const handleInviteConnection = () => {
      // Navigate to Share Invites screen
      navigate('/share-invites');
    };

    const handleAcceptInvitation = (invitationId: number) => {
      // Move from pending to connections
      const invitation = pendingInvitations.find((inv: any) => inv.id === invitationId);
      if (invitation) {
        const newConnections = [...userConnections, invitation];
        const newPending = pendingInvitations.filter((inv: any) => inv.id !== invitationId);
        localStorage.setItem('userConnections', JSON.stringify(newConnections));
        localStorage.setItem('pendingInvitations', JSON.stringify(newPending));
        setNetworkSuccess({ name: invitation.name, image: invitation.image });
      }
    };

    const handleDismissInvitation = (invitationId: number) => {
      const newPending = pendingInvitations.filter((inv: any) => inv.id !== invitationId);
      localStorage.setItem('pendingInvitations', JSON.stringify(newPending));
      setNetworkSuccess(null);
      setNetworkRefreshKey((key) => key + 1);
    };

    const handleFollowUser = (userId: number) => {
      alert('Follow feature coming soon!');
    };

    const handleJoinGroup = (groupId: number) => {
      const group = [...recommendedGroups, ...groupsYouMightLike].find(g => g.id === groupId);
      if (group) {
        const newGroup = {
          id: group.id.toString(),
          name: group.name,
          description: `A community for ${group.category} enthusiasts`,
          icon: '🌟',
          memberCount: group.members,
          isPublic: true,
          createdBy: 'system',
          createdAt: new Date().toISOString(),
          category: group.category
        };
        const updatedMyGroups = [...myGroups, newGroup];
        localStorage.setItem('myGroups', JSON.stringify(updatedMyGroups));
        window.location.reload();
      }
    };

    return (
      <div className="space-y-6 pb-4">
        {/* Pending Invitations */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-bold text-base">Pending Invitations</h3>
            {pendingInvitations.length > 3 && (
              <button className="text-gray-400 text-xs flex items-center gap-1 hover:text-white transition-colors">
                See More <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>
          {pendingInvitations.length === 0 ? (
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map((idx) => (
                <div key={idx} className="bg-[#1a1d2e] rounded-2xl p-4 opacity-40">
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-gray-700 mb-2 flex items-center justify-center">
                      <User className="w-8 h-8 text-gray-600" />
                    </div>
                    <div className="w-full h-3 bg-gray-700 rounded mb-2" />
                    <div className="w-full bg-gray-700 text-transparent py-1.5 rounded-full text-xs">
                      Accept
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {pendingInvitations.slice(0, 3).map((person: any) => (
                <div key={person.id} className="bg-[#1a1d2e] rounded-2xl p-4 relative">
                  <button 
                    onClick={() => handleDismissInvitation(person.id)}
                    className="absolute top-2 right-2 w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-600 transition-colors"
                  >
                    <X className="w-3.5 h-3.5 text-white" />
                  </button>
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full overflow-hidden mb-2 bg-gradient-to-br from-purple-500 to-pink-500">
                      {person.image ? (
                        <img src={person.image} alt={person.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full" />
                      )}
                    </div>
                    <p className="text-white text-xs font-semibold text-center mb-2 line-clamp-2">{person.name}</p>
                    <button 
                      onClick={() => handleAcceptInvitation(person.id)}
                      className="w-full bg-white text-black py-1.5 rounded-full text-xs font-bold hover:bg-gray-100 transition-colors"
                    >
                      Accept
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Your Connections */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-bold text-base">Your Connections</h3>
            {userConnections.length > 3 && (
              <button className="text-gray-400 text-xs flex items-center gap-1 hover:text-white transition-colors">
                See More <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-3 overflow-x-auto pb-2">
            {userConnections.length === 0 ? (
              <>
                {[1, 2, 3].map((idx) => (
                  <button 
                    key={idx}
                    onClick={handleInviteConnection}
                    className="flex flex-col items-center min-w-[60px]"
                  >
                    <div className="w-14 h-14 rounded-full bg-[#2a2d3e] border-2 border-dashed border-gray-600 flex items-center justify-center mb-1.5 hover:bg-[#35384a] hover:border-purple-500 transition-all">
                      <Plus className="w-6 h-6 text-gray-500" />
                    </div>
                    <p className="text-gray-500 text-[10px] text-center">Add</p>
                  </button>
                ))}
              </>
            ) : (
              <>
                {userConnections.slice(0, 4).map((person: any) => (
                  <div key={person.id} className="flex flex-col items-center min-w-[60px]">
                    <div className="w-14 h-14 rounded-full overflow-hidden mb-1.5 bg-gradient-to-br from-purple-500 to-pink-500">
                      {person.image ? (
                        <img src={person.image} alt={person.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full" />
                      )}
                    </div>
                    <p className="text-white text-[10px] text-center line-clamp-2 w-full">{person.name}</p>
                  </div>
                ))}
                <button 
                  onClick={handleInviteConnection}
                  className="flex flex-col items-center min-w-[60px]"
                >
                  <div className="w-14 h-14 rounded-full bg-[#2a2d3e] flex items-center justify-center mb-1.5 hover:bg-[#35384a] transition-colors">
                    <Plus className="w-6 h-6 text-white" />
                  </div>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Your Groups */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-bold text-base">Your Groups</h3>
            <button 
              onClick={() => navigate('/groups')}
              className="text-gray-400 text-xs flex items-center gap-1 hover:text-white transition-colors"
            >
              See More <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          {myGroups.length === 0 ? (
            <div className="grid grid-cols-3 gap-3">
              {recommendedGroups.map((group) => (
                <div key={group.id} className="bg-[#1a1d2e] rounded-2xl p-3">
                  <div className="aspect-square rounded-xl overflow-hidden mb-2 bg-gray-800">
                    <img src={group.image} alt={group.name} className="w-full h-full object-cover" />
                  </div>
                  <p className="text-white text-xs font-semibold mb-1 line-clamp-1">{group.name}</p>
                  <div className="flex items-center gap-1 text-gray-400 text-[10px] mb-2">
                    <Users className="w-3 h-3" />
                    <span>{group.members}</span>
                  </div>
                  <button 
                    onClick={() => handleJoinGroup(group.id)}
                    className="w-full bg-purple-500 text-white py-1 rounded-full text-xs font-bold hover:bg-purple-600 transition-colors"
                  >
                    Join
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {myGroups.slice(0, 3).map((group: any) => (
                <div key={group.id} className="bg-[#1a1d2e] rounded-2xl p-3">
                  <div className="aspect-square rounded-xl overflow-hidden mb-2 bg-gray-800 flex items-center justify-center text-3xl">
                    {group.icon || '🌟'}
                  </div>
                  <p className="text-white text-xs font-semibold mb-1 line-clamp-1">{group.name}</p>
                  <div className="flex items-center gap-1 text-gray-400 text-[10px]">
                    <Users className="w-3 h-3" />
                    <span>{group.memberCount}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* You May Know */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-bold text-base">You May Know</h3>
            {youMayKnow.length > 2 && (
              <button className="text-gray-400 text-xs flex items-center gap-1 hover:text-white transition-colors">
                See More <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>
          <div className="space-y-3">
            {youMayKnow.map((person) => (
              <div key={person.id} className="bg-[#1a1d2e] rounded-2xl p-4 relative">
                <button className="absolute top-3 right-3 w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-600 transition-colors">
                  <X className="w-3.5 h-3.5 text-white" />
                </button>
                <div className="flex flex-col items-center">
                  <div className="w-20 h-20 rounded-full overflow-hidden mb-3 bg-gradient-to-br from-purple-500 to-pink-500">
                    {person.image ? (
                      <img src={person.image} alt={person.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full" />
                    )}
                  </div>
                  <p className="text-white text-sm font-bold mb-1">{person.name}</p>
                  <p className="text-gray-400 text-xs text-center mb-3 line-clamp-2">{person.description}</p>
                  
                  <div className="flex items-center gap-2 mb-3">
                    <button className="w-8 h-8 rounded-full bg-[#2a2d3e] flex items-center justify-center hover:bg-[#35384a] transition-colors">
                      <Heart className="w-4 h-4 text-gray-400" />
                    </button>
                    <button className="w-8 h-8 rounded-full bg-[#2a2d3e] flex items-center justify-center hover:bg-[#35384a] transition-colors">
                      <MessageCircle className="w-4 h-4 text-gray-400" />
                    </button>
                    <button className="w-8 h-8 rounded-full bg-[#2a2d3e] flex items-center justify-center hover:bg-[#35384a] transition-colors">
                      <UserPlus className="w-4 h-4 text-gray-400" />
                    </button>
                    <button className="w-8 h-8 rounded-full bg-[#2a2d3e] flex items-center justify-center hover:bg-[#35384a] transition-colors">
                      <Share2 className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>

                  <button 
                    onClick={() => handleFollowUser(person.id)}
                    className="w-full bg-white text-black py-2 rounded-full text-xs font-bold hover:bg-gray-100 transition-colors"
                  >
                    Follow
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Groups You Might Like */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-bold text-base">Groups You Might Like</h3>
            {groupsYouMightLike.length > 3 && (
              <button className="text-gray-400 text-xs flex items-center gap-1 hover:text-white transition-colors">
                See More <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {groupsYouMightLike.map((group) => (
              <div key={group.id} className="bg-[#1a1d2e] rounded-2xl p-3">
                <div className="aspect-square rounded-xl overflow-hidden mb-2 bg-gray-800">
                  <img src={group.image} alt={group.name} className="w-full h-full object-cover" />
                </div>
                <p className="text-white text-xs font-semibold mb-1 line-clamp-1">{group.name}</p>
                <div className="flex items-center gap-1 text-gray-400 text-[10px] mb-2">
                  <Users className="w-3 h-3" />
                  <span>{group.members}</span>
                </div>
                
                <div className="flex items-center gap-1 mb-2">
                  <button className="w-6 h-6 rounded-full bg-[#2a2d3e] flex items-center justify-center hover:bg-[#35384a] transition-colors">
                    <Heart className="w-3 h-3 text-gray-400" />
                  </button>
                  <button className="w-6 h-6 rounded-full bg-[#2a2d3e] flex items-center justify-center hover:bg-[#35384a] transition-colors">
                    <MessageCircle className="w-3 h-3 text-gray-400" />
                  </button>
                  <button className="w-6 h-6 rounded-full bg-[#2a2d3e] flex items-center justify-center hover:bg-[#35384a] transition-colors">
                    <UserPlus className="w-3 h-3 text-gray-400" />
                  </button>
                  <button className="w-6 h-6 rounded-full bg-[#2a2d3e] flex items-center justify-center hover:bg-[#35384a] transition-colors">
                    <Share2 className="w-3 h-3 text-gray-400" />
                  </button>
                </div>

                <button 
                  onClick={() => handleJoinGroup(group.id)}
                  className="w-full bg-white text-black py-1.5 rounded-full text-xs font-bold hover:bg-gray-100 transition-colors"
                >
                  Follow
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderSavedTab = () => {
    // Filter posts that are saved
    const savedPostsList = posts.filter(post => savedPosts.has(post.id));
    const visibleSavedPosts = savedPostsList.length ? savedPostsList : posts.slice(0, 6);

    if (visibleSavedPosts.length === 0) {
      return (
        <div className="text-center py-12 px-4">
          <div className="bg-[#1a1d2e] rounded-3xl p-8">
            <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bookmark className="w-8 h-8 text-purple-500" />
            </div>
            <p className="text-white font-bold mb-2 text-lg">No saved products yet</p>
            <p className="text-gray-400 mb-4 text-sm">
              Tap the bookmark icon on any product to save it here
            </p>
            <button
              onClick={() => setActiveTab('feed')}
              className="px-6 py-3 bg-purple-500 text-white rounded-full font-bold hover:bg-purple-600 transition-colors shadow-lg shadow-purple-500/30"
            >
              Browse Products
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 gap-3 pb-4">
        {visibleSavedPosts.map((post) => (
          <div 
            key={post.id} 
            className="relative rounded-2xl overflow-hidden bg-[#1a1d2e] group"
            style={{ aspectRatio: '0.75' }}
          >
            {/* Product Image Background */}
            <div className="absolute inset-0">
              <img 
                src={post.product.image} 
                alt={post.product.name}
                className="w-full h-full object-cover"
              />
              {/* Dark gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />
            </div>

            {/* Top Icons */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
              {/* Bookmark Icon - Filled */}
              <button 
                onClick={() => {
                  const newSaved = new Set(savedPosts);
                  if (newSaved.has(post.id)) {
                    newSaved.delete(post.id);
                  } else {
                    newSaved.add(post.id);
                  }
                  setSavedPosts(newSaved);
                }}
                className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors"
              >
                <Bookmark className="w-4 h-4 text-white fill-white" />
              </button>

              {/* Three Dots Menu */}
              <button className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center hover:bg-black/60 transition-colors">
                <MoreHorizontal className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Rating Badge */}
            <div className="absolute top-1/2 left-3 z-10">
              <div className="bg-black/70 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center gap-1">
                <span className="text-white text-xs font-bold">{post.product.rating.toFixed(1)}</span>
                <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
            </div>

            {/* Product Info at Bottom */}
            <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
              <h3 className="text-white font-bold text-sm mb-1 line-clamp-2">
                {post.product.name}
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-white font-bold text-base">
                  $ {post.product.price.toFixed(2)}
                </span>
                {post.product.originalPrice && post.product.originalPrice > post.product.price && (
                  <span className="text-gray-400 text-xs line-through">
                    $ {post.product.originalPrice.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderLeaderboardTab = () => {
    // Mock team members with points
    const teamMembers = [
      { id: 1, name: `${userName} (You)`, handle: userHandle, points: balance, avatar: userPhoto, isCurrentUser: true },
      { id: 2, name: 'Russell Westbrook', handle: '@russell', points: 42, avatar: 'https://images.unsplash.com/photo-1629507208649-70919ca33793?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBidXNpbmVzcyUyMG1hbiUyMHBvcnRyYWl0fGVufDF8fHx8MTc3NDA4MzYxOXww&ixlib=rb-4.1.0&q=80&w=1080' },
      { id: 3, name: 'Alex McKein', handle: '@alex', points: 40, avatar: 'https://images.unsplash.com/photo-1768853972795-2739a9685567?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjB3b21hbiUyMGF0aGxldGUlMjBwb3J0cmFpdHxlbnwxfHx8fDE3NzQxNDA1NDh8MA&ixlib=rb-4.1.0&q=80&w=1080' },
      { id: 4, name: 'Bill Winston', handle: '@bill', points: 35, avatar: 'https://images.unsplash.com/photo-1758876204244-930299843f07?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjB5b3VuZyUyMG1hbiUyMHNtaWxpbmd8ZW58MXx8fHwxNzc0MTQwNTQ5fDA&ixlib=rb-4.1.0&q=80&w=1080' },
      { id: 5, name: 'John Black', handle: '@john', points: 30, avatar: 'https://images.unsplash.com/photo-1655249493799-9cee4fe983bb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBidXNpbmVzcyUyMHBlcnNvbiUyMGhlYWRzaG90fGVufDF8fHx8MTc3NDA2NzIwNnww&ixlib=rb-4.1.0&q=80&w=1080' },
    ];

    const sortedTeam = [...teamMembers].sort((a, b) => b.points - a.points);
    const teamTotalPoints = sortedTeam.reduce((sum, member) => sum + member.points, 0);
    const userLevel = 2;
    const userRank = 'Rookie';

    // ROI by Industry data
    const roiTotal = roiTriptoMode ? '32 700' : '327 C$';
    const roiTotalLabel = roiTriptoMode ? 'Total Balance' : 'Total ROI';
    const roiData = [
      { category: 'Fitness', percentage: roiTriptoMode ? 55 : 60, amount: roiTriptoMode ? 1200 : 12, color: 'from-orange-500 to-orange-400' },
      { category: 'Tech', percentage: roiTriptoMode ? 25 : 20, amount: roiTriptoMode ? 900 : 4, color: 'from-green-500 to-green-400' },
      { category: 'Fashion', percentage: 20, amount: roiTriptoMode ? 700 : 4, color: 'from-blue-500 to-blue-400' },
    ];

    // Points by Action data
    const actionData = [
      { label: 'Likes', percentage: 60, points: 6, color: 'from-red-500 to-pink-500' },
      { label: 'Surveys', percentage: 30, points: 3, color: 'from-yellow-500 to-orange-500' },
      { label: 'Personality Quiz', percentage: 10, points: 1, color: 'from-blue-500 to-purple-500' },
    ];

    if (leaderboardView === 'personal') {
      return (
        <div className="space-y-6 pb-4">
          {/* Balance Card */}
          <div className="bg-gradient-to-br from-[#2a2d3e] to-[#1a1d2e] rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 opacity-20">
              <img src={gemIcon} alt="gem" className="w-32 h-32" />
            </div>
            <div className="relative z-10">
              <p className="text-gray-400 text-sm mb-1">Balance:</p>
              <div className="flex items-center gap-2">
                <p className="text-white text-3xl font-bold">{balance} pts</p>
              </div>
            </div>
          </div>

          {/* Level Badge */}
          <div className="bg-gradient-to-br from-[#2a2d3e] to-[#1a1d2e] rounded-3xl p-8 relative overflow-hidden">
            <div className="relative w-full">
              {/* Left Blurred Token */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-24 h-24 sm:w-32 sm:h-32 overflow-hidden opacity-30 blur-md pointer-events-none">
                <img 
                  src={levelToken} 
                  alt="" 
                  className="w-full h-full object-cover scale-150"
                  style={{ clipPath: 'inset(0 50% 0 0)' }}
                />
              </div>

              {/* Right Blurred Token */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-24 h-24 sm:w-32 sm:h-32 overflow-hidden opacity-30 blur-md pointer-events-none">
                <img 
                  src={levelToken} 
                  alt="" 
                  className="w-full h-full object-cover scale-150"
                  style={{ clipPath: 'inset(0 0 0 50%)' }}
                />
              </div>

              {/* Center Badge Container */}
              <div className="flex flex-col items-center relative z-10">
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-yellow-500 rounded-full blur-2xl opacity-30" />
                
                {/* Orange circular badge */}
                <div className="relative mb-4">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-2xl shadow-orange-500/50">
                    <div className="text-center">
                      <p className="text-orange-900 text-4xl font-bold leading-none">{userLevel.toString().padStart(2, '0')}</p>
                      <p className="text-orange-900 text-sm font-semibold uppercase">Level</p>
                    </div>
                  </div>
                  {/* Gem decoration */}
                  <div className="absolute -top-2 -right-2">
                    <img src={gemIcon} alt="gem" className="w-12 h-12 drop-shadow-lg" />
                  </div>
                </div>
                <p className="text-orange-500 text-lg font-bold">{userRank}</p>
              </div>
            </div>
          </div>

          {/* Your Team's Leaderboard */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-bold text-lg">Your Team's Leaderboard</h3>
              <span className="text-gray-400 text-sm">{sortedTeam.length} / 5</span>
            </div>

            {/* Team Progress */}
            <div className="bg-gradient-to-r from-[#2a2d3e] to-[#1a1d2e] rounded-2xl p-4 mb-4 relative overflow-hidden">
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-gray-400 text-xs mb-1">Team's Progress:</p>
                  <p className="text-white text-2xl font-bold">{teamTotalPoints} pts</p>
                </div>
                <img src={gemIcon} alt="gem" className="w-16 h-16 drop-shadow-lg" />
              </div>
            </div>

            {/* Team Members List */}
            <div className="space-y-2">
              {sortedTeam.map((member, index) => (
                <div 
                  key={member.id}
                  className="bg-[#1a1d2e] rounded-2xl p-4 flex items-center gap-3"
                >
                  {/* Rank */}
                  <div className="w-8 h-8 rounded-full bg-[#2a2d3e] flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{index + 1}</span>
                  </div>

                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500">
                    {member.avatar ? (
                      <img 
                        src={member.avatar} 
                        alt={member.name} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full" />
                    )}
                  </div>

                  {/* Name */}
                  <div className="flex-1">
                    <p className="text-white font-semibold text-sm">{member.name}</p>
                  </div>

                  {/* Points */}
                  <div className="flex items-center gap-2">
                    <span className="text-white font-bold">{member.points}</span>
                    <img src={gemIcon} alt="gem" className="w-5 h-5" />
                  </div>

                  {/* Actions */}
                  <button className="w-8 h-8 rounded-full bg-[#2a2d3e] flex items-center justify-center hover:bg-[#35384a] transition-colors">
                    <MoreHorizontal className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              ))}
            </div>

            {/* Send Invites Button */}
            <button 
              onClick={() => navigate('/share-invites')}
              className="w-full mt-4 bg-purple-500 text-white py-3 rounded-full font-bold hover:bg-purple-600 transition-colors shadow-lg shadow-purple-500/30"
            >
              Send Invites
            </button>
          </div>

          {/* ROI by Industry */}
          <div className="rounded-[1.8rem] border border-white/10 bg-gradient-to-br from-[#555856]/90 via-[#3f4342]/92 to-[#24272a]/96 p-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_24px_70px_rgba(0,0,0,0.36)]">
            <div className="mb-8 flex items-center justify-between">
              <h3 className="text-xl font-black text-white">ROI by Industry</h3>
              <button
                type="button"
                role="switch"
                aria-checked={roiTriptoMode}
                onClick={() => setRoiTriptoMode((enabled) => !enabled)}
                className="flex items-center gap-3 text-sm font-semibold text-white/58"
              >
                Tripto:
                <span className={`relative flex h-7 w-12 items-center rounded-full p-1 transition-colors ${roiTriptoMode ? 'bg-[#4f805d]' : 'bg-black/25'}`}>
                  <span className={`h-5 w-5 rounded-full bg-[#8ff0a8] shadow-[0_0_14px_rgba(143,240,168,0.52)] transition-transform ${roiTriptoMode ? 'translate-x-5' : 'translate-x-0'}`} />
                </span>
              </button>
            </div>
            
            {/* Donut Chart */}
            <div className="flex items-center justify-center mb-6">
              <div className="relative w-56 h-56">
                {/* Donut SVG */}
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Background circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#2a2d3e"
                    strokeWidth="12"
                  />
                  {/* Segments */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="url(#gradient-orange)"
                    strokeWidth="12"
                    strokeDasharray="150.8 251.2"
                    strokeDashoffset="0"
                    strokeLinecap="round"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="url(#gradient-green)"
                    strokeWidth="12"
                    strokeDasharray="50.3 351.7"
                    strokeDashoffset="-150.8"
                    strokeLinecap="round"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="url(#gradient-blue)"
                    strokeWidth="12"
                    strokeDasharray="50.3 351.7"
                    strokeDashoffset="-201.1"
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="gradient-orange" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f97316" />
                      <stop offset="100%" stopColor="#fb923c" />
                    </linearGradient>
                    <linearGradient id="gradient-green" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#34d399" />
                    </linearGradient>
                    <linearGradient id="gradient-blue" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#60a5fa" />
                    </linearGradient>
                  </defs>
                </svg>
                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="flex items-center gap-2">
                    <p className="text-4xl font-black tracking-wide text-white">{roiTotal}</p>
                    {roiTriptoMode && <img src={gemIcon} alt="Tripto" className="h-8 w-8" />}
                  </div>
                  <p className="mt-2 text-sm font-semibold text-white/52">{roiTotalLabel}</p>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="space-y-2">
              {roiData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${item.color}`} />
                    <span className="text-gray-300 text-sm">{item.category}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400 text-sm">{item.percentage}%</span>
                    <span className="flex w-20 items-center justify-end gap-1 text-sm font-bold text-white">
                      {roiTriptoMode ? item.amount.toLocaleString() : `${item.amount} C$`}
                      {roiTriptoMode && <img src={gemIcon} alt="Tripto" className="h-4 w-4" />}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Points by Action */}
          <div className="bg-[#1a1d2e] rounded-3xl p-6">
            <h3 className="text-white font-bold text-lg mb-6">Points by Action</h3>
            
            {/* Total Points */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <span className="text-white text-4xl font-bold">397</span>
              <img src={gemIcon} alt="gem" className="w-10 h-10" />
            </div>
            <p className="text-center text-gray-400 text-sm mb-6">Total points</p>

            {/* Progress Bars */}
            <div className="space-y-4">
              {actionData.map((action, idx) => (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-300 text-sm">{action.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 text-sm">{action.percentage}%</span>
                      <div className="flex items-center gap-1">
                        <span className="text-white font-semibold text-sm">{action.points}</span>
                        <img src={gemIcon} alt="gem" className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                  <div className="h-2 bg-[#2a2d3e] rounded-full overflow-hidden">
                    <div 
                      className={`h-full bg-gradient-to-r ${action.color} rounded-full transition-all duration-500`}
                      style={{ width: `${action.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Toggle Buttons */}
            <div className="flex items-center justify-center gap-2 mt-6">
              <button className="px-6 py-2 bg-white text-black rounded-full text-sm font-bold">
                Your Team
              </button>
              <button 
                onClick={() => setLeaderboardView('team')}
                className="px-6 py-2 bg-[#2a2d3e] text-gray-400 rounded-full text-sm font-semibold hover:bg-[#35384a] transition-colors"
              >
                Invited Team
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Team View
    return (
      <div className="space-y-4 pb-4">
        {/* Team Name Header */}
        <div className="flex items-center justify-between px-1">
          <h2 className="text-white font-bold text-2xl">John's Team</h2>
          <span className="text-white text-sm font-bold">{sortedTeam.length}/5</span>
        </div>

        {/* Team Progress Card */}
        <div className="relative overflow-hidden rounded-[1.35rem] border border-white/12 bg-gradient-to-r from-[#25292d]/96 to-[#15181c]/98 px-6 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_16px_44px_rgba(0,0,0,0.34)]">
          <div className="absolute right-5 top-1/2 h-24 w-24 -translate-y-1/2 rounded-full bg-emerald-300/18 blur-2xl" />
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="mb-1 text-base font-semibold text-white/50">Team's Progress:</p>
              <p className="text-2xl font-black text-white">{teamTotalPoints} pts</p>
            </div>
            <img src={gemIcon} alt="gem" className="h-20 w-20 drop-shadow-[0_0_32px_rgba(134,255,166,0.62)]" />
          </div>
        </div>

        {/* Podium - Top 3 */}
        <div className="rounded-[1.7rem] border border-white/8 bg-gradient-to-b from-[#1b1b2b]/98 to-[#151624]/98 px-4 pb-5 pt-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_20px_70px_rgba(0,0,0,0.38)]">
          <div className="mb-8 flex items-end justify-center gap-4">
            {/* 2nd Place */}
            <div className="flex flex-col items-center">
              {/* Crown */}
              <svg className="mb-2 h-7 w-7 text-sky-300" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6z" />
              </svg>
              {/* Avatar */}
              <div className="mb-2 h-[70px] w-[70px] overflow-hidden rounded-full border-[3px] border-sky-300 bg-gradient-to-br from-purple-500 to-pink-500">
                {sortedTeam[1]?.avatar ? (
                  <img 
                    src={sortedTeam[1].avatar} 
                    alt={sortedTeam[1].name} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full" />
                )}
              </div>
              {/* Rank Badge */}
              <div className="-mt-5 mb-2 flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-lg">
                <span className="text-sm font-black text-black">2</span>
              </div>
              {/* Name & Points */}
              <p className="mb-1 max-w-[82px] text-center text-sm font-bold leading-tight text-white">
                {sortedTeam[1]?.name.split(' ')[0]}<br />{sortedTeam[1]?.name.split(' ')[1]}
              </p>
              <p className="text-xs font-bold text-[#8ff0a8]">{sortedTeam[1]?.points} pts</p>
            </div>

            {/* 1st Place - Larger */}
            <div className="flex flex-col items-center -mt-4">
              {/* Crown */}
              <svg className="mb-2 h-9 w-9 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6z" />
              </svg>
              {/* Avatar */}
              <div className="mb-2 h-[92px] w-[92px] overflow-hidden rounded-full border-[4px] border-white bg-gradient-to-br from-purple-500 to-pink-500 shadow-[0_0_24px_rgba(255,255,255,0.16)]">
                {sortedTeam[0]?.avatar ? (
                  <img 
                    src={sortedTeam[0].avatar} 
                    alt={sortedTeam[0].name} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full" />
                )}
              </div>
              {/* Rank Badge */}
              <div className="-mt-6 mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-lg">
                <span className="font-black text-black">1</span>
              </div>
              {/* Name & Points */}
              <p className="mb-1 max-w-[92px] text-center font-bold leading-tight text-white">
                {sortedTeam[0]?.name.split(' ')[0]}<br />{sortedTeam[0]?.name.split(' ')[1]}
              </p>
              <p className="font-bold text-[#8ff0a8]">{sortedTeam[0]?.points} pts</p>
            </div>

            {/* 3rd Place */}
            <div className="flex flex-col items-center">
              {/* Crown */}
              <svg className="mb-2 h-7 w-7 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6z" />
              </svg>
              {/* Avatar */}
              <div className="mb-2 h-[70px] w-[70px] overflow-hidden rounded-full border-[3px] border-red-400 bg-gradient-to-br from-purple-500 to-pink-500">
                {sortedTeam[2]?.avatar ? (
                  <img 
                    src={sortedTeam[2].avatar} 
                    alt={sortedTeam[2].name} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full" />
                )}
              </div>
              {/* Rank Badge */}
              <div className="-mt-5 mb-2 flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-lg">
                <span className="text-sm font-black text-black">3</span>
              </div>
              {/* Name & Points */}
              <p className="mb-1 max-w-[82px] text-center text-sm font-bold leading-tight text-white">
                {sortedTeam[2]?.name.split(' ')[0]}<br />{sortedTeam[2]?.name.split(' ')[1]}
              </p>
              <p className="text-xs font-bold text-[#8ff0a8]">{sortedTeam[2]?.points} pts</p>
            </div>
          </div>

          {/* Remaining Members */}
          {sortedTeam.slice(3).map((member, index) => (
            <div 
              key={member.id}
              className="mb-3 flex items-center gap-3 rounded-[1rem] border border-white/8 bg-white/[0.07] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
            >
              {/* Rank */}
              <div className="flex h-8 w-8 items-center justify-center">
                <span className="text-sm font-black text-white">{index + 4}</span>
              </div>

              {/* Avatar */}
              <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500">
                {member.avatar ? (
                  <img 
                    src={member.avatar} 
                    alt={member.name} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full" />
                )}
              </div>

              {/* Name */}
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">{member.name}</p>
              </div>

              {/* Points */}
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#8ff0a8]">{member.points}</span>
                <img src={gemIcon} alt="gem" className="h-5 w-5" />
              </div>
            </div>
          ))}
        </div>

        <div className="mx-auto flex w-fit items-center rounded-full border border-white/10 bg-[#101215]/95 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_14px_40px_rgba(0,0,0,0.3)]">
          <button
            type="button"
            onClick={() => setLeaderboardView('personal')}
            className="rounded-full px-6 py-3 text-sm font-black text-white/70 transition-colors hover:text-white"
          >
            Your Team
          </button>
          <button
            type="button"
            className="rounded-full bg-white/10 px-6 py-3 text-sm font-black text-white"
          >
            Invited Team
          </button>
        </div>
      </div>
    );
  };

  const renderQuestsTab = () => {
    const findQuest = (type: string) => quests.find((quest) => quest.type === type && !quest.completed) || quests.find((quest) => quest.type === type);
    const handleQuestStart = (questId?: number, questType?: string) => {
      if (!questId || !questType) return;
      setActiveQuestModal({ type: questType, questId });
    };

    const questCards = [
      { title: 'Personality quiz', points: '5 - 30', quest: findQuest('quiz') },
      { title: 'Card headline', points: 10, quest: findQuest('checkin') },
      { title: 'Card headline', points: 15, quest: findQuest('share') },
      { title: 'Hidden products', points: 10, quest: findQuest('portfolio') },
    ];

    const alertCards = [
      {
        title: 'Team Challenge Alert!',
        body: 'Your mission: each team member must share 5 products from the marketplace before the day ends to earn an extra',
        points: 15,
        quest: findQuest('share'),
      },
      {
        title: 'Personality Quiz Alert!',
        body: 'Unlock Bonus Points! Take a Personality Quiz and win a Mystery Card. Your chance to earn bonus points ranging',
        points: '5 to 30',
        quest: findQuest('quiz'),
      },
    ];

    return (
      <div className="space-y-8 pb-8">
        <section>
          <h2 className="mb-2 text-2xl font-black text-white">Section Headline</h2>
          <p className="mb-5 text-sm font-semibold leading-relaxed text-white/55">
            Unlock Bonus Points! Take a Personality Quiz and get a chance to win earn bonus points ranging <span className="font-black text-[#8ff0a8]">from 5 to 30!</span>
          </p>
          <div className="-mx-1 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {questCards.map((card, index) => (
              <div
                key={`${card.title}-${index}`}
                className="flex min-h-[140px] min-w-[128px] flex-col justify-between rounded-[1.25rem] border border-white/10 bg-gradient-to-b from-[#25282d] to-[#181b20] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
              >
                <div>
                  <h3 className="whitespace-pre-line text-center text-sm font-black leading-tight text-white">{card.title}</h3>
                  <div className="mt-3 flex items-center justify-center gap-1 text-xs font-black text-[#8ff0a8]">
                    + {card.points}
                    <img src={gemIcon} alt="" className="h-5 w-5" />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleQuestStart(card.quest?.id, card.quest?.type)}
                  className="mt-4 rounded-full bg-white px-4 py-2 text-xs font-black text-black transition-colors hover:bg-gray-100"
                >
                  Start Now
                </button>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-2 text-2xl font-black text-white">Section Headline</h2>
          <p className="mb-5 text-sm font-semibold leading-relaxed text-white/55">
            Unlock Bonus Points! Take a Personality Quiz and get a chance to win earn bonus points ranging <span className="font-black text-[#8ff0a8]">from 5 to 30!</span>
          </p>
          <div className="space-y-4">
            {alertCards.map((alert) => (
              <div
                key={alert.title}
                className="relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-gradient-to-r from-[#292d32]/96 to-[#17191e]/98 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_16px_42px_rgba(0,0,0,0.26)]"
              >
                <div className="pointer-events-none absolute -right-12 bottom-0 h-28 w-40 rounded-full bg-cyan-300/10 blur-2xl" />
                <h3 className="relative z-10 mb-3 text-xl font-black text-white">{alert.title}</h3>
                <p className="relative z-10 max-w-[250px] text-sm font-semibold leading-relaxed text-white/62">
                  {alert.body} <span className="font-black text-[#8ff0a8]">{alert.points} points!</span>
                </p>
                <button
                  type="button"
                  onClick={() => handleQuestStart(alert.quest?.id, alert.quest?.type)}
                  className="relative z-10 ml-auto mt-4 block rounded-full bg-white px-6 py-2.5 text-xs font-black text-black transition-colors hover:bg-gray-100"
                >
                  Start Now
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  };

  const renderGameplayTab = () => {
    const handleQuestStart = (questId: number, questType: string) => {
      // Open appropriate modal based on quest type
      setActiveQuestModal({ type: questType, questId });
    };

    // Calculate stats
    const stats = getQuestStats();
    const levelProgress = stats.total ? Math.max(5, Math.round((stats.completed / stats.total) * 100)) : 64;
    const findQuest = (type: string) => quests.find((quest) => quest.type === type && !quest.completed) || quests.find((quest) => quest.type === type);

    const firstAvailableQuest = quests.find((quest) => !quest.completed) || quests[0];
    const earnPointActions = [
      { label: 'Referring\na friend', points: 20, className: 'left-1 top-3 h-[118px] w-[118px] -rotate-[15deg]', path: '/share-invites' },
      { label: 'Sharing\nwith a friend', points: 10, className: 'right-1 top-3 h-[118px] w-[118px] rotate-[16deg]', quest: findQuest('share') },
      { label: 'Signing\nup', points: 10, className: 'left-[-26px] top-[128px] h-[132px] w-[132px] rotate-[4deg]', quest: undefined },
      { label: 'Performing\na first-time action', points: 5, className: 'left-1/2 top-[78px] h-[190px] w-[190px] -translate-x-1/2 rotate-[7deg] z-20', quest: firstAvailableQuest },
      { label: 'Daily\ncheck-in', points: 2, className: 'right-[-28px] top-[128px] h-[132px] w-[132px] -rotate-[8deg]', quest: findQuest('checkin') },
      { label: 'Taking a personality\nquiz', points: 5, className: 'left-0 top-[258px] h-[180px] w-[180px] -rotate-[2deg]', quest: findQuest('quiz') },
      { label: 'Discovering hidden\nproducts', points: 10, className: 'right-0 top-[258px] h-[180px] w-[180px] -rotate-[13deg]', path: '/discovery' },
      { label: 'Reviewing\na product', points: 5, className: 'left-[-4px] top-[470px] h-[132px] w-[132px] rotate-[11deg]', quest: findQuest('review') },
      { label: 'Product portfolio\nperformance', points: 10, className: 'left-1/2 top-[410px] h-[172px] w-[172px] -translate-x-1/2 -rotate-[8deg]', quest: findQuest('portfolio') },
      { label: 'Completing\na survey', points: 10, className: 'right-[-4px] top-[470px] h-[132px] w-[132px] -rotate-[10deg]', quest: findQuest('survey') },
    ];
    const handleEarnPointAction = (action: typeof earnPointActions[number]) => {
      if ('path' in action && action.path) {
        navigate(action.path);
        return;
      }

      if (action.quest) {
        handleQuestStart(action.quest.id, action.quest.type);
      }
    };

    return (
      <div className="overflow-hidden pb-10">
        <section className="-mx-3 min-h-[485px] overflow-hidden text-center">
          <h2 className="mb-6 text-xl font-black text-white">Level Up to Unlock Rewards!</h2>
          <div className="relative mx-auto h-[300px] max-w-[420px]">
            <div className="absolute left-[-64px] top-20 h-40 w-40 rounded-full bg-[radial-gradient(circle,#8ed3ff_0%,rgba(84,163,255,0.54)_45%,rgba(84,163,255,0)_76%)] blur-sm" />
            <div className="absolute right-[-64px] top-20 h-40 w-40 rounded-full bg-[radial-gradient(circle,#8ff0a8_0%,rgba(97,255,141,0.52)_45%,rgba(97,255,141,0)_76%)] blur-sm" />
            <div className="absolute left-1/2 top-6 h-64 w-64 -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_50%_28%,rgba(255,236,141,0.9)_0%,rgba(249,179,43,0.92)_38%,rgba(219,88,0,0.92)_74%)] shadow-[0_0_48px_rgba(252,187,43,0.7)]">
              <div className="absolute inset-4 rounded-full border-[3px] border-orange-700/45" />
              <div className="absolute inset-x-0 top-[105px] text-center">
                <p className="mb-2 text-xl font-black text-white">{levelProgress}%</p>
                <div className="mx-auto h-1 w-24 rounded-full bg-black/35">
                  <div className="h-full rounded-full bg-white" style={{ width: `${levelProgress}%` }} />
                </div>
              </div>
            </div>
            <div className="absolute left-1/2 top-[250px] -translate-x-1/2 rounded-full border border-white/12 bg-white/10 px-8 py-3 text-base font-black text-white/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
              Rookie
            </div>
          </div>

          <div className="space-y-7 text-center">
            <div>
              <p className="text-base font-black text-white">Requirement</p>
              <p className="mt-1 text-sm font-semibold text-white/70">Sign up</p>
            </div>
            <div>
              <p className="text-base font-black text-white">Unlocks</p>
              <p className="mt-1 text-sm font-semibold text-white/70">Access to Wishlist & profile</p>
            </div>
          </div>
        </section>

        <section className="-mx-4 mt-2 min-h-[740px] overflow-hidden px-0">
          <h2 className="mb-6 text-center text-xl font-black text-white">How to Earn Points</h2>
          <div className="relative h-[700px]">
            {earnPointActions.map((action, index) => (
              <button
                key={action.label}
                type="button"
                onClick={() => handleEarnPointAction(action)}
                className={`group absolute rounded-full focus:outline-none focus:ring-2 focus:ring-white/30 ${action.className}`}
              >
                <motion.span
                  animate={{
                    x: [0, index % 2 === 0 ? 14 : -13, index % 3 === 0 ? -9 : 8, 0],
                    y: [0, index % 2 === 0 ? -18 : 16, index % 3 === 0 ? 12 : -11, 0],
                    rotate: [0, index % 2 === 0 ? 2.8 : -2.4, index % 3 === 0 ? -1.8 : 1.7, 0],
                    scale: [1, 1.055, 0.98, 1],
                  }}
                  transition={{
                    duration: 4.8 + index * 0.38,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: index * 0.11,
                  }}
                  whileHover={{ scale: 1.06 }}
                  className="flex h-full w-full flex-col items-center justify-center rounded-full border border-[#343760] bg-[radial-gradient(circle_at_50%_38%,#2d2d66_0%,#171842_60%,#10112c_100%)] p-4 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_18px_42px_rgba(0,0,0,0.36)] transition-shadow group-hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_22px_54px_rgba(143,240,168,0.18)]"
                  style={{ transformOrigin: '50% 50%', willChange: 'transform' }}
                >
                  <span className="mb-2 flex items-center gap-1 text-base font-black text-[#8ff0a8]">
                    +{action.points}
                    <img src={gemIcon} alt="Gem" className="h-6 w-6" />
                  </span>
                  <span className="whitespace-pre-line text-sm font-medium leading-tight text-white/62">
                    {action.label}
                  </span>
                </motion.span>
              </button>
            ))}
          </div>
        </section>
      </div>
    );

  };

  return (
    <div className="relative h-screen w-full flex flex-col bg-[#0a0e1a] overflow-hidden">
      <div className="max-w-2xl mx-auto w-full flex flex-col h-full">
        {/* Fixed Header */}
        <div className="flex-shrink-0">
          {renderHeader()}
        </div>

        {/* Scrollable Products Area */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-4 pt-4 pb-10">
          {activeTab === 'feed' ? (
            posts.length > 0 ? (
              <div className="space-y-4">
                {posts.map(post => renderPost(post))}
              </div>
            ) : (
              <div className="text-center py-12 px-4">
                <div className="bg-[#1a1d2e] rounded-3xl p-8">
                  {userInterests.length > 0 ? (
                    <>
                      <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="w-8 h-8 text-purple-500" />
                      </div>
                      <p className="text-white font-bold mb-2 text-base sm:text-lg">No matching products found</p>
                      <p className="text-gray-400 mb-4 text-xs sm:text-sm">
                        We couldn't find any products matching your interests: {userInterests.map(i => i.charAt(0).toUpperCase() + i.slice(1)).join(', ')}
                      </p>
                      <p className="text-gray-500 text-xs mb-6">
                        Try updating your interests to see personalized product recommendations
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ShoppingCart className="w-8 h-8 text-blue-500" />
                      </div>
                      <p className="text-gray-400 mb-4 text-sm sm:text-base">No products available yet</p>
                      <p className="text-gray-500 text-xs sm:text-sm mb-6">
                        Check back soon for personalized product recommendations
                      </p>
                    </>
                  )}
                  {userInterests.length > 0 && (
                    <div className="flex justify-center">
                      <button
                        onClick={() => navigate('/settings')}
                        className="px-6 py-3 bg-blue-500 text-white rounded-full font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/30"
                      >
                        Update Interests
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          ) : activeTab === 'saved' ? (
            renderSavedTab()
          ) : activeTab === 'leaderboard' ? (
            renderLeaderboardTab()
          ) : activeTab === 'quests' ? (
            renderQuestsTab()
          ) : activeTab === 'gameplay' ? (
            renderGameplayTab()
          ) : (
            renderNetworkTab()
          )}
        </div>

      </div>

      {/* Network Success Popup */}
      <AnimatePresence>
        {networkSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 18 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 18 }}
              className="relative w-full max-w-sm overflow-hidden rounded-[2rem] border border-white/12 bg-gradient-to-b from-[#26292e]/95 to-[#121418]/98 px-8 pb-10 pt-12 text-center shadow-2xl"
            >
              <button
                type="button"
                onClick={() => setNetworkSuccess(null)}
                className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-white/8 text-white/70 transition-colors hover:bg-white/14 hover:text-white"
                aria-label="Close success popup"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_12%,rgba(255,255,255,0.08),transparent_48%)]" />
              <img
                src={networkSuccess.image}
                alt={networkSuccess.name}
                className="relative z-10 mx-auto mb-8 h-36 w-36 rounded-full object-cover"
              />
              <h2 className="relative z-10 mb-3 text-2xl font-black text-white">Success!</h2>
              <p className="relative z-10 mx-auto max-w-[260px] text-base font-semibold leading-relaxed text-white/62">
                {networkSuccess.name} has been successfully added to your network. Stay connected and start engaging!
              </p>
              <button
                type="button"
                onClick={() => setNetworkSuccess(null)}
                className="relative z-10 mx-auto mt-9 block rounded-full bg-white px-9 py-3.5 text-base font-black text-black shadow-xl transition-colors hover:bg-gray-100"
              >
                Confirm
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quest Completion Toast */}
      <QuestToast />

      {/* Quest Modals */}
      <AnimatePresence>
        {activeQuestModal && activeQuestModal.type === 'quiz' && (
          <PersonalityQuizModal
            questId={activeQuestModal.questId}
            onClose={() => setActiveQuestModal(null)}
            onComplete={handleQuestComplete}
          />
        )}
        {activeQuestModal && activeQuestModal.type === 'checkin' && (
          <DailyCheckInModal
            questId={activeQuestModal.questId}
            onClose={() => setActiveQuestModal(null)}
            onComplete={handleQuestComplete}
          />
        )}
        {activeQuestModal && activeQuestModal.type === 'share' && (
          <ShareProductsModal
            questId={activeQuestModal.questId}
            onClose={() => setActiveQuestModal(null)}
            onComplete={handleQuestComplete}
          />
        )}
        {activeQuestModal && activeQuestModal.type === 'review' && (
          <ReviewItemsModal
            questId={activeQuestModal.questId}
            onClose={() => setActiveQuestModal(null)}
            onComplete={handleQuestComplete}
          />
        )}
        {activeQuestModal && activeQuestModal.type === 'survey' && (
          <SurveyModal
            questId={activeQuestModal.questId}
            onClose={() => setActiveQuestModal(null)}
            onComplete={handleQuestComplete}
          />
        )}
        {activeQuestModal && activeQuestModal.type === 'content' && (
          <ContentCreationModal
            questId={activeQuestModal.questId}
            onClose={() => setActiveQuestModal(null)}
            onComplete={handleQuestComplete}
          />
        )}
        {activeQuestModal && activeQuestModal.type === 'portfolio' && (
          <PortfolioActivityModal
            questId={activeQuestModal.questId}
            onClose={() => setActiveQuestModal(null)}
            onComplete={handleQuestComplete}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
