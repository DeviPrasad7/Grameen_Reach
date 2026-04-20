'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { bidsApi, aiApi } from '@/lib/api';
import { useAuthStore, useLangStore } from '@/lib/store';
import AiResponseRenderer, { extractAiResponseText } from '@/components/ui/AiResponseRenderer';
import toast from 'react-hot-toast';
import {
  Loader2, Gavel, Bot, Check, X, ArrowRightLeft,
  ChevronDown, ChevronUp, Send, Sparkles, MessageSquare,
} from 'lucide-react';

interface Bid {
  id: string;
  amount: number;
  status: string;
  message?: string;
  product: { id: string; title: string; titleTE?: string; unit: string; fixedPrice?: number; minBidPrice?: number };
  buyer: { name: string; email: string };
  createdAt: string;
}

const STATUS_COLOR: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  ACCEPTED: 'bg-primary-100 text-primary-700',
  REJECTED: 'bg-red-100 text-red-700',
  COUNTERED: 'bg-blue-100 text-blue-700',
};

const STATUS_TE: Record<string, string> = {
  PENDING: 'పెండింగ్',
  ACCEPTED: 'ఆమోదించబడింది',
  REJECTED: 'తిరస్కరించబడింది',
  COUNTERED: 'కౌంటర్ పంపబడింది',
};

