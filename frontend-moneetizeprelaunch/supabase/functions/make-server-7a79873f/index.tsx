import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import * as auth from "./auth.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization", "apikey", "x-client-info", "x-user-token"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-7a79873f/health", (c) => {
  return c.json({ status: "ok" });
});

const PRODUCTS_KEY = 'products';
const DEFAULT_USER_POINTS = 0;
const DEFAULT_USER_USDT = 0;
const SCRATCH_HISTORY_LIMIT = 50;
const RECOMMENDED_FRIENDS_KEY = 'network:recommended_friends';
const PROFILE_SETTINGS_PREFIX = 'profile_settings:';
const MAX_PROFILE_PHOTO_LENGTH = 120000;
const NETWORK_FOLLOWS_PREFIX = 'network_follows:';
const POINTS_HISTORY_PREFIX = 'points_history:';
const CHAT_THREADS_PREFIX = 'chat_thread:';
const CHAT_INDEX_PREFIX = 'chat_index:';
const EARLY_ACCESS_REQUESTS_KEY = 'early_access_requests';
const EMAIL_QUEUE_KEY = 'email_notifications';
const SMS_QUEUE_KEY = 'sms_notifications';
const MARKETPLACE_ORDERS_KEY = 'marketplace_orders';
const MARKETPLACE_PRODUCTS_KEY = 'marketplace_products';
const MARKETPLACE_ORDER_LOCK_KEY = 'lock:marketplace_order';
const MARKETPLACE_ORDER_LOCK_TTL_MS = 12000;
const INVITE_HISTORY_PREFIX = 'invite_history:';
const GAMEPLAY_PROGRESS_PREFIX = 'gameplay_progress:';
const SCRATCH_CREDITS_PREFIX = 'scratch_credits:';
const SCRATCH_PREMIUM_COUNTS_KEY = 'scratch_premium_counts';
const SCRATCH_DRAW_LOCK_KEY = 'lock:scratch_draw';
const INVITEE_ACTIVATION_REFERRER_PREFIX = 'invite_activation_referrer:';
const INVITEE_ACTIVATION_AWARDED_PREFIX = 'invite_activation_awarded:';
const TEAM_MILESTONES_PREFIX = 'team_milestones:';
const NETWORK_POINTS_PREFIX = 'network_points:';
const EARLY_ACCESS_POINTS_AWARD = 25;
const INVITE_POINTS_PER_RECIPIENT = 2;
const INVITEE_ACTIVATION_POINTS = 2;
const TEAM_OF_THREE_POINTS = 3;
const TEAM_OF_FIVE_POINTS = 5;
const FOLLOW_ACCEPTED_POINTS = 1;
const MUTUAL_FOLLOW_POINTS = 2;
const MAX_FOLLOW_POINTS_PER_DAY = 3;
const MAX_FOLLOW_POINTS_TOTAL = 10;
const MAX_USER_POINTS = 150;
const INITIAL_SCRATCH_CREDITS = 1;
const MAX_SCRATCH_OPPORTUNITIES = 5;
const GUARANTEED_CASH_WINS = 2;
const ADMIN_NOTIFICATION_EMAIL = 'admin@moneetize.com';
const CHAT_THREAD_LIMIT = 100;
const QUEUE_LIMIT = 500;

const defaultRecommendedFriends = [
  {
    id: 'network-amari-cole',
    name: 'Amari Cole',
    handle: '@amaricole',
    bio: 'Marketplace builder focused on creators, wellness drops, and community rewards.',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
    interests: ['Creator Economy', 'Wellness', 'Cash Rewards'],
    followers: 214,
    following: 96,
    points: 1280,
  },
  {
    id: 'network-maya-stone',
    name: 'Maya Stone',
    handle: '@mayastone',
    bio: 'Beauty and lifestyle curator helping friends discover products before they trend.',
    avatar: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=256&q=80',
    interests: ['Beauty', 'Lifestyle', 'Social Commerce'],
    followers: 348,
    following: 121,
    points: 1425,
  },
  {
    id: 'network-luca-reed',
    name: 'Luca Reed',
    handle: '@lucareed',
    bio: 'Tech shopper, points collector, and early adopter of reward-driven launches.',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=256&q=80',
    interests: ['Tech', 'Gaming', 'Rewards'],
    followers: 189,
    following: 144,
    points: 1120,
  },
  {
    id: 'network-sofia-vale',
    name: 'Sofia Vale',
    handle: '@sofiavale',
    bio: 'Fashion, home, and gifting scout building launch teams around shared taste.',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=256&q=80',
    interests: ['Fashion', 'Home', 'Gifting'],
    followers: 421,
    following: 172,
    points: 1565,
  },
  {
    id: 'network-nia-brooks',
    name: 'Nia Brooks',
    handle: '@niabrooks',
    bio: 'Fitness shopper and team captain stacking launch rewards with friends.',
    avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=256&q=80',
    interests: ['Fitness', 'Health', 'Team Rewards'],
    followers: 276,
    following: 118,
    points: 1335,
  },
];

const SCRATCH_REWARD_EXPIRATION_MS = 90 * 24 * 60 * 60 * 1000;
const SCRATCH_LOCKED_TRIPTO = 100;

const createGoldenWindow = () => ({
  active: true,
  eyebrow: 'GOLDEN EVENT',
  title: '🟡 Golden Apex Active',
  subtext: 'A high-intensity coordination window is active. Participants in this window generate the highest-value outcomes.',
  topRewards: ['💵 $25+ USDT (Locked)', '🛍️ Shopping Spree rewards', '📈 Major participation boosts'],
  remaining: { hours: 0, minutes: 2, seconds: 14 },
  cta: '⚡ Activate Now',
});

const createScratchReward = ({
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
}: {
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
}) => ({
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
});

const scratchTickets = [
  {
    id: 'blue',
    title: 'Wild Scratch',
    displayName: 'Blue Ticket',
    theme: 'blue',
    weight: 6000,
    isGolden: false,
    borderColor: 'rgba(129, 140, 248, 0.65)',
    glowColor: 'rgba(129, 140, 248, 0.22)',
    cardGradient: 'linear-gradient(180deg, rgba(30, 34, 46, 0.92) 0%, rgba(18, 22, 33, 0.96) 100%)',
    scratchGradient: 'linear-gradient(135deg, #7586ff 0%, #d9f2ff 100%)',
    scratchBaseColor: '#8492ff',
    particleColors: ['#7FCCFF', '#524CFF', '#A78BFA', '#F8FAFC'],
    reward: createScratchReward({
      score: 1,
      level: 1,
      triptoPoints: SCRATCH_LOCKED_TRIPTO,
      usdt: 0,
      wildCardName: 'Starter Coordination Card',
      wildCardDescription: 'A starter participation boost credited to your profile.',
      participationBoost: 'Starter participation boost',
      participationImpact: 'Baseline coordination signal',
    }),
  },
  {
    id: 'aqua',
    title: 'Wild Scratch',
    displayName: 'Aqua Ticket',
    theme: 'aqua',
    weight: 3000,
    isGolden: false,
    borderColor: 'rgba(103, 232, 249, 0.55)',
    glowColor: 'rgba(45, 212, 191, 0.2)',
    cardGradient: 'linear-gradient(180deg, rgba(24, 33, 32, 0.92) 0%, rgba(16, 22, 21, 0.96) 100%)',
    scratchGradient: 'linear-gradient(135deg, #21c8f6 0%, #99f6a7 100%)',
    scratchBaseColor: '#36d3d8',
    particleColors: ['#22D3EE', '#6EE7B7', '#99F6E4', '#F8FAFC'],
    reward: createScratchReward({
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
    id: 'green',
    title: 'Wild Scratch',
    displayName: 'Green Ticket',
    theme: 'green',
    weight: 700,
    isGolden: false,
    borderColor: 'rgba(132, 204, 22, 0.62)',
    glowColor: 'rgba(132, 204, 22, 0.2)',
    cardGradient: 'linear-gradient(180deg, rgba(25, 32, 23, 0.92) 0%, rgba(16, 22, 15, 0.96) 100%)',
    scratchGradient: 'linear-gradient(135deg, #27c23a 0%, #e6ff6f 100%)',
    scratchBaseColor: '#8fd43f',
    particleColors: ['#84CC16', '#A3E635', '#FDE047', '#ECFCCB'],
    reward: createScratchReward({
      score: 3,
      level: 3,
      triptoPoints: 150,
      usdt: 5,
      wildCardName: 'Boost Advantage Card',
      wildCardDescription: 'Level 3 participation adds a boost advantage to your profile.',
      participationBoost: 'Boost advantage',
      participationImpact: 'Stronger coordination signal',
    }),
  },
  {
    id: 'pink',
    title: 'Wild Scratch',
    displayName: 'Pink Ticket',
    theme: 'pink',
    weight: 270,
    isGolden: false,
    borderColor: 'rgba(244, 114, 182, 0.58)',
    glowColor: 'rgba(244, 114, 182, 0.2)',
    cardGradient: 'linear-gradient(180deg, rgba(34, 27, 31, 0.92) 0%, rgba(24, 19, 23, 0.96) 100%)',
    scratchGradient: 'linear-gradient(135deg, #ff7a45 0%, #f9a8d4 100%)',
    scratchBaseColor: '#f58aa4',
    particleColors: ['#FB7185', '#F472B6', '#FDBA74', '#FBCFE8'],
    reward: createScratchReward({
      score: 4,
      level: 4,
      triptoPoints: 250,
      usdt: 10,
      wildCardName: 'Golden Eligibility Card',
      wildCardDescription: 'Higher-level participation unlocks golden eligibility.',
      participationBoost: 'Enhanced coordination impact',
      participationImpact: 'Golden eligibility',
      goldenEligibility: true,
    }),
  },
  {
    id: 'gold',
    title: 'Golden Scratch',
    displayName: 'Gold Ticket',
    theme: 'gold',
    weight: 30,
    isGolden: true,
    borderColor: 'rgba(212, 175, 55, 0.72)',
    glowColor: 'rgba(212, 175, 55, 0.26)',
    cardGradient: 'linear-gradient(180deg, rgba(36, 33, 24, 0.93) 0%, rgba(22, 20, 16, 0.97) 100%)',
    scratchGradient: 'linear-gradient(135deg, #c8941d 0%, #fde68a 100%)',
    scratchBaseColor: '#C4A661',
    particleColors: ['#FDE68A', '#FACC15', '#D97706', '#FEF3C7'],
    countdown: { hours: 0, minutes: 2, seconds: 14 },
    reward: createScratchReward({
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
    }),
  },
] as const;

type ScratchOutcomeId = 'non_cash' | 'base_cash' | 'tier_4' | 'tier_3' | 'tier_2' | 'tier_1';

const scratchOutcomeTiers: Array<{
  id: ScratchOutcomeId;
  ticketId: typeof scratchTickets[number]['id'];
  label: string;
  cash: number;
  triptoRange: [number, number];
  pointsRange: [number, number];
  weight: number;
  threshold?: number;
  premiumCap?: number;
  level: number;
  wildCardName: string;
  wildCardDescription: string;
  participationBoost: string;
  participationImpact: string;
}> = [
  {
    id: 'non_cash',
    ticketId: 'blue',
    label: 'Non-cash',
    cash: 0,
    triptoRange: [50, 150],
    pointsRange: [1, 2],
    weight: 6000,
    level: 1,
    wildCardName: 'Starter Coordination Card',
    wildCardDescription: 'A starter participation boost credited to your profile.',
    participationBoost: 'Starter activation',
    participationImpact: 'Baseline coordination signal',
  },
  {
    id: 'base_cash',
    ticketId: 'aqua',
    label: 'Base cash',
    cash: 2.5,
    triptoRange: [50, 150],
    pointsRange: [1, 2],
    weight: 3000,
    level: 2,
    wildCardName: 'Momentum Wild Card',
    wildCardDescription: 'A base locked-cash win with steady launch participation value.',
    participationBoost: 'Base cash activation',
    participationImpact: 'Guaranteed cash progress',
  },
  {
    id: 'tier_4',
    ticketId: 'green',
    label: 'Tier 4',
    cash: 5,
    triptoRange: [100, 200],
    pointsRange: [2, 3],
    weight: 700,
    threshold: 20,
    premiumCap: 150,
    level: 3,
    wildCardName: 'Boost Advantage Card',
    wildCardDescription: 'A points-qualified reward upgrade with stronger launch value.',
    participationBoost: 'Tier 4 reward upgrade',
    participationImpact: 'Premium eligibility started',
  },
  {
    id: 'tier_3',
    ticketId: 'pink',
    label: 'Tier 3',
    cash: 10,
    triptoRange: [150, 300],
    pointsRange: [3, 4],
    weight: 200,
    threshold: 40,
    premiumCap: 25,
    level: 4,
    wildCardName: 'Golden Eligibility Card',
    wildCardDescription: 'A higher launch reward unlocked by points and premium inventory.',
    participationBoost: 'Tier 3 reward upgrade',
    participationImpact: 'Golden eligibility',
  },
  {
    id: 'tier_2',
    ticketId: 'pink',
    label: 'Tier 2',
    cash: 15,
    triptoRange: [200, 400],
    pointsRange: [4, 5],
    weight: 70,
    threshold: 60,
    premiumCap: 12,
    level: 4,
    wildCardName: 'Golden Eligibility Card',
    wildCardDescription: 'A rare locked-cash reward enabled by strong progression.',
    participationBoost: 'Tier 2 reward upgrade',
    participationImpact: 'Rare premium eligibility',
  },
  {
    id: 'tier_1',
    ticketId: 'gold',
    label: 'Tier 1',
    cash: 25,
    triptoRange: [300, 600],
    pointsRange: [5, 6],
    weight: 30,
    threshold: 80,
    premiumCap: 6,
    level: 5,
    wildCardName: 'Golden Apex Card',
    wildCardDescription: 'A very rare coordination window with top-tier launch rewards.',
    participationBoost: 'Tier 1 golden upgrade',
    participationImpact: 'Golden Apex coordination window',
  },
];

const getUserAccessToken = (c: any) => {
  const directToken = c.req.header('x-user-token') || c.req.header('X-User-Token');
  if (directToken) return `${directToken}`.replace(/^Bearer\s+/i, '').trim();

  const authHeader = c.req.header('Authorization');
  const bearerToken = authHeader?.split(' ')[1] || '';
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';

  return bearerToken && bearerToken !== anonKey ? bearerToken : '';
};

const verifyCurrentUser = async (c: any) => {
  const accessToken = getUserAccessToken(c);

  if (!accessToken) {
    return { response: c.json({ success: false, error: 'User token required' }, 401) };
  }

  const user = await auth.verifyToken(accessToken);

  if (!user) {
    return { response: c.json({ success: false, error: 'Unauthorized' }, 401) };
  }

  return { user };
};

const randomInt = (maxExclusive: number) => {
  const buffer = new Uint32Array(1);
  crypto.getRandomValues(buffer);
  return buffer[0] % maxExclusive;
};

const selectScratchTicket = () => {
  const totalWeight = scratchTickets.reduce((sum, ticket) => sum + ticket.weight, 0);
  let roll = randomInt(totalWeight);

  for (const ticket of scratchTickets) {
    if (roll < ticket.weight) return ticket;
    roll -= ticket.weight;
  }

  return scratchTickets[0];
};

const parseStoredNumber = (value: unknown, fallback: number) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : fallback;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
};

const parseStoredJsonArray = (value: unknown) => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

const parseStoredJsonObject = (value: unknown) => {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value as Record<string, any>;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as Record<string, any> : {};
    } catch {
      return {};
    }
  }
  return {};
};

