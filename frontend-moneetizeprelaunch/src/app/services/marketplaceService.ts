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
    logoVariants: ['Classic Logo', 'Wildcard Logo', 'Golden Logo'],
    inventory: 75,
    featured: true,
    status: 'active',
  },
  {
    id: 'wildcard-tee',
    name: 'Wildcard T-Shirt',
    description: 'A limited tee for users who unlock wildcard-style rewards.',
    pointsPrice: 150,
    image: tshirtRewardIcon,
    category: 'T-Shirts',
    colorVariants: ['Black', 'Mint', 'Slate'],
    logoVariants: ['Wildcard Logo', 'Moneetize Badge'],
    inventory: 50,
    featured: true,
    status: 'active',
  },
  {
    id: 'team-tee',
    name: 'Team Builder T-Shirt',
    description: 'Redeemable merch for growing your pre-launch network.',
    pointsPrice: 220,
    image: tshirtRewardIcon,
    category: 'T-Shirts',
    colorVariants: ['Black', 'White'],
    logoVariants: ['Team Logo', 'Classic Logo'],
    inventory: 35,
    featured: false,
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
    logoVariants: product.logoVariants?.length ? product.logoVariants : ['Classic Logo'],
    status: product.status || 'active',
  };
}

function emitMarketplaceUpdate() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(MARKETPLACE_PRODUCTS_UPDATED_EVENT));
}

export function loadMarketplaceProducts() {
  const storedProducts = parseProductList(safeGetItem(MARKETPLACE_PRODUCTS_KEY));
  return (storedProducts?.length ? storedProducts : defaultMarketplaceProducts).map(normalizeProduct);
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
