import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import { 
  ChevronLeft,
  Plus, 
  Trash2, 
  Edit, 
  Save, 
  X, 
  Upload,
  DollarSign,
  Tag,
  Image as ImageIcon,
  Package,
  Users,
  TrendingUp,
  LogOut,
  Eye,
  Star,
  ShoppingBag,
  FileSpreadsheet,
  Download,
  CheckCircle,
  AlertCircle,
  Bell,
  Send
} from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { isAuthenticated, isUserAdmin, logoutUser } from '../services/authService';
import { loadProductCatalog, saveProductCatalog } from '../services/productService';
import { grantEarlyAccessRequest, loadEarlyAccessRequests, type EarlyAccessRequest } from '../services/earlyAccessService';
import { safeGetItem } from '../utils/storage';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import {
  loadMarketplaceProducts,
  loadMarketplaceProductsFromServer,
  loadMarketplaceOrders,
  loadMarketplaceOrdersFromServer,
  saveMarketplaceProducts,
  saveMarketplaceProductsToServer,
  MARKETPLACE_ORDERS_UPDATED_EVENT,
  type MarketplaceOrder,
  type MarketplaceProduct,
} from '../services/marketplaceService';
import {
  loadAdminNotifications,
  sendAdminNetworkNotification,
  type NetworkNotification,
} from '../services/notificationService';

