'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { productsApi, govtPricesApi, categoriesApi } from '@/lib/api';
import { useAuthStore, useLangStore } from '@/lib/store';

const UNITS = ['kg', 'quintal', 'bag', 'crate', 'bunch', 'litre', 'dozen'];

interface Category { id: string; name: string; nameTE: string; icon?: string; }

export default function NewListingPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { lang, t } = useLangStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({
    title: '', titleTE: '', description: '', descriptionTE: '',
    categoryId: '', unit: 'kg', priceType: 'FIXED',
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
    categoriesApi.list().then((r) => setCategories(r.data || [])).catch(() => {});
  }, [user]);

  const fetchPriceHint = async () => {
    if (!form.title || !form.district) return;
    try {
      const res = await govtPricesApi.suggestions(form.title, form.district);
      const d = res.data;
      if (d && d.latestModal) {
        setPriceHint(t({
          en: `Mandi modal price: ₹${d.latestModal}/quintal. Suggested ₹${d.suggestedMin} - ₹${d.suggestedMax} per quintal.`,
          te: `మండి ధర: ₹${d.latestModal}/క్వింటాల్. సూచన ₹${d.suggestedMin} - ₹${d.suggestedMax} క్వింటాల్‌కు.`,
        }));
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
        description: form.description || undefined, descriptionTE: form.descriptionTE || undefined,
      };
      await productsApi.create(payload);
      router.push('/farmer/listings');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : (msg || t({ en: 'Failed to create listing', te: 'జాబితా సృష్టించడం విఫలమైంది' })));
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600">&#8592;</button>
          <h1 className="text-2xl font-bold text-gray-800">{t({ en: 'Create New Listing', te: 'కొత్త జాబితా సృష్టించు' })}</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <h2 className="font-semibold text-gray-700">{t({ en: 'Product Details', te: 'ఉత్పత్తి వివరాలు' })}</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t({ en: 'Title (English) *', te: 'శీర్షిక (ఆంగ్లం) *' })}</label>
              <input value={form.title} onChange={(e) => set('title', e.target.value)} required onBlur={fetchPriceHint}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" placeholder="Fresh Tomatoes" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t({ en: 'Title (Telugu)', te: 'శీర్షిక (తెలుగు)' })}</label>
              <input value={form.titleTE} onChange={(e) => set('titleTE', e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" placeholder="తాజా టమాటాలు" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t({ en: 'Description (English)', te: 'వివరణ (ఆంగ్లం)' })}</label>
              <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={2}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t({ en: 'Description (Telugu)', te: 'వివరణ (తెలుగు)' })}</label>
              <textarea value={form.descriptionTE} onChange={(e) => set('descriptionTE', e.target.value)} rows={2}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t({ en: 'Category *', te: 'వర్గం *' })}</label>
                <select value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)} required
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400">
                  <option value="">{t({ en: 'Select...', te: 'ఎంచుకోండి...' })}</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.icon} {lang === 'te' ? c.nameTE : c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t({ en: 'Unit *', te: 'యూనిట్ *' })}</label>
                <select value={form.unit} onChange={(e) => set('unit', e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400">
                  {UNITS.map((u) => <option key={u}>{u}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t({ en: 'Available Qty *', te: 'అందుబాటులో పరిమాణం *' })}</label>
                <input type="number" value={form.availableQty} onChange={(e) => set('availableQty', e.target.value)} required min="0"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t({ en: 'Min Order Qty', te: 'కనీస ఆర్డర్' })}</label>
                <input type="number" value={form.minQty} onChange={(e) => set('minQty', e.target.value)} min="1"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t({ en: 'Harvest Date', te: 'కోత తేదీ' })}</label>
                <input type="date" value={form.harvestDate} onChange={(e) => set('harvestDate', e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t({ en: 'Grade', te: 'గ్రేడ్' })}</label>
                <select value={form.grade} onChange={(e) => set('grade', e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400">
                  {['A', 'B', 'C'].map((g) => <option key={g}>{g}</option>)}
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="organic" checked={form.organic} onChange={(e) => set('organic', e.target.checked)} className="rounded" />
              <label htmlFor="organic" className="text-sm text-gray-700">{t({ en: 'Organic product', te: 'సేంద్రీయ ఉత్పత్తి' })}</label>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <h2 className="font-semibold text-gray-700">{t({ en: 'Pricing', te: 'ధర నిర్ణయం' })}</h2>
            <div className="flex gap-2">
              {['FIXED', 'BID', 'HYBRID'].map((tp) => (
                <button key={tp} type="button" onClick={() => set('priceType', tp)}
                  className={'flex-1 py-2 rounded-lg text-xs font-semibold border transition-colors ' +
                    (form.priceType === tp ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-300 hover:border-primary-300')}>
                  {tp}
                </button>
              ))}
            </div>
            {(form.priceType === 'FIXED' || form.priceType === 'HYBRID') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t({ en: `Fixed Price (₹ per ${form.unit}) *`, te: `స్థిర ధర (₹ ప్రతి ${form.unit}) *` })}</label>
                <input type="number" value={form.fixedPrice} onChange={(e) => set('fixedPrice', e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
              </div>
            )}
            {(form.priceType === 'BID' || form.priceType === 'HYBRID') && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t({ en: 'Min Bid (₹) *', te: 'కనీస బిడ్ (₹) *' })}</label>
                  <input type="number" value={form.minBidPrice} onChange={(e) => set('minBidPrice', e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t({ en: 'Bid Ends At', te: 'బిడ్ ముగింపు' })}</label>
                  <input type="datetime-local" value={form.bidEndsAt} onChange={(e) => set('bidEndsAt', e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
                </div>
              </div>
            )}
            {priceHint && <div className="bg-primary-50 text-primary-700 text-xs px-3 py-2 rounded-lg">{priceHint}</div>}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <h2 className="font-semibold text-gray-700">{t({ en: 'Location & Images', te: 'ప్రాంతం & చిత్రాలు' })}</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t({ en: 'Village', te: 'గ్రామం' })}</label>
                <input value={form.village} onChange={(e) => set('village', e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t({ en: 'District', te: 'జిల్లా' })}</label>
                <input value={form.district} onChange={(e) => set('district', e.target.value)} onBlur={fetchPriceHint}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" placeholder={t({ en: 'Kurnool', te: 'కర్నూలు' })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t({ en: 'Pincode', te: 'పిన్‌కోడ్' })}</label>
                <input value={form.pincode} onChange={(e) => set('pincode', e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t({ en: 'Image URLs (comma-separated)', te: 'చిత్రం URLలు (కామాతో వేరు చేయబడినవి)' })}</label>
              <input value={form.imageUrls} onChange={(e) => set('imageUrls', e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
            </div>
          </div>

          {error && <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg">{error}</div>}

          <button type="submit" disabled={loading}
            className="w-full py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-colors">
            {loading ? t({ en: 'Creating listing...', te: 'జాబితా సృష్టిస్తోంది...' }) : t({ en: 'Create Listing', te: 'జాబితా సృష్టించు' })}
          </button>
        </form>
      </div>
    </div>
  );
}
