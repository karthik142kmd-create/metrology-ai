import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Menu, X, LayoutDashboard, Search, FileText, Settings,
  LogOut, User, Bell, ChevronDown, ClipboardList, Scale
} from 'lucide-react'

function Layout({ user, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [profileOpen, setProfileOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/')

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/inspections', icon: ClipboardList, label: 'Inspections' },
    { path: '/inspections/new', icon: Search, label: 'New Inspection' },
    { path: '/products', icon: Scale, label: 'Products' },
    { path: '/rules', icon: FileText, label: 'Rules' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ]

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-primary text-white transition-all duration-300 flex flex-col`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-blue-700 flex items-center justify-between">
          {sidebarOpen && (
            <div>
              <h1 className="text-xl font-bold">MetrologyAI</h1>
              <p className="text-xs text-blue-200">Compliance Inspector</p>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hover:bg-blue-700 p-2 rounded"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                isActive(item.path)
                  ? 'bg-blue-700 text-white'
                  : 'text-blue-100 hover:bg-blue-700'
              }`}
            >
              <item.icon size={20} />
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-blue-700">
          {sidebarOpen && (
            <div className="text-xs text-blue-200">
              <p className="font-semibold">{user?.full_name}</p>
              <p className="text-blue-300">{user?.role}</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary">
              {navItems.find(item => isActive(item.path))?.label || 'MetrologyAI'}
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
              <Bell size={20} />
              <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-lg"
              >
                <User size={20} className="text-gray-600" />
                {sidebarOpen !== false && (
                  <>
                    <span className="text-sm text-gray-700">{user?.email}</span>
                    <ChevronDown size={16} className="text-gray-600" />
                  </>
                )}
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <button
                    onClick={() => {
                      navigate('/settings')
                      setProfileOpen(false)
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center space-x-2"
                  >
                    <Settings size={16} />
                    <span>Settings</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center space-x-2 text-red-600 border-t border-gray-200"
                  >
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-8">
          {children}
        </div>
      </div>
    </div>
  )
}

export default Layout
