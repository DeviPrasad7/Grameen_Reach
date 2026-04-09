'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { productsApi, cartApi, bidsApi, aiApi, govtPricesApi } from '@/lib/api';
import { useAuthStore, useLangStore, useCartCountStore } from '@/lib/store';
import toast from 'react-hot-toast';
import { ArrowLeft, ShoppingCart, Gavel, Leaf, MapPin, Award, Calendar, Package, ShieldCheck, Loader2, Share2, Heart, Copy, Check, Bot, MessageSquare, Send, ChevronDown, ChevronUp } from 'lucide-react';

interface Product {
  id: string;
  title: string; titleTE?: string;
  description?: string; descriptionTE?: string;
  fixedPrice?: number; minBidPrice?: number; autoBidAccept?: number; bidEndsAt?: string;
  priceType: string; unit: string; availableQty: number; minQty: number;
  grade?: string; organic: boolean; moisture?: number; harvestDate?: string;
  imageUrls: string[]; district?: string; village?: string;
  farmer: { id: string; name: string; farmerProfile?: { district: string; verificationLevel: string } };
  category: { id: string; name: string; nameTE?: string };
  bids?: { id: string; amount: number; status: string; buyer: { name: string } }[];
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const { lang, t } = useLangStore();
  const { setCount } = useCartCountStore();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [bidAmount, setBidAmount] = useState('');
  const [bidMessage, setBidMessage] = useState('');
  const [adding, setAdding] = useState(false);
  const [bidding, setBidding] = useState(false);
  const [imgIdx, setImgIdx] = useState(0);
  const [copied, setCopied] = useState(false);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [priceComparison, setPriceComparison] = useState<{ minPrice?: number; maxPrice?: number; modalPrice?: number } | null>(null);
  const [aiInsightOpen, setAiInsightOpen] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [enquiryMsg, setEnquiryMsg] = useState('');
  const [enquirySending, setEnquirySending] = useState(false);

  useEffect(() => {
    if (params?.id) {
      productsApi.get(params.id as string)
        .then((r) => { setProduct(r.data); setQty(r.data.minQty || 1); })
        .catch(() => router.push('/buyer/browse'))
        .finally(() => setLoading(false));
    }
  }, [params?.id]);

  // Fetch similar products and price comparison when product is loaded
  useEffect(() => {
    if (!product) return;
    // Similar products
    if (product.category?.id) {
      productsApi.list({ categoryId: product.category.id })
        .then((r) => {
          const items: Product[] = r.data?.items || r.data || [];
          setSimilarProducts(items.filter((p) => p.id !== product.id).slice(0, 4));
        })
        .catch(() => {});
    }
    // Price comparison
    if (product.priceType === 'FIXED' && product.district) {
      govtPricesApi.comparison(product.title, product.district)
        .then((r) => {
          if (r.data && (r.data.minPrice || r.data.maxPrice || r.data.modalPrice)) {
            setPriceComparison(r.data);
          }
        })
        .catch(() => {});
    }
  }, [product?.id]);

