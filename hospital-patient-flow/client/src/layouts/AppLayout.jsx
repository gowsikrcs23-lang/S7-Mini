import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Activity, BedDouble, Bell, ClipboardList, FileBarChart, Home, LogOut, Menu, Search, Settings, UserRoundPlus, Users, UserCog } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/', label: 'Dashboard', icon: Home },
  { to: '/patients', label: 'Patients', icon: Users },
  { to: '/admissions', label: 'Admissions', icon: UserRoundPlus },
  { to: '/beds', label: 'Beds', icon: BedDouble },
  { to: '/transfers', label: 'Transfers', icon: Activity },
  { to: '/discharges', label: 'Discharges', icon: ClipboardList },
  { to: '/reports', label: 'Reports', icon: FileBarChart },
  { to: '/settings', label: 'Settings', icon: Settings }
];

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <aside className={`fixed inset-y-0 left-0 z-30 hidden border-r border-slate-200 bg-white transition-all lg:block ${collapsed ? 'w-20' : 'w-72'}`}>
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5">
          {!collapsed && <div><p className="text-sm font-bold text-hospital-teal">CareFlow</p><p className="text-xs text-slate-500">Hospital Operations</p></div>}
          <button className="rounded-md p-2 text-slate-500 hover:bg-slate-100" onClick={() => setCollapsed(!collapsed)}><Menu size={20} /></button>
        </div>
        <nav className="space-y-1 p-3">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold ${isActive ? 'bg-hospital-mint text-hospital-ink' : 'text-slate-600 hover:bg-slate-100'}`}>
              <Icon size={19} />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
          {isAdmin && <NavLink to="/users" className={({ isActive }) => `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold ${isActive ? 'bg-hospital-mint text-hospital-ink' : 'text-slate-600 hover:bg-slate-100'}`}>
            <UserCog size={19} />
            {!collapsed && <span>Users</span>}
          </NavLink>}
          <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50">
            <LogOut size={19} />
            {!collapsed && <span>Logout</span>}
          </button>
        </nav>
      </aside>

      <div className={`${collapsed ? 'lg:pl-20' : 'lg:pl-72'}`}>
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur lg:px-8">
          <div>
            <h1 className="text-lg font-bold text-slate-900">CityCare Hospital</h1>
            <p className="hidden text-xs text-slate-500 sm:block">Patient flow and real-time bed availability</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 md:flex">
              <Search size={16} className="text-slate-400" />
              <input className="w-44 bg-transparent text-sm outline-none" placeholder="Search patients..." />
            </div>
            <button className="rounded-md border border-slate-200 bg-white p-2 text-slate-600"><Bell size={19} /></button>
            <div className="rounded-md bg-slate-100 px-3 py-2 text-sm">
              <p className="font-bold">{user?.name}</p>
              <p className="text-xs text-slate-500">{user?.role}</p>
            </div>
          </div>
        </header>
        <main className="p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
