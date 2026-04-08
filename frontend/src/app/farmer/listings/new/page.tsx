'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { productsApi, govtPricesApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

const CATEGORIES = ['Vegetables', 'Fruits', 'Grains', 'Pulses', 'Dairy', 'Spices'];
const UNITS = ['kg', 'quintal', 'bag', 'crate', 'bunch', 'litre', 'dozen'];

export default function NewListingPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [form, setForm] = useState({
    title: '', titleTE: '', categoryId: '', unit: 'kg', priceType: 'FIXED',
    fixedPrice: '', minBidPrice: '', bidEndsAt: '', grade: 'A', organic: false,
    harvestDate: '', minQty: '1', availableQty: '', village: '', district: '',
    pincode: '', imageUrls: '',
  });
  const [priceHint, setPriceHint] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }
    if (user.role !== 'FARMER') { router.push('/'); return; }
  }, [user]);

  const fetchPriceHint = async () => {
    if (!form.title || !form.district) return;
    try {
      const res = await govtPricesApi.suggestions(form.title, form.district);
      const d = res.data;
      if (d && d.modalPrice) {
        setPriceHint('Today modal price: Rs.' + d.modalPrice + '/quintal at ' + d.market + '. Suggested Rs.' + Math.round(d.modalPrice / 100) + ' per ' + form.unit + '.');
      }
    } catch { /* ignore */ }
  };

  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const payload = {
        ...form,
        fixedPrice: form.fixedPrice ? Number(form.fixedPrice) : undefined,
        minBidPrice: form.minBidPrice ? Number(form.minBidPrice) : undefined,
        minQty: Number(form.minQty), availableQty: Number(form.availableQty),
        imageUrls: form.imageUrls ? form.imageUrls.split(',').map((s) => s.trim()).filter(Boolean) : [],
        harvestDate: form.harvestDate || undefined, bidEndsAt: form.bidEndsAt || undefined,
      };
      await productsApi.create(payload);
      router.push('/farmer/listings');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : (msg || 'Failed to create listing'));
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600">&#8592;</button>
          <h1 className="text-2xl font-bold text-gray-800">Create New Listing</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Product info */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <h2 className="font-semibold text-gray-700">Product Details</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title (English) *</label>
              <input value={form.title} onChange={(e) => set('title', e.target.value)} required
                onBlur={fetchPriceHint}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                placeholder="Fresh Tomatoes" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title (Telugu)</label>
              <input value={form.titleTE} onChange={(e) => set('titleTE', e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                placeholder="తాజా టమాటాలు" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <select value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)} required
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400">
                  <option value="">Select...</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit *</label>
                <select value={form.unit} onChange={(e) => set('unit', e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400">
                  {UNITS.map((u) => <option key={u}>{u}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Available Qty *</label>
                <input type="number" value={form.availableQty} onChange={(e) => set('availableQty', e.target.value)} required min="0"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Order Qty</label>
                <input type="number" value={form.minQty} onChange={(e) => set('minQty', e.target.value)} min="1"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Harvest Date</label>
                <input type="date" value={form.harvestDate} onChange={(e) => set('harvestDate', e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
                <select value={form.grade} onChange={(e) => set('grade', e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400">
                  {['A', 'B', 'C'].map((g) => <option key={g}>{g}</option>)}
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="organic" checked={form.organic} onChange={(e) => set('organic', e.target.checked)} className="rounded" />
              <label htmlFor="organic" className="text-sm text-gray-700">Organic product</label>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <h2 className="font-semibold text-gray-700">Pricing</h2>
            <div className="flex gap-2">
              {['FIXED', 'BID', 'HYBRID'].map((t) => (
                <button key={t} type="button" onClick={() => set('priceType', t)}
                  className={'flex-1 py-2 rounded-lg text-xs font-semibold border transition-colors ' +
                    (form.priceType === t ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-300 hover:border-primary-300')}>
                  {t}
                </button>
              ))}
            </div>
            {(form.priceType === 'FIXED' || form.priceType === 'HYBRID') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fixed Price (Rs per {form.unit}) *
                </label>
                <input type="number" value={form.fixedPrice} onChange={(e) => set('fixedPrice', e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
              </div>
            )}
            {(form.priceType === 'BID' || form.priceType === 'HYBRID') && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Bid (Rs) *</label>
                  <input type="number" value={form.minBidPrice} onChange={(e) => set('minBidPrice', e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bid Ends At</label>
                  <input type="datetime-local" value={form.bidEndsAt} onChange={(e) => set('bidEndsAt', e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
                </div>
              </div>
            )}
            {priceHint && (
              <div className="bg-primary-50 text-primary-700 text-xs px-3 py-2 rounded-lg">{priceHint}</div>
            )}
          </div>

          {/* Location */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <h2 className="font-semibold text-gray-700">Location</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Village</label>
                <input value={form.village} onChange={(e) => set('village', e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
                <input value={form.district} onChange={(e) => set('district', e.target.value)} onBlur={fetchPriceHint}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                  placeholder="Kurnool" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                <input value={form.pincode} onChange={(e) => set('pincode', e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Image URLs (comma-separated)</label>
              <input value={form.imageUrls} onChange={(e) => set('imageUrls', e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
            </div>
          </div>

          {error && <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg">{error}</div>}

          <button type="submit" disabled={loading}
            className="w-full py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-colors">
            {loading ? 'Creating listing...' : 'Create Listing'}
          </button>
        </form>
      </div>
    </div>
  );
}
