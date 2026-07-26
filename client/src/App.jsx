import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAppStore } from './stores/appStore'
import { useUserStore } from './stores/userStore'
import Layout from './components/layout/Layout'
import Toast from './components/Toast'
import SessionTimeout from './components/SessionTimeout'
import ForcePasswordChange from './components/ForcePasswordChange'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import POSPage from './pages/POSPage'
import InventoryPage from './pages/InventoryPage'
import ReportsPage from './pages/ReportsPage'
import SuppliersPage from './pages/SuppliersPage'
import PromotionsPage from './pages/PromotionsPage'
import SettingsPage from './pages/SettingsPage'
import UsersPage from './pages/UsersPage'
import CustomersPage from './pages/CustomersPage'
import EmployeesPage from './pages/EmployeesPage'
import ExpensesPage from './pages/ExpensesPage'
import RefundsPage from './pages/RefundsPage'

// Protected Route Component
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useUserStore()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}

function App() {
  const { theme, settings, loadSettings } = useAppStore()
  const { isAuthenticated, mustChangePassword } = useUserStore()

  // Load settings from database on app startup (only when authenticated)
  useEffect(() => {
    if (isAuthenticated) {
      loadSettings()
    }
  }, [isAuthenticated, loadSettings])

  // Update document title with store name
  useEffect(() => {
    document.title = settings.storeName || 'Store POS'
  }, [settings.storeName])

  const showForcePasswordChange = isAuthenticated && mustChangePassword()

  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <Router>
          {/* Toast Notifications */}
          <Toast />

          {/* Session Timeout Handler */}
          <SessionTimeout />

          {/* Force Password Change Modal */}
          {showForcePasswordChange && (
            <ForcePasswordChange />
          )}

          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={
              isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />
            } />

            {/* Protected Routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout><DashboardPage /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/pos" element={
              <ProtectedRoute>
                <Layout><POSPage /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/inventory" element={
              <ProtectedRoute>
                <Layout><InventoryPage /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/reports" element={
              <ProtectedRoute>
                <Layout><ReportsPage /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/suppliers" element={
              <ProtectedRoute>
                <Layout><SuppliersPage /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/promotions" element={
              <ProtectedRoute>
                <Layout><PromotionsPage /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <Layout><SettingsPage /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/users" element={
              <ProtectedRoute>
                <Layout><UsersPage /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/customers" element={
              <ProtectedRoute>
                <Layout><CustomersPage /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/employees" element={
              <ProtectedRoute>
                <Layout><EmployeesPage /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/expenses" element={
              <ProtectedRoute>
                <Layout><ExpensesPage /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/refunds" element={
              <ProtectedRoute>
                <Layout><RefundsPage /></Layout>
              </ProtectedRoute>
            } />

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </div>
    </div>
  )
}

export default App
