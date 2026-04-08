'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { productsApi, bidsApi, aiApi, govtPricesApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

export default function FarmerDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [products, setProducts] = useState<unknown[]>([]);
  const [bids, setBids] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiInput, setAiInput] = useState('');
  const [aiResult, setAiResult] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }
    if (user.role !== 'FARMER') { router.push('/buyer/browse'); return; }
    Promise.all([
      productsApi.list().then((r) => setProducts(r.data)).catch(() => {}),
      bidsApi.farmerBids().then((r) => setBids(r.data)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [user]);

  const runAiListing = async () => {
    if (!aiInput.trim()) return;
    setAiLoading(true);
    setAiResult('');
    try {
      const res = await aiApi.listingGenerator({ input: aiInput, language: 'te' });
      setAiResult(res.data.result || res.data.response || JSON.stringify(res.data));
    } catch (e: unknown) {
      setAiResult((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'AI unavailable. Set GEMINI_API_KEY or GROQ_API_KEY.');
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>;

  const stats = [
    { label: 'Active Listings', value: (products as { status: string }[]).filter((p) => p.status === 'ACTIVE').length, icon: '📦' },
    { label: 'Pending Bids', value: (bids as { status: string }[]).filter((b) => b.status === 'PENDING').length, icon: '🏷️' },
    { label: 'Total Products', value: products.length, icon: '🌾' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">👨‍🌾 Farmer Dashboard</h1>
            <p className="text-gray-500 text-sm">Welcome, {user?.name}</p>
          </div>
          <a href="/farmer/listings/new" className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700">
            + New Listing
          </a>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-5 text-center">
              <div className="text-3xl mb-1">{s.icon}</div>
              <div className="text-2xl font-bold text-primary-700">{s.value}</div>
              <div className="text-xs text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* AI Listing Generator */}
        <div className="bg-white rounded-2xl border border-primary-100 p-6">
          <h2 className="font-semibold text-gray-800 mb-1">🤖 AI Listing Generator</h2>
          <p className="text-xs text-gray-400 mb-3">Describe your produce in Telugu or English — AI will generate a full listing</p>
          <div className="flex gap-2">
            <input
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              placeholder="e.g. టమాటా 2 క్వింటాళ్లు, ఈరోజే కోత, కర్నూలు"
              className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
            <button onClick={runAiListing} disabled={aiLoading}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 disabled:opacity-50">
              {aiLoading ? '...' : 'Generate'}
            </button>
          </div>
          {aiResult && (
            <div className="mt-3 bg-primary-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap">
              {aiResult}
            </div>
          )}
        </div>

        {/* Recent bids */}
        {bids.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-800 mb-4">🏷️ Recent Bids</h2>
            <div className="space-y-2">
              {(bids as { id: string; amount: number; status: string; product: { title: string }; buyer: { name: string } }[]).slice(0, 5).map((bid) => (
                <div key={bid.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{bid.product?.title}</p>
                    <p className="text-xs text-gray-400">by {bid.buyer?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-primary-700 font-semibold text-sm">₹{bid.amount}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${bid.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                      {bid.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <a href="/farmer/bids" className="mt-3 block text-center text-xs text-primary-600 hover:underline">View all bids →</a>
          </div>
        )}

        {/* Quick links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { href: '/farmer/listings', label: 'My Listings', icon: '📦' },
            { href: '/farmer/bids', label: 'Manage Bids', icon: '🏷️' },
            { href: '/farmer/orders', label: 'Orders', icon: '📋' },
            { href: '/buyer/browse', label: 'Browse Market', icon: '🛒' },
          ].map((l) => (
            <a key={l.href} href={l.href}
              className="bg-white border border-gray-100 rounded-xl p-4 text-center hover:shadow-md transition-shadow">
              <div className="text-2xl mb-1">{l.icon}</div>
              <div className="text-xs font-medium text-gray-700">{l.label}</div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
