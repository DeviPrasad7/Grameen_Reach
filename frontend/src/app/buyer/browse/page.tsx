'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { productsApi, cartApi, categoriesApi } from '@/lib/api';
import { useAuthStore, useLangStore, useCartCountStore, useWishlistStore } from '@/lib/store';
import toast from 'react-hot-toast';
import { Search, ShoppingCart, Eye, Leaf, Filter, X, SlidersHorizontal, Heart, Sparkles, MapPin, Clock, Award, TrendingUp, Package } from 'lucide-react';

interface Product {
  id: string;
  title: string;
  titleTE?: string;
  description?: string;
  fixedPrice?: number;
  minBidPrice?: number;
  priceType: string;
  unit: string;
  availableQty: number;
  minQty: number;
  grade?: string;
  organic: boolean;
  imageUrls: string[];
  district?: string;
  harvestDate?: string;
  farmer: { name: string };
  category: { id: string; name: string; nameTE?: string };
}

interface Category { id: string; name: string; nameTE?: string; icon?: string; }

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-vegetables', name: 'Vegetables', nameTE: 'కూరగాయలు', icon: '🥬' },
  { id: 'cat-fruits', name: 'Fruits', nameTE: 'పళ్ళు', icon: '🍎' },
  { id: 'cat-grains', name: 'Grains', nameTE: 'ధాన్యాలు', icon: '🌾' },
  { id: 'cat-pulses', name: 'Pulses', nameTE: 'పప్పులు', icon: '🫘' },
  { id: 'cat-dairy', name: 'Dairy', nameTE: 'పాల ఉత్పత్తులు', icon: '🥛' },
  { id: 'cat-spices', name: 'Spices', nameTE: 'మసాలాలు', icon: '🌶️' },
  { id: 'cat-oils', name: 'Oils', nameTE: 'నూనెలు', icon: '🫒' },
  { id: 'cat-dry-fruits', name: 'Dry Fruits', nameTE: 'డ్రై ఫ్రూట్స్', icon: '🥜' },
];