const randomInRange = ([min, max]: [number, number]) => min + randomInt((max - min) + 1);

const getCappedPointAward = (currentPoints: number, requestedPoints: number) => {
  const safeCurrentPoints = Math.max(0, Math.round(currentPoints));
  const safeRequestedPoints = Math.max(0, Math.round(requestedPoints));
  return Math.max(0, Math.min(safeRequestedPoints, MAX_USER_POINTS - safeCurrentPoints));
};

const selectWeightedScratchOutcome = () => {
  const totalWeight = scratchOutcomeTiers.reduce((sum, outcome) => sum + outcome.weight, 0);
  let roll = randomInt(totalWeight);

  for (const outcome of scratchOutcomeTiers) {
    if (roll < outcome.weight) return outcome;
    roll -= outcome.weight;
  }

  return scratchOutcomeTiers[0];
};

const getScratchCashWinCount = (history: any[]) => history.filter((draw) => (
  Number(draw?.reward?.usdt) > 0
)).length;

const hasPremiumScratchUpgrade = (history: any[]) => history.some((draw) => (
  draw?.reward?.upgradeApplied === true || Number(draw?.reward?.usdt) >= 5
));

const resolveScratchOutcome = async ({
  history,
  currentPoints,
}: {
  history: any[];
  currentPoints: number;
}) => {
  const used = Math.min(MAX_SCRATCH_OPPORTUNITIES, Array.isArray(history) ? history.length : 0);
  const remainingAfterThisDraw = Math.max(0, MAX_SCRATCH_OPPORTUNITIES - (used + 1));
  const cashWins = getScratchCashWinCount(history);
  const requiredCashWinsRemaining = Math.max(0, GUARANTEED_CASH_WINS - cashWins);
  const baseCashOutcome = scratchOutcomeTiers.find((outcome) => outcome.id === 'base_cash') || scratchOutcomeTiers[1];
  let outcome = remainingAfterThisDraw < requiredCashWinsRemaining
    ? baseCashOutcome
    : selectWeightedScratchOutcome();
  let upgradeApplied = false;
  let upgradeFallbackReason = '';

  if (outcome.cash >= 5) {
    const pointsFromOutcome = randomInRange(outcome.pointsRange);
    const projectedPoints = currentPoints + getCappedPointAward(currentPoints, pointsFromOutcome);
    const premiumCounts = parseStoredJsonObject(await kv.get(SCRATCH_PREMIUM_COUNTS_KEY));
    const currentPremiumCount = Math.max(0, Math.round(parseStoredNumber(premiumCounts[outcome.id], 0)));
    const alreadyUpgraded = hasPremiumScratchUpgrade(history);
    const isEligible = projectedPoints >= (outcome.threshold || 0);
    const hasInventory = currentPremiumCount < (outcome.premiumCap || 0);

    if (alreadyUpgraded || !isEligible || !hasInventory) {
      upgradeFallbackReason = alreadyUpgraded
        ? 'user_upgrade_limit'
        : !isEligible
          ? 'points_threshold'
          : 'premium_pool_exhausted';
      outcome = baseCashOutcome;
    } else {
      upgradeApplied = true;
      await kv.set(SCRATCH_PREMIUM_COUNTS_KEY, {
        ...premiumCounts,
        [outcome.id]: currentPremiumCount + 1,
        updatedAt: new Date().toISOString(),
      });
    }
  }

  return { outcome, upgradeApplied, upgradeFallbackReason };
};

const createScratchRewardFromOutcome = ({
  ticket,
  outcome,
  awardedPoints,
  upgradeApplied,
  upgradeFallbackReason,
}: {
  ticket: typeof scratchTickets[number];
  outcome: typeof scratchOutcomeTiers[number];
  awardedPoints: number;
  upgradeApplied: boolean;
  upgradeFallbackReason: string;
}) => ({
  ...createScratchReward({
    score: awardedPoints,
    level: outcome.level,
    triptoPoints: randomInRange(outcome.triptoRange),
    usdt: outcome.cash,
    wildCardName: outcome.wildCardName,
    wildCardDescription: outcome.wildCardDescription,
    participationBoost: outcome.participationBoost,
    participationImpact: outcome.participationImpact,
    goldenEligibility: outcome.level >= 4,
    goldenWindow: ticket.isGolden ? createGoldenWindow() : null,
  }),
  outcome: outcome.id,
  outcomeLabel: outcome.label,
  cashLocked: true,
  triptoLocked: true,
  upgradeApplied,
  upgradeFallbackReason,
});

const getScratchCreditState = (storedCredits: unknown, history: any[] = []) => {
  const used = Math.min(MAX_SCRATCH_OPPORTUNITIES, Array.isArray(history) ? history.length : 0);
  const fallbackAvailable = used > 0 ? 0 : INITIAL_SCRATCH_CREDITS;
  const rawAvailable = Math.round(parseStoredNumber(storedCredits, fallbackAvailable));
  const maxAvailable = Math.max(0, MAX_SCRATCH_OPPORTUNITIES - used);
  const available = Math.min(maxAvailable, Math.max(0, rawAvailable));
  const totalEarned = Math.min(MAX_SCRATCH_OPPORTUNITIES, used + available);

  return {
    available,
    used,
    totalEarned,
    max: MAX_SCRATCH_OPPORTUNITIES,
    canScratch: available > 0,
  };
};

const loadScratchCreditState = async (userId: string, history?: any[]) => {
  const historyKey = `scratch_history:${userId}`;
  const creditsKey = `${SCRATCH_CREDITS_PREFIX}${userId}`;
  const [storedCredits, storedHistory] = await Promise.all([
    kv.get(creditsKey),
    history ? Promise.resolve(history) : kv.get(historyKey),
  ]);
  const parsedHistory = history || parseStoredJsonArray(storedHistory);

  return {
    key: creditsKey,
    history: parsedHistory,
    credits: getScratchCreditState(storedCredits, parsedHistory),
  };
};

const addScratchCreditForAcceptedInvite = async (userId: string) => {
  const state = await loadScratchCreditState(userId);

  if (state.credits.used + state.credits.available >= MAX_SCRATCH_OPPORTUNITIES) {
    return {
      unlocked: false,
      reason: 'max_reached',
      credits: state.credits,
      message: 'You have reached the maximum Scratch and Win opportunities for this release.',
    };
  }

  const nextCredits = {
    ...state.credits,
    available: state.credits.available + 1,
    totalEarned: Math.min(MAX_SCRATCH_OPPORTUNITIES, state.credits.used + state.credits.available + 1),
    canScratch: true,
  };

  await kv.set(state.key, nextCredits.available.toString());

  return {
    unlocked: true,
    credits: nextCredits,
    message: 'You have unlocked another scratch-and-win. Try your luck now.',
  };
};

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const normalizePhoneNumber = (phone: string) => {
  const cleaned = `${phone || ''}`.trim().replace(/[^\d+]/g, '');
  if (!cleaned) return '';
  if (cleaned.startsWith('+')) return /^\+[1-9]\d{7,14}$/.test(cleaned) ? cleaned : '';

  const digits = cleaned.replace(/\D/g, '');
  const e164 = digits.length === 10 ? `+1${digits}` : `+${digits}`;
  return /^\+[1-9]\d{7,14}$/.test(e164) ? e164 : '';
};

