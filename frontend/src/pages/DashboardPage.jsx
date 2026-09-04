import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { dashboardAPI } from '../services/api'
import { useLanguage } from '../context/LanguageContext'
import { TrendingUp, AlertCircle, CheckCircle, HelpCircle, Plus, Scale, ArrowRight } from 'lucide-react'

function DashboardPage() {
  const { t } = useLanguage()
  const [stats, setStats] = useState(null)
  const [trends, setTrends] = useState([])
  const [violations, setViolations] = useState([])
  const [recentInspections, setRecentInspections] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const [statsRes, trendsRes, violationsRes, recentRes] = await Promise.all([
        dashboardAPI.getStats(),
        dashboardAPI.getTrends(30),
        dashboardAPI.getViolations(),
        dashboardAPI.getRecentInspections(5),
      ])

      setStats(statsRes.data)
      setTrends(trendsRes.data)
      setViolations(violationsRes.data.slice(0, 5))
      setRecentInspections(recentRes.data)
    } catch (err) {
      setError('Failed to load dashboard data')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="animate-spin-slow text-4xl mb-3">⚙️</div>
          <p className="text-sm font-semibold text-slate-600">Loading MetrologyAI analytics...</p>
        </div>
      </div>
    )
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PASS':
        return 'bg-emerald-100 text-emerald-800'
      case 'FAIL':
        return 'bg-red-100 text-red-800'
      case 'REVIEW':
        return 'bg-amber-100 text-amber-800'
      default:
        return 'bg-slate-100 text-slate-800'
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner with Quick Action */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 rounded-2xl p-6 sm:p-8 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{t('dashboard')}</h1>
          <p className="text-blue-100 text-xs sm:text-sm mt-1 max-w-xl">
            Real-time Legal Metrology (Packaged Commodities) Rule compliance monitoring, automated violation alerts, and inspection audit history.
          </p>
        </div>

        <button
          onClick={() => navigate('/inspections/new')}
          className="px-6 py-3.5 bg-white hover:bg-slate-100 text-blue-800 font-bold rounded-xl shadow-lg transition flex items-center space-x-2 text-sm shrink-0"
        >
          <Plus size={18} className="text-blue-600" />
          <span>{t('newInspection')}</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center space-x-2 text-sm">
          <AlertCircle size={18} className="shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Responsive Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Inspections</p>
            <p className="text-2xl sm:text-3xl font-black text-slate-800">{stats.total_inspections}</p>
            <p className="text-[11px] text-blue-600 font-semibold mt-1">+{stats.inspections_today} today</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1 flex items-center space-x-1">
              <CheckCircle size={14} />
              <span>Compliant</span>
            </p>
            <p className="text-2xl sm:text-3xl font-black text-emerald-600">{stats.compliant_count}</p>
            <p className="text-[11px] text-slate-500 mt-1">{Math.round(stats.compliance_percentage)}% compliance rate</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-1 flex items-center space-x-1">
              <AlertCircle size={14} />
              <span>Violations</span>
            </p>
            <p className="text-2xl sm:text-3xl font-black text-red-600">{stats.violation_count}</p>
            <p className="text-[11px] text-slate-500 mt-1">Non-compliant packs</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-1 flex items-center space-x-1">
              <HelpCircle size={14} />
              <span>Review</span>
            </p>
            <p className="text-2xl sm:text-3xl font-black text-amber-600">{stats.review_count}</p>
            <p className="text-[11px] text-slate-500 mt-1">Manual check needed</p>
          </div>

          <div className="col-span-2 sm:col-span-1 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1 flex items-center space-x-1">
              <Scale size={14} />
              <span>Commodities</span>
            </p>
            <p className="text-2xl sm:text-3xl font-black text-indigo-600">{stats.total_products}</p>
            <p className="text-[11px] text-slate-500 mt-1">Catalog items</p>
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {trends.length > 0 && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center space-x-2">
              <TrendingUp size={18} className="text-blue-600" />
              <span>Compliance Trends (30 Days)</span>
            </h2>
            <div className="h-64 sm:h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px', border: '1px solid #e2e8f0' }} />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Line type="monotone" dataKey="inspections" stroke="#3b82f6" strokeWidth={2} name="Total" />
                  <Line type="monotone" dataKey="compliant" stroke="#10b981" strokeWidth={2} name="Compliant" />
                  <Line type="monotone" dataKey="violations" stroke="#ef4444" strokeWidth={2} name="Violations" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {violations.length > 0 && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center space-x-2">
              <AlertCircle size={18} className="text-red-500" />
              <span>Top Non-Compliance Categories</span>
            </h2>
            <div className="h-64 sm:h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={violations}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px', border: '1px solid #e2e8f0' }} />
                  <Bar dataKey="count" fill="#ef4444" radius={[6, 6, 0, 0]} name="Violations" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Recent Inspections Table (Mobile responsive cards & desktop table) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-800">Recent Inspections</h2>
          <button
            onClick={() => navigate('/inspections')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center space-x-1"
          >
            <span>View All</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-semibold">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentInspections.map((insp) => (
                <tr
                  key={insp.id}
                  onClick={() => navigate(`/inspections/${insp.id}`)}
                  className="hover:bg-slate-50 cursor-pointer transition"
                >
                  <td className="px-4 py-3 font-mono font-bold text-xs text-blue-600">{insp.inspection_code}</td>
                  <td className="px-4 py-3 font-semibold text-slate-800">{insp.product_name}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{insp.category}</td>
                  <td className="px-4 py-3 font-bold text-slate-800">{insp.score}%</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${getStatusBadge(insp.status)}`}>
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

        {/* Mobile Cards View */}
        <div className="sm:hidden space-y-3">
          {recentInspections.map((insp) => (
            <div
              key={insp.id}
              onClick={() => navigate(`/inspections/${insp.id}`)}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-100 transition cursor-pointer space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-blue-600">{insp.inspection_code}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusBadge(insp.status)}`}>
                  {insp.status}
                </span>
              </div>
              <p className="font-bold text-sm text-slate-800">{insp.product_name}</p>
              <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-200/60">
                <span>{insp.category}</span>
                <span className="font-bold text-slate-800">{insp.score}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
