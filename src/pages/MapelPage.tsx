import { useEffect, useState } from 'react';
import { supabase, MataPelajaran, Guru } from '../lib/supabase';
import { Modal, Table, PageHeader, Card, FormField, inputClass, selectClass } from '../components/ui';
import { Plus, Edit2, Trash2 } from 'lucide-react';

const emptyForm = { kode: '', nama: '', deskripsi: '', guru_id: '' };

export default function MapelPage() {
  const [data, setData] = useState<MataPelajaran[]>([]);
  const [guru, setGuru] = useState<Guru[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [selected, setSelected] = useState<MataPelajaran | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
    supabase.from('guru').select('id, nama_lengkap').order('nama_lengkap').then(({ data }) => setGuru(data || []));
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase.from('mata_pelajaran').select('*, guru(nama_lengkap)').order('nama');
    setData(data || []);
    setLoading(false);
  };

  const openAdd = () => { setForm(emptyForm); setSelected(null); setModal('add'); };
  const openEdit = (m: MataPelajaran) => {
    setSelected(m);
    setForm({ kode: m.kode, nama: m.nama, deskripsi: m.deskripsi, guru_id: m.guru_id || '' });
    setModal('edit');
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = { ...form, guru_id: form.guru_id || null };
    if (modal === 'add') await supabase.from('mata_pelajaran').insert(payload);
    else if (selected) await supabase.from('mata_pelajaran').update(payload).eq('id', selected.id);
    setSaving(false);
    setModal(null);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin menghapus mata pelajaran ini?')) return;
    await supabase.from('mata_pelajaran').delete().eq('id', id);
    fetchData();
  };

  const columns = [
    { key: 'kode', label: 'Kode', render: (v: unknown) => <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded font-medium">{String(v)}</span> },
    { key: 'nama', label: 'Nama Mata Pelajaran', render: (v: unknown) => <span className="font-medium text-gray-800 text-sm">{String(v)}</span> },
    {
      key: 'guru', label: 'Guru Pengampu',
      render: (_: unknown, row: Record<string, unknown>) => {
        const g = row.guru as { nama_lengkap?: string } | null;
        return <span className="text-sm">{g?.nama_lengkap || '-'}</span>;
      }
    },
    { key: 'deskripsi', label: 'Deskripsi', render: (v: unknown) => <span className="text-sm text-gray-500 line-clamp-1">{String(v || '-')}</span> },
    {
      key: 'id', label: 'Aksi',
      render: (_: unknown, row: Record<string, unknown>) => (
        <div className="flex gap-1">
          <button onClick={() => openEdit(row as unknown as MataPelajaran)} className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600 transition"><Edit2 className="w-4 h-4" /></button>
          <button onClick={() => handleDelete(String(row.id))} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition"><Trash2 className="w-4 h-4" /></button>
        </div>
      )
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Mata Pelajaran"
        subtitle="Kelola daftar mata pelajaran"
        action={
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-sky-500 to-teal-600 text-white rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-all">
            <Plus className="w-4 h-4" /> Tambah
          </button>
        }
      />
      <Card>
        <div className="px-5 py-3">
          <Table columns={columns} data={data as unknown as Record<string, unknown>[]} loading={loading} emptyMessage="Belum ada mata pelajaran" />
        </div>
      </Card>

      {(modal === 'add' || modal === 'edit') && (
        <Modal title={modal === 'add' ? 'Tambah Mata Pelajaran' : 'Edit Mata Pelajaran'} onClose={() => setModal(null)} size="md">
          <div className="p-5 space-y-4">
            <FormField label="Kode" required>
              <input value={form.kode} onChange={e => setForm({ ...form, kode: e.target.value })} placeholder="MTK, BIN, ENG..." className={inputClass} />
            </FormField>
            <FormField label="Nama Mata Pelajaran" required>
              <input value={form.nama} onChange={e => setForm({ ...form, nama: e.target.value })} className={inputClass} />
            </FormField>
            <FormField label="Guru Pengampu">
              <select value={form.guru_id} onChange={e => setForm({ ...form, guru_id: e.target.value })} className={selectClass}>
                <option value="">Pilih Guru</option>
                {guru.map(g => <option key={g.id} value={g.id}>{g.nama_lengkap}</option>)}
              </select>
            </FormField>
            <FormField label="Deskripsi">
              <textarea value={form.deskripsi} onChange={e => setForm({ ...form, deskripsi: e.target.value })} rows={3} className={inputClass} />
            </FormField>
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
