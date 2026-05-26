import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login, getProfile } from '../api';

export default function LoginPage() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login: authLogin } = useAuth();
  const navigate = useNavigate();

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password) {
      setError('Vui long nhap day du thong tin.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await login({ username: form.username, password: form.password });

      if (result.token || result.jwt) {
        const token = result.token || result.jwt;

        // Fetch full user profile to get user.id
        let userId = null;
        try {
          const profile = await getProfile(token);
          userId = profile.id;
        } catch {
          // profile fetch failed, continue without userId
        }

        const userData = {
          id: userId,
          username: result.username || form.username,
          fullName: result.fullName || result.username || form.username,
          email: result.email || '',
          token: token,
          roles: result.roles || []
        };
        authLogin(userData);

        const isAdmin = (result.roles || []).includes('ROLE_ADMIN') || (result.roles || []).includes('ADMIN');
        navigate(isAdmin ? '/admin' : '/search', { replace: true });
      } else {
        setError(result.message || 'Dang nhap that bai. Vui long thu lai.');
      }
    } catch (err) {
      setError('Khong the ket noi den server. Vui long thu lai.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">✈ SkyTicket</div>
        <h1>Dang nhap</h1>
        <p className="auth-subtitle">He thong dat ve may bay</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Ten dang nhap</label>
            <input
              type="text"
              value={form.username}
              onChange={handleChange('username')}
              placeholder="Nhap ten dang nhap"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Mat khau</label>
            <input
              type="password"
              value={form.password}
              onChange={handleChange('password')}
              placeholder="Nhap mat khau"
              disabled={loading}
            />
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Dang dang nhap...' : 'Dang nhap'}
          </button>
        </form>

        <p className="auth-switch">
          Chua co tai khoan? <Link to="/register">Dang ky ngay</Link>
        </p>
      </div>
    </div>
  );
}
