'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usersApi, farmerApi, filesApi } from '@/lib/api';
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

const DOC_LABELS: Record<string, string> = {
  RATION_CARD: 'Ration Card',
  FARMER_ID: 'Farmer ID',
  LAND_DOCUMENT: 'Land Document',
  AADHAAR: 'Aadhaar',
  OTHER: 'Other Document',
};

const formatDocLabel = (docType: string) => DOC_LABELS[docType] || docType.replace(/_/g, ' ');

export default function ProfilePage() {
  const router = useRouter();
  const { user, _hasHydrated, setAuth } = useAuthStore();
  const { t } = useLangStore();
  const [profile, setProfile] = useState<{ name: string; email: string; phone: string; createdAt: string } | null>(null);
  const [farmerProfile, setFarmerProfile] = useState<FarmerProfile | null>(null);
  const [form, setForm] = useState({ name: '', phone: '' });
  const [farmerForm, setFarmerForm] = useState({ village: '', district: '', pincode: '', bio: '' });
  const [docForm, setDocForm] = useState({ docType: 'RATION_CARD', fileUrl: '', docNumber: '', notes: '' });
  const [selectedDocFile, setSelectedDocFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingFarmer, setSavingFarmer] = useState(false);
  const [savingDoc, setSavingDoc] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!user) { router.push('/auth/login'); return; }
    loadProfile();
  }, [_hasHydrated, user]);

  const loadProfile = async () => {
    try {
      const [userRes, farmerRes] = await Promise.allSettled([
        usersApi.me(),
        user?.role === 'FARMER' ? farmerApi.getProfile() : Promise.resolve(null),
      ]);

      if (userRes.status === 'fulfilled') {
        setProfile(userRes.value.data);
        setForm({ name: userRes.value.data.name || '', phone: userRes.value.data.phone || '' });
      } else {
        toast.error(t({ en: 'Failed to load profile', te: 'ప్రొఫైల్ లోడ్ చేయడం విఫలమైంది' }));
      }

      if (farmerRes.status === 'fulfilled' && farmerRes.value) {
        const fp = farmerRes.value.data;
        setFarmerProfile(fp);
        setFarmerForm({
          village: fp.village || '',
          district: fp.district || '',
          pincode: fp.pincode || '',
          bio: fp.bio || '',
        });
      }
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

  const submitDoc = async () => {
    if (!farmerProfile && user?.role === 'FARMER') {
      toast.error(t({ en: 'Save your farmer profile first', te: 'ముందుగా మీ రైతు ప్రొఫైల్‌ను సేవ్ చేయండి' }));
      return;
    }
    if (!docForm.fileUrl.trim()) {
      toast.error(t({ en: 'Please upload a document or enter a URL', te: 'దయచేసి పత్రం అప్‌లోడ్ చేయండి లేదా URL నమోదు చేయండి' }));
      return;
    }
    setSavingDoc(true);
    try {
      await farmerApi.uploadDoc({
        docType: docForm.docType,
        fileUrl: docForm.fileUrl.trim(),
        docNumber: docForm.docNumber.trim() || undefined,
        notes: docForm.notes.trim() || undefined,
      });
      toast.success(t({ en: 'Document submitted for review!', te: 'పత్రం సమీక్ష కోసం సమర్పించబడింది!' }));
      setDocForm({ docType: 'RATION_CARD', fileUrl: '', docNumber: '', notes: '' });
      setSelectedDocFile(null);
      loadProfile();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || t({ en: 'Failed to submit document', te: 'పత్రాన్ని సమర్పించడం విఫలమైంది' }));
    } finally {
      setSavingDoc(false);
    }
  };

  const uploadDocFile = async () => {
    if (!selectedDocFile) {
      toast.error(t({ en: 'Choose a file first', te: 'ముందుగా ఫైల్ ఎంచుకోండి' }));
      return;
    }

    setUploadingDoc(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedDocFile);
      const res = await filesApi.upload(formData);
      const url = res.data?.url || res.data?.fileUrl;
      if (!url) {
        throw new Error('Upload returned no file URL');
      }
      setDocForm((prev) => ({ ...prev, fileUrl: url }));
      setSelectedDocFile(null);
      toast.success(t({ en: 'File uploaded to MinIO', te: 'ఫైల్ MinIOకి అప్‌లోడ్ అయింది' }));
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || t({ en: 'Failed to upload file', te: 'ఫైల్ అప్‌లోడ్ విఫలమైంది' }));
    } finally {
      setUploadingDoc(false);
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

                <div className="mt-6 border-t border-slate-100 pt-5">
                  <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary-600" />
                    {t({ en: 'Submit Verification Document', te: 'ధృవీకరణ పత్రం సమర్పించండి' })}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <select
                      value={docForm.docType}
                      onChange={(e) => setDocForm({ ...docForm, docType: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                    >
                      <option value="RATION_CARD">Ration Card</option>
                      <option value="FARMER_ID">Farmer ID</option>
                      <option value="LAND_DOCUMENT">Land Document</option>
                      <option value="AADHAAR">Aadhaar</option>
                      <option value="OTHER">Other</option>
                    </select>
                    <input
                      value={docForm.docNumber}
                      onChange={(e) => setDocForm({ ...docForm, docNumber: e.target.value })}
                      placeholder={t({ en: 'Document number (optional)', te: 'పత్ర సంఖ్య (ఐచ్ఛికం)' })}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                    />
                  </div>
                  <div className="mt-3 grid gap-3">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) => setSelectedDocFile(e.target.files?.[0] || null)}
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={uploadDocFile}
                        disabled={uploadingDoc || !selectedDocFile}
                        className="sm:w-44 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 disabled:opacity-50 transition-all"
                      >
                        {uploadingDoc ? t({ en: 'Uploading...', te: 'అప్‌లోడ్ అవుతోంది...' }) : t({ en: 'Upload to MinIO', te: 'MinIOకి అప్‌లోడ్ చేయి' })}
                      </button>
                    </div>
                    <input
                      value={docForm.fileUrl}
                      onChange={(e) => setDocForm({ ...docForm, fileUrl: e.target.value })}
                      placeholder={t({ en: 'Uploaded file URL will appear here', te: 'అప్‌లోడ్ చేసిన ఫైల్ URL ఇక్కడ కనిపిస్తుంది' })}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                    />
                  </div>
                  <textarea
                    value={docForm.notes}
                    onChange={(e) => setDocForm({ ...docForm, notes: e.target.value })}
                    rows={3}
                    placeholder={t({ en: 'Notes for admin review (optional)', te: 'అడ్మిన్ సమీక్ష కోసం గమనికలు (ఐచ్ఛికం)' })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent mt-3"
                  />
                  <button
                    onClick={submitDoc}
                    disabled={savingDoc}
                    className="mt-3 flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 disabled:opacity-50 transition-all"
                  >
                    {savingDoc ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                    {savingDoc ? t({ en: 'Submitting...', te: 'సమర్పిస్తోంది...' }) : t({ en: 'Submit Document', te: 'పత్రం సమర్పించు' })}
                  </button>
                </div>
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
                          <p className="text-sm font-medium text-slate-700">{formatDocLabel(doc.docType)}</p>
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