const escapeHtml = (value: unknown) => `${value ?? ''}`.replace(/[&<>"']/g, (char) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}[char] || char));

const serviceClient = async () => {
  const { createClient } = await import('npm:@supabase/supabase-js');
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
};

const acquireKvLock = async (lockKey: string, ttlMs = MARKETPLACE_ORDER_LOCK_TTL_MS) => {
  const token = crypto.randomUUID();
  const now = Date.now();
  const existingLock = parseStoredJsonObject(await kv.get(lockKey));
  const existingExpiresAt = parseStoredNumber(existingLock.expiresAt, 0);

  if (existingExpiresAt > now) return null;
  if (existingExpiresAt > 0 && existingExpiresAt <= now) {
    try {
      await kv.del(lockKey);
    } catch {
      // Another request may have cleared the stale lock first.
    }
  }

  const supabase = await serviceClient();
  const { error } = await supabase.from('kv_store_7a79873f').insert({
    key: lockKey,
    value: {
      token,
      expiresAt: now + ttlMs,
      createdAt: new Date(now).toISOString(),
    },
  });

  if (error) return null;
  return token;
};

const releaseKvLock = async (lockKey: string, token: string | null) => {
  if (!token) return;
  try {
    const lock = parseStoredJsonObject(await kv.get(lockKey));
    if (lock.token === token) await kv.del(lockKey);
  } catch {
    // Lock cleanup should not mask the work that already succeeded.
  }
};

const withKvLock = async <T,>(lockKey: string, work: () => Promise<T>, ttlMs = MARKETPLACE_ORDER_LOCK_TTL_MS) => {
  const token = await acquireKvLock(lockKey, ttlMs);
  if (!token) {
    const error = new Error('Resource is busy. Please retry in a moment.');
    (error as any).status = 409;
    throw error;
  }

  try {
    return await work();
  } finally {
    await releaseKvLock(lockKey, token);
  }
};

const normalizeMarketplaceOrderItems = (items: unknown) => {
  if (!Array.isArray(items)) return [];

  return items
    .map((item: any) => ({
      id: `${item?.id || crypto.randomUUID()}`,
      productId: `${item?.productId || ''}`,
      name: `${item?.name || ''}`.trim(),
      pointsPrice: Math.max(0, Math.round(parseStoredNumber(item?.pointsPrice, 0))),
      quantity: Math.max(1, Math.round(parseStoredNumber(item?.quantity, 1))),
      color: `${item?.color || 'Default'}`,
      logo: `${item?.logo || 'Default'}`,
    }))
    .filter((item) => item.name);
};

const getPilotMerchPointPrice = (product: Record<string, unknown>, fallback: number) => {
  const text = `${product?.id || ''} ${product?.name || ''} ${product?.category || ''}`.toLowerCase();
  const priceRules: Array<{ pattern: RegExp; points: number }> = [
    { pattern: /bundle[^0-9]*4|bundle\s*\(4\)/, points: 125 },
    { pattern: /bundle[^0-9]*3|bundle\s*\(3\)/, points: 120 },
    { pattern: /bundle[^0-9]*2|bundle\s*\(2\)/, points: 92 },
    { pattern: /backpack/, points: 105 },
    { pattern: /hoodie|fleece|sweatshirt/, points: 85 },
    { pattern: /headphone/, points: 75 },
    { pattern: /bottle/, points: 70 },
    { pattern: /power\s*bank/, points: 63 },
    { pattern: /visor/, points: 50 },
    { pattern: /shirt|tee|t-shirt|tshirt|mug/, points: 47 },
    { pattern: /speaker/, points: 40 },
    { pattern: /charger|charging/, points: 33 },
    { pattern: /usb|flash\s*drive/, points: 25 },
    { pattern: /cap|hat|beanie|headband/, points: 20 },
    { pattern: /tumbler|thermal/, points: 17 },
    { pattern: /tote/, points: 13 },
    { pattern: /keychain|pin|lanyard/, points: 10 },
    { pattern: /pen/, points: 7 },
  ];

  return priceRules.find((rule) => rule.pattern.test(text))?.points ?? fallback;
};

const normalizeMarketplaceProducts = (products: unknown) => {
  if (!Array.isArray(products)) return [];

  return products
    .map((product: any) => {
      const fallbackPrice = Math.max(0, Math.round(parseStoredNumber(product?.pointsPrice, 0)));
      return {
        id: `${product?.id || ''}`.trim(),
        name: `${product?.name || ''}`.trim(),
        description: `${product?.description || ''}`.trim(),
        pointsPrice: getPilotMerchPointPrice(product, fallbackPrice),
        image: `${product?.image || ''}`.trim(),
        sourceUrl: `${product?.sourceUrl || ''}`.trim(),
        variantImages: product?.variantImages && typeof product.variantImages === 'object' && !Array.isArray(product.variantImages)
          ? product.variantImages
          : {},
        category: `${product?.category || 'Merch'}`.trim(),
        colorVariants: normalizeStringArray(product?.colorVariants, ['Default']),
        logoVariants: normalizeStringArray(product?.logoVariants, ['Default']),
        inventory: Math.max(0, Math.round(parseStoredNumber(product?.inventory, 0))),
        featured: product?.featured === true,
        badge: product?.badge === 'HOT' || product?.badge === 'SALE' || product?.badge === 'NEW' ? product.badge : undefined,
        status: product?.status === 'draft' ? 'draft' : 'active',
        updatedAt: `${product?.updatedAt || new Date().toISOString()}`,
      };
    })
    .filter((product) => product.id && product.name);
};

const getMarketplaceCatalog = async () => normalizeMarketplaceProducts(await kv.get(MARKETPLACE_PRODUCTS_KEY));

const saveMarketplaceCatalog = async (products: any[]) => {
  const normalizedProducts = normalizeMarketplaceProducts(products);
  await kv.set(MARKETPLACE_PRODUCTS_KEY, JSON.stringify(normalizedProducts));
  return normalizedProducts;
};

const mergeMarketplaceCatalog = (storedCatalog: any[], seededCatalog: any[]) => {
  if (!seededCatalog.length) return storedCatalog;
  if (!storedCatalog.length) return seededCatalog;

  const storedById = new Map(storedCatalog.map((product: any) => [product.id, product]));
  const seededIds = new Set(seededCatalog.map((product: any) => product.id));
  const mergedSeeded = seededCatalog.map((product: any) => ({
    ...product,
    ...storedById.get(product.id),
  }));
  const customStoredProducts = storedCatalog.filter((product: any) => !seededIds.has(product.id));

  return normalizeMarketplaceProducts([...mergedSeeded, ...customStoredProducts]);
};

const appendPointsTransaction = async ({
  userId,
  amount,
  type,
  source,
  oldBalance,
  newBalance,
  metadata = {},
}: {
  userId: string;
  amount: number;
  type: 'add' | 'subtract';
  source: string;
  oldBalance: number;
  newBalance: number;
  metadata?: Record<string, unknown>;
}) => {
  const historyKey = `${POINTS_HISTORY_PREFIX}${userId}`;
  const history = parseStoredJsonArray(await kv.get(historyKey));
  const createdAt = new Date().toISOString();
  const transaction = {
    id: crypto.randomUUID(),
    type,
    amount,
    source,
    oldBalance,
    newBalance,
    createdAt,
    ...metadata,
  };

  await kv.set(historyKey, JSON.stringify([transaction, ...history].slice(0, 250)));
  return transaction;
};

const addPointsToUser = async ({
  userId,
  amount,
  source,
  metadata = {},
}: {
  userId: string;
  amount: number;
  source: string;
  metadata?: Record<string, unknown>;
}) => {
  const pointsKey = `user_points:${userId}`;
  const currentPoints = parseStoredNumber(await kv.get(pointsKey), DEFAULT_USER_POINTS);
  const pointsAwarded = getCappedPointAward(currentPoints, amount);
  const newTotalPoints = currentPoints + pointsAwarded;

  if (pointsAwarded <= 0) {
    return { pointsAwarded: 0, newTotalPoints: currentPoints, transaction: null };
  }

  const transaction = await appendPointsTransaction({
    userId,
    type: 'add',
    amount: pointsAwarded,
    source,
    oldBalance: currentPoints,
    newBalance: newTotalPoints,
    metadata,
  });

  await kv.set(pointsKey, newTotalPoints.toString());

  return { pointsAwarded, newTotalPoints, transaction };
};

const getUniqueAcceptedInvitees = (history: any[]) => {
  const invitees = new Set<string>();
  history.forEach((invite) => {
    if (invite?.status !== 'accepted') return;
    const invitee = `${invite?.inviteeId || invite?.inviteeEmail || invite?.contact || ''}`.trim();
    if (invitee) invitees.add(invitee);
  });
  return invitees;
};

const awardTeamMilestonePoints = async (userId: string, acceptedCount: number) => {
  const milestoneKey = `${TEAM_MILESTONES_PREFIX}${userId}`;
  const milestones = parseStoredJsonObject(await kv.get(milestoneKey));
  const awards: Array<{ milestone: 'team-of-3' | 'team-of-5'; points: number }> = [];

  if (acceptedCount >= 3 && milestones.teamOf3 !== true) {
    awards.push({ milestone: 'team-of-3', points: TEAM_OF_THREE_POINTS });
    milestones.teamOf3 = true;
  }

  if (acceptedCount >= 5 && milestones.teamOf5 !== true) {
    awards.push({ milestone: 'team-of-5', points: TEAM_OF_FIVE_POINTS });
    milestones.teamOf5 = true;
  }

  if (!awards.length) return { pointsAwarded: 0, awards: [], newTotalPoints: null };

  const totalMilestonePoints = awards.reduce((sum, award) => sum + award.points, 0);
  const result = await addPointsToUser({
    userId,
    amount: totalMilestonePoints,
    source: 'team-milestone',
    metadata: {
      awards,
      acceptedCount,
    },
  });

  await kv.set(milestoneKey, {
    ...milestones,
    acceptedCount,
    updatedAt: new Date().toISOString(),
  });

  return {
    pointsAwarded: result.pointsAwarded,
    awards,
    newTotalPoints: result.newTotalPoints,
    transaction: result.transaction,
  };
};

const awardInviteeActivationPoints = async (inviteeId: string) => {
  const referrerKey = `${INVITEE_ACTIVATION_REFERRER_PREFIX}${inviteeId}`;
  const awardedKey = `${INVITEE_ACTIVATION_AWARDED_PREFIX}${inviteeId}`;
  const referrer = parseStoredJsonObject(await kv.get(referrerKey));
  const inviterId = `${referrer.inviterId || ''}`.trim();

  if (!inviterId || inviterId === inviteeId || await kv.get(awardedKey)) return null;

  const result = await addPointsToUser({
    userId: inviterId,
    amount: INVITEE_ACTIVATION_POINTS,
    source: 'invitee-activation',
    metadata: {
      inviteeId,
      promptId: referrer.promptId,
    },
  });

  await kv.set(awardedKey, {
    inviterId,
    inviteeId,
    pointsAwarded: result.pointsAwarded,
    createdAt: new Date().toISOString(),
  });

  return result;
};

const awardNetworkFollowPoints = async ({
  userId,
  targetProfileId,
  isMutual,
}: {
  userId: string;
  targetProfileId: string;
  isMutual: boolean;
}) => {
  const pointsStateKey = `${NETWORK_POINTS_PREFIX}${userId}`;
  const today = new Date().toISOString().slice(0, 10);
  const pointsState = parseStoredJsonObject(await kv.get(pointsStateKey));
  const events = parseStoredJsonObject(pointsState.events);
  const daily = parseStoredJsonObject(pointsState.daily);
  const todayPoints = daily.date === today ? parseStoredNumber(daily.points, 0) : 0;
  const totalPoints = parseStoredNumber(pointsState.total, 0);
  const requestedAwards: Array<{ eventKey: string; points: number; source: string }> = [];

  const followEventKey = `follow:${targetProfileId}`;
  if (events[followEventKey] !== true) {
    requestedAwards.push({ eventKey: followEventKey, points: FOLLOW_ACCEPTED_POINTS, source: 'follow-accepted' });
  }

  const mutualEventKey = `mutual:${targetProfileId}`;
  if (isMutual && events[mutualEventKey] !== true) {
    requestedAwards.push({ eventKey: mutualEventKey, points: MUTUAL_FOLLOW_POINTS, source: 'mutual-follow' });
  }

  const requestedPoints = requestedAwards.reduce((sum, award) => sum + award.points, 0);
  const remainingDailyPoints = Math.max(0, MAX_FOLLOW_POINTS_PER_DAY - todayPoints);
  const remainingTotalPoints = Math.max(0, MAX_FOLLOW_POINTS_TOTAL - totalPoints);
  const pointsToAward = Math.min(requestedPoints, remainingDailyPoints, remainingTotalPoints);

  if (pointsToAward <= 0) {
    return { pointsAwarded: 0, newTotalPoints: null, events };
  }

  let remaining = pointsToAward;
  const awardedEvents: Array<{ eventKey: string; points: number; source: string }> = [];
  for (const award of requestedAwards) {
    if (remaining <= 0) break;
    const eventPoints = Math.min(award.points, remaining);
    awardedEvents.push({ ...award, points: eventPoints });
    events[award.eventKey] = true;
    remaining -= eventPoints;
  }

  const result = await addPointsToUser({
    userId,
    amount: pointsToAward,
    source: awardedEvents.some((event) => event.source === 'mutual-follow') ? 'mutual-follow' : 'follow-accepted',
    metadata: {
      targetProfileId,
      isMutual,
      awardedEvents,
    },
  });

  await kv.set(pointsStateKey, {
    total: totalPoints + result.pointsAwarded,
    daily: {
      date: today,
      points: todayPoints + result.pointsAwarded,
    },
    events,
    updatedAt: new Date().toISOString(),
  });

  return {
    pointsAwarded: result.pointsAwarded,
    newTotalPoints: result.newTotalPoints,
    transaction: result.transaction,
    events,
  };
};

const formatMarketplaceAddress = (address: any) => [
  address?.addressLine1,
  address?.addressLine2,
  [address?.city, address?.region, address?.postalCode].filter(Boolean).join(' '),
  address?.country,
].filter(Boolean).join(', ');

const getUserDisplayName = (user: any, fallbackName = '') => (
  user?.user_metadata?.name ||
  user?.user_metadata?.full_name ||
  user?.user_metadata?.user_name ||
  user?.user_metadata?.preferred_username ||
  fallbackName ||
  user?.email?.split('@')[0] ||
  'Moneetize User'
);

const formatUserHandle = (name: string) => {
  const cleanedName = `${name || ''}`.trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
  return cleanedName ? `@${cleanedName}` : '@moneetize';
};

const normalizeStringArray = (value: unknown, fallback: string[] = []) => (
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string').slice(0, 25)
    : fallback
);

const normalizeProfileSettings = (settings: any, user: any = {}) => {
  const source = settings && typeof settings === 'object' ? settings : {};
  const name = `${source.name || getUserDisplayName(user)}`.trim() || 'Moneetize User';
  const handle = `${source.handle || formatUserHandle(name)}`.trim();
  const completedAt = typeof source.completedAt === 'string'
    ? source.completedAt
    : source.profileComplete === true
      ? new Date().toISOString()
      : '';

  return {
    name,
    handle: handle.startsWith('@') ? handle : `@${handle}`,
    email: `${source.email || user?.email || ''}`.trim().toLowerCase(),
    photo: `${source.photo || ''}`.trim(),
    selectedAvatar: `${source.selectedAvatar || 'blueAvatar'}`.trim(),
    interests: normalizeStringArray(source.interests),
    investmentProfile: `${source.investmentProfile || ''}`.trim(),
    tags: normalizeStringArray(source.tags),
    agentName: `${source.agentName || 'My AI Agent'}`.trim(),
    profileComplete: source.profileComplete === true,
    completedAt,
    updatedAt: new Date().toISOString(),
  };
};

const normalizeFollowStates = (value: unknown) => {
  const source = value && typeof value === 'object' && !Array.isArray(value)
    ? (value as any).states || value
    : {};

  return Object.entries(source as Record<string, unknown>).reduce((states, [profileId, following]) => {
    if (profileId) states[profileId] = following === true;
    return states;
  }, {} as Record<string, boolean>);
};

const normalizeChatThreadId = (threadId: string) => (
  `${threadId || ''}`.trim().replace(/[^a-zA-Z0-9:_-]+/g, '_').slice(0, 180) || 'general'
);

const normalizeChatMessage = (message: any, currentUser: any) => {
  const createdAt = typeof message?.createdAt === 'string' ? message.createdAt : new Date().toISOString();
  const senderId = `${message?.senderId || currentUser?.id || 'current-user'}`;
  const senderName = `${message?.senderName || getUserDisplayName(currentUser, 'You')}`.trim();
  const content = `${message?.content || ''}`.trim().slice(0, 4000);

  return {
    id: `${message?.id || crypto.randomUUID()}`,
    senderId,
    senderName,
    senderAvatar: `${message?.senderAvatar || ''}`.trim(),
    content,
    timestamp: `${message?.timestamp || new Date(createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`,
    createdAt,
    role: message?.role === 'agent' || message?.role === 'member' || message?.role === 'system' ? message.role : 'user',
  };
};

const upsertChatThreadIndex = async (userId: string, thread: Record<string, unknown>) => {
  const indexKey = `${CHAT_INDEX_PREFIX}${userId}`;
  const currentThreads = parseStoredJsonArray(await kv.get(indexKey));
  const threadId = `${thread.threadId || ''}`;
  if (!threadId) return currentThreads;

  const updatedThread = {
    threadId,
    type: `${thread.type || (threadId.startsWith('agent:') ? 'agent' : threadId.startsWith('team:') ? 'team' : 'member')}`,
    name: `${thread.name || 'Chat'}`,
    handle: `${thread.handle || ''}`,
    avatar: `${thread.avatar || ''}`,
    lastMessage: `${thread.lastMessage || ''}`.slice(0, 220),
    lastMessageAt: `${thread.lastMessageAt || new Date().toISOString()}`,
    updatedAt: new Date().toISOString(),
  };
  const nextThreads = [
    updatedThread,
    ...currentThreads.filter((existingThread: any) => existingThread?.threadId !== threadId),
  ].slice(0, 100);

  await kv.set(indexKey, JSON.stringify(nextThreads));
  return nextThreads;
};

const createAgentFallbackReply = (prompt: string) => {
  const createdAt = new Date().toISOString();
  const lowerPrompt = prompt.toLowerCase();
  const content = lowerPrompt.includes('invest') || lowerPrompt.includes('market') || lowerPrompt.includes('stock') || lowerPrompt.includes('crypto')
    ? 'Tell me your goal, timeline, and risk comfort. I can help compare the tradeoffs, explain market terms, and turn the options into a clear next-step checklist.'
    : 'Tell me what you want to work through. I can help with money questions, rewards, marketplace redemptions, profile setup, and launch-team strategy.';

  return {
    id: crypto.randomUUID(),
    senderId: 'agent',
    senderName: 'Your Agent',
    content,
    timestamp: new Date(createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    createdAt,
    role: 'agent',
  };
};

const extractOpenAIResponseText = (data: any) => {
  if (typeof data?.output_text === 'string' && data.output_text.trim()) return data.output_text.trim();

  const textParts: string[] = [];
  if (Array.isArray(data?.output)) {
    data.output.forEach((item: any) => {
      if (Array.isArray(item?.content)) {
        item.content.forEach((part: any) => {
          if (typeof part?.text === 'string') textParts.push(part.text);
          if (typeof part?.content === 'string') textParts.push(part.content);
        });
      }
    });
  }

  return textParts.join('\n').trim();
};

const createAgentOpenAIReply = async (messages: any[], prompt: string) => {
  const openAiApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAiApiKey) return createAgentFallbackReply(prompt);

  try {
    const recentMessages = messages.slice(-12).map((message) => ({
      role: message.role === 'user' ? 'user' : 'assistant',
      content: `${message.content || ''}`.slice(0, 4000),
    })).filter((message) => message.content.trim());

    const modelCandidates = [
      `${Deno.env.get('OPENAI_MODEL') || ''}`.trim(),
      'gpt-4o',
      'gpt-4o-mini',
    ].filter((model, index, models) => model && models.indexOf(model) === index);
    const agentInstructions = [
      'You are the Moneetize personal AI agent.',
      'Respond naturally and directly, like a helpful ChatGPT-style assistant inside the app.',
      'Help with budgeting, markets, investing concepts, portfolio thinking, rewards, merch redemption, invites, profile setup, and app navigation.',
      'For financial topics, be useful and concrete: explain options, risks, tradeoffs, and questions to ask. Do not promise returns, invent live prices, or claim to be a licensed advisor.',
      'Keep caveats brief and only when they matter. Avoid repetitive warnings, alarmist language, and canned disclaimers.',
      'Use concise paragraphs, ask follow-up questions only when needed, and keep the conversation moving.',
    ].join(' ');

    let data: any = null;
    let lastOpenAiError = '';

    for (const model of modelCandidates) {
      const response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openAiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          input: [
            {
              role: 'system',
              content: agentInstructions,
            },
            ...recentMessages,
          ],
          max_output_tokens: 900,
        }),
      });

      if (response.ok) {
        data = await response.json();
        break;
      }

      lastOpenAiError = await response.text();
      console.error('OpenAI agent response failed for model:', model, lastOpenAiError);
    }

    if (!data) {
      console.error('OpenAI agent response failed for all configured models:', lastOpenAiError);
      return createAgentFallbackReply(prompt);
    }

    const content = extractOpenAIResponseText(data) || createAgentFallbackReply(prompt).content;
    const createdAt = new Date().toISOString();

    return {
      id: crypto.randomUUID(),
      senderId: 'agent',
      senderName: 'Your Agent',
      content,
      timestamp: new Date(createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      createdAt,
      role: 'agent',
    };
  } catch (error) {
    console.error('OpenAI agent response failed:', error);
    return createAgentFallbackReply(prompt);
  }
};

