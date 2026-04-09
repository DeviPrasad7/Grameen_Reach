'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ordersApi } from '@/lib/api';
import { useAuthStore, useLangStore } from '@/lib/store';
import toast from 'react-hot-toast';
import { ArrowLeft, CheckCircle2, Circle, Loader2, MapPin, CreditCard, StickyNote, Package, XCircle } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  PLACED: 'bg-blue-100 text-blue-700',
  CONFIRMED: 'bg-yellow-100 text-yellow-700',
  PACKED: 'bg-orange-100 text-orange-700',
  OUT_FOR_DELIVERY: 'bg-purple-100 text-purple-700',
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

const STATUS_STEPS = ['PLACED', 'CONFIRMED', 'PACKED', 'OUT_FOR_DELIVERY', 'DELIVERED'];

const STATUS_STEPS_EN: Record<string, string> = {
  PLACED: 'Placed',
  CONFIRMED: 'Confirmed',
  PACKED: 'Packed',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
};

const STATUS_STEPS_TE: Record<string, string> = {
  PLACED: '\u0C06\u0C30\u0C4D\u0C21\u0C30\u0C4D',
  CONFIRMED: '\u0C28\u0C3F\u0C30\u0C4D\u0C27\u0C3E\u0C30\u0C23',
  PACKED: '\u0C2A\u0C4D\u0C2F\u0C3E\u0C15\u0C4D',
  OUT_FOR_DELIVERY: '\u0C21\u0C46\u0C32\u0C3F\u0C35\u0C30\u0C40',
  DELIVERED: '\u0C05\u0C02\u0C26\u0C1C\u0C47\u0C24',
};

interface SubOrderItem {
  qty: number;
  unitPrice: number;
  product: {
    title: string;
    titleTE?: string;
    unit: string;
    category: { name: string };
  };
}

interface SubOrder {
  id: string;
  status: string;
  amount: number;
  deliveryFee: number;
  farmerProfile: { user: { name: string } };
  items: SubOrderItem[];
}

