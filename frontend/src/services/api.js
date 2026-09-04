import axios from 'axios'

// Multi-device backend resolution: support LAN IP, cloud, and custom server
export const getDefaultApiUrl = () => {
  // 1. User manual override stored in localStorage
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('metrology_api_url')
    if (saved && saved.trim()) {
      const clean = saved.trim().replace(/\/$/, '')
      return clean.endsWith('/api') ? clean : `${clean}/api`
    }
  }

  // 2. Explicit environment variable
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '')
  }
  if (import.meta.env.VITE_API_URL) {
    const root = import.meta.env.VITE_API_URL.replace(/\/$/, '')
    return `${root}/api`
  }

  // 3. Dynamic browser host detection (for multi-device access on Wi-Fi / LAN or Cloud)
  if (typeof window !== 'undefined') {
    const host = window.location.hostname
    // If accessing from another device via LAN IP (e.g., 192.168.x.x, 10.x.x.x, 172.16-31.x.x)
    const isLanIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(host) && host !== '127.0.0.1'
    if (isLanIp) {
      return `http://${host}:8000/api`
    }

    // If on localhost / loopback, use same-origin /api (proxied by Vite)
    if (host === 'localhost' || host === '127.0.0.1') {
      return '/api'
    }

    // If deployed on cloud (Vercel / Netlify / custom domain)
    // Try same-origin /api (which vercel.json rewrites to Render backend)
    return '/api'
  }

  return '/api'
}

let currentBaseUrl = getDefaultApiUrl()

const api = axios.create({
  baseURL: currentBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Dynamically change backend URL at runtime (works on any device)
export const setApiBaseUrl = (newUrl) => {
  if (!newUrl) return currentBaseUrl
  const clean = newUrl.trim().replace(/\/$/, '')
  const full = clean.endsWith('/api') ? clean : `${clean}/api`
  currentBaseUrl = full
  api.defaults.baseURL = full
  if (typeof window !== 'undefined') {
    localStorage.setItem('metrology_api_url', full)
  }
  return full
}

export const getApiBaseUrl = () => currentBaseUrl

// Ping any backend URL to check health and latency
export const pingBackend = async (targetUrl) => {
  const clean = (targetUrl || currentBaseUrl).replace(/\/$/, '')
  const root = clean.replace(/\/api$/, '')
  const start = Date.now()
  try {
    const res = await axios.get(`${root}/health`, { timeout: 6000 })
    return {
      ok: true,
      latency: Date.now() - start,
      data: res.data
    }
  } catch (err) {
    return {
      ok: false,
      latency: Date.now() - start,
      error: err.message
    }
  }
}

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle responses & automatic backend fallback
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const url = originalRequest?.url || ''
    const isAuthRoute = url.includes('/auth/login') || url.includes('/auth/register')

    // If static dev/preview server or proxy returned 405 or 404, retry once directly against backend
    if (
      originalRequest &&
      !originalRequest._retried &&
      (error.response?.status === 405 || error.response?.status === 404) &&
      typeof window !== 'undefined'
    ) {
      originalRequest._retried = true
      const host = window.location.hostname || 'localhost'
      const isLanIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(host)

      if (isLanIp || host === 'localhost' || host === '127.0.0.1') {
        originalRequest.baseURL = `http://${host}:8000/api`
      } else {
        originalRequest.baseURL = 'https://metrologyai-backend.onrender.com/api'
      }
      try {
        return await axios(originalRequest)
      } catch (retryError) {
        return Promise.reject(retryError)
      }
    }

    // Do NOT force redirect to /login if the request itself was an authentication attempt
    if (error.response?.status === 401 && !isAuthRoute) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      if (typeof window !== 'undefined' && window.location.pathname !== '/login' && window.location.pathname !== '/') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
  getCurrentUser: () => api.get('/auth/me'),
}

export const productsAPI = {
  getAll: (skip = 0, limit = 10, category = null, search = null) =>
    api.get('/products', { params: { skip, limit, category, search } }),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
}

export const inspectionsAPI = {
  getAll: (skip = 0, limit = 10, status = null, productId = null) =>
    api.get('/inspections', { params: { skip, limit, status_filter: status, product_id: productId } }),
  getById: (id) => api.get(`/inspections/${id}`),
  create: (data) => api.post('/inspections', data),
  uploadImages: (id, files, imageType) => {
    const formData = new FormData()
    files.forEach(file => formData.append('files', file))
    return api.post(`/inspections/${id}/images`, formData, {
      params: { image_type: imageType },
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  scan: (id) => api.post(`/inspections/${id}/scan`),
  update: (id, data) => api.put(`/inspections/${id}`, data),
}

export const analysisAPI = {
  ocrExtract: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/analysis/ocr', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  extractDeclarations: (ocrData) =>
    api.post('/analysis/extract-declarations', ocrData),
  validate: (extractionResult, category) =>
    api.post('/analysis/validate', { extraction_result: extractionResult, category }),
  assessAICompliance: (declarations, category, productName) =>
    api.post('/analysis/ai-compliance', {
      declarations,
      category,
      product_name: productName
    }),
  quickAnalyze: (file, category = 'General') => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('category', category)
    return api.post('/analysis/quick-analyze', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}

export const rulesAPI = {
  getAll: (skip = 0, limit = 50) =>
    api.get('/rules', { params: { skip, limit } }),
  getById: (id) => api.get(`/rules/${id}`),
  create: (data) => api.post('/rules', data),
  update: (id, data) => api.put(`/rules/${id}`, data),
  delete: (id) => api.delete(`/rules/${id}`),
}

export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getViolations: () => api.get('/dashboard/violations'),
  getTrends: (days = 30) => api.get('/dashboard/trends', { params: { days } }),
  getRecentInspections: (limit = 10) =>
    api.get('/dashboard/recent-inspections', { params: { limit } }),
  getTopViolations: (limit = 5) =>
    api.get('/dashboard/top-violations', { params: { limit } }),
}

export const reportsAPI = {
  generate: (inspectionId, includeImages = true, includeEvidence = true) =>
    api.post(`/reports/${inspectionId}`, {}, {
      params: { include_images: includeImages, include_evidence: includeEvidence }
    }),
  download: (inspectionId) =>
    api.get(`/reports/${inspectionId}/download`, { responseType: 'blob' }),
}

export default api
