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
    allowHeaders: ["Content-Type", "Authorization", "apikey", "x-client-info"],
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
const DEFAULT_USER_POINTS = 10;
const DEFAULT_USER_USDT = 0;
const SCRATCH_HISTORY_LIMIT = 50;
const RECOMMENDED_FRIENDS_KEY = 'network:recommended_friends';
const EARLY_ACCESS_REQUESTS_KEY = 'early_access_requests';
const EMAIL_QUEUE_KEY = 'email_notifications';
const MARKETPLACE_ORDERS_KEY = 'marketplace_orders';
const EARLY_ACCESS_POINTS_AWARD = 25;
const ADMIN_NOTIFICATION_EMAIL = 'admin@moneetize.com';

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
const SCRATCH_LOCKED_TRIPTO = 250;

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
    weight: 4500,
    isGolden: false,
    borderColor: 'rgba(129, 140, 248, 0.65)',
    glowColor: 'rgba(129, 140, 248, 0.22)',
    cardGradient: 'linear-gradient(180deg, rgba(30, 34, 46, 0.92) 0%, rgba(18, 22, 33, 0.96) 100%)',
    scratchGradient: 'linear-gradient(135deg, #7586ff 0%, #d9f2ff 100%)',
    scratchBaseColor: '#8492ff',
    particleColors: ['#7FCCFF', '#524CFF', '#A78BFA', '#F8FAFC'],
    reward: createScratchReward({
      score: 20,
      level: 1,
      triptoPoints: SCRATCH_LOCKED_TRIPTO,
      usdt: 0.5,
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
    id: 'green',
    title: 'Wild Scratch',
    displayName: 'Green Ticket',
    theme: 'green',
    weight: 1800,
    isGolden: false,
    borderColor: 'rgba(132, 204, 22, 0.62)',
    glowColor: 'rgba(132, 204, 22, 0.2)',
    cardGradient: 'linear-gradient(180deg, rgba(25, 32, 23, 0.92) 0%, rgba(16, 22, 15, 0.96) 100%)',
    scratchGradient: 'linear-gradient(135deg, #27c23a 0%, #e6ff6f 100%)',
    scratchBaseColor: '#8fd43f',
    particleColors: ['#84CC16', '#A3E635', '#FDE047', '#ECFCCB'],
    reward: createScratchReward({
      score: 75,
      level: 3,
      triptoPoints: SCRATCH_LOCKED_TRIPTO,
      usdt: 3,
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
    weight: 650,
    isGolden: false,
    borderColor: 'rgba(244, 114, 182, 0.58)',
    glowColor: 'rgba(244, 114, 182, 0.2)',
    cardGradient: 'linear-gradient(180deg, rgba(34, 27, 31, 0.92) 0%, rgba(24, 19, 23, 0.96) 100%)',
    scratchGradient: 'linear-gradient(135deg, #ff7a45 0%, #f9a8d4 100%)',
    scratchBaseColor: '#f58aa4',
    particleColors: ['#FB7185', '#F472B6', '#FDBA74', '#FBCFE8'],
    reward: createScratchReward({
      score: 250,
      level: 4,
      triptoPoints: SCRATCH_LOCKED_TRIPTO,
      usdt: 8,
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
    weight: 50,
    isGolden: true,
    borderColor: 'rgba(212, 175, 55, 0.72)',
    glowColor: 'rgba(212, 175, 55, 0.26)',
    cardGradient: 'linear-gradient(180deg, rgba(36, 33, 24, 0.93) 0%, rgba(22, 20, 16, 0.97) 100%)',
    scratchGradient: 'linear-gradient(135deg, #c8941d 0%, #fde68a 100%)',
    scratchBaseColor: '#C4A661',
    particleColors: ['#FDE68A', '#FACC15', '#D97706', '#FEF3C7'],
    countdown: { hours: 0, minutes: 2, seconds: 14 },
    reward: createScratchReward({
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
    }),
  },
] as const;

const verifyCurrentUser = async (c: any) => {
  const authHeader = c.req.header('Authorization');
  const accessToken = authHeader?.split(' ')[1];

  if (!accessToken) {
    return { response: c.json({ success: false, error: 'Authorization header required' }, 401) };
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

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const escapeHtml = (value: unknown) => `${value ?? ''}`.replace(/[&<>"']/g, (char) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}[char] || char));

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

const queueEmailNotification = async (email: Record<string, unknown>) => {
  const queuedNotifications = parseStoredJsonArray(await kv.get(EMAIL_QUEUE_KEY));
  const notification = {
    id: crypto.randomUUID(),
    ...email,
    queuedAt: new Date().toISOString(),
  };

  await kv.set(EMAIL_QUEUE_KEY, JSON.stringify([notification, ...queuedNotifications].slice(0, 100)));

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

const publicScratchTicket = (ticket: typeof scratchTickets[number]) => {
  const { weight: _weight, reward: _reward, ...publicTicket } = ticket;
  return publicTicket;
};

const createScratchRewardItems = (ticket: typeof scratchTickets[number]) => {
  const rewardItems = [
    {
      id: `${ticket.id}-points`,
      type: 'points',
      label: 'Participation Score',
      amount: ticket.reward.participationScore,
      unit: 'score',
      icon: 'gem',
    },
    {
      id: `${ticket.id}-wild-card`,
      type: 'wildcard',
      label: ticket.reward.wildCard.name,
      description: ticket.reward.wildCard.description,
      icon: 'wildcard',
    },
    {
      id: `${ticket.id}-usdt`,
      type: 'usdt',
      label: 'USDT (Locked)',
      amount: ticket.reward.usdt,
      unit: 'USDT',
      icon: 'usdt',
    },
    {
      id: `${ticket.id}-tripto`,
      type: 'tripto',
      label: 'Tripto (Locked)',
      amount: ticket.reward.triptoPoints,
      unit: 'Tripto',
      icon: 'tripto',
    },
  ];

  const bonusChance = ticket.reward.participationLevel >= 5
    ? 100
    : ticket.reward.participationLevel === 4
      ? 70
      : ticket.reward.participationLevel === 3
        ? 45
        : ticket.reward.participationLevel === 2
          ? 25
          : 15;

  if (randomInt(100) < bonusChance) {
    rewardItems.splice(1, 0, {
      id: `${ticket.id}-moneetize-shirt`,
      type: 'merch',
      label: 'Moneetize T-Shirt',
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

const requireAdmin = async (c: any) => {
  const authHeader = c.req.header('Authorization');
  const accessToken = authHeader?.split(' ')[1];

  if (!accessToken) {
    return { response: c.json({ success: false, error: 'Authorization header required' }, 401) };
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
    const authHeader = c.req.header('Authorization');
    const accessToken = authHeader?.split(' ')[1];
    
    console.log('Profile endpoint - has auth header:', !!authHeader, 'has token:', !!accessToken);
    
    if (!accessToken) {
      return c.json({ success: false, error: 'Authorization header required' }, 401);
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
    const authHeader = c.req.header('Authorization');
    const accessToken = authHeader?.split(' ')[1];
    
    console.log('Update profile endpoint - has auth header:', !!authHeader, 'has token:', !!accessToken);
    
    if (!accessToken) {
      return c.json({ success: false, error: 'Authorization header required' }, 401);
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

// Scratch and win routes
app.post("/make-server-7a79873f/scratch/draw", async (c) => {
  try {
    const currentUser = await verifyCurrentUser(c);
    if ('response' in currentUser) return currentUser.response;

    const userId = currentUser.user.id;
    const ticket = selectScratchTicket();
    const publicTicket = publicScratchTicket(ticket);
    const pointsKey = `user_points:${userId}`;
    const usdtKey = `user_usdt:${userId}`;
    const historyKey = `scratch_history:${userId}`;

    const [storedPoints, storedUsdt, storedHistory] = await Promise.all([
      kv.get(pointsKey),
      kv.get(usdtKey),
      kv.get(historyKey),
    ]);

    const previousPoints = parseStoredNumber(storedPoints, DEFAULT_USER_POINTS);
    const previousUsdt = parseStoredNumber(storedUsdt, DEFAULT_USER_USDT);
    const nextPoints = previousPoints + ticket.reward.moneetizePoints;
    const nextUsdt = Number((previousUsdt + ticket.reward.usdt).toFixed(2));
    const createdAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + ticket.reward.expiresIn).toISOString();
    const reward = {
      ...ticket.reward,
      wildCard: { ...ticket.reward.wildCard },
      items: createScratchRewardItems(ticket),
    };

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

    const history = parseStoredJsonArray(storedHistory);
    const nextHistory = [draw, ...history].slice(0, SCRATCH_HISTORY_LIMIT);

    await Promise.all([
      kv.set(pointsKey, nextPoints.toString()),
      kv.set(usdtKey, nextUsdt.toString()),
      kv.set(historyKey, JSON.stringify(nextHistory)),
    ]);

    console.log('Scratch reward awarded:', {
      userId,
      ticket: ticket.id,
      participationLevel: reward.participationLevel,
      points: reward.participationScore,
      usdt: reward.usdt,
      nextPoints,
      nextUsdt,
    });

    return c.json({ success: true, data: draw }, 200);
  } catch (error) {
    console.error('Scratch draw endpoint error:', error);
    return c.json({
      success: false,
      error: 'Failed to draw scratch reward',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
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

    return c.json({
      success: true,
      data: {
        balances: {
          points: parseStoredNumber(storedPoints, DEFAULT_USER_POINTS),
          usdt: parseStoredNumber(storedUsdt, DEFAULT_USER_USDT),
        },
        history: parseStoredJsonArray(storedHistory),
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

// Marketplace order routes
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

    const userPointsKey = `user_points:${currentUser.user.id}`;
    const currentPointBalance = parseStoredNumber(await kv.get(userPointsKey), DEFAULT_USER_POINTS);
    const nextPointBalance = Math.max(0, currentPointBalance - pointsTotal);
    const now = new Date().toISOString();
    const orderNumber = `${body?.orderNumber || `MNTZ-${Date.now().toString().slice(-6)}`}`.trim();
    const order = {
      id: `${body?.id || crypto.randomUUID()}`,
      orderNumber,
      userId: currentUser.user.id,
      userEmail: currentUser.user.email,
      items,
      pointsTotal,
      paymentMethod: 'points',
      customer,
      shippingAddress,
      status: 'pending',
      adminEmail: ADMIN_NOTIFICATION_EMAIL,
      pointsBalanceAfter: nextPointBalance,
      createdAt: `${body?.createdAt || now}`,
      updatedAt: now,
    };

    const addressText = formatMarketplaceAddress(shippingAddress);
    const itemLines = items.map((item) => (
      `${item.quantity}x ${item.name} (${item.color} / ${item.logo}) - ${item.pointsPrice * item.quantity} pts`
    )).join('\n');
    const itemRows = items.map((item) => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;">${escapeHtml(item.quantity)}x ${escapeHtml(item.name)}<br><span style="color:#6b7280;">${escapeHtml(item.color)} / ${escapeHtml(item.logo)}</span></td>
        <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;text-align:right;">${escapeHtml(item.pointsPrice * item.quantity)} pts</td>
      </tr>
    `).join('');

    const adminEmail = await dispatchEmailNotification({
      to: ADMIN_NOTIFICATION_EMAIL,
      subject: `New Moneetize marketplace order ${orderNumber}`,
      text: `Order: ${orderNumber}\nCustomer: ${customer.name}\nEmail: ${customer.email}\nShipping: ${addressText}\n\nItems:\n${itemLines}\n\nTotal: ${pointsTotal} pts`,
      html: `
        <h2>New marketplace order ${escapeHtml(orderNumber)}</h2>
        <p><strong>Customer:</strong> ${escapeHtml(customer.name)}<br><strong>Email:</strong> ${escapeHtml(customer.email)}${customer.phone ? `<br><strong>Phone:</strong> ${escapeHtml(customer.phone)}` : ''}</p>
        <p><strong>Shipping:</strong> ${escapeHtml(addressText)}</p>
        <table style="width:100%;border-collapse:collapse;">${itemRows}</table>
        <p><strong>Total:</strong> ${escapeHtml(pointsTotal)} pts</p>
      `,
    });

    const customerEmail = await dispatchEmailNotification({
      to: customer.email,
      subject: `Your Moneetize marketplace order ${orderNumber}`,
      text: `Hi ${customer.name},\n\nWe received your Moneetize marketplace order ${orderNumber}.\n\nItems:\n${itemLines}\n\nTotal: ${pointsTotal} pts\nShipping to: ${addressText}\n\nMoneetize`,
      html: `
        <p>Hi ${escapeHtml(customer.name)},</p>
        <p>We received your Moneetize marketplace order <strong>${escapeHtml(orderNumber)}</strong>.</p>
        <table style="width:100%;border-collapse:collapse;">${itemRows}</table>
        <p><strong>Total:</strong> ${escapeHtml(pointsTotal)} pts</p>
        <p><strong>Shipping to:</strong> ${escapeHtml(addressText)}</p>
        <p>Moneetize</p>
      `,
    });

    const savedOrder = {
      ...order,
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
    };

    const orders = parseStoredJsonArray(await kv.get(MARKETPLACE_ORDERS_KEY));
    await Promise.all([
      kv.set(userPointsKey, nextPointBalance.toString()),
      kv.set(
        MARKETPLACE_ORDERS_KEY,
        JSON.stringify([savedOrder, ...orders.filter((existingOrder: any) => existingOrder?.id !== savedOrder.id)].slice(0, 100)),
      ),
    ]);

    return c.json({ success: true, data: { order: savedOrder } }, 200);
  } catch (error) {
    console.error('Marketplace order endpoint error:', error);
    return c.json({
      success: false,
      error: 'Failed to submit marketplace order',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
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
    const authHeader = c.req.header('Authorization');
    const accessToken = authHeader?.split(' ')[1];
    
    console.log('Send invites endpoint - has auth header:', !!authHeader, 'has token:', !!accessToken);
    
    if (!accessToken) {
      return c.json({ success: false, error: 'Authorization header required' }, 401);
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
    
    // Calculate points earned (5 points per invite)
    const pointsEarned = emails.length * 5;
    
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
      points: 5
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
