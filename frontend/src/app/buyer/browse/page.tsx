'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { productsApi, cartApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

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
  grade?: string;
  organic: boolean;
  imageUrls: string[];
  district?: string;
  farmer: { name: string };
  category: { name: string };
}

export default function BrowsePage() {
  const { user } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [lang, setLang] = useState<'en' | 'te'>('en');
  const [addingId, setAddingId] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  const loadProducts = async (q?: string) => {
    setLoading(true);
    try {
      const res = await productsApi.list(q ? { search: q } : undefined);
      setProducts(res.data);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProducts(); }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadProducts(search);
  };

  const addToCart = async (productId: string) => {
    if (!user) { window.location.href = '/auth/login'; return; }
    setAddingId(productId);
    try {
      await cartApi.addItem(productId, 1);
      setToast('Added to cart!');
      setTimeout(() => setToast(''), 2000);
    } catch {
      setToast('Failed to add to cart');
      setTimeout(() => setToast(''), 2000);
    } finally {
      setAddingId(null);
    }
  };

  const price = (p: Product) => {
    if (p.priceType === 'FIXED') return `₹${p.fixedPrice}`;
    if (p.priceType === 'BID') return `Bid from ₹${p.minBidPrice}`;
    return `₹${p.fixedPrice} / Bid ₹${p.minBidPrice}+`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-primary-700 text-white py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold mb-1">
            {lang === 'te' ? 'తాజా ఉత్పత్తులు' : 'Fresh Produce'}
          </h1>
          <p className="text-primary-200 text-sm">
            {lang === 'te' ? 'నేరుగా రైతు నుండి' : 'Direct from verified AP/TS farmers'}
          </p>
          <form onSubmit={handleSearch} className="mt-4 flex gap-2 max-w-lg">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={lang === 'te' ? 'వెతకండి...' : 'Search tomatoes, dal, mango...'}
              className="flex-1 px-4 py-2 rounded-lg text-gray-900 text-sm focus:outline-none"
            />
            <button type="submit" className="px-4 py-2 bg-saffron-500 rounded-lg text-sm font-semibold hover:bg-saffron-600">
              🔍
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl h-64 animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-3">🌾</div>
            <p>No products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((p) => (
              <div key={p.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="relative h-40 bg-gray-100">
                  {p.imageUrls?.[0] ? (
                    <Image
                      src={p.imageUrls[0]}
                      alt={p.title}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-4xl">🥬</div>
                  )}
                  {p.organic && (
                    <span className="absolute top-2 left-2 bg-primary-500 text-white text-xs px-2 py-0.5 rounded-full">
                      Organic
                    </span>
                  )}
                  <span className="absolute top-2 right-2 bg-white text-gray-700 text-xs px-2 py-0.5 rounded-full border">
                    {p.priceType}
                  </span>
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-gray-900 text-sm truncate">
                    {lang === 'te' && p.titleTE ? p.titleTE : p.title}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {p.farmer?.name} · {p.district}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-primary-700 font-bold text-sm">
                      {price(p)}<span className="text-xs font-normal text-gray-400">/{p.unit}</span>
                    </span>
                  </div>
                  {p.grade && (
                    <span className="text-xs text-gray-400">Grade: {p.grade}</span>
                  )}
                  <div className="flex gap-2 mt-3">
                    <Link
                      href={`/buyer/browse/${p.id}`}
                      className="flex-1 text-center text-xs py-1.5 rounded-lg border border-primary-300 text-primary-600 hover:bg-primary-50"
                    >
                      View
                    </Link>
                    <button
                      onClick={() => addToCart(p.id)}
                      disabled={addingId === p.id}
                      className="flex-1 text-xs py-1.5 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50"
                    >
                      {addingId === p.id ? '...' : '+ Cart'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {toast && (
        <div className="fixed bottom-4 right-4 bg-primary-700 text-white px-4 py-2 rounded-lg shadow-lg text-sm">
          {toast}
        </div>
      )}
    </div>
  );
}
