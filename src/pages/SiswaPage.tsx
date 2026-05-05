import { useEffect, useState } from 'react';
import { supabase, Siswa, Kelas } from '../lib/supabase';
import { Modal, Table, Pagination, Badge, PageHeader, Card, FormField, inputClass, selectClass } from '../components/ui';
import { Plus, Search, Edit2, Trash2, Eye, User } from 'lucide-react';

const ITEMS_PER_PAGE = 10;

const statusColor: Record<string, string> = {
  aktif: 'bg-emerald-100 text-emerald-700',
  tidak_aktif: 'bg-gray-100 text-gray-600',
  lulus: 'bg-blue-100 text-blue-700',
  pindah: 'bg-orange-100 text-orange-700',
};

const emptyForm = {
  nis: '', nama_lengkap: '', jenis_kelamin: 'L' as 'L' | 'P',
  tanggal_lahir: '', tempat_lahir: '', alamat: '', agama: '',
  no_hp: '', email: '', nama_orangtua: '', no_hp_orangtua: '',
  kelas_id: '', tahun_masuk: new Date().getFullYear().toString(),
  status: 'aktif' as const,
};

export default function SiswaPage() {
  const [data, setData] = useState<Siswa[]>([]);
  const [kelas, setKelas] = useState<Kelas[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [modal, setModal] = useState<'add' | 'edit' | 'view' | null>(null);
  const [selected, setSelected] = useState<Siswa | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterKelas, setFilterKelas] = useState('');

  useEffect(() => { fetchKelas(); }, []);
  useEffect(() => { fetchData(); }, [page, search, filterStatus, filterKelas]);

  const fetchKelas = async () => {
    const { data } = await supabase.from('kelas').select('*').order('tingkat');
    setKelas(data || []);
  };

  const fetchData = async () => {
    setLoading(true);
    let q = supabase.from('siswa').select('*, kelas(nama_kelas, tingkat)', { count: 'exact' });
    if (search) q = q.ilike('nama_lengkap', `%${search}%`);
    if (filterStatus) q = q.eq('status', filterStatus);
    if (filterKelas) q = q.eq('kelas_id', filterKelas);
    const { data, count, error } = await q.order('nama_lengkap').range((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE - 1);
    if (!error) { setData(data || []); setTotal(count || 0); }
    setLoading(false);
  };

  const openAdd = () => { setForm(emptyForm); setSelected(null); setModal('add'); };
  const openEdit = (s: Siswa) => {
    setSelected(s);
    setForm({
      nis: s.nis, nama_lengkap: s.nama_lengkap, jenis_kelamin: s.jenis_kelamin,
      tanggal_lahir: s.tanggal_lahir || '', tempat_lahir: s.tempat_lahir, alamat: s.alamat,
      agama: s.agama, no_hp: s.no_hp, email: s.email, nama_orangtua: s.nama_orangtua,
      no_hp_orangtua: s.no_hp_orangtua, kelas_id: s.kelas_id || '', tahun_masuk: s.tahun_masuk,
      status: s.status,
    });
    setModal('edit');
  };
  const openView = (s: Siswa) => { setSelected(s); setModal('view'); };

  const handleSave = async () => {
    setSaving(true);
    const payload = { ...form, kelas_id: form.kelas_id || null, tanggal_lahir: form.tanggal_lahir || null };
    if (modal === 'add') {
      await supabase.from('siswa').insert(payload);
    } else if (selected) {
      await supabase.from('siswa').update(payload).eq('id', selected.id);
    }
    setSaving(false);
    setModal(null);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus data siswa ini?')) return;
    await supabase.from('siswa').delete().eq('id', id);
    fetchData();
  };

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  const columns = [
    {
      key: 'nis', label: 'NIS/Siswa',
      render: (_: unknown, row: Record<string, unknown>) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-teal-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {String(row.nama_lengkap || '?').charAt(0)}
          </div>
          <div>
            <p className="font-medium text-gray-800 text-xs">{String(row.nama_lengkap || '')}</p>
            <p className="text-gray-400 text-xs">{String(row.nis || '')}</p>
          </div>
        </div>
      )
    },
    {
      key: 'kelas', label: 'Kelas',
      render: (_: unknown, row: Record<string, unknown>) => {
        const k = row.kelas as { nama_kelas?: string; tingkat?: string } | null;
        return <span className="text-xs">{k ? `${k.tingkat} - ${k.nama_kelas}` : '-'}</span>;
      }
    },
    { key: 'jenis_kelamin', label: 'L/P', render: (v: unknown) => <span className="text-xs">{String(v) === 'L' ? 'Laki-laki' : 'Perempuan'}</span> },
    { key: 'no_hp', label: 'No. HP', render: (v: unknown) => <span className="text-xs">{String(v || '-')}</span> },
    {
      key: 'status', label: 'Status',
      render: (v: unknown) => <Badge label={String(v)} color={statusColor[String(v)] || ''} />
    },
    {
      key: 'id', label: 'Aksi',
      render: (_: unknown, row: Record<string, unknown>) => (
        <div className="flex items-center gap-1">
          <button onClick={() => openView(row as unknown as Siswa)} className="p-1.5 rounded-lg hover:bg-sky-50 text-sky-600 transition">
            <Eye className="w-4 h-4" />
          </button>
          <button onClick={() => openEdit(row as unknown as Siswa)} className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600 transition">
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
        title="Data Siswa"
        subtitle={`Total ${total} siswa terdaftar`}
        action={
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-sky-500 to-teal-600 text-white rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-all">
            <Plus className="w-4 h-4" />
            Tambah Siswa
          </button>
        }
      />

      <Card>
        {/* Filters */}
        <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nama siswa..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition"
            />
          </div>
          <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white">
            <option value="">Semua Status</option>
            <option value="aktif">Aktif</option>
            <option value="tidak_aktif">Tidak Aktif</option>
            <option value="lulus">Lulus</option>
            <option value="pindah">Pindah</option>
          </select>
          <select value={filterKelas} onChange={e => { setFilterKelas(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white">
            <option value="">Semua Kelas</option>
            {kelas.map(k => <option key={k.id} value={k.id}>{k.tingkat} - {k.nama_kelas}</option>)}
          </select>
        </div>

        <div className="px-5 py-2">
          <Table columns={columns} data={data as unknown as Record<string, unknown>[]} loading={loading} emptyMessage="Belum ada data siswa" />
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </Card>

      {/* Add/Edit Modal */}
      {(modal === 'add' || modal === 'edit') && (
        <Modal title={modal === 'add' ? 'Tambah Siswa Baru' : 'Edit Data Siswa'} onClose={() => setModal(null)} size="lg">
          <div className="p-5 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="NIS" required>
                <input value={form.nis} onChange={e => setForm({ ...form, nis: e.target.value })} className={inputClass} />
              </FormField>
              <FormField label="Nama Lengkap" required>
                <input value={form.nama_lengkap} onChange={e => setForm({ ...form, nama_lengkap: e.target.value })} className={inputClass} />
              </FormField>
              <FormField label="Jenis Kelamin" required>
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
              <FormField label="Nama Orang Tua">
                <input value={form.nama_orangtua} onChange={e => setForm({ ...form, nama_orangtua: e.target.value })} className={inputClass} />
              </FormField>
              <FormField label="No. HP Orang Tua">
                <input value={form.no_hp_orangtua} onChange={e => setForm({ ...form, no_hp_orangtua: e.target.value })} className={inputClass} />
              </FormField>
              <FormField label="Kelas">
                <select value={form.kelas_id} onChange={e => setForm({ ...form, kelas_id: e.target.value })} className={selectClass}>
                  <option value="">Pilih Kelas</option>
                  {kelas.map(k => <option key={k.id} value={k.id}>{k.tingkat} - {k.nama_kelas}</option>)}
                </select>
              </FormField>
              <FormField label="Tahun Masuk">
                <input value={form.tahun_masuk} onChange={e => setForm({ ...form, tahun_masuk: e.target.value })} className={inputClass} />
              </FormField>
              <FormField label="Status">
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as typeof form.status })} className={selectClass}>
                  <option value="aktif">Aktif</option>
                  <option value="tidak_aktif">Tidak Aktif</option>
                  <option value="lulus">Lulus</option>
                  <option value="pindah">Pindah</option>
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

      {/* View Modal */}
      {modal === 'view' && selected && (
        <Modal title="Detail Siswa" onClose={() => setModal(null)} size="md">
          <div className="p-5">
            <div className="flex items-center gap-4 mb-5 pb-5 border-b border-gray-100">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-400 to-teal-500 flex items-center justify-center text-white text-2xl font-bold">
                {selected.nama_lengkap.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-gray-800 text-lg">{selected.nama_lengkap}</h3>
                <p className="text-gray-500 text-sm">NIS: {selected.nis}</p>
                <Badge label={selected.status} color={statusColor[selected.status]} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['Jenis Kelamin', selected.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'],
                ['Tempat/Tgl Lahir', `${selected.tempat_lahir}, ${selected.tanggal_lahir || '-'}`],
                ['Agama', selected.agama],
                ['No. HP', selected.no_hp],
                ['Email', selected.email],
                ['Nama Orang Tua', selected.nama_orangtua],
                ['No. HP Orang Tua', selected.no_hp_orangtua],
                ['Tahun Masuk', selected.tahun_masuk],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-gray-400 text-xs">{label}</p>
                  <p className="font-medium text-gray-700">{value || '-'}</p>
                </div>
              ))}
            </div>
            {selected.alamat && (
              <div className="mt-3">
                <p className="text-gray-400 text-xs">Alamat</p>
                <p className="font-medium text-gray-700 text-sm">{selected.alamat}</p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
