import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  FileSpreadsheet, 
  FileText, 
  Mail, 
  Send, 
  History, 
  Settings, 
  Database,
  UserCheck,
  Shield,
  LogOut,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Zap
} from 'lucide-react';

const sidebarStyles = `
  .sidebar-nav-link {
    display: flex;
    align-items: center;
    gap: 0.85rem;
    padding: 0.7rem 1rem;
    border-radius: 10px;
    color: rgba(148, 163, 184, 0.85);
    background: transparent;
    border: 1px solid transparent;
    text-decoration: none;
    font-size: 0.875rem;
    font-weight: 500;
    transition: all 0.18s ease;
    position: relative;
    overflow: hidden;
  }

  .sidebar-nav-link::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 3px;
    height: 0;
    background: linear-gradient(180deg, #60a5fa, #3b82f6);
    border-radius: 0 2px 2px 0;
    transition: height 0.2s ease;
  }

  .sidebar-nav-link:hover {
    color: #e2e8f0;
    background: rgba(255, 255, 255, 0.05);
  }

  .sidebar-nav-link:hover .sidebar-nav-icon {
    transform: translateX(2px);
  }

  .sidebar-nav-link.active {
    color: #ffffff;
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(29, 78, 216, 0.12) 100%);
    border-color: rgba(59, 130, 246, 0.25);
    font-weight: 600;
  }

  .sidebar-nav-link.active::before {
    height: 60%;
  }

  .sidebar-nav-link.active .sidebar-nav-icon {
    color: #60a5fa;
  }

  .sidebar-collapsed-link {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border-radius: 10px;
    color: rgba(148, 163, 184, 0.85);
    background: transparent;
    border: 1px solid transparent;
    text-decoration: none;
    transition: all 0.18s ease;
    position: relative;
  }

  .sidebar-collapsed-link:hover {
    color: #e2e8f0;
    background: rgba(255, 255, 255, 0.06);
  }

  .sidebar-collapsed-link.active {
    color: #60a5fa;
    background: rgba(59, 130, 246, 0.18);
    border-color: rgba(59, 130, 246, 0.25);
  }

  .sidebar-tooltip {
    position: absolute;
    left: calc(100% + 12px);
    top: 50%;
    transform: translateY(-50%);
    background: #1e2d44;
    color: #f1f5f9;
    font-size: 0.78rem;
    font-weight: 600;
    padding: 0.35rem 0.7rem;
    border-radius: 6px;
    white-space: nowrap;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.15s ease;
    z-index: 200;
    border: 1px solid rgba(255,255,255,0.08);
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  }

  .sidebar-tooltip::before {
    content: '';
    position: absolute;
    right: 100%;
    top: 50%;
    transform: translateY(-50%);
    border: 5px solid transparent;
    border-right-color: #1e2d44;
  }

  .sidebar-collapsed-link:hover .sidebar-tooltip {
    opacity: 1;
  }

  .sidebar-nav-icon {
    flex-shrink: 0;
    transition: transform 0.18s ease, color 0.18s ease;
  }

  .admin-badge {
    font-size: 0.6rem;
    background: rgba(30, 58, 138, 0.8);
    color: #93c5fd;
    padding: 0.1rem 0.35rem;
    border-radius: 4px;
    font-weight: 700;
    letter-spacing: 0.04em;
    border: 1px solid rgba(59, 130, 246, 0.25);
  }

  .brand-logo-glow {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 16px rgba(59, 130, 246, 0.45), inset 0 1px 0 rgba(255,255,255,0.15);
    flex-shrink: 0;
    transition: box-shadow 0.2s ease;
  }

  .brand-logo-glow:hover {
    box-shadow: 0 6px 24px rgba(59, 130, 246, 0.6), inset 0 1px 0 rgba(255,255,255,0.15);
  }

  .collapse-btn {
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: #64748b;
    border-radius: 8px;
    padding: 5px;
    cursor: pointer;
    display: flex;
    align-items: center;
    transition: all 0.18s ease;
    flex-shrink: 0;
  }

  .collapse-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #94a3b8;
    border-color: rgba(255, 255, 255, 0.12);
  }

  .user-avatar-sidebar {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: linear-gradient(135deg, #3b82f6, #6d28d9);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 0.875rem;
    flex-shrink: 0;
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
    border: 1.5px solid rgba(255,255,255,0.12);
  }

  .logout-btn {
    background: none;
    border: none;
    color: #64748b;
    cursor: pointer;
    padding: 5px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    transition: all 0.18s ease;
  }

  .logout-btn:hover {
    color: #ef4444;
    background: rgba(239, 68, 68, 0.1);
  }

  .role-pill {
    font-size: 0.6rem;
    padding: 0.15rem 0.45rem;
    border-radius: 99px;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    background: rgba(59, 130, 246, 0.15);
    color: #60a5fa;
    border: 1px solid rgba(59, 130, 246, 0.2);
    margin-top: 0.1rem;
    display: inline-block;
  }

  .sidebar-nav-area::-webkit-scrollbar {
    width: 3px;
  }
  .sidebar-nav-area::-webkit-scrollbar-thumb {
    background: rgba(255,255,255,0.06);
    border-radius: 99px;
  }
`;

