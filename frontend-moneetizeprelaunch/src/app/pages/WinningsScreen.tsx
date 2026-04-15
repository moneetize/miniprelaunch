import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from 'react';
import { useNavigate } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronLeft, MessageCircle, X } from 'lucide-react';
import gemIcon from 'figma:asset/296d8aa06fd9c7e60192bc7368a4a032ec5bc17e.png';
import wildcardIcon from 'figma:asset/f632203f248e2d298246c5ffb0789bc0cac99ea5.png';
import tshirtRewardIcon from '../../assets/moneetize-tshirt-reward.png';
import { getPointsHistory, getUserPoints, POINTS_UPDATED_EVENT, setUserPoints, type PointsTransaction } from '../utils/pointsManager';
import { getStoredProfileSettings, PROFILE_SETTINGS_STORAGE_KEYS, PROFILE_SETTINGS_UPDATED_EVENT } from '../utils/profileSettings';
import { getAgentAvatarTone, getSelectedAvatarImage } from '../utils/avatarUtils';
import { safeGetItem } from '../utils/storage';
import { submitEarlyAccessRequest } from '../services/earlyAccessService';
import { getStoredUsdtBalance, loadScratchProfile, type ScratchDrawResult } from '../services/scratchService';
import { loadMarketplaceOrders, MARKETPLACE_ORDERS_UPDATED_EVENT, type MarketplaceOrder } from '../services/marketplaceService';
import { hydrateRemoteProfileSettings } from '../services/profilePersistenceService';

type RewardItemIcon = 'usdt' | 'tripto' | 'wildcard' | 'shirt';

interface RewardItem {
  id: string;
  label: string;
  icon: RewardItemIcon;
  image?: string;
  isEarlyAccess?: boolean;
  isPlaceholder?: boolean;
}

interface HistoryRewardIcon {
  id: string;
  type: 'points' | 'tripto' | 'wildcard' | 'merch' | 'usdt';
  amount?: number;
}

type WinningsHistoryEntry =
  | { kind: 'scratch'; id: string; createdAt: string; draw: ScratchDrawResult }
  | { kind: 'redemption'; id: string; createdAt: string; title: string; description: string; points: number };

function getStoredScratchHistory(): ScratchDrawResult[] {
  try {
    const history = safeGetItem('scratchHistory');
    const parsed = history ? JSON.parse(history) : [];
    if (Array.isArray(parsed) && parsed.length) return parsed;
  } catch {
    // Keep reading the latest scratch reward below for older local sessions.
  }

  try {
    const latestReward = safeGetItem('lastScratchReward');
    const parsedLatestReward = latestReward ? JSON.parse(latestReward) : null;
    return parsedLatestReward?.id ? [parsedLatestReward] : [];
  } catch {
    return [];
  }
}

function mergeScratchHistory(...sources: ScratchDrawResult[][]) {
  const merged = new Map<string, ScratchDrawResult>();

  sources.flat().forEach((draw) => {
    if (!draw?.id || merged.has(draw.id)) return;
    merged.set(draw.id, draw);
  });

  return [...merged.values()].sort((first, second) => {
    const firstTime = new Date(first.createdAt).getTime() || 0;
    const secondTime = new Date(second.createdAt).getTime() || 0;
    return secondTime - firstTime;
  });
}

function getScratchHistoryUsdtTotal(history: ScratchDrawResult[]) {
  return history.reduce((total, draw) => total + (Number(draw.reward?.usdt) || 0), 0);
}

function getScratchHistoryTriptoTotal(history: ScratchDrawResult[]) {
  return history.reduce((total, draw) => total + (Number(draw.reward?.triptoPoints) || 0), 0);
}

function formatMoney(value: number) {
  return value.toFixed(2);
}

function formatTokenAmount(value: number) {
  return value.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

function formatHistoryDate(timestamp: string) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date).replace(/\//g, '.');
}

function formatHistoryTime(timestamp: string) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date);
}

