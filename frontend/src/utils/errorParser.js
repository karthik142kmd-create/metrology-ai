/**
 * Safely parse API error responses from FastAPI / Axios into human-readable strings.
 * Prevents React crash: "Objects are not valid as a React child"
 */
export function parseErrorMessage(err, fallback = 'Operation failed') {
  if (!err) return fallback

  // Network / Connection errors
  if (!err.response) {
    if (err.message && err.message.includes('Network Error')) {
      return 'Cannot connect to backend server. Please verify backend is running at http://localhost:8000.'
    }
    return err.message || fallback
  }

  const { data, status } = err.response

  // Handle specific HTTP error status codes cleanly
  if (status === 405) {
    return 'Authentication service route issue (HTTP 405 Method Not Allowed). Please ensure the backend server is running at http://localhost:8000.'
  }
  if (status === 404) {
    return 'Backend endpoint not found (HTTP 404). Please verify backend is running at http://localhost:8000.'
  }

  if (!data) {
    return `Server responded with status ${status}`
  }

  const detail = data.detail
  // 1. Plain string error
  if (typeof detail === 'string') {
    if (detail.toLowerCase().includes('method not allowed')) {
      return 'Authentication endpoint method error. Please check that the backend is running at http://localhost:8000.'
    }
    return detail
  }

  // 2. FastAPI Pydantic validation error array: [{loc, msg, type}, ...]
  if (Array.isArray(detail)) {
    const messages = detail.map((d) => {
      if (typeof d === 'string') return d
      if (d && d.msg) {
        const field = Array.isArray(d.loc) ? d.loc[d.loc.length - 1] : ''
        if (field && field !== 'body') {
          return `${field}: ${d.msg}`
        }
        return d.msg
      }
      return JSON.stringify(d)
    })
    return messages.filter(Boolean).join(', ') || fallback
  }

  // 3. Object detail
  if (typeof detail === 'object' && detail !== null) {
    return detail.msg || detail.message || JSON.stringify(detail)
  }

  // 4. Other data fields
  if (typeof data.message === 'string') {
    return data.message
  }

  return fallback
}