  const addToCart = async () => {
    if (!user) { router.push('/auth/login'); return; }
    setAdding(true);
    try {
      const res = await cartApi.addItem(product!.id, qty);
      setCount(res.data?.items?.length || 0);
      toast.success(t({ en: 'Added to cart!', te: 'కార్ట్‌కు జోడించబడింది!' }));
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || t({ en: 'Failed to add to cart', te: 'కార్ట్‌కు జోడించడం విఫలమైంది' }));
    } finally { setAdding(false); }
  };

  const placeBid = async () => {
    if (!user) { router.push('/auth/login'); return; }
    if (!bidAmount) { toast.error(t({ en: 'Enter bid amount', te: 'బిడ్ మొత్తం నమోదు చేయండి' })); return; }
    setBidding(true);
    try {
      const res = await bidsApi.place({ productId: product!.id, amount: Number(bidAmount), message: bidMessage || undefined });
      toast.success(res.data?.autoAccepted
        ? t({ en: 'Bid auto-accepted!', te: 'బిడ్ ఆటో-ఆమోదించబడింది!' })
        : t({ en: 'Bid placed! Farmer will respond.', te: 'బిడ్ పెట్టబడింది! రైతు స్పందిస్తారు.' }));
      setBidAmount(''); setBidMessage('');
      const updated = await productsApi.get(product!.id);
      setProduct(updated.data);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || t({ en: 'Failed to place bid', te: 'బిడ్ పెట్టడం విఫలమైంది' }));
    } finally { setBidding(false); }
  };

  const shareProduct = async () => {
    const url = window.location.href;
    const text = `${product?.title} - ₹${product?.fixedPrice || product?.minBidPrice}/${product?.unit} on Grameen Reach`;
    if (navigator.share) {
      try {
        await navigator.share({ title: product?.title, text, url });
      } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success(t({ en: 'Link copied!', te: 'లింక్ కాపీ అయింది!' }));
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const fetchAiInsight = async () => {
    if (aiInsight) return; // already fetched
    setAiLoading(true);
    setAiError(false);
    try {
      const res = await aiApi.priceCoach({
        commodity: product!.title,
        district: product!.district || 'Hyderabad',
      });
      setAiInsight(res.data?.response || res.data?.text || JSON.stringify(res.data));
    } catch {
      setAiError(true);
    } finally {
      setAiLoading(false);
    }
  };

  const handleEnquiry = async () => {
    if (!enquiryMsg.trim()) {
      toast.error(t({ en: 'Please enter a message', te: 'దయచేసి సందేశం నమోదు చేయండి' }));
      return;
    }
    setEnquirySending(true);
    // Simulated delay for UI placeholder
    await new Promise((r) => setTimeout(r, 600));
    toast.success(t({ en: 'Enquiry sent!', te: 'విచారణ పంపబడింది!' }));
    setEnquiryMsg('');
    setContactOpen(false);
    setEnquirySending(false);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
    </div>
  );
  if (!product) return (
    <div className="min-h-screen flex items-center justify-center text-slate-400">
      {t({ en: 'Product not found', te: 'ఉత్పత్తి కనుగొనబడలేదు' })}
    </div>
  );

  const canBid = product.priceType === 'BID' || product.priceType === 'HYBRID';
  const canBuy = product.priceType === 'FIXED' || product.priceType === 'HYBRID';
  const title = lang === 'te' && product.titleTE ? product.titleTE : product.title;
  const desc = lang === 'te' && product.descriptionTE ? product.descriptionTE : product.description;
  const catName = lang === 'te' && product.category?.nameTE ? product.category.nameTE : product.category?.name;
  const images = product.imageUrls?.length > 0 ? product.imageUrls : [];

  const bidStatusColor: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-700', ACCEPTED: 'bg-green-100 text-green-700',
    REJECTED: 'bg-red-100 text-red-700', COUNTERED: 'bg-blue-100 text-blue-700',
  };

  return (
    <div className="min-h-screen bg-slate-50 py-6 px-4">
      <div className="max-w-5xl mx-auto">
        <Link href="/buyer/browse" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 mb-5 transition-colors">
          <ArrowLeft className="w-4 h-4" /> {t({ en: 'Back to products', te: 'ఉత్పత్తులకు తిరిగి' })}
        </Link>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm animate-slide-up">
          {/* Image section */}
          <div className="relative h-64 sm:h-80 bg-slate-100">
            {images.length > 0 ? (
              <Image src={images[imgIdx] || images[0]} alt={product.title} fill className="object-cover" unoptimized />
            ) : (
              <div className="flex items-center justify-center h-full text-7xl">🥬</div>
            )}
            <div className="absolute top-4 right-4 flex gap-2">
              {product.organic && (
                <span className="flex items-center gap-1 bg-green-500 text-white text-xs px-3 py-1 rounded-full font-medium shadow-sm">
                  <Leaf className="w-3.5 h-3.5" /> {t({ en: 'Organic', te: 'సేంద్రీయ' })}
                </span>
              )}
              <span className={`text-xs px-3 py-1 rounded-full font-semibold shadow-sm ${
                product.priceType === 'FIXED' ? 'bg-emerald-100 text-emerald-700' :
                product.priceType === 'BID' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
              }`}>{product.priceType}</span>
            </div>
            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {images.map((_, i) => (
                  <button key={i} onClick={() => setImgIdx(i)}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${i === imgIdx ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/75'}`} />
                ))}
              </div>
            )}
          </div>

          <div className="p-6 sm:p-8">
            <div className="lg:flex lg:gap-10">
              {/* Left: Product info */}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-primary-600 font-medium mb-1">{catName}</p>
                <div className="flex items-start justify-between gap-4">
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">{title}</h1>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={shareProduct}
                      className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:text-primary-600 hover:border-primary-300 transition-all"
                      title={t({ en: 'Share', te: 'షేర్' })}
                    >
                      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                {desc && <p className="text-slate-600 text-sm leading-relaxed mb-4">{desc}</p>}

                {/* Freshness & Organic badges */}
                {(product.organic || (product.harvestDate && (Date.now() - new Date(product.harvestDate).getTime()) <= 7 * 24 * 60 * 60 * 1000)) && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {product.harvestDate && (Date.now() - new Date(product.harvestDate).getTime()) <= 7 * 24 * 60 * 60 * 1000 && (
                      <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 border border-green-200 text-xs font-semibold px-3 py-1.5 rounded-full">
                        <Calendar className="w-3.5 h-3.5" />
                        {t({ en: 'Harvested Fresh', te: 'తాజాగా పండించబడింది' })}
                      </span>
                    )}
                    {product.organic && (
                      <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold px-3 py-1.5 rounded-full">
                        <Leaf className="w-3.5 h-3.5" />
                        {t({ en: 'Certified Organic', te: 'ధృవీకరించిన సేంద్రీయ' })}
                      </span>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                  {[
                    { icon: ShieldCheck, label: { en: 'Farmer', te: 'రైతు' }, value: product.farmer?.name, badge: product.farmer?.farmerProfile?.verificationLevel === 'LEVEL_1' ? t({ en: 'Verified', te: 'ధృవీకరించబడింది' }) : undefined },
                    { icon: MapPin, label: { en: 'Location', te: 'ప్రాంతం' }, value: product.village ? `${product.village}, ${product.district}` : product.district },
                    { icon: Award, label: { en: 'Grade', te: 'గ్రేడ్' }, value: product.grade || '—' },
                    { icon: Package, label: { en: 'Available', te: 'అందుబాటులో' }, value: `${product.availableQty} ${product.unit}` },
                    ...(product.harvestDate ? [{ icon: Calendar, label: { en: 'Harvest', te: 'కోత' }, value: new Date(product.harvestDate).toLocaleDateString() }] : []),
                    { icon: Package, label: { en: 'Min Order', te: 'కనీస ఆర్డర్' }, value: `${product.minQty} ${product.unit}` },
                  ].map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <div key={i} className="bg-slate-50 rounded-xl p-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Icon className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-[10px] text-slate-400 uppercase tracking-wide">{t(item.label)}</span>
                        </div>
                        <p className="font-medium text-slate-800 text-sm">{item.value}</p>
                        {item.badge && <span className="text-[10px] text-green-600 font-medium">{item.badge}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right: Buy/Bid actions */}
              <div className="lg:w-80 space-y-4 mt-6 lg:mt-0">
                {canBuy && (
                  <div className="bg-primary-50 rounded-2xl p-6 border border-primary-100">
                    <p className="text-sm text-slate-500 mb-1">{t({ en: 'Buy Now', te: 'ఇప్పుడే కొనండి' })}</p>
                    <p className="text-3xl font-bold text-primary-700 mb-1">
                      ₹{product.fixedPrice}
                      <span className="text-sm font-normal text-slate-400">/{product.unit}</span>
                    </p>
                    <div className="flex items-center gap-2 mt-4">
                      <label className="text-sm text-slate-600">{t({ en: 'Qty:', te: 'పరిమాణం:' })}</label>
                      <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
                        <button onClick={() => setQty(Math.max(product.minQty, qty - 1))} className="px-3 py-1.5 text-slate-500 hover:bg-slate-50">−</button>
                        <input type="number" value={qty} onChange={(e) => setQty(Math.max(product.minQty, Number(e.target.value)))}
                          min={product.minQty} max={product.availableQty}
                          className="w-16 text-center text-sm py-1.5 border-x border-slate-200 focus:outline-none" />
                        <button onClick={() => setQty(Math.min(product.availableQty, qty + 1))} className="px-3 py-1.5 text-slate-500 hover:bg-slate-50">+</button>
                      </div>
                      <span className="text-sm text-slate-400">{product.unit}</span>
                    </div>
                    <p className="text-sm text-slate-600 mt-3">
                      {t({ en: 'Total:', te: 'మొత్తం:' })}
                      <span className="font-bold text-primary-700 text-lg ml-1">₹{(product.fixedPrice! * qty).toFixed(0)}</span>
                    </p>
                    <button onClick={addToCart} disabled={adding}
                      className="w-full mt-4 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-md shadow-primary-600/20">
                      {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingCart className="w-4 h-4" />}
                      {adding ? '...' : t({ en: 'Add to Cart', te: 'కార్ట్‌కు జోడించు' })}
                    </button>
                  </div>
                )}

                {canBid && (
                  <div className="bg-amber-50 rounded-2xl p-6 border border-amber-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Gavel className="w-4 h-4 text-amber-600" />
                      <p className="text-sm font-semibold text-slate-700">{t({ en: 'Place a Bid', te: 'బిడ్ పెట్టండి' })}</p>
                    </div>
                    <p className="text-xs text-slate-500 mb-3">
                      {t({ en: 'Min bid:', te: 'కనీస బిడ్:' })} <span className="font-semibold text-slate-700">₹{product.minBidPrice}/{product.unit}</span>
                      {product.autoBidAccept && <span className="ml-2">({t({ en: 'Auto-accept at', te: 'ఆటో-ఆమోదం' })} ₹{product.autoBidAccept})</span>}
                    </p>
                    <input type="number" value={bidAmount} onChange={(e) => setBidAmount(e.target.value)}
                      placeholder={`₹${product.minBidPrice}`}
                      className="w-full border border-amber-200 rounded-xl px-3 py-2.5 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white" />
                    <input value={bidMessage} onChange={(e) => setBidMessage(e.target.value)}
                      placeholder={t({ en: 'Message (optional)', te: 'సందేశం (ఐచ్ఛికం)' })}
                      className="w-full border border-amber-200 rounded-xl px-3 py-2.5 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white" />
                    <button onClick={placeBid} disabled={bidding}
                      className="w-full py-3 bg-amber-500 text-white rounded-xl font-semibold hover:bg-amber-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-md shadow-amber-500/20">
                      {bidding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Gavel className="w-4 h-4" />}
                      {bidding ? '...' : t({ en: 'Place Bid', te: 'బిడ్ పెట్టండి' })}
                    </button>
                  </div>
                )}

                {/* Bid history */}
                {canBid && product.bids && product.bids.length > 0 && (
                  <div className="bg-white rounded-2xl p-5 border border-slate-200">
                    <p className="text-sm font-semibold text-slate-700 mb-3">
                      {t({ en: 'Recent Bids', te: 'ఇటీవల బిడ్లు' })} ({product.bids.length})
                    </p>
                    <div className="space-y-2">
                      {product.bids.slice(0, 5).map((bid) => (
                        <div key={bid.id} className="flex justify-between items-center text-sm py-2 border-b border-slate-50 last:border-0">
                          <span className="text-slate-600">{bid.buyer?.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-800">₹{bid.amount}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${bidStatusColor[bid.status] || 'bg-slate-100 text-slate-600'}`}>
                              {bid.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Price Insight */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                  <button
                    onClick={() => { setAiInsightOpen(!aiInsightOpen); if (!aiInsightOpen && !aiInsight && !aiLoading) fetchAiInsight(); }}
                    className="w-full flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Bot className="w-4 h-4 text-blue-600" />
                      <p className="text-sm font-semibold text-slate-700">
                        {t({ en: 'AI Price Insight', te: 'AI ధర అంతర్దృష్టి' })}
                      </p>
                    </div>
                    {aiInsightOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </button>

                  {aiInsightOpen && (
                    <div className="mt-4">
                      {aiLoading && (
                        <div className="flex items-center justify-center py-6">
                          <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                          <span className="ml-2 text-sm text-slate-500">{t({ en: 'Analyzing prices...', te: 'ధరలను విశ్లేషిస్తోంది...' })}</span>
                        </div>
                      )}
                      {aiError && !aiLoading && (
                        <div className="bg-red-50 rounded-xl p-4 text-sm text-red-600">
                          {t({ en: 'AI unavailable. Please try again later.', te: 'AI అందుబాటులో లేదు. దయచేసి తర్వాత మళ్ళీ ప్రయత్నించండి.' })}
                          <button
                            onClick={() => { setAiError(false); setAiInsight(null); fetchAiInsight(); }}
                            className="ml-2 underline font-medium hover:text-red-700"
                          >
                            {t({ en: 'Retry', te: 'మళ్ళీ ప్రయత్నించు' })}
                          </button>
                        </div>
                      )}
                      {aiInsight && !aiLoading && (
                        <div className="bg-blue-50 rounded-xl p-4">
                          <ul className="space-y-1.5 text-sm text-slate-700">
                            {aiInsight.split('\n').filter(Boolean).map((line, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-blue-500 mt-0.5 flex-shrink-0">•</span>
                                <span>{line.replace(/^[-•*]\s*/, '')}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {!aiInsight && !aiLoading && !aiError && (
                        <button
                          onClick={fetchAiInsight}
                          className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                        >
                          <Bot className="w-4 h-4" />
                          {t({ en: 'Get AI Insight', te: 'AI అంతర్దృష్టి పొందండి' })}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Contact Farmer */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <MessageSquare className="w-4 h-4 text-primary-600" />
                    <p className="text-sm font-semibold text-slate-700">
                      {t({ en: 'Contact Farmer', te: 'రైతును సంప్రదించండి' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm">
                      {product.farmer?.name?.charAt(0) || 'F'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{product.farmer?.name}</p>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span className="text-xs text-slate-500">{product.farmer?.farmerProfile?.district || product.district || '—'}</span>
                        {product.farmer?.farmerProfile?.verificationLevel === 'LEVEL_1' && (
                          <span className="flex items-center gap-0.5 text-[10px] text-green-600 font-medium">
                            <ShieldCheck className="w-3 h-3" /> {t({ en: 'Verified', te: 'ధృవీకరించబడింది' })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {!contactOpen ? (
                    <button
                      onClick={() => setContactOpen(true)}
                      className="w-full py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-all flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      {t({ en: 'Send Enquiry', te: 'విచారణ పంపండి' })}
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <textarea
                        value={enquiryMsg}
                        onChange={(e) => setEnquiryMsg(e.target.value)}
                        placeholder={t({ en: 'Write your message to the farmer...', te: 'రైతుకు మీ సందేశం రాయండి...' })}
                        rows={3}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 resize-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setContactOpen(false); setEnquiryMsg(''); }}
                          className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition-all"
                        >
                          {t({ en: 'Cancel', te: 'రద్దు' })}
                        </button>
                        <button
                          onClick={handleEnquiry}
                          disabled={enquirySending}
                          className="flex-1 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                        >
                          {enquirySending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                          {enquirySending ? '...' : t({ en: 'Send', te: 'పంపు' })}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Market Price Comparison */}
        {priceComparison && product.fixedPrice && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm mt-6 p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4">
              {t({ en: 'Market Price Comparison', te: 'మార్కెట్ ధర పోలిక' })}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-50 rounded-xl p-4 text-center">
                <p className="text-xs text-slate-400 mb-1">{t({ en: 'This Product', te: 'ఈ ఉత్పత్తి' })}</p>
                <p className="text-xl font-bold text-primary-700">₹{product.fixedPrice}</p>
                <p className="text-[10px] text-slate-400">/{product.unit}</p>
              </div>
              {priceComparison.minPrice != null && (
                <div className="bg-slate-50 rounded-xl p-4 text-center">
                  <p className="text-xs text-slate-400 mb-1">{t({ en: 'Mandi Min', te: 'మండి కనిష్ట' })}</p>
                  <p className="text-xl font-bold text-slate-700">₹{priceComparison.minPrice}</p>
                </div>
              )}
              {priceComparison.maxPrice != null && (
                <div className="bg-slate-50 rounded-xl p-4 text-center">
                  <p className="text-xs text-slate-400 mb-1">{t({ en: 'Mandi Max', te: 'మండి గరిష్ట' })}</p>
                  <p className="text-xl font-bold text-slate-700">₹{priceComparison.maxPrice}</p>
                </div>
              )}
              {priceComparison.modalPrice != null && (
                <div className="bg-slate-50 rounded-xl p-4 text-center">
                  <p className="text-xs text-slate-400 mb-1">{t({ en: 'Mandi Modal', te: 'మండి మోడల్' })}</p>
                  <p className={`text-xl font-bold ${
                    product.fixedPrice < priceComparison.modalPrice ? 'text-green-600' :
                    product.fixedPrice > priceComparison.modalPrice * 1.1 ? 'text-red-600' : 'text-amber-600'
                  }`}>₹{priceComparison.modalPrice}</p>
                  <p className={`text-[10px] font-medium mt-1 ${
                    product.fixedPrice < priceComparison.modalPrice ? 'text-green-600' :
                    product.fixedPrice > priceComparison.modalPrice * 1.1 ? 'text-red-600' : 'text-amber-600'
                  }`}>
                    {product.fixedPrice < priceComparison.modalPrice
                      ? t({ en: 'Below market price', te: 'మార్కెట్ ధర కంటే తక్కువ' })
                      : product.fixedPrice > priceComparison.modalPrice * 1.1
                      ? t({ en: 'Above market price', te: 'మార్కెట్ ధర కంటే ఎక్కువ' })
                      : t({ en: 'Near market price', te: 'మార్కెట్ ధరకు సమీపంలో' })}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Similar Products */}
        {similarProducts.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-bold text-slate-800 mb-4">
              {t({ en: 'Similar Products', te: 'సారూప్య ఉత్పత్తులు' })}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {similarProducts.map((sp) => (
                <Link key={sp.id} href={`/buyer/browse/${sp.id}`} className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-md transition-shadow group">
                  <div className="relative h-32 bg-slate-100 overflow-hidden">
                    {sp.imageUrls?.[0] ? (
                      <>
                        <div className="flex items-center justify-center h-full text-4xl">🥬</div>
                        <Image
                          src={sp.imageUrls[0]}
                          alt={sp.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          unoptimized
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-full text-4xl">🥬</div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-semibold text-slate-800 truncate">
                      {lang === 'te' && sp.titleTE ? sp.titleTE : sp.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">{sp.farmer?.name}</p>
                    <p className="text-primary-700 font-bold text-sm mt-1">
                      ₹{sp.fixedPrice || sp.minBidPrice}
                      <span className="text-[10px] text-slate-400 font-normal">/{sp.unit}</span>
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
