import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { LanguageProvider } from './contexts/LanguageContext'
import { AuthProvider } from './contexts/AuthContext'
import { OfflineProvider } from './contexts/OfflineContext'
import Layout from './components/Layout/Layout'
import ProtectedRoute from './components/Auth/ProtectedRoute'
import ErrorBoundary from './components/Common/ErrorBoundary'
import LoadingScreen from './components/Common/LoadingScreen'

// Pages - Import as needed when created
import Home from './pages/Home'
import Login from './pages/Auth/Login'
import Register from './pages/Auth/Register'
import Dashboard from './pages/Dashboard'
import FarmManagement from './pages/Farm/FarmManagement'
import CropDiagnosis from './pages/Diagnosis/CropDiagnosis'
import IrrigationPlanning from './pages/Irrigation/IrrigationPlanning'
import CropPlanning from './pages/Planning/CropPlanning'
import Profile from './pages/Profile/Profile'
import Settings from './pages/Settings/Settings'

function App() {
  return (
    <ErrorBoundary>
      <OfflineProvider>
        <LanguageProvider>
          <AuthProvider>
            <Router>
              <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-orange-50">
                <AnimatePresence mode="wait">
                  <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<Layout><Home /></Layout>} />
                    <Route path="/login" element={<Layout><Login /></Layout>} />
                    <Route path="/register" element={<Layout><Register /></Layout>} />
                    
                    {/* Protected Routes */}
                    <Route path="/dashboard" element={
                      <ProtectedRoute>
                        <Layout><Dashboard /></Layout>
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/farm" element={
                      <ProtectedRoute>
                        <Layout><FarmManagement /></Layout>
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/diagnosis" element={
                      <ProtectedRoute>
                        <Layout><CropDiagnosis /></Layout>
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/irrigation" element={
                      <ProtectedRoute>
                        <Layout><IrrigationPlanning /></Layout>
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/planning" element={
                      <ProtectedRoute>
                        <Layout><CropPlanning /></Layout>
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/profile" element={
                      <ProtectedRoute>
                        <Layout><Profile /></Layout>
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/settings" element={
                      <ProtectedRoute>
                        <Layout><Settings /></Layout>
                      </ProtectedRoute>
                    } />
                    
                    {/* Fallback Route */}
                    <Route path="*" element={
                      <Layout>
                        <div className="flex flex-col items-center justify-center min-h-screen p-6">
                          <div className="text-6xl mb-4">🌾</div>
                          <h1 className="text-2xl font-bold text-gray-800 mb-2">Page Not Found</h1>
                          <p className="text-gray-600 text-center mb-6">
                            The page you're looking for doesn't exist.
                          </p>
                          <button 
                            onClick={() => window.history.back()}
                            className="btn-primary"
                          >
                            Go Back
                          </button>
                        </div>
                      </Layout>
                    } />
                  </Routes>
                </AnimatePresence>
              </div>
            </Router>
          </AuthProvider>
        </LanguageProvider>
      </OfflineProvider>
    </ErrorBoundary>
  )
}

export default App