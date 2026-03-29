import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

// ─── API helper — all calls go through here ──────────────────
const API = import.meta.env.VITE_API_URL || '/api'

async function getToken() {
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token
}

async function request(method, path, body = null, isFormData = false) {
  const token = await getToken()
  const headers = { Authorization: `Bearer ${token}` }
  if (!isFormData) headers['Content-Type'] = 'application/json'

  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: isFormData ? body : body ? JSON.stringify(body) : null,
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

export const api = {
  // Auth
  signup:  (email, password) => request('POST', '/auth/signup',  { email, password }),
  login:   (email, password) => request('POST', '/auth/login',   { email, password }),
  logout:  ()                => request('POST', '/auth/logout'),
  me:      ()                => request('GET',  '/auth/me'),

  // Documents
  getDocs:    (params = {}) => request('GET',    '/documents?' + new URLSearchParams(params)),
  getStats:   ()            => request('GET',    '/documents/stats'),
  getDoc:     (id)          => request('GET',    `/documents/${id}`),
  createDoc:  (body)        => request('POST',   '/documents', body),
  updateDoc:  (id, body)    => request('PATCH',  `/documents/${id}`, body),
  deleteDoc:  (id)          => request('DELETE', `/documents/${id}`),
  sendDoc:    (id)          => request('POST',   `/documents/${id}/send`),
  getDocPdf:  (id)          => request('GET',    `/documents/${id}/pdf`),

  // Signing (public)
  getSignDoc: (token)       => fetch(`${API}/sign/${token}`).then(r => r.json()),
  submitSign: (token, body, isFormData) => {
    return fetch(`${API}/sign/${token}`, {
      method: 'POST',
      headers: isFormData ? {} : { 'Content-Type': 'application/json' },
      body: isFormData ? body : JSON.stringify(body),
    }).then(r => r.json())
  },

  // Profile
  getProfile:      ()     => request('GET',   '/profile'),
  updateProfile:   (body) => request('PATCH', '/profile', body),
  uploadLogo:      (file) => {
    const fd = new FormData(); fd.append('logo', file)
    return request('POST', '/profile/logo', fd, true)
  },
  saveSignature:   (data) => request('POST', '/profile/signature', { signature_data: data }),
}