const queueEmailNotification = async (email: Record<string, unknown>) => {
  const queuedNotifications = parseStoredJsonArray(await kv.get(EMAIL_QUEUE_KEY));
  const notification = {
    id: crypto.randomUUID(),
    ...email,
    queuedAt: new Date().toISOString(),
  };

  await kv.set(EMAIL_QUEUE_KEY, JSON.stringify([notification, ...queuedNotifications].slice(0, QUEUE_LIMIT)));

  return notification;
};

const dispatchEmailNotification = async (email: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) => {
  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  const fromEmail = Deno.env.get('MONEETIZE_EMAIL_FROM') || 'Moneetize <onboarding@resend.dev>';

  if (!resendApiKey) {
    await queueEmailNotification({ ...email, status: 'queued', reason: 'RESEND_API_KEY is not configured' });
    return { status: 'queued' as const };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'moneetize-pregame/1.0',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: email.to,
        subject: email.subject,
        html: email.html,
        text: email.text,
      }),
    });

    if (!response.ok) {
      const details = await response.text();
      await queueEmailNotification({ ...email, status: 'failed', error: details });
      return { status: 'failed' as const, error: details };
    }

    return { status: 'sent' as const };
  } catch (error) {
    await queueEmailNotification({
      ...email,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown email error',
    });
    return { status: 'failed' as const, error: error instanceof Error ? error.message : 'Unknown email error' };
  }
};

const queueSmsNotification = async (sms: Record<string, unknown>) => {
  const queuedNotifications = parseStoredJsonArray(await kv.get(SMS_QUEUE_KEY));
  const notification = {
    id: crypto.randomUUID(),
    ...sms,
    queuedAt: new Date().toISOString(),
  };

  await kv.set(SMS_QUEUE_KEY, JSON.stringify([notification, ...queuedNotifications].slice(0, QUEUE_LIMIT)));
  return notification;
};

const toHex = (buffer: ArrayBuffer) => [...new Uint8Array(buffer)]
  .map((byte) => byte.toString(16).padStart(2, '0'))
  .join('');

const sha256Hex = async (value: string) => toHex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)));

const hmacRaw = async (key: string | Uint8Array, value: string) => {
  const keyBytes = typeof key === 'string' ? new TextEncoder().encode(key) : key;
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(value));
  return new Uint8Array(signature);
};

const hmacHex = async (key: Uint8Array, value: string) => toHex(await hmacRaw(key, value));

const getAwsSignatureKey = async (secretKey: string, dateStamp: string, region: string, service: string) => {
  const dateKey = await hmacRaw(`AWS4${secretKey}`, dateStamp);
  const dateRegionKey = await hmacRaw(dateKey, region);
  const dateRegionServiceKey = await hmacRaw(dateRegionKey, service);
  return hmacRaw(dateRegionServiceKey, 'aws4_request');
};

const formatAwsDate = (date = new Date()) => {
  const iso = date.toISOString().replace(/[:-]|\.\d{3}/g, '');
  return {
    amzDate: iso,
    dateStamp: iso.slice(0, 8),
  };
};

const addSnsStringAttribute = (
  params: URLSearchParams,
  index: number,
  name: string,
  value: string,
) => {
  params.set(`MessageAttributes.entry.${index}.Name`, name);
  params.set(`MessageAttributes.entry.${index}.Value.DataType`, 'String');
  params.set(`MessageAttributes.entry.${index}.Value.StringValue`, value);
  return index + 1;
};

const normalizeSnsOriginationNumber = (value: string) => {
  const cleaned = `${value || ''}`.trim().replace(/[^\d+]/g, '');
  if (!cleaned) return '';
  const normalized = cleaned.startsWith('+')
    ? `+${cleaned.replace(/\D/g, '')}`
    : cleaned.replace(/\D/g, '');

  return /^\+?\d{5,14}$/.test(normalized) ? normalized : '';
};

const getSnsSmsType = () => {
  const configuredType = `${Deno.env.get('AWS_SNS_SMS_TYPE') || ''}`.trim();
  return configuredType === 'Promotional' || configuredType === 'Transactional'
    ? configuredType
    : 'Transactional';
};

const buildSnsPublishBody = (phoneNumber: string, message: string) => {
  const params = new URLSearchParams();
  params.set('Action', 'Publish');
  params.set('Version', '2010-03-31');
  params.set('PhoneNumber', phoneNumber);
  params.set('Message', message);
  let attributeIndex = addSnsStringAttribute(params, 1, 'AWS.SNS.SMS.SMSType', getSnsSmsType());

  const originationNumber = normalizeSnsOriginationNumber(
    `${Deno.env.get('AWS_SNS_SMS_ORIGINATION_NUMBER') || Deno.env.get('AWS_MM_SMS_ORIGINATION_NUMBER') || ''}`,
  );
  if (originationNumber) {
    attributeIndex = addSnsStringAttribute(params, attributeIndex, 'AWS.MM.SMS.OriginationNumber', originationNumber);
  }

  const senderId = `${Deno.env.get('AWS_SNS_SMS_SENDER_ID') || ''}`.trim();
  if (senderId) {
    attributeIndex = addSnsStringAttribute(params, attributeIndex, 'AWS.SNS.SMS.SenderID', senderId.slice(0, 11));
  }

  const maxPrice = `${Deno.env.get('AWS_SNS_SMS_MAX_PRICE') || Deno.env.get('AWS_SNS_SMS_MAX_PRICE_USD') || ''}`.trim();
  if (maxPrice && /^\d+(\.\d{1,4})?$/.test(maxPrice)) {
    addSnsStringAttribute(params, attributeIndex, 'AWS.SNS.SMS.MaxPrice', maxPrice);
  }

  return params.toString();
};

const getTwilioSender = () => {
  const messagingServiceSid = `${Deno.env.get('TWILIO_MESSAGING_SERVICE_SID') || ''}`.trim();
  const fromNumber = normalizePhoneNumber(
    `${Deno.env.get('TWILIO_FROM_NUMBER') || Deno.env.get('TWILIO_PHONE_NUMBER') || ''}`,
  );

  return { messagingServiceSid, fromNumber };
};

const dispatchTwilioSmsNotification = async (sms: {
  to: string;
  message: string;
}) => {
  const phoneNumber = normalizePhoneNumber(sms.to);
  const accountSid = `${Deno.env.get('TWILIO_ACCOUNT_SID') || ''}`.trim();
  const authToken = `${Deno.env.get('TWILIO_AUTH_TOKEN') || ''}`.trim();
  const { messagingServiceSid, fromNumber } = getTwilioSender();

  if (!phoneNumber) {
    await queueSmsNotification({ ...sms, status: 'failed', provider: 'twilio', reason: 'Invalid E.164 phone number' });
    return { status: 'failed' as const, provider: 'twilio', error: 'Invalid E.164 phone number' };
  }

  if (!accountSid || !authToken || (!messagingServiceSid && !fromNumber)) {
    await queueSmsNotification({
      ...sms,
      to: phoneNumber,
      status: 'queued',
      provider: 'twilio',
      reason: 'Twilio credentials or sender are not configured',
    });
    return { status: 'queued' as const, provider: 'twilio' };
  }

  const params = new URLSearchParams();
  params.set('To', phoneNumber);
  params.set('Body', sms.message.slice(0, 1500));

  if (messagingServiceSid) {
    params.set('MessagingServiceSid', messagingServiceSid);
  } else {
    params.set('From', fromNumber);
  }

  try {
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      },
      body: params.toString(),
    });
    const details = await response.text();
    const parsed = (() => {
      try {
        return details ? JSON.parse(details) : {};
      } catch {
        return {};
      }
    })();

    if (!response.ok) {
      const errorMessage = `${parsed?.message || details || response.statusText || 'Twilio SMS delivery failed'}`;
      await queueSmsNotification({ ...sms, to: phoneNumber, status: 'failed', provider: 'twilio', error: errorMessage });
      return { status: 'failed' as const, provider: 'twilio', error: errorMessage };
    }

    const messageId = `${parsed?.sid || ''}`;
    await queueSmsNotification({ ...sms, to: phoneNumber, status: 'sent', provider: 'twilio', messageId });
    return { status: 'sent' as const, provider: 'twilio', messageId };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown Twilio SMS error';
    await queueSmsNotification({
      ...sms,
      to: phoneNumber,
      status: 'failed',
      provider: 'twilio',
      error: errorMessage,
    });
    return { status: 'failed' as const, provider: 'twilio', error: errorMessage };
  }
};

const dispatchSmsNotification = async (sms: {
  to: string;
  message: string;
}) => {
  const phoneNumber = normalizePhoneNumber(sms.to);

  if (!phoneNumber) {
    await queueSmsNotification({ ...sms, status: 'failed', provider: 'twilio', reason: 'Invalid E.164 phone number' });
    return { status: 'failed' as const, provider: 'twilio', error: 'Invalid E.164 phone number' };
  }

  return dispatchTwilioSmsNotification({ ...sms, to: phoneNumber });
};

const publicScratchTicket = (ticket: typeof scratchTickets[number]) => {
  const { weight: _weight, reward: _reward, ...publicTicket } = ticket;
  return publicTicket;
};

const createScratchRewardItems = (ticket: typeof scratchTickets[number], reward = ticket.reward) => {
  const rewardItems: Array<Record<string, unknown>> = [
    {
      id: `${ticket.id}-points`,
      type: 'points',
      label: 'Participation Score',
      amount: reward.participationScore,
      unit: 'score',
      icon: 'gem',
    },
    {
      id: `${ticket.id}-wild-card`,
      type: 'wildcard',
      label: reward.wildCard.name,
      description: reward.wildCard.description,
      icon: 'wildcard',
    },
    {
      id: `${ticket.id}-tripto`,
      type: 'tripto',
      label: 'Tripto (Locked)',
      amount: reward.triptoPoints,
      unit: 'Tripto',
      icon: 'tripto',
    },
  ];

  if (reward.usdt > 0) {
    rewardItems.splice(2, 0, {
      id: `${ticket.id}-usdt`,
      type: 'usdt',
      label: 'USDT (Locked)',
      amount: reward.usdt,
      unit: 'USDT',
      icon: 'usdt',
    });
  }

  const bonusChance = reward.participationLevel >= 5
    ? 100
    : reward.participationLevel === 4
      ? 70
      : reward.participationLevel === 3
        ? 45
        : reward.participationLevel === 2
          ? 25
          : 15;

  if (randomInt(100) < bonusChance) {
    rewardItems.splice(1, 0, {
      id: `${ticket.id}-moneetize-shirt`,
      type: 'merch',
      label: 'Moneetize Merch',
      description: 'Launch team merch reward',
      icon: 'shirt',
    });
  }

  return rewardItems;
};

const isAdminMetadata = (metadata?: Record<string, unknown>) => {
  if (!metadata) return false;

  const roles = [
    metadata.role,
    metadata.app_role,
    ...(Array.isArray(metadata.roles) ? metadata.roles : []),
  ];

  return (
    metadata.isAdmin === true ||
    `${metadata.isAdmin}`.toLowerCase() === 'true' ||
    roles.some(role => `${role}`.toLowerCase() === 'admin')
  );
};

const isNetworkVisibleUser = (user: any, currentUserId = '') => {
  const email = `${user?.email || ''}`.trim().toLowerCase();

  if (!user?.id || user.id === currentUserId) return false;
  if (email === ADMIN_NOTIFICATION_EMAIL || email.startsWith('admin@')) return false;
  if (isAdminMetadata(user.user_metadata) || isAdminMetadata(user.app_metadata)) return false;

  return true;
};

const requireAdmin = async (c: any) => {
  const accessToken = getUserAccessToken(c);

  if (!accessToken) {
    return { response: c.json({ success: false, error: 'User token required' }, 401) };
  }

  const user = await auth.verifyToken(accessToken);

  if (!user) {
    return { response: c.json({ success: false, error: 'Unauthorized' }, 401) };
  }

  if (!isAdminMetadata(user.user_metadata) && !isAdminMetadata(user.app_metadata)) {
    return { response: c.json({ success: false, error: 'Admin access required' }, 403) };
  }

  return { user };
};

// Authentication Routes
app.post("/make-server-7a79873f/auth/signup", async (c) => {
  try {
    const body = await c.req.json();
    console.log('Signup endpoint - received body:', JSON.stringify(body));
    const result = await auth.signup(body);

    if (result.success && result.data?.user?.id) {
      const settings = normalizeProfileSettings({
        name: body?.name || result.data.user.name,
        email: body?.email || result.data.user.email,
        profileComplete: false,
      }, result.data.user);

      await Promise.all([
        kv.set(`${PROFILE_SETTINGS_PREFIX}${result.data.user.id}`, settings),
        kv.set(`${SCRATCH_CREDITS_PREFIX}${result.data.user.id}`, INITIAL_SCRATCH_CREDITS.toString()),
      ]);
    }

    return c.json(result, result.status);
  } catch (error) {
    console.error('Signup endpoint error - failed to parse body:', error);
    return c.json({ success: false, error: 'Invalid request body - please provide valid JSON' }, 400);
  }
});

app.post("/make-server-7a79873f/auth/login", async (c) => {
  try {
    const body = await c.req.json();
    console.log('Login endpoint - received body:', JSON.stringify(body));
    const result = await auth.login(body);
    return c.json(result, result.status);
  } catch (error) {
    console.error('Login endpoint error - failed to parse body:', error);
    return c.json({ success: false, error: 'Invalid request body - please provide valid JSON' }, 400);
  }
});

app.get("/make-server-7a79873f/auth/profile", async (c) => {
  try {
    const accessToken = getUserAccessToken(c);
    
    console.log('Profile endpoint - has token:', !!accessToken);
    
    if (!accessToken) {
      return c.json({ success: false, error: 'User token required' }, 401);
    }
    
    const result = await auth.getProfile(accessToken);
    return c.json(result, result.status);
  } catch (error) {
    console.error('Profile endpoint error:', error);
    return c.json({ success: false, error: 'Failed to fetch profile' }, 500);
  }
});

app.post("/make-server-7a79873f/auth/update-profile", async (c) => {
  try {
    const accessToken = getUserAccessToken(c);
    
    console.log('Update profile endpoint - has token:', !!accessToken);
    
    if (!accessToken) {
      return c.json({ success: false, error: 'User token required' }, 401);
    }
    
    const body = await c.req.json();
    console.log('Update profile endpoint - received body:', JSON.stringify(body));
    
    const result = await auth.updateProfile(accessToken, body);
    return c.json(result, result.status);
  } catch (error) {
    console.error('Update profile endpoint error:', error);
    return c.json({ success: false, error: 'Failed to update profile' }, 500);
  }
});

