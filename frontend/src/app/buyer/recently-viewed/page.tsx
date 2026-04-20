'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { productsApi } from '@/lib/api';
import { useLangStore } from '@/lib/store';
import {
  Clock, ShoppingCart, Trash2, Loader2, Leaf, MapPin, Award, Package,
} from 'lucide-react';
import { getRecentlyViewedIds, removeRecentlyViewed, clearRecentlyViewed } from '@/lib/recently-viewed';

interface Product {
  id: string;
  title: string; titleTE?: string;
  fixedPrice?: number; minBidPrice?: number;
  priceType: string; unit: string; availableQty: number;
  grade?: string; organic: boolean; harvestDate?: string;
  imageUrls: string[]; district?: string;
  farmer: { name: string };
  category: { name: string; nameTE?: string };
}

export default function RecentlyViewedPage() {
  const { lang, t } = useLangStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    const storedIds = getRecentlyViewedIds();
    setIds(storedIds);
    if (storedIds.length === 0) {
      setLoading(false);
      return;
    }
    // Fetch all products and filter by IDs
    Promise.all(storedIds.map((id) => productsApi.get(id).catch(() => null)))
      .then((results) => {
        const valid = results.filter((r) => r?.data).map((r) => r!.data);
        setProducts(valid);
      })
      .finally(() => setLoading(false));
  }, []);

  const clearAll = () => {
    clearRecentlyViewed();
    setProducts([]);
    setIds([]);
  };

  const removeOne = (productId: string) => {
    removeRecentlyViewed(productId);
    setIds(ids.filter((id) => id !== productId));
    setProducts(products.filter((p) => p.id !== productId));
  };

  const daysSince = (dateStr: string) => {
    const d = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
    return d === 0 ? t({ en: 'Today', te: 'ఈరోజు' }) : `${d}d ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-primary-600 animate-spin mx-auto" />
          <p className="text-slate-500 mt-3 text-sm">{t({ en: 'Loading...', te: 'లోడ్ అవుతోంది...' })}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center shadow-sm">
              <Clock className="w-6 h-6 text-violet-700" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                {t({ en: 'Recently Viewed', te: 'ఇటీవల చూసిన' })}
              </h1>
              <p className="text-sm text-slate-500">
                {t({ en: `${products.length} products viewed recently`, te: `${products.length} ఉత్పత్తులు ఇటీవల చూశారు` })}
              </p>
            </div>
          </div>
          {products.length > 0 && (
            <button
              onClick={clearAll}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-red-200 text-red-600 text-sm hover:bg-red-50 transition-all active:scale-95"
            >
              <Trash2 className="w-4 h-4" />
              {t({ en: 'Clear All', te: 'అన్నీ తొలగించు' })}
            </button>
          )}
        </div>

        {products.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Clock className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-lg font-semibold text-slate-600 mb-2">
              {t({ en: 'No recently viewed products', te: 'ఇటీవల చూసిన ఉత్పత్తులు లేవు' })}
            </h3>
            <p className="text-sm text-slate-400 mb-6">
              {t({ en: 'Products you view will appear here', te: 'మీరు చూసే ఉత్పత్తులు ఇక్కడ కనిపిస్తాయి' })}
            </p>
            <Link
              href="/buyer/browse"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-emerald-600 text-white font-semibold shadow-md hover:shadow-lg transition-all active:scale-95"
            >
              <Package className="w-4 h-4" />
              {t({ en: 'Browse Products', te: 'ఉత్పత్తులు చూడండి' })}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {products.map((p, i) => (
              <div
                key={p.id}
                className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden animate-fade-in"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                {/* Image */}
                <Link href={`/buyer/browse/${p.id}`} className="block relative aspect-[4/3] overflow-hidden bg-slate-100">
                  {p.imageUrls?.[0] ? (
                    <Image
                      src={p.imageUrls[0]}
                      alt={p.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-12 h-12 text-slate-300" />
                    </div>
                  )}
                  {p.organic && (
                    <span className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 text-white text-[10px] font-bold shadow-sm">
                      <Leaf className="w-3 h-3" /> Organic
                    </span>
                  )}
                  {p.grade && (
                    <span className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-white/90 text-amber-700 text-[10px] font-bold backdrop-blur-sm">
                      <Award className="w-3 h-3" /> {p.grade}
                    </span>
                  )}
                  {/* Remove button */}
                  <button
                    onClick={(e) => { e.preventDefault(); removeOne(p.id); }}
                    className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                    title="Remove"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </Link>

                {/* Info */}
                <div className="p-4">
                  <Link href={`/buyer/browse/${p.id}`}>
                    <h3 className="font-semibold text-slate-800 text-sm group-hover:text-primary-700 transition-colors line-clamp-1">
                      {lang === 'te' && p.titleTE ? p.titleTE : p.title}
                    </h3>
                  </Link>
                  <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
                    <MapPin className="w-3 h-3" />
                    <span>{p.district || 'N/A'}</span>
                    <span className="text-slate-300">·</span>
                    <span>{p.farmer?.name}</span>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-lg font-bold text-primary-700">
                      ₹{(p.fixedPrice || p.minBidPrice || 0).toLocaleString()}<span className="text-xs font-normal text-slate-400">/{p.unit}</span>
                    </span>
                    <span className="text-xs text-slate-400">{p.category?.name}</span>
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
