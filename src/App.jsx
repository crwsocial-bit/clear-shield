import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabaseClient'
import { AuditListProvider } from './lib/auditListContext'
import { useIsAdmin } from './lib/useIsAdmin'
import AppLayout from './components/layout/AppLayout'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import GettingStarted from './pages/GettingStarted'
import Products from './pages/Products'
import Reports from './pages/Reports'
import Login from './pages/Login'
import ResetPassword from './pages/ResetPassword'
import Settings from './pages/Settings'
import Companies from './pages/Companies'
import CompanyDetail from './pages/CompanyDetail'
import Compliance from './pages/Compliance'
import AuditLists from './pages/AuditLists'
import Export from './pages/Export'
import Billing from './pages/Billing'
import Admin from './pages/Admin'

// Shows landing page for guests; redirects authenticated users to /dashboard
function RootRoute() {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => listener.subscription.unsubscribe()
  }, [])

  if (session === undefined) return null
  return session ? <Navigate to="/dashboard" replace /> : <Landing />
}

function ProtectedRoute({ children }) {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setSession(session))
    return () => listener.subscription.unsubscribe()
  }, [])

  if (session === undefined) return null

  return session ? (
    <AppLayout>{children}</AppLayout>
  ) : (
    <Navigate to="/login" replace />
  )
}

// Like ProtectedRoute, but also redirects non-admins to /dashboard. Admin
// status is re-checked server-side by the admin-update-user edge function
// regardless — this guard is just UX, not the security boundary.
function AdminRoute({ children }) {
  const [session, setSession] = useState(undefined)
  const { isAdmin, loading: adminLoading } = useIsAdmin()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => listener.subscription.unsubscribe()
  }, [])

  if (session === undefined || adminLoading) return null
  if (!session) return <Navigate to="/login" replace />
  return isAdmin ? <AppLayout>{children}</AppLayout> : <Navigate to="/dashboard" replace />
}

// Like ProtectedRoute but renders children directly — no AppLayout chrome
function PrintRoute({ children }) {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => listener.subscription.unsubscribe()
  }, [])

  if (session === undefined) return null
  return session ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuditListProvider>
        <Routes>
          {/* Public */}
          <Route path="/" element={<RootRoute />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Login initialView="signup" />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Authenticated app */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/getting-started"
            element={
              <ProtectedRoute>
                <GettingStarted />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/billing"
            element={
              <ProtectedRoute>
                <Billing />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <Admin />
              </AdminRoute>
            }
          />
          <Route
            path="/companies"
            element={
              <ProtectedRoute>
                <Companies />
              </ProtectedRoute>
            }
          />
          <Route
            path="/companies/:id"
            element={
              <ProtectedRoute>
                <CompanyDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/compliance"
            element={
              <ProtectedRoute>
                <Compliance />
              </ProtectedRoute>
            }
          />
          <Route
            path="/products"
            element={
              <ProtectedRoute>
                <Products />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <Reports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/audit-lists"
            element={
              <ProtectedRoute>
                <AuditLists />
              </ProtectedRoute>
            }
          />
          <Route
            path="/export"
            element={
              <PrintRoute>
                <Export />
              </PrintRoute>
            }
          />
        </Routes>
      </AuditListProvider>
    </BrowserRouter>
  )
}
