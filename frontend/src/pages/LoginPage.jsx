import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authAPI } from '../services/api'
import { AlertCircle, CheckCircle } from 'lucide-react'

function LoginPage({ setUser }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showDemo, setShowDemo] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await authAPI.login(email, password)
      const { access_token, user } = response.data

      // Store auth data
      localStorage.setItem('token', access_token)
      localStorage.setItem('user', JSON.stringify(user))

      setUser(user)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const fillDemoCredentials = (role) => {
    if (role === 'admin') {
      setEmail('admin@metrology.ai')
      setPassword('admin123')
    } else {
      setEmail('inspector@metrology.ai')
      setPassword('inspector123')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-700 to-blue-600 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Hero Section */}
        <div className="text-center mb-8 text-white">
          <h1 className="text-4xl font-bold mb-2">MetrologyAI</h1>
          <p className="text-xl text-blue-100">
            AI-Assisted Packaged Commodity Compliance Inspection
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-xl shadow-2xl p-8 mb-6">
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="flex items-center space-x-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@metrology.ai"
                className="input-field"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-field"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="animate-spin-slow">⚙️</div>
                  <span>Logging in...</span>
                </>
              ) : (
                <span>Login</span>
              )}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-3 text-center">
              Demo Credentials:
            </p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => fillDemoCredentials('admin')}
                className="w-full text-sm px-4 py-2 border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition"
              >
                👤 Admin Account
              </button>
              <button
                type="button"
                onClick={() => fillDemoCredentials('inspector')}
                className="w-full text-sm px-4 py-2 border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition"
              >
                🔍 Inspector Account
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-3 text-center">
              Click a button above to fill demo credentials, then click Login
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-2 gap-3 text-white">
          <div className="flex items-start space-x-2">
            <CheckCircle size={20} className="text-green-300 flex-shrink-0 mt-1" />
            <div>
              <p className="font-semibold text-sm">AI OCR</p>
              <p className="text-xs text-blue-100">Auto text extraction</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircle size={20} className="text-green-300 flex-shrink-0 mt-1" />
            <div>
              <p className="font-semibold text-sm">Smart Rules</p>
              <p className="text-xs text-blue-100">Compliance validation</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircle size={20} className="text-green-300 flex-shrink-0 mt-1" />
            <div>
              <p className="font-semibold text-sm">PDF Reports</p>
              <p className="text-xs text-blue-100">Professional docs</p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircle size={20} className="text-green-300 flex-shrink-0 mt-1" />
            <div>
              <p className="font-semibold text-sm">Dashboard</p>
              <p className="text-xs text-blue-100">Real-time analytics</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
