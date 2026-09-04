import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { LanguageProvider } from './context/LanguageContext'
import QuickAnalyzePage from './pages/QuickAnalyzePage'
import LandingPage from './pages/LandingPage'
import DashboardPage from './pages/DashboardPage'
import InspectionsPage from './pages/InspectionsPage'
import InspectionDetailPage from './pages/InspectionDetailPage'
import NewInspectionPage from './pages/NewInspectionPage'
import RulesPage from './pages/RulesPage'
import SettingsPage from './pages/SettingsPage'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is already logged in
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (e) {
        localStorage.removeItem('user')
        localStorage.removeItem('token')
      }
    }
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950 text-white">
        <div className="text-center">
          <div className="animate-spin-slow text-4xl mb-4">⚙️</div>
          <p className="text-slate-400 font-semibold text-sm">Loading MetrologyAI...</p>
        </div>
      </div>
    )
  }

  return (
    <LanguageProvider>
      <BrowserRouter>
        <Routes>
          {/* Main Landing & Value Proposition Showcase */}
          <Route path="/" element={<LandingPage user={user} setUser={setUser} />} />
          <Route path="/landing" element={<LandingPage user={user} setUser={setUser} />} />

          {/* Quick Image Upload & Government Compliance Rate Analyzer (Current Page) */}
          <Route path="/analyze" element={<QuickAnalyzePage user={user} />} />
          <Route path="/scanner" element={<QuickAnalyzePage user={user} />} />

          {/* Authentication Routes */}
          <Route path="/login" element={<LoginPage setUser={setUser} />} />
          <Route path="/register" element={<LoginPage setUser={setUser} initialIsRegister={true} />} />

          {/* Authenticated Application Area */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute user={user}>
                <DashboardPage user={user} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/inspections"
            element={
              <ProtectedRoute user={user}>
                <InspectionsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/inspections/new"
            element={
              <ProtectedRoute user={user}>
                <NewInspectionPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/inspections/:id"
            element={
              <ProtectedRoute user={user}>
                <InspectionDetailPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/rules"
            element={
              <ProtectedRoute user={user}>
                <RulesPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <ProtectedRoute user={user}>
                <SettingsPage user={user} setUser={setUser} />
              </ProtectedRoute>
            }
          />

          {/* Redirect old products route and any unknown routes */}
          <Route path="/products" element={<Navigate to="/inspections" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </LanguageProvider>
  )
}

export default App
