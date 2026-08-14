import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  FileSpreadsheet, 
  UploadCloud, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

export default function ImportCandidatesPage() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [parseData, setParseData] = useState(null);
  const [importing, setImporting] = useState(false);

  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  const handleDownloadTemplate = async () => {
    try {
      const response = await axios.get('/api/candidates/import/template', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Candidate_Import_Template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      showSuccess('Import template downloaded.');
    } catch (err) {
      showError('Failed to download template.');
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setParseData(null);
    }
  };

  const handlePreviewUpload = async () => {
    if (!file) {
      showError('Please select an Excel (.xlsx) or CSV file first.');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post('/api/candidates/import/preview', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        setParseData(res.data.data);
        showSuccess(res.data.message);
      }
    } catch (err) {
      showError(err.response?.data?.message || 'File parsing failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!parseData || !parseData.validRecords || parseData.validRecords.length === 0) {
      showError('No valid records to import.');
      return;
    }

    setImporting(true);
    try {
      const res = await axios.post('/api/candidates/import/confirm', {
        candidates: parseData.validRecords
      });
      if (res.data.success) {
        try {
          const existing = JSON.parse(localStorage.getItem('recruitify_candidate_backup') || '[]');
          const combined = [...existing, ...parseData.validRecords];
          localStorage.setItem('recruitify_candidate_backup', JSON.stringify(combined));
        } catch (e) {}
        showSuccess(res.data.message, 'Import Complete');
        navigate('/candidates');
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to import candidates.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <FileSpreadsheet size={26} style={{ color: 'var(--primary-600)' }} />
            Import Candidates from Excel
          </h1>
          <p className="page-subtitle">Batch upload candidates using Excel or CSV files with automated validation</p>
        </div>

        <button className="btn btn-secondary" onClick={handleDownloadTemplate}>
          <Download size={18} />
          <span>Download Excel Template</span>
        </button>
      </div>

      {/* Step Indicator */}
      <div className="step-indicator" style={{ marginBottom: '2rem' }}>
        <div className="step-item">
          <div className={`step-circle ${file ? 'done' : 'active'}`}>{file ? '✓' : '1'}</div>
          <div style={{ marginLeft: '0.5rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Select File</div>
          <div className="step-line" />
        </div>
        <div className="step-item">
          <div className={`step-circle ${parseData ? 'done' : ''}`}>{parseData ? '✓' : '2'}</div>
          <div style={{ marginLeft: '0.5rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Validate</div>
          <div className="step-line" />
        </div>
        <div className="step-item" style={{ flex: 0 }}>
          <div className="step-circle">3</div>
          <div style={{ marginLeft: '0.5rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Import</div>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <label
          htmlFor="excelFileInput"
          style={{
            border: `2px dashed ${file ? 'var(--emerald-500)' : 'var(--border-color)'}`,
            borderRadius: 'var(--radius-lg)',
            padding: '3rem 2rem',
            textAlign: 'center',
            background: file ? 'rgba(16, 185, 129, 0.04)' : 'var(--bg-app)',
            cursor: 'pointer',
            display: 'block',
            transition: 'all 0.2s ease'
          }}
        >
          <div style={{
            width: '64px', height: '64px', borderRadius: 'var(--radius-lg)',
            background: file ? 'rgba(16,185,129,0.1)' : 'rgba(59,130,246,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.25rem'
          }}>
            <UploadCloud size={32} style={{ color: file ? 'var(--emerald-500)' : 'var(--primary-500)' }} />
          </div>

          {file ? (
            <div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--emerald-600)', marginBottom: '0.35rem' }}>
                {file.name}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {(file.size / 1024).toFixed(1)} KB — Click to change file
              </div>
            </div>
          ) : (
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem' }}>Drop your file here or click to browse</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Supported: .xlsx, .xls, .csv (Max 10MB)</p>
            </div>
          )}

          <input
            type="file"
            id="excelFileInput"
            accept=".xlsx, .xls, .csv"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </label>

        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            className="btn btn-primary"
            disabled={!file || uploading}
            onClick={handlePreviewUpload}
          >
            {uploading ? <span className="spinner"></span> : (
              <>
                <RefreshCw size={18} />
                <span>Upload & Validate File</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Validation Result Preview Section */}
      {parseData && (
        <div className="glass-card" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Data Validation Results</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                Processed {parseData.totalRows} total rows: <strong style={{ color: 'var(--emerald-600)' }}>{parseData.validCount} Valid</strong>, <strong style={{ color: 'var(--rose-500)' }}>{parseData.invalidCount} Invalid/Duplicate</strong>
              </p>
            </div>

            <button
              className="btn btn-success"
              disabled={parseData.validCount === 0 || importing}
              onClick={handleConfirmImport}
            >
              {importing ? <span className="spinner"></span> : (
                <>
                  <CheckCircle2 size={18} />
                  <span>Confirm & Import {parseData.validCount} Candidates</span>
                </>
              )}
            </button>
          </div>

          {/* Invalid Records Warning Accordion */}
          {parseData.invalidRecords && parseData.invalidRecords.length > 0 && (
            <div style={{
              padding: '1.25rem',
              borderRadius: 'var(--radius-md)',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              marginBottom: '1.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#991b1b', fontWeight: 700, marginBottom: '0.75rem' }}>
                <AlertTriangle size={20} />
                <span>{parseData.invalidCount} Rows Skipped (Validation / Duplicate Errors)</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto' }}>
                {parseData.invalidRecords.map((inv, idx) => (
                  <div key={idx} style={{ fontSize: '0.825rem', color: '#7f1d1d', background: '#ffffff', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>
                    <strong>Row {inv.rowNumber}:</strong> Candidate "{inv.candidate?.full_name || 'N/A'}" ({inv.candidate?.email || 'No email'}) — {inv.errors.join(', ')}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Valid Records Preview Table */}
          <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.85rem' }}>Valid Records Ready for Import</h4>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Candidate ID</th>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Position</th>
                  <th>Department</th>
                  <th>Joining Date</th>
                  <th>Salary</th>
                </tr>
              </thead>
              <tbody>
                {parseData.validRecords.map((rec, i) => (
                  <tr key={i}>
                    <td><span style={{ fontWeight: 700, color: 'var(--primary-600)' }}>{rec.candidate_id}</span></td>
                    <td>{rec.full_name}</td>
                    <td>{rec.email}</td>
                    <td>{rec.job_position}</td>
                    <td>{rec.department}</td>
                    <td>{rec.joining_date}</td>
                    <td>{rec.salary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
