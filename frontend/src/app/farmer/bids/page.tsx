'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { bidsApi, aiApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

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

  const load = () => {
    bidsApi.farmerBids()
      .then((r) => setBids(r.data))
      .finally(() => setLoading(false));
  };

  const respond = async (bidId: string, status: string) => {
    try {
      await bidsApi.respond(bidId, {
        status,
        counterAmount: status === 'COUNTERED' ? Number(counterAmt) : undefined,
        counterMessage: counterMsg || undefined,
      });
      setToast(status === 'ACCEPTED' ? 'Bid accepted!' : status === 'COUNTERED' ? 'Counter sent!' : 'Bid rejected');
      setRespondingId(null);
      setCounterAmt(''); setCounterMsg(''); setAiSuggestion('');
      load();
    } catch {
      setToast('Action failed');
    }
    setTimeout(() => setToast(''), 3000);
  };

  const getAiCounter = async (bid: Bid) => {
    setAiLoading(true); setAiSuggestion('');
    try {
      const res = await aiApi.counterOffer({
        productTitle: bid.product.title, buyerBid: bid.amount, unit: bid.product.unit,
      });
      setAiSuggestion(res.data.result || res.data.response || 'No suggestion available');
    } catch {
      setAiSuggestion('AI unavailable. Set GEMINI_API_KEY or GROQ_API_KEY in .env');
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading bids...</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Incoming Bids</h1>

        {bids.length === 0 ? (
          <div className="bg-white rounded-2xl border p-12 text-center text-gray-400">
            <div className="text-4xl mb-2">🏷️</div>
            <p>No bids yet. Add bidding products to receive offers.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bids.map((bid) => (
              <div key={bid.id} className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-gray-800">{bid.product?.title}</p>
                    <p className="text-xs text-gray-400">
                      from {bid.buyer?.name} ({bid.buyer?.email}) &bull;{' '}
                      {new Date(bid.createdAt).toLocaleDateString()}
                    </p>
                    {bid.message && (
                      <p className="text-sm text-gray-600 mt-1 italic">&quot;{bid.message}&quot;</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-primary-700">
                      &#8377;{bid.amount}<span className="text-xs font-normal text-gray-400">/{bid.product?.unit}</span>
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLOR[bid.status] || 'bg-gray-100 text-gray-600'}`}>
                      {bid.status}
                    </span>
                  </div>
                </div>

                {bid.status === 'PENDING' && (
                  <div className="border-t border-gray-100 pt-3 mt-3">
                    {respondingId === bid.id ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="number" value={counterAmt}
                            onChange={(e) => setCounterAmt(e.target.value)}
                            placeholder="Counter amount (Rs)"
                            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                          />
                          <input
                            value={counterMsg} onChange={(e) => setCounterMsg(e.target.value)}
                            placeholder="Message to buyer (optional)"
                            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => respond(bid.id, 'ACCEPTED')}
                            className="flex-1 py-2 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700">
                            Accept
                          </button>
                          <button onClick={() => respond(bid.id, 'COUNTERED')} disabled={!counterAmt}
                            className="flex-1 py-2 bg-saffron-500 text-white rounded-lg text-sm font-semibold hover:bg-saffron-600 disabled:opacity-50">
                            Counter
                          </button>
                          <button onClick={() => respond(bid.id, 'REJECTED')}
                            className="flex-1 py-2 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600">
                            Reject
                          </button>
                        </div>
                        <button
                          onClick={() => getAiCounter(bid)} disabled={aiLoading}
                          className="w-full py-2 border border-primary-200 text-primary-600 rounded-lg text-xs hover:bg-primary-50 disabled:opacity-50">
                          {aiLoading ? 'Thinking...' : 'Ask AI for counter-offer suggestion'}
                        </button>
                        {aiSuggestion && (
                          <div className="bg-primary-50 text-primary-700 text-xs p-3 rounded-lg whitespace-pre-wrap">{aiSuggestion}</div>
                        )}
                        <button onClick={() => setRespondingId(null)} className="text-xs text-gray-400 hover:text-gray-600">
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setRespondingId(bid.id); setAiSuggestion(''); setCounterAmt(''); setCounterMsg(''); }}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700">
                        Respond to Bid
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      {toast && (
        <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-lg shadow text-sm">{toast}</div>
      )}
    </div>
  );
}
