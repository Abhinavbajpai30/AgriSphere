import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  CameraIcon,
  PhotoIcon,
  MagnifyingGlassIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'

const CropDiagnosis = () => {
  const [selectedMethod, setSelectedMethod] = useState('camera')
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const diagnosisMethods = [
    {
      id: 'camera',
      title: 'Take Photo',
      description: 'Capture plant image for AI analysis',
      icon: CameraIcon,
      emoji: '📸',
      color: 'primary'
    },
    {
      id: 'upload',
      title: 'Upload Image',
      description: 'Select photo from gallery',
      icon: PhotoIcon,
      emoji: '🖼️',
      color: 'sky'
    },
    {
      id: 'symptoms',
      title: 'Describe Symptoms',
      description: 'Manual symptom checker',
      icon: MagnifyingGlassIcon,
      emoji: '🔍',
      color: 'orange'
    }
  ]

  const recentDiagnoses = [
    {
      id: 1,
      crop: 'Tomatoes',
      condition: 'Early Blight',
      confidence: 89,
      date: '2024-01-15',
      status: 'treated',
      image: '🍅'
    },
    {
      id: 2,
      crop: 'Maize',
      condition: 'Healthy',
      confidence: 95,
      date: '2024-01-14',
      status: 'healthy',
      image: '🌽'
    }
  ]

  const handleStartDiagnosis = () => {
    setIsAnalyzing(true)
    // Simulate analysis
    setTimeout(() => {
      setIsAnalyzing(false)
      // Show results
    }, 3000)
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

  if (isAnalyzing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-blue-50 to-orange-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-24 h-24 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6 shadow-glow"
          >
            <SparklesIcon className="w-12 h-12 text-white" />
          </motion.div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Analyzing Your Crop 🔬
          </h2>
          <p className="text-gray-600 mb-4">
            Our AI is examining the image for diseases and pests...
          </p>
          <div className="flex justify-center space-x-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{
                  scale: [1, 1.4, 1],
                  opacity: [0.3, 1, 0.3]
                }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  delay: i * 0.2
                }}
                className="w-2 h-2 bg-primary-400 rounded-full"
              />
            ))}
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-orange-50 safe-top">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-4xl mx-auto px-4 py-6"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
            Crop Health Diagnosis 🩺
          </h1>
          <p className="text-gray-600">
            AI-powered disease detection and treatment recommendations
          </p>
        </motion.div>

        {/* Diagnosis Methods */}
        <motion.div variants={itemVariants} className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Choose Diagnosis Method</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {diagnosisMethods.map((method) => (
              <motion.button
                key={method.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedMethod(method.id)}
                className={`
                  card-interactive text-center relative overflow-hidden
                  ${selectedMethod === method.id ? 'ring-2 ring-primary-500 bg-primary-50' : ''}
                `}
              >
                <div className="absolute top-2 right-2 text-2xl opacity-20">
                  {method.emoji}
                </div>
                
                <div className={`w-12 h-12 bg-${method.color}-100 rounded-2xl flex items-center justify-center mx-auto mb-3`}>
                  <method.icon className={`w-6 h-6 text-${method.color}-600`} />
                </div>
                
                <h3 className="font-semibold text-gray-800 text-sm mb-1">
                  {method.title}
                </h3>
                <p className="text-xs text-gray-600">
                  {method.description}
                </p>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Action Area */}
        <motion.div variants={itemVariants} className="mb-8">
          <div className="card text-center">
            {selectedMethod === 'camera' && (
              <div>
                <div className="w-24 h-24 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-glow">
                  <CameraIcon className="w-12 h-12 text-white" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">Take a Photo</h3>
                <p className="text-gray-600 text-sm mb-6">
                  Position the affected plant part in good lighting and take a clear photo
                </p>
                <button 
                  onClick={handleStartDiagnosis}
                  className="btn-primary"
                >
                  Open Camera
                </button>
              </div>
            )}

            {selectedMethod === 'upload' && (
              <div>
                <div className="w-24 h-24 bg-gradient-sky rounded-full flex items-center justify-center mx-auto mb-4 shadow-glow-sky">
                  <PhotoIcon className="w-12 h-12 text-white" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">Upload Image</h3>
                <p className="text-gray-600 text-sm mb-6">
                  Select a clear photo of the affected plant from your gallery
                </p>
                <button 
                  onClick={handleStartDiagnosis}
                  className="btn-secondary"
                >
                  Choose Photo
                </button>
              </div>
            )}

            {selectedMethod === 'symptoms' && (
              <div>
                <div className="w-24 h-24 bg-gradient-orange rounded-full flex items-center justify-center mx-auto mb-4 shadow-glow-orange">
                  <MagnifyingGlassIcon className="w-12 h-12 text-white" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">Describe Symptoms</h3>
                <p className="text-gray-600 text-sm mb-6">
                  Answer questions about what you observe on your plants
                </p>
                <button 
                  onClick={handleStartDiagnosis}
                  className="btn-warning"
                >
                  Start Questionnaire
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Recent Diagnoses */}
        <motion.div variants={itemVariants}>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Diagnoses</h2>
          <div className="space-y-3">
            {recentDiagnoses.map((diagnosis) => (
              <div key={diagnosis.id} className="card">
                <div className="flex items-center space-x-4">
                  <div className="text-3xl">{diagnosis.image}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-gray-800">{diagnosis.crop}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        diagnosis.status === 'healthy' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {diagnosis.condition}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>{diagnosis.confidence}% confidence</span>
                      <span>{diagnosis.date}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default CropDiagnosis