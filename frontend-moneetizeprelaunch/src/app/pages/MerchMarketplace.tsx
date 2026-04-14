import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type WheelEvent as ReactWheelEvent } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { CheckCircle, ChevronLeft, Minus, Plus, Search, ShoppingBag, Trash2, X } from 'lucide-react';
import gemIcon from 'figma:asset/296d8aa06fd9c7e60192bc7368a4a032ec5bc17e.png';
import {
  loadMarketplaceProducts,
  saveMarketplaceProducts,
  submitMarketplaceOrder,
  MARKETPLACE_ADMIN_EMAIL,
  MARKETPLACE_PRODUCTS_UPDATED_EVENT,
  type MarketplaceOrder,
  type MarketplaceOrderItem,
  type MarketplaceProduct,
} from '../services/marketplaceService';
import { getUserPoints, POINTS_UPDATED_EVENT, subtractUserPoints } from '../utils/pointsManager';
import { getStoredProfileSettings, PROFILE_SETTINGS_UPDATED_EVENT, type StoredProfileSettings } from '../utils/profileSettings';

type CartItem = MarketplaceOrderItem;
type SliderKey = 'products' | 'colors' | 'logos' | 'cart';

interface SelectedVariant {
  color: string;
  logo: string;
}

interface DragState {
  isDragging: boolean;
  startX: number;
  scrollLeft: number;
}

interface CheckoutFormState {
  name: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
}

const colorSwatches: Record<string, string> = {
  Black: '#08090a',
  White: '#f5f5f0',
  Natural: '#efe8da',
  Clear: '#d8edf0',
  Steel: '#9ba3a7',
  Blue: '#4779bd',
  'Dark Blue': '#19395f',
  'Light Blue': '#8bd8ef',
  'Light Green': '#9fe4bd',
};

const logoSwatches: Record<string, string> = {
  Black: '#08090a',
  White: '#ffffff',
  Green: '#8eea78',
  'Dark Blue': '#1e4f87',
  'Light Blue': '#89e4f4',
  Pink: '#ff8ab9',
  Purple: '#8e74ff',
  Yellow: '#ffe65a',
};

function formatPoints(value: number) {
  return value.toLocaleString('en-US');
}

function variantKey(color: string, logo: string) {
  return `${color}__${logo}`;
}

function getDefaultVariant(product: MarketplaceProduct): SelectedVariant {
  return {
    color: product.colorVariants[0] || 'Black',
    logo: product.logoVariants[0] || 'Light Blue',
  };
}

function getAvailableLogos(product: MarketplaceProduct, color: string) {
  const variantImages = product.variantImages || {};
  const logos = Object.keys(variantImages)
    .filter((key) => key.startsWith(`${color}__`))
    .map((key) => key.split('__')[1])
    .filter(Boolean);

  return logos.length ? logos : product.logoVariants;
}

