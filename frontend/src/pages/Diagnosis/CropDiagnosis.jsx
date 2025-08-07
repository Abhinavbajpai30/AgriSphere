import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CameraIcon,
  PhotoIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
  XMarkIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  HeartIcon,
  StarIcon
} from '@heroicons/react/24/outline'
import { useAuth } from '../../contexts/AuthContext'
import apiService from '../../services/api'

const CropDiagnosis = () => {
  const { user, isAuthenticated } = useAuth()
  

  const [currentStep, setCurrentStep] = useState('method') // method, camera, upload, analysis, results
  const [selectedMethod, setSelectedMethod] = useState('camera')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [capturedImages, setCapturedImages] = useState([])
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [diagnosisResults, setDiagnosisResults] = useState(null)
  const [uploadId, setUploadId] = useState(null)
  const [error, setError] = useState(null)
  const [showCelebration, setShowCelebration] = useState(false)
  const [currentSymptomStep, setCurrentSymptomStep] = useState(0)
  const [symptomResponses, setSymptomResponses] = useState({})
  
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const fileInputRef = useRef(null)
  const [stream, setStream] = useState(null)
  const [isCameraReady, setIsCameraReady] = useState(false)
  
  // Diagnosis statistics for gamification
  const [userStats, setUserStats] = useState({
    totalDiagnoses: user?.appUsage?.totalDiagnoses || 0,
    streak: 0,
    accuracy: 92,
    badges: ['early-detector', 'plant-protector']
  })

  // Camera setup and cleanup
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [stream])

  // Hide header and navigation when camera is active
  useEffect(() => {
    if (currentStep === 'camera') {
      document.body.classList.add('camera-active')
      // Also add class to any floating navigation elements
      const floatingNavs = document.querySelectorAll('[class*="fixed bottom-6"]')
      floatingNavs.forEach(nav => nav.classList.add('camera-hidden'))
      
      // Prevent scrolling and set viewport for mobile
      document.body.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.width = '100%'
      document.body.style.height = '100%'
    } else {
      document.body.classList.remove('camera-active')
      // Remove class from floating navigation elements
      const floatingNavs = document.querySelectorAll('[class*="fixed bottom-6"]')
      floatingNavs.forEach(nav => nav.classList.remove('camera-hidden'))
      
      // Restore scrolling
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.width = ''
      document.body.style.height = ''
    }

    return () => {
      document.body.classList.remove('camera-active')
      const floatingNavs = document.querySelectorAll('[class*="fixed bottom-6"]')
      floatingNavs.forEach(nav => nav.classList.remove('camera-hidden'))
      
      // Restore scrolling
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.width = ''
      document.body.style.height = ''
    }
  }, [currentStep])

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Use back camera
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        videoRef.current.onloadedmetadata = () => {
          setIsCameraReady(true)
        }
      }
    } catch (err) {
      setError('Camera access denied. Please allow camera permissions and try again.')
      console.error('Camera error:', err)
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
      setIsCameraReady(false)
    }
  }

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    ctx.drawImage(video, 0, 0)

    canvas.toBlob((blob) => {
      const imageFile = new File([blob], `crop_photo_${Date.now()}.jpg`, { type: 'image/jpeg' })
      setCapturedImages([...capturedImages, {
        file: imageFile,
        preview: URL.createObjectURL(blob),
        id: Date.now()
      }])
      setShowCelebration(true)
      setTimeout(() => setShowCelebration(false), 2000)
    }, 'image/jpeg', 0.9)
  }

  const uploadImages = async () => {
    try {
      setCurrentStep('analysis')
      setIsAnalyzing(true)
      setAnalysisProgress(0)

      const formData = new FormData()
      capturedImages.forEach((img, index) => {
        formData.append('images', img.file)
      })

      // Simulate progress
      const progressInterval = setInterval(() => {
        setAnalysisProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + Math.random() * 15
        })
      }, 500)

      let uploadResponse;
      let analysisResponse;
      
      try {
        uploadResponse = await apiService.post('/diagnosis/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      } catch (error) {
        console.error('Upload request failed:', error);
        throw error;
      }

      if (uploadResponse.data?.status === 'success') {
        const uploadId = uploadResponse.data.message?.uploadId
        setUploadId(uploadId)
        
        // Analyze the uploaded images
        const analysisPayload = {
          uploadId: uploadId,
          cropType: 'unknown', // Could be selected by user
          additionalInfo: 'Mobile app diagnosis'
        }
        
        try {
          analysisResponse = await apiService.post('/diagnosis/analyze', analysisPayload, {
            headers: {
              'Content-Type': 'application/json'
            }
          })
        } catch (error) {
          console.error('Analysis request failed:', error);
          throw error;
        }

        clearInterval(progressInterval)
        setAnalysisProgress(100)

        if (analysisResponse.data?.status === 'success') {
          setDiagnosisResults(analysisResponse.data.message?.diagnosis)
          setCurrentStep('results')
          setShowCelebration(true)
          setTimeout(() => setShowCelebration(false), 3000)
        } else {
          throw new Error(analysisResponse.data?.message || 'Analysis failed')
        }
      } else {
        throw new Error(uploadResponse.data?.message || 'Upload failed')
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
      setCurrentStep('camera')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const diagnosisMethods = [
    {
      id: 'camera',
      title: 'AI Crop Doctor',
      subtitle: 'Instant Photo Diagnosis',
      description: 'Take a photo for instant AI-powered plant health analysis',
      icon: CameraIcon,
      emoji: '📸',
      gradient: 'from-teal-400 via-cyan-500 to-blue-500',
      features: ['Real-time analysis', 'Disease detection', 'Treatment advice']
    },
    {
      id: 'upload',
      title: 'Gallery Upload',
      subtitle: 'Analyze Existing Photos',
      description: 'Upload photos from your gallery for analysis',
      icon: PhotoIcon,
      emoji: '🖼️',
      gradient: 'from-purple-400 via-pink-500 to-red-500',
      features: ['Multiple photos', 'Batch analysis', 'History tracking']
    },
    {
      id: 'symptoms',
      title: 'Symptom Checker',
      subtitle: 'Manual Diagnosis',
      description: 'Describe symptoms for personalized recommendations',
      icon: MagnifyingGlassIcon,
      emoji: '🔍',
      gradient: 'from-orange-400 via-yellow-500 to-green-500',
      features: ['Step-by-step guide', 'Expert knowledge', 'Offline support']
    }
  ]

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files)
    const imageFiles = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      id: Date.now() + Math.random()
    }))
    setCapturedImages([...capturedImages, ...imageFiles])
    setCurrentStep('camera')
  }

  const removeImage = (id) => {
    setCapturedImages(capturedImages.filter(img => img.id !== id))
  }

  const resetDiagnosis = () => {
    setCurrentStep('method')
    setCapturedImages([])
    setDiagnosisResults(null)
    setError(null)
    setAnalysisProgress(0)
    stopCamera()
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 100 }
    }
  }

  const celebrationVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 15
      }
    }
  }

  // Render Method Selection Screen
  const renderMethodSelection = () => (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-6"
    >
      {/* Header with Gamification */}
      <motion.div variants={itemVariants} className="text-center mb-8">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 bg-gradient-to-r from-teal-400 to-cyan-500 rounded-full flex items-center justify-center"
          >
            <SparklesIcon className="w-6 h-6 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-gray-800">AI Crop Doctor</h1>
        </div>
        <p className="text-gray-600 mb-6">Get instant diagnosis for your plants with AI-powered analysis</p>
        
        {/* User Stats */}
        <div className="flex justify-center space-x-6 mb-8">
          <div className="text-center">
            <div className="text-2xl font-bold text-teal-600">{userStats.totalDiagnoses}</div>
            <div className="text-sm text-gray-500">Diagnoses</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{userStats.accuracy}%</div>
            <div className="text-sm text-gray-500">Accuracy</div>
          </div>
          <div className="text-center">
            <div className="flex justify-center space-x-1 mb-1">
              {[...Array(5)].map((_, i) => (
                <StarIcon key={i} className={`w-4 h-4 ${i < 4 ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
              ))}
            </div>
            <div className="text-sm text-gray-500">Rating</div>
          </div>
        </div>
      </motion.div>

      {/* Method Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {diagnosisMethods.map((method, index) => (
          <motion.div
            key={method.id}
            whileHover={{ scale: 1.02, y: -5 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setSelectedMethod(method.id)
              if (method.id === 'camera') {
                setCurrentStep('camera')
                startCamera()
              } else if (method.id === 'upload') {
                fileInputRef.current?.click()
              } else if (method.id === 'symptoms') {
                setCurrentStep('symptoms')
              }
            }}
            className="bg-white rounded-3xl p-6 shadow-lg border border-white/40 cursor-pointer hover:shadow-xl transition-all duration-300 relative overflow-hidden"
          >
            {/* Gradient Background */}
            <div className={`absolute inset-0 bg-gradient-to-br ${method.gradient} opacity-5`}></div>
            
            <div className="relative z-10">
              <div className="flex items-center space-x-4 mb-4">
                <div className={`w-16 h-16 bg-gradient-to-br ${method.gradient} rounded-2xl flex items-center justify-center`}>
                  <span className="text-2xl">{method.emoji}</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{method.title}</h3>
                  <p className="text-sm text-gray-500">{method.subtitle}</p>
                </div>
              </div>
              
              <p className="text-gray-600 mb-4">{method.description}</p>
              
              <div className="space-y-2">
                {method.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <CheckCircleIcon className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-gray-600">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileUpload}
        className="hidden"
      />
    </motion.div>
  )

  // Render Camera Interface
  const renderCameraInterface = () => (
    <div className="min-h-screen bg-black relative safe-top safe-bottom">
      {/* Back Button - Floating */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={resetDiagnosis}
        className="absolute top-6 left-6 z-20 w-12 h-12 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20 safe-top"
      >
        <ArrowLeftIcon className="w-6 h-6 text-white" />
      </motion.button>

      {/* Image Counter - Floating */}
      <div className="absolute top-6 right-6 z-20 w-12 h-12 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20 safe-top">
        <span className="text-white text-sm font-semibold">{capturedImages.length}</span>
      </div>

      {/* Camera View */}
      <div className="relative w-full h-screen">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />
        
        {/* Camera Overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Focus Ring */}
          <motion.div
            animate={{ 
              scale: [1, 1.05, 1],
              opacity: [0.7, 1, 0.7]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="w-72 h-72 border-4 border-white/60 rounded-3xl"
          />
          
          {/* Center Guidelines */}
          <div className="absolute w-72 h-72 pointer-events-none">
            <div className="absolute top-1/2 left-0 right-0 h-px bg-white/40"></div>
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/40"></div>
          </div>
        </div>

        {/* Guidance Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-40 left-0 right-0 text-center px-6 z-10 safe-bottom"
        >
          <p className="text-white text-lg font-medium mb-2">🌱 Perfect!</p>
          <p className="text-white/80">Center the plant and ensure good lighting</p>
        </motion.div>

        {/* Bottom Controls - Fixed positioning for mobile */}
        <div className="camera-controls fixed bottom-0 left-0 right-0 p-4 pb-8 bg-gradient-to-t from-black/95 via-black/80 to-transparent safe-bottom">
          <div className="flex items-center justify-between relative max-w-md mx-auto">
            {/* Gallery Preview - Left */}
            <div className="flex space-x-2">
              {capturedImages.slice(-2).map((img, index) => (
                <motion.div
                  key={img.id}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-12 h-12 rounded-lg overflow-hidden border-2 border-white/40 shadow-lg"
                >
                  <img src={img.preview} alt="" className="w-full h-full object-cover" />
                </motion.div>
              ))}
            </div>

            {/* Capture Button - Center */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={capturePhoto}
              disabled={!isCameraReady}
              className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl disabled:opacity-50"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-teal-400 to-cyan-500 rounded-full flex items-center justify-center">
                <CameraIcon className="w-8 h-8 text-white" />
              </div>
            </motion.button>

            {/* Analyze Button - Right */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={uploadImages}
              disabled={capturedImages.length === 0}
              className="px-6 py-3 bg-gradient-to-r from-teal-400 to-cyan-500 rounded-full text-white font-semibold shadow-lg disabled:opacity-50 text-sm"
            >
              Analyze ({capturedImages.length})
            </motion.button>
          </div>
        </div>
      </div>

      {/* Celebration Animation */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            variants={celebrationVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none"
          >
            <div className="text-center">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 0.5 }}
                className="text-6xl mb-4"
              >
                ✨
              </motion.div>
              <p className="text-white text-xl font-bold">Great Shot!</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )

  // Render Analysis Progress
  const renderAnalysisProgress = () => (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-blue-50 to-purple-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-md"
      >
        {/* Plant Growing Animation */}
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 2, -2, 0]
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="text-8xl mb-8"
        >
          🌱
        </motion.div>
        
        <h2 className="text-2xl font-bold text-gray-800 mb-4">AI Analysis in Progress</h2>
        <p className="text-gray-600 mb-8">Our AI is carefully examining your plant photos...</p>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-3 mb-4 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-teal-400 to-cyan-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${analysisProgress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
        
        <p className="text-lg font-semibold text-teal-600 mb-8">{Math.round(analysisProgress)}% Complete</p>
        
        {/* Analysis Steps */}
        <div className="space-y-3 text-left">
          {[
            { step: 'Uploading images', completed: analysisProgress > 20 },
            { step: 'Processing with AI', completed: analysisProgress > 50 },
            { step: 'Identifying issues', completed: analysisProgress > 75 },
            { step: 'Generating recommendations', completed: analysisProgress > 90 }
          ].map((item, index) => (
            <motion.div
              key={index}
              className={`flex items-center space-x-3 p-3 rounded-lg ${
                item.completed ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
              }`}
              animate={{ scale: item.completed ? 1.02 : 1 }}
            >
              {item.completed ? (
                <CheckCircleIcon className="w-5 h-5 text-green-500" />
              ) : (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-teal-400 border-t-transparent rounded-full"
                />
              )}
              <span className={`${item.completed ? 'text-green-700' : 'text-gray-600'}`}>
                {item.step}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )

  // Render Results
  const renderResults = () => (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className="text-6xl mb-4"
          >
            🎉
          </motion.div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Diagnosis Complete!</h1>
          <p className="text-gray-600">Here's what our AI found</p>
        </div>

        {diagnosisResults && (
          <>
            {/* Main Result Card */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-3xl p-8 shadow-xl border border-white/40 mb-6"
            >
              <div className="flex items-start space-x-6">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                  diagnosisResults.severity === 'high' ? 'bg-red-100' :
                  diagnosisResults.severity === 'medium' ? 'bg-yellow-100' :
                  'bg-green-100'
                }`}>
                  <span className="text-2xl">
                    {diagnosisResults.severity === 'high' ? '🚨' :
                     diagnosisResults.severity === 'medium' ? '⚠️' : '✅'}
                  </span>
                </div>
                
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    {diagnosisResults.primaryIssue}
                  </h2>
                  <p className="text-gray-600 mb-4">
                    Plant Health: {diagnosisResults.plantHealth}
                  </p>
                  
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-semibold text-gray-500">Confidence:</span>
                      <div className="flex items-center space-x-1">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-teal-400 to-cyan-500 h-2 rounded-full"
                            style={{ width: `${diagnosisResults.confidence}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-teal-600">
                          {diagnosisResults.confidence}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Treatment Recommendations */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-3xl p-8 shadow-xl border border-white/40 mb-6"
            >
              <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center space-x-2">
                <span>💊</span>
                <span>Treatment Plan</span>
              </h3>
              
              <div className="space-y-4">
                {diagnosisResults.recommendations.immediate?.map((rec, index) => (
                  <motion.div
                    key={index}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.1 * index }}
                    className="flex items-start space-x-3 p-4 bg-teal-50 rounded-xl border border-teal-200"
                  >
                    <CheckCircleIcon className="w-6 h-6 text-teal-500 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-gray-800">{rec.title || `Step ${index + 1}`}</h4>
                      <p className="text-gray-600">{rec.description || rec}</p>
                      {rec.urgency && (
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold mt-2 ${
                          rec.urgency === 'high' ? 'bg-red-100 text-red-700' :
                          rec.urgency === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {rec.urgency} priority
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={resetDiagnosis}
                className="flex-1 bg-gradient-to-r from-teal-400 to-cyan-500 text-white font-semibold py-4 px-6 rounded-2xl shadow-lg"
              >
                New Diagnosis
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 bg-white border-2 border-teal-400 text-teal-600 font-semibold py-4 px-6 rounded-2xl"
              >
                Save to History
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 bg-purple-500 text-white font-semibold py-4 px-6 rounded-2xl shadow-lg"
              >
                Share Results
              </motion.button>
            </motion.div>
          </>
        )}
      </motion.div>
    </div>
  )

  // Render Symptom Checker Interface
  const renderSymptomChecker = () => {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-green-50 p-6">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="flex items-center justify-center space-x-3 mb-4">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 bg-gradient-to-r from-orange-400 to-yellow-500 rounded-full flex items-center justify-center"
              >
                <MagnifyingGlassIcon className="w-6 h-6 text-white" />
              </motion.div>
              <h1 className="text-3xl font-bold text-gray-800">Symptom Checker</h1>
            </div>
            <p className="text-gray-600">Coming Soon</p>
          </motion.div>

          {/* Coming Soon Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-12 shadow-xl border border-white/40 text-center"
          >
            <div className="text-8xl mb-6">🔧</div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Feature Coming Soon</h2>
            <p className="text-gray-600 mb-8 text-lg">
              We're working hard to bring you an advanced symptom checker with AI-powered diagnosis. 
              This feature will help you identify plant problems step-by-step.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <div className="text-4xl mb-2">🤖</div>
                <h3 className="font-semibold text-gray-800 mb-2">AI-Powered</h3>
                <p className="text-sm text-gray-600">Advanced machine learning for accurate diagnosis</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-2">📋</div>
                <h3 className="font-semibold text-gray-800 mb-2">Step-by-Step</h3>
                <p className="text-sm text-gray-600">Guided questions for precise identification</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-2">💡</div>
                <h3 className="font-semibold text-gray-800 mb-2">Expert Advice</h3>
                <p className="text-sm text-gray-600">Professional treatment recommendations</p>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={resetDiagnosis}
              className="bg-gradient-to-r from-orange-400 to-yellow-500 text-white font-semibold py-4 px-8 rounded-2xl shadow-lg"
            >
              Back to Diagnosis
            </motion.button>
          </motion.div>
        </div>
      </div>
    )
  }

  // Error Display
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="text-6xl mb-6">😓</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Oops! Something went wrong</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={resetDiagnosis}
            className="bg-gradient-to-r from-red-400 to-orange-500 text-white font-semibold py-3 px-8 rounded-2xl shadow-lg"
          >
            Try Again
          </motion.button>
        </motion.div>
      </div>
    )
  }

  // Main Render Logic
  switch (currentStep) {
    case 'camera':
      return renderCameraInterface()
    case 'symptoms':
      return renderSymptomChecker()
    case 'analysis':
      return renderAnalysisProgress()
    case 'results':
      return renderResults()
    default:
      return renderMethodSelection()
  }
}

export default CropDiagnosis