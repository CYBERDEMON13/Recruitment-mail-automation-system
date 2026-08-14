import React, { useEffect, useState, useRef } from 'react';
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
  PieChart,
  FileText,
  Mail,
  TrendingUp,
  Zap,
  Sparkles
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

// Animated number counter hook
function useCountUp(target, duration = 900) {
  const [count, setCount] = useState(0);
  const animRef = useRef();
  useEffect(() => {
    if (!target) { setCount(0); return; }
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [target, duration]);
  return count;
}

// Skeleton loading grid
function StatCardsSkeleton() {
  return (
    <div className="stats-grid">
      {[...Array(7)].map((_, i) => (
        <div key={i} className="skeleton-stat-card">
          <div className="skeleton skeleton-circle" />
          <div style={{ flex: 1 }}>
            <div className="skeleton skeleton-title" style={{ marginBottom: '0.5rem', width: '40%' }} />
            <div className="skeleton skeleton-text" style={{ width: '70%' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function AnimatedStatCard({ value, label, icon: Icon, variant }) {
  const count = useCountUp(value);
  return (
    <div className={`stat-card stat-${variant}`}>
      <div className="stat-icon-wrapper">
        <Icon size={22} />
      </div>
      <div className="stat-info">
        <span className="stat-value" style={{ animation: 'countUp 0.4s ease forwards' }}>{count}</span>
        <span className="stat-label">{label}</span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showError } = useToast();
  const { user } = useAuth();

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

  const { stats, recentCandidates, recentLogs, departmentBreakdown } = data || {};

  const maxDeptCount = departmentBreakdown?.length
    ? Math.max(...departmentBreakdown.map(d => d.count))
    : 1;

  const deptColors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#f97316'];

  return (
    <div>
      {/* Welcome Banner */}
      <div className="welcome-banner">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <Sparkles size={18} />
            <span style={{ fontSize: '0.8rem', fontWeight: 600, opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              HR Automation Portal
            </span>
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-heading)', marginBottom: '0.3rem' }}>
            Welcome back, {user?.name?.split(' ')[0] || 'Admin'} 👋
          </h2>
          <p style={{ fontSize: '0.875rem', opacity: 0.75 }}>
            Here's your recruitment pipeline at a glance.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', position: 'relative', zIndex: 1 }}>
          <Link to="/import-candidates" className="btn btn-secondary" style={{ background: 'rgba(255,255,255,0.12)', borderColor: 'rgba(255,255,255,0.2)', color: '#fff' }}>
            <FileSpreadsheet size={16} />
            <span>Import Excel</span>
          </Link>
          <Link to="/candidates" className="btn" style={{ background: '#ffffff', color: '#1d4ed8', fontWeight: 700, borderColor: 'transparent' }}>
            <Plus size={16} />
            <span>Add Candidate</span>
          </Link>
        </div>
      </div>

      {/* Page Title */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <BarChart3 size={26} style={{ color: 'var(--primary-600)' }} />
            Recruitment Dashboard
          </h1>
          <p className="page-subtitle">Real-time candidate metrics, email delivery performance & active pipelines</p>
        </div>
      </div>

      {/* Stat Cards */}
      {loading ? (
        <StatCardsSkeleton />
      ) : (
        <div className="stats-grid">
          <AnimatedStatCard value={stats?.totalCandidates || 0} label="Total Candidates" icon={Users} variant="primary" />
          <AnimatedStatCard value={stats?.selectedCandidates || 0} label="Selected" icon={UserCheck} variant="success" />
          <AnimatedStatCard value={stats?.pendingCandidates || 0} label="Pending Review" icon={Clock} variant="warning" />
          <AnimatedStatCard value={stats?.rejectedCandidates || 0} label="Rejected" icon={UserX} variant="danger" />
          <AnimatedStatCard value={stats?.emailsSent || 0} label="Emails Sent" icon={MailCheck} variant="purple" />
          <AnimatedStatCard value={stats?.emailsPending || 0} label="Emails Pending" icon={Send} variant="warning" />
          <AnimatedStatCard value={stats?.emailsFailed || 0} label="Emails Failed" icon={MailWarning} variant="danger" />
        </div>
      )}

      {/* Quick Actions */}
      {!loading && (
        <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Zap size={18} color="var(--primary-600)" />
            Quick Actions
          </h3>
          <div className="quick-actions-grid">
            <Link to="/candidates" className="quick-action-card">
              <div className="quick-action-icon"><Users size={18} color="var(--primary-600)" /></div>
              <span>Manage Candidates</span>
            </Link>
            <Link to="/composer" className="quick-action-card">
              <div className="quick-action-icon"><Send size={18} color="var(--purple-500)" /></div>
              <span>Compose Email</span>
            </Link>
            <Link to="/templates" className="quick-action-card">
              <div className="quick-action-icon"><Mail size={18} color="var(--emerald-600)" /></div>
              <span>Email Templates</span>
            </Link>
            <Link to="/documents" className="quick-action-card">
              <div className="quick-action-icon"><FileText size={18} color="var(--amber-500)" /></div>
              <span>Generate Docs</span>
            </Link>
            <Link to="/import-candidates" className="quick-action-card">
              <div className="quick-action-icon"><FileSpreadsheet size={18} color="var(--cyan-500)" /></div>
              <span>Import Excel</span>
            </Link>
            <Link to="/email-history" className="quick-action-card">
              <div className="quick-action-icon"><TrendingUp size={18} color="var(--rose-500)" /></div>
              <span>Email History</span>
            </Link>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      {!loading && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>

            {/* Recent Candidates Card */}
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Users size={18} color="var(--primary-600)" />
                  Recently Added Candidates
                </h3>
                <Link to="/candidates" style={{ color: 'var(--primary-600)', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                  <span>View All</span>
                  <ArrowRight size={14} />
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
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                              <div style={{
                                width: '30px', height: '30px', borderRadius: '50%',
                                background: 'linear-gradient(135deg, var(--primary-500), var(--purple-500))',
                                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: 700, fontSize: '0.75rem', flexShrink: 0
                              }}>
                                {c.full_name?.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{c.full_name}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.email}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ fontSize: '0.85rem' }}>{c.job_position}</td>
                          <td>
                            <span className={`badge badge-${c.application_status.toLowerCase().replace(/\s+/g, '-')}`}>
                              {c.application_status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3">
                          <div className="empty-state" style={{ padding: '2.5rem 1rem' }}>
                            <div className="empty-state-icon"><Users size={24} style={{ color: 'var(--text-light)' }} /></div>
                            <div className="empty-state-title">No candidates yet</div>
                            <div className="empty-state-desc">Add your first candidate to get started</div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Email Logs */}
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MailCheck size={18} color="var(--emerald-600)" />
                  Recent Email Activity
                </h3>
                <Link to="/email-history" style={{ color: 'var(--primary-600)', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                  <span>Logs History</span>
                  <ArrowRight size={14} />
                </Link>
              </div>

              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Recipient</th>
                      <th>Subject</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentLogs && recentLogs.length > 0 ? (
                      recentLogs.map(log => (
                        <tr key={log.id}>
                          <td>
                            <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{log.candidate_name || log.recipient_email}</div>
                            <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>{log.recipient_email}</div>
                          </td>
                          <td style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
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
                        <td colSpan="3">
                          <div className="empty-state" style={{ padding: '2.5rem 1rem' }}>
                            <div className="empty-state-icon"><MailCheck size={24} style={{ color: 'var(--text-light)' }} /></div>
                            <div className="empty-state-title">No email logs yet</div>
                            <div className="empty-state-desc">Email activity will appear here after sending</div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Department Distribution */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <PieChart size={18} color="var(--primary-600)" />
              Department Candidate Distribution
            </h3>

            {departmentBreakdown && departmentBreakdown.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                {departmentBreakdown.map((dept, index) => {
                  const pct = Math.round((dept.count / maxDeptCount) * 100);
                  const color = deptColors[index % deptColors.length];
                  return (
                    <div key={index} style={{
                      padding: '1rem 1.15rem',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-app)',
                      border: '1px solid var(--border-color)',
                      borderLeft: `4px solid ${color}`,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{dept.department}</div>
                          <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '2px' }}>Candidates</div>
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color, fontFamily: 'var(--font-heading)' }}>
                          {dept.count}
                        </div>
                      </div>
                      <div className="progress-bar-wrapper">
                        <div className="progress-bar-fill" style={{ width: `${pct}%`, background: color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state" style={{ padding: '2rem' }}>
                <div className="empty-state-icon"><PieChart size={24} style={{ color: 'var(--text-light)' }} /></div>
                <div className="empty-state-title">No department data</div>
                <div className="empty-state-desc">Department breakdown will appear after adding candidates</div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
