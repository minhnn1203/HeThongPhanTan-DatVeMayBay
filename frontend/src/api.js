const apiBase = 'http://localhost:8080/api';
const jsonHeaders = { 'Content-Type': 'application/json' };

function handleResponse(response) {
  if (!response.ok) {
    return response.json().then(err => { throw new Error(err.error || err.message || `HTTP ${response.status}`); });
  }
  return response.json();
}

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ----- Auth -----
export async function login({ username, password }) {
  const response = await fetch(`${apiBase}/auth/login`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ username, password })
  });
  return response.json();
}

export async function register({ username, password, email, fullName, address, dateOfBirth, cccd }) {
  const response = await fetch(`${apiBase}/auth/register`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ username, password, email, fullName, address, dateOfBirth, cccd })
  });
  return response.json();
}

export async function getProfile(token) {
  const response = await fetch(`${apiBase}/auth/me`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.json();
}

export async function createOrder({ userId, flightId, quantity, token }) {
  const response = await fetch(`${apiBase}/orders`, {
    method: 'POST',
    headers: {
      ...jsonHeaders,
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ userId, flightId, quantity })
  });
  return response.json();
}

export async function createBooking({ userId, flightId, quantity, token }) {
  const response = await fetch(`${apiBase}/bookings`, {
    method: 'POST',
    headers: {
      ...jsonHeaders,
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ userId, flightId, quantity })
  });
  return handleResponse(response);
}

export async function getMyBookings(userId, token) {
  const response = await fetch(`${apiBase}/bookings?userId=${userId}`, {
    method: 'GET',
    headers: {
      ...jsonHeaders,
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });
  return handleResponse(response);
}

// ─── Flights (GET /api/flights → ProductController → ProductRepository → Product) ──
 
/**
 * Lấy toàn bộ danh sách chuyến bay.
 * AdminFlightTicketPage → loadAll() → GET /api/flights
 * → ProductController.getAll() → repository.findAll()
 */
export async function getFlights(token) {
  const response = await fetch(`${apiBase}/flights`, {
    method: 'GET',
    headers: { ...jsonHeaders, ...authHeaders(token) }
  });
  return handleResponse(response);
}
 
/**
 * Lấy một chuyến bay theo ID.
 * GET /api/flights/{id}
 * → ProductController.getById() → repository.findById()
 */
export async function getFlightById(id, token) {
  const response = await fetch(`${apiBase}/flights/${id}`, {
    method: 'GET',
    headers: { ...jsonHeaders, ...authHeaders(token) }
  });
  return handleResponse(response);
}
 
/**
 * Tạo chuyến bay mới.
 * AdminFlightTicketPage → submitFlight() → POST /api/flights
 * → ProductController.create() → repository.save(product)
 *
 * Body gửi lên khớp với các field trong entity Product:
 *   flightNumber, origin, destination, departureTime,
 *   availableSeats, price, airline, arrivalTime, aircraftType, status
 */
export async function createFlight(flightData, token) {
  const response = await fetch(`${apiBase}/flights`, {
    method: 'POST',
    headers: { ...jsonHeaders, ...authHeaders(token) },
    body: JSON.stringify(flightData)
  });
  return handleResponse(response);
}
 
/**
 * Cập nhật chuyến bay theo ID.
 * AdminFlightTicketPage → submitFlight() → PUT /api/flights/{id}
 * → ProductController.update() → existing.set*() → repository.save()
 */
export async function updateFlight(id, flightData, token) {
  const response = await fetch(`${apiBase}/flights/${id}`, {
    method: 'PUT',
    headers: { ...jsonHeaders, ...authHeaders(token) },
    body: JSON.stringify(flightData)
  });
  return handleResponse(response);
}
 
/**
 * Xóa chuyến bay theo ID.
 * AdminFlightTicketPage → deleteFlight() → DELETE /api/flights/{id}
 * → ProductController.delete() → repository.delete()
 */
export async function deleteFlight(id, token) {
  const response = await fetch(`${apiBase}/flights/${id}`, {
    method: 'DELETE',
    headers: { ...jsonHeaders, ...authHeaders(token) }
  });
  return handleResponse(response);
}

// ----- Notifications -----
export async function getNotifications(token) {
  const response = await fetch(`${apiBase}/notifications/admin`, {
    method: 'GET',
    headers: { ...jsonHeaders, ...authHeaders(token) }
  });
  return handleResponse(response);
}

export async function getUnreadNotificationCount(token) {
  const response = await fetch(`${apiBase}/notifications/admin/unread-count`, {
    method: 'GET',
    headers: { ...jsonHeaders, ...authHeaders(token) }
  });
  return handleResponse(response);
}

export async function markNotificationAsRead(id, token) {
  const response = await fetch(`${apiBase}/notifications/${id}/read`, {
    method: 'PATCH',
    headers: { ...jsonHeaders, ...authHeaders(token) }
  });
  return handleResponse(response);
}

export async function markAllNotificationsAsRead(token) {
  const response = await fetch(`${apiBase}/notifications/read-all`, {
    method: 'PATCH',
    headers: { ...jsonHeaders, ...authHeaders(token) }
  });
  return handleResponse(response);
}

export const authEndpoints = {
  login: `${apiBase}/auth/login`,
  register: `${apiBase}/auth/register`,
  profile: `${apiBase}/auth/me`
};