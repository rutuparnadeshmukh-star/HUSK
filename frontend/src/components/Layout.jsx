import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import Logo from './Logo';
import Franky from './Franky';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { api } from '../api';

function navFor(user) {
  if (user.mode === 'business') {
    return [
      { to: '/app/business', label: 'Dashboard', icon: '▦' },
      { to: '/app/business/analytics', label: 'Analytics', icon: '⌁' },
      { to: '/app/business/cashflow', label: 'Cash flow', icon: '⇅' },
      { to: '/app/business/invoices', label: 'Invoices', icon: '≡' },
      { to: '/app/business/vendors', label: 'Vendors', icon: '↗' },
      { to: '/app/business/transactions', label: 'Transactions', icon: '⇄' },
      { to: '/app/business/send', label: 'Send money', icon: '↪' },
      ...(user.role === 'owner'
        ? [
            { to: '/app/business/payroll', label: 'Payroll', icon: '♟' },
            { to: '/app/business/employees', label: 'Manage access', icon: '◎' },
            { to: '/app/business/limits', label: 'Spend limits', icon: '≣' },
            { to: '/app/business/audit', label: 'Audit log', icon: '⚙' }
          ]
        : []),
      { to: '/app/business/rewards', label: 'Artham points', icon: '★' },
      { to: '/app/business/profile', label: 'Profile', icon: '☰' }
    ];
  }
  return [
    { to: '/app/personal', label: 'Dashboard', icon: '▦' },
    { to: '/app/personal/analytics', label: 'Analytics', icon: '⌁' },
    { to: '/app/personal/transactions', label: 'Transactions', icon: '⇄' },
    { to: '/app/personal/send', label: 'Send money', icon: '↗' },
    { to: '/app/personal/bills', label: 'Bills & recharge', icon: '≡' },
    { to: '/app/personal/p2p', label: 'P2P transfers', icon: '⇅' },
    { to: '/app/personal/expenses', label: 'Expenses', icon: '◎' },
    { to: '/app/personal/budget', label: 'Save budget', icon: '≣' },
    { to: '/app/personal/emi', label: 'EMI calculator', icon: '⌁' },
    { to: '/app/personal/invest', label: 'Invest', icon: '↘' },
    { to: '/app/personal/prices', label: 'Price compare', icon: '★' },
    { to: '/app/personal/rewards', label: 'Artham points', icon: '♟' },
    { to: '/app/personal/profile', label: 'Profile', icon: '⚙' }
  ];
}

function mobileNavFor(user) {
  if (user.mode === 'business') {
    return [
      { to: '/app/business', label: 'Home', icon: '▦' },
      { to: '/app/business/transactions', label: 'Activity', icon: '⇄' },
      { to: '/app/business/send', label: 'Send', icon: '↗' },
      ...(user.role === 'owner' ? [{ to: '/app/business/employees', label: 'Team', icon: '♟' }] : []),
      { to: '/app/business/profile', label: 'Profile', icon: '⚙' }
    ];
  }
  return [
    { to: '/app/personal', label: 'Home', icon: '▦' },
    { to: '/app/personal/transactions', label: 'Activity', icon: '⇄' },
    { to: '/app/personal/send', label: 'Send', icon: '↗' },
    { to: '/app/personal/invest', label: 'Invest', icon: '⌁' },
    { to: '/app/personal/profile', label: 'Profile', icon: '⚙' }
  ];
}

export default function Layout() {
  const { user, refreshUser, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const nav = navFor(user);
  const mobileNav = mobileNavFor(user);
  const notifications = user?.notifications || [];
  const unread = notifications.filter((n) => !n.read).length;

  const handleLogout = async () => {
    await logout();
    toast('You have been logged out securely.', 'info');
    navigate('/login');
  };

  const markAllRead = async () => {
    try {
      await api.post('/auth/notifications/read');
      await refreshUser();
    } catch {
      /* ignore */
    }
    setNotifOpen(false);
  };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <Logo size={34} />
        </div>
        <nav className="sidebar-nav">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/app/personal' || item.to === '/app/business'}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-foot">
          <button type="button" className="nav-item" onClick={handleLogout}>
            <span className="nav-icon">↪</span>
            <span>Log out</span>
          </button>
        </div>
      </aside>
      {menuOpen && <div className="sidebar-backdrop" onClick={() => setMenuOpen(false)} />}

      <div className="app-main">
        <header className="topbar">
          <button type="button" className="icon-btn hamburger" onClick={() => setMenuOpen(true)} aria-label="Menu">
            Menu
          </button>
          <div className="topbar-user">
            <div className="avatar">{user ? (user.name || 'U').charAt(0).toUpperCase() : 'U'}</div>
            <div className="topbar-user-text">
              <strong>{user ? user.name : ''}</strong>
              <span className="muted tiny">
                {user
                  ? user.mode === 'business'
                    ? `Business ${user.role === 'owner' ? 'Owner' : 'Employee'}`
                    : 'Personal Account'
                  : ''}
              </span>
            </div>
          </div>
          <div className="topbar-actions">
            <div className="notif-wrap">
              <button
                type="button"
                className="icon-btn notif-bell"
                onClick={() => setNotifOpen((o) => !o)}
                aria-label="Notifications"
              >
                Alerts
                {unread > 0 && <span className="notif-badge">{unread}</span>}
              </button>
              {notifOpen && (
                <div className="notif-panel">
                  <div className="notif-panel-head">
                    <strong>Notifications</strong>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={markAllRead}>
                      Mark all read
                    </button>
                  </div>
                  {notifications.length === 0 ? (
                    <p className="muted notif-empty">You're all caught up.</p>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} className={`notif-item ${n.read ? '' : 'unread'}`}>
                        <div className="notif-title">{n.title}</div>
                        <div className="muted tiny">{n.body}</div>
                        <div className="muted tiny">{new Date(n.time).toLocaleString()}</div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            <button type="button" className="btn btn-ghost theme-toggle" onClick={toggle} aria-label="Toggle theme">
              {theme === 'dark' ? 'Light mode' : 'Dark mode'}
            </button>
          </div>
        </header>
        <main className="page-content">
          <Outlet />
        </main>
      </div>

      <nav className="mobile-nav">
        {mobileNav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/app/personal' || item.to === '/app/business'}
            className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="mobile-nav-icon">{item.icon}</span>
            <span className="mobile-nav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <Franky />
    </div>
  );
}
