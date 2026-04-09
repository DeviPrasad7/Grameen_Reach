'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ordersApi, bidsApi } from '@/lib/api';
import { useAuthStore, useLangStore } from '@/lib/store';
import {
  Loader2, Bell, Package, Gavel, CheckCircle2,
  XCircle, Clock, ArrowRight, Truck, ShoppingCart,
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'order' | 'bid';
  title: string;
  titleTE: string;
  description: string;
  descriptionTE: string;
  status: string;
  link: string;
  date: string;
  icon: typeof Package;
  color: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const { user, _hasHydrated } = useAuthStore();
  const { lang, t } = useLangStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'order' | 'bid'>('all');

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!user) { router.push('/auth/login'); return; }

    const loadNotifications = async () => {
      const notifs: Notification[] = [];

      try {
        const ordersRes = await ordersApi.list();
        const orders = ordersRes.data || [];

        if (user.role === 'FARMER') {
          // Farmer sees suborders
          for (const so of orders) {
            const statusInfo = getOrderStatusInfo(so.status);
            const itemNames = so.items?.map((i: any) => i.product?.title).join(', ') || 'Order';
            notifs.push({
              id: `order-${so.id}`,
              type: 'order',
              title: `Order ${statusInfo.labelEN}: ${itemNames.substring(0, 40)}`,
              titleTE: `ఆర్డర్ ${statusInfo.labelTE}: ${itemNames.substring(0, 40)}`,
              description: `₹${so.amount} from ${so.order?.buyer?.name || 'Buyer'}`,
              descriptionTE: `₹${so.amount} ${so.order?.buyer?.name || 'కొనుగోలుదారు'} నుండి`,
              status: so.status,
              link: '/farmer/orders',
              date: so.createdAt,
              icon: statusInfo.icon,
              color: statusInfo.color,
            });
          }
        } else {
          // Buyer sees orders
          for (const order of orders) {
            const statusInfo = getOrderStatusInfo(order.status);
            notifs.push({
              id: `order-${order.id}`,
              type: 'order',
              title: `Order #${order.id.slice(-8).toUpperCase()} — ${statusInfo.labelEN}`,
              titleTE: `ఆర్డర్ #${order.id.slice(-8).toUpperCase()} — ${statusInfo.labelTE}`,
              description: `₹${order.totalAmount} · ${order.subOrders?.length || 0} sub-orders`,
              descriptionTE: `₹${order.totalAmount} · ${order.subOrders?.length || 0} ఉప-ఆర్డర్లు`,
              status: order.status,
              link: `/buyer/orders/${order.id}`,
              date: order.createdAt,
              icon: statusInfo.icon,
              color: statusInfo.color,
            });
          }
        }
      } catch {}

      // Load bids
      try {
        if (user.role === 'FARMER') {
          const bidsRes = await bidsApi.farmerBids();
          for (const bid of (bidsRes.data || [])) {
            const bidInfo = getBidStatusInfo(bid.status);
            notifs.push({
              id: `bid-${bid.id}`,
              type: 'bid',
              title: `Bid on ${bid.product?.title}: ₹${bid.amount}`,
              titleTE: `${bid.product?.titleTE || bid.product?.title} పై బిడ్: ₹${bid.amount}`,
              description: `From ${bid.buyer?.name || 'Buyer'} — ${bidInfo.labelEN}`,
              descriptionTE: `${bid.buyer?.name || 'కొనుగోలుదారు'} నుండి — ${bidInfo.labelTE}`,
              status: bid.status,
              link: '/farmer/bids',
              date: bid.createdAt,
              icon: bidInfo.icon,
              color: bidInfo.color,
            });
          }
        } else {
          const bidsRes = await bidsApi.myBids();
          for (const bid of (bidsRes.data || [])) {
            const bidInfo = getBidStatusInfo(bid.status);
            notifs.push({
              id: `bid-${bid.id}`,
              type: 'bid',
              title: `Your bid on ${bid.product?.title}: ₹${bid.amount}`,
              titleTE: `${bid.product?.titleTE || bid.product?.title} పై మీ బిడ్: ₹${bid.amount}`,
              description: bidInfo.labelEN,
              descriptionTE: bidInfo.labelTE,
              status: bid.status,
              link: `/buyer/browse/${bid.productId}`,
              date: bid.createdAt,
              icon: bidInfo.icon,
              color: bidInfo.color,
            });
          }
        }
      } catch {}

      // Sort by date descending
      notifs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setNotifications(notifs);
      setLoading(false);
    };

    loadNotifications();
  }, [_hasHydrated, user]);

  function getOrderStatusInfo(status: string) {
    const map: Record<string, { labelEN: string; labelTE: string; icon: typeof Package; color: string }> = {
      PLACED: { labelEN: 'Placed', labelTE: 'ఆర్డర్', icon: ShoppingCart, color: 'bg-blue-50 text-blue-600' },
      CONFIRMED: { labelEN: 'Confirmed', labelTE: 'నిర్ధారణ', icon: CheckCircle2, color: 'bg-yellow-50 text-yellow-600' },
      PACKED: { labelEN: 'Packed', labelTE: 'ప్యాక్', icon: Package, color: 'bg-orange-50 text-orange-600' },
      OUT_FOR_DELIVERY: { labelEN: 'Out for Delivery', labelTE: 'డెలివరీ', icon: Truck, color: 'bg-purple-50 text-purple-600' },
      DELIVERED: { labelEN: 'Delivered', labelTE: 'అందజేత', icon: CheckCircle2, color: 'bg-green-50 text-green-600' },
      CANCELLED: { labelEN: 'Cancelled', labelTE: 'రద్దు', icon: XCircle, color: 'bg-red-50 text-red-600' },
    };
    return map[status] || { labelEN: status, labelTE: status, icon: Package, color: 'bg-slate-50 text-slate-600' };
  }

  function getBidStatusInfo(status: string) {
    const map: Record<string, { labelEN: string; labelTE: string; icon: typeof Gavel; color: string }> = {
      PENDING: { labelEN: 'Pending', labelTE: 'పెండింగ్', icon: Clock, color: 'bg-amber-50 text-amber-600' },
      ACCEPTED: { labelEN: 'Accepted', labelTE: 'ఆమోదించబడింది', icon: CheckCircle2, color: 'bg-green-50 text-green-600' },
      REJECTED: { labelEN: 'Rejected', labelTE: 'తిరస్కరించబడింది', icon: XCircle, color: 'bg-red-50 text-red-600' },
      COUNTERED: { labelEN: 'Countered', labelTE: 'కౌంటర్', icon: Gavel, color: 'bg-blue-50 text-blue-600' },
      EXPIRED: { labelEN: 'Expired', labelTE: 'గడువు ముగిసింది', icon: Clock, color: 'bg-slate-50 text-slate-600' },
    };
    return map[status] || { labelEN: status, labelTE: status, icon: Gavel, color: 'bg-slate-50 text-slate-600' };
  }

  const filtered = filter === 'all' ? notifications : notifications.filter((n) => n.type === filter);

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return t({ en: 'just now', te: 'ఇప్పుడే' });
    if (mins < 60) return `${mins}m ${t({ en: 'ago', te: 'క్రితం' })}`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ${t({ en: 'ago', te: 'క్రితం' })}`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ${t({ en: 'ago', te: 'క్రితం' })}`;
    return new Date(dateStr).toLocaleDateString();
  };

  if (!_hasHydrated || loading) {
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
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center gap-3 animate-fade-in">
            <Bell className="w-7 h-7" />
            <div>
              <h1 className="text-2xl font-bold">
                {t({ en: 'Notifications', te: 'నోటిఫికేషన్లు' })}
              </h1>
              <p className="text-primary-200 text-sm mt-0.5">
                {t({ en: 'Your order and bid updates', te: 'మీ ఆర్డర్ మరియు బిడ్ అప్‌డేట్‌లు' })}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        {/* Filter tabs */}
        <div className="flex gap-2 mb-6 animate-slide-up">
          {(['all', 'order', 'bid'] as const).map((f) => {
            const labels: Record<string, { en: string; te: string }> = {
              all: { en: 'All', te: 'అన్నీ' },
              order: { en: 'Orders', te: 'ఆర్డర్లు' },
              bid: { en: 'Bids', te: 'బిడ్లు' },
            };
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === f
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-primary-300'
                }`}
              >
                {t(labels[f])}
                {f !== 'all' && (
                  <span className="ml-1.5 text-xs opacity-70">
                    ({notifications.filter((n) => n.type === f).length})
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Notifications list */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 animate-fade-in">
            <Bell className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <p className="text-lg font-medium text-slate-500">
              {t({ en: 'No notifications yet', te: 'ఇంకా నోటిఫికేషన్లు లేవు' })}
            </p>
            <p className="text-sm text-slate-400 mt-1">
              {t({ en: 'Your order and bid updates will appear here', te: 'మీ ఆర్డర్ మరియు బిడ్ అప్‌డేట్‌లు ఇక్కడ కనిపిస్తాయి' })}
            </p>
          </div>
        ) : (
          <div className="space-y-3 animate-slide-up">
            {filtered.map((notif) => {
              const Icon = notif.icon;
              return (
                <Link
                  key={notif.id}
                  href={notif.link}
                  className="flex items-start gap-4 bg-white rounded-2xl border border-slate-100 p-4 card-hover group"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${notif.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-primary-700 transition-colors">
                      {lang === 'te' ? notif.titleTE : notif.title}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {lang === 'te' ? notif.descriptionTE : notif.description}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">{timeAgo(notif.date)}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 flex-shrink-0 mt-1 group-hover:text-primary-500 transition-colors" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
