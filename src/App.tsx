import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import SiswaPage from './pages/SiswaPage';
import GuruPage from './pages/GuruPage';
import KelasPage from './pages/KelasPage';
import MapelPage from './pages/MapelPage';
import JadwalPage from './pages/JadwalPage';
import AbsensiPage from './pages/AbsensiPage';
import NilaiPage from './pages/NilaiPage';
import KeuanganPage from './pages/KeuanganPage';
import PengumumanPage from './pages/PengumumanPage';
import ProfilePage from './pages/ProfilePage';

function AppContent() {
  const { user, loading } = useAuth();
  const [page, setPage] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-sky-200 border-t-sky-500 rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!user) return <LoginPage />;

  const pages: Record<string, JSX.Element> = {
    dashboard: <Dashboard />,
    siswa: <SiswaPage />,
    guru: <GuruPage />,
    kelas: <KelasPage />,
    mapel: <MapelPage />,
    jadwal: <JadwalPage />,
    absensi: <AbsensiPage />,
    nilai: <NilaiPage />,
    keuangan: <KeuanganPage />,
    pengumuman: <PengumumanPage />,
    profile: <ProfilePage />,
  };

  return (
    <Layout activePage={page} onNavigate={setPage}>
      {pages[page] || <Dashboard />}
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
