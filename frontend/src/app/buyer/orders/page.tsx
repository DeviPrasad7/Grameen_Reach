'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ordersApi } from '@/lib/api';
import { useAuthStore, useLangStore } from '@/lib/store';
import toast from 'react-hot-toast';
import { Package, Loader2, ArrowRight, ChevronRight, ShoppingBag } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  PLACED: 'bg-blue-100 text-blue-700',
  CONFIRMED: 'bg-yellow-100 text-yellow-700',
  PACKED: 'bg-orange-100 text-orange-700',
  OUT_FOR_DELIVERY: 'bg-purple-100 text-purple-700',
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

const STATUS_TE: Record<string, string> = {
  PLACED: '\u0C06\u0C30\u0C4D\u0C21\u0C30\u0C4D \u0C1A\u0C47\u0C2F\u0C2C\u0C21\u0C3F\u0C02\u0C26\u0C3F',
  CONFIRMED: '\u0C28\u0C3F\u0C30\u0C4D\u0C27\u0C3E\u0C30\u0C3F\u0C02\u0C1A\u0C2C\u0C21\u0C3F\u0C02\u0C26\u0C3F',
  PACKED: '\u0C2A\u0C4D\u0C2F\u0C3E\u0C15\u0C4D \u0C1A\u0C47\u0C2F\u0C2C\u0C21\u0C3F\u0C02\u0C26\u0C3F',
  OUT_FOR_DELIVERY: '\u0C21\u0C46\u0C32\u0C3F\u0C35\u0C30\u0C40\u0C15\u0C3F \u0C2C\u0C2F\u0C32\u0C41\u0C26\u0C47\u0C30\u0C3F\u0C02\u0C26\u0C3F',
  DELIVERED: '\u0C21\u0C46\u0C32\u0C3F\u0C35\u0C30\u0C40 \u0C05\u0C2F\u0C3F\u0C02\u0C26\u0C3F',
  CANCELLED: '\u0C30\u0C26\u0C4D\u0C26\u0C41 \u0C1A\u0C47\u0C2F\u0C2C\u0C21\u0C3F\u0C02\u0C26\u0C3F',
};

interface SubOrder {
  id: string;
  status: string;
  amount: number;
  items: { qty: number; product: { title: string; titleTE?: string } }[];
}

interface Order {
  id: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  subOrders: SubOrder[];
}

export default function OrdersPage() {
  const router = useRouter();
  const { user, _hasHydrated } = useAuthStore();
  const { lang, t } = useLangStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!user) { router.push('/auth/login'); return; }
    ordersApi.list()
      .then((r) => setOrders(r.data))
      .catch(() => toast.error(t({ en: 'Failed to load orders', te: '\u0C06\u0C30\u0C4D\u0C21\u0C30\u0C4D\u0C32\u0C41 \u0C32\u0C4B\u0C21\u0C4D \u0C35\u0C3F\u0C2B\u0C32\u0C2E\u0C48\u0C02\u0C26\u0C3F' })))
      .finally(() => setLoading(false));
  }, [_hasHydrated, user]);

  if (!_hasHydrated || loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <ShoppingBag className="w-6 h-6 text-primary-600" />
          <h1 className="text-2xl font-bold text-slate-800">{t({ en: 'My Orders', te: '\u0C28\u0C3E \u0C06\u0C30\u0C4D\u0C21\u0C30\u0C4D\u0C32\u0C41' })}</h1>
          {orders.length > 0 && (
            <span className="text-sm text-slate-400">
              ({orders.length} {t({ en: 'orders', te: '\u0C06\u0C30\u0C4D\u0C21\u0C30\u0C4D\u0C32\u0C41' })})
            </span>
          )}
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 animate-fade-in">
            <Package className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <p className="text-lg font-medium text-slate-500">{t({ en: 'No orders yet', te: '\u0C07\u0C02\u0C15\u0C3E \u0C06\u0C30\u0C4D\u0C21\u0C30\u0C4D\u0C32\u0C41 \u0C32\u0C47\u0C35\u0C41' })}</p>
            <p className="text-sm text-slate-400 mt-1 mb-6">{t({ en: 'Browse products and place your first order', te: '\u0C09\u0C24\u0C4D\u0C2A\u0C24\u0C4D\u0C24\u0C41\u0C32\u0C41 \u0C1A\u0C42\u0C21\u0C02\u0C21\u0C3F \u0C2E\u0C40 \u0C2E\u0C4A\u0C26\u0C1F\u0C3F \u0C06\u0C30\u0C4D\u0C21\u0C30\u0C4D \u0C2A\u0C46\u0C1F\u0C4D\u0C1F\u0C02\u0C21\u0C3F' })}</p>
            <Link href="/buyer/browse" className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors">
              {t({ en: 'Browse Products', te: '\u0C09\u0C24\u0C4D\u0C2A\u0C24\u0C4D\u0C24\u0C41\u0C32\u0C41 \u0C1A\u0C42\u0C21\u0C02\u0C21\u0C3F' })} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4 animate-slide-up">
            {orders.map((order) => {
              const statusLabel = lang === 'te' ? STATUS_TE[order.status] || order.status : order.status;
              return (
                <Link key={order.id} href={`/buyer/orders/${order.id}`} className="block">
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 card-hover transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">
                          {t({ en: 'Order', te: '\u0C06\u0C30\u0C4D\u0C21\u0C30\u0C4D' })} #{order.id.slice(-8).toUpperCase()}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[order.status] || 'bg-slate-100 text-slate-600'}`}>
                        {statusLabel}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {order.subOrders?.map((so) => {
                        const soLabel = lang === 'te' ? STATUS_TE[so.status] || so.status : so.status;
                        return (
                          <div key={so.id} className="bg-slate-50 rounded-xl p-3 text-sm">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs text-slate-500">{t({ en: 'Sub-order', te: '\u0C09\u0C2A-\u0C06\u0C30\u0C4D\u0C21\u0C30\u0C4D' })}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[so.status] || 'bg-slate-100 text-slate-600'}`}>
                                {soLabel}
                              </span>
                            </div>
                            <p className="text-slate-700">
                              {so.items?.map((i) => {
                                const title = lang === 'te' && i.product?.titleTE ? i.product.titleTE : i.product?.title;
                                return `${title} \u00d7${i.qty}`;
                              }).join(', ')}
                            </p>
                            <p className="text-primary-600 font-semibold mt-1">₹{so.amount}</p>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100">
                      <span className="font-bold text-slate-800">
                        {t({ en: 'Total', te: '\u0C2E\u0C4A\u0C24\u0C4D\u0C24\u0C02' })}: ₹{order.totalAmount}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-primary-600 font-medium">
                        {t({ en: 'View details', te: '\u0C35\u0C3F\u0C35\u0C30\u0C3E\u0C32\u0C41 \u0C1A\u0C42\u0C21\u0C02\u0C21\u0C3F' })} <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
