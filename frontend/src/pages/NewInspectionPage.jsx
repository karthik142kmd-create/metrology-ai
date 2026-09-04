import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { inspectionsAPI, productsAPI } from '../services/api'
import { useLanguage } from '../context/LanguageContext'
import {
  Upload, X, CheckCircle, AlertCircle, Zap, Camera,
  Sparkles, ArrowLeft, ArrowRight, ShieldAlert, CheckCircle2
} from 'lucide-react'

function NewInspectionPage() {
  const { t } = useLanguage()
  const [step, setStep] = useState(1)
  const [category, setCategory] = useState('')
  const [productId, setProductId] = useState('')
  const [products, setProducts] = useState([])
  const [images, setImages] = useState([])
  const [inspectionId, setInspectionId] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [scanResults, setScanResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const fileInputRef = useRef(null)
  const cameraInputRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetchProducts()
  }, [category])

  const fetchProducts = async () => {
    if (!category) return
    try {
      const response = await productsAPI.getAll(0, 50, category)
      setProducts(response.data)
    } catch (err) {
      console.error('Failed to fetch products:', err)
    }
  }

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || [])
    files.forEach(file => {
      if (file.size > 10 * 1024 * 1024) {
        setError('File size exceeds 10MB limit')
        return
      }
      const reader = new FileReader()
      reader.onload = (event) => {
        setImages(prev => [...prev, {
          file,
          preview: event.target.result,
          name: file.name
        }])
      }
      reader.readAsDataURL(file)
    })
  }

  const handleRemoveImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleCreateInspection = async () => {
    if (!productId || images.length === 0) {
      setError('Please select a product and upload at least one image')
      return
    }

    try {
      setLoading(true)
      const response = await inspectionsAPI.create({
        product_id: parseInt(productId),
        category: category
      })
      const newId = response.data.id
      setInspectionId(newId)
      
      // Upload images
      await inspectionsAPI.uploadImages(newId, images.map(i => i.file), 'front')
      
      setStep(4)
      setError('')
      setLoading(false)
      
      // Auto-trigger scan immediately
      await executeScan(newId)
    } catch (err) {
      setError('Failed to create inspection')
      console.error(err)
      setLoading(false)
    }
  }

  const executeScan = async (targetId) => {
    const id = targetId || inspectionId
    if (!id) return

    try {
      setScanning(true)
      setError('')
      const response = await inspectionsAPI.scan(id)
      setScanResults(response.data)
      setStep(4)
    } catch (err) {
      console.error('Backend scan failed or timed out:', err)
      setError('Packaging compliance scan failed or timed out. Please ensure the backend server is reachable and click "Run Full AI Scan" to retry.')
    } finally {
      setScanning(false)
    }
  }

  const handleScan = () => executeScan(inspectionId)

  const handleViewResults = () => {
    if (inspectionId) {
      navigate(`/inspections/${inspectionId}`)
    }
  }

  const handleDemoScan = async () => {
    try {
      setLoading(true)
      const prodResponse = await productsAPI.getAll(0, 1)
      if (prodResponse.data.length === 0) {
        setError('No products available for demo. Please create a product first.')
        setLoading(false)
        return
      }

      const inspRes = await inspectionsAPI.create({
        product_id: prodResponse.data[0].id,
        category: prodResponse.data[0].category
      })
      
      const newId = inspRes.data.id
      setInspectionId(newId)
      setCategory(prodResponse.data[0].category)
      setProductId(prodResponse.data[0].id)
      setStep(4)
      setLoading(false)
      await executeScan(newId)
    } catch (err) {
      setError('Demo creation failed')
      console.error(err)
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Progress Steps */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between">
          {[
            { num: 1, label: t('step1Title') },
            { num: 2, label: t('step2Title') },
            { num: 3, label: t('step3Title') },
            { num: 4, label: t('step4Title') }
          ].map((s, idx) => (
            <React.Fragment key={s.num}>
              <div className="flex flex-col items-center">
                <div
                  className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full font-bold text-xs sm:text-sm transition duration-150 ${
                    s.num <= step
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                      : 'bg-slate-100 text-slate-400 border border-slate-200'
                  }`}
                >
                  {s.num}
                </div>
                <span className="text-[10px] sm:text-xs text-slate-500 mt-1.5 hidden md:block max-w-[90px] text-center truncate">
                  {s.label}
                </span>
              </div>
              {idx < 3 && (
                <div
                  className={`flex-1 h-1 mx-2 sm:mx-4 rounded-full transition-colors ${
                    s.num < step ? 'bg-blue-600' : 'bg-slate-200'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center space-x-2 text-sm shadow-sm">
          <AlertCircle size={18} className="shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Step 1: Category Selection */}
      {step === 1 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-2">{t('step1Title')}</h2>
          <p className="text-xs sm:text-sm text-slate-500 mb-6">
            Choose the commodity category to apply tailored Legal Metrology rule profiles.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            {[
              { id: 'Food', label: 'Food & Groceries', icon: '🍚' },
              { id: 'Beverage', label: 'Beverages & Juices', icon: '🥤' },
              { id: 'Cosmetic', label: 'Cosmetics & Care', icon: '🧴' },
              { id: 'Household', label: 'Household Cleaners', icon: '🧼' },
              { id: 'Electronic', label: 'Electronics & Appliances', icon: '⚡' },
              { id: 'Other', label: 'General Goods', icon: '📦' }
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setCategory(cat.id)
                  setStep(2)
                }}
                className={`p-4 sm:p-5 rounded-2xl border-2 text-left transition flex flex-col justify-between h-28 sm:h-32 ${
                  category === cat.id
                    ? 'border-blue-600 bg-blue-50/50 shadow-md ring-2 ring-blue-500/20'
                    : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50'
                }`}
              >
                <span className="text-2xl sm:text-3xl">{cat.icon}</span>
                <div>
                  <p className="font-bold text-sm sm:text-base text-slate-800">{cat.id}</p>
                  <p className="text-[11px] text-slate-500 truncate">{cat.label}</p>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-slate-400">Want to test with sample data immediately?</span>
            <button
              onClick={handleDemoScan}
              disabled={loading}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-2.5 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-xl hover:bg-indigo-100 transition text-xs font-bold disabled:opacity-50"
            >
              <Zap size={15} />
              <span>{loading ? 'Setting up Demo...' : 'Instant Demo Inspection'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Product Selection */}
      {step === 2 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-800">{t('step2Title')}</h2>
              <p className="text-xs sm:text-sm text-slate-500">Category: <span className="font-semibold text-blue-600">{category}</span></p>
            </div>
            <button
              onClick={() => setStep(1)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center space-x-1"
            >
              <ArrowLeft size={14} />
              <span>Change Category</span>
            </button>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {products.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-sm">
                No products found in this category. You can add one under the Products tab.
              </div>
            ) : (
              products.map((product) => (
                <button
                  key={product.id}
                  onClick={() => {
                    setProductId(product.id)
                    setStep(3)
                  }}
                  className="w-full p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 text-left transition flex items-center justify-between group"
                >
                  <div>
                    <p className="font-bold text-slate-800 text-sm sm:text-base group-hover:text-blue-700">
                      {product.product_name}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Mfg: {product.manufacturer || 'Unspecified'} • Net: {product.net_quantity || 'N/A'} • MRP: {product.mrp || 'N/A'}
                    </p>
                  </div>
                  <ArrowRight size={18} className="text-slate-400 group-hover:text-blue-600 transition shrink-0" />
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Step 3: Image Upload with Mobile Camera Support */}
      {step === 3 && !inspectionId && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-800">{t('step3Title')}</h2>
              <p className="text-xs sm:text-sm text-slate-500">Capture or upload packaging label images for high-resolution OCR analysis.</p>
            </div>
            <button
              onClick={() => setStep(2)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center space-x-1"
            >
              <ArrowLeft size={14} />
              <span>Back</span>
            </button>
          </div>

          {/* Desktop & Mobile Dropzone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              handleImageUpload({ target: { files: e.dataTransfer.files } })
            }}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-blue-300 rounded-2xl p-8 sm:p-12 text-center cursor-pointer hover:border-blue-600 hover:bg-blue-50/40 transition bg-slate-50/60"
          >
            <Upload size={40} className="mx-auto text-blue-500 mb-3" />
            <p className="text-base font-bold text-slate-700">{t('takePhoto')}</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">{t('takePhotoDesc')}</p>
          </div>

          {/* Mobile Camera Direct Button */}
          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center justify-center space-x-2 transition shadow-sm"
            >
              <Camera size={18} className="text-blue-600" />
              <span>Use Device Camera</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center justify-center space-x-2 transition shadow-sm"
            >
              <Upload size={18} className="text-indigo-600" />
              <span>Browse Local Gallery / Files</span>
            </button>
          </div>

          {/* Hidden inputs */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleImageUpload}
            className="hidden"
          />

          {/* Previews */}
          {images.length > 0 && (
            <div className="mt-6 pt-6 border-t border-slate-100">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-600 mb-3">
                Selected Photos ({images.length})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {images.map((img, idx) => (
                  <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-square">
                    <img src={img.preview} alt={img.name} className="w-full h-full object-cover" />
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRemoveImage(idx) }}
                      className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-lg opacity-90 hover:opacity-100 transition shadow-md"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleCreateInspection}
            disabled={loading || images.length === 0}
            className="w-full mt-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-600/25 transition font-bold text-sm disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            <span>{loading ? 'Creating Inspection...' : 'Continue to AI Scan & Audit'}</span>
            <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* Step 4: Scanning & Live Results */}
      {step >= 3 && inspectionId && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-4">{t('step4Title')}</h2>

          {scanning ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto animate-pulse">
                <Sparkles size={32} className="animate-spin-slow" />
              </div>
              <p className="text-lg font-bold text-slate-800">{t('scanningMsg')}</p>
              <div className="max-w-xs mx-auto space-y-2 text-xs text-slate-500 text-left bg-slate-50 p-4 rounded-xl border border-slate-200">
                <p className="flex items-center space-x-2">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  <span>Dual-Pass Tesseract OCR Engine</span>
                </p>
                <p className="flex items-center space-x-2">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  <span>CLAHE Contrast & Deskewing Filter</span>
                </p>
                <p className="flex items-center space-x-2">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  <span>Legal Metrology PCR 2011 Rule Check</span>
                </p>
                <p className="flex items-center space-x-2">
                  <CheckCircle2 size={14} className="text-blue-500 animate-pulse" />
                  <span>AI Semantic Risk & Penalty Reasoning</span>
                </p>
              </div>
            </div>
          ) : !scanResults ? (
            <div className="text-center py-8">
              <p className="text-sm text-slate-600 mb-6">
                Images are uploaded and ready. Click below to execute the full AI and OCR analysis.
              </p>
              <button
                onClick={handleScan}
                disabled={scanning}
                className="w-full sm:w-auto px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-600/30 transition font-bold text-sm flex items-center justify-center space-x-2 mx-auto"
              >
                <Zap size={18} />
                <span>{t('runScanBtn')}</span>
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Score banner */}
              <div className={`text-center p-6 rounded-2xl border ${
                scanResults.compliance_result === 'PASS'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : scanResults.compliance_result === 'FAIL'
                  ? 'bg-red-50 border-red-200 text-red-800'
                  : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}>
                <p className="text-xs uppercase font-bold tracking-wider mb-1">{t('complianceScore')}</p>
                <h3 className="text-4xl sm:text-5xl font-black mb-1">{scanResults.compliance_score}%</h3>
                <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/80 shadow-sm">
                  {scanResults.compliance_result}
                </span>
              </div>

              {/* Stat grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-center">
                  <p className="text-xs text-slate-500">Total Rules</p>
                  <p className="text-xl font-bold text-slate-800">{scanResults.total_rules}</p>
                </div>
                <div className="bg-emerald-50 p-3.5 rounded-xl border border-emerald-200 text-center">
                  <p className="text-xs text-emerald-600">Passed</p>
                  <p className="text-xl font-bold text-emerald-700">{scanResults.passed_rules}</p>
                </div>
                <div className="bg-red-50 p-3.5 rounded-xl border border-red-200 text-center">
                  <p className="text-xs text-red-600">Failed</p>
                  <p className="text-xl font-bold text-red-700">{scanResults.failed_rules}</p>
                </div>
                <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-200 text-center">
                  <p className="text-xs text-amber-600">Review</p>
                  <p className="text-xl font-bold text-amber-700">{scanResults.review_rules}</p>
                </div>
              </div>

              {/* AI Assessment Sneak Peek if present */}
              {scanResults.ai_assessment && (
                <div className="bg-indigo-50/60 border border-indigo-200 rounded-xl p-4 text-xs space-y-2">
                  <div className="flex items-center justify-between font-bold text-indigo-900">
                    <span className="flex items-center space-x-1.5">
                      <Sparkles size={16} className="text-indigo-600" />
                      <span>{t('aiAssistantTitle')}</span>
                    </span>
                    <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 text-[11px]">
                      Risk: {scanResults.ai_assessment.risk_level}
                    </span>
                  </div>
                  <p className="text-indigo-800 leading-relaxed">
                    {scanResults.ai_assessment.summary}
                  </p>
                </div>
              )}

              <button
                onClick={handleViewResults}
                className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-600/30 transition font-bold text-sm flex items-center justify-center space-x-2"
              >
                <span>View Full Legal Audit & PDF Report</span>
                <ArrowRight size={18} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default NewInspectionPage
