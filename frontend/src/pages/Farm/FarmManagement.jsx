import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import { 
  PlusIcon,
  MapIcon,
  ChartBarIcon,
  AdjustmentsHorizontalIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { farmApi } from '../../services/api'

const FarmManagement = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [selectedTab, setSelectedTab] = useState('overview')
  const [successMessage, setSuccessMessage] = useState('')
  const [farms, setFarms] = useState([])
  const [farmsLoading, setFarmsLoading] = useState(true)
  const [farmsError, setFarmsError] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [farmToDelete, setFarmToDelete] = useState(null)

  // Check for success message from navigation state and refresh farms
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message)
      // Clear the state to prevent showing the message again on refresh
      navigate(location.pathname, { replace: true })
      // Refresh farms when returning from successful farm creation
      fetchFarms()
    }
  }, [location.state, navigate, location.pathname])

  // Fetch user's farms
  const fetchFarms = async () => {
    try {
      setFarmsLoading(true)
      setFarmsError('')
      
      const response = await farmApi.getFarms()
      console.log('Farms API response:', response.data)
      
      if (response.data && response.data.status === 'success' && response.data.data && response.data.data.farms) {
        setFarms(response.data.data.farms)
      } else {
        setFarms([])
      }
    } catch (error) {
      console.error('Error fetching farms:', error)
      setFarmsError('Failed to load farms. Please try again.')
      setFarms([])
    } finally {
      setFarmsLoading(false)
    }
  }

  // Initial fetch and refresh when returning from add farm
  useEffect(() => {
    fetchFarms()
  }, [])

  // Refresh farms when returning from add farm page
  useEffect(() => {
    const handleFocus = () => {
      // Refresh farms when user returns to this page
      fetchFarms()
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  // Delete farm function
  const handleDeleteFarm = async (farmId, farmName) => {
    try {
      setDeleteLoading(true)
      await farmApi.deleteFarm(farmId)
      
      // Remove the farm from the local state
      setFarms(prevFarms => prevFarms.filter(farm => farm._id !== farmId))
      
      // Show success message
      setSuccessMessage(`Farm "${farmName}" deleted successfully`)
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000)
      
    } catch (error) {
      console.error('Error deleting farm:', error)
      setFarmsError('Failed to delete farm. Please try again.')
      
      // Clear error message after 3 seconds
      setTimeout(() => setFarmsError(''), 3000)
    } finally {
      setDeleteLoading(false)
      setFarmToDelete(null)
    }
  }

  // Confirm delete dialog
  const confirmDelete = (farm) => {
    setFarmToDelete(farm)
  }

  const cancelDelete = () => {
    setFarmToDelete(null)
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: ChartBarIcon, emoji: '📊' },
    { id: 'fields', label: 'Fields', icon: MapIcon, emoji: '🗺️' },
    { id: 'settings', label: 'Settings', icon: AdjustmentsHorizontalIcon, emoji: '⚙️' }
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-orange-50 safe-top">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-6xl mx-auto px-4 py-6"
      >
        {/* Success Message */}
        <AnimatePresence>
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  <span className="text-green-800 font-medium">{successMessage}</span>
                </div>
                <button
                  onClick={() => setSuccessMessage('')}
                  className="text-green-400 hover:text-green-600 transition-colors"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <motion.div variants={itemVariants} className="text-center mb-8">
          <div className="flex items-center justify-between">
            <div className="flex-1"></div>
            <div className="flex-1 text-center">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
                Farm Management 🚜
              </h1>
              <p className="text-gray-600">
                Manage your fields, monitor performance, and optimize operations
              </p>
            </div>
            <div className="flex-1 flex justify-end">
              <button
                onClick={fetchFarms}
                disabled={farmsLoading}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  farmsLoading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-primary-500 hover:bg-primary-600 text-white'
                }`}
              >
                {farmsLoading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div variants={itemVariants} className="flex justify-center mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-2 shadow-soft">
            <div className="flex space-x-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id)}
                  className={`
                    flex items-center space-x-2 px-4 py-3 rounded-xl transition-all duration-200
                    ${selectedTab === tab.id 
                      ? 'bg-primary-500 text-white shadow-glow' 
                      : 'hover:bg-primary-50 text-gray-600'
                    }
                  `}
                >
                  <span className="text-lg">{tab.emoji}</span>
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Content Area */}
        <motion.div variants={itemVariants} className="space-y-6">
          {selectedTab === 'overview' && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Add Farm Card */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="card-interactive text-center"
              >
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <PlusIcon className="w-8 h-8 text-primary-600" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">Add New Farm</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Register a new farming area
                </p>
                <button 
                  onClick={() => navigate('/farm/add')}
                  className="btn-primary"
                >
                  Create Farm
                </button>
              </motion.div>

              {/* Loading State */}
              {farmsLoading && (
                <motion.div
                  variants={itemVariants}
                  className="col-span-full flex items-center justify-center py-8"
                >
                  <div className="flex items-center space-x-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
                    <span className="text-gray-600">Loading your farms...</span>
                  </div>
                </motion.div>
              )}

              {/* Error State */}
              {farmsError && !farmsLoading && (
                <motion.div
                  variants={itemVariants}
                  className="col-span-full text-center py-8"
                >
                  <div className="text-red-500 mb-2">{farmsError}</div>
                  <button 
                    onClick={() => window.location.reload()}
                    className="btn-outline"
                  >
                    Try Again
                  </button>
                </motion.div>
              )}

              {/* Real Farm Cards */}
              {!farmsLoading && !farmsError && farms.map((farm) => (
                <motion.div
                  key={farm._id}
                  variants={itemVariants}
                  whileHover={{ scale: 1.02 }}
                  className="card-interactive"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-800">{farm.farmInfo.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      farm.status?.isActive ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                    }`}>
                      {farm.status?.isActive ? 'Active' : 'Planning'}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Size:</span>
                      <span className="font-medium">{farm.farmInfo.totalArea.value} {farm.farmInfo.totalArea.unit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Crops:</span>
                      <span className="font-medium">
                        {farm.currentCrops && farm.currentCrops.length > 0 
                          ? farm.currentCrops.map(crop => crop.cropName).join(', ')
                          : 'No crops planted'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Location:</span>
                      <span className="font-medium">{farm.location.address}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button className="flex-1 btn-outline">
                      View Details
                    </button>
                    <button 
                      onClick={() => confirmDelete(farm)}
                      className="px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 hover:border-red-300 rounded-lg transition-colors"
                      title="Delete farm"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}

              {/* Empty State */}
              {!farmsLoading && !farmsError && farms.length === 0 && (
                <motion.div
                  variants={itemVariants}
                  className="col-span-full text-center py-8"
                >
                  <div className="text-6xl mb-4">🌾</div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">No Farms Yet</h3>
                  <p className="text-gray-600 mb-4">
                    You haven't created any farms yet. Start by adding your first farm!
                  </p>
                </motion.div>
              )}
            </div>
          )}

          {selectedTab === 'fields' && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🗺️</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Field Mapping</h3>
              <p className="text-gray-600 mb-6">
                Interactive field mapping feature coming soon
              </p>
              <button className="btn-primary">
                Enable GPS Mapping
              </button>
            </div>
          )}

          {selectedTab === 'settings' && (
            <div className="max-w-md mx-auto">
              <div className="card">
                <h3 className="font-semibold text-gray-800 mb-4">Farm Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="input-label">Default Units</label>
                    <select className="input-primary">
                      <option>Metric (hectares, kg)</option>
                      <option>Imperial (acres, lbs)</option>
                    </select>
                  </div>
                  <div>
                    <label className="input-label">Time Zone</label>
                    <select className="input-primary">
                      <option>Auto-detect</option>
                      <option>UTC+0</option>
                      <option>UTC+1</option>
                    </select>
                  </div>
                  <button className="btn-primary w-full">
                    Save Settings
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* Delete Confirmation Dialog */}
      <AnimatePresence>
        {farmToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={cancelDelete}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                  <XMarkIcon className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Delete Farm</h3>
                  <p className="text-sm text-gray-600">This action cannot be undone</p>
                </div>
              </div>
              
              <p className="text-gray-700 mb-6">
                Are you sure you want to delete <strong>"{farmToDelete.farmInfo.name}"</strong>? 
                This will permanently remove all farm data including crops, fields, and analytics.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={cancelDelete}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  disabled={deleteLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteFarm(farmToDelete._id, farmToDelete.farmInfo.name)}
                  className="flex-1 px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={deleteLoading}
                >
                  {deleteLoading ? 'Deleting...' : 'Delete Farm'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default FarmManagement