// Persisted profile settings routes
app.get("/make-server-7a79873f/profile/settings", async (c) => {
  try {
    const currentUser = await verifyCurrentUser(c);
    if ('response' in currentUser) return currentUser.response;

    const storedSettings = await kv.get(`${PROFILE_SETTINGS_PREFIX}${currentUser.user.id}`);

    return c.json({
      success: true,
      data: {
        settings: storedSettings ? normalizeProfileSettings(storedSettings, currentUser.user) : null,
      },
    }, 200);
  } catch (error) {
    console.error('Profile settings load endpoint error:', error);
    return c.json({ success: false, error: 'Failed to load profile settings' }, 500);
  }
});

app.put("/make-server-7a79873f/profile/settings", async (c) => {
  try {
    const currentUser = await verifyCurrentUser(c);
    if ('response' in currentUser) return currentUser.response;

    const body = await c.req.json();
    const settings = normalizeProfileSettings(body?.settings || body, currentUser.user);
    const requestedHandle = settings.handle.trim().toLowerCase();

    if (settings.photo && settings.photo.length > MAX_PROFILE_PHOTO_LENGTH) {
      return c.json({
        success: false,
        error: 'Profile photo is too large. Choose a smaller image or try again.',
      }, 413);
    }

    const usersResult = await auth.listAllUsers();

    if (usersResult.success && usersResult.data?.users) {
      for (const user of usersResult.data.users) {
        if (user.id === currentUser.user.id) continue;

        const existingSettings = await kv.get(`${PROFILE_SETTINGS_PREFIX}${user.id}`);
        if (!existingSettings) continue;

        const existingHandle = normalizeProfileSettings(existingSettings, user).handle.trim().toLowerCase();
        if (existingHandle && existingHandle === requestedHandle) {
          return c.json({
            success: false,
            error: `${settings.handle} is already in use. Choose another handle.`,
          }, 409);
        }
      }
    }

    await kv.set(`${PROFILE_SETTINGS_PREFIX}${currentUser.user.id}`, settings);

    const profileUpdateResult = await auth.updateProfile(getUserAccessToken(c), { name: settings.name });
    if (!profileUpdateResult.success) {
      console.warn('Supabase auth metadata sync skipped after profile settings save:', profileUpdateResult.error);
    }

    return c.json({
      success: true,
      data: {
        settings,
      },
    }, 200);
  } catch (error) {
    console.error('Profile settings save endpoint error:', error);
    return c.json({ success: false, error: 'Failed to save profile settings' }, 500);
  }
});

// Product catalog routes
app.get("/make-server-7a79873f/products", async (c) => {
  try {
    const products = await kv.get(PRODUCTS_KEY);

    return c.json({
      success: true,
      data: {
        products: Array.isArray(products) ? products : []
      }
    }, 200);
  } catch (error) {
    console.error('List products endpoint error:', error);
    return c.json({ success: false, error: 'Failed to load products' }, 500);
  }
});

app.put("/make-server-7a79873f/products", async (c) => {
  try {
    const admin = await requireAdmin(c);
    if ('response' in admin) return admin.response;

    const body = await c.req.json();
    const products = body?.products;

    if (!Array.isArray(products)) {
      return c.json({ success: false, error: 'Products array is required' }, 400);
    }

    await kv.set(PRODUCTS_KEY, products);

    return c.json({
      success: true,
      data: {
        products,
        total: products.length
      }
    }, 200);
  } catch (error) {
    console.error('Save products endpoint error:', error);
    return c.json({ success: false, error: 'Failed to save products' }, 500);
  }
});

app.post("/make-server-7a79873f/products", async (c) => {
  try {
    const admin = await requireAdmin(c);
    if ('response' in admin) return admin.response;

    const body = await c.req.json();
    const product = body?.product;

    if (!product?.id || !product?.name) {
      return c.json({ success: false, error: 'Product id and name are required' }, 400);
    }

    const currentProducts = await kv.get(PRODUCTS_KEY);
    const products = Array.isArray(currentProducts) ? currentProducts : [];
    const nextProducts = [...products.filter((item: any) => item.id !== product.id), product];

    await kv.set(PRODUCTS_KEY, nextProducts);

    return c.json({
      success: true,
      data: {
        product,
        products: nextProducts,
        total: nextProducts.length
      }
    }, 201);
  } catch (error) {
    console.error('Create product endpoint error:', error);
    return c.json({ success: false, error: 'Failed to save product' }, 500);
  }
});

app.delete("/make-server-7a79873f/products/:productId", async (c) => {
  try {
    const admin = await requireAdmin(c);
    if ('response' in admin) return admin.response;

    const productId = c.req.param('productId');

    if (!productId) {
      return c.json({ success: false, error: 'Product ID is required' }, 400);
    }

    const currentProducts = await kv.get(PRODUCTS_KEY);
    const products = Array.isArray(currentProducts) ? currentProducts : [];
    const nextProducts = products.filter((item: any) => item.id !== productId);

    await kv.set(PRODUCTS_KEY, nextProducts);

    return c.json({
      success: true,
      data: {
        productId,
        products: nextProducts,
        total: nextProducts.length
      }
    }, 200);
  } catch (error) {
    console.error('Delete product endpoint error:', error);
    return c.json({ success: false, error: 'Failed to delete product' }, 500);
  }
});

// Network profile routes
app.get("/make-server-7a79873f/network/recommended-friends", async (c) => {
  try {
    const storedFriends = await kv.get(RECOMMENDED_FRIENDS_KEY);
    const profiles = Array.isArray(storedFriends) && storedFriends.length > 0
      ? storedFriends
      : defaultRecommendedFriends;

    if (!Array.isArray(storedFriends) || storedFriends.length === 0) {
      await kv.set(RECOMMENDED_FRIENDS_KEY, defaultRecommendedFriends);
    }

    return c.json({
      success: true,
      data: {
        profiles,
        total: profiles.length,
      },
    }, 200);
  } catch (error) {
    console.error('Recommended friends endpoint error:', error);
    return c.json({ success: false, error: 'Failed to load recommended friends' }, 500);
  }
});

app.get("/make-server-7a79873f/network/profiles", async (c) => {
  try {
    const currentUserId = c.req.query('current_user_id') || '';
    const result = await auth.listAllUsers();
    if (!result.success || !result.data?.users) {
      return c.json({ success: false, error: result.error || 'Failed to load network profiles' }, result.status || 500);
    }

    const allFollowRecords = await kv.getByPrefix(NETWORK_FOLLOWS_PREFIX);

    const profiles = await Promise.all(
      result.data.users
        .filter((user: any) => isNetworkVisibleUser(user, currentUserId))
        .map(async (user: any, index: number) => {
          const [storedPoints, storedSettings, storedFollowRecord] = await Promise.all([
            kv.get(`user_points:${user.id}`),
            kv.get(`${PROFILE_SETTINGS_PREFIX}${user.id}`),
            kv.get(`${NETWORK_FOLLOWS_PREFIX}${user.id}`),
          ]);
          const settings = normalizeProfileSettings(storedSettings || {}, user);
          const userFollowStates = normalizeFollowStates(storedFollowRecord);
          const followers = allFollowRecords.filter((record) => normalizeFollowStates(record)[user.id]).length;
          const followsMe = currentUserId ? Boolean(userFollowStates[currentUserId]) : false;

          return {
            id: user.id,
            name: settings.name,
            handle: settings.handle || formatUserHandle(settings.name || `member${index + 1}`),
            bio: 'Moneetize prelaunch member',
            avatar: settings.photo || '',
            interests: settings.interests || [],
            followers,
            following: Object.values(userFollowStates).filter(Boolean).length,
            followsMe,
            points: parseStoredNumber(storedPoints, DEFAULT_USER_POINTS),
          };
        }),
    );

    return c.json({
      success: true,
      data: {
        profiles,
        total: profiles.length,
      },
    }, 200);
  } catch (error) {
    console.error('Network profiles endpoint error:', error);
    return c.json({ success: false, error: 'Failed to load network profiles' }, 500);
  }
});

app.get("/make-server-7a79873f/network/follows", async (c) => {
  try {
    const currentUser = await verifyCurrentUser(c);
    if ('response' in currentUser) return currentUser.response;

    const storedFollowRecord = await kv.get(`${NETWORK_FOLLOWS_PREFIX}${currentUser.user.id}`);

    return c.json({
      success: true,
      data: {
        states: normalizeFollowStates(storedFollowRecord),
      },
    }, 200);
  } catch (error) {
    console.error('Network follows load endpoint error:', error);
    return c.json({ success: false, error: 'Failed to load network follows' }, 500);
  }
});

app.put("/make-server-7a79873f/network/follows", async (c) => {
  try {
    const currentUser = await verifyCurrentUser(c);
    if ('response' in currentUser) return currentUser.response;

    const body = await c.req.json();
    const targetProfileId = `${body?.targetProfileId || ''}`.trim();

    if (!targetProfileId) {
      return c.json({ success: false, error: 'Target profile id is required' }, 400);
    }

    const followKey = `${NETWORK_FOLLOWS_PREFIX}${currentUser.user.id}`;
    const currentStates = normalizeFollowStates(await kv.get(followKey));
    const wasFollowing = currentStates[targetProfileId] === true;
    const nextFollowing = body?.following === true;
    const nextStates = {
      ...currentStates,
      [targetProfileId]: nextFollowing,
    };
    let pointsAward = null;

    if (!wasFollowing && nextFollowing && targetProfileId !== currentUser.user.id) {
      const targetFollowStates = normalizeFollowStates(await kv.get(`${NETWORK_FOLLOWS_PREFIX}${targetProfileId}`));
      pointsAward = await awardNetworkFollowPoints({
        userId: currentUser.user.id,
        targetProfileId,
        isMutual: targetFollowStates[currentUser.user.id] === true,
      });
    }

    await kv.set(followKey, {
      userId: currentUser.user.id,
      states: nextStates,
      updatedAt: new Date().toISOString(),
    });

    return c.json({
      success: true,
      data: {
        states: nextStates,
        pointsAward,
      },
    }, 200);
  } catch (error) {
    console.error('Network follows save endpoint error:', error);
    return c.json({ success: false, error: 'Failed to save network follow' }, 500);
  }
});

// Points routes
app.post("/make-server-7a79873f/points/adjust", async (c) => {
  try {
    const currentUser = await verifyCurrentUser(c);
    if ('response' in currentUser) return currentUser.response;

    const body = await c.req.json();
    const amount = Math.max(0, Math.round(parseStoredNumber(body?.amount, 0)));
    const source = `${body?.source || 'app'}`.trim().slice(0, 80) || 'app';

    if (amount <= 0) {
      return c.json({ success: false, error: 'Point amount must be greater than zero' }, 400);
    }

    const pointsKey = `user_points:${currentUser.user.id}`;
    const historyKey = `${POINTS_HISTORY_PREFIX}${currentUser.user.id}`;
    const currentPoints = parseStoredNumber(await kv.get(pointsKey), DEFAULT_USER_POINTS);
    const pointsAwarded = getCappedPointAward(currentPoints, amount);
    const nextPoints = currentPoints + pointsAwarded;

    if (pointsAwarded <= 0) {
      return c.json({
        success: true,
        data: {
          points: currentPoints,
          transaction: null,
          pointsAwarded: 0,
        },
      }, 200);
    }

    const createdAt = new Date().toISOString();
    const transaction = {
      id: crypto.randomUUID(),
      type: 'add',
      amount: pointsAwarded,
      source,
      oldBalance: currentPoints,
      newBalance: nextPoints,
      createdAt,
    };
    const history = parseStoredJsonArray(await kv.get(historyKey));

    await Promise.all([
      kv.set(pointsKey, nextPoints.toString()),
      kv.set(historyKey, JSON.stringify([transaction, ...history].slice(0, 100))),
    ]);

    return c.json({
      success: true,
      data: {
        points: nextPoints,
        pointsAwarded,
        transaction,
      },
    }, 200);
  } catch (error) {
    console.error('Points adjust endpoint error:', error);
    return c.json({ success: false, error: 'Failed to adjust points' }, 500);
  }
});

// Gameplay routes
app.get("/make-server-7a79873f/gameplay/progress", async (c) => {
  try {
    const currentUser = await verifyCurrentUser(c);
    if ('response' in currentUser) return currentUser.response;

    const progress = parseStoredJsonObject(await kv.get(`${GAMEPLAY_PROGRESS_PREFIX}${currentUser.user.id}`));

    return c.json({
      success: true,
      data: {
        progress: {
          userId: currentUser.user.id,
          quests: progress.quests || {},
          updatedAt: progress.updatedAt || '',
        },
      },
    }, 200);
  } catch (error) {
    console.error('Gameplay progress load endpoint error:', error);
    return c.json({ success: false, error: 'Failed to load gameplay progress' }, 500);
  }
});

app.post("/make-server-7a79873f/gameplay/progress", async (c) => {
  try {
    const currentUser = await verifyCurrentUser(c);
    if ('response' in currentUser) return currentUser.response;

    const body = await c.req.json();
    const questId = `${body?.questId || ''}`.trim();
    const completed = body?.completed === true;
    const progressValue = Math.max(0, Math.round(parseStoredNumber(body?.progress, completed ? 1 : 0)));
    const points = Math.max(0, Math.round(parseStoredNumber(body?.points, 0)));
    const source = `${body?.source || `quest-${questId}`}`.trim().slice(0, 80) || `quest-${questId}`;
    const title = `${body?.title || questId || 'Gameplay activity'}`.trim();

    if (!questId) {
      return c.json({ success: false, error: 'Quest id is required' }, 400);
    }

    const progressKey = `${GAMEPLAY_PROGRESS_PREFIX}${currentUser.user.id}`;
    const userPointsKey = `user_points:${currentUser.user.id}`;
    const storedProgress = parseStoredJsonObject(await kv.get(progressKey));
    const quests = parseStoredJsonObject(storedProgress.quests);
    const previousQuest = parseStoredJsonObject(quests[questId]);
    const wasCompleted = previousQuest.completed === true;
    const completedAt = completed
      ? `${previousQuest.completedAt || new Date().toISOString()}`
      : '';
    const currentPoints = parseStoredNumber(await kv.get(userPointsKey), DEFAULT_USER_POINTS);
    const pointsAwarded = completed && !wasCompleted ? getCappedPointAward(currentPoints, points) : 0;
    const newTotalPoints = currentPoints + pointsAwarded;
    const nextQuest = {
      ...previousQuest,
      id: questId,
      title,
      source,
      progress: Math.max(progressValue, parseStoredNumber(previousQuest.progress, 0)),
      completed: completed || wasCompleted,
      points,
      pointsAwarded: parseStoredNumber(previousQuest.pointsAwarded, 0) + pointsAwarded,
      completedAt,
      updatedAt: new Date().toISOString(),
    };
    const nextProgress = {
      userId: currentUser.user.id,
      quests: {
        ...quests,
        [questId]: nextQuest,
      },
      updatedAt: new Date().toISOString(),
    };

    const writes = [
      kv.set(progressKey, nextProgress),
    ];

    let transaction = null;
    if (pointsAwarded > 0) {
      transaction = await appendPointsTransaction({
        userId: currentUser.user.id,
        type: 'add',
        amount: pointsAwarded,
        source,
        oldBalance: currentPoints,
        newBalance: newTotalPoints,
        metadata: {
          questId,
          title,
        },
      });
      writes.push(kv.set(userPointsKey, newTotalPoints.toString()));
    }

    await Promise.all(writes);

    return c.json({
      success: true,
      data: {
        progress: nextProgress,
        quest: nextQuest,
        pointsAwarded,
        newTotalPoints,
        transaction,
      },
    }, 200);
  } catch (error) {
    console.error('Gameplay progress save endpoint error:', error);
    return c.json({ success: false, error: 'Failed to save gameplay progress' }, 500);
  }
});

// Chat routes
app.get("/make-server-7a79873f/chat/threads", async (c) => {
  try {
    const currentUser = await verifyCurrentUser(c);
    if ('response' in currentUser) return currentUser.response;

    const threads = parseStoredJsonArray(await kv.get(`${CHAT_INDEX_PREFIX}${currentUser.user.id}`));

    return c.json({
      success: true,
      data: {
        threads: threads.sort((a: any, b: any) => `${b.updatedAt || b.lastMessageAt || ''}`.localeCompare(`${a.updatedAt || a.lastMessageAt || ''}`)),
      },
    }, 200);
  } catch (error) {
    console.error('Chat threads load endpoint error:', error);
    return c.json({ success: false, error: 'Failed to load chat threads' }, 500);
  }
});

app.get("/make-server-7a79873f/chat/thread/:threadId", async (c) => {
  try {
    const currentUser = await verifyCurrentUser(c);
    if ('response' in currentUser) return currentUser.response;

    const threadId = normalizeChatThreadId(c.req.param('threadId'));
    const messages = parseStoredJsonArray(await kv.get(`${CHAT_THREADS_PREFIX}${threadId}`));

    return c.json({
      success: true,
      data: {
        messages,
      },
    }, 200);
  } catch (error) {
    console.error('Chat thread load endpoint error:', error);
    return c.json({ success: false, error: 'Failed to load chat thread' }, 500);
  }
});

app.post("/make-server-7a79873f/chat/thread/:threadId", async (c) => {
  try {
    const currentUser = await verifyCurrentUser(c);
    if ('response' in currentUser) return currentUser.response;

    const threadId = normalizeChatThreadId(c.req.param('threadId'));
    const body = await c.req.json();
    const message = normalizeChatMessage(body?.message, currentUser.user);
    const metadata = body?.metadata && typeof body.metadata === 'object' ? body.metadata : {};

    if (!message.content) {
      return c.json({ success: false, error: 'Message content is required' }, 400);
    }

    const threadKey = `${CHAT_THREADS_PREFIX}${threadId}`;
    const messages = parseStoredJsonArray(await kv.get(threadKey));
    const nextMessages = [...messages, message].slice(-CHAT_THREAD_LIMIT);

    await Promise.all([
      kv.set(threadKey, JSON.stringify(nextMessages)),
      upsertChatThreadIndex(currentUser.user.id, {
        threadId,
        type: metadata.type,
        name: metadata.name,
        handle: metadata.handle,
        avatar: metadata.avatar,
        lastMessage: message.content,
        lastMessageAt: message.createdAt,
      }),
    ]);

    return c.json({
      success: true,
      data: {
        message,
        messages: nextMessages,
      },
    }, 200);
  } catch (error) {
    console.error('Chat thread send endpoint error:', error);
    return c.json({ success: false, error: 'Failed to send chat message' }, 500);
  }
});

app.post("/make-server-7a79873f/chat/agent", async (c) => {
  try {
    const currentUser = await verifyCurrentUser(c);
    if ('response' in currentUser) return currentUser.response;

    const body = await c.req.json();
    const threadId = normalizeChatThreadId(body?.threadId || `agent:${currentUser.user.id}`);
    const prompt = `${body?.prompt || ''}`.trim();
    const incomingMessages = Array.isArray(body?.messages)
      ? body.messages.map((message: any) => normalizeChatMessage(message, currentUser.user)).filter((message: any) => message.content)
      : [];

    if (!prompt) {
      return c.json({ success: false, error: 'Prompt is required' }, 400);
    }

    const reply = await createAgentOpenAIReply(incomingMessages, prompt);
    const threadKey = `${CHAT_THREADS_PREFIX}${threadId}`;
    const nextMessages = [...incomingMessages, reply].slice(-CHAT_THREAD_LIMIT);

    await Promise.all([
      kv.set(threadKey, JSON.stringify(nextMessages)),
      upsertChatThreadIndex(currentUser.user.id, {
        threadId,
        type: 'agent',
        name: 'Your Agent',
        lastMessage: reply.content,
        lastMessageAt: reply.createdAt,
      }),
    ]);

    return c.json({
      success: true,
      data: {
        reply,
        messages: nextMessages,
      },
    }, 200);
  } catch (error) {
    console.error('Agent chat endpoint error:', error);
    return c.json({ success: false, error: 'Failed to send agent chat message' }, 500);
  }
});