function getProductImage(product: MarketplaceProduct, variant: SelectedVariant) {
  const variantImages = product.variantImages || {};
  const directMatch = variantImages[variantKey(variant.color, variant.logo)];
  if (directMatch) return directMatch;

  const colorMatch = Object.entries(variantImages).find(([key]) => key.startsWith(`${variant.color}__`));
  if (colorMatch) return colorMatch[1];

  const logoMatch = Object.entries(variantImages).find(([key]) => key.endsWith(`__${variant.logo}`));
  if (logoMatch) return logoMatch[1];

  const firstVariant = Object.values(variantImages)[0];
  return firstVariant || product.image || '';
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

function createCheckoutForm(profile: StoredProfileSettings): CheckoutFormState {
  return {
    name: profile.name || '',
    email: profile.email || '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    region: '',
    postalCode: '',
    country: 'United States',
  };
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isInteractiveTarget(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest('button, a, input, select, textarea, label'));
}

export function MerchMarketplace() {
  const navigate = useNavigate();
  const [profileSettings, setProfileSettings] = useState(() => getStoredProfileSettings({ fallbackName: 'Jess Wu' }));
  const [products, setProducts] = useState<MarketplaceProduct[]>(() => loadMarketplaceProducts());
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [userPoints, setUserPoints] = useState(() => getUserPoints());
  const [selectedVariants, setSelectedVariants] = useState<Record<string, SelectedVariant>>({});
  const [selectedProductId, setSelectedProductId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState('');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [latestOrder, setLatestOrder] = useState<MarketplaceOrder | null>(null);
  const [checkoutForm, setCheckoutForm] = useState(() => createCheckoutForm(profileSettings));
  const [draggingSlider, setDraggingSlider] = useState<SliderKey | null>(null);
  const sliderDragRef = useRef<Record<SliderKey, DragState>>({
    products: { isDragging: false, startX: 0, scrollLeft: 0 },
    colors: { isDragging: false, startX: 0, scrollLeft: 0 },
    logos: { isDragging: false, startX: 0, scrollLeft: 0 },
    cart: { isDragging: false, startX: 0, scrollLeft: 0 },
  });

  useEffect(() => {
    const syncProducts = () => setProducts(loadMarketplaceProducts());
    window.addEventListener(MARKETPLACE_PRODUCTS_UPDATED_EVENT, syncProducts);
    window.addEventListener('storage', syncProducts);

    return () => {
      window.removeEventListener(MARKETPLACE_PRODUCTS_UPDATED_EVENT, syncProducts);
      window.removeEventListener('storage', syncProducts);
    };
  }, []);

  useEffect(() => {
    const syncPointBalance = () => setUserPoints(getUserPoints());
    window.addEventListener(POINTS_UPDATED_EVENT, syncPointBalance);
    window.addEventListener('storage', syncPointBalance);

    return () => {
      window.removeEventListener(POINTS_UPDATED_EVENT, syncPointBalance);
      window.removeEventListener('storage', syncPointBalance);
    };
  }, []);

  useEffect(() => {
    const syncProfile = () => {
      const nextProfile = getStoredProfileSettings({ fallbackName: 'Jess Wu' });
      setProfileSettings(nextProfile);
      setCheckoutForm((current) => ({
        ...current,
        name: current.name || nextProfile.name,
        email: current.email || nextProfile.email,
      }));
    };

    window.addEventListener(PROFILE_SETTINGS_UPDATED_EVENT, syncProfile);
    window.addEventListener('storage', syncProfile);

    return () => {
      window.removeEventListener(PROFILE_SETTINGS_UPDATED_EVENT, syncProfile);
      window.removeEventListener('storage', syncProfile);
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

  useEffect(() => {
    if (!filteredProducts.length) {
      setSelectedProductId('');
      return;
    }

    if (!filteredProducts.some((product) => product.id === selectedProductId)) {
      setSelectedProductId(filteredProducts[0].id);
    }
  }, [filteredProducts, selectedProductId]);

  const activeProduct = filteredProducts.find((product) => product.id === selectedProductId) || filteredProducts[0];
  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cartItems.reduce((total, item) => total + item.pointsPrice * item.quantity, 0);
  const pointsShortfall = Math.max(0, cartTotal - userPoints);
  const getSelectedVariant = (product: MarketplaceProduct) => selectedVariants[product.id] || getDefaultVariant(product);
  const activeVariant = activeProduct ? getSelectedVariant(activeProduct) : null;
  const activeImage = activeProduct && activeVariant ? getProductImage(activeProduct, activeVariant) : '';
  const availableLogos = activeProduct && activeVariant ? getAvailableLogos(activeProduct, activeVariant.color) : [];
  const findUnavailableCartProduct = () => products.find((product) => {
    const cartQuantity = cartItems
      .filter((item) => item.productId === product.id)
      .reduce((total, item) => total + item.quantity, 0);
    return cartQuantity > product.inventory;
  });

  const handleSliderPointerDown = (key: SliderKey, event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    if (isInteractiveTarget(event.target)) return;

    const slider = event.currentTarget;
    sliderDragRef.current[key] = {
      isDragging: true,
      startX: event.clientX,
      scrollLeft: slider.scrollLeft,
    };
    setDraggingSlider(key);
    slider.setPointerCapture(event.pointerId);
  };

  const handleSliderPointerMove = (key: SliderKey, event: ReactPointerEvent<HTMLDivElement>) => {
    const slider = event.currentTarget;
    const drag = sliderDragRef.current[key];
    if (!drag.isDragging) return;

    const deltaX = event.clientX - drag.startX;
    if (Math.abs(deltaX) > 2) event.preventDefault();
    slider.scrollLeft = drag.scrollLeft - deltaX;
  };

  const handleSliderPointerEnd = (key: SliderKey, event: ReactPointerEvent<HTMLDivElement>) => {
    const slider = event.currentTarget;
    if (slider.hasPointerCapture(event.pointerId)) {
      slider.releasePointerCapture(event.pointerId);
    }

    sliderDragRef.current[key].isDragging = false;
    setDraggingSlider(null);
  };

  const handleSliderWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    const slider = event.currentTarget;
    if (slider.scrollWidth <= slider.clientWidth) return;

    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    if (delta === 0) return;

    event.preventDefault();
    slider.scrollLeft += delta;
  };

  const updateProductVariant = (product: MarketplaceProduct, updates: Partial<SelectedVariant>) => {
    setSelectedVariants((current) => {
      const nextVariant = {
        ...getSelectedVariant(product),
        ...updates,
      };

      if (updates.color) {
        const nextLogos = getAvailableLogos(product, updates.color);
        if (nextLogos.length && !nextLogos.includes(nextVariant.logo)) {
          nextVariant.logo = nextLogos[0];
        }
      }

      return {
        ...current,
        [product.id]: nextVariant,
      };
    });
  };

  const addProductToCart = (product: MarketplaceProduct) => {
    if (product.inventory <= 0) {
      setMessage(`${product.name} is out of stock.`);
      return;
    }

    const cartQuantityForProduct = cartItems
      .filter((item) => item.productId === product.id)
      .reduce((total, item) => total + item.quantity, 0);

    if (cartQuantityForProduct >= product.inventory) {
      setMessage(`${product.name} only has ${product.inventory} left in inventory.`);
      return;
    }

    setCartItems((items) => [createCartItem(product, getSelectedVariant(product)), ...items]);
    setMessage(`${product.name} added to your cart.`);
  };

  const updateCartItem = (itemId: string, updates: Partial<CartItem>) => {
    const currentItem = cartItems.find((item) => item.id === itemId);
    if (!currentItem) return;

    if (typeof updates.quantity === 'number') {
      const product = products.find((entry) => entry.id === currentItem.productId);
      const maxInventory = product?.inventory ?? updates.quantity;
      const otherProductQuantity = cartItems
        .filter((item) => item.productId === currentItem.productId && item.id !== itemId)
        .reduce((total, item) => total + item.quantity, 0);
      const maxAllowedQuantity = Math.max(1, maxInventory - otherProductQuantity);
      const nextQuantity = Math.max(1, Math.min(Math.round(updates.quantity), maxAllowedQuantity));

      if (updates.quantity > nextQuantity) {
        setMessage(`${currentItem.name} only has ${maxInventory} left in inventory.`);
      }

      setCartItems((items) => items.map((item) => (
        item.id === itemId ? { ...item, ...updates, quantity: nextQuantity } : item
      )));
      return;
    }

    setCartItems((items) => items.map((item) => (item.id === itemId ? { ...item, ...updates } : item)));
  };

  const removeCartItem = (itemId: string) => {
    setCartItems((items) => items.filter((item) => item.id !== itemId));
  };

  const openCheckout = () => {
    if (cartItems.length === 0) {
      setMessage('Add a merch item before checkout.');
      return;
    }

    const currentPoints = getUserPoints();
    setUserPoints(currentPoints);

    const unavailableProduct = findUnavailableCartProduct();
    if (unavailableProduct) {
      setMessage(`${unavailableProduct.name} does not have enough inventory for this cart.`);
      return;
    }

    if (currentPoints < cartTotal) {
      setMessage(`You need ${formatPoints(cartTotal - currentPoints)} more points to checkout.`);
      return;
    }

    setMessage('');
    setLatestOrder(null);
    setIsCheckoutOpen(true);
  };

  const updateCheckoutField = (field: keyof CheckoutFormState, value: string) => {
    setCheckoutForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const placeOrder = async () => {
    if (isSubmittingOrder) return;

    const currentPoints = getUserPoints();
    setUserPoints(currentPoints);

    if (currentPoints < cartTotal) {
      setMessage(`You need ${formatPoints(cartTotal - currentPoints)} more points to checkout.`);
      return;
    }

    const unavailableProduct = findUnavailableCartProduct();
    if (unavailableProduct) {
      setMessage(`${unavailableProduct.name} does not have enough inventory for this cart.`);
      return;
    }

    const requiredFields: Array<keyof CheckoutFormState> = ['name', 'email', 'addressLine1', 'city', 'region', 'postalCode', 'country'];
    const hasMissingField = requiredFields.some((field) => !checkoutForm[field].trim());
    if (hasMissingField) {
      setMessage('Add your shipping details before placing the order.');
      return;
    }

    if (!isValidEmail(checkoutForm.email.trim())) {
      setMessage('Add a valid email for your order confirmation.');
      return;
    }

    setIsSubmittingOrder(true);

    const result = await subtractUserPoints(cartTotal, 'marketplace-redemption');
    setUserPoints(result.newTotal);

    if (!result.success) {
      setMessage(`You need ${formatPoints(cartTotal - result.newTotal)} more points to redeem this cart.`);
      setIsSubmittingOrder(false);
      return;
    }

    const createdAt = new Date().toISOString();
    const orderNumber = `MNTZ-${Date.now().toString().slice(-6)}`;
    const order: MarketplaceOrder = {
      id: `marketplace-order-${Date.now()}`,
      orderNumber,
      items: cartItems,
      pointsTotal: cartTotal,
      paymentMethod: 'points',
      customer: {
        name: checkoutForm.name.trim(),
        email: checkoutForm.email.trim().toLowerCase(),
        phone: checkoutForm.phone.trim() || undefined,
      },
      shippingAddress: {
        addressLine1: checkoutForm.addressLine1.trim(),
        addressLine2: checkoutForm.addressLine2.trim() || undefined,
        city: checkoutForm.city.trim(),
        region: checkoutForm.region.trim(),
        postalCode: checkoutForm.postalCode.trim(),
        country: checkoutForm.country.trim(),
      },
      status: 'pending',
      adminEmail: MARKETPLACE_ADMIN_EMAIL,
      userEmail: checkoutForm.email.trim().toLowerCase(),
      emailDelivery: 'queued',
      emailNotifications: [
        {
          to: MARKETPLACE_ADMIN_EMAIL,
          type: 'admin',
          subject: `Moneetize marketplace order ${orderNumber}`,
          status: 'queued',
        },
        {
          to: checkoutForm.email.trim().toLowerCase(),
          type: 'customer',
          subject: `Your Moneetize marketplace order ${orderNumber}`,
          status: 'queued',
        },
      ],
      createdAt,
      updatedAt: createdAt,
    };

    const savedOrder = await submitMarketplaceOrder(order);

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
    setLatestOrder(savedOrder);
    setMessage(
      savedOrder.emailDelivery === 'sent'
        ? `Order ${savedOrder.orderNumber || orderNumber} placed. Confirmations were sent.`
        : savedOrder.emailDelivery === 'failed'
          ? `Order ${savedOrder.orderNumber || orderNumber} placed. Email confirmation needs retry.`
          : `Order ${savedOrder.orderNumber || orderNumber} placed. Email confirmations are queued.`,
    );
    setIsCheckoutOpen(false);
    setIsSubmittingOrder(false);
  };

  return (
    <div className="h-screen w-full overflow-y-auto bg-[#050706] text-white [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#050706]/95 backdrop-blur-md">
        <div className="mx-auto grid min-h-[68px] w-full max-w-3xl grid-cols-[48px_minmax(0,1fr)_48px] items-center gap-3 px-4">
          <button
            type="button"
            onClick={() => navigate('/winnings')}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.08] text-white shadow-[0_12px_26px_rgba(0,0,0,0.24)]"
            aria-label="Back to Winnings"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={() => navigate('/profile-screen')}
            className="mx-auto flex min-w-0 max-w-[220px] items-center gap-2 rounded-full bg-white px-2.5 py-1.5 text-left text-black shadow-[0_16px_34px_rgba(0,0,0,0.25)]"
            aria-label="Open profile"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#111514] text-[10px] font-black text-white">
              {profileSettings.photo ? (
                <img src={profileSettings.photo} alt="" className="h-full w-full object-cover" />
              ) : (
                profileSettings.name.slice(0, 2).toUpperCase()
              )}
            </span>
            <span className="min-w-0 truncate text-sm font-black">{profileSettings.name}</span>
            <span className="flex items-center gap-1 text-xs font-black text-[#16883c]">
              <img src={gemIcon} alt="" className="h-4 w-4" />
              {formatPoints(userPoints)}
            </span>
          </button>

          <div className="relative flex h-10 w-10 justify-self-end items-center justify-center rounded-lg border border-white/10 bg-white/[0.08]">
            <ShoppingBag className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#00e676] px-1 text-[10px] font-black text-black">
                {cartCount}
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 pb-28 pt-5">
        <div className="mb-4 flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-black leading-tight text-white">Marketplace</h1>
            <p className="mt-1 text-sm font-semibold text-white/48">Swipe products. Pick color. Pick logo.</p>
          </div>
          <div className="relative ml-auto hidden w-52 sm:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search"
              className="h-10 w-full rounded-lg border border-white/10 bg-white/[0.08] pl-9 pr-3 text-sm font-bold text-white outline-none placeholder:text-white/30"
            />
          </div>
        </div>

        <div className="relative mb-4 sm:hidden">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search merch"
            className="h-10 w-full rounded-lg border border-white/10 bg-white/[0.08] pl-9 pr-3 text-sm font-bold text-white outline-none placeholder:text-white/30"
          />
        </div>

        {activeProduct && activeVariant ? (
          <>
            <section
              onPointerDown={(event) => handleSliderPointerDown('products', event)}
              onPointerMove={(event) => handleSliderPointerMove('products', event)}
              onPointerUp={(event) => handleSliderPointerEnd('products', event)}
              onPointerCancel={(event) => handleSliderPointerEnd('products', event)}
              onPointerLeave={(event) => handleSliderPointerEnd('products', event)}
              onWheel={handleSliderWheel}
              className={`-mx-4 flex gap-3 overflow-x-auto px-4 pb-3 select-none touch-pan-y [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
                draggingSlider === 'products' ? 'cursor-grabbing snap-none' : 'cursor-grab snap-x'
              }`}
              aria-label="Marketplace products"
            >
              {filteredProducts.map((product) => {
                const variant = getSelectedVariant(product);
                const productImage = getProductImage(product, variant);
                const isSelected = product.id === activeProduct.id;

                return (
                  <motion.button
                    key={product.id}
                    type="button"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => setSelectedProductId(product.id)}
                    className={`min-w-[132px] snap-center rounded-lg border p-2 text-left transition-colors ${
                      isSelected
                        ? 'border-[#8ff0a8] bg-[#8ff0a8]/10'
                        : 'border-white/10 bg-white/[0.055]'
                    }`}
                  >
                    <span className="flex aspect-square items-center justify-center rounded-lg bg-white/[0.04]">
                      <img src={productImage} alt={product.name} className="h-full w-full rounded-lg object-contain" />
                    </span>
                    <span className="mt-2 block line-clamp-1 text-sm font-black text-white">{product.name}</span>
                    <span className="text-xs font-black text-[#8ff0a8]">{formatPoints(product.pointsPrice)} pts</span>
                  </motion.button>
                );
              })}
            </section>

            <motion.section
              key={activeProduct.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 overflow-hidden rounded-lg border border-white/10 bg-[#151817]"
            >
              <div className="relative flex min-h-[330px] items-center justify-center bg-[#1d211e] px-4 py-5">
                {activeProduct.badge && (
                  <span className={`absolute left-4 top-4 rounded-md px-2 py-1 text-[10px] font-black ${getBadgeClass(activeProduct.badge)}`}>
                    {activeProduct.badge}
                  </span>
                )}
                <span className="absolute right-4 top-4 rounded-md border border-white/10 bg-black/18 px-2 py-1 text-[10px] font-black text-white/56">
                  {activeProduct.category}
                </span>
                <img src={activeImage} alt={`${activeProduct.name} ${activeVariant.color} ${activeVariant.logo}`} className="max-h-[300px] w-full object-contain" />
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-[23px] font-black leading-tight text-white">{activeProduct.name}</h2>
                    <p className="mt-2 line-clamp-2 max-w-lg text-sm font-semibold leading-snug text-white/48">{activeProduct.description}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-2xl font-black leading-none text-[#00e676]">{formatPoints(activeProduct.pointsPrice)}</p>
                    <p className="mt-1 text-[11px] font-bold text-white/35">points</p>
                  </div>
                </div>

                <div className="mt-5">
                  <p className="mb-2 text-[11px] font-black uppercase text-white/38">Product Color</p>
                  <div
                    onPointerDown={(event) => handleSliderPointerDown('colors', event)}
                    onPointerMove={(event) => handleSliderPointerMove('colors', event)}
                    onPointerUp={(event) => handleSliderPointerEnd('colors', event)}
                    onPointerCancel={(event) => handleSliderPointerEnd('colors', event)}
                    onPointerLeave={(event) => handleSliderPointerEnd('colors', event)}
                    onWheel={handleSliderWheel}
                    className={`-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 select-none touch-pan-y [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
                      draggingSlider === 'colors' ? 'cursor-grabbing snap-none' : 'cursor-grab snap-x'
                    }`}
                  >
                    {activeProduct.colorVariants.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => updateProductVariant(activeProduct, { color })}
                        className={`flex min-w-[96px] snap-center items-center gap-2 rounded-lg border px-3 py-2 text-sm font-black ${
                          activeVariant.color === color
                            ? 'border-[#00e676] bg-[#00e676]/12 text-white'
                            : 'border-white/10 bg-white/[0.06] text-white/50'
                        }`}
                      >
                        <span className="h-5 w-5 rounded-md border border-white/20" style={{ backgroundColor: colorSwatches[color] || '#6b7280' }} />
                        {color}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-4">
                  <p className="mb-2 text-[11px] font-black uppercase text-white/38">Logo Color</p>
                  <div
                    onPointerDown={(event) => handleSliderPointerDown('logos', event)}
                    onPointerMove={(event) => handleSliderPointerMove('logos', event)}
                    onPointerUp={(event) => handleSliderPointerEnd('logos', event)}
                    onPointerCancel={(event) => handleSliderPointerEnd('logos', event)}
                    onPointerLeave={(event) => handleSliderPointerEnd('logos', event)}
                    onWheel={handleSliderWheel}
                    className={`-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 select-none touch-pan-y [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
                      draggingSlider === 'logos' ? 'cursor-grabbing snap-none' : 'cursor-grab snap-x'
                    }`}
                  >
                    {availableLogos.map((logo) => (
                      <button
                        key={logo}
                        type="button"
                        onClick={() => updateProductVariant(activeProduct, { logo })}
                        className={`flex min-w-[106px] snap-center items-center gap-2 rounded-lg border px-3 py-2 text-sm font-black ${
                          activeVariant.logo === logo
                            ? 'border-[#00e676] bg-[#00e676]/12 text-white'
                            : 'border-white/10 bg-white/[0.06] text-white/50'
                        }`}
                      >
                        <span className="h-5 w-5 rounded-md border border-white/20" style={{ backgroundColor: logoSwatches[logo] || '#6b7280' }} />
                        {logo}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-[1fr_auto] gap-3">
                  <button
                    type="button"
                    onClick={() => addProductToCart(activeProduct)}
                    disabled={activeProduct.inventory <= 0}
                    className="h-12 rounded-lg bg-[#00e676] text-sm font-black text-black disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Add to Cart
                  </button>
                  <div className="flex h-12 items-center rounded-lg border border-white/10 bg-white/[0.06] px-3 text-xs font-black text-white/48">
                    {activeProduct.inventory} left
                  </div>
                </div>
              </div>
            </motion.section>
          </>
        ) : (
          <div className="rounded-lg border border-white/10 bg-white/[0.055] px-4 py-8 text-center text-sm font-bold text-white/45">
            No marketplace products match that search.
          </div>
        )}

        <section className="mt-4 rounded-lg border border-white/10 bg-[#151817] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-white">Your Cart ({cartCount})</h2>
              <p className="text-sm font-bold text-white/42">{formatPoints(cartTotal)} points selected</p>
              {cartItems.length > 0 && pointsShortfall > 0 && (
                <p className="mt-1 text-xs font-black text-red-300">
                  Need {formatPoints(pointsShortfall)} more points to checkout.
                </p>
              )}
            </div>
            <span className="rounded-lg bg-white px-3 py-2 text-xs font-black text-black">Points Only</span>
          </div>

          {cartItems.length > 0 ? (
            <div
              onPointerDown={(event) => handleSliderPointerDown('cart', event)}
              onPointerMove={(event) => handleSliderPointerMove('cart', event)}
              onPointerUp={(event) => handleSliderPointerEnd('cart', event)}
              onPointerCancel={(event) => handleSliderPointerEnd('cart', event)}
              onPointerLeave={(event) => handleSliderPointerEnd('cart', event)}
              onWheel={handleSliderWheel}
              className={`-mx-1 mt-3 flex gap-3 overflow-x-auto px-1 pb-1 select-none touch-pan-y [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
                draggingSlider === 'cart' ? 'cursor-grabbing snap-none' : 'cursor-grab snap-x'
              }`}
            >
              {cartItems.map((item) => (
                <div key={item.id} className="min-w-[218px] snap-center rounded-lg bg-white/[0.055] p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="line-clamp-1 text-sm font-black text-white">{item.name}</p>
                      <p className="mt-1 text-xs font-bold text-white/42">{item.color} / {item.logo}</p>
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
                    <span className="text-sm font-black text-[#8ff0a8]">{formatPoints(item.pointsPrice * item.quantity)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 rounded-lg border border-dashed border-white/10 px-4 py-4 text-center text-sm font-bold text-white/42">
              Add merch to redeem with your earned points.
            </p>
          )}

          {message && (
            <p className="mt-3 rounded-lg bg-white/[0.055] px-4 py-3 text-sm font-bold text-white/70">{message}</p>
          )}

          {latestOrder && (
            <div className="mt-3 flex items-center gap-3 rounded-lg border border-[#8ff0a8]/30 bg-[#8ff0a8]/10 px-4 py-3 text-sm font-bold text-[#caffe0]">
              <CheckCircle className="h-5 w-5 text-[#8ff0a8]" />
              <span>Admin order queue updated for {latestOrder.orderNumber || 'your merch order'}.</span>
            </div>
          )}

          <button
            type="button"
            onClick={openCheckout}
            className="mt-4 h-12 w-full rounded-lg bg-[#8ff0a8] text-sm font-black text-[#07110a] shadow-[0_14px_34px_rgba(143,240,168,0.24)]"
          >
            Checkout
          </button>
        </section>
      </main>

      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 px-3 py-4 backdrop-blur-sm sm:items-center">
          <motion.form
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={(event) => {
              event.preventDefault();
              void placeOrder();
            }}
            className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-lg border border-white/10 bg-[#111512] p-4 text-white shadow-[0_24px_70px_rgba(0,0,0,0.5)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.08em] text-[#8ff0a8]">Points checkout</p>
                <h2 className="mt-1 text-2xl font-black leading-tight">Shipping Details</h2>
                <p className="mt-1 text-sm font-bold text-white/45">
                  {formatPoints(cartTotal)} points for {cartCount} item{cartCount === 1 ? '' : 's'}.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCheckoutOpen(false)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.08] text-white/70"
                aria-label="Close checkout"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mb-2 text-xs font-black text-white/42">Pay with:</p>
            <div className="mb-4 grid grid-cols-3 gap-2">
              <span className="rounded-lg bg-white px-3 py-2 text-center text-xs font-black text-black">Points Only</span>
              <span className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-center text-xs font-black text-white/25">USDT (Locked)</span>
              <span className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-center text-xs font-black text-white/25">Card</span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-xs font-black text-white/42">Name</span>
                <input
                  value={checkoutForm.name}
                  onChange={(event) => updateCheckoutField('name', event.target.value)}
                  className="h-11 w-full rounded-lg border border-white/10 bg-white/[0.07] px-3 text-sm font-bold text-white outline-none placeholder:text-white/25 focus:border-[#8ff0a8]"
                  placeholder="Your name"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-black text-white/42">Email</span>
                <input
                  type="email"
                  value={checkoutForm.email}
                  onChange={(event) => updateCheckoutField('email', event.target.value)}
                  className="h-11 w-full rounded-lg border border-white/10 bg-white/[0.07] px-3 text-sm font-bold text-white outline-none placeholder:text-white/25 focus:border-[#8ff0a8]"
                  placeholder="you@email.com"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-black text-white/42">Phone</span>
                <input
                  value={checkoutForm.phone}
                  onChange={(event) => updateCheckoutField('phone', event.target.value)}
                  className="h-11 w-full rounded-lg border border-white/10 bg-white/[0.07] px-3 text-sm font-bold text-white outline-none placeholder:text-white/25 focus:border-[#8ff0a8]"
                  placeholder="Optional"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-xs font-black text-white/42">Address</span>
                <input
                  value={checkoutForm.addressLine1}
                  onChange={(event) => updateCheckoutField('addressLine1', event.target.value)}
                  className="h-11 w-full rounded-lg border border-white/10 bg-white/[0.07] px-3 text-sm font-bold text-white outline-none placeholder:text-white/25 focus:border-[#8ff0a8]"
                  placeholder="Street address"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-xs font-black text-white/42">Apt, suite, unit</span>
                <input
                  value={checkoutForm.addressLine2}
                  onChange={(event) => updateCheckoutField('addressLine2', event.target.value)}
                  className="h-11 w-full rounded-lg border border-white/10 bg-white/[0.07] px-3 text-sm font-bold text-white outline-none placeholder:text-white/25 focus:border-[#8ff0a8]"
                  placeholder="Optional"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-black text-white/42">City</span>
                <input
                  value={checkoutForm.city}
                  onChange={(event) => updateCheckoutField('city', event.target.value)}
                  className="h-11 w-full rounded-lg border border-white/10 bg-white/[0.07] px-3 text-sm font-bold text-white outline-none placeholder:text-white/25 focus:border-[#8ff0a8]"
                  placeholder="City"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-black text-white/42">State / Region</span>
                <input
                  value={checkoutForm.region}
                  onChange={(event) => updateCheckoutField('region', event.target.value)}
                  className="h-11 w-full rounded-lg border border-white/10 bg-white/[0.07] px-3 text-sm font-bold text-white outline-none placeholder:text-white/25 focus:border-[#8ff0a8]"
                  placeholder="State"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-black text-white/42">ZIP / Postal</span>
                <input
                  value={checkoutForm.postalCode}
                  onChange={(event) => updateCheckoutField('postalCode', event.target.value)}
                  className="h-11 w-full rounded-lg border border-white/10 bg-white/[0.07] px-3 text-sm font-bold text-white outline-none placeholder:text-white/25 focus:border-[#8ff0a8]"
                  placeholder="Postal code"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-black text-white/42">Country</span>
                <input
                  value={checkoutForm.country}
                  onChange={(event) => updateCheckoutField('country', event.target.value)}
                  className="h-11 w-full rounded-lg border border-white/10 bg-white/[0.07] px-3 text-sm font-bold text-white outline-none placeholder:text-white/25 focus:border-[#8ff0a8]"
                  placeholder="Country"
                />
              </label>
            </div>

            {message && (
              <p className="mt-4 rounded-lg bg-white/[0.06] px-4 py-3 text-sm font-bold text-white/70">{message}</p>
            )}

            <div className="mt-5 grid grid-cols-[1fr_auto] gap-3">
              <button
                type="submit"
                disabled={isSubmittingOrder}
                className="h-12 rounded-lg bg-[#8ff0a8] text-sm font-black text-[#07110a] shadow-[0_14px_34px_rgba(143,240,168,0.24)] disabled:cursor-wait disabled:opacity-60"
              >
                {isSubmittingOrder ? 'Placing Order...' : 'Buy'}
              </button>
              <button
                type="button"
                onClick={() => setIsCheckoutOpen(false)}
                className="h-12 rounded-lg border border-white/10 bg-white/[0.08] px-4 text-sm font-black text-white/68"
              >
                Cancel
              </button>
            </div>
          </motion.form>
        </div>
      )}
    </div>
  );
}
