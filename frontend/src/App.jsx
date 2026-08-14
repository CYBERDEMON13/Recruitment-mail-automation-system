import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Components & Layout
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import ScreenCaptureGuard from './components/ScreenCaptureGuard';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CandidateManagementPage from './pages/CandidateManagementPage';
import ImportCandidatesPage from './pages/ImportCandidatesPage';
import DocumentGeneratorPage from './pages/DocumentGeneratorPage';
import EmailTemplatesPage from './pages/EmailTemplatesPage';
import EmailComposerPage from './pages/EmailComposerPage';
import EmailHistoryPage from './pages/EmailHistoryPage';
import SettingsPage from './pages/SettingsPage';
import UserProfilePage from './pages/UserProfilePage';
import DatabaseExplorerPage from './pages/DatabaseExplorerPage';
import UserAccessManagementPage from './pages/UserAccessManagementPage';
import SocDashboardPage from './pages/SocDashboardPage';

function ProtectedRoute({ children }) {
  const { user, token, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-app)', flexDirection: 'column', gap: '1rem' }}>
        <div style={{
          width: '48px', height: '48px',
          border: '3px solid rgba(59, 130, 246, 0.15)',
          borderTop: '3px solid var(--primary-500)',
          borderRadius: '50%',
          animation: 'spin 0.7s linear infinite'
        }} />
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Authenticating...</p>
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

function AdminRoute({ children }) {
  const { user } = useAuth();
  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  return children;
}

// Animated page wrapper that re-mounts on route change
function AnimatedPage({ children }) {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState('enter');

  useEffect(() => {
    if (location.pathname !== displayLocation.pathname) {
      setTransitionStage('exit');
      const timer = setTimeout(() => {
        setDisplayLocation(location);
        setTransitionStage('enter');
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [location, displayLocation]);

  return (
    <div
      key={displayLocation.pathname}
      className="page-transition-wrapper"
      style={{
        opacity: transitionStage === 'exit' ? 0 : 1,
        transform: transitionStage === 'exit' ? 'translateY(6px)' : 'translateY(0)',
        transition: 'opacity 0.15s ease, transform 0.15s ease',
      }}
    >
      {children}
    </div>
  );
}

export default function App() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <ScreenCaptureGuard>
              <div className="app-container">
                <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
                <div className="main-content">
                  <Navbar />
                  <main className="page-body">
                    <AnimatedPage>
                      <Routes>
                        <Route path="/" element={<DashboardPage />} />
                        <Route path="/candidates" element={<CandidateManagementPage />} />
                        <Route path="/import-candidates" element={<ImportCandidatesPage />} />
                        <Route path="/documents" element={<DocumentGeneratorPage />} />
                        <Route path="/templates" element={<EmailTemplatesPage />} />
                        <Route path="/composer" element={<EmailComposerPage />} />
                        <Route path="/email-history" element={<EmailHistoryPage />} />
                        <Route path="/settings" element={<SettingsPage />} />
                        <Route path="/profile" element={<UserProfilePage />} />
                        <Route path="/database" element={<AdminRoute><DatabaseExplorerPage /></AdminRoute>} />
                        <Route path="/users" element={<AdminRoute><UserAccessManagementPage /></AdminRoute>} />
                        <Route path="/soc-dashboard" element={<AdminRoute><SocDashboardPage /></AdminRoute>} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                      </Routes>
                    </AnimatedPage>
                  </main>
                </div>
              </div>
            </ScreenCaptureGuard>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
