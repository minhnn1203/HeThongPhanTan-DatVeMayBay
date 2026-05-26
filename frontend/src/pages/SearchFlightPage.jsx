import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getFlights } from '../api';
import BookingPage from './BookingPage';
import './SearchFlightPage.css';

const airportSuggestions = [
  'HAN - Ha Noi',
  'SGN - Ho Chi Minh',
  'DAD - Da Nang',
  'CXR - Nha Trang',
  'PQC - Phu Quoc',
  'HUI - Hue',
  'VCA - Can Tho',
  'VII - Vinh'
];

function SearchFlightPage({ user }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [flights, setFlights] = useState([]);
  const [allFlights, setAllFlights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState({ type: '', text: '' });
  const [activeTab, setActiveTab] = useState('search');
  const [selectedFlight, setSelectedFlight] = useState(null);

  // Search filters
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [travelDate, setTravelDate] = useState('');

  useEffect(() => {
    loadFlights();
  }, []);

  async function loadFlights() {
    setLoading(true);
    setNotice({ type: '', text: '' });
    try {
      const data = await getFlights(user?.token);
      setFlights(Array.isArray(data) ? data : []);
      setAllFlights(Array.isArray(data) ? data : []);
    } catch (err) {
      setNotice({ type: 'error', text: `Khong tai duoc chuyen bay: ${err.message}` });
      setFlights([]);
      setAllFlights([]);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch() {
    const keywordOrigin = origin.trim().toLowerCase();
    const keywordDest = destination.trim().toLowerCase();

    const filtered = allFlights.filter((flight) => {
      const matchOrigin = !keywordOrigin ||
        (flight.origin && flight.origin.toLowerCase().includes(keywordOrigin)) ||
        (flight.name && flight.name.toLowerCase().includes(keywordOrigin));
      const matchDest = !keywordDest ||
        (flight.destination && flight.destination.toLowerCase().includes(keywordDest));
      return matchOrigin && matchDest;
    });

    setFlights(filtered);
    if (filtered.length === 0) {
      setNotice({ type: 'error', text: 'Khong tim thay chuyen bay phu hop.' });
    } else {
      setNotice({ type: '', text: '' });
    }
  }

  function handleLogout() {
    logout();
    navigate('/login');
  }

  function handleBook(flight) {
    setSelectedFlight(flight);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleBackToSearch() {
    setSelectedFlight(null);
    loadFlights();
  }

  function handleBookingSuccess() {
    setSelectedFlight(null);
    loadFlights();
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
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(date);
  }

  if (selectedFlight) {
    return (
      <BookingPage
        flight={selectedFlight}
        onBack={handleBackToSearch}
        user={user}
        onSuccess={handleBookingSuccess}
      />
    );
  }

  return (
    <div className="search-shell">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">✈</div>
          <div>
            <h1>SkyTicket</h1>
            <p>Dat ve may bay</p>
          </div>
        </div>

        <nav className="nav">
          <button
            className={activeTab === 'search' ? 'active' : ''}
            onClick={() => setActiveTab('search')}
          >
            Tim chuyen bay
          </button>
        </nav>

        <div className="auth-box">
          <p className="user-welcome">
            Xin chao, <strong>{user?.fullName || user?.username || 'Khach'}</strong>
          </p>
          <p className="user-email">{user?.email || ''}</p>
          <button className="logout-btn" type="button" onClick={handleLogout}>
            Dang xuat
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="content">
        <header className="topbar">
          <div>
            <p className="eyebrow">Customer Portal</p>
            <h2>Tim chuyen bay</h2>
          </div>
          <button
            className="search-btn"
            type="button"
            onClick={loadFlights}
            disabled={loading}
          >
            {loading ? 'Dang tai...' : 'Tai lai'}
          </button>
        </header>

        {notice.text && (
          <div className={`notice ${notice.type}`}>{notice.text}</div>
        )}

        {/* Search panel */}
        <section className="search-panel">
          <h3>Tim kiem chuyen bay</h3>
          <div className="search-form">
            <label className="field">
              <span>Diem di</span>
              <input
                list="origins"
                placeholder="VD: HAN"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
              />
              <datalist id="origins">
                {airportSuggestions.map((a) => (
                  <option key={a} value={a.split(' - ')[0]} />
                ))}
              </datalist>
            </label>

            <label className="field">
              <span>Diem den</span>
              <input
                list="destinations"
                placeholder="VD: SGN"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
              />
              <datalist id="destinations">
                {airportSuggestions.map((a) => (
                  <option key={a} value={a.split(' - ')[0]} />
                ))}
              </datalist>
            </label>

            <label className="field">
              <span>Ngay bay</span>
              <input
                type="date"
                value={travelDate}
                onChange={(e) => setTravelDate(e.target.value)}
              />
            </label>

            <button
              className="search-btn"
              type="button"
              onClick={handleSearch}
              disabled={loading}
              style={{ alignSelf: 'end' }}
            >
              Tim kiem
            </button>
          </div>
        </section>

        {/* Results panel */}
        <section className="table-panel">
          <div className="panel-header">
            <h3>Danh sach chuyen bay</h3>
            <span className="count-badge">{flights.length} chuyen bay</span>
          </div>

          {loading ? (
            <div className="loading">Dang tai danh sach chuyen bay...</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Ma chuyen</th>
                    <th>Hanh trinh</th>
                    <th>Khoi hanh</th>
                    <th>Ghe trong</th>
                    <th>Gia ve</th>
                    <th>Trang thai</th>
                    <th>Thao tac</th>
                  </tr>
                </thead>
                <tbody>
                  {flights.map((flight) => (
                    <tr key={flight.id}>
                      <td>
                        <span className="flight-code">{flight.flightNumber || flight.name || `FL${flight.id}`}</span>
                        <span className="flight-id">ID: {flight.id}</span>
                      </td>
                      <td>
                        <span className="route">{flight.origin || '?'} → {flight.destination || '?'}</span>
                      </td>
                      <td>{formatDateTime(flight.departureTime)}</td>
                      <td>
                        <span className={Number(flight.availableSeats || 0) <= 5 ? 'status-badge status-cancelled' : 'status-badge status-scheduled'}>
                          {flight.availableSeats ?? 0}
                        </span>
                      </td>
                      <td><span className="price">{formatCurrency(flight.price)}</span></td>
                      <td>
                        <span className={`status-badge ${(flight.status || '').toLowerCase().includes('cancel') ? 'status-cancelled' : 'status-scheduled'}`}>
                          {flight.status || 'SCHEDULED'}
                        </span>
                      </td>
                      <td>
                        <button
                          className="book-btn"
                          onClick={() => handleBook(flight)}
                          disabled={Number(flight.availableSeats || 0) <= 0}
                        >
                          Dat ve
                        </button>
                      </td>
                    </tr>
                  ))}

                  {!flights.length && (
                    <tr>
                      <td colSpan="7" className="empty">
                        Khong co chuyen bay nao. Vui long thay doi dieu kien tim kiem hoac tai lai danh sach.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default SearchFlightPage;