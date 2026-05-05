import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserRole = 'admin' | 'guru' | 'siswa';

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  phone: string;
  avatar_url: string;
  created_at: string;
}

export interface Kelas {
  id: string;
  nama_kelas: string;
  tingkat: string;
  jurusan: string;
  kapasitas: number;
  wali_kelas_id: string | null;
  tahun_ajaran: string;
  created_at: string;
  guru?: Guru;
}

export interface Siswa {
  id: string;
  user_id: string | null;
  nis: string;
  nama_lengkap: string;
  jenis_kelamin: 'L' | 'P';
  tanggal_lahir: string | null;
  tempat_lahir: string;
  alamat: string;
  agama: string;
  no_hp: string;
  email: string;
  nama_orangtua: string;
  no_hp_orangtua: string;
  kelas_id: string | null;
  tahun_masuk: string;
  status: 'aktif' | 'tidak_aktif' | 'lulus' | 'pindah';
  foto_url: string;
  created_at: string;
  kelas?: Kelas;
}

export interface Guru {
  id: string;
  user_id: string | null;
  nip: string;
  nama_lengkap: string;
  jenis_kelamin: 'L' | 'P';
  tanggal_lahir: string | null;
  tempat_lahir: string;
  alamat: string;
  agama: string;
  no_hp: string;
  email: string;
  pendidikan_terakhir: string;
  jurusan_pendidikan: string;
  status_kepegawaian: 'tetap' | 'honorer' | 'kontrak';
  mata_pelajaran_utama: string;
  foto_url: string;
  created_at: string;
}

export interface MataPelajaran {
  id: string;
  kode: string;
  nama: string;
  deskripsi: string;
  guru_id: string | null;
  created_at: string;
  guru?: Guru;
}

export interface Jadwal {
  id: string;
  kelas_id: string;
  mata_pelajaran_id: string;
  guru_id: string;
  hari: string;
  jam_mulai: string;
  jam_selesai: string;
  ruangan: string;
  tahun_ajaran: string;
  semester: string;
  kelas?: Kelas;
  mata_pelajaran?: MataPelajaran;
  guru?: Guru;
}

export interface Absensi {
  id: string;
  siswa_id: string;
  jadwal_id: string | null;
  kelas_id: string | null;
  tanggal: string;
  status: 'hadir' | 'sakit' | 'izin' | 'alfa';
  keterangan: string;
  siswa?: Siswa;
}

export interface Nilai {
  id: string;
  siswa_id: string;
  mata_pelajaran_id: string;
  kelas_id: string | null;
  tahun_ajaran: string;
  semester: string;
  nilai_tugas: number;
  nilai_uts: number;
  nilai_uas: number;
  nilai_akhir: number;
  predikat: string;
  keterangan: string;
  siswa?: Siswa;
  mata_pelajaran?: MataPelajaran;
}

export interface Keuangan {
  id: string;
  siswa_id: string | null;
  jenis: 'pemasukan' | 'pengeluaran';
  kategori: string;
  deskripsi: string;
  jumlah: number;
  bulan: string;
  tahun: string;
  tanggal: string;
  status: 'lunas' | 'belum_lunas' | 'cicilan';
  bukti_url: string;
  siswa?: Siswa;
}

export interface Pengumuman {
  id: string;
  judul: string;
  isi: string;
  target_role: 'semua' | 'siswa' | 'guru' | 'admin';
  dibuat_oleh: string | null;
  tanggal_mulai: string;
  tanggal_selesai: string | null;
  penting: boolean;
  created_at: string;
}
