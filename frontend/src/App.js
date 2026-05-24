import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', height: '100vh' }}>
        <p>Loading...</p>
      </div>
    );
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />;
}

function App() {
  return <ProtectedRoute />;
}

export default App;