'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi, aiApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

interface FarmerPending {
  id: string;
  verificationLevel: string;
  district: string;
  village?: string;
  user: { name: string; email: string; phone?: string };
  docs: { id: string; docType: string; fileUrl: string; notes?: string; status: string }[];
}

export default function AdminFarmersPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [farmers, setFarmers] = useState<FarmerPending[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<FarmerPending | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }
    if (user.role !== 'ADMIN') { router.push('/'); return; }
    load();
  }, [user]);

  const load = () => {
    adminApi.pendingFarmers().then((r) => setFarmers(r.data)).finally(() => setLoading(false));
  };

  const verify = async (profileId: string, approved: boolean) => {
    try {
      await adminApi.verifyFarmer(profileId, {
        approved,
        reviewNotes,
      });
      setToast(approved ? '✅ Farmer approved!' : '❌ Farmer rejected');
      setSelected(null);
      setReviewNotes('');
      load();
    } catch (e: unknown) {
      setToast((e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Action failed');
    }
    setTimeout(() => setToast(''), 3000);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">🔍 Farmer Verification Queue</h1>

        {farmers.length === 0 ? (
          <div className="bg-white rounded-2xl border p-12 text-center text-gray-400">
            <div className="text-4xl mb-2">✅</div>
            <p>No pending verifications</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* List */}
            <div className="space-y-3">
              {farmers.map((f) => (
                <div
                  key={f.id}
                  onClick={() => { setSelected(f); setReviewNotes(''); }}
                  className={`bg-white rounded-xl border p-4 cursor-pointer hover:border-primary-300 transition-colors ${selected?.id === f.id ? 'border-primary-500 shadow-md' : 'border-gray-100'}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-gray-800">{f.user.name}</p>
                      <p className="text-xs text-gray-400">{f.user.email}</p>
                      <p className="text-xs text-gray-500 mt-1">{f.village ? `${f.village}, ` : ''}{f.district}</p>
                    </div>
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">{f.docs.length} docs</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Detail */}
            {selected && (
              <div className="bg-white rounded-2xl border border-primary-100 p-6">
                <h2 className="font-semibold text-gray-800 mb-4">Review: {selected.user.name}</h2>

                <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                  <div><span className="text-gray-400">Email:</span> {selected.user.email}</div>
                  <div><span className="text-gray-400">Phone:</span> {selected.user.phone || '—'}</div>
                  <div><span className="text-gray-400">District:</span> {selected.district}</div>
                  <div><span className="text-gray-400">Village:</span> {selected.village || '—'}</div>
                </div>

                {/* Docs */}
                <div className="space-y-3 mb-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Submitted Documents</p>
                  {selected.docs.map((doc) => (
                    <div key={doc.id} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">{doc.docType.replace('_', ' ')}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${doc.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : doc.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {doc.status}
                        </span>
                      </div>
                      {doc.notes && <p className="text-xs text-gray-500 mb-2">{doc.notes}</p>}
                      <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-primary-600 hover:underline">📄 View Document</a>
                    </div>
                  ))}
                </div>

                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Review notes (optional)..."
                  rows={2}
                  className="w-full border rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-primary-400"
                />

                <div className="flex gap-3">
                  <button
                    onClick={() => verify(selected.id, true)}
                    className="flex-1 py-2 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700"
                  >
                    ✅ Approve (Level 1)
                  </button>
                  <button
                    onClick={() => verify(selected.id, false)}
                    className="flex-1 py-2 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600"
                  >
                    ❌ Reject
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {toast && (
        <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-lg shadow text-sm">{toast}</div>
      )}
    </div>
  );
}
