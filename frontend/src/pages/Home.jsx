import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  ArrowRightIcon,
  HeartIcon,
  MapIcon,
  BeakerIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline'
import { useLanguage } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'

const Home = () => {
  const { t } = useLanguage()
  const { isAuthenticated } = useAuth()

  const features = [
    {
      icon: HeartIcon,
      title: t('cropHealth'),
      description: 'AI-powered crop disease detection and treatment recommendations',
      color: 'orange',
      emoji: '🩺'
    },
    {
      icon: BeakerIcon,
      title: t('waterManagement'),
      description: 'Smart irrigation planning based on weather and soil conditions',
      color: 'sky',
      emoji: '💧'
    },
    {
      icon: CalendarDaysIcon,
      title: t('farmPlanning'),
      description: 'Seasonal crop rotation and harvest planning assistance',
      color: 'primary',
      emoji: '📅'
    },
    {
      icon: MapIcon,
      title: 'Farm Management',
      description: 'GPS-based field mapping and boundary management',
      color: 'earth',
      emoji: '🗺️'
    }
  ]

  const stats = [
    { number: '10,000+', label: 'Farmers Helped', emoji: '👨‍🌾' },
    { number: '50,000+', label: 'Crops Diagnosed', emoji: '🌾' },
    { number: '8', label: 'Languages', emoji: '🌍' },
    { number: '99%', label: 'Accuracy Rate', emoji: '🎯' }
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
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative px-4 pt-20 pb-16 overflow-hidden">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-4xl mx-auto text-center"
        >
          {/* Main Heading */}
          <motion.div variants={itemVariants} className="mb-8">
            <motion.h1 
              className="text-4xl md:text-6xl font-bold mb-6"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <span className="text-gradient-primary">Smart Farming</span>
              <br />
              <span className="text-gray-800">Made Simple</span>
            </motion.h1>
            
            <motion.p 
              className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed"
              variants={itemVariants}
            >
              {t('tagline')} - Empowering smallholder farmers with AI-powered insights, 
              crop health monitoring, and smart irrigation management.
            </motion.p>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div 
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
          >
            <Link
              to={isAuthenticated ? '/dashboard' : '/register'}
              className="btn-primary text-lg px-8 py-4 group"
            >
              <span>{isAuthenticated ? 'Go to Dashboard' : t('getStarted')}</span>
              <motion.div
                className="ml-2"
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <ArrowRightIcon className="w-5 h-5" />
              </motion.div>
            </Link>
            
            <Link
              to="/about"
              className="btn-outline text-lg px-8 py-4"
            >
              {t('learnMore')}
            </Link>
          </motion.div>

          {/* Hero Image/Animation */}
          <motion.div
            variants={itemVariants}
            className="relative max-w-2xl mx-auto"
          >
            <div className="relative bg-gradient-to-br from-primary-100 to-sky-100 rounded-3xl p-8 shadow-soft">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {['🌱', '🚜', '💧', '📊'].map((emoji, index) => (
                  <motion.div
                    key={emoji}
                    animate={{ 
                      y: [0, -10, 0],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{ 
                      duration: 2 + index * 0.5,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: index * 0.2
                    }}
                    className="w-16 h-16 mx-auto bg-white rounded-2xl flex items-center justify-center text-2xl shadow-soft"
                  >
                    {emoji}
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-16 bg-white/50">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="max-w-6xl mx-auto"
        >
          <motion.div variants={itemVariants} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Everything You Need to Farm Smarter
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Comprehensive tools designed specifically for smallholder farmers
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                variants={itemVariants}
                whileHover={{ 
                  scale: 1.05,
                  y: -5
                }}
                className="card-interactive group"
              >
                <div className="relative">
                  {/* Background Emoji */}
                  <div className="absolute top-2 right-2 text-3xl opacity-20">
                    {feature.emoji}
                  </div>
                  
                  {/* Icon */}
                  <div className={`w-12 h-12 bg-${feature.color}-100 rounded-2xl flex items-center justify-center mb-4 group-hover:shadow-glow-${feature.color} transition-all duration-300`}>
                    <feature.icon className={`w-6 h-6 text-${feature.color}-600`} />
                  </div>
                  
                  {/* Content */}
                  <h3 className="font-semibold text-lg text-gray-800 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="px-4 py-16">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <motion.div variants={itemVariants} className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Trusted by Farmers Worldwide
            </h2>
            <p className="text-gray-600">
              Join thousands of farmers already benefiting from smart agriculture
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                variants={itemVariants}
                whileHover={{ scale: 1.1 }}
                className="text-center"
              >
                <div className="relative mb-4">
                  <motion.div
                    animate={{ 
                      rotate: [0, 10, -10, 0],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      delay: index * 0.2
                    }}
                    className="text-4xl mb-2"
                  >
                    {stat.emoji}
                  </motion.div>
                </div>
                <div className="text-2xl md:text-3xl font-bold text-gradient-primary mb-1">
                  {stat.number}
                </div>
                <div className="text-sm text-gray-600 font-medium">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-16 bg-gradient-to-br from-primary-500 to-primary-600 text-white">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center"
        >
          <motion.div variants={itemVariants}>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Transform Your Farming?
            </h2>
            <p className="text-lg mb-8 opacity-90">
              Join AgriSphere today and experience the future of agriculture
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to={isAuthenticated ? '/dashboard' : '/register'}
                className="bg-white text-primary-600 font-semibold py-4 px-8 rounded-2xl hover:bg-gray-50 transition-colors text-lg"
              >
                {isAuthenticated ? 'Open Dashboard' : 'Start Free Today'}
              </Link>
              
              {!isAuthenticated && (
                <Link
                  to="/login"
                  className="border-2 border-white text-white font-semibold py-4 px-8 rounded-2xl hover:bg-white/10 transition-colors text-lg"
                >
                  Already a Member?
                </Link>
              )}
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Floating Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              y: [0, -100, 0],
              x: [0, 50, 0],
              rotate: [0, 180, 360],
              opacity: [0, 0.3, 0]
            }}
            transition={{
              duration: 8 + i * 2,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 1.5
            }}
            className="absolute text-2xl"
            style={{
              left: `${10 + i * 15}%`,
              top: `${20 + i * 10}%`
            }}
          >
            {['🌱', '🚜', '💧', '🌾', '☀️', '🍃'][i]}
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default Home