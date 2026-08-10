import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  FileText, 
  Send, 
  Download, 
  X, 
  Check, 
  ChevronLeft, 
  ChevronRight,
  FileSpreadsheet,
  Award,
  RotateCcw
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

export default function CandidateManagementPage() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [viewFilter, setViewFilter] = useState('active'); // 'active', 'deleted', 'all'
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);

  // Selection
  const [selectedIds, setSelectedIds] = useState([]);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    candidate_id: '',
    full_name: '',
    email: '',
    phone: '',
    job_position: '',
    department: '',
    company_name: 'TechVision Global Inc.',
    joining_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    salary: '$90,000 / year',
    address: '',
    application_status: 'Pending'
  });

  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCandidates();
  }, [page, search, statusFilter, deptFilter, viewFilter]);

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/candidates', {
        params: {
          page,
          limit: 10,
          search,
          status: statusFilter,
          department: deptFilter,
          view: viewFilter
        }
      });

      if (res.data.success) {
        setCandidates(res.data.candidates);
        setTotal(res.data.total);
        setTotalPages(res.data.totalPages);
        setDepartments(res.data.departments || []);
        setPositions(res.data.positions || []);

        // Auto-sync protection: if client backup exists in browser localStorage, auto-restore missing records
        try {
          const saved = localStorage.getItem('recruitify_candidate_backup');
          if (saved) {
            const backupList = JSON.parse(saved);
            if (Array.isArray(backupList) && backupList.length > 0) {
              const currentEmails = new Set((res.data.candidates || []).map(c => String(c.email).toLowerCase()));
              const missingRecords = backupList.filter(b => b.email && !currentEmails.has(String(b.email).toLowerCase()));
              if (missingRecords.length > 0) {
                axios.post('/api/candidates/import/confirm', { candidates: missingRecords }).then(syncRes => {
                  if (syncRes.data.success && syncRes.data.importedCount > 0) {
                    fetchCandidates();
                  }
                }).catch(() => {});
              }
            }
          }
        } catch (e) {}

        if (res.data.total > 0) {
          try {
            const saved = JSON.parse(localStorage.getItem('recruitify_candidate_backup') || '[]');
            const emailSet = new Set(saved.map(s => String(s.email).toLowerCase()));
            const updatedBackup = [...saved];
            (res.data.candidates || []).forEach(c => {
              if (c.email && !emailSet.has(String(c.email).toLowerCase())) {
                updatedBackup.push(c);
              }
            });
            localStorage.setItem('recruitify_candidate_backup', JSON.stringify(updatedBackup));
          } catch (e) {}
        }
      }
    } catch (err) {
      showError('Failed to fetch candidates.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(candidates.map(c => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const openAddModal = () => {
    setFormData({
      candidate_id: `CAND-${Math.floor(1000 + Math.random() * 9000)}`,
      full_name: '',
      email: '',
      phone: '',
      job_position: '',
      department: '',
      company_name: 'TechVision Global Inc.',
      joining_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      salary: '$90,000 / year',
      address: '',
      application_status: 'Pending'
    });
    setEditingCandidate(null);
    setShowAddModal(true);
  };

  const openEditModal = (candidate) => {
    setEditingCandidate(candidate);
    setFormData({
      candidate_id: candidate.candidate_id,
      full_name: candidate.full_name,
      email: candidate.email,
      phone: candidate.phone || '',
      job_position: candidate.job_position,
      department: candidate.department,
      company_name: candidate.company_name,
      joining_date: candidate.joining_date,
      salary: candidate.salary,
      address: candidate.address || '',
      application_status: candidate.application_status
    });
    setShowAddModal(true);
  };

  const handleSaveCandidate = async (e) => {
    e.preventDefault();

    if (!formData.full_name || !formData.email || !formData.job_position || !formData.department || !formData.joining_date || !formData.salary) {
      showError('Please fill in all required candidate fields.');
      return;
    }

    try {
      if (editingCandidate) {
        const res = await axios.put(`/api/candidates/${editingCandidate.id}`, formData);
        if (res.data.success) {
          showSuccess(`Candidate ${formData.full_name} updated successfully.`);
        }
      } else {
        const res = await axios.post('/api/candidates', formData);
        if (res.data.success) {
          showSuccess(`Candidate ${formData.full_name} created successfully.`);
        }
      }
      setShowAddModal(false);
      fetchCandidates();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to save candidate.');
    }
  };

  const handleDeleteCandidate = async () => {
    if (!deletingId) return;
    try {
      const res = await axios.delete(`/api/candidates/${deletingId}`);
      if (res.data.success) {
        showSuccess('Candidate deleted successfully.');
        setDeletingId(null);
        fetchCandidates();
      }
    } catch (err) {
      showError('Failed to delete candidate.');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    try {
      const res = await axios.post('/api/candidates/bulk-delete', { candidateIds: selectedIds });
      if (res.data.success) {
        showSuccess(`Successfully moved ${res.data.deletedCount || selectedIds.length} candidate(s) to Trash.`);
        setSelectedIds([]);
        setShowBulkDeleteModal(false);
        fetchCandidates();
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Bulk delete failed.');
    }
  };

  const handleRestoreCandidate = async (id, name) => {
    try {
      const res = await axios.post(`/api/candidates/${id}/restore`);
      if (res.data.success) {
        showSuccess(`Candidate ${name || ''} restored successfully.`);
        fetchCandidates();
      }
    } catch (err) {
      showError('Failed to restore candidate.');
    }
  };

  const handleExport = async () => {
    try {
      const response = await axios.get('/api/candidates/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Candidates_Export_${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showSuccess('Candidates spreadsheet exported successfully.');
    } catch (err) {
      showError('Export failed.');
    }
  };

  const generatePDFOffer = async (candidateId) => {
    try {
      const res = await axios.post('/api/documents/generate-offer-letter', { candidate_id: candidateId });
      if (res.data.success) {
        showSuccess(res.data.message);
        // Automatically download generated PDF
        window.open(res.data.document.downloadUrl, '_blank');
        fetchCandidates();
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Offer letter generation failed.');
    }
  };

  const generatePDFCert = async (candidateId) => {
    try {
      const res = await axios.post('/api/documents/generate-certificate', { candidate_id: candidateId });
      if (res.data.success) {
        showSuccess(res.data.message);
        window.open(res.data.document.downloadUrl, '_blank');
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Certificate generation failed.');
    }
  };

  const proceedToEmailComposer = () => {
    if (selectedIds.length === 0) {
      showError('Please select at least one candidate.');
      return;
    }
    navigate('/composer', { state: { selectedCandidateIds: selectedIds } });
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Users size={28} style={{ color: 'var(--primary-600)' }} />
            Candidate Management
          </h1>
          <p className="page-subtitle">View, filter, manage candidate records & generate recruitment documents</p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {selectedIds.length > 0 && (
            <>
              <button className="btn btn-primary" onClick={proceedToEmailComposer}>
                <Send size={18} />
                <span>Send Email ({selectedIds.length})</span>
              </button>

              <button 
                className="btn btn-secondary" 
                onClick={() => setShowBulkDeleteModal(true)}
                style={{ color: '#ef4444', borderColor: '#fca5a5', background: 'rgba(239, 68, 68, 0.05)' }}
              >
                <Trash2 size={18} />
                <span>Delete Selected ({selectedIds.length})</span>
              </button>
            </>
          )}

          <button className="btn btn-secondary" onClick={handleExport}>
            <Download size={18} />
            <span>Export Excel</span>
          </button>

          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={18} />
            <span>Add Candidate</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="filter-toolbar">
        <div className="search-input-wrapper">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            className="form-control"
            placeholder="Search candidate name, email, ID, position..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        <div className="filter-group">
          <select 
            className="form-select" 
            style={{ width: '180px', fontWeight: 600, borderColor: viewFilter === 'deleted' ? '#fca5a5' : undefined }}
            value={viewFilter}
            onChange={(e) => { setViewFilter(e.target.value); setPage(1); }}
          >
            <option value="active">Active Candidates</option>
            <option value="deleted">Trash / Archived</option>
            <option value="all">All Records (Inc. Deleted)</option>
          </select>

          <select 
            className="form-select" 
            style={{ width: '170px' }}
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Application Statuses</option>
            <option value="Selected">Selected</option>
            <option value="Pending">Pending</option>
            <option value="On Hold">On Hold</option>
            <option value="Rejected">Rejected</option>
          </select>

          <select 
            className="form-select" 
            style={{ width: '170px' }}
            value={deptFilter}
            onChange={(e) => { setDeptFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Departments</option>
            {departments.map((d, i) => (
              <option key={i} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Candidate Data Table */}
      <div className="table-container">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <div className="spinner" style={{ borderColor: 'var(--primary-500)', borderTopColor: 'transparent', margin: '0 auto' }}></div>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>
                  <input
                    type="checkbox"
                    checked={candidates.length > 0 && selectedIds.length === candidates.length}
                    onChange={handleSelectAll}
                  />
                </th>
                <th>Candidate ID</th>
                <th>Full Name & Email</th>
                <th>Position & Department</th>
                <th>Joining & Salary</th>
                <th>App Status</th>
                <th>Offer PDF</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {candidates.length > 0 ? (
                candidates.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(c.id)}
                        onChange={() => handleSelectOne(c.id)}
                      />
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--primary-600)' }}>
                        {c.candidate_id}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{c.full_name}</div>
                      <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>{c.email} • {c.phone}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{c.job_position}</div>
                      <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>{c.department}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem' }}>{c.joining_date}</div>
                      <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>{c.salary}</div>
                    </td>
                    <td>
                      <span className={`badge badge-${c.application_status.toLowerCase().replace(/\s+/g, '-')}`}>
                        {c.application_status}
                      </span>
                      {c.is_deleted === 1 && (
                        <span className="badge" style={{ marginLeft: '0.35rem', background: '#fee2e2', color: '#991b1b', fontSize: '0.7rem' }}>
                          Trash (In DB)
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={`badge badge-${c.offer_letter_status.toLowerCase().replace(/\s+/g, '-')}`}>
                        {c.offer_letter_status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        <button
                          className="btn btn-secondary btn-icon"
                          title="Generate Offer Letter PDF"
                          onClick={() => generatePDFOffer(c.id)}
                        >
                          <FileText size={16} color="var(--primary-600)" />
                        </button>

                        <button
                          className="btn btn-secondary btn-icon"
                          title="Generate Certificate PDF"
                          onClick={() => generatePDFCert(c.id)}
                        >
                          <Award size={16} color="var(--amber-500)" />
                        </button>

                        <button
                          className="btn btn-secondary btn-icon"
                          title="Edit Candidate"
                          onClick={() => openEditModal(c)}
                        >
                          <Edit3 size={16} />
                        </button>

                        {c.is_deleted ? (
                          <button
                            className="btn btn-secondary btn-icon"
                            title="Restore Candidate (Preserved in DB)"
                            onClick={() => handleRestoreCandidate(c.id, c.full_name)}
                            style={{ color: '#10b981', borderColor: '#a7f3d0', background: 'rgba(16, 185, 129, 0.08)' }}
                          >
                            <RotateCcw size={16} />
                          </button>
                        ) : (
                          <button
                            className="btn btn-secondary btn-icon"
                            title="Move Candidate to Trash"
                            onClick={() => setDeletingId(c.id)}
                            style={{ color: '#ef4444' }}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No candidates found matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {/* Pagination Footer */}
        <div className="pagination">
          <div>Showing {candidates.length} of {total} candidates</div>
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

      {/* Add / Edit Candidate Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">{editingCandidate ? 'Edit Candidate Details' : 'Add New Candidate'}</h3>
              <button className="modal-close-btn" onClick={() => setShowAddModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveCandidate}>
              <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Candidate ID</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.candidate_id}
                    onChange={(e) => setFormData({ ...formData, candidate_id: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Full Name <span className="required">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. John Doe"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address <span className="required">*</span></label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="+1 555-0199"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Job Position <span className="required">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Software Engineer"
                    value={formData.job_position}
                    onChange={(e) => setFormData({ ...formData, job_position: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Department <span className="required">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Engineering"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Joining Date <span className="required">*</span></label>
                  <input
                    type="date"
                    className="form-control"
                    value={formData.joining_date}
                    onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Salary / Package <span className="required">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="$100,000 / year"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Application Status</label>
                  <select
                    className="form-select"
                    value={formData.application_status}
                    onChange={(e) => setFormData({ ...formData, application_status: e.target.value })}
                  >
                    <option value="Selected">Selected</option>
                    <option value="Pending">Pending</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Address</label>
                  <textarea
                    className="form-control"
                    rows="2"
                    placeholder="Candidate full address..."
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Candidate</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Confirm Deletion</h3>
              <button className="modal-close-btn" onClick={() => setDeletingId(null)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete this candidate record? This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeletingId(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDeleteCandidate}>Delete Candidate</button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Trash2 size={20} />
                Confirm Bulk Deletion
              </h3>
              <button className="modal-close-btn" onClick={() => setShowBulkDeleteModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to permanently delete <strong>{selectedIds.length} selected candidate record(s)</strong>?</p>
              <p style={{ fontSize: '0.835rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                This action will remove their profiles, document records, and email log history. This process cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowBulkDeleteModal(false)}>Cancel</button>
              <button className="btn btn-danger" style={{ background: '#ef4444', borderColor: '#ef4444', color: '#fff' }} onClick={handleBulkDelete}>
                Delete {selectedIds.length} Candidate(s)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
