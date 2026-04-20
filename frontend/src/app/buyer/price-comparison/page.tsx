'use client';
import { useEffect, useState } from 'react';
import { govtPricesApi, productsApi } from '@/lib/api';
import { useLangStore } from '@/lib/store';
import {
  BarChart3, TrendingUp, TrendingDown, Minus, Search, MapPin,
  Loader2, ArrowUpDown, Info, Sprout, RefreshCw,
} from 'lucide-react';

interface MandiPrice {
  id: string;
  commodity: string;
  variety?: string | null;
  market: string;
  district: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  date: string;
}

interface Product {
  id: string;
  title: string;
  fixedPrice?: number;
  minBidPrice?: number;
  unit: string;
  district?: string;
  category: { name: string };
}

export default function PriceComparisonPage() {
  const { t } = useLangStore();
  const [mandiPrices, setMandiPrices] = useState<MandiPrice[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [sortBy, setSortBy] = useState<'commodity' | 'diff'>('commodity');

  useEffect(() => {
    Promise.all([
      govtPricesApi.list().catch(() => ({ data: [] })),
      productsApi.list({ limit: 100 }).catch(() => ({ data: { items: [] } })),
    ]).then(([pricesRes, productsRes]) => {
      const prices = Array.isArray(pricesRes.data) ? pricesRes.data : pricesRes.data?.items || [];
      setMandiPrices(prices);
      const items = productsRes.data?.items || productsRes.data || [];
      setProducts(Array.isArray(items) ? items : []);
    }).finally(() => setLoading(false));
  }, []);

  // Build comparison rows
  const comparisons = mandiPrices.map((mp) => {
    const matchingProducts = products.filter(
      (p) => p.title.toLowerCase().includes(mp.commodity.toLowerCase()) ||
             mp.commodity.toLowerCase().includes(p.title.toLowerCase())
    );
    const avgPlatformPrice = matchingProducts.length > 0
      ? matchingProducts.reduce((sum, p) => sum + (p.fixedPrice || p.minBidPrice || 0), 0) / matchingProducts.length
      : null;
    const diff = avgPlatformPrice ? ((avgPlatformPrice - mp.modalPrice) / mp.modalPrice * 100) : null;

    return { ...mp, avgPlatformPrice, diff, matchCount: matchingProducts.length };
  });

  const districts = [...new Set(mandiPrices.map((m) => m.district))].sort();

  const filtered = comparisons.filter((c) => {
    const q = search.toLowerCase();
    if (search && !c.commodity.toLowerCase().includes(q) && !c.market.toLowerCase().includes(q)) return false;
    if (districtFilter && c.district !== districtFilter) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'diff') return (Math.abs(b.diff || 0)) - (Math.abs(a.diff || 0));
    return a.commodity.localeCompare(b.commodity);
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-primary-600 animate-spin mx-auto" />
          <p className="text-slate-500 mt-3 text-sm">{t({ en: 'Loading price data...', te: 'ధర డేటా లోడ్ అవుతోంది...' })}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-100 to-emerald-100 flex items-center justify-center shadow-sm">
              <BarChart3 className="w-6 h-6 text-primary-700" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                {t({ en: 'Mandi Price Comparison', te: 'మండి ధర పోలిక' })}
              </h1>
              <p className="text-sm text-slate-500">
                {t({ en: 'Compare APMC mandi rates with platform prices', te: 'APMC మండి రేట్లను ప్లాట్‌ఫారమ్ ధరలతో పోల్చండి' })}
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={t({ en: 'Search commodity or market...', te: 'వస్తువు లేదా మార్కెట్ వెతకండి...' })}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
            />
          </div>
          <select
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
          >
            <option value="">{t({ en: 'All Districts', te: 'అన్ని జిల్లాలు' })}</option>
            {districts.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <button
            onClick={() => setSortBy(sortBy === 'commodity' ? 'diff' : 'commodity')}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm hover:bg-slate-50 transition-all active:scale-95"
          >
            <ArrowUpDown className="w-4 h-4" />
            {sortBy === 'commodity'
              ? t({ en: 'Sort by Difference', te: 'తేడా ప్రకారం' })
              : t({ en: 'Sort by Name', te: 'పేరు ప్రకారం' })
            }
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <Sprout className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{mandiPrices.length}</p>
                <p className="text-xs text-slate-500">{t({ en: 'Mandi Entries', te: 'మండి ఎంట్రీలు' })}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">
                  {comparisons.filter((c) => c.diff && c.diff > 0).length}
                </p>
                <p className="text-xs text-slate-500">{t({ en: 'Above Mandi Rate', te: 'మండి రేటు కంటే ఎక్కువ' })}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">
                  {comparisons.filter((c) => c.diff && c.diff < 0).length}
                </p>
                <p className="text-xs text-slate-500">{t({ en: 'Below Mandi Rate', te: 'మండి రేటు కంటే తక్కువ' })}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Info bar */}
        <div className="flex items-start gap-2 p-4 mb-6 rounded-xl bg-blue-50/70 border border-blue-100 text-sm text-blue-700">
          <Info className="w-4 h-4 mt-0.5 shrink-0" />
          <p>
            {t({
              en: 'Prices shown are from APMC mandis and compared with average platform listing prices. A positive difference means the platform price is higher than the mandi rate.',
              te: 'చూపిన ధరలు APMC మండీల నుండి మరియు సగటు ప్లాట్‌ఫారమ్ జాబితా ధరలతో పోల్చబడ్డాయి.',
            })}
          </p>
        </div>

        {/* Table */}
        {sorted.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-500 text-sm">{t({ en: 'No price data found', te: 'ధర డేటా కనుగొనబడలేదు' })}</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left px-5 py-3.5 font-semibold text-slate-600">{t({ en: 'Commodity', te: 'వస్తువు' })}</th>
                    <th className="text-left px-5 py-3.5 font-semibold text-slate-600">{t({ en: 'Market / District', te: 'మార్కెట్ / జిల్లా' })}</th>
                    <th className="text-right px-5 py-3.5 font-semibold text-slate-600">{t({ en: 'Min', te: 'కనిష్ట' })}</th>
                    <th className="text-right px-5 py-3.5 font-semibold text-slate-600">{t({ en: 'Max', te: 'గరిష్ట' })}</th>
                    <th className="text-right px-5 py-3.5 font-semibold text-slate-600">{t({ en: 'Modal', te: 'మోడల్' })}</th>
                    <th className="text-right px-5 py-3.5 font-semibold text-slate-600">{t({ en: 'Platform Avg', te: 'ప్లాట్‌ఫారమ్ సగటు' })}</th>
                    <th className="text-right px-5 py-3.5 font-semibold text-slate-600">{t({ en: 'Difference', te: 'తేడా' })}</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((row, i) => (
                    <tr
                      key={row.id}
                      className={`border-b border-slate-50 hover:bg-slate-50/50 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}
                      style={{ animationDelay: `${i * 30}ms` }}
                    >
                      <td className="px-5 py-3.5 font-medium text-slate-800">{row.commodity}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{row.market}</span>
                          <span className="text-slate-400">·</span>
                          <span className="text-slate-500">{row.district}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right text-slate-600">₹{row.minPrice.toLocaleString()}</td>
                      <td className="px-5 py-3.5 text-right text-slate-600">₹{row.maxPrice.toLocaleString()}</td>
                      <td className="px-5 py-3.5 text-right font-semibold text-slate-800">₹{row.modalPrice.toLocaleString()}</td>
                      <td className="px-5 py-3.5 text-right">
                        {row.avgPlatformPrice ? (
                          <span className="font-semibold text-primary-700">₹{Math.round(row.avgPlatformPrice).toLocaleString()}</span>
                        ) : (
                          <span className="text-slate-400 text-xs">{t({ en: 'No listing', te: 'జాబితా లేదు' })}</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {row.diff !== null ? (
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                            row.diff > 5 ? 'bg-emerald-50 text-emerald-700' :
                            row.diff < -5 ? 'bg-red-50 text-red-600' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {row.diff > 0 ? <TrendingUp className="w-3 h-3" /> :
                             row.diff < 0 ? <TrendingDown className="w-3 h-3" /> :
                             <Minus className="w-3 h-3" />}
                            {row.diff > 0 ? '+' : ''}{row.diff.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
