import { motion } from 'framer-motion'

/**
 * Skeleton Loader Components
 * Provides elegant loading states with shimmer effects
 */

const shimmerAnimation = {
  initial: { x: '-100%' },
  animate: {
    x: '100%',
    transition: {
      duration: 1.5,
      ease: 'linear',
      repeat: Infinity
    }
  }
}

const SkeletonBase = ({ className = '', children }) => (
  <div className={`relative overflow-hidden bg-gray-200 rounded-lg ${className}`}>
    <motion.div
      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
      variants={shimmerAnimation}
      initial="initial"
      animate="animate"
    />
    {children}
  </div>
)

// Dashboard Skeleton Components
export const DashboardSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-6">
    <div className="max-w-7xl mx-auto">
      {/* Header Skeleton */}
      <div className="mb-8">
        <SkeletonBase className="h-8 w-64 mb-2" />
        <SkeletonBase className="h-4 w-48" />
      </div>

      {/* Weather Widget Skeleton */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 border border-white/30 mb-8"
      >
        <div className="flex items-center justify-between mb-4">
          <SkeletonBase className="h-6 w-32" />
          <SkeletonBase className="h-3 w-3 rounded-full" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <div className="flex items-center space-x-4 mb-4">
              <SkeletonBase className="h-16 w-16 rounded-full" />
              <div>
                <SkeletonBase className="h-10 w-24 mb-2" />
                <SkeletonBase className="h-4 w-32" />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <SkeletonBase className="h-4 w-28" />
              <SkeletonBase className="h-4 w-24" />
              <SkeletonBase className="h-4 w-20" />
              <SkeletonBase className="h-4 w-26" />
            </div>
          </div>
          
          <div>
            <SkeletonBase className="h-5 w-24 mb-3" />
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <SkeletonBase className="h-4 w-4 rounded-full" />
                    <SkeletonBase className="h-3 w-8" />
                  </div>
                  <SkeletonBase className="h-3 w-12" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tools Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[1, 2, 3].map(i => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white rounded-2xl p-6 shadow-sm border"
          >
            <div className="flex items-center space-x-3 mb-4">
              <SkeletonBase className="h-12 w-12 rounded-xl" />
              <div>
                <SkeletonBase className="h-5 w-32 mb-1" />
                <SkeletonBase className="h-3 w-24" />
              </div>
            </div>
            <SkeletonBase className="h-16 w-full mb-4" />
            <div className="flex justify-between items-center">
              <SkeletonBase className="h-4 w-20" />
              <SkeletonBase className="h-8 w-8 rounded-full" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Tasks Section Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border">
          <SkeletonBase className="h-6 w-32 mb-4" />
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="flex items-center space-x-3">
                <SkeletonBase className="h-10 w-10 rounded-full" />
                <div className="flex-1">
                  <SkeletonBase className="h-4 w-40 mb-1" />
                  <SkeletonBase className="h-3 w-32" />
                </div>
                <SkeletonBase className="h-6 w-16 rounded-full" />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border">
          <SkeletonBase className="h-6 w-28 mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex justify-between items-center">
                <SkeletonBase className="h-4 w-24" />
                <SkeletonBase className="h-4 w-16" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
)

// List Item Skeleton
export const ListItemSkeleton = ({ count = 3 }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: i * 0.1 }}
        className="flex items-center space-x-4 p-4 bg-white rounded-lg shadow-sm"
      >
        <SkeletonBase className="h-12 w-12 rounded-full" />
        <div className="flex-1">
          <SkeletonBase className="h-4 w-3/4 mb-2" />
          <SkeletonBase className="h-3 w-1/2" />
        </div>
        <SkeletonBase className="h-8 w-20 rounded-full" />
      </motion.div>
    ))}
  </div>
)

