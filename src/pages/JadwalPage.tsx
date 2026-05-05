import { useEffect, useState } from 'react';
import { supabase, Jadwal, Kelas, Guru, MataPelajaran } from '../lib/supabase';
import { Modal, PageHeader, Card, FormField, inputClass, selectClass } from '../components/ui';
import { Plus, Edit2, Trash2 } from 'lucide-react';

const HARI = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const hariColor: Record<string, string> = {
  Senin: 'bg-sky-50 border-sky-200',
  Selasa: 'bg-teal-50 border-teal-200',
  Rabu: 'bg-emerald-50 border-emerald-200',
  Kamis: 'bg-blue-50 border-blue-200',
  Jumat: 'bg-amber-50 border-amber-200',
  Sabtu: 'bg-orange-50 border-orange-200',
};

const emptyForm = {
  kelas_id: '', mata_pelajaran_id: '', guru_id: '',
  hari: 'Senin', jam_mulai: '07:00', jam_selesai: '08:00',
  ruangan: '', tahun_ajaran: `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`, semester: '1',
};

export default function JadwalPage() {
  const [data, setData] = useState<Jadwal[]>([]);
  const [kelas, setKelas] = useState<Kelas[]>([]);
  const [guru, setGuru] = useState<Guru[]>([]);
  const [mapel, setMapel] = useState<MataPelajaran[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [selected, setSelected] = useState<Jadwal | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [filterKelas, setFilterKelas] = useState('');

  useEffect(() => {
    Promise.all([
      supabase.from('kelas').select('*').order('tingkat').then(r => setKelas(r.data || [])),
      supabase.from('guru').select('id, nama_lengkap').order('nama_lengkap').then(r => setGuru(r.data || [])),
      supabase.from('mata_pelajaran').select('id, nama').order('nama').then(r => setMapel(r.data || [])),
    ]);
    fetchData();
  }, []);

  useEffect(() => { fetchData(); }, [filterKelas]);

  const fetchData = async () => {
    setLoading(true);
    let q = supabase.from('jadwal').select('*, kelas(nama_kelas, tingkat), mata_pelajaran(nama), guru(nama_lengkap)').order('hari').order('jam_mulai');
    if (filterKelas) q = q.eq('kelas_id', filterKelas);
    const { data } = await q;
    setData(data || []);
    setLoading(false);
  };

  const openAdd = () => { setForm(emptyForm); setSelected(null); setModal('add'); };
  const openEdit = (j: Jadwal) => {
    setSelected(j);
    setForm({
      kelas_id: j.kelas_id, mata_pelajaran_id: j.mata_pelajaran_id, guru_id: j.guru_id,
      hari: j.hari, jam_mulai: j.jam_mulai, jam_selesai: j.jam_selesai,
      ruangan: j.ruangan, tahun_ajaran: j.tahun_ajaran, semester: j.semester,
    });
    setModal('edit');
  };

  const handleSave = async () => {
    setSaving(true);
    if (modal === 'add') await supabase.from('jadwal').insert(form);
    else if (selected) await supabase.from('jadwal').update(form).eq('id', selected.id);
    setSaving(false);
    setModal(null);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin menghapus jadwal ini?')) return;
    await supabase.from('jadwal').delete().eq('id', id);
    fetchData();
  };

  // Group by hari
  const grouped = HARI.reduce<Record<string, Jadwal[]>>((acc, h) => {
    acc[h] = data.filter(j => j.hari === h);
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      <PageHeader
        title="Jadwal Pelajaran"
        subtitle="Kelola jadwal pelajaran harian"
        action={
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-sky-500 to-teal-600 text-white rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-all">
            <Plus className="w-4 h-4" /> Tambah Jadwal
          </button>
        }
      />

      {/* Filter */}
      <div className="flex gap-3">
        <select value={filterKelas} onChange={e => setFilterKelas(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white">
          <option value="">Semua Kelas</option>
          {kelas.map(k => <option key={k.id} value={k.id}>{k.tingkat} - {k.nama_kelas}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-sky-200 border-t-sky-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid gap-4">
          {HARI.map(hari => {
            const items = grouped[hari];
            if (items.length === 0) return null;
            return (
              <Card key={hari}>
                <div className={`px-5 py-3 border-b rounded-t-2xl ${hariColor[hari]} border`}>
                  <h3 className="font-semibold text-gray-700">{hari}</h3>
                </div>
                <div className="divide-y divide-gray-50">
                  {items.map(j => {
                    const k = j.kelas as { nama_kelas?: string; tingkat?: string } | null;
                    const mp = j.mata_pelajaran as { nama?: string } | null;
                    const g = j.guru as { nama_lengkap?: string } | null;
                    return (
                      <div key={j.id} className="px-5 py-3 flex items-center gap-4 hover:bg-gray-50/50 transition-colors">
                        <div className="text-center min-w-[80px]">
                          <p className="text-sm font-semibold text-sky-600">{j.jam_mulai.slice(0, 5)}</p>
                          <p className="text-xs text-gray-400">{j.jam_selesai.slice(0, 5)}</p>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 text-sm">{mp?.nama || '-'}</p>
                          <p className="text-xs text-gray-500">{g?.nama_lengkap || '-'} · {k ? `${k.tingkat} ${k.nama_kelas}` : '-'}</p>
                          {j.ruangan && <p className="text-xs text-gray-400">Ruang: {j.ruangan}</p>}
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <button onClick={() => openEdit(j)} className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600 transition"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(j.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            );
          })}
          {data.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <p>Belum ada jadwal pelajaran</p>
            </div>
          )}
        </div>
      )}

      {(modal === 'add' || modal === 'edit') && (
        <Modal title={modal === 'add' ? 'Tambah Jadwal' : 'Edit Jadwal'} onClose={() => setModal(null)} size="md">
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Kelas" required>
                <select value={form.kelas_id} onChange={e => setForm({ ...form, kelas_id: e.target.value })} className={selectClass}>
                  <option value="">Pilih Kelas</option>
                  {kelas.map(k => <option key={k.id} value={k.id}>{k.tingkat} - {k.nama_kelas}</option>)}
                </select>
              </FormField>
              <FormField label="Mata Pelajaran" required>
                <select value={form.mata_pelajaran_id} onChange={e => setForm({ ...form, mata_pelajaran_id: e.target.value })} className={selectClass}>
                  <option value="">Pilih</option>
                  {mapel.map(m => <option key={m.id} value={m.id}>{m.nama}</option>)}
                </select>
              </FormField>
              <FormField label="Guru" required>
                <select value={form.guru_id} onChange={e => setForm({ ...form, guru_id: e.target.value })} className={selectClass}>
                  <option value="">Pilih Guru</option>
                  {guru.map(g => <option key={g.id} value={g.id}>{g.nama_lengkap}</option>)}
                </select>
              </FormField>
              <FormField label="Hari" required>
                <select value={form.hari} onChange={e => setForm({ ...form, hari: e.target.value })} className={selectClass}>
                  {HARI.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </FormField>
              <FormField label="Jam Mulai" required>
                <input type="time" value={form.jam_mulai} onChange={e => setForm({ ...form, jam_mulai: e.target.value })} className={inputClass} />
              </FormField>
              <FormField label="Jam Selesai" required>
                <input type="time" value={form.jam_selesai} onChange={e => setForm({ ...form, jam_selesai: e.target.value })} className={inputClass} />
              </FormField>
              <FormField label="Ruangan">
                <input value={form.ruangan} onChange={e => setForm({ ...form, ruangan: e.target.value })} className={inputClass} />
              </FormField>
              <FormField label="Semester">
                <select value={form.semester} onChange={e => setForm({ ...form, semester: e.target.value })} className={selectClass}>
                  <option value="1">Semester 1</option>
                  <option value="2">Semester 2</option>
                </select>
              </FormField>
              <FormField label="Tahun Ajaran">
                <input value={form.tahun_ajaran} onChange={e => setForm({ ...form, tahun_ajaran: e.target.value })} className={inputClass} />
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