export default function Sidebar({ collapsed, setCollapsed }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const isAdmin = user && user.role === 'admin';

  const baseNavItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { label: 'Candidates', icon: Users, path: '/candidates' },
    { label: 'Import Candidates', icon: FileSpreadsheet, path: '/import-candidates' },
    { label: 'Document Studio', icon: FileText, path: '/documents' },
    { label: 'Email Templates', icon: Mail, path: '/templates' },
    { label: 'Email Composer', icon: Send, path: '/composer' },
    { label: 'Email History', icon: History, path: '/email-history' },
    { label: 'Settings', icon: Settings, path: '/settings' },
  ];

  const adminNavItems = [
    { label: 'SOC Security Center', icon: Shield, path: '/soc-dashboard', adminOnly: true },
    { label: 'Access & Roles', icon: UserCheck, path: '/users', adminOnly: true },
    { label: 'Database Explorer', icon: Database, path: '/database', adminOnly: true },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <style>{sidebarStyles}</style>
      <aside style={{
        width: collapsed ? 'var(--sidebar-collapsed, 72px)' : 'var(--sidebar-width, 260px)',
        background: 'var(--bg-sidebar)',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
        borderRight: '1px solid rgba(255, 255, 255, 0.05)',
        position: 'relative',
        zIndex: 10,
        flexShrink: 0,
        minHeight: '100vh'
      }}>

        {/* Brand Header */}
        <div style={{
          padding: collapsed ? '1.25rem 0' : '1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          gap: '0.75rem',
          minHeight: '72px'
        }}>
          {!collapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
              <div className="brand-logo-glow">
                <Sparkles size={19} color="#ffffff" />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: '1.05rem', fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>
                  Recruit<span style={{ color: '#60a5fa' }}>ify</span>
                </div>
                <div style={{ fontSize: '0.68rem', color: 'rgba(148, 163, 184, 0.6)', textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: '1px' }}>
                  HR Automation
                </div>
              </div>
            </div>
          )}

          {collapsed && (
            <div className="brand-logo-glow">
              <Sparkles size={19} color="#ffffff" />
            </div>
          )}

          <button
            className="collapse-btn"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Nav List */}
        <nav className="sidebar-nav-area" style={{ flex: 1, padding: collapsed ? '1rem 0.85rem' : '1rem 0.85rem', overflowY: 'auto' }}>

          {/* Main Menu Section */}
          {!collapsed && (
            <div className="sidebar-section-label">
              <Zap size={10} />
              Main Menu
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            {baseNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    collapsed
                      ? `sidebar-collapsed-link ${isActive ? 'active' : ''}`
                      : `sidebar-nav-link ${isActive ? 'active' : ''}`
                  }
                >
                  <Icon size={18} className="sidebar-nav-icon" />
                  {!collapsed && <span>{item.label}</span>}
                  {collapsed && (
                    <span className="sidebar-tooltip">{item.label}</span>
                  )}
                </NavLink>
              );
            })}
          </div>

          {/* Admin Section */}
          {isAdmin && (
            <>
              {!collapsed && (
                <div className="sidebar-section-label" style={{ marginTop: '1.25rem', color: 'rgba(96, 165, 250, 0.5)' }}>
                  <Shield size={10} />
                  Admin Tools
                </div>
              )}

              {collapsed && (
                <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '1rem 0' }} />
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                {adminNavItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={({ isActive }) =>
                        collapsed
                          ? `sidebar-collapsed-link ${isActive ? 'active' : ''}`
                          : `sidebar-nav-link ${isActive ? 'active' : ''}`
                      }
                    >
                      <Icon size={18} className="sidebar-nav-icon" style={{ color: 'inherit' }} />
                      {!collapsed && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                          {item.label}
                          <span className="admin-badge">ADMIN</span>
                        </span>
                      )}
                      {collapsed && (
                        <span className="sidebar-tooltip">
                          {item.label}
                          {' '}(Admin)
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </>
          )}
        </nav>

        {/* User Footer Profile */}
        <div style={{
          padding: collapsed ? '1rem 0.85rem' : '1rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          background: 'rgba(0, 0, 0, 0.15)'
        }}>
          {!collapsed ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
              <NavLink
                to="/profile"
                style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', textDecoration: 'none', color: 'inherit', flex: 1, minWidth: 0 }}
              >
                <div className="user-avatar-sidebar">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'H'}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: '0.825rem', fontWeight: 600, color: '#f1f5f9', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {user?.name || 'HR Admin'}
                  </div>
                  <span className="role-pill">{user?.role || 'user'}</span>
                </div>
              </NavLink>

              <button className="logout-btn" onClick={handleLogout} title="Logout">
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', position: 'relative' }}>
              <NavLink to="/profile" style={{ textDecoration: 'none', position: 'relative' }}>
                <div className="sidebar-collapsed-link" style={{ width: '38px', height: '38px' }}>
                  <div className="user-avatar-sidebar" style={{ width: '32px', height: '32px', fontSize: '0.8rem' }}>
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'H'}
                  </div>
                  <span className="sidebar-tooltip">{user?.name || 'Profile'}</span>
                </div>
              </NavLink>
              <button
                className="logout-btn"
                onClick={handleLogout}
                title="Logout"
                style={{ width: '38px', height: '32px', justifyContent: 'center' }}
              >
                <LogOut size={15} />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
