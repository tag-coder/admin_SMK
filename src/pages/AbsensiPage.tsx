import { useEffect, useState } from 'react';
import { supabase, Siswa, Kelas } from '../lib/supabase';
import { Badge, PageHeader, Card, FormField, selectClass } from '../components/ui';
import { CheckCircle, XCircle, AlertCircle, Clock, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

type AbsensiStatus = 'hadir' | 'sakit' | 'izin' | 'alfa';

const statusConfig: Record<AbsensiStatus, { label: string; color: string; icon: typeof CheckCircle }> = {
  hadir: { label: 'Hadir', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  sakit: { label: 'Sakit', color: 'bg-blue-100 text-blue-700', icon: AlertCircle },
  izin: { label: 'Izin', color: 'bg-amber-100 text-amber-700', icon: Clock },
  alfa: { label: 'Alfa', color: 'bg-red-100 text-red-700', icon: XCircle },
};

interface AbsenRecord {
  siswa_id: string;
  status: AbsensiStatus;
  keterangan: string;
}

export default function AbsensiPage() {
  const { profile } = useAuth();
  const [kelas, setKelas] = useState<Kelas[]>([]);
  const [siswa, setSiswa] = useState<Siswa[]>([]);
  const [selectedKelas, setSelectedKelas] = useState('');
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [records, setRecords] = useState<Record<string, AbsenRecord>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    supabase.from('kelas').select('*').order('tingkat').then(({ data }) => setKelas(data || []));
  }, []);

  useEffect(() => {
    if (selectedKelas) fetchSiswaAndAbsensi();
  }, [selectedKelas, tanggal]);

  const fetchSiswaAndAbsensi = async () => {
    setLoading(true);
    const { data: siswaData } = await supabase.from('siswa').select('id, nama_lengkap, nis').eq('kelas_id', selectedKelas).eq('status', 'aktif').order('nama_lengkap');
    setSiswa(siswaData || []);

    const { data: absenData } = await supabase.from('absensi').select('siswa_id, status, keterangan').eq('kelas_id', selectedKelas).eq('tanggal', tanggal);

    const recs: Record<string, AbsenRecord> = {};
    (siswaData || []).forEach(s => {
      const existing = absenData?.find(a => a.siswa_id === s.id);
      recs[s.id] = { siswa_id: s.id, status: existing?.status || 'hadir', keterangan: existing?.keterangan || '' };
    });
    setRecords(recs);
    setLoading(false);
    setSaved(false);
  };

  const setStatus = (siswaId: string, status: AbsensiStatus) => {
    setRecords(prev => ({ ...prev, [siswaId]: { ...prev[siswaId], status } }));
  };

  const handleSave = async () => {
    setSaving(true);
    const rows = Object.values(records).map(r => ({
      siswa_id: r.siswa_id,
      kelas_id: selectedKelas,
      tanggal,
      status: r.status,
      keterangan: r.keterangan,
      dicatat_oleh: profile?.id,
    }));

    await supabase.from('absensi').delete().eq('kelas_id', selectedKelas).eq('tanggal', tanggal);
    await supabase.from('absensi').insert(rows);
    setSaving(false);
    setSaved(true);
  };

  const totalByStatus = (s: AbsensiStatus) => Object.values(records).filter(r => r.status === s).length;

  return (
    <div className="space-y-5">
      <PageHeader title="Absensi Siswa" subtitle="Catat kehadiran siswa harian" />

      <Card>
        <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3">
          <FormField label="Tanggal">
            <input type="date" value={tanggal} onChange={e => setTanggal(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
          </FormField>
          <FormField label="Kelas">
            <select value={selectedKelas} onChange={e => setSelectedKelas(e.target.value)} className={selectClass + " min-w-[200px]"}>
              <option value="">Pilih Kelas</option>
              {kelas.map(k => <option key={k.id} value={k.id}>{k.tingkat} - {k.nama_kelas}</option>)}
            </select>
          </FormField>
        </div>

        {selectedKelas && (
          <>
            {/* Summary */}
            <div className="px-5 py-3 border-b border-gray-100 grid grid-cols-4 gap-3">
              {(Object.keys(statusConfig) as AbsensiStatus[]).map(s => (
                <div key={s} className={`rounded-xl p-3 text-center ${statusConfig[s].color}`}>
                  <p className="text-xl font-bold">{totalByStatus(s)}</p>
                  <p className="text-xs font-medium">{statusConfig[s].label}</p>
                </div>
              ))}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-sky-200 border-t-sky-500 rounded-full animate-spin" />
              </div>
            ) : siswa.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">Tidak ada siswa di kelas ini</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {siswa.map((s, i) => {
                  const rec = records[s.id];
                  return (
                    <div key={s.id} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50/40 transition-colors">
                      <span className="text-gray-400 text-sm w-6 flex-shrink-0">{i + 1}</span>
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-teal-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {s.nama_lengkap.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 text-sm truncate">{s.nama_lengkap}</p>
                        <p className="text-gray-400 text-xs">{s.nis}</p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        {(Object.keys(statusConfig) as AbsensiStatus[]).map(st => (
                          <button
                            key={st}
                            onClick={() => setStatus(s.id, st)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                              rec?.status === st
                                ? statusConfig[st].color + ' ring-2 ring-offset-1 ring-current'
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                          >
                            {statusConfig[st].label}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {siswa.length > 0 && (
              <div className="px-5 py-4 border-t border-gray-100 flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold shadow transition-all ${
                    saved ? 'bg-emerald-500 text-white' : 'bg-gradient-to-r from-sky-500 to-teal-600 text-white hover:shadow-md'
                  } disabled:opacity-60`}
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Menyimpan...' : saved ? 'Tersimpan!' : 'Simpan Absensi'}
                </button>
              </div>
            )}
          </>
        )}

        {!selectedKelas && (
          <div className="text-center py-16 text-gray-400">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Pilih kelas untuk mulai mencatat absensi</p>
          </div>
        )}
      </Card>
    </div>
  );
}
