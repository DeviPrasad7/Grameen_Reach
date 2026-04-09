'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { productsApi, cartApi, categoriesApi } from '@/lib/api';
import { useAuthStore, useLangStore, useCartCountStore, useWishlistStore } from '@/lib/store';
import toast from 'react-hot-toast';
import { Search, ShoppingCart, Eye, Leaf, Filter, X, SlidersHorizontal, Heart } from 'lucide-react';

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
  farmer: { name: string };
  category: { id: string; name: string; nameTE?: string };
}

interface Category { id: string; name: string; nameTE?: string; icon?: string; }

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
    categoriesApi.list().then((r) => setCategories(r.data || [])).catch(() => {});
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
    const colors: Record<string, string> = {
      FIXED: 'bg-emerald-100 text-emerald-700',
      BID: 'bg-amber-100 text-amber-700',
      HYBRID: 'bg-blue-100 text-blue-700',
    };
    return colors[type] || 'bg-slate-100 text-slate-600';
  };

  // Client-side filtering & sorting
  const getEffectivePrice = (p: Product) => p.fixedPrice || p.minBidPrice || 0;

  const displayProducts = (() => {
    let filtered = [...products];

    // Organic filter
    if (organicOnly) {
      filtered = filtered.filter((p) => p.organic === true);
    }

    // Price range filter
    if (minPrice !== '') {
      const min = parseFloat(minPrice);
      if (!isNaN(min)) filtered = filtered.filter((p) => getEffectivePrice(p) >= min);
    }
    if (maxPrice !== '') {
      const max = parseFloat(maxPrice);
      if (!isNaN(max)) filtered = filtered.filter((p) => getEffectivePrice(p) <= max);
    }

    // Sorting
    if (sortBy === 'price_asc') {
      filtered.sort((a, b) => getEffectivePrice(a) - getEffectivePrice(b));
    } else if (sortBy === 'price_desc') {
      filtered.sort((a, b) => getEffectivePrice(b) - getEffectivePrice(a));
    } else if (sortBy === 'name_asc') {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    }
    // 'newest' keeps the default API order

    return filtered;
  })();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-700 via-primary-600 to-emerald-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h1 className="text-2xl sm:text-3xl font-bold mb-1">
            {t({ en: 'Fresh from the Farm', te: 'రైతు నుండి తాజాగా' })}
          </h1>
          <p className="text-primary-200 text-sm mb-5">
            {t({ en: 'Direct from verified AP/TS farmers — no middlemen', te: 'ధృవీకరించిన AP/TS రైతుల నుండి నేరుగా — మధ్యవర్తులు లేరు' })}
          </p>
          <form onSubmit={handleSearch} className="flex gap-2 max-w-xl">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t({ en: 'Search tomatoes, dal, mango...', te: 'టమాటా, పప్పు, మామిడి వెతకండి...' })}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
              />
            </div>
            <button type="submit" className="px-5 py-2.5 bg-white/20 backdrop-blur rounded-xl text-sm font-semibold hover:bg-white/30 transition-colors">
              {t({ en: 'Search', te: 'వెతకండి' })}
            </button>
            <div className="relative">
              <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/70 pointer-events-none" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="pl-9 pr-3 py-2.5 rounded-xl text-sm bg-white/20 text-white border-0 backdrop-blur hover:bg-white/30 transition-colors appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                <option value="newest" className="text-slate-900">{t({ en: 'Newest First', te: 'కొత్తవి ముందు' })}</option>
                <option value="price_asc" className="text-slate-900">{t({ en: 'Price: Low to High', te: 'ధర: తక్కువ నుండి ఎక్కువ' })}</option>
                <option value="price_desc" className="text-slate-900">{t({ en: 'Price: High to Low', te: 'ధర: ఎక్కువ నుండి తక్కువ' })}</option>
                <option value="name_asc" className="text-slate-900">{t({ en: 'Name A-Z', te: 'పేరు A-Z' })}</option>
              </select>
            </div>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="px-3 py-2.5 bg-white/20 backdrop-blur rounded-xl hover:bg-white/30 transition-colors md:hidden"
            >
              <Filter className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Category filters */}
        <div className={`flex flex-wrap gap-2 mb-6 ${showFilters ? '' : 'hidden md:flex'}`}>
          <button
            onClick={() => filterByCategory('')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              !selectedCat ? 'bg-primary-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:border-primary-300'
            }`}
          >
            {t({ en: 'All', te: 'అన్నీ' })}
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => filterByCategory(cat.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedCat === cat.id ? 'bg-primary-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:border-primary-300'
              }`}
            >
              {cat.icon} {lang === 'te' && cat.nameTE ? cat.nameTE : cat.name}
            </button>
          ))}
          {selectedCat && (
            <button onClick={() => filterByCategory('')} className="px-2 py-2 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Additional filters: Organic toggle + Price range */}
        <div className={`flex flex-wrap items-center gap-4 mb-6 ${showFilters ? '' : 'hidden md:flex'}`}>
          <button
            onClick={() => setOrganicOnly(!organicOnly)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              organicOnly ? 'bg-green-500 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:border-green-300'
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
              className="w-20 px-3 py-2 rounded-lg text-sm bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-300"
            />
            <span className="text-slate-400">–</span>
            <input
              type="number"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder={t({ en: 'Max', te: 'గరిష్ట' })}
              className="w-20 px-3 py-2 rounded-lg text-sm bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-300"
            />
          </div>
        </div>

        {/* Results bar */}
        {!loading && (
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
              <span className="font-medium">
                {t({ en: `Showing ${displayProducts.length} products`, te: `${displayProducts.length} ఉత్పత్తులు చూపుతోంది` })}
              </span>
              {selectedCat && (
                <span className="bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full text-xs font-medium">
                  {categories.find((c) => c.id === selectedCat)
                    ? (lang === 'te' && categories.find((c) => c.id === selectedCat)?.nameTE
                      ? categories.find((c) => c.id === selectedCat)!.nameTE
                      : categories.find((c) => c.id === selectedCat)!.name)
                    : ''}
                </span>
              )}
              {organicOnly && (
                <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1">
                  <Leaf className="w-3 h-3" /> {t({ en: 'Organic', te: 'సేంద్రీయ' })}
                </span>
              )}
              {(minPrice || maxPrice) && (
                <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs font-medium">
                  {t({ en: 'Price', te: 'ధర' })}: {minPrice ? `₹${minPrice}` : '...'} – {maxPrice ? `₹${maxPrice}` : '...'}
                </span>
              )}
            </div>
            {(selectedCat || organicOnly || minPrice || maxPrice) && (
              <button
                onClick={() => {
                  setSelectedCat('');
                  setOrganicOnly(false);
                  setMinPrice('');
                  setMaxPrice('');
                  loadProducts(search, '');
                }}
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
              <div key={i} className="bg-white rounded-2xl h-72 animate-pulse border border-slate-100" />
            ))}
          </div>
        ) : displayProducts.length === 0 ? (
          <div className="text-center py-20 animate-fade-in">
            <div className="text-6xl mb-4">🌾</div>
            <p className="text-lg font-medium text-slate-500">{t({ en: 'No products found', te: 'ఉత్పత్తులు కనుగొనబడలేదు' })}</p>
            <p className="text-sm text-slate-400 mt-1">{t({ en: 'Try different search terms or filters', te: 'వేరే శోధన పదాలు లేదా ఫిల్టర్లు ప్రయత్నించండి' })}</p>
          </div>
        ) : (
          <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {displayProducts.map((p) => (
              <div key={p.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden card-hover group animate-fade-in">
                <div className="relative h-44 bg-slate-100 overflow-hidden">
                  <Link href={`/buyer/browse/${p.id}`}>
                    {p.imageUrls?.[0] ? (
                      <>
                        <div className="flex items-center justify-center h-full text-5xl">🥬</div>
                        <Image
                          src={p.imageUrls[0]}
                          alt={p.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          unoptimized
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-full text-5xl">🥬</div>
                    )}
                  </Link>
                  <div className="absolute top-2 left-2 flex gap-1.5">
                    {p.organic && (
                      <span className="flex items-center gap-1 bg-green-500 text-white text-[10px] px-2 py-0.5 rounded-full font-medium">
                        <Leaf className="w-3 h-3" /> {t({ en: 'Organic', te: 'సేంద్రీయ' })}
                      </span>
                    )}
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${priceTypeBadge(p.priceType)}`}>
                      {p.priceType}
                    </span>
                  </div>
                  <button
                    onClick={() => toggleWishlist(p.id)}
                    className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 backdrop-blur hover:bg-white shadow-sm transition-colors z-10"
                    title={wishlist.has(p.id) ? t({ en: 'Remove from wishlist', te: 'విష్‌లిస్ట్ నుండి తొలగించు' }) : t({ en: 'Add to wishlist', te: 'విష్‌లిస్ట్‌కు జోడించు' })}
                  >
                    <Heart className={`w-4 h-4 transition-colors ${wishlist.has(p.id) ? 'text-rose-500 fill-rose-500' : 'text-slate-400'}`} />
                  </button>
                </div>
                <div className="p-3.5">
                  <Link href={`/buyer/browse/${p.id}`}>
                    <h3 className="font-semibold text-slate-800 text-sm truncate hover:text-primary-700 transition-colors">
                      {lang === 'te' && p.titleTE ? p.titleTE : p.title}
                    </h3>
                  </Link>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {p.farmer?.name} · {p.district}
                  </p>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-primary-700 font-bold text-base">{price(p)}</span>
                    <span className="text-[10px] text-slate-400">/{p.unit}</span>
                  </div>
                  {p.grade && (
                    <p className="text-[10px] text-slate-400 mt-1">{t({ en: 'Grade', te: 'గ్రేడ్' })}: {p.grade} · {p.availableQty} {p.unit}</p>
                  )}
                  <div className="flex gap-2 mt-3">
                    <Link
                      href={`/buyer/browse/${p.id}`}
                      className="flex-1 flex items-center justify-center gap-1 text-xs py-2 rounded-lg border border-slate-200 text-slate-600 hover:border-primary-300 hover:text-primary-600 transition-colors"
                    >
                      <Eye className="w-3 h-3" /> {t({ en: 'View', te: 'చూడండి' })}
                    </Link>
                    <button
                      onClick={() => addToCart(p)}
                      disabled={addingId === p.id}
                      className="flex-1 flex items-center justify-center gap-1 text-xs py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 transition-colors"
                    >
                      <ShoppingCart className="w-3 h-3" />
                      {addingId === p.id ? '...' : t({ en: 'Add', te: 'జోడించు' })}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {hasMore && (
            <div className="flex justify-center mt-8">
              <button
                onClick={() => loadProducts(search, selectedCat, page + 1, true)}
                disabled={loadingMore}
                className="px-8 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:border-primary-300 hover:text-primary-700 disabled:opacity-50 transition-all shadow-sm"
              >
                {loadingMore
                  ? t({ en: 'Loading...', te: 'లోడ్ అవుతోంది...' })
                  : t({ en: 'Load More', te: 'మరిన్ని చూడండి' })}
              </button>
            </div>
          )}
          </>
        )}
      </div>
    </div>
  );
}
