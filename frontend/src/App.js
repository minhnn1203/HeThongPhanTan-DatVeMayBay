feature/admin-flight-ticket-ui
import { useEffect, useMemo, useState } from 'react';
import './App.css';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api';

const emptyFlight = {
  flightNumber: '',
  origin: '',
  destination: '',
  departureTime: '',
  availableSeats: 0,
  price: 0
};

const orderStatuses = [
  'PENDING_INVENTORY',
  'CONFIRMED',
  'CANCELLED_OUT_OF_STOCK',
  'CANCELLED_FLIGHT_NOT_FOUND',
  'CANCELLED'
];

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

function App() {
  const [flights, setFlights] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('flights');
  const [flightForm, setFlightForm] = useState(emptyFlight);
  const [editingFlightId, setEditingFlightId] = useState(null);
  const [flightKeyword, setFlightKeyword] = useState('');
  const [ticketKeyword, setTicketKeyword] = useState('');
  const [token, setToken] = useState(localStorage.getItem('adminJwtToken') || '');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState({ type: '', text: '' });

  useEffect(() => {
    loadAll();
  }, []);

  const headers = useMemo(() => {
    const baseHeaders = { 'Content-Type': 'application/json' };
    if (token.trim()) {
      baseHeaders.Authorization = `Bearer ${token.trim()}`;
    }
    return baseHeaders;
  }, [token]);

  const stats = useMemo(() => {
    const totalSeats = flights.reduce((sum, flight) => sum + Number(flight.availableSeats || 0), 0);
    const revenue = orders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);
    const confirmed = orders.filter((order) => String(order.status).includes('CONFIRMED')).length;

    return {
      totalFlights: flights.length,
      totalSeats,
      totalOrders: orders.length,
      confirmed,
      revenue
    };
  }, [flights, orders]);

  const filteredFlights = useMemo(() => {
    const keyword = flightKeyword.trim().toLowerCase();
    if (!keyword) return flights;

    return flights.filter((flight) => {
      return [
        flight.flightNumber,
        flight.origin,
        flight.destination,
        flight.departureTime
      ].some((value) => String(value || '').toLowerCase().includes(keyword));
    });
  }, [flights, flightKeyword]);

  const filteredOrders = useMemo(() => {
    const keyword = ticketKeyword.trim().toLowerCase();
    if (!keyword) return orders;

    return orders.filter((order) => {
      return [
        order.id,
        order.flightId,
        order.customerEmail,
        order.passengerName,
        order.status
      ].some((value) => String(value || '').toLowerCase().includes(keyword));
    });
  }, [orders, ticketKeyword]);

  async function request(path, options = {}) {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        ...headers,
        ...(options.headers || {})
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Request failed with status ${response.status}`);
    }

    if (response.status === 204) return null;

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return response.json();
    }

    return response.text();
  }

  async function loadAll() {
    setLoading(true);
    setNotice({ type: '', text: '' });

    try {
      const [flightData, orderData] = await Promise.all([
        request('/flights'),
        request('/orders')
      ]);

      setFlights(Array.isArray(flightData) ? flightData : []);
      setOrders(Array.isArray(orderData) ? orderData : []);
    } catch (error) {
      setNotice({
        type: 'error',
        text: `Không tải được dữ liệu. Kiểm tra API Gateway hoặc backend. Chi tiết: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  }

  function saveToken() {
    localStorage.setItem('adminJwtToken', token.trim());
    setNotice({ type: 'success', text: 'Đã lưu JWT Admin vào trình duyệt.' });
  }

  function clearToken() {
    localStorage.removeItem('adminJwtToken');
    setToken('');
    setNotice({ type: 'success', text: 'Đã xóa JWT Admin.' });
  }

  function normalizeFlightPayload() {
    return {
      flightNumber: flightForm.flightNumber.trim(),
      origin: flightForm.origin.trim(),
      destination: flightForm.destination.trim(),
      departureTime: normalizeDateTime(flightForm.departureTime),
      availableSeats: Number(flightForm.availableSeats),
      price: Number(flightForm.price)
    };
  }

  function validateFlight(payload) {
    if (!payload.flightNumber || !payload.origin || !payload.destination || !payload.departureTime) {
      return 'Vui lòng nhập đủ mã chuyến bay, điểm đi, điểm đến và thời gian khởi hành.';
    }

    if (payload.origin === payload.destination) {
      return 'Điểm đi và điểm đến không được trùng nhau.';
    }

    if (payload.availableSeats < 0 || payload.price < 0) {
      return 'Số ghế và giá vé phải lớn hơn hoặc bằng 0.';
    }

    return '';
  }

  async function submitFlight(event) {
    event.preventDefault();

    const payload = normalizeFlightPayload();
    const validationError = validateFlight(payload);

    if (validationError) {
      setNotice({ type: 'error', text: validationError });
      return;
    }

    setLoading(true);

    try {
      if (editingFlightId) {
        await request(`/flights/${editingFlightId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        setNotice({ type: 'success', text: 'Đã cập nhật chuyến bay.' });
      } else {
        await request('/flights', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        setNotice({ type: 'success', text: 'Đã thêm chuyến bay mới.' });
      }

      resetFlightForm();
      await loadAll();
    } catch (error) {
      setNotice({ type: 'error', text: `Không lưu được chuyến bay: ${error.message}` });
    } finally {
      setLoading(false);
    }
  }

  function editFlight(flight) {
    setActiveTab('flights');
    setEditingFlightId(flight.id);
    setFlightForm({
      flightNumber: flight.flightNumber || '',
      origin: flight.origin || '',
      destination: flight.destination || '',
      departureTime: toDateTimeLocal(flight.departureTime || ''),
      availableSeats: flight.availableSeats ?? 0,
      price: flight.price ?? 0
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function deleteFlight(flightId) {
    const agreed = window.confirm('Xóa chuyến bay này? Thao tác này không thể hoàn tác.');
    if (!agreed) return;

    setLoading(true);

    try {
      await request(`/flights/${flightId}`, { method: 'DELETE' });
      setNotice({ type: 'success', text: 'Đã xóa chuyến bay.' });
      await loadAll();
    } catch (error) {
      setNotice({ type: 'error', text: `Không xóa được chuyến bay: ${error.message}` });
    } finally {
      setLoading(false);
    }
  }

  function resetFlightForm() {
    setFlightForm(emptyFlight);
    setEditingFlightId(null);
  }

  async function changeOrderStatus(order, status) {
    setLoading(true);

    try {
      await request(`/orders/${order.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          quantity: Number(order.quantity || 1),
          status
        })
      });

      setNotice({ type: 'success', text: `Đã cập nhật trạng thái vé #${order.id}.` });
      await loadAll();
    } catch (error) {
      setNotice({ type: 'error', text: `Không cập nhật được vé: ${error.message}` });
    } finally {
      setLoading(false);
    }
  }

  async function deleteOrder(orderId) {
    const agreed = window.confirm('Xóa vé/đơn đặt vé này?');
    if (!agreed) return;

    setLoading(true);

    try {
      await request(`/orders/${orderId}`, { method: 'DELETE' });
      setNotice({ type: 'success', text: 'Đã xóa vé/đơn đặt vé.' });
      await loadAll();
    } catch (error) {
      setNotice({ type: 'error', text: `Không xóa được vé: ${error.message}` });
    } finally {
      setLoading(false);
    }
  }

