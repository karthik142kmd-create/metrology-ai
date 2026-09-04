import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, User, Shield } from 'lucide-react'

function SettingsPage({ user, setUser }) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    navigate('/login')
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* User Profile */}
      <div className="card">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <User size={32} className="text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-primary">{user?.full_name}</h2>
            <p className="text-gray-600">{user?.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b border-gray-200">
          <div>
            <p className="text-sm text-gray-600 mb-1">Role</p>
            <p className="text-lg font-semibold text-gray-900">
              <Shield className="inline mr-2" size={16} />
              {user?.role}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Member Since</p>
            <p className="text-lg font-semibold text-gray-900">2024</p>
          </div>
        </div>

        <p className="text-sm text-gray-600">
          You are logged in as a {user?.role.toLowerCase()}. Access features and data relevant to your role.
        </p>
      </div>

      {/* System Settings */}
      <div className="card">
        <h3 className="text-xl font-bold text-primary mb-4">System Settings</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-semibold text-gray-900">API Status</p>
              <p className="text-sm text-gray-600">Backend connection status</p>
            </div>
            <div className="w-3 h-3 bg-green-600 rounded-full animate-pulse"></div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-semibold text-gray-900">OCR Service</p>
              <p className="text-sm text-gray-600">Document recognition engine</p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 bg-green-100 text-green-800 rounded-full">
              Active
            </span>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-semibold text-gray-900">Database</p>
              <p className="text-sm text-gray-600">Inspection records storage</p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 bg-green-100 text-green-800 rounded-full">
              Connected
            </span>
          </div>
        </div>
      </div>

      {/* Logout */}
      <div className="card bg-red-50 border border-red-200">
        <h3 className="text-xl font-bold text-red-900 mb-4">Logout</h3>
        <p className="text-red-800 mb-4">
          Click below to logout from your account. You will be taken to the login page.
        </p>
        
        {showLogoutConfirm ? (
          <div className="space-y-3">
            <p className="font-semibold text-red-900">Are you sure?</p>
            <div className="flex space-x-3">
              <button
                onClick={handleLogout}
                className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
              >
                <LogOut size={20} />
                <span>Yes, Logout</span>
              </button>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 px-6 py-3 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        )}
      </div>

      {/* About */}
      <div className="card bg-blue-50 border border-blue-200">
        <h3 className="text-lg font-bold text-blue-900 mb-2">About MetrologyAI</h3>
        <p className="text-blue-800 text-sm mb-3">
          Version 1.0.0
        </p>
        <p className="text-blue-800 text-sm mb-3">
          AI-Assisted Packaged Commodity Compliance Inspector
        </p>
        <p className="text-xs text-blue-700">
          This application uses AI and computer vision to assist Legal Metrology officers in inspecting packaged commodities for compliance with Indian packaging and labeling regulations.
        </p>
      </div>
    </div>
  )
}

export default SettingsPage
