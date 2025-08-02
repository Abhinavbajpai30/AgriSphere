import { createContext, useContext, useState, useEffect } from 'react'
import { apiService } from '../services/api'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Check for existing auth token on mount
  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    const token = localStorage.getItem('agrisphere_token')
    
    if (token) {
      try {
        // Verify token with backend
        const response = await apiService.get('/auth/me')
        if (response.data && response.data.data && response.data.data.user) {
          setUser(response.data.data.user)
          setIsAuthenticated(true)
          apiService.setAuthToken(token)
        } else {
          // Invalid token
          clearAuth()
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        clearAuth()
      }
    }
    
    setIsLoading(false)
  }

  const login = async (phoneNumber, password) => {
    try {
      setIsLoading(true)
      
      const response = await apiService.post('/auth/login', {
        phoneNumber,
        password
      })

      if (response.data && response.data.data && response.data.data.token) {
        const { token, user: userData } = response.data.data
        
        // Store token
        localStorage.setItem('agrisphere_token', token)
        apiService.setAuthToken(token)
        
        // Update state
        setUser(userData)
        setIsAuthenticated(true)
        
        return { success: true, user: userData }
      } else {
        throw new Error('Invalid login response')
      }
    } catch (error) {
      console.error('Login failed:', error)
      
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Login failed. Please try again.'
      
      return { 
        success: false, 
        error: errorMessage 
      }
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (userData) => {
    try {
      setIsLoading(true)
      
      const response = await apiService.post('/auth/register', userData)

      if (response.data && response.data.data && response.data.data.token) {
        const { token, user: newUser } = response.data.data
        
        // Store token
        localStorage.setItem('agrisphere_token', token)
        apiService.setAuthToken(token)
        
        // Update state
        setUser(newUser)
        setIsAuthenticated(true)
        
        return { success: true, user: newUser }
      } else {
        throw new Error('Invalid registration response')
      }
    } catch (error) {
      console.error('Registration failed:', error)
      
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Registration failed. Please try again.'
      
      return { 
        success: false, 
        error: errorMessage 
      }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      // Optional: Call logout endpoint to invalidate token on server
      // await apiService.post('/auth/logout')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      clearAuth()
    }
  }

  const clearAuth = () => {
    localStorage.removeItem('agrisphere_token')
    apiService.clearAuthToken()
    setUser(null)
    setIsAuthenticated(false)
  }

  const updateUser = async (updatedData) => {
    try {
      const response = await apiService.put('/auth/profile', updatedData)
      
      if (response.data && response.data.user) {
        setUser(response.data.user)
        return { success: true, user: response.data.user }
      } else {
        throw new Error('Invalid update response')
      }
    } catch (error) {
      console.error('Profile update failed:', error)
      
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Failed to update profile.'
      
      return { 
        success: false, 
        error: errorMessage 
      }
    }
  }

  const refreshUser = async () => {
    try {
      const response = await apiService.get('/auth/me')
      if (response.data && response.data.data && response.data.data.user) {
        setUser(response.data.data.user)
        return { success: true, user: response.data.data.user }
      } else {
        throw new Error('Invalid user data response')
      }
    } catch (error) {
      console.error('User refresh failed:', error)
      return { success: false, error: error.message }
    }
  }

  const refreshToken = async () => {
    try {
      const response = await apiService.post('/auth/refresh-token')
      
      if (response.data && response.data.token) {
        const { token } = response.data
        localStorage.setItem('agrisphere_token', token)
        apiService.setAuthToken(token)
        return { success: true }
      } else {
        throw new Error('Token refresh failed')
      }
    } catch (error) {
      console.error('Token refresh failed:', error)
      clearAuth()
      return { success: false }
    }
  }

  const requestPasswordReset = async (phoneNumber) => {
    try {
      await apiService.post('/auth/forgot-password', { phoneNumber })
      return { success: true }
    } catch (error) {
      console.error('Password reset request failed:', error)
      
      const errorMessage = error.response?.data?.message || 
                          'Failed to send reset code. Please try again.'
      
      return { 
        success: false, 
        error: errorMessage 
      }
    }
  }

  const resetPassword = async (token, newPassword) => {
    try {
      await apiService.post('/auth/reset-password', {
        token,
        newPassword
      })
      return { success: true }
    } catch (error) {
      console.error('Password reset failed:', error)
      
      const errorMessage = error.response?.data?.message || 
                          'Failed to reset password. Please try again.'
      
      return { 
        success: false, 
        error: errorMessage 
      }
    }
  }

  // Helper functions
  const getToken = () => localStorage.getItem('agrisphere_token')
  
  const isTokenExpired = () => {
    const token = getToken()
    if (!token) return true
    
    try {
      // Decode JWT to check expiration (basic check)
      const payload = JSON.parse(atob(token.split('.')[1]))
      return payload.exp * 1000 < Date.now()
    } catch (error) {
      return true
    }
  }

  // User role and permission helpers
  const hasPermission = (permission) => {
    if (!user) return false
    // Add permission logic based on your user model
    return true // Simplified for now
  }

  const isSubscriptionActive = () => {
    if (!user || !user.status) return false
    return user.status.subscriptionType !== 'free'
  }

  const getSubscriptionType = () => {
    return user?.status?.subscriptionType || 'free'
  }

  const getUserLocation = () => {
    return user?.location || null
  }

  const getUserPreferences = () => {
    return user?.preferences || {}
  }

  const value = {
    // State
    user,
    isLoading,
    isAuthenticated,
    
    // Auth methods
    login,
    register,
    logout,
    updateUser,
    refreshUser,
    refreshToken,
    requestPasswordReset,
    resetPassword,
    
    // Utility methods
    getToken,
    isTokenExpired,
    hasPermission,
    isSubscriptionActive,
    getSubscriptionType,
    getUserLocation,
    getUserPreferences,
    
    // Manual auth check
    checkAuthStatus
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext