import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, EyeOff, Lock } from 'lucide-react';

export default function ScreenCaptureGuard({ children }) {
  const { user } = useAuth();
  const isAdmin = user && user.role === 'admin';

  const [blurred, setBlurred] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');

  useEffect(() => {
    // If Administrator, do NOT apply any screenshot or recording restrictions
    if (isAdmin) {
      setBlurred(false);
      return;
    }

    // --- 1. KEYBOARD SHORTCUT & PRINTSCREEN INTERCEPTOR ---
    const handleKeyDown = (e) => {
      // Intercept PrintScreen key
      if (e.key === 'PrintScreen' || e.code === 'PrintScreen') {
        e.preventDefault();
        e.stopPropagation();
        triggerSecurityAlert('PrintScreen Key Blocked: Screenshot capture is prohibited for non-admin accounts.');
        // Clear clipboard
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText('CONFIDENTIAL CONTENT — SCREENSHOT PROHIBITED').catch(() => {});
        }
        return false;
      }

      // Intercept Ctrl+P / Cmd+P (Print)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        triggerSecurityAlert('Print Function Blocked: Document printing is restricted.');
        return false;
      }

      // Intercept Ctrl+S / Cmd+S (Save Web Page)
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        triggerSecurityAlert('Page Save Restricted: Saving application source is prohibited.');
        return false;
      }

      // Intercept Win+Shift+S or Snipping Tool hotkeys
      if (e.shiftKey && (e.metaKey || e.key === 'S' || e.key === 's')) {
        e.preventDefault();
        triggerSecurityAlert('Screen Snipping Tool Blocked.');
        return false;
      }
    };

    // --- 2. FOCUS LOSS / SNIPPING TOOL BLACKOUT MASK ---
    const handleBlur = () => {
      // When window loses focus (e.g. Snipping tool or OBS capture started), apply blackout
      setBlurred(true);
    };

    const handleFocus = () => {
      setBlurred(false);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setBlurred(true);
      } else {
        setBlurred(false);
      }
    };

    // --- 3. OVERRIDE SCREEN RECORDING API (getDisplayMedia) ---
    let originalGetDisplayMedia = null;
    if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
      originalGetDisplayMedia = navigator.mediaDevices.getDisplayMedia;
      navigator.mediaDevices.getDisplayMedia = function () {
        triggerSecurityAlert('Screen Recording Blocked: Web Screen Capture API is restricted for non-admin roles.');
        return Promise.reject(new DOMException('Screen recording is prohibited for non-admin users.', 'NotAllowedError'));
      };
    }

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', (e) => {
      if (e.key === 'PrintScreen') {
        setBlurred(true);
        setTimeout(() => setBlurred(false), 2000);
      }
    });
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);

      if (originalGetDisplayMedia) {
        navigator.mediaDevices.getDisplayMedia = originalGetDisplayMedia;
      }
    };
  }, [isAdmin]);

  const triggerSecurityAlert = (msg) => {
    setWarningMessage(msg);
    setBlurred(true);
    setTimeout(() => {
      setWarningMessage('');
      setBlurred(false);
    }, 2500);
  };

  // If Admin, render clean children with no overlays
  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <div
      style={{
        position: 'relative',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        msUserSelect: 'none'
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        triggerSecurityAlert('Right-Click Context Menu Restricted for non-admin users.');
      }}
    >
      {/* Background Page Content */}
      <div
        style={{
          filter: blurred ? 'blur(30px) grayscale(100%)' : 'none',
          transition: 'filter 0.15s ease-in-out',
          pointerEvents: blurred ? 'none' : 'auto'
        }}
      >
        {children}
      </div>

      {/* Floating Dynamic Watermark for Non-Admin Users */}
      <div
        style={{
          position: 'fixed',
          bottom: '15px',
          right: '15px',
          background: 'rgba(15, 23, 42, 0.85)',
          color: '#60a5fa',
          padding: '0.4rem 0.8rem',
          borderRadius: '0.5rem',
          fontSize: '0.7rem',
          fontWeight: 700,
          letterSpacing: '0.05em',
          pointerEvents: 'none',
          zIndex: 9998,
          border: '1px solid rgba(96, 165, 250, 0.3)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem'
        }}
      >
        <Lock size={12} />
        <span>CONFIDENTIAL • {user?.email || 'NON-ADMIN'} • SCREENSHOT PROHIBITED</span>
      </div>

      {/* Security Blackout Overlay during Snipping / PrintScreen / Blur */}
      {blurred && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: '#090d16',
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            padding: '2rem',
            textAlign: 'center'
          }}
        >
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.5rem',
              border: '2px solid rgba(239, 68, 68, 0.4)'
            }}
          >
            <ShieldAlert size={44} style={{ color: '#ef4444' }} />
          </div>

          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f8fafc', marginBottom: '0.75rem' }}>
            SCREEN CAPTURE & RECORDING RESTRICTED
          </h2>

          <p style={{ color: '#94a3b8', maxWidth: '550px', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>
            {warningMessage || 'Screenshots, screen recording, and window focus snipping are prohibited for non-admin accounts to protect candidate privacy and sensitive corporate data.'}
          </p>

          <div
            style={{
              background: 'rgba(30, 41, 59, 0.8)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              padding: '0.75rem 1.25rem',
              borderRadius: '0.5rem',
              fontSize: '0.8rem',
              color: '#fca5a5',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <EyeOff size={16} />
            <span>Security Note: Return focus to application window to resume viewing.</span>
          </div>
        </div>
      )}
    </div>
  );
}