import { useState } from 'react';
import { login, register } from './api';
import './styles.css';

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
          setUser({ username: authForm.username, fullName: result.fullName || authForm.username });
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
 main

  const isLogin = mode === 'login';

  return (
 feature/admin-flight-ticket-ui
    <div className="admin-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">✈</div>
          <div>
            <h1>Flight Admin</h1>
            <p>Quản lý chuyến bay & vé</p>
          </div>
        </div>

        <nav className="nav">
          <button className={activeTab === 'flights' ? 'active' : ''} onClick={() => setActiveTab('flights')}>
            Chuyến bay
          </button>
          <button className={activeTab === 'tickets' ? 'active' : ''} onClick={() => setActiveTab('tickets')}>
            Vé đã đặt
          </button>
        </nav>

        <div className="auth-box">
          <label>JWT Admin</label>
          <textarea
            rows="5"
            placeholder="Dán token Admin vào đây nếu backend đã bật JWT"
            value={token}
            onChange={(event) => setToken(event.target.value)}
          />
          <div className="inline-actions">
            <button className="secondary" type="button" onClick={saveToken}>Lưu token</button>
            <button className="ghost" type="button" onClick={clearToken}>Xóa</button>
          </div>
        </div>
      </aside>

      <main className="content">
        <header className="topbar">
          <div>
            <p className="eyebrow">Admin Dashboard</p>
            <h2>Hệ thống mua bán vé máy bay</h2>
            <span>Gọi API qua Gateway: {API_BASE}</span>
          </div>

          <button className="primary" type="button" onClick={loadAll} disabled={loading}>
            {loading ? 'Đang tải...' : 'Làm mới dữ liệu'}
          </button>
        </header>

        {notice.text && <div className={`notice ${notice.type}`}>{notice.text}</div>}

        <section className="stats-grid">
          <StatCard label="Tổng chuyến bay" value={stats.totalFlights} />
          <StatCard label="Ghế còn bán" value={stats.totalSeats} />
          <StatCard label="Tổng vé/đơn" value={stats.totalOrders} />
          <StatCard label="Vé xác nhận" value={stats.confirmed} />
          <StatCard label="Doanh thu" value={formatCurrency(stats.revenue)} wide />
        </section>

        {activeTab === 'flights' && (
          <>
            <section className="panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">{editingFlightId ? 'Cập nhật' : 'Tạo mới'}</p>
                  <h3>{editingFlightId ? `Sửa chuyến bay #${editingFlightId}` : 'Thêm chuyến bay'}</h3>
                </div>
                {editingFlightId && (
                  <button className="ghost" type="button" onClick={resetFlightForm}>
                    Hủy sửa
                  </button>
                )}
              </div>

              <form className="flight-form" onSubmit={submitFlight}>
                <Input
                  label="Mã chuyến bay"
                  placeholder="VD: VN123"
                  value={flightForm.flightNumber}
                  onChange={(value) => setFlightForm({ ...flightForm, flightNumber: value.toUpperCase() })}
                />

                <SelectInput
                  label="Điểm đi"
                  value={flightForm.origin}
                  onChange={(value) => setFlightForm({ ...flightForm, origin: extractAirportCode(value) })}
                />

                <SelectInput
                  label="Điểm đến"
                  value={flightForm.destination}
                  onChange={(value) => setFlightForm({ ...flightForm, destination: extractAirportCode(value) })}
                />

                <Input
                  label="Thời gian khởi hành"
                  type="datetime-local"
                  value={flightForm.departureTime}
                  onChange={(value) => setFlightForm({ ...flightForm, departureTime: value })}
                />

                <Input
                  label="Số ghế còn bán"
                  type="number"
                  min="0"
                  value={flightForm.availableSeats}
                  onChange={(value) => setFlightForm({ ...flightForm, availableSeats: value })}
                />

                <Input
                  label="Giá vé"
                  type="number"
                  min="0"
                  value={flightForm.price}
                  onChange={(value) => setFlightForm({ ...flightForm, price: value })}
                />

                <div className="form-actions">
                  <button className="primary" type="submit" disabled={loading}>
                    {editingFlightId ? 'Lưu cập nhật' : 'Thêm chuyến bay'}
                  </button>
                  <button className="secondary" type="button" onClick={resetFlightForm}>
                    Nhập lại
                  </button>
                </div>
              </form>
            </section>

            <section className="panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Danh sách</p>
                  <h3>Quản lý chuyến bay</h3>
                </div>
                <input
                  className="search"
                  placeholder="Tìm mã chuyến, điểm đi, điểm đến..."
                  value={flightKeyword}
                  onChange={(event) => setFlightKeyword(event.target.value)}
                />
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Mã chuyến</th>
                      <th>Hành trình</th>
                      <th>Khởi hành</th>
                      <th>Ghế</th>
                      <th>Giá vé</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFlights.map((flight) => (
                      <tr key={flight.id}>
                        <td>
                          <strong>{flight.flightNumber}</strong>
                          <span className="muted">ID: {flight.id}</span>
                        </td>
                        <td>
                          <span className="route">{flight.origin} → {flight.destination}</span>
                        </td>
                        <td>{formatDateTime(flight.departureTime)}</td>
                        <td>
                          <span className={Number(flight.availableSeats) <= 5 ? 'badge warning' : 'badge'}>
                            {flight.availableSeats}
                          </span>
                        </td>
                        <td>{formatCurrency(flight.price)}</td>
                        <td>
                          <div className="row-actions">
                            <button className="secondary" type="button" onClick={() => editFlight(flight)}>
                              Sửa
                            </button>
                            <button className="danger" type="button" onClick={() => deleteFlight(flight.id)}>
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {!filteredFlights.length && (
                      <tr>
                        <td colSpan="6" className="empty">Chưa có chuyến bay phù hợp.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        {activeTab === 'tickets' && (
          <section className="panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Theo dõi vé</p>
                <h3>Danh sách vé/đơn đặt vé</h3>
              </div>
              <input
                className="search"
                placeholder="Tìm mã vé, email, hành khách, trạng thái..."
                value={ticketKeyword}
                onChange={(event) => setTicketKeyword(event.target.value)}
              />
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Mã vé</th>
                    <th>Hành khách</th>
                    <th>Chuyến bay</th>
                    <th>Số lượng</th>
                    <th>Tổng tiền</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.id}>
                      <td><strong>#{order.id}</strong></td>
                      <td>
                        <strong>{order.passengerName || 'N/A'}</strong>
                        <span className="muted">{order.customerEmail || 'Chưa có email'}</span>
                      </td>
                      <td>Flight ID: {order.flightId}</td>
                      <td>{order.quantity}</td>
                      <td>{formatCurrency(order.totalAmount)}</td>
                      <td>
                        <select
                          value={order.status || ''}
                          onChange={(event) => changeOrderStatus(order, event.target.value)}
                        >
                          <option value="">Chưa có trạng thái</option>
                          {orderStatuses.map((status) => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <button className="danger" type="button" onClick={() => deleteOrder(order.id)}>
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))}

                  {!filteredOrders.length && (
                    <tr>
                      <td colSpan="7" className="empty">Chưa có vé/đơn đặt vé phù hợp.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>

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
          <div className="message-box success">
            <strong>Xin chào, {user.fullName}!</strong>
            <p>Bạn đã đăng nhập thành công. Tiếp tục đặt vé hoặc quản lý thông tin cá nhân tại backend.</p>
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
 main
    </div>
  );
}

function StatCard({ label, value, wide }) {
  return (
    <article className={`stat-card ${wide ? 'wide' : ''}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function Input({ label, type = 'text', value, onChange, ...props }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        {...props}
      />
    </label>
  );
}

function SelectInput({ label, value, onChange }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        list="airports"
        value={value}
        placeholder="VD: HAN"
        onChange={(event) => onChange(event.target.value)}
      />
      <datalist id="airports">
        {airportSuggestions.map((airport) => (
          <option key={airport} value={airport} />
        ))}
      </datalist>
    </label>
  );
}

function extractAirportCode(value) {
  return String(value || '').split(' - ')[0].trim().toUpperCase();
}

function normalizeDateTime(value) {
  if (!value) return '';
  return value.length === 16 ? `${value}:00` : value;
}

function toDateTimeLocal(value) {
  if (!value) return '';
  return String(value).slice(0, 16);
}

function formatCurrency(value) {
  const numberValue = Number(value || 0);
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0
  }).format(numberValue);
}

function formatDateTime(value) {
  if (!value) return 'N/A';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(date);
}

export default App;
