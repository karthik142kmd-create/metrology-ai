import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import InspectionsPage from './pages/InspectionsPage'
import InspectionDetailPage from './pages/InspectionDetailPage'
import NewInspectionPage from './pages/NewInspectionPage'
import ProductsPage from './pages/ProductsPage'
import RulesPage from './pages/RulesPage'
import SettingsPage from './pages/SettingsPage'
import ProtectedRoute from './components/ProtectedRoute'

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
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin-slow text-4xl mb-4">⚙️</div>
          <p className="text-gray-600">Loading MetrologyAI...</p>
        </div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage setUser={setUser} />} />
        
        <Route
          path="/"
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
          path="/products"
          element={
            <ProtectedRoute user={user}>
              <ProductsPage />
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

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
