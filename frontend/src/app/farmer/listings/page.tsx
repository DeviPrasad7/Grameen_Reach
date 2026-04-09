'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { productsApi } from '@/lib/api';
import { useAuthStore, useLangStore } from '@/lib/store';
import toast from 'react-hot-toast';
import {
  Loader2, Plus, Pause, Play, Trash2, Leaf, Package,
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
  category: { name: string; nameTE?: string };
  createdAt: string;
}

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: 'bg-primary-100 text-primary-700',
  DRAFT: 'bg-slate-100 text-slate-600',
  SOLD_OUT: 'bg-red-100 text-red-600',
  PAUSED: 'bg-amber-100 text-amber-700',
  REMOVED: 'bg-red-100 text-red-700',
};

const STATUS_TE: Record<string, string> = {
  ACTIVE: 'యాక్టివ్',
  DRAFT: 'డ్రాఫ్ట్',
  SOLD_OUT: 'అయిపోయింది',
  PAUSED: 'ఆపబడింది',
  REMOVED: 'తొలగించబడింది',
};

export default function FarmerListingsPage() {
  const router = useRouter();
  const { user, _hasHydrated } = useAuthStore();
  const { lang, t } = useLangStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!user) { router.push('/auth/login'); return; }
    if (user.role !== 'FARMER') { router.push('/'); return; }
    loadProducts();
  }, [_hasHydrated, user, router]);

  const loadProducts = () => {
    if (!user) return;
    productsApi.list({ farmerId: user.id })
      .then((r) => setProducts(r.data?.items || r.data || []))
      .catch(() => toast.error(t({ en: 'Failed to load listings', te: 'జాబితాలు లోడ్ చేయడం విఫలమైంది' })))
      .finally(() => setLoading(false));
  };

  const toggleStatus = async (product: Product) => {
    const newStatus = product.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    setActionId(product.id);
    try {
      await productsApi.update(product.id, { status: newStatus });
      toast.success(
        newStatus === 'ACTIVE'
          ? t({ en: 'Listing activated', te: 'జాబితా యాక్టివేట్ చేయబడింది' })
          : t({ en: 'Listing paused', te: 'జాబితా ఆపబడింది' }),
      );
      loadProducts();
    } catch {
      toast.error(t({ en: 'Failed to update status', te: 'స్థితి అప్‌డేట్ విఫలమైంది' }));
    } finally {
      setActionId(null);
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm(t({ en: 'Remove this listing? This action cannot be undone.', te: 'ఈ జాబితాను తొలగించాలా? ఈ చర్యను రద్దు చేయలేరు.' }))) return;
    setActionId(id);
    try {
      await productsApi.delete(id);
      toast.success(t({ en: 'Listing removed', te: 'జాబితా తొలగించబడింది' }));
      loadProducts();
    } catch {
      toast.error(t({ en: 'Failed to remove listing', te: 'జాబితా తొలగించడం విఫలమైంది' }));
    } finally {
      setActionId(null);
    }
  };

  const formatPrice = (p: Product) => {
    if (p.priceType === 'FIXED') return `₹${p.fixedPrice}`;
    if (p.priceType === 'BID') return `${t({ en: 'Bid from', te: 'బిడ్' })} ₹${p.minBidPrice}`;
    return `₹${p.fixedPrice} / ${t({ en: 'Bid', te: 'బిడ్' })} ₹${p.minBidPrice}+`;
  };

  const priceTypeBadge = (type: string) => {
    const map: Record<string, string> = {
      FIXED: 'bg-emerald-100 text-emerald-700',
      BID: 'bg-amber-100 text-amber-700',
      HYBRID: 'bg-blue-100 text-blue-700',
    };
    return map[type] || 'bg-slate-100 text-slate-600';
  };

  // ── Pre-hydration spinner ──────────────────────────────────────────
  if (!_hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-700 via-primary-600 to-emerald-600 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center justify-between animate-fade-in">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">
                {t({ en: 'My Listings', te: 'నా జాబితాలు' })}
              </h1>
              <p className="text-primary-200 text-sm mt-1">
                {t({ en: 'Manage your products and inventory', te: 'మీ ఉత్పత్తులు మరియు నిల్వలను నిర్వహించండి' })}
              </p>
            </div>
            <Link
              href="/farmer/listings/new"
              className="flex items-center gap-2 px-5 py-2.5 bg-white/20 backdrop-blur rounded-xl text-sm font-semibold hover:bg-white/30 transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t({ en: 'New Listing', te: 'కొత్త జాబితా' })}
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
            <p className="text-sm text-slate-400">{t({ en: 'Loading listings...', te: 'జాబితాలు లోడ్ అవుతోంది...' })}</p>
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center animate-fade-in">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary-50 flex items-center justify-center">
              <Plus className="w-8 h-8 text-primary-400" />
            </div>
            <p className="text-slate-500 mb-2 font-medium">
              {t({ en: 'No listings yet', te: 'ఇంకా జాబితాలు లేవు' })}
            </p>
            <p className="text-sm text-slate-400 mb-5">
              {t({ en: 'Start selling by creating your first product listing', te: 'మీ మొదటి ఉత్పత్తి జాబితాను సృష్టించి అమ్మకం ప్రారంభించండి' })}
            </p>
            <Link
              href="/farmer/listings/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t({ en: 'Create your first listing', te: 'మీ మొదటి జాబితాను సృష్టించండి' })}
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {products.map((p, idx) => {
              const statusLabel = lang === 'te' ? STATUS_TE[p.status] || p.status : p.status;
              const isActioning = actionId === p.id;
              return (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-4 card-hover animate-slide-up"
                  style={{ animationDelay: `${idx * 50}ms`, animationFillMode: 'backwards' }}
                >
                  {/* Image / Emoji */}
                  <div className="w-16 h-16 bg-slate-100 rounded-xl flex-shrink-0 relative overflow-hidden">
                    {p.imageUrls?.[0] ? (
                      <Image
                        src={p.imageUrls[0]}
                        alt={p.title}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Package className="w-6 h-6 text-slate-300" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold text-slate-800 text-sm truncate">
                        {lang === 'te' && p.titleTE ? p.titleTE : p.title}
                      </h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[p.status] || 'bg-slate-100'}`}>
                        {statusLabel}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${priceTypeBadge(p.priceType)}`}>
                        {p.priceType}
                      </span>
                      {p.organic && (
                        <span className="flex items-center gap-0.5 text-[10px] px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 font-medium">
                          <Leaf className="w-3 h-3" />
                          {t({ en: 'Organic', te: 'సేంద్రీయ' })}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">
                      {lang === 'te' && p.category?.nameTE ? p.category.nameTE : p.category?.name}
                      {' · '}
                      {p.availableQty} {p.unit} {t({ en: 'available', te: 'అందుబాటులో' })}
                    </p>
                    <p className="text-primary-700 font-semibold text-sm mt-1">
                      {formatPrice(p)}
                      <span className="text-xs font-normal text-slate-400">/{p.unit}</span>
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => toggleStatus(p)}
                      disabled={isActioning}
                      className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border font-medium transition-colors disabled:opacity-50 ${
                        p.status === 'ACTIVE'
                          ? 'border-amber-200 text-amber-700 hover:bg-amber-50'
                          : 'border-primary-200 text-primary-700 hover:bg-primary-50'
                      }`}
                    >
                      {isActioning ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : p.status === 'ACTIVE' ? (
                        <Pause className="w-3.5 h-3.5" />
                      ) : (
                        <Play className="w-3.5 h-3.5" />
                      )}
                      {p.status === 'ACTIVE' ? t({ en: 'Pause', te: 'ఆపు' }) : t({ en: 'Activate', te: 'యాక్టివేట్' })}
                    </button>
                    <button
                      onClick={() => deleteProduct(p.id)}
                      disabled={isActioning}
                      className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 font-medium transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {t({ en: 'Remove', te: 'తొలగించు' })}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
