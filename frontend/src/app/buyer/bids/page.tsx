'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { bidsApi } from '@/lib/api';
import { useAuthStore, useLangStore } from '@/lib/store';
import toast from 'react-hot-toast';
import {
  Loader2, Gavel, ArrowRightLeft, ExternalLink, Calendar, User,
} from 'lucide-react';

interface Bid {
  id: string;
  productId: string;
  amount: number;
  message?: string;
  status: string; // PENDING | ACCEPTED | REJECTED | COUNTERED | EXPIRED
  counterAmount?: number;
  counterMessage?: string;
  createdAt: string;
  product: {
    id: string;
    title: string;
    titleTE?: string;
    unit: string;
    imageUrls: string[];
    farmer: { name: string };
  };
}

type TabKey = 'ALL' | 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COUNTERED';

const STATUS_COLOR: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  ACCEPTED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  COUNTERED: 'bg-blue-100 text-blue-700',
  EXPIRED: 'bg-slate-100 text-slate-600',
};

const STATUS_TE: Record<string, string> = {
  PENDING: 'పెండింగ్',
  ACCEPTED: 'ఆమోదించబడింది',
  REJECTED: 'తిరస్కరించబడింది',
  COUNTERED: 'కౌంటర్ పంపబడింది',
  EXPIRED: 'గడువు ముగిసింది',
};

