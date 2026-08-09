import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Clock, 
  MailCheck, 
  MailWarning, 
  Send, 
  Plus, 
  FileSpreadsheet, 
  ArrowRight,
  BarChart3,
  PieChart
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showError } = useToast();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await axios.get('/api/dashboard/stats');
      if (res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      showError('Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', borderColor: 'var(--primary-500)', borderTopColor: 'transparent' }}></div>
      </div>
    );
  }

  const { stats, recentCandidates, recentLogs, departmentBreakdown } = data || {};

  return (
    <div>
      {/* Page Title & Action Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <BarChart3 size={28} style={{ color: 'var(--primary-600)' }} />
            Recruitment Dashboard
          </h1>
          <p className="page-subtitle">Real-time candidate metrics, email delivery performance & active pipelines</p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to="/import-candidates" className="btn btn-secondary">
            <FileSpreadsheet size={18} />
            <span>Import Excel</span>
          </Link>
          <Link to="/candidates" className="btn btn-primary">
            <Plus size={18} />
            <span>Add Candidate</span>
          </Link>
        </div>
      </div>

      {/* Top 7 Stat Cards Grid */}
      <div className="stats-grid">
        <div className="stat-card stat-primary">
          <div className="stat-icon-wrapper"><Users /></div>
          <div className="stat-info">
            <span className="stat-value">{stats?.totalCandidates || 0}</span>
            <span className="stat-label">Total Candidates</span>
          </div>
        </div>

        <div className="stat-card stat-success">
          <div className="stat-icon-wrapper"><UserCheck /></div>
          <div className="stat-info">
            <span className="stat-value">{stats?.selectedCandidates || 0}</span>
            <span className="stat-label">Selected</span>
          </div>
        </div>

        <div className="stat-card stat-warning">
          <div className="stat-icon-wrapper"><Clock /></div>
          <div className="stat-info">
            <span className="stat-value">{stats?.pendingCandidates || 0}</span>
            <span className="stat-label">Pending</span>
          </div>
        </div>

        <div className="stat-card stat-danger">
          <div className="stat-icon-wrapper"><UserX /></div>
          <div className="stat-info">
            <span className="stat-value">{stats?.rejectedCandidates || 0}</span>
            <span className="stat-label">Rejected</span>
          </div>
        </div>

        <div className="stat-card stat-purple">
          <div className="stat-icon-wrapper"><MailCheck /></div>
          <div className="stat-info">
            <span className="stat-value">{stats?.emailsSent || 0}</span>
            <span className="stat-label">Emails Sent</span>
          </div>
        </div>

        <div className="stat-card stat-warning">
          <div className="stat-icon-wrapper"><Send /></div>
          <div className="stat-info">
            <span className="stat-value">{stats?.emailsPending || 0}</span>
            <span className="stat-label">Emails Pending</span>
          </div>
        </div>

        <div className="stat-card stat-danger">
          <div className="stat-icon-wrapper"><MailWarning /></div>
          <div className="stat-info">
            <span className="stat-value">{stats?.emailsFailed || 0}</span>
            <span className="stat-label">Emails Failed</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Tables & Analytics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        
        {/* Recent Candidates Card */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Recently Added Candidates</h3>
            <Link to="/candidates" style={{ color: 'var(--primary-600)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span>View All</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Position</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentCandidates && recentCandidates.length > 0 ? (
                  recentCandidates.map(c => (
                    <tr key={c.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{c.full_name}</div>
                        <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>{c.email}</div>
                      </td>
                      <td>{c.job_position}</td>
                      <td>
                        <span className={`badge badge-${c.application_status.toLowerCase().replace(/\s+/g, '-')}`}>
                          {c.application_status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                      No candidates added yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Email Logs Activity */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Recent Email Automation Activity</h3>
            <Link to="/email-history" style={{ color: 'var(--primary-600)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span>Logs History</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Recipient</th>
                  <th>Subject</th>
                  <th>Delivery Status</th>
                </tr>
              </thead>
              <tbody>
                {recentLogs && recentLogs.length > 0 ? (
                  recentLogs.map(log => (
                    <tr key={log.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{log.candidate_name || log.recipient_email}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{log.recipient_email}</div>
                      </td>
                      <td style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {log.subject}
                      </td>
                      <td>
                        <span className={`badge badge-${log.status.toLowerCase()}`}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                      No email delivery logs recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Department Distribution Visualization */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <PieChart size={20} color="var(--primary-600)" />
          <span>Department Candidate Distribution</span>
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
          {departmentBreakdown && departmentBreakdown.length > 0 ? (
            departmentBreakdown.map((dept, index) => (
              <div key={index} style={{
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-app)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{dept.department}</div>
                  <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>Candidates</div>
                </div>
                <div style={{
                  fontSize: '1.4rem',
                  fontWeight: 800,
                  color: 'var(--primary-600)',
                  fontFamily: 'var(--font-heading)'
                }}>
                  {dept.count}
                </div>
              </div>
            ))
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No department statistics available.</div>
          )}
        </div>
      </div>
    </div>
  );
}
