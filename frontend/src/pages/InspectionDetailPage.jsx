import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { inspectionsAPI, reportsAPI } from '../services/api'
import { Download, AlertCircle, CheckCircle } from 'lucide-react'

function InspectionDetailPage() {
  const { id } = useParams()
  const [inspection, setInspection] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generatingReport, setGeneratingReport] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    fetchInspection()
  }, [id])

  const fetchInspection = async () => {
    try {
      setLoading(true)
      const response = await inspectionsAPI.getById(parseInt(id))
      setInspection(response.data)
    } catch (err) {
      console.error('Failed to fetch inspection:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateReport = async () => {
    try {
      setGeneratingReport(true)
      await reportsAPI.generate(id, true, true)
      const blob = await reportsAPI.download(id)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `inspection_${id}_report.pdf`
      link.click()
    } catch (err) {
      console.error('Failed to generate report:', err)
    } finally {
      setGeneratingReport(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'PASS':
        return 'text-green-600 bg-green-50'
      case 'FAIL':
        return 'text-red-600 bg-red-50'
      case 'REVIEW':
        return 'text-yellow-600 bg-yellow-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading inspection details...</div>
  }

  if (!inspection) {
    return <div className="text-center py-12">Inspection not found</div>
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="card">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-primary mb-2">{inspection.product_id}</h1>
            <p className="text-gray-600">Inspection ID: {inspection.inspection_code}</p>
          </div>
          <button
            onClick={handleGenerateReport}
            disabled={generatingReport}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50"
          >
            <Download size={20} />
            <span>{generatingReport ? 'Generating...' : 'Download PDF'}</span>
          </button>
        </div>

        {/* Compliance Score */}
        <div className={`text-center p-8 rounded-lg ${getStatusColor(inspection.compliance_result)}`}>
          <p className="text-sm font-semibold mb-2">Compliance Score</p>
          <p className="text-5xl font-bold mb-2">{inspection.compliance_score}%</p>
          <p className="text-lg font-semibold">{inspection.compliance_result}</p>
        </div>
      </div>

      {/* Rule Results */}
      <div className="card">
        <h2 className="text-2xl font-bold text-primary mb-4">Compliance Checklist</h2>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-sm text-gray-600 mb-1">Total Rules</p>
            <p className="text-2xl font-bold text-blue-600">{inspection.total_rules}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <p className="text-sm text-gray-600 mb-1">Passed</p>
            <p className="text-2xl font-bold text-green-600">{inspection.passed_rules}</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <p className="text-sm text-gray-600 mb-1">Failed</p>
            <p className="text-2xl font-bold text-red-600">{inspection.failed_rules}</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <p className="text-sm text-gray-600 mb-1">Review Needed</p>
            <p className="text-2xl font-bold text-yellow-600">{inspection.review_rules}</p>
          </div>
        </div>

        {/* Rule Results Table */}
        {inspection.rule_results && inspection.rule_results.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Rule</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Confidence</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Message</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {inspection.rule_results.map((result) => (
                  <tr key={result.rule_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-mono text-gray-900">{result.rule_id}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                        result.status === 'PASS' ? 'badge-pass' :
                        result.status === 'FAIL' ? 'badge-fail' :
                        'badge-review'
                      }`}>
                        {result.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{Math.round(result.confidence * 100)}%</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{result.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Violations */}
      {inspection.violations && inspection.violations.length > 0 && (
        <div className="card">
          <h2 className="text-2xl font-bold text-primary mb-4">Detected Violations</h2>
          <div className="space-y-4">
            {inspection.violations.map((violation, idx) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    {violation.severity === 'HIGH' ? (
                      <AlertCircle className="text-red-600" size={24} />
                    ) : (
                      <CheckCircle className="text-yellow-600" size={24} />
                    )}
                    <div>
                      <p className="font-semibold text-gray-900">{violation.violation_type}</p>
                      <p className="text-sm text-gray-600">{violation.description}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                    violation.severity === 'HIGH' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {violation.severity}
                  </span>
                </div>
                {violation.evidence && (
                  <p className="text-sm text-gray-600 mt-2">Evidence: {violation.evidence}</p>
                )}
                <p className="text-xs text-gray-500 mt-2">Confidence: {Math.round(violation.confidence * 100)}%</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Officer Remarks */}
      {inspection.officer_remarks && (
        <div className="card bg-blue-50 border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">Officer Remarks</h3>
          <p className="text-blue-800">{inspection.officer_remarks}</p>
        </div>
      )}
    </div>
  )
}

export default InspectionDetailPage
