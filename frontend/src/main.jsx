import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import App from './App';
import './index.css';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const isClerkConfigured = !!(PUBLISHABLE_KEY && PUBLISHABLE_KEY.startsWith('pk_') && !PUBLISHABLE_KEY.includes('YOUR_CLERK_PUBLISHABLE_KEY'));

const AppContent = (
  <BrowserRouter>
    <ToastProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ToastProvider>
  </BrowserRouter>
);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isClerkConfigured ? (
      <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
        {AppContent}
      </ClerkProvider>
    ) : (
      AppContent
    )}
  </React.StrictMode>
);

