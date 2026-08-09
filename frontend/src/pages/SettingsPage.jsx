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
  AlertCircle 
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    smtp_host: 'smtp.ethereal.email',
    smtp_port: '587',
    smtp_secure: 'false',
    sender_name: 'HR Recruitment Team',
    sender_email: 'hr@company.com',
    smtp_user: '',
    smtp_pass: '',
    company_name: 'TechVision Global Inc.'
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
        setSettings(prev => ({ ...prev, ...res.data.settings }));
      }
    } catch (err) {
      showError('Failed to load system settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await axios.put('/api/settings', settings);
      if (res.data.success) {
        showSuccess('System & SMTP settings saved successfully.');
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
        showSuccess(res.data.message, 'SMTP Connection Success');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'SMTP Connection Test Failed.';
      setTestResult({ success: false, message: msg });
      showError(msg, 'SMTP Test Error');
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

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Settings size={28} style={{ color: 'var(--primary-600)' }} />
            System & SMTP Email Settings
          </h1>
          <p className="page-subtitle">Configure mail server credentials, company branding & security preferences</p>
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
                value={settings.sender_email || ''}
                onChange={(e) => setSettings({ ...settings, sender_email: e.target.value })}
              />
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '1.5rem 0' }} />

            {/* Section 2: SMTP Configuration */}
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Server size={20} color="var(--primary-600)" />
              <span>SMTP Mail Server Configuration</span>
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">SMTP Server Host</label>
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
              <label className="form-label">SMTP Connection Security</label>
              <select
                className="form-select"
                value={settings.smtp_secure || 'false'}
                onChange={(e) => setSettings({ ...settings, smtp_secure: e.target.value })}
              >
                <option value="false">STARTTLS / Unencrypted (Port 587)</option>
                <option value="true">SSL / TLS Direct (Port 465)</option>
              </select>
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
                    <span>Test SMTP Connection</span>
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
              <Lock size={20} color="var(--emerald-600)" />
              <span>Security & Secrets Integrity</span>
            </h3>

            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              All SMTP passwords, API keys, and database secrets are stored securely in backend environment configurations or protected settings tables. Credentials are strictly masked when served to client user interfaces.
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
                <span>{testResult.success ? 'SMTP Test Successful' : 'SMTP Connection Failed'}</span>
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
