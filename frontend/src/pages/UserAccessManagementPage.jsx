import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, 
  ShieldCheck, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Trash2, 
  ShieldAlert, 
  UserPlus, 
  UserCheck, 
  Mail, 
  Lock,
  RefreshCw,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function UserAccessManagementPage() {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedUserForApproval, setSelectedUserForApproval] = useState(null);
  const [assignedRole, setAssignedRole] = useState('hr_recruiter');
  const [actionLoading, setActionLoading] = useState(false);

  const isAdmin = user && user.role === 'admin';

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/admin/users');
      if (res.data.success) {
        setUsers(res.data.users);
        setStats(res.data.stats);
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to fetch user access requests.');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUserForApproval) return;

    setActionLoading(true);
    try {
      const res = await axios.put(`/api/admin/users/${selectedUserForApproval.id}/approve`, {
        role: assignedRole
      });
      if (res.data.success) {
        showSuccess(res.data.message, 'Access Approved');
        setSelectedUserForApproval(null);
        fetchUsers();
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Error approving user access.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (targetUser) => {
    if (!window.confirm(`Decline access request for ${targetUser.name} (${targetUser.email})?`)) return;

    try {
      const res = await axios.put(`/api/admin/users/${targetUser.id}/reject`);
      if (res.data.success) {
        showSuccess(res.data.message, 'Access Declined');
        fetchUsers();
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Error declining access request.');
    }
  };

  const handleDelete = async (targetUser) => {
    if (!window.confirm(`Delete user account ${targetUser.name}? This action is permanent.`)) return;

    try {
      const res = await axios.delete(`/api/admin/users/${targetUser.id}`);
      if (res.data.success) {
        showSuccess(res.data.message, 'User Deleted');
        fetchUsers();
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Error deleting user.');
    }
  };

  // If Non-Admin, block access cleanly!
  if (!isAdmin) {
    return (
      <div style={{ padding: '3rem 1.5rem', display: 'flex', justifyContent: 'center' }}>
        <div className="glass-card" style={{ maxWidth: '520px', textAlign: 'center', padding: '2.5rem 2rem', borderColor: 'var(--rose-300)' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'var(--rose-100)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.25rem'
          }}>
            <ShieldAlert size={32} color="var(--rose-600)" />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--rose-900)', marginBottom: '0.5rem' }}>
            Access Restricted (403 Forbidden)
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            User Access & Role Assignment Studio is strictly reserved for <strong>System Administrators</strong>.
          </p>
          <div style={{ fontSize: '0.8rem', padding: '0.65rem', borderRadius: '8px', background: 'var(--bg-app)', color: 'var(--text-muted)' }}>
            Current Logged-in User Role: <strong>{user?.role || 'Guest'}</strong>
          </div>
        </div>
      </div>
    );
  }

  const pendingUsers = users.filter(u => u.status === 'pending');
  const activeUsers = users.filter(u => u.status === 'approved' || u.status === 'rejected');

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <UserCheck size={28} style={{ color: 'var(--primary-600)' }} />
            User Access & Role Management Studio
          </h1>
          <p className="page-subtitle">Review access requests, assign HR roles, and authorize system permissions</p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <span className="badge badge-selected" style={{ padding: '0.5rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Lock size={14} />
            <span>Admin Control Panel</span>
          </span>
          <button className="btn btn-secondary btn-sm" onClick={fetchUsers} disabled={loading}>
            <RefreshCw size={16} />
            <span>Refresh Requests</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card stat-warning">
          <div className="stat-icon-wrapper"><Clock size={22} /></div>
          <div className="stat-info">
            <span className="stat-value">{stats.pending}</span>
            <span className="stat-label">Pending Approval</span>
          </div>
        </div>

        <div className="stat-card stat-success">
          <div className="stat-icon-wrapper"><CheckCircle size={22} /></div>
          <div className="stat-info">
            <span className="stat-value">{stats.approved}</span>
            <span className="stat-label">Approved Active Users</span>
          </div>
        </div>

        <div className="stat-card stat-danger">
          <div className="stat-icon-wrapper"><XCircle size={22} /></div>
          <div className="stat-info">
            <span className="stat-value">{stats.rejected}</span>
            <span className="stat-label">Declined Requests</span>
          </div>
        </div>

        <div className="stat-card stat-primary">
          <div className="stat-icon-wrapper"><Users size={22} /></div>
          <div className="stat-info">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total User Accounts</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="tab-list">
          <button type="button" className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveTab('pending')} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Clock size={16} />
            <span>Pending Requests</span>
            {stats.pending > 0 && (
              <span style={{ background: 'var(--amber-500)', color: '#fff', fontSize: '0.7rem', padding: '0.1rem 0.45rem', borderRadius: '10px', fontWeight: 700, lineHeight: 1.3 }}>
                {stats.pending}
              </span>
            )}
          </button>

          <button type="button" className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`} onClick={() => setActiveTab('active')} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <ShieldCheck size={16} />
            <span>System Users & Roles ({stats.approved})</span>
          </button>
        </div>

      {/* Tab Content 1: Pending Access Requests */}
      {activeTab === 'pending' && (
        <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[...Array(3)].map((_, i) => (
                <div key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '0.85rem 1.15rem', borderBottom: '1px solid var(--border-light)' }}>
                  <div className="skeleton" style={{ width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0 }} />
                  <div className="skeleton" style={{ width: '150px', height: '16px', borderRadius: '4px' }} />
                  <div className="skeleton" style={{ width: '180px', height: '16px', borderRadius: '4px' }} />
                  <div className="skeleton" style={{ width: '80px', height: '22px', borderRadius: '99px', marginLeft: 'auto' }} />
                </div>
              ))}
            </div>
          ) : pendingUsers.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><CheckCircle size={26} style={{ color: 'var(--emerald-500)' }} /></div>
              <div className="empty-state-title">No Pending Access Requests</div>
              <div className="empty-state-desc">All registration requests have been reviewed.</div>
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>User Details</th>
                    <th>Email Address</th>
                    <th>Request Timestamp</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingUsers.map(u => (
                    <tr key={u.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            background: 'var(--warning-100)',
                            color: 'var(--warning-700)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700
                          }}>
                            {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700 }}>{u.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID #{u.id}</div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Mail size={14} color="var(--text-muted)" />
                          <span>{u.email}</span>
                        </div>
                      </td>

                      <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {u.created_at ? new Date(u.created_at).toLocaleString() : 'Recent'}
                      </td>

                      <td>
                        <span className="badge badge-pending">
                          Pending Approval
                        </span>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => {
                              setSelectedUserForApproval(u);
                              setAssignedRole('hr_recruiter');
                            }}
                          >
                            <UserCheck size={16} />
                            <span>Approve & Assign Role</span>
                          </button>

                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleReject(u)}
                            style={{ color: 'var(--rose-600)', borderColor: 'var(--rose-200)' }}
                          >
                            <XCircle size={16} />
                            <span>Decline</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab Content 2: Active System Users & Roles */}
      {activeTab === 'active' && (
        <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[...Array(4)].map((_, i) => (
                <div key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '0.85rem 1.15rem', borderBottom: '1px solid var(--border-light)' }}>
                  <div className="skeleton" style={{ width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0 }} />
                  <div className="skeleton" style={{ width: '150px', height: '16px', borderRadius: '4px' }} />
                  <div className="skeleton" style={{ width: '160px', height: '16px', borderRadius: '4px' }} />
                  <div className="skeleton" style={{ width: '80px', height: '22px', borderRadius: '99px' }} />
                  <div className="skeleton" style={{ width: '80px', height: '22px', borderRadius: '99px' }} />
                </div>
              ))}
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>User Profile</th>
                    <th>Email Address</th>
                    <th>Assigned System Role</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Management</th>
                  </tr>
                </thead>
                <tbody>
                  {activeUsers.map(u => (
                    <tr key={u.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            background: u.role === 'admin' ? 'var(--primary-600)' : 'var(--primary-100)',
                            color: u.role === 'admin' ? '#ffffff' : 'var(--primary-800)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700
                          }}>
                            {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700 }}>{u.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Registered ID #{u.id}</div>
                          </div>
                        </div>
                      </td>

                      <td>{u.email}</td>

                      <td>
                        <span className="badge" style={{
                          background: u.role === 'admin' ? 'var(--primary-100)' : 'var(--bg-app)',
                          color: u.role === 'admin' ? 'var(--primary-800)' : 'var(--text-main)',
                          border: u.role === 'admin' ? '1px solid var(--primary-300)' : '1px solid var(--border-color)',
                          fontWeight: 700
                        }}>
                          {u.role === 'admin' ? '👑 Administrator' : u.role === 'hr_manager' ? '💼 HR Manager' : u.role === 'hr_recruiter' ? '✉️ HR Recruiter' : '👤 Staff Member'}
                        </span>
                      </td>

                      <td>
                        <span className="badge" style={{
                          background: u.status === 'approved' ? 'var(--success-100)' : 'var(--rose-100)',
                          color: u.status === 'approved' ? 'var(--success-700)' : 'var(--rose-700)',
                          border: u.status === 'approved' ? '1px solid var(--success-300)' : '1px solid var(--rose-300)'
                        }}>
                          {u.status === 'approved' ? 'Active Approved' : 'Access Declined'}
                        </span>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        {u.email !== 'admin@hr.com' ? (
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => {
                                setSelectedUserForApproval(u);
                                setAssignedRole(u.role || 'hr_recruiter');
                              }}
                            >
                              Edit Role
                            </button>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleDelete(u)}
                              style={{ color: 'var(--rose-600)' }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Primary System Admin</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Approve & Assign Role Modal */}
      {selectedUserForApproval && (
        <div className="modal-overlay" onClick={() => setSelectedUserForApproval(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 className="modal-title">
                <ShieldCheck size={20} color="var(--primary-600)" />
                <span>Grant System Access & Role</span>
              </h3>
              <button className="modal-close-btn" onClick={() => setSelectedUserForApproval(null)}><X size={20} /></button>
            </div>

            <form onSubmit={handleApproveSubmit}>
              <div className="modal-body">
                <div style={{ padding: '1rem', borderRadius: '12px', background: 'var(--bg-app)', border: '1px solid var(--border-color)', marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>User Access Request:</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, marginTop: '0.2rem' }}>{selectedUserForApproval.name}</div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--primary-600)' }}>{selectedUserForApproval.email}</div>
                </div>

                <div className="form-group">
                  <label className="form-label">Assign HR System Role:</label>
                  <select
                    className="form-control"
                    value={assignedRole}
                    onChange={(e) => setAssignedRole(e.target.value)}
                    style={{ fontSize: '0.925rem', padding: '0.65rem' }}
                  >
                    <option value="hr_recruiter">✉️ HR Recruiter (Candidate CRUD & Email Dispatch)</option>
                    <option value="hr_manager">💼 HR Manager (Full Candidate & Document Generation Access)</option>
                    <option value="staff">👤 Staff Member (Read-Only HR Portal Access)</option>
                    <option value="admin">👑 Administrator (Full Master Control & Database Access)</option>
                  </select>
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', background: 'rgba(59, 130, 246, 0.08)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                  💡 <strong>Permissions Note:</strong> All roles will get access to HR resources except <strong>Database Explorer</strong> and <strong>Master Admin Control</strong>, which are strictly restricted to Administrators.
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedUserForApproval(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                  {actionLoading ? <span className="spinner"></span> : 'Confirm & Approve Access'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
