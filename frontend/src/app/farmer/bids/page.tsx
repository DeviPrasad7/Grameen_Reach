'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { bidsApi, aiApi } from '@/lib/api';
import { useAuthStore, useLangStore } from '@/lib/store';

interface Bid {
  id: string; amount: number; status: string; message?: string;
  product: { id: string; title: string; unit: string };
  buyer: { name: string; email: string };
  createdAt: string;
}

const STATUS_COLOR: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  ACCEPTED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  COUNTERED: 'bg-blue-100 text-blue-700',
};

export default function FarmerBidsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { t } = useLangStore();
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [counterAmt, setCounterAmt] = useState('');
  const [counterMsg, setCounterMsg] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }
    if (user.role !== 'FARMER') { router.push('/'); return; }
    load();
  }, [user]);

  const load = () => { bidsApi.farmerBids().then((r) => setBids(r.data)).finally(() => setLoading(false)); };

  const respond = async (bidId: string, status: string) => {
    try {
      const actionMap: Record<string, string> = { ACCEPTED: 'ACCEPT', REJECTED: 'REJECT', COUNTERED: 'COUNTER' };
      await bidsApi.respond(bidId, {
        action: actionMap[status] || status,
        counterAmount: status === 'COUNTERED' ? Number(counterAmt) : undefined,
        counterMessage: counterMsg || undefined,
      });
      setToast(status === 'ACCEPTED'
        ? t({ en: 'Bid accepted!', te: 'బిడ్ ఆమోదించబడింది!' })
        : status === 'COUNTERED'
        ? t({ en: 'Counter sent!', te: 'కౌంటర్ పంపబడింది!' })
        : t({ en: 'Bid rejected', te: 'బిడ్ తిరస్కరించబడింది' }));
      setRespondingId(null); setCounterAmt(''); setCounterMsg(''); setAiSuggestion('');
      load();
    } catch { setToast(t({ en: 'Action failed', te: 'చర్య విఫలమైంది' })); }
    setTimeout(() => setToast(''), 3000);
  };

  const getAiCounter = async (bid: Bid) => {
    setAiLoading(true); setAiSuggestion('');
    try {
      const res = await aiApi.counterOffer({
        bid: { amount: bid.amount, message: bid.message },
        product: { title: bid.product.title, unit: bid.product.unit, fixedPrice: null, minBidPrice: bid.amount },
      });
      setAiSuggestion(res.data.result || res.data.response || t({ en: 'No suggestion available', te: 'సూచన అందుబాటులో లేదు' }));
    } catch {
      setAiSuggestion(t({ en: 'AI unavailable. Set GEMINI_API_KEY in .env', te: 'AI అందుబాటులో లేదు. .envలో GEMINI_API_KEY సెట్ చేయండి' }));
    } finally { setAiLoading(false); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">{t({ en: 'Loading bids...', te: 'బిడ్లు లోడ్ అవుతోంది...' })}</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">{t({ en: 'Incoming Bids', te: 'వచ్చిన బిడ్లు' })}</h1>

        {bids.length === 0 ? (
          <div className="bg-white rounded-2xl border p-12 text-center text-gray-400">
            <div className="text-4xl mb-2">🏷️</div>
            <p>{t({ en: 'No bids yet. Add bidding products to receive offers.', te: 'ఇంకా బిడ్లు లేవు. ఆఫర్లు అందుకోవడానికి బిడ్డింగ్ ఉత్పత్తులను జోడించండి.' })}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bids.map((bid) => (
              <div key={bid.id} className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-gray-800">{bid.product?.title}</p>
                    <p className="text-xs text-gray-400">
                      {t({ en: 'from', te: 'నుండి' })} {bid.buyer?.name} ({bid.buyer?.email}) &bull; {new Date(bid.createdAt).toLocaleDateString()}
                    </p>
                    {bid.message && <p className="text-sm text-gray-600 mt-1 italic">&quot;{bid.message}&quot;</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-primary-700">₹{bid.amount}<span className="text-xs font-normal text-gray-400">/{bid.product?.unit}</span></p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLOR[bid.status] || 'bg-gray-100 text-gray-600'}`}>{bid.status}</span>
                  </div>
                </div>

                {bid.status === 'PENDING' && (
                  <div className="border-t border-gray-100 pt-3 mt-3">
                    {respondingId === bid.id ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <input type="number" value={counterAmt} onChange={(e) => setCounterAmt(e.target.value)}
                            placeholder={t({ en: 'Counter amount (₹)', te: 'కౌంటర్ మొత్తం (₹)' })}
                            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
                          <input value={counterMsg} onChange={(e) => setCounterMsg(e.target.value)}
                            placeholder={t({ en: 'Message (optional)', te: 'సందేశం (ఐచ్ఛికం)' })}
                            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => respond(bid.id, 'ACCEPTED')} className="flex-1 py-2 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700">
                            {t({ en: 'Accept', te: 'ఆమోదించు' })}
                          </button>
                          <button onClick={() => respond(bid.id, 'COUNTERED')} disabled={!counterAmt} className="flex-1 py-2 bg-saffron-500 text-white rounded-lg text-sm font-semibold hover:bg-saffron-600 disabled:opacity-50">
                            {t({ en: 'Counter', te: 'కౌంటర్' })}
                          </button>
                          <button onClick={() => respond(bid.id, 'REJECTED')} className="flex-1 py-2 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600">
                            {t({ en: 'Reject', te: 'తిరస్కరించు' })}
                          </button>
                        </div>
                        <button onClick={() => getAiCounter(bid)} disabled={aiLoading}
                          className="w-full py-2 border border-primary-200 text-primary-600 rounded-lg text-xs hover:bg-primary-50 disabled:opacity-50">
                          {aiLoading ? '...' : t({ en: 'Ask AI for counter-offer suggestion', te: 'AI కౌంటర్-ఆఫర్ సూచన అడగండి' })}
                        </button>
                        {aiSuggestion && <div className="bg-primary-50 text-primary-700 text-xs p-3 rounded-lg whitespace-pre-wrap">{aiSuggestion}</div>}
                        <button onClick={() => setRespondingId(null)} className="text-xs text-gray-400 hover:text-gray-600">
                          {t({ en: 'Cancel', te: 'రద్దు' })}
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => { setRespondingId(bid.id); setAiSuggestion(''); setCounterAmt(''); setCounterMsg(''); }}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700">
                        {t({ en: 'Respond to Bid', te: 'బిడ్‌కు స్పందించు' })}
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      {toast && <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-lg shadow text-sm">{toast}</div>}
    </div>
  );
}