function getHistoryTitle(draw: ScratchDrawResult) {
  if (draw.ticket.isGolden) return 'Golden scratch';
  if (draw.ticket.theme === 'blue') return 'Basic scratch';
  return 'Wild scratch';
}

function getHistoryRewards(draw: ScratchDrawResult): HistoryRewardIcon[] {
  const rewards: HistoryRewardIcon[] = [];
  const awardedItems = draw.reward.items || [];

  if (awardedItems.some(item => item.type === 'merch')) {
    rewards.push({ id: `${draw.id}-merch`, type: 'merch' });
  }

  if (draw.ticket.isGolden || awardedItems.some(item => item.type === 'wildcard')) {
    rewards.push({ id: `${draw.id}-wildcard`, type: 'wildcard' });
  }

  if (draw.reward.usdt > 0) {
    rewards.push({ id: `${draw.id}-usdt`, type: 'usdt', amount: draw.reward.usdt });
  }

  if (draw.reward.triptoPoints > 0) {
    rewards.push({ id: `${draw.id}-tripto`, type: 'tripto', amount: draw.reward.triptoPoints });
  }

  if (draw.reward.moneetizePoints > 0) {
    rewards.push({ id: `${draw.id}-points`, type: 'points', amount: draw.reward.moneetizePoints });
  }

  return rewards;
}

const coreRedeemableItems: RewardItem[] = [
  { id: 'usdt-balance', label: 'USDT (Locked)', icon: 'usdt' },
  { id: 'tripto-allocation', label: 'Tripto Allocation', icon: 'tripto' },
  { id: 'moneetize-shirt', label: 'Moneetize Merch', icon: 'shirt', image: tshirtRewardIcon },
  { id: 'token-early-access', label: 'Token Early Access', icon: 'wildcard', image: wildcardIcon, isEarlyAccess: true },
];

const fallbackRedeemableItems: RewardItem[] = [
  ...coreRedeemableItems,
  { id: 'wild-card', label: 'Wild Card', icon: 'wildcard', image: wildcardIcon, isPlaceholder: true },
  { id: 'team-sync-booster', label: 'Team Booster', icon: 'wildcard', image: wildcardIcon, isPlaceholder: true },
  { id: 'founders-grace', label: "Founder's Grace", icon: 'wildcard', image: wildcardIcon, isPlaceholder: true },
];

function getRedeemableProducts(history: ScratchDrawResult[]) {
  const products = new Map<string, RewardItem>();

  history.forEach((draw) => {
    draw.reward.items?.forEach((item) => {
      if (item.type === 'merch') {
        products.set('moneetize-shirt', {
          id: 'moneetize-shirt',
          label: 'Moneetize Merch',
          icon: 'shirt',
          image: tshirtRewardIcon,
        });
      }

      if (item.type === 'wildcard') {
        products.set('wild-card', {
          id: 'wild-card',
          label: item.label || draw.reward.wildCard.name || 'Wild Card',
          icon: 'wildcard',
          image: wildcardIcon,
        });
      }

      if (item.type === 'tripto') {
        products.set('tripto-allocation', {
          id: 'tripto-allocation',
          label: item.label || 'Tripto Allocation',
          icon: 'tripto',
        });
      }

      if (item.type === 'usdt') {
        products.set('usdt-balance', {
          id: 'usdt-balance',
          label: 'USDT (Locked)',
          icon: 'usdt',
        });
      }
    });
  });

  const earnedProducts = [...products.values()];
  if (!earnedProducts.length) return fallbackRedeemableItems;

  const coreFill = coreRedeemableItems.filter((item) => !products.has(item.id));
  const fallbackFill = fallbackRedeemableItems.filter((item) => !products.has(item.id) && !coreFill.some(coreItem => coreItem.id === item.id));
  return [...earnedProducts, ...coreFill, ...fallbackFill].slice(0, 8);
}

