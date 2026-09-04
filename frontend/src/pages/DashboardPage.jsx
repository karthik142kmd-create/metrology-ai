import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { dashboardAPI, inspectionsAPI } from '../services/api'
import { TrendingUp, AlertCircle, CheckCircle, HelpCircle, Plus } from 'lucide-react'

function DashboardPage() {
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
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin-slow text-4xl mb-4">⚙️</div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
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

  const COLORS = ['#27ae60', '#e74c3c', '#f39c12', '#3498db']

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center space-x-2">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="card">
            <p className="text-sm text-gray-600 mb-2">Total Inspections</p>
            <p className="text-3xl font-bold text-primary">{stats.total_inspections}</p>
            <p className="text-xs text-gray-500 mt-2">
              {stats.inspections_today} today
            </p>
          </div>

          <div className="card">
            <p className="text-sm text-gray-600 mb-2 flex items-center space-x-1">
              <CheckCircle size={16} className="text-green-600" />
              <span>Compliant</span>
            </p>
            <p className="text-3xl font-bold text-green-600">{stats.compliant_count}</p>
            <p className="text-xs text-gray-500 mt-2">
              {Math.round(stats.compliance_percentage)}% compliant
            </p>
          </div>

          <div className="card">
            <p className="text-sm text-gray-600 mb-2 flex items-center space-x-1">
              <AlertCircle size={16} className="text-red-600" />
              <span>Violations</span>
            </p>
            <p className="text-3xl font-bold text-red-600">{stats.violation_count}</p>
            <p className="text-xs text-gray-500 mt-2">Failed inspections</p>
          </div>

          <div className="card">
            <p className="text-sm text-gray-600 mb-2 flex items-center space-x-1">
              <HelpCircle size={16} className="text-yellow-600" />
              <span>Review</span>
            </p>
            <p className="text-3xl font-bold text-yellow-600">{stats.review_count}</p>
            <p className="text-xs text-gray-500 mt-2">Needs verification</p>
          </div>

          <div className="card">
            <p className="text-sm text-gray-600 mb-2">Products</p>
            <p className="text-3xl font-bold text-blue-600">{stats.total_products}</p>
            <p className="text-xs text-gray-500 mt-2">In database</p>
          </div>
        </div>
      )}

      {/* Action Button */}
      <button
        onClick={() => navigate('/inspections/new')}
        className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
      >
        <Plus size={20} />
        <span>Start New Inspection</span>
      </button>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compliance Trend */}
        {trends.length > 0 && (
          <div className="card">
            <h2 className="text-lg font-bold text-primary mb-4 flex items-center space-x-2">
              <TrendingUp size={20} />
              <span>Compliance Trend (30 Days)</span>
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="inspections"
                  stroke="#3498db"
                  name="Total Inspections"
                />
                <Line
                  type="monotone"
                  dataKey="compliant"
                  stroke="#27ae60"
                  name="Compliant"
                />
                <Line
                  type="monotone"
                  dataKey="violations"
                  stroke="#e74c3c"
                  name="Violations"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Violation Categories */}
        {violations.length > 0 && (
          <div className="card">
            <h2 className="text-lg font-bold text-primary mb-4">Top Violations</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={violations}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#e74c3c" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Recent Inspections */}
      <div className="card">
        <h2 className="text-lg font-bold text-primary mb-4">Recent Inspections</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Score
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recentInspections.map((inspection) => (
                <tr
                  key={inspection.id}
                  onClick={() => navigate(`/inspections/${inspection.id}`)}
                  className="hover:bg-gray-50 cursor-pointer transition"
                >
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {inspection.inspection_code}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {inspection.product_name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {inspection.category}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                    {inspection.score}%
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${getStatusColor(inspection.status)}`}>
                      {inspection.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(inspection.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
