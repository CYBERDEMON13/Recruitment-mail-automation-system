import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Send, 
  Eye, 
  FileText, 
  Users, 
  CheckCircle2, 
  X, 
  AlertCircle, 
  Paperclip,
  Sparkles,
  ArrowRight,
  Wand2,
  GitBranch
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

export default function EmailComposerPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [candidates, setCandidates] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedCandidateIds, setSelectedCandidateIds] = useState(
    location.state?.selectedCandidateIds || []
  );

  const [selectedTemplateId, setSelectedTemplateId] = useState('auto_status'); // Default to smart status matching!
  const [customSubject, setCustomSubject] = useState('');
  const [customBody, setCustomBody] = useState('');
  const [attachDocType, setAttachDocType] = useState('offer_letter');
  const [autoStatusMode, setAutoStatusMode] = useState(true);

  // AI Generator state in Composer
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiTone, setAiTone] = useState('Professional');

  // Preview & Confirm
  const [previews, setPreviews] = useState(null);
  const [generatingPreview, setGeneratingPreview] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [candRes, tplRes] = await Promise.all([
        axios.get('/api/candidates?limit=200'),
        axios.get('/api/email-templates')
      ]);

      if (candRes.data.success) setCandidates(candRes.data.candidates);
      if (tplRes.data.success) {
        setTemplates(tplRes.data.templates);
      }
    } catch (err) {
      showError('Failed to load composer data.');
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedCandidateIds(candidates.map(c => c.id));
    } else {
      setSelectedCandidateIds([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedCandidateIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleTemplateChange = (e) => {
    const tId = e.target.value;
    setSelectedTemplateId(tId);
    if (tId === 'auto_status') {
      setAutoStatusMode(true);
      setCustomSubject('');
      setCustomBody('');
    } else {
      setAutoStatusMode(false);
      const selectedTpl = templates.find(t => String(t.id) === String(tId));
      if (selectedTpl) {
        setCustomSubject(selectedTpl.subject);
        setCustomBody(selectedTpl.body);
      }
    }
  };

  const handleAICopyGen = async () => {
    setAiGenerating(true);
    try {
      // Pick first selected candidate status if available
      const firstCandidate = candidates.find(c => selectedCandidateIds.includes(c.id));
      const status = firstCandidate ? firstCandidate.application_status : null;

      const res = await axios.post('/api/emails/ai-generate', {
        prompt: customBody || `Write a recruitment email for status: ${status || 'Selected'}`,
        candidateId: firstCandidate ? firstCandidate.id : null,
        tone: aiTone
      });

      if (res.data.success) {
        setCustomSubject(res.data.aiResult.subject);
        setCustomBody(res.data.aiResult.body);
        setAutoStatusMode(false);
        showSuccess(`AI generated email copy tailored for candidate status (${status || 'Auto'})!`);
      }
    } catch (err) {
      showError('AI generation failed.');
    } finally {
      setAiGenerating(false);
    }
  };

  const handleGeneratePreview = async () => {
    if (selectedCandidateIds.length === 0) {
      showError('Please select at least one candidate for email campaign.');
      return;
    }

    setGeneratingPreview(true);
    try {
      const res = await axios.post('/api/emails/preview', {
        candidateIds: selectedCandidateIds,
        templateId: selectedTemplateId,
        customSubject,
        customBody,
        attachDocumentType: attachDocType,
        autoStatusMode
      });

      if (res.data.success) {
        setPreviews(res.data.previews);
        setShowConfirmModal(true);
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to generate preview.');
    } finally {
      setGeneratingPreview(false);
    }
  };

  const handleSendEmails = async () => {
    setSending(true);
    try {
      const res = await axios.post('/api/emails/send', {
        candidateIds: selectedCandidateIds,
        templateId: selectedTemplateId,
        customSubject,
        customBody,
        attachDocumentType: attachDocType,
        autoStatusMode
      });

      if (res.data.success) {
        showSuccess(res.data.message, 'Email Dispatch Completed');
        setShowConfirmModal(false);
        navigate('/email-history');
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Email dispatch failed.');
    } finally {
      setSending(false);
    }
  };

  // Inspect selected candidates statuses
  const selectedCandidatesList = candidates.filter(c => selectedCandidateIds.includes(c.id));
  const selectedCount = selectedCandidatesList.length;
  const selectedSelectedCount = selectedCandidatesList.filter(c => c.application_status === 'Selected').length;
  const selectedRejectedCount = selectedCandidatesList.filter(c => c.application_status === 'Rejected').length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Send size={28} style={{ color: 'var(--primary-600)' }} />
            Email Automation Composer
          </h1>
          <p className="page-subtitle">Configure candidate audience, AI application status matching, auto-attach PDFs & send campaign</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.75rem' }}>
        
        {/* Left Column: Candidate Audience Selector */}
        <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={20} color="var(--primary-600)" />
              <span>Select Audience ({selectedCandidateIds.length})</span>
            </h3>

            <label style={{ fontSize: '0.825rem', display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={candidates.length > 0 && selectedCandidateIds.length === candidates.length}
                onChange={handleSelectAll}
              />
              <span>Select All</span>
            </label>
          </div>

          <div className="table-container" style={{ flex: 1, maxHeight: '480px', overflowY: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '36px' }}></th>
                  <th>Candidate</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map(c => (
                  <tr key={c.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedCandidateIds.includes(c.id)}
                        onChange={() => handleSelectOne(c.id)}
                      />
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{c.full_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.email} • {c.job_position}</div>
                    </td>
                    <td>
                      <span className={`badge badge-${c.application_status.toLowerCase().replace(/\s+/g, '-')}`}>
                        {c.application_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: AI Status Routing & Campaign Settings */}
        <div className="glass-card" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={20} color="var(--primary-600)" />
              <span>Campaign Settings</span>
            </h3>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              disabled={aiGenerating}
              onClick={handleAICopyGen}
              style={{ color: 'var(--primary-600)', borderColor: 'var(--primary-200)' }}
            >
              {aiGenerating ? <span className="spinner"></span> : (
                <>
                  <Wand2 size={16} />
                  <span>✨ AI Copywriter</span>
                </>
              )}
            </button>
          </div>

          {/* Smart Status Routing Notification Badge */}
          {selectedCount > 0 && (
            <div style={{
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--primary-50)',
              border: '1px solid var(--primary-200)',
              marginBottom: '1.15rem',
              fontSize: '0.825rem'
            }}>
              <div style={{ fontWeight: 700, color: 'var(--primary-900)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                <GitBranch size={16} color="var(--primary-600)" />
                <span>Audience Status Breakdown:</span>
              </div>
              <div style={{ color: 'var(--primary-700)' }}>
                • <strong>{selectedSelectedCount} Selected</strong> (Auto-sends Offer Letter + PDF Attachment)
                <br />
                • <strong>{selectedRejectedCount} Rejected</strong> (Auto-sends Rejection Notice)
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email Routing Mode</label>
            <select
              className="form-select"
              value={selectedTemplateId}
              onChange={handleTemplateChange}
            >
              <option value="auto_status">⚡ Smart AI Status Routing (Offer for Selected, Rejection for Rejected)</option>
              {templates.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.template_type})</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Automatic Document Attachment</label>
            <select
              className="form-select"
              value={attachDocType}
              onChange={(e) => setAttachDocType(e.target.value)}
            >
              <option value="offer_letter">Auto-Attach Offer Letter PDF (For Selected Candidates)</option>
              <option value="certificate">Auto-Attach Certificate PDF</option>
              <option value="none">No Document Attachment</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Custom Subject Override (Optional)</label>
            <input
              type="text"
              className="form-control"
              placeholder="Leave empty to use Smart AI Status subject"
              value={customSubject}
              onChange={(e) => setCustomSubject(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Custom Body Override (Optional)</label>
            <textarea
              className="form-control"
              rows="5"
              placeholder="Leave empty to use Smart AI Status body content"
              value={customBody}
              onChange={(e) => setCustomBody(e.target.value)}
            />
          </div>

          <div style={{ marginTop: '1.5rem' }}>
            <button
              className="btn btn-primary"
              disabled={selectedCandidateIds.length === 0 || generatingPreview}
              onClick={handleGeneratePreview}
              style={{ width: '100%', padding: '0.85rem' }}
            >
              {generatingPreview ? <span className="spinner"></span> : (
                <>
                  <Eye size={18} />
                  <span>Preview Smart Emails & Confirm Dispatch</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>

      {/* Confirmation & Live Preview Modal */}
      {showConfirmModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '750px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Confirm & Send Smart Email Campaign</h3>
              <button className="modal-close-btn" onClick={() => setShowConfirmModal(false)}><X size={20} /></button>
            </div>

            <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              <div style={{
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--primary-50)',
                border: '1px solid var(--primary-200)',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <strong style={{ color: 'var(--primary-900)' }}>Target Recipients:</strong> {selectedCandidateIds.length} candidates selected.
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--primary-700)' }}>
                  Routing: <strong>Smart Application Status Matching</strong>
                </div>
              </div>

              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem' }}>Resolved Status-Matched Email Previews:</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {previews && previews.map((prev, idx) => (
                  <div key={idx} style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-app)',
                    border: '1px solid var(--border-color)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                        To: {prev.candidateName} &lt;{prev.email}&gt;
                      </div>
                      <span className={`badge badge-${(prev.applicationStatus || 'pending').toLowerCase().replace(/\s+/g, '-')}`}>
                        Status: {prev.applicationStatus}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary-600)', marginBottom: '0.5rem' }}>
                      Subject: {prev.subject}
                    </div>

                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'pre-line', background: 'var(--bg-surface)', padding: '0.75rem', borderRadius: '6px' }}>
                      {prev.body}
                    </div>

                    <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--primary-700)', fontWeight: 600 }}>
                      Attachment: {prev.attachment !== 'None' ? `${prev.attachment.toUpperCase()} PDF` : 'None (Rejection / General Notice)'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowConfirmModal(false)}>Cancel & Edit</button>
              <button
                className="btn btn-primary"
                disabled={sending}
                onClick={handleSendEmails}
              >
                {sending ? <span className="spinner"></span> : (
                  <>
                    <Send size={18} />
                    <span>Confirm & Send Smart Emails Now</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
