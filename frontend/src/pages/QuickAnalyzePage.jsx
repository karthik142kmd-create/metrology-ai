import React, { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { analysisAPI } from '../services/api'
import {
  UploadCloud, CheckCircle2, XCircle, AlertTriangle, Sparkles,
  FileText, ShieldCheck, Scale, RefreshCw, Eye, Printer, Download,
  ExternalLink, ChevronRight, Info, Check, HelpCircle, ArrowRight
} from 'lucide-react'

// Mandatory Government Legal Metrology PCR 2011 Declarations
const GOVERNMENT_MANDATES = [
  {
    field: 'mrp',
    name: 'Maximum Retail Price (MRP)',
    rule: 'Rule 6(1)(e), LM(PC) Rules 2011',
    requirement: 'Mandatory declaration inclusive of all taxes with currency symbol (₹ or Rs.)',
    penalty: 'Fine up to ₹25,000 for first offence under Section 36(1) of LM Act 2009',
    icon: '₹'
  },
  {
    field: 'net_quantity',
    name: 'Net Quantity / Weight',
    rule: 'Rule 6(1)(c) & Second Schedule',
    requirement: 'Metric units (g, kg, ml, l, pcs) with mandatory lowercase casing for symbols',
    penalty: 'Fine up to ₹20,000 under Section 30 of LM Act 2009',
    icon: '⚖️'
  },
  {
    field: 'manufacturer',
    name: 'Manufacturer / Packer / Importer',
    rule: 'Rule 6(1)(a), LM(PC) Rules 2011',
    requirement: 'Prominent name of manufacturer, packer, or importer',
    penalty: 'Fine up to ₹25,000 for misdeclaration under Section 36',
    icon: '🏭'
  },
  {
    field: 'address',
    name: 'Complete Postal Address',
    rule: 'Rule 6(1)(a), LM(PC) Rules 2011',
    requirement: 'Complete address with City, State, and PIN code for consumer contact',
    penalty: 'Procedural violation notice and fine up to ₹10,000',
    icon: '📍'
  },
  {
    field: 'date',
    name: 'Date of Mfg / Packing / Import',
    rule: 'Rule 6(1)(d), LM(PC) Rules 2011',
    requirement: 'Month and Year of manufacture or packaging (e.g. 08/2026 or Aug 2026)',
    penalty: 'Sale prohibited post-expiry; packaging penalty up to ₹25,000',
    icon: '📅'
  },
  {
    field: 'consumer_care',
    name: 'Consumer Care Helpline & Email',
    rule: 'Rule 6(1)(f), LM(PC) Rules 2011',
    requirement: 'Toll-free telephone number or email address for customer complaints',
    penalty: 'Statutory fine up to ₹25,000 under Rule 32',
    icon: '📞'
  },
  {
    field: 'country_of_origin',
    name: 'Country of Origin',
    rule: 'Rule 6(1)(a) Amendment 2017/2020',
    requirement: 'Mandatory country of origin declaration on all pre-packaged commodities',
    penalty: 'Customs hold and penalty up to ₹50,000',
    icon: '🌐'
  },
  {
    field: 'product_name',
    name: 'Commodity Generic Name',
    rule: 'Rule 6(1)(b), LM(PC) Rules 2011',
    requirement: 'Common or generic description of the commodity contained in package',
    penalty: 'Fine up to ₹15,000 for non-disclosure of commodity name',
    icon: '🏷️'
  }
]

const SAMPLE_LABELS = [
  {
    id: 'rice',
    title: '🌾 Basmati Rice (100% Compliant)',
    filename: 'sample_rice_compliant.jpg',
    url: '/samples/sample_rice_compliant.jpg',
    desc: 'Contains all 8 government declarations with proper metric units & tax notice.'
  },
  {
    id: 'oil',
    title: '🌻 Cooking Oil (100% Compliant)',
    filename: 'sample_oil_compliant.jpg',
    url: '/samples/sample_oil_compliant.jpg',
    desc: 'Volume declared in Litres (1 L) with manufacturer and helpline.'
  },
  {
    id: 'defective',
    title: '⚠️ Defective Snack (Non-Compliant)',
    filename: 'sample_defective_label.jpg',
    url: '/samples/sample_defective_label.jpg',
    desc: 'Missing mandatory MRP, Consumer Care, and full entity details.'
  }
]

export default function QuickAnalyzePage() {
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [progressStep, setProgressStep] = useState('')
  const [results, setResults] = useState(null)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('checklist') // 'checklist' | 'ocr' | 'remedies'
  const [isDragOver, setIsDragOver] = useState(false)

  const fileInputRef = useRef(null)

  // Handle local file selection
  const handleFileSelect = (file) => {
    if (!file) return
    setError('')
    if (file.size > 15 * 1024 * 1024) {
      setError('File size exceeds 15MB limit')
      return
    }
    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    setResults(null)
  }

  // Load sample image
  const loadSample = async (sample) => {
    try {
      setError('')
      setProgressStep('Loading sample packaging image...')
      const response = await fetch(sample.url)
      const blob = await response.blob()
      const file = new File([blob], sample.filename, { type: 'image/jpeg' })
      setSelectedFile(file)
      setPreviewUrl(sample.url)
      setResults(null)
      setProgressStep('')
    } catch (err) {
      console.error('Failed to load sample:', err)
      setError('Failed to load sample image')
    }
  }

  // Run Quick Analysis
  const handleAnalyze = async () => {
    if (!selectedFile) {
      setError('Please upload or select an image of the packaged commodity label.')
      return
    }

    try {
      setAnalyzing(true)
      setError('')
      setProgressStep('Initializing Tesseract OCR & adaptive label preprocessing...')

      const timer1 = setTimeout(() => {
        setProgressStep('Extracting mandatory Legal Metrology declarations...')
      }, 1200)

      const timer2 = setTimeout(() => {
        setProgressStep('Auditing against Government PCR 2011 Rules & computing compliance rate...')
      }, 2400)

      const res = await analysisAPI.quickAnalyze(selectedFile, 'General')

      clearTimeout(timer1)
      clearTimeout(timer2)

      setResults(res.data)
      setProgressStep('')
    } catch (err) {
      console.error('Analysis error:', err)
      setError(
        err.response?.data?.detail ||
        'Image analysis failed. Please ensure the image is clear and contains visible text.'
      )
    } finally {
      setAnalyzing(false)
      setProgressStep('')
    }
  }

  // Reset scanner
  const handleReset = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setResults(null)
    setError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Determine compliance score styling
  const complianceRate = results ? results.compliance_rate : 0
  const isPass = results?.compliance_result === 'PASS'
  const isReview = results?.compliance_result === 'REVIEW'
  const isFail = results?.compliance_result === 'FAIL'

  const getScoreColor = () => {
    if (complianceRate >= 90) return 'text-emerald-400'
    if (complianceRate >= 65) return 'text-amber-400'
    return 'text-rose-500'
  }

  const getBadgeStyle = () => {
    if (isPass) {
      return {
        bg: 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300',
        label: 'GOVERNMENT COMPLIANT (PASS)',
        icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />
      }
    }
    if (isReview) {
      return {
        bg: 'bg-amber-950/70 border-amber-500/40 text-amber-300',
        label: 'PARTIAL COMPLIANCE (REVIEW REQUIRED)',
        icon: <AlertTriangle className="w-5 h-5 text-amber-400" />
      }
    }
    return {
      bg: 'bg-rose-950/70 border-rose-500/40 text-rose-300',
      label: 'NON-COMPLIANT (VIOLATIONS DETECTED)',
      icon: <XCircle className="w-5 h-5 text-rose-400" />
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Bar / Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3 hover:opacity-95 transition">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-teal-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Scale className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-white">MetrologyAI</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  PCR 2011 REGULATORY ENGINE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Legal Metrology Act 2009 & Packaged Commodities Compliance Inspector
              </p>
            </div>
          </Link>

          <div className="flex items-center space-x-2 sm:space-x-3">
            <Link
              to="/"
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-300 hover:text-white bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 transition flex items-center space-x-1"
            >
              <span>← Why Compliance Matters</span>
            </Link>
            <Link
              to="/dashboard"
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition hidden sm:inline-block"
            >
              Dashboard
            </Link>
            <Link
              to="/login"
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 transition"
            >
              Sign In
            </Link>
            <a
              href="https://consumeraffairs.nic.in"
              target="_blank"
              rel="noreferrer"
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hidden md:flex items-center space-x-1 border border-slate-800 hover:border-slate-700 transition"
            >
              <span>Dept. of Consumer Affairs</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/20 p-6 sm:p-8">
          <div className="absolute -right-12 -top-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-medium mb-3">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>OFFICIAL GOVERNMENT PACKAGING AUDIT</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug">
              Instant Packaged Commodity Compliance Verification
            </h1>
            <p className="mt-2 text-sm sm:text-base text-slate-300 leading-relaxed">
              Upload any product packaging or label image to automatically audit all mandatory declarations
              required under the <span className="text-white font-medium">Legal Metrology (Packaged Commodities) Rules, 2011</span> and calculate the exact statutory <span className="text-emerald-400 font-semibold">Compliance Rate</span>.
            </p>
          </div>
        </div>

        {/* Upload & Action Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Image Upload & Preview */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  1. Upload Commodity Label Image
                </span>
                {selectedFile && (
                  <button
                    onClick={handleReset}
                    className="text-xs text-rose-400 hover:text-rose-300 flex items-center space-x-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Clear</span>
                  </button>
                )}
              </div>

              {/* Drag & Drop Zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setIsDragOver(false)
                  if (e.dataTransfer.files?.[0]) handleFileSelect(e.dataTransfer.files[0])
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 overflow-hidden flex flex-col items-center justify-center ${
                  previewUrl
                    ? 'border-indigo-500/50 bg-slate-950/80 p-2 min-h-[300px]'
                    : isDragOver
                      ? 'border-indigo-400 bg-indigo-950/30 min-h-[260px]'
                      : 'border-slate-700/80 hover:border-indigo-500/60 bg-slate-950/40 hover:bg-slate-950/70 min-h-[260px]'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleFileSelect(e.target.files[0])
                  }}
                />

                {previewUrl ? (
                  <div className="relative w-full h-full flex flex-col items-center">
                    <img
                      src={previewUrl}
                      alt="Uploaded Label Preview"
                      className="max-h-[340px] w-auto rounded-lg object-contain border border-slate-800 shadow-md"
                    />
                    <div className="mt-3 text-center">
                      <p className="text-xs font-medium text-slate-300 truncate max-w-[280px]">
                        {selectedFile?.name || 'Selected Label Image'}
                      </p>
                      <p className="text-[10px] text-indigo-400 mt-0.5">Click to choose another image</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center space-y-3">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition">
                      <UploadCloud className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-200">
                        Drag and drop label photo here
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        or click to browse from device (JPG, PNG, WEBP up to 15MB)
                      </p>
                    </div>
                    <span className="inline-block px-3 py-1 text-[11px] font-medium text-indigo-300 bg-indigo-950/50 border border-indigo-500/30 rounded-full">
                      Captures Rice, Oils, Biscuits, Cosmetics, etc.
                    </span>
                  </div>
                )}
              </div>

              {/* Sample Images Quick Loader */}
              <div className="mt-4 pt-4 border-t border-slate-800/80">
                <p className="text-xs font-semibold text-slate-400 mb-2 flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Or test with verified sample packaging:</span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {SAMPLE_LABELS.map((sample) => (
                    <button
                      key={sample.id}
                      type="button"
                      onClick={() => loadSample(sample)}
                      className="text-left px-2.5 py-2 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800/50 transition group"
                    >
                      <p className="text-xs font-semibold text-slate-200 group-hover:text-indigo-300 truncate">
                        {sample.title}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                        {sample.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mt-4 p-3 rounded-xl bg-rose-950/50 border border-rose-500/30 text-rose-300 text-xs flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Action Button */}
              <div className="mt-5">
                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={!selectedFile || analyzing}
                  className={`w-full py-3.5 px-5 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg ${
                    !selectedFile || analyzing
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                      : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-500 hover:from-blue-500 hover:to-teal-400 text-white shadow-indigo-500/25 active:scale-[0.99]'
                  }`}
                >
                  {analyzing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>{progressStep || 'Analyzing Packaging Declarations...'}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Analyze Image & Check Government Compliance</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Statutory Reference Box */}
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-4 text-xs text-slate-400 space-y-2">
              <div className="flex items-center space-x-2 text-slate-300 font-semibold">
                <Info className="w-4 h-4 text-blue-400" />
                <span>Statutory Legal Metrology Scope</span>
              </div>
              <p className="leading-relaxed">
                Under the Legal Metrology (Packaged Commodities) Rules 2011, pre-packaged goods sold in India
                must declare MRP, Net Quantity, Manufacturer details, Packing Date, Consumer Care, and Country of Origin.
                Any non-declaration or deceptive packaging attracts prosecution under Section 36 of the LM Act.
              </p>
            </div>
          </div>

          {/* Right Column: Government Compliance Rate & Results */}
          <div className="lg:col-span-7 space-y-5">
            {results ? (
              <>
                {/* Compliance Rate Master Card */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur-sm relative overflow-hidden">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    
                    {/* Left: Gauge & Score */}
                    <div className="flex items-center space-x-5">
                      {/* Circular Gauge */}
                      <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                          {/* Background Circle */}
                          <path
                            className="text-slate-800"
                            strokeWidth="3.5"
                            stroke="currentColor"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          {/* Progress Circle */}
                          <path
                            className={
                              complianceRate >= 90
                                ? 'text-emerald-500'
                                : complianceRate >= 65
                                  ? 'text-amber-500'
                                  : 'text-rose-500'
                            }
                            strokeDasharray={`${complianceRate}, 100`}
                            strokeLinecap="round"
                            strokeWidth="3.5"
                            stroke="currentColor"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                          <span className={`text-xl font-extrabold ${getScoreColor()}`}>
                            {complianceRate}%
                          </span>
                          <span className="text-[9px] uppercase font-bold text-slate-400">Score</span>
                        </div>
                      </div>

                      {/* Status Text & Details */}
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                            Legal Metrology Compliance Rate
                          </span>
                        </div>
                        <div className="mt-1 flex items-center space-x-2">
                          <div className={`px-3 py-1 rounded-lg border text-xs font-bold flex items-center space-x-1.5 ${getBadgeStyle().bg}`}>
                            {getBadgeStyle().icon}
                            <span>{getBadgeStyle().label}</span>
                          </div>
                        </div>
                        <p className="text-xs text-slate-400 mt-2">
                          {results.summary.passed_rules} of {results.summary.total_rules} mandatory government declarations compliant
                        </p>
                      </div>
                    </div>

                    {/* Right: Quick Action Buttons */}
                    <div className="flex items-center space-x-2 sm:self-center w-full sm:w-auto">
                      <button
                        onClick={() => window.print()}
                        className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center justify-center space-x-1.5 transition"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print Report</span>
                      </button>
                      <button
                        onClick={handleReset}
                        className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-medium border border-indigo-500/30 flex items-center justify-center space-x-1.5 transition"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>New Scan</span>
                      </button>
                    </div>
                  </div>

                  {/* Summary Metric Badges */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800">
                    <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/80">
                      <p className="text-[11px] text-slate-400">Total Mandates</p>
                      <p className="text-lg font-bold text-white mt-0.5">{results.summary.total_rules}</p>
                    </div>
                    <div className="bg-slate-950/60 rounded-xl p-3 border border-emerald-900/30">
                      <p className="text-[11px] text-emerald-400">Compliant (Pass)</p>
                      <p className="text-lg font-bold text-emerald-400 mt-0.5">{results.summary.passed_rules}</p>
                    </div>
                    <div className="bg-slate-950/60 rounded-xl p-3 border border-rose-900/30">
                      <p className="text-[11px] text-rose-400">Missing / Failed</p>
                      <p className="text-lg font-bold text-rose-400 mt-0.5">{results.summary.failed_rules}</p>
                    </div>
                    <div className="bg-slate-950/60 rounded-xl p-3 border border-amber-900/30">
                      <p className="text-[11px] text-amber-400">Review Required</p>
                      <p className="text-lg font-bold text-amber-400 mt-0.5">{results.summary.review_rules}</p>
                    </div>
                  </div>
                </div>

                {/* Audit Tabs */}
                <div className="flex border-b border-slate-800 space-x-4">
                  <button
                    onClick={() => setActiveTab('checklist')}
                    className={`pb-3 text-xs font-bold uppercase tracking-wider transition border-b-2 flex items-center space-x-2 ${
                      activeTab === 'checklist'
                        ? 'border-indigo-500 text-indigo-400'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Government Checklist Audit ({results.rule_results?.length || 8})</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('ocr')}
                    className={`pb-3 text-xs font-bold uppercase tracking-wider transition border-b-2 flex items-center space-x-2 ${
                      activeTab === 'ocr'
                        ? 'border-indigo-500 text-indigo-400'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span>OCR Extracted Text</span>
                  </button>
                  {results.ai_assessment && (
                    <button
                      onClick={() => setActiveTab('remedies')}
                      className={`pb-3 text-xs font-bold uppercase tracking-wider transition border-b-2 flex items-center space-x-2 ${
                        activeTab === 'remedies'
                          ? 'border-indigo-500 text-indigo-400'
                          : 'border-transparent text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      <span>Legal Remedies & Penalties</span>
                    </button>
                  )}
                </div>

                {/* Tab 1: Checklist Audit View */}
                {activeTab === 'checklist' && (
                  <div className="space-y-3">
                    {results.rule_results?.map((res, idx) => {
                      const isRulePass = res.status === 'PASS'
                      const isRuleFail = res.status === 'FAIL'
                      const isRuleReview = res.status === 'REVIEW'

                      return (
                        <div
                          key={res.rule_id || idx}
                          className={`rounded-xl border p-4 transition-all ${
                            isRulePass
                              ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                              : isRuleFail
                                ? 'bg-rose-950/20 border-rose-500/30 hover:border-rose-500/50'
                                : 'bg-amber-950/20 border-amber-500/30 hover:border-amber-500/50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start space-x-3">
                              <div className="mt-0.5">
                                {isRulePass && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                                {isRuleFail && <XCircle className="w-5 h-5 text-rose-400" />}
                                {isRuleReview && <AlertTriangle className="w-5 h-5 text-amber-400" />}
                              </div>
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-sm font-bold text-white">
                                    {res.rule_name || res.field}
                                  </span>
                                  {res.legal_reference && (
                                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                                      {res.legal_reference}
                                    </span>
                                  )}
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-950/50 text-indigo-300 font-mono">
                                    {res.points} pts
                                  </span>
                                </div>
                                <p className="text-xs text-slate-400 mt-1">
                                  {res.description}
                                </p>
                              </div>
                            </div>

                            {/* Status Badge */}
                            <span
                              className={`shrink-0 px-2.5 py-1 rounded-md text-[11px] font-extrabold tracking-wider ${
                                isRulePass
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : isRuleFail
                                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              }`}
                            >
                              {res.status}
                            </span>
                          </div>

                          {/* Detected Value & Discrepancy details */}
                          <div className="mt-3.5 pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/80">
                              <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                                Extracted from Packaging Label
                              </span>
                              {res.detected_value ? (
                                <span className="font-mono text-emerald-300 font-medium">
                                  {res.detected_value}
                                </span>
                              ) : (
                                <span className="text-rose-400 font-semibold italic">
                                  ⚠️ Not declared or not detected on label
                                </span>
                              )}
                            </div>

                            <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/80">
                              <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                                Government Mandate & Penalty Note
                              </span>
                              <p className="text-slate-300 leading-snug">
                                {res.penalty_info || res.expected_value || 'Mandatory PCR 2011 compliance'}
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Tab 2: Raw OCR Text */}
                {activeTab === 'ocr' && (
                  <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Full Label OCR Transcription
                      </span>
                      <span className="text-xs text-indigo-400">
                        Confidence: {Math.round((results.ocr_confidence || 0.9) * 100)}%
                      </span>
                    </div>
                    <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-xs font-mono leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto">
                      {results.ocr_text || 'No text detected from image.'}
                    </pre>
                  </div>
                )}

                {/* Tab 3: Legal Remedies & Penalties */}
                {activeTab === 'remedies' && results.ai_assessment && (
                  <div className="space-y-4">
                    {/* Risk Level Badge */}
                    <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="text-xs text-slate-400 uppercase font-semibold">Statutory Risk Level</span>
                        <h4 className="text-base font-bold text-white mt-0.5">
                          {results.ai_assessment.risk_level || 'EVALUATION COMPLETED'}
                        </h4>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-400">Potential Penalties</span>
                        <p className="text-xs font-semibold text-rose-400 mt-0.5">
                          Up to ₹50,000 under LM Act 2009
                        </p>
                      </div>
                    </div>

                    {/* Recommendations List */}
                    {results.ai_assessment.recommendations?.length > 0 && (
                      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center space-x-1.5">
                          <AlertTriangle className="w-4 h-4" />
                          <span>Required Corrective Actions Prior to Distribution</span>
                        </h4>
                        <ul className="space-y-2">
                          {results.ai_assessment.recommendations.map((rec, i) => (
                            <li key={i} className="text-xs text-slate-300 flex items-start space-x-2 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/80">
                              <span className="text-amber-400 font-bold">•</span>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              /* Empty / Standby State */
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-8 sm:p-12 text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Scale className="w-8 h-8" />
                </div>
                <div className="max-w-md mx-auto space-y-2">
                  <h3 className="text-lg font-bold text-white">
                    Ready for Government Compliance Audit
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    Upload your product label image on the left or click any of the sample commodities to begin.
                    The system will instantly evaluate all mandatory PCR 2011 declarations.
                  </p>
                </div>

                {/* Government Rules Preview Card Grid */}
                <div className="mt-8 text-left max-w-xl mx-auto pt-6 border-t border-slate-800">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                    8 Mandatory Declarations Evaluated Under Government PCR:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {GOVERNMENT_MANDATES.map((m) => (
                      <div
                        key={m.field}
                        className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center space-x-2.5"
                      >
                        <span className="w-6 h-6 rounded-md bg-indigo-950 flex items-center justify-center text-xs font-mono text-indigo-300 shrink-0">
                          {m.icon}
                        </span>
                        <div className="truncate">
                          <p className="font-semibold text-slate-200 truncate">{m.name}</p>
                          <p className="text-[10px] text-slate-400 truncate">{m.rule}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            MetrologyAI — AI-Assisted Legal Metrology Compliance Inspection System
          </p>
          <p className="text-slate-400 text-[11px]">
            Legal Metrology Act 2009 & Packaged Commodities Rules 2011 Verification Engine
          </p>
        </div>
      </footer>
    </div>
  )
}
