import axios from 'axios'

const getBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL
  }
  if (import.meta.env.VITE_API_URL) {
    const root = import.meta.env.VITE_API_URL.replace(/\/$/, '')
    return `${root}/api`
  }
  // Use same-origin /api proxy by default in dev & deployment
  return '/api'
}

const API_BASE_URL = getBaseUrl()

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || ''
    const isAuthRoute = url.includes('/auth/login') || url.includes('/auth/register')
    
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
