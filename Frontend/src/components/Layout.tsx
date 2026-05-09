// src/components/Layout.tsx - App shell with sidebar navigation
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { to: '/friends', label: 'Friends', icon: '👥' },
  { to: '/templates', label: 'Templates', icon: '✉️' },
  { to: '/schedules', label: 'Schedules', icon: '📅' },
];

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/login');
  };

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h2>🎂 BirthdayWisher</h2>
          <span>Never miss a birthday again</span>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          {user && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{user.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', wordBreak: 'break-all' }}>{user.email}</div>
            </div>
          )}
          <button className="nav-item btn" style={{ width: '100%', color: 'var(--error)' }} onClick={handleLogout}>
            <span>🚪</span> Sign Out
          </button>
        </div>
      </aside>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default Layout;
