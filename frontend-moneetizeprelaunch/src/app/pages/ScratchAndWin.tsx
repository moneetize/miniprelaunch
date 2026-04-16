import { motion, AnimatePresence } from 'motion/react';
import { useState, useRef, useEffect, type PointerEvent as ReactPointerEvent, type WheelEvent as ReactWheelEvent } from 'react';
import { useNavigate } from 'react-router';
import { Check, Copy, Info, Link as LinkIcon, Plus } from 'lucide-react';
import gemIcon from 'figma:asset/296d8aa06fd9c7e60192bc7368a4a032ec5bc17e.png';
import wildcardIcon from 'figma:asset/f632203f248e2d298246c5ffb0789bc0cac99ea5.png';
import tshirtRewardIcon from '../../assets/moneetize-tshirt-reward.png';
import SembolVariants from '../../imports/SembolVariants';
import { getUserPoints, setUserPoints } from '../utils/pointsManager';
import { drawScratchTicket, type ScratchBalances, type ScratchReward, type ScratchRewardItem, type ScratchTicket } from '../services/scratchService';
import { getDefaultRecommendedFriends, loadRecommendedFriends, type RecommendedFriendProfile } from '../services/networkService';
import { safeGetItem, safeSetItem } from '../utils/storage';
import { getScratchTeaserAuthRoute, isScratchTeaserPending, markScratchTeaserPending } from '../utils/flowManager';
import { buildInviteLink, resolveInvitationContext } from '../utils/invitationLinks';
import { trackUrlInviteOpen } from '../services/inviteService';

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  rotation: number;
  velocityX: number;
  velocityY: number;
  size: number;
}

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  rotation: number;
  delay: number;
  color: string;
  shape: 'rectangle' | 'parallelogram' | 'square';
  size: { width: number; height: number };
}

type PreGameStep =
  | 'idle'
  | 'activateRewards'
  | 'readyRegister'
  | 'rewardReveal'
  | 'processing'
  | 'abiMoment'
  | 'success'
  | 'teamNetwork'
  | 'inviteAccepted'
  | 'goldenEvent'
  | 'shoppingSpree'
  | 'merchandise'
  | 'preGameComplete'
  | 'marketplaceLaunch'
  | 'whatIsTripto'
  | 'wildCard'
  | 'expiration';

const formatUsdt = (value = 0) => `$${value.toFixed(2)} USDT (Locked)`;

const participationProgressByLevel: Record<number, number> = {
  1: 24,
  2: 42,
  3: 64,
  4: 82,
  5: 100,
};

const participationLabelByLevel: Record<number, string> = {
  1: 'Rookie',
  2: 'Builder',
  3: 'Coordinator',
  4: 'Signal Lead',
  5: 'Apex',
};

const getParticipationProgress = (level: number) => participationProgressByLevel[level] ?? 64;

const getParticipationLabel = (level: number) => participationLabelByLevel[level] ?? 'Coordinator';

const normalizeRewardItemLabel = (item: ScratchRewardItem): ScratchRewardItem => (
  item.type === 'merch' ? { ...item, label: 'Moneetize Merch' } : item
);

