import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import LanguageSwitcher from '../components/LanguageSwitcher'
import { authAPI } from '../services/api'
import {
  ShieldCheck, Zap, Scale, FileText, CheckCircle2, ArrowRight,
  Sparkles, Check, AlertTriangle, ChevronRight, Eye, UploadCloud,
  Layers, Lock, UserCheck, X, AlertOctagon, Building2, ShoppingBag,
  ShieldAlert, Cpu, ArrowUpRight, BarChart3, Clock, HelpCircle, ExternalLink
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

  const fillQuickDemo = (roleType) => {
    if (roleType === 'inspector') {
      setEmail('inspector@metrology.ai')
      setPassword('inspector123')
    } else if (roleType === 'admin') {
      setEmail('admin@metrology.ai')
      setPassword('admin123')
    } else {
      setEmail('consumer@metrology.ai')
      setPassword('consumer123')
    }
    setAuthMode('login')
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
      navigate('/dashboard')
    } catch (err) {
      setError('Demo account connection error — you can register a new account or try again.')
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

  // Statutory declarations list for the mandates section
  const MANDATORY_DECLARATIONS = [
    {
      rule: 'Rule 6(1)(e)',
      title: 'Maximum Retail Price (MRP)',
      statute: 'Inclusive of all taxes; Currency symbol ₹ or Rs.',
      impact: 'Prevents deceptive pricing and dual-MRP violations.',
      icon: '₹',
      color: 'from-blue-500/20 to-cyan-500/20 text-cyan-400 border-cyan-500/30'
    },
    {
      rule: 'Rule 6(1)(c)',
      title: 'Net Quantity / Weight',
      statute: 'Standard metric units (g, kg, ml, l) in lowercase format.',
      impact: 'Guarantees consumers receive exact measured quantity.',
      icon: '⚖️',
      color: 'from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30'
    },
    {
      rule: 'Rule 6(1)(a)',
      title: 'Manufacturer / Packer / Importer',
      statute: 'Prominent registered business name on principal display.',
      impact: 'Establishes clear corporate legal liability.',
      icon: '🏭',
      color: 'from-indigo-500/20 to-purple-500/20 text-indigo-400 border-indigo-500/30'
    },
    {
      rule: 'Rule 6(1)(a)',
      title: 'Complete Postal Address',
      statute: 'Full address with City, State, and PIN code.',
      impact: 'Ensures physical jurisdiction and service of legal process.',
      icon: '📍',
      color: 'from-purple-500/20 to-pink-500/20 text-purple-400 border-purple-500/30'
    },
    {
      rule: 'Rule 6(1)(d)',
      title: 'Date of Mfg / Packing',
      statute: 'Month & Year (e.g. 08/2026) clearly legible.',
      impact: 'Protects consumer health, safety, and shelf-life tracking.',
      icon: '📅',
      color: 'from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30'
    },
    {
      rule: 'Rule 6(1)(f)',
      title: 'Consumer Care Helpline & Email',
      statute: 'Toll-free telephone number or designated email ID.',
      impact: 'Mandates accessible customer grievance redressal.',
      icon: '📞',
      color: 'from-rose-500/20 to-red-500/20 text-rose-400 border-rose-500/30'
    },
    {
      rule: 'Amendment 2020',
      title: 'Country of Origin',
      statute: 'Mandatory declaration on domestic & imported goods.',
      impact: 'Prevents customs seizure and e-commerce delisting.',
      icon: '🌐',
      color: 'from-sky-500/20 to-blue-500/20 text-sky-400 border-sky-500/30'
    },
    {
      rule: 'Rule 6(1)(b)',
      title: 'Commodity Generic Name',
      statute: 'Common or generic identity of the enclosed commodity.',
      impact: 'Prevents misleading branding and counterfeit goods.',
      icon: '🏷️',
      color: 'from-emerald-500/20 to-blue-500/20 text-emerald-400 border-emerald-500/30'
    }
  ]

  // Penalties list
  const STATUTORY_PENALTIES = [
    {
      section: 'Section 36(1), LM Act 2009',
      title: 'Missing or Non-Standard Declarations',
      firstOffense: 'Fine up to ₹25,000',
      secondOffense: 'Fine up to ₹50,000',
      subsequent: 'Up to ₹1,00,000 fine and/or 1 year imprisonment',
      risk: 'CRITICAL',
      badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/30'
    },
    {
      section: 'Section 30, LM Act 2009',
      title: 'Short Quantity & Measurement Discrepancy',
      firstOffense: 'Fine up to ₹20,000',
      secondOffense: 'Fine up to ₹50,000 + Lot Seizure',
      subsequent: 'Seizure of entire commodity batch & prosecution',
      risk: 'HIGH',
      badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30'
    },
    {
      section: 'Section 36(2), LM Act 2009',
      title: 'Dual Pricing & Charging Above Declared MRP',
      firstOffense: 'Fine up to ₹50,000',
      secondOffense: 'Fine up to ₹1,00,000',
      subsequent: 'Cancellation of trade license and consumer court award',
      risk: 'SEVERE',
      badgeColor: 'bg-red-500/20 text-red-400 border-red-500/30'
    },
    {
      section: 'Section 49, LM Act 2009',
      title: 'Corporate Offenses & Director Liability',
      firstOffense: 'Personal summons for designated directors',
      secondOffense: 'Non-bailable court proceedings',
      subsequent: 'Immediate compounding fees & legal liability',
      risk: 'DIRECTOR LIABILITY',
      badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
    }
  ]

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white overflow-x-hidden font-sans">
      
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-slate-950/85 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logo & Subtitle */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-teal-400 flex items-center justify-center shadow-lg shadow-blue-500/25 ring-1 ring-white/20">
              <Scale className="text-white" size={24} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-black tracking-tight text-white">{t('appName')}</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  PCR 2011 AI
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">{t('appSubtitle')}</p>
            </div>
          </div>

          {/* Quick Nav Anchor Links */}
          <nav className="hidden lg:flex items-center space-x-6 text-xs font-medium text-slate-300">
            <a href="#importance" className="hover:text-blue-400 transition">Why It Matters</a>
            <a href="#penalties" className="hover:text-blue-400 transition">Statutory Penalties</a>
            <a href="#mandates" className="hover:text-blue-400 transition">8 Declarations</a>
            <a href="#comparison" className="hover:text-blue-400 transition">AI vs Manual</a>
            <a href="#live-demo-section" className="hover:text-blue-400 transition">Live Demo</a>
          </nav>

          {/* Action Header Buttons */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* Direct Connect to Current Page (Quick Scanner) */}
            <button
              onClick={() => navigate('/analyze')}
              className="inline-flex items-center space-x-1.5 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-teal-500/20 to-blue-500/20 border border-teal-500/40 text-teal-300 hover:bg-teal-500/30 transition duration-150 shadow-sm"
              title="Launch instant packaging label compliance scanner"
            >
              <Zap size={14} className="text-teal-400" />
              <span>Instant Scanner</span>
            </button>

            <LanguageSwitcher />

            {user ? (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition flex items-center space-x-1.5 shadow-md shadow-blue-600/25"
                >
                  <BarChart3 size={14} />
                  <span>Dashboard</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => openAuth('login')}
                  className="px-3 py-2 text-xs font-semibold text-slate-200 hover:text-white rounded-lg hover:bg-slate-800 transition"
                >
                  {t('signIn')}
                </button>
                <button
                  onClick={() => openAuth('register')}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/25 transition transform hover:-translate-y-0.5 flex items-center space-x-1"
                >
                  <span>{t('signUp')}</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 overflow-hidden">
        {/* Ambient background glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[750px] h-[450px] bg-blue-600/15 blur-[130px] rounded-full pointer-events-none -z-10" />
        <div className="absolute top-1/3 right-10 w-[450px] h-[350px] bg-indigo-600/10 blur-[110px] rounded-full pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            
            {/* Official Regulatory Banner */}
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 text-xs sm:text-sm font-medium mb-8 backdrop-blur-sm shadow-sm">
              <ShieldCheck size={16} className="text-blue-400" />
              <span>LEGAL METROLOGY ACT 2009 & PCR 2011 STATUTORY ENGINE</span>
            </div>

            {/* Impact Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-tight mb-6">
              AI-Powered Packaged Commodity{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-teal-300">
                Compliance Inspector
              </span>
            </h1>

            {/* Concise Value Description */}
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed mb-10 max-w-2xl mx-auto">
              Packaging violations incur fines up to <span className="text-rose-400 font-semibold">₹1,00,000</span>, inventory seizures, and e-commerce delisting. 
              MetrologyAI automates packaging label audits against all 8 mandatory declarations in <span className="text-teal-400 font-semibold">&lt; 3.5 seconds</span> using advanced multi-pass OCR and statutory rules.
            </p>

            {/* Primary Action Buttons (Connect directly to Current Page + Auth) */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              
              {/* PRIMARY CTA: Directly opens the Current Page (Quick Analyzer) */}
              <button
                onClick={() => navigate('/analyze')}
                className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-base bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-500 hover:from-blue-500 hover:to-teal-400 text-white shadow-xl shadow-blue-600/35 transition duration-200 transform hover:-translate-y-0.5 flex items-center justify-center space-x-3 ring-1 ring-white/20"
              >
                <Zap size={20} className="fill-white" />
                <span>Launch Instant Scanner</span>
                <ChevronRight size={18} />
              </button>

              {/* Secondary CTA: Scroll to Importance */}
              <a
                href="#importance"
                className="w-full sm:w-auto px-7 py-4 rounded-xl font-semibold text-base bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 hover:border-slate-600 shadow-md transition duration-150 flex items-center justify-center space-x-2"
              >
                <Scale size={18} className="text-blue-400" />
                <span>Why Compliance Matters</span>
              </a>

              {/* Quick Auth Trigger */}
              {!user && (
                <button
                  onClick={() => openAuth('login')}
                  className="w-full sm:w-auto px-6 py-4 rounded-xl font-semibold text-base bg-slate-900/60 hover:bg-slate-800/80 text-slate-300 border border-slate-800 hover:border-slate-700 transition flex items-center justify-center space-x-2"
                >
                  <Lock size={16} />
                  <span>Sign In / Demo</span>
                </button>
              )}
            </div>

            <p className="mt-4 text-xs text-slate-400 font-medium">
              ⚡ Instant Label Analysis • 100% PCR 2011 Coverage • Certified PDF Inspection Reports
            </p>
          </div>

          {/* Key Metrics Strip */}
          <div className="mt-14 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-5xl mx-auto">
            <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 text-center backdrop-blur-sm">
              <p className="text-3xl sm:text-4xl font-black text-blue-400">&lt; 3.5s</p>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">Instant OCR & AI Speed</p>
            </div>
            <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 text-center backdrop-blur-sm">
              <p className="text-3xl sm:text-4xl font-black text-emerald-400">99.2%</p>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">Declaration Accuracy</p>
            </div>
            <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 text-center backdrop-blur-sm">
              <p className="text-3xl sm:text-4xl font-black text-indigo-400">100%</p>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">Statutory Rule Coverage</p>
            </div>
            <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 text-center backdrop-blur-sm">
              <p className="text-3xl sm:text-4xl font-black text-amber-400">₹1,00,000</p>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">Penalty Avoidance per SKU</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 1: THE CRITICAL IMPORTANCE OF LEGAL METROLOGY */}
      <section id="importance" className="py-20 bg-slate-900/40 border-y border-slate-800/80 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-3">
              <Scale size={14} />
              <span>Core Value Proposition</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Why Legal Metrology Compliance Is Essential
            </h2>
            <p className="text-slate-400 mt-3 text-base sm:text-lg">
              Legal Metrology is not just a regulatory hurdle—it is the bedrock of consumer trust, economic fairness, and commercial enterprise longevity.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Card 1: For Consumers & Public Trust */}
            <div className="bg-gradient-to-br from-slate-900/90 to-slate-950 border border-blue-500/30 rounded-2xl p-8 relative overflow-hidden shadow-xl">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-6">
                <ShoppingBag size={28} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">
                For Consumers: Protecting Fundamental Rights
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed mb-6">
                Every packaged commodity sold across India must guarantee fair trade and total transparency. Non-compliant packaging directly harms citizens through deceptive trade practices.
              </p>

              <div className="space-y-4">
                <div className="flex items-start space-x-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
                  <CheckCircle2 size={18} className="text-teal-400 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Weight & Volume Assurance</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Eliminates short-measurement fraud so consumers receive every gram and millilitre they pay for.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
                  <CheckCircle2 size={18} className="text-teal-400 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Anti-Price Gouging & Transparent MRP</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Mandates all-inclusive Maximum Retail Price (MRP) and Unit Sale Price (USP) to prevent dual-pricing and hidden fees.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
                  <CheckCircle2 size={18} className="text-teal-400 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Shelf-Life Safety & Freshness</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Explicit date of manufacture/packing shields consumers from consuming expired or unsafe commodities.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
                  <CheckCircle2 size={18} className="text-teal-400 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Mandatory Grievance Redressal</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Guarantees direct access to consumer care telephone, email, and manufacturer address for defective goods.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: For Brands, Manufacturers & Importers */}
            <div className="bg-gradient-to-br from-slate-900/90 to-slate-950 border border-indigo-500/30 rounded-2xl p-8 relative overflow-hidden shadow-xl">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-6">
                <Building2 size={28} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">
                For Brands: Eliminating Catastrophic Liabilities
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed mb-6">
                Under the Legal Metrology Act 2009, even a minor font-size defect or missing metric symbol can trigger immediate stop-sale notices and criminal court summons.
              </p>

              <div className="space-y-4">
                <div className="flex items-start space-x-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
                  <ShieldAlert size={18} className="text-rose-400 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Protection Against Criminal Prosecution</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Section 49 holds corporate directors individually liable for recurring label errors. MetrologyAI prevents non-bailable summons.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
                  <ShieldAlert size={18} className="text-rose-400 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Zero Inventory Seizures & Customs Holds</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Avoids container hold-ups at port customs and warehouse confiscation of non-compliant packaged stock.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
                  <ShieldAlert size={18} className="text-rose-400 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Safeguarding E-Commerce Shelf Space</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Amazon, Flipkart, Blinkit, and Zepto actively delist SKUs flagged for PCR 2011 violations. Pre-scan preserves your revenue.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
                  <ShieldAlert size={18} className="text-rose-400 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Court-Admissible Digital Audit Trail</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Auto-generate tamper-proof inspection certificates to furnish during routine factory and market inspections.</p>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Quick Scanner Action Banner in the Middle */}
          <div className="mt-12 bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-teal-900/40 border border-blue-500/30 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-bold text-white">Have a product label you need to verify right now?</h3>
              <p className="text-sm text-slate-300 mt-1">Upload packaging photos to our current engine and get a statutory compliance score in seconds.</p>
            </div>
            <button
              onClick={() => navigate('/analyze')}
              className="px-6 py-3.5 rounded-xl font-bold text-sm bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-lg shadow-teal-500/20 transition flex items-center space-x-2 shrink-0"
            >
              <span>Test Your Product Now</span>
              <ArrowRight size={16} />
            </button>
          </div>

        </div>
      </section>

      {/* SECTION 2: STATUTORY PENALTIES UNDER LM ACT 2009 */}
      <section id="penalties" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <AlertOctagon size={14} />
            <span>Statutory Legal Liabilities</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Penalties for Non-Compliance in India
          </h2>
          <p className="text-slate-400 mt-3 text-base sm:text-lg">
            Under the Legal Metrology Act, 2009 and Packaged Commodities Rules 2011, packaging violations carry compounding fines, stock impoundment, and potential imprisonment.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {STATUTORY_PENALTIES.map((penalty, idx) => (
            <div key={idx} className="bg-slate-900/70 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 transition duration-200 hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono font-bold text-slate-400">{penalty.section}</span>
                <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full border ${penalty.badgeColor}`}>
                  {penalty.risk}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mb-4">{penalty.title}</h3>

              <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800/80 space-y-2 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                  <span className="text-slate-400 font-medium">1st Offense:</span>
                  <span className="text-amber-400 font-semibold">{penalty.firstOffense}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                  <span className="text-slate-400 font-medium">2nd Offense:</span>
                  <span className="text-orange-400 font-semibold">{penalty.secondOffense}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-400 font-medium">Subsequent / Aggravated:</span>
                  <span className="text-rose-400 font-bold">{penalty.subsequent}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 3: THE 8 MANDATORY DECLARATIONS (RULE 6(1)) */}
      <section id="mandates" className="py-20 bg-slate-900/30 border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-semibold uppercase tracking-wider mb-3">
              <CheckCircle2 size={14} />
              <span>PCR 2011 Rule 6(1) Requirements</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              The 8 Mandatory Label Declarations
            </h2>
            <p className="text-slate-400 mt-3 text-base sm:text-lg">
              Every package entering the consumer supply chain must prominently display these 8 legal disclosures. MetrologyAI verifies each one automatically.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {MANDATORY_DECLARATIONS.map((item, idx) => (
              <div key={idx} className="bg-slate-900/80 border border-slate-800/90 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between transition duration-200 hover:-translate-y-1">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-lg shadow-inner">
                      {item.icon}
                    </div>
                    <span className="text-[11px] font-mono text-slate-400 font-semibold bg-slate-950 px-2 py-1 rounded-md border border-slate-800">
                      {item.rule}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white mb-1.5">{item.title}</h3>
                  <p className="text-xs text-slate-300 font-medium leading-relaxed mb-3">{item.statute}</p>
                </div>
                <div className="pt-3 border-t border-slate-800/60 text-[11px] text-slate-400">
                  <span className="text-teal-400 font-semibold">Requirement: </span>
                  {item.impact}
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* SECTION 4: AI vs MANUAL INSPECTION COMPARISON */}
      <section id="comparison" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <Cpu size={14} />
            <span>Efficiency Leap</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Manual Auditing vs. MetrologyAI
          </h2>
          <p className="text-slate-400 mt-3 text-base sm:text-lg">
            Compare traditional paper-based packaging checks with automated AI & multi-pass OCR inspection.
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950/80 text-xs uppercase tracking-wider border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="py-4 px-6">Inspection Parameter</th>
                  <th className="py-4 px-6 text-rose-400">Manual Inspection</th>
                  <th className="py-4 px-6 text-teal-400 font-bold bg-blue-950/20">MetrologyAI Engine</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs sm:text-sm">
                <tr>
                  <td className="py-4 px-6 font-semibold text-white">Speed Per Product SKU</td>
                  <td className="py-4 px-6 text-slate-400">15 – 25 Minutes (Slow bottleneck)</td>
                  <td className="py-4 px-6 text-teal-300 font-bold bg-blue-950/20">&lt; 3.5 Seconds (Instantaneous)</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-semibold text-white">Rule 6(1) Checklist Coverage</td>
                  <td className="py-4 px-6 text-slate-400">Partial & highly subjective</td>
                  <td className="py-4 px-6 text-teal-300 font-bold bg-blue-950/20">100% Comprehensive Statutory Rules</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-semibold text-white">Metric Unit Capitalization Check</td>
                  <td className="py-4 px-6 text-slate-400">Frequently missed (e.g. 'G' vs 'g')</td>
                  <td className="py-4 px-6 text-teal-300 font-bold bg-blue-950/20">Automated Schedule II Regex & OCR validation</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-semibold text-white">Audit Documentation</td>
                  <td className="py-4 px-6 text-slate-400">Handwritten logs & loose photos</td>
                  <td className="py-4 px-6 text-teal-300 font-bold bg-blue-950/20">Certified PDF Reports with bounding boxes</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-semibold text-white">Multi-Language Packaging Support</td>
                  <td className="py-4 px-6 text-slate-400">Limited to inspector's languages</td>
                  <td className="py-4 px-6 text-teal-300 font-bold bg-blue-950/20">English, Hindi, Tamil, Telugu OCR support</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-semibold text-white">Estimated Penalty Risk</td>
                  <td className="py-4 px-6 text-rose-400">High error rate & unexpected fines</td>
                  <td className="py-4 px-6 text-teal-300 font-bold bg-blue-950/20">Near-zero statutory compliance risk</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* SECTION 5: INTERACTIVE LIVE DEMO PREVIEW */}
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

              <div className="flex items-center space-x-3">
                <button
                  onClick={runDemoScan}
                  disabled={demoActiveScan}
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white flex items-center space-x-1.5 transition disabled:opacity-50"
                >
                  <Sparkles size={14} />
                  <span>{demoActiveScan ? 'Auditing...' : 'Re-Run AI Scan'}</span>
                </button>
                <button
                  onClick={() => navigate('/analyze')}
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white flex items-center space-x-1.5 transition shadow-sm"
                >
                  <span>Open Scanner Tool →</span>
                </button>
              </div>
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

            {/* Banner linking to full scanner */}
            <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">Ready to audit your actual product packaging photo?</span>
              <button
                onClick={() => navigate('/analyze')}
                className="text-teal-400 hover:text-teal-300 font-bold flex items-center space-x-1"
              >
                <span>Launch Instant Scanner Tool</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* CTA Bottom Banner */}
      <section className="py-16 bg-gradient-to-b from-slate-950 to-slate-900 border-t border-slate-800/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 mx-auto mb-6">
            <Scale size={28} />
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Start Auditing Your Packaged Commodities Today
          </h2>
          <p className="text-slate-400 mt-3 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
            Ensure 100% compliance with PCR 2011, avoid costly court summons, and safeguard consumer trust across every retail channel.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate('/analyze')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-lg shadow-teal-500/25 transition flex items-center justify-center space-x-2"
            >
              <Zap size={18} />
              <span>Launch Instant Scanner (Current Page)</span>
            </button>
            <button
              onClick={() => openAuth('register')}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25 transition"
            >
              <span>Create Free Account</span>
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="flex items-center space-x-2">
              <Scale className="text-blue-500" size={20} />
              <span className="text-lg font-bold text-white">{t('appName')}</span>
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                PCR 2011 Compliant
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Production-Grade Legal Metrology & Commodity Inspection Intelligence System.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-400">
            <button onClick={() => navigate('/analyze')} className="hover:text-white transition">Instant Scanner</button>
            <button onClick={() => navigate('/rules')} className="hover:text-white transition">Statutory Rules</button>
            <button onClick={() => openAuth('login')} className="hover:text-white transition">{t('signIn')}</button>
            <button onClick={() => openAuth('register')} className="hover:text-white transition">{t('signUp')}</button>
            <a
              href="https://consumeraffairs.nic.in"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition flex items-center space-x-1"
            >
              <span>Ministry of Consumer Affairs</span>
              <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </footer>

      {/* Auth Modal (Sign In / Sign Up) */}
      {authModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
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
              <h2 className="text-xl font-black tracking-tight text-white">
                {authMode === 'login' ? t('signIn') : t('createAccount')}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {authMode === 'login'
                  ? 'Access your saved inspections, rules, and analytical reports'
                  : 'Join regulatory officers, QA teams, and brand inspectors'}
              </p>
            </div>

            {/* Switch Tabs */}
            <div className="flex rounded-xl bg-slate-950 p-1 mb-5 border border-slate-800">
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

            {/* Auth Form */}
            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center space-x-2 bg-red-950/60 border border-red-800/60 text-red-200 px-3.5 py-2.5 rounded-xl text-xs">
                  <AlertTriangle size={15} className="text-red-400 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {authMode === 'register' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {t('fullName')}
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Officer Sharma"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {t('role')}
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-blue-500 text-sm"
                    >
                      <option value="inspector">{t('inspectorRole')}</option>
                      <option value="admin">{t('adminRole')}</option>
                      <option value="consumer">Consumer / Public</option>
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {t('emailAddress')}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@metrology.ai"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {t('password')}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm"
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
                  <span>{authMode === 'register' ? t('signUp') : t('signIn')}</span>
                )}
              </button>
            </form>

            {/* Quick 1-Click Demo Accounts */}
            {authMode === 'login' && (
              <div className="mt-5 pt-4 border-t border-slate-800">
                <p className="text-[11px] text-slate-400 mb-2.5 text-center font-medium">
                  Quick 1-Click Test Access:
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => quickDemoLogin('inspector')}
                    className="text-xs px-2 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition text-center"
                    title="Sign in as Field Inspector"
                  >
                    ⚡ Inspector
                  </button>
                  <button
                    type="button"
                    onClick={() => quickDemoLogin('admin')}
                    className="text-xs px-2 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition text-center"
                    title="Sign in as Compliance Officer"
                  >
                    🛡️ Officer
                  </button>
                  <button
                    type="button"
                    onClick={() => quickDemoLogin('consumer')}
                    className="text-xs px-2 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition text-center"
                    title="Sign in as Consumer"
                  >
                    🛒 Consumer
                  </button>
                </div>
              </div>
            )}

            {/* Direct Connect to Current Page without Login */}
            <div className="mt-4 pt-3 border-t border-slate-800/80 text-center">
              <button
                onClick={() => {
                  setAuthModalOpen(false)
                  navigate('/analyze')
                }}
                className="inline-flex items-center space-x-1.5 text-xs text-teal-400 hover:text-teal-300 font-semibold"
              >
                <Zap size={13} />
                <span>Skip login → Launch Instant Scanner (Current Page)</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}

export default LandingPage