export default function MyBidsPage() {
  const router = useRouter();
  const { user, _hasHydrated } = useAuthStore();
  const { lang, t } = useLangStore();
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('ALL');

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!user) { router.push('/auth/login'); return; }
    loadBids();
  }, [_hasHydrated, user, router]);

  const loadBids = () => {
    bidsApi.myBids()
      .then((r) => setBids(r.data || []))
      .catch(() => toast.error(t({ en: 'Failed to load bids', te: 'బిడ్లు లోడ్ చేయడం విఫలమైంది' })))
      .finally(() => setLoading(false));
  };

  const tabs: { key: TabKey; label: { en: string; te: string } }[] = [
    { key: 'ALL', label: { en: 'All', te: 'అన్నీ' } },
    { key: 'PENDING', label: { en: 'Pending', te: 'పెండింగ్' } },
    { key: 'ACCEPTED', label: { en: 'Accepted', te: 'ఆమోదించబడినవి' } },
    { key: 'REJECTED', label: { en: 'Rejected', te: 'తిరస్కరించబడినవి' } },
    { key: 'COUNTERED', label: { en: 'Countered', te: 'కౌంటర్ పంపబడినవి' } },
  ];

  const filtered = activeTab === 'ALL' ? bids : bids.filter((b) => b.status === activeTab);

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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <div className="animate-fade-in">
            <h1 className="text-2xl sm:text-3xl font-bold">
              {t({ en: 'My Bids', te: 'నా బిడ్లు' })}
            </h1>
            <p className="text-primary-200 text-sm mt-1">
              {t({ en: 'Track and manage your placed bids', te: 'మీరు పెట్టిన బిడ్లను ట్రాక్ చేయండి' })}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {/* Tab filters */}
        <div className="flex flex-wrap gap-2 mb-6 animate-fade-in">
          {tabs.map((tab) => {
            const count = tab.key === 'ALL' ? bids.length : bids.filter((b) => b.status === tab.key).length;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.key
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-primary-300'
                }`}
              >
                {t(tab.label)}
                {count > 0 && (
                  <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                    activeTab === tab.key ? 'bg-white/20' : 'bg-slate-100'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content */}
        {loading ? (
          /* Loading skeleton */
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-20 h-20 rounded-xl bg-slate-100 flex-shrink-0" />
                  <div className="flex-1 space-y-3">
                    <div className="h-4 bg-slate-100 rounded w-2/3" />
                    <div className="h-3 bg-slate-100 rounded w-1/3" />
                    <div className="h-3 bg-slate-100 rounded w-1/2" />
                  </div>
                  <div className="w-20 space-y-2">
                    <div className="h-5 bg-slate-100 rounded" />
                    <div className="h-4 bg-slate-100 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          /* Empty state */
          <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center animate-fade-in">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-50 flex items-center justify-center">
              <Gavel className="w-8 h-8 text-amber-400" />
            </div>
            <p className="text-slate-500 mb-2 font-medium">
              {activeTab === 'ALL'
                ? t({ en: 'No bids placed yet', te: 'ఇంకా బిడ్లు పెట్టలేదు' })
                : t({ en: 'No bids in this category', te: 'ఈ విభాగంలో బిడ్లు లేవు' })}
            </p>
            <p className="text-sm text-slate-400">
              {t({ en: 'Browse products and place bids to see them here', te: 'ఉత్పత్తులను చూసి బిడ్లు పెట్టండి' })}
            </p>
          </div>
        ) : (
          /* Bid cards */
          <div className="space-y-4">
            {filtered.map((bid, idx) => {
              const productTitle = lang === 'te' && bid.product?.titleTE ? bid.product.titleTE : bid.product?.title;
              const statusLabel = lang === 'te' ? STATUS_TE[bid.status] || bid.status : bid.status;
              return (
                <div
                  key={bid.id}
                  className="bg-white rounded-2xl border border-slate-100 overflow-hidden animate-slide-up"
                  style={{ animationDelay: `${idx * 50}ms`, animationFillMode: 'backwards' }}
                >
                  <div className="p-5">
                    <div className="flex gap-4">
                      {/* Product image */}
                      <Link
                        href={`/buyer/browse/${bid.productId}`}
                        className="relative w-20 h-20 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0"
                      >
                        {bid.product?.imageUrls?.[0] ? (
                          <Image
                            src={bid.product.imageUrls[0]}
                            alt={bid.product.title}
                            fill
                            sizes="80px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-3xl">🥬</div>
                        )}
                      </Link>

                      {/* Bid details */}
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/buyer/browse/${bid.productId}`}
                          className="font-semibold text-slate-800 hover:text-primary-700 transition-colors line-clamp-1"
                        >
                          {productTitle}
                        </Link>
                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {bid.product?.farmer?.name}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(bid.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {bid.message && (
                          <p className="text-sm text-slate-500 mt-1.5 italic line-clamp-1">
                            &quot;{bid.message}&quot;
                          </p>
                        )}
                      </div>

                      {/* Amount & status */}
                      <div className="text-right flex-shrink-0">
                        <p className="text-xl font-bold text-primary-700">
                          ₹{bid.amount}
                          <span className="text-xs font-normal text-slate-400">/{bid.product?.unit}</span>
                        </p>
                        <span className={`inline-block mt-1 text-[10px] px-2.5 py-0.5 rounded-full font-medium ${STATUS_COLOR[bid.status] || 'bg-slate-100 text-slate-600'}`}>
                          {statusLabel}
                        </span>
                      </div>
                    </div>

                    {/* Counter offer section */}
                    {bid.status === 'COUNTERED' && (bid.counterAmount || bid.counterMessage) && (
                      <div className="mt-4 pt-3 border-t border-slate-100">
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3.5 animate-fade-in">
                          <div className="flex items-center gap-1.5 mb-2">
                            <ArrowRightLeft className="w-3.5 h-3.5 text-blue-500" />
                            <span className="text-xs font-semibold text-blue-600">
                              {t({ en: 'Counter Offer', te: 'కౌంటర్ ఆఫర్' })}
                            </span>
                          </div>
                          {bid.counterAmount && (
                            <p className="text-sm font-bold text-blue-700">
                              ₹{bid.counterAmount}
                              <span className="text-xs font-normal text-blue-400">/{bid.product?.unit}</span>
                            </p>
                          )}
                          {bid.counterMessage && (
                            <p className="text-xs text-blue-600 mt-1">{bid.counterMessage}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* View product link */}
                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <Link
                        href={`/buyer/browse/${bid.productId}`}
                        className="flex items-center gap-1.5 text-xs text-primary-600 font-medium hover:text-primary-700 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        {t({ en: 'View Product', te: 'ఉత్పత్తిని చూడండి' })}
                      </Link>
                    </div>
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
