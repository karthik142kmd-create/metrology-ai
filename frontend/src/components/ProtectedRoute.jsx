import React from 'react'
import { Navigate } from 'react-router-dom'
import Layout from './Layout'

function ProtectedRoute({ user, children }) {
  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <Layout user={user}>{children}</Layout>
}

export default ProtectedRoute
