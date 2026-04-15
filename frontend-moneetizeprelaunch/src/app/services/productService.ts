import { projectId, publicAnonKey } from '/utils/supabase/info';
import { safeGetItem } from '../utils/storage';

export interface Product {
  id: string;
  name: string;
  brand: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  rating: number;
  reviews: number;
  recommended?: boolean;
  tags: string[];
  investmentType?: string[];
  url?: string;
  amazon_asin?: string;
  bullet_points?: string;
  all_image_urls?: string;
  seller?: string;
  subcategory?: string;
  publisher?: string;
  language?: string;
  publication_date?: string;
}

type ProductCatalogResponse = {
  success?: boolean;
  data?: {
    products?: Product[];
    total?: number;
  };
  error?: string;
};

const PRODUCTS_API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-7a79873f/products`;

function authHeaders(requireAdmin = false) {
  const accessToken = safeGetItem('access_token');

  if (requireAdmin && !accessToken) {
    throw new Error('Please log in with an admin account before saving products.');
  }

  return {
    Authorization: `Bearer ${publicAnonKey}`,
    apikey: publicAnonKey,
    'Content-Type': 'application/json',
    ...(requireAdmin && accessToken ? { 'x-user-token': accessToken } : {}),
  };
}

async function readJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  return text ? (JSON.parse(text) as T) : ({} as T);
}

export async function loadProductCatalog(): Promise<Product[]> {
  const response = await fetch(PRODUCTS_API_URL, {
    method: 'GET',
    headers: authHeaders(),
  });

  const result = await readJson<ProductCatalogResponse>(response);

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Failed to load products.');
  }

  return result.data?.products || [];
}

export async function saveProductCatalog(products: Product[]): Promise<Product[]> {
  const response = await fetch(PRODUCTS_API_URL, {
    method: 'PUT',
    headers: authHeaders(true),
    body: JSON.stringify({ products }),
  });

  const result = await readJson<ProductCatalogResponse>(response);

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Failed to save products.');
  }

  return result.data?.products || products;
}
