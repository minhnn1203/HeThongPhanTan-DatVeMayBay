import React from 'react';
import ReactDOM from 'react-dom/client';
import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import App from './App';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import HomePage from './pages/HomePage';
import SearchFlightPage from './pages/SearchFlightPage';
import AdminFlightTicketPage from './pages/admin/AdminFlightTicketPage';

function ProtectedRoute({ children, requiredRole }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', height: '100vh' }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole === 'ADMIN') {
    const isAdmin = user.roles?.includes('ROLE_ADMIN') || user.roles?.includes('ADMIN');
    if (!isAdmin) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
}

function RoleRedirect() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const isAdmin = user.roles?.includes('ROLE_ADMIN') || user.roles?.includes('ADMIN');
  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }
  return <Navigate to="/search" replace />;
}

function SearchFlightRoute() {
  const { user } = useAuth();
  return <SearchFlightPage user={user} />;
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route path="/" element={<RoleRedirect />} />
          <Route path="/home" element={<HomePage />} />

          <Route
            path="/search"
            element={
              <ProtectedRoute>
                <SearchFlightRoute />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminFlightTicketPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
