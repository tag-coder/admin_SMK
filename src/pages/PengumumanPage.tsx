import { useEffect, useState } from 'react';
import { supabase, Pengumuman } from '../lib/supabase';
import { Modal, PageHeader, Card, FormField, inputClass, selectClass } from '../components/ui';
import { Plus, Edit2, Trash2, AlertCircle, Megaphone, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const emptyForm = {
  judul: '', isi: '', target_role: 'semua' as const,
  tanggal_mulai: new Date().toISOString().split('T')[0],
  tanggal_selesai: '', penting: false,
};

const targetLabel: Record<string, string> = { semua: 'Semua', siswa: 'Siswa', guru: 'Guru', admin: 'Admin' };
const targetColor: Record<string, string> = {
  semua: 'bg-sky-100 text-sky-700',
  siswa: 'bg-emerald-100 text-emerald-700',
  guru: 'bg-teal-100 text-teal-700',
  admin: 'bg-blue-100 text-blue-700',
};

export default function PengumumanPage() {
  const { profile } = useAuth();
  const [data, setData] = useState<Pengumuman[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'add' | 'edit' | 'view' | null>(null);
  const [selected, setSelected] = useState<Pengumuman | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const canEdit = profile?.role === 'admin';

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase.from('pengumuman').select('*').order('created_at', { ascending: false });
    setData(data || []);
    setLoading(false);
  };

  const openAdd = () => { setForm(emptyForm); setSelected(null); setModal('add'); };
  const openEdit = (p: Pengumuman) => {
    setSelected(p);
    setForm({
      judul: p.judul, isi: p.isi, target_role: p.target_role,
      tanggal_mulai: p.tanggal_mulai, tanggal_selesai: p.tanggal_selesai || '',
      penting: p.penting,
    });
    setModal('edit');
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = { ...form, tanggal_selesai: form.tanggal_selesai || null, dibuat_oleh: profile?.id };
    if (modal === 'add') await supabase.from('pengumuman').insert(payload);
    else if (selected) await supabase.from('pengumuman').update(payload).eq('id', selected.id);
    setSaving(false);
    setModal(null);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin menghapus pengumuman ini?')) return;
    await supabase.from('pengumuman').delete().eq('id', id);
    fetchData();
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Pengumuman"
        subtitle="Informasi dan pengumuman sekolah"
        action={
          canEdit ? (
            <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-sky-500 to-teal-600 text-white rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-all">
              <Plus className="w-4 h-4" /> Buat Pengumuman
            </button>
          ) : undefined
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-sky-200 border-t-sky-500 rounded-full animate-spin" />
        </div>
      ) : data.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Megaphone className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>Belum ada pengumuman</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.map(p => (
            <Card key={p.id} className="hover:shadow-md transition-shadow">
              <div className="p-5">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${p.penting ? 'bg-orange-100' : 'bg-sky-50'}`}>
                    {p.penting ? <AlertCircle className="w-5 h-5 text-orange-500" /> : <Bell className="w-5 h-5 text-sky-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-semibold text-gray-800">{p.judul}</h3>
                          {p.penting && (
                            <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-medium">Penting</span>
                          )}
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${targetColor[p.target_role]}`}>
                            {targetLabel[p.target_role]}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">{p.isi}</p>
                        <p className="text-gray-400 text-xs mt-2">
                          {new Date(p.tanggal_mulai).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                          {p.tanggal_selesai && ` s/d ${new Date(p.tanggal_selesai).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`}
                        </p>
                      </div>
                      {canEdit && (
                        <div className="flex gap-1 flex-shrink-0">
                          <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600 transition"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {(modal === 'add' || modal === 'edit') && (
        <Modal title={modal === 'add' ? 'Buat Pengumuman' : 'Edit Pengumuman'} onClose={() => setModal(null)} size="md">
          <div className="p-5 space-y-4">
            <FormField label="Judul" required>
              <input value={form.judul} onChange={e => setForm({ ...form, judul: e.target.value })} className={inputClass} />
            </FormField>
            <FormField label="Isi Pengumuman" required>
              <textarea value={form.isi} onChange={e => setForm({ ...form, isi: e.target.value })} rows={5} className={inputClass} />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Ditujukan Untuk">
                <select value={form.target_role} onChange={e => setForm({ ...form, target_role: e.target.value as typeof form.target_role })} className={selectClass}>
                  <option value="semua">Semua</option>
                  <option value="siswa">Siswa</option>
                  <option value="guru">Guru</option>
                  <option value="admin">Admin</option>
                </select>
              </FormField>
              <FormField label="Tanggal Mulai">
                <input type="date" value={form.tanggal_mulai} onChange={e => setForm({ ...form, tanggal_mulai: e.target.value })} className={inputClass} />
              </FormField>
              <FormField label="Tanggal Selesai">
                <input type="date" value={form.tanggal_selesai} onChange={e => setForm({ ...form, tanggal_selesai: e.target.value })} className={inputClass} />
              </FormField>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="penting" checked={form.penting} onChange={e => setForm({ ...form, penting: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-sky-500 focus:ring-sky-500" />
              <label htmlFor="penting" className="text-sm font-medium text-gray-700">Tandai sebagai pengumuman penting</label>
            </div>
          </div>
          <div className="px-5 pb-5 flex justify-end gap-3">
            <button onClick={() => setModal(null)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition">Batal</button>
            <button onClick={handleSave} disabled={saving} className="px-5 py-2 text-sm bg-gradient-to-r from-sky-500 to-teal-600 text-white font-semibold rounded-xl shadow hover:shadow-md transition disabled:opacity-60">
              {saving ? 'Menyimpan...' : 'Publikasikan'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
