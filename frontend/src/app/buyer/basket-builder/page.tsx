'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { aiApi } from '@/lib/api';
import { useAuthStore, useLangStore } from '@/lib/store';
import toast from 'react-hot-toast';
import { Bot, Sparkles, Loader2, IndianRupee, MapPin, MessageSquareText, ShoppingBasket, AlertCircle } from 'lucide-react';

const DISTRICTS = [
  'Hyderabad',
  'Visakhapatnam',
  'Vijayawada',
  'Guntur',
  'Warangal',
  'Tirupati',
  'Kurnool',
  'Nellore',
  'Rajahmundry',
  'Karimnagar',
];

interface BasketResult {
  response: string | null;
  model?: string;
  tokens?: number;
  error?: string;
}

export default function BasketBuilderPage() {
  const router = useRouter();
  const { user, _hasHydrated } = useAuthStore();
  const { t } = useLangStore();

  const [budget, setBudget] = useState('');
  const [district, setDistrict] = useState('');
  const [preferences, setPreferences] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BasketResult | null>(null);

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

    try {
      const res = await aiApi.basketBuilder({
        prompt: `Budget: \u20B9${budget}, District: ${district}, Preferences: ${preferences}`,
      });

      const data: BasketResult = res.data;

      if (data.error || !data.response) {
        setResult({ response: null, error: data.error || 'Unknown error' });
        toast.error(
          t({
            en: 'AI could not build a basket. Please try again.',
            te: 'AI బాస్కెట్ నిర్మించలేకపోయింది. దయచేసి మళ్ళీ ప్రయత్నించండి.',
          }),
        );
      } else {
        setResult(data);
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
      <div className="bg-gradient-to-r from-primary-700 via-primary-600 to-emerald-600 text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center gap-3 mb-1">
            <Sparkles className="w-7 h-7" />
            <h1 className="text-2xl sm:text-3xl font-bold">
              {t({ en: 'AI Basket Builder', te: 'AI బాస్కెట్ బిల్డర్' })}
            </h1>
          </div>
          <p className="text-primary-200 text-sm">
            {t({
              en: 'Tell us your budget and preferences — AI will suggest the perfect basket of fresh produce',
              te: 'మీ బడ్జెట్ మరియు ప్రాధాన్యతలు చెప్పండి — AI తాజా ఉత్పత్తుల సరైన బాస్కెట్‌ను సూచిస్తుంది',
            })}
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Input Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-100 p-6 sm:p-8 animate-fade-in">
          <div className="space-y-5">
            {/* Budget */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                <IndianRupee className="w-4 h-4 text-primary-600" />
                {t({ en: 'Budget', te: 'బడ్జెట్' })}
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
                  {'\u20B9'}
                </span>
                <input
                  type="number"
                  min="1"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder={t({ en: 'Enter your budget', te: 'మీ బడ్జెట్ నమోదు చేయండి' })}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
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
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
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

            {/* Preferences */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                <MessageSquareText className="w-4 h-4 text-primary-600" />
                {t({ en: 'Preferences', te: 'ప్రాధాన్యతలు' })}
              </label>
              <textarea
                value={preferences}
                onChange={(e) => setPreferences(e.target.value)}
                rows={3}
                placeholder={t({
                  en: 'e.g., vegetarian, seasonal fruits, for a family of 4',
                  te: 'ఉదా., శాఖాహారం, సీజనల్ పండ్లు, 4 మంది కుటుంబానికి',
                })}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent resize-none"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full py-3.5 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary-600/20"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {t({ en: 'Building your basket...', te: 'మీ బాస్కెట్ నిర్మిస్తోంది...' })}
              </>
            ) : (
              <>
                <Bot className="w-5 h-5" />
                <Sparkles className="w-4 h-4" />
                {t({ en: 'Build My Basket', te: 'నా బాస్కెట్ నిర్మించు' })}
              </>
            )}
          </button>
        </form>

        {/* Loading State */}
        {loading && (
          <div className="mt-6 bg-white rounded-2xl border border-slate-100 p-8 text-center animate-fade-in">
            <Loader2 className="w-10 h-10 animate-spin text-primary-600 mx-auto mb-4" />
            <p className="text-sm font-medium text-slate-600">
              {t({
                en: 'AI is analyzing your preferences and finding the best produce...',
                te: 'AI మీ ప్రాధాన్యతలను విశ్లేషిస్తోంది మరియు ఉత్తమ ఉత్పత్తులను కనుగొంటోంది...',
              })}
            </p>
          </div>
        )}

        {/* Error Result */}
        {result && result.error && !loading && (
          <div className="mt-6 bg-white rounded-2xl border border-red-100 p-6 animate-slide-up">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-slate-800 mb-1">
                  {t({
                    en: 'Could not build basket',
                    te: 'బాస్కెట్ నిర్మించలేకపోయింది',
                  })}
                </h3>
                <p className="text-sm text-slate-500">
                  {result.error}
                </p>
                <button
                  onClick={() => setResult(null)}
                  className="mt-3 text-sm text-primary-600 font-medium hover:text-primary-700 transition-colors"
                >
                  {t({ en: 'Try again', te: 'మళ్ళీ ప్రయత్నించండి' })}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success Result */}
        {result && result.response && !loading && (
          <div className="mt-6 animate-slide-up">
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              {/* Result Header */}
              <div className="bg-gradient-to-r from-primary-50 to-emerald-50 px-6 py-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <ShoppingBasket className="w-5 h-5 text-primary-600" />
                  <h3 className="font-semibold text-slate-800">
                    {t({
                      en: 'Your AI-Curated Basket',
                      te: 'మీ AI-క్యూరేటెడ్ బాస్కెట్',
                    })}
                  </h3>
                </div>
                {result.model && (
                  <p className="text-[11px] text-slate-400 mt-1">
                    {t({ en: 'Powered by', te: 'ఆధారితం' })} {result.model}
                    {result.tokens ? ` \u00B7 ${result.tokens} tokens` : ''}
                  </p>
                )}
              </div>

              {/* Result Body */}
              <div className="px-6 py-5">
                <div className="prose prose-sm prose-slate max-w-none text-slate-700 leading-relaxed">
                  {result.response.split('\n').map((line: string, i: number) => {
                    const trimmed = line.trim();
                    if (!trimmed) return <br key={i} />;
                    // Bold headers
                    if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
                      return <p key={i} className="font-bold text-slate-800 mt-3 mb-1">{trimmed.replace(/\*\*/g, '')}</p>;
                    }
                    // Bold prefix lines like **Label:** value
                    if (trimmed.startsWith('**')) {
                      const parts = trimmed.split('**').filter(Boolean);
                      return (
                        <p key={i} className="mt-1">
                          <span className="font-semibold text-slate-800">{parts[0]}</span>
                          {parts.slice(1).join('')}
                        </p>
                      );
                    }
                    // Bullet points
                    if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*')) {
                      return <p key={i} className="ml-4 before:content-['•'] before:mr-2 before:text-primary-500">{trimmed.replace(/^[•\-*]\s*/, '')}</p>;
                    }
                    // Table rows
                    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
                      if (trimmed.includes('---')) return null;
                      const cells = trimmed.split('|').filter(Boolean).map(c => c.trim());
                      return (
                        <div key={i} className="grid grid-cols-3 gap-2 py-1.5 border-b border-slate-100 text-sm">
                          {cells.map((cell, j) => (
                            <span key={j} className={j === 0 ? 'font-medium text-slate-800' : 'text-slate-600'}>{cell}</span>
                          ))}
                        </div>
                      );
                    }
                    return <p key={i}>{trimmed}</p>;
                  })}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  setResult(null);
                  setBudget('');
                  setDistrict('');
                  setPreferences('');
                }}
                className="flex-1 py-2.5 border border-slate-200 text-slate-600 font-medium rounded-xl hover:border-primary-300 hover:text-primary-600 transition-colors text-sm"
              >
                {t({ en: 'Build Another Basket', te: 'మరో బాస్కెట్ నిర్మించు' })}
              </button>
              <button
                onClick={() => router.push('/buyer/browse')}
                className="flex-1 py-2.5 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-colors text-sm"
              >
                {t({ en: 'Browse Products', te: 'ఉత్పత్తులు చూడండి' })}
              </button>
            </div>
          </div>
        )}

        {/* Empty state when no result */}
        {!result && !loading && (
          <div className="mt-8 text-center animate-fade-in">
            <div className="text-6xl mb-4">🛒</div>
            <p className="text-sm text-slate-400">
              {t({
                en: 'Enter your budget and preferences above to get AI-powered basket suggestions',
                te: 'AI ఆధారిత బాస్కెట్ సూచనలు పొందడానికి పైన మీ బడ్జెట్ మరియు ప్రాధాన్యతలు నమోదు చేయండి',
              })}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
