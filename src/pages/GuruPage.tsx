import { useEffect, useState } from 'react';
import { supabase, Guru } from '../lib/supabase';
import { Modal, Table, Pagination, Badge, PageHeader, Card, FormField, inputClass, selectClass } from '../components/ui';
import { Plus, Search, Edit2, Trash2, Eye } from 'lucide-react';

const ITEMS_PER_PAGE = 10;

const statusColor: Record<string, string> = {
  tetap: 'bg-emerald-100 text-emerald-700',
  honorer: 'bg-amber-100 text-amber-700',
  kontrak: 'bg-blue-100 text-blue-700',
};

const emptyForm = {
  nip: '', nama_lengkap: '', jenis_kelamin: 'L' as 'L' | 'P',
  tanggal_lahir: '', tempat_lahir: '', alamat: '', agama: '',
  no_hp: '', email: '', pendidikan_terakhir: '', jurusan_pendidikan: '',
  status_kepegawaian: 'tetap' as const, mata_pelajaran_utama: '',
};

export default function GuruPage() {
  const [data, setData] = useState<Guru[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [modal, setModal] = useState<'add' | 'edit' | 'view' | null>(null);
  const [selected, setSelected] = useState<Guru | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchData(); }, [page, search]);

  const fetchData = async () => {
    setLoading(true);
    let q = supabase.from('guru').select('*', { count: 'exact' });
    if (search) q = q.ilike('nama_lengkap', `%${search}%`);
    const { data, count, error } = await q.order('nama_lengkap').range((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE - 1);
    if (!error) { setData(data || []); setTotal(count || 0); }
    setLoading(false);
  };

  const openAdd = () => { setForm(emptyForm); setSelected(null); setModal('add'); };
  const openEdit = (g: Guru) => {
    setSelected(g);
    setForm({
      nip: g.nip || '', nama_lengkap: g.nama_lengkap, jenis_kelamin: g.jenis_kelamin,
      tanggal_lahir: g.tanggal_lahir || '', tempat_lahir: g.tempat_lahir, alamat: g.alamat,
      agama: g.agama, no_hp: g.no_hp, email: g.email, pendidikan_terakhir: g.pendidikan_terakhir,
      jurusan_pendidikan: g.jurusan_pendidikan, status_kepegawaian: g.status_kepegawaian,
      mata_pelajaran_utama: g.mata_pelajaran_utama,
    });
    setModal('edit');
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = { ...form, tanggal_lahir: form.tanggal_lahir || null, nip: form.nip || null };
    if (modal === 'add') {
      await supabase.from('guru').insert(payload);
    } else if (selected) {
      await supabase.from('guru').update(payload).eq('id', selected.id);
    }
    setSaving(false);
    setModal(null);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus data guru ini?')) return;
    await supabase.from('guru').delete().eq('id', id);
    fetchData();
  };

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  const columns = [
    {
      key: 'nip', label: 'Guru',
      render: (_: unknown, row: Record<string, unknown>) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-sky-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {String(row.nama_lengkap || '?').charAt(0)}
          </div>
          <div>
            <p className="font-medium text-gray-800 text-xs">{String(row.nama_lengkap || '')}</p>
            <p className="text-gray-400 text-xs">NIP: {String(row.nip || '-')}</p>
          </div>
        </div>
      )
    },
    { key: 'mata_pelajaran_utama', label: 'Mata Pelajaran', render: (v: unknown) => <span className="text-xs">{String(v || '-')}</span> },
    { key: 'jenis_kelamin', label: 'L/P', render: (v: unknown) => <span className="text-xs">{String(v) === 'L' ? 'Laki-laki' : 'Perempuan'}</span> },
    { key: 'no_hp', label: 'No. HP', render: (v: unknown) => <span className="text-xs">{String(v || '-')}</span> },
    {
      key: 'status_kepegawaian', label: 'Status',
      render: (v: unknown) => <Badge label={String(v)} color={statusColor[String(v)] || ''} />
    },
    {
      key: 'id', label: 'Aksi',
      render: (_: unknown, row: Record<string, unknown>) => (
        <div className="flex items-center gap-1">
          <button onClick={() => { setSelected(row as unknown as Guru); setModal('view'); }} className="p-1.5 rounded-lg hover:bg-sky-50 text-sky-600 transition">
            <Eye className="w-4 h-4" />
          </button>
          <button onClick={() => openEdit(row as unknown as Guru)} className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600 transition">
            <Edit2 className="w-4 h-4" />
          </button>
          <button onClick={() => handleDelete(String(row.id))} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Data Guru"
        subtitle={`Total ${total} guru terdaftar`}
        action={
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-sky-500 to-teal-600 text-white rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-all">
            <Plus className="w-4 h-4" />
            Tambah Guru
          </button>
        }
      />

      <Card>
        <div className="px-5 py-4 border-b border-gray-100 flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text" placeholder="Cari nama guru..."
              value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>
        <div className="px-5 py-2">
          <Table columns={columns} data={data as unknown as Record<string, unknown>[]} loading={loading} emptyMessage="Belum ada data guru" />
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </Card>

      {(modal === 'add' || modal === 'edit') && (
        <Modal title={modal === 'add' ? 'Tambah Guru Baru' : 'Edit Data Guru'} onClose={() => setModal(null)} size="lg">
          <div className="p-5 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="NIP">
                <input value={form.nip} onChange={e => setForm({ ...form, nip: e.target.value })} className={inputClass} />
              </FormField>
              <FormField label="Nama Lengkap" required>
                <input value={form.nama_lengkap} onChange={e => setForm({ ...form, nama_lengkap: e.target.value })} className={inputClass} />
              </FormField>
              <FormField label="Jenis Kelamin">
                <select value={form.jenis_kelamin} onChange={e => setForm({ ...form, jenis_kelamin: e.target.value as 'L' | 'P' })} className={selectClass}>
                  <option value="L">Laki-laki</option>
                  <option value="P">Perempuan</option>
                </select>
              </FormField>
              <FormField label="Tempat Lahir">
                <input value={form.tempat_lahir} onChange={e => setForm({ ...form, tempat_lahir: e.target.value })} className={inputClass} />
              </FormField>
              <FormField label="Tanggal Lahir">
                <input type="date" value={form.tanggal_lahir} onChange={e => setForm({ ...form, tanggal_lahir: e.target.value })} className={inputClass} />
              </FormField>
              <FormField label="Agama">
                <select value={form.agama} onChange={e => setForm({ ...form, agama: e.target.value })} className={selectClass}>
                  <option value="">Pilih</option>
                  <option value="Islam">Islam</option>
                  <option value="Kristen">Kristen</option>
                  <option value="Katolik">Katolik</option>
                  <option value="Hindu">Hindu</option>
                  <option value="Buddha">Buddha</option>
                  <option value="Konghucu">Konghucu</option>
                </select>
              </FormField>
              <FormField label="No. HP">
                <input value={form.no_hp} onChange={e => setForm({ ...form, no_hp: e.target.value })} className={inputClass} />
              </FormField>
              <FormField label="Email">
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={inputClass} />
              </FormField>
              <FormField label="Pendidikan Terakhir">
                <select value={form.pendidikan_terakhir} onChange={e => setForm({ ...form, pendidikan_terakhir: e.target.value })} className={selectClass}>
                  <option value="">Pilih</option>
                  <option value="S3">S3</option>
                  <option value="S2">S2</option>
                  <option value="S1">S1</option>
                  <option value="D4">D4</option>
                  <option value="D3">D3</option>
                  <option value="SMA">SMA</option>
                </select>
              </FormField>
              <FormField label="Jurusan Pendidikan">
                <input value={form.jurusan_pendidikan} onChange={e => setForm({ ...form, jurusan_pendidikan: e.target.value })} className={inputClass} />
              </FormField>
              <FormField label="Mata Pelajaran Utama">
                <input value={form.mata_pelajaran_utama} onChange={e => setForm({ ...form, mata_pelajaran_utama: e.target.value })} className={inputClass} />
              </FormField>
              <FormField label="Status Kepegawaian">
                <select value={form.status_kepegawaian} onChange={e => setForm({ ...form, status_kepegawaian: e.target.value as typeof form.status_kepegawaian })} className={selectClass}>
                  <option value="tetap">Tetap</option>
                  <option value="honorer">Honorer</option>
                  <option value="kontrak">Kontrak</option>
                </select>
              </FormField>
            </div>
            <FormField label="Alamat">
              <textarea value={form.alamat} onChange={e => setForm({ ...form, alamat: e.target.value })} rows={3} className={inputClass} />
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

      {modal === 'view' && selected && (
        <Modal title="Detail Guru" onClose={() => setModal(null)} size="md">
          <div className="p-5">
            <div className="flex items-center gap-4 mb-5 pb-5 border-b border-gray-100">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-400 to-sky-500 flex items-center justify-center text-white text-2xl font-bold">
                {selected.nama_lengkap.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-gray-800 text-lg">{selected.nama_lengkap}</h3>
                <p className="text-gray-500 text-sm">NIP: {selected.nip || '-'}</p>
                <Badge label={selected.status_kepegawaian} color={statusColor[selected.status_kepegawaian]} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['Jenis Kelamin', selected.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'],
                ['Tempat/Tgl Lahir', `${selected.tempat_lahir}, ${selected.tanggal_lahir || '-'}`],
                ['Agama', selected.agama],
                ['No. HP', selected.no_hp],
                ['Email', selected.email],
                ['Pendidikan', `${selected.pendidikan_terakhir} - ${selected.jurusan_pendidikan}`],
                ['Mata Pelajaran', selected.mata_pelajaran_utama],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-gray-400 text-xs">{label}</p>
                  <p className="font-medium text-gray-700">{value || '-'}</p>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
