import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { ChevronLeft, Minus, Plus, Search, ShoppingBag, Trash2 } from 'lucide-react';
import gemIcon from 'figma:asset/296d8aa06fd9c7e60192bc7368a4a032ec5bc17e.png';
import tshirtRewardIcon from '../../assets/moneetize-tshirt-reward.png';
import {
  loadMarketplaceProducts,
  saveMarketplaceProducts,
  saveMarketplaceOrder,
  MARKETPLACE_PRODUCTS_UPDATED_EVENT,
  type MarketplaceOrderItem,
  type MarketplaceProduct,
} from '../services/marketplaceService';
import { getUserPoints, subtractUserPoints } from '../utils/pointsManager';

type CartItem = MarketplaceOrderItem;

interface SelectedVariant {
  color: string;
  logo: string;
}

const colorSwatches: Record<string, string> = {
  Black: '#08090a',
  White: '#f5f5f0',
  Charcoal: '#52575d',
  Slate: '#5e7da9',
  Mint: '#8ff0d6',
  Blue: '#4779bd',
  Steel: '#9ba3a7',
};

const logoPreviewByVariant: Record<string, string> = {
  Horizontal: '/brand/logos/logo_horizontal_white.svg',
  Stacked: '/brand/logos/logo_stacked_white.svg',
  Message: '/brand/logos/logo_message_white.svg',
  'Icon Only': '/brand/logos/logo_icon_only_white.svg',
  'Classic Logo': '/brand/logos/logo_horizontal_white.svg',
  'Wildcard Logo': '/brand/logos/logo_icon_only_white.svg',
  'Golden Logo': '/brand/logos/logo_stacked_white.svg',
  'Moneetize Badge': '/brand/logos/logo_icon_only_white.svg',
  'Team Logo': '/brand/logos/logo_horizontal_white.svg',
};

function formatPoints(value: number) {
  return value.toLocaleString('en-US');
}

function getDefaultVariant(product: MarketplaceProduct): SelectedVariant {
  return {
    color: product.colorVariants[0] || 'Black',
    logo: product.logoVariants[0] || 'Horizontal',
  };
}

