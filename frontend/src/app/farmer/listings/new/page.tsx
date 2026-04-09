'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { productsApi, govtPricesApi, categoriesApi } from '@/lib/api';
import { useAuthStore, useLangStore } from '@/lib/store';
import toast from 'react-hot-toast';
import {
  Loader2, ArrowLeft, Package, DollarSign, MapPin, Image as ImageIcon,
  Leaf, Calendar, Award, ShoppingBag, Info,
} from 'lucide-react';

const UNITS = ['kg', 'quintal', 'bag', 'crate', 'bunch', 'litre', 'dozen'];
const GRADES = ['A', 'B', 'C'];

interface Category {
  id: string;
  name: string;
  nameTE: string;
  icon?: string;
}

export default function NewListingPage() {
  const router = useRouter();
  const { user, _hasHydrated } = useAuthStore();
  const { lang, t } = useLangStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({
    title: '',
    titleTE: '',
    description: '',
    descriptionTE: '',
    categoryId: '',
    unit: 'kg',
    priceType: 'FIXED',
    fixedPrice: '',
    minBidPrice: '',
    bidEndsAt: '',
    grade: 'A',
    organic: false,
    harvestDate: '',
    minQty: '1',
    availableQty: '',
    village: '',
    district: '',
    pincode: '',
    imageUrls: '',
  });
  const [priceHint, setPriceHint] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!user) { router.push('/auth/login'); return; }
    if (user.role !== 'FARMER') { router.push('/'); return; }
    categoriesApi.list()
      .then((r) => setCategories(r.data || []))
      .catch(() => {});
  }, [_hasHydrated, user, router]);

  const set = (key: string, value: unknown) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const fetchPriceHint = async () => {
    if (!form.title || !form.district) return;
    try {
      const res = await govtPricesApi.suggestions(form.title, form.district);
      const d = res.data;
      if (d && d.latestModal) {
        setPriceHint(
          t({
            en: `Mandi modal price: ₹${d.latestModal}/quintal. Suggested range: ₹${d.suggestedMin} – ₹${d.suggestedMax} per quintal.`,
            te: `మండి ధర: ₹${d.latestModal}/క్వింటాల్. సూచన: ₹${d.suggestedMin} – ₹${d.suggestedMax} క్వింటాల్‌కు.`,
          }),
        );
      }
    } catch {
      /* price hint is optional */
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        fixedPrice: form.fixedPrice ? Number(form.fixedPrice) : undefined,
        minBidPrice: form.minBidPrice ? Number(form.minBidPrice) : undefined,
        minQty: Number(form.minQty),
        availableQty: Number(form.availableQty),
        imageUrls: form.imageUrls
          ? form.imageUrls.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        harvestDate: form.harvestDate || undefined,
        bidEndsAt: form.bidEndsAt || undefined,
        description: form.description || undefined,
        descriptionTE: form.descriptionTE || undefined,
      };
      await productsApi.create(payload);
      toast.success(t({ en: 'Listing created successfully!', te: 'జాబితా విజయవంతంగా సృష్టించబడింది!' }));
      router.push('/farmer/listings');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      const errorText = Array.isArray(msg)
        ? msg.join(', ')
        : (msg || t({ en: 'Failed to create listing', te: 'జాబితా సృష్టించడం విఫలమైంది' }));
      toast.error(errorText);
    } finally {
      setLoading(false);
    }
  };

  // ── Pre-hydration spinner ──────────────────────────────────────────
  if (!_hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
      </div>
    );
  }

  const inputClass =
    'w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-shadow';
  const labelClass = 'block text-sm font-medium text-slate-700 mb-1.5';

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-700 via-primary-600 to-emerald-600 text-white">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center gap-3 animate-fade-in">
            <button
              onClick={() => router.back()}
              className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-2xl font-bold">
                {t({ en: 'Create New Listing', te: 'కొత్త జాబితా సృష్టించు' })}
              </h1>
              <p className="text-primary-200 text-sm mt-0.5">
                {t({ en: 'Fill in the details to list your produce', te: 'మీ ఉత్పత్తిని జాబితా చేయడానికి వివరాలు నమోదు చేయండి' })}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* ── Product Details ─────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4 animate-slide-up">
            <div className="flex items-center gap-2 mb-1">
              <Package className="w-5 h-5 text-primary-600" />
              <h2 className="font-semibold text-slate-800">
                {t({ en: 'Product Details', te: 'ఉత్పత్తి వివరాలు' })}
              </h2>
            </div>

            <div>
              <label className={labelClass}>
                {t({ en: 'Title (English)', te: 'శీర్షిక (ఆంగ్లం)' })} <span className="text-red-400">*</span>
              </label>
              <input
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                onBlur={fetchPriceHint}
                required
                placeholder={t({ en: 'e.g. Fresh Tomatoes', te: 'ఉదా: తాజా టమాటాలు' })}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>
                {t({ en: 'Title (Telugu)', te: 'శీర్షిక (తెలుగు)' })}
              </label>
              <input
                value={form.titleTE}
                onChange={(e) => set('titleTE', e.target.value)}
                placeholder="తాజా టమాటాలు"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>
                {t({ en: 'Description (English)', te: 'వివరణ (ఆంగ్లం)' })}
              </label>
              <textarea
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                rows={2}
                placeholder={t({ en: 'Describe your produce quality, freshness, etc.', te: 'మీ ఉత్పత్తి నాణ్యత, తాజాదనం మొదలైనవి వివరించండి' })}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>
                {t({ en: 'Description (Telugu)', te: 'వివరణ (తెలుగు)' })}
              </label>
              <textarea
                value={form.descriptionTE}
                onChange={(e) => set('descriptionTE', e.target.value)}
                rows={2}
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>
                  {t({ en: 'Category', te: 'వర్గం' })} <span className="text-red-400">*</span>
                </label>
                <select
                  value={form.categoryId}
                  onChange={(e) => set('categoryId', e.target.value)}
                  required
                  className={inputClass}
                >
                  <option value="">{t({ en: 'Select category...', te: 'వర్గం ఎంచుకోండి...' })}</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.icon} {lang === 'te' ? c.nameTE : c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>
                  <ShoppingBag className="w-3.5 h-3.5 inline mr-1" />
                  {t({ en: 'Unit', te: 'యూనిట్' })} <span className="text-red-400">*</span>
                </label>
                <select
                  value={form.unit}
                  onChange={(e) => set('unit', e.target.value)}
                  className={inputClass}
                >
                  {UNITS.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>
                  {t({ en: 'Available Qty', te: 'అందుబాటులో పరిమాణం' })} <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  value={form.availableQty}
                  onChange={(e) => set('availableQty', e.target.value)}
                  required
                  min="0"
                  placeholder="e.g. 100"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>
                  {t({ en: 'Min Order Qty', te: 'కనీస ఆర్డర్ పరిమాణం' })}
                </label>
                <input
                  type="number"
                  value={form.minQty}
                  onChange={(e) => set('minQty', e.target.value)}
                  min="1"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>
                  <Calendar className="w-3.5 h-3.5 inline mr-1" />
                  {t({ en: 'Harvest Date', te: 'కోత తేదీ' })}
                </label>
                <input
                  type="date"
                  value={form.harvestDate}
                  onChange={(e) => set('harvestDate', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>
                  <Award className="w-3.5 h-3.5 inline mr-1" />
                  {t({ en: 'Grade', te: 'గ్రేడ్' })}
                </label>
                <select
                  value={form.grade}
                  onChange={(e) => set('grade', e.target.value)}
                  className={inputClass}
                >
                  {GRADES.map((g) => (
                    <option key={g} value={g}>
                      {t({ en: `Grade ${g}`, te: `గ్రేడ్ ${g}` })}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <label className="flex items-center gap-2.5 cursor-pointer select-none py-1">
              <input
                type="checkbox"
                checked={form.organic}
                onChange={(e) => set('organic', e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-400"
              />
              <Leaf className="w-4 h-4 text-primary-500" />
              <span className="text-sm text-slate-700 font-medium">
                {t({ en: 'Organic product', te: 'సేంద్రీయ ఉత్పత్తి' })}
              </span>
            </label>
          </div>

          {/* ── Pricing ────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4 animate-slide-up" style={{ animationDelay: '100ms', animationFillMode: 'backwards' }}>
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-5 h-5 text-primary-600" />
              <h2 className="font-semibold text-slate-800">
                {t({ en: 'Pricing', te: 'ధర నిర్ణయం' })}
              </h2>
            </div>

            <div className="flex gap-2">
              {(['FIXED', 'BID', 'HYBRID'] as const).map((tp) => (
                <button
                  key={tp}
                  type="button"
                  onClick={() => set('priceType', tp)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                    form.priceType === tp
                      ? 'bg-primary-600 text-white border-primary-600 shadow-md'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-primary-300'
                  }`}
                >
                  {tp === 'FIXED'
                    ? t({ en: 'Fixed Price', te: 'స్థిర ధర' })
                    : tp === 'BID'
                      ? t({ en: 'Bidding', te: 'బిడ్డింగ్' })
                      : t({ en: 'Hybrid', te: 'హైబ్రిడ్' })}
                </button>
              ))}
            </div>

            {(form.priceType === 'FIXED' || form.priceType === 'HYBRID') && (
              <div className="animate-fade-in">
                <label className={labelClass}>
                  {t({ en: `Fixed Price (₹ per ${form.unit})`, te: `స్థిర ధర (₹ ప్రతి ${form.unit})` })} <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  value={form.fixedPrice}
                  onChange={(e) => set('fixedPrice', e.target.value)}
                  placeholder="e.g. 40"
                  className={inputClass}
                />
              </div>
            )}

            {(form.priceType === 'BID' || form.priceType === 'HYBRID') && (
              <div className="grid grid-cols-2 gap-4 animate-fade-in">
                <div>
                  <label className={labelClass}>
                    {t({ en: 'Min Bid (₹)', te: 'కనీస బిడ్ (₹)' })} <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    value={form.minBidPrice}
                    onChange={(e) => set('minBidPrice', e.target.value)}
                    placeholder="e.g. 30"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>
                    {t({ en: 'Bid Ends At', te: 'బిడ్ ముగింపు' })}
                  </label>
                  <input
                    type="datetime-local"
                    value={form.bidEndsAt}
                    onChange={(e) => set('bidEndsAt', e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            )}

            {priceHint && (
              <div className="flex items-start gap-2 bg-primary-50 border border-primary-100 text-primary-700 text-xs px-4 py-3 rounded-xl animate-fade-in">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{priceHint}</span>
              </div>
            )}
          </div>

          {/* ── Location & Images ──────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4 animate-slide-up" style={{ animationDelay: '200ms', animationFillMode: 'backwards' }}>
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="w-5 h-5 text-primary-600" />
              <h2 className="font-semibold text-slate-800">
                {t({ en: 'Location & Images', te: 'ప్రాంతం & చిత్రాలు' })}
              </h2>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>
                  {t({ en: 'Village', te: 'గ్రామం' })}
                </label>
                <input
                  value={form.village}
                  onChange={(e) => set('village', e.target.value)}
                  placeholder={t({ en: 'e.g. Anantapur', te: 'ఉదా: అనంతపురం' })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>
                  {t({ en: 'District', te: 'జిల్లా' })}
                </label>
                <input
                  value={form.district}
                  onChange={(e) => set('district', e.target.value)}
                  onBlur={fetchPriceHint}
                  placeholder={t({ en: 'e.g. Kurnool', te: 'ఉదా: కర్నూలు' })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>
                  {t({ en: 'Pincode', te: 'పిన్‌కోడ్' })}
                </label>
                <input
                  value={form.pincode}
                  onChange={(e) => set('pincode', e.target.value)}
                  placeholder="518001"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>
                <ImageIcon className="w-3.5 h-3.5 inline mr-1" />
                {t({ en: 'Image URLs (comma-separated)', te: 'చిత్రం URLలు (కామాతో వేరు చేయబడినవి)' })}
              </label>
              <input
                value={form.imageUrls}
                onChange={(e) => set('imageUrls', e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className={inputClass}
              />
              <p className="text-[11px] text-slate-400 mt-1.5">
                {t({ en: 'Paste one or more image URLs separated by commas', te: 'కామాలతో వేరు చేయబడిన ఒకటి లేదా అంతకంటే ఎక్కువ చిత్రం URLలను అతికించండి' })}
              </p>
            </div>
          </div>

          {/* ── Submit Button ──────────────────────────────────────── */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 text-sm shadow-lg shadow-primary-600/20"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t({ en: 'Creating listing...', te: 'జాబితా సృష్టిస్తోంది...' })}
              </>
            ) : (
              <>
                <Package className="w-4 h-4" />
                {t({ en: 'Create Listing', te: 'జాబితా సృష్టించు' })}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
