'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { productsApi, bidsApi, aiApi, ordersApi } from '@/lib/api';
import { useAuthStore, useLangStore } from '@/lib/store';
import toast from 'react-hot-toast';
import {
  Loader2, Plus, Package, Gavel, BarChart3,
  Bot, Sparkles, ArrowRight, ShoppingCart,
  ClipboardList, Store, Send, IndianRupee,
  TrendingUp, Clock,
} from 'lucide-react';

interface BidItem {
  id: string;
  amount: number;
  status: string;
  product: { title: string; titleTE?: string; unit: string };
  buyer: { name: string };
  createdAt: string;
}

interface SubOrderItem {
  qty: number;
  unitPrice: number;
  product: { title: string; titleTE?: string; unit: string };
}

interface SubOrder {
  id: string;
  orderId: string;
  status: string;
  amount: number;
  deliveryFee: number;
  createdAt: string;
  items: SubOrderItem[];
  order: {
    id: string;
    buyer: { name: string; email: string };
  };
}

export default function FarmerDashboard() {
  const router = useRouter();
  const { user, _hasHydrated } = useAuthStore();
  const { lang, t } = useLangStore();
  const [products, setProducts] = useState<{ status: string }[]>([]);
  const [bids, setBids] = useState<BidItem[]>([]);
  const [subOrders, setSubOrders] = useState<SubOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiInput, setAiInput] = useState('');
  const [aiResult, setAiResult] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [pcCommodity, setPcCommodity] = useState('');
  const [pcDistrict, setPcDistrict] = useState('');
  const [pcResult, setPcResult] = useState('');
  const [pcLoading, setPcLoading] = useState(false);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!user) { router.push('/auth/login'); return; }
    if (user.role !== 'FARMER') { router.push('/'); return; }

    Promise.all([
      productsApi.list({ farmerId: user.id })
        .then((r) => setProducts(r.data?.items || r.data || []))
        .catch(() => {}),
      bidsApi.farmerBids()
        .then((r) => setBids(r.data || []))
        .catch(() => {}),
      ordersApi.list()
        .then((r) => setSubOrders(r.data || []))
        .catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [_hasHydrated, user, router]);

  const runAiListing = async () => {
    const trimmed = aiInput.trim();
    if (!trimmed) {
      toast.error(t({ en: 'Please describe your produce', te: 'దయచేసి మీ ఉత్పత్తిని వివరించండి' }));
      return;
    }
    setAiLoading(true);
    setAiResult('');
    try {
      const res = await aiApi.listingGenerator({ prompt: trimmed });
      setAiResult(res.data.result || res.data.response || JSON.stringify(res.data));
      toast.success(t({ en: 'Listing generated!', te: 'జాబితా రూపొందించబడింది!' }));
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      const fallback = t({ en: 'AI unavailable. Set GEMINI_API_KEY.', te: 'AI అందుబాటులో లేదు. GEMINI_API_KEY సెట్ చేయండి.' });
      setAiResult(msg || fallback);
      toast.error(msg || fallback);
    } finally {
      setAiLoading(false);
    }
  };

  const runPriceCoach = async () => {
    if (!pcCommodity.trim() || !pcDistrict) {
      toast.error(t({ en: 'Please enter commodity and select district', te: 'దయచేసి వస్తువు మరియు జిల్లాను ఎంచుకోండి' }));
      return;
    }
    setPcLoading(true);
    setPcResult('');
    try {
      const res = await aiApi.priceCoach({ commodity: pcCommodity.trim(), district: pcDistrict });
      setPcResult(res.data.result || res.data.response || JSON.stringify(res.data));
      toast.success(t({ en: 'Price advice ready!', te: 'ధర సలహా సిద్ధం!' }));
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      const fallback = t({ en: 'AI unavailable. Set GEMINI_API_KEY.', te: 'AI అందుబాటులో లేదు. GEMINI_API_KEY సెట్ చేయండి.' });
      setPcResult(msg || fallback);
      toast.error(msg || fallback);
    } finally {
      setPcLoading(false);
    }
  };

  const renderAiResult = (result: string) => {
    // Try parsing as JSON
    try {
      const parsed = JSON.parse(result);
      if (parsed && typeof parsed === 'object' && (parsed.title || parsed.suggestedPrice || parsed.description)) {
        const params = new URLSearchParams();
        if (parsed.title) params.set('title', parsed.title);
        if (parsed.titleTE) params.set('titleTE', parsed.titleTE);
        if (parsed.description) params.set('description', parsed.description);
        if (parsed.descriptionTE) params.set('descriptionTE', parsed.descriptionTE);
        if (parsed.suggestedPrice) params.set('price', String(parsed.suggestedPrice));
        if (parsed.grade) params.set('grade', parsed.grade);
        if (parsed.tags) params.set('tags', Array.isArray(parsed.tags) ? parsed.tags.join(',') : parsed.tags);

        return (
          <div className="space-y-3">
            {/* Title row */}
            {(parsed.title || parsed.titleTE) && (
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                {parsed.title && (
                  <h3 className="text-lg font-bold text-slate-800">{parsed.title}</h3>
                )}
                {parsed.titleTE && (
                  <span className="text-base font-medium text-slate-500">{parsed.titleTE}</span>
                )}
              </div>
            )}

            {/* Description */}
            {(parsed.description || parsed.descriptionTE) && (
              <div className="space-y-1">
                {parsed.description && (
                  <p className="text-sm text-slate-700 leading-relaxed">{parsed.description}</p>
                )}
                {parsed.descriptionTE && (
                  <p className="text-sm text-slate-500 leading-relaxed">{parsed.descriptionTE}</p>
                )}
              </div>
            )}

            {/* Price + Grade row */}
            <div className="flex flex-wrap items-center gap-3">
              {parsed.suggestedPrice != null && (
                <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-lg text-sm font-bold">
                  <IndianRupee className="w-3.5 h-3.5" />
                  {parsed.suggestedPrice}/{parsed.unit || 'kg'}
                </span>
              )}
              {parsed.grade && (
                <span className="px-3 py-1.5 bg-amber-100 text-amber-800 rounded-lg text-xs font-semibold uppercase tracking-wide">
                  {t({ en: 'Grade', te: 'గ్రేడ్' })}: {parsed.grade}
                </span>
              )}
            </div>

            {/* Tags */}
            {parsed.tags && Array.isArray(parsed.tags) && parsed.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {parsed.tags.map((tag: string, i: number) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Use This Listing button */}
            <button
              onClick={() => router.push(`/farmer/listings/new?${params.toString()}`)}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors mt-1"
            >
              <Send className="w-4 h-4" />
              {t({ en: 'Use This Listing', te: 'ఈ జాబితాను ఉపయోగించు' })}
            </button>
          </div>
        );
      }
    } catch {
      // Not JSON — fall through to formatted text
    }

    // Plain text: render with line breaks, bullet points
    const lines = result.split('\n');
    return (
      <div className="space-y-1">
        {lines.map((line, i) => {
          const trimmed = line.trim();
          if (!trimmed) return <div key={i} className="h-2" />;
          // Bullet points
          if (/^[-*•]\s/.test(trimmed)) {
            return (
              <div key={i} className="flex items-start gap-2 text-sm text-slate-700">
                <span className="text-primary-500 mt-0.5">•</span>
                <span>{trimmed.replace(/^[-*•]\s+/, '')}</span>
              </div>
            );
          }
          // Numbered items
          if (/^\d+[.)]\s/.test(trimmed)) {
            return (
              <div key={i} className="flex items-start gap-2 text-sm text-slate-700">
                <span className="text-primary-600 font-semibold min-w-[1.25rem]">{trimmed.match(/^\d+/)?.[0]}.</span>
                <span>{trimmed.replace(/^\d+[.)]\s+/, '')}</span>
              </div>
            );
          }
          // Bold-like headings (lines ending with colon or all caps)
          if (/^[A-Z\s]{4,}:?$/.test(trimmed) || /\*\*.*\*\*/.test(trimmed)) {
            return (
              <p key={i} className="text-sm font-semibold text-slate-800 mt-2">
                {trimmed.replace(/\*\*/g, '')}
              </p>
            );
          }
          return <p key={i} className="text-sm text-slate-700">{line}</p>;
        })}
      </div>
    );
  };

  const renderPriceCoachResult = (result: string) => {
    const lines = result.split('\n');
    return (
      <div className="space-y-1">
        {lines.map((line, i) => {
          const trimmed = line.trim();
          if (!trimmed) return <div key={i} className="h-2" />;
          if (/^[-*•]\s/.test(trimmed)) {
            return (
              <div key={i} className="flex items-start gap-2 text-sm text-slate-700">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>{trimmed.replace(/^[-*•]\s+/, '')}</span>
              </div>
            );
          }
          if (/^\d+[.)]\s/.test(trimmed)) {
            return (
              <div key={i} className="flex items-start gap-2 text-sm text-slate-700">
                <span className="text-blue-600 font-semibold min-w-[1.25rem]">{trimmed.match(/^\d+/)?.[0]}.</span>
                <span>{trimmed.replace(/^\d+[.)]\s+/, '')}</span>
              </div>
            );
          }
          if (/^[A-Z\s]{4,}:?$/.test(trimmed) || /\*\*.*\*\*/.test(trimmed)) {
            return (
              <p key={i} className="text-sm font-semibold text-slate-800 mt-2">
                {trimmed.replace(/\*\*/g, '')}
              </p>
            );
          }
          return <p key={i} className="text-sm text-slate-700">{line}</p>;
        })}
      </div>
    );
  };

  const priceCoachDistricts = [
    'Hyderabad', 'Visakhapatnam', 'Vijayawada', 'Guntur', 'Warangal',
    'Tirupati', 'Kurnool', 'Nellore', 'Rajahmundry', 'Karimnagar',
  ];

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
        <p className="text-sm text-slate-400">{t({ en: 'Loading dashboard...', te: 'డాష్‌బోర్డ్ లోడ్ అవుతోంది...' })}</p>
      </div>
    );
  }

  const activeCount = products.filter((p) => p.status === 'ACTIVE').length;
  const pendingBids = bids.filter((b) => b.status === 'PENDING').length;

  const deliveredOrders = subOrders.filter((so) => so.status === 'DELIVERED');
  const pendingOrders = subOrders.filter((so) => so.status === 'PLACED' || so.status === 'CONFIRMED');
  const totalRevenue = deliveredOrders.reduce((sum, so) => sum + so.amount, 0);

  const stats = [
    {
      label: t({ en: 'Active Listings', te: 'యాక్టివ్ జాబితాలు' }),
      value: activeCount,
      icon: Package,
      color: 'bg-primary-50 text-primary-600',
    },
    {
      label: t({ en: 'Pending Bids', te: 'పెండింగ్ బిడ్లు' }),
      value: pendingBids,
      icon: Gavel,
      color: 'bg-amber-50 text-amber-600',
    },
    {
      label: t({ en: 'Total Products', te: 'మొత్తం ఉత్పత్తులు' }),
      value: products.length,
      icon: BarChart3,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: t({ en: 'Total Revenue', te: 'మొత్తం ఆదాయం' }),
      value: `₹${totalRevenue.toLocaleString('en-IN')}`,
      icon: IndianRupee,
      color: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: t({ en: 'Pending Orders', te: 'పెండింగ్ ఆర్డర్లు' }),
      value: pendingOrders.length,
      icon: Clock,
      color: 'bg-orange-50 text-orange-600',
    },
    {
      label: t({ en: 'Completed Orders', te: 'పూర్తయిన ఆర్డర్లు' }),
      value: deliveredOrders.length,
      icon: TrendingUp,
      color: 'bg-green-50 text-green-600',
    },
  ];

  const quickLinks = [
    { href: '/farmer/listings', label: { en: 'My Listings', te: 'నా జాబితాలు' }, icon: Package, color: 'text-primary-600' },
    { href: '/farmer/bids', label: { en: 'Manage Bids', te: 'బిడ్లు నిర్వహించు' }, icon: Gavel, color: 'text-amber-600' },
    { href: '/farmer/orders', label: { en: 'Orders', te: 'ఆర్డర్లు' }, icon: ClipboardList, color: 'text-blue-600' },
    { href: '/buyer/browse', label: { en: 'Browse Market', te: 'మార్కెట్ చూడండి' }, icon: Store, color: 'text-purple-600' },
  ];

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      PENDING: 'bg-amber-100 text-amber-700',
      ACCEPTED: 'bg-primary-100 text-primary-700',
      REJECTED: 'bg-red-100 text-red-700',
      COUNTERED: 'bg-blue-100 text-blue-700',
    };
    return map[status] || 'bg-slate-100 text-slate-600';
  };

  const orderStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      PLACED: 'bg-blue-100 text-blue-700',
      CONFIRMED: 'bg-amber-100 text-amber-700',
      PACKED: 'bg-orange-100 text-orange-700',
      OUT_FOR_DELIVERY: 'bg-purple-100 text-purple-700',
      DELIVERED: 'bg-green-100 text-green-700',
      CANCELLED: 'bg-red-100 text-red-700',
    };
    return map[status] || 'bg-slate-100 text-slate-600';
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero header */}
      <div className="bg-gradient-to-r from-primary-700 via-primary-600 to-emerald-600 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="animate-fade-in">
              <h1 className="text-2xl sm:text-3xl font-bold">
                {t({ en: 'Farmer Dashboard', te: 'రైతు డాష్‌బోర్డ్' })}
              </h1>
              <p className="text-primary-200 text-sm mt-1">
                {t({ en: 'Welcome back', te: 'తిరిగి స్వాగతం' })}, {user?.name}
              </p>
            </div>
            <Link
              href="/farmer/listings/new"
              className="flex items-center gap-2 px-5 py-2.5 bg-white/20 backdrop-blur rounded-xl text-sm font-semibold hover:bg-white/30 transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t({ en: 'New Listing', te: 'కొత్త జాబితా' })}
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-4 animate-slide-up">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.label}
                className="bg-white rounded-2xl border border-slate-100 p-5 card-hover"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-800">{s.value}</p>
                    <p className="text-xs text-slate-500">{s.label}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* AI Listing Generator */}
        <div className="bg-white rounded-2xl border border-primary-100 p-6 animate-slide-up">
          <div className="flex items-center gap-2 mb-1">
            <Bot className="w-5 h-5 text-primary-600" />
            <h2 className="font-semibold text-slate-800">
              {t({ en: 'AI Listing Generator', te: 'AI జాబితా జనరేటర్' })}
            </h2>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            {t({
              en: 'Describe your produce in Telugu or English — AI will generate a full listing',
              te: 'మీ ఉత్పత్తిని తెలుగు లేదా ఆంగ్లంలో వివరించండి — AI పూర్తి జాబితాను రూపొందిస్తుంది',
            })}
          </p>
          <div className="flex gap-2">
            <input
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && runAiListing()}
              placeholder={t({
                en: 'e.g. 2 quintals fresh tomatoes from Kurnool',
                te: 'ఉదా: టమాటా 2 క్వింటాళ్లు, కర్నూలు',
              })}
              className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
            />
            <button
              onClick={runAiListing}
              disabled={aiLoading}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              {aiLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {t({ en: 'Generate', te: 'రూపొందించు' })}
            </button>
          </div>
          {aiResult && (
            <div className="mt-4 bg-primary-50 border border-primary-100 rounded-xl p-4 text-sm text-slate-700 animate-fade-in">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-primary-500" />
                <span className="text-xs font-semibold text-primary-600">
                  {t({ en: 'AI Result', te: 'AI ఫలితం' })}
                </span>
              </div>
              {renderAiResult(aiResult)}
            </div>
          )}
        </div>

        {/* AI Price Coach */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 animate-slide-up">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold text-slate-800">
              {t({ en: 'AI Price Coach', te: 'AI ధర కోచ్' })}
            </h2>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            {t({
              en: 'Get AI-powered pricing advice for your produce based on district market trends',
              te: 'జిల్లా మార్కెట్ ధోరణుల ఆధారంగా మీ ఉత్పత్తికి AI ధర సలహా పొందండి',
            })}
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              value={pcCommodity}
              onChange={(e) => setPcCommodity(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && runPriceCoach()}
              placeholder={t({ en: 'e.g. Tomatoes, Rice, Onions', te: 'ఉదా: టమాటాలు, బియ్యం, ఉల్లిపాయలు' })}
              className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            />
            <select
              value={pcDistrict}
              onChange={(e) => setPcDistrict(e.target.value)}
              className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white"
            >
              <option value="">{t({ en: 'Select District', te: 'జిల్లాను ఎంచుకోండి' })}</option>
              {priceCoachDistricts.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <button
              onClick={runPriceCoach}
              disabled={pcLoading}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {pcLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <TrendingUp className="w-4 h-4" />
              )}
              {t({ en: 'Get Advice', te: 'సలహా పొందండి' })}
            </button>
          </div>
          {pcResult && (
            <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-slate-700 animate-fade-in">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                <span className="text-xs font-semibold text-blue-600">
                  {t({ en: 'Price Advice', te: 'ధర సలహా' })}
                </span>
              </div>
              {renderPriceCoachResult(pcResult)}
            </div>
          )}
        </div>

        {/* Recent Bids */}
        {bids.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-800">
                {t({ en: 'Recent Bids', te: 'ఇటీవల బిడ్లు' })}
              </h2>
              <Link
                href="/farmer/bids"
                className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium transition-colors"
              >
                {t({ en: 'View all', te: 'అన్నీ చూడండి' })}
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="divide-y divide-slate-50">
              {bids.slice(0, 5).map((bid) => (
                <div
                  key={bid.id}
                  className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {lang === 'te' && bid.product?.titleTE ? bid.product.titleTE : bid.product?.title}
                    </p>
                    <p className="text-xs text-slate-400">
                      {t({ en: 'by', te: 'నుండి' })} {bid.buyer?.name}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <p className="text-primary-700 font-semibold text-sm">₹{bid.amount}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusBadge(bid.status)}`}>
                      {bid.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Orders */}
        {subOrders.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-800">
                {t({ en: 'Recent Orders', te: 'ఇటీవల ఆర్డర్లు' })}
              </h2>
              <Link
                href="/farmer/orders"
                className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium transition-colors"
              >
                {t({ en: 'View all', te: 'అన్నీ చూడండి' })}
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="divide-y divide-slate-50">
              {subOrders.slice(0, 5).map((so) => {
                const itemsSummary = so.items
                  .map((item) =>
                    lang === 'te' && item.product?.titleTE
                      ? item.product.titleTE
                      : item.product?.title
                  )
                  .join(', ');
                return (
                  <div
                    key={so.id}
                    className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-800 truncate">
                        {itemsSummary}
                      </p>
                      <p className="text-xs text-slate-400">
                        {t({ en: 'by', te: 'నుండి' })} {so.order?.buyer?.name} &middot;{' '}
                        {new Date(so.createdAt).toLocaleDateString(lang === 'te' ? 'te-IN' : 'en-IN', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <p className="text-primary-700 font-semibold text-sm">₹{so.amount.toLocaleString('en-IN')}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${orderStatusBadge(so.status)}`}>
                        {so.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick action links */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-slide-up">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="bg-white border border-slate-100 rounded-2xl p-5 text-center card-hover group"
              >
                <div className={`w-10 h-10 mx-auto mb-2 rounded-xl flex items-center justify-center bg-slate-50 group-hover:bg-slate-100 transition-colors ${link.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <p className="text-xs font-medium text-slate-700 group-hover:text-slate-900 transition-colors">
                  {t(link.label)}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
