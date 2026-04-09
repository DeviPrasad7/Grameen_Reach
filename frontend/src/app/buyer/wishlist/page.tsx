'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { productsApi, cartApi } from '@/lib/api';
import { useAuthStore, useLangStore, useWishlistStore, useCartCountStore } from '@/lib/store';
import toast from 'react-hot-toast';
import { Heart, ShoppingCart, Trash2, Eye, Leaf, ArrowLeft } from 'lucide-react';

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

export default function WishlistPage() {
  const { user, _hasHydrated } = useAuthStore();
  const { lang, t } = useLangStore();
  const wishlist = useWishlistStore();
  const { setCount } = useCartCountStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState<string | null>(null);

  useEffect(() => {
    if (!_hasHydrated) return;
    fetchWishlistProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_hasHydrated, wishlist.items]);

  const fetchWishlistProducts = async () => {
    if (wishlist.items.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const results = await Promise.allSettled(
        wishlist.items.map((id) => productsApi.get(id)),
      );

      const fetched: Product[] = [];
      const removedIds: string[] = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          fetched.push(result.value.data);
        } else {
          // Product was deleted or not found; remove from wishlist silently
          removedIds.push(wishlist.items[index]);
        }
      });

      // Clean up stale IDs
      removedIds.forEach((id) => wishlist.remove(id));
      setProducts(fetched);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = (id: string) => {
    wishlist.remove(id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
    toast.success(t({ en: 'Removed from wishlist', te: 'విష్‌లిస్ట్ నుండి తొలగించబడింది' }));
  };

  const clearAll = () => {
    wishlist.clear();
    setProducts([]);
    toast.success(t({ en: 'Wishlist cleared', te: 'విష్‌లిస్ట్ క్లియర్ చేయబడింది' }));
  };

  const addToCart = async (product: Product) => {
    if (!user) {
      window.location.href = '/auth/login';
      return;
    }
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

  if (!_hasHydrated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-rose-600 via-pink-600 to-primary-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <Link
                  href="/buyer/browse"
                  className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Link>
                <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                  <Heart className="w-7 h-7 fill-white" />
                  {t({ en: 'My Wishlist', te: 'నా విష్‌లిస్ట్' })}
                </h1>
              </div>
              <p className="text-rose-200 text-sm ml-11">
                {products.length > 0
                  ? t({
                      en: `${products.length} item${products.length !== 1 ? 's' : ''} saved`,
                      te: `${products.length} అంశాలు సేవ్ చేయబడ్డాయి`,
                    })
                  : t({ en: 'Save products you love', te: 'మీకు నచ్చిన ఉత్పత్తులను సేవ్ చేయండి' })}
              </p>
            </div>
            {products.length > 0 && (
              <button
                onClick={clearAll}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur rounded-xl text-sm font-semibold hover:bg-white/30 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                {t({ en: 'Clear All', te: 'అన్నీ తొలగించు' })}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Loading */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl h-72 animate-pulse border border-slate-100" />
            ))}
          </div>
        ) : products.length === 0 ? (
          /* Empty state */
          <div className="text-center py-20 animate-fade-in">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-rose-100 mb-5">
              <Heart className="w-10 h-10 text-rose-400" />
            </div>
            <p className="text-lg font-medium text-slate-500">
              {t({ en: 'Your wishlist is empty', te: 'మీ విష్‌లిస్ట్ ఖాళీగా ఉంది' })}
            </p>
            <p className="text-sm text-slate-400 mt-1 mb-6">
              {t({
                en: 'Browse products and tap the heart icon to save them here',
                te: 'ఉత్పత్తులను బ్రౌజ్ చేసి, వాటిని ఇక్కడ సేవ్ చేయడానికి హార్ట్ ఐకాన్ నొక్కండి',
              })}
            </p>
            <Link
              href="/buyer/browse"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors"
            >
              {t({ en: 'Browse Products', te: 'ఉత్పత్తులు బ్రౌజ్ చేయండి' })}
            </Link>
          </div>
        ) : (
          /* Products grid */
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-slate-100 overflow-hidden card-hover group animate-fade-in"
              >
                <Link href={`/buyer/browse/${p.id}`}>
                  <div className="relative h-44 bg-slate-100 overflow-hidden">
                    {p.imageUrls?.[0] ? (
                      <Image
                        src={p.imageUrls[0]}
                        alt={p.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        unoptimized
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-5xl">🥬</div>
                    )}
                    <div className="absolute top-2 left-2 flex gap-1.5">
                      {p.organic && (
                        <span className="flex items-center gap-1 bg-green-500 text-white text-[10px] px-2 py-0.5 rounded-full font-medium">
                          <Leaf className="w-3 h-3" /> {t({ en: 'Organic', te: 'సేంద్రీయ' })}
                        </span>
                      )}
                    </div>
                    <span
                      className={`absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded-full font-semibold ${priceTypeBadge(p.priceType)}`}
                    >
                      {p.priceType}
                    </span>
                  </div>
                </Link>

                {/* Remove from wishlist button */}
                <div className="relative">
                  <button
                    onClick={() => removeFromWishlist(p.id)}
                    className="absolute -top-5 right-3 w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-md border border-slate-100 hover:bg-rose-50 transition-colors z-10"
                    title={t({ en: 'Remove from wishlist', te: 'విష్‌లిస్ట్ నుండి తొలగించు' })}
                  >
                    <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                  </button>
                </div>

                <div className="p-3.5 pt-4">
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
                    <p className="text-[10px] text-slate-400 mt-1">
                      {t({ en: 'Grade', te: 'గ్రేడ్' })}: {p.grade} · {p.availableQty} {p.unit}
                    </p>
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
        )}
      </div>
    </div>
  );
}