// Card Grid Skeleton
export const CardGridSkeleton = ({ columns = 3, count = 6 }) => (
  <div className={`grid grid-cols-1 md:grid-cols-${columns} gap-6`}>
    {Array.from({ length: count }).map((_, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: i * 0.1 }}
        className="bg-white rounded-xl p-6 shadow-sm border"
      >
        <SkeletonBase className="h-40 w-full mb-4 rounded-lg" />
        <SkeletonBase className="h-5 w-3/4 mb-2" />
        <SkeletonBase className="h-4 w-1/2 mb-4" />
        <div className="flex justify-between items-center">
          <SkeletonBase className="h-4 w-16" />
          <SkeletonBase className="h-8 w-24 rounded-full" />
        </div>
      </motion.div>
    ))}
  </div>
)

// Form Skeleton
export const FormSkeleton = () => (
  <div className="space-y-6">
    {[1, 2, 3, 4].map(i => (
      <motion.div
        key={i}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.1 }}
      >
        <SkeletonBase className="h-4 w-24 mb-2" />
        <SkeletonBase className="h-12 w-full rounded-lg" />
      </motion.div>
    ))}
    
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="flex space-x-4 pt-4"
    >
      <SkeletonBase className="h-12 w-32 rounded-lg" />
      <SkeletonBase className="h-12 w-24 rounded-lg" />
    </motion.div>
  </div>
)

// Chart Skeleton
export const ChartSkeleton = ({ height = 'h-64' }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="bg-white rounded-xl p-6 shadow-sm border"
  >
    <SkeletonBase className="h-6 w-32 mb-4" />
    <div className={`${height} flex items-end justify-between space-x-2`}>
      {Array.from({ length: 7 }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ delay: i * 0.1, duration: 0.3 }}
          className="flex-1"
        >
          <SkeletonBase 
            className={`w-full bg-gradient-to-t from-blue-200 to-blue-100`}
            style={{ height: `${Math.random() * 80 + 20}%` }}
          />
        </motion.div>
      ))}
    </div>
    <div className="flex justify-between mt-4">
      {Array.from({ length: 7 }).map((_, i) => (
        <SkeletonBase key={i} className="h-3 w-8" />
      ))}
    </div>
  </motion.div>
)

// Profile Skeleton
export const ProfileSkeleton = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="bg-white rounded-xl p-6 shadow-sm border"
  >
    <div className="flex items-center space-x-4 mb-6">
      <SkeletonBase className="h-20 w-20 rounded-full" />
      <div>
        <SkeletonBase className="h-6 w-32 mb-2" />
        <SkeletonBase className="h-4 w-24 mb-1" />
        <SkeletonBase className="h-4 w-20" />
      </div>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <SkeletonBase className="h-5 w-24 mb-3" />
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex justify-between">
              <SkeletonBase className="h-4 w-20" />
              <SkeletonBase className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
      
      <div>
        <SkeletonBase className="h-5 w-28 mb-3" />
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex justify-between">
              <SkeletonBase className="h-4 w-24" />
              <SkeletonBase className="h-4 w-12" />
            </div>
          ))}
        </div>
      </div>
    </div>
  </motion.div>
)

// Table Skeleton
export const TableSkeleton = ({ rows = 5, columns = 4 }) => (
  <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
    {/* Header */}
    <div className="bg-gray-50 px-6 py-4 border-b">
      <div className="flex space-x-4">
        {Array.from({ length: columns }).map((_, i) => (
          <SkeletonBase key={i} className="h-4 w-24" />
        ))}
      </div>
    </div>
    
    {/* Rows */}
    <div className="divide-y">
      {Array.from({ length: rows }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.05 }}
          className="px-6 py-4"
        >
          <div className="flex space-x-4">
            {Array.from({ length: columns }).map((_, j) => (
              <SkeletonBase 
                key={j} 
                className={`h-4 ${j === 0 ? 'w-32' : j === columns - 1 ? 'w-16' : 'w-24'}`} 
              />
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  </div>
)

export default SkeletonBase