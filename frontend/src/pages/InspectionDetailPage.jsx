import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { inspectionsAPI, reportsAPI, analysisAPI } from '../services/api'
import { useLanguage } from '../context/LanguageContext'
import {
  Download, AlertCircle, CheckCircle, Sparkles, ArrowLeft,
  ShieldCheck, ShieldAlert, FileText, CheckCircle2, AlertTriangle,
  Layers, ChevronRight, HelpCircle
} from 'lucide-react'

function InspectionDetailPage() {
  const { id } = useParams()
  const { t } = useLanguage()
  const [inspection, setInspection] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generatingReport, setGeneratingReport] = useState(false)
  const [aiAssessment, setAiAssessment] = useState(null)
  const [loadingAi, setLoadingAi] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    fetchInspection()
  }, [id])

  const fetchInspection = async () => {
    try {
      setLoading(true)
      const response = await inspectionsAPI.getById(parseInt(id))
      const data = response.data
      setInspection(data)

      // Check if ai_assessment was saved in extracted_data
      if (data.extracted_data?.ai_assessment) {
        setAiAssessment(data.extracted_data.ai_assessment)
      } else if (data.extracted_data?.declarations || data.extracted_data) {
        // Trigger on-demand AI assessment if not already present
        fetchAIAssessment(data)
      }
    } catch (err) {
      console.error('Failed to fetch inspection:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchAIAssessment = async (inspData) => {
    const decls = inspData.extracted_data?.declarations || inspData.extracted_data || {}
    const category = inspData.product?.category || 'General'
    const productName = inspData.product?.product_name

    try {
      setLoadingAi(true)
      const aiRes = await analysisAPI.assessAICompliance(decls, category, productName)
      setAiAssessment(aiRes.data)
    } catch (e) {
      console.warn('AI assessment fetch notice:', e)
    } finally {
      setLoadingAi(false)
    }
  }

  const handleGenerateReport = async () => {
    try {
      setGeneratingReport(true)
      // Step 1: generate and save the PDF on the server
      await reportsAPI.generate(id, true, true)
      // Step 2: download the blob
      const res = await reportsAPI.download(id)
      // res.data is already a Blob (responseType: 'blob' is set in api.js)
      const blob = new Blob([res.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `MetrologyAI_Compliance_Report_${id}.pdf`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Failed to generate report:', err)
      alert('PDF Generation Error: ' + (err.response?.data?.detail || err.message || 'Unknown error'))
    } finally {
      setGeneratingReport(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'PASS':
        return 'text-emerald-700 bg-emerald-50 border-emerald-200'
      case 'FAIL':
        return 'text-red-700 bg-red-50 border-red-200'
      case 'REVIEW':
        return 'text-amber-700 bg-amber-50 border-amber-200'
      default:
        return 'text-slate-700 bg-slate-50 border-slate-200'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin-slow text-4xl mb-3">⚙️</div>
          <p className="text-sm font-semibold text-slate-600">Loading inspection audit details...</p>
        </div>
      </div>
    )
  }

  if (!inspection) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8">
        <p className="text-slate-600 font-semibold">Inspection not found</p>
        <button
          onClick={() => navigate('/inspections')}
          className="mt-4 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
        >
          Back to Inspections
        </button>
      </div>
    )
  }

  const declarations = inspection.extracted_data?.declarations || inspection.extracted_data || {}

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Back button & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => navigate('/inspections')}
          className="inline-flex items-center space-x-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft size={16} />
          <span>Back to All Inspections</span>
        </button>

        <button
          onClick={handleGenerateReport}
          disabled={generatingReport}
          className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-md shadow-blue-600/20 transition font-bold text-xs sm:text-sm disabled:opacity-50"
        >
          <Download size={16} />
          <span>{generatingReport ? 'Generating PDF...' : t('downloadPdf')}</span>
        </button>
      </div>

      {/* Main Inspection Summary Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-xs font-mono font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {inspection.inspection_code}
              </span>
              <span className="text-xs text-slate-400">
                {new Date(inspection.created_at).toLocaleDateString()}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
              {inspection.product?.product_name || `Product ID #${inspection.product_id}`}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Category: <span className="font-semibold text-slate-700">{inspection.product?.category || 'General'}</span> • 
              Manufacturer: <span className="font-semibold text-slate-700">{inspection.product?.manufacturer || 'Declared on label'}</span>
            </p>
          </div>

          {/* Compliance Score Gauge */}
          <div className={`p-5 sm:p-6 rounded-2xl border text-center min-w-[200px] ${getStatusColor(inspection.compliance_result)}`}>
            <p className="text-xs uppercase font-extrabold tracking-wider opacity-80 mb-1">{t('complianceScore')}</p>
            <p className="text-4xl sm:text-5xl font-black leading-tight mb-1">{inspection.compliance_score}%</p>
            <span className="inline-block px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-white/90 shadow-sm">
              {inspection.compliance_result}
            </span>
          </div>
        </div>

        {/* Breakdown bar */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <p className="text-xs text-slate-500">Total Rules</p>
            <p className="text-xl font-bold text-slate-800">{inspection.total_rules}</p>
          </div>
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
            <p className="text-xs text-emerald-600">Passed</p>
            <p className="text-xl font-bold text-emerald-700">{inspection.passed_rules}</p>
          </div>
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-center">
            <p className="text-xs text-red-600">Failed</p>
            <p className="text-xl font-bold text-red-700">{inspection.failed_rules}</p>
          </div>
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-center">
            <p className="text-xs text-amber-600">Needs Review</p>
            <p className="text-xl font-bold text-amber-700">{inspection.review_rules}</p>
          </div>
        </div>
      </div>

      {/* AI Compliance Assessment Panel */}
      <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl border border-indigo-800/60 relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 blur-3xl rounded-full pointer-events-none" />

        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-indigo-800/80">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                <Sparkles size={22} />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  {t('aiAssistantTitle')}
                </h2>
                <p className="text-xs text-indigo-200">Legal Metrology (Packaged Commodities) Rules 2011 Reasoning</p>
              </div>
            </div>

            {aiAssessment && (
              <div className="flex items-center space-x-2 self-start sm:self-auto">
                <span className="text-xs text-indigo-300 font-medium">{t('aiRiskLevel')}:</span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                  aiAssessment.risk_level === 'LOW'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : aiAssessment.risk_level === 'CRITICAL'
                    ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {aiAssessment.risk_level}
                </span>
              </div>
            )}
          </div>

          {loadingAi ? (
            <div className="py-8 text-center text-indigo-300 text-xs">
              <Sparkles size={20} className="animate-spin-slow mx-auto mb-2" />
              Generating Legal Metrology AI evaluation...
            </div>
          ) : aiAssessment ? (
            <div className="space-y-6">
              {/* Summary box */}
              <div className="bg-indigo-950/60 border border-indigo-800/60 rounded-xl p-4 sm:p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-indigo-300 mb-1">{t('aiSummary')}</p>
                <p className="text-sm text-slate-200 leading-relaxed">{aiAssessment.summary}</p>

                {aiAssessment.penalty_estimate_inr && (
                  <div className="mt-3 pt-3 border-t border-indigo-800/50 flex flex-wrap items-center justify-between text-xs gap-2">
                    <span className="text-indigo-300">{t('penaltyRisk')}:</span>
                    <span className="font-mono font-bold text-amber-300">{aiAssessment.penalty_estimate_inr}</span>
                  </div>
                )}
              </div>

              {/* Recommendations list */}
              {aiAssessment.recommendations && aiAssessment.recommendations.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-300 mb-3">
                    {t('statutoryRemediations')} ({aiAssessment.recommendations.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {aiAssessment.recommendations.map((rec, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-900/90 border border-indigo-900/80 rounded-xl p-4 text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono uppercase font-bold text-indigo-300">
                            {rec.field}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            rec.severity === 'HIGH' ? 'bg-red-500/20 text-red-300' : 'bg-amber-500/20 text-amber-300'
                          }`}>
                            {rec.severity}
                          </span>
                        </div>
                        <p className="text-slate-300 font-medium">{rec.issue}</p>
                        <p className="text-indigo-200 text-[11px] bg-indigo-950/80 p-2 rounded-lg border border-indigo-900/50 mt-2">
                          <span className="font-semibold text-white">Suggested Fix: </span>
                          {rec.recommendation}
                        </p>
                        <p className="text-[10px] text-slate-400">Ref: {rec.legal_reference}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-indigo-300">No AI evaluation available for this record.</p>
          )}
        </div>
      </div>

      {/* Extracted Declarations Cards */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
        <h2 className="text-xl font-bold text-slate-800 mb-4">{t('declarationsFound')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(declarations).map(([key, val]) => {
            if (key === 'ai_assessment') return null
            const displayVal = typeof val === 'object' && val !== null ? val.value : val
            const confidence = typeof val === 'object' && val !== null ? val.confidence : null

            return (
              <div key={key} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs uppercase font-semibold text-slate-500 tracking-wider">
                    {key.replace('_', ' ')}
                  </span>
                  {confidence && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                      {Math.round(confidence * 100)}% conf
                    </span>
                  )}
                </div>
                <p className="text-sm font-bold text-slate-800 truncate">
                  {displayVal || <span className="text-slate-400 italic font-normal">Not detected</span>}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Rule Checklist Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
        <h2 className="text-xl font-bold text-slate-800 mb-4">{t('ruleChecklist')}</h2>
        
        {inspection.rule_results && inspection.rule_results.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="px-4 py-3">Rule ID</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Confidence</th>
                  <th className="px-4 py-3">Statutory Message</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inspection.rule_results.map((res) => (
                  <tr key={res.rule_id} className="hover:bg-slate-50/70 transition">
                    <td className="px-4 py-3 font-mono font-bold text-slate-800">{res.rule_id}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                        res.status === 'PASS' ? 'bg-emerald-100 text-emerald-800' :
                        res.status === 'FAIL' ? 'bg-red-100 text-red-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {res.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600">{Math.round(res.confidence * 100)}%</td>
                    <td className="px-4 py-3 text-slate-700">{res.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-slate-500">No rule checklist items recorded.</p>
        )}
      </div>
    </div>
  )
}

export default InspectionDetailPage
