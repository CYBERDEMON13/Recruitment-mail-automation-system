import React, { useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Components & Layout
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

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
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-app)' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', borderColor: 'var(--primary-500)', borderTopColor: 'transparent' }}></div>
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

export default function App() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <div className="app-container">
              <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
              <div className="main-content">
                <Navbar />
                <main className="page-body">
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
                </main>
              </div>
            </div>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