export default function FarmerBidsPage() {
  const router = useRouter();
  const { user, _hasHydrated } = useAuthStore();
  const { lang, t } = useLangStore();
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [counterAmt, setCounterAmt] = useState('');
  const [counterMsg, setCounterMsg] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!user) { router.push('/auth/login'); return; }
    if (user.role !== 'FARMER') { router.push('/'); return; }
    loadBids();
  }, [_hasHydrated, user, router]);

  const loadBids = () => {
    bidsApi.farmerBids()
      .then((r) => setBids(r.data || []))
      .catch(() => toast.error(t({ en: 'Failed to load bids', te: 'బిడ్లు లోడ్ చేయడం విఫలమైంది' })))
      .finally(() => setLoading(false));
  };

  const respond = async (bidId: string, status: string) => {
    setActionLoading(true);
    try {
      const actionMap: Record<string, string> = {
        ACCEPTED: 'ACCEPT',
        REJECTED: 'REJECT',
        COUNTERED: 'COUNTER',
      };
      await bidsApi.respond(bidId, {
        action: actionMap[status] || status,
        counterAmount: status === 'COUNTERED' ? Number(counterAmt) : undefined,
        counterMessage: counterMsg || undefined,
      });
      const messages: Record<string, { en: string; te: string }> = {
        ACCEPTED: { en: 'Bid accepted!', te: 'బిడ్ ఆమోదించబడింది!' },
        COUNTERED: { en: 'Counter offer sent!', te: 'కౌంటర్ ఆఫర్ పంపబడింది!' },
        REJECTED: { en: 'Bid rejected', te: 'బిడ్ తిరస్కరించబడింది' },
      };
      toast.success(t(messages[status] || { en: 'Action completed', te: 'చర్య పూర్తయింది' }));
      setRespondingId(null);
      setCounterAmt('');
      setCounterMsg('');
      setAiSuggestion('');
      loadBids();
    } catch {
      toast.error(t({ en: 'Action failed. Please try again.', te: 'చర్య విఫలమైంది. దయచేసి మళ్ళీ ప్రయత్నించండి.' }));
    } finally {
      setActionLoading(false);
    }
  };

  const getAiCounter = async (bid: Bid) => {
    setAiLoading(true);
    setAiSuggestion('');
    try {
      const res = await aiApi.counterOffer({
        bid: { amount: bid.amount, message: bid.message },
        product: {
          title: bid.product.title,
          unit: bid.product.unit,
          fixedPrice: bid.product.fixedPrice || null,
          minBidPrice: bid.product.minBidPrice || bid.amount,
        },
      });
      setAiSuggestion(
        extractAiResponseText(res.data) || t({ en: 'No suggestion available', te: 'సూచన అందుబాటులో లేదు' }),
      );
    } catch {
      setAiSuggestion(
        t({ en: 'AI is temporarily unavailable.', te: 'AI తాత్కాలికంగా అందుబాటులో లేదు.' }),
      );
    } finally {
      setAiLoading(false);
    }
  };

  const openRespond = (bidId: string) => {
    setRespondingId(bidId);
    setCounterAmt('');
    setCounterMsg('');
    setAiSuggestion('');
  };

  // ── Pre-hydration spinner ──────────────────────────────────────────
  if (!_hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-700 via-primary-600 to-emerald-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <div className="animate-fade-in">
            <h1 className="text-2xl sm:text-3xl font-bold">
              {t({ en: 'Incoming Bids', te: 'వచ్చిన బిడ్లు' })}
            </h1>
            <p className="text-primary-200 text-sm mt-1">
              {t({ en: 'Review and respond to buyer offers', te: 'కొనుగోలుదారుల ఆఫర్లను సమీక్షించి స్పందించండి' })}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
            <p className="text-sm text-slate-400">{t({ en: 'Loading bids...', te: 'బిడ్లు లోడ్ అవుతోంది...' })}</p>
          </div>
        ) : bids.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center animate-fade-in">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-50 flex items-center justify-center">
              <Gavel className="w-8 h-8 text-amber-400" />
            </div>
            <p className="text-slate-500 mb-2 font-medium">
              {t({ en: 'No bids yet', te: 'ఇంకా బిడ్లు లేవు' })}
            </p>
            <p className="text-sm text-slate-400">
              {t({ en: 'Add bidding products to receive offers from buyers', te: 'కొనుగోలుదారుల నుండి ఆఫర్లు అందుకోవడానికి బిడ్డింగ్ ఉత్పత్తులను జోడించండి' })}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {bids.map((bid, idx) => {
              const isExpanded = respondingId === bid.id;
              const statusLabel = lang === 'te' ? STATUS_TE[bid.status] || bid.status : bid.status;
              return (
                <div
                  key={bid.id}
                  className="bg-white rounded-2xl border border-slate-100 overflow-hidden animate-slide-up"
                  style={{ animationDelay: `${idx * 50}ms`, animationFillMode: 'backwards' }}
                >
                  {/* Bid summary */}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-800">
                          {lang === 'te' && bid.product?.titleTE ? bid.product.titleTE : bid.product?.title}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {t({ en: 'from', te: 'నుండి' })} {bid.buyer?.name} ({bid.buyer?.email})
                          {' · '}
                          {new Date(bid.createdAt).toLocaleDateString()}
                        </p>
                        {bid.message && (
                          <p className="flex items-start gap-1.5 text-sm text-slate-600 mt-2 italic bg-slate-50 rounded-xl px-3 py-2">
                            <MessageSquare className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-slate-400" />
                            &quot;{bid.message}&quot;
                          </p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xl font-bold text-primary-700">
                          ₹{bid.amount}
                          <span className="text-xs font-normal text-slate-400">/{bid.product?.unit}</span>
                        </p>
                        <span className={`inline-block mt-1 text-[10px] px-2.5 py-0.5 rounded-full font-medium ${STATUS_COLOR[bid.status] || 'bg-slate-100 text-slate-600'}`}>
                          {statusLabel}
                        </span>
                      </div>
                    </div>

                    {/* Respond button for PENDING */}
                    {bid.status === 'PENDING' && !isExpanded && (
                      <div className="mt-4 pt-3 border-t border-slate-100">
                        <button
                          onClick={() => openRespond(bid.id)}
                          className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors"
                        >
                          <Send className="w-4 h-4" />
                          {t({ en: 'Respond to Bid', te: 'బిడ్‌కు స్పందించు' })}
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Expanded response panel */}
                  {bid.status === 'PENDING' && isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50/50 p-5 space-y-4 animate-slide-down">
                      {/* Counter inputs */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">
                            {t({ en: 'Counter Amount (₹)', te: 'కౌంటర్ మొత్తం (₹)' })}
                          </label>
                          <input
                            type="number"
                            value={counterAmt}
                            onChange={(e) => setCounterAmt(e.target.value)}
                            placeholder={t({ en: 'Your price', te: 'మీ ధర' })}
                            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">
                            {t({ en: 'Message (optional)', te: 'సందేశం (ఐచ్ఛికం)' })}
                          </label>
                          <input
                            value={counterMsg}
                            onChange={(e) => setCounterMsg(e.target.value)}
                            placeholder={t({ en: 'e.g. Best price for bulk', te: 'ఉదా: బల్క్‌కు ఉత్తమ ధర' })}
                            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent bg-white"
                          />
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => respond(bid.id, 'ACCEPTED')}
                          disabled={actionLoading}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 disabled:opacity-50 transition-colors"
                        >
                          {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                          {t({ en: 'Accept', te: 'ఆమోదించు' })}
                        </button>
                        <button
                          onClick={() => respond(bid.id, 'COUNTERED')}
                          disabled={actionLoading || !counterAmt}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-semibold hover:bg-amber-600 disabled:opacity-50 transition-colors"
                        >
                          {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRightLeft className="w-4 h-4" />}
                          {t({ en: 'Counter', te: 'కౌంటర్' })}
                        </button>
                        <button
                          onClick={() => respond(bid.id, 'REJECTED')}
                          disabled={actionLoading}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 disabled:opacity-50 transition-colors"
                        >
                          {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                          {t({ en: 'Reject', te: 'తిరస్కరించు' })}
                        </button>
                      </div>

                      {/* AI counter-offer suggestion */}
                      <button
                        onClick={() => getAiCounter(bid)}
                        disabled={aiLoading}
                        className="w-full flex items-center justify-center gap-2 py-2.5 border border-primary-200 text-primary-600 rounded-xl text-xs font-medium hover:bg-primary-50 disabled:opacity-50 transition-colors"
                      >
                        {aiLoading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Bot className="w-3.5 h-3.5" />
                        )}
                        {t({ en: 'Ask AI for counter-offer suggestion', te: 'AI కౌంటర్-ఆఫర్ సూచన అడగండి' })}
                      </button>

                      {aiSuggestion && (
                        <div className="bg-primary-50 border border-primary-100 rounded-xl p-4 animate-fade-in">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-primary-500" />
                              <span className="text-xs font-semibold text-primary-600">
                                {t({ en: 'AI Suggestion', te: 'AI సూచన' })}
                              </span>
                            </div>
                            {(() => {
                              const m = aiSuggestion.match(/₹\s*([0-9]+(?:\.[0-9]+)?)/);
                              const amt = m ? m[1] : null;
                              if (!amt) return null;
                              return (
                                <button
                                  type="button"
                                  onClick={() => setCounterAmt(amt)}
                                  className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors"
                                >
                                  {t({ en: `Use ₹${amt}`, te: `₹${amt} వాడు` })}
                                </button>
                              );
                            })()}
                          </div>
                          <AiResponseRenderer text={aiSuggestion} accentColor="primary" />
                        </div>
                      )}

                      {/* Collapse */}
                      <button
                        onClick={() => setRespondingId(null)}
                        className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors mx-auto"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                        {t({ en: 'Cancel', te: 'రద్దు' })}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
