'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { productsApi } from '@/lib/api';
import { useAuthStore, useLangStore } from '@/lib/store';

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
  ACTIVE: 'bg-green-100 text-green-700',
  DRAFT: 'bg-gray-100 text-gray-600',
  SOLD_OUT: 'bg-red-100 text-red-600',
  PAUSED: 'bg-yellow-100 text-yellow-700',
  REMOVED: 'bg-red-100 text-red-700',
};

const STATUS_TE: Record<string, string> = {
  ACTIVE: 'యాక్టివ్', DRAFT: 'డ్రాఫ్ట్', SOLD_OUT: 'అయిపోయింది', PAUSED: 'ఆపబడింది', REMOVED: 'తొలగించబడింది',
};

export default function FarmerListingsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { lang, t } = useLangStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }
    if (user.role !== 'FARMER') { router.push('/'); return; }
    load();
  }, [user]);

  const load = () => {
    if (!user) return;
    productsApi.list({ farmerId: user.id })
      .then((r) => setProducts(r.data?.items || r.data || []))
      .finally(() => setLoading(false));
  };

  const toggleStatus = async (product: Product) => {
    const newStatus = product.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    try {
      await productsApi.update(product.id, { status: newStatus });
      setToast(newStatus === 'ACTIVE'
        ? t({ en: 'Listing activated', te: 'జాబితా యాక్టివేట్ చేయబడింది' })
        : t({ en: 'Listing paused', te: 'జాబితా ఆపబడింది' }));
      load();
    } catch {
      setToast(t({ en: 'Failed to update', te: 'అప్‌డేట్ విఫలమైంది' }));
    }
    setTimeout(() => setToast(''), 3000);
  };

  const deleteProduct = async (id: string) => {
    if (!confirm(t({ en: 'Remove this listing?', te: 'ఈ జాబితాను తొలగించాలా?' }))) return;
    try {
      await productsApi.delete(id);
      setToast(t({ en: 'Listing removed', te: 'జాబితా తొలగించబడింది' }));
      load();
    } catch {
      setToast(t({ en: 'Failed to remove', te: 'తొలగించడం విఫలమైంది' }));
    }
    setTimeout(() => setToast(''), 3000);
  };

  const price = (p: Product) => {
    if (p.priceType === 'FIXED') return `₹${p.fixedPrice}`;
    if (p.priceType === 'BID') return `${t({ en: 'Bid from', te: 'బిడ్' })} ₹${p.minBidPrice}`;
    return `₹${p.fixedPrice} / ${t({ en: 'Bid', te: 'బిడ్' })} ₹${p.minBidPrice}+`;
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">{t({ en: 'Loading listings...', te: 'జాబితాలు లోడ్ అవుతోంది...' })}</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">{t({ en: 'My Listings', te: 'నా జాబితాలు' })}</h1>
          <Link href="/farmer/listings/new" className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700">
            {t({ en: '+ New Listing', te: '+ కొత్త జాబితా' })}
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="bg-white rounded-2xl border p-12 text-center">
            <div className="text-5xl mb-3">📦</div>
            <p className="text-gray-500 mb-4">{t({ en: 'No listings yet', te: 'ఇంకా జాబితాలు లేవు' })}</p>
            <Link href="/farmer/listings/new" className="text-primary-600 font-medium hover:underline">
              {t({ en: 'Create your first listing →', te: 'మీ మొదటి జాబితాను సృష్టించండి →' })}
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {products.map((p) => {
              const statusLabel = lang === 'te' ? STATUS_TE[p.status] || p.status : p.status;
              return (
                <div key={p.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4 hover:shadow-sm transition-shadow">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 relative overflow-hidden">
                    {p.imageUrls?.[0] ? (
                      <Image src={p.imageUrls[0]} alt={p.title} fill className="object-cover" unoptimized />
                    ) : (
                      <div className="flex items-center justify-center h-full text-2xl">🥬</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-800 text-sm truncate">
                        {lang === 'te' && p.titleTE ? p.titleTE : p.title}
                      </h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLOR[p.status] || 'bg-gray-100'}`}>{statusLabel}</span>
                      {p.organic && <span className="text-xs px-2 py-0.5 rounded-full bg-primary-100 text-primary-700">{t({ en: 'Organic', te: 'సేంద్రీయ' })}</span>}
                    </div>
                    <p className="text-xs text-gray-400">
                      {lang === 'te' && p.category?.nameTE ? p.category.nameTE : p.category?.name} &middot; {p.priceType} &middot; {p.availableQty} {p.unit} {t({ en: 'available', te: 'అందుబాటులో' })}
                    </p>
                    <p className="text-primary-700 font-semibold text-sm mt-1">{price(p)}<span className="text-xs font-normal text-gray-400">/{p.unit}</span></p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => toggleStatus(p)}
                      className={`text-xs px-3 py-1.5 rounded-lg border font-medium ${p.status === 'ACTIVE' ? 'border-yellow-300 text-yellow-700 hover:bg-yellow-50' : 'border-green-300 text-green-700 hover:bg-green-50'}`}>
                      {p.status === 'ACTIVE' ? t({ en: 'Pause', te: 'ఆపు' }) : t({ en: 'Activate', te: 'యాక్టివేట్' })}
                    </button>
                    <button onClick={() => deleteProduct(p.id)}
                      className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 font-medium">
                      {t({ en: 'Remove', te: 'తొలగించు' })}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {toast && <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-lg shadow text-sm">{toast}</div>}
    </div>
  );
}
