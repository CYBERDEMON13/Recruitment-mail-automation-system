import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Sun, Moon, Bell, Search, UserCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Navbar() {
  const { user, theme, toggleTheme } = useAuth();

  return (
    <header style={{
      height: '68px',
      background: 'var(--bg-surface-glass)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid var(--border-color)',
      padding: '0 2.25rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 9
    }}>
      {/* Search / System Branding */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, maxWidth: '400px' }}>
        <div style={{ position: 'relative', width: '100%' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Quick search candidates, emails..." 
            className="form-control"
            style={{ paddingLeft: '2.5rem', background: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '20px' }}
          />
        </div>
      </div>

      {/* Right Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <button 
          onClick={toggleTheme}
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-surface)',
            color: 'var(--text-main)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'var(--transition-fast)'
          }}
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        <div style={{
          padding: '0.4rem 0.85rem',
          borderRadius: '20px',
          background: 'var(--primary-100)',
          color: 'var(--primary-700)',
          fontWeight: 600,
          fontSize: '0.8rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem'
        }}>
          <UserCheck size={16} />
          <span>Role: {user?.role ? user.role.toUpperCase() : 'HR ADMIN'}</span>
        </div>

        <Link to="/profile" style={{ textDecoration: 'none' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            boxShadow: 'var(--shadow-sm)'
          }}>
            {user?.name ? user.name.charAt(0).toUpperCase() : 'H'}
          </div>
        </Link>
      </div>
    </header>
  );
}
