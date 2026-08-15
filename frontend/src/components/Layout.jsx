import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import Logo from './Logo';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';

function navFor(user) {
  if (user.mode === 'business') {
    return [
      { to: '/app/business', label: 'Dashboard', icon: '▦' },
      { to: '/app/business/transactions', label: 'Transactions', icon: '⇄' },
      { to: '/app/business/send', label: 'Send money', icon: '↗' },
      ...(user.role === 'owner'
        ? [
            { to: '/app/business/employees', label: 'Employees', icon: '♟' },
            { to: '/app/business/limits', label: 'Spend limits', icon: '◎' },
            { to: '/app/business/audit', label: 'Audit log', icon: '≡' }
          ]
        : []),
      { to: '/app/business/profile', label: 'Profile', icon: '⚙' }
    ];
  }
  return [
    { to: '/app/personal', label: 'Dashboard', icon: '▦' },
    { to: '/app/personal/transactions', label: 'Transactions', icon: '⇄' },
    { to: '/app/personal/send', label: 'Send money', icon: '↗' },
    { to: '/app/personal/expenses', label: 'Expenses', icon: '◎' },
    { to: '/app/personal/invest', label: 'Invest', icon: '⌁' },
    { to: '/app/personal/prices', label: 'Price compare', icon: '≣' },
    { to: '/app/personal/profile', label: 'Profile', icon: '⚙' }
  ];
}

export default function Layout() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const nav = navFor(user);

  const handleLogout = async () => {
    await logout();
    toast('You have been logged out securely.', 'info');
    navigate('/login');
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
          <button type="button" className="btn btn-ghost theme-toggle" onClick={toggle} aria-label="Toggle theme">
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
        </header>
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
