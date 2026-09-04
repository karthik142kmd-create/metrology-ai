import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authAPI } from '../services/api'
import { useLanguage } from '../context/LanguageContext'
import LanguageSwitcher from '../components/LanguageSwitcher'
import { AlertCircle, CheckCircle, Scale, ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react'

function LoginPage({ setUser }) {
  const { t } = useLanguage()
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState('inspector')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!isRegister) {
        const response = await authAPI.login(email, password)
        const { access_token, user } = response.data

        localStorage.setItem('token', access_token)
        localStorage.setItem('user', JSON.stringify(user))

        setUser(user)
        navigate('/dashboard')
      } else {
        const response = await authAPI.register({
          email,
          password,
          full_name: fullName,
          role
        })
        const { access_token, user } = response.data

        localStorage.setItem('token', access_token)
        localStorage.setItem('user', JSON.stringify(user))

        setUser(user)
        navigate('/dashboard')
      }
    } catch (err) {
      setError(err.response?.data?.detail || (isRegister ? 'Registration failed' : 'Login failed'))
    } finally {
      setLoading(false)
    }
  }

  const fillDemoCredentials = (roleType) => {
    setIsRegister(false)
    if (roleType === 'admin') {
      setEmail('admin@metrology.ai')
      setPassword('admin123')
    } else {
      setEmail('inspector@metrology.ai')
      setPassword('inspector123')
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
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 mb-6">
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
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm"
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
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-blue-500 text-sm"
                  >
                    <option value="inspector">{t('inspectorRole')}</option>
                    <option value="admin">{t('adminRole')}</option>
                  </select>
                </div>
              </>
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
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {t('password')}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm"
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
                {t('quickDemoLogin')}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => fillDemoCredentials('inspector')}
                  className="w-full text-xs px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                >
                  ⚡ {t('demoInspector')}
                </button>
                <button
                  type="button"
                  onClick={() => fillDemoCredentials('admin')}
                  className="w-full text-xs px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                >
                  🛡️ {t('demoAdmin')}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Feature Pills */}
        <div className="grid grid-cols-2 gap-2.5 text-slate-400 text-xs text-center">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl py-2 px-3">
            ✓ PCR 2011 Rules
          </div>
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl py-2 px-3">
            ✓ AI Risk Assessment
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
