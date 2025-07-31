import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Cog6ToothIcon,
  BellIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
  MoonIcon,
  SunIcon,
  DevicePhoneMobileIcon,
  TrashIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { useLanguage } from '../../contexts/LanguageContext'
import { useOffline } from '../../contexts/OfflineContext'

const Settings = () => {
  const { t, currentLanguage, getSupportedLanguages } = useLanguage()
  const { clearCache, getCacheSize } = useOffline()
  
  const [settings, setSettings] = useState({
    notifications: {
      weather: true,
      irrigation: true,
      pests: true,
      harvest: false,
      updates: true
    },
    display: {
      darkMode: false,
      units: 'metric',
      dateFormat: 'DD/MM/YYYY'
    },
    privacy: {
      shareData: false,
      analytics: true,
      locationTracking: true
    }
  })

  const [cacheSize, setCacheSize] = useState(null)

  const handleSettingChange = (category, setting, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: value
      }
    }))
  }

  const handleClearCache = async () => {
    try {
      await clearCache()
      alert('Cache cleared successfully!')
    } catch (error) {
      alert('Failed to clear cache')
    }
  }

  const loadCacheSize = async () => {
    const size = await getCacheSize()
    setCacheSize(size)
  }

  const supportedLanguages = getSupportedLanguages()

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 safe-top">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-4xl mx-auto px-4 py-6"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
            {t('settings')} ⚙️
          </h1>
          <p className="text-gray-600">
            Customize your AgriSphere experience
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Notifications */}
          <motion.div variants={itemVariants} className="card">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center">
                <BellIcon className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-800">Notifications</h2>
            </div>
            
            <div className="space-y-4">
              {Object.entries(settings.notifications).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-700 capitalize">{key}</h4>
                    <p className="text-sm text-gray-600">
                      Get alerts for {key.toLowerCase()} updates
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => handleSettingChange('notifications', key, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Language & Region */}
          <motion.div variants={itemVariants} className="card">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-green-100 rounded-2xl flex items-center justify-center">
                <GlobeAltIcon className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-800">Language & Region</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="input-label">Language</label>
                <select 
                  className="input-primary"
                  value={currentLanguage}
                  onChange={(e) => {/* Language change handled by LanguageSelector */}}
                >
                  {supportedLanguages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.flag} {lang.nativeName}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="input-label">Units</label>
                <select 
                  className="input-primary"
                  value={settings.display.units}
                  onChange={(e) => handleSettingChange('display', 'units', e.target.value)}
                >
                  <option value="metric">Metric (kg, L, °C)</option>
                  <option value="imperial">Imperial (lbs, gal, °F)</option>
                </select>
              </div>
              
              <div>
                <label className="input-label">Date Format</label>
                <select 
                  className="input-primary"
                  value={settings.display.dateFormat}
                  onChange={(e) => handleSettingChange('display', 'dateFormat', e.target.value)}
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>
            </div>
          </motion.div>

          {/* Display */}
          <motion.div variants={itemVariants} className="card">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-purple-100 rounded-2xl flex items-center justify-center">
                {settings.display.darkMode ? (
                  <MoonIcon className="w-5 h-5 text-purple-600" />
                ) : (
                  <SunIcon className="w-5 h-5 text-purple-600" />
                )}
              </div>
              <h2 className="text-lg font-semibold text-gray-800">Display</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-700">Dark Mode</h4>
                  <p className="text-sm text-gray-600">Switch to dark theme</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.display.darkMode}
                    onChange={(e) => handleSettingChange('display', 'darkMode', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
              
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                <div className="flex items-start space-x-2">
                  <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-amber-800 text-sm">Coming Soon</h4>
                    <p className="text-xs text-amber-700">Dark mode will be available in the next update</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Privacy & Security */}
          <motion.div variants={itemVariants} className="card">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-red-100 rounded-2xl flex items-center justify-center">
                <ShieldCheckIcon className="w-5 h-5 text-red-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-800">Privacy & Security</h2>
            </div>
            
            <div className="space-y-4">
              {Object.entries(settings.privacy).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-700 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {key === 'shareData' && 'Share anonymous usage data to improve the app'}
                      {key === 'analytics' && 'Allow analytics to help us improve features'}
                      {key === 'locationTracking' && 'Enable location services for better recommendations'}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => handleSettingChange('privacy', key, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Storage & Cache */}
          <motion.div variants={itemVariants} className="card lg:col-span-2">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-indigo-100 rounded-2xl flex items-center justify-center">
                <DevicePhoneMobileIcon className="w-5 h-5 text-indigo-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-800">Storage & Cache</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-700 mb-2">App Cache</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Clear cached data to free up storage space
                </p>
                <button
                  onClick={handleClearCache}
                  className="btn-outline flex items-center space-x-2"
                >
                  <TrashIcon className="w-4 h-4" />
                  <span>Clear Cache</span>
                </button>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Storage Usage</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>App Data</span>
                    <span>2.3 MB</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Images</span>
                    <span>5.7 MB</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Offline Data</span>
                    <span>1.2 MB</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-semibold">
                    <span>Total</span>
                    <span>9.2 MB</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Account Actions */}
          <motion.div variants={itemVariants} className="card lg:col-span-2">
            <h2 className="text-lg font-semibold text-gray-800 mb-6">Account Actions</h2>
            
            <div className="grid md:grid-cols-3 gap-4">
              <button className="btn-outline">
                Export Data
              </button>
              <button className="btn-outline">
                Change Password
              </button>
              <button className="btn-outline text-red-600 border-red-200 hover:bg-red-50">
                Delete Account
              </button>
            </div>
          </motion.div>
        </div>

        {/* App Info */}
        <motion.div variants={itemVariants} className="mt-8 text-center">
          <div className="card bg-gradient-to-r from-primary-50 to-sky-50 border-primary-200">
            <div className="text-center">
              <h3 className="font-semibold text-gray-800 mb-2">AgriSphere v1.0.0</h3>
              <p className="text-sm text-gray-600 mb-4">
                AI-powered farming assistant for smallholder farmers
              </p>
              <div className="flex justify-center space-x-4 text-sm text-gray-500">
                <button className="hover:text-primary-600">Privacy Policy</button>
                <span>•</span>
                <button className="hover:text-primary-600">Terms of Service</button>
                <span>•</span>
                <button className="hover:text-primary-600">Support</button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default Settings