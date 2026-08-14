import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  History, 
  Search, 
  RotateCw, 
  Eye, 
  AlertCircle, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight,
  X,
  FileText,
  MailCheck,
  MailX
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

export default function EmailHistoryPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Selected Log Modal
  const [viewLog, setViewLog] = useState(null);
  const [retryingId, setRetryingId] = useState(null);

  const { showSuccess, showError } = useToast();

  useEffect(() => {
    fetchLogs();
  }, [page, search, statusFilter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/emails/history', {
        params: {
          page,
          limit: 10,
          search,
          status: statusFilter
        }
      });
      if (res.data.success) {
        setLogs(res.data.logs);
        setTotal(res.data.total);
        setTotalPages(res.data.totalPages);
      }
    } catch (err) {
      showError('Failed to fetch email logs history.');
    } finally {
      setLoading(false);
    }
  };

  const handleRetryFailed = async (logId) => {
    setRetryingId(logId);
    try {
      const res = await axios.post(`/api/emails/retry/${logId}`);
      if (res.data.success) {
        showSuccess(res.data.message);
        fetchLogs();
        if (viewLog && viewLog.id === logId) {
          setViewLog(null);
        }
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Retry failed.');
    } finally {
      setRetryingId(null);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <History size={28} style={{ color: 'var(--primary-600)' }} />
            Email History & Delivery Logs
          </h1>
          <p className="page-subtitle">Track email delivery status, inspect error tracebacks & retry failed dispatches</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="filter-toolbar">
        <div className="search-input-wrapper">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            className="form-control"
            placeholder="Search candidate name, recipient email, subject..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        <div className="filter-group">
          <select
            className="form-select"
            style={{ width: '180px' }}
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Delivery Statuses</option>
            <option value="Sent">Sent</option>
            <option value="Failed">Failed</option>
            <option value="Pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="table-container">
        {loading ? (
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[...Array(5)].map((_, i) => (
              <div key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '0.75rem 0' }}>
                <div className="skeleton" style={{ width: '40px', height: '16px', borderRadius: '4px' }} />
                <div className="skeleton" style={{ width: '160px', height: '16px', borderRadius: '4px' }} />
                <div className="skeleton" style={{ width: '200px', height: '16px', borderRadius: '4px' }} />
                <div className="skeleton" style={{ width: '100px', height: '16px', borderRadius: '4px' }} />
                <div className="skeleton" style={{ width: '60px', height: '22px', borderRadius: '99px' }} />
              </div>
            ))}
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Log ID</th>
                <th>Candidate & Email</th>
                <th>Subject</th>
                <th>Sent Date</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {logs.length > 0 ? (
                logs.map(log => (
                  <tr key={log.id}>
                    <td><span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>#{log.id}</span></td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{log.candidate_name || log.recipient_email}</div>
                      <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>{log.recipient_email}</div>
                    </td>
                    <td style={{ maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {log.subject}
                    </td>
                    <td>
                      <div style={{ fontSize: '0.825rem' }}>{log.sent_at || log.created_at}</div>
                    </td>
                    <td>
                      <span className={`badge badge-${log.status.toLowerCase()}`}>
                        {log.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        <button
                          className="btn btn-secondary btn-icon"
                          title="View Email Details"
                          onClick={() => setViewLog(log)}
                        >
                          <Eye size={16} />
                        </button>

                        {log.status === 'Failed' && (
                          <button
                            className="btn btn-secondary btn-icon"
                            title="Retry Email Sending"
                            onClick={() => handleRetryFailed(log.id)}
                            disabled={retryingId === log.id}
                            style={{ color: 'var(--amber-500)' }}
                          >
                            {retryingId === log.id ? <span className="spinner"></span> : <RotateCw size={16} />}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6">
                    <div className="empty-state">
                      <div className="empty-state-icon"><MailCheck size={26} style={{ color: 'var(--text-light)' }} /></div>
                      <div className="empty-state-title">No email logs found</div>
                      <div className="empty-state-desc">Try adjusting your search or send your first email campaign</div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        <div className="pagination">
          <div>Showing {logs.length} of {total} email logs</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              className="btn btn-secondary btn-sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft size={16} />
            </button>
            <span>Page {page} of {totalPages || 1}</span>
            <button
              className="btn btn-secondary btn-sm"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Log Details Modal */}
      {viewLog && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Email Log #{viewLog.id} Details</h3>
              <button className="modal-close-btn" onClick={() => setViewLog(null)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
                <div><strong>Recipient:</strong> {viewLog.recipient_email}</div>
                <div><strong>Candidate:</strong> {viewLog.candidate_name || 'N/A'}</div>
                <div><strong>Date Sent:</strong> {viewLog.sent_at || viewLog.created_at}</div>
                <div>
                  <strong>Status:</strong>{' '}
                  <span className={`badge badge-${viewLog.status.toLowerCase()}`}>
                    {viewLog.status}
                  </span>
                </div>
              </div>

              {viewLog.error_message && (
                <div className="info-banner info-banner-error" style={{ marginBottom: '1rem', borderRadius: 'var(--radius-md)' }}>
                  <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div><strong>Error:</strong> {viewLog.error_message}</div>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Subject</label>
                <input type="text" className="form-control" readOnly value={viewLog.subject} />
              </div>

              <div className="form-group">
                <label className="form-label">Body Content</label>
                <textarea className="form-control" rows="6" readOnly value={viewLog.body} />
              </div>
            </div>

            <div className="modal-footer">
              {viewLog.status === 'Failed' && (
                <button
                  className="btn btn-primary"
                  onClick={() => handleRetryFailed(viewLog.id)}
                  disabled={retryingId === viewLog.id}
                >
                  <RotateCw size={16} />
                  <span>Retry Sending Email</span>
                </button>
              )}
              <button className="btn btn-secondary" onClick={() => setViewLog(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
