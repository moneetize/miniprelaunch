import { motion, AnimatePresence } from 'motion/react';
import { useState, useRef, useEffect, type PointerEvent as ReactPointerEvent, type WheelEvent as ReactWheelEvent } from 'react';
import { useNavigate } from 'react-router';
import { Check, Copy, Info, Link as LinkIcon, Plus } from 'lucide-react';
import gemIcon from 'figma:asset/296d8aa06fd9c7e60192bc7368a4a032ec5bc17e.png';
import wildcardIcon from 'figma:asset/f632203f248e2d298246c5ffb0789bc0cac99ea5.png';
import tshirtRewardIcon from '../../assets/moneetize-tshirt-reward.png';
import { getUserPoints, setUserPoints } from '../utils/pointsManager';
import { drawScratchTicket, type ScratchBalances, type ScratchReward, type ScratchRewardItem, type ScratchTicket } from '../services/scratchService';
import { getDefaultRecommendedFriends, loadRecommendedFriends, type RecommendedFriendProfile } from '../services/networkService';
import { safeGetItem, safeSetItem } from '../utils/storage';
import { getScratchTeaserAuthRoute, isScratchTeaserPending, markScratchTeaserPending } from '../utils/flowManager';

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

const formatUsdt = (value = 0) => `$${value.toFixed(2)} USDT`;

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

const levelCardStyle = {
  background:
    'radial-gradient(circle at 12% 46%, rgba(61, 92, 132, 0.18) 0%, transparent 24%), radial-gradient(circle at 78% 38%, rgba(87, 130, 91, 0.18) 0%, transparent 28%), linear-gradient(180deg, rgba(25, 31, 37, 0.96) 0%, rgba(16, 20, 20, 0.98) 100%)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 26px 90px rgba(0,0,0,0.58)',
};

