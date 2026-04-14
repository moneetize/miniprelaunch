import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import { 
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
  AlertCircle
} from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { isAuthenticated, isUserAdmin, logoutUser } from '../services/authService';
import { loadProductCatalog, saveProductCatalog } from '../services/productService';
import { grantEarlyAccessRequest, loadEarlyAccessRequests, type EarlyAccessRequest } from '../services/earlyAccessService';
import {
  loadMarketplaceProducts,
  loadMarketplaceOrders,
  loadMarketplaceOrdersFromServer,
  saveMarketplaceProducts,
  MARKETPLACE_ORDERS_UPDATED_EVENT,
  type MarketplaceOrder,
  type MarketplaceProduct,
} from '../services/marketplaceService';

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

type AdminTab = 'products' | 'earlyAccess' | 'marketplace';

const marketplaceCategories = ['Shirts', 'Hoodies', 'Bags', 'Hats', 'Headwear', 'Drinkware', 'Office Supplies', 'Technology', 'Lifestyle'];

function createMarketplaceDraft(): MarketplaceProduct {
  return {
    id: '',
    name: '',
    description: '',
    pointsPrice: 120,
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
  };

  const loadMarketplaceOrdersQueue = async () => {
    setMarketplaceOrders(await loadMarketplaceOrdersFromServer());
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

  const handleMarketplaceSave = () => {
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

    setMarketplaceProducts(saveMarketplaceProducts(updatedProducts));
    resetMarketplaceForm();
  };

  const handleMarketplaceDelete = (productId: string) => {
    if (!confirm('Delete this marketplace product?')) return;
    setMarketplaceProducts(saveMarketplaceProducts(marketplaceProducts.filter((product) => product.id !== productId)));
    if (editingMarketplaceId === productId) {
      resetMarketplaceForm();
    }
  };

  const handleMarketplaceInventoryChange = (productId: string, nextInventory: number) => {
    const normalizedInventory = Math.max(0, Math.round(Number(nextInventory) || 0));
    const updatedProducts = marketplaceProducts.map((product) => (
      product.id === productId ? { ...product, inventory: normalizedInventory } : product
    ));

    setMarketplaceProducts(saveMarketplaceProducts(updatedProducts));

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
        <div className="rounded-lg border border-white/10 bg-[#101311] p-4 shadow-[0_18px_42px_rgba(0,0,0,0.28)]">
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
              className="w-full rounded-lg border border-white/10 bg-white/[0.07] px-4 py-3 text-white outline-none placeholder:text-white/28 focus:border-[#8ff0a8]"
            />
            <textarea
              value={marketplaceDraft.description}
              onChange={(event) => setMarketplaceDraft({ ...marketplaceDraft, description: event.target.value })}
              placeholder="Product description"
              rows={3}
              className="w-full resize-none rounded-lg border border-white/10 bg-white/[0.07] px-4 py-3 text-white outline-none placeholder:text-white/28 focus:border-[#8ff0a8]"
            />

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1 block text-xs font-black text-white/42">Points Price</span>
                <input
                  type="number"
                  min={0}
                  value={marketplaceDraft.pointsPrice}
                  onChange={(event) => setMarketplaceDraft({ ...marketplaceDraft, pointsPrice: Number(event.target.value) })}
                  className="w-full rounded-lg border border-white/10 bg-white/[0.07] px-4 py-3 text-white outline-none focus:border-[#8ff0a8]"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-black text-white/42">Inventory Amount</span>
                <input
                  type="number"
                  min={0}
                  value={marketplaceDraft.inventory}
                  onChange={(event) => setMarketplaceDraft({ ...marketplaceDraft, inventory: Number(event.target.value) })}
                  className="w-full rounded-lg border border-white/10 bg-white/[0.07] px-4 py-3 text-white outline-none focus:border-[#8ff0a8]"
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <select
                value={marketplaceDraft.category}
                onChange={(event) => setMarketplaceDraft({ ...marketplaceDraft, category: event.target.value })}
                className="rounded-lg border border-white/10 bg-[#1b201d] px-4 py-3 text-white outline-none focus:border-[#8ff0a8]"
              >
                {marketplaceCategories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <select
                value={marketplaceDraft.status}
                onChange={(event) => setMarketplaceDraft({ ...marketplaceDraft, status: event.target.value as MarketplaceProduct['status'] })}
                className="rounded-lg border border-white/10 bg-[#1b201d] px-4 py-3 text-white outline-none focus:border-[#8ff0a8]"
              >
                <option value="active">Active</option>
                <option value="draft">Draft</option>
              </select>
            </div>

            <select
              value={marketplaceDraft.badge || 'NEW'}
              onChange={(event) => setMarketplaceDraft({ ...marketplaceDraft, badge: event.target.value as MarketplaceProduct['badge'] })}
              className="w-full rounded-lg border border-white/10 bg-[#1b201d] px-4 py-3 text-white outline-none focus:border-[#8ff0a8]"
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
              className="w-full rounded-lg border border-white/10 bg-white/[0.07] px-4 py-3 text-white outline-none placeholder:text-white/28 focus:border-[#8ff0a8]"
            />
            <input
              type="text"
              value={marketplaceDraft.logoVariants.join(', ')}
              onChange={(event) => setMarketplaceDraft({ ...marketplaceDraft, logoVariants: textToList(event.target.value) })}
              placeholder="Logo colors: Light Blue, Pink, Yellow"
              className="w-full rounded-lg border border-white/10 bg-white/[0.07] px-4 py-3 text-white outline-none placeholder:text-white/28 focus:border-[#8ff0a8]"
            />
            <input
              type="text"
              value={marketplaceDraft.image || ''}
              onChange={(event) => setMarketplaceDraft({ ...marketplaceDraft, image: event.target.value })}
              placeholder="Product image path"
              className="w-full rounded-lg border border-white/10 bg-white/[0.07] px-4 py-3 text-white outline-none placeholder:text-white/28 focus:border-[#8ff0a8]"
            />
            <input
              type="text"
              value={marketplaceDraft.sourceUrl || ''}
              onChange={(event) => setMarketplaceDraft({ ...marketplaceDraft, sourceUrl: event.target.value })}
              placeholder="Supplier URL"
              className="w-full rounded-lg border border-white/10 bg-white/[0.07] px-4 py-3 text-white outline-none placeholder:text-white/28 focus:border-[#8ff0a8]"
            />

            <div className="grid grid-cols-[1fr_auto] gap-2 pt-2">
              <button
                type="button"
                onClick={handleMarketplaceSave}
                className="h-12 rounded-lg bg-[#8ff0a8] px-4 text-sm font-black text-[#06120a] transition-colors hover:bg-[#7be594]"
              >
                {editingMarketplaceId ? 'Save Product' : 'Add Product'}
              </button>
              <button
                type="button"
                onClick={resetMarketplaceForm}
                className="h-12 rounded-lg border border-white/10 bg-white/[0.08] px-4 text-sm font-black text-white transition-colors hover:bg-white/12"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-[#101311] p-4 shadow-[0_18px_42px_rgba(0,0,0,0.28)]">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-black text-white">Marketplace Products</h2>
              <p className="mt-1 text-xs font-semibold text-white/45">{marketplaceProducts.length} products | {activeMarketplaceProducts} active</p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/marketplace')}
              className="rounded-lg border border-white/10 bg-white/[0.08] px-3 py-2 text-xs font-black text-white transition-colors hover:bg-white/12"
            >
              View Marketplace
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {marketplaceProducts.map((product) => {
              const isOutOfStock = product.inventory <= 0;

              return (
              <div key={product.id} className="rounded-lg border border-white/10 bg-white/[0.055] p-3">
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
                      className="h-9 rounded-lg border border-white/10 bg-white/[0.08] text-sm font-black text-white"
                      aria-label={`Decrease ${product.name} inventory`}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={0}
                      value={product.inventory}
                      onChange={(event) => handleMarketplaceInventoryChange(product.id, Number(event.target.value))}
                      className="h-9 rounded-lg border border-white/10 bg-black/18 px-3 text-center text-sm font-black text-white outline-none focus:border-[#8ff0a8]"
                      aria-label={`${product.name} inventory amount`}
                    />
                    <button
                      type="button"
                      onClick={() => handleMarketplaceInventoryChange(product.id, product.inventory + 1)}
                      className="h-9 rounded-lg border border-white/10 bg-white/[0.08] text-sm font-black text-white"
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
                    className="rounded-lg bg-blue-500/20 px-3 py-2 text-xs font-black text-blue-300 transition-colors hover:bg-blue-500/30"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMarketplaceDelete(product.id)}
                    className="rounded-lg bg-red-500/20 px-3 py-2 text-xs font-black text-red-300 transition-colors hover:bg-red-500/30"
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

      <div className="rounded-lg border border-white/10 bg-[#101311] p-4 shadow-[0_18px_42px_rgba(0,0,0,0.28)]">
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
            className="rounded-lg border border-white/10 bg-white/[0.08] px-3 py-2 text-xs font-black text-white transition-colors hover:bg-white/12"
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

  if (isCheckingAdmin) {
    return (
      <div className="min-h-screen w-full bg-[#050706] flex items-center justify-center px-4 text-white">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-md rounded-lg border border-white/10 bg-[#111512] p-6 text-center shadow-[0_24px_70px_rgba(0,0,0,0.5)]"
        >
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-[#8ff0a8]/25 bg-[#8ff0a8]/10">
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
      <div className="min-h-screen w-full bg-[#050706] flex items-center justify-center px-4 text-white">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-md rounded-lg border border-white/10 bg-[#111512] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.5)]"
        >
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-red-300/20 bg-red-500/10">
              <AlertCircle className="h-7 w-7 text-red-300" />
            </div>
            <p className="text-xs font-black uppercase tracking-[0.08em] text-[#8ff0a8]">Moneetize Admin</p>
            <h2 className="mt-2 mb-2 text-2xl font-black text-white">Admin Account Required</h2>
            <p className="text-sm font-semibold leading-relaxed text-white/45">
              Log in with an account that has the Supabase admin role to manage products.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/profile-feeds')}
              className="h-12 flex-1 rounded-lg border border-white/10 bg-white/[0.08] text-sm font-black text-white transition-colors hover:bg-white/12"
            >
              Cancel
            </button>
            <button
              onClick={() => navigate('/login')}
              className="h-12 flex-1 rounded-lg bg-[#8ff0a8] text-sm font-black text-[#06120a] transition-colors hover:bg-[#7be594]"
            >
              Login
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 w-full h-full overflow-y-auto bg-[#0a0e1a]">
      {/* Header */}
      <div className="sticky top-0 bg-[#0a0e1a]/95 backdrop-blur-sm z-40 border-b border-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-2 sm:py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-white text-sm sm:text-base lg:text-lg font-bold">Admin Panel</h1>
              <p className="text-gray-400 text-[10px] sm:text-xs">Manage products</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/profile-feeds')}
                className="px-2 sm:px-3 py-1.5 sm:py-2 bg-[#2a2d3e] text-white rounded-lg font-medium hover:bg-[#35384a] transition-colors flex items-center gap-1.5 text-xs"
              >
                <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>View</span>
              </button>
              <button
                onClick={handleLogout}
                className="px-2 sm:px-2.5 py-1.5 sm:py-2 bg-red-500/10 text-red-500 rounded-lg font-medium hover:bg-red-500/20 transition-colors flex items-center justify-center"
              >
                <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          <div className="bg-[#1a1d2e] rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 hover:bg-[#1f2235] transition-colors">
            <div className="flex flex-col items-center gap-2 sm:gap-3 text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-purple-500/20 rounded-lg sm:rounded-xl flex items-center justify-center">
                <Package className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-purple-500" />
              </div>
              <div>
                <p className="text-white text-xl sm:text-2xl lg:text-3xl font-bold">{products.length}</p>
                <p className="text-gray-400 text-[10px] sm:text-xs lg:text-sm">Products</p>
              </div>
            </div>
          </div>
          <div className="bg-[#1a1d2e] rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 hover:bg-[#1f2235] transition-colors">
            <div className="flex flex-col items-center gap-2 sm:gap-3 text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-green-500/20 rounded-lg sm:rounded-xl flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-green-500" />
              </div>
              <div>
                <p className="text-white text-xl sm:text-2xl lg:text-3xl font-bold">{categories.length}</p>
                <p className="text-gray-400 text-[10px] sm:text-xs lg:text-sm">Categories</p>
              </div>
            </div>
          </div>
          <div className="bg-[#1a1d2e] rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 hover:bg-[#1f2235] transition-colors">
            <div className="flex flex-col items-center gap-2 sm:gap-3 text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-blue-500/20 rounded-lg sm:rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-blue-500" />
              </div>
              <div>
                <p className="text-white text-xl sm:text-2xl lg:text-3xl font-bold">
                  {products.filter(p => p.recommended).length}
                </p>
                <p className="text-gray-400 text-[10px] sm:text-xs lg:text-sm">Featured</p>
              </div>
            </div>
          </div>
          <div className="bg-[#1a1d2e] rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 hover:bg-[#1f2235] transition-colors">
            <div className="flex flex-col items-center gap-2 sm:gap-3 text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-amber-500/20 rounded-lg sm:rounded-xl flex items-center justify-center">
                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-amber-300" />
              </div>
              <div>
                <p className="text-white text-xl sm:text-2xl lg:text-3xl font-bold">
                  {earlyAccessRequests.filter((request) => request.status === 'pending').length}
                </p>
                <p className="text-gray-400 text-[10px] sm:text-xs lg:text-sm">Early Access</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-2 rounded-2xl border border-white/5 bg-[#1a1d2e] p-2">
          {[
            { id: 'products', label: 'Products' },
            { id: 'earlyAccess', label: 'Early Access' },
            { id: 'marketplace', label: 'Marketplace' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveAdminTab(tab.id as AdminTab)}
              className={`rounded-xl px-4 py-2 text-sm font-bold transition-colors ${
                activeAdminTab === tab.id
                  ? 'bg-white text-black'
                  : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeAdminTab === 'marketplace' && renderMarketplaceAdmin()}

        {/* Early Access Requests */}
        {activeAdminTab === 'earlyAccess' && (
        <div className="bg-[#1a1d2e] rounded-2xl p-4 sm:p-5 mb-6 sm:mb-8 border border-white/5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-white text-base sm:text-lg font-bold">Early Access Requests</h2>
              <p className="text-gray-400 text-xs">Token Early Access form submissions from Winnings</p>
            </div>
            <button
              onClick={loadEarlyAccessQueue}
              disabled={isLoadingEarlyAccess}
              className="px-3 py-2 bg-[#2a2d3e] text-white rounded-lg font-semibold hover:bg-[#35384a] transition-colors text-xs disabled:opacity-50"
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
                  className="rounded-xl border border-white/8 bg-[#222638] px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center"
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
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                      request.status === 'granted'
                        ? 'bg-emerald-500/15 text-emerald-300 cursor-default'
                        : 'bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50'
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
          <h2 className="text-white text-base sm:text-lg font-bold">Products</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setIsAddingProduct(true)}
              className="flex-1 sm:flex-initial px-3 py-2 bg-purple-500 text-white rounded-lg font-semibold hover:bg-purple-600 transition-all hover:scale-105 flex items-center justify-center gap-1.5 shadow-lg shadow-purple-500/30 text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
            <button
              onClick={() => setShowImportModal(true)}
              className="flex-1 sm:flex-initial px-3 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-all hover:scale-105 flex items-center justify-center gap-1.5 shadow-lg shadow-blue-500/30 text-xs"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import</span>
            </button>
            <button
              onClick={handleExportProducts}
              className="flex-1 sm:flex-initial px-3 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-all hover:scale-105 flex items-center justify-center gap-1.5 shadow-lg shadow-green-500/30 text-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        {products.length > 0 && (
          <div className="bg-[#1a1d2e] rounded-2xl p-4 mb-6 space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products by name, brand, or tags..."
                className="w-full bg-[#2a2d3e] text-white rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-purple-500"
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
                className="bg-[#2a2d3e] text-white rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-purple-500 text-sm"
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
                className="bg-[#2a2d3e] text-white rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-purple-500 text-sm"
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
                className="bg-[#2a2d3e] text-white rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-purple-500 text-sm"
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
                className="bg-[#2a2d3e] text-white rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-purple-500 text-sm"
              >
                <option value={0}>All Ratings</option>
                <option value={4}>4+ Stars</option>
                <option value={4.5}>4.5+ Stars</option>
              </select>
            </div>

            {/* Sort and Clear */}
            <div className="flex items-center justify-between gap-3 pt-2 border-t border-gray-800">
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-sm">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-[#2a2d3e] text-white rounded-lg px-3 py-1.5 outline-none text-sm"
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
                className="text-purple-400 hover:text-purple-300 text-sm font-medium flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                Clear Filters
              </button>
            </div>
          </div>
        )}

        {/* Products Grid */}
        {products.length === 0 ? (
          <div className="bg-[#1a1d2e] rounded-3xl p-12 sm:p-16 text-center">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="w-10 h-10 sm:w-12 sm:h-12 text-purple-500" />
            </div>
            <h3 className="text-white text-xl sm:text-2xl font-bold mb-3">No products yet</h3>
            <p className="text-gray-400 mb-6 sm:mb-8 max-w-md mx-auto">
              Get started by adding your first product to the catalog
            </p>
            <button
              onClick={() => setIsAddingProduct(true)}
              className="px-8 py-3 bg-purple-500 text-white rounded-xl font-bold hover:bg-purple-600 transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Your First Product
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-[#1a1d2e] rounded-3xl p-12 sm:p-16 text-center">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="w-10 h-10 sm:w-12 sm:h-12 text-gray-500" />
            </div>
            <h3 className="text-white text-xl sm:text-2xl font-bold mb-3">No products match your filters</h3>
            <p className="text-gray-400 mb-6 sm:mb-8">
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
              className="px-8 py-3 bg-purple-500 text-white rounded-xl font-bold hover:bg-purple-600 transition-colors inline-flex items-center gap-2"
            >
              <X className="w-5 h-5" />
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Results Count */}
            <div className="flex items-center justify-between">
              <p className="text-gray-400 text-sm">
                Showing <span className="text-white font-semibold">{filteredProducts.length}</span> product{filteredProducts.length !== 1 ? 's' : ''}
                {selectedCategory !== 'all' && <span className="text-purple-400"> in {selectedCategory}</span>}
              </p>
            </div>

            {/* Products Grouped by Category */}
            {Object.entries(groupedProducts).map(([category, categoryProducts]) => (
              <div key={category} className="bg-[#1a1d2e] rounded-2xl p-4 sm:p-6">
                {/* Category Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                      <ShoppingBag className="w-5 h-5 text-purple-500" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg">{category}</h3>
                      <p className="text-gray-400 text-sm">{categoryProducts.length} product{categoryProducts.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                </div>

                {/* 2x2 Square Grid per Row */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  {categoryProducts.map(product => (
                    <div key={product.id} className="bg-[#2a2d3e] rounded-xl p-4 hover:bg-[#35384a] transition-all hover:scale-[1.02] group">
                      {/* Square Product Image */}
                      <div className="relative aspect-square rounded-lg overflow-hidden mb-3">
                        {product.image.startsWith('data:') ? (
                          <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <ImageWithFallback src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        )}
                        {product.recommended && (
                          <div className="absolute top-2 right-2 bg-purple-500 text-white px-2 py-1 rounded-md shadow-lg flex items-center gap-1">
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

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingProduct(product)}
                          className="flex-1 bg-blue-500/20 text-blue-500 py-2 sm:py-2.5 rounded-lg text-sm font-medium hover:bg-blue-500/30 transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="flex-1 bg-red-500/20 text-red-500 py-2 sm:py-2.5 rounded-lg text-sm font-medium hover:bg-red-500/30 transition-colors flex items-center justify-center gap-1.5"
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
              className="bg-[#1a1d2e] rounded-3xl p-6 w-full max-w-2xl my-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-white text-2xl font-bold">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h3>
                <button
                  onClick={() => {
                    setIsAddingProduct(false);
                    setEditingProduct(null);
                  }}
                  className="text-gray-400 hover:text-white"
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
                    <label className="flex items-center justify-center gap-2 bg-[#2a2d3e] text-white py-3 rounded-xl cursor-pointer hover:bg-[#35384a] transition-colors">
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
                    className="w-full bg-[#2a2d3e] text-white rounded-xl px-4 py-3 outline-none"
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
                    className="w-full bg-[#2a2d3e] text-white rounded-xl px-4 py-3 outline-none"
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
                    className="w-full bg-[#2a2d3e] text-white rounded-xl px-4 py-3 outline-none resize-none"
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
                      className="w-full bg-[#2a2d3e] text-white rounded-xl px-4 py-3 outline-none"
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
                      className="w-full bg-[#2a2d3e] text-white rounded-xl px-4 py-3 outline-none"
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
                    className="w-full bg-[#2a2d3e] text-white rounded-xl px-4 py-3 outline-none"
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
                      className="w-full bg-[#2a2d3e] text-white rounded-xl px-4 py-3 outline-none"
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
                      className="w-full bg-[#2a2d3e] text-white rounded-xl px-4 py-3 outline-none"
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
                            ? 'bg-purple-500 text-white'
                            : 'bg-[#2a2d3e] text-gray-400 hover:bg-[#35384a]'
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
                      className="flex-1 bg-[#2a2d3e] text-white rounded-xl px-4 py-2 outline-none"
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
                      className="bg-purple-500 text-white px-4 py-2 rounded-xl hover:bg-purple-600"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(editingProduct ? editingProduct.tags : newProduct.tags || []).map((tag, idx) => (
                      <div key={idx} className="bg-[#2a2d3e] text-white px-3 py-1 rounded-lg text-sm flex items-center gap-2">
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
                      className="w-5 h-5 rounded bg-[#2a2d3e]"
                    />
                    <span className="text-white">Featured/Recommended Product</span>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6 pt-4 border-t border-gray-800">
                <button
                  onClick={() => {
                    setIsAddingProduct(false);
                    setEditingProduct(null);
                    setImagePreview('');
                  }}
                  className="flex-1 bg-[#2a2d3e] text-white py-3 rounded-xl font-semibold hover:bg-[#35384a] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={editingProduct ? handleUpdateProduct : handleAddProduct}
                  className="flex-1 bg-purple-500 text-white py-3 rounded-xl font-bold hover:bg-purple-600 transition-colors flex items-center justify-center gap-2"
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
              className="bg-[#1a1d2e] rounded-3xl p-6 w-full max-w-2xl my-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-white text-2xl font-bold">
                  Import Products
                </h3>
                <button
                  onClick={() => setShowImportModal(false)}
                  className="text-gray-400 hover:text-white"
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
                        ? 'bg-[#2a2d3e]/50 text-gray-500 cursor-not-allowed' 
                        : 'bg-[#2a2d3e] text-white cursor-pointer hover:bg-[#35384a]'
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
                        <div key={product.id} className="bg-[#2a2d3e] rounded-xl p-4 hover:bg-[#35384a] transition-all hover:scale-[1.02] group">
                          {/* Square Product Image */}
                          <div className="relative aspect-square rounded-lg overflow-hidden mb-3">
                            {product.image.startsWith('data:') ? (
                              <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            ) : (
                              <ImageWithFallback src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            )}
                            {product.recommended && (
                              <div className="absolute top-2 right-2 bg-purple-500 text-white px-2 py-1 rounded-md shadow-lg flex items-center gap-1">
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
                                <span key={idx} className="bg-[#1a1d2e] text-gray-400 px-2 py-0.5 rounded text-xs">
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
                  className="flex-1 bg-[#2a2d3e] text-white py-3 rounded-xl font-semibold hover:bg-[#35384a] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmImport}
                  disabled={importPreview.length === 0 || isProcessingImport}
                  className={`flex-1 py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 ${
                    importPreview.length === 0 || isProcessingImport
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-purple-500 text-white hover:bg-purple-600'
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
