const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://2.28.226.212'

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function login(email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) throw new Error('Invalid credentials')
  return res.json()
}

export async function signup(email: string, password: string, name: string, company: string) {
  const res = await fetch(`${API_BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name, company }),
  })
  if (!res.ok) throw new Error('Signup failed')
  return res.json()
}

export async function logout() {
  await fetch(`${API_BASE}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  })
  localStorage.removeItem('access_token')
}

// ── Token helpers ─────────────────────────────────────────────────────────────

export function getToken(): string | null {
  return localStorage.getItem('access_token')
}

export function setToken(token: string) {
  localStorage.setItem('access_token', token)
}

export function clearToken() {
  localStorage.removeItem('access_token')
}

function authHeaders() {
  const token = getToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

// ── JD Builder ────────────────────────────────────────────────────────────────

export async function createSession(message: string) {
  const res = await fetch(`${API_BASE}/jd-builder/sessions`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ initial_message: message }),
  })
  if (res.status === 401) throw new Error('unauthorized')
  if (!res.ok) throw new Error('Failed to create session')
  return res.json()
}

export async function sendMessage(sessionId: string, message: string) {
  const res = await fetch(`${API_BASE}/jd-builder/sessions/${sessionId}/message`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ message }),
  })
  if (res.status === 401) throw new Error('unauthorized')
  if (!res.ok) throw new Error('Failed to send message')
  return res.json()
}

export async function approveJD(sessionId: string) {
  return sendMessage(sessionId, 'Approved')
}

export async function requestChanges(sessionId: string, changes: string) {
  return sendMessage(sessionId, changes)
}