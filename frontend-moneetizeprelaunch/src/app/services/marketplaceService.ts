import { projectId, publicAnonKey } from '/utils/supabase/info';
import { safeGetItem, safeSetItem } from '../utils/storage';
import { setUserPoints } from '../utils/pointsManager';

export type MarketplaceProductStatus = 'active' | 'draft';

export interface MarketplaceProduct {
  id: string;
  name: string;
  description: string;
  pointsPrice: number;
  image?: string;
  sourceUrl?: string;
  variantImages?: Record<string, string>;
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
  orderNumber?: string;
  items: MarketplaceOrderItem[];
  pointsTotal: number;
  paymentMethod: 'points';
  customer?: MarketplaceCustomer;
  shippingAddress?: MarketplaceShippingAddress;
  status?: MarketplaceOrderStatus;
  adminEmail?: string;
  userEmail?: string;
  emailDelivery?: MarketplaceEmailDelivery;
  emailNotifications?: MarketplaceEmailNotification[];
  pointsBalanceBefore?: number;
  pointsBalanceAfter?: number;
  inventoryReserved?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export type MarketplaceOrderStatus = 'pending' | 'processing' | 'fulfilled' | 'cancelled';
export type MarketplaceEmailDelivery = 'sent' | 'queued' | 'failed';

export interface MarketplaceCustomer {
  name: string;
  email: string;
  phone?: string;
}

export interface MarketplaceShippingAddress {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
}

export interface MarketplaceEmailNotification {
  to: string;
  type: 'admin' | 'customer';
  subject: string;
  status: MarketplaceEmailDelivery;
  error?: string;
}

const MARKETPLACE_PRODUCTS_KEY = 'moneetizeMarketplaceProducts';
const MARKETPLACE_ORDERS_KEY = 'moneetizeMarketplaceOrders';
export const MARKETPLACE_PRODUCTS_UPDATED_EVENT = 'moneetize-marketplace-products-updated';
export const MARKETPLACE_ORDERS_UPDATED_EVENT = 'moneetize-marketplace-orders-updated';
export const MARKETPLACE_ADMIN_EMAIL = 'admin@moneetize.com';

const MARKETPLACE_API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-7a79873f`;

const productAssetPath = '/marketplace/products/';
const logoColors = ['Black', 'Dark Blue', 'Green', 'Light Blue', 'Pink', 'Purple', 'Yellow'];

function imageVariant(color: string, logo: string) {
  return `${color}__${logo}`;
}

function productImage(fileName: string) {
  return `${productAssetPath}${fileName.replace(/\.jpeg$/i, '.jpg')}`;
}

function normalizeMarketplaceImagePath(value?: string) {
  if (!value) return value;

  return value.replace(/^\/marketplace\/products\/(.+)\.jpeg$/i, '/marketplace/products/$1.jpg');
}

function normalizeMarketplaceVariantImages(variantImages?: Record<string, string>) {
  if (!variantImages) return variantImages;

  return Object.fromEntries(
    Object.entries(variantImages).map(([key, value]) => [key, normalizeMarketplaceImagePath(value) || value]),
  );
}

export const defaultMarketplaceProducts: MarketplaceProduct[] = [
  {
    id: 'vistaprint-gildan-tee',
    name: 'Gildan Unisex T-Shirt',
    description: 'Classic everyday tee with Moneetize logo placement for pre-game reward drops.',
    pointsPrice: 47,
    image: productImage('black-t-shirt-light-blue.jpeg'),
    sourceUrl: 'https://www.vistaprint.ca/clothing-bags/t-shirts/gildan-r-budget-unisex-t-shirt',
    variantImages: {
      [imageVariant('Black', 'Light Blue')]: productImage('black-t-shirt-light-blue.jpeg'),
      [imageVariant('Black', 'Pink')]: productImage('black-t-shirt-pink.jpeg'),
      [imageVariant('Blue', 'Yellow')]: productImage('blue-t-shirt-yellow.jpeg'),
    },
    category: 'Shirts',
    colorVariants: ['Black', 'Blue'],
    logoVariants: ['Light Blue', 'Pink', 'Yellow'],
    inventory: 75,
    featured: true,
    badge: 'NEW',
    status: 'active',
  },
  {
    id: 'vistaprint-fleece-hoodie',
    name: 'Embroidered Fleece Hoodie',
    description: 'Soft fleece hoodie with a clean Moneetize chest logo placement.',
    pointsPrice: 85,
    image: productImage('black-hoodie-light-blue.jpeg'),
    sourceUrl: 'https://www.vistaprint.ca/clothing-bags/sweatshirts/district-r-embroidered-v-i-t-tm-fleece-hoodie',
    variantImages: {
      [imageVariant('Black', 'Light Blue')]: productImage('black-hoodie-light-blue.jpeg'),
      [imageVariant('Black', 'Pink')]: productImage('black-hoodie-pink.jpeg'),
      [imageVariant('White', 'Black')]: productImage('white-hoodie-black.jpeg'),
    },
    category: 'Hoodies',
    colorVariants: ['Black', 'White'],
    logoVariants: ['Light Blue', 'Pink', 'Black'],
    inventory: 45,
    featured: true,
    badge: 'HOT',
    status: 'active',
  },
  {
    id: 'vistaprint-cotton-tote',
    name: 'Cotton Tote Bag',
    description: 'Reusable canvas tote with full-surface Moneetize logo artwork.',
    pointsPrice: 13,
    image: productImage('tote-bag-yellow.jpeg'),
    sourceUrl: 'https://www.vistaprint.ca/clothing-bags/bags/totes/vistaprint-cotton-tote-bag',
    variantImages: {
      [imageVariant('Natural', 'Dark Blue')]: productImage('tote-bag-dark-blue.jpeg'),
      [imageVariant('Natural', 'Green')]: productImage('tote-bag-green.jpeg'),
      [imageVariant('Natural', 'Pink')]: productImage('tote-bag-pink.jpeg'),
      [imageVariant('Natural', 'Purple')]: productImage('tote-bag-purple.jpeg'),
      [imageVariant('Natural', 'Yellow')]: productImage('tote-bag-yellow.jpeg'),
    },
    category: 'Bags',
    colorVariants: ['Natural'],
    logoVariants: ['Dark Blue', 'Green', 'Pink', 'Purple', 'Yellow'],
    inventory: 60,
    featured: true,
    badge: 'SALE',
    status: 'active',
  },
  {
    id: 'vistaprint-embroidered-cap',
    name: 'Embroidered Cap',
    description: 'Structured 6-panel cap with compact logo embroidery styling.',
    pointsPrice: 20,
    image: productImage('black-cap-green.jpeg'),
    sourceUrl: 'https://www.vistaprint.ca/clothing-bags/hats/caps/vistaprint-6-panel-baseball-cap',
    variantImages: {
      [imageVariant('Black', 'Green')]: productImage('black-cap-green.jpeg'),
      [imageVariant('Black', 'Pink')]: productImage('black-cap-pink.jpeg'),
      [imageVariant('Black', 'Yellow')]: productImage('black-cap-yellow.jpeg'),
      [imageVariant('Blue', 'Light Blue')]: productImage('blue-cap-light-blue.jpeg'),
    },
    category: 'Hats',
    colorVariants: ['Black', 'Blue'],
    logoVariants: ['Green', 'Pink', 'Yellow', 'Light Blue'],
    inventory: 80,
    badge: 'HOT',
    status: 'active',
  },
  {
    id: 'vistaprint-cotton-visor',
    name: 'Cotton Bio-Washed Visor',
    description: 'Lightweight cotton visor with sporty Moneetize logo variants.',
    pointsPrice: 50,
    image: productImage('black-visor-green.jpeg'),
    sourceUrl: 'https://www.vistaprint.ca/clothing-bags/hats/visors/valucap-cotton-bio-washed-visor',
    variantImages: {
      [imageVariant('Black', 'Green')]: productImage('black-visor-green.jpeg'),
      [imageVariant('Black', 'White')]: productImage('black-visor-white.jpeg'),
      [imageVariant('Light Blue', 'Pink')]: productImage('light-blue-visor-pink.jpeg'),
    },
    category: 'Headwear',
    colorVariants: ['Black', 'Light Blue'],
    logoVariants: ['Green', 'White', 'Pink'],
    inventory: 70,
    badge: 'SALE',
    status: 'active',
  },
  {
    id: 'vistaprint-insulated-bottle',
    name: 'Insulated Bottle 22 oz.',
    description: 'Wide-mouth stainless bottle for launch team hydration rewards.',
    pointsPrice: 70,
    image: productImage('black-water-bottle-light-blue.jpeg'),
    sourceUrl: 'https://www.vistaprint.ca/promotional-products/drinkware/sports-water-bottles/stainless-steel-wide-mouth-insulated-bottle-22-oz',
    variantImages: {
      [imageVariant('Black', 'Green')]: productImage('black-water-bottle-green.jpeg'),
      [imageVariant('Black', 'Light Blue')]: productImage('black-water-bottle-light-blue.jpeg'),
      [imageVariant('Black', 'Pink')]: productImage('black-water-bottle-pink.jpeg'),
      [imageVariant('Blue', 'Light Blue')]: productImage('blue-water-bottle-light-blue.jpeg'),
      [imageVariant('Dark Blue', 'Green')]: productImage('dark-blue-water-bottle-green.jpeg'),
      [imageVariant('Light Green', 'Pink')]: productImage('light-green-water-bottle-pink.jpeg'),
      [imageVariant('White', 'Black')]: productImage('white-water-bottle-black.jpeg'),
    },
    category: 'Drinkware',
    colorVariants: ['Black', 'Blue', 'Dark Blue', 'Light Green', 'White'],
    logoVariants: ['Green', 'Light Blue', 'Pink', 'Black'],
    inventory: 55,
    badge: 'NEW',
    status: 'active',
  },
  {
    id: 'vistaprint-tumbler',
    name: 'Double-Wall Tumbler 16 oz.',
    description: 'Reusable tumbler with straw and full-color Moneetize logo options.',
    pointsPrice: 17,
    image: productImage('tumbler-light-blue.jpeg'),
    sourceUrl: 'https://www.vistaprint.ca/promotional-products/drinkware/travel-mugs-tumblers-cups/double-wall-tumbler-with-straw-16-oz',
    variantImages: Object.fromEntries(logoColors.map((logo) => [imageVariant('Clear', logo), productImage(`tumbler-${logo.toLowerCase().replaceAll(' ', '-')}.jpeg`)])),
    category: 'Drinkware',
    colorVariants: ['Clear'],
    logoVariants: logoColors,
    inventory: 95,
    badge: 'NEW',
    status: 'active',
  },
  {
    id: 'vistaprint-ballpoint-pen',
    name: 'Ballpoint Pen',
    description: 'Everyday click pen with wraparound Moneetize branding.',
    pointsPrice: 7,
    image: productImage('pen-light-blue.jpeg'),
    sourceUrl: 'https://www.vistaprint.ca/promotional-products/writing-office/pens/vistaprint-r-design-wrap-ballpoint-pen',
    variantImages: Object.fromEntries(logoColors.map((logo) => [imageVariant('White', logo), productImage(`pen-${logo.toLowerCase().replaceAll(' ', '-')}.jpeg`)])),
    category: 'Office Supplies',
    colorVariants: ['White'],
    logoVariants: logoColors,
    inventory: 150,
    badge: 'SALE',
    status: 'active',
  },
  {
    id: 'vistaprint-usb-flash-drive',
    name: 'USB Flash Drive 8 GB',
    description: 'Compact USB drive with clean top-facing Moneetize logo artwork.',
    pointsPrice: 25,
    image: productImage('flash-drive-light-blue.jpeg'),
    sourceUrl: 'https://www.vistaprint.ca/promotional-products/technology/usb-flash-drives/8-gb',
    variantImages: Object.fromEntries(logoColors.map((logo) => [imageVariant('White', logo), productImage(`flash-drive-${logo.toLowerCase().replaceAll(' ', '-')}.jpeg`)])),
    category: 'Technology',
    colorVariants: ['White'],
    logoVariants: logoColors,
    inventory: 90,
    badge: 'NEW',
    status: 'active',
  },
  {
    id: 'vistaprint-wireless-charger',
    name: 'Wireless Charging Pad',
    description: 'Compact Qi charging pad with edge-to-edge Moneetize artwork.',
    pointsPrice: 33,
    image: productImage('black-wireless-charger-light-blue.jpeg'),
    sourceUrl: 'https://www.vistaprint.ca/promotional-products/technology/wireless-chargers/wireless-charging-pad',
    variantImages: {
      [imageVariant('Black', 'Green')]: productImage('black-wireless-charger-green.jpeg'),
      [imageVariant('Black', 'Light Blue')]: productImage('black-wireless-charger-light-blue.jpeg'),
      [imageVariant('Black', 'Pink')]: productImage('black-wireless-charger-pink.jpeg'),
      [imageVariant('Black', 'Purple')]: productImage('black-wireless-charger-purple.jpeg'),
      [imageVariant('Black', 'Yellow')]: productImage('black-wireless-charger-yellow.jpeg'),
      [imageVariant('White', 'Dark Blue')]: productImage('white-wireless-charger-dark-blue.jpeg'),
      [imageVariant('White', 'Green')]: productImage('white-wireless-charger-green.jpeg'),
      [imageVariant('White', 'Light Blue')]: productImage('white-wireless-charger-light-blue.jpeg'),
      [imageVariant('White', 'Pink')]: productImage('white-wireless-charger-pink.jpeg'),
      [imageVariant('White', 'Purple')]: productImage('white-wireless-charger-purple.jpeg'),
      [imageVariant('White', 'Yellow')]: productImage('white-wireless-charger-yellow.jpeg'),
    },
    category: 'Technology',
    colorVariants: ['Black', 'White'],
    logoVariants: ['Green', 'Light Blue', 'Pink', 'Purple', 'Yellow', 'Dark Blue'],
    inventory: 80,
    badge: 'HOT',
    status: 'active',
  },
  {
    id: 'vistaprint-bluetooth-speaker',
    name: 'Bluetooth Speaker',
    description: 'Portable speaker reward with a clean Moneetize lockup.',
    pointsPrice: 40,
    image: productImage('speaker.png'),
    category: 'Technology',
    colorVariants: ['White'],
    logoVariants: ['Black'],
    inventory: 45,
    badge: 'HOT',
    status: 'active',
  },
  {
    id: 'vistaprint-insulated-mug',
    name: 'Insulated Mug',
    description: 'Launch-ready insulated mug with the Moneetize wordmark.',
    pointsPrice: 47,
    image: productImage('insulated-mug.png'),
    category: 'Drinkware',
    colorVariants: ['Black'],
    logoVariants: ['White'],
    inventory: 60,
    badge: 'NEW',
    status: 'active',
  },
  {
    id: 'vistaprint-power-bank',
    name: 'Power Bank',
    description: 'Portable charging reward with vertical Moneetize branding.',
    pointsPrice: 63,
    image: productImage('power-bank.png'),
    category: 'Technology',
    colorVariants: ['White'],
    logoVariants: ['Black'],
    inventory: 50,
    badge: 'NEW',
    status: 'active',
  },
  {
    id: 'vistaprint-headphones',
    name: 'Wireless Headphones',
    description: 'Premium headphones with compact icon branding.',
    pointsPrice: 75,
    image: productImage('headphones-white.png'),
    category: 'Technology',
    colorVariants: ['White'],
    logoVariants: ['Black'],
    inventory: 35,
    badge: 'HOT',
    status: 'active',
  },
  {
    id: 'vistaprint-backpack',
    name: 'Moneetize Backpack',
    description: 'Premium backpack reward with multiple logo color variants.',
    pointsPrice: 105,
    image: productImage('black-backpack-dark-blue.png'),
    variantImages: {
      [imageVariant('Black', 'Dark Blue')]: productImage('black-backpack-dark-blue.png'),
      [imageVariant('Black', 'White')]: productImage('black-backpack-white.png'),
      [imageVariant('Black', 'Pink')]: productImage('black-backpack-pink.png'),
      [imageVariant('Black', 'Purple')]: productImage('black-backpack-purple.png'),
      [imageVariant('Blue', 'Yellow')]: productImage('blue-backpack-yellow.png'),
      [imageVariant('Blue', 'Light Blue')]: productImage('blue-backpack-light-blue.png'),
    },
    category: 'Bags',
    colorVariants: ['Black', 'Blue'],
    logoVariants: ['Dark Blue', 'White', 'Pink', 'Purple', 'Yellow', 'Light Blue'],
    inventory: 30,
    featured: true,
    badge: 'NEW',
    status: 'active',
  },
  {
    id: 'vistaprint-keychain',
    name: 'Photo Keychain',
    description: 'Steel-frame keychain with compact Moneetize logo insert.',
    pointsPrice: 10,
    image: productImage('keychain-light-blue.jpeg'),
    sourceUrl: 'https://www.vistaprint.ca/promotional-products/household/keychains/vistaprint-r-photo-keychain',
    variantImages: Object.fromEntries(logoColors.map((logo) => [imageVariant('Steel', logo), productImage(`keychain-${logo.toLowerCase().replaceAll(' ', '-')}.jpeg`)])),
    category: 'Lifestyle',
    colorVariants: ['Steel'],
    logoVariants: logoColors,
    inventory: 140,
    badge: 'NEW',
    status: 'active',
  },
];

const legacyDefaultProductIds = new Set([
  'founder-tee',
  'signature-hoodie',
  'oversized-logo-tee',
  'zip-hoodie',
  'classic-cap',
  'launch-beanie',
  'desk-mug',
  'thermal-bottle',
]);

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
    image: normalizeMarketplaceImagePath(product.image),
    variantImages: normalizeMarketplaceVariantImages(product.variantImages),
    pointsPrice: Number.isFinite(Number(product.pointsPrice)) ? Math.max(0, Math.round(Number(product.pointsPrice))) : 0,
    inventory: Number.isFinite(Number(product.inventory)) ? Math.max(0, Math.round(Number(product.inventory))) : 0,
    colorVariants: product.colorVariants?.length ? product.colorVariants : ['Black'],
    logoVariants: product.logoVariants?.length ? product.logoVariants : ['Horizontal'],
    status: 'active',
  };
}

function mergeDefaultProducts(storedProducts: MarketplaceProduct[] | null) {
  if (!storedProducts?.length) return defaultMarketplaceProducts;

  const storedById = new Map(storedProducts.map((product) => [product.id, product]));
  const mergedDefaults = defaultMarketplaceProducts.map((product) => ({
    ...product,
    ...storedById.get(product.id),
  }));
  const customProducts = storedProducts.filter((product) => (
    !defaultMarketplaceProducts.some((defaultProduct) => defaultProduct.id === product.id) &&
    !legacyDefaultProductIds.has(product.id)
  ));

  return [...mergedDefaults, ...customProducts];
}

function emitMarketplaceUpdate() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(MARKETPLACE_PRODUCTS_UPDATED_EVENT));
}

function emitMarketplaceOrdersUpdate() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(MARKETPLACE_ORDERS_UPDATED_EVENT));
}

function parseOrderList(value: string | null) {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed as MarketplaceOrder[] : [];
  } catch {
    return [];
  }
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
    const existingOrders = loadMarketplaceOrders();
    const nextOrders = [
      order,
      ...existingOrders.filter((existingOrder) => existingOrder.id !== order.id),
    ].slice(0, 100);
    safeSetItem(MARKETPLACE_ORDERS_KEY, JSON.stringify(nextOrders));
  } catch {
    safeSetItem(MARKETPLACE_ORDERS_KEY, JSON.stringify([order]));
  }

  emitMarketplaceOrdersUpdate();
  return order;
}

export function loadMarketplaceOrders() {
  return parseOrderList(safeGetItem(MARKETPLACE_ORDERS_KEY));
}

interface MarketplaceOrderResponse {
  success?: boolean;
  data?: {
    order?: MarketplaceOrder;
    orders?: MarketplaceOrder[];
    products?: MarketplaceProduct[];
  };
  error?: string;
}

interface MarketplaceProductsResponse {
  success?: boolean;
  data?: {
    products?: MarketplaceProduct[];
  };
  error?: string;
}

async function readJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  return text ? (JSON.parse(text) as T) : ({} as T);
}

function authHeaders() {
  const accessToken = safeGetItem('access_token');

  return {
    Authorization: `Bearer ${publicAnonKey}`,
    apikey: publicAnonKey,
    'Content-Type': 'application/json',
    ...(accessToken ? { 'x-user-token': accessToken } : {}),
  };
}

export async function loadMarketplaceProductsFromServer() {
  const localProducts = loadMarketplaceProducts();

  try {
    const response = await fetch(`${MARKETPLACE_API_URL}/marketplace/products`, {
      method: 'GET',
      headers: authHeaders(),
    });
    const result = await readJson<MarketplaceProductsResponse>(response);

    if (!response.ok || !result.success || !result.data?.products?.length) {
      return localProducts;
    }

    return saveMarketplaceProducts(mergeDefaultProducts(result.data.products));
  } catch {
    return localProducts;
  }
}

export async function saveMarketplaceProductsToServer(products: MarketplaceProduct[]) {
  const localProducts = saveMarketplaceProducts(products);
  const accessToken = safeGetItem('access_token');
  if (!accessToken) {
    throw new Error('Admin login is required to save marketplace products.');
  }

  const response = await fetch(`${MARKETPLACE_API_URL}/admin/marketplace-products`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ products: localProducts }),
  });
  const result = await readJson<MarketplaceProductsResponse>(response);

  if (!response.ok || !result.success || !result.data?.products) {
    throw new Error(result.error || 'Failed to save marketplace products to the server.');
  }

  return saveMarketplaceProducts(result.data.products);
}

export async function submitMarketplaceOrder(order: MarketplaceOrder) {
  const queuedOrder: MarketplaceOrder = {
    ...order,
    adminEmail: order.adminEmail || MARKETPLACE_ADMIN_EMAIL,
    emailDelivery: order.emailDelivery || 'queued',
    updatedAt: new Date().toISOString(),
  };

  const accessToken = safeGetItem('access_token');
  if (!accessToken) {
    return saveMarketplaceOrder(queuedOrder);
  }

  try {
    const response = await fetch(`${MARKETPLACE_API_URL}/marketplace/order`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        ...queuedOrder,
        catalog: loadMarketplaceProducts(),
      }),
    });
    const result = await readJson<MarketplaceOrderResponse>(response);

    if (!response.ok || !result.success || !result.data?.order) {
      throw new Error(result.error || response.statusText || 'Marketplace order failed.');
    }

    if (typeof result.data.order.pointsBalanceAfter === 'number') {
      setUserPoints(result.data.order.pointsBalanceAfter);
    }

    if (result.data.products?.length) {
      saveMarketplaceProducts(result.data.products);
    }

    return saveMarketplaceOrder(result.data.order);
  } catch (error) {
    console.warn('Marketplace order failed before redemption was confirmed.', error);
    throw error;
  }
}

export async function loadMarketplaceOrdersFromServer() {
  const localOrders = loadMarketplaceOrders();
  const accessToken = safeGetItem('access_token');
  if (!accessToken) return localOrders;

  try {
    const response = await fetch(`${MARKETPLACE_API_URL}/admin/marketplace-orders`, {
      method: 'GET',
      headers: authHeaders(),
    });
    const result = await readJson<MarketplaceOrderResponse>(response);

    if (!response.ok || !result.success || !result.data?.orders) {
      return localOrders;
    }

    const mergedOrders = [
      ...result.data.orders,
      ...localOrders.filter((localOrder) => (
        !result.data?.orders?.some((remoteOrder) => remoteOrder.id === localOrder.id)
      )),
    ].slice(0, 100);

    safeSetItem(MARKETPLACE_ORDERS_KEY, JSON.stringify(mergedOrders));
    emitMarketplaceOrdersUpdate();
    return mergedOrders;
  } catch {
    return localOrders;
  }
}
