import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FileText, 
  Award, 
  Download, 
  Eye, 
  Sparkles, 
  RefreshCw, 
  CheckCircle2, 
  User,
  ShieldAlert
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

export default function DocumentGeneratorPage() {
  const { user } = useAuth();
  const isReadOnly = user?.role === 'staff';
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState('');
  const [docType, setDocType] = useState('offer_letter');
  
  // Custom certificate fields
  const [certTitle, setCertTitle] = useState('CERTIFICATE OF SELECTION');
  const [certDate, setCertDate] = useState(new Date().toISOString().split('T')[0]);

  const [generating, setGenerating] = useState(false);
  const [generatedDoc, setGeneratedDoc] = useState(null);

  const { showSuccess, showError } = useToast();

  useEffect(() => {
    fetchCandidatesList();
  }, []);

  const fetchCandidatesList = async () => {
    try {
      const res = await axios.get('/api/candidates?limit=100');
      if (res.data.success) {
        setCandidates(res.data.candidates);
        if (res.data.candidates.length > 0) {
          setSelectedCandidateId(res.data.candidates[0].id);
        }
      }
    } catch (err) {
      showError('Failed to fetch candidate selection list.');
    }
  };

  const handleGenerateDoc = async (e) => {
    e.preventDefault();
    if (!selectedCandidateId) {
      showError('Please select a candidate first.');
      return;
    }

    setGenerating(true);
    setGeneratedDoc(null);

    try {
      if (docType === 'offer_letter') {
        const res = await axios.post('/api/documents/generate-offer-letter', {
          candidate_id: selectedCandidateId
        });
        if (res.data.success) {
          setGeneratedDoc(res.data.document);
          showSuccess(res.data.message);
        }
      } else {
        const res = await axios.post('/api/documents/generate-certificate', {
          candidate_id: selectedCandidateId,
          certificate_title: certTitle,
          date: certDate
        });
        if (res.data.success) {
          setGeneratedDoc(res.data.document);
          showSuccess(res.data.message);
        }
      }
    } catch (err) {
      showError(err.response?.data?.message || 'PDF Generation failed.');
    } finally {
      setGenerating(false);
    }
  };

  const currentCandidate = candidates.find(c => String(c.id) === String(selectedCandidateId));

  return (
    <div>
      {isReadOnly && (
        <div style={{
          background: 'rgba(59, 130, 246, 0.08)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: '8px',
          padding: '0.75rem 1rem',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          color: 'var(--text-main)',
          fontSize: '0.875rem'
        }}>
          <ShieldAlert size={20} style={{ color: '#3b82f6', flexShrink: 0 }} />
          <div>
            <strong>Staff Role (Read-Only Access):</strong> PDF Document generation for Offer Letters & Certificates is disabled for Staff role accounts.
          </div>
        </div>
      )}

      <div className="page-header">
        <div>
          <h1 className="page-title">
            <FileText size={28} style={{ color: 'var(--primary-600)' }} />
            Document Studio (PDF Generator)
          </h1>
          <p className="page-subtitle">Generate official Offer Letters & Certificates with candidate metadata</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.75rem' }}>
        
        {/* Controls Card */}
        <div className="glass-card" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={20} color="var(--primary-600)" />
            <span>Generator Settings</span>
          </h3>

          <form onSubmit={handleGenerateDoc}>
            {/* Candidate Selector */}
            <div className="form-group">
              <label className="form-label">Select Candidate <span className="required">*</span></label>
              <select
                className="form-select"
                value={selectedCandidateId}
                onChange={(e) => setSelectedCandidateId(e.target.value)}
              >
                {candidates.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.full_name} ({c.job_position} - {c.candidate_id})
                  </option>
                ))}
              </select>
            </div>

            {/* Document Type Selector */}
            <div className="form-group">
              <label className="form-label">Document Type</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setDocType('offer_letter')}
                  style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    border: docType === 'offer_letter' ? '2px solid var(--primary-500)' : '1.5px solid var(--border-color)',
                    background: docType === 'offer_letter' ? 'rgba(59,130,246,0.08)' : 'var(--bg-app)',
                    color: docType === 'offer_letter' ? 'var(--primary-700)' : 'var(--text-main)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s ease',
                    fontFamily: 'var(--font-body)'
                  }}
                >
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: docType === 'offer_letter' ? 'rgba(59,130,246,0.12)' : 'var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FileText size={20} color={docType === 'offer_letter' ? 'var(--primary-600)' : 'var(--text-muted)'} />
                  </div>
                  <span style={{ fontSize: '0.85rem' }}>Offer Letter</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDocType('certificate')}
                  style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    border: docType === 'certificate' ? '2px solid var(--amber-500)' : '1.5px solid var(--border-color)',
                    background: docType === 'certificate' ? 'rgba(245,158,11,0.08)' : 'var(--bg-app)',
                    color: docType === 'certificate' ? '#b45309' : 'var(--text-main)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s ease',
                    fontFamily: 'var(--font-body)'
                  }}
                >
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: docType === 'certificate' ? 'rgba(245,158,11,0.12)' : 'var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Award size={20} color={docType === 'certificate' ? 'var(--amber-500)' : 'var(--text-muted)'} />
                  </div>
                  <span style={{ fontSize: '0.85rem' }}>Certificate</span>
                </button>
              </div>
            </div>

            {/* Extra Certificate Fields */}
            {docType === 'certificate' && (
              <>
                <div className="form-group">
                  <label className="form-label">Certificate Title</label>
                  <input
                    type="text"
                    className="form-control"
                    value={certTitle}
                    onChange={(e) => setCertTitle(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Issue Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={certDate}
                    onChange={(e) => setCertDate(e.target.value)}
                  />
                </div>
              </>
            )}

            {/* Selected Candidate Metadata Card Preview */}
            {currentCandidate && (
              <div style={{
                padding: '1rem 1.15rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-app)',
                border: '1px solid var(--border-color)',
                borderLeft: '4px solid var(--primary-500)',
                marginBottom: '1.5rem',
                fontSize: '0.85rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.75rem' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary-500), var(--purple-500))', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>
                    {currentCandidate.full_name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{currentCandidate.full_name}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{currentCandidate.candidate_id}</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem 1rem' }}>
                  <div><span style={{ color: 'var(--text-muted)' }}>Position:</span> <strong>{currentCandidate.job_position}</strong></div>
                  <div><span style={{ color: 'var(--text-muted)' }}>Dept:</span> <strong>{currentCandidate.department}</strong></div>
                  <div><span style={{ color: 'var(--text-muted)' }}>Joining:</span> <strong>{currentCandidate.joining_date}</strong></div>
                  <div><span style={{ color: 'var(--text-muted)' }}>Salary:</span> <strong>{currentCandidate.salary}</strong></div>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={generating || !selectedCandidateId || isReadOnly}
              style={{ width: '100%', padding: '0.85rem' }}
            >
              {generating ? <span className="spinner"></span> : (
                <>
                  <RefreshCw size={18} />
                  <span>Generate PDF Document</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Live Preview / Output Result Card */}
        <div className="glass-card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem' }}>
            Generated Document Output
          </h3>

          {generatedDoc ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2rem' }}>
              <div style={{
                width: '72px', height: '72px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.1)',
                color: 'var(--emerald-500)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '1.25rem',
                border: '2px solid rgba(16, 185, 129, 0.2)'
              }}>
                <CheckCircle2 size={36} />
              </div>

              <h4 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                PDF Document Ready!
              </h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.75rem', lineHeight: 1.5 }}>
                {generatedDoc.filename}
              </p>

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                <a href={generatedDoc.downloadUrl} target="_blank" rel="noreferrer" className="btn btn-secondary">
                  <Eye size={18} />
                  <span>Preview PDF</span>
                </a>
                <a href={generatedDoc.downloadUrl} download className="btn btn-primary">
                  <Download size={18} />
                  <span>Download File</span>
                </a>
              </div>
            </div>
          ) : (
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              border: '2px dashed var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '3rem 1.5rem'
            }}>
              <FileText size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
              <p style={{ fontSize: '0.9rem' }}>Select a candidate and click "Generate PDF Document" to create the official PDF file.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
