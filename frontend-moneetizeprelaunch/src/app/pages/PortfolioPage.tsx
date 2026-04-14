import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { Briefcase, ChevronLeft, ChevronRight, Filter, MessageCircle, Search, X } from 'lucide-react';
import gemIcon from 'figma:asset/296d8aa06fd9c7e60192bc7368a4a032ec5bc17e.png';
import aiBubble from 'figma:asset/36fff8878cf3ea6d1ef44d3f08bbc2346c733ebc.png';
import greenMorphicBall from 'figma:asset/8fd559d05db8d67dee13e79dc6418365220fd613.png';
import { PROFILE_FEED_FALLBACK_PRODUCTS, formatProductCategory, getProductPerformance } from '../data/portfolioProducts';
import { loadProductCatalog, type Product } from '../services/productService';
import { getUserPoints, POINTS_UPDATED_EVENT } from '../utils/pointsManager';
import { getStoredProfileSettings, PROFILE_SETTINGS_STORAGE_KEYS, PROFILE_SETTINGS_UPDATED_EVENT } from '../utils/profileSettings';
import { safeGetItem, safeSetItem } from '../utils/storage';

type CategoryFilter = 'all' | 'fitness' | 'tech' | 'fashion';
type SortFilter = 'new' | 'popular' | 'cheaper' | 'expensive' | 'rating';
type PublishedFilter = '24h' | '1w' | '1m' | '3m' | 'all';

const categoryFilters: { id: CategoryFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'fitness', label: 'Fitness' },
  { id: 'tech', label: 'Tech' },
  { id: 'fashion', label: 'Fashion' },
];

const sortFilters: { id: SortFilter; label: string }[] = [
  { id: 'new', label: 'New' },
  { id: 'popular', label: 'Popular' },
  { id: 'cheaper', label: 'Cheaper' },
  { id: 'expensive', label: 'More expensive' },
  { id: 'rating', label: 'High rating' },
];

const publishedFilters: { id: PublishedFilter; label: string }[] = [
  { id: '24h', label: '24H' },
  { id: '1w', label: '1W' },
  { id: '1m', label: '1M' },
  { id: '3m', label: '3M' },
  { id: 'all', label: 'All' },
];

function getPortfolioCategory(product: Product): string {
  const text = `${product.category} ${(product.tags || []).join(' ')}`.toLowerCase();

  if (text.includes('home') || text.includes('kitchen')) return 'home & kitchen';
  if (text.includes('tech') || text.includes('electronics')) return 'tech';
  if (text.includes('fashion') || text.includes('lifestyle') || text.includes('clothing')) return 'fashion';
  if (text.includes('fitness') || text.includes('wellness') || text.includes('sports') || text.includes('nutrition')) return 'fitness';

  return product.category || 'fitness';
}