interface Product {
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
  // Additional fields from spreadsheet
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

const investmentTypes = [
  { id: 'passion', label: 'Passion Projects' },
  { id: 'income', label: 'Supplemental Income' },
  { id: 'save', label: 'Save for Goal' },
  { id: 'maximize', label: 'Maximize Returns' }
];

const categories = [
  'Beauty', 'Skincare', 'Fitness', 'Tech', 'Home', 'Food', 
  'Fashion', 'Books', 'Pets', 'Art', 'Gaming', 'Grocery'
];

type AdminTab = 'products' | 'earlyAccess' | 'marketplace' | 'notifications' | 'admins';

interface AdminUserRecord {
  id?: string;
  email: string;
  name?: string;
  created_at?: string;
  source?: 'core' | 'added' | 'metadata';
  protected?: boolean;
  accountExists?: boolean;
  metadataAdmin?: boolean;
}

type AdminUsersResponse = {
  success?: boolean;
  data?: {
    admins?: AdminUserRecord[];
    metadataUpdate?: {
      success?: boolean;
      error?: string;
      status?: number;
    };
  };
  error?: string;
};

const marketplaceCategories = ['Shirts', 'Hoodies', 'Bags', 'Hats', 'Headwear', 'Drinkware', 'Office Supplies', 'Technology', 'Lifestyle'];
const ADMIN_API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-7a79873f/admin`;

function createMarketplaceDraft(): MarketplaceProduct {
  return {
    id: '',
    name: '',
    description: '',
    pointsPrice: 47,
    image: '',
    category: 'Shirts',
    colorVariants: ['Black', 'White'],
    logoVariants: ['Light Blue'],
    inventory: 50,
    featured: true,
    badge: 'NEW',
    status: 'active',
  };
}

function textToList(value: string) {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

function adminHeaders() {
  const accessToken = safeGetItem('access_token');

  return {
    Authorization: `Bearer ${publicAnonKey}`,
    apikey: publicAnonKey,
    'Content-Type': 'application/json',
    ...(accessToken ? { 'x-user-token': accessToken } : {}),
  };
}

async function readAdminJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  return text ? (JSON.parse(text) as T) : ({} as T);
}

function isValidAdminEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function AdminPanel() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [activeAdminTab, setActiveAdminTab] = useState<AdminTab>('products');
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    brand: '',
    description: '',
    price: 0,
    originalPrice: 0,
    image: '',
    category: 'Beauty',
    rating: 4.5,
    reviews: 0,
    recommended: true,
    tags: [],
    investmentType: []
  });
  const [newTag, setNewTag] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importPreview, setImportPreview] = useState<Product[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [isProcessingImport, setIsProcessingImport] = useState(false);
  const [earlyAccessRequests, setEarlyAccessRequests] = useState<EarlyAccessRequest[]>([]);
  const [isLoadingEarlyAccess, setIsLoadingEarlyAccess] = useState(false);
  const [grantingEarlyAccessId, setGrantingEarlyAccessId] = useState<string | null>(null);
  const [marketplaceProducts, setMarketplaceProducts] = useState<MarketplaceProduct[]>([]);
  const [marketplaceOrders, setMarketplaceOrders] = useState<MarketplaceOrder[]>([]);
  const [marketplaceDraft, setMarketplaceDraft] = useState<MarketplaceProduct>(() => createMarketplaceDraft());
  const [editingMarketplaceId, setEditingMarketplaceId] = useState<string | null>(null);
  const [adminUsers, setAdminUsers] = useState<AdminUserRecord[]>([]);
  const [adminEmailDraft, setAdminEmailDraft] = useState('');
  const [adminUsersMessage, setAdminUsersMessage] = useState('');
  const [isLoadingAdminUsers, setIsLoadingAdminUsers] = useState(false);
  const [savingAdminEmail, setSavingAdminEmail] = useState('');
  const [networkNotifications, setNetworkNotifications] = useState<NetworkNotification[]>([]);
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationImageUrl, setNotificationImageUrl] = useState('');
  const [notificationStatus, setNotificationStatus] = useState('');
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [isSendingNotification, setIsSendingNotification] = useState(false);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedInvestmentType, setSelectedInvestmentType] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<string>('all');
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'rating' | 'category'>('category');

  useEffect(() => {
    const hasAdminAccess = isAuthenticated() && isUserAdmin();
    setIsAdmin(hasAdminAccess);
    setIsCheckingAdmin(false);

    if (hasAdminAccess) {
      loadProducts();
      loadEarlyAccessQueue();
      void loadAdminUsers();
      void loadNetworkNotifications();
      loadMarketplaceCatalog();
      void loadMarketplaceOrdersQueue();
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) return;

    const syncMarketplaceOrders = () => setMarketplaceOrders(loadMarketplaceOrders());
    window.addEventListener(MARKETPLACE_ORDERS_UPDATED_EVENT, syncMarketplaceOrders);
    window.addEventListener('storage', syncMarketplaceOrders);

    return () => {
      window.removeEventListener(MARKETPLACE_ORDERS_UPDATED_EVENT, syncMarketplaceOrders);
      window.removeEventListener('storage', syncMarketplaceOrders);
    };
  }, [isAdmin]);

  const loadProducts = async () => {
    try {
      const productsData = await loadProductCatalog();
      setProducts(productsData);
    } catch (error) {
      console.error('Failed to load product catalog:', error);
      alert(error instanceof Error ? error.message : 'Failed to load product catalog');
    }
  };

  const saveProducts = async (updatedProducts: Product[]) => {
    try {
      const savedProducts = await saveProductCatalog(updatedProducts);
      setProducts(savedProducts);
    } catch (error) {
      console.error('Failed to save product catalog:', error);
      alert(error instanceof Error ? error.message : 'Failed to save product catalog');
    }
  };

  const loadEarlyAccessQueue = async () => {
    try {
      setIsLoadingEarlyAccess(true);
      const requests = await loadEarlyAccessRequests();
      setEarlyAccessRequests(requests);
    } catch (error) {
      console.error('Failed to load early access requests:', error);
    } finally {
      setIsLoadingEarlyAccess(false);
    }
  };

  const loadMarketplaceCatalog = () => {
    setMarketplaceProducts(loadMarketplaceProducts());
    setMarketplaceOrders(loadMarketplaceOrders());
    void loadMarketplaceProductsFromServer().then(setMarketplaceProducts).catch((error) => {
      console.error('Failed to load marketplace catalog from server:', error);
    });
  };

  const loadMarketplaceOrdersQueue = async () => {
    setMarketplaceOrders(await loadMarketplaceOrdersFromServer());
  };

  const loadAdminUsers = async () => {
    try {
      setIsLoadingAdminUsers(true);
      const response = await fetch(`${ADMIN_API_URL}/admin-users`, {
        method: 'GET',
        headers: adminHeaders(),
      });
      const result = await readAdminJson<AdminUsersResponse>(response);

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to load admin users');
      }

      setAdminUsers(result.data?.admins || []);
    } catch (error) {
      console.error('Failed to load admin users:', error);
      setAdminUsersMessage(error instanceof Error ? error.message : 'Failed to load admin users.');
    } finally {
      setIsLoadingAdminUsers(false);
    }
  };

  const loadNetworkNotifications = async () => {
    try {
      setIsLoadingNotifications(true);
      const notifications = await loadAdminNotifications();
      setNetworkNotifications(notifications);
    } catch (error) {
      console.error('Failed to load network notifications:', error);
      setNotificationStatus(error instanceof Error ? error.message : 'Failed to load notifications.');
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  const handleSendNetworkNotification = async () => {
    const title = notificationTitle.trim() || 'Moneetize update';
    const message = notificationMessage.trim();
    const imageUrl = notificationImageUrl.trim();
    setNotificationStatus('');

    if (!message && !imageUrl) {
      setNotificationStatus('Add message text or an image URL before sending.');
      return;
    }

    try {
      setIsSendingNotification(true);
      const result = await sendAdminNetworkNotification({ title, message, imageUrl });
      setNetworkNotifications(result.notifications);
      setNotificationTitle('');
      setNotificationMessage('');
      setNotificationImageUrl('');

      const summary = result.notification?.emailSummary;
      const sent = Number(summary?.sent) || 0;
      const queued = Number(summary?.queued) || 0;
      const failed = Number(summary?.failed) || 0;
      setNotificationStatus(`Notification posted. Email: ${sent} sent, ${queued} queued, ${failed} failed.`);
    } catch (error) {
      console.error('Failed to send network notification:', error);
      setNotificationStatus(error instanceof Error ? error.message : 'Failed to send notification.');
    } finally {
      setIsSendingNotification(false);
    }
  };

  const handleAddAdminUser = async () => {
    const email = adminEmailDraft.trim().toLowerCase();
    setAdminUsersMessage('');

    if (!isValidAdminEmail(email)) {
      setAdminUsersMessage('Enter a valid email address before adding an admin.');
      return;
    }

    try {
      setSavingAdminEmail(email);
      const response = await fetch(`${ADMIN_API_URL}/admin-users`, {
        method: 'POST',
        headers: adminHeaders(),
        body: JSON.stringify({ email }),
      });
      const result = await readAdminJson<AdminUsersResponse>(response);

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to add admin user');
      }

      setAdminUsers(result.data?.admins || []);
      setAdminEmailDraft('');
      setAdminUsersMessage(
        result.data?.metadataUpdate?.success === false
          ? `${email} was added to the admin list. Create that account or save its profile before metadata can be synced.`
          : `${email} can now access the admin panel.`,
      );
    } catch (error) {
      console.error('Failed to add admin user:', error);
      setAdminUsersMessage(error instanceof Error ? error.message : 'Failed to add admin user.');
    } finally {
      setSavingAdminEmail('');
    }
  };

  const handleRemoveAdminUser = async (email: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) return;
    if (!confirm(`Remove admin access for ${normalizedEmail}?`)) return;

    try {
      setSavingAdminEmail(normalizedEmail);
      const response = await fetch(`${ADMIN_API_URL}/admin-users/${encodeURIComponent(normalizedEmail)}`, {
        method: 'DELETE',
        headers: adminHeaders(),
      });
      const result = await readAdminJson<AdminUsersResponse>(response);

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to remove admin user');
      }

      setAdminUsers(result.data?.admins || []);
      setAdminUsersMessage(`${normalizedEmail} was removed from editable admin access.`);
    } catch (error) {
      console.error('Failed to remove admin user:', error);
      setAdminUsersMessage(error instanceof Error ? error.message : 'Failed to remove admin user.');
    } finally {
      setSavingAdminEmail('');
    }
  };

  const handleGrantEarlyAccess = async (requestId: string) => {
    try {
      setGrantingEarlyAccessId(requestId);
      const updatedRequest = await grantEarlyAccessRequest(requestId);
      setEarlyAccessRequests((requests) => requests.map((request) => (
        request.id === requestId ? updatedRequest : request
      )));
    } catch (error) {
      console.error('Failed to grant early access:', error);
      alert(error instanceof Error ? error.message : 'Failed to grant early access');
    } finally {
      setGrantingEarlyAccessId(null);
    }
  };

  const resetMarketplaceForm = () => {
    setMarketplaceDraft(createMarketplaceDraft());
    setEditingMarketplaceId(null);
  };

  const handleMarketplaceEdit = (product: MarketplaceProduct) => {
    setMarketplaceDraft({ ...product });
    setEditingMarketplaceId(product.id);
    setActiveAdminTab('marketplace');
  };

  const handleMarketplaceSave = async () => {
    if (!marketplaceDraft.name.trim() || !marketplaceDraft.description.trim()) {
      alert('Please add a marketplace product name and description.');
      return;
    }

    const productId = editingMarketplaceId || `marketplace-${Date.now()}`;
    const nextProduct: MarketplaceProduct = {
      ...marketplaceDraft,
      id: productId,
      name: marketplaceDraft.name.trim(),
      description: marketplaceDraft.description.trim(),
      pointsPrice: Math.max(0, Math.round(Number(marketplaceDraft.pointsPrice) || 0)),
      inventory: Math.max(0, Math.round(Number(marketplaceDraft.inventory) || 0)),
      colorVariants: marketplaceDraft.colorVariants.length ? marketplaceDraft.colorVariants : ['Black'],
      logoVariants: marketplaceDraft.logoVariants.length ? marketplaceDraft.logoVariants : ['Light Blue'],
    };

    const updatedProducts = editingMarketplaceId
      ? marketplaceProducts.map((product) => (product.id === editingMarketplaceId ? nextProduct : product))
      : [nextProduct, ...marketplaceProducts];

    try {
      setMarketplaceProducts(await saveMarketplaceProductsToServer(updatedProducts));
      resetMarketplaceForm();
    } catch (error) {
      console.error('Failed to save marketplace product:', error);
      alert(error instanceof Error ? error.message : 'Failed to save marketplace product');
    }
  };

  const handleMarketplaceDelete = async (productId: string) => {
    if (!confirm('Delete this marketplace product?')) return;
    try {
      setMarketplaceProducts(await saveMarketplaceProductsToServer(marketplaceProducts.filter((product) => product.id !== productId)));
      if (editingMarketplaceId === productId) {
        resetMarketplaceForm();
      }
    } catch (error) {
      console.error('Failed to delete marketplace product:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete marketplace product');
    }
  };

  const handleMarketplaceInventoryChange = async (productId: string, nextInventory: number) => {
    const normalizedInventory = Math.max(0, Math.round(Number(nextInventory) || 0));
    const updatedProducts = marketplaceProducts.map((product) => (
      product.id === productId ? { ...product, inventory: normalizedInventory } : product
    ));

    setMarketplaceProducts(saveMarketplaceProducts(updatedProducts));
    saveMarketplaceProductsToServer(updatedProducts)
      .then(setMarketplaceProducts)
      .catch((error) => {
        console.error('Failed to sync marketplace inventory:', error);
      });

    if (editingMarketplaceId === productId) {
      setMarketplaceDraft((current) => ({ ...current, inventory: normalizedInventory }));
    }
  };

  const handleLogout = () => {
    logoutUser();
    setIsAdmin(false);
    navigate('/login');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        setNewProduct({ ...newProduct, image: result });
      };
      reader.readAsDataURL(file);
    }
  };

  const addTag = () => {
    if (newTag.trim() && newProduct.tags) {
      setNewProduct({
        ...newProduct,
        tags: [...newProduct.tags, newTag.trim()]
      });
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setNewProduct({
      ...newProduct,
      tags: newProduct.tags?.filter(tag => tag !== tagToRemove) || []
    });
  };

  const toggleInvestmentType = (type: string) => {
    const current = newProduct.investmentType || [];
    if (current.includes(type)) {
      setNewProduct({
        ...newProduct,
        investmentType: current.filter(t => t !== type)
      });
    } else {
      setNewProduct({
        ...newProduct,
        investmentType: [...current, type]
      });
    }
  };

  const handleAddProduct = () => {
    if (!newProduct.name || !newProduct.brand || !newProduct.description || !newProduct.image) {
      alert('Please fill in all required fields');
      return;
    }

    const product: Product = {
      id: Date.now().toString(),
      name: newProduct.name!,
      brand: newProduct.brand!,
      description: newProduct.description!,
      price: newProduct.price || 0,
      originalPrice: newProduct.originalPrice,
      image: newProduct.image!,
      category: newProduct.category || 'Beauty',
      rating: newProduct.rating || 4.5,
      reviews: newProduct.reviews || 0,
      recommended: newProduct.recommended || false,
      tags: newProduct.tags || [],
      investmentType: newProduct.investmentType || []
    };

    const updatedProducts = [...products, product];
    saveProducts(updatedProducts);
    
    // Reset form
    setNewProduct({
      name: '',
      brand: '',
      description: '',
      price: 0,
      originalPrice: 0,
      image: '',
      category: 'Beauty',
      rating: 4.5,
      reviews: 0,
      recommended: true,
      tags: [],
      investmentType: []
    });
    setImagePreview('');
    setIsAddingProduct(false);
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      const updatedProducts = products.filter(p => p.id !== id);
      await saveProducts(updatedProducts);
    }
  };

  const handleUpdateProduct = () => {
    if (!editingProduct) return;

    const updatedProducts = products.map(p => 
      p.id === editingProduct.id ? editingProduct : p
    );
    saveProducts(updatedProducts);
    setEditingProduct(null);
  };

  const handleExportProducts = () => {
    const worksheet = XLSX.utils.json_to_sheet(products);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');
    XLSX.writeFile(workbook, 'products.xlsx');
  };

  const handleImportProducts = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsProcessingImport(true);
      setImportErrors([]);
      setImportPreview([]);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        try {
          const data = reader.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
          
          const errors: string[] = [];
          const importedProducts: Product[] = [];

          json.forEach((row: any, index: number) => {
            try {
              // Map spreadsheet columns to Product interface
              const title = row.title || row.name || '';
              const brand = row.brand || '';
              const description = row.description || row.bullet_points || '';
              const price = parseFloat(row.price) || 0;
              const image = row.coverimage_url || row.image || '';
              const rating = parseFloat(row.rating) || 4.5;
              const reviews = parseInt(row.reviews_count || row.reviews) || 0;
              const category = row.category || 'Beauty';
              const interest = row.Interest || row.tags || '';
              
              // Validation
              if (!title) {
                errors.push(`Row ${index + 2}: Missing title/name`);
                return;
              }
              if (!brand) {
                errors.push(`Row ${index + 2}: Missing brand`);
                return;
              }
              if (!image) {
                errors.push(`Row ${index + 2}: Missing image URL`);
                return;
              }

              // Parse tags from Interest column (comma-separated)
              const tags = interest ? interest.toString().split(',').map((t: string) => t.trim()).filter((t: string) => t) : [];

              const product: Product = {
                id: Date.now().toString() + '_' + index,
                name: title,
                brand: brand,
                description: description,
                price: price,
                image: image,
                category: category,
                rating: rating,
                reviews: reviews,
                recommended: false,
                tags: tags,
                investmentType: [],
                // Additional fields from your spreadsheet
                url: row.url || '',
                amazon_asin: row.amazon_asin || '',
                bullet_points: row.bullet_points || '',
                all_image_urls: row.all_image_urls || '',
                seller: row.seller || '',
                subcategory: row.subcategory || '',
                publisher: row.publisher || '',
                language: row.language || '',
                publication_date: row.publication_date || ''
              };

              importedProducts.push(product);
            } catch (err) {
              errors.push(`Row ${index + 2}: Error processing - ${err}`);
            }
          });

          if (errors.length > 0) {
            setImportErrors(errors);
          } else {
            setImportErrors([]);
          }

          if (importedProducts.length > 0) {
            setImportPreview(importedProducts);
          } else {
            setImportErrors(['No valid products found in the spreadsheet']);
          }
          
          setIsProcessingImport(false);
        } catch (err) {
          setImportErrors([`Failed to read spreadsheet: ${err}`]);
          setIsProcessingImport(false);
        }
      };
      
      reader.onerror = () => {
        setImportErrors(['Failed to read file. Please try again.']);
        setIsProcessingImport(false);
      };
      
      reader.readAsBinaryString(file);
    }
    
    // Reset the input so the same file can be selected again
    e.target.value = '';
  };

  const handleConfirmImport = () => {
    if (importPreview.length === 0) return;
    
    const updatedProducts = [...products, ...importPreview];
    saveProducts(updatedProducts);
    setShowImportModal(false);
    setImportPreview([]);
    setImportErrors([]);
  };

  // Filter and sort products
  const getFilteredAndSortedProducts = () => {
    let filtered = [...products];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.brand.toLowerCase().includes(query) ||
        p.tags.some(tag => tag.toLowerCase().includes(query)) ||
        p.category.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    // Apply investment type filter
    if (selectedInvestmentType !== 'all') {
      filtered = filtered.filter(p => 
        p.investmentType && p.investmentType.includes(selectedInvestmentType)
      );
    }

    // Apply price range filter
    if (priceRange !== 'all') {
      if (priceRange === '0-25') {
        filtered = filtered.filter(p => p.price >= 0 && p.price <= 25);
      } else if (priceRange === '25-50') {
        filtered = filtered.filter(p => p.price > 25 && p.price <= 50);
      } else if (priceRange === '50-100') {
        filtered = filtered.filter(p => p.price > 50 && p.price <= 100);
      } else if (priceRange === '100+') {
        filtered = filtered.filter(p => p.price > 100);
      }
    }

    // Apply rating filter
    if (minRating > 0) {
      filtered = filtered.filter(p => p.rating >= minRating);
    }

    // Apply sorting
    if (sortBy === 'name') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'price') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'rating') {
      filtered.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'category') {
      filtered.sort((a, b) => a.category.localeCompare(b.category));
    }

    return filtered;
  };

  // Group products by category
  const groupProductsByCategory = (products: Product[]) => {
    const grouped: { [key: string]: Product[] } = {};
    products.forEach(product => {
      if (!grouped[product.category]) {
        grouped[product.category] = [];
      }
      grouped[product.category].push(product);
    });
    return grouped;
  };

  const filteredProducts = getFilteredAndSortedProducts();
  const groupedProducts = groupProductsByCategory(filteredProducts);
  const activeMarketplaceProducts = marketplaceProducts.filter((product) => product.status === 'active').length;
  const pendingMarketplaceOrders = marketplaceOrders.filter((order) => (order.status || 'pending') === 'pending').length;

  const renderMarketplaceAdmin = () => (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.055] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] sm:p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-white">
                {editingMarketplaceId ? 'Edit Marketplace Product' : 'Add Marketplace Product'}
              </h2>
              <p className="mt-1 text-xs font-semibold text-white/45">Manage points, variants, images, and supplier links.</p>
            </div>
            <span className="rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-black text-[#8ff0a8]">
              {activeMarketplaceProducts} active
            </span>
          </div>

          <div className="space-y-3">
            <input
              type="text"
              value={marketplaceDraft.name}
              onChange={(event) => setMarketplaceDraft({ ...marketplaceDraft, name: event.target.value })}
              placeholder="Product name"
              className="w-full rounded-full border border-white/10 bg-black/20 px-4 py-3 text-white outline-none placeholder:text-white/28 focus:border-[#8ff0a8]"
            />
            <textarea
              value={marketplaceDraft.description}
              onChange={(event) => setMarketplaceDraft({ ...marketplaceDraft, description: event.target.value })}
              placeholder="Product description"
              rows={3}
              className="w-full resize-none rounded-[1rem] border border-white/10 bg-black/20 px-4 py-3 text-white outline-none placeholder:text-white/28 focus:border-[#8ff0a8]"
            />

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1 block text-xs font-black text-white/42">Points Price</span>
                <input
                  type="number"
                  min={0}
                  value={marketplaceDraft.pointsPrice}
                  onChange={(event) => setMarketplaceDraft({ ...marketplaceDraft, pointsPrice: Number(event.target.value) })}
                  className="w-full rounded-full border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-[#8ff0a8]"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-black text-white/42">Inventory Amount</span>
                <input
                  type="number"
                  min={0}
                  value={marketplaceDraft.inventory}
                  onChange={(event) => setMarketplaceDraft({ ...marketplaceDraft, inventory: Number(event.target.value) })}
                  className="w-full rounded-full border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-[#8ff0a8]"
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <select
                value={marketplaceDraft.category}
                onChange={(event) => setMarketplaceDraft({ ...marketplaceDraft, category: event.target.value })}
                className="rounded-full border border-white/10 bg-[#161a18] px-4 py-3 text-white outline-none focus:border-[#8ff0a8]"
              >
                {marketplaceCategories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <select
                value={marketplaceDraft.status}
                onChange={(event) => setMarketplaceDraft({ ...marketplaceDraft, status: event.target.value as MarketplaceProduct['status'] })}
                className="rounded-full border border-white/10 bg-[#161a18] px-4 py-3 text-white outline-none focus:border-[#8ff0a8]"
              >
                <option value="active">Active</option>
                <option value="draft">Draft</option>
              </select>
            </div>

            <select
              value={marketplaceDraft.badge || 'NEW'}
              onChange={(event) => setMarketplaceDraft({ ...marketplaceDraft, badge: event.target.value as MarketplaceProduct['badge'] })}
              className="w-full rounded-full border border-white/10 bg-[#161a18] px-4 py-3 text-white outline-none focus:border-[#8ff0a8]"
            >
              <option value="NEW">NEW badge</option>
              <option value="HOT">HOT badge</option>
              <option value="SALE">SALE badge</option>
            </select>

            <input
              type="text"
              value={marketplaceDraft.colorVariants.join(', ')}
              onChange={(event) => setMarketplaceDraft({ ...marketplaceDraft, colorVariants: textToList(event.target.value) })}
              placeholder="Colors: Black, White, Blue"
              className="w-full rounded-full border border-white/10 bg-black/20 px-4 py-3 text-white outline-none placeholder:text-white/28 focus:border-[#8ff0a8]"
            />
            <input
              type="text"
              value={marketplaceDraft.logoVariants.join(', ')}
              onChange={(event) => setMarketplaceDraft({ ...marketplaceDraft, logoVariants: textToList(event.target.value) })}
              placeholder="Logo colors: Light Blue, Pink, Yellow"
              className="w-full rounded-full border border-white/10 bg-black/20 px-4 py-3 text-white outline-none placeholder:text-white/28 focus:border-[#8ff0a8]"
            />
            <input
              type="text"
              value={marketplaceDraft.image || ''}
              onChange={(event) => setMarketplaceDraft({ ...marketplaceDraft, image: event.target.value })}
              placeholder="Product image path"
              className="w-full rounded-full border border-white/10 bg-black/20 px-4 py-3 text-white outline-none placeholder:text-white/28 focus:border-[#8ff0a8]"
            />
            <input
              type="text"
              value={marketplaceDraft.sourceUrl || ''}
              onChange={(event) => setMarketplaceDraft({ ...marketplaceDraft, sourceUrl: event.target.value })}
              placeholder="Supplier URL"
              className="w-full rounded-full border border-white/10 bg-black/20 px-4 py-3 text-white outline-none placeholder:text-white/28 focus:border-[#8ff0a8]"
            />

            <div className="grid grid-cols-[1fr_auto] gap-2 pt-2">
              <button
                type="button"
                onClick={handleMarketplaceSave}
                className="h-12 rounded-full bg-white px-4 text-sm font-black text-black transition-colors hover:bg-gray-100"
              >
                {editingMarketplaceId ? 'Save Product' : 'Add Product'}
              </button>
              <button
                type="button"
                onClick={resetMarketplaceForm}
                className="h-12 rounded-full border border-white/10 bg-white/[0.08] px-4 text-sm font-black text-white transition-colors hover:bg-white/12"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.055] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] sm:p-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-black text-white">Marketplace Products</h2>
              <p className="mt-1 text-xs font-semibold text-white/45">{marketplaceProducts.length} products | {activeMarketplaceProducts} active</p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/marketplace')}
              className="rounded-full border border-white/10 bg-white/[0.08] px-3 py-2 text-xs font-black text-white transition-colors hover:bg-white/12"
            >
              View Marketplace
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {marketplaceProducts.map((product) => {
              const isOutOfStock = product.inventory <= 0;

              return (
              <div key={product.id} className="rounded-[1.1rem] border border-white/8 bg-black/20 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                <div className="flex gap-3">
                  <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg bg-black/18">
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="h-full w-full rounded-lg object-contain" />
                    ) : (
                      <Package className="h-7 w-7 text-white/45" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-white">{product.name}</p>
                        <p className="mt-1 text-xs font-black text-[#8ff0a8]">{product.pointsPrice.toLocaleString()} pts</p>
                      </div>
                      <span className={`rounded-md px-2 py-1 text-[10px] font-black ${
                        product.status === 'active' ? 'bg-emerald-400/15 text-emerald-300' : 'bg-white/8 text-white/45'
                      }`}>
                        {product.status}
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-xs leading-snug text-white/52">{product.description}</p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className="rounded-md bg-white/8 px-2 py-1 text-[10px] font-black text-white/45">{product.category}</span>
                  <span className={`rounded-md px-2 py-1 text-[10px] font-black ${
                    isOutOfStock ? 'bg-red-500/15 text-red-300' : 'bg-white/8 text-white/45'
                  }`}>
                    {isOutOfStock ? 'Out of Stock' : `${product.inventory} left`}
                  </span>
                  {product.colorVariants.slice(0, 2).map((color) => (
                    <span key={color} className="rounded-md bg-white/8 px-2 py-1 text-[10px] font-black text-white/45">{color}</span>
                  ))}
                  {product.logoVariants.slice(0, 2).map((logo) => (
                    <span key={logo} className="rounded-md bg-white/8 px-2 py-1 text-[10px] font-black text-white/45">{logo}</span>
                  ))}
                </div>

                <div className="mt-3">
                  <p className="mb-1 text-[10px] font-black uppercase text-white/35">Inventory Amount</p>
                  <div className="grid grid-cols-[38px_1fr_38px] gap-2">
                    <button
                      type="button"
                      onClick={() => handleMarketplaceInventoryChange(product.id, product.inventory - 1)}
                    className="h-9 rounded-full border border-white/10 bg-white/[0.08] text-sm font-black text-white"
                      aria-label={`Decrease ${product.name} inventory`}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={0}
                      value={product.inventory}
                      onChange={(event) => handleMarketplaceInventoryChange(product.id, Number(event.target.value))}
                      className="h-9 rounded-full border border-white/10 bg-black/18 px-3 text-center text-sm font-black text-white outline-none focus:border-[#8ff0a8]"
                      aria-label={`${product.name} inventory amount`}
                    />
                    <button
                      type="button"
                      onClick={() => handleMarketplaceInventoryChange(product.id, product.inventory + 1)}
                      className="h-9 rounded-full border border-white/10 bg-white/[0.08] text-sm font-black text-white"
                      aria-label={`Increase ${product.name} inventory`}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleMarketplaceEdit(product)}
                    className="rounded-full border border-white/10 bg-white/[0.08] px-3 py-2 text-xs font-black text-white transition-colors hover:bg-white/12"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMarketplaceDelete(product.id)}
                    className="rounded-full border border-red-300/15 bg-red-400/10 px-3 py-2 text-xs font-black text-red-200 transition-colors hover:bg-red-400/16"
                  >
                    Delete
                  </button>
                </div>
              </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.055] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] sm:p-5">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-black text-white">Marketplace Orders</h2>
            <p className="mt-1 text-xs font-semibold text-white/45">
              {marketplaceOrders.length} total | {pendingMarketplaceOrders} pending | Confirmations route to admin@moneetize.com and the customer.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadMarketplaceOrdersQueue()}
            className="rounded-full border border-white/10 bg-white/[0.08] px-3 py-2 text-xs font-black text-white transition-colors hover:bg-white/12"
          >
            Refresh Orders
          </button>
        </div>

        {marketplaceOrders.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {marketplaceOrders.map((order) => (
              <div key={order.id} className="rounded-lg border border-white/10 bg-white/[0.055] p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-white">{order.orderNumber || order.id}</p>
                    <p className="mt-1 text-xs font-semibold text-white/45">
                      {new Date(order.createdAt).toLocaleString()} | {order.emailDelivery || 'queued'}
                    </p>
                  </div>
                  <span className="rounded-md border border-[#8ff0a8]/25 bg-[#8ff0a8]/10 px-2 py-1 text-[10px] font-black uppercase text-[#8ff0a8]">
                    {order.status || 'pending'}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-[10px] font-black uppercase text-white/35">Customer</p>
                    <p className="mt-1 text-sm font-black text-white">{order.customer?.name || 'Moneetize user'}</p>
                    <p className="text-xs font-semibold text-white/45">{order.customer?.email || order.userEmail || 'No email'}</p>
                    {order.customer?.phone && <p className="text-xs font-semibold text-white/35">{order.customer.phone}</p>}
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-white/35">Ship To</p>
                    <p className="mt-1 text-xs font-semibold leading-snug text-white/55">
                      {order.shippingAddress
                        ? `${order.shippingAddress.addressLine1}${order.shippingAddress.addressLine2 ? `, ${order.shippingAddress.addressLine2}` : ''}, ${order.shippingAddress.city}, ${order.shippingAddress.region} ${order.shippingAddress.postalCode}, ${order.shippingAddress.country}`
                        : 'Shipping address pending'}
                    </p>
                  </div>
                </div>

                <div className="mt-3 rounded-lg bg-black/18 p-3">
                  <div className="mb-2 flex items-center justify-between text-xs font-black text-white/45">
                    <span>Items</span>
                    <span>{order.pointsTotal.toLocaleString()} pts</span>
                  </div>
                  <div className="space-y-2">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between gap-3 text-xs font-semibold text-white/60">
                        <span className="min-w-0 truncate">{item.quantity}x {item.name} ({item.color} / {item.logo})</span>
                        <span className="shrink-0 text-[#8ff0a8]">{(item.pointsPrice * item.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-white/10 px-4 py-8 text-center">
            <ShoppingBag className="mx-auto h-8 w-8 text-white/30" />
            <p className="mt-3 text-sm font-bold text-white/45">Orders will appear here after marketplace checkout.</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderNotificationsAdmin = () => (
    <div className="space-y-5">
      <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.055] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] sm:p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-black text-white sm:text-lg">Network Notifications</h2>
            <p className="mt-1 text-xs font-semibold text-white/42">
              Send updates to every user by email and publish a profile-screen notification.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadNetworkNotifications()}
            disabled={isLoadingNotifications}
            className="rounded-full border border-white/10 bg-white/[0.07] px-4 py-2 text-xs font-black text-white transition-colors hover:bg-white/12 disabled:opacity-50"
          >
            {isLoadingNotifications ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-3">
            <input
              type="text"
              value={notificationTitle}
              onChange={(event) => {
                setNotificationTitle(event.target.value);
                setNotificationStatus('');
              }}
              placeholder="Message title"
              className="h-12 w-full rounded-full border border-white/8 bg-black/20 px-4 text-sm font-bold text-white outline-none placeholder:text-white/30 focus:border-[#8ff0a8]/50"
            />
            <textarea
              value={notificationMessage}
              onChange={(event) => {
                setNotificationMessage(event.target.value);
                setNotificationStatus('');
              }}
              placeholder="Write the update, promotion, or launch note..."
              rows={6}
              className="w-full resize-none rounded-[1.1rem] border border-white/8 bg-black/20 px-4 py-3 text-sm font-bold leading-relaxed text-white outline-none placeholder:text-white/30 focus:border-[#8ff0a8]/50"
            />
            <input
              type="url"
              value={notificationImageUrl}
              onChange={(event) => {
                setNotificationImageUrl(event.target.value);
                setNotificationStatus('');
              }}
              placeholder="Optional image URL"
              className="h-12 w-full rounded-full border border-white/8 bg-black/20 px-4 text-sm font-bold text-white outline-none placeholder:text-white/30 focus:border-[#8ff0a8]/50"
            />
            {notificationStatus && (
              <p className="rounded-[1rem] border border-white/8 bg-white/[0.045] px-4 py-3 text-xs font-bold leading-relaxed text-white/66">
                {notificationStatus}
              </p>
            )}
            <button
              type="button"
              onClick={() => void handleSendNetworkNotification()}
              disabled={isSendingNotification || (!notificationMessage.trim() && !notificationImageUrl.trim())}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-black text-black transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
            >
              <Send className="h-4 w-4" />
              {isSendingNotification ? 'Sending...' : 'Send to Network'}
            </button>
          </div>

          <div className="rounded-[1.2rem] border border-white/8 bg-black/20 p-3">
            <div className="mb-3 flex items-center gap-2">
              <Bell className="h-4 w-4 text-[#8ff0a8]" />
              <p className="text-xs font-black uppercase tracking-[0.12em] text-white/45">Profile Preview</p>
            </div>
            <div className="overflow-hidden rounded-[1rem] border border-white/10 bg-white/[0.075] p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-emerald-300/20 bg-emerald-300/10">
                  <Bell className="h-4 w-4 text-emerald-100" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-black text-white">{notificationTitle.trim() || 'Moneetize update'}</p>
                  <p className="mt-1 whitespace-pre-line text-xs font-bold leading-relaxed text-white/55">
                    {notificationMessage.trim() || 'Your message preview will appear here.'}
                  </p>
                  {notificationImageUrl.trim() && (
                    <img
                      src={notificationImageUrl.trim()}
                      alt=""
                      className="mt-3 max-h-40 w-full rounded-[0.8rem] border border-white/8 object-cover"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.055] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-black text-white sm:text-lg">Sent Notifications</h2>
            <p className="mt-1 text-xs font-semibold text-white/42">Recent announcements visible on profile screens.</p>
          </div>
          <span className="rounded-full border border-white/8 bg-black/20 px-3 py-1.5 text-xs font-black text-white/45">
            {networkNotifications.length}
          </span>
        </div>

        {networkNotifications.length > 0 ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {networkNotifications.map((notification) => {
              const summary = notification.emailSummary || {};

              return (
                <div key={notification.id} className="rounded-[1rem] border border-white/8 bg-black/20 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-white">{notification.title}</p>
                      <p className="mt-1 text-[11px] font-semibold text-white/38">
                        {notification.createdAt ? new Date(notification.createdAt).toLocaleString() : 'Just now'}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-white/8 px-2 py-1 text-[10px] font-black text-white/45">
                      {notification.recipientCount || 0} users
                    </span>
                  </div>
                  <p className="mt-3 line-clamp-3 whitespace-pre-line text-xs font-semibold leading-relaxed text-white/55">
                    {notification.message || 'Image-only notification'}
                  </p>
                  {notification.imageUrl && (
                    <img src={notification.imageUrl} alt="" className="mt-3 max-h-28 w-full rounded-[0.7rem] object-cover" />
                  )}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <span className="rounded-md bg-emerald-300/10 px-2 py-1 text-[10px] font-black text-emerald-200">
                      {Number(summary.sent) || 0} sent
                    </span>
                    <span className="rounded-md bg-white/8 px-2 py-1 text-[10px] font-black text-white/45">
                      {Number(summary.queued) || 0} queued
                    </span>
                    <span className="rounded-md bg-red-400/10 px-2 py-1 text-[10px] font-black text-red-200">
                      {Number(summary.failed) || 0} failed
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-[1rem] border border-dashed border-white/10 px-4 py-8 text-center">
            <Bell className="mx-auto h-8 w-8 text-white/30" />
            <p className="mt-3 text-sm font-bold text-white/45">No network notifications have been sent yet.</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderAdminUsers = () => (
    <div className="space-y-5">
      <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.055] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] sm:p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-black text-white sm:text-lg">Admin Users</h2>
            <p className="mt-1 text-xs font-semibold text-white/42">
              Grant admin panel access without hiding real user profiles from Network.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadAdminUsers()}
            disabled={isLoadingAdminUsers}
            className="rounded-full border border-white/10 bg-white/[0.07] px-4 py-2 text-xs font-black text-white transition-colors hover:bg-white/12 disabled:opacity-50"
          >
            {isLoadingAdminUsers ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        <div className="grid gap-2.5 sm:grid-cols-[minmax(0,1fr)_auto]">
          <input
            type="email"
            value={adminEmailDraft}
            onChange={(event) => {
              setAdminEmailDraft(event.target.value);
              setAdminUsersMessage('');
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                void handleAddAdminUser();
              }
            }}
            placeholder="admin-user@moneetize.com"
            className="h-12 w-full rounded-full border border-white/8 bg-black/20 px-4 text-sm font-bold text-white outline-none placeholder:text-white/30 focus:border-[#8ff0a8]/50"
          />
          <button
            type="button"
            onClick={() => void handleAddAdminUser()}
            disabled={Boolean(savingAdminEmail) || !adminEmailDraft.trim()}
            className="flex h-12 items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-black text-black transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus className="h-4 w-4" />
            Add Admin
          </button>
        </div>

        {adminUsersMessage && (
          <p className="mt-3 rounded-[1rem] border border-white/8 bg-white/[0.045] px-4 py-3 text-xs font-bold leading-relaxed text-white/66">
            {adminUsersMessage}
          </p>
        )}
      </div>

      <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.055] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] sm:p-5">
        {adminUsers.length > 0 ? (
          <div className="space-y-3">
            {adminUsers.map((adminUser) => {
              const isSavingThisUser = savingAdminEmail === adminUser.email;

              return (
                <div
                  key={adminUser.email}
                  className="flex flex-col gap-3 rounded-[1rem] border border-white/8 bg-black/20 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:flex-row sm:items-center"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-emerald-300/18 bg-emerald-300/[0.08] text-sm font-black text-emerald-100">
                      {(adminUser.name || adminUser.email).slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-black text-white">{adminUser.name || adminUser.email}</p>
                        <span className="rounded-full bg-white/8 px-2 py-0.5 text-[10px] font-black uppercase text-white/52">
                          {adminUser.source === 'core' ? 'Core' : adminUser.source === 'metadata' ? 'Metadata' : 'Added'}
                        </span>
                        {!adminUser.accountExists && (
                          <span className="rounded-full bg-amber-300/12 px-2 py-0.5 text-[10px] font-black uppercase text-amber-200">
                            Account needed
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-xs font-semibold text-white/42">{adminUser.email}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => void handleRemoveAdminUser(adminUser.email)}
                    disabled={adminUser.protected || isSavingThisUser}
                    className="flex h-10 items-center justify-center gap-2 rounded-full border border-red-300/15 bg-red-400/10 px-4 text-xs font-black text-red-200 transition-colors hover:bg-red-400/16 disabled:cursor-not-allowed disabled:opacity-35"
                    aria-label={`Remove ${adminUser.email} admin access`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {adminUser.protected ? 'Protected' : isSavingThisUser ? 'Removing...' : 'Remove'}
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-[1rem] border border-dashed border-white/10 px-4 py-8 text-center">
            <Users className="mx-auto h-8 w-8 text-white/30" />
            <p className="mt-3 text-sm font-bold text-white/45">No admin users loaded yet.</p>
          </div>
        )}
      </div>
    </div>
  );

  if (isCheckingAdmin) {
    return (
      <div className="flex min-h-[100dvh] w-full items-center justify-center bg-[#060708] px-4 text-white">
        <div className="pointer-events-none fixed inset-x-0 top-0 h-48 bg-[radial-gradient(circle_at_50%_0%,rgba(143,240,168,0.12),transparent_72%)]" />
        <motion.div
          initial={{ scale: 0.94, opacity: 0, y: 14 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative w-full max-w-md overflow-hidden rounded-[1.6rem] border border-white/10 bg-gradient-to-b from-[#1b1d1f] via-[#17191b] to-[#101214] p-6 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_24px_78px_rgba(0,0,0,0.62)]"
        >
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-[#8ff0a8]/25 bg-[#8ff0a8]/10 shadow-[0_0_26px_rgba(143,240,168,0.18)]">
            <Users className="h-7 w-7 text-[#8ff0a8]" />
          </div>
          <h2 className="mb-2 text-2xl font-black text-white">Checking Admin Access</h2>
          <p className="text-sm font-semibold text-white/45">Verifying your signed-in Moneetize account.</p>
        </motion.div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-[100dvh] w-full items-center justify-center bg-[#060708] px-4 text-white">
        <div className="pointer-events-none fixed inset-x-0 top-0 h-48 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.08),transparent_72%)]" />
        <motion.div
          initial={{ scale: 0.94, opacity: 0, y: 14 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative w-full max-w-md overflow-hidden rounded-[1.6rem] border border-white/10 bg-gradient-to-b from-[#1b1d1f] via-[#17191b] to-[#101214] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_24px_78px_rgba(0,0,0,0.62)]"
        >
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-red-300/20 bg-red-500/10">
              <AlertCircle className="h-7 w-7 text-red-300" />
            </div>
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#8ff0a8]/80">Moneetize Admin</p>
            <h2 className="mt-2 mb-2 text-2xl font-black text-white">Admin Account Required</h2>
            <p className="text-sm font-semibold leading-relaxed text-white/45">
              Log in with an approved admin account to manage products, marketplace rewards, and early access requests.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/profile-screen')}
              className="h-12 flex-1 rounded-full border border-white/10 bg-white/[0.08] text-sm font-black text-white transition-colors hover:bg-white/12"
            >
              Cancel
            </button>
            <button
              onClick={() => navigate('/login')}
              className="h-12 flex-1 rounded-full bg-white text-sm font-black text-black shadow-[0_16px_38px_rgba(0,0,0,0.34)] transition-colors hover:bg-gray-100"
            >
              Login
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 h-full w-full overflow-y-auto bg-[#060708] text-white [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-48 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.08),transparent_72%)]" />

      <div className="sticky top-0 z-40 bg-[#060708]/88 px-4 pb-3 pt-[calc(0.9rem+env(safe-area-inset-top))] backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <button
            onClick={() => navigate('/profile-screen')}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/8 text-white/82 transition-colors hover:bg-white/14"
            aria-label="Back to profile"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="min-w-0 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8ff0a8]/70">Moneetize</p>
            <h1 className="truncate text-lg font-black tracking-normal text-white">Admin Panel</h1>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => navigate('/marketplace')}
              className="hidden h-10 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3 text-xs font-black text-white/78 transition-colors hover:bg-white/12 min-[390px]:flex"
            >
              <Eye className="h-3.5 w-3.5" />
              View
            </button>
            <button
              onClick={handleLogout}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-red-300/15 bg-red-400/10 text-red-200 transition-colors hover:bg-red-400/16"
              aria-label="Log out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-2 sm:px-5 lg:px-6">
        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
          <div className="rounded-[1.25rem] border border-white/8 bg-white/[0.055] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-colors hover:bg-white/[0.075] sm:p-4 lg:p-5">
            <div className="flex flex-col items-center gap-2 sm:gap-3 text-center">
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/20 sm:h-12 sm:w-12">
                <Package className="h-5 w-5 text-white/78 sm:h-6 sm:w-6" />
              </div>
              <div>
                <p className="text-xl font-black text-white sm:text-2xl lg:text-3xl">{products.length}</p>
                <p className="text-[10px] font-bold text-white/40 sm:text-xs">Products</p>
              </div>
            </div>
          </div>
          <div className="rounded-[1.25rem] border border-white/8 bg-white/[0.055] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-colors hover:bg-white/[0.075] sm:p-4 lg:p-5">
            <div className="flex flex-col items-center gap-2 sm:gap-3 text-center">
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-emerald-300/18 bg-emerald-300/[0.08] sm:h-12 sm:w-12">
                <ShoppingBag className="h-5 w-5 text-emerald-200 sm:h-6 sm:w-6" />
              </div>
              <div>
                <p className="text-xl font-black text-white sm:text-2xl lg:text-3xl">{categories.length}</p>
                <p className="text-[10px] font-bold text-white/40 sm:text-xs">Categories</p>
              </div>
            </div>
          </div>
          <div className="rounded-[1.25rem] border border-white/8 bg-white/[0.055] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-colors hover:bg-white/[0.075] sm:p-4 lg:p-5">
            <div className="flex flex-col items-center gap-2 sm:gap-3 text-center">
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-sky-200/16 bg-sky-300/[0.08] sm:h-12 sm:w-12">
                <TrendingUp className="h-5 w-5 text-sky-100 sm:h-6 sm:w-6" />
              </div>
              <div>
                <p className="text-xl font-black text-white sm:text-2xl lg:text-3xl">
                  {products.filter(p => p.recommended).length}
                </p>
                <p className="text-[10px] font-bold text-white/40 sm:text-xs">Featured</p>
              </div>
            </div>
          </div>
          <div className="rounded-[1.25rem] border border-white/8 bg-white/[0.055] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-colors hover:bg-white/[0.075] sm:p-4 lg:p-5">
            <div className="flex flex-col items-center gap-2 sm:gap-3 text-center">
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-amber-200/16 bg-amber-300/[0.08] sm:h-12 sm:w-12">
                <CheckCircle className="h-5 w-5 text-amber-100 sm:h-6 sm:w-6" />
              </div>
              <div>
                <p className="text-xl font-black text-white sm:text-2xl lg:text-3xl">
                  {earlyAccessRequests.filter((request) => request.status === 'pending').length}
                </p>
                <p className="text-[10px] font-bold text-white/40 sm:text-xs">Early Access</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-1.5 rounded-full border border-white/8 bg-black/28 p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
          {[
            { id: 'products', label: 'Products' },
            { id: 'earlyAccess', label: 'Early Access' },
            { id: 'marketplace', label: 'Marketplace' },
            { id: 'notifications', label: 'Notifications' },
            { id: 'admins', label: 'Admins' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveAdminTab(tab.id as AdminTab)}
              className={`rounded-full px-4 py-2 text-sm font-black transition-colors ${
                activeAdminTab === tab.id
                  ? 'bg-white text-black'
                  : 'text-white/58 hover:bg-white/[0.06] hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeAdminTab === 'marketplace' && renderMarketplaceAdmin()}
        {activeAdminTab === 'notifications' && renderNotificationsAdmin()}
        {activeAdminTab === 'admins' && renderAdminUsers()}

        {/* Early Access Requests */}
        {activeAdminTab === 'earlyAccess' && (
        <div className="mb-6 rounded-[1.5rem] border border-white/8 bg-white/[0.055] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-base font-black text-white sm:text-lg">Early Access Requests</h2>
              <p className="text-xs font-semibold text-white/42">Token Early Access form submissions from Winnings</p>
            </div>
            <button
              onClick={loadEarlyAccessQueue}
              disabled={isLoadingEarlyAccess}
              className="rounded-full border border-white/10 bg-white/[0.07] px-4 py-2 text-xs font-black text-white transition-colors hover:bg-white/12 disabled:opacity-50"
            >
              {isLoadingEarlyAccess ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          {earlyAccessRequests.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-8 text-center">
              <p className="text-white font-semibold mb-1">No early access requests yet</p>
              <p className="text-gray-400 text-sm">Requests will appear here after users submit the Winnings form.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {earlyAccessRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex flex-col gap-3 rounded-[1rem] border border-white/8 bg-black/20 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:flex-row sm:items-center"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="text-white font-bold truncate">{request.name}</p>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        request.status === 'granted'
                          ? 'bg-emerald-400/15 text-emerald-300'
                          : 'bg-amber-400/15 text-amber-300'
                      }`}>
                        {request.status}
                      </span>
                      <span className="rounded-full bg-white/8 px-2 py-0.5 text-[10px] font-semibold text-white/60">
                        +{request.pointsAwarded} pts
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm truncate">{request.email}</p>
                    <p className="text-gray-500 text-xs mt-1">
                      Requested {new Date(request.requestedAt).toLocaleString()} | Email {request.emailDelivery || 'queued'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleGrantEarlyAccess(request.id)}
                    disabled={request.status === 'granted' || grantingEarlyAccessId === request.id}
                    className={`rounded-full px-4 py-2 text-xs font-black transition-colors ${
                      request.status === 'granted'
                        ? 'bg-emerald-500/15 text-emerald-300 cursor-default'
                        : 'bg-white text-black hover:bg-gray-100 disabled:opacity-50'
                    }`}
                  >
                    {request.status === 'granted'
                      ? 'Access Granted'
                      : grantingEarlyAccessId === request.id
                        ? 'Granting...'
                        : 'Provide Access'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        )}

        {/* Add Product Button */}
        {activeAdminTab === 'products' && (
        <>
        <div className="mb-4 flex flex-col justify-between gap-3 sm:mb-6 sm:flex-row sm:items-center">
          <h2 className="text-base font-black text-white sm:text-lg">Products</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setIsAddingProduct(true)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-black text-black shadow-[0_14px_32px_rgba(0,0,0,0.28)] transition-colors hover:bg-gray-100 sm:flex-initial"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
            <button
              onClick={() => setShowImportModal(true)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-white/10 bg-white/[0.07] px-4 py-2 text-xs font-black text-white transition-colors hover:bg-white/12 sm:flex-initial"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import</span>
            </button>
            <button
              onClick={handleExportProducts}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-emerald-300/18 bg-emerald-300/[0.08] px-4 py-2 text-xs font-black text-emerald-100 transition-colors hover:bg-emerald-300/[0.13] sm:flex-initial"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        {products.length > 0 && (
          <div className="mb-6 space-y-4 rounded-[1.5rem] border border-white/8 bg-white/[0.055] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
            {/* Search Bar */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products by name, brand, or tags..."
                className="w-full rounded-full border border-white/8 bg-black/20 py-3 pl-10 pr-4 text-white outline-none placeholder:text-white/30 focus:border-[#8ff0a8]/50"
              />
              <Package className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Filters Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="rounded-full border border-white/8 bg-[#161a18] px-4 py-2.5 text-sm text-white outline-none focus:border-[#8ff0a8]/50"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              {/* Investment Type Filter */}
              <select
                value={selectedInvestmentType}
                onChange={(e) => setSelectedInvestmentType(e.target.value)}
                className="rounded-full border border-white/8 bg-[#161a18] px-4 py-2.5 text-sm text-white outline-none focus:border-[#8ff0a8]/50"
              >
                <option value="all">All Investment Types</option>
                {investmentTypes.map(type => (
                  <option key={type.id} value={type.id}>{type.label}</option>
                ))}
              </select>

              {/* Price Range Filter */}
              <select
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                className="rounded-full border border-white/8 bg-[#161a18] px-4 py-2.5 text-sm text-white outline-none focus:border-[#8ff0a8]/50"
              >
                <option value="all">All Prices</option>
                <option value="0-25">$0 - $25</option>
                <option value="25-50">$25 - $50</option>
                <option value="50-100">$50 - $100</option>
                <option value="100+">$100+</option>
              </select>

              {/* Rating Filter */}
              <select
                value={minRating}
                onChange={(e) => setMinRating(Number(e.target.value))}
                className="rounded-full border border-white/8 bg-[#161a18] px-4 py-2.5 text-sm text-white outline-none focus:border-[#8ff0a8]/50"
              >
                <option value={0}>All Ratings</option>
                <option value={4}>4+ Stars</option>
                <option value={4.5}>4.5+ Stars</option>
              </select>
            </div>

            {/* Sort and Clear */}
            <div className="flex items-center justify-between gap-3 border-t border-white/8 pt-2">
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-sm">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="rounded-full border border-white/8 bg-[#161a18] px-3 py-1.5 text-sm text-white outline-none"
                >
                  <option value="category">Category</option>
                  <option value="name">Name</option>
                  <option value="price">Price</option>
                  <option value="rating">Rating</option>
                </select>
              </div>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setSelectedInvestmentType('all');
                  setPriceRange('all');
                  setMinRating(0);
                  setSortBy('category');
                }}
                className="flex items-center gap-1 text-sm font-black text-white/64 hover:text-white"
              >
                <X className="w-4 h-4" />
                Clear Filters
              </button>
            </div>
          </div>
        )}

        {/* Products Grid */}
        {products.length === 0 ? (
          <div className="rounded-[1.6rem] border border-white/8 bg-white/[0.055] p-10 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] sm:p-14">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-black/22 sm:h-24 sm:w-24">
              <Package className="h-10 w-10 text-white/54 sm:h-12 sm:w-12" />
            </div>
            <h3 className="mb-3 text-xl font-black text-white sm:text-2xl">No products yet</h3>
            <p className="mx-auto mb-6 max-w-md text-sm font-semibold text-white/45 sm:mb-8">
              Get started by adding your first product to the catalog
            </p>
            <button
              onClick={() => setIsAddingProduct(true)}
              className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-3 font-black text-black transition-colors hover:bg-gray-100"
            >
              <Plus className="w-5 h-5" />
              Add Your First Product
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="rounded-[1.6rem] border border-white/8 bg-white/[0.055] p-10 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] sm:p-14">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-black/22 sm:h-24 sm:w-24">
              <Package className="h-10 w-10 text-white/42 sm:h-12 sm:w-12" />
            </div>
            <h3 className="mb-3 text-xl font-black text-white sm:text-2xl">No products match your filters</h3>
            <p className="mb-6 text-sm font-semibold text-white/45 sm:mb-8">
              Try adjusting your search or filter criteria
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedInvestmentType('all');
                setPriceRange('all');
                setMinRating(0);
              }}
              className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-3 font-black text-black transition-colors hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Results Count */}
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-white/44">
                Showing <span className="text-white font-semibold">{filteredProducts.length}</span> product{filteredProducts.length !== 1 ? 's' : ''}
                {selectedCategory !== 'all' && <span className="text-[#8ff0a8]"> in {selectedCategory}</span>}
              </p>
            </div>

            {/* Products Grouped by Category */}
            {Object.entries(groupedProducts).map(([category, categoryProducts]) => (
              <div key={category} className="rounded-[1.5rem] border border-white/8 bg-white/[0.055] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] sm:p-6">
                {/* Category Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-emerald-300/18 bg-emerald-300/[0.08]">
                      <ShoppingBag className="h-5 w-5 text-emerald-100" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white">{category}</h3>
                      <p className="text-sm font-semibold text-white/42">{categoryProducts.length} product{categoryProducts.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                </div>

                {/* 2x2 Square Grid per Row */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  {categoryProducts.map(product => (
                    <div key={product.id} className="group rounded-[1.1rem] border border-white/8 bg-black/20 p-3 transition-colors hover:bg-white/[0.08] sm:p-4">
                      {/* Square Product Image */}
                      <div className="relative mb-3 aspect-square overflow-hidden rounded-lg bg-black/18">
                        {product.image.startsWith('data:') ? (
                          <img src={product.image} alt={product.name} className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105" />
                        ) : (
                          <ImageWithFallback src={product.image} alt={product.name} className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105" />
                        )}
                        {product.recommended && (
                          <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-white px-2 py-1 text-black shadow-lg">
                            <Star className="w-3.5 h-3.5" fill="currentColor" />
                            <span className="text-xs font-semibold hidden sm:inline">Featured</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Product Info */}
                      <h4 className="mb-1 line-clamp-2 text-sm font-black text-white sm:text-base">{product.name}</h4>
                      <p className="mb-2 text-xs font-semibold text-white/42 sm:text-sm">{product.brand}</p>
                      
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-base font-black text-[#8ff0a8] sm:text-lg">${product.price}</span>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400" fill="currentColor" />
                          <span className="text-sm font-semibold text-white/45">{product.rating}</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingProduct(product)}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-white/10 bg-white/[0.07] py-2 text-sm font-black text-white transition-colors hover:bg-white/12 sm:py-2.5"
                        >
                          <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-red-300/15 bg-red-400/10 py-2 text-sm font-black text-red-200 transition-colors hover:bg-red-400/16 sm:py-2.5"
                        >
                          <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        </>
        )}
      </div>

      {/* Add/Edit Product Modal */}
      <AnimatePresence>
        {(isAddingProduct || editingProduct) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto"
            onClick={() => {
              setIsAddingProduct(false);
              setEditingProduct(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="my-8 w-full max-w-2xl rounded-[1.6rem] border border-white/10 bg-gradient-to-b from-[#1b1d1f] via-[#17191b] to-[#101214] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_24px_78px_rgba(0,0,0,0.62)] sm:p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-black text-white">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h3>
                <button
                  onClick={() => {
                    setIsAddingProduct(false);
                    setEditingProduct(null);
                  }}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white/8 text-white/54 transition-colors hover:bg-white/14 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                {/* Image Upload */}
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Product Image *</label>
                  <div className="relative">
                    {(imagePreview || (editingProduct && editingProduct.image)) ? (
                      <div className="relative rounded-xl overflow-hidden h-48 mb-2">
                        <img 
                          src={imagePreview || editingProduct?.image} 
                          alt="Preview" 
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => {
                            setImagePreview('');
                            if (editingProduct) {
                              setEditingProduct({ ...editingProduct, image: '' });
                            } else {
                              setNewProduct({ ...newProduct, image: '' });
                            }
                          }}
                          className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-lg hover:bg-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : null}
                    <label className="flex cursor-pointer items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.07] py-3 font-black text-white transition-colors hover:bg-white/12">
                      <Upload className="w-5 h-5" />
                      Upload Image
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Product Name */}
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Product Name *</label>
                  <input
                    type="text"
                    value={editingProduct ? editingProduct.name : newProduct.name}
                    onChange={(e) => editingProduct 
                      ? setEditingProduct({ ...editingProduct, name: e.target.value })
                      : setNewProduct({ ...newProduct, name: e.target.value })
                    }
                    placeholder="e.g., Master Facial Cream"
                     className="w-full rounded-full border border-white/8 bg-white/[0.07] px-4 py-3 text-white outline-none focus:border-[#8ff0a8]/50"
                  />
                </div>

                {/* Brand */}
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Brand *</label>
                  <input
                    type="text"
                    value={editingProduct ? editingProduct.brand : newProduct.brand}
                    onChange={(e) => editingProduct 
                      ? setEditingProduct({ ...editingProduct, brand: e.target.value })
                      : setNewProduct({ ...newProduct, brand: e.target.value })
                    }
                    placeholder="e.g., Rashida"
                     className="w-full rounded-full border border-white/8 bg-white/[0.07] px-4 py-3 text-white outline-none focus:border-[#8ff0a8]/50"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Description *</label>
                  <textarea
                    value={editingProduct ? editingProduct.description : newProduct.description}
                    onChange={(e) => editingProduct 
                      ? setEditingProduct({ ...editingProduct, description: e.target.value })
                      : setNewProduct({ ...newProduct, description: e.target.value })
                    }
                    placeholder="Describe the product..."
                    rows={3}
                     className="w-full resize-none rounded-[1rem] border border-white/8 bg-white/[0.07] px-4 py-3 text-white outline-none focus:border-[#8ff0a8]/50"
                  />
                </div>

                {/* Price */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Price *</label>
                    <input
                      type="number"
                      value={editingProduct ? editingProduct.price : newProduct.price}
                      onChange={(e) => editingProduct 
                        ? setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) })
                        : setNewProduct({ ...newProduct, price: parseFloat(e.target.value) })
                      }
                      placeholder="29.99"
                       className="w-full rounded-full border border-white/8 bg-white/[0.07] px-4 py-3 text-white outline-none focus:border-[#8ff0a8]/50"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Original Price</label>
                    <input
                      type="number"
                      value={editingProduct ? editingProduct.originalPrice : newProduct.originalPrice}
                      onChange={(e) => editingProduct 
                        ? setEditingProduct({ ...editingProduct, originalPrice: parseFloat(e.target.value) })
                        : setNewProduct({ ...newProduct, originalPrice: parseFloat(e.target.value) })
                      }
                      placeholder="39.99"
                       className="w-full rounded-full border border-white/8 bg-white/[0.07] px-4 py-3 text-white outline-none focus:border-[#8ff0a8]/50"
                    />
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Category</label>
                  <select
                    value={editingProduct ? editingProduct.category : newProduct.category}
                    onChange={(e) => editingProduct 
                      ? setEditingProduct({ ...editingProduct, category: e.target.value })
                      : setNewProduct({ ...newProduct, category: e.target.value })
                    }
                     className="w-full rounded-full border border-white/8 bg-[#161a18] px-4 py-3 text-white outline-none focus:border-[#8ff0a8]/50"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Rating */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Rating (0-5)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="5"
                      value={editingProduct ? editingProduct.rating : newProduct.rating}
                      onChange={(e) => editingProduct 
                        ? setEditingProduct({ ...editingProduct, rating: parseFloat(e.target.value) })
                        : setNewProduct({ ...newProduct, rating: parseFloat(e.target.value) })
                      }
                       className="w-full rounded-full border border-white/8 bg-white/[0.07] px-4 py-3 text-white outline-none focus:border-[#8ff0a8]/50"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Reviews Count</label>
                    <input
                      type="number"
                      value={editingProduct ? editingProduct.reviews : newProduct.reviews}
                      onChange={(e) => editingProduct 
                        ? setEditingProduct({ ...editingProduct, reviews: parseInt(e.target.value) })
                        : setNewProduct({ ...newProduct, reviews: parseInt(e.target.value) })
                      }
                       className="w-full rounded-full border border-white/8 bg-white/[0.07] px-4 py-3 text-white outline-none focus:border-[#8ff0a8]/50"
                    />
                  </div>
                </div>

                {/* Investment Types */}
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Target Investment Profiles</label>
                  <div className="grid grid-cols-2 gap-2">
                    {investmentTypes.map(type => (
                      <button
                        key={type.id}
                        onClick={() => {
                          if (editingProduct) {
                            const current = editingProduct.investmentType || [];
                            setEditingProduct({
                              ...editingProduct,
                              investmentType: current.includes(type.id)
                                ? current.filter(t => t !== type.id)
                                : [...current, type.id]
                            });
                          } else {
                            toggleInvestmentType(type.id);
                          }
                        }}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                          (editingProduct?.investmentType || newProduct.investmentType || []).includes(type.id)
                            ? 'bg-white text-black'
                            : 'border border-white/8 bg-white/[0.07] text-white/56 hover:bg-white/12'
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Tags (interests)</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (editingProduct && newTag.trim()) {
                            setEditingProduct({
                              ...editingProduct,
                              tags: [...editingProduct.tags, newTag.trim()]
                            });
                            setNewTag('');
                          } else {
                            addTag();
                          }
                        }
                      }}
                      placeholder="Add tag (e.g., beauty, skincare)"
                      className="flex-1 rounded-full border border-white/8 bg-white/[0.07] px-4 py-2 text-white outline-none focus:border-[#8ff0a8]/50"
                    />
                    <button
                      onClick={() => {
                        if (editingProduct && newTag.trim()) {
                          setEditingProduct({
                            ...editingProduct,
                            tags: [...editingProduct.tags, newTag.trim()]
                          });
                          setNewTag('');
                        } else {
                          addTag();
                        }
                      }}
                      className="rounded-full bg-white px-4 py-2 text-black transition-colors hover:bg-gray-100"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(editingProduct ? editingProduct.tags : newProduct.tags || []).map((tag, idx) => (
                      <div key={idx} className="flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.07] px-3 py-1 text-sm text-white">
                        #{tag}
                        <button
                          onClick={() => {
                            if (editingProduct) {
                              setEditingProduct({
                                ...editingProduct,
                                tags: editingProduct.tags.filter(t => t !== tag)
                              });
                            } else {
                              removeTag(tag);
                            }
                          }}
                          className="text-red-500 hover:text-red-400"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommended */}
                <div>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={editingProduct ? editingProduct.recommended : newProduct.recommended}
                      onChange={(e) => editingProduct 
                        ? setEditingProduct({ ...editingProduct, recommended: e.target.checked })
                        : setNewProduct({ ...newProduct, recommended: e.target.checked })
                      }
                      className="h-5 w-5 rounded accent-emerald-300"
                    />
                    <span className="text-white">Featured/Recommended Product</span>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 flex gap-3 border-t border-white/8 pt-4">
                <button
                  onClick={() => {
                    setIsAddingProduct(false);
                    setEditingProduct(null);
                    setImagePreview('');
                  }}
                  className="flex-1 rounded-full border border-white/10 bg-white/[0.08] py-3 font-black text-white transition-colors hover:bg-white/12"
                >
                  Cancel
                </button>
                <button
                  onClick={editingProduct ? handleUpdateProduct : handleAddProduct}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full bg-white py-3 font-black text-black transition-colors hover:bg-gray-100"
                >
                  <Save className="w-5 h-5" />
                  {editingProduct ? 'Update' : 'Add'} Product
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Import Products Modal */}
      <AnimatePresence>
        {showImportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto"
            onClick={() => setShowImportModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="my-8 w-full max-w-2xl rounded-[1.6rem] border border-white/10 bg-gradient-to-b from-[#1b1d1f] via-[#17191b] to-[#101214] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_24px_78px_rgba(0,0,0,0.62)] sm:p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-black text-white">
                  Import Products
                </h3>
                <button
                  onClick={() => setShowImportModal(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/8 text-white/54 transition-colors hover:bg-white/14 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                {/* File Upload */}
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Upload Excel File (.xlsx or .xls)</label>
                  <div className="relative">
                    <label className={`flex items-center justify-center gap-2 py-3 rounded-xl transition-colors ${
                      isProcessingImport 
                        ? 'cursor-not-allowed bg-white/[0.04] text-white/28' 
                        : 'cursor-pointer border border-white/10 bg-white/[0.07] text-white hover:bg-white/12'
                    }`}>
                      <Upload className={`w-5 h-5 ${isProcessingImport ? 'animate-bounce' : ''}`} />
                      {isProcessingImport ? 'Processing...' : 'Choose File to Upload'}
                      <input
                        type="file"
                        accept=".xlsx, .xls"
                        onChange={handleImportProducts}
                        className="hidden"
                        disabled={isProcessingImport}
                      />
                    </label>
                  </div>
                  <p className="text-gray-500 text-xs mt-2">
                    Supported columns: title, brand, description, price, coverimage_url, category, rating, tags
                  </p>
                </div>

                {/* Preview */}
                {importPreview.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-white font-bold text-lg">Preview ({importPreview.length} products)</h4>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>Ready to import</span>
                      </div>
                    </div>
                    
                    {/* 2x2 Square Grid - Same as main products display */}
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      {importPreview.map(product => (
                        <div key={product.id} className="rounded-[1rem] border border-white/8 bg-white/[0.055] p-3 transition-all hover:bg-white/[0.075] sm:p-4 group">
                          {/* Square Product Image */}
                          <div className="relative mb-3 aspect-square overflow-hidden rounded-[0.9rem] bg-black/18">
                            {product.image.startsWith('data:') ? (
                              <img src={product.image} alt={product.name} className="h-full w-full object-contain p-3 transition-transform duration-300 group-hover:scale-105" />
                            ) : (
                              <ImageWithFallback src={product.image} alt={product.name} className="h-full w-full object-contain p-3 transition-transform duration-300 group-hover:scale-105" />
                            )}
                            {product.recommended && (
                              <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black/68 px-2 py-1 text-white shadow-lg">
                                <Star className="w-3.5 h-3.5" fill="currentColor" />
                                <span className="text-xs font-semibold hidden sm:inline">Featured</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Product Info */}
                          <h4 className="text-white font-bold text-sm sm:text-base mb-1 line-clamp-2">{product.name}</h4>
                          <p className="text-gray-400 text-xs sm:text-sm mb-2">{product.brand}</p>
                          
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-green-400 font-bold text-base sm:text-lg">${product.price}</span>
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-yellow-400" fill="currentColor" />
                              <span className="text-gray-400 text-sm">{product.rating}</span>
                            </div>
                          </div>

                          {/* Tags */}
                          {product.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {product.tags.slice(0, 2).map((tag, idx) => (
                                <span key={idx} className="rounded-full bg-white/8 px-2 py-0.5 text-xs text-white/46">
                                  #{tag}
                                </span>
                              ))}
                              {product.tags.length > 2 && (
                                <span className="text-gray-500 text-xs px-1">
                                  +{product.tags.length - 2}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Errors */}
                {importErrors.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-red-500 text-lg font-bold mb-2">Errors</h4>
                    <ul className="list-disc list-inside">
                      {importErrors.map((error, idx) => (
                        <li key={idx} className="text-red-500 text-sm">{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6 pt-4 border-t border-gray-800">
                <button
                  onClick={() => {
                    setShowImportModal(false);
                    setImportPreview([]);
                    setImportErrors([]);
                    setIsProcessingImport(false);
                  }}
                  className="flex-1 rounded-full border border-white/10 bg-white/[0.07] py-3 font-bold text-white transition-colors hover:bg-white/12"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmImport}
                  disabled={importPreview.length === 0 || isProcessingImport}
                  className={`flex-1 py-3 rounded-full font-black transition-colors flex items-center justify-center gap-2 ${
                    importPreview.length === 0 || isProcessingImport
                      ? 'cursor-not-allowed bg-white/[0.08] text-white/30'
                      : 'bg-white text-black hover:bg-gray-100'
                  }`}
                >
                  <Save className="w-5 h-5" />
                  Import {importPreview.length > 0 ? `${importPreview.length} Products` : 'Products'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
