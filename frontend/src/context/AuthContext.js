import { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

function extractRolesFromToken(token) {
  try {
    const decoded = jwtDecode(token);
    const roles = decoded.roles || decoded.authorities || decoded.role || [];
    if (typeof roles === 'string') {
      return [roles];
    }
    return Array.isArray(roles) ? roles : [];
  } catch {
    return [];
  }
}

function validateToken(token) {
  try {
    const decoded = jwtDecode(token);
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < now) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.token && validateToken(parsed.token)) {
          const roles = parsed.roles?.length
            ? parsed.roles
            : extractRolesFromToken(parsed.token);
          setUser({ ...parsed, roles });
        } else {
          localStorage.removeItem('user');
        }
      } catch {
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    const token = userData.token || userData.jwt;
    const roles = (userData.roles?.length
      ? userData.roles
      : token
        ? extractRolesFromToken(token)
        : []);
    const userWithToken = {
      ...userData,
      token,
      roles
    };
    localStorage.setItem('user', JSON.stringify(userWithToken));
    setUser(userWithToken);
  };

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  const isAdmin = () => {
    return user?.roles?.some(
      (r) => r === 'ROLE_ADMIN' || r === 'ADMIN' || r === 'ROLE_ADMIN,ROLE_USER'
    );
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}