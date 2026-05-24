import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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
  'CANCELLED',
  'CANCELLED_INVALID_QUANTITY'
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

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [flights, setFlights] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('flights');
  const [flightForm, setFlightForm] = useState(emptyFlight);
  const [editingFlightId, setEditingFlightId] = useState(null);
  const [flightKeyword, setFlightKeyword] = useState('');
  const [ticketKeyword, setTicketKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState({ type: '', text: '' });

  useEffect(() => {
    loadAll();
  }, []);

  const headers = useMemo(() => {
    const base = { 'Content-Type': 'application/json' };
    if (user?.token) {
      base.Authorization = `Bearer ${user.token}`;
    }
    return base;
  }, [user]);

  const stats = useMemo(() => {
    const totalSeats = flights.reduce((sum, f) => sum + Number(f.availableSeats || 0), 0);
    const revenue = orders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
    const confirmed = orders.filter((o) => String(o.status).includes('CONFIRMED')).length;
    return { totalFlights: flights.length, totalSeats, totalOrders: orders.length, confirmed, revenue };
  }, [flights, orders]);

  const filteredFlights = useMemo(() => {
    const kw = flightKeyword.trim().toLowerCase();
    if (!kw) return flights;
    return flights.filter((f) =>
      [f.flightNumber, f.origin, f.destination, f.departureTime].some((v) =>
        String(v || '').toLowerCase().includes(kw)
      )
    );
  }, [flights, flightKeyword]);

  const filteredOrders = useMemo(() => {
    const kw = ticketKeyword.trim().toLowerCase();
    if (!kw) return orders;
    return orders.filter((o) =>
      [o.id, o.flightId, o.customerEmail, o.passengerName, o.status].some((v) =>
        String(v || '').toLowerCase().includes(kw)
      )
    );
  }, [orders, ticketKeyword]);

  async function request(path, options = {}) {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: { ...headers, ...(options.headers || {}) }
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `Request failed: ${res.status}`);
    }
    if (res.status === 204) return null;
    const ct = res.headers.get('content-type') || '';
    return ct.includes('application/json') ? res.json() : res.text();
  }

  async function loadAll() {
    setLoading(true);
    setNotice({ type: '', text: '' });
    try {
      const [fd, od] = await Promise.all([request('/flights'), request('/orders')]);
      setFlights(Array.isArray(fd) ? fd : []);
      setOrders(Array.isArray(od) ? od : []);
    } catch (err) {
      setNotice({ type: 'error', text: `Loi tai du lieu: ${err.message}` });
    } finally {
      setLoading(false);
    }
  }

  function normalizePayload() {
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
    if (!payload.flightNumber || !payload.origin || !payload.destination || !payload.departureTime)
      return 'Vui long nhap day du thong tin bat buoc.';
    if (payload.origin === payload.destination)
      return 'Diem di va diem den khong duoc trung nhau.';
    if (payload.availableSeats < 0 || payload.price < 0)
      return 'So ghe va gia ve phai >= 0.';
    return '';
  }

  async function submitFlight(e) {
    e.preventDefault();
    const payload = normalizePayload();
    const err = validateFlight(payload);
    if (err) { setNotice({ type: 'error', text: err }); return; }

    setLoading(true);
    try {
      if (editingFlightId) {
        await request(`/flights/${editingFlightId}`, { method: 'PUT', body: JSON.stringify(payload) });
        setNotice({ type: 'success', text: 'Da cap nhat chuyen bay.' });
      } else {
        await request('/flights', { method: 'POST', body: JSON.stringify(payload) });
        setNotice({ type: 'success', text: 'Da them chuyen bay moi.' });
      }
      resetForm();
      loadAll();
    } catch (err) {
      setNotice({ type: 'error', text: `Loi: ${err.message}` });
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

  async function deleteFlight(id) {
    if (!window.confirm('Xoa chuyen bay nay?')) return;
    setLoading(true);
    try {
      await request(`/flights/${id}`, { method: 'DELETE' });
      setNotice({ type: 'success', text: 'Da xoa chuyen bay.' });
      loadAll();
    } catch (err) {
      setNotice({ type: 'error', text: `Loi xoa: ${err.message}` });
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setFlightForm(emptyFlight);
    setEditingFlightId(null);
  }

  async function changeOrderStatus(order, status) {
    setLoading(true);
    try {
      await request(`/orders/${order.id}`, {
        method: 'PUT',
        body: JSON.stringify({ quantity: Number(order.quantity || 1), status })
      });
      setNotice({ type: 'success', text: `Da cap nhat trang thai ve #${order.id}.` });
      loadAll();
    } catch (err) {
      setNotice({ type: 'error', text: `Loi: ${err.message}` });
    } finally {
      setLoading(false);
    }
  }

  async function deleteOrder(id) {
    if (!window.confirm('Xoa don dat ve nay?')) return;
    setLoading(true);
    try {
      await request(`/orders/${id}`, { method: 'DELETE' });
      setNotice({ type: 'success', text: 'Da xoa don dat ve.' });
      loadAll();
    } catch (err) {
      setNotice({ type: 'error', text: `Loi xoa: ${err.message}` });
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">✈</div>
          <div>
            <h1>Flight Admin</h1>
            <p>Quan ly chuyen bay</p>
          </div>
        </div>

        <nav className="nav">
          <button className={activeTab === 'flights' ? 'active' : ''} onClick={() => setActiveTab('flights')}>
            Chuyen bay
          </button>
          <button className={activeTab === 'tickets' ? 'active' : ''} onClick={() => setActiveTab('tickets')}>
            Ve da dat
          </button>
        </nav>

        <div className="user-info">
          <span>Xin chao, {user?.fullName || user?.username || 'Admin'}</span>
          <button className="ghost small" onClick={handleLogout}>Dang xuat</button>
        </div>
      </aside>

      <main className="content">
        <header className="topbar">
          <div>
            <p className="eyebrow">Admin Dashboard</p>
            <h2>He thong ban ve may bay</h2>
            <span>Gateway: {API_BASE}</span>
          </div>
          <button className="primary" onClick={loadAll} disabled={loading}>
            {loading ? 'Dang tai...' : 'Lam moi'}
          </button>
        </header>

        {notice.text && <div className={`notice ${notice.type}`}>{notice.text}</div>}

        <section className="stats-grid">
          <StatCard label="Tong chuyen bay" value={stats.totalFlights} />
          <StatCard label="Ghe con" value={stats.totalSeats} />
          <StatCard label="Tong don" value={stats.totalOrders} />
          <StatCard label="Da xac nhan" value={stats.confirmed} />
          <StatCard label="Doanh thu" value={fmtCurrency(stats.revenue)} wide />
        </section>

        {activeTab === 'flights' && (
          <>
            <section className="panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">{editingFlightId ? 'Cap nhat' : 'Tao moi'}</p>
                  <h3>{editingFlightId ? `Sua #${editingFlightId}` : 'Them chuyen bay'}</h3>
                </div>
                {editingFlightId && <button className="ghost" onClick={resetForm}>Huy sua</button>}
              </div>
              <form className="flight-form" onSubmit={submitFlight}>
                <Field label="Ma chuyen bay" placeholder="VD: VN123" value={flightForm.flightNumber}
                  onChange={(v) => setFlightForm({ ...flightForm, flightNumber: v.toUpperCase() })} />
                <SelectField label="Diem di" value={flightForm.origin}
                  onChange={(v) => setFlightForm({ ...flightForm, origin: extractCode(v) })} />
                <SelectField label="Diem den" value={flightForm.destination}
                  onChange={(v) => setFlightForm({ ...flightForm, destination: extractCode(v) })} />
                <Field label="Khoi hanh" type="datetime-local" value={flightForm.departureTime}
                  onChange={(v) => setFlightForm({ ...flightForm, departureTime: v })} />
                <Field label="So ghe" type="number" min="0" value={flightForm.availableSeats}
                  onChange={(v) => setFlightForm({ ...flightForm, availableSeats: v })} />
                <Field label="Gia ve (VND)" type="number" min="0" value={flightForm.price}
                  onChange={(v) => setFlightForm({ ...flightForm, price: v })} />
                <div className="form-actions">
                  <button className="primary" type="submit" disabled={loading}>
                    {editingFlightId ? 'Luu cap nhat' : 'Them chuyen bay'}
                  </button>
                  <button className="secondary" type="button" onClick={resetForm}>Nhap lai</button>
                </div>
              </form>
            </section>

            <section className="panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Danh sach</p>
                  <h3>Quan ly chuyen bay</h3>
                </div>
                <input className="search" placeholder="Tim chuyen bay..." value={flightKeyword}
                  onChange={(e) => setFlightKeyword(e.target.value)} />
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Ma</th><th>Hanh trinh</th><th>Khoi hanh</th><th>Ghe</th><th>Gia</th><th>Thao tac</th></tr>
                  </thead>
                  <tbody>
                    {filteredFlights.map((f) => (
                      <tr key={f.id}>
                        <td><strong>{f.flightNumber}</strong><span className="muted"> #{f.id}</span></td>
                        <td>{f.origin} → {f.destination}</td>
                        <td>{fmtDateTime(f.departureTime)}</td>
                        <td><span className={Number(f.availableSeats) <= 5 ? 'badge warning' : 'badge'}>{f.availableSeats}</span></td>
                        <td>{fmtCurrency(f.price)}</td>
                        <td>
                          <div className="row-actions">
                            <button className="secondary" onClick={() => editFlight(f)}>Sua</button>
                            <button className="danger" onClick={() => deleteFlight(f.id)}>Xoa</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!filteredFlights.length && <tr><td colSpan="6" className="empty">Chua co chuyen bay.</td></tr>}
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
                <p className="eyebrow">Theo doi</p>
                <h3>Danh sach don dat ve</h3>
              </div>
              <input className="search" placeholder="Tim don dat ve..." value={ticketKeyword}
                onChange={(e) => setTicketKeyword(e.target.value)} />
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>ID</th><th>Hanh khach</th><th>Chuyen bay</th><th>So luong</th><th>Tong tien</th><th>Trang thai</th><th>Thao tac</th></tr>
                </thead>
                <tbody>
                  {filteredOrders.map((o) => (
                    <tr key={o.id}>
                      <td><strong>#{o.id}</strong></td>
                      <td><strong>{o.passengerName || 'N/A'}</strong><span className="muted">{o.customerEmail || ''}</span></td>
                      <td>Flight #{o.flightId}</td>
                      <td>{o.quantity}</td>
                      <td>{fmtCurrency(o.totalAmount)}</td>
                      <td>
                        <select value={o.status || ''} onChange={(e) => changeOrderStatus(o, e.target.value)}>
                          <option value="">Chua co</option>
                          {orderStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td>
                        <button className="danger" onClick={() => deleteOrder(o.id)}>Xoa</button>
                      </td>
                    </tr>
                  ))}
                  {!filteredOrders.length && <tr><td colSpan="7" className="empty">Chua co don dat ve.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function StatCard({ label, value, wide }) {
  return <article className={`stat-card ${wide ? 'wide' : ''}`}><span>{label}</span><strong>{value}</strong></article>;
}

function Field({ label, type = 'text', value, onChange, ...props }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} {...props} />
    </label>
  );
}

function SelectField({ label, value, onChange }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input list="airports" value={value} placeholder="VD: HAN" onChange={(e) => onChange(e.target.value)} />
      <datalist id="airports">
        {airportSuggestions.map((a) => <option key={a} value={a} />)}
      </datalist>
    </label>
  );
}

function extractCode(v) { return String(v || '').split(' - ')[0].trim().toUpperCase(); }
function normalizeDateTime(v) { return !v ? '' : v.length === 16 ? `${v}:00` : v; }
function toDateTimeLocal(v) { return !v ? '' : String(v).slice(0, 16); }
function fmtCurrency(v) { return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Number(v || 0)); }
function fmtDateTime(v) {
  if (!v) return 'N/A';
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? v : new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(d);
}