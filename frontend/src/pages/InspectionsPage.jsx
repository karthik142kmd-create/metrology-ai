import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { inspectionsAPI } from '../services/api'
import { useLanguage } from '../context/LanguageContext'
import { Plus, Search, Filter, ArrowRight } from 'lucide-react'

function InspectionsPage() {
  const { t } = useLanguage()
  const [inspections, setInspections] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    fetchInspections()
  }, [statusFilter])

  const fetchInspections = async () => {
    try {
      setLoading(true)
      const response = await inspectionsAPI.getAll(0, 50, statusFilter || null)
      setInspections(response.data)
    } catch (err) {
      console.error('Failed to fetch inspections:', err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadgeColor = (status) => {
    const colors = {
      'PASS': 'bg-emerald-100 text-emerald-800',
      'FAIL': 'bg-red-100 text-red-800',
      'REVIEW': 'bg-amber-100 text-amber-800'
    }
    return colors[status] || 'bg-slate-100 text-slate-800'
  }

  const filteredInspections = inspections.filter(i =>
    (i.inspection_code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (i.product_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">{t('inspections')}</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Complete legal metrology audit trail and commodity packaging scan logs.
          </p>
        </div>

        <button
          onClick={() => navigate('/inspections/new')}
          className="inline-flex items-center justify-center space-x-2 px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-600/25 transition font-bold text-xs sm:text-sm shrink-0"
        >
          <Plus size={18} />
          <span>{t('newInspection')}</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Inspection ID or product name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 bg-slate-50/50"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 bg-slate-50/50 text-slate-700 min-w-[160px]"
        >
          <option value="">All Statuses</option>
          <option value="PASS">Compliant (PASS)</option>
          <option value="FAIL">Non-Compliant (FAIL)</option>
          <option value="REVIEW">Needs Review</option>
        </select>
      </div>

      {/* Inspections Table & Mobile Cards */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin-slow text-3xl mb-2">⚙️</div>
            <p className="text-xs text-slate-500">Loading audit log...</p>
          </div>
        ) : filteredInspections.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm font-semibold text-slate-600">No inspections found</p>
            <p className="text-xs text-slate-400 mt-1">Try changing your filters or start a new inspection.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-semibold">
                  <tr>
                    <th className="px-4 py-3">Audit Code</th>
                    <th className="px-4 py-3">Product Name</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Score</th>
                    <th className="px-4 py-3">Result</th>
                    <th className="px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInspections.map((insp) => (
                    <tr
                      key={insp.id}
                      onClick={() => navigate(`/inspections/${insp.id}`)}
                      className="hover:bg-slate-50/80 cursor-pointer transition"
                    >
                      <td className="px-4 py-3 font-mono font-bold text-xs text-blue-600">
                        {insp.inspection_code}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {insp.product_name || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {insp.category || 'N/A'}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-800">
                        {insp.score}%
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${getStatusBadgeColor(insp.status)}`}>
                          {insp.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {new Date(insp.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="sm:hidden space-y-3">
              {filteredInspections.map((insp) => (
                <div
                  key={insp.id}
                  onClick={() => navigate(`/inspections/${insp.id}`)}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-100 transition cursor-pointer space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-blue-600">{insp.inspection_code}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusBadgeColor(insp.status)}`}>
                      {insp.status}
                    </span>
                  </div>
                  <p className="font-bold text-sm text-slate-800">{insp.product_name || 'N/A'}</p>
                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-200/60">
                    <span>{insp.category}</span>
                    <span className="font-bold text-slate-800">{insp.score}% Score</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default InspectionsPage
