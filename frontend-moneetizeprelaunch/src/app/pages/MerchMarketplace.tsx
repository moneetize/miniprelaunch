import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { ChevronLeft, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
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

function formatPoints(value: number) {
  return value.toLocaleString('en-US');
}

function createCartItem(product: MarketplaceProduct): CartItem {
  return {
    id: `${product.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    productId: product.id,
    name: product.name,
    pointsPrice: product.pointsPrice,
    quantity: 1,
    color: product.colorVariants[0] || 'Black',
    logo: product.logoVariants[0] || 'Classic Logo',
  };
}

export function MerchMarketplace() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<MarketplaceProduct[]>(() => loadMarketplaceProducts());
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [userPoints, setUserPoints] = useState(() => getUserPoints());
  const [selectedProductId, setSelectedProductId] = useState('');
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
  const selectedProduct = activeProducts.find((product) => product.id === selectedProductId) || activeProducts[0];
  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cartItems.reduce((total, item) => total + item.pointsPrice * item.quantity, 0);

  const addProductToCart = (product: MarketplaceProduct) => {
    setSelectedProductId(product.id);
    setCartItems((items) => [createCartItem(product), ...items]);
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
    <div className="h-screen w-full overflow-y-auto bg-[#0a0e1a] text-white [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <div className="mx-auto min-h-full w-full max-w-md px-4 pb-28">
        <header className="sticky top-0 z-30 -mx-4 bg-[#0a0e1a]/92 px-4 pb-4 backdrop-blur-md">
          <div className="flex h-11 items-center justify-between text-sm text-white">
            <span className="font-semibold">9:41</span>
            <div className="flex items-center gap-2">
              <div className="h-3 w-4 rounded-sm bg-white/80" />
              <div className="h-3 w-4 rounded-sm bg-white/80" />
              <span className="rounded bg-yellow-500 px-1 text-[10px] font-black text-black">32</span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/8 text-white"
              aria-label="Go back"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="text-center">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/40">Marketplace</p>
              <h1 className="text-[22px] font-black text-white">Merch Rewards</h1>
            </div>
            <div className="flex h-11 min-w-20 items-center justify-center gap-1 rounded-full border border-white/10 bg-white/8 px-3">
              <img src={gemIcon} alt="Points" className="h-5 w-5" />
              <span className="text-sm font-black text-[#8ff0a8]">{formatPoints(userPoints)}</span>
            </div>
          </div>
        </header>

        <main className="pt-5">
          <section className="relative overflow-hidden rounded-[1.4rem] border border-white/10 bg-gradient-to-b from-[#24282d] to-[#15181d] px-5 py-6 shadow-[0_18px_60px_rgba(0,0,0,0.38)]">
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[#8ff0a8]/16 blur-2xl" />
            <p className="relative text-[12px] font-bold text-white/48">Pre-game Shopping</p>
            <h2 className="relative mt-2 text-[30px] font-black leading-tight text-white">Redeem merch with points.</h2>
            <p className="relative mt-3 max-w-[260px] text-sm font-semibold leading-snug text-white/54">
              Use points earned from Scratch and Win to claim launch merch.
            </p>
          </section>

          <section className="-mx-4 mt-6 flex gap-4 overflow-x-auto px-4 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {activeProducts.map((product) => (
              <motion.button
                key={product.id}
                type="button"
                onClick={() => setSelectedProductId(product.id)}
                className={`min-w-[138px] rounded-[1rem] border p-3 text-left transition-colors ${
                  selectedProduct?.id === product.id
                    ? 'border-[#8ff0a8]/55 bg-[#8ff0a8]/10'
                    : 'border-white/10 bg-white/[0.055]'
                }`}
                whileTap={{ scale: 0.98 }}
              >
                <img src={product.image || tshirtRewardIcon} alt={product.name} className="mx-auto h-24 w-24 object-contain" />
                <p className="mt-3 line-clamp-2 text-[13px] font-black text-white">{product.name}</p>
                <p className="mt-1 text-xs font-black text-[#8ff0a8]">{formatPoints(product.pointsPrice)} pts</p>
              </motion.button>
            ))}
          </section>

          {selectedProduct && (
            <section className="mt-4 rounded-[1.3rem] border border-white/10 bg-white/[0.055] p-5">
              <div className="flex gap-4">
                <img src={selectedProduct.image || tshirtRewardIcon} alt={selectedProduct.name} className="h-24 w-24 shrink-0 object-contain" />
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-black text-white">{selectedProduct.name}</p>
                  <p className="mt-1 text-sm font-semibold leading-snug text-white/50">{selectedProduct.description}</p>
                  <p className="mt-3 text-sm font-black text-[#8ff0a8]">{formatPoints(selectedProduct.pointsPrice)} pts</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-xs font-bold text-white/55">
                <div className="rounded-xl bg-black/24 px-3 py-2">
                  Colors: {selectedProduct.colorVariants.join(', ')}
                </div>
                <div className="rounded-xl bg-black/24 px-3 py-2">
                  Logos: {selectedProduct.logoVariants.join(', ')}
                </div>
              </div>

              <button
                type="button"
                onClick={() => addProductToCart(selectedProduct)}
                disabled={selectedProduct.inventory <= 0}
                className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white text-sm font-black text-black disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ShoppingBag className="h-4 w-4" />
                {selectedProduct.inventory > 0 ? 'Add to Cart' : 'Out of Stock'}
              </button>
            </section>
          )}

          <section className="mt-6 rounded-[1.4rem] border border-white/10 bg-[#15181d] p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-black text-white">Your Cart ({cartCount})</h2>
              <span className="text-sm font-black text-[#8ff0a8]">{formatPoints(cartTotal)} pts</span>
            </div>

            {cartItems.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/10 px-4 py-7 text-center text-sm font-bold text-white/45">
                Your merch picks will appear here.
              </div>
            ) : (
              <div className="space-y-3">
                {cartItems.map((item) => {
                  const product = activeProducts.find((entry) => entry.id === item.productId);
                  return (
                    <div key={item.id} className="rounded-xl bg-white/[0.055] p-3">
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-black text-white">{item.name}</p>
                          <p className="mt-1 text-xs font-bold text-[#8ff0a8]">{formatPoints(item.pointsPrice)} pts each</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeCartItem(item.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/12 text-red-300"
                          aria-label="Remove item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
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
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="w-7 text-center text-sm font-black text-white">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateCartItem(item.id, { quantity: item.quantity + 1 })}
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10"
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

            <div className="mt-5">
              <p className="mb-2 text-sm font-black text-white">Pay with:</p>
              <div className="grid grid-cols-3 gap-2">
                <button type="button" className="rounded-full bg-white px-3 py-2 text-xs font-black text-black">Points Only</button>
                <button type="button" className="rounded-full bg-white/8 px-3 py-2 text-xs font-black text-white/25" disabled>USDT</button>
                <button type="button" className="rounded-full bg-white/8 px-3 py-2 text-xs font-black text-white/25" disabled>Card</button>
              </div>
            </div>

            {message && (
              <p className="mt-4 rounded-xl bg-white/[0.055] px-4 py-3 text-sm font-bold text-white/70">{message}</p>
            )}

            <button
              type="button"
              onClick={checkout}
              className="mt-5 h-12 w-full rounded-full bg-[#8ff0a8] text-sm font-black text-[#07110a] shadow-[0_14px_34px_rgba(143,240,168,0.24)]"
            >
              Checkout
            </button>
          </section>
        </main>
      </div>
    </div>
  );
}
