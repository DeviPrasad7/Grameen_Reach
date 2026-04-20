'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { cartApi, ordersApi, paymentsApi } from '@/lib/api';
import { useAuthStore, useLangStore, useCartCountStore } from '@/lib/store';
import toast from 'react-hot-toast';
import { ShoppingCart, Trash2, MapPin, CreditCard, Banknote, ArrowRight, Package, Loader2, Plus, Minus, Truck } from 'lucide-react';

interface CartItem {
  productId: string;
  qty: number;
  product: {
    id: string; title: string; titleTE?: string; fixedPrice?: number; minBidPrice?: number;
    unit: string; minQty: number; availableQty: number; imageUrls: string[]; farmer: { name: string };
  };
}

export default function CartPage() {
  const router = useRouter();
  const { user, _hasHydrated } = useAuthStore();
  const { lang, t } = useLangStore();
  const { setCount } = useCartCountStore();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [address, setAddress] = useState({ street: '', city: '', pincode: '', state: 'Andhra Pradesh' });
  const [saveAddress, setSaveAddress] = useState(false);
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'DUMMY_CARD'>('COD');
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!user) { router.push('/auth/login'); return; }
    loadCart();
  }, [_hasHydrated, user]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('gr_saved_address');
      if (saved) {
        const parsed = JSON.parse(saved);
        setAddress(parsed);
        setSaveAddress(true);
      }
    } catch { /* ignore */ }
  }, []);

  const loadCart = async () => {
    try {
      const res = await cartApi.get();
      const items = res.data?.items || [];
      setCart(items);
      setCount(items.length);
    } finally {
      setLoading(false);
    }
  };

  const updateQty = async (productId: string, newQty: number) => {
    try {
      await cartApi.updateItem(productId, newQty);
      loadCart();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || t({ en: 'Failed to update quantity', te: 'పరిమాణం అప్‌డేట్ విఫలమైంది' }));
    }
  };

  const removeItem = async (productId: string) => {
    try {
      await cartApi.removeItem(productId);
      toast.success(t({ en: 'Item removed', te: 'ఐటమ్ తొలగించబడింది' }));
      loadCart();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || t({ en: 'Failed to remove item', te: 'ఐటమ్ తొలగించడం విఫలమైంది' }));
    }
  };

  const total = cart.reduce((sum, item) => {
    const p = item.product.fixedPrice ?? item.product.minBidPrice ?? 0;
    return sum + p * item.qty;
  }, 0);

  const handleSaveAddressToggle = (checked: boolean) => {
    setSaveAddress(checked);
    if (checked) {
      localStorage.setItem('gr_saved_address', JSON.stringify(address));
    } else {
      localStorage.removeItem('gr_saved_address');
    }
  };

  const placeOrder = async () => {
    if (placing) return;  // double-click guard
    if (cart.length === 0) {
      toast.error(t({ en: 'Your cart is empty', te: 'మీ కార్ట్ ఖాళీగా ఉంది' }));
      return;
    }
    if (!address.street.trim() || !address.city.trim() || !address.pincode.trim()) {
      toast.error(t({ en: 'Please fill delivery address', te: 'దయచేసి డెలివరీ చిరునామా నింపండి' }));
      return;
    }
    setPlacing(true);
    if (saveAddress) {
      localStorage.setItem('gr_saved_address', JSON.stringify(address));
    }
    try {
      const res = await ordersApi.create({
        deliveryAddress: address,
        notes,
        paymentMethod,
      });

      const orderId = res.data.id;

      // If DUMMY_CARD, auto-initiate payment
      if (paymentMethod === 'DUMMY_CARD') {
        try {
          await paymentsApi.initiate({ orderId, method: 'DUMMY_CARD' });
          toast.success(t({ en: 'Payment successful! Order placed.', te: 'చెల్లింపు విజయవంతం! ఆర్డర్ పెట్టబడింది.' }));
        } catch {
          toast.success(t({ en: 'Order placed! Payment will be processed.', te: 'ఆర్డర్ పెట్టబడింది! చెల్లింపు ప్రాసెస్ చేయబడుతుంది.' }));
        }
      } else {
        toast.success(t({ en: 'Order placed successfully!', te: 'ఆర్డర్ విజయవంతంగా పెట్టబడింది!' }));
      }

      setCount(0);
      router.push(`/buyer/orders/${orderId}`);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || t({ en: 'Order failed', te: 'ఆర్డర్ విఫలమైంది' }));
    } finally {
      setPlacing(false);
    }
  };

  if (!_hasHydrated || loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Gradient Header */}
      <div className="bg-gradient-to-r from-primary-700 via-primary-600 to-emerald-600 text-white px-4 py-6">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <ShoppingCart className="w-7 h-7" />
          <div>
            <h1 className="text-2xl font-bold">{t({ en: 'Your Cart', te: 'మీ కార్ట్' })}</h1>
            {cart.length > 0 && <p className="text-sm text-white/80">{cart.length} {t({ en: 'items', te: 'ఐటమ్‌లు' })}</p>}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto py-8 px-4">

        {cart.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 animate-fade-in">
            <Package className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <p className="text-lg font-medium text-slate-500">{t({ en: 'Your cart is empty', te: 'మీ కార్ట్ ఖాళీగా ఉంది' })}</p>
            <p className="text-sm text-slate-400 mt-1 mb-6">{t({ en: 'Browse products and add items to your cart', te: 'ఉత్పత్తులు చూడండి మరియు కార్ట్‌కు ఐటమ్‌లు జోడించండి' })}</p>
            <Link href="/buyer/browse" className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors">
              {t({ en: 'Browse Products', te: 'ఉత్పత్తులు చూడండి' })} <ArrowRight className="w-4 h-4" />
            </Link>
            <div className="mt-4">
              <Link href="/buyer/browse" className="text-sm text-primary-600 hover:text-primary-700 font-medium hover:underline transition-colors">
                {t({ en: 'Continue Shopping', te: 'షాపింగ్ కొనసాగించండి' })}
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4 animate-slide-up">
            {/* Cart items */}
            <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
              {cart.map((item) => {
                const price = item.product.fixedPrice ?? item.product.minBidPrice ?? 0;
                const itemTitle = lang === 'te' && item.product.titleTE ? item.product.titleTE : item.product.title;
                return (
                  <div key={item.productId} className="flex items-center gap-4 p-4">
                    <div className="w-16 h-16 bg-slate-100 rounded-xl overflow-hidden flex-shrink-0 relative">
                      {item.product.imageUrls?.[0] ? (
                        <Image src={item.product.imageUrls[0]} alt={item.product.title} fill sizes="64px" className="object-cover" />
                      ) : (
                        <div className="flex items-center justify-center h-full text-2xl">🥬</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/buyer/browse/${item.productId}`} className="font-medium text-slate-800 text-sm truncate block hover:text-primary-600 transition-colors">{itemTitle}</Link>
                      <p className="text-xs text-slate-400">{item.product.farmer?.name}</p>
                      <p className="text-primary-600 font-semibold text-sm mt-1">
                        ₹{price}/{item.product.unit}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 border border-slate-200 rounded-lg">
                      <button
                        onClick={() => updateQty(item.productId, Math.max(item.product.minQty || 1, item.qty - 1))}
                        className="p-1.5 text-slate-400 hover:text-slate-600"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-sm font-medium text-slate-700 w-8 text-center">{item.qty}</span>
                      <button
                        onClick={() => updateQty(item.productId, Math.min(item.product.availableQty || 999, item.qty + 1))}
                        className="p-1.5 text-slate-400 hover:text-slate-600"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-semibold text-slate-800 text-sm">₹{(price * item.qty).toFixed(0)}</p>
                    </div>
                    <button onClick={() => removeItem(item.productId)} className="text-slate-300 hover:text-red-500 transition-colors flex-shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Delivery Address */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-primary-600" />
                <h2 className="font-semibold text-slate-800">{t({ en: 'Delivery Address', te: 'డెలివరీ చిరునామా' })}</h2>
              </div>
              <div className="space-y-3">
                <input value={address.street} onChange={(e) => setAddress({ ...address, street: e.target.value })}
                  placeholder={t({ en: 'Street / House No.', te: 'వీధి / ఇంటి నంబర్' })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent" />
                <div className="grid grid-cols-2 gap-3">
                  <input value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    placeholder={t({ en: 'City', te: 'నగరం' })}
                    className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent" />
                  <input value={address.pincode} onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
                    placeholder={t({ en: 'Pincode', te: 'పిన్‌కోడ్' })}
                    className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent" />
                </div>
                <select value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent">
                  <option>Andhra Pradesh</option>
                  <option>Telangana</option>
                </select>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                  placeholder={t({ en: 'Order notes (optional)', te: 'ఆర్డర్ గమనికలు (ఐచ్ఛికం)' })} rows={2}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent" />
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={saveAddress}
                    onChange={(e) => handleSaveAddressToggle(e.target.checked)}
                    className="w-4 h-4 text-primary-600 border-slate-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm text-slate-600">{t({ en: 'Save this address', te: 'ఈ చిరునామాను సేవ్ చేయండి' })}</span>
                </label>
              </div>
              <div className="flex items-center gap-2 mt-4 text-sm text-slate-500">
                <Truck className="w-4 h-4 text-primary-500" />
                <span>{t({ en: 'Estimated delivery: 2-4 days', te: 'అంచనా డెలివరీ: 2-4 రోజులు' })}</span>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="w-5 h-5 text-primary-600" />
                <h2 className="font-semibold text-slate-800">{t({ en: 'Payment Method', te: 'చెల్లింపు విధానం' })}</h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('COD')}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                    paymentMethod === 'COD' ? 'border-primary-500 bg-primary-50 shadow-sm' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Banknote className={`w-5 h-5 ${paymentMethod === 'COD' ? 'text-primary-600' : 'text-slate-400'}`} />
                  <div className="text-left">
                    <p className={`text-sm font-semibold ${paymentMethod === 'COD' ? 'text-primary-700' : 'text-slate-700'}`}>
                      {t({ en: 'Cash on Delivery', te: 'క్యాష్ ఆన్ డెలివరీ' })}
                    </p>
                    <p className="text-[10px] text-slate-400">{t({ en: 'Pay when you receive', te: 'అందుకున్నప్పుడు చెల్లించు' })}</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('DUMMY_CARD')}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                    paymentMethod === 'DUMMY_CARD' ? 'border-primary-500 bg-primary-50 shadow-sm' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <CreditCard className={`w-5 h-5 ${paymentMethod === 'DUMMY_CARD' ? 'text-primary-600' : 'text-slate-400'}`} />
                  <div className="text-left">
                    <p className={`text-sm font-semibold ${paymentMethod === 'DUMMY_CARD' ? 'text-primary-700' : 'text-slate-700'}`}>
                      {t({ en: 'Card Payment', te: 'కార్డ్ చెల్లింపు' })}
                    </p>
                    <p className="text-[10px] text-slate-400">{t({ en: 'Instant confirmation', te: 'తక్షణ నిర్ధారణ' })}</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Order summary */}
            <div className="bg-white rounded-2xl border-2 border-primary-100 p-6">
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm text-slate-500">
                  <span>{t({ en: 'Subtotal', te: 'ఉప మొత్తం' })} ({cart.length} {t({ en: 'items', te: 'ఐటమ్‌లు' })})</span>
                  <span>₹{total.toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-500">
                  <span>{t({ en: 'Delivery', te: 'డెలివరీ' })}</span>
                  <span className="text-primary-600 font-medium">{t({ en: 'Calculated at checkout', te: 'చెకౌట్‌లో లెక్కించబడుతుంది' })}</span>
                </div>
                <hr className="border-slate-100" />
                <div className="flex justify-between text-xl font-bold text-slate-800">
                  <span>{t({ en: 'Total', te: 'మొత్తం' })}</span>
                  <span className="text-primary-700">₹{total.toFixed(0)}</span>
                </div>
              </div>
              <button onClick={placeOrder} disabled={placing}
                className="w-full py-3.5 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary-600/20">
                {placing ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                {placing
                  ? t({ en: 'Placing order...', te: 'ఆర్డర్ పెడుతోంది...' })
                  : paymentMethod === 'COD'
                  ? t({ en: 'Place Order (COD)', te: 'ఆర్డర్ పెట్టండి (COD)' })
                  : t({ en: 'Pay & Place Order', te: 'చెల్లించు & ఆర్డర్ పెట్టు' })}
              </button>
            </div>

            {/* Continue Shopping */}
            <div className="text-center pt-2">
              <Link href="/buyer/browse" className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium hover:underline transition-colors">
                <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                {t({ en: 'Continue Shopping', te: 'షాపింగ్ కొనసాగించండి' })}
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
