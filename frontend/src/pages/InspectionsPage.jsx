import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { inspectionsAPI } from '../services/api'
import { Plus, Search, Filter } from 'lucide-react'

function InspectionsPage() {
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
      'PASS': 'bg-green-100 text-green-800',
      'FAIL': 'bg-red-100 text-red-800',
      'REVIEW': 'bg-yellow-100 text-yellow-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const filteredInspections = inspections.filter(i =>
    i.inspection_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.product_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-primary">Inspections</h1>
        <button
          onClick={() => navigate('/inspections/new')}
          className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
        >
          <Plus size={20} />
          <span>New Inspection</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 bg-white p-4 rounded-lg">
        <div className="flex-1">
          <div className="relative">
            <Search size={20} className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search by ID or product name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input-field min-w-40"
        >
          <option value="">All Status</option>
          <option value="PASS">Compliant</option>
          <option value="FAIL">Non-Compliant</option>
          <option value="REVIEW">Needs Review</option>
        </select>
      </div>

      {/* Inspections Table */}
      <div className="card overflow-x-auto">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin-slow text-3xl">⚙️</div>
            <p className="text-gray-600 mt-2">Loading inspections...</p>
          </div>
        ) : filteredInspections.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No inspections found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">ID</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Product</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Category</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Score</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredInspections.map((inspection) => (
                <tr
                  key={inspection.id}
                  onClick={() => navigate(`/inspections/${inspection.id}`)}
                  className="hover:bg-gray-50 cursor-pointer transition"
                >
                  <td className="px-6 py-4 text-sm font-mono text-blue-600">{inspection.inspection_code}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{inspection.product_name || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{inspection.category || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-900">{inspection.score}%</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${getStatusBadgeColor(inspection.status)}`}>
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
        )}
      </div>
    </div>
  )
}

export default InspectionsPage
