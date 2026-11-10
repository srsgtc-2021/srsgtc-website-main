import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Home, Info, Wrench, FolderKanban, Users, Images, Settings, LogOut, Menu, X,
} from 'lucide-react';
import { useAuth } from './auth';
import './admin.css';

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/home', label: 'Home', icon: Home },
  { to: '/admin/about', label: 'About', icon: Info },
  { to: '/admin/services', label: 'Services', icon: Wrench },
  { to: '/admin/projects', label: 'Projects', icon: FolderKanban },
  { to: '/admin/team', label: 'Team Management', icon: Users },
  { to: '/admin/media', label: 'Media Library', icon: Images },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const logout = async () => {
    await signOut();
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className={`admin-shell${open ? ' is-open' : ''}`}>
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <img src="/assets/srs-mark-dark.png" alt="" />
          <div><b>SRS GEOTECH</b><span>CMS</span></div>
        </div>
        <nav>
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} onClick={() => setOpen(false)}
              className={({ isActive }) => (isActive ? 'active' : '')}>
              <Icon size={18} /><span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="admin-sidebar-foot">
          <span className="admin-user" title={user?.email}>{user?.email}</span>
          <button type="button" onClick={logout}><LogOut size={16} /> Sign out</button>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <button type="button" className="admin-menu-btn" onClick={() => setOpen((v) => !v)} aria-label="Toggle menu">
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
          <span>Content Management</span>
        </header>
        <div className="admin-content"><Outlet /></div>
      </div>
    </div>
  );
}