function getMarketplaceRedemptionEntries(
  marketplaceOrders: MarketplaceOrder[],
  pointTransactions: PointsTransaction[],
): WinningsHistoryEntry[] {
  const orderEntries = marketplaceOrders
    .filter((order) => (Number(order.pointsTotal) || 0) > 0)
    .map((order) => {
      const itemCount = order.items.reduce((total, item) => total + item.quantity, 0);
      return {
        kind: 'redemption' as const,
        id: order.id,
        createdAt: order.createdAt,
        title: 'Moneetize merch redeemed',
        description: `${itemCount} item${itemCount === 1 ? '' : 's'} | ${order.orderNumber || 'Marketplace order'}`,
        points: Number(order.pointsTotal) || 0,
      };
    });

  if (orderEntries.length) return orderEntries;

  return pointTransactions
    .filter((transaction) => transaction.type === 'subtract' && transaction.source === 'marketplace-redemption')
    .map((transaction) => ({
      kind: 'redemption' as const,
      id: `points-${transaction.timestamp}`,
      createdAt: new Date(transaction.timestamp).toISOString(),
      title: 'Marketplace redemption',
      description: 'Points used for merch',
      points: Number(transaction.amount) || 0,
    }));
}

function getWinningsHistoryEntries(
  scratchHistory: ScratchDrawResult[],
  marketplaceOrders: MarketplaceOrder[],
  pointTransactions: PointsTransaction[],
): WinningsHistoryEntry[] {
  const scratchEntries: WinningsHistoryEntry[] = scratchHistory.map((draw) => ({
    kind: 'scratch',
    id: draw.id,
    createdAt: draw.createdAt,
    draw,
  }));

  return [
    ...scratchEntries,
    ...getMarketplaceRedemptionEntries(marketplaceOrders, pointTransactions),
  ].sort((first, second) => {
    const firstTime = new Date(first.createdAt).getTime() || 0;
    const secondTime = new Date(second.createdAt).getTime() || 0;
    return secondTime - firstTime;
  });
}

function isInteractiveTarget(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest('button, a, input, select, textarea, label'));
}

