import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronLeft, ShoppingBag, X } from 'lucide-react';
import gemIcon from 'figma:asset/296d8aa06fd9c7e60192bc7368a4a032ec5bc17e.png';
import { PROFILE_FEED_FALLBACK_PRODUCTS, formatProductCategory, getProductPerformance } from '../data/portfolioProducts';
import { loadProductCatalog, type Product } from '../services/productService';
import { safeGetItem, safeSetItem } from '../utils/storage';

type PortfolioActionType = 'invest' | 'buy';

interface ProductRouteState {
  product?: Product;
}

interface PortfolioAction {
  id: string;
  type: PortfolioActionType;
  productId: string;
  productName: string;
  amount: number;
  createdAt: string;
}

export function ProductDetailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { productId = '' } = useParams();
  const routeState = location.state as ProductRouteState | null;
  const [product, setProduct] = useState<Product | null>(routeState?.product || null);
  const [activeMode, setActiveMode] = useState<PortfolioActionType>('invest');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (product) return;

    const loadProduct = async () => {
      const decodedId = decodeURIComponent(productId);
      try {
        const catalog = await loadProductCatalog();
        const matchedProduct = catalog.find((item) => item.id === decodedId);
        setProduct(matchedProduct || PROFILE_FEED_FALLBACK_PRODUCTS.find((item) => item.id === decodedId) || PROFILE_FEED_FALLBACK_PRODUCTS[0]);
      } catch (error) {
        console.error('Failed to load product detail:', error);
        setProduct(PROFILE_FEED_FALLBACK_PRODUCTS.find((item) => item.id === decodedId) || PROFILE_FEED_FALLBACK_PRODUCTS[0]);
      }
    };

    loadProduct();
  }, [product, productId]);

  const performance = useMemo(() => (product ? getProductPerformance(product) : null), [product]);

  const recordPortfolioAction = (type: PortfolioActionType) => {
    if (!product) return;

    const nextAction: PortfolioAction = {
      id: `${type}-${product.id}-${Date.now()}`,
      type,
      productId: product.id,
      productName: product.name,
      amount: product.price,
      createdAt: new Date().toISOString(),
    };

    try {
      const existingJson = safeGetItem('portfolioActions');
      const existingActions: PortfolioAction[] = existingJson ? JSON.parse(existingJson) : [];
      safeSetItem('portfolioActions', JSON.stringify([nextAction, ...existingActions].slice(0, 100)));
    } catch (error) {
      console.error('Failed to save portfolio action:', error);
    }

    setActiveMode(type);
    setSuccessMessage(type === 'invest' ? `${product.name} was added to your portfolio watchlist.` : `${product.name} buy request was saved.`);
  };

  if (!product || !performance) {
    return (
      <div className="flex h-[100dvh] w-full items-center justify-center bg-[#0a0e1a] text-white">
        Loading product...
      </div>
    );
  }

  const seller = product.seller || product.brand;
  const productDescription = product.description.length > 310 ? `${product.description.slice(0, 310)}...` : product.description;

  return (
    <div className="h-[100dvh] w-full overflow-y-auto bg-[#0a0e1a] text-white [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <div className="mx-auto min-h-full w-full max-w-md pb-32">
        <div className="sticky top-0 z-30 bg-[#0a0e1a]/84 pb-3 backdrop-blur-md">
          <div className="flex h-11 items-center justify-between px-4 text-sm text-white">
            <div className="flex items-center gap-2">
              <span className="font-semibold">9:41</span>
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-4 rounded-sm bg-white/80" />
              <div className="h-3 w-4 rounded-sm bg-white/80" />
              <span className="rounded bg-yellow-500 px-1 text-[10px] font-black text-black">32</span>
            </div>
          </div>
        </div>

        <section className="relative overflow-hidden px-4 pb-4 pt-2 text-center">
          <div className="absolute inset-x-0 top-0 h-36 bg-[radial-gradient(circle_at_32%_0%,rgba(240,58,58,0.58),transparent_35%),radial-gradient(circle_at_78%_0%,rgba(143,240,168,0.5),transparent_35%)] blur-xl" />
          <button
            onClick={() => navigate(-1)}
            className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/8 text-white transition-colors hover:bg-white/14"
            aria-label="Go back"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <img
            src={product.image}
            alt={product.name}
            className="relative z-10 mx-auto mt-1 h-16 w-16 rounded-full object-cover opacity-80"
          />
          <p className="relative z-10 mt-4 text-sm font-black text-white/62">{product.name}</p>
          <h1 className="relative z-10 mt-2 text-[34px] font-black leading-none text-white">${product.price.toFixed(2)}</h1>
          <div className="relative z-10 mt-3 flex items-center justify-center gap-4 text-xs font-black text-[#8ff0a8]">
            <span>+{product.rating.toFixed(1)}</span>
            <span>+${performance.generatedValue.toFixed(2)}</span>
          </div>
        </section>

        <section className="relative h-56 overflow-hidden px-0">
          <div className="absolute left-[19%] top-4 rounded-full bg-white/8 px-3 py-1 text-xs font-black text-white/45">
            FEB 12, 2025 • ${performance.generatedValue.toFixed(2)}
          </div>
          <div className="absolute left-1/2 top-10 h-40 border-l border-dashed border-white/10" />
          <div className="absolute left-0 right-0 top-[122px] border-t border-dashed border-white/10" />
          <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 360 225">
            <path
              d="M0 128 L10 94 L26 94 L38 126 L52 102 L66 140 L80 104 L98 62 L116 152 L130 112 L142 152 L158 149 L170 172 L184 166 L198 102 L210 61 L222 68 L234 55 L244 62 L256 25 L266 92 L278 82 L294 193 L308 158 L322 119 L336 131 L350 107 L360 114"
              fill="none"
              stroke="#7bd98d"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
          </svg>
        </section>

        <section className="px-4">
          <div className="mb-5 flex items-center gap-2 rounded-full bg-[#16191e] p-1">
            {['1W', '1M', '3M', '1Y', 'All'].map((range) => (
              <button
                key={range}
                className={`flex-1 rounded-full py-2 text-xs font-black transition-colors ${
                  range === '1M' ? 'bg-white text-black' : 'text-white/45 hover:text-white'
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          <div className="mb-5 flex items-center justify-between rounded-2xl bg-[#111418] px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/20">
                <ShoppingBag className="h-4 w-4 text-red-400" />
              </div>
              <div>
                <p className="text-xs font-black text-white">{seller}</p>
                <div className="flex items-center gap-2 text-xs font-bold text-white/58">
                  <span>{product.rating.toFixed(1)}</span>
                  <span className="text-yellow-400">★</span>
                  <span>({product.reviews})</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => recordPortfolioAction('invest')}
              className="rounded-full bg-white px-4 py-2 text-xs font-black text-black"
            >
              Invest
            </button>
          </div>

          <FundingMeter percent={performance.progress} />

          <article className="mt-6 rounded-[1.6rem] bg-[#111418] p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-black text-white">About</h2>
              <button className="flex h-8 w-8 items-center justify-center rounded-full bg-white/8 text-white/55">
                <ChevronLeft className="h-4 w-4 rotate-90" />
              </button>
            </div>
            <p className="text-sm font-medium leading-relaxed text-white/66">{productDescription}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-white/8 px-3 py-1.5 text-xs font-bold text-white/60">{formatProductCategory(product.category)}</span>
              {(product.tags || []).slice(0, 3).map((tag) => (
                <span key={tag} className="rounded-full bg-white/8 px-3 py-1.5 text-xs font-bold text-white/60">
                  {tag}
                </span>
              ))}
            </div>
          </article>

          <section className="mt-5 overflow-hidden rounded-[1.6rem] bg-[#111418] p-5">
            <h2 className="mb-3 text-xl font-black text-white">Risk level</h2>
            <div className="relative mx-auto h-56 w-56">
              <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_220deg,#ef4444_0deg,#ef4444_110deg,transparent_111deg,transparent_142deg,#8ff0a8_143deg,#8ff0a8_255deg,transparent_256deg)] blur-[1px]" />
              <div className="absolute inset-7 rounded-full bg-[#111418]" />
              <div className="absolute inset-x-0 bottom-12 text-center">
                <p className="text-3xl font-black text-white">4.5</p>
                <p className="text-xs font-bold text-white/48">Balanced risk</p>
              </div>
            </div>
          </section>
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30">
        <div className="mx-auto flex w-full max-w-md items-center gap-3 px-4 pb-6 pt-8">
          <button
            onClick={() => navigate(-1)}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-[#17191d]/95 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_12px_34px_rgba(0,0,0,0.45)] transition-colors hover:bg-[#202329]"
            aria-label="Go back"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => recordPortfolioAction('invest')}
            className={`h-14 flex-1 rounded-full text-sm font-black shadow-[0_14px_34px_rgba(0,0,0,0.36)] transition-colors ${
              activeMode === 'invest' ? 'bg-[#17191d]/95 text-white' : 'bg-white text-black'
            }`}
          >
            Invest
          </button>
          <button
            onClick={() => recordPortfolioAction('buy')}
            className={`h-14 flex-1 rounded-full text-sm font-black shadow-[0_14px_34px_rgba(0,0,0,0.36)] transition-colors ${
              activeMode === 'buy' ? 'bg-[#17191d]/95 text-white' : 'bg-white text-black'
            }`}
          >
            Buy
          </button>
        </div>
      </div>

      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/72 px-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ y: 18, scale: 0.94, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 18, scale: 0.94, opacity: 0 }}
              className="relative w-full max-w-xs rounded-[1.7rem] border border-white/12 bg-[#16191d] p-6 text-center shadow-2xl"
            >
              <button
                onClick={() => setSuccessMessage('')}
                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/8 text-white/60"
                aria-label="Close success message"
              >
                <X className="h-4 w-4" />
              </button>
              <img src={gemIcon} alt="Gem" className="mx-auto mb-4 h-14 w-14" />
              <h2 className="mb-2 text-xl font-black text-white">Portfolio updated</h2>
              <p className="text-sm font-semibold leading-relaxed text-white/62">{successMessage}</p>
              <button
                onClick={() => setSuccessMessage('')}
                className="mt-6 rounded-full bg-white px-8 py-3 text-sm font-black text-black"
              >
                Continue
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FundingMeter({ percent }: { percent: number }) {
  return (
    <section className="rounded-[1.3rem] bg-white px-4 py-5 shadow-[0_18px_60px_rgba(0,0,0,0.26)]">
      <div className="flex items-center gap-3">
        <div className="h-3 flex-1 rounded-full bg-[#f8d49a]/55">
          <div className="h-full rounded-full bg-[#f4bf70]" style={{ width: `${percent}%` }} />
        </div>
        <span className="w-10 text-right text-base font-black text-[#e8993f]">{percent}%</span>
      </div>
    </section>
  );
}
