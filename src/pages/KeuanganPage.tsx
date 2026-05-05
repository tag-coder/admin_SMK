import { useEffect, useState } from 'react';
import { supabase, Keuangan, Siswa } from '../lib/supabase';
import { Modal, Table, Pagination, Badge, PageHeader, Card, StatCard, FormField, inputClass, selectClass } from '../components/ui';
import { Plus, Search, Edit2, Trash2, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ITEMS_PER_PAGE = 10;

const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const KATEGORI_PEMASUKAN = ['spp', 'daftar_ulang', 'buku', 'seragam', 'ekstrakurikuler', 'lainnya'];
const KATEGORI_PENGELUARAN = ['gaji', 'operasional', 'pemeliharaan', 'perlengkapan', 'kegiatan', 'lainnya'];

const statusColor: Record<string, string> = {
  lunas: 'bg-emerald-100 text-emerald-700',
  belum_lunas: 'bg-red-100 text-red-700',
  cicilan: 'bg-amber-100 text-amber-700',
};

const emptyForm = {
  jenis: 'pemasukan' as const,
  siswa_id: '',
  kategori: 'spp',
  deskripsi: '',
  jumlah: 0,
  bulan: BULAN[new Date().getMonth()],
  tahun: String(new Date().getFullYear()),
  tanggal: new Date().toISOString().split('T')[0],
  status: 'lunas' as const,
};

export default function KeuanganPage() {
  const { profile } = useAuth();
  const [data, setData] = useState<Keuangan[]>([]);
  const [siswa, setSiswa] = useState<Siswa[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [selected, setSelected] = useState<Keuangan | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [filterJenis, setFilterJenis] = useState('');
  const [filterBulan, setFilterBulan] = useState('');
  const [search, setSearch] = useState('');
  const [summary, setSummary] = useState({ pemasukan: 0, pengeluaran: 0 });

  useEffect(() => {
    supabase.from('siswa').select('id, nama_lengkap, nis').eq('status', 'aktif').order('nama_lengkap').then(r => setSiswa(r.data || []));
    fetchSummary();
    fetchData();
  }, []);

  useEffect(() => { fetchData(); }, [page, filterJenis, filterBulan, search]);

  const fetchSummary = async () => {
    const currMonth = BULAN[new Date().getMonth()];
    const { data } = await supabase.from('keuangan').select('jenis, jumlah').eq('bulan', currMonth).eq('tahun', String(new Date().getFullYear()));
    const p = data?.filter(k => k.jenis === 'pemasukan').reduce((s, k) => s + Number(k.jumlah), 0) || 0;
    const e = data?.filter(k => k.jenis === 'pengeluaran').reduce((s, k) => s + Number(k.jumlah), 0) || 0;
    setSummary({ pemasukan: p, pengeluaran: e });
  };

  const fetchData = async () => {
    setLoading(true);
    let q = supabase.from('keuangan').select('*, siswa(nama_lengkap, nis)', { count: 'exact' });
    if (filterJenis) q = q.eq('jenis', filterJenis);
    if (filterBulan) q = q.eq('bulan', filterBulan);
    if (search) q = q.ilike('deskripsi', `%${search}%`);
    const { data, count, error } = await q.order('tanggal', { ascending: false }).range((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE - 1);
    if (!error) { setData(data || []); setTotal(count || 0); }
    setLoading(false);
  };

  const openAdd = () => { setForm(emptyForm); setSelected(null); setModal('add'); };
  const openEdit = (k: Keuangan) => {
    setSelected(k);
    setForm({
      jenis: k.jenis, siswa_id: k.siswa_id || '', kategori: k.kategori,
      deskripsi: k.deskripsi, jumlah: k.jumlah, bulan: k.bulan, tahun: k.tahun,
      tanggal: k.tanggal, status: k.status,
    });
    setModal('edit');
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = { ...form, siswa_id: form.siswa_id || null, dicatat_oleh: profile?.id };
    if (modal === 'add') await supabase.from('keuangan').insert(payload);
    else if (selected) await supabase.from('keuangan').update(payload).eq('id', selected.id);
    setSaving(false);
    setModal(null);
    fetchData();
    fetchSummary();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin menghapus transaksi ini?')) return;
    await supabase.from('keuangan').delete().eq('id', id);
    fetchData();
    fetchSummary();
  };

  const fmt = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
  const kategoriList = form.jenis === 'pemasukan' ? KATEGORI_PEMASUKAN : KATEGORI_PENGELUARAN;

  const columns = [
    {
      key: 'tanggal', label: 'Tanggal/Deskripsi',
      render: (_: unknown, row: Record<string, unknown>) => (
        <div>
          <p className="font-medium text-gray-800 text-xs">{String(row.deskripsi)}</p>
          <p className="text-gray-400 text-xs">{new Date(String(row.tanggal)).toLocaleDateString('id-ID')} · {String(row.bulan)} {String(row.tahun)}</p>
        </div>
      )
    },
    {
      key: 'siswa', label: 'Siswa',
      render: (_: unknown, row: Record<string, unknown>) => {
        const s = row.siswa as { nama_lengkap?: string } | null;
        return <span className="text-xs">{s?.nama_lengkap || '-'}</span>;
      }
    },
    { key: 'kategori', label: 'Kategori', render: (v: unknown) => <span className="text-xs capitalize">{String(v).replace('_', ' ')}</span> },
    {
      key: 'jenis', label: 'Jenis',
      render: (v: unknown) => (
        <Badge
          label={String(v) === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran'}
          color={String(v) === 'pemasukan' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}
        />
      )
    },
    {
      key: 'jumlah', label: 'Jumlah',
      render: (v: unknown, row: Record<string, unknown>) => (
        <span className={`font-semibold ${String(row.jenis) === 'pemasukan' ? 'text-emerald-600' : 'text-red-500'}`}>
          {String(row.jenis) === 'pemasukan' ? '+' : '-'}{fmt(Number(v))}
        </span>
      )
    },
    {
      key: 'status', label: 'Status',
      render: (v: unknown) => <Badge label={String(v).replace('_', ' ')} color={statusColor[String(v)] || ''} />
    },
    {
      key: 'id', label: 'Aksi',
      render: (_: unknown, row: Record<string, unknown>) => (
        <div className="flex gap-1">
          <button onClick={() => openEdit(row as unknown as Keuangan)} className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600 transition"><Edit2 className="w-4 h-4" /></button>
          <button onClick={() => handleDelete(String(row.id))} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition"><Trash2 className="w-4 h-4" /></button>
        </div>
      )
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Keuangan Sekolah"
        subtitle="Kelola pemasukan dan pengeluaran"
        action={
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-sky-500 to-teal-600 text-white rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-all">
            <Plus className="w-4 h-4" /> Tambah Transaksi
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Pemasukan Bulan Ini" value={fmt(summary.pemasukan)} icon={<TrendingUp className="w-6 h-6 text-emerald-600" />} color="bg-emerald-50" />
        <StatCard title="Pengeluaran Bulan Ini" value={fmt(summary.pengeluaran)} icon={<TrendingDown className="w-6 h-6 text-red-500" />} color="bg-red-50" />
        <StatCard title="Saldo Bersih" value={fmt(summary.pemasukan - summary.pengeluaran)} icon={<DollarSign className="w-6 h-6 text-sky-600" />} color="bg-sky-50" />
      </div>

      <Card>
        <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Cari deskripsi..." className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 w-48" />
          </div>
          <select value={filterJenis} onChange={e => { setFilterJenis(e.target.value); setPage(1); }} className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500">
            <option value="">Semua Jenis</option>
            <option value="pemasukan">Pemasukan</option>
            <option value="pengeluaran">Pengeluaran</option>
          </select>
          <select value={filterBulan} onChange={e => { setFilterBulan(e.target.value); setPage(1); }} className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500">
            <option value="">Semua Bulan</option>
            {BULAN.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div className="px-5 py-2">
          <Table columns={columns} data={data as unknown as Record<string, unknown>[]} loading={loading} emptyMessage="Belum ada data transaksi" />
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </Card>

      {(modal === 'add' || modal === 'edit') && (
        <Modal title={modal === 'add' ? 'Tambah Transaksi' : 'Edit Transaksi'} onClose={() => setModal(null)} size="md">
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Jenis Transaksi" required>
                <select value={form.jenis} onChange={e => setForm({ ...form, jenis: e.target.value as 'pemasukan' | 'pengeluaran', kategori: e.target.value === 'pemasukan' ? 'spp' : 'gaji' })} className={selectClass}>
                  <option value="pemasukan">Pemasukan</option>
                  <option value="pengeluaran">Pengeluaran</option>
                </select>
              </FormField>
              <FormField label="Kategori" required>
                <select value={form.kategori} onChange={e => setForm({ ...form, kategori: e.target.value })} className={selectClass}>
                  {kategoriList.map(k => <option key={k} value={k}>{k.replace('_', ' ')}</option>)}
                </select>
              </FormField>
              {form.jenis === 'pemasukan' && (
                <FormField label="Siswa">
                  <select value={form.siswa_id} onChange={e => setForm({ ...form, siswa_id: e.target.value })} className={selectClass}>
                    <option value="">Umum / Non-siswa</option>
                    {siswa.map(s => <option key={s.id} value={s.id}>{s.nama_lengkap} ({s.nis})</option>)}
                  </select>
                </FormField>
              )}
              <FormField label="Tanggal" required>
                <input type="date" value={form.tanggal} onChange={e => setForm({ ...form, tanggal: e.target.value })} className={inputClass} />
              </FormField>
              <FormField label="Bulan">
                <select value={form.bulan} onChange={e => setForm({ ...form, bulan: e.target.value })} className={selectClass}>
                  {BULAN.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </FormField>
              <FormField label="Tahun">
                <input value={form.tahun} onChange={e => setForm({ ...form, tahun: e.target.value })} className={inputClass} />
              </FormField>
              <FormField label="Jumlah (Rp)" required>
                <input type="number" value={form.jumlah} onChange={e => setForm({ ...form, jumlah: Number(e.target.value) })} className={inputClass} min={0} />
              </FormField>
              <FormField label="Status">
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as typeof form.status })} className={selectClass}>
                  <option value="lunas">Lunas</option>
                  <option value="belum_lunas">Belum Lunas</option>
                  <option value="cicilan">Cicilan</option>
                </select>
              </FormField>
            </div>
            <FormField label="Deskripsi" required>
              <input value={form.deskripsi} onChange={e => setForm({ ...form, deskripsi: e.target.value })} className={inputClass} />
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
