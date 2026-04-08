'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { productsApi, cartApi, bidsApi } from '@/lib/api';
import { useAuthStore, useLangStore } from '@/lib/store';

interface Product {
  id: string;
  title: string;
  titleTE?: string;
  description?: string;
  descriptionTE?: string;
  fixedPrice?: number;
  minBidPrice?: number;
  autoBidAccept?: number;
  bidEndsAt?: string;
  priceType: string;
  unit: string;
  availableQty: number;
  minQty: number;
  grade?: string;
  organic: boolean;
  moisture?: number;
  harvestDate?: string;
  imageUrls: string[];
  district?: string;
  village?: string;
  farmer: { id: string; name: string; farmerProfile?: { district: string; verificationLevel: string } };
  category: { name: string; nameTE?: string };
  bids?: { id: string; amount: number; status: string; buyer: { name: string } }[];
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const { lang, t } = useLangStore();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [bidAmount, setBidAmount] = useState('');
  const [bidMessage, setBidMessage] = useState('');
  const [toast, setToast] = useState('');
  const [adding, setAdding] = useState(false);
  const [bidding, setBidding] = useState(false);

  useEffect(() => {
    if (params?.id) {
      productsApi.get(params.id as string)
        .then((r) => { setProduct(r.data); setQty(r.data.minQty || 1); })
        .catch(() => router.push('/buyer/browse'))
        .finally(() => setLoading(false));
    }
  }, [params?.id]);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const addToCart = async () => {
    if (!user) { router.push('/auth/login'); return; }
    setAdding(true);
    try { await cartApi.addItem(product!.id, qty); showToast(t({ en: 'Added to cart!', te: 'కార్ట్‌కు జోడించబడింది!' })); }
    catch { showToast(t({ en: 'Failed to add to cart', te: 'కార్ట్‌కు జోడించడం విఫలమైంది' })); }
    finally { setAdding(false); }
  };

