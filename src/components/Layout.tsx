import { useState, ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  GraduationCap, LayoutDashboard, Users, UserCheck, BookOpen,
  Calendar, ClipboardList, DollarSign, Megaphone, LogOut,
  Menu, X, ChevronRight, Bell, Settings, User
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: ReactNode;
  roles: string[];
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, roles: ['admin', 'guru', 'siswa'] },
  { id: 'siswa', label: 'Data Siswa', icon: <Users className="w-5 h-5" />, roles: ['admin', 'guru'] },
  { id: 'guru', label: 'Data Guru', icon: <UserCheck className="w-5 h-5" />, roles: ['admin'] },
  { id: 'kelas', label: 'Data Kelas', icon: <BookOpen className="w-5 h-5" />, roles: ['admin', 'guru'] },
  { id: 'mapel', label: 'Mata Pelajaran', icon: <BookOpen className="w-5 h-5" />, roles: ['admin'] },
  { id: 'jadwal', label: 'Jadwal Pelajaran', icon: <Calendar className="w-5 h-5" />, roles: ['admin', 'guru', 'siswa'] },
  { id: 'absensi', label: 'Absensi', icon: <ClipboardList className="w-5 h-5" />, roles: ['admin', 'guru', 'siswa'] },
  { id: 'nilai', label: 'Nilai', icon: <ClipboardList className="w-5 h-5" />, roles: ['admin', 'guru', 'siswa'] },
  { id: 'keuangan', label: 'Keuangan', icon: <DollarSign className="w-5 h-5" />, roles: ['admin'] },
  { id: 'pengumuman', label: 'Pengumuman', icon: <Megaphone className="w-5 h-5" />, roles: ['admin', 'guru', 'siswa'] },
];

interface LayoutProps {
  children: ReactNode;
  activePage: string;
  onNavigate: (page: string) => void;
}

export default function Layout({ children, activePage, onNavigate }: LayoutProps) {
  const { profile, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const filteredNav = navItems.filter(item => profile && item.roles.includes(profile.role));

  const roleLabel = { admin: 'Administrator', guru: 'Guru', siswa: 'Siswa' };
  const roleBadgeColor = {
    admin: 'bg-sky-100 text-sky-700',
    guru: 'bg-teal-100 text-teal-700',
    siswa: 'bg-emerald-100 text-emerald-700',
  };

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-100">
        <div className="w-9 h-9 bg-gradient-to-br from-sky-500 to-teal-600 rounded-xl flex items-center justify-center flex-shrink-0">
          <GraduationCap className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-gray-900 text-sm leading-tight">SiSekolah</h1>
          <p className="text-xs text-gray-400">Administrasi Sekolah</p>
        </div>
        <button
          onClick={() => setSidebarOpen(false)}
          className="ml-auto lg:hidden p-1 rounded-lg hover:bg-gray-100 text-gray-400"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Profile */}
      <div className="px-4 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-400 to-teal-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
            {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-800 text-sm truncate">{profile?.full_name || 'User'}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleBadgeColor[profile?.role || 'siswa']}`}>
              {roleLabel[profile?.role || 'siswa']}
            </span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {filteredNav.map(item => (
          <button
            key={item.id}
            onClick={() => { onNavigate(item.id); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
              activePage === item.id
                ? 'bg-gradient-to-r from-sky-500 to-teal-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <span className={activePage === item.id ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'}>
              {item.icon}
            </span>
            <span className="flex-1 text-left">{item.label}</span>
            {activePage === item.id && <ChevronRight className="w-4 h-4 opacity-70" />}
          </button>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-3 border-t border-gray-100 space-y-0.5">
        <button
          onClick={() => onNavigate('profile')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activePage === 'profile' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Settings className="w-5 h-5 text-gray-400" />
          Pengaturan Profil
        </button>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all"
        >
          <LogOut className="w-5 h-5" />
          Keluar
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-100 fixed top-0 left-0 h-screen z-30 shadow-sm">
        <Sidebar />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 bg-white shadow-2xl z-50">
            <Sidebar />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-100 px-4 lg:px-6 py-3 flex items-center gap-4 sticky top-0 z-20 shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-xl hover:bg-gray-100 transition"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h2 className="font-semibold text-gray-800 capitalize">
              {filteredNav.find(n => n.id === activePage)?.label || 'Dashboard'}
            </h2>
            <p className="text-xs text-gray-400 hidden sm:block">
              {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => onNavigate('pengumuman')}
              className="p-2 rounded-xl hover:bg-gray-100 transition relative"
            >
              <Bell className="w-5 h-5 text-gray-500" />
            </button>
            <button
              onClick={() => onNavigate('profile')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-gray-100 transition"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-sky-400 to-teal-500 flex items-center justify-center text-white text-xs font-bold">
                {profile?.full_name?.charAt(0)?.toUpperCase() || <User className="w-4 h-4" />}
              </div>
              <span className="text-sm font-medium text-gray-700 hidden sm:block max-w-[120px] truncate">
                {profile?.full_name}
              </span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
