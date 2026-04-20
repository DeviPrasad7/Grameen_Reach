'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { productsApi } from '@/lib/api';
import { useAuthStore, useLangStore } from '@/lib/store';
import toast from 'react-hot-toast';
import {
  Loader2, Package, Search, Trash2, ImageOff,
} from 'lucide-react';

interface Product {
  id: string;
  title: string;
  titleTE?: string;
  fixedPrice?: number;
  minBidPrice?: number;
  priceType: string;
  unit: string;
  availableQty: number;
  status: string;
  organic: boolean;
  grade?: string;
  imageUrls: string[];
  district?: string;
  farmer: { name: string };
  category: { name: string; nameTE?: string };
  createdAt: string;
}

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  DRAFT: 'bg-slate-100 text-slate-600',
  SOLD_OUT: 'bg-red-100 text-red-600',
  PAUSED: 'bg-amber-100 text-amber-700',
  REMOVED: 'bg-red-100 text-red-700',
};

export default function AdminProductsPage() {
  const router = useRouter();
  const { user, _hasHydrated } = useAuthStore();
  const { lang, t } = useLangStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!user) { router.push('/auth/login'); return; }
    if (user.role !== 'ADMIN') { router.push('/'); return; }
    load();
  }, [_hasHydrated, user, router]);

  const load = (q?: string) => {
    productsApi.list(q ? { search: q } : undefined)
      .then((r) => setProducts(r.data?.items || r.data || []))
      .catch(() => toast.error(t({ en: 'Failed to load products', te: 'ఉత్పత్తులను లోడ్ చేయడం విఫలమైంది' })))
      .finally(() => setLoading(false));
  };

  const removeProduct = async (id: string) => {
    if (!confirm(t({ en: 'Remove this product listing?', te: 'ఈ ఉత్పత్తి జాబితాను తొలగించాలా?' }))) return;
    try {
      await productsApi.delete(id);
      toast.success(t({ en: 'Product removed', te: 'ఉత్పత్తి తొలగించబడింది' }));
      load();
    } catch {
      toast.error(t({ en: 'Failed to remove', te: 'తొలగించడం విఫలమైంది' }));
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    load(search);
  };

  const price = (p: Product) => {
    if (p.priceType === 'FIXED') return `₹${p.fixedPrice}`;
    if (p.priceType === 'BID') return `${t({ en: 'Bid', te: 'బిడ్' })} ₹${p.minBidPrice}+`;
    return `₹${p.fixedPrice} / ${t({ en: 'Bid', te: 'బిడ్' })} ₹${p.minBidPrice}+`;
  };

  // ── Pre-hydration spinner ──────────────────────────────────────────
  if (!_hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
      </div>
    );
  }

  // ── Data loading spinner ───────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
        <p className="text-sm text-slate-400">
          {t({ en: 'Loading products...', te: 'ఉత్పత్తులు లోడ్ అవుతోంది...' })}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero header */}
      <div className="bg-gradient-to-r from-primary-700 via-primary-600 to-emerald-600 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
            <div className="flex items-center gap-3">
              <Package className="w-7 h-7" />
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">
                  {t({ en: 'All Products', te: 'అన్ని ఉత్పత్తులు' })}
                </h1>
                <p className="text-primary-200 text-sm mt-1">
                  {products.length} {t({ en: 'total listings', te: 'మొత్తం జాబితాలు' })}
                </p>
              </div>
            </div>
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t({ en: 'Search products...', te: 'ఉత్పత్తులు వెతకండి...' })}
                  className="pl-9 pr-4 py-2.5 bg-white/20 backdrop-blur border border-white/20 rounded-xl text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/40 w-56"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 bg-white/20 backdrop-blur rounded-xl text-sm font-semibold hover:bg-white/30 transition-colors"
              >
                {t({ en: 'Search', te: 'వెతకండి' })}
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {products.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 animate-fade-in">
            <Package className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <p className="text-lg font-medium text-slate-500">
              {t({ en: 'No products found', te: 'ఉత్పత్తులు కనుగొనబడలేదు' })}
            </p>
            <p className="text-sm text-slate-400 mt-1">
              {t({ en: 'Try a different search term', te: 'వేరే శోధన పదం ప్రయత్నించండి' })}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden animate-slide-up">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    {[
                      '',
                      t({ en: 'Product', te: 'ఉత్పత్తి' }),
                      t({ en: 'Farmer', te: 'రైతు' }),
                      t({ en: 'Category', te: 'వర్గం' }),
                      t({ en: 'Price', te: 'ధర' }),
                      t({ en: 'Qty', te: 'పరిమాణం' }),
                      t({ en: 'Status', te: 'స్థితి' }),
                      t({ en: 'Actions', te: 'చర్యలు' }),
                    ].map((h, i) => (
                      <th
                        key={`${h}-${i}`}
                        className="px-4 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden relative flex-shrink-0">
                          {p.imageUrls?.[0] ? (
                            <Image src={p.imageUrls[0]} alt="" fill sizes="40px" className="object-cover" />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <ImageOff className="w-4 h-4 text-slate-300" />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800">
                          {lang === 'te' && p.titleTE ? p.titleTE : p.title}
                        </p>
                        <p className="text-xs text-slate-400">{p.district}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{p.farmer?.name}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {lang === 'te' && p.category?.nameTE ? p.category.nameTE : p.category?.name}
                      </td>
                      <td className="px-4 py-3 text-primary-700 font-semibold whitespace-nowrap">
                        {price(p)}/{p.unit}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{p.availableQty}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLOR[p.status] || 'bg-slate-100 text-slate-600'}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => removeProduct(p.id)}
                          className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          {t({ en: 'Remove', te: 'తొలగించు' })}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