  const placeBid = async () => {
    if (!user) { router.push('/auth/login'); return; }
    if (!bidAmount) { showToast(t({ en: 'Enter bid amount', te: 'బిడ్ మొత్తం నమోదు చేయండి' })); return; }
    setBidding(true);
    try {
      const res = await bidsApi.place({ productId: product!.id, amount: Number(bidAmount), message: bidMessage || undefined });
      showToast(res.data?.autoAccepted
        ? t({ en: 'Bid auto-accepted!', te: 'బిడ్ ఆటో-ఆమోదించబడింది!' })
        : t({ en: 'Bid placed! Farmer will respond.', te: 'బిడ్ పెట్టబడింది! రైతు స్పందిస్తారు.' }));
      setBidAmount(''); setBidMessage('');
      const updated = await productsApi.get(product!.id);
      setProduct(updated.data);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      showToast(msg || t({ en: 'Failed to place bid', te: 'బిడ్ పెట్టడం విఫలమైంది' }));
    } finally { setBidding(false); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">{t({ en: 'Loading...', te: 'లోడ్ అవుతోంది...' })}</div>;
  if (!product) return <div className="min-h-screen flex items-center justify-center text-gray-400">{t({ en: 'Product not found', te: 'ఉత్పత్తి కనుగొనబడలేదు' })}</div>;

  const canBid = product.priceType === 'BID' || product.priceType === 'HYBRID';
  const canBuy = product.priceType === 'FIXED' || product.priceType === 'HYBRID';
  const title = lang === 'te' && product.titleTE ? product.titleTE : product.title;
  const desc = lang === 'te' && product.descriptionTE ? product.descriptionTE : product.description;
  const catName = lang === 'te' && product.category?.nameTE ? product.category.nameTE : product.category?.name;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => router.back()} className="text-sm text-gray-400 hover:text-gray-600 mb-4 block">
          {t({ en: '← Back', te: '← వెనుకకు' })}
        </button>
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="relative h-64 md:h-80 bg-gray-100">
            {product.imageUrls?.[0] ? (
              <Image src={product.imageUrls[0]} alt={product.title} fill className="object-cover" unoptimized />
            ) : (
              <div className="flex items-center justify-center h-full text-6xl">🥬</div>
            )}
            <div className="absolute top-4 right-4 flex gap-2">
              {product.organic && <span className="bg-primary-500 text-white text-xs px-3 py-1 rounded-full font-medium">{t({ en: 'Organic', te: 'సేంద్రీయ' })}</span>}
              <span className="bg-white text-gray-700 text-xs px-3 py-1 rounded-full border font-medium">{product.priceType}</span>
            </div>
          </div>

          <div className="p-6 md:p-8">
            <div className="md:flex md:gap-8">
              <div className="flex-1">
                <p className="text-xs text-gray-400 mb-1">{catName}</p>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
                {desc && <p className="text-gray-600 text-sm mb-4">{desc}</p>}
                <div className="grid grid-cols-2 gap-3 text-sm mb-6">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <span className="text-gray-400 text-xs">{t({ en: 'Farmer', te: 'రైతు' })}</span>
                    <p className="font-medium text-gray-800">{product.farmer?.name}</p>
                    {product.farmer?.farmerProfile?.verificationLevel === 'LEVEL_1' && <span className="text-xs text-green-600">{t({ en: 'Verified', te: 'ధృవీకరించబడింది' })}</span>}
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <span className="text-gray-400 text-xs">{t({ en: 'Location', te: 'ప్రాంతం' })}</span>
                    <p className="font-medium text-gray-800">{product.village || product.district}</p>
                  </div>
                  {product.grade && <div className="bg-gray-50 rounded-lg p-3"><span className="text-gray-400 text-xs">{t({ en: 'Grade', te: 'గ్రేడ్' })}</span><p className="font-medium text-gray-800">{product.grade}</p></div>}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <span className="text-gray-400 text-xs">{t({ en: 'Available', te: 'అందుబాటులో' })}</span>
                    <p className="font-medium text-gray-800">{product.availableQty} {product.unit}</p>
                  </div>
                  {product.harvestDate && <div className="bg-gray-50 rounded-lg p-3"><span className="text-gray-400 text-xs">{t({ en: 'Harvest Date', te: 'కోత తేదీ' })}</span><p className="font-medium text-gray-800">{new Date(product.harvestDate).toLocaleDateString()}</p></div>}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <span className="text-gray-400 text-xs">{t({ en: 'Min Order', te: 'కనీస ఆర్డర్' })}</span>
                    <p className="font-medium text-gray-800">{product.minQty} {product.unit}</p>
                  </div>
                </div>
              </div>

              <div className="md:w-80 space-y-4">
                {canBuy && (
                  <div className="bg-primary-50 rounded-xl p-5 border border-primary-100">
                    <p className="text-sm text-gray-500 mb-1">{t({ en: 'Buy Now Price', te: 'ఇప్పుడే కొనండి' })}</p>
                    <p className="text-3xl font-bold text-primary-700 mb-1">₹{product.fixedPrice}<span className="text-sm font-normal text-gray-400">/{product.unit}</span></p>
                    <div className="flex items-center gap-2 mt-3">
                      <label className="text-sm text-gray-600">{t({ en: 'Qty:', te: 'పరిమాణం:' })}</label>
                      <input type="number" value={qty} onChange={(e) => setQty(Math.max(product.minQty, Number(e.target.value)))} min={product.minQty} max={product.availableQty} className="w-20 border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400" />
                      <span className="text-sm text-gray-400">{product.unit}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">{t({ en: 'Total:', te: 'మొత్తం:' })} <span className="font-semibold text-primary-700">₹{(product.fixedPrice! * qty).toFixed(0)}</span></p>
                    <button onClick={addToCart} disabled={adding} className="w-full mt-3 py-2.5 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50 transition-colors">
                      {adding ? '...' : t({ en: 'Add to Cart', te: 'కార్ట్‌కు జోడించు' })}
                    </button>
                  </div>
                )}
                {canBid && (
                  <div className="bg-saffron-400/10 rounded-xl p-5 border border-saffron-400/30">
                    <p className="text-sm text-gray-500 mb-1">{t({ en: 'Place a Bid', te: 'బిడ్ పెట్టండి' })}</p>
                    <p className="text-sm text-gray-600 mb-3">{t({ en: 'Min bid:', te: 'కనీస బిడ్:' })} <span className="font-semibold">₹{product.minBidPrice}/{product.unit}</span></p>
                    <input type="number" value={bidAmount} onChange={(e) => setBidAmount(e.target.value)} placeholder={`₹${product.minBidPrice}`} className="w-full border rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-saffron-400" />
                    <input value={bidMessage} onChange={(e) => setBidMessage(e.target.value)} placeholder={t({ en: 'Message (optional)', te: 'సందేశం (ఐచ్ఛికం)' })} className="w-full border rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-saffron-400" />
                    <button onClick={placeBid} disabled={bidding} className="w-full py-2.5 bg-saffron-500 text-white rounded-lg font-semibold hover:bg-saffron-600 disabled:opacity-50 transition-colors">
                      {bidding ? '...' : t({ en: 'Place Bid', te: 'బిడ్ పెట్టండి' })}
                    </button>
                  </div>
                )}
                {canBid && product.bids && product.bids.length > 0 && (
                  <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <p className="text-sm font-semibold text-gray-700 mb-3">{t({ en: 'Top Bids', te: 'టాప్ బిడ్లు' })}</p>
                    <div className="space-y-2">
                      {product.bids.map((bid) => (
                        <div key={bid.id} className="flex justify-between items-center text-sm py-1.5 border-b border-gray-50 last:border-0">
                          <span className="text-gray-600">{bid.buyer?.name}</span>
                          <div className="text-right">
                            <span className="font-semibold text-primary-700">₹{bid.amount}</span>
                            <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${bid.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : bid.status === 'ACCEPTED' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{bid.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {toast && <div className="fixed bottom-4 right-4 bg-primary-700 text-white px-4 py-2 rounded-lg shadow-lg text-sm">{toast}</div>}
    </div>
  );
}
