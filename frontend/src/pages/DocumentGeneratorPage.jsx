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
  User 
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

export default function DocumentGeneratorPage() {
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
                    padding: '0.85rem',
                    borderRadius: 'var(--radius-md)',
                    border: docType === 'offer_letter' ? '2px solid var(--primary-600)' : '1px solid var(--border-color)',
                    background: docType === 'offer_letter' ? 'var(--primary-50)' : 'var(--bg-surface)',
                    color: docType === 'offer_letter' ? 'var(--primary-700)' : 'var(--text-main)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                >
                  <FileText size={22} />
                  <span>Offer Letter PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDocType('certificate')}
                  style={{
                    padding: '0.85rem',
                    borderRadius: 'var(--radius-md)',
                    border: docType === 'certificate' ? '2px solid var(--amber-500)' : '1px solid var(--border-color)',
                    background: docType === 'certificate' ? '#fffbebf0' : 'var(--bg-surface)',
                    color: docType === 'certificate' ? '#b45309' : 'var(--text-main)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                >
                  <Award size={22} />
                  <span>Certificate PDF</span>
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
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-app)',
                border: '1px solid var(--border-color)',
                marginBottom: '1.5rem',
                fontSize: '0.85rem'
              }}>
                <div style={{ fontWeight: 700, color: 'var(--primary-600)', marginBottom: '0.35rem' }}>
                  Selected Candidate Profile:
                </div>
                <div><strong>Name:</strong> {currentCandidate.full_name}</div>
                <div><strong>Position:</strong> {currentCandidate.job_position}</div>
                <div><strong>Department:</strong> {currentCandidate.department}</div>
                <div><strong>Joining Date:</strong> {currentCandidate.joining_date}</div>
                <div><strong>Salary:</strong> {currentCandidate.salary}</div>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={generating || !selectedCandidateId}
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
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'var(--primary-100)',
                color: 'var(--primary-600)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem'
              }}>
                <CheckCircle2 size={36} />
              </div>

              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                PDF Document Ready!
              </h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                File: {generatedDoc.filename}
              </p>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <a
                  href={generatedDoc.downloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary"
                >
                  <Eye size={18} />
                  <span>Preview PDF</span>
                </a>

                <a
                  href={generatedDoc.downloadUrl}
                  download
                  className="btn btn-primary"
                >
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