const formatGoldenRemaining = (remaining?: { hours?: number; minutes?: number; seconds?: number }) => {
  const hours = remaining?.hours ?? 0;
  const minutes = remaining?.minutes ?? 0;
  const seconds = remaining?.seconds ?? 0;

  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const getGradientStops = (gradient: string | undefined, fallback: string) => {
  const stops = gradient?.match(/#[0-9a-fA-F]{3,6}/g) || [];
  return [stops[0] || fallback, stops[1] || fallback] as const;
};

type MiniTicketKind = 'blue' | 'wildcard' | 'golden';

const getMiniTicketKind = (ticket: ScratchTicket): MiniTicketKind => {
  if (ticket.isGolden) return 'golden';
  return ticket.theme === 'blue' ? 'blue' : 'wildcard';
};

const miniTicketFrame: Record<MiniTicketKind, {
  title: string;
  optionLabel: string;
  border: string;
  glow: string;
  ticketGradient: string;
}> = {
  blue: {
    title: 'Scratch & Win',
    optionLabel: 'Blue Ticket',
    border: 'rgba(125, 183, 206, 0.7)',
    glow: 'rgba(125, 183, 206, 0.18)',
    ticketGradient: 'linear-gradient(135deg, #7c84ff 0%, #c9f4e2 100%)',
  },
  wildcard: {
    title: 'Wild Scratch',
    optionLabel: 'Wild Card',
    border: 'rgba(101, 214, 205, 0.68)',
    glow: 'rgba(101, 214, 205, 0.2)',
    ticketGradient: 'linear-gradient(135deg, #61d8ff 0%, #76f7d0 100%)',
  },
  golden: {
    title: 'Golden Scratch',
    optionLabel: 'Golden Ticket',
    border: 'rgba(221, 177, 57, 0.76)',
    glow: 'rgba(221, 177, 57, 0.24)',
    ticketGradient: 'linear-gradient(135deg, #c8941d 0%, #fde68a 100%)',
  },
};

const levelCardStyle = {
  background:
    'radial-gradient(circle at 12% 46%, rgba(61, 92, 132, 0.18) 0%, transparent 24%), radial-gradient(circle at 78% 38%, rgba(87, 130, 91, 0.18) 0%, transparent 28%), linear-gradient(180deg, rgba(25, 31, 37, 0.96) 0%, rgba(16, 20, 20, 0.98) 100%)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 26px 90px rgba(0,0,0,0.58)',
};

const SCRATCH_REWARD_EXPIRATION_MS = 90 * 24 * 60 * 60 * 1000;
const SCRATCH_TEASER_MODEL_VERSION = 3;
const SCRATCH_LOCKED_TRIPTO = 100;
const SCRATCH_HEAD_START_CURRENT = 316;
const SCRATCH_HEAD_START_TARGET = 330;
const SCRATCH_TEAM_MEMBERS = 1;
const SCRATCH_TEAM_TARGET = 5;
const SCRATCH_PREGAME_TRIPTO_TOTAL = 1240;
const SCRATCH_SHOPPING_SPREE_CREDIT = 50;

const createGoldenWindow = () => ({
  active: true,
  eyebrow: 'GOLDEN EVENT',
  title: '🟡 Golden Apex Active',
  subtext: 'A high-intensity coordination window is active. Participants in this window generate the highest-value outcomes.',
  topRewards: ['💵 $25+ USDT (Locked)', '🛍️ Shopping Spree rewards', '📈 Major participation boosts'],
  remaining: { hours: 0, minutes: 2, seconds: 14 },
  cta: '⚡ Activate Now',
});

const createTeaserReward = ({
  ticketId,
  score,
  level,
  triptoPoints,
  usdt,
  wildCardName,
  wildCardDescription,
  participationBoost,
  participationImpact,
  goldenEligibility = false,
  goldenWindow = null,
  includeShirt = false,
}: {
  ticketId: string;
  score: number;
  level: number;
  triptoPoints: number;
  usdt: number;
  wildCardName: string;
  wildCardDescription: string;
  participationBoost: string;
  participationImpact: string;
  goldenEligibility?: boolean;
  goldenWindow?: ReturnType<typeof createGoldenWindow> | null;
  includeShirt?: boolean;
}): ScratchReward => {
  const items: ScratchRewardItem[] = [
    { id: `${ticketId}-points`, type: 'points', label: 'Participation Score', amount: score, unit: 'score', icon: 'gem' },
    { id: `${ticketId}-wildcard`, type: 'wildcard', label: wildCardName, description: wildCardDescription, icon: 'wildcard' },
    { id: `${ticketId}-tripto`, type: 'tripto', label: 'Tripto (Locked)', amount: triptoPoints, unit: 'Tripto', icon: 'tripto' },
  ];

  if (usdt > 0) {
    items.splice(2, 0, { id: `${ticketId}-usdt`, type: 'usdt', label: 'USDT (Locked)', amount: usdt, unit: 'USDT', icon: 'usdt' });
  }

  if (includeShirt) {
    items.splice(1, 0, {
      id: `${ticketId}-moneetize-shirt`,
      type: 'merch',
      label: 'Moneetize Merch',
      description: 'Launch team merch reward',
      icon: 'shirt',
    });
  }

  return {
    moneetizePoints: score,
    participationLevel: level,
    participationScore: score,
    participationBoost,
    participationImpact,
    goldenEligibility,
    goldenWindow,
    triptoPoints,
    usdt,
    wildCard: {
      name: wildCardName,
      description: wildCardDescription,
    },
    expiresIn: SCRATCH_REWARD_EXPIRATION_MS,
    items,
  };
};

const teaserTickets: Array<{ weight: number; ticket: ScratchTicket; reward: ScratchReward }> = [
  {
    weight: 6000,
    ticket: {
      id: 'teaser-blue',
      title: 'Wild Scratch',
      displayName: 'Blue Ticket',
      theme: 'blue',
      isGolden: false,
      borderColor: 'rgba(129, 140, 248, 0.65)',
      glowColor: 'rgba(129, 140, 248, 0.22)',
      cardGradient: 'linear-gradient(180deg, rgba(30, 34, 46, 0.92) 0%, rgba(18, 22, 33, 0.96) 100%)',
      scratchGradient: 'linear-gradient(135deg, #7586ff 0%, #d9f2ff 100%)',
      scratchBaseColor: '#8492ff',
      particleColors: ['#7FCCFF', '#524CFF', '#A78BFA', '#F8FAFC'],
    },
    reward: createTeaserReward({
      ticketId: 'teaser-blue',
      score: 1,
      level: 1,
      triptoPoints: SCRATCH_LOCKED_TRIPTO,
      usdt: 0,
      wildCardName: 'Starter Coordination Card',
      wildCardDescription: 'A starter participation boost waiting to activate after registration.',
      participationBoost: 'Starter participation boost',
      participationImpact: 'Baseline coordination signal',
    }),
  },
  {
    weight: 3000,
    ticket: {
      id: 'teaser-aqua',
      title: 'Wild Scratch',
      displayName: 'Aqua Ticket',
      theme: 'aqua',
      isGolden: false,
      borderColor: 'rgba(103, 232, 249, 0.55)',
      glowColor: 'rgba(45, 212, 191, 0.2)',
      cardGradient: 'linear-gradient(180deg, rgba(24, 33, 32, 0.92) 0%, rgba(16, 22, 21, 0.96) 100%)',
      scratchGradient: 'linear-gradient(135deg, #21c8f6 0%, #99f6a7 100%)',
      scratchBaseColor: '#36d3d8',
      particleColors: ['#22D3EE', '#6EE7B7', '#99F6E4', '#F8FAFC'],
    },
    reward: createTeaserReward({
      ticketId: 'teaser-aqua',
      score: 2,
      level: 2,
      triptoPoints: SCRATCH_LOCKED_TRIPTO,
      usdt: 2.5,
      wildCardName: 'Momentum Wild Card',
      wildCardDescription: 'A brighter participation card with a stronger activation signal.',
      participationBoost: 'Momentum boost',
      participationImpact: 'Growing coordination signal',
    }),
  },
  {
    weight: 700,
    ticket: {
      id: 'teaser-green',
      title: 'Wild Scratch',
      displayName: 'Green Ticket',
      theme: 'green',
      isGolden: false,
      borderColor: 'rgba(132, 204, 22, 0.62)',
      glowColor: 'rgba(132, 204, 22, 0.2)',
      cardGradient: 'linear-gradient(180deg, rgba(25, 32, 23, 0.92) 0%, rgba(16, 22, 15, 0.96) 100%)',
      scratchGradient: 'linear-gradient(135deg, #27c23a 0%, #e6ff6f 100%)',
      scratchBaseColor: '#8fd43f',
      particleColors: ['#84CC16', '#A3E635', '#FDE047', '#ECFCCB'],
    },
    reward: createTeaserReward({
      ticketId: 'teaser-green',
      score: 3,
      level: 3,
      triptoPoints: 150,
      usdt: 5,
      wildCardName: 'Boost Advantage Card',
      wildCardDescription: 'Level 3 participation adds a boost advantage after sign-up.',
      participationBoost: 'Boost advantage',
      participationImpact: 'Stronger coordination signal',
      includeShirt: true,
    }),
  },
  {
    weight: 270,
    ticket: {
      id: 'teaser-pink',
      title: 'Wild Scratch',
      displayName: 'Pink Ticket',
      theme: 'pink',
      isGolden: false,
      borderColor: 'rgba(244, 114, 182, 0.58)',
      glowColor: 'rgba(244, 114, 182, 0.2)',
      cardGradient: 'linear-gradient(180deg, rgba(34, 27, 31, 0.92) 0%, rgba(24, 19, 23, 0.96) 100%)',
      scratchGradient: 'linear-gradient(135deg, #ff7a45 0%, #f9a8d4 100%)',
      scratchBaseColor: '#f58aa4',
      particleColors: ['#FB7185', '#F472B6', '#FDBA74', '#FBCFE8'],
    },
    reward: createTeaserReward({
      ticketId: 'teaser-pink',
      score: 4,
      level: 4,
      triptoPoints: 250,
      usdt: 10,
      wildCardName: 'Golden Eligibility Card',
      wildCardDescription: 'Higher-level participation unlocks golden eligibility after registration.',
      participationBoost: 'Enhanced coordination impact',
      participationImpact: 'Golden eligibility',
      goldenEligibility: true,
      includeShirt: true,
    }),
  },
  {
    weight: 30,
    ticket: {
      id: 'teaser-gold',
      title: 'Golden Scratch',
      displayName: 'Gold Ticket',
      theme: 'gold',
      isGolden: true,
      borderColor: 'rgba(212, 175, 55, 0.72)',
      glowColor: 'rgba(212, 175, 55, 0.26)',
      cardGradient: 'linear-gradient(180deg, rgba(36, 33, 24, 0.93) 0%, rgba(22, 20, 16, 0.97) 100%)',
      scratchGradient: 'linear-gradient(135deg, #c8941d 0%, #fde68a 100%)',
      scratchBaseColor: '#C4A661',
      particleColors: ['#FDE68A', '#FACC15', '#D97706', '#FEF3C7'],
      countdown: { hours: 0, minutes: 2, seconds: 14 },
    },
    reward: createTeaserReward({
      ticketId: 'teaser-gold',
      score: 6,
      level: 5,
      triptoPoints: 500,
      usdt: 25,
      wildCardName: 'Golden Apex Card',
      wildCardDescription: 'A very rare coordination window with top-tier launch rewards.',
      participationBoost: 'Major participation boost',
      participationImpact: 'Golden Apex coordination window',
      goldenEligibility: true,
      goldenWindow: createGoldenWindow(),
      includeShirt: true,
    }),
  },
];

const selectTeaserTicket = () => {
  const totalWeight = teaserTickets.reduce((sum, entry) => sum + entry.weight, 0);
  let roll = Math.random() * totalWeight;

  for (const entry of teaserTickets) {
    if (roll < entry.weight) return entry;
    roll -= entry.weight;
  }

  return teaserTickets[0];
};

const createTeaserDraw = () => {
  const storedTeaser = safeGetItem('scratchTeaserReward');

  if (storedTeaser) {
    try {
      const parsed = JSON.parse(storedTeaser);
      if (parsed?.modelVersion === SCRATCH_TEASER_MODEL_VERSION) {
        return parsed;
      }
    } catch {
      // Fall through and create a fresh teaser draw if stored data was malformed.
    }
  }

  const selected = selectTeaserTicket();
  const currentPoints = getUserPoints();
  const nextPoints = currentPoints + selected.reward.moneetizePoints;
  const currentUsdt = Number(safeGetItem('userUsdtBalance') || '0');
  const nextUsdt = (Number.isFinite(currentUsdt) ? currentUsdt : 0) + selected.reward.usdt;
  const createdAt = new Date().toISOString();

  const draw = {
    modelVersion: SCRATCH_TEASER_MODEL_VERSION,
    id: crypto.randomUUID(),
    userId: 'pre-registration-teaser',
    ticket: selected.ticket,
    reward: selected.reward,
    balances: {
      points: nextPoints,
      usdt: nextUsdt,
    },
    createdAt,
    expiresAt: new Date(Date.now() + selected.reward.expiresIn).toISOString(),
  };

  setUserPoints(nextPoints);
  safeSetItem('userUsdtBalance', nextUsdt.toFixed(2));
  safeSetItem('lastScratchReward', JSON.stringify(draw));
  safeSetItem('scratchTeaserReward', JSON.stringify(draw));

  return draw;
};

export function ScratchAndWin() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rewardsSliderRef = useRef<HTMLDivElement>(null);
  const rewardsSliderDragRef = useRef({
    isDragging: false,
    startX: 0,
    scrollLeft: 0,
  });
  const [ticket, setTicket] = useState<ScratchTicket | null>(null);
  const [isGolden, setIsGolden] = useState(false);
  const [isLoadingTicket, setIsLoadingTicket] = useState(true);
  const [ticketError, setTicketError] = useState<string | null>(null);
  const [isScratching, setIsScratching] = useState(false);
  const [scratchPercentage, setScratchPercentage] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [preGameStep, setPreGameStep] = useState<PreGameStep>('idle');
  const [showLevelProgress, setShowLevelProgress] = useState(false);
  const [showFinalLevelScreen, setShowFinalLevelScreen] = useState(false);
  const [reward, setReward] = useState<ScratchReward | null>(null);
  const [balances, setBalances] = useState<ScratchBalances | null>(null);
  const [isPreRegistrationTeaser, setIsPreRegistrationTeaser] = useState(() => isScratchTeaserPending());
  const [recommendedFriends, setRecommendedFriends] = useState<RecommendedFriendProfile[]>(getDefaultRecommendedFriends());
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [isRewardsSliderDragging, setIsRewardsSliderDragging] = useState(false);
  const [invitationContext] = useState(resolveInvitationContext);
  const [inviteAvatarFailed, setInviteAvatarFailed] = useState(false);
  const [inviteLink] = useState(() => buildInviteLink());
  const [countdown, setCountdown] = useState({ hours: 10, minutes: 8, seconds: 32 });
  const [expirationCountdown, setExpirationCountdown] = useState({ days: 12, hours: 10, minutes: 8, seconds: 32 });
  const showActivateRewards = preGameStep === 'activateRewards';
  const showReadyRegister = preGameStep === 'readyRegister';
  const showRewardReveal = preGameStep === 'rewardReveal';
  const showProcessing = preGameStep === 'processing';
  const showAbiMoment = preGameStep === 'abiMoment';
  const showSuccess = preGameStep === 'success';
  const showTeamNetwork = preGameStep === 'teamNetwork';
  const showInviteAccepted = preGameStep === 'inviteAccepted';
  const showGoldenEvent = preGameStep === 'goldenEvent';
  const showShoppingSpree = preGameStep === 'shoppingSpree';
  const showMerchandise = preGameStep === 'merchandise';
  const showPreGameComplete = preGameStep === 'preGameComplete';
  const showMarketplaceLaunch = preGameStep === 'marketplaceLaunch';
  const showWhatIsTripto = preGameStep === 'whatIsTripto';
  const showWildCard = preGameStep === 'wildCard';
  const showExpiration = preGameStep === 'expiration';

  useEffect(() => {
    let cancelled = false;

    const loadTicket = async () => {
      try {
        setIsLoadingTicket(true);
        setTicketError(null);

        if (!safeGetItem('access_token')) {
          markScratchTeaserPending();
          const nextPath = typeof window !== 'undefined' ? `/sign-up${window.location.search}` : '/sign-up';
          navigate(nextPath, { replace: true });
          return;
        }

        const shouldUseTeaser = isScratchTeaserPending();

        if (shouldUseTeaser) {
          markScratchTeaserPending();
          setIsPreRegistrationTeaser(true);

          const draw = createTeaserDraw();

          if (cancelled) return;

          setTicket(draw.ticket);
          setIsGolden(draw.ticket.isGolden);
          setReward(draw.reward);
          setBalances(draw.balances);

          if (draw.ticket.countdown) {
            setCountdown(draw.ticket.countdown);
          }

          return;
        }

        setIsPreRegistrationTeaser(false);
        const draw = await drawScratchTicket();

        if (cancelled) return;

        setTicket(draw.ticket);
        setIsGolden(draw.ticket.isGolden);
        setReward(draw.reward);
        setBalances(draw.balances);

        if (draw.ticket.countdown) {
          setCountdown(draw.ticket.countdown);
        }
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : 'Unable to load scratch ticket.';
          if (message.toLowerCase().includes('already been completed')) {
            navigate('/profile-screen');
            return;
          }

          setTicketError(message);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingTicket(false);
        }
      }
    };

    void loadTicket();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const currentUserId = safeGetItem('user_id') || '';
    if (!invitationContext.inviterId || invitationContext.inviterId === currentUserId) return;

    void trackUrlInviteOpen({
      inviterId: invitationContext.inviterId,
      inviterName: invitationContext.inviterName,
      promptId: invitationContext.promptId,
      inviteUrl: typeof window !== 'undefined' ? window.location.href : undefined,
    }).catch((error) => {
      console.warn('Invite link tracking skipped:', error);
    });
  }, [invitationContext.inviterId, invitationContext.inviterName, invitationContext.promptId]);

  useEffect(() => {
    let cancelled = false;

    void loadRecommendedFriends().then((profiles) => {
      if (!cancelled) {
        setRecommendedFriends(profiles.slice(0, 5));
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || isRevealed) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    const scratchBaseColor = ticket?.scratchBaseColor || (isGolden ? '#C4A661' : '#4A5568');
    const createScratchFill = (width: number, height: number) => {
      const [from, to] = getGradientStops(ticket?.scratchGradient, scratchBaseColor);
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, from);
      gradient.addColorStop(1, to);
      return gradient;
    };
    
    // Ensure valid dimensions before initializing
    if (rect.width === 0 || rect.height === 0) {
      // Retry initialization after a short delay
      const timer = setTimeout(() => {
        const newRect = canvas.getBoundingClientRect();
        if (newRect.width > 0 && newRect.height > 0) {
          canvas.width = newRect.width * 2;
          canvas.height = newRect.height * 2;
          ctx.scale(2, 2);
          
          // Draw scratch-off layer
          ctx.fillStyle = createScratchFill(newRect.width, newRect.height);
          ctx.fillRect(0, 0, newRect.width, newRect.height);
          
          // Draw decorative pattern
          if (isGolden) {
            ctx.fillStyle = '#D4AF37';
            ctx.font = 'bold 40px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('>>', newRect.width / 4, newRect.height / 2);
            ctx.fillText('<<', (newRect.width * 3) / 4, newRect.height / 2);
          }
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
    
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);

    // Draw scratch-off layer
    ctx.fillStyle = createScratchFill(rect.width, rect.height);
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Draw decorative pattern
    if (isGolden) {
      ctx.fillStyle = '#D4AF37';
      ctx.font = 'bold 40px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('>>', rect.width / 4, rect.height / 2);
      ctx.fillText('<<', (rect.width * 3) / 4, rect.height / 2);
    }
  }, [isGolden, isRevealed, ticket]);

  const handleScratch = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (isRevealed) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Safety check: ensure canvas has valid dimensions
    if (canvas.width === 0 || canvas.height === 0) {
      console.warn('Canvas dimensions not initialized yet');
      return;
    }

    setIsScratching(true);

    const rect = canvas.getBoundingClientRect();
    let x, y;

    if ('touches' in e) {
      x = (e.touches[0].clientX - rect.left) * 2;
      y = (e.touches[0].clientY - rect.top) * 2;
    } else {
      x = (e.clientX - rect.left) * 2;
      y = (e.clientY - rect.top) * 2;
    }

    // Scratch effect with larger radius for better feel
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 40, 0, Math.PI * 2);
    ctx.fill();

    // Calculate scratch percentage
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let transparent = 0;
    for (let i = 3; i < imageData.data.length; i += 4) {
      if (imageData.data[i] === 0) transparent++;
    }
    const percentage = (transparent / (imageData.data.length / 4)) * 100;
    setScratchPercentage(percentage);

    // Reveal when 40% scratched
    if (percentage > 40) {
      handleReveal();
    }
  };

  const handleMouseUp = () => {
    setIsScratching(false);
  };

  const handleTouchEnd = () => {
    setIsScratching(false);
  };

  const handleReveal = () => {
    setIsRevealed(true);
    setShowParticles(true);
    
    // Generate confetti with varied shapes and colors
    const newParticles: Particle[] = [];
    const colors = ticket?.particleColors?.length
      ? ticket.particleColors
      : ['#7FCCFF', '#524CFF', '#C84545', '#FFF24A', '#60A5FA', '#A78BFA', '#F472B6'];
    
    // Create 50 confetti pieces with explosive trajectories
    for (let i = 0; i < 50; i++) {
      // Calculate angle for radial explosion
      const angle = (Math.random() * 360) * (Math.PI / 180);
      const velocity = Math.random() * 15 + 8; // Random velocity between 8-23
      const distance = Math.random() * 150 + 50; // How far they travel
      
      newParticles.push({
        id: i,
        x: 50 + Math.cos(angle) * distance, // Start from center, move outward
        y: 50 + Math.sin(angle) * distance,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 720, // Multiple rotations
        velocityX: Math.cos(angle) * velocity,
        velocityY: Math.sin(angle) * velocity,
        size: Math.random() * 30 + 15 // Varied sizes 15-45px
      });
    }
    setParticles(newParticles);

    // Move into the mini reveal screen after the confetti burst.
    setTimeout(() => {
      setShowParticles(false);
      setPreGameStep('rewardReveal');
    }, 1800);
  };

  const handleActivateRewards = () => {
    setPreGameStep('teamNetwork');
  };

  const handleRegisterNow = () => {
    markScratchTeaserPending();
    setPreGameStep('processing');
    
    // Simulate processing
    setTimeout(() => {
      setPreGameStep('abiMoment');
    }, 2000);
  };

  const handleAbiMomentContinue = () => {
    setPreGameStep('success');
  };

  const handleSuccessInviteTeam = () => {
    setPreGameStep('teamNetwork');
  };

  const handleTeamInviteFriends = () => {
    setPreGameStep('inviteAccepted');
  };

  const handleInviteAcceptedContinue = () => {
    if (isGoldenApexActive) {
      setPreGameStep('goldenEvent');
      return;
    }

    if (hasMerchandiseReward) {
      setPreGameStep('merchandise');
      return;
    }

    setPreGameStep('preGameComplete');
  };

  const handleSuccessWaitForGoldenEvent = () => {
    if (isGoldenApexActive) {
      setPreGameStep('goldenEvent');
      return;
    }

    if (hasMerchandiseReward) {
      setPreGameStep('merchandise');
      return;
    }

    setPreGameStep('preGameComplete');
  };

  const handleGoldenActivateNow = () => {
    if (isGoldenApexActive) {
      setPreGameStep('shoppingSpree');
      return;
    }

    if (hasMerchandiseReward) {
      setPreGameStep('merchandise');
      return;
    }

    setPreGameStep('preGameComplete');
  };

  const handleShoppingSpreeContinue = () => {
    if (hasMerchandiseReward) {
      setPreGameStep('merchandise');
      return;
    }

    setPreGameStep('preGameComplete');
  };

  const handleMerchandiseContinue = () => {
    setPreGameStep('preGameComplete');
  };

  const handlePreGameCompleteEnter = () => {
    if (safeGetItem('moneetizeMarketplaceLaunchUnlocked') === 'true') {
      setPreGameStep('marketplaceLaunch');
      return;
    }

    if (isPreRegistrationTeaser) {
      markScratchTeaserPending();
      navigate(getScratchTeaserAuthRoute());
      return;
    }

    navigate('/gameplay');
  };

  const handleMarketplaceLaunchEnter = () => {
    navigate('/winnings');
  };

  const handleWhatIsTripto = () => {
    setPreGameStep('whatIsTripto');
  };

  const handleWhatIsTriptoContinue = () => {
    setPreGameStep('preGameComplete');
  };

  const handleWildCardContinue = () => {
    setPreGameStep('idle');

    if (isPreRegistrationTeaser) {
      setTimeout(() => {
        navigate(getScratchTeaserAuthRoute());
      }, 300);
      return;
    }

    setPreGameStep('expiration');
  };

  const handleExpirationContinue = () => {
    setPreGameStep('idle');
    setTimeout(() => {
      navigate('/profile-screen');
    }, 300);
  };

  const handleLevelProgressContinue = () => {
    setShowLevelProgress(false);
    setShowFinalLevelScreen(true);
  };

  const handleFinalLevelContinue = () => {
    setShowFinalLevelScreen(false);
    setPreGameStep('activateRewards');
  };

  const handleRewardsSliderPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    const slider = event.currentTarget;

    rewardsSliderDragRef.current = {
      isDragging: true,
      startX: event.clientX,
      scrollLeft: slider.scrollLeft,
    };
    setIsRewardsSliderDragging(true);
    slider.setPointerCapture(event.pointerId);
  };

  const handleRewardsSliderPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const slider = event.currentTarget;
    const drag = rewardsSliderDragRef.current;
    if (!drag.isDragging) return;

    const deltaX = event.clientX - drag.startX;
    if (Math.abs(deltaX) > 2) {
      event.preventDefault();
    }

    slider.scrollLeft = drag.scrollLeft - deltaX;
  };

  const handleRewardsSliderPointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    const slider = event.currentTarget;
    if (slider.hasPointerCapture(event.pointerId)) {
      slider.releasePointerCapture(event.pointerId);
    }

    rewardsSliderDragRef.current.isDragging = false;
    setIsRewardsSliderDragging(false);
  };

  const handleRewardsSliderWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    const slider = event.currentTarget;
    if (slider.scrollWidth <= slider.clientWidth) return;

    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    if (delta === 0) return;

    event.preventDefault();
    slider.scrollLeft += delta;
  };

  const handleViewProfile = () => {
    navigate('/profile-screen');
  };

  const handleOpenRecommendedFriend = (friend: RecommendedFriendProfile) => {
    sessionStorage.setItem('scannedUser', JSON.stringify({
      name: friend.name,
      handle: friend.handle,
      bio: friend.bio,
      avatar: friend.avatar,
      interests: friend.interests,
      followers: friend.followers,
      following: friend.following,
      points: friend.points,
    }));

    navigate(`/connection-request?userId=${friend.id}`);
  };

  const handleOpenInviteModal = () => {
    setLinkCopied(false);
    setShowInviteModal(true);
  };

  const handleCopyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setLinkCopied(true);
    } catch (error) {
      console.error('Failed to copy invite link:', error);
    }
  };

  if (isLoadingTicket) {
    return (
      <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-[#0a0e1a] via-[#0f1623] to-[#0a0e1a] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm rounded-3xl border border-white/10 bg-white/10 p-8 text-center backdrop-blur-md"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
            className="mx-auto mb-5 h-12 w-12 rounded-full border-4 border-white/20 border-t-white"
          />
          <h1 className="mb-2 text-2xl font-bold text-white">Drawing your ticket</h1>
          <p className="text-sm text-gray-400">The backend is selecting your scratch reward now.</p>
        </motion.div>
      </div>
    );
  }

  if (ticketError || !ticket || !reward) {
    const normalizedTicketError = ticketError?.toLowerCase() || '';
    const needsLogin =
      normalizedTicketError.includes('log in') ||
      normalizedTicketError.includes('unauthorized') ||
      normalizedTicketError.includes('expired');
    const needsProfile =
      normalizedTicketError.includes('no scratch') ||
      normalizedTicketError.includes('opportunities are available');

    return (
      <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-[#0a0e1a] via-[#0f1623] to-[#0a0e1a] flex items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-3xl border border-red-400/30 bg-red-950/30 p-8 text-center backdrop-blur-md">
          <h1 className="mb-3 text-2xl font-bold text-white">Ticket unavailable</h1>
          <p className="mb-6 text-sm text-gray-300">
            {needsLogin ? 'Your session expired. Please log in again to play Scratch and Win.' : ticketError || 'We could not load your scratch reward. Please try again.'}
          </p>
          <button
            onClick={() => needsLogin ? navigate('/login') : needsProfile ? navigate('/profile-screen') : window.location.reload()}
            className="w-full rounded-full bg-white px-6 py-3 font-semibold text-black transition-colors hover:bg-gray-100"
          >
            {needsLogin ? 'Log in' : needsProfile ? 'View Profile' : 'Try again'}
          </button>
        </div>
      </div>
    );
  }

  const currentPointsBalance = balances?.points ?? getUserPoints();
  const currentUsdtBalance = balances?.usdt ?? 0;
  const participationLevel = reward.participationLevel ?? (ticket.isGolden ? 5 : 3);
  const participationScore = reward.participationScore ?? reward.moneetizePoints;
  const participationProgress = getParticipationProgress(participationLevel);
  const participationLabel = getParticipationLabel(participationLevel);
  const participationBoost =
    reward.participationBoost ||
    (participationLevel >= 4 ? 'Enhanced coordination impact' : participationLevel === 3 ? 'Boost advantage' : 'Starter participation boost');
  const participationImpact =
    reward.participationImpact ||
    (participationLevel >= 5 ? 'Golden Apex coordination window' : participationLevel >= 4 ? 'Golden eligibility' : 'Your result reflects your participation level within the system.');
  const goldenWindow = reward.goldenWindow;
  const isGoldenApexActive = Boolean(goldenWindow?.active || ticket.isGolden);
  const goldenRemaining = goldenWindow?.remaining ?? ticket.countdown ?? { hours: 0, minutes: 2, seconds: 14 };
  const goldenTopRewards = goldenWindow?.topRewards ?? ['💵 $25+ USDT (Locked)', '🛍️ Shopping Spree rewards', '📈 Major participation boosts'];
  const goldenEventTitle = goldenWindow?.title ?? '🟡 Golden Apex Active';
  const goldenEventEyebrow = goldenWindow?.eyebrow ?? 'GOLDEN EVENT';
  const goldenEventSubtext =
    goldenWindow?.subtext ||
    'A high-intensity coordination window is active. Participants in this window generate the highest-value outcomes.';
  const goldenEventCta = goldenWindow?.cta ?? '⚡ Activate Now';
  const lockedTriptoPoints = reward.triptoPoints || SCRATCH_LOCKED_TRIPTO;
  const headStartProgress = Math.round((SCRATCH_HEAD_START_CURRENT / SCRATCH_HEAD_START_TARGET) * 100);
  const teamProgress = Math.round((SCRATCH_TEAM_MEMBERS / SCRATCH_TEAM_TARGET) * 100);
  const processingStatusItems = ['Coordinating activity…', 'Allocating outcomes…', 'Updating network state…'];
  const fallbackRewardItems: ScratchRewardItem[] = [
    {
      id: 'fallback-points',
      type: 'points',
      label: 'Participation Score',
      amount: participationScore,
      unit: 'score',
      icon: 'gem',
    },
    {
      id: 'fallback-wild-card',
      type: 'wildcard',
      label: reward.wildCard.name,
      description: reward.wildCard.description,
      icon: 'wildcard',
    },
    {
      id: 'fallback-usdt',
      type: 'usdt',
      label: 'USDT (Locked)',
      amount: reward.usdt,
      unit: 'USDT',
      icon: 'usdt',
    },
    {
      id: 'fallback-tripto',
      type: 'tripto',
      label: 'Tripto (Locked)',
      amount: lockedTriptoPoints,
      unit: 'Tripto',
      icon: 'tripto',
    },
  ];
  const activationRewards = (reward.items?.length ? reward.items : fallbackRewardItems).map(normalizeRewardItemLabel);
  const hasMerchandiseReward = activationRewards.some(item => item.type === 'merch');
  const teamNetworkMembers = Math.min(SCRATCH_TEAM_MEMBERS + 1, SCRATCH_TEAM_TARGET);
  const teamNetworkProgress = Math.round((teamNetworkMembers / SCRATCH_TEAM_TARGET) * 100);
  const preGameTriptoTotal = Math.max(SCRATCH_PREGAME_TRIPTO_TOTAL, lockedTriptoPoints);
  const miniTicketKind = getMiniTicketKind(ticket);
  const miniTicket = miniTicketFrame[miniTicketKind];
  const miniTicketOptions: Array<{ id: MiniTicketKind; label: string; sublabel: string }> = [
    { id: 'wildcard', label: 'Wild Card', sublabel: 'Prize boost' },
    { id: 'blue', label: 'Blue Ticket', sublabel: 'Common' },
    { id: 'golden', label: 'Golden Ticket', sublabel: 'Very rare' },
  ];
  const renderScratchLogoLockup = (className = 'mb-6') => (
    <div className={`${className} flex items-center justify-center gap-2`}>
      <div className="h-[42px] w-[42px]">
        <SembolVariants />
      </div>
      <div className="text-left">
        <p className="text-[24px] font-black leading-none text-white">moneetize</p>
        <p className="text-[12px] font-black leading-none text-[#9bd9cf]">Spend... with benefits</p>
      </div>
    </div>
  );

  const getRewardCardWidth = (item: ScratchRewardItem) => {
    if (item.type === 'wildcard') return 'min-w-[172px] w-[172px]';
    if (item.type === 'usdt') return 'min-w-[150px] w-[150px]';
    return 'min-w-[126px] w-[126px]';
  };

  const renderRewardItem = (item: ScratchRewardItem) => {
    if (item.type === 'points') {
      return (
        <>
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl font-bold text-white">+ {item.amount ?? participationScore}</span>
            <img src={gemIcon} alt="Gem" className="w-7 h-7" />
          </div>
          <span className="text-sm font-medium leading-tight text-gray-300">
            {item.label}
          </span>
        </>
      );
    }

    if (item.type === 'merch') {
      return (
        <>
          <img src={tshirtRewardIcon} alt="" className="h-12 w-12 object-contain drop-shadow-lg" />
          <span className="text-base font-bold leading-tight text-white">{item.label}</span>
        </>
      );
    }

    if (item.type === 'wildcard') {
      return (
        <>
          <img src={wildcardIcon} alt="Wild Card" className="h-8 w-8 object-contain" />
          <span className="max-w-[116px] text-center text-[12px] font-black leading-tight text-white">{item.label}</span>
          <span className="max-w-[120px] text-center text-[10px] font-semibold leading-[1.15] text-gray-300">
            {item.description || 'Description of what a wild card gives'}
          </span>
        </>
      );
    }

    if (item.type === 'usdt') {
      return (
        <>
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-400/85 text-lg font-black text-emerald-950">
            $
          </div>
          <span className="text-lg font-bold text-white">{formatUsdt(item.amount ?? reward.usdt)}</span>
          <span className="text-sm leading-tight text-gray-300">{item.label}</span>
        </>
      );
    }

    return (
      <>
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-300/80 text-sm font-black text-slate-900">
          TR
        </div>
        <span className="text-lg font-bold text-white">+ {item.amount ?? lockedTriptoPoints}</span>
        <span className="text-sm leading-tight text-gray-300">{item.label}</span>
      </>
    );
  };

  return (
    <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-[#0a0e1a] via-[#0f1623] to-[#0a0e1a] overflow-y-auto overflow-x-hidden">
      {/* Status Bar */}
      <div className="absolute top-0 left-0 right-0 h-11 flex items-center justify-between px-4 sm:px-6 text-white text-sm z-50">
        <span className="font-semibold">9:41</span>
        <div className="flex items-center gap-1">
          <div className="w-4 h-3 bg-white/80 rounded-sm" />
          <div className="w-4 h-3 bg-white/80 rounded-sm" />
          <div className="w-6 h-3 bg-white/80 rounded-sm" />
        </div>
      </div>

      {/* Particles Overlay */}
      <AnimatePresence>
        {showParticles && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40">
            <div className="relative w-full max-w-md">
              {particles.map((particle) => (
                <motion.div
                  key={particle.id}
                  initial={{ 
                    x: 0, 
                    y: 0, 
                    opacity: 1, 
                    scale: 0,
                    rotate: particle.rotation 
                  }}
                  animate={{ 
                    x: particle.velocityX * 20, 
                    y: particle.velocityY * 20, 
                    opacity: 0, 
                    scale: 1,
                    rotate: particle.rotation + 360
                  }}
                  transition={{ duration: 2, ease: 'easeOut' }}
                  className="absolute left-1/2 top-1/2"
                  style={{
                    width: particle.size,
                    height: particle.size,
                    background: particle.color,
                    filter: 'blur(2px)',
                    transform: 'translate(-50%, -50%)',
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex min-h-[100dvh] flex-col items-center justify-start gap-7 px-4 pb-28 pt-[88px]">
        <motion.section
          initial={{ scale: 0.96, opacity: 0, y: 14 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="relative w-full max-w-[375px] overflow-hidden rounded-[1.55rem] border px-5 pb-9 pt-6 text-center shadow-2xl"
          style={{
            borderColor: miniTicket.border,
            background: 'linear-gradient(180deg, rgba(28,35,40,0.96) 0%, rgba(14,17,20,0.98) 100%)',
            boxShadow: `0 0 55px ${miniTicket.glow}, inset 0 1px 0 rgba(255,255,255,0.05)`,
          }}
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_8%,rgba(132,230,210,0.13),transparent_34%),radial-gradient(circle_at_18%_62%,rgba(82,129,255,0.08),transparent_30%)]" />

          <div className="relative z-10 mb-6 flex flex-col items-center">
            {renderScratchLogoLockup('mb-3')}
            <div className="flex max-w-full items-center gap-2 text-[12px] font-bold text-white/62">
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-white/10 text-[10px] font-black text-white">
                {invitationContext.inviterAvatar && !inviteAvatarFailed ? (
                  <img
                    src={invitationContext.inviterAvatar}
                    alt={`${invitationContext.inviterName} avatar`}
                    className="h-full w-full object-cover"
                    onError={() => setInviteAvatarFailed(true)}
                  />
                ) : (
                  <span>{invitationContext.inviterInitials}</span>
                )}
              </div>
              <span className="text-white/44">Invited by</span>
              <span className="min-w-0 max-w-[150px] truncate text-white/80">{invitationContext.inviterName}</span>
            </div>
          </div>

          <h1 className="relative z-10 mb-5 text-[22px] font-black text-white">{miniTicket.title}</h1>

          <div className="relative z-10 mb-5 grid grid-cols-3 gap-2">
            {miniTicketOptions.map((option) => {
              const isSelected = option.id === miniTicketKind;

              return (
                <div
                  key={option.id}
                  aria-current={isSelected ? 'true' : undefined}
                  className={`relative rounded-[0.65rem] border px-2 py-3 text-center transition-colors ${
                    isSelected
                      ? 'bg-white/14 text-white shadow-[0_0_18px_rgba(132,230,210,0.2)]'
                      : 'border-white/12 bg-black/35 text-white/72'
                  }`}
                  style={isSelected ? { borderColor: miniTicket.border } : undefined}
                >
                  {isSelected && <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#8cf0c9]" />}
                  <p className="text-[11px] font-black leading-tight">{option.label}</p>
                  <p className="mt-1 text-[9px] font-bold leading-tight text-white/45">{option.sublabel}</p>
                </div>
              );
            })}
          </div>

          {ticket.isGolden && !isRevealed && (
            <div className="relative z-10 mb-5 flex items-center justify-center gap-2">
              {[
                { value: countdown.hours, label: 'hours' },
                { value: countdown.minutes, label: 'min' },
                { value: countdown.seconds, label: 'sec' },
              ].map((item, index) => (
                <div key={item.label} className="flex items-center gap-2">
                  <div className="rounded-[0.65rem] bg-black/46 px-3 py-2">
                    <span className="text-[18px] font-black text-white">{String(item.value).padStart(2, '0')}</span>
                    <span className="ml-1 text-[10px] font-bold text-white/40">{item.label}</span>
                  </div>
                  {index < 2 && <span className="text-white/35">:</span>}
                </div>
              ))}
            </div>
          )}

          <div className="relative z-10 mx-auto mb-5 w-[min(100%,286px)]">
            <div
              className="relative flex h-[118px] items-center justify-center overflow-hidden border border-white/10 bg-black/25"
              style={{
                background: isRevealed ? 'rgba(0,0,0,0.28)' : miniTicket.ticketGradient,
                clipPath: 'polygon(0 8%, 4% 8%, 4% 0, 8% 0, 8% 8%, 12% 8%, 12% 0, 16% 0, 16% 8%, 20% 8%, 20% 0, 24% 0, 24% 8%, 28% 8%, 28% 0, 32% 0, 32% 8%, 36% 8%, 36% 0, 40% 0, 40% 8%, 44% 8%, 44% 0, 48% 0, 48% 8%, 52% 8%, 52% 0, 56% 0, 56% 8%, 60% 8%, 60% 0, 64% 0, 64% 8%, 68% 8%, 68% 0, 72% 0, 72% 8%, 76% 8%, 76% 0, 80% 0, 80% 8%, 84% 8%, 84% 0, 88% 0, 88% 8%, 92% 8%, 92% 0, 96% 0, 96% 8%, 100% 8%, 100% 92%, 96% 92%, 96% 100%, 92% 100%, 92% 92%, 88% 92%, 88% 100%, 84% 100%, 84% 92%, 80% 92%, 80% 100%, 76% 100%, 76% 92%, 72% 92%, 72% 100%, 68% 100%, 68% 92%, 64% 92%, 64% 100%, 60% 100%, 60% 92%, 56% 92%, 56% 100%, 52% 100%, 52% 92%, 48% 92%, 48% 100%, 44% 100%, 44% 92%, 40% 92%, 40% 100%, 36% 100%, 36% 92%, 32% 92%, 32% 100%, 28% 100%, 28% 92%, 24% 92%, 24% 100%, 20% 100%, 20% 92%, 16% 92%, 16% 100%, 12% 100%, 12% 92%, 8% 92%, 8% 100%, 4% 100%, 4% 92%, 0 92%)',
              }}
            >
              {isRevealed ? (
                <motion.div
                  initial={{ scale: 0.72, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex flex-col items-center"
                >
                  <p className="text-[28px] font-black text-white">${reward.usdt.toFixed(2)}</p>
                  <p className="mt-1 rounded-full bg-white px-4 py-1 text-[11px] font-black text-black">USDT (Locked)</p>
                </motion.div>
              ) : (
                <div className="flex items-center gap-10 text-white drop-shadow-[0_0_18px_rgba(255,255,255,0.58)]">
                  <div className="h-9 w-5 rounded-l-full bg-white" />
                  <div className="h-0 w-0 border-y-[22px] border-l-[26px] border-y-transparent border-l-white" />
                  <div className="h-0 w-0 border-y-[22px] border-r-[26px] border-y-transparent border-r-white" />
                  <div className="h-9 w-5 rounded-r-full bg-white" />
                </div>
              )}

              {!isRevealed && (
                <canvas
                  ref={canvasRef}
                  onMouseMove={(e) => e.buttons === 1 && handleScratch(e)}
                  onMouseDown={handleScratch}
                  onMouseUp={handleMouseUp}
                  onTouchMove={handleScratch}
                  onTouchStart={handleScratch}
                  onTouchEnd={handleTouchEnd}
                  className="absolute inset-0 h-full w-full cursor-pointer touch-none"
                  style={{ background: miniTicket.ticketGradient }}
                />
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setPreGameStep('wildCard')}
            className="relative z-10 mx-auto mb-7 flex items-center gap-2 rounded-full bg-white/10 px-5 py-2.5 text-[12px] font-black text-white transition-colors hover:bg-white/16"
          >
            <Info className="h-4 w-4" />
            How rewards work
          </button>

          <div className="relative z-10 mx-auto h-px w-16 bg-white/15" />

          <div className="relative z-10 mt-6">
            <h2 className="text-[20px] font-black leading-tight text-white">Get more cash prizes!</h2>
            <p className="mt-1 text-[13px] font-bold text-white/54">Set up your team before the launch:</p>
            <div className="mt-5 flex items-center justify-center -space-x-3">
              {recommendedFriends.slice(0, 4).map((friend, index) => (
                <button
                  key={friend.id}
                  type="button"
                  onClick={() => handleOpenRecommendedFriend(friend)}
                  aria-label={`View ${friend.name}'s profile`}
                  className="relative h-12 w-12 overflow-hidden rounded-full border-2 border-[#1f222c] bg-[#232831]"
                  style={{ zIndex: index + 1 }}
                >
                  <img src={friend.avatar} alt={friend.name} className="h-full w-full object-cover" />
                </button>
              ))}
              <button
                type="button"
                onClick={handleOpenInviteModal}
                aria-label="Invite friends"
                className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/8 text-white"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.section>

        <motion.button
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35 }}
          onClick={handleViewProfile}
          className="rounded-full bg-white px-12 py-3.5 text-base font-black text-black shadow-xl transition-colors hover:bg-gray-100"
        >
          View Profile
        </motion.button>
      </div>

      {/* Invite Friends Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[70] flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm"
            onClick={() => setShowInviteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 16 }}
              onClick={(event) => event.stopPropagation()}
              className="w-full max-w-sm rounded-[2rem] border border-white/10 bg-gradient-to-b from-[#252832] to-[#15181f] px-7 py-10 shadow-2xl"
            >
              <h2 className="mb-3 text-center text-2xl font-bold text-white">Invite friends</h2>
              <p className="mb-6 text-center text-base leading-relaxed text-gray-400">
                Copy link to invite your friends<br />
                and form a team
              </p>

              <button
                type="button"
                onClick={handleCopyInviteLink}
                className="mb-6 flex w-full items-center gap-3 rounded-2xl border border-white/5 bg-black/45 px-5 py-4 text-left transition-colors hover:bg-black/60"
              >
                {linkCopied ? (
                  <Check className="h-5 w-5 flex-shrink-0 text-emerald-400" />
                ) : (
                  <LinkIcon className="h-5 w-5 flex-shrink-0 text-white/70" />
                )}
                <span className="truncate text-sm font-medium text-white">{inviteLink}</span>
                <Copy className="ml-auto h-4 w-4 flex-shrink-0 text-white/40" />
              </button>

              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="mx-auto block rounded-full bg-white px-9 py-3.5 font-bold text-black shadow-lg transition-colors hover:bg-gray-100"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mini Reward Reveal Screen */}
      <AnimatePresence>
        {showRewardReveal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black px-4 pb-12 pt-[64px]"
          >
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="absolute -left-12 top-28 h-48 w-20 rotate-[-34deg] bg-sky-300/70 blur-[3px]" />
              <div className="absolute right-0 top-28 h-40 w-40 rotate-[21deg] bg-red-500/65 blur-[8px]" />
              <div className="absolute right-12 top-16 h-28 w-4 rotate-[51deg] bg-yellow-300" />
              <div className="absolute bottom-20 left-10 h-24 w-8 rotate-[17deg] bg-sky-300" />
              <div className="absolute bottom-12 right-20 h-8 w-12 rotate-[31deg] bg-indigo-500" />
              <div className="absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_50%_8%,rgba(132,230,210,0.14),transparent_38%)]" />
            </div>

            <motion.section
              initial={{ scale: 0.94, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.42 }}
              className="relative w-full max-w-[375px] text-center"
            >
              {renderScratchLogoLockup('mb-6')}

              <div
                className="relative overflow-hidden rounded-[1.55rem] border px-6 pb-8 pt-10"
                style={{
                  borderColor: miniTicket.border,
                  background: 'linear-gradient(180deg, rgba(24,31,36,0.9) 0%, rgba(13,16,18,0.96) 100%)',
                  boxShadow: `0 0 60px ${miniTicket.glow}, inset 0 1px 0 rgba(255,255,255,0.05)`,
                }}
              >
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_24%,rgba(113,231,183,0.13),transparent_34%)]" />
                <h2 className="relative z-10 text-[22px] font-black text-white">You've Won!</h2>

                <div className="relative z-10 mx-auto mt-9 max-w-[186px] rounded-[0.8rem] border border-[#7fc7a6]/55 bg-black/25 px-6 py-6">
                  <p className="text-[44px] font-black leading-none text-white">${reward.usdt.toFixed(2)}</p>
                  <p className="mx-auto mt-4 w-fit rounded-full bg-white px-6 py-2 text-[13px] font-black text-black">USDT (Locked)</p>
                </div>

                <p className="relative z-10 mt-7 text-[16px] font-black text-white">You also get:</p>

                <div
                  ref={rewardsSliderRef}
                  onPointerDown={handleRewardsSliderPointerDown}
                  onPointerMove={handleRewardsSliderPointerMove}
                  onPointerUp={handleRewardsSliderPointerEnd}
                  onPointerCancel={handleRewardsSliderPointerEnd}
                  onPointerLeave={handleRewardsSliderPointerEnd}
                  onWheel={handleRewardsSliderWheel}
                  className={`relative z-10 -mx-4 mt-5 flex gap-3 overflow-x-auto px-4 pb-2 select-none touch-pan-y ${
                    isRewardsSliderDragging ? 'cursor-grabbing snap-none' : 'cursor-grab snap-x'
                  }`}
                  aria-label="Rewards received"
                >
                  {activationRewards.map((item) => (
                    <div
                      key={item.id}
                      className="flex min-h-[116px] min-w-[132px] snap-center flex-col items-center justify-center gap-2 rounded-[1rem] border border-white/12 bg-white/9 px-3 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                    >
                      {renderRewardItem(item)}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleActivateRewards}
                  className="relative z-10 mt-7 rounded-full bg-gradient-to-r from-[#9af4ae] to-[#78d9f8] px-9 py-3.5 text-[14px] font-black text-[#081012] shadow-[0_18px_44px_rgba(103,232,249,0.18)] transition-transform hover:scale-[1.02]"
                >
                  Activate
                </button>
              </div>

              <button
                type="button"
                onClick={handleViewProfile}
                className="mt-10 rounded-full bg-white px-12 py-3.5 text-[15px] font-black text-black shadow-xl transition-colors hover:bg-gray-100"
              >
                View Profile
              </button>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Activate Rewards Modal */}
      <AnimatePresence>
        {showActivateRewards && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="w-full max-w-[370px] overflow-hidden rounded-[1.65rem] border border-[#718092]/70 bg-gradient-to-b from-[#1d2329]/95 to-[#111514]/98 pb-16 pt-16 shadow-2xl"
            >
              <div className="px-8">
                <h2 className="text-white text-2xl font-bold text-center mb-3">Activate rewards</h2>
                <p className="text-gray-400 text-sm text-center mb-8">
                  Applies boosts and Wild Cards<br />
                  you have received:
                </p>
              </div>

              <div
                ref={rewardsSliderRef}
                onPointerDown={handleRewardsSliderPointerDown}
                onPointerMove={handleRewardsSliderPointerMove}
                onPointerUp={handleRewardsSliderPointerEnd}
                onPointerCancel={handleRewardsSliderPointerEnd}
                onPointerLeave={handleRewardsSliderPointerEnd}
                onWheel={handleRewardsSliderWheel}
                className={`mb-9 flex gap-3 overflow-x-auto px-8 pb-2 select-none touch-pan-y [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
                  isRewardsSliderDragging ? 'cursor-grabbing snap-none' : 'cursor-grab snap-x'
                }`}
                aria-label="Rewards received"
              >
                {activationRewards.map((item) => (
                  <div
                    key={item.id}
                    className={`${getRewardCardWidth(item)} flex min-h-[124px] snap-center flex-col items-center justify-center gap-2 rounded-[1.25rem] border border-white/15 bg-white/8 px-3 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]`}
                  >
                    {renderRewardItem(item)}
                  </div>
                ))}
              </div>

              <div className="px-8">
                <button
                  onClick={handleActivateRewards}
                  className="w-full bg-white text-black py-3.5 rounded-full font-bold text-base mb-3 hover:bg-gray-100 transition-colors"
                >
                  Activate with Moneetize
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ready To Register Modal */}
      <AnimatePresence>
        {showReadyRegister && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center px-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 18 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 18 }}
              className="w-full max-w-[370px] rounded-[1.65rem] border border-white/15 bg-gradient-to-b from-[#23272d]/96 to-[#161a1d]/98 px-8 pb-12 pt-11 text-center shadow-2xl"
            >
              <h2 className="mb-3 text-2xl font-bold text-white">Ready to activate?</h2>
              <p className="mb-7 text-base leading-relaxed text-gray-400">
                To activate your bonuses,<br />
                register or log in to continue.
              </p>
              <button
                type="button"
                onClick={handleRegisterNow}
                className="mx-auto block rounded-full bg-white px-8 py-3.5 font-bold text-black shadow-lg transition-colors hover:bg-gray-100"
              >
                Continue
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Processing Modal */}
      <AnimatePresence>
        {showProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="w-full max-w-[370px] rounded-[1.65rem] border border-[#718092]/70 bg-gradient-to-b from-[#1d2329]/95 to-[#111514]/98 px-7 pb-10 pt-12 shadow-2xl"
            >
              <h2 className="mb-3 text-center text-2xl font-black text-white">Processing</h2>
              <p className="mb-5 text-center text-sm font-semibold text-gray-400">System Status:</p>

              <div className="mb-6 space-y-2">
                {processingStatusItems.map((item, index) => (
                  <motion.div
                    key={item}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.16 }}
                    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-sm font-semibold text-gray-200"
                  >
                    <motion.span
                      animate={{ scale: [1, 1.35, 1] }}
                      transition={{ duration: 1.4, repeat: Infinity, delay: index * 0.18 }}
                      className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_14px_rgba(110,231,183,0.8)]"
                    />
                    {item}
                  </motion.div>
                ))}
              </div>

              <div className="mb-6 rounded-[1.35rem] border border-white/12 bg-black/28 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.07)]">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-white/8 p-3 text-center">
                    <div className="flex items-center justify-center gap-1.5 text-xl font-black text-white">
                      +{participationScore}
                      <img src={gemIcon} alt="Gem" className="h-5 w-5" />
                    </div>
                    <p className="mt-1 text-xs font-semibold text-gray-300">Score</p>
                  </div>
                  <div className="rounded-2xl bg-white/8 p-3 text-center">
                    <p className="text-sm font-black text-white">Team Strength</p>
                    <p className="mt-1 text-xs font-semibold text-emerald-200">Increased</p>
                  </div>
                  <div className="rounded-2xl bg-white/8 p-3 text-center">
                    <p className="text-sm font-black text-white">Head Start</p>
                    <p className="mt-1 text-xs font-semibold text-emerald-200">Increased</p>
                  </div>
                  <div className="rounded-2xl bg-white/8 p-3 text-center">
                    <p className="text-xl font-black text-white">+{lockedTriptoPoints}</p>
                    <p className="mt-1 text-xs font-semibold text-gray-300">Tripto (Locked)</p>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <p className="mb-5 text-sm font-semibold text-gray-400">Tripto unlocks at marketplace launch</p>
                <motion.p
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="text-sm font-semibold text-gray-400"
                >
                  Processing...
                </motion.p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ABI Moment Modal */}
      <AnimatePresence>
        {showAbiMoment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.88, opacity: 0, y: 18 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.88, opacity: 0, y: 18 }}
              className="relative w-full max-w-[370px] overflow-hidden rounded-[1.65rem] border border-cyan-200/20 bg-gradient-to-b from-[#202733]/96 to-[#111514]/98 px-7 pb-8 pt-10 text-center shadow-2xl"
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_8%,rgba(56,189,248,0.18),transparent_45%),radial-gradient(circle_at_74%_62%,rgba(74,222,128,0.1),transparent_36%)]" />
              <p className="relative z-10 mb-2 text-xs font-black uppercase tracking-[0.24em] text-cyan-200/80">
                ABI Moment
              </p>
              <h2 className="relative z-10 text-2xl font-black text-white">You just generated value</h2>
              <p className="relative z-10 mx-auto mt-4 max-w-[280px] text-sm leading-relaxed text-gray-300">
                Your activity was coordinated with others in the network to produce real economic outcomes. A portion of that value is returned to you.
              </p>

              <div className="relative z-10 mt-7 rounded-[1.35rem] border border-white/12 bg-black/28 p-5 text-left">
                <p className="mb-4 text-center text-sm font-black text-white">Agent-Based Income (ABI)</p>
                {[
                  'You participate',
                  'The system coordinates',
                  'Value is created',
                  'You receive a share',
                ].map((item, index) => (
                  <div key={item} className="flex items-center gap-3 text-sm font-semibold text-gray-200">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-xs font-black text-emerald-200">
                      {index + 1}
                    </span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <p className="relative z-10 mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                Coordinated through CEIF infrastructure
              </p>

              <button
                type="button"
                onClick={handleAbiMomentContinue}
                className="relative z-10 mt-7 w-full rounded-full bg-white px-6 py-3.5 text-base font-black text-black shadow-xl transition-colors hover:bg-gray-100"
              >
                Keep Playing
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.86, opacity: 0, y: 18 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.86, opacity: 0, y: 18 }}
              className="relative w-full max-w-[370px] overflow-hidden rounded-[1.65rem] border border-[#718092]/70 bg-gradient-to-b from-[#1d2329]/96 to-[#111514]/98 px-7 pb-8 pt-10 text-center shadow-2xl"
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_50%_0%,rgba(74,222,128,0.14),transparent_72%)]" />
              <p className="relative z-10 mb-2 text-xs font-black uppercase tracking-[0.24em] text-emerald-200/80">
                Moneetize
              </p>
              <h2 className="relative z-10 text-2xl font-black text-white">Participation recorded</h2>

              <div className="relative z-10 mt-7 rounded-[1.35rem] border border-white/12 bg-white/8 p-4 text-left">
                <p className="mb-3 text-center text-sm font-bold text-gray-300">You gained:</p>
                <div className="space-y-2 text-sm font-semibold text-white">
                  <div className="rounded-2xl bg-black/22 px-4 py-3">📈 Participation score</div>
                  <div className="rounded-2xl bg-black/22 px-4 py-3">🚀 Early allocation advantage</div>
                  <div className="rounded-2xl bg-black/22 px-4 py-3">🔒 Tripto (allocation rights)</div>
                </div>
              </div>

              <div className="relative z-10 mt-4 grid grid-cols-2 gap-3 text-left">
                <div className="rounded-[1.2rem] border border-white/10 bg-black/26 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-gray-400">Tripto</p>
                  <p className="mt-2 text-2xl font-black text-white">+{lockedTriptoPoints}</p>
                  <p className="text-xs font-semibold text-gray-400">(Locked)</p>
                  <p className="mt-3 text-xs leading-relaxed text-emerald-200">Unlocks at launch</p>
                </div>
                <div className="space-y-3">
                  <div className="rounded-[1.2rem] border border-white/10 bg-black/26 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-gray-400">Head Start</p>
                    <p className="mt-2 text-xl font-black text-white">${SCRATCH_HEAD_START_CURRENT} / ${SCRATCH_HEAD_START_TARGET}</p>
                    <div className="mt-3 h-1.5 rounded-full bg-white/12">
                      <div className="h-full rounded-full bg-emerald-300" style={{ width: `${headStartProgress}%` }} />
                    </div>
                  </div>
                  <div className="rounded-[1.2rem] border border-white/10 bg-black/26 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-gray-400">Team</p>
                    <p className="mt-2 text-xl font-black text-white">{SCRATCH_TEAM_MEMBERS} / {SCRATCH_TEAM_TARGET} members</p>
                    <div className="mt-3 h-1.5 rounded-full bg-white/12">
                      <div className="h-full rounded-full bg-emerald-300" style={{ width: `${teamProgress}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative z-10 mt-7 space-y-3">
                <button
                  type="button"
                  onClick={handleSuccessInviteTeam}
                  className="w-full rounded-full bg-white px-6 py-3.5 text-base font-black text-black shadow-xl transition-colors hover:bg-gray-100"
                >
                  Invite Your Team
                </button>
                <button
                  type="button"
                  onClick={handleSuccessWaitForGoldenEvent}
                  className="w-full rounded-full bg-white/12 px-6 py-3.5 text-base font-bold text-white transition-colors hover:bg-white/18"
                >
                  Wait for Golden Event
                </button>
              </div>

              <p className="relative z-10 mt-6 text-xs font-semibold text-gray-500">
                Moneetize — Spend with Benefits
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Team & Network Modal */}
      <AnimatePresence>
        {showTeamNetwork && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.88, opacity: 0, y: 18 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.88, opacity: 0, y: 18 }}
              className="relative w-full max-w-[370px] overflow-hidden rounded-[1.65rem] border border-[#718092]/70 bg-gradient-to-b from-[#202733]/96 to-[#111514]/98 px-7 pb-8 pt-10 text-center shadow-2xl"
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(56,189,248,0.16),transparent_38%),radial-gradient(circle_at_78%_30%,rgba(250,204,21,0.1),transparent_42%)]" />
              <h2 className="relative z-10 text-2xl font-black text-white">Coordinate with others. Perform better.</h2>
              <p className="relative z-10 mx-auto mt-4 max-w-[280px] text-sm leading-relaxed text-gray-300">
                Your team increases coordination strength, improving outcomes across the network.
              </p>

              <div className="relative z-10 mt-7 rounded-[1.35rem] border border-white/12 bg-black/28 p-5 text-left">
                <p className="mb-4 text-center text-sm font-black text-white">Each teammate unlocks:</p>
                <div className="space-y-2 text-sm font-semibold text-white">
                  <div className="rounded-2xl bg-white/8 px-4 py-3">🎰 Additional participation opportunities</div>
                  <div className="rounded-2xl bg-white/8 px-4 py-3">📈 Higher potential outcomes</div>
                  <div className="rounded-2xl bg-white/8 px-4 py-3">🟡 Stronger Golden performance</div>
                </div>
              </div>

              <div className="relative z-10 mt-7 flex items-center justify-center gap-2">
                {recommendedFriends.slice(0, 2).map((friend) => (
                  <img key={friend.id} src={friend.avatar} alt="" className="h-12 w-12 rounded-full border border-white/20 object-cover" />
                ))}
                {Array.from({ length: Math.max(0, SCRATCH_TEAM_TARGET - teamNetworkMembers) }).map((_, index) => (
                  <div key={index} className="flex h-12 w-12 items-center justify-center rounded-full border border-dashed border-white/20 bg-white/8 text-white/35">
                    +
                  </div>
                ))}
              </div>

              <div className="relative z-10 mx-auto mt-5 max-w-[220px]">
                <p className="text-sm font-black text-white">{teamNetworkMembers} / {SCRATCH_TEAM_TARGET}</p>
                <div className="mt-2 h-1.5 rounded-full bg-white/12">
                  <div className="h-full rounded-full bg-emerald-300" style={{ width: `${teamNetworkProgress}%` }} />
                </div>
              </div>

              <button
                type="button"
                onClick={handleTeamInviteFriends}
                className="relative z-10 mt-7 w-full rounded-full bg-white px-6 py-3.5 text-base font-black text-black shadow-xl transition-colors hover:bg-gray-100"
              >
                Invite Friends
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mini Team & Network Screen */}
      <AnimatePresence>
        {showTeamNetwork && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black px-4 pb-12 pt-[68px] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(115,221,208,0.14),transparent_35%),radial-gradient(circle_at_15%_55%,rgba(86,143,255,0.08),transparent_28%)]" />
            <motion.section
              initial={{ scale: 0.94, opacity: 0, y: 18 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 18 }}
              className="relative w-full max-w-[375px] overflow-hidden rounded-[1.55rem] border border-[#7ba4b9]/55 bg-gradient-to-b from-[#192026]/96 to-[#0d0f10]/98 px-5 pb-9 pt-7 text-center shadow-2xl"
            >
              {renderScratchLogoLockup('mb-5')}
              <h2 className="text-[22px] font-black text-white">Keep Growing!</h2>
              <p className="mx-auto mt-2 max-w-[270px] text-[13px] font-bold leading-relaxed text-white/50">
                Only a team of 5 qualifies for the grand prize!
              </p>

              <div className="mt-7 rounded-[0.9rem] bg-black/42 px-4 py-4 text-left">
                <div className="mb-5 flex items-center justify-between">
                  <p className="text-[16px] font-black text-white">Your Money Ties</p>
                  <p className="text-[22px] font-black text-white">{teamNetworkMembers}/{SCRATCH_TEAM_TARGET}</p>
                </div>

                <div className="-space-x-3 flex items-center">
                  {recommendedFriends.slice(0, 4).map((friend, index) => (
                    <img
                      key={friend.id}
                      src={friend.avatar}
                      alt=""
                      className="h-12 w-12 rounded-full border-2 border-[#13171b] object-cover"
                      style={{ zIndex: index + 1 }}
                    />
                  ))}
                  <button
                    type="button"
                    onClick={handleOpenInviteModal}
                    className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/8 text-white"
                    aria-label="Invite teammate"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <p className="mt-4 max-w-[260px] text-[13px] font-bold leading-relaxed text-white/54">
                  You and your friends earn another scratch when they accept your invitation.
                </p>

                <button
                  type="button"
                  onClick={handleOpenInviteModal}
                  className="ml-auto mt-3 block rounded-full bg-white px-6 py-2 text-[12px] font-black text-black"
                >
                  Share
                </button>
              </div>

              <h3 className="mt-5 text-[20px] font-black text-white">Get more Cash Prizes.</h3>
              <p className="mt-1 text-[13px] font-bold text-white/48">Set up your team before the launch</p>

              <div
                ref={rewardsSliderRef}
                onPointerDown={handleRewardsSliderPointerDown}
                onPointerMove={handleRewardsSliderPointerMove}
                onPointerUp={handleRewardsSliderPointerEnd}
                onPointerCancel={handleRewardsSliderPointerEnd}
                onPointerLeave={handleRewardsSliderPointerEnd}
                onWheel={handleRewardsSliderWheel}
                className={`-mx-5 mt-5 flex gap-4 overflow-x-auto px-5 pb-2 select-none touch-pan-y [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
                  isRewardsSliderDragging ? 'cursor-grabbing snap-none' : 'cursor-grab snap-x'
                }`}
                aria-label="Ticket options"
              >
                {miniTicketOptions.map((option) => {
                  const frame = miniTicketFrame[option.id];
                  const isSelected = option.id === miniTicketKind;

                  return (
                    <div
                      key={option.id}
                      aria-current={isSelected ? 'true' : undefined}
                      className={`relative min-w-[156px] snap-center rounded-[1rem] border px-3 pb-4 pt-3 ${
                        isSelected
                          ? 'bg-white/14 shadow-[0_0_18px_rgba(132,230,210,0.2)]'
                          : 'border-white/12 bg-white/8'
                      }`}
                      style={isSelected ? { borderColor: frame.border } : undefined}
                    >
                      {isSelected && <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#8cf0c9]" />}
                      <p className="text-[13px] font-black text-white">{option.label}</p>
                      <p className="text-[10px] font-bold text-white/48">
                        {option.id === 'golden' ? 'Win up $25.00' : option.id === 'wildcard' ? 'Win up $12.00' : 'Win up $5.00'}
                      </p>
                      <div
                        className="mt-3 h-[56px] w-full"
                        style={{
                          background: frame.ticketGradient,
                          clipPath: 'polygon(0 12%, 8% 12%, 8% 0, 16% 0, 16% 12%, 24% 12%, 24% 0, 32% 0, 32% 12%, 40% 12%, 40% 0, 48% 0, 48% 12%, 56% 12%, 56% 0, 64% 0, 64% 12%, 72% 12%, 72% 0, 80% 0, 80% 12%, 88% 12%, 88% 0, 96% 0, 96% 12%, 100% 12%, 100% 88%, 96% 88%, 96% 100%, 88% 100%, 88% 88%, 80% 88%, 80% 100%, 72% 100%, 72% 88%, 64% 88%, 64% 100%, 56% 100%, 56% 88%, 48% 88%, 48% 100%, 40% 100%, 40% 88%, 32% 88%, 32% 100%, 24% 100%, 24% 88%, 16% 88%, 16% 100%, 8% 100%, 8% 88%, 0 88%)',
                        }}
                      >
                        <div className="flex h-full items-center justify-center gap-6 text-white">
                          <div className="h-5 w-3 rounded-l-full bg-white" />
                          <div className="h-0 w-0 border-y-[13px] border-l-[15px] border-y-transparent border-l-white" />
                          <div className="h-0 w-0 border-y-[13px] border-r-[15px] border-y-transparent border-r-white" />
                          <div className="h-5 w-3 rounded-r-full bg-white" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-7 flex justify-center">
                <button
                  type="button"
                  onClick={handleViewProfile}
                  className="rounded-full bg-white px-12 py-3.5 text-[15px] font-black text-black shadow-xl transition-colors hover:bg-gray-100"
                >
                  View Profile
                </button>
              </div>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Invite Accepted Modal */}
      <AnimatePresence>
        {showInviteAccepted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.88, opacity: 0, y: 18 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.88, opacity: 0, y: 18 }}
              className="relative w-full max-w-[370px] overflow-hidden rounded-[1.65rem] border border-emerald-200/20 bg-gradient-to-b from-[#202733]/96 to-[#111514]/98 px-7 pb-8 pt-10 text-center shadow-2xl"
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(74,222,128,0.18),transparent_50%)]" />
              <div className="relative z-10 mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-300/15 text-3xl">
                🎉
              </div>
              <h2 className="relative z-10 text-2xl font-black text-white">New opportunity unlocked</h2>
              <p className="relative z-10 mt-3 text-base font-bold text-emerald-200">Alex joined your team</p>

              <div className="relative z-10 mt-7 rounded-[1.35rem] border border-white/12 bg-black/28 p-5 text-left">
                <p className="mb-3 text-center text-sm font-black text-white">Updated:</p>
                <div className="space-y-2 text-sm font-semibold text-white">
                  <div className="rounded-2xl bg-white/8 px-4 py-3">Team coordination strength increased</div>
                  <div className="rounded-2xl bg-white/8 px-4 py-3">More opportunities unlocked</div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleInviteAcceptedContinue}
                className="relative z-10 mt-7 w-full rounded-full bg-white px-6 py-3.5 text-base font-black text-black shadow-xl transition-colors hover:bg-gray-100"
              >
                Continue
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Golden Event Modal */}
      <AnimatePresence>
        {showGoldenEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.88, opacity: 0, y: 18 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.88, opacity: 0, y: 18 }}
              className="relative w-full max-w-[370px] overflow-hidden rounded-[1.65rem] border border-yellow-200/25 bg-gradient-to-b from-[#282313]/96 to-[#111514]/98 px-7 pb-8 pt-10 text-center shadow-2xl"
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_12%,rgba(250,204,21,0.24),transparent_48%),radial-gradient(circle_at_80%_58%,rgba(74,222,128,0.12),transparent_34%)]" />
              <p className="relative z-10 mb-3 text-xs font-black uppercase tracking-[0.28em] text-yellow-200/80">Golden Event</p>
              <h2 className="relative z-10 text-2xl font-black text-white">{goldenEventTitle}</h2>
              <p className="relative z-10 mx-auto mt-4 max-w-[280px] text-sm leading-relaxed text-gray-300">{goldenEventSubtext}</p>

              <div className="relative z-10 mt-7 rounded-[1.35rem] border border-yellow-200/20 bg-black/28 p-5">
                <p className="mb-3 text-xs font-black uppercase tracking-[0.22em] text-yellow-100/70">Top rewards</p>
                <div className="space-y-2">
                  {goldenTopRewards.map((item) => (
                    <div key={item} className="rounded-full border border-white/10 bg-white/8 px-4 py-2 text-sm font-semibold text-white">
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <p className="relative z-10 mt-6 text-sm font-bold text-yellow-100">⏱ {formatGoldenRemaining(goldenRemaining)} remaining</p>

              <button
                type="button"
                onClick={handleGoldenActivateNow}
                className="relative z-10 mt-7 w-full rounded-full bg-white px-6 py-3.5 text-base font-black text-black shadow-xl transition-colors hover:bg-gray-100"
              >
                {goldenEventCta}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Shopping Spree Modal */}
      <AnimatePresence>
        {showShoppingSpree && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.88, opacity: 0, y: 18 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.88, opacity: 0, y: 18 }}
              className="relative w-full max-w-[370px] overflow-hidden rounded-[1.65rem] border border-white/15 bg-gradient-to-b from-[#23272d]/96 to-[#111514]/98 px-7 pb-8 pt-10 text-center shadow-2xl"
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(250,204,21,0.16),transparent_50%)]" />
              <div className="relative z-10 mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-3xl">
                🛍️
              </div>
              <h2 className="relative z-10 text-2xl font-black text-white">Shopping Spree Unlocked</h2>
              <div className="relative z-10 mx-auto mt-7 max-w-[220px] rounded-[1.35rem] border border-white/12 bg-black/28 px-6 py-6">
                <p className="text-4xl font-black text-white">${SCRATCH_SHOPPING_SPREE_CREDIT}</p>
                <p className="mt-2 text-sm font-bold text-emerald-200">credit</p>
                <p className="mt-4 text-xs leading-relaxed text-gray-400">Platform-only. Unlocks at marketplace launch.</p>
              </div>
              <button
                type="button"
                onClick={handleShoppingSpreeContinue}
                className="relative z-10 mt-7 w-full rounded-full bg-white px-6 py-3.5 text-base font-black text-black shadow-xl transition-colors hover:bg-gray-100"
              >
                Use at Launch
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Merchandise Modal */}
      <AnimatePresence>
        {showMerchandise && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.88, opacity: 0, y: 18 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.88, opacity: 0, y: 18 }}
              className="relative w-full max-w-[370px] overflow-hidden rounded-[1.65rem] border border-white/15 bg-gradient-to-b from-[#23272d]/96 to-[#111514]/98 px-7 pb-8 pt-10 text-center shadow-2xl"
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(74,222,128,0.14),transparent_50%)]" />
              <div className="relative z-10 mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-white/8">
                <img src={tshirtRewardIcon} alt="" className="h-14 w-14 object-contain" />
              </div>
              <h2 className="relative z-10 text-2xl font-black text-white">Merchandise Rewards</h2>
              <div className="relative z-10 mt-7 space-y-2 text-sm font-semibold text-white">
                <div className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3">Branded apparel</div>
                <div className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3">Event drops</div>
                <div className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3">Limited-tier items</div>
              </div>
              <button
                type="button"
                onClick={handleMerchandiseContinue}
                className="relative z-10 mt-7 w-full rounded-full bg-white px-6 py-3.5 text-base font-black text-black shadow-xl transition-colors hover:bg-gray-100"
              >
                View Rewards
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pre-game Complete Modal */}
      <AnimatePresence>
        {showPreGameComplete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.88, opacity: 0, y: 18 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.88, opacity: 0, y: 18 }}
              className="relative w-full max-w-[370px] overflow-hidden rounded-[1.65rem] border border-fuchsia-200/20 bg-gradient-to-b from-[#251d35]/96 to-[#111514]/98 px-7 pb-8 pt-10 text-center shadow-2xl"
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(217,70,239,0.16),transparent_48%),radial-gradient(circle_at_78%_52%,rgba(74,222,128,0.1),transparent_36%)]" />
              <h2 className="relative z-10 text-2xl font-black text-white">🎉 Pre-game complete</h2>

              <div className="relative z-10 mt-7 rounded-[1.35rem] border border-white/12 bg-black/28 p-5 text-left">
                <p className="mb-3 text-center text-sm font-black text-white">Results:</p>
                <div className="space-y-2 text-sm font-semibold text-white">
                  <div className="rounded-2xl bg-white/8 px-4 py-3">🔒 USDT rewards (locked)</div>
                  <div className="rounded-2xl bg-white/8 px-4 py-3">📈 Participation advantage</div>
                  <div className="rounded-2xl bg-white/8 px-4 py-3">🔒 Tripto accumulated</div>
                </div>
              </div>

              <div className="relative z-10 mx-auto mt-5 max-w-[220px] rounded-[1.35rem] border border-white/12 bg-white/8 px-6 py-5">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-gray-400">Tripto</p>
                <p className="mt-2 text-4xl font-black text-white">{preGameTriptoTotal.toLocaleString()}</p>
                <p className="text-sm font-bold text-gray-300">(Locked)</p>
                <p className="mt-3 text-xs leading-relaxed text-emerald-200">Unlocks at launch</p>
              </div>

              <div className="relative z-10 mt-5 rounded-[1.2rem] border border-white/10 bg-black/24 px-4 py-3 text-sm leading-relaxed text-gray-300">
                <span className="font-black text-white">Fairness:</span> Anyone can catch up. Your advantage gives you an early edge.
              </div>

              <div className="relative z-10 mt-7 space-y-3">
                <button
                  type="button"
                  onClick={handlePreGameCompleteEnter}
                  className="w-full rounded-full bg-white px-6 py-3.5 text-base font-black text-black shadow-xl transition-colors hover:bg-gray-100"
                >
                  Enter Main Game
                </button>
                <button
                  type="button"
                  onClick={handleWhatIsTripto}
                  className="w-full rounded-full bg-white/12 px-6 py-3.5 text-base font-bold text-white transition-colors hover:bg-white/18"
                >
                  What is Tripto?
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Marketplace Launch Modal */}
      <AnimatePresence>
        {showMarketplaceLaunch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.88, opacity: 0, y: 18 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.88, opacity: 0, y: 18 }}
              className="relative w-full max-w-[370px] overflow-hidden rounded-[1.65rem] border border-fuchsia-200/20 bg-gradient-to-b from-[#251d35]/96 to-[#111514]/98 px-7 pb-8 pt-10 text-center shadow-2xl"
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(217,70,239,0.16),transparent_48%)]" />
              <h2 className="relative z-10 text-2xl font-black text-white">🎉 Welcome to Moneetize</h2>
              <p className="relative z-10 mt-2 text-base font-bold text-gray-300">Spend with Benefits</p>
              <p className="relative z-10 mt-6 text-lg font-black text-emerald-200">🔓 Tripto unlocked</p>

              <div className="relative z-10 mt-7 rounded-[1.35rem] border border-white/12 bg-black/28 p-5 text-left">
                <p className="mb-3 text-center text-sm font-black text-white">Wallet:</p>
                <div className="space-y-2 text-sm font-semibold text-white">
                  <div className="rounded-2xl bg-white/8 px-4 py-3">💰 Capital</div>
                  <div className="rounded-2xl bg-white/8 px-4 py-3">📈 Participation score</div>
                  <div className="rounded-2xl bg-white/8 px-4 py-3">🪙 Tripto</div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleMarketplaceLaunchEnter}
                className="relative z-10 mt-7 w-full rounded-full bg-white px-6 py-3.5 text-base font-black text-black shadow-xl transition-colors hover:bg-gray-100"
              >
                Enter Marketplace
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* What Is Tripto Modal */}
      <AnimatePresence>
        {showWhatIsTripto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.88, opacity: 0, y: 18 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.88, opacity: 0, y: 18 }}
              className="relative w-full max-w-[370px] overflow-hidden rounded-[1.65rem] border border-cyan-200/20 bg-gradient-to-b from-[#202733]/96 to-[#111514]/98 px-7 pb-8 pt-10 text-center shadow-2xl"
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(56,189,248,0.16),transparent_48%)]" />
              <h2 className="relative z-10 text-2xl font-black text-white">What is Tripto?</h2>
              <p className="relative z-10 mx-auto mt-4 max-w-[280px] text-sm leading-relaxed text-gray-300">
                Tripto represents your ability to participate in real product flows within the system.
              </p>

              <div className="relative z-10 mt-7 rounded-[1.35rem] border border-white/12 bg-black/28 p-5 text-left">
                <p className="mb-3 text-center text-sm font-black text-white">It determines:</p>
                <div className="space-y-2 text-sm font-semibold text-white">
                  <div className="rounded-2xl bg-white/8 px-4 py-3">where you allocate</div>
                  <div className="rounded-2xl bg-white/8 px-4 py-3">how you participate</div>
                  <div className="rounded-2xl bg-white/8 px-4 py-3">what you earn</div>
                </div>
              </div>

              <div className="relative z-10 mt-5 rounded-[1.2rem] border border-white/10 bg-white/8 px-4 py-4 text-sm leading-relaxed text-gray-300">
                More Tripto → more participation → more value generation.
              </div>
              <p className="relative z-10 mt-4 text-xs leading-relaxed text-gray-500">
                Tripto generates value within the system. It is not direct cash.
              </p>

              <button
                type="button"
                onClick={handleWhatIsTriptoContinue}
                className="relative z-10 mt-7 w-full rounded-full bg-white px-6 py-3.5 text-base font-black text-black shadow-xl transition-colors hover:bg-gray-100"
              >
                Continue
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Wild Card Modal */}
      <AnimatePresence>
        {showWildCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center px-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              className="bg-gradient-to-b from-[#1a2847]/95 to-[#0f1623]/95 border-2 border-white/10 rounded-3xl p-8 w-full max-w-sm"
            >
              <div className="flex justify-center mb-6">
                <div className="w-24 h-24 rounded-2xl flex items-center justify-center p-3">
                  <img src={wildcardIcon} alt="Wild Card" className="w-full h-full object-contain" />
                </div>
              </div>

              <h2 className="text-white text-2xl font-bold text-center mb-3">
                {reward.wildCard.name}
              </h2>
              <p className="text-gray-400 text-sm text-center mb-8">
                {reward.wildCard.description}
              </p>

              <button
                onClick={handleWildCardContinue}
                className="w-full bg-white text-black py-3.5 rounded-full font-semibold text-base hover:bg-gray-100 transition-colors"
              >
                Got it!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expiration Modal */}
      <AnimatePresence>
        {showExpiration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center px-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              className="bg-gradient-to-b from-[#1a2847]/95 to-[#0f1623]/95 border-2 border-white/10 rounded-3xl p-8 w-full max-w-sm"
            >
              <ul className="space-y-4 text-gray-300 text-sm mb-6">
                <li className="flex items-start gap-2">
                  <span className="text-white mt-0.5">•</span>
                  <span>Non-transferable and non-divisible</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-white mt-0.5">•</span>
                  <span>Split across multiple purchases</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-white mt-0.5">•</span>
                  <span>Expires 90 days after marketplace launch (timer displayed)</span>
                </li>
              </ul>

              <div className="bg-black/50 rounded-2xl px-6 py-4 flex items-center justify-center gap-2 mb-6">
                <Info className="w-5 h-5 text-gray-400" />
                <span className="text-white text-lg">
                  {expirationCountdown.days}d {expirationCountdown.hours}h : {String(expirationCountdown.minutes).padStart(2, '0')}m : {String(expirationCountdown.seconds).padStart(2, '0')}s
                </span>
              </div>

              <button
                onClick={handleExpirationContinue}
                className="w-full bg-white text-black py-3.5 rounded-full font-semibold text-base hover:bg-gray-100 transition-colors"
              >
                Got it!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Level Progress Modal */}
      <AnimatePresence>
        {showLevelProgress && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center px-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              className="relative w-full max-w-[370px] min-h-[528px] overflow-hidden rounded-[1.65rem] border border-[#718092]/70 px-8 pb-10 pt-16"
              style={levelCardStyle}
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_50%_0%,rgba(148,163,184,0.1),transparent_70%)]" />
              <h2 className="relative z-20 text-white text-2xl font-bold text-center mb-8">Level Progress</h2>

              {/* Balance Card */}
              <motion.div
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="relative z-20 -mx-1 rounded-[1.25rem] border border-white/18 bg-white/10 px-6 py-4 mb-[-1.2rem] overflow-hidden backdrop-blur-xl"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/5 to-white/10" />
                <div className="absolute right-3 top-1/2 h-16 w-28 -translate-y-1/2 rounded-full bg-emerald-300/25 blur-xl" />
                <div className="flex items-center justify-between relative z-10">
                  <div>
                    <p className="text-gray-300 text-sm mb-1">Balance:</p>
                    <p className="text-white text-3xl font-bold">
                      {currentPointsBalance} pts
                    </p>
                    <p className="text-white/20 text-xl font-bold leading-none">
                      0
                    </p>
                    <p className="sr-only">
                      {formatUsdt(currentUsdtBalance)}
                    </p>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-0 scale-150 rounded-full bg-emerald-300/35 blur-xl" />
                    <motion.div
                      animate={{ y: [0, -8, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="relative"
                    >
                      <img src={gemIcon} alt="Gem" className="w-20 h-20 object-contain" />
                    </motion.div>
                  </div>
                </div>
                
                {/* Points gained indicator */}
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute right-12 top-0 z-20"
                >
                  <span className="text-emerald-300 text-base font-bold">+{participationScore}</span>
                </motion.div>
              </motion.div>

              {/* Progress Circle */}
              <div className="relative z-10 flex flex-col items-center mb-8">
                <div className="relative h-40 w-48 mb-4">
                  <div className="absolute left-1/2 top-0 h-40 w-40 -translate-x-1/2 rounded-full bg-gradient-to-b from-white/10 to-black/20 shadow-[inset_0_-12px_26px_rgba(0,0,0,0.38),inset_0_8px_18px_rgba(255,255,255,0.04)]" />
                  <div className="absolute left-1/2 top-4 h-32 w-32 -translate-x-1/2 rounded-full border border-black/25 bg-black/10" />
                  <div className="absolute inset-x-0 top-20 h-24 bg-gradient-to-b from-white/5 to-transparent blur-xl" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center pt-6">
                    <motion.span
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.45, type: 'spring' }}
                      className="text-white/80 text-base font-bold"
                    >
                      {participationProgress}%
                    </motion.span>
                    <div className="mt-2 h-1 w-16 rounded-full bg-black/35">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${participationProgress}%` }}
                        transition={{ duration: 1.1, delay: 0.55, ease: 'easeOut' }}
                        className="h-full rounded-full bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Level Badge */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="rounded-full border border-white/10 bg-white/10 px-7 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-md"
                >
                  <span className="text-gray-300 text-base font-semibold">{participationLabel}</span>
                </motion.div>
              </div>

              <button
                onClick={handleLevelProgressContinue}
                className="relative z-20 mx-auto block bg-white text-black px-9 py-3.5 rounded-full font-semibold text-base hover:bg-gray-100 transition-colors shadow-xl"
              >
                Continue
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Final Level Screen */}
      <AnimatePresence>
        {showFinalLevelScreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center px-4 z-50"
          >
            {/* Participation Reveal Modal */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              className="relative w-full max-w-[370px] min-h-[528px] overflow-hidden rounded-[1.65rem] border border-[#718092]/70 px-8 pb-10 pt-16"
              style={levelCardStyle}
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_50%_0%,rgba(148,163,184,0.1),transparent_70%)]" />

              {isGoldenApexActive ? (
                <>
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(250,204,21,0.2),transparent_44%),radial-gradient(circle_at_78%_48%,rgba(34,197,94,0.12),transparent_30%)]" />
                  <div className="relative z-20 mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-[1.4rem] border border-yellow-200/40 bg-yellow-200/10 shadow-[0_0_55px_rgba(250,204,21,0.2)]">
                    <img src={wildcardIcon} alt="Golden Apex Card" className="h-16 w-16 object-contain" />
                  </div>
                  <p className="relative z-20 mb-3 text-center text-xs font-black uppercase tracking-[0.3em] text-yellow-200/80">
                    {goldenEventEyebrow}
                  </p>
                  <h2 className="relative z-20 text-center text-2xl font-black text-white">
                    {goldenEventTitle}
                  </h2>
                  <p className="relative z-20 mx-auto mt-4 max-w-[260px] text-center text-sm leading-relaxed text-gray-300">
                    {goldenEventSubtext}
                  </p>

                  <div className="relative z-20 mt-7 rounded-[1.35rem] border border-yellow-200/20 bg-black/24 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                    <p className="mb-3 text-center text-xs font-bold uppercase tracking-[0.22em] text-yellow-100/70">Top rewards</p>
                    <div className="space-y-2">
                      {goldenTopRewards.map((item) => (
                        <div key={item} className="rounded-full border border-white/10 bg-white/8 px-4 py-2 text-center text-sm font-semibold text-white">
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="relative z-20 mt-6 text-center">
                    <p className="text-sm font-semibold text-yellow-100">
                      ⏱ {formatGoldenRemaining(goldenRemaining)} remaining
                    </p>
                    <p className="mt-2 text-xs leading-relaxed text-gray-400">
                      Your result reflects your participation level within the system.
                    </p>
                  </div>

                  <button
                    onClick={handleFinalLevelContinue}
                    className="relative z-20 mx-auto mt-7 block bg-white px-8 py-3.5 text-base font-semibold text-black shadow-xl transition-colors hover:bg-gray-100 rounded-full"
                  >
                    {goldenEventCta}
                  </button>
                </>
              ) : (
                <>
                  <h2 className="relative z-20 text-center text-2xl font-black text-white">
                    Participation level revealed
                  </h2>
                  <p className="relative z-20 mx-auto mt-3 max-w-[250px] text-center text-sm leading-relaxed text-gray-300">
                    Your result reflects your participation level within the system.
                  </p>

                  <div className="relative z-10 mt-8 flex flex-col items-center">
                    <div className="absolute top-10 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-orange-400/30 blur-3xl" />
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{
                        scale: [0, 1, 1.05, 1],
                        rotate: [0, 0, 2, -2, 0],
                      }}
                      transition={{
                        scale: { delay: 0.2, duration: 0.8, type: 'tween' },
                        rotate: {
                          delay: 1,
                          duration: 3,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        },
                      }}
                      className="relative z-10 mb-5 h-44 w-44"
                    >
                      <div className="absolute inset-0 rounded-full bg-gradient-to-b from-yellow-300 via-orange-400 to-orange-700 shadow-[0_24px_60px_rgba(194,76,11,0.35)]" />
                      <div className="absolute inset-2 rounded-full bg-gradient-to-b from-yellow-400 via-orange-400 to-orange-700" />
                      <div className="absolute inset-5 rounded-full border-2 border-orange-700/45 bg-gradient-to-b from-yellow-300 via-orange-400 to-orange-600" />
                      <div className="absolute inset-8 rounded-full border-2 border-orange-700/35" />

                      <div className="absolute inset-6 flex flex-col items-center justify-center rounded-full">
                        <motion.span
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.45, type: 'spring' }}
                          className="text-5xl font-black text-orange-800"
                        >
                          {String(participationLevel).padStart(2, '0')}
                        </motion.span>
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.65 }}
                          className="text-lg font-bold text-orange-800"
                        >
                          Level
                        </motion.span>
                      </div>
                    </motion.div>

                    <div className="rounded-full border border-yellow-200/20 bg-yellow-900/25 px-7 py-3 text-base font-semibold text-yellow-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-md">
                      {participationLabel}
                    </div>
                  </div>

                  <div className="relative z-20 mt-7 space-y-3 rounded-[1.35rem] border border-white/10 bg-white/8 px-5 py-5 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-3xl font-black text-white">+{participationScore}</span>
                      <img src={gemIcon} alt="Gem" className="h-8 w-8 object-contain" />
                    </div>
                    <p className="text-sm font-semibold text-emerald-200">Participation Score</p>
                    <p className="text-sm font-bold text-white">{participationBoost}</p>
                    {reward.goldenEligibility && (
                      <p className="text-sm font-semibold text-yellow-200">{participationImpact}</p>
                    )}
                  </div>

                  <button
                    onClick={handleFinalLevelContinue}
                    className="relative z-20 mx-auto mt-7 block bg-white text-black px-9 py-3.5 rounded-full font-semibold text-base hover:bg-gray-100 transition-colors shadow-xl"
                  >
                    Continue
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
