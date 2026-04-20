'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { messagesApi } from '@/lib/api';
import { useAuthStore, useLangStore } from '@/lib/store';
import toast from 'react-hot-toast';
import { Loader2, MessageSquare, MailCheck, User, Calendar, Package, CheckCircle2 } from 'lucide-react';

interface InboxMessage {
  id: string;
  message: string;
  readAt?: string | null;
  createdAt: string;
  buyer: { name: string; email: string; phone?: string };
  product: { id: string; title: string; unit: string; district?: string };
}

export default function FarmerMessagesPage() {
  const router = useRouter();
  const { user, _hasHydrated } = useAuthStore();
  const { t } = useLangStore();
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingId, setMarkingId] = useState<string | null>(null);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!user) { router.push('/auth/login'); return; }
    if (user.role !== 'FARMER') { router.push('/'); return; }

    messagesApi.inbox()
      .then((r) => setMessages(r.data || []))
      .catch(() => toast.error(t({ en: 'Failed to load messages', te: 'సందేశాలను లోడ్ చేయడం విఫలమైంది' })))
      .finally(() => setLoading(false));
  }, [_hasHydrated, user, router]);

  const markRead = async (id: string) => {
    setMarkingId(id);
    try {
      await messagesApi.markRead(id);
      setMessages((prev) => prev.map((msg) => (msg.id === id ? { ...msg, readAt: new Date().toISOString() } : msg)));
    } catch {
      toast.error(t({ en: 'Failed to update message', te: 'సందేశాన్ని అప్‌డేట్ చేయడం విఫలమైంది' }));
    } finally {
      setMarkingId(null);
    }
  };

  if (!_hasHydrated || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
      </div>
    );
  }

  const unreadCount = messages.filter((msg) => !msg.readAt).length;

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-primary-600" />
              {t({ en: 'Customer Messages', te: 'కస్టమర్ సందేశాలు' })}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {t({ en: 'View enquiries from buyers and keep them moving toward a sale.', te: 'కొనుగోలుదారుల విచారణలను చూడండి మరియు అమ్మకం వైపు తీసుకెళ్లండి.' })}
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700">
            {unreadCount} {t({ en: 'unread', te: 'చదవనివి' })}
          </div>
        </div>

        {messages.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500">
            {t({ en: 'No customer messages yet.', te: 'ఇంకా కస్టమర్ సందేశాలు లేవు.' })}
          </div>
        ) : (
          <div className="grid gap-4">
            {messages.map((message) => (
              <div key={message.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${message.readAt ? 'bg-slate-100 text-slate-600' : 'bg-emerald-100 text-emerald-700'}`}>
                        {message.readAt ? t({ en: 'Read', te: 'చదివారు' }) : t({ en: 'Unread', te: 'చదవలేదు' })}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(message.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-[10px] uppercase tracking-wide text-slate-400 mb-1">{t({ en: 'Buyer', te: 'కొనుగోలుదారు' })}</p>
                        <p className="text-sm font-semibold text-slate-800 flex items-center gap-2"><User className="w-4 h-4 text-primary-600" />{message.buyer.name}</p>
                        <p className="text-xs text-slate-500">{message.buyer.email}</p>
                        {message.buyer.phone && <p className="text-xs text-slate-500">{message.buyer.phone}</p>}
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-[10px] uppercase tracking-wide text-slate-400 mb-1">{t({ en: 'Product', te: 'ఉత్పత్తి' })}</p>
                        <p className="text-sm font-semibold text-slate-800 flex items-center gap-2"><Package className="w-4 h-4 text-primary-600" />{message.product.title}</p>
                        <p className="text-xs text-slate-500">{message.product.district || '—'} · {message.product.unit}</p>
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-700 leading-relaxed">
                      {message.message}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 lg:w-44">
                    <button
                      onClick={() => markRead(message.id)}
                      disabled={!!markingId}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 disabled:opacity-50 transition-colors"
                    >
                      <MailCheck className="w-4 h-4" />
                      {message.readAt ? t({ en: 'Already Read', te: 'ఇప్పటికే చదివారు' }) : t({ en: 'Mark Read', te: 'చదివినట్లు గుర్తించు' })}
                    </button>
                    <Link
                      href={`/buyer/browse/${message.product.id}`}
                      className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      {t({ en: 'View Product', te: 'ఉత్పత్తి చూడండి' })}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}