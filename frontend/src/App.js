import { useState } from 'react';
import { login, register } from './api';
import './styles.css';
import SearchFlightPage from './pages/SearchFlightPage';

const initialAuth = {
  username: '',
  password: '',
  fullName: '',
  email: ''
};

function App() {
  const [mode, setMode] = useState('login');
  const [authForm, setAuthForm] = useState(initialAuth);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('success');
  const [user, setUser] = useState(null);

  const handleChange = (field) => (event) => {
    setAuthForm({ ...authForm, [field]: event.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage(null);

    try {
      if (mode === 'login') {
        const result = await login({ username: authForm.username, password: authForm.password });
        if (result.token) {
          setUser({  
            username: authForm.username,  
            fullName: authForm.username,  
            token: "fake-jwt-token",  
            userId: 1
          });
          setMessageType('success');
          setMessage('Đăng nhập thành công! Chào mừng bạn đến hệ thống bán vé.');
        } else {
          throw new Error(result.message || 'Đăng nhập thất bại');
        }
      } else {
        const result = await register({
          username: authForm.username,
          password: authForm.password,
          fullName: authForm.fullName,
          email: authForm.email
        });
        if (result.id || result.username) {
          setMessageType('success');
          setMessage('Đăng ký thành công! Bạn có thể đăng nhập ngay bây giờ.');
          setMode('login');
          setAuthForm({ ...initialAuth, username: authForm.username });
        } else {
          throw new Error(result.message || 'Đăng ký thất bại');
        }
      }
    } catch (error) {
      setMessageType('error');
      setMessage(error.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
    }
  };

  const isLogin = mode === 'login';

  return (
    <div className="app-shell">
      <div className="auth-card">
        <div className="branding">
          <h1>SkyTicket</h1>
          <p>Quản lý đăng nhập và đăng ký vé máy bay với giao diện thẩm mỹ, đơn giản, chuẩn web bán vé.</p>
        </div>

        <div className="switcher">
          <button className={isLogin ? 'active' : ''} onClick={() => { setMode('login'); setMessage(null); }}>
            Đăng nhập
          </button>
          <button className={!isLogin ? 'active' : ''} onClick={() => { setMode('register'); setMessage(null); }}>
            Đăng ký
          </button>
        </div>

        {user ? (
          <div>
            <div className="message-box success">
              <strong>Xin chào, {user.fullName}!</strong>
              <p>
                Bạn đã đăng nhập thành công.
              </p>
            </div>

            <SearchFlightPage user={user} />
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="form-group">
                <label>
                  Họ và tên
                  <input type="text" value={authForm.fullName} onChange={handleChange('fullName')} placeholder="Nguyễn Văn A" required={!isLogin} />
                </label>
              </div>
            )}

            <div className="form-group">
              <label>
                Tên đăng nhập
                <input type="text" value={authForm.username} onChange={handleChange('username')} placeholder="email hoặc tên đăng nhập" required />
              </label>
            </div>

            <div className="form-group">
              <label>
                Mật khẩu
                <input type="password" value={authForm.password} onChange={handleChange('password')} placeholder="Mật khẩu an toàn" required />
              </label>
            </div>

            {!isLogin && (
              <div className="form-group">
                <label>
                  Email
                  <input type="email" value={authForm.email} onChange={handleChange('email')} placeholder="name@example.com" required />
                </label>
              </div>
            )}

            <div className="action-row">
              <button type="submit" className="primary-button">
                {isLogin ? 'Đăng nhập' : 'Tạo tài khoản'}
              </button>
              <span className="secondary-text">
                {isLogin ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}
                <button type="button" onClick={() => setMode(isLogin ? 'register' : 'login')}>
                  {isLogin ? 'Đăng ký ngay' : 'Đăng nhập'}
                </button>
              </span>
            </div>
          </form>
        )}

        {message && (
          <div className={`message-box ${messageType === 'error' ? 'error' : 'success'}`}>
            {message}
          </div>
        )}

        <div className="auth-footer">
          <span>
            <strong>API sẵn sàng:</strong> POST <code>/api/auth/login</code> hoặc <code>/api/auth/register</code>
          </span>
          <span>
            <strong>Backend gateway:</strong> <code>http://localhost:8080/api</code>
          </span>
        </div>
      </div>
    </div>
  );
}

export default App;
