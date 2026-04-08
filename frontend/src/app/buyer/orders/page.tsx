'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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

const STATUS_TE: Record<string, string> = {
  PLACED: 'ఆర్డర్ చేయబడింది',
  CONFIRMED: 'నిర్ధారించబడింది',
  PACKED: 'ప్యాక్ చేయబడింది',
  OUT_FOR_DELIVERY: 'డెలివరీకి బయలుదేరింది',
  DELIVERED: 'డెలివరీ అయింది',
  CANCELLED: 'రద్దు చేయబడింది',
};

export default function OrdersPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { lang, t } = useLangStore();
  const [orders, setOrders] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }
    ordersApi.list().then((r) => setOrders(r.data)).finally(() => setLoading(false));
  }, [user]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">{t({ en: 'Loading orders...', te: 'ఆర్డర్లు లోడ్ అవుతోంది...' })}</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">{t({ en: 'My Orders', te: 'నా ఆర్డర్లు' })}</h1>
        {orders.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border">
            <div className="text-5xl mb-3">📭</div>
            <p className="text-gray-500">{t({ en: 'No orders yet', te: 'ఇంకా ఆర్డర్లు లేవు' })}</p>
            <Link href="/buyer/browse" className="mt-4 inline-block text-primary-600 font-medium hover:underline">
              {t({ en: 'Start shopping →', te: 'షాపింగ్ ప్రారంభించండి →' })}
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {(orders as Record<string, unknown>[]).map((o) => {
              const order = o as {
                id: string; status: string; totalAmount: number;
                createdAt: string; subOrders: { id: string; status: string; amount: number; items: { qty: number; product: { title: string; titleTE?: string } }[] }[];
              };
              const statusLabel = lang === 'te' ? STATUS_TE[order.status] || order.status : order.status;
              return (
                <div key={order.id} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{t({ en: 'Order', te: 'ఆర్డర్' })} #{order.id.slice(-8).toUpperCase()}</p>
                      <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}>
                      {statusLabel}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {order.subOrders?.map((so) => {
                      const soLabel = lang === 'te' ? STATUS_TE[so.status] || so.status : so.status;
                      return (
                        <div key={so.id} className="bg-gray-50 rounded-lg p-3 text-sm">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs text-gray-500">{t({ en: 'Sub-order', te: 'ఉప-ఆర్డర్' })}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[so.status] || 'bg-gray-100 text-gray-600'}`}>{soLabel}</span>
                          </div>
                          <p className="text-gray-700">{so.items?.map((i) => `${i.product?.title} ×${i.qty}`).join(', ')}</p>
                          <p className="text-primary-600 font-semibold mt-1">₹{so.amount}</p>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                    <span className="font-bold text-gray-800">{t({ en: 'Total', te: 'మొత్తం' })}: ₹{order.totalAmount}</span>
                    <Link href={`/buyer/orders/${order.id}`} className="text-xs text-primary-600 hover:underline">
                      {t({ en: 'View details →', te: 'వివరాలు చూడండి →' })}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
