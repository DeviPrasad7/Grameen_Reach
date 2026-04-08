'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { aiApi } from '@/lib/api';
import { useAuthStore, useLangStore } from '@/lib/store';

interface AiLog {
  id: string; feature: string; model: string; tokens?: number; durationMs?: number;
  cached: boolean; prompt?: string; response?: string; userId?: string; createdAt: string;
  user?: { name: string; email: string };
}

const FEATURE_COLOR: Record<string, string> = {
  'listing-generator': 'bg-green-100 text-green-700',
  'price-coach': 'bg-blue-100 text-blue-700',
  'counter-offer': 'bg-yellow-100 text-yellow-700',
  'basket-builder': 'bg-purple-100 text-purple-700',
  'moderation-helper': 'bg-red-100 text-red-700',
};

export default function AdminAiLogsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { t } = useLangStore();
  const [logs, setLogs] = useState<AiLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }
    if (user.role !== 'ADMIN') { router.push('/'); return; }
    load(1);
  }, [user]);

  const load = (p: number) => {
    setLoading(true);
    aiApi.auditLogs({ page: p, limit: 50 })
      .then((r) => {
        const data = r.data?.items || r.data || [];
        if (p === 1) setLogs(data); else setLogs((prev) => [...prev, ...data]);
        setHasMore(data.length === 50); setPage(p);
      })
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  };

  const cachedCount = logs.filter((l) => l.cached).length;
  const totalTokens = logs.reduce((s, l) => s + (l.tokens || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">{t({ en: 'AI Audit Logs', te: 'AI ఆడిట్ లాగ్స్' })}</h1>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <div className="text-2xl font-bold text-gray-800">{logs.length}</div>
            <div className="text-xs text-gray-500 mt-1">{t({ en: 'Total Calls', te: 'మొత్తం కాల్స్' })}</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{cachedCount}</div>
            <div className="text-xs text-gray-500 mt-1">{t({ en: 'Cached', te: 'కాష్ చేయబడిన' })}</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{totalTokens}</div>
            <div className="text-xs text-gray-500 mt-1">{t({ en: 'Total Tokens', te: 'మొత్తం టోకెన్‌లు' })}</div>
          </div>
        </div>

        {loading && logs.length === 0 ? (
          <div className="text-center py-16 text-gray-400">{t({ en: 'Loading logs...', te: 'లాగ్స్ లోడ్ అవుతోంది...' })}</div>
        ) : logs.length === 0 ? (
          <div className="bg-white rounded-2xl border p-12 text-center text-gray-400">
            <div className="text-4xl mb-2">🤖</div>
            <p>{t({ en: 'No AI calls logged yet', te: 'ఇంకా AI కాల్స్ లాగ్ చేయబడలేదు' })}</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {[
                    t({ en: 'Feature', te: 'ఫీచర్' }), t({ en: 'Model', te: 'మోడల్' }),
                    t({ en: 'User', te: 'వినియోగదారు' }), t({ en: 'Tokens', te: 'టోకెన్‌లు' }),
                    t({ en: 'Duration', te: 'సమయం' }), t({ en: 'Cached', te: 'కాష్' }),
                    t({ en: 'Time', te: 'సమయం' }),
                  ].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${FEATURE_COLOR[log.feature] || 'bg-gray-100 text-gray-600'}`}>{log.feature}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 font-mono text-xs">{log.model || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{log.user?.name || log.userId?.slice(0, 8) || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{log.tokens ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{log.durationMs ? `${log.durationMs}ms` : '—'}</td>
                    <td className="px-4 py-3">
                      {log.cached ? <span className="text-xs text-blue-600 font-medium">{t({ en: 'Cached', te: 'కాష్' })}</span> : <span className="text-xs text-green-600 font-medium">{t({ en: 'Live', te: 'లైవ్' })}</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{new Date(log.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {hasMore && (
              <div className="p-4 text-center border-t border-gray-100">
                <button onClick={() => load(page + 1)} disabled={loading}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50">
                  {loading ? '...' : t({ en: 'Load more', te: 'మరిన్ని లోడ్ చేయండి' })}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
