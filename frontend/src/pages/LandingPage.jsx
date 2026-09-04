import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import LanguageSwitcher from '../components/LanguageSwitcher'
import { authAPI } from '../services/api'
import {
  ShieldCheck, Zap, Scale, FileText, CheckCircle2, ArrowRight,
  Sparkles, Check, AlertTriangle, ChevronRight, Eye, UploadCloud,
  Layers, Lock, UserCheck, X
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
  const [demoScanned, setDemoScanned] = useState(true)

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
        navigate('/dashboard')
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
        navigate('/dashboard')
      }
    } catch (err) {
      setError(err.response?.data?.detail || (authMode === 'login' ? 'Authentication failed' : 'Registration failed'))
    } finally {
      setLoading(false)
    }
  }

  const openAuth = (mode) => {
    setAuthMode(mode)
    setError('')
    setAuthModalOpen(true)
  }

  const quickDemoLogin = async (type) => {
    setLoading(true)
    setError('')
    const creds = type === 'admin' 
      ? { email: 'admin@metrology.ai', pass: 'admin123' }
      : { email: 'inspector@metrology.ai', pass: 'inspector123' }
    
    try {
      const res = await authAPI.login(creds.email, creds.pass)
      const { access_token, user: userData } = res.data
      localStorage.setItem('token', access_token)
      localStorage.setItem('user', JSON.stringify(userData))
      if (setUser) setUser(userData)
      setAuthModalOpen(false)
      navigate('/dashboard')
    } catch (err) {
      setError('Failed to authenticate demo account')
    } finally {
      setLoading(false)
    }
  }

  const runDemoScan = () => {
    setDemoActiveScan(true)
    setTimeout(() => {
      setDemoActiveScan(false)
      setDemoScanned(true)
    }, 1200)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white overflow-x-hidden font-sans">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-slate-950/80 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/25 ring-1 ring-white/20">
              <Scale className="text-white" size={24} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-black tracking-tight text-white">{t('appName')}</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  AI 2.0
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">{t('appSubtitle')}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 sm:space-x-4">
            <LanguageSwitcher />

            {user ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-600/30 transition duration-150 transform hover:-translate-y-0.5"
              >
                <span>{t('dashboard')}</span>
                <ArrowRight size={18} />
              </button>
            ) : (
              <div className="flex items-center space-x-2 sm:space-x-3">
                <button
                  onClick={() => openAuth('login')}
                  className="px-4 py-2 text-sm font-semibold text-slate-200 hover:text-white rounded-lg hover:bg-slate-800/80 transition"
                >
                  {t('signIn')}
                </button>
                <button
                  onClick={() => openAuth('register')}
                  className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/25 transition transform hover:-translate-y-0.5 flex items-center space-x-1.5"
                >
                  <span>{t('signUp')}</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-32 overflow-hidden">
        {/* Glowing Background Orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-blue-600/15 blur-[120px] rounded-full pointer-events-none -z-10" />
        <div className="absolute top-1/3 right-10 w-[400px] h-[350px] bg-indigo-600/10 blur-[100px] rounded-full pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            {/* Regulatory Badge */}
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs sm:text-sm font-medium mb-8 backdrop-blur-sm">
              <ShieldCheck size={16} className="text-blue-400" />
              <span>{t('heroBadge')}</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-tight mb-6">
              {t('heroTitle')}{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300">
                {t('heroTitleHighlight')}
              </span>
            </h1>

            {/* Description */}
            <p className="text-lg sm:text-xl text-slate-300 leading-relaxed mb-10 max-w-2xl mx-auto">
              {t('heroDesc')}
            </p>

            {/* Primary Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => user ? navigate('/inspections/new') : openAuth('register')}
                className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-base bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white shadow-xl shadow-blue-600/35 transition duration-200 transform hover:-translate-y-0.5 flex items-center justify-center space-x-3 ring-1 ring-white/20"
              >
                <Zap size={20} className="fill-white" />
                <span>{t('startInspection')}</span>
                <ChevronRight size={18} />
              </button>

              <button
                onClick={() => {
                  const demoEl = document.getElementById('live-demo-section')
                  if (demoEl) demoEl.scrollIntoView({ behavior: 'smooth' })
                }}
                className="w-full sm:w-auto px-7 py-4 rounded-xl font-semibold text-base bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 hover:border-slate-600 shadow-md transition duration-150 flex items-center justify-center space-x-2"
              >
                <Eye size={18} />
                <span>{t('viewDemo')}</span>
              </button>
            </div>

            <p className="mt-4 text-xs text-slate-400 font-medium">
              {t('freeTrial')}
            </p>
          </div>

          {/* Key Metrics Strip */}
          <div className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-5xl mx-auto">
            <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 text-center backdrop-blur-sm">
              <p className="text-3xl sm:text-4xl font-black text-blue-400">{t('stat1Val')}</p>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">{t('stat1')}</p>
            </div>
            <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 text-center backdrop-blur-sm">
              <p className="text-3xl sm:text-4xl font-black text-emerald-400">{t('stat2Val')}</p>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">{t('stat2')}</p>
            </div>
            <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 text-center backdrop-blur-sm">
              <p className="text-3xl sm:text-4xl font-black text-indigo-400">{t('stat3Val')}</p>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">{t('stat3')}</p>
            </div>
            <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 text-center backdrop-blur-sm">
              <p className="text-3xl sm:text-4xl font-black text-amber-400">{t('stat4Val')}</p>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">{t('stat4')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Live Demo Preview Card */}
      <section id="live-demo-section" className="py-16 bg-slate-900/40 border-y border-slate-800/80 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Interactive Compliance Simulation
            </h2>
            <p className="text-slate-400 mt-2 text-sm sm:text-base">
              See how our dual-engine pipeline extracts declarations via Tesseract OCR and performs AI legal verification in seconds.
            </p>
          </div>

          <div className="max-w-4xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
            {/* Header controls */}
            <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/60 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Commodity:</span>
                {['Food', 'Cosmetic', 'Beverage'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setDemoSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                      demoSelectedCategory === cat
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <button
                onClick={runDemoScan}
                disabled={demoActiveScan}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white flex items-center space-x-1.5 transition disabled:opacity-50"
              >
                <Sparkles size={14} />
                <span>{demoActiveScan ? 'Auditing...' : 'Re-Run AI Scan'}</span>
              </button>
            </div>

            {/* Demo Body Grid */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: OCR Extraction */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
                    <Layers size={16} className="text-blue-400" />
                    <span>OCR Extracted Declarations</span>
                  </h3>
                  <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono">
                    CLAHE + Dual-Pass
                  </span>
                </div>

                <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 font-mono text-xs space-y-2.5">
                  <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Product:</span>
                    <span className="text-slate-200 font-semibold">ABC Premium Basmati 5kg</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">MRP Declared:</span>
                    <span className="text-emerald-400 font-bold">₹650 (incl. all taxes)</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Net Quantity:</span>
                    <span className="text-emerald-400">5 kg (Metric valid)</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Date:</span>
                    <span className="text-slate-200">MFG 08/2026</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Manufacturer:</span>
                    <span className="text-slate-200 truncate max-w-[200px]">ABC Foods Pvt Ltd, Hyderabad</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-400">Customer Care:</span>
                    <span className="text-amber-400">1800-123-4567</span>
                  </div>
                </div>
              </div>

              {/* Right Column: AI Compliance Audit */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
                    <Sparkles size={16} className="text-indigo-400" />
                    <span>AI Compliance Assessment</span>
                  </h3>
                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                    Score: 92% PASS
                  </span>
                </div>

                <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 text-xs space-y-3">
                  <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-emerald-200 flex items-start space-x-2">
                    <CheckCircle2 size={16} className="text-emerald-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold">Rule 6(1)(e) - MRP Compliant</p>
                      <p className="text-[11px] text-emerald-300/80">Maximum Retail Price clearly tagged with inclusive of all taxes.</p>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-emerald-200 flex items-start space-x-2">
                    <CheckCircle2 size={16} className="text-emerald-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold">Rule 6(1)(c) - Net Quantity Standard</p>
                      <p className="text-[11px] text-emerald-300/80">Metric symbol 'kg' adheres to statutory Schedule II guidelines.</p>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-800/40 text-amber-200 flex items-start space-x-2">
                    <AlertTriangle size={16} className="text-amber-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold">AI Recommendation (Consumer Care)</p>
                      <p className="text-[11px] text-amber-300/80">Helpline phone is valid; recommend printing support email alongside.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Built for Industrial Rigor & Regulatory Precision
          </h2>
          <p className="text-slate-400 mt-3 text-base sm:text-lg">
            A comprehensive suite engineered for field inspectors, legal officers, and quality assurance teams.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Feature 1 */}
          <div className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 transition duration-200 hover:-translate-y-1">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-5">
              <Layers size={24} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">{t('feat1Title')}</h3>
            <p className="text-sm text-slate-400 leading-relaxed">{t('feat1Desc')}</p>
          </div>

          {/* Feature 2 */}
          <div className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 transition duration-200 hover:-translate-y-1">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-5">
              <Sparkles size={24} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">{t('feat2Title')}</h3>
            <p className="text-sm text-slate-400 leading-relaxed">{t('feat2Desc')}</p>
          </div>

          {/* Feature 3 */}
          <div className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 transition duration-200 hover:-translate-y-1">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-5">
              <Scale size={24} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">{t('feat3Title')}</h3>
            <p className="text-sm text-slate-400 leading-relaxed">{t('feat3Desc')}</p>
          </div>

          {/* Feature 4 */}
          <div className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 transition duration-200 hover:-translate-y-1">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-5">
              <FileText size={24} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">{t('feat4Title')}</h3>
            <p className="text-sm text-slate-400 leading-relaxed">{t('feat4Desc')}</p>
          </div>
        </div>
      </section>

      {/* CTA Footer Banner */}
      <section className="mt-auto border-t border-slate-800/80 bg-slate-950 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="flex items-center space-x-2">
              <Scale className="text-blue-500" size={20} />
              <span className="text-xl font-bold text-white">{t('appName')}</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Production-Grade Legal Metrology & Commodity Inspection System.
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => openAuth('login')}
              className="px-5 py-2 text-sm font-medium text-slate-300 hover:text-white rounded-lg hover:bg-slate-900"
            >
              {t('signIn')}
            </button>
            <button
              onClick={() => openAuth('register')}
              className="px-6 py-2.5 text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-600/30 transition"
            >
              {t('signUp')}
            </button>
          </div>
        </div>
      </section>

      {/* Auth Modal (Sign In / Sign Up) */}
      {authModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 relative text-slate-100">
            {/* Close button */}
            <button
              onClick={() => setAuthModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X size={20} />
            </button>

            {/* Modal Header */}
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center mx-auto mb-3">
                <Scale size={24} />
              </div>
              <h3 className="text-2xl font-bold text-white">
                {authMode === 'login' ? t('welcomeBack') : t('createAccount')}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {authMode === 'login' ? 'Sign in to access your inspection dashboard' : t('accountDesc')}
              </p>
            </div>

            {/* Tab switch */}
            <div className="flex rounded-xl bg-slate-950 p-1 mb-6 border border-slate-800">
              <button
                type="button"
                onClick={() => { setAuthMode('login'); setError('') }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                  authMode === 'login' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                {t('signIn')}
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode('register'); setError('') }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                  authMode === 'register' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                {t('signUp')}
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-950/50 border border-red-800/60 text-red-200 text-xs flex items-center space-x-2">
                <AlertTriangle size={16} className="shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {authMode === 'register' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">{t('fullName')}</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Officer Sharma"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">{t('role')}</label>
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
                <label className="block text-xs font-semibold text-slate-300 mb-1">{t('emailAddress')}</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@metrology.ai"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">{t('password')}</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition disabled:opacity-50"
              >
                {loading ? 'Processing...' : (authMode === 'login' ? t('signIn') : t('signUp'))}
              </button>
            </form>

            {/* Quick Demo Access Buttons */}
            <div className="mt-6 pt-5 border-t border-slate-800">
              <p className="text-[11px] text-center text-slate-400 font-medium mb-3">
                {t('quickDemoLogin')}
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => quickDemoLogin('inspector')}
                  className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition text-center"
                >
                  ⚡ {t('demoInspector')}
                </button>
                <button
                  type="button"
                  onClick={() => quickDemoLogin('admin')}
                  className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition text-center"
                >
                  🛡️ {t('demoAdmin')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default LandingPage