function createCartItem(product: MarketplaceProduct, variant: SelectedVariant): CartItem {
  return {
    id: `${product.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    productId: product.id,
    name: product.name,
    pointsPrice: product.pointsPrice,
    quantity: 1,
    color: variant.color,
    logo: variant.logo,
  };
}

function getBadgeClass(badge?: MarketplaceProduct['badge']) {
  if (badge === 'HOT') return 'bg-[#ff4d66] text-white';
  if (badge === 'SALE') return 'bg-[#ffe13b] text-black';
  return 'bg-[#00e676] text-black';
}

export function MerchMarketplace() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<MarketplaceProduct[]>(() => loadMarketplaceProducts());
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [userPoints, setUserPoints] = useState(() => getUserPoints());
  const [selectedVariants, setSelectedVariants] = useState<Record<string, SelectedVariant>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const syncProducts = () => setProducts(loadMarketplaceProducts());
    window.addEventListener(MARKETPLACE_PRODUCTS_UPDATED_EVENT, syncProducts);
    window.addEventListener('storage', syncProducts);

    return () => {
      window.removeEventListener(MARKETPLACE_PRODUCTS_UPDATED_EVENT, syncProducts);
      window.removeEventListener('storage', syncProducts);
    };
  }, []);

  const activeProducts = useMemo(() => products.filter((product) => product.status === 'active'), [products]);
  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return activeProducts;

    return activeProducts.filter((product) => (
      product.name.toLowerCase().includes(query) ||
      product.description.toLowerCase().includes(query) ||
      product.category.toLowerCase().includes(query)
    ));
  }, [activeProducts, searchQuery]);

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cartItems.reduce((total, item) => total + item.pointsPrice * item.quantity, 0);

  const getSelectedVariant = (product: MarketplaceProduct) => selectedVariants[product.id] || getDefaultVariant(product);

  const updateProductVariant = (product: MarketplaceProduct, updates: Partial<SelectedVariant>) => {
    setSelectedVariants((current) => ({
      ...current,
      [product.id]: {
        ...getSelectedVariant(product),
        ...updates,
      },
    }));
  };

  const addProductToCart = (product: MarketplaceProduct) => {
    if (product.inventory <= 0) {
      setMessage(`${product.name} is out of stock.`);
      return;
    }

    setCartItems((items) => [createCartItem(product, getSelectedVariant(product)), ...items]);
    setMessage(`${product.name} added to your cart.`);
  };

  const updateCartItem = (itemId: string, updates: Partial<CartItem>) => {
    setCartItems((items) => items.map((item) => (item.id === itemId ? { ...item, ...updates } : item)));
  };

  const removeCartItem = (itemId: string) => {
    setCartItems((items) => items.filter((item) => item.id !== itemId));
  };

  const checkout = async () => {
    if (cartItems.length === 0) {
      setMessage('Add a merch item before checkout.');
      return;
    }

    const unavailableItem = cartItems.find((item) => {
      const product = products.find((entry) => entry.id === item.productId);
      return product && product.inventory < item.quantity;
    });
    if (unavailableItem) {
      setMessage(`${unavailableItem.name} does not have enough inventory for that quantity.`);
      return;
    }

    const result = await subtractUserPoints(cartTotal, 'marketplace-redemption');
    setUserPoints(result.newTotal);

    if (!result.success) {
      setMessage(`You need ${formatPoints(cartTotal - result.newTotal)} more points to redeem this cart.`);
      return;
    }

    saveMarketplaceOrder({
      id: `marketplace-order-${Date.now()}`,
      items: cartItems,
      pointsTotal: cartTotal,
      paymentMethod: 'points',
      createdAt: new Date().toISOString(),
    });
    const nextProducts = products.map((product) => {
      const redeemedQuantity = cartItems
        .filter((item) => item.productId === product.id)
        .reduce((total, item) => total + item.quantity, 0);

      return redeemedQuantity > 0
        ? { ...product, inventory: Math.max(0, product.inventory - redeemedQuantity) }
        : product;
    });
    setProducts(saveMarketplaceProducts(nextProducts));
    setCartItems([]);
    setMessage('Redeemed with points. Your merch request was saved.');
  };

  return (
    <div className="h-screen w-full overflow-y-auto bg-[#050706] text-white [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#050706]/95 backdrop-blur-md">
        <div className="mx-auto flex min-h-[68px] w-full max-w-6xl items-center gap-3 px-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.08] text-white"
            aria-label="Go back"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <button type="button" onClick={() => navigate('/winnings')} className="flex min-w-0 items-center gap-3 text-left">
            <img src="/brand/logos/logo_icon_only_white.svg" alt="Moneetize" className="h-8 w-8" />
            <div className="min-w-0">
              <p className="truncate text-lg font-black leading-tight text-white">moneetize merch</p>
              <p className="text-xs font-bold leading-tight text-white/45">Redeem with points</p>
            </div>
          </button>

          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.08] px-3 py-2">
              <img src={gemIcon} alt="Points" className="h-5 w-5" />
              <span className="text-sm font-black text-[#8ff0a8]">{formatPoints(userPoints)}</span>
            </div>
            <div className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.08]">
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#00e676] px-1 text-[10px] font-black text-black">
                  {cartCount}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-5">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-black leading-tight text-white">Marketplace</h1>
            <p className="mt-1 text-sm font-semibold text-white/48">Pick a product, choose a color, choose a logo, redeem with points.</p>
          </div>

          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search products"
              className="h-11 w-full rounded-lg border border-white/10 bg-white/[0.08] pl-11 pr-4 text-sm font-bold text-white outline-none placeholder:text-white/30"
            />
          </div>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-label="Marketplace products">
          {filteredProducts.map((product) => {
            const selectedVariant = getSelectedVariant(product);
            const productLogo = logoPreviewByVariant[selectedVariant.logo] || '/brand/logos/logo_icon_only_white.svg';

            return (
              <motion.article
                key={product.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="overflow-hidden rounded-lg border border-white/10 bg-[#151817] shadow-[0_18px_38px_rgba(0,0,0,0.24)]"
              >
                <div className="relative flex aspect-[4/3] items-center justify-center bg-[#20231f]">
                  {product.badge && (
                    <span className={`absolute left-3 top-3 rounded-md px-2 py-1 text-[10px] font-black ${getBadgeClass(product.badge)}`}>
                      {product.badge}
                    </span>
                  )}
                  <img src={product.image || tshirtRewardIcon} alt={product.name} className="h-[78%] w-[78%] object-contain opacity-90" />
                  <img src={productLogo} alt="" className="absolute h-9 max-w-[118px] object-contain opacity-85" />
                </div>

                <div className="p-4">
                  <p className="text-base font-black text-white">{product.name}</p>
                  <p className="mt-1 line-clamp-2 min-h-10 text-sm font-semibold leading-snug text-white/42">{product.description}</p>

                  <div className="mt-4 space-y-3">
                    <div>
                      <p className="mb-2 text-[10px] font-black uppercase text-white/35">Color</p>
                      <div className="flex flex-wrap gap-2">
                        {product.colorVariants.map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => updateProductVariant(product, { color })}
                            className={`h-6 w-6 rounded-md border-2 ${
                              selectedVariant.color === color ? 'border-[#00e676]' : 'border-white/18'
                            }`}
                            style={{ backgroundColor: colorSwatches[color] || '#6b7280' }}
                            aria-label={`${product.name} color ${color}`}
                          />
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="mb-2 text-[10px] font-black uppercase text-white/35">Logo</p>
                      <div className="flex flex-wrap gap-2">
                        {product.logoVariants.map((logo) => (
                          <button
                            key={logo}
                            type="button"
                            onClick={() => updateProductVariant(product, { logo })}
                            className={`rounded-md border px-2.5 py-1.5 text-[11px] font-black transition-colors ${
                              selectedVariant.logo === logo
                                ? 'border-[#00e676] bg-[#00e676]/12 text-white'
                                : 'border-white/10 bg-white/[0.06] text-white/48'
                            }`}
                          >
                            {logo}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-xl font-black leading-none text-[#00e676]">{formatPoints(product.pointsPrice)}</p>
                      <p className="mt-1 text-[11px] font-bold text-white/35">points</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => addProductToCart(product)}
                      disabled={product.inventory <= 0}
                      className="rounded-lg bg-[#00e676] px-4 py-2.5 text-sm font-black text-black disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </section>

        <section className="mt-6 rounded-lg border border-white/10 bg-[#151817] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-white">Your Cart ({cartCount})</h2>
              <p className="text-sm font-bold text-white/42">{formatPoints(cartTotal)} points selected</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-white px-3 py-2 text-xs font-black text-black">Points Only</span>
              <span className="rounded-lg bg-white/[0.08] px-3 py-2 text-xs font-black text-white/25">USDT</span>
              <span className="rounded-lg bg-white/[0.08] px-3 py-2 text-xs font-black text-white/25">Card</span>
            </div>
          </div>

          {cartItems.length === 0 ? (
            <div className="mt-4 rounded-lg border border-dashed border-white/10 px-4 py-6 text-center text-sm font-bold text-white/42">
              Add products to redeem them with your earned points.
            </div>
          ) : (
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {cartItems.map((item) => {
                const product = activeProducts.find((entry) => entry.id === item.productId);

                return (
                  <div key={item.id} className="rounded-lg bg-white/[0.055] p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-white">{item.name}</p>
                        <p className="mt-1 text-xs font-bold text-[#8ff0a8]">{formatPoints(item.pointsPrice)} pts each</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeCartItem(item.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/12 text-red-300"
                        aria-label="Remove item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <select
                        value={item.color}
                        onChange={(event) => updateCartItem(item.id, { color: event.target.value })}
                        className="rounded-lg border border-white/10 bg-[#23272d] px-2 py-2 text-xs font-bold text-white"
                      >
                        {(product?.colorVariants || [item.color]).map((color) => (
                          <option key={color} value={color}>{color}</option>
                        ))}
                      </select>
                      <select
                        value={item.logo}
                        onChange={(event) => updateCartItem(item.id, { logo: event.target.value })}
                        className="rounded-lg border border-white/10 bg-[#23272d] px-2 py-2 text-xs font-bold text-white"
                      >
                        {(product?.logoVariants || [item.logo]).map((logo) => (
                          <option key={logo} value={logo}>{logo}</option>
                        ))}
                      </select>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateCartItem(item.id, { quantity: Math.max(1, item.quantity - 1) })}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-7 text-center text-sm font-black text-white">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateCartItem(item.id, { quantity: item.quantity + 1 })}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <span className="text-sm font-black text-white">{formatPoints(item.pointsPrice * item.quantity)} pts</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {message && (
            <p className="mt-4 rounded-lg bg-white/[0.055] px-4 py-3 text-sm font-bold text-white/70">{message}</p>
          )}

          <button
            type="button"
            onClick={checkout}
            className="mt-4 h-12 w-full rounded-lg bg-[#8ff0a8] text-sm font-black text-[#07110a] shadow-[0_14px_34px_rgba(143,240,168,0.24)]"
          >
            Checkout
          </button>
        </section>
      </main>
    </div>
  );
}
