import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Mail, Lock, Eye, EyeOff, Sparkles, ArrowRight, Clock, Users, FileText, Send, Shield } from 'lucide-react';

const loginStyles = `
  @keyframes float1 {
    0%, 100% { transform: translate(0, 0) scale(1); }
    33% { transform: translate(30px, -40px) scale(1.05); }
    66% { transform: translate(-20px, 20px) scale(0.98); }
  }
  @keyframes float2 {
    0%, 100% { transform: translate(0, 0) scale(1); }
    33% { transform: translate(-25px, 30px) scale(1.03); }
    66% { transform: translate(15px, -25px) scale(0.97); }
  }
  @keyframes float3 {
    0%, 100% { transform: translate(0, 0) scale(1); }
    50% { transform: translate(20px, 15px) scale(1.04); }
  }
  @keyframes gradientShift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }

  .login-bg {
    position: fixed;
    inset: 0;
    background: linear-gradient(-45deg, #07111f, #0c1a30, #0a0f1e, #111827, #0e1628);
    background-size: 400% 400%;
    animation: gradientShift 14s ease infinite;
    z-index: 0;
  }

  .orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    opacity: 0.25;
    pointer-events: none;
  }
  .orb-1 { width: 420px; height: 420px; background: #3b82f6; top: -80px; left: -120px; animation: float1 16s ease-in-out infinite; }
  .orb-2 { width: 350px; height: 350px; background: #6d28d9; bottom: -60px; right: -80px; animation: float2 18s ease-in-out infinite; }
  .orb-3 { width: 280px; height: 280px; background: #0ea5e9; top: 40%; left: 50%; animation: float3 12s ease-in-out infinite; }

  .login-field:focus-within label {
    color: #60a5fa;
  }

  .login-input {
    width: 100%;
    padding: 0.75rem 0.9rem 0.75rem 2.75rem;
    background: rgba(15, 23, 42, 0.55);
    border: 1.5px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    color: #f1f5f9;
    font-family: var(--font-body);
    font-size: 0.9rem;
    outline: none;
    transition: all 0.2s ease;
    caret-color: #60a5fa;
  }

  .login-input::placeholder {
    color: rgba(148, 163, 184, 0.45);
  }

  .login-input:focus {
    border-color: rgba(59, 130, 246, 0.6);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12), 0 0 20px rgba(59, 130, 246, 0.08);
    background: rgba(15, 23, 42, 0.7);
  }

  .google-btn {
    width: 100%;
    padding: 0.75rem;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.97);
    border: none;
    color: #1e293b;
    font-weight: 600;
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.65rem;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
    font-family: var(--font-body);
  }

  .google-btn:hover {
    background: #ffffff;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    transform: translateY(-1px);
  }

  .sign-in-btn {
    width: 100%;
    padding: 0.85rem;
    border-radius: 12px;
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    color: #ffffff;
    font-weight: 700;
    font-size: 0.95rem;
    font-family: var(--font-body);
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    transition: all 0.2s ease;
    box-shadow: 0 4px 16px rgba(37, 99, 235, 0.4);
    position: relative;
    overflow: hidden;
  }

  .sign-in-btn::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 60%);
    opacity: 0;
    transition: opacity 0.2s;
  }

  .sign-in-btn:hover {
    box-shadow: 0 6px 24px rgba(37, 99, 235, 0.55);
    transform: translateY(-1px);
  }

  .sign-in-btn:hover::before {
    opacity: 1;
  }

  .sign-in-btn:active {
    transform: scale(0.98);
  }

  .feature-item {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    padding: 0.85rem 0;
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }

  .feature-item:last-child {
    border-bottom: none;
  }

  .feature-icon {
    width: 36px;
    height: 36px;
    border-radius: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
`;

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
        showSuccess(`Welcome back, ${res.user.name}!`, 'Google Auth Successful');
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

  const features = [
    {
      icon: <Users size={18} color="#60a5fa" />,
      bg: 'rgba(59,130,246,0.12)',
      title: 'Smart Candidate Management',
      desc: 'Manage profiles, bulk import from Excel, and track pipeline stages'
    },
    {
      icon: <Send size={18} color="#a78bfa" />,
      bg: 'rgba(139,92,246,0.12)',
      title: 'AI-Powered Email Automation',
      desc: 'Auto-route emails by application status with smart templates'
    },
    {
      icon: <FileText size={18} color="#34d399" />,
      bg: 'rgba(16,185,129,0.12)',
      title: 'Document Studio',
      desc: 'One-click PDF offer letters and certification generation'
    },
    {
      icon: <Shield size={18} color="#fbbf24" />,
      bg: 'rgba(245,158,11,0.12)',
      title: 'SOC Security Center',
      desc: 'Full audit logs, role-based access, and screen capture protection'
    },
  ];

  return (
    <>
      <style>{loginStyles}</style>

      {/* Animated Background */}
      <div className="login-bg">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      <div style={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{ width: '100%', maxWidth: '1000px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', alignItems: 'center' }}>

          {/* LEFT: Feature Highlights Panel */}
          <div style={{ color: '#ffffff' }}>
            {/* Brand */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '2.5rem' }}>
              <div style={{
                width: '52px', height: '52px', borderRadius: '14px',
                background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(59,130,246,0.4)',
              }}>
                <Sparkles size={26} color="#fff" />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.5rem', fontFamily: 'var(--font-heading)', letterSpacing: '-0.03em' }}>
                  Recruit<span style={{ color: '#60a5fa' }}>ify</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'rgba(148,163,184,0.7)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  Smart HR Automation
                </div>
              </div>
            </div>

            <h1 style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-heading)', lineHeight: 1.2, marginBottom: '0.75rem', letterSpacing: '-0.03em' }}>
              Your end-to-end<br />
              <span style={{
                background: 'linear-gradient(135deg, #60a5fa, #a78bfa)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                recruitment engine
              </span>
            </h1>

            <p style={{ color: 'rgba(148,163,184,0.8)', fontSize: '0.925rem', lineHeight: 1.7, marginBottom: '2rem' }}>
              Automate candidate management, AI-powered email dispatch, and document generation — all in one secure platform.
            </p>

            <div>
              {features.map((f, i) => (
                <div key={i} className="feature-item">
                  <div className="feature-icon" style={{ background: f.bg }}>
                    {f.icon}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.15rem' }}>{f.title}</div>
                    <div style={{ fontSize: '0.8rem', color: 'rgba(148,163,184,0.65)', lineHeight: 1.5 }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: Login Form */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '24px',
            padding: '2.25rem 2rem',
            boxShadow: '0 30px 60px -15px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255,255,255,0.06)',
          }}>
            <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-heading)', marginBottom: '0.3rem' }}>
                Sign In
              </h2>
              <p style={{ color: 'rgba(148,163,184,0.7)', fontSize: '0.85rem' }}>
                Access your HR automation portal
              </p>
            </div>

            {/* Pending Notification */}
            {pendingMessage && (
              <div style={{
                padding: '1rem 1.15rem',
                borderRadius: '12px',
                background: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                marginBottom: '1.5rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: '#fbbf24', marginBottom: '0.3rem', fontSize: '0.9rem' }}>
                  <Clock size={18} />
                  <span>Access Request Pending</span>
                </div>
                <div style={{ fontSize: '0.82rem', color: '#fde68a', lineHeight: 1.5 }}>{pendingMessage}</div>
                <div style={{ marginTop: '0.45rem', fontSize: '0.78rem', color: 'rgba(253,230,138,0.7)' }}>
                  ✉️ Admin has been notified at admin@hr.com
                </div>
              </div>
            )}

            {/* Google Sign In */}
            <button type="button" className="google-btn" onClick={handleGoogleSignIn} disabled={googleLoading}>
              {googleLoading ? <span className="spinner" style={{ borderColor: '#3b82f6', borderTopColor: 'transparent' }} /> : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', margin: '1.25rem 0', gap: '0.75rem' }}>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
              <span style={{ fontSize: '0.72rem', color: 'rgba(100,116,139,0.8)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>or with email</span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              {/* Email Field */}
              <div className="login-field" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'rgba(203,213,225,0.85)', marginBottom: '0.4rem' }}>
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(100,116,139,0.7)' }} />
                  <input
                    type="email"
                    className="login-input"
                    placeholder="admin@hr.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    id="login-email"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="login-field" style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'rgba(203,213,225,0.85)', marginBottom: '0.4rem' }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(100,116,139,0.7)' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="login-input"
                    style={{ paddingRight: '2.75rem' }}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    id="login-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(100,116,139,0.7)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button type="submit" className="sign-in-btn" disabled={loading} id="login-submit-btn">
                {loading ? <span className="spinner" /> : (
                  <>
                    <span>Sign In to Dashboard</span>
                    <ArrowRight size={17} />
                  </>
                )}
              </button>
            </form>

            {/* Demo Fill */}
            <div style={{
              marginTop: '1.25rem',
              padding: '0.85rem',
              borderRadius: '12px',
              background: 'rgba(59, 130, 246, 0.08)',
              border: '1px solid rgba(59, 130, 246, 0.18)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.75rem', color: 'rgba(147,197,253,0.7)', marginBottom: '0.35rem' }}>
                Quick Demo Login
              </div>
              <button
                type="button"
                onClick={fillDemoAdmin}
                style={{ background: 'none', border: 'none', color: '#60a5fa', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', textDecoration: 'underline', fontFamily: 'var(--font-body)' }}
              >
                Fill Admin Credentials (admin@hr.com / admin123)
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
