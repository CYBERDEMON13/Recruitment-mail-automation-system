import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Mail, Lock, Eye, EyeOff, Sparkles, ArrowRight, Clock, AlertTriangle } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [pendingMessage, setPendingMessage] = useState(null);

  const { login, googleLogin } = useAuth();
  const { showError, showSuccess } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      showError('Please enter both email address and password.');
      return;
    }

    setLoading(true);
    setPendingMessage(null);
    try {
      const res = await login(email, password);
      if (res.success) {
        showSuccess('Welcome back to HR Portal!', 'Authentication Successful');
        navigate('/');
      }
    } catch (err) {
      const isPending = err.response?.data?.pending;
      const msg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      
      if (isPending) {
        setPendingMessage(msg);
      } else {
        showError(msg, 'Authentication Error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    const gmailInput = prompt('Enter your Gmail address to sign in / request access:', 'vishalcharlie13@gmail.com');
    if (!gmailInput) return;

    if (!gmailInput.includes('@')) {
      showError('Please enter a valid Gmail address.');
      return;
    }

    setGoogleLoading(true);
    setPendingMessage(null);
    try {
      const name = gmailInput.split('@')[0].replace('.', ' ');
      const res = await googleLogin({
        email: gmailInput,
        name: name.charAt(0).toUpperCase() + name.slice(1),
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=3b82f6&color=fff`
      });

      if (res.pending) {
        setPendingMessage(res.message);
      } else if (res.success) {
        showSuccess(`Welcome back, ${res.user.name}! Signed in via Google (${gmailInput}).`, 'Google Auth Successful');
        navigate('/');
      }
    } catch (err) {
      const isPending = err.response?.data?.pending;
      const msg = err.response?.data?.message || 'Google authentication failed.';
      if (isPending) {
        setPendingMessage(msg);
      } else {
        showError(msg);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const fillDemoAdmin = () => {
    setEmail('admin@hr.com');
    setPassword('admin123');
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at 50% 50%, #1e293b 0%, #0f172a 100%)',
      padding: '1.5rem'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '440px',
        background: 'rgba(30, 41, 59, 0.75)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '24px',
        padding: '2.5rem 2rem',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}>
        {/* Header Branding */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(59, 130, 246, 0.4)',
            marginBottom: '1rem'
          }}>
            <Sparkles size={28} color="#ffffff" />
          </div>

          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-heading)' }}>
            HR Portal Login
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.35rem' }}>
            Recruitify | Smart HR Automation & Document Studio
          </p>
        </div>

        {/* Pending Approval Notification Banner */}
        {pendingMessage && (
          <div style={{
            padding: '1.15rem',
            borderRadius: '14px',
            background: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            marginBottom: '1.5rem',
            color: '#fef3c7',
            fontSize: '0.875rem',
            lineHeight: 1.5
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: '#fbbf24', marginBottom: '0.35rem', fontSize: '0.95rem' }}>
              <Clock size={20} />
              <span>Access Request Pending Approval</span>
            </div>
            <div>{pendingMessage}</div>
            <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#fde68a' }}>
              ✉️ An automated email notification has been dispatched to the Administrator (admin@hr.com).
            </div>
          </div>
        )}

        {/* Google Sign In Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleLoading}
          style={{
            width: '100%',
            padding: '0.75rem',
            borderRadius: '12px',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            color: '#1e293b',
            fontWeight: 600,
            fontSize: '0.95rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.65rem',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            marginBottom: '1.25rem',
            transition: 'all 0.2s ease'
          }}
        >
          {googleLoading ? <span className="spinner" style={{ borderColor: '#3b82f6', borderTopColor: 'transparent' }}></span> : (
            <>
              {/* Official Google SVG Logo */}
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Sign in with Google</span>
            </>
          )}
        </button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', margin: '1.25rem 0', gap: '0.75rem' }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }}></div>
          <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>or with email</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }}></div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" style={{ color: '#cbd5e1' }}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input
                type="email"
                className="form-control"
                placeholder="admin@hr.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  paddingLeft: '2.5rem',
                  background: 'rgba(15, 23, 42, 0.6)',
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                  color: '#ffffff'
                }}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label" style={{ color: '#cbd5e1' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  paddingLeft: '2.5rem',
                  paddingRight: '2.5rem',
                  background: 'rgba(15, 23, 42, 0.6)',
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                  color: '#ffffff'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', padding: '0.85rem', fontSize: '1rem', marginBottom: '1.25rem' }}
          >
            {loading ? <span className="spinner"></span> : (
              <>
                <span>Sign In to Dashboard</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Demo Fill Helper */}
        <div style={{
          marginTop: '1rem',
          padding: '0.85rem',
          borderRadius: '12px',
          background: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '0.775rem', color: '#93c5fd', marginBottom: '0.35rem' }}>
            Quick Demo Login:
          </div>
          <button
            type="button"
            onClick={fillDemoAdmin}
            style={{
              background: 'none',
              border: 'none',
              color: '#60a5fa',
              fontWeight: 600,
              fontSize: '0.825rem',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Fill Admin Credentials (admin@hr.com / admin123)
          </button>
        </div>
      </div>
    </div>
  );
}