const SCRATCH_REWARD_EXPIRATION_MS = 90 * 24 * 60 * 60 * 1000;
const SCRATCH_TEASER_MODEL_VERSION = 3;
const SCRATCH_LOCKED_TRIPTO = 250;
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
  topRewards: ['💵 $25+ USDT', '🛍️ Shopping Spree rewards', '📈 Major participation boosts'],
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
    { id: `${ticketId}-usdt`, type: 'usdt', label: 'USDT balance', amount: usdt, unit: 'USDT', icon: 'usdt' },
    { id: `${ticketId}-tripto`, type: 'tripto', label: 'Tripto (Locked)', amount: triptoPoints, unit: 'Tripto', icon: 'tripto' },
  ];

  if (includeShirt) {
    items.splice(1, 0, {
      id: `${ticketId}-moneetize-shirt`,
      type: 'merch',
      label: 'Moneetize T-Shirt',
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
    weight: 4500,
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
      score: 20,
      level: 1,
      triptoPoints: SCRATCH_LOCKED_TRIPTO,
      usdt: 0.5,
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
      score: 45,
      level: 2,
      triptoPoints: SCRATCH_LOCKED_TRIPTO,
      usdt: 1,
      wildCardName: 'Momentum Wild Card',
      wildCardDescription: 'A brighter participation card with a stronger activation signal.',
      participationBoost: 'Momentum boost',
      participationImpact: 'Growing coordination signal',
    }),
  },
  {
    weight: 1800,
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
      score: 75,
      level: 3,
      triptoPoints: SCRATCH_LOCKED_TRIPTO,
      usdt: 3,
      wildCardName: 'Boost Advantage Card',
      wildCardDescription: 'Level 3 participation adds a boost advantage after sign-up.',
      participationBoost: 'Boost advantage',
      participationImpact: 'Stronger coordination signal',
      includeShirt: true,
    }),
  },
  {
    weight: 650,
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
      score: 250,
      level: 4,
      triptoPoints: SCRATCH_LOCKED_TRIPTO,
      usdt: 8,
      wildCardName: 'Golden Eligibility Card',
      wildCardDescription: 'Higher-level participation unlocks golden eligibility after registration.',
      participationBoost: 'Enhanced coordination impact',
      participationImpact: 'Golden eligibility',
      goldenEligibility: true,
      includeShirt: true,
    }),
  },
  {
    weight: 50,
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
      score: 500,
      level: 5,
      triptoPoints: SCRATCH_LOCKED_TRIPTO,
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
  const nextUsdt = selected.reward.usdt;
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
  const [isPreRegistrationTeaser, setIsPreRegistrationTeaser] = useState(() => !safeGetItem('access_token') || isScratchTeaserPending());
  const [recommendedFriends, setRecommendedFriends] = useState<RecommendedFriendProfile[]>(getDefaultRecommendedFriends());
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [isRewardsSliderDragging, setIsRewardsSliderDragging] = useState(false);
  const [inviteLink] = useState(() => {
    const userId = safeGetItem('user_id');
    const suffix = userId ? userId.slice(-4).toUpperCase() : '392D';
    return `https://moneetize.com/r/...${suffix}`;
  });
  const [countdown, setCountdown] = useState({ hours: 10, minutes: 8, seconds: 32 });
  const [expirationCountdown, setExpirationCountdown] = useState({ days: 12, hours: 10, minutes: 8, seconds: 32 });
  const showActivateRewards = preGameStep === 'activateRewards';
  const showReadyRegister = preGameStep === 'readyRegister';
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

        const shouldUseTeaser = !safeGetItem('access_token') || isScratchTeaserPending();

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
          setTicketError(error instanceof Error ? error.message : 'Unable to load scratch ticket.');
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

    // Show level progress first, then continue into the activate rewards flow.
    setTimeout(() => {
      setShowParticles(false);
      setShowLevelProgress(true);
    }, 2500); // Extended to 2.5s for longer confetti effect
  };

  const handleActivateRewards = () => {
    setPreGameStep('readyRegister');
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

    const slider = rewardsSliderRef.current;
    if (!slider) return;

    rewardsSliderDragRef.current = {
      isDragging: true,
      startX: event.clientX,
      scrollLeft: slider.scrollLeft,
    };
    setIsRewardsSliderDragging(true);
    slider.setPointerCapture(event.pointerId);
  };

  const handleRewardsSliderPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const slider = rewardsSliderRef.current;
    const drag = rewardsSliderDragRef.current;
    if (!slider || !drag.isDragging) return;

    const deltaX = event.clientX - drag.startX;
    if (Math.abs(deltaX) > 2) {
      event.preventDefault();
    }

    slider.scrollLeft = drag.scrollLeft - deltaX;
  };

  const handleRewardsSliderPointerEnd = (event: ReactPointerEvent<HTMLDivElement>) => {
    const slider = rewardsSliderRef.current;
    if (slider?.hasPointerCapture(event.pointerId)) {
      slider.releasePointerCapture(event.pointerId);
    }

    rewardsSliderDragRef.current.isDragging = false;
    setIsRewardsSliderDragging(false);
  };

  const handleRewardsSliderWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    const slider = rewardsSliderRef.current;
    if (!slider || slider.scrollWidth <= slider.clientWidth) return;

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

    return (
      <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-[#0a0e1a] via-[#0f1623] to-[#0a0e1a] flex items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-3xl border border-red-400/30 bg-red-950/30 p-8 text-center backdrop-blur-md">
          <h1 className="mb-3 text-2xl font-bold text-white">Ticket unavailable</h1>
          <p className="mb-6 text-sm text-gray-300">
            {needsLogin ? 'Your session expired. Please log in again to play Scratch and Win.' : ticketError || 'We could not load your scratch reward. Please try again.'}
          </p>
          <button
            onClick={() => needsLogin ? navigate('/login') : window.location.reload()}
            className="w-full rounded-full bg-white px-6 py-3 font-semibold text-black transition-colors hover:bg-gray-100"
          >
            {needsLogin ? 'Log in' : 'Try again'}
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
  const goldenTopRewards = goldenWindow?.topRewards ?? ['💵 $25+ USDT', '🛍️ Shopping Spree rewards', '📈 Major participation boosts'];
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
      label: 'USDT balance',
      amount: reward.usdt,
      unit: 'USDT',
      icon: 'usdt',
    },
    {
      id: 'fallback-tripto',
      type: 'tripto',
      label: 'Tripto points',
      amount: lockedTriptoPoints,
      unit: 'Tripto',
      icon: 'tripto',
    },
  ];
  const activationRewards = reward.items?.length ? reward.items : fallbackRewardItems;
  const hasMerchandiseReward = activationRewards.some(item => item.type === 'merch');
  const teamNetworkMembers = Math.min(SCRATCH_TEAM_MEMBERS + 1, SCRATCH_TEAM_TARGET);
  const teamNetworkProgress = Math.round((teamNetworkMembers / SCRATCH_TEAM_TARGET) * 100);
  const preGameTriptoTotal = Math.max(SCRATCH_PREGAME_TRIPTO_TOTAL, lockedTriptoPoints);

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
          <span className="text-base font-bold text-white">{item.label}</span>
          <span className="max-w-[132px] text-center text-sm leading-tight text-gray-300">
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
      <div className="flex min-h-screen flex-col items-center justify-start gap-4 px-4 pt-14 pb-28">
        <motion.section
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.45 }}
          className="w-full max-w-md rounded-[2rem] border border-white/10 bg-gradient-to-b from-[#20232d]/95 to-[#14171e]/95 px-5 py-5 text-center shadow-2xl backdrop-blur-md"
        >
          <div className="-space-x-2.5 flex items-center justify-center">
            {recommendedFriends.slice(0, 5).map((friend, index) => (
              <button
                key={friend.id}
                type="button"
                onClick={() => handleOpenRecommendedFriend(friend)}
                aria-label={`View ${friend.name}'s profile`}
                className="relative h-11 w-11 overflow-hidden rounded-full border-2 border-[#1f222c] bg-gradient-to-br from-slate-500 to-slate-900 text-sm font-bold text-white shadow-lg transition-transform hover:-translate-y-1 hover:scale-105"
                style={{ zIndex: index + 1 }}
                title={`${friend.name} ${friend.handle}`}
              >
                <span className="absolute inset-0 flex items-center justify-center">
                  {friend.name.charAt(0)}
                </span>
                <img
                  src={friend.avatar}
                  alt={friend.name}
                  className="relative h-full w-full object-cover"
                  onError={(event) => {
                    event.currentTarget.style.display = 'none';
                  }}
                />
              </button>
            ))}
            <button
              type="button"
              onClick={handleOpenInviteModal}
              aria-label="Invite friends"
              className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-[#22252f] text-white shadow-lg shadow-black/25 transition-transform hover:-translate-y-1 hover:bg-white/15"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
          <h2 className="mt-3 text-2xl font-bold text-white">Get more cash prizes!</h2>
          <p className="mt-1 text-sm font-semibold text-white/85">Set up your team before the launch</p>
        </motion.section>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md rounded-3xl p-8 border-2 backdrop-blur-md relative"
          style={{
            borderColor: ticket.borderColor,
            background: ticket.cardGradient,
            boxShadow: `0 0 60px ${ticket.glowColor}`,
          }}
        >
          {/* Title */}
          <motion.h1
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-white text-2xl sm:text-3xl font-bold text-center mb-4"
          >
            {ticket.title}
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-gray-400 text-sm text-center mb-6"
          >
            Your mystery card is waiting!<br />
            Scratch now to reveal how many<br />
            bonus points you've won.
          </motion.p>

          {/* Countdown Timer (for golden ticket) */}
          {ticket.isGolden && !isRevealed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex items-center justify-center gap-2 mb-6"
            >
              <div className="bg-black/50 px-3 py-2 rounded-lg">
                <span className="text-white text-xl font-bold">{String(countdown.hours).padStart(2, '0')}</span>
                <span className="text-gray-500 text-xs ml-1">hours</span>
              </div>
              <span className="text-white text-xl">:</span>
              <div className="bg-black/50 px-3 py-2 rounded-lg">
                <span className="text-white text-xl font-bold">{String(countdown.minutes).padStart(2, '0')}</span>
                <span className="text-gray-500 text-xs ml-1">min</span>
              </div>
              <span className="text-white text-xl">:</span>
              <div className="bg-black/50 px-3 py-2 rounded-lg">
                <span className="text-white text-xl font-bold">{String(countdown.seconds).padStart(2, '0')}</span>
                <span className="text-gray-500 text-xs ml-1">sec</span>
              </div>
            </motion.div>
          )}

          {/* Scratch Card */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="relative mb-6"
          >
            {/* Background revealed content */}
            <div
              className="w-full h-40 rounded-2xl border border-white/10 flex flex-col items-center justify-center relative overflow-hidden"
              style={{ background: ticket.cardGradient }}
            >
              {!isRevealed && (
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-3">
                    <img src={gemIcon} alt="Gem" className="w-10 h-10 object-contain" />
                    <span className="text-emerald-400 text-3xl font-bold">+{participationScore}</span>
                    <img src={gemIcon} alt="Gem" className="w-8 h-8 object-contain opacity-60" />
                  </div>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-white">
                    +{formatUsdt(reward.usdt)}
                  </span>
                </div>
              )}
              
              {isRevealed && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', duration: 0.8 }}
                  className="flex flex-col items-center gap-2"
                >
                  <div className="flex items-center gap-3">
                    <img src={gemIcon} alt="Gem" className="w-12 h-12 object-contain" />
                    <span className="text-emerald-400 text-4xl font-bold">+{participationScore}</span>
                    <img src={gemIcon} alt="Gem" className="w-10 h-10 object-contain opacity-80" />
                  </div>
                  <span className="rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold text-white">
                    +{formatUsdt(reward.usdt)}
                  </span>
                </motion.div>
              )}
            </div>

            {/* Scratch overlay canvas */}
            {!isRevealed && (
              <canvas
                ref={canvasRef}
                onMouseMove={(e) => e.buttons === 1 && handleScratch(e)}
                onMouseDown={handleScratch}
                onMouseUp={handleMouseUp}
                onTouchMove={handleScratch}
                onTouchStart={handleScratch}
                onTouchEnd={handleTouchEnd}
                className="absolute inset-0 w-full h-full rounded-2xl cursor-pointer touch-none"
                style={{ background: ticket.scratchGradient }}
              />
            )}
          </motion.div>

          {/* Instruction Text */}
          {!isRevealed && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-gray-400 text-sm text-center mb-6"
            >
              Tap to uncover<br />
              your reward!
            </motion.p>
          )}

          {/* How Rewards Work Button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex items-center gap-2 mx-auto px-5 py-2.5 bg-white/10 hover:bg-white/20 rounded-full text-white text-sm transition-colors"
          >
            <Info className="w-4 h-4" />
            How rewards work
          </motion.button>
        </motion.div>
      </div>

      {/* View Profile Button */}
      {!isPreRegistrationTeaser && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="absolute bottom-8 left-0 right-0 flex justify-center px-4"
        >
          <button
            onClick={handleViewProfile}
            className="bg-white text-black px-12 py-3.5 rounded-full font-semibold text-base hover:bg-gray-100 transition-colors shadow-xl"
          >
            View Profile
          </button>
        </motion.div>
      )}

      {/* Invite Friends Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm"
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
                  <div className="rounded-2xl bg-white/8 px-4 py-3">💵 Cash rewards (rank-based)</div>
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
