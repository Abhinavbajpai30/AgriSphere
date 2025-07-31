import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  PlusIcon,
  MapIcon,
  ChartBarIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline'

const FarmManagement = () => {
  const [selectedTab, setSelectedTab] = useState('overview')

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
        {/* Header */}
        <motion.div variants={itemVariants} className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
            Farm Management 🚜
          </h1>
          <p className="text-gray-600">
            Manage your fields, monitor performance, and optimize operations
          </p>
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
                <button className="btn-primary">
                  Create Farm
                </button>
              </motion.div>

              {/* Sample Farm Cards */}
              {[
                { name: 'Main Field', size: '5.2 ha', crops: 'Maize, Tomatoes', status: 'Active' },
                { name: 'North Plot', size: '2.8 ha', crops: 'Beans, Cassava', status: 'Planning' }
              ].map((farm, index) => (
                <motion.div
                  key={farm.name}
                  variants={itemVariants}
                  whileHover={{ scale: 1.02 }}
                  className="card-interactive"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-800">{farm.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      farm.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                    }`}>
                      {farm.status}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Size:</span>
                      <span className="font-medium">{farm.size}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Crops:</span>
                      <span className="font-medium">{farm.crops}</span>
                    </div>
                  </div>
                  <button className="w-full mt-4 btn-outline">
                    View Details
                  </button>
                </motion.div>
              ))}
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
    </div>
  )
}

export default FarmManagement