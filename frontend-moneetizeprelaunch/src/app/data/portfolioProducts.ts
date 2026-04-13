import type { Product } from '../services/productService';

export const PROFILE_FEED_FALLBACK_PRODUCTS: Product[] = [
  {
    id: 'fallback-potting-soil',
    name: 'High-Quality Potting Soil',
    brand: 'Potting Soil',
    description: 'This soil keeps roots hydrated, soft, and radiant all day. Say hello to a fresh product discovery.',
    price: 74.98,
    image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=900&q=80',
    category: 'home',
    rating: 2,
    reviews: 32,
    tags: ['home', 'garden', 'clean eating'],
    investmentType: ['moderate', 'conservative'],
  },
  {
    id: 'fallback-dumbbells',
    name: 'Steel Dumbbells',
    brand: 'Lift Lab',
    description: 'A compact strength set trending with the team for daily check-in and fitness point opportunities.',
    price: 12.59,
    originalPrice: 29.99,
    image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=80',
    category: 'fitness',
    rating: 4.5,
    reviews: 48,
    tags: ['fitness', 'sports', 'team'],
    investmentType: ['aggressive', 'moderate'],
  },
  {
    id: 'fallback-vision-pro',
    name: 'Apple Vision Pro',
    brand: 'Spatial Tech',
    description: 'A premium tech discovery selected for early adopters building their saved product portfolio.',
    price: 3499.99,
    image: 'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?auto=format&fit=crop&w=900&q=80',
    category: 'tech',
    rating: 3.3,
    reviews: 76,
    tags: ['tech', 'electronics', 'gadgets'],
    investmentType: ['aggressive'],
  },
  {
    id: 'fallback-face-mask',
    name: 'Bubble Clean Face Mask',
    brand: 'Bubble Clean',
    description: 'A playful skincare card for beauty fans looking for small product actions that build points.',
    price: 2.99,
    image: 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?auto=format&fit=crop&w=900&q=80',
    category: 'beauty',
    rating: 3.5,
    reviews: 91,
    tags: ['beauty', 'skincare', 'lifestyle'],
    investmentType: ['moderate', 'conservative'],
  },
  {
    id: 'fallback-knit-sweater',
    name: 'Soft Kettlebells',
    brand: 'Cozy Fit',
    description: 'A soft fashion-and-fitness pick for saved products, network sharing, and hidden-product discovery quests.',
    price: 12.23,
    originalPrice: 95,
    image: 'https://images.unsplash.com/photo-1593079831268-3381b0db4a77?auto=format&fit=crop&w=900&q=80',
    category: 'fitness',
    rating: 4.5,
    reviews: 114,
    tags: ['fitness', 'wellness', 'lifestyle'],
    investmentType: ['moderate'],
  },
  {
    id: 'fallback-protein-powder',
    name: 'Elite Protein Powder',
    brand: 'VitalEdge Nutrition',
    description: 'Elite Protein Powder 90g is made from a blend of whey protein concentrate and isolate. Manufacturing method: the raw materials undergo natural filtration and spray drying. These processing methods produce a completely natural product that preserves all the beneficial properties.',
    price: 65.43,
    image: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?auto=format&fit=crop&w=900&q=80',
    category: 'fitness',
    rating: 4.9,
    reviews: 324,
    tags: ['fitness', 'nutrition', 'wellness'],
    investmentType: ['aggressive', 'moderate'],
    seller: 'VitalEdge Nutrition',
  },
  {
    id: 'fallback-food-containers',
    name: 'Food Containers',
    brand: 'Clean Kitchen',
    description: 'Stackable containers for weekly meal prep and clean eating routines.',
    price: 33.34,
    image: 'https://images.unsplash.com/photo-1584473457409-ce6a3f4bf1e9?auto=format&fit=crop&w=900&q=80',
    category: 'home & kitchen',
    rating: 4.7,
    reviews: 86,
    tags: ['home', 'kitchen', 'food'],
    investmentType: ['conservative', 'moderate'],
  },
];

export const PORTFOLIO_CATEGORY_ORDER = ['fitness', 'home & kitchen', 'tech', 'fashion'];

export function formatProductCategory(category: string) {
  return category
    .split(/[\s&-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(category.includes('&') ? ' & ' : ' ');
}

export function getProductPerformance(product: Product) {
  const seed = product.id.split('').reduce((total, character) => total + character.charCodeAt(0), 0);
  const progress = 18 + (seed % 73);
  const roi = Number((2 + (seed % 58) / 10).toFixed(1));
  const fundingGoal = product.price > 100 ? 2000 : 330;

  return {
    progress,
    roi,
    fundingGoal,
    fundedAmount: Math.round((fundingGoal * progress) / 100),
    generatedValue: Number((product.price * (1 + roi / 100)).toFixed(2)),
  };
}
