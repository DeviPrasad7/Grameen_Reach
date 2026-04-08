'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ordersApi } from '@/lib/api';
import { useAuthStore, useLangStore } from '@/lib/store';

const STATUS_COLOR: Record<string, string> = {
  PLACED: 'bg-blue-100 text-blue-700',
  CONFIRMED: 'bg-yellow-100 text-yellow-700',
  PACKED: 'bg-orange-100 text-orange-700',
  OUT_FOR_DELIVERY: 'bg-purple-100 text-purple-700',
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

const STATUS_TE: Record<string, string> = {
  PLACED: 'ఆర్డర్ చేయబడింది', CONFIRMED: 'నిర్ధారించబడింది', PACKED: 'ప్యాక్ చేయబడింది',
  OUT_FOR_DELIVERY: 'డెలివరీకి బయలుదేరింది', DELIVERED: 'డెలివరీ అయింది', CANCELLED: 'రద్దు చేయబడింది',
};

const NEXT_STATUS: Record<string, string> = {
  PLACED: 'CONFIRMED', CONFIRMED: 'PACKED', PACKED: 'OUT_FOR_DELIVERY', OUT_FOR_DELIVERY: 'DELIVERED',
};

interface SubOrder {
  id: string; orderId: string; status: string; amount: number; deliveryFee: number;
  createdAt: string;
  items: { qty: number; unitPrice: number; product: { title: string; titleTE?: string; unit: string } }[];
  order: { id: string; deliveryAddress: unknown; buyer: { name: string; email: string } };
}

export default function FarmerOrdersPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { lang, t } = useLangStore();
  const [subOrders, setSubOrders] = useState<SubOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }
    if (user.role !== 'FARMER') { router.push('/'); return; }
    load();
  }, [user]);

  const load = () => { ordersApi.list().then((r) => setSubOrders(r.data as SubOrder[])).finally(() => setLoading(false)); };

  const nextLabel = (status: string) => {
    const labels: Record<string, { en: string; te: string }> = {
      PLACED: { en: 'Mark Confirmed', te: 'నిర్ధారించు' },
      CONFIRMED: { en: 'Mark Packed', te: 'ప్యాక్ చేయు' },
      PACKED: { en: 'Mark Out for Delivery', te: 'డెలివరీకి పంపు' },
      OUT_FOR_DELIVERY: { en: 'Mark Delivered', te: 'డెలివరీ అయింది' },
    };
    return labels[status] ? t(labels[status]) : '';
  };

  const advance = async (so: SubOrder) => {
    const next = NEXT_STATUS[so.status];
    if (!next) return;
    setUpdating(so.id);
    try {
      await ordersApi.updateSubOrderStatus(so.orderId, so.id, next);
      setToast(t({ en: `Status updated to ${next}`, te: `స్థితి ${STATUS_TE[next] || next}కు అప్‌డేట్ చేయబడింది` }));
      load();
    } catch { setToast(t({ en: 'Update failed', te: 'అప్‌డేట్ విఫలమైంది' })); }
    finally { setUpdating(null); setTimeout(() => setToast(''), 3000); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">{t({ en: 'Loading orders...', te: 'ఆర్డర్లు లోడ్ అవుతోంది...' })}</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">{t({ en: 'My Orders', te: 'నా ఆర్డర్లు' })}</h1>

        {subOrders.length === 0 ? (
          <div className="bg-white rounded-2xl border p-12 text-center text-gray-400">
            <div className="text-4xl mb-2">📭</div>
            <p>{t({ en: 'No orders yet', te: 'ఇంకా ఆర్డర్లు లేవు' })}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {subOrders.map((so) => {
              const addr = so.order?.deliveryAddress as Record<string, string> | undefined;
              const statusLabel = lang === 'te' ? STATUS_TE[so.status] || so.status : so.status;
              return (
                <div key={so.id} className="bg-white rounded-2xl border border-gray-100 p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-gray-800">
                        {t({ en: 'Order', te: 'ఆర్డర్' })} #{so.orderId.slice(-8).toUpperCase()}
                      </p>
                      <p className="text-xs text-gray-400">{so.order?.buyer?.name} &bull; {new Date(so.createdAt).toLocaleDateString()}</p>
                      {addr && <p className="text-xs text-gray-500 mt-0.5">{addr.street}, {addr.city} – {addr.pincode}</p>}
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLOR[so.status] || 'bg-gray-100 text-gray-600'}`}>{statusLabel}</span>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3 mb-3 space-y-1">
                    {so.items?.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-gray-700">{lang === 'te' && item.product?.titleTE ? item.product.titleTE : item.product?.title} &times; {item.qty} {item.product?.unit}</span>
                        <span className="font-medium text-gray-800">₹{item.unitPrice * item.qty}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-sm border-t border-gray-200 pt-1 mt-1">
                      <span className="text-gray-500">{t({ en: 'Delivery fee', te: 'డెలివరీ రుసుము' })}</span>
                      <span className="text-gray-700">₹{so.deliveryFee}</span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span>{t({ en: 'Total', te: 'మొత్తం' })}</span>
                      <span className="text-primary-700">₹{so.amount + so.deliveryFee}</span>
                    </div>
                  </div>

                  {NEXT_STATUS[so.status] && (
                    <button onClick={() => advance(so)} disabled={updating === so.id}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 disabled:opacity-50">
                      {updating === so.id ? '...' : nextLabel(so.status)}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      {toast && <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-lg shadow text-sm">{toast}</div>}
    </div>
  );
}
