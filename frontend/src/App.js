import { useEffect, useState } from 'react';

const apiBase = 'http://localhost:8080/api';

function App() {
  const [users, setUsers] = useState([]);
  const [flights, setFlights] = useState([]);
  const [orders, setOrders] = useState([]);
  const [form, setForm] = useState({ userId: '', flightId: '', quantity: 1 });

  useEffect(() => {
    fetch(`${apiBase}/users`).then(r => r.json()).then(setUsers).catch(console.error);
    fetch(`${apiBase}/flights`).then(r => r.json()).then(setFlights).catch(console.error);
    fetch(`${apiBase}/orders`).then(r => r.json()).then(setOrders).catch(console.error);
  }, []);

  const createOrder = async () => {
    const body = {
      userId: Number(form.userId),
      flightId: Number(form.flightId),
      quantity: Number(form.quantity)
    };
    await fetch(`${apiBase}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    window.location.reload();
  };

  return (
    <div style={{ padding: 24, fontFamily: 'Arial, sans-serif' }}>
      <h1>Flight Booking Microservices</h1>

      <section>
        <h2>Users</h2>
        <pre>{JSON.stringify(users, null, 2)}</pre>
      </section>

      <section>
        <h2>Flights</h2>
        <pre>{JSON.stringify(flights, null, 2)}</pre>
      </section>

      <section>
        <h2>Orders</h2>
        <pre>{JSON.stringify(orders, null, 2)}</pre>
      </section>

      <section>
        <h2>Create Order</h2>
        <div>
          <label>User ID <input value={form.userId} onChange={e => setForm({ ...form, userId: e.target.value })} /></label>
        </div>
        <div>
          <label>Flight ID <input value={form.flightId} onChange={e => setForm({ ...form, flightId: e.target.value })} /></label>
        </div>
        <div>
          <label>Quantity <input type='number' value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} /></label>
        </div>
        <button onClick={createOrder}>Create Order</button>
      </section>
    </div>
  );
}

export default App;
