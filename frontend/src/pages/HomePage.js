import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function HomePage() {
  const { logout } = useAuth();

  useEffect(() => {
    const go = confirm(
      'Chào mừng bạn đã đăng nhập!\n\nGiao diện đặt vé cho khách hàng đang được phát triển.\nNhấn OK để chuyển đến trang chủ (index.html), hoặc Cancel để ở lại.'
    );
    if (go) {
      window.location.href = '/';
    }
  }, []);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      fontFamily: 'sans-serif',
      backgroundColor: '#f5f5f5',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        padding: '40px',
        borderRadius: '12px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
        textAlign: 'center',
        maxWidth: '500px',
        width: '100%'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>✈</div>
        <h1 style={{ margin: '0 0 8px', color: '#333' }}>Chào mừng bạn!</h1>
        <p style={{ color: '#666', marginBottom: '24px' }}>
          Bạn đã đăng nhập với vai trò khách hàng.
          <br />
          Giao diện đặt vé cho khách hàng đang được phát triển.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => { window.location.href = '/'; }}
            style={{
              padding: '10px 24px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#0066cc',
              color: 'white',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Về trang chủ
          </button>
          <button
            onClick={() => { logout(); window.location.href = '/login'; }}
            style={{
              padding: '10px 24px',
              borderRadius: '8px',
              border: '1px solid #ddd',
              backgroundColor: 'white',
              color: '#666',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Đăng xuất
          </button>
        </div>
      </div>
    </div>
  );
}