function WinningsScreen() {
  const navigate = useNavigate();
  const winningsSliderDragRef = useRef({
    isDragging: false,
    startX: 0,
    scrollLeft: 0,
  });
  const [userPoints, setUserPointsState] = useState(0);
  const [userName, setUserName] = useState('Jess Wu');
  const [userPhoto, setUserPhoto] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('blueAvatar');
  const [scratchHistory, setScratchHistory] = useState<ScratchDrawResult[]>(() => getStoredScratchHistory());
  const [marketplaceOrders, setMarketplaceOrders] = useState<MarketplaceOrder[]>(() => loadMarketplaceOrders());
  const [pointTransactions, setPointTransactions] = useState<PointsTransaction[]>(() => getPointsHistory());
  const [usdtBalance, setUsdtBalance] = useState(() => Math.max(getStoredUsdtBalance(), getScratchHistoryUsdtTotal(getStoredScratchHistory())));
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const [requestError, setRequestError] = useState('');
  const [isWinningsSliderDragging, setIsWinningsSliderDragging] = useState(false);

  useEffect(() => {
    const applyProfileSettings = () => {
      const profileSettings = getStoredProfileSettings({ fallbackName: 'Jess Wu' });

      setUserName(profileSettings.name);
      setFormName(profileSettings.name);
      setFormEmail(profileSettings.email);
      setSelectedAvatar(profileSettings.selectedAvatar);
      setUserPhoto(profileSettings.photo);
    };

    const syncScratchState = () => {
      const history = getStoredScratchHistory();
      setScratchHistory(history);
      setUserPointsState(getUserPoints());
      setPointTransactions(getPointsHistory());
      setMarketplaceOrders(loadMarketplaceOrders());
      setUsdtBalance(Math.max(getStoredUsdtBalance(), getScratchHistoryUsdtTotal(history)));
      return history;
    };

    applyProfileSettings();
    void hydrateRemoteProfileSettings()
      .then((settings) => {
        if (settings) applyProfileSettings();
      })
      .catch((error) => {
        console.warn('Remote winnings profile hydration skipped:', error);
      });
    const initialHistory = syncScratchState();

    void loadScratchProfile()
      .then((profile) => {
        const mergedHistory = mergeScratchHistory(profile?.history || [], getStoredScratchHistory(), initialHistory);
        const mergedHistoryUsdt = getScratchHistoryUsdtTotal(mergedHistory);

        if (mergedHistory.length > 0) {
          setScratchHistory(mergedHistory);
        }

        if (profile?.balances) {
          setUserPointsState(getUserPoints());
          setUsdtBalance((currentBalance) => Math.max(
            currentBalance,
            profile.balances.usdt,
            getStoredUsdtBalance(),
            mergedHistoryUsdt
          ));
          return;
        }

        setUserPointsState(getUserPoints());
        setUsdtBalance((currentBalance) => Math.max(currentBalance, getStoredUsdtBalance(), mergedHistoryUsdt));
      })
      .catch((error) => {
        console.warn('Winnings scratch profile sync skipped:', error);
      });

    const syncPointBalance = () => {
      setUserPointsState(getUserPoints());
      setPointTransactions(getPointsHistory());
    };
    const syncMarketplaceOrders = () => setMarketplaceOrders(loadMarketplaceOrders());
    const handleProfileSettingsUpdated = () => applyProfileSettings();
    const handleStorageChange = (event: StorageEvent) => {
      if (!event.key || PROFILE_SETTINGS_STORAGE_KEYS.includes(event.key)) {
        applyProfileSettings();
      }

      if (!event.key || ['userPoints', 'pointsHistory', 'userUsdtBalance', 'scratchHistory'].includes(event.key)) {
        syncScratchState();
      }

      if (!event.key || event.key === 'moneetizeMarketplaceOrders') {
        syncMarketplaceOrders();
      }
    };

    window.addEventListener(PROFILE_SETTINGS_UPDATED_EVENT, handleProfileSettingsUpdated);
    window.addEventListener(POINTS_UPDATED_EVENT, syncPointBalance);
    window.addEventListener(MARKETPLACE_ORDERS_UPDATED_EVENT, syncMarketplaceOrders);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener(PROFILE_SETTINGS_UPDATED_EVENT, handleProfileSettingsUpdated);
      window.removeEventListener(POINTS_UPDATED_EVENT, syncPointBalance);
      window.removeEventListener(MARKETPLACE_ORDERS_UPDATED_EVENT, syncMarketplaceOrders);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const triptoBalance = getScratchHistoryTriptoTotal(scratchHistory);
  const redeemableItems = getRedeemableProducts(scratchHistory);
  const visibleWinningsHistory = getWinningsHistoryEntries(scratchHistory, marketplaceOrders, pointTransactions).slice(0, 12);
  const displayBalance = formatMoney(usdtBalance);
  const approximateBalance = formatMoney(usdtBalance);
  const aiAgentImage = getSelectedAvatarImage(selectedAvatar);
  const aiAgentTone = getAgentAvatarTone(selectedAvatar);

  const renderAnimatedAiAvatar = () => {
    return (
      <span className="relative block h-12 w-12">
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
          className={`relative block h-12 w-12 overflow-hidden rounded-full border-2 ${aiAgentTone.borderClass} transition-colors`}
          style={{
            maskImage: 'radial-gradient(circle at center, black 40%, transparent 90%)',
            WebkitMaskImage: 'radial-gradient(circle at center, black 40%, transparent 90%)',
          }}
        >
          <img src={aiAgentImage} alt="AI Agent" className={`h-full w-full object-cover opacity-90 ${aiAgentTone.imageClass}`} />
        </motion.span>
      </span>
    );
  };

  const renderHistoryReward = (reward: HistoryRewardIcon) => {
    if (reward.type === 'wildcard') {
      return <img src={wildcardIcon} alt="Wild Card" className="h-7 w-7 rounded-[0.3rem] object-contain" />;
    }

    if (reward.type === 'merch') {
      return <img src={tshirtRewardIcon} alt="Moneetize Merch" className="h-7 w-7 object-contain" />;
    }

    if (reward.type === 'tripto') {
      return (
        <span className="flex items-center gap-1 text-xs font-black text-white">
          + {formatTokenAmount(reward.amount || 0)}
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[radial-gradient(circle_at_35%_30%,#ffffff_0%,#c9c9c3_34%,#6e6f6f_72%,#36393c_100%)] text-[10px] text-[#333] shadow-[inset_0_1px_3px_rgba(255,255,255,0.9),0_0_14px_rgba(255,255,255,0.18)]">
            T
          </span>
        </span>
      );
    }

    if (reward.type === 'usdt') {
      return (
        <span className="rounded-full bg-emerald-300/12 px-2 py-1 text-[10px] font-black text-emerald-100">
          ${formatMoney(reward.amount || 0)} locked
        </span>
      );
    }

    return (
      <span className="flex items-center gap-1 text-xs font-black text-emerald-200">
        +{formatTokenAmount(reward.amount || 0)}
        <img src={gemIcon} alt="Gem" className="h-6 w-6 drop-shadow-[0_0_14px_rgba(134,255,166,0.58)]" />
      </span>
    );
  };

  const renderRedeemableIcon = (item: RewardItem) => {
    if (item.icon === 'usdt') {
      return (
        <span className="relative mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-[radial-gradient(circle_at_35%_28%,#b8ffe5_0%,#4ee0bd_32%,#1aa88f_68%,#0a6a5d_100%)] text-white shadow-[inset_0_1px_3px_rgba(255,255,255,0.68),0_0_20px_rgba(78,224,189,0.32)]">
          <span className="text-[18px] font-black leading-none">T</span>
          <span className="absolute top-[17px] h-[2px] w-5 rounded-full bg-white/90" />
        </span>
      );
    }

    if (item.icon === 'tripto') {
      return (
        <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-[radial-gradient(circle_at_35%_30%,#ffffff_0%,#deded9_34%,#8a8d8d_72%,#3c4043_100%)] text-[13px] font-black text-[#2d3032] shadow-[inset_0_1px_3px_rgba(255,255,255,0.9),0_0_20px_rgba(255,255,255,0.16)]">
          TR
        </span>
      );
    }

    if (item.image) {
      return (
        <img
          src={item.image}
          alt={item.label}
          className={`mb-2 object-contain ${
            item.icon === 'shirt' ? 'h-11 w-11' : 'h-10 w-10'
          }`}
        />
      );
    }

    return (
      <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-[12px] font-black text-white/70">
        +
      </span>
    );
  };

  const closeTokenModal = () => {
    setShowTokenModal(false);
    setShowRequestForm(false);
    setRequestError('');
    setRequestMessage('');
  };

  const handleSubmitEarlyAccess = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setRequestError('');
    setRequestMessage('');

    try {
      const result = await submitEarlyAccessRequest({
        name: formName.trim(),
        email: formEmail.trim(),
      });

      const newTotal = typeof result.newTotalPoints === 'number' ? result.newTotalPoints : getUserPoints() + (result.pointsEarned || 0);
      setUserPoints(newTotal);
      setUserPointsState(newTotal);
      setRequestMessage(
        result.pointsEarned && result.pointsEarned > 0
          ? `Request submitted. +${result.pointsEarned} points added to your profile.`
          : 'Request already submitted. The admin team can review it from the control panel.'
      );
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : 'Unable to submit early access request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWinningsSliderPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    if (isInteractiveTarget(event.target)) return;

    const slider = event.currentTarget;
    winningsSliderDragRef.current = {
      isDragging: true,
      startX: event.clientX,
      scrollLeft: slider.scrollLeft,
    };

    setIsWinningsSliderDragging(true);
    slider.setPointerCapture(event.pointerId);
  };

  const handleWinningsSliderPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const slider = event.currentTarget;
    const drag = winningsSliderDragRef.current;
    if (!drag.isDragging) return;

    const deltaX = event.clientX - drag.startX;
    if (Math.abs(deltaX) > 2) {
      event.preventDefault();
    }

    slider.scrollLeft = drag.scrollLeft - deltaX;
  };

  const handleWinningsSliderPointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    const slider = event.currentTarget;
    if (slider.hasPointerCapture(event.pointerId)) {
      slider.releasePointerCapture(event.pointerId);
    }

    winningsSliderDragRef.current.isDragging = false;
    setIsWinningsSliderDragging(false);
  };

  const handleWinningsSliderWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    const slider = event.currentTarget;
    if (slider.scrollWidth <= slider.clientWidth) return;

    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    if (delta === 0) return;

    event.preventDefault();
    slider.scrollLeft += delta;
  };

  const handleRedeemableClick = (item: RewardItem) => {
    if (item.icon === 'shirt' || item.id === 'moneetize-shirt') {
      navigate('/marketplace');
      return;
    }

    if (item.isEarlyAccess) {
      setShowTokenModal(true);
    }
  };

  const renderStatusBar = () => (
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
  );

  const renderCompactHeader = () => (
    <div className="bg-[#0a0e1a]">
      {renderStatusBar()}
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
            <span className="text-sm font-black text-[#8ff0a8]">{userPoints}</span>
            <img src={gemIcon} alt="Gem" className="h-5 w-5" />
          </div>
        </div>

        <button
          onClick={() => navigate('/profile-screen')}
          className="flex h-10 items-center gap-3 rounded-full bg-white px-4 text-black shadow-[0_8px_24px_rgba(0,0,0,0.32)]"
        >
          <div className="h-7 w-7 overflow-hidden rounded-full bg-gradient-to-br from-orange-300 to-orange-600">
            <img src={userPhoto} alt={userName} className="h-full w-full object-cover" />
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

      <div className="px-4 pb-5">
        <div className="grid grid-cols-4 rounded-full border border-white/10 bg-[#101215]/95 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_10px_32px_rgba(0,0,0,0.22)]">
          {[
            { label: 'Network', path: '/profile-screen' },
            { label: 'Team', path: '/team-view' },
            { label: 'Winnings', path: '/winnings' },
            { label: 'Gameplay', path: '/gameplay' },
          ].map((tab) => (
            <button
              key={tab.label}
              onClick={() => tab.path !== '/winnings' && navigate(tab.path)}
              className={`rounded-full px-2 py-2.5 text-xs font-semibold transition-colors ${
                tab.path === '/winnings'
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

  return (
    <div className="h-screen w-full overflow-y-auto bg-[#0a0e1a] text-white [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <div className="mx-auto min-h-full w-full max-w-2xl">
        {renderCompactHeader()}

        <main className="px-5 pb-28 pt-3">
          <section className="text-center">
            <p className="text-[12px] font-bold text-white/46">Balance</p>
            <div className="mt-1 flex items-end justify-center gap-2">
              <p className="text-[42px] font-black leading-none text-white">${displayBalance}</p>
              <span className="pb-1 text-[11px] font-black text-white/70">USDT</span>
              <span className="pb-1 text-[10px] font-black text-white/44">(Locked)</span>
            </div>
            <p className="mt-3 text-[12px] font-bold text-white/38">= ${approximateBalance}</p>
            <p className="mt-2 text-[12px] font-black text-red-400">- 1.45 (-5.9%)</p>
          </section>

          <section className="mt-8 grid grid-cols-2 gap-5">
            <div className="relative min-h-[142px] overflow-hidden rounded-[1rem] border border-white/8 bg-gradient-to-b from-[#252a2d]/96 to-[#171a1d]/98 px-5 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_18px_50px_rgba(0,0,0,0.34)]">
              <div className="absolute right-3 top-3 text-[12px] font-black text-[#82f3a5]">+5.9%</div>
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[radial-gradient(circle_at_35%_30%,#b9ffda_0%,#36d8ac_38%,#0d7f74_100%)] text-lg font-black text-white shadow-[0_0_22px_rgba(77,255,184,0.34)]">
                  T
                </span>
                <span className="text-[14px] font-black text-white">USDT</span>
              </div>
              <p className="mt-4 text-[12px] font-bold text-white/48">Balance</p>
              <div className="mt-1 flex items-end gap-2">
                <p className="text-[33px] font-black leading-none text-white">${displayBalance}</p>
                <span className="pb-1 text-[10px] font-black text-white/44">(Locked)</span>
              </div>
              <p className="mt-3 text-[12px] font-bold text-white/38">= ${formatMoney(usdtBalance)}</p>
            </div>

            <div className="relative min-h-[142px] overflow-hidden rounded-[1rem] border border-white/8 bg-gradient-to-b from-[#25272b]/96 to-[#17191c]/98 px-5 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_18px_50px_rgba(0,0,0,0.34)]">
              <div className="absolute right-3 top-3 text-[12px] font-black text-red-400">-1.9%</div>
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[radial-gradient(circle_at_35%_30%,#ffffff_0%,#c9c9c3_34%,#6e6f6f_72%,#36393c_100%)] text-[13px] font-black text-[#303234] shadow-[inset_0_1px_3px_rgba(255,255,255,0.9),0_0_18px_rgba(255,255,255,0.14)]">
                  T
                </span>
                <span className="text-[14px] font-black text-white">TRIPTO</span>
              </div>
              <p className="mt-4 text-[12px] font-bold text-white/48">Balance</p>
              <div className="mt-1 flex items-end gap-2">
                <p className="text-[33px] font-black leading-none text-white">{formatTokenAmount(triptoBalance)}</p>
                <span className="pb-1 text-[10px] font-black text-white/44">(Locked)</span>
              </div>
              <p className="mt-3 text-[12px] font-bold text-white/38">= ${formatMoney(triptoBalance * 13.9552)}</p>
            </div>
          </section>

          <section
            onPointerDown={handleWinningsSliderPointerDown}
            onPointerMove={handleWinningsSliderPointerMove}
            onPointerUp={handleWinningsSliderPointerEnd}
            onPointerCancel={handleWinningsSliderPointerEnd}
            onPointerLeave={handleWinningsSliderPointerEnd}
            onWheel={handleWinningsSliderWheel}
            className={`-mx-5 mt-8 flex gap-5 overflow-x-auto px-5 pb-3 select-none touch-pan-y [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
              isWinningsSliderDragging ? 'cursor-grabbing snap-none' : 'cursor-grab snap-x'
            }`}
            aria-label="Redeemable winnings"
          >
            {redeemableItems.map((item, index) => (
              <motion.button
                key={item.id}
                type="button"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                onClick={() => handleRedeemableClick(item)}
                className="flex h-[96px] min-w-[116px] snap-center flex-col items-center justify-center rounded-[1rem] border border-white/8 bg-gradient-to-b from-[#1f2226]/96 to-[#151719]/98 px-3 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_16px_42px_rgba(0,0,0,0.3)] transition-transform hover:scale-[1.02]"
              >
                {renderRedeemableIcon(item)}
                <span className={`text-[11px] font-black leading-tight ${item.isPlaceholder ? 'text-white/48' : 'text-white'}`}>
                  {item.label}
                </span>
              </motion.button>
            ))}
          </section>

          <section className="mt-16">
            <h2 className="mb-4 text-[22px] font-black text-white">Pre-game Winnings</h2>
            <div className="space-y-2">
              {visibleWinningsHistory.length > 0 ? (
                visibleWinningsHistory.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex min-h-[74px] items-center justify-between gap-3 rounded-[1rem] border border-white/10 bg-gradient-to-r from-[#202326]/98 to-[#171a1d]/98 px-5 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_12px_34px_rgba(0,0,0,0.24)]"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-black text-white">
                        {entry.kind === 'scratch' ? getHistoryTitle(entry.draw) : entry.title}
                      </p>
                      <p className="mt-1 text-[11px] font-bold text-white/42">
                        {formatHistoryDate(entry.createdAt)} | {formatHistoryTime(entry.createdAt)}
                      </p>
                      {entry.kind === 'redemption' && (
                        <p className="mt-1 truncate text-[11px] font-bold text-white/34">{entry.description}</p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {entry.kind === 'scratch' ? (
                        getHistoryRewards(entry.draw).map((reward) => (
                          <span key={reward.id}>{renderHistoryReward(reward)}</span>
                        ))
                      ) : (
                        <span className="flex items-center gap-1 rounded-full bg-red-400/10 px-2 py-1 text-xs font-black text-red-100">
                          -{formatTokenAmount(entry.points)}
                          <img src={gemIcon} alt="Gem" className="h-5 w-5 opacity-90" />
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[1rem] border border-white/10 bg-white/[0.05] px-5 py-6 text-center text-sm font-bold text-white/48">
                  Scratch rewards and redemptions will appear here after your first activity.
                </div>
              )}
            </div>
          </section>
        </main>
      </div>

      <AnimatePresence>
        {showTokenModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/78 px-4 backdrop-blur-sm"
            onClick={closeTokenModal}
          >
            <motion.div
              initial={{ opacity: 0, y: 22, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 22, scale: 0.96 }}
              onClick={(event) => event.stopPropagation()}
              className="relative w-full max-w-[370px] overflow-hidden rounded-[1.9rem] border border-white/12 bg-gradient-to-b from-[#25282d] via-[#1c1f23] to-[#15171a] px-8 pb-12 pt-12 text-center shadow-[0_24px_80px_rgba(0,0,0,0.58)]"
            >
              <button
                type="button"
                onClick={closeTokenModal}
                className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/70 transition-colors hover:bg-white/16 hover:text-white"
                aria-label="Close token early access modal"
              >
                <X className="h-4 w-4" />
              </button>

              {!showRequestForm ? (
                <>
                  <img src={wildcardIcon} alt="Wild Card" className="mx-auto mb-8 h-24 w-24 object-contain" />
                  <h2 className="mb-3 text-2xl font-black text-white">Token Early Access</h2>
                  <p className="mx-auto mb-8 max-w-[220px] text-base font-medium leading-snug text-white/55">
                    Request access to redeem this launch reward.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowRequestForm(true)}
                    className="mx-auto rounded-full bg-white px-8 py-3.5 font-black text-black shadow-[0_14px_34px_rgba(255,255,255,0.16)] transition-colors hover:bg-gray-100"
                  >
                    Activate
                  </button>
                </>
              ) : (
                <form onSubmit={handleSubmitEarlyAccess} className="text-left">
                  <div className="mb-6 text-center">
                    <img src={wildcardIcon} alt="" className="mx-auto mb-4 h-16 w-16 object-contain" />
                    <h2 className="text-2xl font-black text-white">Request access</h2>
                    <p className="mt-2 text-sm leading-relaxed text-white/55">
                      Send your name and email to request Token Early Access.
                    </p>
                  </div>

                  <label className="mb-4 block">
                    <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-white/45">Name</span>
                    <input
                      value={formName}
                      onChange={(event) => setFormName(event.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-white outline-none transition focus:border-white/35"
                      placeholder="Your name"
                      required
                    />
                  </label>

                  <label className="mb-5 block">
                    <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-white/45">Email</span>
                    <input
                      type="email"
                      value={formEmail}
                      onChange={(event) => setFormEmail(event.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-white outline-none transition focus:border-white/35"
                      placeholder="you@example.com"
                      required
                    />
                  </label>

                  {requestError && (
                    <p className="mb-4 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                      {requestError}
                    </p>
                  )}
                  {requestMessage && (
                    <p className="mb-4 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
                      {requestMessage}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full rounded-full bg-white py-3.5 font-black text-black transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmitting ? 'Sending...' : 'Send Request'}
                  </button>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default WinningsScreen;
