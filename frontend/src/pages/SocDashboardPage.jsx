import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Shield,
  ShieldCheck,
  AlertTriangle,
  Lock,
  Activity,
  UserCheck,
  Clock,
  Download,
  Filter,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  FileCode,
  Terminal,
  KeyRound
} from 'lucide-react';

export default function SocDashboardPage() {
  const { user } = useAuth();
  const { showError, showSuccess } = useToast();

  const [overview, setOverview] = useState(null);
  const [logs, setLogs] = useState([]);
  const [actionTypes, setActionTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [search, setSearch] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Verify Admin Role
  const isAdmin = user && user.role === 'admin';

  useEffect(() => {
    if (isAdmin) {
      fetchSocOverview();
      fetchSocLogs();
    }
  }, [isAdmin, page, selectedSeverity, selectedAction]);

  const fetchSocOverview = async () => {
    try {
      const res = await axios.get('/api/admin/soc/overview');
      if (res.data.success) {
        setOverview(res.data.overview);
      }
    } catch (err) {
      showError('Failed to fetch SOC overview metrics.');
    }
  };

  const fetchSocLogs = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/admin/soc/logs', {
        params: {
          search,
          severity: selectedSeverity,
          action: selectedAction,
          page,
          limit: 25
        }
      });
      if (res.data.success) {
        setLogs(res.data.logs);
        setTotalPages(res.data.totalPages || 1);
        setActionTypes(res.data.actionTypes || []);
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to load audit logs.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchSocLogs();
  };

  const handleExport = (format) => {
    window.open(`/api/admin/soc/export?format=${format}`, '_blank');
    showSuccess(`Downloading SOC audit logs export (${format.toUpperCase()})...`);
  };

  if (!isAdmin) {
    return (
      <div style={{ padding: '3rem 1.5rem', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
        <div className="glass-card" style={{ padding: '3rem 2rem', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
          <Shield size={64} style={{ color: 'var(--rose-500)', marginBottom: '1rem' }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--rose-600)', marginBottom: '0.5rem' }}>
            403 ACCESS DENIED
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
            The Centralized Security Operations Center (SOC) & Audit Activity Dashboard is restricted exclusively to authorized HR Administrators.
          </p>
          <div style={{ fontSize: '0.8rem', background: '#fef2f2', color: '#991b1b', padding: '0.75rem', borderRadius: '0.5rem' }}>
            Security Note: This unauthorized access attempt has been logged for compliance monitoring.
          </div>
        </div>
      </div>
    );
  }

  const getSeverityBadge = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'security':
      case 'danger':
        return (
          <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <AlertTriangle size={12} /> SECURITY THREAT
          </span>
        );
      case 'warning':
        return (
          <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <Clock size={12} /> WARNING
          </span>
        );
      case 'info':
      default:
        return (
          <span className="badge badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <Activity size={12} /> INFO
          </span>
        );
    }
  };

  return (
    <div>
      {/* Top Banner Header */}
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h1 className="page-title" style={{ margin: 0 }}>
              <Shield size={32} style={{ color: '#2563eb' }} />
              Centralized SOC & Security Audit Operations Center
            </h1>
            <span
              style={{
                background: '#dcfce7',
                color: '#15803d',
                padding: '0.3rem 0.8rem',
                borderRadius: '1rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                border: '1px solid #bbf7d0'
              }}
            >
              <ShieldCheck size={14} /> SHIELDS ACTIVE — ALL SYSTEMS SECURE
            </span>
          </div>
          <p className="page-subtitle" style={{ marginTop: '0.35rem' }}>
            Real-time security monitoring, audit trail logs, threat inspection & role access verification (Admin Only)
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={() => { fetchSocOverview(); fetchSocLogs(); }}>
            <RefreshCw size={16} />
            <span>Refresh Stream</span>
          </button>
          <button className="btn btn-primary" onClick={() => handleExport('csv')}>
            <FileSpreadsheet size={16} />
            <span>Export CSV Trail</span>
          </button>
          <button className="btn btn-secondary" onClick={() => handleExport('json')}>
            <FileCode size={16} />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Overview Metric Cards Grid */}
      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(37, 99, 235, 0.1)', color: '#2563eb' }}>
            <Activity size={24} />
          </div>
          <div className="stat-value">{overview?.totalLogs || 0}</div>
          <div className="stat-label">Total System Audit Events</div>
          <div className="stat-meta" style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
            {overview?.todayLogs || 0} events logged today
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--rose-600)' }}>
            <AlertTriangle size={24} />
          </div>
          <div className="stat-value" style={{ color: overview?.securityAlerts > 0 ? 'var(--rose-600)' : 'inherit' }}>
            {overview?.securityAlerts || 0}
          </div>
          <div className="stat-label">Security Alerts & Threat Flags</div>
          <div className="stat-meta" style={{ color: 'var(--emerald-600)', fontSize: '0.75rem', fontWeight: 600 }}>
            {overview?.systemHealthStatus || 'OPTIMAL'}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--amber-600)' }}>
            <UserCheck size={24} />
          </div>
          <div className="stat-value">{overview?.pendingAccessRequests || 0}</div>
          <div className="stat-label">Pending User Access Requests</div>
          <div className="stat-meta" style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
            Requires Admin Review in User Management
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--emerald-600)' }}>
            <ShieldCheck size={24} />
          </div>
          <div className="stat-value">{overview?.activeAdmins || 0}</div>
          <div className="stat-label">Active Admin Accounts</div>
          <div className="stat-meta" style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
            {overview?.totalApprovedUsers || 0} total approved portal users
          </div>
        </div>
      </div>

      {/* Security Hardening Matrix Bar */}
      <div className="glass-card" style={{ padding: '1.25rem 1.5rem', marginBottom: '2rem', background: '#f8fafc' }}>
        <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#334155', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Lock size={16} style={{ color: '#2563eb' }} />
          SYSTEM SECURITY CONTROLS & HARDENING MATRIX
        </h4>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
          {overview?.hardeningFeatures?.map((f, idx) => (
            <div key={idx} style={{ background: '#ffffff', padding: '0.65rem 0.85rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={16} style={{ color: '#16a34a' }} />
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>{f.name}</div>
                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{f.status}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter & Live Activity Log Table */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Terminal size={20} style={{ color: '#2563eb' }} />
            Live Security & Audit Trail Activity Stream
          </h3>

          {/* Search & Filter Form */}
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-control"
                placeholder="Search Action, IP, Email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: '2.2rem', width: '220px' }}
              />
            </div>

            <select
              className="form-control"
              value={selectedSeverity}
              onChange={(e) => { setSelectedSeverity(e.target.value); setPage(1); }}
              style={{ width: '140px' }}
            >
              <option value="">All Severities</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="danger">Danger / Security</option>
            </select>

            <select
              className="form-control"
              value={selectedAction}
              onChange={(e) => { setSelectedAction(e.target.value); setPage(1); }}
              style={{ width: '180px' }}
            >
              <option value="">All Event Actions</option>
              {actionTypes.map((act) => (
                <option key={act} value={act}>{act}</option>
              ))}
            </select>

            <button type="submit" className="btn btn-secondary">Filter</button>
          </form>
        </div>

        {/* Logs Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div className="spinner" style={{ margin: '0 auto 1rem auto' }}></div>
            <p style={{ color: 'var(--text-muted)' }}>Loading real-time audit stream...</p>
          </div>
        ) : logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <ShieldCheck size={48} style={{ color: 'var(--emerald-500)', marginBottom: '1rem' }} />
            <p style={{ fontSize: '1rem', fontWeight: 600 }}>No security audit logs found matching criteria.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Severity</th>
                  <th>Action Event</th>
                  <th>User Email</th>
                  <th>IP Address</th>
                  <th>Details & Context</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} style={{ background: log.severity === 'danger' || log.severity === 'security' ? '#fef2f2' : 'inherit' }}>
                    <td style={{ fontSize: '0.75rem', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td>{getSeverityBadge(log.severity)}</td>
                    <td>
                      <code style={{ background: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: 700, color: '#0f172a' }}>
                        {log.action}
                      </code>
                    </td>
                    <td style={{ fontWeight: 600, fontSize: '0.85rem' }}>{log.user_email}</td>
                    <td style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{log.ip_address}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Page {page} of {totalPages}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn btn-secondary"
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <button
                className="btn btn-secondary"
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
