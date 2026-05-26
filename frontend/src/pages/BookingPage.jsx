import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createBooking } from '../api';
import './BookingPage.css';

function BookingPage({ flight, onBack, user, onSuccess }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState({ type: '', text: '' });
  const [bookingResult, setBookingResult] = useState(null);

  const totalPrice = Number(flight.price || 0) * Number(quantity);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!user?.id) {
      setNotice({ type: 'error', text: 'Khong lay duoc thong tin nguoi dung. Vui long dang nhap lai.' });
      return;
    }

    if (!quantity || quantity < 1) {
      setNotice({ type: 'error', text: 'So luong ve phai lon hon 0.' });
      return;
    }

    if (Number(flight.availableSeats || 0) < quantity) {
      setNotice({ type: 'error', text: `Chi con ${flight.availableSeats} ghe trong. Vui long giam so luong.` });
      return;
    }

    setLoading(true);
    setNotice({ type: '', text: '' });

    try {
      const result = await createBooking({
        userId: user.id,
        flightId: flight.id,
        quantity: Number(quantity),
        token: user.token
      });

      if (result.id) {
        setBookingResult(result);
        setNotice({ type: 'success', text: 'Dat ve thanh cong!' });
      } else {
        throw new Error(result.error || result.message || 'Dat ve that bai.');
      }
    } catch (err) {
      setNotice({ type: 'error', text: err.message || 'Dat ve that bai. Vui long thu lai.' });
    } finally {
      setLoading(false);
    }
  }

  function handleBack() {
    if (onBack) {
      onBack();
    } else {
      navigate('/search');
    }
  }

  function handleBackToSearch() {
    if (onSuccess) {
      onSuccess();
    } else {
      handleBack();
    }
  }

  function handleLogout() {
    logout();
    navigate('/login');
  }

  function formatCurrency(value) {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(Number(value || 0));
  }

  function formatDateTime(value) {
    if (!value) return 'N/A';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat('vi-VN', {
      dateStyle: 'full',
      timeStyle: 'short'
    }).format(date);
  }

  const flightCode = flight.flightNumber || flight.name || `FL${flight.id}`;

  return (
    <div className="booking-shell">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">✈</div>
          <div>
            <h1>SkyTicket</h1>
            <p>Dat ve may bay</p>
          </div>
        </div>

        <button className="back-btn" type="button" onClick={handleBack}>
          ← Quay lai tim chuyen bay
        </button>

        <div className="auth-box">
          <p className="user-welcome">
            Xin chao, <strong>{user?.fullName || user?.username || 'Khach'}</strong>
          </p>
          <p className="user-email">{user?.email || ''}</p>
          <button className="back-btn" type="button" onClick={handleLogout}>
            Dang xuat
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="content">
        <header className="topbar">
          <p className="eyebrow">Customer Portal</p>
          <h2>Dat ve may bay</h2>
        </header>

        {notice.text && (
          <div className={`notice ${notice.type}`}>{notice.text}</div>
        )}

        {bookingResult ? (
          /* Success state */
          <div className="success-panel">
            <div className="success-icon">✓</div>
            <h3>Dat ve thanh cong!</h3>
            <p>
              Ve da duoc dat thanh cong. Ban se nhan email xac nhan trong thoi gian som.
            </p>

            <div className="booking-detail-card">
              <div className="booking-detail-row">
                <span className="booking-detail-label">Ma don</span>
                <span className="booking-detail-value">#{bookingResult.id}</span>
              </div>
              <div className="booking-detail-row">
                <span className="booking-detail-label">Chuyen bay</span>
                <span className="booking-detail-value">{flightCode}</span>
              </div>
              <div className="booking-detail-row">
                <span className="booking-detail-label">Hanh trinh</span>
                <span className="booking-detail-value">{flight.origin} → {flight.destination}</span>
              </div>
              <div className="booking-detail-row">
                <span className="booking-detail-label">Khoi hanh</span>
                <span className="booking-detail-value">{formatDateTime(flight.departureTime)}</span>
              </div>
              <div className="booking-detail-row">
                <span className="booking-detail-label">So luong ve</span>
                <span className="booking-detail-value">{bookingResult.quantity}</span>
              </div>
              <div className="booking-detail-row">
                <span className="booking-detail-label">Tong tien</span>
                <span className="booking-detail-value" style={{ color: '#2563eb' }}>
                  {formatCurrency(bookingResult.totalAmount)}
                </span>
              </div>
              <div className="booking-detail-row">
                <span className="booking-detail-label">Trang thai</span>
                <span className="booking-detail-value">{bookingResult.status}</span>
              </div>
              <div className="booking-detail-row">
                <span className="booking-detail-label">Email</span>
                <span className="booking-detail-value">{bookingResult.customerEmail || user?.email}</span>
              </div>
            </div>

            <div className="success-actions">
              <button className="book-btn" type="button" onClick={handleBackToSearch}>
                Tim chuyen bay khac
              </button>
              <button className="cancel-btn" type="button" onClick={handleBack}>
                Quay lai
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Flight detail card */}
            <section className="flight-card">
              <div className="flight-card-header">
                <h3>Chuyen bay: {flightCode}</h3>
                <span className="flight-id-badge">ID: {flight.id}</span>
              </div>

              <div className="flight-info-grid">
                <div className="info-item">
                  <span className="info-label">Diem di</span>
                  <span className="info-value">{flight.origin || 'N/A'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Diem den</span>
                  <span className="info-value">{flight.destination || 'N/A'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Khoi hanh</span>
                  <span className="info-value">{formatDateTime(flight.departureTime)}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Ghe trong</span>
                  <span className="info-value">{flight.availableSeats ?? 0}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Gia ve</span>
                  <span className="info-value highlight">{formatCurrency(flight.price)}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Hang hang khong</span>
                  <span className="info-value">{flight.airline || 'N/A'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Loai may bay</span>
                  <span className="info-value">{flight.aircraftType || 'N/A'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Trang thai</span>
                  <span className="info-value">{flight.status || 'SCHEDULED'}</span>
                </div>
              </div>
            </section>

            {/* Booking form */}
            <section className="booking-form-panel">
              <h3>Thong tin dat ve</h3>

              <form className="booking-form" onSubmit={handleSubmit}>
                <div className="field">
                  <span>Han khach</span>
                  <input
                    type="text"
                    value={user?.fullName || user?.username || ''}
                    disabled
                    style={{ background: '#f9fafb', color: '#6b7280' }}
                  />
                </div>

                <div className="field">
                  <span>Email</span>
                  <input
                    type="text"
                    value={user?.email || ''}
                    disabled
                    style={{ background: '#f9fafb', color: '#6b7280' }}
                  />
                </div>

                <div className="field">
                  <span>So luong ve</span>
                  <input
                    type="number"
                    min="1"
                    max={flight.availableSeats || 1}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  />
                </div>

                <div className="form-actions">
                  <button
                    className="book-btn"
                    type="submit"
                    disabled={loading || !user?.id}
                  >
                    {loading ? 'Dang xu ly...' : 'Xac nhan dat ve'}
                  </button>
                  <button
                    className="cancel-btn"
                    type="button"
                    onClick={handleBack}
                  >
                    Huy
                  </button>
                </div>
              </form>
            </section>

            {/* Summary */}
            <section className="summary-panel">
              <h3>Tong cong</h3>
              <div className="summary-row">
                <span className="summary-label">Chuyen bay</span>
                <span className="summary-value">{flightCode} ({flight.origin} → {flight.destination})</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Gia ve / 1 khach</span>
                <span className="summary-value">{formatCurrency(flight.price)}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">So luong</span>
                <span className="summary-value">{quantity} ve</span>
              </div>
              <div className="summary-total">
                <span>Tong tien</span>
                <span>{formatCurrency(totalPrice)}</span>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default BookingPage;