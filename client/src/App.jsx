import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import WorkerPortal from './pages/WorkerPortal';
import AdminDashboard from './pages/AdminDashboard';

import ErrorBoundary from './components/ErrorBoundary';

function ProtectedAdminRoute({ children }) {
  const { isAuthenticated, loading, isAdmin } = useAuth();
  if (loading) return null;
  if (!isAuthenticated || !isAdmin) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex flex-col font-sans selection:bg-[var(--primary)] selection:text-[var(--primary-foreground)] transition-colors duration-200">
              <Navbar />
              <main className="flex-1">
                <ErrorBoundary>
                  <Routes>
                    <Route path="/" element={<WorkerPortal />} />
                    <Route
                      path="/admin"
                      element={
                        <ProtectedAdminRoute>
                          <AdminDashboard />
                        </ProtectedAdminRoute>
                      }
                    />
                  </Routes>
                </ErrorBoundary>
              </main>
            </div>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
