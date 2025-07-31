import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  UserCircleIcon,
  PencilIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  TrophyIcon,
  CheckBadgeIcon
} from '@heroicons/react/24/outline'
import { useAuth } from '../../contexts/AuthContext'
import { useLanguage } from '../../contexts/LanguageContext'

const Profile = () => {
  const { user, updateUser } = useAuth()
  const { t } = useLanguage()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    firstName: user?.personalInfo?.firstName || '',
    lastName: user?.personalInfo?.lastName || '',
    email: user?.personalInfo?.email || '',
    phoneNumber: user?.personalInfo?.phoneNumber || ''
  })

  const achievements = [
    { id: 1, title: 'First Diagnosis', description: 'Completed your first crop health check', icon: '🩺', earned: true },
    { id: 2, title: 'Water Saver', description: 'Saved 500L of water this month', icon: '💧', earned: true },
    { id: 3, title: 'Green Thumb', description: 'Successfully grew 5 different crops', icon: '🌱', earned: false },
    { id: 4, title: 'Tech Farmer', description: 'Used all AgriSphere features', icon: '📱', earned: false }
  ]

  const stats = [
    { label: 'Total Farms', value: user?.farms?.length || 2, emoji: '🏡' },
    { label: 'Diagnoses Made', value: 24, emoji: '🩺' },
    { label: 'Water Saved (L)', value: 1250, emoji: '💧' },
    { label: 'Days Active', value: 45, emoji: '📅' }
  ]

  const handleSave = async () => {
    try {
      const result = await updateUser({
        personalInfo: {
          ...user.personalInfo,
          ...formData
        }
      })
      
      if (result.success) {
        setIsEditing(false)
      }
    } catch (error) {
      console.error('Failed to update profile:', error)
    }
  }

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 safe-top">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-4xl mx-auto px-4 py-6"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
            {t('profile')} 👨‍🌾
          </h1>
          <p className="text-gray-600">
            Manage your farming profile and achievements
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info Card */}
            <motion.div variants={itemVariants} className="card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-800">Personal Information</h2>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="btn-ghost flex items-center space-x-2"
                >
                  <PencilIcon className="w-4 h-4" />
                  <span>{isEditing ? 'Cancel' : 'Edit'}</span>
                </button>
              </div>

              <div className="flex items-center space-x-6 mb-6">
                <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center shadow-glow">
                  <UserCircleIcon className="w-12 h-12 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">
                    {user?.personalInfo?.firstName} {user?.personalInfo?.lastName}
                  </h3>
                  <p className="text-gray-600 capitalize">
                    {user?.farmingProfile?.experienceLevel || 'Intermediate'} Farmer
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <CheckBadgeIcon className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-green-600">Verified Account</span>
                  </div>
                </div>
              </div>

              {isEditing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="input-label">{t('firstName')}</label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        className="input-primary"
                      />
                    </div>
                    <div>
                      <label className="input-label">{t('lastName')}</label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        className="input-primary"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="input-label">{t('email')}</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="input-primary"
                    />
                  </div>
                  <div>
                    <label className="input-label">{t('phoneNumber')}</label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      className="input-primary"
                    />
                  </div>
                  <div className="flex space-x-3">
                    <button onClick={handleSave} className="btn-primary">
                      Save Changes
                    </button>
                    <button onClick={() => setIsEditing(false)} className="btn-outline">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <PhoneIcon className="w-5 h-5 text-gray-500" />
                    <span className="text-gray-700">{user?.personalInfo?.phoneNumber}</span>
                  </div>
                  {user?.personalInfo?.email && (
                    <div className="flex items-center space-x-3">
                      <EnvelopeIcon className="w-5 h-5 text-gray-500" />
                      <span className="text-gray-700">{user?.personalInfo?.email}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-3">
                    <MapPinIcon className="w-5 h-5 text-gray-500" />
                    <span className="text-gray-700">
                      {user?.location?.region}, {user?.location?.country}
                    </span>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Farming Profile */}
            <motion.div variants={itemVariants} className="card">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Farming Profile</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-700 mb-1">Experience Level</h4>
                  <p className="text-gray-600 capitalize">{user?.farmingProfile?.experienceLevel}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-1">Farming Type</h4>
                  <p className="text-gray-600 capitalize">{user?.farmingProfile?.farmingType}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-1">Primary Crops</h4>
                  <div className="flex flex-wrap gap-1">
                    {user?.farmingProfile?.primaryCrops?.map((crop, index) => (
                      <span key={index} className="badge badge-info capitalize">{crop}</span>
                    )) || <span className="text-gray-500">None specified</span>}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-1">Total Farm Size</h4>
                  <p className="text-gray-600">{user?.farmingProfile?.farmSize || 0} hectares</p>
                </div>
              </div>
            </motion.div>

            {/* Achievements */}
            <motion.div variants={itemVariants} className="card">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
                <TrophyIcon className="w-5 h-5 text-yellow-500" />
                <span>Achievements</span>
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {achievements.map((achievement) => (
                  <div 
                    key={achievement.id} 
                    className={`p-4 rounded-2xl border-2 transition-all ${
                      achievement.earned 
                        ? 'border-green-200 bg-green-50' 
                        : 'border-gray-200 bg-gray-50 opacity-60'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{achievement.icon}</div>
                      <div>
                        <h4 className="font-semibold text-gray-800 text-sm">{achievement.title}</h4>
                        <p className="text-xs text-gray-600">{achievement.description}</p>
                        {achievement.earned && (
                          <span className="text-xs text-green-600 font-semibold">✓ Earned</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats */}
            <motion.div variants={itemVariants}>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Your Stats</h2>
              <div className="space-y-3">
                {stats.map((stat, index) => (
                  <div key={stat.label} className="card text-center">
                    <div className="text-2xl mb-2">{stat.emoji}</div>
                    <div className="text-2xl font-bold text-primary-600 mb-1">{stat.value}</div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Progress */}
            <motion.div variants={itemVariants} className="card">
              <h3 className="font-semibold text-gray-800 mb-4">Profile Completion</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span>Profile Progress</span>
                  <span>85%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '85%' }}
                    transition={{ delay: 0.5, duration: 1 }}
                    className="bg-gradient-primary h-3 rounded-full"
                  />
                </div>
                <div className="text-xs text-gray-600">
                  Add farm photos to reach 100%
                </div>
              </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div variants={itemVariants}>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <button className="w-full btn-primary">
                  Update Farming Profile
                </button>
                <button className="w-full btn-outline">
                  Change Password
                </button>
                <button className="w-full btn-outline">
                  Privacy Settings
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default Profile