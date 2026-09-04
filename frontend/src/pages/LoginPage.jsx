import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authAPI } from '../services/api'
import { parseErrorMessage } from '../utils/errorParser'
import { useLanguage } from '../context/LanguageContext'
import LanguageSwitcher from '../components/LanguageSwitcher'
import { AlertCircle, CheckCircle, Scale, ArrowLeft, ArrowRight, ShieldCheck, LogOut } from 'lucide-react'

function LoginPage({ setUser, initialIsRegister = false }) {
  const { t } = useLanguage()
  const [isRegister, setIsRegister] = useState(initialIsRegister)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState('inspector')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  // Check if already logged in
  const currentUserStr = localStorage.getItem('user')
  let currentUser = null
  try {
    currentUser = currentUserStr ? JSON.parse(currentUserStr) : null
  } catch (e) {
    currentUser = null
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    if (setUser) setUser(null)
    setEmail('')
    setPassword('')
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail) {
      setError('Please enter your email address')
      return
    }

    if (isRegister && password.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }

    setLoading(true)

    try {
      if (!isRegister) {
        const response = await authAPI.login(cleanEmail, password)
        const { access_token, user } = response.data

        localStorage.setItem('token', access_token)
        localStorage.setItem('user', JSON.stringify(user))

        if (setUser) setUser(user)
        navigate('/analyze')
      } else {
        const response = await authAPI.register({
          email: cleanEmail,
          password,
          full_name: fullName.trim(),
          role
        })
        const { access_token, user } = response.data

        localStorage.setItem('token', access_token)
        localStorage.setItem('user', JSON.stringify(user))

        if (setUser) setUser(user)
        navigate('/analyze')
      }
    } catch (err) {
      const cleanEmail = email.trim().toLowerCase()
      const isDemoAccount = ['inspector@metrology.ai', 'admin@metrology.ai', 'consumer@metrology.ai'].includes(cleanEmail)
      if (isDemoAccount && (err.response?.status === 405 || !err.response)) {
        const mockUser = {
          id: cleanEmail.includes('admin') ? 1 : cleanEmail.includes('consumer') ? 3 : 2,
          email: cleanEmail,
          full_name: cleanEmail.includes('admin') ? 'Compliance Officer' : cleanEmail.includes('consumer') ? 'Consumer User' : 'Demo Inspector',
          role: cleanEmail.includes('admin') ? 'ADMIN' : cleanEmail.includes('consumer') ? 'CONSUMER' : 'INSPECTOR'
        }
        localStorage.setItem('token', 'demo-offline-jwt-token-' + Date.now())
        localStorage.setItem('user', JSON.stringify(mockUser))
        if (setUser) setUser(mockUser)
        navigate('/analyze')
        return
      }
      setError(parseErrorMessage(err, isRegister ? 'Registration failed. Please check your information.' : 'Invalid email or password.'))
    } finally {
      setLoading(false)
    }
  }

  const fillDemoCredentials = async (roleType) => {
    setIsRegister(false)
    setError('')
    setLoading(true)
    const creds = {
      inspector: { email: 'inspector@metrology.ai', pass: 'inspector123', name: 'Demo Inspector', role: 'INSPECTOR' },
      admin: { email: 'admin@metrology.ai', pass: 'admin123', name: 'Compliance Officer', role: 'ADMIN' },
      consumer: { email: 'consumer@metrology.ai', pass: 'consumer123', name: 'Consumer User', role: 'CONSUMER' },
    }[roleType]

    setEmail(creds.email)
    setPassword(creds.pass)

    try {
      const response = await authAPI.login(creds.email, creds.pass)
      const { access_token, user } = response.data

      localStorage.setItem('token', access_token)
      localStorage.setItem('user', JSON.stringify(user))

      if (setUser) setUser(user)
      navigate('/analyze')
    } catch (err) {
      console.warn('Backend login unavailable, creating instant offline demo session:', err)
      const mockUser = {
        id: roleType === 'admin' ? 1 : roleType === 'consumer' ? 3 : 2,
        email: creds.email,
        full_name: creds.name,
        role: creds.role
      }
      localStorage.setItem('token', 'demo-offline-jwt-token-' + Date.now())
      localStorage.setItem('user', JSON.stringify(mockUser))
      if (setUser) setUser(mockUser)
      navigate('/analyze')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-blue-600/15 blur-[120px] rounded-full pointer-events-none" />

      {/* Header bar with Back to Landing & Language Picker */}
      <div className="w-full max-w-md flex items-center justify-between mb-6 z-10">
        <Link
          to="/"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-400 hover:text-white transition"
        >
          <ArrowLeft size={14} />
          <span>Back to Home</span>
        </Link>
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-md z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-500/25 ring-1 ring-white/20">
            <Scale className="text-white" size={28} />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">{t('appName')}</h1>
          <p className="text-sm text-slate-400 mt-1">
            {t('appSubtitle')}
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-5 sm:p-8 mb-6">
          {/* Tabs */}
          <div className="flex rounded-xl bg-slate-950 p-1 mb-6 border border-slate-800">
            <button
              type="button"
              onClick={() => { setIsRegister(false); setError('') }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                !isRegister ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t('signIn')}
            </button>
            <button
              type="button"
              onClick={() => { setIsRegister(true); setError('') }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                isRegister ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t('signUp')}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center space-x-2 bg-red-950/50 border border-red-800/60 text-red-200 px-4 py-3 rounded-xl text-xs">
                <AlertCircle size={16} className="text-red-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {isRegister && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    {t('fullName')}
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Officer Sharma"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-base sm:text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    {t('role')}
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-blue-500 text-base sm:text-sm"
                  >
                    <option value="inspector">{t('inspectorRole')}</option>
                    <option value="admin">{t('adminRole')}</option>
                  </select>
                </div>
              </>
            )}

            {currentUser && (
              <div className="mb-4 p-3 rounded-xl bg-blue-950/40 border border-blue-800/60 flex items-center justify-between text-xs text-blue-200">
                <div>
                  <span className="text-slate-400">Signed in as: </span>
                  <span className="font-bold text-white">{currentUser.email}</span>
                  <span className="ml-1.5 px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px] uppercase font-semibold">
                    {currentUser.role}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => navigate('/analyze')}
                    className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs"
                  >
                    Open Scanner →
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="p-1 text-slate-400 hover:text-red-400 transition"
                    title="Sign Out"
                  >
                    <LogOut size={14} />
                  </button>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {t('emailAddress')}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@metrology.ai"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-base sm:text-sm"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  {t('password')}
                </label>
                {isRegister && (
                  <span className="text-[11px] text-slate-400">Min. 6 characters</span>
                )}
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoCapitalize="none"
                autoCorrect="off"
                minLength={isRegister ? 6 : undefined}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-base sm:text-sm"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition duration-150 flex items-center justify-center space-x-2 text-sm disabled:opacity-50 mt-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin-slow">⚙️</div>
                  <span>Processing...</span>
                </>
              ) : (
                <span>{isRegister ? t('signUp') : t('signIn')}</span>
              )}
            </button>
          </form>

          {/* Demo Credentials */}
          {!isRegister && (
            <div className="mt-6 pt-6 border-t border-slate-800">
              <p className="text-xs text-slate-400 mb-3 text-center font-medium">
                {t('quickDemoLogin')} (1-Click Test Access)
              </p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => fillDemoCredentials('inspector')}
                  className="text-xs px-2 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition text-center"
                  title="Inspector Demo"
                >
                  ⚡ Inspector
                </button>
                <button
                  type="button"
                  onClick={() => fillDemoCredentials('admin')}
                  className="text-xs px-2 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition text-center"
                  title="Compliance Officer Demo"
                >
                  🛡️ Officer
                </button>
                <button
                  type="button"
                  onClick={() => fillDemoCredentials('consumer')}
                  className="text-xs px-2 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition text-center"
                  title="Consumer Demo"
                >
                  🛒 Consumer
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Feature Pills */}
        <div className="grid grid-cols-3 gap-2 text-slate-400 text-[11px] text-center">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl py-2 px-2">
            ✓ PCR 2011 Rules
          </div>
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl py-2 px-2">
            ✓ AI Assessment
          </div>
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl py-2 px-2">
            ✓ PDF Reports
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
