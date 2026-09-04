import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import LanguageSwitcher from '../components/LanguageSwitcher'
import { authAPI } from '../services/api'
import {
  Scale, ShieldCheck, Zap, ArrowRight, CheckCircle2,
  AlertTriangle, Lock, X, ChevronRight, Sparkles
} from 'lucide-react'

function LandingPage({ user, setUser }) {
  const { t } = useLanguage()
  const navigate = useNavigate()

  // Auth modal state
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState('login') // 'login' | 'register'
  
  // Form state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState('inspector')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Interactive Live Demo state
  const [demoSelectedCategory, setDemoSelectedCategory] = useState('Food')
  const [demoActiveScan, setDemoActiveScan] = useState(false)

  const handleAuthSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (authMode === 'login') {
        const res = await authAPI.login(email, password)
        const { access_token, user: userData } = res.data
        localStorage.setItem('token', access_token)
        localStorage.setItem('user', JSON.stringify(userData))
        if (setUser) setUser(userData)
        setAuthModalOpen(false)
        // Navigate directly to scanner after sign in
        navigate('/analyze')
      } else {
        const res = await authAPI.register({
          email,
          password,
          full_name: fullName,
          role
        })
        const { access_token, user: userData } = res.data
        localStorage.setItem('token', access_token)
        localStorage.setItem('user', JSON.stringify(userData))
        if (setUser) setUser(userData)
        setAuthModalOpen(false)
        // Navigate directly to scanner after sign up
        navigate('/analyze')
      }
    } catch (err) {
      if (!err.response) {
        setError('Cannot connect to backend server. Make sure backend is running at http://localhost:8000.')
      } else {
        setError(err.response?.data?.detail || 'Authentication failed. Please check credentials.')
      }
    } finally {
      setLoading(false)
    }
  }

  const openAuth = (mode) => {
    setAuthMode(mode)
    setError('')
    setAuthModalOpen(true)
  }

  const quickDemoLogin = async (roleType = 'inspector') => {
    setLoading(true)
    setError('')
    const creds = {
      inspector: { email: 'inspector@metrology.ai', pass: 'inspector123' },
      admin: { email: 'admin@metrology.ai', pass: 'admin123' },
      consumer: { email: 'consumer@metrology.ai', pass: 'consumer123' },
    }[roleType]

    try {
      const res = await authAPI.login(creds.email, creds.pass)
      const { access_token, user: userData } = res.data
      localStorage.setItem('token', access_token)
      localStorage.setItem('user', JSON.stringify(userData))
      if (setUser) setUser(userData)
      setAuthModalOpen(false)
      // Navigate directly to scanner after demo login
      navigate('/analyze')
    } catch (err) {
      if (!err.response) {
        setError('Cannot connect to backend server. Make sure backend is running at http://localhost:8000.')
      } else {
        setError('Demo login failed. You can create a free account below.')
      }
    } finally {
      setLoading(false)
    }
  }

  const runDemoScan = () => {
    setDemoActiveScan(true)
    setTimeout(() => {
      setDemoActiveScan(false)
    }, 900)
  }

  // 8 Mandatory declarations
  const MANDATES = [
    { name: 'Maximum Retail Price (MRP)', desc: 'Must include all taxes & currency symbol (₹)' },
    { name: 'Net Quantity / Weight', desc: 'Metric units in lowercase standard (g, kg, ml, l)' },
    { name: 'Manufacturer / Packer Details', desc: 'Prominent registered business name' },
    { name: 'Complete Postal Address', desc: 'City, State, and PIN code for contact' },
    { name: 'Date of Mfg / Packing', desc: 'Month & Year of packaging or import' },
    { name: 'Consumer Care Helpline', desc: 'Toll-free telephone or email for complaints' },
    { name: 'Country of Origin', desc: 'Mandatory declaration for all commodities' },
    { name: 'Commodity Generic Name', desc: 'Clear common description of the enclosed item' },
  ]

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      
      {/* Navigation */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-slate-950/80 border-b border-slate-800/80">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between">
          
          <div className="flex items-center space-x-2.5 sm:space-x-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
              <Scale className="text-white" size={18} />
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-base sm:text-lg text-white tracking-tight">{t('appName')}</span>
              <span className="hidden sm:inline-block text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                PCR 2011
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            <LanguageSwitcher />

            {user ? (
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <button
                  onClick={() => navigate('/analyze')}
                  className="text-xs font-semibold px-2.5 sm:px-3.5 py-1.5 rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/40 hover:bg-teal-500/30 transition flex items-center space-x-1"
                >
                  <Zap size={13} className="text-teal-400 shrink-0" />
                  <span>{t('openScanner')}</span>
                </button>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="text-xs font-semibold px-2.5 sm:px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition shadow-sm hidden xs:inline-block"
                >
                  {t('dashboard')}
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <button
                  onClick={() => openAuth('login')}
                  className="text-xs font-medium text-slate-300 hover:text-white px-2.5 sm:px-3 py-1.5 rounded-lg hover:bg-slate-900 transition"
                >
                  {t('signIn')}
                </button>
                <button
                  onClick={() => openAuth('register')}
                  className="text-xs font-semibold px-3 sm:px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition shadow-sm"
                >
                  {t('signUp')}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-10 pb-12 sm:pt-20 sm:pb-20 text-center px-4 max-w-4xl mx-auto">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium mb-5 sm:mb-6">
          <ShieldCheck size={14} />
          <span>{t('heroBadge')}</span>
        </div>

        <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight mb-4 sm:mb-5">
          {t('heroTitle')}{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-300">
            {t('heroTitleHighlight')}
          </span>
        </h1>

        <p className="text-slate-300 text-sm sm:text-lg max-w-2xl mx-auto leading-relaxed mb-6 sm:mb-8 px-2">
          {t('heroDesc')}
        </p>

        {/* Primary Action Button (Sign in required to open scanner) */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8 sm:mb-10 w-full max-w-sm sm:max-w-none mx-auto">
          {user ? (
            <button
              onClick={() => navigate('/analyze')}
              className="w-full sm:w-auto px-6 sm:px-8 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-500 hover:to-teal-400 text-white shadow-lg shadow-blue-600/25 transition duration-150 flex items-center justify-center space-x-2"
            >
              <Zap size={17} />
              <span>{t('openScanner')}</span>
              <ArrowRight size={16} />
            </button>
          ) : (
            <button
              onClick={() => openAuth('login')}
              className="w-full sm:w-auto px-6 sm:px-8 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-500 hover:to-teal-400 text-white shadow-lg shadow-blue-600/25 transition duration-150 flex items-center justify-center space-x-2"
            >
              <Lock size={16} />
              <span>{t('signInToScan')}</span>
              <ArrowRight size={16} />
            </button>
          )}

          {!user && (
            <button
              onClick={() => openAuth('register')}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-semibold text-sm bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-slate-700 transition flex items-center justify-center space-x-2"
            >
              <span>{t('createAccount')}</span>
            </button>
          )}
        </div>

        {/* 3 Clean Stats */}
        <div className="grid grid-cols-3 gap-2 sm:gap-6 max-w-xl mx-auto pt-4 border-t border-slate-800/60">
          <div className="px-1">
            <p className="text-xl sm:text-2xl font-bold text-white">{t('stat1Val')}</p>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 leading-tight">{t('auditSpeed')}</p>
          </div>
          <div className="px-1">
            <p className="text-xl sm:text-2xl font-bold text-teal-400">{t('stat2Val')}</p>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 leading-tight">{t('ocrAccuracy')}</p>
          </div>
          <div className="px-1">
            <p className="text-xl sm:text-2xl font-bold text-blue-400">{t('stat3Val')}</p>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 leading-tight">{t('pcrRules')}</p>
          </div>
        </div>
      </section>

      {/* Why Compliance Matters (3 Simple, Clean Cards) */}
      <section className="py-10 sm:py-14 bg-slate-900/40 border-y border-slate-800/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-xl mx-auto mb-8 sm:mb-10">
            <h2 className="text-xl sm:text-3xl font-bold text-white tracking-tight">
              {t('whyComplianceMatters')}
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm mt-1.5 sm:mt-2">
              {t('whyMattersSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 sm:p-6">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center mb-3 sm:mb-4">
                <ShieldCheck size={20} />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white mb-1.5 sm:mb-2">{t('consumerProtectionTitle')}</h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                {t('consumerProtectionDesc')}
              </p>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 sm:p-6">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mb-3 sm:mb-4">
                <AlertTriangle size={20} />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white mb-1.5 sm:mb-2">{t('avoidFinesTitle')}</h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                {t('avoidFinesDesc')}
              </p>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 sm:p-6">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center mb-3 sm:mb-4">
                <Zap size={20} />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white mb-1.5 sm:mb-2">{t('automateQATitle')}</h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                {t('automateQADesc')}
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* The 8 Mandatory Declarations */}
      <section className="py-10 sm:py-14 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-xl mx-auto mb-8 sm:mb-10">
          <h2 className="text-xl sm:text-3xl font-bold text-white tracking-tight">
            {t('eightMandatesTitle')}
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-1.5 sm:mt-2">
            {t('eightMandatesSubtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {MANDATES.map((m, idx) => (
            <div key={idx} className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3.5 sm:p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-2 text-teal-400 text-xs font-semibold mb-1.5">
                  <CheckCircle2 size={14} />
                  <span>#{idx + 1}</span>
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-white mb-1">{m.name}</h4>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-2">{m.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Interactive Simulation Preview */}
      <section className="py-10 sm:py-12 bg-slate-900/30 border-t border-slate-800/80">
        <div className="max-w-4xl mx-auto px-3 sm:px-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="px-4 py-3 sm:px-5 sm:py-3.5 bg-slate-950 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="text-xs font-semibold text-slate-400 mr-1">{t('sampleSimulation')}</span>
                {['Food', 'Cosmetic', 'Beverage'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setDemoSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded text-xs transition ${
                      demoSelectedCategory === cat
                        ? 'bg-blue-600 text-white font-medium'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <button
                onClick={runDemoScan}
                disabled={demoActiveScan}
                className="text-xs font-semibold px-3 py-1.5 rounded bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/30 transition flex items-center space-x-1 self-end sm:self-auto"
              >
                <Sparkles size={12} />
                <span>{demoActiveScan ? 'Auditing...' : t('testSimulation')}</span>
              </button>
            </div>

            <div className="p-3.5 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs">
              <div className="bg-slate-950/80 p-3 sm:p-3.5 rounded-xl border border-slate-800 space-y-1.5 sm:space-y-2">
                <p className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider">{t('detectedLabelText')}</p>
                <p className="text-slate-300 font-mono text-[11px] sm:text-xs leading-relaxed">Basmati Rice 5 kg • MRP ₹650 (incl. of all taxes) • Mfg: 08/2026 • Care: 1800-123-4567</p>
              </div>
              <div className="bg-slate-950/80 p-3 sm:p-3.5 rounded-xl border border-slate-800 space-y-1.5 sm:space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider">{t('complianceStatus')}</p>
                  <span className="text-emerald-400 font-bold">PASS (92%)</span>
                </div>
                <p className="text-slate-300 text-[11px] sm:text-xs leading-relaxed">All 8 mandatory declarations detected and validated against PCR 2011 Schedule II.</p>
              </div>
            </div>

            <div className="px-4 py-3 sm:px-5 sm:py-3 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
              <span className="text-slate-400 text-[11px] sm:text-xs">{t('haveImagePrompt')}</span>
              {user ? (
                <button
                  onClick={() => navigate('/analyze')}
                  className="text-teal-400 hover:text-teal-300 font-semibold flex items-center space-x-1 self-end sm:self-auto"
                >
                  <span>{t('openScanner')}</span>
                  <ChevronRight size={14} />
                </button>
              ) : (
                <button
                  onClick={() => openAuth('login')}
                  className="text-teal-400 hover:text-teal-300 font-semibold flex items-center space-x-1 self-end sm:self-auto"
                >
                  <span>{t('signInToScan')}</span>
                  <ChevronRight size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-8 px-4 text-center text-xs text-slate-500">
        <p>MetrologyAI — Production-Grade Legal Metrology & Packaged Commodity Inspector</p>
      </footer>

      {/* Auth Modal (Sign In / Sign Up) */}
      {authModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-sm w-full p-5 sm:p-6 relative text-slate-100 max-h-[92vh] overflow-y-auto">
            
            {/* Close button */}
            <button
              onClick={() => setAuthModalOpen(false)}
              className="absolute top-3.5 right-3.5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X size={18} />
            </button>

            {/* Modal Title */}
            <div className="text-center mb-4 sm:mb-5">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center mx-auto mb-2">
                <Scale size={20} />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                {authMode === 'login' ? t('signIn') : t('createAccount')}
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                Sign in to open the compliance scanner & inspection dashboard
              </p>
            </div>

            {/* Tabs */}
            <div className="flex rounded-lg bg-slate-950 p-1 mb-4 border border-slate-800">
              <button
                type="button"
                onClick={() => { setAuthMode('login'); setError('') }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded transition ${
                  authMode === 'login' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                {t('signIn')}
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode('register'); setError('') }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded transition ${
                  authMode === 'register' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                {t('signUp')}
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleAuthSubmit} className="space-y-3">
              {error && (
                <div className="flex items-start space-x-2 bg-red-950/60 border border-red-800/60 text-red-200 px-3 py-2 rounded-lg text-xs">
                  <AlertTriangle size={14} className="text-red-400 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {authMode === 'register' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">{t('fullName')}</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Officer Sharma"
                      className="w-full px-3 py-2.5 sm:py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-base sm:text-xs focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">{t('role')}</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full px-3 py-2.5 sm:py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-base sm:text-xs focus:outline-none focus:border-blue-500"
                    >
                      <option value="inspector">{t('inspectorRole')}</option>
                      <option value="admin">{t('adminRole')}</option>
                      <option value="consumer">Consumer / Citizen</option>
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">{t('emailAddress')}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@metrology.ai"
                  className="w-full px-3 py-2.5 sm:py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-base sm:text-xs focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">{t('password')}</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2.5 sm:py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-base sm:text-xs focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 sm:py-2.5 rounded-lg font-bold bg-blue-600 hover:bg-blue-500 text-white text-xs transition duration-150 disabled:opacity-50 mt-1 shadow-md shadow-blue-600/25"
              >
                {loading ? 'Processing...' : (authMode === 'register' ? t('signUp') : t('signIn'))}
              </button>
            </form>

            {/* 1-Click Demo Logins */}
            {authMode === 'login' && (
              <div className="mt-4 pt-3 border-t border-slate-800 text-center">
                <p className="text-[11px] text-slate-400 mb-2">{t('quickDemoLogin')}:</p>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => quickDemoLogin('inspector')}
                    className="text-xs py-2 px-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition font-medium"
                  >
                    ⚡ Inspector
                  </button>
                  <button
                    type="button"
                    onClick={() => quickDemoLogin('admin')}
                    className="text-xs py-2 px-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition font-medium"
                  >
                    🛡️ Officer
                  </button>
                  <button
                    type="button"
                    onClick={() => quickDemoLogin('consumer')}
                    className="text-xs py-2 px-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition font-medium"
                  >
                    🛒 Consumer
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  )
}

export default LandingPage
