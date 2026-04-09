'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { govtPricesApi } from '@/lib/api';
import { useAuthStore, useLangStore } from '@/lib/store';
import toast from 'react-hot-toast';
import {
  Loader2, BarChart3, Plus, X, Search, IndianRupee,
} from 'lucide-react';

interface GovtPrice {
  id: string;
  commodity: string;
  variety?: string;
  market: string;
  district: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  unit: string;
  date: string;
}

export default function AdminPricesPage() {
  const router = useRouter();
  const { user, _hasHydrated } = useAuthStore();
  const { t } = useLangStore();
  const [prices, setPrices] = useState<GovtPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({
    commodity: '', variety: '', market: '', district: '', unit: 'Quintal',
    minPrice: '', maxPrice: '', modalPrice: '', date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!user) { router.push('/auth/login'); return; }
    if (user.role !== 'ADMIN') { router.push('/'); return; }
    load();
  }, [_hasHydrated, user, router]);

  const load = () => {
    govtPricesApi.list()
      .then((r) => setPrices(r.data?.items || r.data || []))
      .catch(() => toast.error(t({ en: 'Failed to load prices', te: 'ధరలు లోడ్ చేయడం విఫలమైంది' })))
      .finally(() => setLoading(false));
  };

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const addPrice = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      await govtPricesApi.create({
        ...form,
        minPrice: Number(form.minPrice),
        maxPrice: Number(form.maxPrice),
        modalPrice: Number(form.modalPrice),
        state: 'AP/TS',
      });
      toast.success(t({ en: 'Price added!', te: 'ధర జోడించబడింది!' }));
      setShowForm(false);
      setForm({
        commodity: '', variety: '', market: '', district: '', unit: 'Quintal',
        minPrice: '', maxPrice: '', modalPrice: '', date: new Date().toISOString().split('T')[0],
      });
      load();
    } catch {
      toast.error(t({ en: 'Failed to add price', te: 'ధర జోడించడం విఫలమైంది' }));
    } finally {
      setAdding(false);
    }
  };

  const filtered = prices.filter((p) =>
    !search ||
    p.commodity.toLowerCase().includes(search.toLowerCase()) ||
    p.district.toLowerCase().includes(search.toLowerCase()) ||
    p.market.toLowerCase().includes(search.toLowerCase()),
  );

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
          {t({ en: 'Loading prices...', te: 'ధరలు లోడ్ అవుతోంది...' })}
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
              <BarChart3 className="w-7 h-7" />
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">
                  {t({ en: 'Mandi Prices', te: 'మండి ధరలు' })}
                </h1>
                <p className="text-primary-200 text-sm mt-1">
                  {t({ en: 'Manage government commodity prices', te: 'ప్రభుత్వ వస్తువు ధరలను నిర్వహించండి' })}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowForm((v) => !v)}
              className="flex items-center gap-2 px-5 py-2.5 bg-white/20 backdrop-blur rounded-xl text-sm font-semibold hover:bg-white/30 transition-colors"
            >
              {showForm ? (
                <>
                  <X className="w-4 h-4" />
                  {t({ en: 'Cancel', te: 'రద్దు' })}
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  {t({ en: 'Add Price', te: 'ధర జోడించు' })}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Add price form */}
        {showForm && (
          <div className="bg-white rounded-2xl border border-primary-100 p-6 animate-slide-up">
            <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <IndianRupee className="w-5 h-5 text-primary-600" />
              {t({ en: 'Add Mandi Price', te: 'మండి ధర జోడించు' })}
            </h2>
            <form onSubmit={addPrice} className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                ['commodity', t({ en: 'Commodity', te: 'వస్తువు' }), 'Tomato', true],
                ['variety', t({ en: 'Variety', te: 'రకం' }), 'Hybrid', false],
                ['market', t({ en: 'Market', te: 'మార్కెట్' }), 'Kurnool APMC', true],
                ['district', t({ en: 'District', te: 'జిల్లా' }), 'Kurnool', true],
                ['unit', t({ en: 'Unit', te: 'యూనిట్' }), 'Quintal', true],
              ].map(([k, label, ph, req]) => (
                <div key={k as string}>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">{label as string}</label>
                  <input
                    value={(form as Record<string, string>)[k as string]}
                    onChange={(e) => set(k as string, e.target.value)}
                    required={req as boolean}
                    placeholder={ph as string}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                  />
                </div>
              ))}
              {[
                ['minPrice', t({ en: 'Min Price', te: 'కనీస ధర' })],
                ['maxPrice', t({ en: 'Max Price', te: 'గరిష్ట ధర' })],
                ['modalPrice', t({ en: 'Modal Price', te: 'మోడల్ ధర' })],
              ].map(([k, label]) => (
                <div key={k}>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">{label}</label>
                  <input
                    type="number"
                    value={(form as Record<string, string>)[k]}
                    onChange={(e) => set(k, e.target.value)}
                    required
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  {t({ en: 'Date', te: 'తేదీ' })}
                </label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => set('date', e.target.value)}
                  required
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                />
              </div>
              <div className="col-span-2 md:col-span-3 pt-2">
                <button
                  type="submit"
                  disabled={adding}
                  className="flex items-center justify-center gap-2 px-6 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 disabled:opacity-50 transition-colors"
                >
                  {adding ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  {t({ en: 'Add Price', te: 'ధర జోడించు' })}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Search */}
        <div className="relative max-w-sm animate-fade-in">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t({ en: 'Search commodity, district, or market...', te: 'వస్తువు, జిల్లా, లేదా మార్కెట్ వెతకండి...' })}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden animate-slide-up">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {[
                    t({ en: 'Commodity', te: 'వస్తువు' }),
                    t({ en: 'Variety', te: 'రకం' }),
                    t({ en: 'Market', te: 'మార్కెట్' }),
                    t({ en: 'District', te: 'జిల్లా' }),
                    t({ en: 'Min', te: 'కనీసం' }),
                    t({ en: 'Modal', te: 'మోడల్' }),
                    t({ en: 'Max', te: 'గరిష్ట' }),
                    t({ en: 'Unit', te: 'యూనిట్' }),
                    t({ en: 'Date', te: 'తేదీ' }),
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-16">
                      <BarChart3 className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                      <p className="text-sm text-slate-400">
                        {t({ en: 'No prices found', te: 'ధరలు కనుగొనబడలేదు' })}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-800">{p.commodity}</td>
                      <td className="px-4 py-3 text-slate-500">{p.variety || '---'}</td>
                      <td className="px-4 py-3 text-slate-600">{p.market}</td>
                      <td className="px-4 py-3 text-slate-600">{p.district}</td>
                      <td className="px-4 py-3 text-slate-700">₹{p.minPrice}</td>
                      <td className="px-4 py-3 font-semibold text-primary-700">₹{p.modalPrice}</td>
                      <td className="px-4 py-3 text-slate-700">₹{p.maxPrice}</td>
                      <td className="px-4 py-3 text-slate-500">{p.unit}</td>
                      <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                        {new Date(p.date).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
