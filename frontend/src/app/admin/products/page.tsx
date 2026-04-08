'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { productsApi } from '@/lib/api';
import { useAuthStore, useLangStore } from '@/lib/store';

interface Product {
  id: string; title: string; titleTE?: string; fixedPrice?: number; minBidPrice?: number;
  priceType: string; unit: string; availableQty: number; status: string; organic: boolean;
  grade?: string; imageUrls: string[]; district?: string;
  farmer: { name: string }; category: { name: string; nameTE?: string }; createdAt: string;
}

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700', DRAFT: 'bg-gray-100 text-gray-600',
  SOLD_OUT: 'bg-red-100 text-red-600', PAUSED: 'bg-yellow-100 text-yellow-700', REMOVED: 'bg-red-100 text-red-700',
};

export default function AdminProductsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { lang, t } = useLangStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }
    if (user.role !== 'ADMIN') { router.push('/'); return; }
    load();
  }, [user]);

  const load = (q?: string) => {
    productsApi.list(q ? { search: q } : undefined)
      .then((r) => setProducts(r.data?.items || r.data || []))
      .finally(() => setLoading(false));
  };

  const removeProduct = async (id: string) => {
    if (!confirm(t({ en: 'Remove this product listing?', te: 'ఈ ఉత్పత్తి జాబితాను తొలగించాలా?' }))) return;
    try { await productsApi.delete(id); setToast(t({ en: 'Product removed', te: 'ఉత్పత్తి తొలగించబడింది' })); load(); }
    catch { setToast(t({ en: 'Failed to remove', te: 'తొలగించడం విఫలమైంది' })); }
    setTimeout(() => setToast(''), 3000);
  };

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); load(search); };

  const price = (p: Product) => {
    if (p.priceType === 'FIXED') return `₹${p.fixedPrice}`;
    if (p.priceType === 'BID') return `${t({ en: 'Bid', te: 'బిడ్' })} ₹${p.minBidPrice}+`;
    return `₹${p.fixedPrice} / ${t({ en: 'Bid', te: 'బిడ్' })} ₹${p.minBidPrice}+`;
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">{t({ en: 'Loading...', te: 'లోడ్ అవుతోంది...' })}</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">{t({ en: 'All Products', te: 'అన్ని ఉత్పత్తులు' })}</h1>

        <form onSubmit={handleSearch} className="mb-4 flex gap-2 max-w-md">
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder={t({ en: 'Search products...', te: 'ఉత్పత్తులు వెతకండి...' })}
            className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
          <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700">
            {t({ en: 'Search', te: 'వెతకండి' })}
          </button>
        </form>

        {products.length === 0 ? (
          <div className="bg-white rounded-2xl border p-12 text-center text-gray-400">
            <div className="text-4xl mb-2">📦</div>
            <p>{t({ en: 'No products found', te: 'ఉత్పత్తులు కనుగొనబడలేదు' })}</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {[
                    '', t({ en: 'Product', te: 'ఉత్పత్తి' }), t({ en: 'Farmer', te: 'రైతు' }),
                    t({ en: 'Category', te: 'వర్గం' }), t({ en: 'Price', te: 'ధర' }),
                    t({ en: 'Qty', te: 'పరిమాణం' }), t({ en: 'Status', te: 'స్థితి' }),
                    t({ en: 'Actions', te: 'చర్యలు' }),
                  ].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden relative">
                        {p.imageUrls?.[0] ? <Image src={p.imageUrls[0]} alt="" fill className="object-cover" unoptimized /> : <div className="flex items-center justify-center h-full text-lg">🥬</div>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{lang === 'te' && p.titleTE ? p.titleTE : p.title}</p>
                      <p className="text-xs text-gray-400">{p.district}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{p.farmer?.name}</td>
                    <td className="px-4 py-3 text-gray-600">{lang === 'te' && p.category?.nameTE ? p.category.nameTE : p.category?.name}</td>
                    <td className="px-4 py-3 text-primary-700 font-semibold">{price(p)}/{p.unit}</td>
                    <td className="px-4 py-3 text-gray-600">{p.availableQty}</td>
                    <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLOR[p.status] || 'bg-gray-100'}`}>{p.status}</span></td>
                    <td className="px-4 py-3">
                      <button onClick={() => removeProduct(p.id)} className="text-xs text-red-500 hover:text-red-700 font-medium">
                        {t({ en: 'Remove', te: 'తొలగించు' })}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {toast && <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-lg shadow text-sm">{toast}</div>}
    </div>
  );
}
