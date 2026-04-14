import { safeGetItem, safeSetItem } from '../utils/storage';

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
  items: MarketplaceOrderItem[];
  pointsTotal: number;
  paymentMethod: 'points';
  createdAt: string;
}

const MARKETPLACE_PRODUCTS_KEY = 'moneetizeMarketplaceProducts';
const MARKETPLACE_ORDERS_KEY = 'moneetizeMarketplaceOrders';
export const MARKETPLACE_PRODUCTS_UPDATED_EVENT = 'moneetize-marketplace-products-updated';

const productAssetPath = '/marketplace/products/';
const logoColors = ['Black', 'Dark Blue', 'Green', 'Light Blue', 'Pink', 'Purple', 'Yellow'];

function imageVariant(color: string, logo: string) {
  return `${color}__${logo}`;
}

function productImage(fileName: string) {
  return `${productAssetPath}${fileName}`;
}

export const defaultMarketplaceProducts: MarketplaceProduct[] = [
  {
    id: 'vistaprint-gildan-tee',
    name: 'Gildan Unisex T-Shirt',
    description: 'Classic everyday tee with Moneetize logo placement for pre-game reward drops.',
    pointsPrice: 75,
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
    pointsPrice: 210,
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
    pointsPrice: 140,
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
    pointsPrice: 130,
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
    pointsPrice: 95,
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
    pointsPrice: 170,
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
    pointsPrice: 150,
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
    pointsPrice: 35,
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
    pointsPrice: 80,
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
    pointsPrice: 120,
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
    id: 'vistaprint-keychain',
    name: 'Photo Keychain',
    description: 'Steel-frame keychain with compact Moneetize logo insert.',
    pointsPrice: 45,
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
