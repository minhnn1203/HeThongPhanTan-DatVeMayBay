import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../api';

export default function RegisterPage() {
  const [form, setForm] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    email: '',
    address: '',
    dateOfBirth: '',
    cccd: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
    setError('');
  };

  const validate = () => {
    if (!form.username || !form.password || !form.fullName || !form.email) {
      return 'Vui long nhap day du thong tin bat buoc.';
    }
    if (form.password !== form.confirmPassword) {
      return 'Mat khau xac nhan khong khop.';
    }
    if (form.password.length < 6) {
      return 'Mat khau phai it nhat 6 ky tu.';
    }
    if (form.cccd && form.cccd.length !== 12 && form.cccd.length !== 9) {
      return 'So CCCD phai la 9 hoac 12 so.';
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await register({
        username: form.username,
        password: form.password,
        email: form.email,
        fullName: form.fullName,
        address: form.address || null,
        dateOfBirth: form.dateOfBirth || null,
        cccd: form.cccd || null
      });

      if (result.id || result.username || result.message) {
        setSuccess('Dang ky thanh cong! Vui long dang nhap.');
        setTimeout(() => navigate('/login'), 1500);
      } else {
        setError(result.message || 'Dang ky that bai. Vui long thu lai.');
      }
    } catch (err) {
      setError('Khong the ket noi den server. Vui long thu lai.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card register-card">
        <div className="auth-logo">✈ SkyTicket</div>
        <h1>Dang ky</h1>
        <p className="auth-subtitle">Tao tai khoan moi</p>

        {error && <div className="auth-error">{error}</div>}
        {success && <div className="auth-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Ho va ten <span className="required">*</span></label>
              <input
                type="text"
                value={form.fullName}
                onChange={handleChange('fullName')}
                placeholder="VD: Nguyen Van A"
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label>Ten dang nhap <span className="required">*</span></label>
              <input
                type="text"
                value={form.username}
                onChange={handleChange('username')}
                placeholder="Nhap ten dang nhap"
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Email <span className="required">*</span></label>
              <input
                type="email"
                value={form.email}
                onChange={handleChange('email')}
                placeholder="VD: email@example.com"
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label>So CCCD</label>
              <input
                type="text"
                value={form.cccd}
                onChange={handleChange('cccd')}
                placeholder="9 hoac 12 so"
                maxLength={12}
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Dia chi</label>
            <input
              type="text"
              value={form.address}
              onChange={handleChange('address')}
              placeholder="VD: 123 Nguyen Trai, Ha Noi"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Ngay sinh</label>
            <input
              type="date"
              value={form.dateOfBirth}
              onChange={handleChange('dateOfBirth')}
              disabled={loading}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Mat khau <span className="required">*</span></label>
              <input
                type="password"
                value={form.password}
                onChange={handleChange('password')}
                placeholder="It nhat 6 ky tu"
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label>Xac nhan mat khau <span className="required">*</span></label>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={handleChange('confirmPassword')}
                placeholder="Nhap lai mat khau"
                disabled={loading}
              />
            </div>
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Dang dang ky...' : 'Dang ky'}
          </button>
        </form>

        <p className="auth-switch">
          Da co tai khoan? <Link to="/login">Dang nhap ngay</Link>
        </p>
      </div>
    </div>
  );
}