import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { User, Mail, Lock, Save, ShieldCheck, Camera, KeyRound } from 'lucide-react';

export default function UserProfilePage() {
  const { user, updateUser } = useAuth();
  const { showSuccess, showError } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.put('/api/auth/profile', {
        name, email, currentPassword, newPassword
      });
      if (res.data.success) {
        showSuccess('Profile details updated successfully.');
        updateUser(res.data.user);
        setCurrentPassword('');
        setNewPassword('');
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Profile update failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <User size={26} style={{ color: 'var(--primary-600)' }} />
            My Profile
          </h1>
          <p className="page-subtitle">Manage your account information and credentials</p>
        </div>
      </div>

      <div style={{ maxWidth: '680px' }}>
        {/* Profile Header Card */}
        <div className="glass-card" style={{
          marginBottom: '1.5rem',
          overflow: 'hidden'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--primary-600) 0%, #6d28d9 100%)',
            height: '80px',
            position: 'relative'
          }} />
          <div style={{ padding: '0 2rem 1.75rem', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{
                width: '76px', height: '76px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #3b82f6, #6d28d9)',
                color: '#ffffff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: '1.75rem',
                border: '4px solid var(--bg-surface)',
                boxShadow: '0 4px 16px rgba(59,130,246,0.35)',
                marginTop: '-38px',
                position: 'relative'
              }}>
                {user?.name ? user.name.charAt(0).toUpperCase() : 'H'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                  fontSize: '0.75rem', fontWeight: 700,
                  color: 'var(--emerald-600)',
                  background: 'rgba(16,185,129,0.1)',
                  border: '1px solid rgba(16,185,129,0.2)',
                  padding: '0.3rem 0.75rem', borderRadius: '99px'
                }}>
                  <ShieldCheck size={13} />
                  {user?.role?.toUpperCase() || 'USER'}
                </span>
              </div>
            </div>
            <div style={{ fontWeight: 800, fontSize: '1.25rem', fontFamily: 'var(--font-heading)', marginBottom: '0.2rem' }}>
              {user?.name || 'HR Administrator'}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{user?.email}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tab-list">
          <button className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
            <User size={15} style={{ display: 'inline', marginRight: '0.4rem' }} />
            Account Details
          </button>
          <button className={`tab-btn ${activeTab === 'password' ? 'active' : ''}`} onClick={() => setActiveTab('password')}>
            <KeyRound size={15} style={{ display: 'inline', marginRight: '0.4rem' }} />
            Change Password
          </button>
        </div>

        <div className="glass-card" style={{ padding: '2rem' }}>
          <form onSubmit={handleUpdateProfile}>
            {activeTab === 'profile' && (
              <>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input type="text" className="form-control" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </>
            )}

            {activeTab === 'password' && (
              <>
                <div className="info-banner info-banner-primary" style={{ marginBottom: '1.5rem', borderRadius: 'var(--radius-md)' }}>
                  <Lock size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>Leave fields empty if you don't want to change your password.</span>
                </div>
                <div className="form-group">
                  <label className="form-label">Current Password</label>
                  <input type="password" className="form-control" placeholder="Enter current password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <input type="password" className="form-control" placeholder="Enter new password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                </div>
              </>
            )}

            <div style={{ marginTop: '1.5rem' }}>
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', padding: '0.85rem' }}>
                {loading ? <span className="spinner" /> : (
                  <>
                    <Save size={18} />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
