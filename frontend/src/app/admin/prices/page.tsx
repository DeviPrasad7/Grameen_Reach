'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { govtPricesApi } from '@/lib/api';
import { useAuthStore, useLangStore } from '@/lib/store';

interface GovtPrice {
  id: string; commodity: string; variety?: string; market: string;
  district: string; minPrice: number; maxPrice: number; modalPrice: number;
  unit: string; date: string;
}

export default function AdminPricesPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { t } = useLangStore();
  const [prices, setPrices] = useState<GovtPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    commodity: '', variety: '', market: '', district: '', unit: 'Quintal',
    minPrice: '', maxPrice: '', modalPrice: '', date: new Date().toISOString().split('T')[0],
  });
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }
    if (user.role !== 'ADMIN') { router.push('/'); return; }
    load();
  }, [user]);

  const load = () => { govtPricesApi.list().then((r) => setPrices(r.data?.items || r.data || [])).finally(() => setLoading(false)); };
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const addPrice = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      await govtPricesApi.create({ ...form, minPrice: Number(form.minPrice), maxPrice: Number(form.maxPrice), modalPrice: Number(form.modalPrice), state: 'AP/TS' });
      setToast(t({ en: 'Price added!', te: 'ధర జోడించబడింది!' }));
      setShowForm(false);
      setForm({ commodity: '', variety: '', market: '', district: '', unit: 'Quintal', minPrice: '', maxPrice: '', modalPrice: '', date: new Date().toISOString().split('T')[0] });
      load();
    } catch { setToast(t({ en: 'Failed to add price', te: 'ధర జోడించడం విఫలమైంది' })); }
    finally { setAdding(false); setTimeout(() => setToast(''), 3000); }
  };

  const filtered = prices.filter((p) =>
    !search || p.commodity.toLowerCase().includes(search.toLowerCase()) || p.district.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">{t({ en: 'Loading...', te: 'లోడ్ అవుతోంది...' })}</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">{t({ en: 'Mandi / Govt Prices', te: 'మండి / ప్రభుత్వ ధరలు' })}</h1>
          <button onClick={() => setShowForm((v) => !v)} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700">
            {showForm ? t({ en: 'Cancel', te: 'రద్దు' }) : t({ en: '+ Add Price', te: '+ ధర జోడించు' })}
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-2xl border border-primary-100 p-6 mb-6">
            <h2 className="font-semibold text-gray-700 mb-4">{t({ en: 'Add Mandi Price', te: 'మండి ధర జోడించు' })}</h2>
            <form onSubmit={addPrice} className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                ['commodity', t({ en: 'Commodity', te: 'వస్తువు' }), 'Tomato'],
                ['variety', t({ en: 'Variety', te: 'రకం' }), 'Hybrid'],
                ['market', t({ en: 'Market', te: 'మార్కెట్' }), 'Kurnool APMC'],
                ['district', t({ en: 'District', te: 'జిల్లా' }), 'Kurnool'],
                ['unit', t({ en: 'Unit', te: 'యూనిట్' }), 'Quintal'],
              ].map(([k, label, ph]) => (
                <div key={k}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                  <input value={(form as Record<string, string>)[k]} onChange={(e) => set(k, e.target.value)} required={k !== 'variety'} placeholder={ph}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
                </div>
              ))}
              {[
                ['minPrice', t({ en: 'Min Price', te: 'కనీస ధర' })],
                ['maxPrice', t({ en: 'Max Price', te: 'గరిష్ట ధర' })],
                ['modalPrice', t({ en: 'Modal Price', te: 'మోడల్ ధర' })],
              ].map(([k, label]) => (
                <div key={k}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                  <input type="number" value={(form as Record<string, string>)[k]} onChange={(e) => set(k, e.target.value)} required
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t({ en: 'Date', te: 'తేదీ' })}</label>
                <input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} required
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
              </div>
              <div className="col-span-2 md:col-span-3">
                <button type="submit" disabled={adding} className="px-6 py-2 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 disabled:opacity-50">
                  {adding ? '...' : t({ en: 'Add Price', te: 'ధర జోడించు' })}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="mb-4">
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder={t({ en: 'Search commodity or district...', te: 'వస్తువు లేదా జిల్లా వెతకండి...' })}
            className="w-full max-w-sm border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {[
                  t({ en: 'Commodity', te: 'వస్తువు' }), t({ en: 'Variety', te: 'రకం' }),
                  t({ en: 'Market', te: 'మార్కెట్' }), t({ en: 'District', te: 'జిల్లా' }),
                  t({ en: 'Min', te: 'కనీసం' }), t({ en: 'Modal', te: 'మోడల్' }),
                  t({ en: 'Max', te: 'గరిష్ట' }), t({ en: 'Unit', te: 'యూనిట్' }), t({ en: 'Date', te: 'తేదీ' }),
                ].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-8 text-gray-400">{t({ en: 'No prices found', te: 'ధరలు కనుగొనబడలేదు' })}</td></tr>
              ) : filtered.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{p.commodity}</td>
                  <td className="px-4 py-3 text-gray-600">{p.variety || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{p.market}</td>
                  <td className="px-4 py-3 text-gray-600">{p.district}</td>
                  <td className="px-4 py-3 text-gray-700">₹{p.minPrice}</td>
                  <td className="px-4 py-3 font-semibold text-primary-700">₹{p.modalPrice}</td>
                  <td className="px-4 py-3 text-gray-700">₹{p.maxPrice}</td>
                  <td className="px-4 py-3 text-gray-500">{p.unit}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(p.date).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {toast && <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-lg shadow text-sm">{toast}</div>}
    </div>
  );
}
