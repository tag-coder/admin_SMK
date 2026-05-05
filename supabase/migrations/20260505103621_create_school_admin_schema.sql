
/*
  # School Administration System - Complete Schema

  ## Tables Created:
  1. `profiles` - Extended user profiles linked to auth.users (role: admin/guru/siswa)
  2. `kelas` - Class/grade data
  3. `siswa` - Student records
  4. `guru` - Teacher records
  5. `mata_pelajaran` - Subjects
  6. `jadwal` - Class schedules
  7. `absensi` - Attendance records
  8. `nilai` - Grade/score records
  9. `keuangan` - Financial transactions (SPP, payments)
  10. `pengumuman` - Announcements

  ## Security:
  - RLS enabled on all tables
  - Role-based access policies
*/

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'siswa' CHECK (role IN ('admin', 'guru', 'siswa')),
  phone text DEFAULT '',
  avatar_url text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admin can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admin can insert profiles"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    OR auth.uid() = id
  );

CREATE POLICY "Admin can update all profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Kelas (Classes)
CREATE TABLE IF NOT EXISTS kelas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_kelas text NOT NULL,
  tingkat text NOT NULL,
  jurusan text DEFAULT '',
  kapasitas integer DEFAULT 30,
  wali_kelas_id uuid REFERENCES profiles(id),
  tahun_ajaran text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE kelas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view kelas"
  ON kelas FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can insert kelas"
  ON kelas FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admin can update kelas"
  ON kelas FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admin can delete kelas"
  ON kelas FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Siswa (Students)
CREATE TABLE IF NOT EXISTS siswa (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id),
  nis text UNIQUE NOT NULL,
  nama_lengkap text NOT NULL,
  jenis_kelamin text CHECK (jenis_kelamin IN ('L', 'P')),
  tanggal_lahir date,
  tempat_lahir text DEFAULT '',
  alamat text DEFAULT '',
  agama text DEFAULT '',
  no_hp text DEFAULT '',
  email text DEFAULT '',
  nama_orangtua text DEFAULT '',
  no_hp_orangtua text DEFAULT '',
  kelas_id uuid REFERENCES kelas(id),
  tahun_masuk text DEFAULT '',
  status text DEFAULT 'aktif' CHECK (status IN ('aktif', 'tidak_aktif', 'lulus', 'pindah')),
  foto_url text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE siswa ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin and guru can view all siswa"
  ON siswa FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'guru'))
    OR user_id = auth.uid()
  );

CREATE POLICY "Admin can insert siswa"
  ON siswa FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admin can update siswa"
  ON siswa FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admin can delete siswa"
  ON siswa FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Guru (Teachers)
CREATE TABLE IF NOT EXISTS guru (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id),
  nip text UNIQUE,
  nama_lengkap text NOT NULL,
  jenis_kelamin text CHECK (jenis_kelamin IN ('L', 'P')),
  tanggal_lahir date,
  tempat_lahir text DEFAULT '',
  alamat text DEFAULT '',
  agama text DEFAULT '',
  no_hp text DEFAULT '',
  email text DEFAULT '',
  pendidikan_terakhir text DEFAULT '',
  jurusan_pendidikan text DEFAULT '',
  status_kepegawaian text DEFAULT 'tetap' CHECK (status_kepegawaian IN ('tetap', 'honorer', 'kontrak')),
  mata_pelajaran_utama text DEFAULT '',
  foto_url text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE guru ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view guru"
  ON guru FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can insert guru"
  ON guru FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admin can update guru"
  ON guru FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admin can delete guru"
  ON guru FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Mata Pelajaran (Subjects)
CREATE TABLE IF NOT EXISTS mata_pelajaran (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kode text UNIQUE NOT NULL,
  nama text NOT NULL,
  deskripsi text DEFAULT '',
  guru_id uuid REFERENCES guru(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE mata_pelajaran ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view mata_pelajaran"
  ON mata_pelajaran FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can insert mata_pelajaran"
  ON mata_pelajaran FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admin can update mata_pelajaran"
  ON mata_pelajaran FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admin can delete mata_pelajaran"
  ON mata_pelajaran FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Jadwal (Schedule)
CREATE TABLE IF NOT EXISTS jadwal (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kelas_id uuid REFERENCES kelas(id) NOT NULL,
  mata_pelajaran_id uuid REFERENCES mata_pelajaran(id) NOT NULL,
  guru_id uuid REFERENCES guru(id) NOT NULL,
  hari text NOT NULL CHECK (hari IN ('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu')),
  jam_mulai time NOT NULL,
  jam_selesai time NOT NULL,
  ruangan text DEFAULT '',
  tahun_ajaran text NOT NULL,
  semester text DEFAULT '1',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE jadwal ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view jadwal"
  ON jadwal FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can insert jadwal"
  ON jadwal FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admin can update jadwal"
  ON jadwal FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admin can delete jadwal"
  ON jadwal FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Absensi (Attendance)
CREATE TABLE IF NOT EXISTS absensi (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  siswa_id uuid REFERENCES siswa(id) NOT NULL,
  jadwal_id uuid REFERENCES jadwal(id),
  kelas_id uuid REFERENCES kelas(id),
  tanggal date NOT NULL,
  status text NOT NULL CHECK (status IN ('hadir', 'sakit', 'izin', 'alfa')),
  keterangan text DEFAULT '',
  dicatat_oleh uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE absensi ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin and guru can view absensi"
  ON absensi FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'guru'))
    OR EXISTS (SELECT 1 FROM siswa WHERE id = absensi.siswa_id AND user_id = auth.uid())
  );

CREATE POLICY "Admin and guru can insert absensi"
  ON absensi FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'guru'))
  );