// Scratch and win routes
app.post("/make-server-7a79873f/scratch/draw", async (c) => {
  try {
    const currentUser = await verifyCurrentUser(c);
    if ('response' in currentUser) return currentUser.response;

    return await withKvLock(SCRATCH_DRAW_LOCK_KEY, async () => {
      const userId = currentUser.user.id;
      const pointsKey = `user_points:${userId}`;
      const usdtKey = `user_usdt:${userId}`;
      const historyKey = `scratch_history:${userId}`;

      const [storedPoints, storedUsdt, storedHistory] = await Promise.all([
        kv.get(pointsKey),
        kv.get(usdtKey),
        kv.get(historyKey),
      ]);
      const history = parseStoredJsonArray(storedHistory);
      const scratchState = await loadScratchCreditState(userId, history);

      if (scratchState.credits.available <= 0) {
        return c.json({
          success: false,
          error: 'No Scratch and Win opportunities are available. Invite friends to unlock another scratch.',
          data: {
            latest: history[0],
            history,
            scratchCredits: scratchState.credits,
          },
        }, 403);
      }

      const previousPoints = parseStoredNumber(storedPoints, DEFAULT_USER_POINTS);
      const previousUsdt = parseStoredNumber(storedUsdt, DEFAULT_USER_USDT);
      const { outcome, upgradeApplied, upgradeFallbackReason } = await resolveScratchOutcome({
        history,
        currentPoints: previousPoints,
      });
      const ticket = scratchTickets.find((scratchTicket) => scratchTicket.id === outcome.ticketId) || scratchTickets[0];
      const publicTicket = publicScratchTicket(ticket);
      const requestedPoints = randomInRange(outcome.pointsRange);
      const awardedPoints = getCappedPointAward(previousPoints, requestedPoints);
      const nextPoints = previousPoints + awardedPoints;
      const reward: any = {
        ...createScratchRewardFromOutcome({
          ticket,
          outcome,
          awardedPoints,
          upgradeApplied,
          upgradeFallbackReason,
        }),
      };
      reward.items = createScratchRewardItems(ticket, reward);
      const nextUsdt = Number((previousUsdt + reward.usdt).toFixed(2));
      const createdAt = new Date().toISOString();
      const expiresAt = new Date(Date.now() + reward.expiresIn).toISOString();

      const draw = {
        id: crypto.randomUUID(),
        userId,
        ticket: publicTicket,
        reward,
        balances: {
          points: nextPoints,
          usdt: nextUsdt,
        },
        createdAt,
        expiresAt,
      };

      const nextHistory = [draw, ...history].slice(0, SCRATCH_HISTORY_LIMIT);
      const nextScratchCredits = {
        ...scratchState.credits,
        available: Math.max(0, scratchState.credits.available - 1),
        used: Math.min(MAX_SCRATCH_OPPORTUNITIES, scratchState.credits.used + 1),
        totalEarned: Math.min(
          MAX_SCRATCH_OPPORTUNITIES,
          scratchState.credits.used + 1 + Math.max(0, scratchState.credits.available - 1),
        ),
        canScratch: scratchState.credits.available - 1 > 0,
      };
      const drawWithCredits = {
        ...draw,
        scratchCredits: nextScratchCredits,
      };
      const writes = [
        kv.set(pointsKey, nextPoints.toString()),
        kv.set(usdtKey, nextUsdt.toString()),
        kv.set(historyKey, JSON.stringify(nextHistory)),
        kv.set(scratchState.key, nextScratchCredits.available.toString()),
      ];

      let pointsTransaction = null;
      if (awardedPoints > 0) {
        pointsTransaction = await appendPointsTransaction({
          userId,
          type: 'add',
          amount: awardedPoints,
          source: 'scratch-ticket',
          oldBalance: previousPoints,
          newBalance: nextPoints,
          metadata: {
            drawId: draw.id,
            outcome: outcome.id,
            cashLocked: reward.usdt,
            triptoLocked: reward.triptoPoints,
            upgradeApplied,
          },
        });
      }

      await Promise.all(writes);
      await awardInviteeActivationPoints(userId);

      console.log('Scratch reward awarded:', {
        userId,
        ticket: ticket.id,
        outcome: outcome.id,
        participationLevel: reward.participationLevel,
        points: reward.participationScore,
        usdt: reward.usdt,
        tripto: reward.triptoPoints,
        nextPoints,
        nextUsdt,
      });

      return c.json({
        success: true,
        data: {
          ...drawWithCredits,
          pointsTransaction,
        },
      }, 200);
    });
  } catch (error) {
    console.error('Scratch draw endpoint error:', error);
    const status = typeof (error as any)?.status === 'number' ? (error as any).status : 500;
    return c.json({
      success: false,
      error: 'Failed to draw scratch reward',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, status);
  }
});

app.get("/make-server-7a79873f/scratch/profile", async (c) => {
  try {
    const currentUser = await verifyCurrentUser(c);
    if ('response' in currentUser) return currentUser.response;

    const userId = currentUser.user.id;
    const [storedPoints, storedUsdt, storedHistory] = await Promise.all([
      kv.get(`user_points:${userId}`),
      kv.get(`user_usdt:${userId}`),
      kv.get(`scratch_history:${userId}`),
    ]);
    const history = parseStoredJsonArray(storedHistory);
    const scratchState = await loadScratchCreditState(userId, history);

    return c.json({
      success: true,
      data: {
        balances: {
          points: parseStoredNumber(storedPoints, DEFAULT_USER_POINTS),
          usdt: parseStoredNumber(storedUsdt, DEFAULT_USER_USDT),
        },
        history,
        scratchCredits: scratchState.credits,
      },
    }, 200);
  } catch (error) {
    console.error('Scratch profile endpoint error:', error);
    return c.json({
      success: false,
      error: 'Failed to load scratch profile',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Marketplace catalog and order routes
app.get("/make-server-7a79873f/marketplace/products", async (c) => {
  try {
    const products = await getMarketplaceCatalog();

    return c.json({
      success: true,
      data: {
        products,
      },
    }, 200);
  } catch (error) {
    console.error('Marketplace products load endpoint error:', error);
    return c.json({ success: false, error: 'Failed to load marketplace products' }, 500);
  }
});

app.put("/make-server-7a79873f/admin/marketplace-products", async (c) => {
  try {
    const admin = await requireAdmin(c);
    if ('response' in admin) return admin.response;

    const body = await c.req.json();
    const products = normalizeMarketplaceProducts(body?.products);

    if (!products.length) {
      return c.json({ success: false, error: 'At least one marketplace product is required' }, 400);
    }

    const savedProducts = await saveMarketplaceCatalog(products);

    return c.json({
      success: true,
      data: {
        products: savedProducts,
      },
    }, 200);
  } catch (error) {
    console.error('Marketplace products save endpoint error:', error);
    return c.json({ success: false, error: 'Failed to save marketplace products' }, 500);
  }
});

app.post("/make-server-7a79873f/marketplace/order", async (c) => {
  try {
    const currentUser = await verifyCurrentUser(c);
    if ('response' in currentUser) return currentUser.response;

    const body = await c.req.json();
    const items = normalizeMarketplaceOrderItems(body?.items);
    const pointsTotal = Math.max(
      0,
      Math.round(parseStoredNumber(
        body?.pointsTotal,
        items.reduce((total, item) => total + item.pointsPrice * item.quantity, 0),
      )),
    );

    if (!items.length) {
      return c.json({ success: false, error: 'At least one marketplace item is required' }, 400);
    }

    const customer = {
      name: `${body?.customer?.name || getUserDisplayName(currentUser.user)}`.trim(),
      email: `${body?.customer?.email || currentUser.user.email || ''}`.trim().toLowerCase(),
      phone: `${body?.customer?.phone || ''}`.trim(),
    };

    if (!customer.name) {
      return c.json({ success: false, error: 'Customer name is required' }, 400);
    }

    if (!customer.email || !isValidEmail(customer.email)) {
      return c.json({ success: false, error: 'A valid customer email is required' }, 400);
    }

    const shippingAddress = {
      addressLine1: `${body?.shippingAddress?.addressLine1 || ''}`.trim(),
      addressLine2: `${body?.shippingAddress?.addressLine2 || ''}`.trim(),
      city: `${body?.shippingAddress?.city || ''}`.trim(),
      region: `${body?.shippingAddress?.region || ''}`.trim(),
      postalCode: `${body?.shippingAddress?.postalCode || ''}`.trim(),
      country: `${body?.shippingAddress?.country || ''}`.trim(),
    };

    if (!shippingAddress.addressLine1 || !shippingAddress.city || !shippingAddress.region || !shippingAddress.postalCode || !shippingAddress.country) {
      return c.json({ success: false, error: 'Complete shipping address is required' }, 400);
    }

    const now = new Date().toISOString();
    const orderNumber = `${body?.orderNumber || `MNTZ-${Date.now().toString().slice(-6)}`}`.trim();
    const seededCatalog = normalizeMarketplaceProducts(body?.catalog);

    const savedOrder = await withKvLock(MARKETPLACE_ORDER_LOCK_KEY, async () => {
      const userPointsKey = `user_points:${currentUser.user.id}`;
      const currentPointBalance = parseStoredNumber(await kv.get(userPointsKey), DEFAULT_USER_POINTS);
      let catalog = await getMarketplaceCatalog();

      if (seededCatalog.length) {
        const mergedCatalog = mergeMarketplaceCatalog(catalog, seededCatalog);
        const storedIds = new Set(catalog.map((product: any) => product.id));
        const hasNewSeededProducts = seededCatalog.some((product: any) => !storedIds.has(product.id));
        catalog = (!catalog.length || hasNewSeededProducts)
          ? await saveMarketplaceCatalog(mergedCatalog)
          : mergedCatalog;
      }

      const catalogById = new Map(catalog.map((product: any) => [product.id, product]));
      const quantityByProduct = items.reduce((counts, item) => {
        counts[item.productId] = (counts[item.productId] || 0) + item.quantity;
        return counts;
      }, {} as Record<string, number>);

      for (const item of items) {
        const product = catalogById.get(item.productId);
        if (!product || product.status !== 'active') {
          const error = new Error(`${item.name || 'This item'} is no longer available.`);
          (error as any).status = 409;
          throw error;
        }

        const neededQuantity = quantityByProduct[item.productId] || 0;
        if (neededQuantity > product.inventory) {
          const error = new Error(`${product.name} only has ${product.inventory} left in inventory.`);
          (error as any).status = 409;
          throw error;
        }
      }

      const authoritativeItems = items.map((item) => {
        const product = catalogById.get(item.productId);
        return {
          ...item,
          name: product?.name || item.name,
          pointsPrice: product?.pointsPrice ?? item.pointsPrice,
        };
      });
      const authoritativePointsTotal = authoritativeItems.reduce((total, item) => total + item.pointsPrice * item.quantity, 0);

      if (currentPointBalance < authoritativePointsTotal) {
        const error = new Error(`You need ${authoritativePointsTotal - currentPointBalance} more points to checkout.`);
        (error as any).status = 402;
        throw error;
      }

      const nextPointBalance = Math.max(0, currentPointBalance - authoritativePointsTotal);
      const nextCatalog = catalog.map((product: any) => (
        quantityByProduct[product.id]
          ? { ...product, inventory: Math.max(0, product.inventory - quantityByProduct[product.id]), updatedAt: now }
          : product
      ));
      const order = {
        id: `${body?.id || crypto.randomUUID()}`,
        orderNumber,
        userId: currentUser.user.id,
        userEmail: currentUser.user.email,
        items: authoritativeItems,
        pointsTotal: authoritativePointsTotal,
        requestedPointsTotal: pointsTotal,
        paymentMethod: 'points',
        customer,
        shippingAddress,
        status: 'pending',
        adminEmail: ADMIN_NOTIFICATION_EMAIL,
        pointsBalanceBefore: currentPointBalance,
        pointsBalanceAfter: nextPointBalance,
        inventoryReserved: true,
        createdAt: `${body?.createdAt || now}`,
        updatedAt: now,
        emailDelivery: 'queued',
        emailNotifications: [],
      };
      const orders = parseStoredJsonArray(await kv.get(MARKETPLACE_ORDERS_KEY));
      const transaction = await appendPointsTransaction({
        userId: currentUser.user.id,
        type: 'subtract',
        amount: authoritativePointsTotal,
        source: 'marketplace-redemption',
        oldBalance: currentPointBalance,
        newBalance: nextPointBalance,
        metadata: {
          orderId: order.id,
          orderNumber,
        },
      });

      await Promise.all([
        kv.set(userPointsKey, nextPointBalance.toString()),
        kv.set(MARKETPLACE_PRODUCTS_KEY, JSON.stringify(nextCatalog)),
        kv.set(
          MARKETPLACE_ORDERS_KEY,
          JSON.stringify([order, ...orders.filter((existingOrder: any) => existingOrder?.id !== order.id)].slice(0, 250)),
        ),
      ]);

      return { ...order, pointsTransaction: transaction };
    });

    const addressText = formatMarketplaceAddress(shippingAddress);
    const itemLines = savedOrder.items.map((item: any) => (
      `${item.quantity}x ${item.name} (${item.color} / ${item.logo}) - ${item.pointsPrice * item.quantity} pts`
    )).join('\n');
    const itemRows = savedOrder.items.map((item: any) => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;">${escapeHtml(item.quantity)}x ${escapeHtml(item.name)}<br><span style="color:#6b7280;">${escapeHtml(item.color)} / ${escapeHtml(item.logo)}</span></td>
        <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;text-align:right;">${escapeHtml(item.pointsPrice * item.quantity)} pts</td>
      </tr>
    `).join('');

    const adminEmail = await dispatchEmailNotification({
      to: ADMIN_NOTIFICATION_EMAIL,
      subject: `New Moneetize marketplace order ${orderNumber}`,
      text: `Order: ${orderNumber}\nCustomer: ${customer.name}\nEmail: ${customer.email}\nShipping: ${addressText}\n\nItems:\n${itemLines}\n\nTotal: ${savedOrder.pointsTotal} pts`,
      html: `
        <h2>New marketplace order ${escapeHtml(orderNumber)}</h2>
        <p><strong>Customer:</strong> ${escapeHtml(customer.name)}<br><strong>Email:</strong> ${escapeHtml(customer.email)}${customer.phone ? `<br><strong>Phone:</strong> ${escapeHtml(customer.phone)}` : ''}</p>
        <p><strong>Shipping:</strong> ${escapeHtml(addressText)}</p>
        <table style="width:100%;border-collapse:collapse;">${itemRows}</table>
        <p><strong>Total:</strong> ${escapeHtml(savedOrder.pointsTotal)} pts</p>
      `,
    });

    const customerEmail = await dispatchEmailNotification({
      to: customer.email,
      subject: `Your Moneetize marketplace order ${orderNumber}`,
      text: `Hi ${customer.name},\n\nWe received your Moneetize marketplace order ${orderNumber}.\n\nItems:\n${itemLines}\n\nTotal: ${savedOrder.pointsTotal} pts\nShipping to: ${addressText}\n\nMoneetize`,
      html: `
        <p>Hi ${escapeHtml(customer.name)},</p>
        <p>We received your Moneetize marketplace order <strong>${escapeHtml(orderNumber)}</strong>.</p>
        <table style="width:100%;border-collapse:collapse;">${itemRows}</table>
        <p><strong>Total:</strong> ${escapeHtml(savedOrder.pointsTotal)} pts</p>
        <p><strong>Shipping to:</strong> ${escapeHtml(addressText)}</p>
        <p>Moneetize</p>
      `,
    });

    const emailUpdatedOrder = {
      ...savedOrder,
      emailDelivery: adminEmail.status === 'sent' && customerEmail.status === 'sent'
        ? 'sent'
        : adminEmail.status === 'failed' || customerEmail.status === 'failed'
          ? 'failed'
          : 'queued',
      emailNotifications: [
        {
          to: ADMIN_NOTIFICATION_EMAIL,
          type: 'admin',
          subject: `New Moneetize marketplace order ${orderNumber}`,
          ...adminEmail,
        },
        {
          to: customer.email,
          type: 'customer',
          subject: `Your Moneetize marketplace order ${orderNumber}`,
          ...customerEmail,
        },
      ],
      updatedAt: new Date().toISOString(),
    };

    const orders = parseStoredJsonArray(await kv.get(MARKETPLACE_ORDERS_KEY));
    await kv.set(
      MARKETPLACE_ORDERS_KEY,
      JSON.stringify([emailUpdatedOrder, ...orders.filter((existingOrder: any) => existingOrder?.id !== emailUpdatedOrder.id)].slice(0, 250)),
    );

    return c.json({ success: true, data: { order: emailUpdatedOrder, products: await getMarketplaceCatalog() } }, 200);
  } catch (error) {
    console.error('Marketplace order endpoint error:', error);
    return c.json({
      success: false,
      error: error instanceof Error && error.message ? error.message : 'Failed to submit marketplace order',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, (error as any)?.status || 500);
  }
});

app.get("/make-server-7a79873f/admin/marketplace-orders", async (c) => {
  try {
    const admin = await requireAdmin(c);
    if ('response' in admin) return admin.response;

    const orders = parseStoredJsonArray(await kv.get(MARKETPLACE_ORDERS_KEY));

    return c.json({
      success: true,
      data: {
        orders: orders.sort((a: any, b: any) => `${b.createdAt || ''}`.localeCompare(`${a.createdAt || ''}`)),
      },
    }, 200);
  } catch (error) {
    console.error('List marketplace orders endpoint error:', error);
    return c.json({ success: false, error: 'Failed to load marketplace orders' }, 500);
  }
});

// Early token access routes
app.post("/make-server-7a79873f/early-access/request", async (c) => {
  try {
    const currentUser = await verifyCurrentUser(c);
    if ('response' in currentUser) return currentUser.response;

    const body = await c.req.json();
    const name = `${body?.name || getUserDisplayName(currentUser.user)}`.trim();
    const email = `${body?.email || currentUser.user.email || ''}`.trim().toLowerCase();

    if (!name) {
      return c.json({ success: false, error: 'Name is required' }, 400);
    }

    if (!email || !isValidEmail(email)) {
      return c.json({ success: false, error: 'A valid email is required' }, 400);
    }

    const userId = currentUser.user.id;
    const requests = parseStoredJsonArray(await kv.get(EARLY_ACCESS_REQUESTS_KEY));
    const requestedAt = new Date().toISOString();
    const existingIndex = requests.findIndex((request: any) => (
      request?.userId === userId &&
      `${request?.email || ''}`.toLowerCase() === email &&
      request?.source === 'token-early-access'
    ));

    let pointsEarned = 0;
    let request;

    if (existingIndex >= 0) {
      request = {
        ...requests[existingIndex],
        name,
        email,
        lastRequestedAt: requestedAt,
      };
      requests[existingIndex] = request;
    } else {
      pointsEarned = EARLY_ACCESS_POINTS_AWARD;
      request = {
        id: crypto.randomUUID(),
        source: 'token-early-access',
        userId,
        userEmail: currentUser.user.email,
        name,
        email,
        status: 'pending',
        requestedAt,
        pointsAwarded: EARLY_ACCESS_POINTS_AWARD,
      };
      requests.unshift(request);
    }

    const currentPoints = parseStoredNumber(await kv.get(`user_points:${userId}`), DEFAULT_USER_POINTS);
    const newTotalPoints = currentPoints + pointsEarned;

    const adminEmail = await dispatchEmailNotification({
      to: ADMIN_NOTIFICATION_EMAIL,
      subject: 'RE: Early Access Request',
      text: `Name: ${name}\nEmail: ${email}\nUser ID: ${userId}`,
      html: `<p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><strong>User ID:</strong> ${userId}</p>`,
    });

    const userEmail = await dispatchEmailNotification({
      to: email,
      subject: 'Moneetize early access request received',
      text: `Hi ${name},\n\nWe received your Token Early Access request. Our team will review it and follow up soon.\n\nMoneetize`,
      html: `<p>Hi ${name},</p><p>We received your <strong>Token Early Access</strong> request. Our team will review it and follow up soon.</p><p>Moneetize</p>`,
    });

    request = {
      ...request,
      emailDelivery: adminEmail.status === 'sent' && userEmail.status === 'sent'
        ? 'sent'
        : adminEmail.status === 'failed' || userEmail.status === 'failed'
          ? 'failed'
          : 'queued',
    };

    if (existingIndex >= 0) {
      requests[existingIndex] = request;
    } else {
      requests[0] = request;
    }

    await Promise.all([
      kv.set(EARLY_ACCESS_REQUESTS_KEY, JSON.stringify(requests)),
      pointsEarned > 0 ? kv.set(`user_points:${userId}`, newTotalPoints.toString()) : Promise.resolve(),
    ]);

    return c.json({
      success: true,
      data: {
        request,
        pointsEarned,
        newTotalPoints,
        emailDelivery: request.emailDelivery,
      }
    }, 200);
  } catch (error) {
    console.error('Early access request endpoint error:', error);
    return c.json({
      success: false,
      error: 'Failed to submit early access request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

app.get("/make-server-7a79873f/admin/early-access-requests", async (c) => {
  try {
    const admin = await requireAdmin(c);
    if ('response' in admin) return admin.response;

    const requests = parseStoredJsonArray(await kv.get(EARLY_ACCESS_REQUESTS_KEY));

    return c.json({
      success: true,
      data: {
        requests: requests.sort((a: any, b: any) => `${b.requestedAt || ''}`.localeCompare(`${a.requestedAt || ''}`)),
      },
    }, 200);
  } catch (error) {
    console.error('List early access requests endpoint error:', error);
    return c.json({ success: false, error: 'Failed to load early access requests' }, 500);
  }
});

app.post("/make-server-7a79873f/admin/early-access-requests/:requestId/grant", async (c) => {
  try {
    const admin = await requireAdmin(c);
    if ('response' in admin) return admin.response;

    const requestId = c.req.param('requestId');
    const requests = parseStoredJsonArray(await kv.get(EARLY_ACCESS_REQUESTS_KEY));
    const requestIndex = requests.findIndex((request: any) => request?.id === requestId);

    if (requestIndex < 0) {
      return c.json({ success: false, error: 'Early access request not found' }, 404);
    }

    const grantedRequest = {
      ...requests[requestIndex],
      status: 'granted',
      grantedAt: new Date().toISOString(),
      grantedBy: admin.user.email || admin.user.id,
    };

    requests[requestIndex] = grantedRequest;
    await kv.set(EARLY_ACCESS_REQUESTS_KEY, JSON.stringify(requests));

    await dispatchEmailNotification({
      to: grantedRequest.email,
      subject: 'Moneetize token early access granted',
      text: `Hi ${grantedRequest.name},\n\nYour Token Early Access request has been approved.\n\nMoneetize`,
      html: `<p>Hi ${grantedRequest.name},</p><p>Your <strong>Token Early Access</strong> request has been approved.</p><p>Moneetize</p>`,
    });

    return c.json({
      success: true,
      data: {
        request: grantedRequest,
        requests,
      },
    }, 200);
  } catch (error) {
    console.error('Grant early access request endpoint error:', error);
    return c.json({ success: false, error: 'Failed to grant early access' }, 500);
  }
});

// Admin Routes - User Management
app.get("/make-server-7a79873f/admin/users", async (c) => {
  try {
    const admin = await requireAdmin(c);
    if ('response' in admin) return admin.response;

    console.log('List users endpoint called');
    const result = await auth.listAllUsers();
    return c.json(result, result.status);
  } catch (error) {
    console.error('List users endpoint error:', error);
    return c.json({ success: false, error: 'Failed to list users' }, 500);
  }
});

app.delete("/make-server-7a79873f/admin/users", async (c) => {
  try {
    const admin = await requireAdmin(c);
    if ('response' in admin) return admin.response;

    console.log('Delete all users endpoint called');
    const result = await auth.deleteAllUsers();
    return c.json(result, result.status);
  } catch (error) {
    console.error('Delete all users endpoint error:', error);
    return c.json({ success: false, error: 'Failed to delete users' }, 500);
  }
});

app.delete("/make-server-7a79873f/admin/users/:userId", async (c) => {
  try {
    const admin = await requireAdmin(c);
    if ('response' in admin) return admin.response;

    const userId = c.req.param('userId');
    console.log('Delete user endpoint called for:', userId);
    
    if (!userId) {
      return c.json({ success: false, error: 'User ID is required' }, 400);
    }
    
    const result = await auth.deleteUser(userId);
    return c.json(result, result.status);
  } catch (error) {
    console.error('Delete user endpoint error:', error);
    return c.json({ success: false, error: 'Failed to delete user' }, 500);
  }
});

app.post("/make-server-7a79873f/admin/delete-by-email", async (c) => {
  try {
    const admin = await requireAdmin(c);
    if ('response' in admin) return admin.response;

    const body = await c.req.json();
    const { email } = body;
    
    console.log('Delete user by email endpoint called for:', email);
    
    if (!email) {
      return c.json({ success: false, error: 'Email is required' }, 400);
    }
    
    const result = await auth.deleteUserByEmail(email);
    return c.json(result, result.status);
  } catch (error) {
    console.error('Delete user by email endpoint error:', error);
    return c.json({ success: false, error: 'Failed to delete user by email' }, 500);
  }
});

// Invites Routes
app.post("/make-server-7a79873f/invites/send", async (c) => {
  try {
    const currentUser = await verifyCurrentUser(c);
    if ('response' in currentUser) return currentUser.response;

    const body = await c.req.json();
    const rawEmails = Array.isArray(body?.emails) ? body.emails : [];
    const rawPhones = Array.isArray(body?.phones) ? body.phones : [];
    const emails = [...new Set(rawEmails.map((email: unknown) => `${email || ''}`.trim().toLowerCase()).filter(Boolean))];
    const phones = [...new Set(rawPhones.map((phone: unknown) => normalizePhoneNumber(`${phone || ''}`)).filter(Boolean))];
    const invalidEmails = rawEmails.map((email: unknown) => `${email || ''}`.trim()).filter((email: string) => email && !isValidEmail(email));
    const invalidPhones = rawPhones.map((phone: unknown) => `${phone || ''}`.trim()).filter((phone: string) => phone && !normalizePhoneNumber(phone));

    if (!emails.length && !phones.length) {
      return c.json({ success: false, error: 'Add at least one email address or phone number.' }, 400);
    }

    if (emails.length + phones.length > 10) {
      return c.json({ success: false, error: 'Maximum 10 invites allowed at a time' }, 400);
    }

    if (invalidEmails.length || invalidPhones.length) {
      return c.json({
        success: false,
        error: 'Some invite recipients are invalid',
        invalidEmails,
        invalidPhones,
      }, 400);
    }

    const inviteUrl = `${body?.inviteLink || body?.inviteUrl || ''}`.trim();
    const inviteMessage = `${body?.message || `Hey! I invited you to Moneetize. Start here and scratch to win rewards: ${inviteUrl}`}`.trim().slice(0, 1500);
    const inviterName = getUserDisplayName(currentUser.user);
    const sentAt = new Date().toISOString();
    const inviteHistoryKey = `${INVITE_HISTORY_PREFIX}${currentUser.user.id}`;
    const history = parseStoredJsonArray(await kv.get(inviteHistoryKey));
    const existingContacts = new Set(history.map((invite: any) => `${invite?.type || 'email'}:${`${invite?.email || invite?.phone || invite?.contact || ''}`.trim().toLowerCase()}`));

    const emailDeliveries = await Promise.all(emails.map(async (email) => {
      const delivery = await dispatchEmailNotification({
        to: email,
        subject: `${inviterName} invited you to Moneetize`,
        text: inviteMessage,
        html: `
          <p>${escapeHtml(inviterName)} invited you to Moneetize.</p>
          <p>${escapeHtml(inviteMessage)}</p>
          ${inviteUrl ? `<p><a href="${escapeHtml(inviteUrl)}">Start your scratch and win</a></p>` : ''}
        `,
      });

      return {
        type: 'email' as const,
        email,
        contact: email,
        delivery,
      };
    }));
    const smsDeliveries = await Promise.all(phones.map(async (phone) => {
      const delivery = await dispatchSmsNotification({
        to: phone,
        message: inviteMessage,
      });

      return {
        type: 'sms' as const,
        phone,
        contact: phone,
        delivery,
      };
    }));
    const deliveries = [...emailDeliveries, ...smsDeliveries];
    const records = deliveries.map((deliveryRecord) => {
      const contact = deliveryRecord.contact;
      const contactKey = `${deliveryRecord.type}:${contact.toLowerCase()}`;
      const alreadyInvited = existingContacts.has(contactKey);

      return {
        id: crypto.randomUUID(),
        type: deliveryRecord.type,
        email: deliveryRecord.type === 'email' ? contact : undefined,
        phone: deliveryRecord.type === 'sms' ? contact : undefined,
        contact,
        inviteUrl,
        inviterId: currentUser.user.id,
        inviterEmail: currentUser.user.email,
        inviterName,
        status: deliveryRecord.delivery.status === 'failed' ? 'failed' : 'pending',
        deliveryStatus: deliveryRecord.delivery.status,
        deliveryProvider: deliveryRecord.type === 'sms' ? 'aws-sns' : 'resend',
        deliveryError: 'error' in deliveryRecord.delivery ? deliveryRecord.delivery.error : undefined,
        deliveryMessageId: 'messageId' in deliveryRecord.delivery ? deliveryRecord.delivery.messageId : undefined,
        points: 0,
        sentAt,
        updatedAt: sentAt,
      };
    });
    const pointsEarned = 0;
    const userPointsKey = `user_points:${currentUser.user.id}`;
    const currentPoints = parseStoredNumber(await kv.get(userPointsKey), DEFAULT_USER_POINTS);
    const newTotalPoints = currentPoints;
    const writes = [
      kv.set(inviteHistoryKey, JSON.stringify([...records, ...history].slice(0, 500))),
    ];

    let transaction = null;
    if (pointsEarned > 0) {
      transaction = await appendPointsTransaction({
        userId: currentUser.user.id,
        type: 'add',
        amount: pointsEarned,
        source: 'referral',
        oldBalance: currentPoints,
        newBalance: newTotalPoints,
        metadata: {
          inviteCount: records.length,
        },
      });
      writes.push(kv.set(userPointsKey, newTotalPoints.toString()));
    }

    await Promise.all(writes);

    return c.json({
      success: true,
      data: {
        invitesSent: records.length,
        records,
        emailDeliveries: emailDeliveries.map((entry) => ({ to: entry.email, ...entry.delivery })),
        smsDeliveries: smsDeliveries.map((entry) => ({ to: entry.phone, ...entry.delivery })),
        pointsEarned,
        newTotalPoints,
        transaction,
      },
    }, 200);
  } catch (error) {
    console.error('Send invites endpoint error:', error);
    return c.json({
      success: false,
      error: 'Failed to send invites',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

app.post("/make-server-7a79873f/invites/track-url", async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const inviterId = `${body?.inviterId || ''}`.trim().slice(0, 160);
    const inviterName = `${body?.inviterName || 'A friend'}`.trim().slice(0, 80) || 'A friend';
    const promptId = `${body?.promptId || 'mini_scratch_v1'}`.trim().slice(0, 80) || 'mini_scratch_v1';
    const inviteUrl = `${body?.inviteUrl || ''}`.trim().slice(0, 1200);
    const visitorId = `${body?.visitorId || ''}`
      .trim()
      .replace(/[^a-zA-Z0-9:_-]/g, '')
      .slice(0, 140);

    if (!inviterId) {
      return c.json({ success: false, error: 'Inviter ID is required' }, 400);
    }

    if (!visitorId) {
      return c.json({ success: false, error: 'Visitor ID is required' }, 400);
    }

    let invitedUser = null;
    const accessToken = getUserAccessToken(c);
    if (accessToken) {
      try {
        invitedUser = await auth.verifyToken(accessToken);
      } catch (error) {
        console.warn('Unable to verify invite visitor token:', error);
      }
    }

    if (invitedUser?.id === inviterId) {
      const currentPoints = parseStoredNumber(await kv.get(`user_points:${inviterId}`), DEFAULT_USER_POINTS);
      return c.json({
        success: true,
        data: {
          tracked: false,
          pointsEarned: 0,
          newTotalPoints: currentPoints,
        },
      }, 200);
    }

    const inviteHistoryKey = `${INVITE_HISTORY_PREFIX}${inviterId}`;
    const history = parseStoredJsonArray(await kv.get(inviteHistoryKey));
    const inviteeIdentity = invitedUser?.id || visitorId;
    const eventKey = `url:${promptId}:${inviteeIdentity}`;
    const alreadyTracked = history.some((invite: any) => (
      invite?.eventKey === eventKey ||
      (
        invite?.type === 'url' &&
        invite?.promptId === promptId &&
        (invitedUser?.id ? invite?.inviteeId === invitedUser.id : invite?.visitorId === visitorId)
      )
    ));
    const userPointsKey = `user_points:${inviterId}`;
    const currentPoints = parseStoredNumber(await kv.get(userPointsKey), DEFAULT_USER_POINTS);

    if (alreadyTracked) {
      return c.json({
        success: true,
        data: {
          tracked: false,
          pointsEarned: 0,
          newTotalPoints: currentPoints,
        },
      }, 200);
    }

    const trackedAt = new Date().toISOString();
    const acceptedInvitePoints = invitedUser ? INVITE_POINTS_PER_RECIPIENT : 0;
    const scratchUnlock = invitedUser
      ? await addScratchCreditForAcceptedInvite(inviterId)
      : null;
    const record = {
      id: crypto.randomUUID(),
      type: 'url',
      eventKey,
      contact: inviteeIdentity,
      inviteUrl,
      inviterId,
      inviterName,
      inviteeId: invitedUser?.id,
      inviteeEmail: invitedUser?.email,
      visitorId,
      promptId,
      status: invitedUser ? 'accepted' : 'pending',
      deliveryStatus: 'opened',
      deliveryProvider: 'invite-url',
      points: acceptedInvitePoints,
      scratchUnlocked: Boolean(scratchUnlock?.unlocked),
      sentAt: trackedAt,
      updatedAt: trackedAt,
    };
    const nextHistory = [record, ...history].slice(0, 500);
    let inviteAcceptedAward = { pointsAwarded: 0, newTotalPoints: currentPoints, transaction: null as any };
    let teamMilestoneAward = { pointsAwarded: 0, awards: [] as any[], newTotalPoints: null as number | null, transaction: null as any };

    if (acceptedInvitePoints > 0) {
      inviteAcceptedAward = await addPointsToUser({
        userId: inviterId,
        amount: acceptedInvitePoints,
        source: 'invite-accepted',
        metadata: {
          inviteType: 'url',
          promptId,
          inviteeId: invitedUser?.id,
          scratchUnlocked: Boolean(scratchUnlock?.unlocked),
        },
      });
      teamMilestoneAward = await awardTeamMilestonePoints(inviterId, getUniqueAcceptedInvitees(nextHistory).size);
    }

    if (invitedUser?.id) {
      await kv.set(`${INVITEE_ACTIVATION_REFERRER_PREFIX}${invitedUser.id}`, {
        inviterId,
        inviteeId: invitedUser.id,
        promptId,
        inviteUrl,
        createdAt: trackedAt,
      });
    }

    await kv.set(inviteHistoryKey, JSON.stringify(nextHistory));

    const pointsEarned = inviteAcceptedAward.pointsAwarded + teamMilestoneAward.pointsAwarded;
    const newTotalPoints = teamMilestoneAward.newTotalPoints ?? inviteAcceptedAward.newTotalPoints ?? currentPoints;

    return c.json({
      success: true,
      data: {
        tracked: true,
        pointsEarned,
        newTotalPoints,
        transaction: inviteAcceptedAward.transaction,
        teamMilestoneAward,
        scratchUnlock,
      },
    }, 200);
  } catch (error) {
    console.error('Track invite URL endpoint error:', error);
    return c.json({
      success: false,
      error: 'Failed to track invite link',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

app.post("/make-server-7a79873f/invites/send-legacy", async (c) => {
  try {
    return c.json({ success: false, error: 'Legacy invite endpoint disabled. Use /invites/send.' }, 410);

    const accessToken = getUserAccessToken(c);
    
    console.log('Send invites endpoint - has token:', !!accessToken);
    
    if (!accessToken) {
      return c.json({ success: false, error: 'User token required' }, 401);
    }
    
    // Verify user is authenticated
    const { createClient } = await import('npm:@supabase/supabase-js');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    
    if (authError || !user) {
      console.error('Send invites - authentication failed:', authError);
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }
    
    const body = await c.req.json();
    const { emails } = body;
    
    console.log('Send invites endpoint - received emails:', emails);
    
    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return c.json({ success: false, error: 'Emails array is required' }, 400);
    }
    
    if (emails.length > 5) {
      return c.json({ success: false, error: 'Maximum 5 invites allowed at a time' }, 400);
    }
    
    // Validate email formats
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = emails.filter((email: string) => !emailRegex.test(email));
    
    if (invalidEmails.length > 0) {
      return c.json({ 
        success: false, 
        error: 'Invalid email addresses', 
        invalidEmails 
      }, 400);
    }
    
    // Send emails (placeholder - in production, integrate with email service)
    // For now, we'll just log and return success
    console.log('Sending invites to:', emails);
    console.log('Sender:', user.email);
    
    // In production, you would integrate with an email service like:
    // - Resend
    // - SendGrid
    // - AWS SES
    // - Supabase Auth invite system
    
    // Calculate points earned for completed invite sends.
    const pointsEarned = emails.length * INVITE_POINTS_PER_RECIPIENT;
    
    // Get current user points from KV store
    const userPointsKey = `user_points:${user.id}`;
    const currentPointsData = await kv.get(userPointsKey);
    const currentPoints = currentPointsData ? parseInt(currentPointsData, 10) : 10; // Default starting points
    const newPoints = currentPoints + pointsEarned;
    
    // Update user points
    await kv.set(userPointsKey, newPoints.toString());
    
    // Store invite history
    const inviteHistoryKey = `invite_history:${user.id}`;
    const historyData = await kv.get(inviteHistoryKey);
    const history = historyData ? JSON.parse(historyData) : [];
    
    const newInvites = emails.map((email: string) => ({
      email,
      sentAt: new Date().toISOString(),
      points: INVITE_POINTS_PER_RECIPIENT
    }));
    
    history.push(...newInvites);
    await kv.set(inviteHistoryKey, JSON.stringify(history));
    
    console.log('✅ Invites sent successfully. Points awarded:', pointsEarned);
    
    return c.json({
      success: true,
      data: {
        invitesSent: emails.length,
        pointsEarned,
        newTotalPoints: newPoints
      }
    }, 200);
    
  } catch (error) {
    console.error('Send invites endpoint error:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to send invites',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

Deno.serve(app.fetch);
