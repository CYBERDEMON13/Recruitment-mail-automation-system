import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sun, Moon, Bell, Search, UserCheck, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const PAGE_TITLES = {
  '/': 'Dashboard',
  '/candidates': 'Candidate Management',
  '/import-candidates': 'Import Candidates',
  '/documents': 'Document Studio',
  '/templates': 'Email Templates',
  '/composer': 'Email Composer',
  '/email-history': 'Email History',
  '/settings': 'Settings',
  '/profile': 'My Profile',
  '/database': 'Database Explorer',
  '/users': 'Access & Roles',
  '/soc-dashboard': 'SOC Security Center',
};

const navbarStyles = `
  .navbar-search-input {
    background: var(--bg-app) !important;
    border-color: var(--border-color) !important;
    border-radius: 99px !important;
    padding-left: 2.5rem !important;
    padding-right: 2.25rem !important;
    font-size: 0.85rem !important;
    transition: all 0.2s ease !important;
  }

  .navbar-search-input:focus {
    border-color: var(--primary-500) !important;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
    width: 110% !important;
  }

  .navbar-icon-btn {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    border: 1px solid var(--border-color);
    background: var(--bg-surface);
    color: var(--text-muted);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.18s ease;
    position: relative;
    flex-shrink: 0;
  }

  .navbar-icon-btn:hover {
    border-color: var(--primary-300, #93c5fd);
    color: var(--primary-600);
    background: var(--primary-50);
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.12);
  }

  .navbar-avatar-btn {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    background: linear-gradient(135deg, #3b82f6 0%, #6d28d9 100%);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 0.9rem;
    cursor: pointer;
    border: 2px solid transparent;
    transition: all 0.18s ease;
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.25);
    text-decoration: none;
  }

  .navbar-avatar-btn:hover {
    border-color: var(--primary-500);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15), 0 4px 12px rgba(59, 130, 246, 0.2);
    transform: translateY(-1px);
  }

  .notification-dot {
    position: absolute;
    top: 7px;
    right: 7px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--rose-500);
    border: 1.5px solid var(--bg-surface);
    animation: pulse-ring 2s ease-in-out infinite;
  }

  .role-badge-nav {
    padding: 0.3rem 0.75rem;
    border-radius: 99px;
    font-weight: 700;
    font-size: 0.75rem;
    display: flex;
    align-items: center;
    gap: 0.35rem;
    background: var(--primary-50);
    color: var(--primary-700);
    border: 1px solid var(--primary-100);
  }

  [data-theme='dark'] .role-badge-nav {
    background: rgba(59, 130, 246, 0.1);
    color: #93c5fd;
    border-color: rgba(59, 130, 246, 0.2);
  }

  .page-breadcrumb {
    font-size: 0.9rem;
    font-weight: 700;
    color: var(--text-main);
    font-family: var(--font-heading);
    letter-spacing: -0.01em;
  }

  .page-breadcrumb-sub {
    font-size: 0.75rem;
    color: var(--text-muted);
    font-weight: 400;
    margin-top: 1px;
  }

  .user-name-nav {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-main);
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

export default function Navbar() {
  const { user, theme, toggleTheme } = useAuth();
  const location = useLocation();
  const [searchVal, setSearchVal] = useState('');

  const pageTitle = PAGE_TITLES[location.pathname] || 'Recruitify';

  return (
    <>
      <style>{navbarStyles}</style>
      <header style={{
        height: '68px',
        background: 'var(--bg-surface-glass)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-color)',
        padding: '0 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 9,
        gap: '1rem'
      }}>

        {/* Left: Page Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: '0 0 auto' }}>
          <div>
            <div className="page-breadcrumb">{pageTitle}</div>
            <div className="page-breadcrumb-sub">Recruitify HR Portal</div>
          </div>
        </div>

        {/* Center: Search */}
        <div style={{ flex: 1, maxWidth: '380px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Quick search candidates, emails..."
            className="form-control navbar-search-input"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
          />
          {searchVal && (
            <button
              onClick={() => setSearchVal('')}
              style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Right Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: '0 0 auto' }}>
          {/* Notification Bell */}
          <button
            className="navbar-icon-btn"
            title="Notifications"
          >
            <Bell size={17} />
            <span className="notification-dot" />
          </button>

          {/* Theme Toggle */}
          <button
            className="navbar-icon-btn"
            onClick={toggleTheme}
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          >
            {theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}
          </button>

          {/* Role Badge */}
          <div className="role-badge-nav">
            <UserCheck size={14} />
            <span>{user?.role ? user.role.toUpperCase() : 'HR ADMIN'}</span>
          </div>

          {/* User Name + Avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="user-name-nav">{user?.name || 'HR Admin'}</span>
            <Link to="/profile" className="navbar-avatar-btn" title="My Profile">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'H'}
            </Link>
          </div>
        </div>
      </header>
    </>
  );
}