export function PortfolioPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>(PROFILE_FEED_FALLBACK_PRODUCTS);
  const [userPoints, setUserPoints] = useState(getUserPoints());
  const [userName, setUserName] = useState('Jess Wu');
  const [userPhoto, setUserPhoto] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('blueAvatar');
  const [showProgressNotice, setShowProgressNotice] = useState(() => safeGetItem('portfolioProgressNoticeDismissed') !== 'true');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedBreakdown, setExpandedBreakdown] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [sortFilter, setSortFilter] = useState<SortFilter>('new');
  const [publishedFilter, setPublishedFilter] = useState<PublishedFilter>('24h');
  const [priceFrom, setPriceFrom] = useState('10');
  const [priceTo, setPriceTo] = useState('2000');

  useEffect(() => {
    const applyProfileSettings = () => {
      const profileSettings = getStoredProfileSettings({ fallbackName: 'Jess Wu' });
      setUserName(profileSettings.name);
      setUserPhoto(profileSettings.photo);
      setSelectedAvatar(profileSettings.selectedAvatar);
      setUserPoints(getUserPoints());
    };

    const loadProducts = async () => {
      try {
        const catalog = await loadProductCatalog();
        setProducts(catalog.length ? catalog : PROFILE_FEED_FALLBACK_PRODUCTS);
      } catch (error) {
        console.error('Failed to load portfolio products:', error);
        setProducts(PROFILE_FEED_FALLBACK_PRODUCTS);
      }
    };

    applyProfileSettings();
    loadProducts();

    const handleStorageChange = (event: StorageEvent) => {
      if (!event.key || PROFILE_SETTINGS_STORAGE_KEYS.includes(event.key) || event.key === 'userPoints') {
        applyProfileSettings();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener(PROFILE_SETTINGS_UPDATED_EVENT, applyProfileSettings);
    window.addEventListener(POINTS_UPDATED_EVENT, applyProfileSettings);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener(PROFILE_SETTINGS_UPDATED_EVENT, applyProfileSettings);
      window.removeEventListener(POINTS_UPDATED_EVENT, applyProfileSettings);
    };
  }, []);

  const filteredProducts = useMemo(() => {
    const minPrice = Number(priceFrom) || 0;
    const maxPrice = Number(priceTo) || Number.POSITIVE_INFINITY;

    const nextProducts = products.filter((product) => {
      const category = getPortfolioCategory(product);
      const matchesCategory = categoryFilter === 'all' || category.includes(categoryFilter);
      const matchesPrice = product.price >= minPrice && product.price <= maxPrice;
      return matchesCategory && matchesPrice;
    });

    return [...nextProducts].sort((a, b) => {
      if (sortFilter === 'popular') return b.reviews - a.reviews;
      if (sortFilter === 'cheaper') return a.price - b.price;
      if (sortFilter === 'expensive') return b.price - a.price;
      if (sortFilter === 'rating') return b.rating - a.rating;
      return a.name.localeCompare(b.name);
    });
  }, [categoryFilter, priceFrom, priceTo, products, sortFilter]);

  const groupedProducts = useMemo(() => {
    const groups = filteredProducts.reduce<Record<string, Product[]>>((acc, product) => {
      const category = getPortfolioCategory(product);
      acc[category] = acc[category] || [];
      acc[category].push(product);
      return acc;
    }, {});

    return Object.entries(groups).sort(([first], [second]) => first.localeCompare(second));
  }, [filteredProducts]);

  const heroProducts = filteredProducts.slice(0, 4);
  const accountBalance = 345.89;
  const generatedGain = 23.88;
  const generatedPoints = 4.5;
  const aiAgentImage = selectedAvatar === 'greenAvatar' ? greenMorphicBall : aiBubble;

  const dismissNotice = () => {
    safeSetItem('portfolioProgressNoticeDismissed', 'true');
    setShowProgressNotice(false);
  };

  const renderAnimatedAiAvatar = () => {
    const isGreenAgent = selectedAvatar === 'greenAvatar';

    return (
      <span className="relative block h-12 w-12">
        <motion.span
          className={`absolute inset-0 rounded-full bg-gradient-to-br ${
            isGreenAgent ? 'from-green-400 via-emerald-500 to-lime-400' : 'from-purple-400 via-blue-500 to-cyan-400'
          } blur-lg opacity-40`}
          animate={{ opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.span
          animate={{ rotate: 360, scale: [1, 1.05, 1] }}
          transition={{
            rotate: { duration: 20, repeat: Infinity, ease: 'linear' },
            scale: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
          }}
          className={`relative block h-12 w-12 overflow-hidden rounded-full border-2 ${
            isGreenAgent ? 'border-emerald-400' : 'border-purple-500'
          }`}
          style={{
            maskImage: 'radial-gradient(circle at center, black 40%, transparent 90%)',
            WebkitMaskImage: 'radial-gradient(circle at center, black 40%, transparent 90%)',
          }}
        >
          <img src={aiAgentImage} alt="AI Agent" className="h-full w-full object-cover opacity-90" />
        </motion.span>
      </span>
    );
  };

  const renderHeader = () => (
    <header className="sticky top-0 z-30 bg-[#0a0e1a]/90 pb-4 backdrop-blur-md">
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

      <div className="flex items-center justify-between px-4 pt-2">
        <div className="flex h-9 items-center gap-2 rounded-full border border-white/10 bg-white/8 px-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
          <span className="text-sm font-black text-[#8ff0a8]">{userPoints}</span>
          <img src={gemIcon} alt="Gem" className="h-5 w-5" />
        </div>

        <button
          onClick={() => navigate('/profile-screen')}
          className="flex h-10 items-center gap-3 rounded-full bg-white px-4 text-black shadow-[0_8px_24px_rgba(0,0,0,0.32)]"
        >
          <div className="h-7 w-7 overflow-hidden rounded-full bg-gradient-to-br from-orange-300 to-orange-600">
            {userPhoto && <img src={userPhoto} alt={userName} className="h-full w-full object-cover" />}
          </div>
          <span className="max-w-[112px] truncate text-sm font-bold">{userName}</span>
        </button>

        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/chat/agent')} className="flex h-12 w-12 items-center justify-center rounded-full" aria-label="AI chat">
            {renderAnimatedAiAvatar()}
          </button>
          <button
            onClick={() => navigate('/chat-list')}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/8 text-white"
            aria-label="Messages"
          >
            <MessageCircle className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );

  const renderChart = () => (
    <section className="px-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-white/48">Account Balance</p>
          <h1 className="mt-1 text-[34px] font-black leading-none text-white">${accountBalance.toFixed(2)}</h1>
        </div>
        <div className="pt-4 text-right text-sm font-black text-[#8ff0a8]">
          <p>+ {generatedPoints}</p>
          <p>+${generatedGain.toFixed(2)}</p>
        </div>
      </div>

      <div className="relative mt-5 h-52 overflow-hidden">
        <div className="absolute left-[25%] top-2 rounded-full bg-white/8 px-3 py-1 text-xs font-black text-white/45">
          FEB 12, 2025 $19.96
        </div>
        <div className="absolute left-[42%] top-9 h-[150px] border-l border-dashed border-white/12" />
        <div className="absolute left-0 right-0 top-[105px] border-t border-dashed border-white/10" />
        <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 360 210">
          <path
            d="M0 120 L8 96 L28 96 L40 128 L52 106 L64 138 L78 102 L96 64 L112 150 L126 112 L138 150 L154 148 L166 172 L180 168 L194 110 L206 68 L218 74 L230 56 L240 66 L252 60 L262 24 L272 94 L284 82 L300 188 L314 154 L328 118 L340 130 L352 106 L360 111"
            fill="none"
            stroke="#7bd98d"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
          <circle cx="112" cy="150" r="6" fill="#8fe7a1" stroke="rgba(255,255,255,0.7)" strokeWidth="2" />
        </svg>
      </div>

      <div className="mt-2 flex items-center gap-2 rounded-full bg-[#16191e] p-1">
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
    </section>
  );

  const renderProductCard = (product: Product) => {
    const performance = getProductPerformance(product);

    return (
      <button
        key={product.id}
        onClick={() => navigate(`/product/${encodeURIComponent(product.id)}`, { state: { product } })}
        className="group relative h-[96px] w-full overflow-hidden rounded-[1.4rem] bg-[#1d2024] text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_14px_34px_rgba(0,0,0,0.28)]"
      >
        <img src={product.image} alt={product.name} className="absolute inset-0 h-full w-full object-cover opacity-42 transition-transform duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#202521] via-[#202521]/88 to-[#202521]/20" />
        <div className="relative z-10 flex h-full flex-col justify-between p-4">
          <div>
            <h3 className="line-clamp-1 text-base font-black text-white">{product.name}</h3>
            <p className="text-sm font-semibold text-white/48">{formatProductCategory(getPortfolioCategory(product))}</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-black text-white">$ {product.price.toFixed(2)}</span>
            <span className="rounded-full bg-[#8ff0a8]/10 px-2 py-1 text-xs font-black text-[#8ff0a8]">+ {performance.roi}%</span>
          </div>
        </div>
      </button>
    );
  };

  const renderBreakdown = () => {
    const sections = expandedBreakdown ? groupedProducts : groupedProducts.slice(0, 2);

    return (
      <section className="mt-7 px-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-black text-white">Portfolio Breakdown</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(true)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/8 text-white/62 transition-colors hover:bg-white/14 hover:text-white"
              aria-label="Open portfolio filters"
            >
              <Filter className="h-4 w-4" />
            </button>
            <button
              onClick={() => setExpandedBreakdown((expanded) => !expanded)}
              className="flex h-9 items-center gap-1 rounded-full bg-white/8 px-4 text-xs font-black text-white/62 transition-colors hover:bg-white/14 hover:text-white"
            >
              {expandedBreakdown ? 'Collapse' : 'See More'}
              <ChevronRight className={`h-3.5 w-3.5 transition-transform ${expandedBreakdown ? 'rotate-90' : ''}`} />
            </button>
          </div>
        </div>

        {expandedBreakdown && (
          <div className="mb-5 flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {categoryFilters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setCategoryFilter(filter.id)}
                className={`rounded-full px-4 py-2.5 text-xs font-black transition-colors ${
                  categoryFilter === filter.id ? 'bg-white text-black' : 'bg-white/10 text-white/58 hover:text-white'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        )}

        <div className="space-y-6">
          {sections.map(([category, categoryProducts]) => (
            <div key={category}>
              <h3 className="mb-3 text-xl font-black text-white/72">{formatProductCategory(category)}</h3>
              <div className="space-y-3">
                {categoryProducts.slice(0, expandedBreakdown ? undefined : 3).map(renderProductCard)}
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  };

  const renderFilters = () => (
    <AnimatePresence>
      {showFilters && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 360, damping: 34 }}
            className="absolute inset-x-0 bottom-0 mx-auto max-h-[78vh] w-full max-w-md overflow-y-auto rounded-t-[2rem] bg-[#111418] px-4 pb-8 pt-8 text-white shadow-[0_-30px_80px_rgba(0,0,0,0.55)]"
          >
            <button
              onClick={() => setShowFilters(false)}
              className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white/72 transition-colors hover:bg-white/18 hover:text-white"
              aria-label="Close filters"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="mb-5 text-center text-xl font-black">Filters</h2>
            <FilterGroup title="Categories" options={categoryFilters} value={categoryFilter} onChange={(value) => setCategoryFilter(value as CategoryFilter)} />
            <FilterGroup title="Show first" options={sortFilters} value={sortFilter} onChange={(value) => setSortFilter(value as SortFilter)} />

            <div className="mt-7">
              <h3 className="mb-3 text-base font-black text-white/82">Price</h3>
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={priceFrom}
                  onChange={(event) => setPriceFrom(event.target.value)}
                  className="h-14 rounded-full border border-white/6 bg-white/8 px-5 text-sm font-bold text-white placeholder:text-white/45 focus:outline-none focus:ring-2 focus:ring-white/20"
                  placeholder="from $10"
                  inputMode="numeric"
                />
                <input
                  value={priceTo}
                  onChange={(event) => setPriceTo(event.target.value)}
                  className="h-14 rounded-full border border-white/6 bg-white/8 px-5 text-sm font-bold text-white placeholder:text-white/45 focus:outline-none focus:ring-2 focus:ring-white/20"
                  placeholder="to $2000"
                  inputMode="numeric"
                />
              </div>
            </div>

            <FilterGroup title="Published Products" options={publishedFilters} value={publishedFilter} onChange={(value) => setPublishedFilter(value as PublishedFilter)} />

            <div className="mt-8 grid grid-cols-[56px_1fr] gap-5">
              <button
                onClick={() => setShowFilters(false)}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-white/8 text-white transition-colors hover:bg-white/14"
                aria-label="Close filters"
              >
                <X className="h-4 w-4" />
              </button>
              <button
                onClick={() => setShowFilters(false)}
                className="h-14 rounded-full bg-white text-base font-black text-black transition-colors hover:bg-gray-100"
              >
                Apply
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const renderProgressNotice = () => (
    <AnimatePresence>
      {showProgressNotice && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 bg-black/72 backdrop-blur-[2px]"
        >
          <motion.div
            initial={{ y: -18, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -18, opacity: 0 }}
            className="mx-auto mt-[108px] w-[calc(100%-28px)] max-w-md overflow-hidden rounded-[1.2rem] border border-white/14 bg-gradient-to-br from-[#24282d]/95 to-[#111419]/98 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_24px_80px_rgba(0,0,0,0.55)]"
          >
            <p className="text-sm font-semibold leading-snug text-white/78">
              Since our last connection 23 hours ago, you've generated <span className="font-black text-[#8ff0a8]">$24</span> on Moneetize. Keep growing your income, I'm working for you!
            </p>
            <button
              onClick={dismissNotice}
              className="mt-4 rounded-full bg-white px-6 py-3 text-sm font-black text-black transition-colors hover:bg-gray-100"
            >
              See my Wallet
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const renderFloatingFooterNav = () => (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30">
      <div className="mx-auto flex w-full max-w-md items-center justify-between px-7 pb-6 pt-8">
        <button
          onClick={() => navigate(-1)}
          className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#17191d]/95 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_12px_34px_rgba(0,0,0,0.45)] transition-colors hover:bg-[#202329]"
          aria-label="Go back"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          className="pointer-events-auto flex h-12 items-center gap-2 rounded-full bg-[#17191d]/95 px-6 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_14px_36px_rgba(0,0,0,0.46)]"
          aria-label="Current portfolio"
        >
          <Briefcase className="h-4 w-4" />
          <span className="text-sm font-bold">Portfolio</span>
        </button>
        <button
          onClick={() => setShowFilters(true)}
          className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#17191d]/95 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_12px_34px_rgba(0,0,0,0.45)] transition-colors hover:bg-[#202329]"
          aria-label="Search and filters"
        >
          <Search className="h-5 w-5" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="h-screen w-full overflow-y-auto bg-[#0a0e1a] text-white [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <div className="mx-auto min-h-full w-full max-w-md pb-32">
        {renderHeader()}
        {!expandedBreakdown && renderChart()}
        {renderBreakdown()}

        {!expandedBreakdown && heroProducts.length > 0 && (
          <section className="mx-4 mt-7 rounded-[1.7rem] border border-white/10 bg-white/6 p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-black text-white">Crowdfunding Meter</h2>
              <span className="text-sm font-black text-[#f0a13d]">{getProductPerformance(heroProducts[0]).progress}%</span>
            </div>
            <div className="h-3 rounded-full bg-white">
              <div
                className="h-full rounded-full bg-[#f5c780]"
                style={{ width: `${getProductPerformance(heroProducts[0]).progress}%` }}
              />
            </div>
          </section>
        )}
      </div>

      {renderProgressNotice()}
      {renderFilters()}
      {renderFloatingFooterNav()}
    </div>
  );
}

interface FilterOption {
  id: string;
  label: string;
}

interface FilterGroupProps {
  title: string;
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
}

function FilterGroup({ title, options, value, onChange }: FilterGroupProps) {
  return (
    <div className="mt-7">
      <h3 className="mb-3 text-base font-black text-white/82">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => onChange(option.id)}
            className={`rounded-full px-4 py-2.5 text-xs font-black transition-colors ${
              value === option.id ? 'bg-white text-black' : 'bg-white/10 text-white/58 hover:bg-white/14 hover:text-white'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
