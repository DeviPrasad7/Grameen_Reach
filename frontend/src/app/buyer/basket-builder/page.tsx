'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { aiApi, productsApi, cartApi } from '@/lib/api';
import { useAuthStore, useLangStore, useCartCountStore } from '@/lib/store';
import AiResponseRenderer, { extractAiResponseText } from '@/components/ui/AiResponseRenderer';
import toast from 'react-hot-toast';
import { Bot, Sparkles, Loader2, IndianRupee, MapPin, MessageSquareText, ShoppingBasket, AlertCircle, RotateCcw, ArrowRight, Zap, Clock, Leaf, Plus, Minus, Check, Package, XCircle, Store } from 'lucide-react';

interface MatchedProduct {
  id: string;
  title: string;
  titleTE?: string;
  unit: string;
  fixedPrice?: number;
  minBidPrice?: number;
  priceType: string;
  minQty: number;
  availableQty: number;
  imageUrls: string[];
  district?: string;
  farmer: { name: string };
}

interface BasketItemMatch {
  suggested: string;  // name from AI
  qtyHint: string;    // "2 kg", "500g", etc.
  priceHint: string;  // "₹50"
  product: MatchedProduct | null;
}

const DISTRICTS = [
  'Hyderabad', 'Visakhapatnam', 'Vijayawada', 'Guntur', 'Warangal',
  'Tirupati', 'Kurnool', 'Nellore', 'Rajahmundry', 'Karimnagar',
  'Anantapur', 'Kadapa', 'Nizamabad', 'Mahbubnagar', 'Siddipet',
];

const QUICK_BUDGETS = [200, 500, 1000, 2000, 5000];

const PREFERENCE_TAGS = [
  { en: 'Vegetarian', te: 'శాఖాహారం', icon: '🥬' },
  { en: 'Organic Only', te: 'సేంద్రీయ మాత్రమే', icon: '🌿' },
  { en: 'Family of 4', te: '4 మంది కుటుంబం', icon: '👨‍👩‍👧‍👦' },
  { en: 'Seasonal Fruits', te: 'సీజనల్ పండ్లు', icon: '🍎' },
  { en: 'Weekly Groceries', te: 'వారపు సరుకులు', icon: '🛒' },
  { en: 'Festival Cooking', te: 'పండుగ వంట', icon: '🎉' },
  { en: 'Diabetic Friendly', te: 'మధుమేహానికి అనుకూలం', icon: '💚' },
  { en: 'High Protein', te: 'అధిక ప్రోటీన్', icon: '💪' },
];

interface BasketResult {
  response: string | null;
  model?: string;
  tokens?: number;
  durationMs?: number;
  error?: string;
}

