
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';

const SidebarItem: React.FC<{ to: string, icon: string, label: string, active: boolean }> = ({ to, icon, label, active }) => (
  <Link 
    to={to} 
    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
      active ? 'bg-orange-100 text-orange-700 font-semibold' : 'text-slate-600 hover:bg-slate-100'
    }`}
  >
    <span>{icon}</span>
    <span className="text-sm">{label}</span>
  </Link>
);

interface LayoutProps {
  children: React.ReactNode;
  isAdmin?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, isAdmin: isAdminProp }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const sessionStr = localStorage.getItem('edugenius_session');
    if (sessionStr) {
      const session = JSON.parse(sessionStr);
      setIsAuthenticated(true);
      if (isAdminProp !== undefined) {
        setIsAdmin(isAdminProp);
      } else {
        setIsAdmin(session.role === 'ADMIN');
      }
    } else {
      setIsAuthenticated(false);
      setIsAdmin(false);
    }
  }, [isAdminProp, location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('edugenius_session');
    navigate('/');
  };

  // Jika tidak terautentikasi (Pengunjung Umum), tampilkan layout tanpa sidebar
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        {/* Simple Navbar for Guests */}
        <nav className="bg-white border-b px-6 py-4 sticky top-0 z-50 shadow-sm print:hidden">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-8 h-8 orange-gradient rounded-lg flex items-center justify-center text-white font-bold">E</div>
              <span className="font-bold text-slate-800">EduGenius AI</span>
            </Link>
            <Link to="/login" className="text-xs font-black uppercase tracking-widest text-orange-600 hover:text-orange-700">
              Login Guru/Admin →
            </Link>
          </div>
        </nav>
        
        <main className="flex-1 p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    );
  }

  // Layout untuk Admin/Guru yang sudah login
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b sticky top-0 z-50 print:hidden">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 orange-gradient rounded-lg flex items-center justify-center text-white font-bold">E</div>
          <span className="font-bold text-orange-600">EduGenius</span>
        </div>
        <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 text-slate-600">
          {isSidebarOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Sidebar */}
      <div className={`
        fixed inset-0 z-40 md:relative md:flex md:w-64 bg-white border-r transition-transform transform print:hidden
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
      `}>
        <div className="flex flex-col h-full w-full p-4">
          <div className="hidden md:flex items-center space-x-3 mb-8 px-4">
            <div className="w-10 h-10 orange-gradient rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-orange-200">E</div>
            <div>
              <h1 className="font-bold text-slate-800 leading-none">EduGenius</h1>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest">Quiz Generator</span>
            </div>
          </div>

          <nav className="flex-1 space-y-1">
            <SidebarItem to="/dashboard" icon="📊" label="Dashboard" active={location.pathname === '/dashboard'} />
            <SidebarItem to="/create" icon="✍️" label="Buat Soal" active={location.pathname === '/create'} />
            <SidebarItem to="/history" icon="🕒" label="Riwayat & Proses" active={location.pathname === '/history'} />
            
            {isAdmin && (
              <>
                <div className="pt-4 pb-2 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-t mt-4">Admin Panel</div>
                <SidebarItem to="/content" icon="📚" label="Manajemen Konten" active={location.pathname === '/content'} />
                <SidebarItem to="/admin/keys" icon="🔑" label="API Keys" active={location.pathname === '/admin/keys'} />
                <SidebarItem to="/admin/users" icon="👥" label="Manajemen User" active={location.pathname === '/admin/users'} />
                <SidebarItem to="/admin/settings" icon="⚙️" label="Site Settings" active={location.pathname === '/admin/settings'} />
                <SidebarItem to="/admin/logs" icon="📜" label="Sistem Log" active={location.pathname === '/admin/logs'} />
              </>
            )}
          </nav>

          <button 
            onClick={handleLogout}
            className="mt-auto flex items-center space-x-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <span>🚪</span>
            <span className="text-sm font-medium">Keluar</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