interface OrderDetail {
  id: string;
  status: string;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  deliveryAddress: { street?: string; city?: string; pincode?: string; state?: string };
  notes?: string;
  createdAt: string;
  buyer: { name: string; email: string };
  subOrders: SubOrder[];
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, _hasHydrated } = useAuthStore();
  const { lang, t } = useLangStore();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const handleCancel = async () => {
    if (!order) return;
    if (!window.confirm(t({ en: 'Are you sure you want to cancel this order?', te: 'మీరు ఈ ఆర్డర్‌ను రద్దు చేయాలనుకుంటున్నారా?' }))) return;
    setCancelling(true);
    try {
      const res = await ordersApi.cancel(order.id);
      setOrder(res.data);
      toast.success(t({ en: 'Order cancelled successfully', te: 'ఆర్డర్ విజయవంతంగా రద్దు చేయబడింది' }));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || t({ en: 'Failed to cancel order', te: 'ఆర్డర్ రద్దు విఫలమైంది' }));
    } finally {
      setCancelling(false);
    }
  };

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!user) { router.push('/auth/login'); return; }
    if (params?.id) {
      ordersApi.get(params.id as string)
        .then((r) => setOrder(r.data))
        .catch(() => {
          toast.error(t({ en: 'Order not found', te: '\u0C06\u0C30\u0C4D\u0C21\u0C30\u0C4D \u0C15\u0C28\u0C41\u0C17\u0C4A\u0C28\u0C2C\u0C21\u0C32\u0C47\u0C26\u0C41' }));
          router.push('/buyer/orders');
        })
        .finally(() => setLoading(false));
    }
  }, [_hasHydrated, user, params?.id]);

  if (!_hasHydrated || loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
    </div>
  );

  if (!order) return (
    <div className="min-h-screen flex items-center justify-center animate-fade-in">
      <div className="text-center">
        <Package className="w-16 h-16 text-slate-200 mx-auto mb-4" />
        <p className="text-lg font-medium text-slate-500">{t({ en: 'Order not found', te: '\u0C06\u0C30\u0C4D\u0C21\u0C30\u0C4D \u0C15\u0C28\u0C41\u0C17\u0C4A\u0C28\u0C2C\u0C21\u0C32\u0C47\u0C26\u0C41' })}</p>
      </div>
    </div>
  );

  const addr = order.deliveryAddress;
  const grandTotal = order.subOrders.reduce((s, so) => s + so.amount + so.deliveryFee, 0);

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Back link */}
        <Link href="/buyer/orders" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" />
          {t({ en: 'Back to orders', te: '\u0C06\u0C30\u0C4D\u0C21\u0C30\u0C4D\u0C32\u0C15\u0C41 \u0C24\u0C3F\u0C30\u0C3F\u0C17\u0C3F' })}
        </Link>

        {/* Order summary card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-4 animate-slide-up">
          <div className="flex justify-between items-start mb-5">
            <div>
              <h1 className="text-xl font-bold text-slate-800">
                {t({ en: 'Order', te: '\u0C06\u0C30\u0C4D\u0C21\u0C30\u0C4D' })} #{order.id.slice(-8).toUpperCase()}
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                {t({ en: 'Placed on', te: '\u0C06\u0C30\u0C4D\u0C21\u0C30\u0C4D \u0C24\u0C47\u0C26\u0C40' })} {new Date(order.createdAt).toLocaleString()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${STATUS_COLORS[order.status] || 'bg-slate-100 text-slate-600'}`}>
                {lang === 'te' ? STATUS_STEPS_TE[order.status] || order.status : order.status}
              </span>
              {(order.status === 'PLACED' || order.status === 'CONFIRMED') && (
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  {cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : t({ en: 'Cancel Order', te: 'ఆర్డర్ రద్దు' })}
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Payment info */}
            <div className="flex items-start gap-3">
              <CreditCard className="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-slate-400 text-xs">{t({ en: 'Payment', te: '\u0C1A\u0C46\u0C32\u0C4D\u0C32\u0C3F\u0C02\u0C2A\u0C41' })}</span>
                <p className="font-medium text-slate-700 text-sm">{order.paymentMethod} &mdash; {order.paymentStatus}</p>
              </div>
            </div>

            {/* Delivery address */}
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-slate-400 text-xs">{t({ en: 'Delivery Address', te: '\u0C21\u0C46\u0C32\u0C3F\u0C35\u0C30\u0C40 \u0C1A\u0C3F\u0C30\u0C41\u0C28\u0C3E\u0C2E\u0C3E' })}</span>
                <p className="font-medium text-slate-700 text-sm">{addr?.street}, {addr?.city} - {addr?.pincode}</p>
                <p className="text-xs text-slate-500">{addr?.state}</p>
              </div>
            </div>
          </div>

          {order.notes && (
            <div className="mt-4 flex items-start gap-3 bg-slate-50 rounded-xl p-3">
              <StickyNote className="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-slate-400 text-xs">{t({ en: 'Note', te: '\u0C17\u0C2E\u0C28\u0C3F\u0C15' })}</span>
                <p className="text-sm text-slate-600">{order.notes}</p>
              </div>
            </div>
          )}
        </div>

        {/* Sub-orders */}
        <div className="space-y-4 animate-slide-up">
          {order.subOrders.map((so, idx) => {
            const currentIdx = STATUS_STEPS.indexOf(so.status);
            const isCancelled = so.status === 'CANCELLED';

            return (
              <div key={so.id} className="bg-white rounded-2xl border border-slate-200 p-6">
                <div className="flex justify-between items-center mb-4">
                  <p className="font-semibold text-slate-800 text-sm">
                    {t({ en: 'Sub-order', te: '\u0C09\u0C2A-\u0C06\u0C30\u0C4D\u0C21\u0C30\u0C4D' })} {idx + 1}: {so.farmerProfile?.user?.name}
                  </p>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[so.status] || 'bg-slate-100 text-slate-600'}`}>
                    {lang === 'te' ? STATUS_STEPS_TE[so.status] || so.status : so.status}
                  </span>
                </div>

                {/* Progress tracker */}
                {!isCancelled && (
                  <>
                    <div className="flex items-center gap-0 mb-2">
                      {STATUS_STEPS.map((step, i) => {
                        const isDone = i <= currentIdx;
                        return (
                          <div key={step} className="flex items-center flex-1">
                            <div className="flex-shrink-0">
                              {isDone ? (
                                <CheckCircle2 className="w-6 h-6 text-primary-600" />
                              ) : (
                                <Circle className="w-6 h-6 text-slate-300" />
                              )}
                            </div>
                            {i < STATUS_STEPS.length - 1 && (
                              <div className={`flex-1 h-0.5 mx-1 rounded ${i < currentIdx ? 'bg-primary-500' : 'bg-slate-200'}`} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 mb-4">
                      {STATUS_STEPS.map((s) => (
                        <span key={s} className="text-center flex-1">
                          {lang === 'te' ? STATUS_STEPS_TE[s] : STATUS_STEPS_EN[s]}
                        </span>
                      ))}
                    </div>
                  </>
                )}

                {/* Items breakdown */}
                <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                  {so.items.map((item, i) => {
                    const title = lang === 'te' && item.product?.titleTE ? item.product.titleTE : item.product?.title;
                    return (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-slate-700">
                          {title} <span className="text-slate-400">&times; {item.qty} {item.product?.unit}</span>
                        </span>
                        <span className="font-medium text-slate-800">₹{(item.unitPrice * item.qty).toFixed(0)}</span>
                      </div>
                    );
                  })}

                  <div className="border-t border-slate-200 pt-2 mt-2 space-y-1">
                    <div className="flex justify-between text-sm text-slate-500">
                      <span>{t({ en: 'Subtotal', te: '\u0C09\u0C2A \u0C2E\u0C4A\u0C24\u0C4D\u0C24\u0C02' })}</span>
                      <span>₹{so.amount}</span>
                    </div>
                    <div className="flex justify-between text-sm text-slate-500">
                      <span>{t({ en: 'Delivery', te: '\u0C21\u0C46\u0C32\u0C3F\u0C35\u0C30\u0C40' })}</span>
                      <span>₹{so.deliveryFee}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-sm">
                      <span>{t({ en: 'Total', te: '\u0C2E\u0C4A\u0C24\u0C4D\u0C24\u0C02' })}</span>
                      <span className="text-primary-700">₹{so.amount + so.deliveryFee}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Grand total */}
        <div className="bg-white rounded-2xl border-2 border-primary-100 p-6 mt-4 animate-slide-up">
          <div className="flex justify-between text-lg font-bold text-slate-800">
            <span>{t({ en: 'Grand Total', te: '\u0C2E\u0C4A\u0C24\u0C4D\u0C24\u0C02 \u0C27\u0C30' })}</span>
            <span className="text-primary-700">₹{grandTotal}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