CREATE POLICY "Admin and guru can update absensi"
  ON absensi FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'guru')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'guru')));

CREATE POLICY "Admin can delete absensi"
  ON absensi FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Nilai (Grades)
CREATE TABLE IF NOT EXISTS nilai (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  siswa_id uuid REFERENCES siswa(id) NOT NULL,
  mata_pelajaran_id uuid REFERENCES mata_pelajaran(id) NOT NULL,
  kelas_id uuid REFERENCES kelas(id),
  tahun_ajaran text NOT NULL,
  semester text NOT NULL,
  nilai_tugas numeric(5,2) DEFAULT 0,
  nilai_uts numeric(5,2) DEFAULT 0,
  nilai_uas numeric(5,2) DEFAULT 0,
  nilai_akhir numeric(5,2) DEFAULT 0,
  predikat text DEFAULT '',
  keterangan text DEFAULT '',
  diinput_oleh uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE nilai ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin and guru can view nilai"
  ON nilai FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'guru'))
    OR EXISTS (SELECT 1 FROM siswa WHERE id = nilai.siswa_id AND user_id = auth.uid())
  );

CREATE POLICY "Admin and guru can insert nilai"
  ON nilai FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'guru'))
  );

CREATE POLICY "Admin and guru can update nilai"
  ON nilai FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'guru')))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'guru')));

CREATE POLICY "Admin can delete nilai"
  ON nilai FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Keuangan (Finance)
CREATE TABLE IF NOT EXISTS keuangan (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  siswa_id uuid REFERENCES siswa(id),
  jenis text NOT NULL CHECK (jenis IN ('pemasukan', 'pengeluaran')),
  kategori text NOT NULL DEFAULT 'spp',
  deskripsi text NOT NULL,
  jumlah numeric(15,2) NOT NULL,
  bulan text DEFAULT '',
  tahun text DEFAULT '',
  tanggal date NOT NULL DEFAULT CURRENT_DATE,
  status text DEFAULT 'lunas' CHECK (status IN ('lunas', 'belum_lunas', 'cicilan')),
  bukti_url text DEFAULT '',
  dicatat_oleh uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE keuangan ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view all keuangan"
  ON keuangan FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    OR EXISTS (SELECT 1 FROM siswa WHERE id = keuangan.siswa_id AND user_id = auth.uid())
  );

CREATE POLICY "Admin can insert keuangan"
  ON keuangan FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admin can update keuangan"
  ON keuangan FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admin can delete keuangan"
  ON keuangan FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Pengumuman (Announcements)
CREATE TABLE IF NOT EXISTS pengumuman (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  judul text NOT NULL,
  isi text NOT NULL,
  target_role text DEFAULT 'semua' CHECK (target_role IN ('semua', 'siswa', 'guru', 'admin')),
  dibuat_oleh uuid REFERENCES profiles(id),
  tanggal_mulai date DEFAULT CURRENT_DATE,
  tanggal_selesai date,
  penting boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE pengumuman ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view relevant pengumuman"
  ON pengumuman FOR SELECT
  TO authenticated
  USING (
    target_role = 'semua'
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = target_role)
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admin can insert pengumuman"
  ON pengumuman FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admin can update pengumuman"
  ON pengumuman FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admin can delete pengumuman"
  ON pengumuman FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_siswa_kelas ON siswa(kelas_id);
CREATE INDEX IF NOT EXISTS idx_siswa_nis ON siswa(nis);
CREATE INDEX IF NOT EXISTS idx_absensi_siswa ON absensi(siswa_id);
CREATE INDEX IF NOT EXISTS idx_absensi_tanggal ON absensi(tanggal);
CREATE INDEX IF NOT EXISTS idx_nilai_siswa ON nilai(siswa_id);
CREATE INDEX IF NOT EXISTS idx_keuangan_siswa ON keuangan(siswa_id);
CREATE INDEX IF NOT EXISTS idx_jadwal_kelas ON jadwal(kelas_id);
