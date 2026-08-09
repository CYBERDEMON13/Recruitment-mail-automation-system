import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Mail, 
  Plus, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  Sparkles, 
  Tag, 
  Code,
  Wand2
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [showModal, setShowModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    body: '',
    template_type: 'offer_letter'
  });

  // AI Generator State
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiTone, setAiTone] = useState('Professional');
  const [aiCategory, setAiCategory] = useState('offer_letter');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiResult, setAiResult] = useState(null);

  const { showSuccess, showError } = useToast();

  const variables = [
    '{{CandidateName}}',
    '{{CandidateEmail}}',
    '{{JobPosition}}',
    '{{Department}}',
    '{{JoiningDate}}',
    '{{Salary}}',
    '{{CompanyName}}'
  ];

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await axios.get('/api/email-templates');
      if (res.data.success) {
        setTemplates(res.data.templates);
      }
    } catch (err) {
      showError('Failed to fetch email templates.');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingTemplate(null);
    setFormData({
      name: '',
      subject: '',
      body: '',
      template_type: 'offer_letter'
    });
    setShowModal(true);
  };

  const openEditModal = (tpl) => {
    setEditingTemplate(tpl);
    setFormData({
      name: tpl.name,
      subject: tpl.subject,
      body: tpl.body,
      template_type: tpl.template_type
    });
    setShowModal(true);
  };

  const insertVariable = (varName) => {
    setFormData(prev => ({
      ...prev,
      body: prev.body + ' ' + varName
    }));
  };

  const handleSaveTemplate = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.subject || !formData.body) {
      showError('Please fill in all template fields (Name, Subject, Body).');
      return;
    }

    try {
      if (editingTemplate) {
        const res = await axios.put(`/api/email-templates/${editingTemplate.id}`, formData);
        if (res.data.success) {
          showSuccess('Email template updated successfully.');
        }
      } else {
        const res = await axios.post('/api/email-templates', formData);
        if (res.data.success) {
          showSuccess('Email template created successfully.');
        }
      }
      setShowModal(false);
      fetchTemplates();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to save template.');
    }
  };

  const handleDeleteTemplate = async () => {
    if (!deletingId) return;
    try {
      const res = await axios.delete(`/api/email-templates/${deletingId}`);
      if (res.data.success) {
        showSuccess('Email template deleted.');
        setDeletingId(null);
        fetchTemplates();
      }
    } catch (err) {
      showError('Failed to delete template.');
    }
  };

  // AI Generator Handler
  const handleAIGenerate = async (e) => {
    e.preventDefault();
    setAiGenerating(true);
    try {
      const res = await axios.post('/api/emails/ai-generate', {
        prompt: aiPrompt,
        templateType: aiCategory,
        tone: aiTone
      });

      if (res.data.success) {
        setAiResult(res.data.aiResult);
        showSuccess('AI generated personalized email template!');
      }
    } catch (err) {
      showError(err.response?.data?.message || 'AI generation failed.');
    } finally {
      setAiGenerating(false);
    }
  };

  const applyAITemplate = () => {
    if (!aiResult) return;
    setFormData({
      name: `AI Generated - ${aiCategory.replace('_', ' ').toUpperCase()} (${aiTone})`,
      subject: aiResult.subject,
      body: aiResult.body,
      template_type: aiCategory
    });
    setShowAIModal(false);
    setEditingTemplate(null);
    setShowModal(true);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Mail size={28} style={{ color: 'var(--primary-600)' }} />
            Email Templates Management
          </h1>
          <p className="page-subtitle">Design & edit dynamic email templates with AI assistant & candidate placeholder tags</p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={() => { setAiResult(null); setShowAIModal(true); }} style={{ color: 'var(--primary-600)', borderColor: 'var(--primary-200)' }}>
            <Wand2 size={18} />
            <span>✨ AI Email Generator</span>
          </button>

          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={18} />
            <span>Create Email Template</span>
          </button>
        </div>
      </div>

      {/* Available Variable Placeholders Info Banner */}
      <div className="glass-card" style={{ padding: '1.25rem 1.5rem', marginBottom: '1.75rem', background: 'var(--primary-50)', borderColor: 'var(--primary-200)' }}>
        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary-900)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Code size={18} />
          <span>Available Dynamic Placeholder Tags:</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {variables.map((v, i) => (
            <span key={i} style={{
              padding: '0.3rem 0.65rem',
              borderRadius: '6px',
              background: '#ffffff',
              border: '1px solid var(--primary-200)',
              color: 'var(--primary-700)',
              fontFamily: 'monospace',
              fontSize: '0.8rem',
              fontWeight: 600
            }}>
              {v}
            </span>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center' }}>
          <div className="spinner" style={{ borderColor: 'var(--primary-500)', borderTopColor: 'transparent', margin: '0 auto' }}></div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
          {templates.map(tpl => (
            <div key={tpl.id} className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{tpl.name}</h3>
                <span className="badge badge-generated">{tpl.template_type}</span>
              </div>

              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary-600)', marginBottom: '0.75rem' }}>
                Subject: {tpl.subject}
              </div>

              <div style={{
                flex: 1,
                fontSize: '0.825rem',
                color: 'var(--text-muted)',
                background: 'var(--bg-app)',
                padding: '0.85rem',
                borderRadius: 'var(--radius-md)',
                whiteSpace: 'pre-line',
                maxHeight: '160px',
                overflowY: 'auto',
                marginBottom: '1.25rem',
                border: '1px solid var(--border-color)'
              }}>
                {tpl.body}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', borderTop: '1px solid var(--border-light)', paddingTop: '0.85rem' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => openEditModal(tpl)}>
                  <Edit3 size={16} />
                  <span>Edit</span>
                </button>
                <button className="btn btn-secondary btn-sm" style={{ color: '#ef4444' }} onClick={() => setDeletingId(tpl.id)}>
                  <Trash2 size={16} />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ✨ AI Generator Modal */}
      {showAIModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Wand2 size={20} color="var(--primary-600)" />
                <span>✨ AI Email Generator</span>
              </h3>
              <button className="modal-close-btn" onClick={() => setShowAIModal(false)}><X size={20} /></button>
            </div>

            <form onSubmit={handleAIGenerate}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Email Purpose & Instructions</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Write an enthusiastic job offer for a Senior Software Developer joining in September"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Email Category</label>
                    <select
                      className="form-select"
                      value={aiCategory}
                      onChange={(e) => setAiCategory(e.target.value)}
                    >
                      <option value="offer_letter">Offer Letter Email</option>
                      <option value="certificate">Selection Certificate</option>
                      <option value="rejection">Rejection Notice</option>
                      <option value="general">General Announcement</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Tone of Voice</label>
                    <select
                      className="form-select"
                      value={aiTone}
                      onChange={(e) => setAiTone(e.target.value)}
                    >
                      <option value="Professional">Professional</option>
                      <option value="Warm & Welcoming">Warm & Welcoming</option>
                      <option value="Enthusiastic">Enthusiastic</option>
                      <option value="Formal">Formal</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={aiGenerating}
                  style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem' }}
                >
                  {aiGenerating ? <span className="spinner"></span> : (
                    <>
                      <Wand2 size={18} />
                      <span>Generate Content with AI</span>
                    </>
                  )}
                </button>

                {/* AI Result Preview Box */}
                {aiResult && (
                  <div style={{
                    marginTop: '1.25rem',
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--primary-50)',
                    border: '1px solid var(--primary-200)'
                  }}>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary-900)', marginBottom: '0.35rem' }}>
                      AI Generated Preview:
                    </h4>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--primary-700)', marginBottom: '0.5rem' }}>
                      Subject: {aiResult.subject}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-main)', whiteSpace: 'pre-line', background: '#ffffff', padding: '0.75rem', borderRadius: '6px', maxHeight: '180px', overflowY: 'auto' }}>
                      {aiResult.body}
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAIModal(false)}>Cancel</button>
                {aiResult && (
                  <button type="button" className="btn btn-success" onClick={applyAITemplate}>
                    <Check size={18} />
                    <span>Use AI Template</span>
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Template Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '680px' }}>
            <div className="modal-header">
              <h3 className="modal-title">{editingTemplate ? 'Edit Email Template' : 'Create New Email Template'}</h3>
              <button className="modal-close-btn" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>

            <form onSubmit={handleSaveTemplate}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Template Name <span className="required">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Official Job Offer Email"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Template Category</label>
                  <select
                    className="form-select"
                    value={formData.template_type}
                    onChange={(e) => setFormData({ ...formData, template_type: e.target.value })}
                  >
                    <option value="offer_letter">Offer Letter Email</option>
                    <option value="certificate">Selection Certificate Email</option>
                    <option value="rejection">Rejection Notice</option>
                    <option value="general">General Announcement</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Email Subject <span className="required">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Congratulations! Job Offer from {{CompanyName}}"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <label className="form-label">Email Body Content <span className="required">*</span></label>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Click tag below to insert</span>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.65rem' }}>
                    {variables.map((v, idx) => (
                      <button
                        type="button"
                        key={idx}
                        onClick={() => insertVariable(v)}
                        style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          background: 'var(--bg-app)',
                          border: '1px solid var(--border-color)',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontFamily: 'monospace'
                        }}
                      >
                        + {v}
                      </button>
                    ))}
                  </div>

                  <textarea
                    className="form-control"
                    rows="8"
                    placeholder="Write your email body..."
                    value={formData.body}
                    onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Template</button>
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
              <h3 className="modal-title">Confirm Delete</h3>
              <button className="modal-close-btn" onClick={() => setDeletingId(null)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete this email template?</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeletingId(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDeleteTemplate}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
