/**
 * Image optimization utilities for AgriSphere
 * Handles WebP conversion, compression, and responsive images
 */

class ImageOptimizer {
  constructor() {
    this.maxWidth = 1920
    this.maxHeight = 1080
    this.quality = 0.85
    this.webpQuality = 0.8
    this.thumbnailSize = 300
    this.thumbnailQuality = 0.7
  }

  /**
   * Convert image to WebP format with fallback
   */
  async convertToWebP(file, options = {}) {
    const { quality = this.webpQuality, maxWidth = this.maxWidth, maxHeight = this.maxHeight } = options

    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      img.onload = () => {
        // Calculate new dimensions
        const { width, height } = this.calculateDimensions(img.width, img.height, maxWidth, maxHeight)
        
        canvas.width = width
        canvas.height = height

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height)

        // Try WebP first
        canvas.toBlob((webpBlob) => {
          if (webpBlob) {
            resolve({
              webp: webpBlob,
              original: file,
              width,
              height,
              compressionRatio: webpBlob.size / file.size
            })
          } else {
            // Fallback to JPEG
            canvas.toBlob((jpegBlob) => {
              resolve({
                webp: null,
                original: jpegBlob || file,
                width,
                height,
                compressionRatio: jpegBlob ? jpegBlob.size / file.size : 1
              })
            }, 'image/jpeg', quality)
          }
        }, 'image/webp', quality)
      }

      img.onerror = () => {
        resolve({
          webp: null,
          original: file,
          width: 0,
          height: 0,
          compressionRatio: 1
        })
      }

