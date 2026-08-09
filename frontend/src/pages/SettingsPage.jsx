import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Settings, 
  Server, 
  Building, 
  Lock, 
  Mail, 
  Save, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  Globe,
  Zap,
  ShieldCheck
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    smtp_host: 'api.resend.com',
    smtp_port: '443',
    smtp_secure: 'true',
    sender_name: 'HR Recruitment Team',
    sender_email: 'onboarding@resend.dev',
    smtp_user: 'vishalcharlie13@gmail.com',
    smtp_pass: '',
    company_name: 'TechVision Global Inc.',
    provider: 'resend'
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const { showSuccess, showError } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await axios.get('/api/settings');
      if (res.data.success) {
        const fetched = res.data.settings;
        let provider = 'smtp';
        if (fetched.smtp_pass?.startsWith('re_') || fetched.smtp_host?.includes('resend')) {
          provider = 'resend';
        } else if (fetched.smtp_pass?.startsWith('xkeysib-') || fetched.smtp_host?.includes('brevo')) {
          provider = 'brevo';
        } else if (fetched.smtp_host?.includes('ethereal')) {
          provider = 'ethereal';
        }
        setSettings(prev => ({ ...prev, ...fetched, provider }));
      }
    } catch (err) {
      showError('Failed to load system settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleProviderSelect = (e) => {
    const p = e.target.value;
    if (p === 'resend') {
      setSettings(prev => ({
        ...prev,
        provider: 'resend',
        smtp_host: 'api.resend.com',
        smtp_port: '443',
        smtp_secure: 'true',
        sender_email: prev.sender_email.includes('example') ? 'onboarding@resend.dev' : prev.sender_email
      }));
    } else if (p === 'brevo') {
      setSettings(prev => ({
        ...prev,
        provider: 'brevo',
        smtp_host: 'api.brevo.com',
        smtp_port: '443',
        smtp_secure: 'true'
      }));
    } else if (p === 'gmail') {
      setSettings(prev => ({
        ...prev,
        provider: 'gmail',
        smtp_host: 'smtp.gmail.com',
        smtp_port: '587',
        smtp_secure: 'false'
      }));
    } else {
      setSettings(prev => ({
        ...prev,
        provider: 'smtp'
      }));
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await axios.put('/api/settings', settings);
      if (res.data.success) {
        showSuccess('System & Email Provider settings saved successfully.');
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleTestSMTP = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const res = await axios.post('/api/settings/test-smtp', settings);
      if (res.data.success) {
        setTestResult({ success: true, message: res.data.message });
        showSuccess(res.data.message, 'Email Provider Verification Success');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Connection Test Failed.';
      setTestResult({ success: false, message: msg });
      showError(msg, 'Email Verification Error');
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
        <div className="spinner" style={{ borderColor: 'var(--primary-500)', borderTopColor: 'transparent' }}></div>
      </div>
    );
  }

  const isResend = settings.provider === 'resend' || settings.smtp_pass?.startsWith('re_');
  const isBrevo = settings.provider === 'brevo' || settings.smtp_pass?.startsWith('xkeysib-');

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Settings size={28} style={{ color: 'var(--primary-600)' }} />
            System & Email Dispatch Engine Settings
          </h1>
          <p className="page-subtitle">Configure Render HTTPS API keys, SMTP mail servers, company branding & security</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.75rem' }}>
        
        {/* Settings Form */}
        <div className="glass-card" style={{ padding: '1.75rem' }}>
          <form onSubmit={handleSaveSettings}>
            
            {/* Section 1: Company Branding */}
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Building size={20} color="var(--primary-600)" />
              <span>Company Branding</span>
            </h3>

            <div className="form-group">
              <label className="form-label">Company Name</label>
              <input
                type="text"
                className="form-control"
                value={settings.company_name || ''}
                onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Sender Name (Email Header)</label>
              <input
                type="text"
                className="form-control"
                value={settings.sender_name || ''}
                onChange={(e) => setSettings({ ...settings, sender_name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Sender Email Address</label>
              <input
                type="email"
                className="form-control"
                placeholder={isResend ? 'onboarding@resend.dev or your verified domain' : 'hr@company.com'}
                value={settings.sender_email || ''}
                onChange={(e) => setSettings({ ...settings, sender_email: e.target.value })}
              />
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '1.5rem 0' }} />

            {/* Section 2: Dispatch Engine & Provider Selection */}
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Zap size={20} color="var(--primary-600)" />
              <span>Email Dispatch Provider Engine</span>
            </h3>

            <div className="form-group">
              <label className="form-label">Active Provider Engine</label>
              <select
                className="form-select"
                value={settings.provider || 'resend'}
                onChange={handleProviderSelect}
              >
                <option value="resend">🚀 Resend HTTPS API (Recommended for Render Cloud - Port 443)</option>
                <option value="brevo">🚀 Brevo (Sendinblue) HTTPS API (Cloud Port 443)</option>
                <option value="gmail">✉️ Gmail SMTP (Standard Port 587)</option>
                <option value="smtp">⚙️ Custom SMTP Server</option>
              </select>
            </div>

            {(isResend || isBrevo) ? (
              <div style={{
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                marginBottom: '1.25rem',
                fontSize: '0.85rem',
                color: '#166534'
              }}>
                <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                  <ShieldCheck size={18} color="#15803d" />
                  <span>Cloud HTTPS Dispatch Mode Active (Port 443)</span>
                </div>
                Sends emails directly over standard HTTPS Port 443. Never blocked by Render, AWS, or cloud firewalls!
              </div>
            ) : null}

            {(isResend || isBrevo) ? (
              <div className="form-group">
                <label className="form-label">
                  {isResend ? 'Resend API Key (starts with re_)' : 'Brevo API Key (starts with xkeysib-)'}
                </label>
                <input
                  type="password"
                  className="form-control"
                  placeholder={isResend ? 're_8VJtBwQ4_...' : 'xkeysib-...'}
                  value={settings.smtp_pass || ''}
                  onChange={(e) => setSettings({ ...settings, smtp_pass: e.target.value })}
                />
              </div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">SMTP Host</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="smtp.gmail.com"
                      value={settings.smtp_host || ''}
                      onChange={(e) => setSettings({ ...settings, smtp_host: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Port</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="587"
                      value={settings.smtp_port || ''}
                      onChange={(e) => setSettings({ ...settings, smtp_port: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">SMTP Username</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="your_email@gmail.com"
                    value={settings.smtp_user || ''}
                    onChange={(e) => setSettings({ ...settings, smtp_user: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">SMTP Password / App Key</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="••••••••"
                    value={settings.smtp_pass || ''}
                    onChange={(e) => setSettings({ ...settings, smtp_pass: e.target.value })}
                  />
                </div>
              </>
            )}

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.75rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={testing}
                onClick={handleTestSMTP}
              >
                {testing ? <span className="spinner"></span> : (
                  <>
                    <RefreshCw size={18} />
                    <span>Verify Connection</span>
                  </>
                )}
              </button>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
                style={{ flex: 1 }}
              >
                {saving ? <span className="spinner"></span> : (
                  <>
                    <Save size={18} />
                    <span>Save Settings</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Info & Test Connection Feedback */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="glass-card" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Globe size={20} color="var(--primary-600)" />
              <span>Cloud Port 443 vs Standard SMTP</span>
            </h3>

            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              On cloud hosting platforms like Render, standard SMTP TCP ports (25, 465, 587) are restricted by provider firewall rules.
              <br /><br />
              Selecting <strong>Resend HTTPS API</strong> routes email dispatches over standard web Port 443, ensuring 100% reliable email & PDF document delivery from both local PCs and live Render deployments.
            </p>
          </div>

          {testResult && (
            <div className="glass-card" style={{
              padding: '1.5rem',
              borderColor: testResult.success ? 'var(--emerald-500)' : 'var(--rose-500)',
              background: testResult.success ? '#ecfdf5' : '#fef2f2'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: testResult.success ? '#065f46' : '#991b1b', marginBottom: '0.5rem' }}>
                {testResult.success ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                <span>{testResult.success ? 'Verification Successful' : 'Connection Failed'}</span>
              </div>
              <div style={{ fontSize: '0.85rem', color: testResult.success ? '#047857' : '#b91c1c' }}>
                {testResult.message}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
