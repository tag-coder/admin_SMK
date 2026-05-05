import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { StatCard, Card } from '../components/ui';
import {
  Users, UserCheck, BookOpen, DollarSign,
  TrendingUp, ClipboardList, Megaphone, Calendar,
  AlertCircle
} from 'lucide-react';

interface Stats {
  totalSiswa: number;
  totalGuru: number;
  totalKelas: number;
  siswaAktif: number;
  pemasukanBulanIni: number;
  pengeluaranBulanIni: number;
}

interface Pengumuman {
  id: string;
  judul: string;
  isi: string;
  penting: boolean;
  created_at: string;
  tanggal_mulai: string;
}

export default function Dashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalSiswa: 0, totalGuru: 0, totalKelas: 0,
    siswaAktif: 0, pemasukanBulanIni: 0, pengeluaranBulanIni: 0
  });
  const [pengumuman, setPengumuman] = useState<Pengumuman[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const [siswaRes, guruRes, kelasRes, siswaAktifRes, keuanganRes, pengumumanRes] = await Promise.all([
        supabase.from('siswa').select('id', { count: 'exact' }),
        supabase.from('guru').select('id', { count: 'exact' }),
        supabase.from('kelas').select('id', { count: 'exact' }),
        supabase.from('siswa').select('id', { count: 'exact' }).eq('status', 'aktif'),
        supabase.from('keuangan').select('jenis, jumlah').gte('tanggal', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]),
        supabase.from('pengumuman').select('*').order('created_at', { ascending: false }).limit(5)
      ]);

      const pemasukan = keuanganRes.data?.filter(k => k.jenis === 'pemasukan').reduce((s, k) => s + Number(k.jumlah), 0) || 0;
      const pengeluaran = keuanganRes.data?.filter(k => k.jenis === 'pengeluaran').reduce((s, k) => s + Number(k.jumlah), 0) || 0;

      setStats({
        totalSiswa: siswaRes.count || 0,
        totalGuru: guruRes.count || 0,
        totalKelas: kelasRes.count || 0,
        siswaAktif: siswaAktifRes.count || 0,
        pemasukanBulanIni: pemasukan,
        pengeluaranBulanIni: pengeluaran,
      });

      setPengumuman(pengumumanRes.data || []);
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 10) return 'Selamat Pagi';
    if (h < 15) return 'Selamat Siang';
    if (h < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-sky-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sky-100 text-sm">{greeting()},</p>
            <h2 className="text-2xl font-bold mt-0.5">{profile?.full_name || 'Pengguna'}</h2>
            <p className="text-sky-100 text-sm mt-1">
              {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="hidden sm:block opacity-20">
            <BookOpen className="w-20 h-20" />
          </div>
        </div>
      </div>

      {/* Stats Grid - Admin only */}
      {profile?.role === 'admin' && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            title="Total Siswa"
            value={loading ? '...' : stats.totalSiswa}
            icon={<Users className="w-6 h-6 text-sky-600" />}
            color="bg-sky-50"
            sub={`${stats.siswaAktif} siswa aktif`}
          />
          <StatCard
            title="Total Guru"
            value={loading ? '...' : stats.totalGuru}
            icon={<UserCheck className="w-6 h-6 text-teal-600" />}
            color="bg-teal-50"
          />
          <StatCard
            title="Total Kelas"
            value={loading ? '...' : stats.totalKelas}
            icon={<BookOpen className="w-6 h-6 text-blue-600" />}
            color="bg-blue-50"
          />
          <StatCard
            title="Pemasukan Bulan Ini"
            value={loading ? '...' : fmt(stats.pemasukanBulanIni)}
            icon={<TrendingUp className="w-6 h-6 text-emerald-600" />}
            color="bg-emerald-50"
          />
          <StatCard
            title="Pengeluaran Bulan Ini"
            value={loading ? '...' : fmt(stats.pengeluaranBulanIni)}
            icon={<DollarSign className="w-6 h-6 text-orange-600" />}
            color="bg-orange-50"
          />
          <StatCard
            title="Saldo Bersih"
            value={loading ? '...' : fmt(stats.pemasukanBulanIni - stats.pengeluaranBulanIni)}
            icon={<DollarSign className="w-6 h-6 text-sky-600" />}
            color="bg-sky-50"
          />
        </div>
      )}

      {/* Stats for guru/siswa */}
      {profile?.role !== 'admin' && (
        <div className="grid grid-cols-2 gap-4">
          <StatCard
            title="Total Siswa"
            value={loading ? '...' : stats.totalSiswa}
            icon={<Users className="w-6 h-6 text-sky-600" />}
            color="bg-sky-50"
          />
          <StatCard
            title="Total Kelas"
            value={loading ? '...' : stats.totalKelas}
            icon={<BookOpen className="w-6 h-6 text-teal-600" />}
            color="bg-teal-50"
          />
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: <ClipboardList className="w-5 h-5" />, label: 'Absensi Hari Ini', color: 'text-sky-600 bg-sky-50 hover:bg-sky-100' },
          { icon: <Calendar className="w-5 h-5" />, label: 'Jadwal Pelajaran', color: 'text-teal-600 bg-teal-50 hover:bg-teal-100' },
          { icon: <Megaphone className="w-5 h-5" />, label: 'Pengumuman', color: 'text-blue-600 bg-blue-50 hover:bg-blue-100' },
          { icon: <UserCheck className="w-5 h-5" />, label: 'Laporan Nilai', color: 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100' },
        ].map((item, i) => (
          <button
            key={i}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-colors ${item.color}`}
          >
            {item.icon}
            <span className="text-xs font-medium text-center leading-tight">{item.label}</span>
          </button>
        ))}
      </div>

      {/* Pengumuman */}
      <Card>
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-sky-600" />
          <h3 className="font-semibold text-gray-800">Pengumuman Terbaru</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-6 h-6 border-4 border-sky-200 border-t-sky-500 rounded-full animate-spin" />
            </div>
          ) : pengumuman.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-400">
              <Megaphone className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm">Belum ada pengumuman</p>
            </div>
          ) : (
            pengumuman.map(p => (
              <div key={p.id} className="px-5 py-4 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-start gap-3">
                  {p.penting && (
                    <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="font-medium text-gray-800 text-sm">{p.judul}</p>
                    <p className="text-gray-500 text-xs mt-0.5 line-clamp-2">{p.isi}</p>
                    <p className="text-gray-400 text-xs mt-1">
                      {new Date(p.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
