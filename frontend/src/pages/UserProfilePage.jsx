import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { User, Mail, Lock, Save, ShieldCheck } from 'lucide-react';

export default function UserProfilePage() {
  const { user, updateUser } = useAuth();
  const { showSuccess, showError } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.put('/api/auth/profile', {
        name,
        email,
        currentPassword,
        newPassword
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
            <User size={28} style={{ color: 'var(--primary-600)' }} />
            HR Admin User Profile
          </h1>
          <p className="page-subtitle">Manage your account information and change login credentials</p>
        </div>
      </div>

      <div style={{ maxWidth: '600px' }}>
        <div className="glass-card" style={{ padding: '2rem' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1.5rem',
              boxShadow: 'var(--shadow-md)'
            }}>
              {user?.name ? user.name.charAt(0).toUpperCase() : 'H'}
            </div>

            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{user?.name || 'HR Administrator'}</h3>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{user?.email}</div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--emerald-600)', marginTop: '0.25rem' }}>
                <ShieldCheck size={14} />
                <span>Authorized HR Administrator Role</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-control"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '1.5rem 0' }} />

            <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Change Password (Optional)</h4>

            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input
                type="password"
                className="form-control"
                placeholder="Required only to set a new password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">New Password</label>
              <input
                type="password"
                className="form-control"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div style={{ marginTop: '1.75rem' }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ width: '100%', padding: '0.85rem' }}
              >
                {loading ? <span className="spinner"></span> : (
                  <>
                    <Save size={18} />
                    <span>Update Account Details</span>
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
