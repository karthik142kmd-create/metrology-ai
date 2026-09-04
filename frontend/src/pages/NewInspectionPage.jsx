import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { inspectionsAPI, productsAPI } from '../services/api'
import { Upload, X, CheckCircle, AlertCircle, Zap } from 'lucide-react'

function NewInspectionPage() {
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
      setInspectionId(response.data.id)
      
      // Upload images
      await inspectionsAPI.uploadImages(response.data.id, images.map(i => i.file), 'front')
      
      setStep(3)
      setError('')
    } catch (err) {
      setError('Failed to create inspection')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleScan = async () => {
    if (!inspectionId) return

    try {
      setScanning(true)
      const response = await inspectionsAPI.scan(inspectionId)
      setScanResults(response.data)
      setStep(4)
    } catch (err) {
      setError('Scan failed')
      console.error(err)
    } finally {
      setScanning(false)
    }
  }

  const handleViewResults = () => {
    if (inspectionId) {
      navigate(`/inspections/${inspectionId}`)
    }
  }

  const handleDemoScan = async () => {
    try {
      setLoading(true)
      // Create demo inspection
      const prodResponse = await productsAPI.getAll(0, 1)
      if (prodResponse.data.length === 0) {
        setError('No products available for demo')
        return
      }

      const inspRes = await inspectionsAPI.create({
        product_id: prodResponse.data[0].id,
        category: prodResponse.data[0].category
      })
      
      setInspectionId(inspRes.data.id)
      setCategory(prodResponse.data[0].category)
      setProductId(prodResponse.data[0].id)
      setStep(3)
    } catch (err) {
      setError('Demo failed')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {[1, 2, 3, 4].map((s) => (
          <React.Fragment key={s}>
            <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold transition ${
              s <= step
                ? 'bg-blue-600 text-white'
                : 'bg-gray-300 text-gray-600'
            }`}>
              {s}
            </div>
            {s < 4 && <div className={`flex-1 h-1 mx-2 ${s < step ? 'bg-blue-600' : 'bg-gray-300'}`} />}
          </React.Fragment>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center space-x-2">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Step 1: Category Selection */}
      {step === 1 && (
        <div className="card">
          <h2 className="text-2xl font-bold text-primary mb-6">Select Product Category</h2>
          <div className="grid grid-cols-2 gap-4">
            {['Food', 'Beverage', 'Cosmetic', 'Household', 'Electronic', 'Other'].map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setCategory(cat)
                  setStep(2)
                }}
                className={`p-6 rounded-lg border-2 transition font-semibold ${
                  category === cat
                    ? 'border-blue-600 bg-blue-50 text-blue-600'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-blue-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Demo Button */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={handleDemoScan}
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium disabled:opacity-50"
            >
              <Zap size={20} />
              <span>Try Demo Scan</span>
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Product Selection */}
      {step === 2 && (
        <div className="card">
          <h2 className="text-2xl font-bold text-primary mb-6">Select Product</h2>
          <div className="space-y-3">
            {products.map((product) => (
              <button
                key={product.id}
                onClick={() => {
                  setProductId(product.id)
                  setStep(3)
                }}
                className="w-full p-4 text-left border border-gray-300 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition"
              >
                <p className="font-semibold text-gray-900">{product.product_name}</p>
                <p className="text-sm text-gray-600">Manufacturer: {product.manufacturer}</p>
                <p className="text-sm text-gray-600">MRP: {product.mrp}</p>
              </button>
            ))}
          </div>
          <button
            onClick={() => setStep(1)}
            className="w-full mt-6 px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            Back
          </button>
        </div>
      )}

      {/* Step 3: Image Upload */}
      {step === 3 && !inspectionId && (
        <div className="card">
          <h2 className="text-2xl font-bold text-primary mb-6">Upload Product Images</h2>
          
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              handleImageUpload({ target: { files: e.dataTransfer.files } })
            }}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-blue-400 rounded-lg p-12 text-center cursor-pointer hover:border-blue-600 hover:bg-blue-50 transition"
          >
            <Upload size={48} className="mx-auto text-blue-400 mb-4" />
            <p className="text-lg font-semibold text-gray-700 mb-2">Drag and drop images here</p>
            <p className="text-sm text-gray-600">or click to select files</p>
            <p className="text-xs text-gray-500 mt-2">JPG, PNG, GIF • Max 10MB each</p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />

          {images.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold text-gray-700 mb-4">Uploaded Images ({images.length})</h3>
              <div className="grid grid-cols-3 gap-4">
                {images.map((img, idx) => (
                  <div key={idx} className="relative group">
                    <img src={img.preview} alt={img.name} className="w-full h-32 object-cover rounded-lg" />
                    <button
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleCreateInspection}
            disabled={loading || images.length === 0}
            className="w-full mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50"
          >
            {loading ? 'Creating Inspection...' : 'Continue to Scanning'}
          </button>
        </div>
      )}

      {/* Step 3-4: Scanning */}
      {step >= 3 && inspectionId && (
        <div className="card">
          <h2 className="text-2xl font-bold text-primary mb-6">Scanning Product...</h2>

          {scanning ? (
            <div className="text-center py-12">
              <div className="animate-spin-slow text-6xl mb-4">⚙️</div>
              <p className="text-lg text-gray-600 mb-2">Analyzing product...</p>
              <ul className="text-sm text-gray-600 space-y-1 mt-6">
                <li>✓ Image preprocessing</li>
                <li>✓ Text detection</li>
                <li>✓ OCR extraction</li>
                <li>✓ Declaration identification</li>
                <li>✓ Rule validation</li>
                <li>✓ Compliance assessment</li>
              </ul>
            </div>
          ) : !scanResults ? (
            <button
              onClick={handleScan}
              disabled={scanning}
              className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
            >
              Start Scan
            </button>
          ) : (
            <div>
              <div className={`text-center mb-6 ${
                scanResults.compliance_result === 'PASS' ? 'text-green-600' :
                scanResults.compliance_result === 'FAIL' ? 'text-red-600' :
                'text-yellow-600'
              }`}>
                <h3 className="text-3xl font-bold mb-2">{scanResults.compliance_score}%</h3>
                <p className="text-lg font-semibold">{scanResults.compliance_result}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Total Rules</p>
                  <p className="text-2xl font-bold text-blue-600">{scanResults.total_rules}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Passed</p>
                  <p className="text-2xl font-bold text-green-600">{scanResults.passed_rules}</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Failed</p>
                  <p className="text-2xl font-bold text-red-600">{scanResults.failed_rules}</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Review</p>
                  <p className="text-2xl font-bold text-yellow-600">{scanResults.review_rules}</p>
                </div>
              </div>

              <button
                onClick={handleViewResults}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                View Full Results
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default NewInspectionPage
