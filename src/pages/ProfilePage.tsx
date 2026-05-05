import { useState, FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { PageHeader, Card, FormField, inputClass } from '../components/ui';
import { User, Lock, Save } from 'lucide-react';

export default function ProfilePage() {
  const { profile, refreshProfile } = useAuth();
  const [form, setForm] = useState({ full_name: profile?.full_name || '', phone: profile?.phone || '' });
  const [pwForm, setPwForm] = useState({ current: '', new_pw: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');
  const [pwMsg, setPwMsg] = useState('');

  const handleProfile = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setProfileMsg('');
    const { error } = await supabase.from('profiles').update({ full_name: form.full_name, phone: form.phone, updated_at: new Date().toISOString() }).eq('id', profile?.id);
    if (!error) { await refreshProfile(); setProfileMsg('Profil berhasil diperbarui!'); }
    else setProfileMsg('Gagal memperbarui profil.');
    setSaving(false);
  };

  const handlePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (pwForm.new_pw !== pwForm.confirm) { setPwMsg('Password baru tidak cocok.'); return; }
    if (pwForm.new_pw.length < 6) { setPwMsg('Password minimal 6 karakter.'); return; }
    setSavingPw(true);
    setPwMsg('');
    const { error } = await supabase.auth.updateUser({ password: pwForm.new_pw });
    if (!error) { setPwMsg('Password berhasil diubah!'); setPwForm({ current: '', new_pw: '', confirm: '' }); }
    else setPwMsg('Gagal mengubah password.');
    setSavingPw(false);
  };

  const roleLabel: Record<string, string> = { admin: 'Administrator', guru: 'Guru', siswa: 'Siswa' };

  return (
    <div className="space-y-5 max-w-2xl">
      <PageHeader title="Pengaturan Profil" subtitle="Kelola informasi akun Anda" />

      {/* Avatar & Role */}
      <Card>
        <div className="p-6 flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-sky-400 to-teal-500 flex items-center justify-center text-white text-3xl font-bold flex-shrink-0">
            {profile?.full_name?.charAt(0)?.toUpperCase() || <User className="w-8 h-8" />}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">{profile?.full_name}</h2>
            <p className="text-gray-500 text-sm">{profile?.id && profile.id.slice(0, 8) + '...'}</p>
            <span className="inline-block mt-1 px-3 py-1 bg-sky-100 text-sky-700 text-xs font-semibold rounded-full">
              {roleLabel[profile?.role || 'siswa']}
            </span>
          </div>
        </div>
      </Card>

      {/* Edit Profile */}
      <Card>
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <User className="w-4 h-4 text-sky-600" />
          <h3 className="font-semibold text-gray-800">Informasi Profil</h3>
        </div>
        <form onSubmit={handleProfile} className="p-5 space-y-4">
          {profileMsg && (
            <div className={`p-3 rounded-lg text-sm ${profileMsg.includes('berhasil') ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
              {profileMsg}
            </div>
          )}
          <FormField label="Nama Lengkap" required>
            <input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} className={inputClass} />
          </FormField>
          <FormField label="No. Telepon">
            <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className={inputClass} />
          </FormField>
          <button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-sky-500 to-teal-600 text-white text-sm font-semibold rounded-xl shadow hover:shadow-md transition disabled:opacity-60">
            <Save className="w-4 h-4" />
            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </form>
      </Card>

      {/* Change Password */}
      <Card>
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <Lock className="w-4 h-4 text-sky-600" />
          <h3 className="font-semibold text-gray-800">Ubah Password</h3>
        </div>
        <form onSubmit={handlePassword} className="p-5 space-y-4">
          {pwMsg && (
            <div className={`p-3 rounded-lg text-sm ${pwMsg.includes('berhasil') ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
              {pwMsg}
            </div>
          )}
          <FormField label="Password Baru" required>
            <input type="password" value={pwForm.new_pw} onChange={e => setPwForm({ ...pwForm, new_pw: e.target.value })} className={inputClass} placeholder="Minimal 6 karakter" />
          </FormField>
          <FormField label="Konfirmasi Password Baru" required>
            <input type="password" value={pwForm.confirm} onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })} className={inputClass} />
          </FormField>
          <button type="submit" disabled={savingPw} className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-sky-500 to-teal-600 text-white text-sm font-semibold rounded-xl shadow hover:shadow-md transition disabled:opacity-60">
            <Lock className="w-4 h-4" />
            {savingPw ? 'Mengubah...' : 'Ubah Password'}
          </button>
        </form>
      </Card>
    </div>
  );
}
