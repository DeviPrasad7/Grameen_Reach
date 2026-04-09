'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { aiApi } from '@/lib/api';
import { useAuthStore, useLangStore } from '@/lib/store';
import toast from 'react-hot-toast';
import {
  Loader2, Bot, Activity, Database, Zap,
  ChevronDown, Clock,
} from 'lucide-react';

interface AiLog {
  id: string;
  feature: string;
  model: string;
  tokens?: number;
  durationMs?: number;
  cached: boolean;
  prompt?: string;
  response?: string;
  userId?: string;
  createdAt: string;
  user?: { name: string; email: string };
}

const FEATURE_COLOR: Record<string, string> = {
  'listing-generator': 'bg-green-100 text-green-700',
  'price-coach': 'bg-blue-100 text-blue-700',
  'counter-offer': 'bg-amber-100 text-amber-700',
  'basket-builder': 'bg-purple-100 text-purple-700',
  'moderation-helper': 'bg-red-100 text-red-700',
};

export default function AdminAiLogsPage() {
  const router = useRouter();
  const { user, _hasHydrated } = useAuthStore();
  const { t } = useLangStore();
  const [logs, setLogs] = useState<AiLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!user) { router.push('/auth/login'); return; }
    if (user.role !== 'ADMIN') { router.push('/'); return; }
    load(1);
  }, [_hasHydrated, user, router]);

  const load = (p: number) => {
    if (p === 1) setLoading(true);
    else setLoadingMore(true);

    aiApi.auditLogs({ page: p, limit: 50 })
      .then((r) => {
        const data = r.data?.items || r.data || [];
        if (p === 1) setLogs(data);
        else setLogs((prev) => [...prev, ...data]);
        setHasMore(data.length === 50);
        setPage(p);
      })
      .catch(() => {
        if (p === 1) setLogs([]);
        toast.error(t({ en: 'Failed to load logs', te: 'లాగ్స్ లోడ్ చేయడం విఫలమైంది' }));
      })
      .finally(() => {
        setLoading(false);
        setLoadingMore(false);
      });
  };

  const cachedCount = logs.filter((l) => l.cached).length;
  const totalTokens = logs.reduce((s, l) => s + (l.tokens || 0), 0);

  // ── Pre-hydration spinner ──────────────────────────────────────────
  if (!_hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
      </div>
    );
  }

  // ── Data loading spinner ───────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
        <p className="text-sm text-slate-400">
          {t({ en: 'Loading audit logs...', te: 'ఆడిట్ లాగ్స్ లోడ్ అవుతోంది...' })}
        </p>
      </div>
    );
  }

  const stats = [
    {
      label: t({ en: 'Total Calls', te: 'మొత్తం కాల్స్' }),
      value: logs.length,
      icon: Activity,
      color: 'bg-slate-50 text-slate-600',
      valueColor: 'text-slate-800',
    },
    {
      label: t({ en: 'Cached', te: 'కాష్ చేయబడిన' }),
      value: cachedCount,
      icon: Database,
      color: 'bg-green-50 text-green-600',
      valueColor: 'text-green-600',
    },
    {
      label: t({ en: 'Total Tokens', te: 'మొత్తం టోకెన్‌లు' }),
      value: totalTokens.toLocaleString(),
      icon: Zap,
      color: 'bg-blue-50 text-blue-600',
      valueColor: 'text-blue-600',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero header */}
      <div className="bg-gradient-to-r from-primary-700 via-primary-600 to-emerald-600 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center gap-3 animate-fade-in">
            <Bot className="w-7 h-7" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">
                {t({ en: 'AI Audit Logs', te: 'AI ఆడిట్ లాగ్స్' })}
              </h1>
              <p className="text-primary-200 text-sm mt-1">
                {t({ en: 'Monitor AI usage and performance', te: 'AI వాడకం మరియు పనితీరును పర్యవేక్షించండి' })}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-slide-up">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.label}
                className="bg-white rounded-2xl border border-slate-100 p-5 card-hover"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className={`text-2xl font-bold ${s.valueColor}`}>{s.value}</p>
                    <p className="text-xs text-slate-500">{s.label}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Logs table */}
        {logs.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 animate-fade-in">
            <Bot className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <p className="text-lg font-medium text-slate-500">
              {t({ en: 'No AI calls logged yet', te: 'ఇంకా AI కాల్స్ లాగ్ చేయబడలేదు' })}
            </p>
            <p className="text-sm text-slate-400 mt-1">
              {t({ en: 'AI usage will appear here once features are used', te: 'ఫీచర్‌లు ఉపయోగించిన తర్వాత AI వాడకం ఇక్కడ కనిపిస్తుంది' })}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden animate-slide-up">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    {[
                      t({ en: 'Feature', te: 'ఫీచర్' }),
                      t({ en: 'Model', te: 'మోడల్' }),
                      t({ en: 'User', te: 'వినియోగదారు' }),
                      t({ en: 'Tokens', te: 'టోకెన్‌లు' }),
                      t({ en: 'Duration', te: 'సమయం' }),
                      t({ en: 'Cached', te: 'కాష్' }),
                      t({ en: 'Timestamp', te: 'సమయముద్ర' }),
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${FEATURE_COLOR[log.feature] || 'bg-slate-100 text-slate-600'}`}>
                          {log.feature}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-mono text-xs">
                        {log.model || '---'}
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-xs">
                        {log.user?.name || log.userId?.slice(0, 8) || '---'}
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs font-medium">
                        {log.tokens?.toLocaleString() ?? '---'}
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">
                        {log.durationMs ? (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {log.durationMs}ms
                          </span>
                        ) : '---'}
                      </td>
                      <td className="px-4 py-3">
                        {log.cached ? (
                          <span className="inline-flex items-center gap-1 text-xs text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-full">
                            <Database className="w-3 h-3" />
                            {t({ en: 'Cached', te: 'కాష్' })}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full">
                            <Zap className="w-3 h-3" />
                            {t({ en: 'Live', te: 'లైవ్' })}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Load more */}
            {hasMore && (
              <div className="p-4 text-center border-t border-slate-100">
                <button
                  onClick={() => load(page + 1)}
                  disabled={loadingMore}
                  className="inline-flex items-center gap-2 px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                >
                  {loadingMore ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                  {t({ en: 'Load more', te: 'మరిన్ని లోడ్ చేయండి' })}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
