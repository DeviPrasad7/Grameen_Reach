'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi } from '@/lib/api';
import { useAuthStore, useLangStore } from '@/lib/store';
import toast from 'react-hot-toast';
import {
  Loader2, ShieldCheck, FileText, CheckCircle2,
  XCircle, User, Mail, Phone, MapPin, Home,
} from 'lucide-react';

interface FarmerPending {
  id: string;
  verificationLevel: string;
  district: string;
  village?: string;
  user: { name: string; email: string; phone?: string };
  docs: { id: string; docType: string; fileUrl: string; notes?: string; status: string }[];
}

const DOC_LABELS: Record<string, string> = {
  RATION_CARD: 'Ration Card',
  FARMER_ID: 'Farmer ID',
  LAND_DOCUMENT: 'Land Document',
  AADHAAR: 'Aadhaar',
  OTHER: 'Other Document',
};

const formatDocLabel = (docType: string) => DOC_LABELS[docType] || docType.replace(/_/g, ' ');

const DOC_STATUS_COLOR: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
};

export default function AdminFarmersPage() {
  const router = useRouter();
  const { user, _hasHydrated } = useAuthStore();
  const { t } = useLangStore();
  const [farmers, setFarmers] = useState<FarmerPending[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<FarmerPending | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!user) { router.push('/auth/login'); return; }
    if (user.role !== 'ADMIN') { router.push('/'); return; }
    load();
  }, [_hasHydrated, user, router]);

  const load = () => {
    adminApi.pendingFarmers()
      .then((r) => setFarmers(r.data))
      .catch(() => toast.error(t({ en: 'Failed to load farmers', te: 'రైతులను లోడ్ చేయడం విఫలమైంది' })))
      .finally(() => setLoading(false));
  };

  const verify = async (profileId: string, approved: boolean) => {
    setSubmitting(true);
    try {
      await adminApi.verifyFarmer(profileId, {
        action: approved ? 'APPROVE' : 'REJECT',
        notes: reviewNotes || undefined,
      });
      toast.success(
        approved
          ? t({ en: 'Farmer approved!', te: 'రైతు ఆమోదించబడ్డారు!' })
          : t({ en: 'Farmer rejected', te: 'రైతు తిరస్కరించబడ్డారు' }),
      );
      setSelected(null);
      setReviewNotes('');
      load();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || t({ en: 'Action failed', te: 'చర్య విఫలమైంది' }));
    } finally {
      setSubmitting(false);
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

  // ── Data loading spinner ───────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
        <p className="text-sm text-slate-400">
          {t({ en: 'Loading verifications...', te: 'ధృవీకరణలు లోడ్ అవుతోంది...' })}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero header */}
      <div className="bg-gradient-to-r from-primary-700 via-primary-600 to-emerald-600 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center gap-3 animate-fade-in">
            <ShieldCheck className="w-7 h-7" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">
                {t({ en: 'Farmer Verification', te: 'రైతు ధృవీకరణ' })}
              </h1>
              <p className="text-primary-200 text-sm mt-1">
                {t({ en: 'Review and verify farmer registrations', te: 'రైతు నమోదులను సమీక్షించండి మరియు ధృవీకరించండి' })}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {farmers.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 animate-fade-in">
            <CheckCircle2 className="w-16 h-16 text-primary-200 mx-auto mb-4" />
            <p className="text-lg font-medium text-slate-500">
              {t({ en: 'No pending verifications', te: 'పెండింగ్ ధృవీకరణలు లేవు' })}
            </p>
            <p className="text-sm text-slate-400 mt-1">
              {t({ en: 'All farmer registrations have been reviewed', te: 'అన్ని రైతు నమోదులు సమీక్షించబడ్డాయి' })}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-slide-up">
            {/* Left panel — farmer list */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                {farmers.length} {t({ en: 'pending', te: 'పెండింగ్' })}
              </p>
              {farmers.map((f) => (
                <div
                  key={f.id}
                  onClick={() => { setSelected(f); setReviewNotes(''); }}
                  className={`bg-white rounded-2xl border p-5 cursor-pointer transition-all card-hover ${
                    selected?.id === f.id
                      ? 'border-primary-500 shadow-md ring-1 ring-primary-200'
                      : 'border-slate-100 hover:border-primary-300'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
                        <User className="w-5 h-5 text-primary-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{f.user.name}</p>
                        <p className="text-xs text-slate-400">{f.user.email}</p>
                        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {f.village ? `${f.village}, ` : ''}{f.district}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      {f.docs.length} {t({ en: 'docs', te: 'పత్రాలు' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Right panel — selected farmer details */}
            {selected ? (
              <div className="bg-white rounded-2xl border border-primary-100 p-6 animate-fade-in h-fit sticky top-6">
                <h2 className="font-semibold text-slate-800 text-lg mb-4 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-primary-600" />
                  {t({ en: 'Review:', te: 'సమీక్ష:' })} {selected.user.name}
                </h2>

                {/* Farmer info grid */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  {[
                    { icon: Mail, label: t({ en: 'Email', te: 'ఇమెయిల్' }), value: selected.user.email },
                    { icon: Phone, label: t({ en: 'Phone', te: 'ఫోన్' }), value: selected.user.phone || '---' },
                    { icon: MapPin, label: t({ en: 'District', te: 'జిల్లా' }), value: selected.district },
                    { icon: Home, label: t({ en: 'Village', te: 'గ్రామం' }), value: selected.village || '---' },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.label} className="bg-slate-50 rounded-xl p-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Icon className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-xs text-slate-400">{item.label}</span>
                        </div>
                        <p className="text-sm font-medium text-slate-700 truncate">{item.value}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Documents section */}
                <div className="mb-5">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
                    {t({ en: 'Submitted Documents', te: 'సమర్పించిన పత్రాలు' })}
                  </p>
                  <div className="space-y-3">
                    {selected.docs.map((doc) => (
                      <div key={doc.id} className="bg-slate-50 rounded-xl p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-slate-700 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-slate-400" />
                            {formatDocLabel(doc.docType)}
                          </span>
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${DOC_STATUS_COLOR[doc.status] || 'bg-slate-100 text-slate-600'}`}>
                            {doc.status}
                          </span>
                        </div>
                        {doc.notes && (
                          <p className="text-xs text-slate-500 mb-2 italic">{doc.notes}</p>
                        )}
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary-600 hover:text-primary-700 font-medium hover:underline transition-colors"
                        >
                          {t({ en: 'View Document', te: 'పత్రం చూడండి' })}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Review notes */}
                <div className="mb-5">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                    {t({ en: 'Review Notes', te: 'సమీక్ష గమనికలు' })}
                  </label>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder={t({ en: 'Add review notes (optional)...', te: 'సమీక్ష గమనికలు జోడించండి (ఐచ్ఛికం)...' })}
                    rows={3}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent resize-none"
                  />
                </div>

                {/* Action buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => verify(selected.id, true)}
                    disabled={submitting}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 disabled:opacity-50 transition-colors"
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    {t({ en: 'Approve (Level 1)', te: 'ఆమోదించు (స్థాయి 1)' })}
                  </button>
                  <button
                    onClick={() => verify(selected.id, false)}
                    disabled={submitting}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 disabled:opacity-50 transition-colors"
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                    {t({ en: 'Reject', te: 'తిరస్కరించు' })}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-100 p-12 flex flex-col items-center justify-center text-center animate-fade-in h-fit">
                <ShieldCheck className="w-12 h-12 text-slate-200 mb-4" />
                <p className="text-sm text-slate-400">
                  {t({ en: 'Select a farmer to review', te: 'సమీక్షించడానికి ఒక రైతును ఎంచుకోండి' })}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
