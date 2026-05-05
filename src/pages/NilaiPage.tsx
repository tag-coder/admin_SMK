import { useEffect, useState } from 'react';
import { supabase, Nilai, Siswa, Kelas, MataPelajaran } from '../lib/supabase';
import { Modal, Table, Pagination, Badge, PageHeader, Card, FormField, inputClass, selectClass } from '../components/ui';
import { Plus, Edit2, Trash2, Download } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ITEMS_PER_PAGE = 15;

const getPredikat = (nilai: number): { predikat: string; color: string } => {
  if (nilai >= 90) return { predikat: 'A', color: 'bg-emerald-100 text-emerald-700' };
  if (nilai >= 80) return { predikat: 'B', color: 'bg-blue-100 text-blue-700' };
  if (nilai >= 70) return { predikat: 'C', color: 'bg-amber-100 text-amber-700' };
  if (nilai >= 60) return { predikat: 'D', color: 'bg-orange-100 text-orange-700' };
  return { predikat: 'E', color: 'bg-red-100 text-red-700' };
};

const emptyForm = {
  siswa_id: '', mata_pelajaran_id: '', kelas_id: '',
  tahun_ajaran: `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
  semester: '1', nilai_tugas: 0, nilai_uts: 0, nilai_uas: 0, keterangan: '',
};

export default function NilaiPage() {
  const { profile } = useAuth();
  const [data, setData] = useState<Nilai[]>([]);
  const [siswa, setSiswa] = useState<Siswa[]>([]);
  const [kelas, setKelas] = useState<Kelas[]>([]);
  const [mapel, setMapel] = useState<MataPelajaran[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [selected, setSelected] = useState<Nilai | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [filterKelas, setFilterKelas] = useState('');
  const [filterMapel, setFilterMapel] = useState('');
  const [filterSemester, setFilterSemester] = useState('');

  useEffect(() => {
    Promise.all([
      supabase.from('kelas').select('*').order('tingkat').then(r => setKelas(r.data || [])),
      supabase.from('mata_pelajaran').select('id, nama').order('nama').then(r => setMapel(r.data || [])),
      supabase.from('siswa').select('id, nama_lengkap, nis, kelas_id').eq('status', 'aktif').order('nama_lengkap').then(r => setSiswa(r.data || [])),
    ]);
    fetchData();
  }, []);

  useEffect(() => { fetchData(); }, [page, filterKelas, filterMapel, filterSemester]);

  const fetchData = async () => {
    setLoading(true);
    let q = supabase.from('nilai').select('*, siswa(nama_lengkap, nis), mata_pelajaran(nama)', { count: 'exact' });
    if (filterKelas) q = q.eq('kelas_id', filterKelas);
    if (filterMapel) q = q.eq('mata_pelajaran_id', filterMapel);
    if (filterSemester) q = q.eq('semester', filterSemester);
    const { data, count, error } = await q.order('created_at', { ascending: false }).range((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE - 1);
    if (!error) { setData(data || []); setTotal(count || 0); }
    setLoading(false);
  };

  const openAdd = () => { setForm(emptyForm); setSelected(null); setModal('add'); };
  const openEdit = (n: Nilai) => {
    setSelected(n);
    setForm({
      siswa_id: n.siswa_id, mata_pelajaran_id: n.mata_pelajaran_id, kelas_id: n.kelas_id || '',
      tahun_ajaran: n.tahun_ajaran, semester: n.semester,
      nilai_tugas: n.nilai_tugas, nilai_uts: n.nilai_uts, nilai_uas: n.nilai_uas, keterangan: n.keterangan,
    });
    setModal('edit');
  };

  const calcNilaiAkhir = () => {
    return (form.nilai_tugas * 0.3 + form.nilai_uts * 0.3 + form.nilai_uas * 0.4);
  };

  const handleSave = async () => {
    setSaving(true);
    const nilai_akhir = calcNilaiAkhir();
    const { predikat } = getPredikat(nilai_akhir);
    const payload = {
      ...form,
      kelas_id: form.kelas_id || null,
      nilai_akhir,
      predikat,
      diinput_oleh: profile?.id,
    };
    if (modal === 'add') await supabase.from('nilai').insert(payload);
    else if (selected) await supabase.from('nilai').update(payload).eq('id', selected.id);
    setSaving(false);
    setModal(null);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin menghapus nilai ini?')) return;
    await supabase.from('nilai').delete().eq('id', id);
    fetchData();
  };

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  const columns = [
    {
      key: 'siswa', label: 'Siswa',
      render: (_: unknown, row: Record<string, unknown>) => {
        const s = row.siswa as { nama_lengkap?: string; nis?: string } | null;
        return (
          <div>
            <p className="font-medium text-gray-800 text-xs">{s?.nama_lengkap || '-'}</p>
            <p className="text-gray-400 text-xs">{s?.nis || '-'}</p>
          </div>
        );
      }
    },
    {
      key: 'mata_pelajaran', label: 'Mata Pelajaran',
      render: (_: unknown, row: Record<string, unknown>) => {
        const mp = row.mata_pelajaran as { nama?: string } | null;
        return <span className="text-xs">{mp?.nama || '-'}</span>;
      }
    },
    { key: 'semester', label: 'Smt', render: (v: unknown) => <span className="text-xs">Sem {String(v)}</span> },
    { key: 'nilai_tugas', label: 'Tugas', render: (v: unknown) => <span className="text-sm font-medium">{Number(v).toFixed(0)}</span> },
    { key: 'nilai_uts', label: 'UTS', render: (v: unknown) => <span className="text-sm font-medium">{Number(v).toFixed(0)}</span> },
    { key: 'nilai_uas', label: 'UAS', render: (v: unknown) => <span className="text-sm font-medium">{Number(v).toFixed(0)}</span> },
    {
      key: 'nilai_akhir', label: 'Akhir',
      render: (v: unknown) => {
        const n = Number(v);
        const { predikat, color } = getPredikat(n);
        return (
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-gray-800">{n.toFixed(0)}</span>
            <Badge label={predikat} color={color} />
          </div>
        );
      }
    },
    {
      key: 'id', label: 'Aksi',
      render: (_: unknown, row: Record<string, unknown>) => (
        <div className="flex gap-1">
          <button onClick={() => openEdit(row as unknown as Nilai)} className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600 transition"><Edit2 className="w-4 h-4" /></button>
          <button onClick={() => handleDelete(String(row.id))} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition"><Trash2 className="w-4 h-4" /></button>
        </div>
      )
    },
  ];

  const filteredSiswa = form.kelas_id ? siswa.filter(s => s.kelas_id === form.kelas_id) : siswa;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Nilai Siswa"
        subtitle={`Total ${total} data nilai`}
        action={
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-sky-500 to-teal-600 text-white rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-all">
            <Plus className="w-4 h-4" /> Input Nilai
          </button>
        }
      />

      <Card>
        <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap gap-3">
          <select value={filterKelas} onChange={e => { setFilterKelas(e.target.value); setPage(1); }} className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500">
            <option value="">Semua Kelas</option>
            {kelas.map(k => <option key={k.id} value={k.id}>{k.tingkat} - {k.nama_kelas}</option>)}
          </select>
          <select value={filterMapel} onChange={e => { setFilterMapel(e.target.value); setPage(1); }} className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500">
            <option value="">Semua Mapel</option>
            {mapel.map(m => <option key={m.id} value={m.id}>{m.nama}</option>)}
          </select>
          <select value={filterSemester} onChange={e => { setFilterSemester(e.target.value); setPage(1); }} className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500">
            <option value="">Semua Semester</option>
            <option value="1">Semester 1</option>
            <option value="2">Semester 2</option>
          </select>
        </div>
        <div className="px-5 py-2">
          <Table columns={columns} data={data as unknown as Record<string, unknown>[]} loading={loading} emptyMessage="Belum ada data nilai" />
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </Card>

      {(modal === 'add' || modal === 'edit') && (
        <Modal title={modal === 'add' ? 'Input Nilai Siswa' : 'Edit Nilai'} onClose={() => setModal(null)} size="md">
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Kelas">
                <select value={form.kelas_id} onChange={e => setForm({ ...form, kelas_id: e.target.value, siswa_id: '' })} className={selectClass}>
                  <option value="">Pilih Kelas</option>
                  {kelas.map(k => <option key={k.id} value={k.id}>{k.tingkat} - {k.nama_kelas}</option>)}
                </select>
              </FormField>
              <FormField label="Siswa" required>
                <select value={form.siswa_id} onChange={e => setForm({ ...form, siswa_id: e.target.value })} className={selectClass}>
                  <option value="">Pilih Siswa</option>
                  {filteredSiswa.map(s => <option key={s.id} value={s.id}>{s.nama_lengkap}</option>)}
                </select>
              </FormField>
              <FormField label="Mata Pelajaran" required>
                <select value={form.mata_pelajaran_id} onChange={e => setForm({ ...form, mata_pelajaran_id: e.target.value })} className={selectClass}>
                  <option value="">Pilih</option>
                  {mapel.map(m => <option key={m.id} value={m.id}>{m.nama}</option>)}
                </select>
              </FormField>
              <FormField label="Semester">
                <select value={form.semester} onChange={e => setForm({ ...form, semester: e.target.value })} className={selectClass}>
                  <option value="1">Semester 1</option>
                  <option value="2">Semester 2</option>
                </select>
              </FormField>
              <FormField label="Nilai Tugas (30%)">
                <input type="number" min={0} max={100} value={form.nilai_tugas} onChange={e => setForm({ ...form, nilai_tugas: Number(e.target.value) })} className={inputClass} />
              </FormField>
              <FormField label="Nilai UTS (30%)">
                <input type="number" min={0} max={100} value={form.nilai_uts} onChange={e => setForm({ ...form, nilai_uts: Number(e.target.value) })} className={inputClass} />
              </FormField>
              <FormField label="Nilai UAS (40%)">
                <input type="number" min={0} max={100} value={form.nilai_uas} onChange={e => setForm({ ...form, nilai_uas: Number(e.target.value) })} className={inputClass} />
              </FormField>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nilai Akhir</label>
                <div className={`px-3 py-2.5 border border-gray-200 rounded-lg bg-gray-50 flex items-center justify-between`}>
                  <span className="font-bold text-gray-800">{calcNilaiAkhir().toFixed(1)}</span>
                  <Badge label={getPredikat(calcNilaiAkhir()).predikat} color={getPredikat(calcNilaiAkhir()).color} />
                </div>
              </div>
            </div>
            <FormField label="Keterangan">
              <textarea value={form.keterangan} onChange={e => setForm({ ...form, keterangan: e.target.value })} rows={2} className={inputClass} />
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
