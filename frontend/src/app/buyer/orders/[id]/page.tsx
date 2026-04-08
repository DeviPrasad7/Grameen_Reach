'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ordersApi } from '@/lib/api';
import { useAuthStore, useLangStore } from '@/lib/store';

const STATUS_COLORS: Record<string, string> = {
  PLACED: 'bg-blue-100 text-blue-700',
  CONFIRMED: 'bg-yellow-100 text-yellow-700',
  PACKED: 'bg-orange-100 text-orange-700',
  OUT_FOR_DELIVERY: 'bg-purple-100 text-purple-700',
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

const STATUS_STEPS = ['PLACED', 'CONFIRMED', 'PACKED', 'OUT_FOR_DELIVERY', 'DELIVERED'];
const STATUS_STEPS_TE: Record<string, string> = {
  PLACED: 'ఆర్డర్', CONFIRMED: 'నిర్ధారణ', PACKED: 'ప్యాక్', OUT_FOR_DELIVERY: 'డెలివరీ', DELIVERED: 'అందజేత',
};

interface OrderDetail {
  id: string; status: string; totalAmount: number; paymentMethod: string; paymentStatus: string;
  deliveryAddress: { street?: string; city?: string; pincode?: string; state?: string };
  notes?: string; createdAt: string; buyer: { name: string; email: string };
  subOrders: {
    id: string; status: string; amount: number; deliveryFee: number;
    farmerProfile: { user: { name: string } };
    items: { qty: number; unitPrice: number; product: { title: string; titleTE?: string; unit: string; category: { name: string } } }[];
  }[];
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const { lang, t } = useLangStore();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }
    if (params?.id) {
      ordersApi.get(params.id as string)
        .then((r) => setOrder(r.data))
        .catch(() => router.push('/buyer/orders'))
        .finally(() => setLoading(false));
    }
  }, [user, params?.id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">{t({ en: 'Loading order...', te: 'ఆర్డర్ లోడ్ అవుతోంది...' })}</div>;
  if (!order) return <div className="min-h-screen flex items-center justify-center text-gray-400">{t({ en: 'Order not found', te: 'ఆర్డర్ కనుగొనబడలేదు' })}</div>;

  const addr = order.deliveryAddress;
  const grandTotal = order.subOrders.reduce((s, so) => s + so.amount + so.deliveryFee, 0);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <Link href="/buyer/orders" className="text-sm text-gray-400 hover:text-gray-600 mb-4 block">
          {t({ en: '← Back to orders', te: '← ఆర్డర్లకు తిరిగి' })}
        </Link>

        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-4">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-xl font-bold text-gray-800">
                {t({ en: 'Order', te: 'ఆర్డర్' })} #{order.id.slice(-8).toUpperCase()}
              </h1>
              <p className="text-xs text-gray-400 mt-1">{t({ en: 'Placed on', te: 'ఆర్డర్ తేదీ' })} {new Date(order.createdAt).toLocaleString()}</p>
            </div>
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}>
              {lang === 'te' ? STATUS_STEPS_TE[order.status] || order.status : order.status}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400 text-xs">{t({ en: 'Payment', te: 'చెల్లింపు' })}</span>
              <p className="font-medium text-gray-700">{order.paymentMethod} - {order.paymentStatus}</p>
            </div>
            <div>
              <span className="text-gray-400 text-xs">{t({ en: 'Delivery Address', te: 'డెలివరీ చిరునామా' })}</span>
              <p className="font-medium text-gray-700">{addr?.street}, {addr?.city} - {addr?.pincode}</p>
              <p className="text-xs text-gray-500">{addr?.state}</p>
            </div>
          </div>
          {order.notes && <div className="mt-3 text-sm text-gray-500 italic">{t({ en: 'Note:', te: 'గమనిక:' })} {order.notes}</div>}
        </div>

        <div className="space-y-4">
          {order.subOrders.map((so, idx) => (
            <div key={so.id} className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex justify-between items-center mb-4">
                <p className="font-semibold text-gray-800 text-sm">
                  {t({ en: 'Sub-order', te: 'ఉప-ఆర్డర్' })} {idx + 1}: {so.farmerProfile?.user?.name}
                </p>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_COLORS[so.status] || 'bg-gray-100'}`}>
                  {lang === 'te' ? STATUS_STEPS_TE[so.status] || so.status : so.status}
                </span>
              </div>

              <div className="flex items-center gap-1 mb-4">
                {STATUS_STEPS.map((step, i) => {
                  const currentIdx = STATUS_STEPS.indexOf(so.status);
                  const isDone = i <= currentIdx;
                  return (
                    <div key={step} className="flex items-center flex-1">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isDone ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                        {isDone ? '✓' : i + 1}
                      </div>
                      {i < STATUS_STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-1 ${i < currentIdx ? 'bg-primary-500' : 'bg-gray-200'}`} />}
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-xs text-gray-400 mb-4">
                {STATUS_STEPS.map((s) => <span key={s} className="text-center">{lang === 'te' ? STATUS_STEPS_TE[s] : s.replace(/_/g, ' ')}</span>)}
              </div>

              <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                {so.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-gray-700">{item.product?.title} × {item.qty} {item.product?.unit}</span>
                    <span className="font-medium text-gray-800">₹{(item.unitPrice * item.qty).toFixed(0)}</span>
                  </div>
                ))}
                <div className="border-t border-gray-200 pt-2 mt-2 space-y-1">
                  <div className="flex justify-between text-sm text-gray-500"><span>{t({ en: 'Subtotal', te: 'ఉప మొత్తం' })}</span><span>₹{so.amount}</span></div>
                  <div className="flex justify-between text-sm text-gray-500"><span>{t({ en: 'Delivery', te: 'డెలివరీ' })}</span><span>₹{so.deliveryFee}</span></div>
                  <div className="flex justify-between font-semibold text-sm"><span>{t({ en: 'Total', te: 'మొత్తం' })}</span><span className="text-primary-700">₹{so.amount + so.deliveryFee}</span></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-primary-100 p-6 mt-4">
          <div className="flex justify-between text-lg font-bold text-gray-800">
            <span>{t({ en: 'Grand Total', te: 'మొత్తం ధర' })}</span>
            <span className="text-primary-700">₹{grandTotal}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
