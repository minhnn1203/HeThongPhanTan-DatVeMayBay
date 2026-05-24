const apiBase = 'http://localhost:8080/api';
const jsonHeaders = { 'Content-Type': 'application/json' };

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

export const authEndpoints = {
  login: `${apiBase}/auth/login`,
  register: `${apiBase}/auth/register`,
  profile: `${apiBase}/auth/me`
};
