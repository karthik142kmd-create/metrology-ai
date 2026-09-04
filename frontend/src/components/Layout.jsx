import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import LanguageSwitcher from './LanguageSwitcher'
import {
  Menu, X, LayoutDashboard, Search, FileText, Settings,
  LogOut, User, Bell, ChevronDown, ClipboardList, Scale,
  Home
} from 'lucide-react'

function Layout({ user, children }) {
  const { t } = useLanguage()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true)
  const [profileOpen, setProfileOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/')
  }

  const isActive = (path) => {
    if (path === '/dashboard') return location.pathname === '/dashboard' || location.pathname === '/'
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: t('dashboard') },
    { path: '/inspections', icon: ClipboardList, label: t('inspections') },
    { path: '/inspections/new', icon: Search, label: t('newInspection') },
    { path: '/products', icon: Scale, label: t('products') },
    { path: '/rules', icon: FileText, label: t('rules') },
    { path: '/settings', icon: Settings, label: t('settings') },
  ]

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar (Desktop & Mobile Responsive Drawer) */}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-50
          bg-slate-900 text-white flex flex-col transition-all duration-300 ease-in-out shadow-2xl md:shadow-none
          ${mobileMenuOpen ? 'translate-x-0 w-72' : '-translate-x-full md:translate-x-0'}
          ${desktopSidebarOpen ? 'md:w-64' : 'md:w-20'}
        `}
      >
        {/* Brand Header */}
        <div className="h-16 px-4 border-b border-slate-800 flex items-center justify-between">
          <div
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => navigate('/dashboard')}
          >
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
              <Scale size={20} className="text-white" />
            </div>
            {(desktopSidebarOpen || mobileMenuOpen) && (
              <div>
                <h1 className="text-base font-bold tracking-tight text-white leading-tight">
                  {t('appName')}
                </h1>
                <p className="text-[10px] text-blue-300 font-medium">Compliance AI</p>
              </div>
            )}
          </div>

          {/* Toggle buttons */}
          <div className="flex items-center">
            {/* Desktop collapse */}
            <button
              onClick={() => setDesktopSidebarOpen(!desktopSidebarOpen)}
              className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Toggle Sidebar"
            >
              {desktopSidebarOpen ? <X size={18} /> : <Menu size={18} />}
            </button>

            {/* Mobile close */}
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const active = isActive(item.path)
            return (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path)
                  setMobileMenuOpen(false)
                }}
                className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-xl transition text-sm font-semibold ${
                  active
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
                title={item.label}
              >
                <item.icon size={20} className="shrink-0" />
                {(desktopSidebarOpen || mobileMenuOpen) && (
                  <span className="truncate">{item.label}</span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Return to Landing Page Link */}
        <div className="px-3 py-2 border-t border-slate-800/80">
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-800/50 transition font-medium"
          >
            <Home size={16} className="shrink-0" />
            {(desktopSidebarOpen || mobileMenuOpen) && <span>Landing Page</span>}
          </button>
        </div>

        {/* Footer User Info */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-xs shrink-0">
              {user?.full_name ? user.full_name[0].toUpperCase() : 'U'}
            </div>
            {(desktopSidebarOpen || mobileMenuOpen) && (
              <div className="truncate">
                <p className="text-xs font-semibold text-slate-200 truncate">{user?.full_name || 'Inspector'}</p>
                <p className="text-[10px] text-slate-400 truncate capitalize">{user?.role || 'Officer'}</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main App Container */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between shadow-sm z-10 shrink-0">
          <div className="flex items-center space-x-3">
            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
              aria-label="Open Navigation Menu"
            >
              <Menu size={22} />
            </button>

            <h2 className="text-lg sm:text-xl font-bold text-slate-800 truncate">
              {navItems.find((item) => isActive(item.path))?.label || t('dashboard')}
            </h2>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Language Switcher */}
            <LanguageSwitcher />

            {/* Notification Bell */}
            <button
              className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition"
              aria-label="Notifications"
            >
              <Bell size={19} />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-blue-600 rounded-full ring-2 ring-white"></span>
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center space-x-2 p-1.5 sm:px-3 sm:py-1.5 hover:bg-slate-100 rounded-xl transition"
              >
                <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                  {user?.full_name ? user.full_name[0].toUpperCase() : 'U'}
                </div>
                <span className="text-xs font-semibold text-slate-700 hidden sm:inline truncate max-w-[120px]">
                  {user?.full_name || user?.email}
                </span>
                <ChevronDown size={14} className="text-slate-500" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs font-semibold text-slate-800 truncate">{user?.full_name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                  </div>

                  <button
                    onClick={() => {
                      navigate('/settings')
                      setProfileOpen(false)
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                  >
                    <Settings size={15} />
                    <span>{t('settings')}</span>
                  </button>

                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2.5 text-xs font-medium text-red-600 hover:bg-red-50 flex items-center space-x-2 border-t border-slate-100"
                  >
                    <LogOut size={15} />
                    <span>{t('logout')}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default Layout