export default function BrowsePage() {
  const { user, _hasHydrated } = useAuthStore();
  const { lang, t } = useLangStore();
  const { setCount } = useCartCountStore();
  const wishlist = useWishlistStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  const [addingId, setAddingId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [organicOnly, setOrganicOnly] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const loadProducts = async (q?: string, catId?: string, pageNum = 1, append = false) => {
    if (append) { setLoadingMore(true); } else { setLoading(true); }
    try {
      const params: Record<string, unknown> = {};
      if (q) params.search = q;
      if (catId) params.categoryId = catId;
      params.page = pageNum;
      const res = await productsApi.list(params);
      const items = res.data?.items || res.data || [];
      if (append) {
        setProducts((prev) => [...prev, ...items]);
      } else {
        setProducts(items);
      }
      setHasMore(items.length >= 20);
      setPage(pageNum);
    } catch {
      if (!append) setProducts([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadProducts();
    categoriesApi.list().then((r) => setCategories((r.data || []).length > 0 ? r.data : DEFAULT_CATEGORIES)).catch(() => setCategories(DEFAULT_CATEGORIES));
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadProducts(search, selectedCat);
  };

  const filterByCategory = (catId: string) => {
    setSelectedCat(catId);
    loadProducts(search, catId);
  };

  const addToCart = async (product: Product) => {
    if (!user) { window.location.href = '/auth/login'; return; }
    setAddingId(product.id);
    try {
      const qty = product.minQty || 1;
      const res = await cartApi.addItem(product.id, qty);
      setCount(res.data?.items?.length || 0);
      toast.success(t({ en: 'Added to cart!', te: 'కార్ట్‌కు జోడించబడింది!' }));
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || t({ en: 'Failed to add to cart', te: 'కార్ట్‌కు జోడించడం విఫలమైంది' }));
    } finally {
      setAddingId(null);
    }
  };

  const toggleWishlist = (id: string) => {
    if (wishlist.has(id)) {
      wishlist.remove(id);
      toast.success(t({ en: 'Removed from wishlist', te: 'విష్‌లిస్ట్ నుండి తొలగించబడింది' }));
    } else {
      wishlist.add(id);
      toast.success(t({ en: 'Added to wishlist', te: 'విష్‌లిస్ట్‌కు జోడించబడింది' }));
    }
  };

  const price = (p: Product) => {
    if (p.priceType === 'FIXED') return `₹${p.fixedPrice}`;
    if (p.priceType === 'BID') return `${t({ en: 'Bid from', te: 'బిడ్' })} ₹${p.minBidPrice}`;
    return `₹${p.fixedPrice} / ${t({ en: 'Bid', te: 'బిడ్' })} ₹${p.minBidPrice}+`;
  };

  const priceTypeBadge = (type: string) => {
    const styles: Record<string, { bg: string; icon: React.ReactNode }> = {
      FIXED: { bg: 'bg-emerald-100 text-emerald-700', icon: null },
      BID: { bg: 'bg-amber-100 text-amber-700', icon: <TrendingUp className="w-3 h-3" /> },
      HYBRID: { bg: 'bg-blue-100 text-blue-700', icon: <Sparkles className="w-3 h-3" /> },
    };
    return styles[type] || { bg: 'bg-slate-100 text-slate-600', icon: null };
  };

  const getEffectivePrice = (p: Product) => p.fixedPrice || p.minBidPrice || 0;

  const displayProducts = (() => {
    let filtered = [...products];
    if (organicOnly) filtered = filtered.filter((p) => p.organic === true);
    if (minPrice !== '') {
      const min = parseFloat(minPrice);
      if (!isNaN(min)) filtered = filtered.filter((p) => getEffectivePrice(p) >= min);
    }
    if (maxPrice !== '') {
      const max = parseFloat(maxPrice);
      if (!isNaN(max)) filtered = filtered.filter((p) => getEffectivePrice(p) <= max);
    }
    if (sortBy === 'price_asc') filtered.sort((a, b) => getEffectivePrice(a) - getEffectivePrice(b));
    else if (sortBy === 'price_desc') filtered.sort((a, b) => getEffectivePrice(b) - getEffectivePrice(a));
    else if (sortBy === 'name_asc') filtered.sort((a, b) => a.title.localeCompare(b.title));
    return filtered;
  })();

  const getDaysAgo = (dateStr?: string) => {
    if (!dateStr) return null;
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
    if (diff <= 0) return t({ en: 'Today', te: 'ఈ రోజు' });
    if (diff === 1) return t({ en: '1 day ago', te: '1 రోజు క్రితం' });
    return t({ en: `${diff} days ago`, te: `${diff} రోజుల క్రితం` });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-700 via-primary-600 to-emerald-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full"></div>
          <div className="absolute bottom-0 left-20 w-32 h-32 bg-white/5 rounded-full"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">
                {t({ en: 'Fresh from the Farm', te: 'రైతు నుండి తాజాగా' })}
              </h1>
              <p className="text-primary-200 text-sm mt-1">
                {t({ en: 'Direct from verified AP/TS farmers — zero middlemen', te: 'ధృవీకరించిన AP/TS రైతుల నుండి నేరుగా — మధ్యవర్తులు లేరు' })}
              </p>
            </div>
            {user && (
              <Link
                href="/buyer/basket-builder"
                className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-white/15 backdrop-blur rounded-xl text-sm font-medium hover:bg-white/25 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                {t({ en: 'AI Basket', te: 'AI బాస్కెట్' })}
              </Link>
            )}
          </div>
          <form onSubmit={handleSearch} className="flex gap-2 max-w-2xl mt-5">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t({ en: 'Search tomatoes, dal, mango, chillies...', te: 'టమాటా, పప్పు, మామిడి, మిర్చి వెతకండి...' })}
                className="w-full pl-10 pr-4 py-3 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-white/50 shadow-sm"
              />
            </div>
            <button type="submit" className="px-5 py-3 bg-white/20 backdrop-blur rounded-xl text-sm font-semibold hover:bg-white/30 transition-all active:scale-95">
              {t({ en: 'Search', te: 'వెతకండి' })}
            </button>
            <div className="relative">
              <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/70 pointer-events-none" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="pl-9 pr-3 py-3 rounded-xl text-sm bg-white/20 text-white border-0 backdrop-blur hover:bg-white/30 transition-all appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                <option value="newest" className="text-slate-900">{t({ en: 'Newest', te: 'కొత్తవి' })}</option>
                <option value="price_asc" className="text-slate-900">{t({ en: 'Price: Low-High', te: 'ధర: తక్కువ-ఎక్కువ' })}</option>
                <option value="price_desc" className="text-slate-900">{t({ en: 'Price: High-Low', te: 'ధర: ఎక్కువ-తక్కువ' })}</option>
                <option value="name_asc" className="text-slate-900">{t({ en: 'A-Z', te: 'A-Z' })}</option>
              </select>
            </div>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3 py-3 backdrop-blur rounded-xl hover:bg-white/30 transition-all md:hidden ${showFilters ? 'bg-white/30' : 'bg-white/20'}`}
            >
              <Filter className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Category filters */}
        <div className={`flex flex-wrap gap-2 mb-5 ${showFilters ? '' : 'hidden md:flex'}`}>
          <button
            onClick={() => filterByCategory('')}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              !selectedCat ? 'bg-primary-600 text-white shadow-md shadow-primary-600/25' : 'bg-white text-slate-600 border border-slate-200 hover:border-primary-300 hover:text-primary-600'
            }`}
          >
            {t({ en: 'All', te: 'అన్నీ' })}
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => filterByCategory(cat.id)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                selectedCat === cat.id ? 'bg-primary-600 text-white shadow-md shadow-primary-600/25' : 'bg-white text-slate-600 border border-slate-200 hover:border-primary-300 hover:text-primary-600'
              }`}
            >
              {cat.icon} {lang === 'te' && cat.nameTE ? cat.nameTE : cat.name}
            </button>
          ))}
          {selectedCat && (
            <button onClick={() => filterByCategory('')} className="px-2 py-2 text-slate-400 hover:text-slate-600 transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Additional filters */}
        <div className={`flex flex-wrap items-center gap-4 mb-5 ${showFilters ? '' : 'hidden md:flex'}`}>
          <button
            onClick={() => setOrganicOnly(!organicOnly)}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              organicOnly ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:border-green-300'
            }`}
          >
            <Leaf className="w-4 h-4" />
            {t({ en: 'Organic Only', te: 'సేంద్రీయ మాత్రమే' })}
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">{t({ en: 'Price', te: 'ధర' })}:</span>
            <input
              type="number"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              placeholder={t({ en: 'Min', te: 'కనిష్ట' })}
              className="w-20 px-3 py-2.5 rounded-xl text-sm bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
            <span className="text-slate-400">–</span>
            <input
              type="number"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder={t({ en: 'Max', te: 'గరిష్ట' })}
              className="w-20 px-3 py-2.5 rounded-xl text-sm bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
          </div>
        </div>

        {/* Results bar */}
        {!loading && (
          <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
              <span className="font-medium flex items-center gap-1.5">
                <Package className="w-4 h-4 text-slate-400" />
                {t({ en: `${displayProducts.length} products`, te: `${displayProducts.length} ఉత్పత్తులు` })}
              </span>
              {selectedCat && (
                <span className="bg-primary-100 text-primary-700 px-2.5 py-0.5 rounded-full text-xs font-medium">
                  {categories.find((c) => c.id === selectedCat)
                    ? (lang === 'te' && categories.find((c) => c.id === selectedCat)?.nameTE
                      ? categories.find((c) => c.id === selectedCat)!.nameTE
                      : categories.find((c) => c.id === selectedCat)!.name)
                    : ''}
                </span>
              )}
              {organicOnly && (
                <span className="bg-green-100 text-green-700 px-2.5 py-0.5 rounded-full text-xs font-medium flex items-center gap-1">
                  <Leaf className="w-3 h-3" /> {t({ en: 'Organic', te: 'సేంద్రీయ' })}
                </span>
              )}
            </div>
            {(selectedCat || organicOnly || minPrice || maxPrice) && (
              <button
                onClick={() => { setSelectedCat(''); setOrganicOnly(false); setMinPrice(''); setMaxPrice(''); loadProducts(search, ''); }}
                className="text-xs text-primary-600 hover:text-primary-800 font-medium underline underline-offset-2 transition-colors"
              >
                {t({ en: 'Clear all filters', te: 'అన్ని ఫిల్టర్లు తీసివేయండి' })}
              </button>
            )}
          </div>
        )}

        {/* Products grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                <div className="h-44 shimmer" />
                <div className="p-4 space-y-2">
                  <div className="h-4 w-3/4 shimmer rounded" />
                  <div className="h-3 w-1/2 shimmer rounded" />
                  <div className="h-5 w-1/3 shimmer rounded mt-2" />
                  <div className="flex gap-2 mt-3">
                    <div className="h-8 flex-1 shimmer rounded-lg" />
                    <div className="h-8 flex-1 shimmer rounded-lg" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : displayProducts.length === 0 ? (
          <div className="text-center py-20 animate-fade-in">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
              <span className="text-4xl">🌾</span>
            </div>
            <p className="text-lg font-medium text-slate-500">{t({ en: 'No products found', te: 'ఉత్పత్తులు కనుగొనబడలేదు' })}</p>
            <p className="text-sm text-slate-400 mt-1">{t({ en: 'Try different search terms or filters', te: 'వేరే శోధన పదాలు లేదా ఫిల్టర్లు ప్రయత్నించండి' })}</p>
          </div>
        ) : (
          <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {displayProducts.map((p, idx) => {
              const badge = priceTypeBadge(p.priceType);
              return (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl border border-slate-100 overflow-hidden card-hover group animate-slide-up"
                  style={{ animationDelay: `${(idx % 8) * 50}ms`, animationFillMode: 'backwards' }}
                >
                  <div className="relative h-44 bg-slate-100 overflow-hidden">
                    <Link href={`/buyer/browse/${p.id}`}>
                      {p.imageUrls?.[0] ? (
                        <>
                          <div className="flex items-center justify-center h-full text-5xl">🥬</div>
                          <Image
                            src={p.imageUrls[0]}
                            alt={p.title}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                            unoptimized
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        </>
                      ) : (
                        <div className="flex items-center justify-center h-full text-5xl group-hover:scale-110 transition-transform duration-300">🥬</div>
                      )}
                    </Link>

                    {/* Badges */}
                    <div className="absolute top-2 left-2 flex gap-1.5">
                      {p.organic && (
                        <span className="flex items-center gap-0.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-[10px] px-2 py-0.5 rounded-full font-medium shadow-sm">
                          <Leaf className="w-3 h-3" /> {t({ en: 'Organic', te: 'సేంద్రీయ' })}
                        </span>
                      )}
                      <span className={`flex items-center gap-0.5 text-[10px] px-2 py-0.5 rounded-full font-semibold ${badge.bg}`}>
                        {badge.icon} {p.priceType}
                      </span>
                    </div>

                    {/* Grade badge */}
                    {p.grade && (
                      <div className="absolute bottom-2 left-2">
                        <span className="flex items-center gap-0.5 bg-white/90 backdrop-blur text-slate-700 text-[10px] px-2 py-0.5 rounded-full font-medium shadow-sm">
                          <Award className="w-3 h-3 text-amber-500" /> {p.grade}
                        </span>
                      </div>
                    )}

                    {/* Wishlist button */}
                    <button
                      onClick={() => toggleWishlist(p.id)}
                      className={`absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full backdrop-blur shadow-sm transition-all duration-200 z-10 ${
                        wishlist.has(p.id) ? 'bg-rose-50 scale-110' : 'bg-white/80 hover:bg-white hover:scale-110'
                      }`}
                      title={wishlist.has(p.id) ? t({ en: 'Remove from wishlist', te: 'విష్‌లిస్ట్ నుండి తొలగించు' }) : t({ en: 'Add to wishlist', te: 'విష్‌లిస్ట్‌కు జోడించు' })}
                    >
                      <Heart className={`w-4 h-4 transition-all duration-200 ${wishlist.has(p.id) ? 'text-rose-500 fill-rose-500 scale-110' : 'text-slate-400'}`} />
                    </button>
                  </div>

                  <div className="p-3.5">
                    <Link href={`/buyer/browse/${p.id}`}>
                      <h3 className="font-semibold text-slate-800 text-sm truncate hover:text-primary-700 transition-colors">
                        {lang === 'te' && p.titleTE ? p.titleTE : p.title}
                      </h3>
                    </Link>
                    <div className="flex items-center gap-1.5 mt-1">
                      <p className="text-xs text-slate-400 truncate">
                        {p.farmer?.name}
                      </p>
                      {p.district && (
                        <span className="flex items-center gap-0.5 text-[10px] text-slate-400">
                          <MapPin className="w-3 h-3" /> {p.district}
                        </span>
                      )}
                    </div>

                    <div className="flex items-baseline gap-1.5 mt-2.5">
                      <span className="text-primary-700 font-bold text-lg price-tag">{price(p)}</span>
                      <span className="text-[10px] text-slate-400 font-medium">/{p.unit}</span>
                    </div>

                    <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                      <span>{p.availableQty} {p.unit} {t({ en: 'available', te: 'అందుబాటులో' })}</span>
                      {p.harvestDate && (
                        <span className="flex items-center gap-0.5">
                          <Clock className="w-3 h-3" />
                          {getDaysAgo(p.harvestDate)}
                        </span>
                      )}
                    </div>

                    <div className="flex gap-2 mt-3">
                      <Link
                        href={`/buyer/browse/${p.id}`}
                        className="flex-1 flex items-center justify-center gap-1 text-xs py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50 transition-all duration-200 font-medium"
                      >
                        <Eye className="w-3.5 h-3.5" /> {t({ en: 'Details', te: 'వివరాలు' })}
                      </Link>
                      <button
                        onClick={() => addToCart(p)}
                        disabled={addingId === p.id}
                        className="flex-1 flex items-center justify-center gap-1 text-xs py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-emerald-600 text-white hover:from-primary-700 hover:to-emerald-700 disabled:opacity-50 transition-all duration-200 font-medium shadow-sm shadow-primary-600/20 active:scale-95"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        {addingId === p.id ? '...' : t({ en: 'Add', te: 'జోడించు' })}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {hasMore && (
            <div className="flex justify-center mt-10">
              <button
                onClick={() => loadProducts(search, selectedCat, page + 1, true)}
                disabled={loadingMore}
                className="group px-10 py-3.5 bg-white border-2 border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:border-primary-300 hover:text-primary-700 disabled:opacity-50 transition-all shadow-sm hover:shadow-md active:scale-95"
              >
                {loadingMore
                  ? t({ en: 'Loading...', te: 'లోడ్ అవుతోంది...' })
                  : (
                    <span className="flex items-center gap-2">
                      {t({ en: 'Load More Products', te: 'మరిన్ని ఉత్పత్తులు' })}
                      <Package className="w-4 h-4 group-hover:animate-bounce" />
                    </span>
                  )}
              </button>
            </div>
          )}
          </>
        )}
      </div>
    </div>
  );
}
