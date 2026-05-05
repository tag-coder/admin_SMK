import { useEffect, useState } from 'react';
import { supabase, Kelas, Guru } from '../lib/supabase';
import { Modal, Table, PageHeader, Card, FormField, inputClass, selectClass } from '../components/ui';
import { Plus, Edit2, Trash2 } from 'lucide-react';

const emptyForm = {
  nama_kelas: '', tingkat: '', jurusan: '',
  kapasitas: 30, wali_kelas_id: '', tahun_ajaran: `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
};

export default function KelasPage() {
  const [data, setData] = useState<Kelas[]>([]);
  const [guru, setGuru] = useState<Guru[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [selected, setSelected] = useState<Kelas | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
    supabase.from('guru').select('id, nama_lengkap').order('nama_lengkap').then(({ data }) => setGuru(data || []));
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase.from('kelas').select('*, guru:wali_kelas_id(nama_lengkap)').order('tingkat');
    setData(data || []);
    setLoading(false);
  };

  const openAdd = () => { setForm(emptyForm); setSelected(null); setModal('add'); };
  const openEdit = (k: Kelas) => {
    setSelected(k);
    setForm({
      nama_kelas: k.nama_kelas, tingkat: k.tingkat, jurusan: k.jurusan,
      kapasitas: k.kapasitas, wali_kelas_id: k.wali_kelas_id || '',
      tahun_ajaran: k.tahun_ajaran,
    });
    setModal('edit');
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = { ...form, wali_kelas_id: form.wali_kelas_id || null };
    if (modal === 'add') await supabase.from('kelas').insert(payload);
    else if (selected) await supabase.from('kelas').update(payload).eq('id', selected.id);
    setSaving(false);
    setModal(null);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin menghapus kelas ini?')) return;
    await supabase.from('kelas').delete().eq('id', id);
    fetchData();
  };

  const columns = [
    { key: 'tingkat', label: 'Tingkat', render: (v: unknown) => <span className="font-medium text-gray-800">{String(v)}</span> },
    { key: 'nama_kelas', label: 'Nama Kelas', render: (v: unknown) => <span className="text-sm">{String(v)}</span> },
    { key: 'jurusan', label: 'Jurusan', render: (v: unknown) => <span className="text-sm">{String(v || '-')}</span> },
    { key: 'kapasitas', label: 'Kapasitas', render: (v: unknown) => <span className="text-sm">{String(v)} siswa</span> },
    {
      key: 'guru', label: 'Wali Kelas',
      render: (_: unknown, row: Record<string, unknown>) => {
        const g = row.guru as { nama_lengkap?: string } | null;
        return <span className="text-sm">{g?.nama_lengkap || '-'}</span>;
      }
    },
    { key: 'tahun_ajaran', label: 'Tahun Ajaran', render: (v: unknown) => <span className="text-sm">{String(v)}</span> },
    {
      key: 'id', label: 'Aksi',
      render: (_: unknown, row: Record<string, unknown>) => (
        <div className="flex gap-1">
          <button onClick={() => openEdit(row as unknown as Kelas)} className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600 transition"><Edit2 className="w-4 h-4" /></button>
          <button onClick={() => handleDelete(String(row.id))} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition"><Trash2 className="w-4 h-4" /></button>
        </div>
      )
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Data Kelas"
        subtitle="Kelola daftar kelas"
        action={
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-sky-500 to-teal-600 text-white rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-all">
            <Plus className="w-4 h-4" /> Tambah Kelas
          </button>
        }
      />
      <Card>
        <div className="px-5 py-3">
          <Table columns={columns} data={data as unknown as Record<string, unknown>[]} loading={loading} emptyMessage="Belum ada data kelas" />
        </div>
      </Card>

      {(modal === 'add' || modal === 'edit') && (
        <Modal title={modal === 'add' ? 'Tambah Kelas' : 'Edit Kelas'} onClose={() => setModal(null)} size="md">
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Tingkat" required>
                <input value={form.tingkat} onChange={e => setForm({ ...form, tingkat: e.target.value })} placeholder="X / XI / XII" className={inputClass} />
              </FormField>
              <FormField label="Nama Kelas" required>
                <input value={form.nama_kelas} onChange={e => setForm({ ...form, nama_kelas: e.target.value })} placeholder="IPA 1 / IPS 2" className={inputClass} />
              </FormField>
              <FormField label="Jurusan">
                <input value={form.jurusan} onChange={e => setForm({ ...form, jurusan: e.target.value })} placeholder="IPA / IPS" className={inputClass} />
              </FormField>
              <FormField label="Kapasitas">
                <input type="number" value={form.kapasitas} onChange={e => setForm({ ...form, kapasitas: Number(e.target.value) })} className={inputClass} />
              </FormField>
              <FormField label="Tahun Ajaran" required>
                <input value={form.tahun_ajaran} onChange={e => setForm({ ...form, tahun_ajaran: e.target.value })} placeholder="2024/2025" className={inputClass} />
              </FormField>
              <FormField label="Wali Kelas">
                <select value={form.wali_kelas_id} onChange={e => setForm({ ...form, wali_kelas_id: e.target.value })} className={selectClass}>
                  <option value="">Pilih Guru</option>
                  {guru.map(g => <option key={g.id} value={g.id}>{g.nama_lengkap}</option>)}
                </select>
              </FormField>
            </div>
          </div>
          <div className="px-5 pb-5 flex justify-end gap-3">
            <button onClick={() => setModal(null)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition">Batal</button>
            <button onClick={handleSave} disabled={saving} className="px-5 py-2 text-sm bg-gradient-to-r from-sky-500 to-teal-600 text-white font-semibold rounded-xl shadow hover:shadow-md transition disabled:opacity-60">
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
