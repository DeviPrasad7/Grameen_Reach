'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ordersApi } from '@/lib/api';
import { useAuthStore, useLangStore } from '@/lib/store';
import toast from 'react-hot-toast';
import {
  Loader2, ClipboardList, Truck, PackageCheck, CheckCircle2,
  MapPin, ChevronRight, User, Calendar,
} from 'lucide-react';

const STATUS_COLOR: Record<string, string> = {
  PLACED: 'bg-blue-100 text-blue-700',
  CONFIRMED: 'bg-amber-100 text-amber-700',
  PACKED: 'bg-orange-100 text-orange-700',
  OUT_FOR_DELIVERY: 'bg-purple-100 text-purple-700',
  DELIVERED: 'bg-primary-100 text-primary-700',
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

const NEXT_STATUS: Record<string, string> = {
  PLACED: 'CONFIRMED',
  CONFIRMED: 'PACKED',
  PACKED: 'OUT_FOR_DELIVERY',
  OUT_FOR_DELIVERY: 'DELIVERED',
};

const NEXT_LABEL: Record<string, { en: string; te: string }> = {
  PLACED: { en: 'Mark Confirmed', te: 'నిర్ధారించు' },
  CONFIRMED: { en: 'Mark Packed', te: 'ప్యాక్ చేయు' },
  PACKED: { en: 'Out for Delivery', te: 'డెలివరీకి పంపు' },
  OUT_FOR_DELIVERY: { en: 'Mark Delivered', te: 'డెలివరీ అయింది' },
};

const STATUS_ICON: Record<string, typeof ClipboardList> = {
  PLACED: ClipboardList,
  CONFIRMED: CheckCircle2,
  PACKED: PackageCheck,
  OUT_FOR_DELIVERY: Truck,
  DELIVERED: CheckCircle2,
};

interface SubOrder {
  id: string;
  orderId: string;
  status: string;
  amount: number;
  deliveryFee: number;
  createdAt: string;
  items: {
    qty: number;
    unitPrice: number;
    product: { title: string; titleTE?: string; unit: string };
  }[];
  order: {
    id: string;
    deliveryAddress: unknown;
    buyer: { name: string; email: string };
  };
}

export default function FarmerOrdersPage() {
  const router = useRouter();
  const { user, _hasHydrated } = useAuthStore();
  const { lang, t } = useLangStore();
  const [subOrders, setSubOrders] = useState<SubOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!user) { router.push('/auth/login'); return; }
    if (user.role !== 'FARMER') { router.push('/'); return; }
    loadOrders();
  }, [_hasHydrated, user, router]);

  const loadOrders = () => {
    ordersApi.list()
      .then((r) => setSubOrders(r.data as SubOrder[]))
      .catch(() => toast.error(t({ en: 'Failed to load orders', te: 'ఆర్డర్లు లోడ్ చేయడం విఫలమైంది' })))
      .finally(() => setLoading(false));
  };

  const advanceStatus = async (so: SubOrder) => {
    const next = NEXT_STATUS[so.status];
    if (!next) return;
    setUpdatingId(so.id);
    try {
      await ordersApi.updateSubOrderStatus(so.orderId, so.id, next);
      toast.success(
        t({
          en: `Status updated to ${next.replace(/_/g, ' ')}`,
          te: `స్థితి ${STATUS_TE[next] || next}కు అప్‌డేట్ చేయబడింది`,
        }),
      );
      loadOrders();
    } catch {
      toast.error(t({ en: 'Failed to update status', te: 'స్థితి అప్‌డేట్ విఫలమైంది' }));
    } finally {
      setUpdatingId(null);
    }
  };

  // ── Pre-hydration spinner ──────────────────────────────────────────
  if (!_hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-700 via-primary-600 to-emerald-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <div className="animate-fade-in">
            <h1 className="text-2xl sm:text-3xl font-bold">
              {t({ en: 'My Orders', te: 'నా ఆర్డర్లు' })}
            </h1>
            <p className="text-primary-200 text-sm mt-1">
              {t({ en: 'Track and manage your order fulfillment', te: 'మీ ఆర్డర్ నెరవేర్పును ట్రాక్ చేసి నిర్వహించండి' })}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
            <p className="text-sm text-slate-400">{t({ en: 'Loading orders...', te: 'ఆర్డర్లు లోడ్ అవుతోంది...' })}</p>
          </div>
        ) : subOrders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center animate-fade-in">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-50 flex items-center justify-center">
              <ClipboardList className="w-8 h-8 text-blue-400" />
            </div>
            <p className="text-slate-500 mb-2 font-medium">
              {t({ en: 'No orders yet', te: 'ఇంకా ఆర్డర్లు లేవు' })}
            </p>
            <p className="text-sm text-slate-400">
              {t({ en: 'Orders from buyers will appear here', te: 'కొనుగోలుదారుల ఆర్డర్లు ఇక్కడ కనిపిస్తాయి' })}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {subOrders.map((so, idx) => {
              const addr = so.order?.deliveryAddress as Record<string, string> | undefined;
              const statusLabel = lang === 'te' ? STATUS_TE[so.status] || so.status : so.status.replace(/_/g, ' ');
              const isUpdating = updatingId === so.id;
              const nextStatus = NEXT_STATUS[so.status];
              const StatusIcon = STATUS_ICON[so.status] || ClipboardList;

              return (
                <div
                  key={so.id}
                  className="bg-white rounded-2xl border border-slate-100 overflow-hidden card-hover animate-slide-up"
                  style={{ animationDelay: `${idx * 50}ms`, animationFillMode: 'backwards' }}
                >
                  {/* Order header */}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-slate-800">
                            {t({ en: 'Order', te: 'ఆర్డర్' })} #{so.orderId.slice(-8).toUpperCase()}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {so.order?.buyer?.name}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(so.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {addr && (
                          <p className="flex items-start gap-1 text-xs text-slate-500 mt-1.5">
                            <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            {addr.street}, {addr.city} {addr.pincode ? `– ${addr.pincode}` : ''}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <StatusIcon className={`w-3.5 h-3.5 ${STATUS_COLOR[so.status]?.includes('primary') ? 'text-primary-600' : STATUS_COLOR[so.status]?.includes('blue') ? 'text-blue-600' : STATUS_COLOR[so.status]?.includes('amber') ? 'text-amber-600' : STATUS_COLOR[so.status]?.includes('orange') ? 'text-orange-600' : STATUS_COLOR[so.status]?.includes('purple') ? 'text-purple-600' : 'text-slate-500'}`} />
                        <span className={`text-[10px] px-2.5 py-1 rounded-full font-medium ${STATUS_COLOR[so.status] || 'bg-slate-100 text-slate-600'}`}>
                          {statusLabel}
                        </span>
                      </div>
                    </div>

                    {/* Items breakdown */}
                    <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                      {so.items?.map((item, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-slate-700">
                            {lang === 'te' && item.product?.titleTE
                              ? item.product.titleTE
                              : item.product?.title}
                            {' '}
                            <span className="text-slate-400">&times; {item.qty} {item.product?.unit}</span>
                          </span>
                          <span className="font-medium text-slate-800">
                            ₹{(item.unitPrice * item.qty).toLocaleString()}
                          </span>
                        </div>
                      ))}
                      <div className="flex justify-between text-sm pt-2 border-t border-slate-200">
                        <span className="text-slate-400">
                          <Truck className="w-3.5 h-3.5 inline mr-1" />
                          {t({ en: 'Delivery fee', te: 'డెలివరీ రుసుము' })}
                        </span>
                        <span className="text-slate-600">₹{so.deliveryFee}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-sm">
                        <span className="text-slate-700">{t({ en: 'Total', te: 'మొత్తం' })}</span>
                        <span className="text-primary-700">₹{(so.amount + so.deliveryFee).toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Advance status button */}
                    {nextStatus && (
                      <div className="mt-4 pt-3 border-t border-slate-100">
                        <button
                          onClick={() => advanceStatus(so)}
                          disabled={isUpdating}
                          className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 disabled:opacity-50 transition-colors"
                        >
                          {isUpdating ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                          {t(NEXT_LABEL[so.status] || { en: 'Advance', te: 'ముందుకు' })}
                        </button>
                      </div>
                    )}

                    {/* Delivered badge */}
                    {so.status === 'DELIVERED' && (
                      <div className="mt-4 pt-3 border-t border-slate-100">
                        <div className="flex items-center gap-2 text-sm text-primary-600 font-medium">
                          <CheckCircle2 className="w-4 h-4" />
                          {t({ en: 'Order delivered successfully', te: 'ఆర్డర్ విజయవంతంగా డెలివరీ చేయబడింది' })}
                        </div>
                      </div>
                    )}
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