export default function BasketBuilderPage() {
  const router = useRouter();
  const { user, _hasHydrated } = useAuthStore();
  const { t, lang } = useLangStore();
  const { setCount } = useCartCountStore();

  const [budget, setBudget] = useState('');
  const [district, setDistrict] = useState('');
  const [preferences, setPreferences] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BasketResult | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [matches, setMatches] = useState<BasketItemMatch[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [added, setAdded] = useState<Set<string>>(new Set());
  // Per-product quantity selected in the basket-match panel
  const [qtyByProduct, setQtyByProduct] = useState<Record<string, number>>({});

  const getQty = (p: MatchedProduct) => {
    const v = qtyByProduct[p.id];
    if (typeof v === 'number' && !Number.isNaN(v)) return v;
    return p.minQty || 1;
  };

  const clampQty = (p: MatchedProduct, v: number) => {
    const min = p.minQty || 1;
    const max = Math.max(min, p.availableQty);
    if (!Number.isFinite(v)) return min;
    if (v < min) return min;
    if (v > max) return max;
    return v;
  };

  const stepQty = (p: MatchedProduct, delta: number) => {
    const current = getQty(p);
    const next = clampQty(p, current + delta);
    setQtyByProduct((prev) => ({ ...prev, [p.id]: next }));
  };

  const setQtyInput = (p: MatchedProduct, raw: string) => {
    const n = Number(raw);
    setQtyByProduct((prev) => ({ ...prev, [p.id]: clampQty(p, n) }));
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  // Parse item rows out of a markdown table in the AI response
  const parseBasketItems = (text: string): Array<{ name: string; qty: string; price: string }> => {
    const items: Array<{ name: string; qty: string; price: string }> = [];
    const lines = text.split(/\r?\n/);
    for (const raw of lines) {
      const line = raw.trim();
      if (!line.startsWith('|') || !line.endsWith('|')) continue;
      const cells = line.split('|').map((c) => c.trim()).filter((c) => c.length > 0);
      if (cells.length < 2) continue;
      // Skip header and separator rows
      if (/^item$/i.test(cells[0])) continue;
      if (/^[-:]+$/.test(cells[0])) continue;
      const name = cells[0];
      const qty = cells[1] || '';
      const price = cells[2] || '';
      // Heuristic: item name shouldn't have pipes, should have at least one letter
      if (!/[a-zA-Zఅ-హ]/.test(name)) continue;
      items.push({ name, qty, price });
    }
    return items;
  };

  // Look up each suggested item in the product catalog
  const lookupProducts = async (items: Array<{ name: string; qty: string; price: string }>) => {
    setMatchesLoading(true);
    try {
      const results = await Promise.all(
        items.map(async (it) => {
          try {
            // Extract a clean keyword (strip parenthetical variations like "Brinjal (Eggplant)")
            const keyword = it.name.replace(/\s*\([^)]+\)\s*/g, '').split(/[,\/]/)[0].trim();
            const res = await productsApi.list({ search: keyword, limit: 3 });
            const list: MatchedProduct[] = res.data?.items || res.data || [];
            // Take best match — prefer in-stock
            const inStock = list.find((p) => p.availableQty > 0);
            return {
              suggested: it.name,
              qtyHint: it.qty,
              priceHint: it.price,
              product: inStock || list[0] || null,
            } as BasketItemMatch;
          } catch {
            return { suggested: it.name, qtyHint: it.qty, priceHint: it.price, product: null };
          }
        }),
      );
      setMatches(results);
    } finally {
      setMatchesLoading(false);
    }
  };

  const addSuggestedToCart = async (match: BasketItemMatch) => {
    if (!match.product || match.product.availableQty <= 0) return;
    if (!user) { router.push('/auth/login'); return; }
    const p = match.product;
    const qty = clampQty(p, getQty(p));
    setAdding(p.id);
    try {
      const res = await cartApi.addItem(p.id, qty);
      setCount(res.data?.items?.length || 0);
      setAdded((prev) => new Set(prev).add(p.id));
      toast.success(t({ en: `Added ${qty} ${p.unit} of ${p.title}`, te: `${p.title} ${qty} ${p.unit} జోడించబడింది` }));
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || t({ en: 'Failed to add', te: 'జోడించడం విఫలమైంది' }));
    } finally {
      setAdding(null);
    }
  };

  const addAllToCart = async () => {
    const available = matches.filter((m) => m.product && m.product.availableQty > 0 && !added.has(m.product.id));
    if (available.length === 0) return;
    for (const match of available) {
      await addSuggestedToCart(match);
    }
  };

  const buildPreferencesString = () => {
    const parts = [];
    if (selectedTags.length > 0) parts.push(selectedTags.join(', '));
    if (preferences.trim()) parts.push(preferences.trim());
    return parts.join('. ');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (!budget || !district) {
      toast.error(
        t({
          en: 'Please enter a budget and select a district',
          te: 'దయచేసి బడ్జెట్ నమోదు చేసి, జిల్లాను ఎంచుకోండి',
        }),
      );
      return;
    }

    setLoading(true);
    setResult(null);
    setMatches([]);
    setAdded(new Set());

    try {
      const res = await aiApi.basketBuilder({
        budget: Number(budget),
        district,
        preferences: buildPreferencesString(),
        prompt: `Budget: \u20B9${budget}, District: ${district}, Preferences: ${buildPreferencesString()}`,
      });

      const data = res.data;
      const responseText = extractAiResponseText(data);

      if (data.error || !responseText || responseText === '{}') {
        setResult({ response: null, error: data.error || 'Unknown error' });
        toast.error(
          t({
            en: 'AI could not build a basket. Please try again.',
            te: 'AI బాస్కెట్ నిర్మించలేకపోయింది. దయచేసి మళ్ళీ ప్రయత్నించండి.',
          }),
        );
      } else {
        setResult({
          response: responseText,
          model: data.model,
          tokens: data.tokens,
          durationMs: data.durationMs,
        });
        // Parse items out of the AI basket and look them up in the catalog
        const items = parseBasketItems(responseText);
        if (items.length > 0) lookupProducts(items);
        toast.success(
          t({
            en: 'Basket suggestion ready!',
            te: 'బాస్కెట్ సూచన సిద్ధంగా ఉంది!',
          }),
        );
      }
    } catch {
      toast.error(
        t({
          en: 'AI service is unavailable. Please try again later.',
          te: 'AI సేవ అందుబాటులో లేదు. దయచేసి తర్వాత మళ్ళీ ప్రయత్నించండి.',
        }),
      );
      setResult({
        response: null,
        error: t({
          en: 'AI service is currently unavailable. Please try again later.',
          te: 'AI సేవ ప్రస్తుతం అందుబాటులో లేదు. దయచేసి తర్వాత మళ్ళీ ప్రయత్నించండి.',
        }),
      });
    } finally {
      setLoading(false);
    }
  };

  if (!_hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-700 via-primary-600 to-emerald-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 left-10 text-6xl animate-float">🥬</div>
          <div className="absolute top-8 right-20 text-5xl animate-float-delayed">🍅</div>
          <div className="absolute bottom-2 left-1/3 text-4xl animate-float">🌾</div>
          <div className="absolute bottom-4 right-10 text-5xl animate-float-delayed">🥕</div>
        </div>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center animate-glow">
              <Sparkles className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              {t({ en: 'AI Basket Builder', te: 'AI బాస్కెట్ బిల్డర్' })}
            </h1>
          </div>
          <p className="text-primary-200 text-sm ml-[52px]">
            {t({
              en: 'Tell us your budget and preferences — AI will suggest the perfect basket of fresh produce',
              te: 'మీ బడ్జెట్ మరియు ప్రాధాన్యతలు చెప్పండి — AI తాజా ఉత్పత్తుల సరైన బాస్కెట్‌ను సూచిస్తుంది',
            })}
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Input Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-100 p-6 sm:p-8 animate-fade-in shadow-sm">
          <div className="space-y-6">
            {/* Budget */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                <IndianRupee className="w-4 h-4 text-primary-600" />
                {t({ en: 'Budget', te: 'బడ్జెట్' })}
              </label>

              {/* Quick budget pills */}
              <div className="flex flex-wrap gap-2 mb-3">
                {QUICK_BUDGETS.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setBudget(String(b))}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      budget === String(b)
                        ? 'bg-primary-600 text-white shadow-md shadow-primary-600/25 scale-105'
                        : 'bg-slate-100 text-slate-600 hover:bg-primary-50 hover:text-primary-700 hover:scale-105'
                    }`}
                  >
                    {'\u20B9'}{b.toLocaleString('en-IN')}
                  </button>
                ))}
              </div>

              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
                  {'\u20B9'}
                </span>
                <input
                  type="number"
                  min="1"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder={t({ en: 'Or enter custom budget', te: 'లేదా కస్టమ్ బడ్జెట్ నమోదు చేయండి' })}
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-shadow"
                />
              </div>
            </div>

            {/* District */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                <MapPin className="w-4 h-4 text-primary-600" />
                {t({ en: 'District', te: 'జిల్లా' })}
              </label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent transition-shadow bg-white"
              >
                <option value="">
                  {t({ en: 'Select your district', te: 'మీ జిల్లాను ఎంచుకోండి' })}
                </option>
                {DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Preference Tags */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                <Zap className="w-4 h-4 text-primary-600" />
                {t({ en: 'Quick Preferences', te: 'త్వరిత ప్రాధాన్యతలు' })}
              </label>
              <div className="flex flex-wrap gap-2">
                {PREFERENCE_TAGS.map((tag) => {
                  const label = t(tag);
                  const isSelected = selectedTags.includes(label);
                  return (
                    <button
                      key={tag.en}
                      type="button"
                      onClick={() => toggleTag(label)}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${
                        isSelected
                          ? 'bg-primary-100 text-primary-700 ring-2 ring-primary-300 shadow-sm scale-105'
                          : 'bg-slate-50 text-slate-600 hover:bg-primary-50 hover:text-primary-600 border border-slate-200 hover:border-primary-200'
                      }`}
                    >
                      <span className="text-base">{tag.icon}</span>
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Preferences */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                <MessageSquareText className="w-4 h-4 text-primary-600" />
                {t({ en: 'Additional Preferences', te: 'అదనపు ప్రాధాన్యతలు' })}
              </label>
              <textarea
                value={preferences}
                onChange={(e) => setPreferences(e.target.value)}
                rows={3}
                placeholder={t({
                  en: 'e.g., no bitter gourd, extra leafy greens, for a birthday party...',
                  te: 'ఉదా., కాకరకాయ వద్దు, ఎక్కువ ఆకుకూరలు, పుట్టినరోజు పార్టీ కోసం...',
                })}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent resize-none transition-shadow"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="group mt-6 w-full py-4 bg-gradient-to-r from-primary-600 to-emerald-600 text-white font-bold rounded-xl hover:from-primary-700 hover:to-emerald-700 disabled:opacity-50 transition-all duration-300 flex items-center justify-center gap-2.5 shadow-lg shadow-primary-600/25 hover:shadow-primary-600/40 hover:scale-[1.01] active:scale-[0.99]"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {t({ en: 'Building your basket...', te: 'మీ బాస్కెట్ నిర్మిస్తోంది...' })}
              </>
            ) : (
              <>
                <Bot className="w-5 h-5 group-hover:animate-bounce" />
                <Sparkles className="w-4 h-4" />
                {t({ en: 'Build My Basket', te: 'నా బాస్కెట్ నిర్మించు' })}
              </>
            )}
          </button>
        </form>

        {/* Loading State */}
        {loading && (
          <div className="mt-6 bg-white rounded-2xl border border-slate-100 p-8 text-center animate-fade-in shadow-sm">
            <div className="relative w-16 h-16 mx-auto mb-4">
              <div className="absolute inset-0 rounded-full border-4 border-primary-100"></div>
              <div className="absolute inset-0 rounded-full border-4 border-primary-600 border-t-transparent animate-spin"></div>
              <Bot className="absolute inset-0 m-auto w-6 h-6 text-primary-600" />
            </div>
            <p className="text-sm font-medium text-slate-600">
              {t({
                en: 'AI is analyzing local market prices and seasonal availability...',
                te: 'AI స్థానిక మార్కెట్ ధరలు మరియు సీజనల్ లభ్యతను విశ్లేషిస్తోంది...',
              })}
            </p>
            <div className="flex justify-center gap-1.5 mt-4">
              <div className="w-2 h-2 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 rounded-full bg-primary-600 animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}

        {/* Error Result */}
        {result && result.error && !loading && (
          <div className="mt-6 bg-white rounded-2xl border border-red-100 p-6 animate-slide-up shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 mb-1">
                  {t({ en: 'Could not build basket', te: 'బాస్కెట్ నిర్మించలేకపోయింది' })}
                </h3>
                <p className="text-sm text-slate-500">{result.error}</p>
                <button
                  onClick={() => setResult(null)}
                  className="mt-3 inline-flex items-center gap-1.5 text-sm text-primary-600 font-medium hover:text-primary-700 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  {t({ en: 'Try again', te: 'మళ్ళీ ప్రయత్నించండి' })}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success Result */}
        {result && result.response && !loading && (
          <div className="mt-6 animate-slide-up">
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
              {/* Result Header */}
              <div className="bg-gradient-to-r from-primary-50 via-emerald-50 to-primary-50 px-6 py-4 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
                      <ShoppingBasket className="w-4 h-4 text-primary-600" />
                    </div>
                    <h3 className="font-semibold text-slate-800">
                      {t({ en: 'Your AI-Curated Basket', te: 'మీ AI-క్యూరేటెడ్ బాస్కెట్' })}
                    </h3>
                  </div>
                  {result.model && (
                    <div className="flex items-center gap-3 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        {result.model}
                      </span>
                      {result.tokens && <span>{result.tokens} tokens</span>}
                      {result.durationMs && (
                        <span className="flex items-center gap-0.5">
                          <Clock className="w-3 h-3" />
                          {(result.durationMs / 1000).toFixed(1)}s
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Result Body - Using the shared AI Response Renderer */}
              <div className="px-6 py-5">
                <AiResponseRenderer text={result.response} accentColor="emerald" />
              </div>
            </div>

            {/* Matched-Products cart section */}
            {(matchesLoading || matches.length > 0) && (
              <div className="mt-6 bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                <div className="bg-gradient-to-r from-emerald-50 via-primary-50 to-emerald-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <Store className="w-4 h-4 text-emerald-700" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-800 text-sm sm:text-base">
                        {t({ en: 'Add from Grameen Reach Marketplace', te: 'గ్రామీణ్ రీచ్ మార్కెట్‌ప్లేస్ నుండి జోడించండి' })}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {matchesLoading
                          ? t({ en: 'Finding your items…', te: 'మీ వస్తువులను కనుగొంటోంది…' })
                          : t({
                              en: `${matches.filter((m) => m.product && m.product.availableQty > 0).length} of ${matches.length} items available nearby`,
                              te: `మీ సమీపంలో ${matches.length}లో ${matches.filter((m) => m.product && m.product.availableQty > 0).length} వస్తువులు అందుబాటులో ఉన్నాయి`,
                            })}
                      </p>
                    </div>
                  </div>
                  {!matchesLoading && matches.some((m) => m.product && m.product.availableQty > 0 && !added.has(m.product!.id)) && (
                    <button
                      onClick={addAllToCart}
                      className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 bg-primary-600 text-white rounded-xl text-xs font-semibold hover:bg-primary-700 transition-colors"
                    >
                      <ShoppingBasket className="w-3.5 h-3.5" />
                      {t({ en: 'Add all available', te: 'అన్నీ జోడించు' })}
                    </button>
                  )}
                </div>

                <div className="p-4 sm:p-6">
                  {matchesLoading ? (
                    <div className="flex items-center justify-center py-10 gap-2 text-sm text-slate-500">
                      <Loader2 className="w-4 h-4 animate-spin text-primary-600" />
                      {t({ en: 'Matching to live listings…', te: 'ప్రత్యక్ష జాబితాలతో సరిపోల్చుతోంది…' })}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {matches.map((m, i) => {
                        const p = m.product;
                        const inStock = !!p && p.availableQty > 0;
                        const isAdded = p ? added.has(p.id) : false;
                        const isAdding = p ? adding === p.id : false;
                        const displayPrice = p ? (p.fixedPrice ?? p.minBidPrice ?? 0) : 0;
                        const title = p ? (lang === 'te' && p.titleTE ? p.titleTE : p.title) : m.suggested;
                        const qty = p && inStock ? getQty(p) : 0;
                        const minQ = p?.minQty || 1;
                        const maxQ = p?.availableQty || 0;
                        const atMin = qty <= minQ;
                        const atMax = qty >= maxQ;
                        const lineTotal = p && inStock ? qty * displayPrice : 0;

                        return (
                          <div
                            key={i}
                            className={`relative rounded-2xl border transition-all ${
                              !p
                                ? 'border-slate-200 bg-slate-50/50'
                                : !inStock
                                ? 'border-slate-200 bg-slate-50/60'
                                : isAdded
                                ? 'border-emerald-300 bg-emerald-50/40'
                                : 'border-slate-200 bg-white hover:border-primary-300 hover:shadow-sm'
                            }`}
                          >
                            <div className="p-3 space-y-3">
                              {/* Top row: thumb + title + price */}
                              <div className="flex gap-3">
                                <div className={`relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 ${!inStock ? 'opacity-60' : ''} bg-slate-100`}>
                                  {p?.imageUrls?.[0] ? (
                                    <Image src={p.imageUrls[0]} alt={p.title} fill className="object-cover" unoptimized />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-2xl">
                                      {!p ? '❔' : '🥬'}
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <p className={`text-sm font-semibold truncate ${!p || !inStock ? 'text-slate-500' : 'text-slate-800'}`}>
                                      {title}
                                    </p>
                                    {p && (
                                      <span className={`text-sm font-bold whitespace-nowrap ${inStock ? 'text-primary-700' : 'text-slate-400'}`}>
                                        ₹{displayPrice}
                                        <span className="text-[10px] font-normal text-slate-400">/{p.unit}</span>
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                                    {p ? `${p.farmer?.name || '—'} · ${p.district || '—'}` : t({ en: 'Suggested by AI', te: 'AI సూచన' })}
                                    {m.qtyHint ? ` · ${t({ en: 'suggested', te: 'సూచన' })} ${m.qtyHint}` : ''}
                                  </p>
                                  {p && inStock && (
                                    <p className="text-[10px] text-slate-400 mt-0.5">
                                      {t({ en: `In stock: ${maxQ} ${p.unit} · min ${minQ}`, te: `స్టాక్: ${maxQ} ${p.unit} · కనిష్ట ${minQ}` })}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Bottom row: qty stepper + add OR unavailable state */}
                              {!p ? (
                                <div className="flex items-center gap-2 rounded-xl bg-slate-100 text-slate-500 text-xs font-medium px-3 py-2.5">
                                  <XCircle className="w-4 h-4 flex-shrink-0" />
                                  {t({ en: 'Not on marketplace yet', te: 'ఇంకా మార్కెట్‌ప్లేస్‌లో లేదు' })}
                                </div>
                              ) : !inStock ? (
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 rounded-xl bg-amber-50 text-amber-700 text-xs font-semibold px-3 py-2.5 flex-1">
                                    <XCircle className="w-4 h-4 flex-shrink-0" />
                                    {t({ en: 'Product not available', te: 'ఉత్పత్తి అందుబాటులో లేదు' })}
                                  </div>
                                  <Link
                                    href={`/buyer/browse/${p.id}`}
                                    className="inline-flex items-center gap-1 text-xs text-slate-500 font-medium hover:text-primary-600 transition-colors px-2 py-2"
                                  >
                                    <Package className="w-3.5 h-3.5" />
                                    {t({ en: 'View', te: 'చూడండి' })}
                                  </Link>
                                </div>
                              ) : (
                                <div className="flex items-center justify-between gap-2">
                                  <div className="inline-flex items-center rounded-xl border border-slate-200 bg-white overflow-hidden">
                                    <button
                                      type="button"
                                      onClick={() => stepQty(p, -1)}
                                      disabled={atMin}
                                      aria-label={t({ en: 'Decrease quantity', te: 'పరిమాణం తగ్గించు' })}
                                      className="w-8 h-9 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:text-slate-300 disabled:cursor-not-allowed transition-colors"
                                    >
                                      <Minus className="w-3.5 h-3.5" />
                                    </button>
                                    <input
                                      type="number"
                                      value={qty}
                                      min={minQ}
                                      max={maxQ}
                                      step={1}
                                      onChange={(e) => setQtyInput(p, e.target.value)}
                                      aria-label={t({ en: 'Quantity', te: 'పరిమాణం' })}
                                      className="w-12 h-9 text-center text-sm font-semibold text-slate-800 border-x border-slate-200 bg-white focus:outline-none focus:bg-slate-50"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => stepQty(p, 1)}
                                      disabled={atMax}
                                      aria-label={t({ en: 'Increase quantity', te: 'పరిమాణం పెంచు' })}
                                      className="w-8 h-9 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:text-slate-300 disabled:cursor-not-allowed transition-colors"
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                    </button>
                                  </div>

                                  <button
                                    onClick={() => addSuggestedToCart(m)}
                                    disabled={isAdding}
                                    className={`flex-1 inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-xl text-xs font-semibold transition-colors ${
                                      isAdded
                                        ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                                        : 'bg-primary-600 text-white hover:bg-primary-700'
                                    } disabled:opacity-60`}
                                  >
                                    {isAdding ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : isAdded ? (
                                      <Check className="w-3.5 h-3.5" />
                                    ) : (
                                      <ShoppingBasket className="w-3.5 h-3.5" />
                                    )}
                                    {isAdded
                                      ? t({ en: `Added · ₹${lineTotal}`, te: `జోడించబడింది · ₹${lineTotal}` })
                                      : t({ en: `Add · ₹${lineTotal}`, te: `జోడించు · ₹${lineTotal}` })}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  setResult(null);
                  setBudget('');
                  setDistrict('');
                  setPreferences('');
                  setSelectedTags([]);
                  setMatches([]);
                  setAdded(new Set());
                }}
                className="flex-1 py-3 border border-slate-200 text-slate-600 font-medium rounded-xl hover:border-primary-300 hover:text-primary-600 transition-all text-sm flex items-center justify-center gap-2 hover:shadow-sm"
              >
                <RotateCcw className="w-4 h-4" />
                {t({ en: 'Build Another', te: 'మరో బాస్కెట్' })}
              </button>
              <button
                onClick={() => router.push(added.size > 0 ? '/buyer/cart' : '/buyer/browse')}
                className="flex-1 py-3 bg-gradient-to-r from-primary-600 to-emerald-600 text-white font-medium rounded-xl hover:from-primary-700 hover:to-emerald-700 transition-all text-sm flex items-center justify-center gap-2 shadow-md shadow-primary-600/20 hover:shadow-lg"
              >
                {added.size > 0
                  ? t({ en: `Go to Cart (${added.size})`, te: `కార్ట్‌కు వెళ్ళండి (${added.size})` })
                  : t({ en: 'Browse Products', te: 'ఉత్పత్తులు చూడండి' })}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Empty state when no result */}
        {!result && !loading && (
          <div className="mt-10 text-center animate-fade-in">
            <div className="relative w-24 h-24 mx-auto mb-4">
              <div className="absolute inset-0 rounded-full bg-primary-50 animate-pulse-slow"></div>
              <div className="absolute inset-2 rounded-full bg-white flex items-center justify-center">
                <span className="text-4xl">🛒</span>
              </div>
            </div>
            <p className="text-sm text-slate-400 max-w-xs mx-auto leading-relaxed">
              {t({
                en: 'Enter your budget and preferences above to get AI-powered basket suggestions tailored for your district',
                te: 'AI ఆధారిత బాస్కెట్ సూచనలు పొందడానికి పైన మీ బడ్జెట్ మరియు ప్రాధాన్యతలు నమోదు చేయండి',
              })}
            </p>
            <div className="flex items-center justify-center gap-4 mt-6 text-xs text-slate-400">
              <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> {t({ en: 'Instant', te: 'తక్షణ' })}</span>
              <span className="flex items-center gap-1"><Leaf className="w-3 h-3" /> {t({ en: 'Seasonal', te: 'సీజనల్' })}</span>
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {t({ en: 'Local', te: 'స్థానిక' })}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
