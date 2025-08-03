import { memo } from 'react'
import { motion } from 'framer-motion'
import { 
  SunIcon, 
  CloudIcon, 
  EyeDropperIcon,
  BeakerIcon 
} from '@heroicons/react/24/outline'

const WeatherWidget = memo(({ weatherData }) => {
  if (!weatherData?.current) {
    return (
      <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 border border-white/30">
        <div className="animate-pulse">
          <div className="h-6 bg-white/30 rounded mb-4"></div>
          <div className="h-16 bg-white/30 rounded"></div>
        </div>
      </div>
    )
  }

  const { current, forecast, alerts } = weatherData

  const getWeatherIcon = (description) => {
    const desc = description?.toLowerCase() || ''
    if (desc.includes('rain')) return '🌧️'
    if (desc.includes('cloud')) return '☁️'
    if (desc.includes('sun') || desc.includes('clear')) return '☀️'
    if (desc.includes('snow')) return '🌨️'
    return '🌤️'
  }

  const getTemperatureColor = (temp) => {
    if (temp > 30) return 'text-red-200'
    if (temp > 20) return 'text-yellow-200'
    return 'text-blue-200'
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 border border-white/30 relative overflow-hidden"
    >
      {/* Background Animation */}
      <div className="absolute inset-0 opacity-20">
        <motion.div
          animate={{ 
            rotate: [0, 360],
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            duration: 20, 
            repeat: Infinity,
            ease: "linear" 
          }}
          className="w-32 h-32 bg-gradient-to-r from-white/30 to-transparent rounded-full blur-xl -top-8 -right-8 absolute"
        />
      </div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white/90">Current Weather</h3>
            {weatherData?.location?.name && (
              <p className="text-sm text-white/70 mt-1">
                📍 {weatherData.location.name}
                {weatherData.location.country === 'Coordinates' && (
                  <span className="text-xs text-white/50 ml-1">(GPS)</span>
                )}
              </p>
            )}
          </div>
          {alerts?.length > 0 && (
            <motion.div
              animate={{ pulse: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-3 h-3 bg-red-400 rounded-full"
            />
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Current Weather */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-4 mb-4">
              <motion.div
                animate={{ 
                  rotate: current.description?.includes('sun') ? [0, 360] : 0,
                  y: current.description?.includes('rain') ? [0, -5, 0] : 0
                }}
                transition={{ 
                  duration: current.description?.includes('sun') ? 10 : 2,
                  repeat: Infinity,
                  ease: "linear"
                }}
                className="text-5xl"
              >
                {getWeatherIcon(current.description)}
              </motion.div>
              
              <div>
                <div className={`text-4xl font-bold ${getTemperatureColor(current.temperature)}`}>
                  {current.temperature === '--' || current.temperature === 'Weather unavailable' ? '--' : `${current.temperature}°C`}
                </div>
                <div className="text-white/80 capitalize">
                  {current.description === 'Weather unavailable' ? 'Weather data unavailable' : current.description}
                </div>
              </div>
            </div>

            {/* Weather Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2 text-white/70">
                <EyeDropperIcon className="w-4 h-4" />
                <span className="text-sm">Humidity: {current.humidity || '--'}%</span>
              </div>
              <div className="flex items-center space-x-2 text-white/70">
                <span className="text-sm">Wind: {current.windSpeed || '--'} km/h</span>
              </div>
              {current.uvIndex && (
                <div className="flex items-center space-x-2 text-white/70">
                  <SunIcon className="w-4 h-4" />
                  <span className="text-sm">UV Index: {current.uvIndex}</span>
                </div>
              )}
            </div>
          </div>

          {/* Forecast */}
          <div>
            <h4 className="text-sm font-medium text-white/80 mb-3">3-Day Forecast</h4>
            <div className="space-y-3">
              {forecast?.slice(0, 3).map((day, index) => (
                <motion.div
                  key={index}
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getWeatherIcon(day.description)}</span>
                    <span className="text-sm text-white/80">
                      {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
                    </span>
                  </div>
                  <div className="text-sm text-white/90 font-medium">
                    {day.high}° / {day.low}°
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Weather Alerts */}
        {alerts?.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="mt-4 p-3 bg-red-500/20 rounded-lg border border-red-400/30"
          >
            <div className="flex items-center space-x-2 mb-1">
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="text-red-300"
              >
                ⚠️
              </motion.span>
              <span className="text-sm font-medium text-red-200">
                Weather Alert
              </span>
            </div>
            <p className="text-xs text-red-200/90">
              {alerts[0].message}
            </p>
          </motion.div>
        )}

        {/* Floating Weather Particles */}
        {current.description?.includes('rain') && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(15)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  y: -10, 
                  x: Math.random() * 300,
                  opacity: 0.7 
                }}
                animate={{ 
                  y: 200,
                  opacity: [0.7, 0.3, 0]
                }}
                transition={{
                  duration: Math.random() * 2 + 1,
                  repeat: Infinity,
                  delay: Math.random() * 2
                }}
                className="absolute w-0.5 h-4 bg-blue-300/50 rounded-full"
              />
            ))}
          </div>
        )}

        {current.description?.includes('sun') && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  scale: 0,
                  rotate: i * 45,
                  x: 150,
                  y: 80
                }}
                animate={{ 
                  scale: [0, 1, 0],
                  opacity: [0, 0.3, 0]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: i * 0.2
                }}
                className="absolute w-1 h-12 bg-yellow-300/30 rounded-full origin-bottom"
                style={{
                  transformOrigin: '50% 100%'
                }}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
})

export default WeatherWidget