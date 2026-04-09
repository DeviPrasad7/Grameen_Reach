'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usersApi, farmerApi } from '@/lib/api';
import { useAuthStore, useLangStore } from '@/lib/store';
import toast from 'react-hot-toast';
import { User, Mail, Phone, Calendar, Shield, MapPin, Save, Loader2, FileText, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

interface FarmerProfile {
  id: string;
  verificationLevel: string;
  village?: string;
  mandal?: string;
  district?: string;
  pincode?: string;
  bio?: string;
  docs: { id: string; docType: string; status: string; fileUrl: string; createdAt: string }[];
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, _hasHydrated, setAuth } = useAuthStore();
  const { t } = useLangStore();
  const [profile, setProfile] = useState<{ name: string; email: string; phone: string; createdAt: string } | null>(null);
  const [farmerProfile, setFarmerProfile] = useState<FarmerProfile | null>(null);
  const [form, setForm] = useState({ name: '', phone: '' });
  const [farmerForm, setFarmerForm] = useState({ village: '', district: '', pincode: '', bio: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingFarmer, setSavingFarmer] = useState(false);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!user) { router.push('/auth/login'); return; }
    loadProfile();
  }, [_hasHydrated, user]);

  const loadProfile = async () => {
    try {
      const res = await usersApi.me();
      setProfile(res.data);
      setForm({ name: res.data.name || '', phone: res.data.phone || '' });

      if (user?.role === 'FARMER') {
        try {
          const fp = await farmerApi.getProfile();
          setFarmerProfile(fp.data);
          setFarmerForm({
            village: fp.data.village || '',
            district: fp.data.district || '',
            pincode: fp.data.pincode || '',
            bio: fp.data.bio || '',
          });
        } catch {
          // No farmer profile yet
        }
      }
    } catch {
      toast.error(t({ en: 'Failed to load profile', te: 'ప్రొఫైల్ లోడ్ చేయడం విఫలమైంది' }));
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const res = await usersApi.update(form);
      setProfile(res.data);
      if (user) {
        setAuth(user ? localStorage.getItem('gr_token') || '' : '', { ...user, name: form.name });
      }
      toast.success(t({ en: 'Profile updated!', te: 'ప్రొఫైల్ అప్‌డేట్ అయింది!' }));
    } catch {
      toast.error(t({ en: 'Failed to update profile', te: 'ప్రొఫైల్ అప్‌డేట్ విఫలమైంది' }));
    } finally {
      setSaving(false);
    }
  };

  const saveFarmerProfile = async () => {
    setSavingFarmer(true);
    try {
      if (farmerProfile) {
        await farmerApi.updateProfile(farmerForm);
      } else {
        await farmerApi.createProfile(farmerForm);
      }
      toast.success(t({ en: 'Farmer profile saved!', te: 'రైతు ప్రొఫైల్ సేవ్ అయింది!' }));
      loadProfile();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || t({ en: 'Failed to save farmer profile', te: 'రైతు ప్రొఫైల్ సేవ్ విఫలమైంది' }));
    } finally {
      setSavingFarmer(false);
    }
  };

  if (!_hasHydrated || loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
    </div>
  );

  const verificationBadge = (level: string) => {
    if (level === 'LEVEL_1') return { icon: CheckCircle2, label: t({ en: 'Verified (Level 1)', te: 'ధృవీకరించబడింది (స్థాయి 1)' }), color: 'text-green-600 bg-green-50' };
    return { icon: Clock, label: t({ en: 'Pending Verification', te: 'ధృవీకరణ పెండింగ్‌లో ఉంది' }), color: 'text-amber-600 bg-amber-50' };
  };

  const docStatusBadge = (status: string) => {
    if (status === 'APPROVED') return 'bg-green-100 text-green-700';
    if (status === 'REJECTED') return 'bg-red-100 text-red-700';
    return 'bg-amber-100 text-amber-700';
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6 animate-slide-up">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary-100 text-primary-700 flex items-center justify-center text-2xl font-bold">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{t({ en: 'My Profile', te: 'నా ప్రొఫైల్' })}</h1>
            <p className="text-sm text-slate-400">
              {user?.role === 'FARMER' ? t({ en: 'Farmer Account', te: 'రైతు ఖాతా' }) :
               user?.role === 'ADMIN' ? t({ en: 'Admin Account', te: 'అడ్మిన్ ఖాతా' }) :
               t({ en: 'Buyer Account', te: 'కొనుగోలుదారు ఖాతా' })}
            </p>
          </div>
        </div>

        {/* Basic info */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-primary-600" />
            {t({ en: 'Account Information', te: 'ఖాతా సమాచారం' })}
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> {t({ en: 'Full Name', te: 'పూర్తి పేరు' })}</span>
              </label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {t({ en: 'Email', te: 'ఇమెయిల్' })}</span>
              </label>
              <input value={profile?.email || ''} disabled
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-slate-50 text-slate-500 cursor-not-allowed" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {t({ en: 'Phone', te: 'ఫోన్' })}</span>
              </label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="9XXXXXXXXX"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent" />
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-400">
              <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5" /> {user?.role}</span>
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {t({ en: 'Joined', te: 'చేరిన తేదీ' })} {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '—'}</span>
            </div>
            <button onClick={saveProfile} disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 disabled:opacity-50 transition-all">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? t({ en: 'Saving...', te: 'సేవ్ అవుతోంది...' }) : t({ en: 'Save Changes', te: 'మార్పులు సేవ్ చేయి' })}
            </button>
          </div>
        </div>

        {/* Farmer profile section */}
        {user?.role === 'FARMER' && (
          <>
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary-600" />
                {t({ en: 'Farmer Profile', te: 'రైతు ప్రొఫైల్' })}
              </h2>

              {farmerProfile && (
                <div className="mb-4">
                  {(() => {
                    const badge = verificationBadge(farmerProfile.verificationLevel);
                    const BadgeIcon = badge.icon;
                    return (
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${badge.color}`}>
                        <BadgeIcon className="w-4 h-4" /> {badge.label}
                      </div>
                    );
                  })()}
                </div>
              )}

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">{t({ en: 'Village', te: 'గ్రామం' })}</label>
                    <input value={farmerForm.village} onChange={(e) => setFarmerForm({ ...farmerForm, village: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">{t({ en: 'District', te: 'జిల్లా' })}</label>
                    <input value={farmerForm.district} onChange={(e) => setFarmerForm({ ...farmerForm, district: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">{t({ en: 'Pincode', te: 'పిన్‌కోడ్' })}</label>
                  <input value={farmerForm.pincode} onChange={(e) => setFarmerForm({ ...farmerForm, pincode: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">{t({ en: 'Bio', te: 'పరిచయం' })}</label>
                  <textarea value={farmerForm.bio} onChange={(e) => setFarmerForm({ ...farmerForm, bio: e.target.value })} rows={3}
                    placeholder={t({ en: 'Tell buyers about yourself and your farm...', te: 'మీ గురించి మరియు మీ పొలం గురించి కొనుగోలుదారులకు చెప్పండి...' })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent" />
                </div>
                <button onClick={saveFarmerProfile} disabled={savingFarmer}
                  className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 disabled:opacity-50 transition-all">
                  {savingFarmer ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {savingFarmer ? t({ en: 'Saving...', te: 'సేవ్ అవుతోంది...' }) : t({ en: 'Save Farmer Profile', te: 'రైతు ప్రొఫైల్ సేవ్ చేయి' })}
                </button>
              </div>
            </div>

            {/* Documents */}
            {farmerProfile && farmerProfile.docs && farmerProfile.docs.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary-600" />
                  {t({ en: 'Verification Documents', te: 'ధృవీకరణ పత్రాలు' })}
                </h2>
                <div className="space-y-3">
                  {farmerProfile.docs.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between bg-slate-50 rounded-xl p-3">
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-slate-400" />
                        <div>
                          <p className="text-sm font-medium text-slate-700">{doc.docType.replace(/_/g, ' ')}</p>
                          <p className="text-[10px] text-slate-400">{new Date(doc.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${docStatusBadge(doc.status)}`}>
                          {doc.status}
                        </span>
                        <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-600 hover:underline">
                          {t({ en: 'View', te: 'చూడండి' })}
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Verification help */}
            {farmerProfile?.verificationLevel === 'LEVEL_0' && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">{t({ en: 'Verification Required to Sell', te: 'అమ్మడానికి ధృవీకరణ అవసరం' })}</p>
                  <p className="text-xs text-amber-700 mt-1">
                    {t({
                      en: 'Complete your farmer profile above and upload verification documents (Ration Card, Farmer ID, Land Document, or Aadhaar). Our admin team will review and approve your account within 24-48 hours.',
                      te: 'పైన మీ రైతు ప్రొఫైల్‌ను పూర్తి చేయండి మరియు ధృవీకరణ పత్రాలను (రేషన్ కార్డ్, రైతు ID, భూ పత్రం, లేదా ఆధార్) అప్‌లోడ్ చేయండి. మా అడ్మిన్ బృందం 24-48 గంటల్లో మీ ఖాతాను సమీక్షించి ఆమోదిస్తారు.',
                    })}
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