      img.src = URL.createObjectURL(file)
    })
  }

  /**
   * Generate multiple sizes for responsive images
   */
  async generateResponsiveSizes(file, sizes = [480, 768, 1024, 1920]) {
    const results = {}

    for (const size of sizes) {
      try {
        const optimized = await this.convertToWebP(file, {
          maxWidth: size,
          maxHeight: size
        })
        results[`${size}w`] = optimized
      } catch (error) {
        console.warn(`Failed to generate ${size}w size:`, error)
      }
    }

    return results
  }

  /**
   * Generate thumbnail
   */
  async generateThumbnail(file, size = this.thumbnailSize) {
    return this.convertToWebP(file, {
      maxWidth: size,
      maxHeight: size,
      quality: this.thumbnailQuality
    })
  }

  /**
   * Compress image for upload
   */
  async compressForUpload(file, maxSizeMB = 5) {
    const maxBytes = maxSizeMB * 1024 * 1024
    
    if (file.size <= maxBytes) {
      return file
    }

    // Start with lower quality and gradually reduce until under size limit
    let quality = 0.9
    let compressed = file

    while (compressed.size > maxBytes && quality > 0.1) {
      const result = await this.convertToWebP(file, { quality })
      compressed = result.webp || result.original
      quality -= 0.1
    }

    return compressed
  }

  /**
   * Create progressive loading placeholder
   */
  async createBlurPlaceholder(file, size = 40) {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      img.onload = () => {
        canvas.width = size
        canvas.height = size

        // Apply blur effect
        ctx.filter = 'blur(2px)'
        ctx.drawImage(img, 0, 0, size, size)

        canvas.toBlob((blob) => {
          resolve(blob)
        }, 'image/jpeg', 0.5)
      }

      img.onerror = () => resolve(null)
      img.src = URL.createObjectURL(file)
    })
  }

  /**
   * Batch process images with progress callback
   */
  async batchProcess(files, options = {}, onProgress = null) {
    const results = []
    const total = files.length

    for (let i = 0; i < files.length; i++) {
      try {
        const file = files[i]
        
        // Generate all optimized versions
        const [optimized, thumbnail, placeholder] = await Promise.all([
          this.convertToWebP(file, options),
          this.generateThumbnail(file),
          this.createBlurPlaceholder(file)
        ])

        results.push({
          original: file,
          optimized,
          thumbnail,
          placeholder,
          index: i
        })

        // Report progress
        if (onProgress) {
          onProgress({
            completed: i + 1,
            total,
            progress: ((i + 1) / total) * 100,
            currentFile: file.name
          })
        }
      } catch (error) {
        console.error('Failed to process image:', files[i].name, error)
        results.push({
          original: files[i],
          error: error.message,
          index: i
        })
      }
    }

    return results
  }

  /**
   * Calculate optimized dimensions while maintaining aspect ratio
   */
  calculateDimensions(originalWidth, originalHeight, maxWidth, maxHeight) {
    let width = originalWidth
    let height = originalHeight

    // Calculate scaling factor
    const widthRatio = maxWidth / originalWidth
    const heightRatio = maxHeight / originalHeight
    const scalingFactor = Math.min(widthRatio, heightRatio, 1) // Don't upscale

    width = Math.floor(originalWidth * scalingFactor)
    height = Math.floor(originalHeight * scalingFactor)

    return { width, height, scalingFactor }
  }

  /**
   * Get file size in human-readable format
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  /**
   * Validate image file
   */
  validateImage(file) {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    const maxSize = 50 * 1024 * 1024 // 50MB
    
    const errors = []

    if (!validTypes.includes(file.type)) {
      errors.push(`Invalid file type: ${file.type}. Supported types: ${validTypes.join(', ')}`)
    }

    if (file.size > maxSize) {
      errors.push(`File too large: ${this.formatFileSize(file.size)}. Maximum size: ${this.formatFileSize(maxSize)}`)
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Get image dimensions without loading full file
   */
  async getImageDimensions(file) {
    return new Promise((resolve, reject) => {
      const img = new Image()
      
      img.onload = () => {
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight,
          aspectRatio: img.naturalWidth / img.naturalHeight
        })
        URL.revokeObjectURL(img.src)
      }
      
      img.onerror = () => {
        reject(new Error('Failed to load image'))
        URL.revokeObjectURL(img.src)
      }
      
      img.src = URL.createObjectURL(file)
    })
  }

  /**
   * Create image preview URL with automatic cleanup
   */
  createPreviewUrl(file, cleanup = true) {
    const url = URL.createObjectURL(file)
    
    if (cleanup) {
      // Automatically cleanup after 10 seconds
      setTimeout(() => {
        URL.revokeObjectURL(url)
      }, 10000)
    }
    
    return url
  }

  /**
   * Convert canvas to various formats
   */
  canvasToBlob(canvas, format = 'webp', quality = 0.8) {
    return new Promise((resolve) => {
      canvas.toBlob(resolve, `image/${format}`, quality)
    })
  }

  /**
   * Apply image filters for enhancement
   */
  async applyFilters(file, filters = {}) {
    const {
      brightness = 1,
      contrast = 1,
      saturation = 1,
      blur = 0,
      sharpen = false
    } = filters

    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      img.onload = () => {
        canvas.width = img.width
        canvas.height = img.height

        // Apply filters
        ctx.filter = `brightness(${brightness}) contrast(${contrast}) saturate(${saturation}) blur(${blur}px)`
        ctx.drawImage(img, 0, 0)

        // Apply sharpening if requested
        if (sharpen) {
          this.applySharpenFilter(ctx, canvas.width, canvas.height)
        }

        canvas.toBlob(resolve, 'image/webp', 0.9)
      }

      img.src = URL.createObjectURL(file)
    })
  }

  /**
   * Apply unsharp mask for sharpening
   */
  applySharpenFilter(ctx, width, height) {
    const imageData = ctx.getImageData(0, 0, width, height)
    const data = imageData.data

    // Simple unsharp mask implementation
    for (let i = 0; i < data.length; i += 4) {
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3
      const factor = 1.2
      
      data[i] = Math.min(255, data[i] * factor)     // Red
      data[i + 1] = Math.min(255, data[i + 1] * factor) // Green
      data[i + 2] = Math.min(255, data[i + 2] * factor) // Blue
    }

    ctx.putImageData(imageData, 0, 0)
  }
}

// Create singleton instance
const imageOptimizer = new ImageOptimizer()

export default imageOptimizer