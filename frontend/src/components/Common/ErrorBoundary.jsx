import { Component } from 'react'
import { motion } from 'framer-motion'
import { 
  ExclamationTriangleIcon, 
  ArrowPathIcon,
  ChatBubbleBottomCenterTextIcon,
  HomeIcon
} from '@heroicons/react/24/outline'
import { errorApi } from '../../services/api'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    }
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorId: Date.now().toString()
    }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo
    })

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error Boundary caught an error:', error, errorInfo)
    }

    // Send error to monitoring service
    this.reportError(error, errorInfo)
  }

  reportError = (error, errorInfo) => {
    const errorData = {
      errorId: this.state.errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      userId: localStorage.getItem('agrisphere_user_id'),
      buildVersion: import.meta.env.VITE_BUILD_VERSION || 'unknown'
    }

    // Log locally
    console.group(`🚨 Error Report [${errorData.errorId}]`)
    console.error('Error Details:', errorData)
    console.groupEnd()

    // Send to backend in production
    if (import.meta.env.PROD) {
      errorApi.report(errorData).catch(reportError => {
        console.error('Failed to report error:', reportError)
      })
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    })
  }

  handleRefresh = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      const isDevelopment = process.env.NODE_ENV === 'development'

      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="max-w-md w-full bg-white/90 backdrop-blur-sm rounded-3xl shadow-strong p-8 text-center"
          >
            {/* Error Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="mb-6"
            >
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center">
                <ExclamationTriangleIcon className="w-10 h-10 text-white" />
              </div>
            </motion.div>

            {/* Error Message */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-6"
            >
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                Oops! Something went wrong 🌾
              </h1>
              <p className="text-gray-600 text-sm leading-relaxed">
                We encountered an unexpected error. Don't worry, your farming data is safe. 
                Please try refreshing the page or contact support if the problem persists.
              </p>
            </motion.div>

            {/* Error ID */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mb-6 p-3 bg-gray-50 rounded-2xl"
            >
              <p className="text-xs text-gray-500 mb-1">Error ID</p>
              <p className="text-sm font-mono text-gray-700 break-all">
                {this.state.errorId}
              </p>
            </motion.div>

            {/* Development Error Details */}
            {isDevelopment && this.state.error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ delay: 0.5 }}
                className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-left overflow-hidden"
              >
                <h3 className="text-sm font-semibold text-red-800 mb-2">
                  Development Details:
                </h3>
                <div className="text-xs text-red-700 space-y-2">
                  <div>
                    <strong>Error:</strong>
                    <pre className="mt-1 whitespace-pre-wrap break-words">
                      {this.state.error.toString()}
                    </pre>
                  </div>
                  {this.state.errorInfo?.componentStack && (
                    <div>
                      <strong>Component Stack:</strong>
                      <pre className="mt-1 whitespace-pre-wrap break-words text-xs">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="space-y-3"
            >
              {/* Retry Button */}
              <button
                onClick={this.handleRetry}
                className="w-full btn-primary flex items-center justify-center space-x-2"
              >
                <ArrowPathIcon className="w-5 h-5" />
                <span>Try Again</span>
              </button>

              {/* Refresh Page */}
              <button
                onClick={this.handleRefresh}
                className="w-full btn-secondary flex items-center justify-center space-x-2"
              >
                <ArrowPathIcon className="w-5 h-5" />
                <span>Refresh Page</span>
              </button>

              {/* Go Home */}
              <button
                onClick={this.handleGoHome}
                className="w-full btn-outline flex items-center justify-center space-x-2"
              >
                <HomeIcon className="w-5 h-5" />
                <span>Go Home</span>
              </button>
            </motion.div>

            {/* Support Link */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-6 pt-6 border-t border-gray-200"
            >
              <a
                href="mailto:support@agrisphere.com"
                className="inline-flex items-center space-x-2 text-sm text-primary-600 hover:text-primary-700 transition-colors"
              >
                <ChatBubbleBottomCenterTextIcon className="w-4 h-4" />
                <span>Contact Support</span>
              </a>
            </motion.div>

            {/* Decorative Elements */}
            <div className="absolute top-4 right-4 text-2xl opacity-20">🚜</div>
            <div className="absolute bottom-4 left-4 text-2xl opacity-20">🌱</div>
          </motion.div>

          {/* Background Animation */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <motion.div
              animate={{
                x: [0, 100, 0],
                y: [0, -50, 0],
                rotate: [0, 180, 360]
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: 'linear'
              }}
              className="absolute top-1/4 left-1/4 w-2 h-2 bg-orange-300 rounded-full opacity-30"
            />
            <motion.div
              animate={{
                x: [0, -80, 0],
                y: [0, 100, 0],
                rotate: [0, -180, -360]
              }}
              transition={{
                duration: 25,
                repeat: Infinity,
                ease: 'linear'
              }}
              className="absolute top-3/4 right-1/3 w-3 h-3 bg-red-300 rounded-full opacity-20"
            />
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary