import tshirtRewardIcon from '../../assets/moneetize-tshirt-reward.png';
import { safeGetItem, safeSetItem } from '../utils/storage';

export type MarketplaceProductStatus = 'active' | 'draft';

export interface MarketplaceProduct {
  id: string;
  name: string;
  description: string;
  pointsPrice: number;
  image?: string;
  category: string;
  colorVariants: string[];
  logoVariants: string[];
  inventory: number;
  featured?: boolean;
  badge?: 'NEW' | 'HOT' | 'SALE';
  status: MarketplaceProductStatus;
}

export interface MarketplaceOrderItem {
  id: string;
  productId: string;
  name: string;
  pointsPrice: number;
  quantity: number;
  color: string;
  logo: string;
}

export interface MarketplaceOrder {
  id: string;
  items: MarketplaceOrderItem[];
  pointsTotal: number;
  paymentMethod: 'points';
  createdAt: string;
}

const MARKETPLACE_PRODUCTS_KEY = 'moneetizeMarketplaceProducts';
const MARKETPLACE_ORDERS_KEY = 'moneetizeMarketplaceOrders';
export const MARKETPLACE_PRODUCTS_UPDATED_EVENT = 'moneetize-marketplace-products-updated';

export const defaultMarketplaceProducts: MarketplaceProduct[] = [
  {
    id: 'founder-tee',
    name: 'Founder T-Shirt',
    description: 'Launch team tee for pre-game rewards and early community drops.',
    pointsPrice: 75,
    image: tshirtRewardIcon,
    category: 'T-Shirts',
    colorVariants: ['Black', 'White', 'Charcoal'],
    logoVariants: ['Horizontal', 'Stacked', 'Message'],
    inventory: 75,
    featured: true,
    badge: 'NEW',
    status: 'active',
  },
  {
    id: 'signature-hoodie',
    name: 'Signature Hoodie',
    description: 'Heavyweight fleece hoodie with chest logo placement.',
    pointsPrice: 210,
    image: tshirtRewardIcon,
    category: 'Hoodies',
    colorVariants: ['Black', 'White', 'Slate'],
    logoVariants: ['Horizontal', 'Stacked', 'Icon Only'],
    inventory: 45,
    featured: true,
    badge: 'HOT',
    status: 'active',
  },
  {
    id: 'oversized-logo-tee',
    name: 'Oversized Logo Tee',
    description: 'Relaxed fit tee with oversized back print.',
    pointsPrice: 150,
    image: tshirtRewardIcon,
    category: 'T-Shirts',
    colorVariants: ['Black', 'White', 'Slate', 'Mint'],
    logoVariants: ['Stacked', 'Message', 'Icon Only'],
    inventory: 60,
    featured: true,
    badge: 'SALE',
    status: 'active',
  },
  {
    id: 'zip-hoodie',
    name: 'Zip-Up Hoodie',
    description: 'Full-zip hoodie with dual pocket and sleeve logo options.',
    pointsPrice: 250,
    image: tshirtRewardIcon,
    category: 'Hoodies',
    colorVariants: ['Black', 'Charcoal', 'Blue'],
    logoVariants: ['Horizontal', 'Icon Only'],
    inventory: 30,
    featured: true,
    badge: 'HOT',
    status: 'active',
  },
  {
    id: 'classic-cap',
    name: 'Classic Cap',
    description: 'Low-profile cap optimized for icon-only embroidery.',
    pointsPrice: 130,
    image: tshirtRewardIcon,
    category: 'Headwear',
    colorVariants: ['Black', 'White', 'Blue'],
    logoVariants: ['Icon Only', 'Horizontal'],
    inventory: 80,
    badge: 'HOT',
    status: 'active',
  },
  {
    id: 'launch-beanie',
    name: 'Launch Beanie',
    description: 'Ribbed beanie with compact embroidered badge.',
    pointsPrice: 115,
    image: tshirtRewardIcon,
    category: 'Headwear',
    colorVariants: ['Black', 'Charcoal'],
    logoVariants: ['Icon Only'],
    inventory: 70,
    badge: 'SALE',
    status: 'active',
  },
  {
    id: 'desk-mug',
    name: 'Desk Mug',
    description: 'Matte mug with horizontal or message lockup.',
    pointsPrice: 90,
    image: tshirtRewardIcon,
    category: 'Drinkware',
    colorVariants: ['Black', 'White'],
    logoVariants: ['Horizontal', 'Message'],
    inventory: 95,
    badge: 'NEW',
    status: 'active',
  },
  {
    id: 'thermal-bottle',
    name: 'Thermal Bottle',
    description: 'Insulated bottle with vertical logo placement.',
    pointsPrice: 160,
    image: tshirtRewardIcon,
    category: 'Drinkware',
    colorVariants: ['Black', 'Mint', 'Steel'],
    logoVariants: ['Stacked', 'Icon Only'],
    inventory: 55,
    badge: 'NEW',
    status: 'active',
  },
];

function parseProductList(value: string | null) {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed as MarketplaceProduct[] : null;
  } catch {
    return null;
  }
}

function normalizeProduct(product: MarketplaceProduct): MarketplaceProduct {
  return {
    ...product,
    pointsPrice: Number.isFinite(Number(product.pointsPrice)) ? Math.max(0, Math.round(Number(product.pointsPrice))) : 0,
    inventory: Number.isFinite(Number(product.inventory)) ? Math.max(0, Math.round(Number(product.inventory))) : 0,
    colorVariants: product.colorVariants?.length ? product.colorVariants : ['Black'],
    logoVariants: product.logoVariants?.length ? product.logoVariants : ['Horizontal'],
    status: product.status || 'active',
  };
}

function mergeDefaultProducts(storedProducts: MarketplaceProduct[] | null) {
  if (!storedProducts?.length) return defaultMarketplaceProducts;

  const storedById = new Map(storedProducts.map((product) => [product.id, product]));
  const mergedDefaults = defaultMarketplaceProducts.map((product) => ({
    ...product,
    ...storedById.get(product.id),
  }));
  const customProducts = storedProducts.filter((product) => !defaultMarketplaceProducts.some((defaultProduct) => defaultProduct.id === product.id));

  return [...mergedDefaults, ...customProducts];
}

function emitMarketplaceUpdate() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(MARKETPLACE_PRODUCTS_UPDATED_EVENT));
}

export function loadMarketplaceProducts() {
  const storedProducts = parseProductList(safeGetItem(MARKETPLACE_PRODUCTS_KEY));
  return mergeDefaultProducts(storedProducts).map(normalizeProduct);
}

export function saveMarketplaceProducts(products: MarketplaceProduct[]) {
  const normalizedProducts = products.map(normalizeProduct);
  safeSetItem(MARKETPLACE_PRODUCTS_KEY, JSON.stringify(normalizedProducts));
  emitMarketplaceUpdate();
  return normalizedProducts;
}

export function saveMarketplaceOrder(order: MarketplaceOrder) {
  try {
    const existingJson = safeGetItem(MARKETPLACE_ORDERS_KEY);
    const existingOrders: MarketplaceOrder[] = existingJson ? JSON.parse(existingJson) : [];
    safeSetItem(MARKETPLACE_ORDERS_KEY, JSON.stringify([order, ...existingOrders].slice(0, 100)));
  } catch {
    safeSetItem(MARKETPLACE_ORDERS_KEY, JSON.stringify([order]));
  }

  return order;
}
