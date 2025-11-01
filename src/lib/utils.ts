/**
 * Format number as Vietnamese currency (e.g., 12500000 -> "12.500.000 đ")
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' đ'
}

export function getTimeAgo(dateString: string): string {
  const now = new Date()
  const date = new Date(dateString)
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return 'Vừa xong'
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes} phút trước`
  }

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours} giờ trước`
  }

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) {
    return `${diffInDays} ngày trước`
  }

  const diffInWeeks = Math.floor(diffInDays / 7)
  if (diffInWeeks < 4) {
    return `${diffInWeeks} tuần trước`
  }

  const diffInMonths = Math.floor(diffInDays / 30)
  return `${diffInMonths} tháng trước`
}

/**
 * Check if listing is less than 24 hours old
 */
export function isNewListing(dateString: string): boolean {
  const now = new Date()
  const date = new Date(dateString)
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
  return diffInHours < 24 && diffInHours >= 0
}

/**
 * Validate Vietnamese phone number format
 * Accepts: 10 digits starting with 0, or 11 digits starting with +84 or 84
 */
export function validatePhoneNumber(phone: string): boolean {
  // Remove all whitespace, dashes, and plus signs
  const cleaned = phone.replace(/\s+/g, '').replace(/[-\+]/g, '')
  
  // Vietnamese phone patterns:
  // - 10 digits starting with 0 followed by 3, 5, 7, 8, or 9 (e.g., 0912345678)
  // - 11 digits starting with 84 followed by 3, 5, 7, 8, or 9 (e.g., 84912345678)
  // Valid prefixes: 03, 05, 07, 08, 09 (mobile), 84 + same prefixes
  const phoneRegex = /^(0[35789]\d{8})$|^(84[35789]\d{8})$/
  
  return phoneRegex.test(cleaned)
}

/**
 * Compress image file (browser-based, reduces file size)
 * Returns a Promise that resolves to a compressed Blob
 */
export async function compressImage(
  file: File,
  maxWidth: number = 1920,
  maxHeight: number = 1920,
  quality: number = 0.85
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      const img = new window.Image()
      
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height
        
        // Calculate new dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width)
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height)
            height = maxHeight
          }
        }
        
        canvas.width = width
        canvas.height = height
        
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Could not get canvas context'))
          return
        }
        
        ctx.drawImage(img, 0, 0, width, height)
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('Compression failed'))
            }
          },
          file.type,
          quality
        )
      }
      
      img.onerror = () => reject(new Error('Image load error'))
      
      if (e.target?.result) {
        img.src = e.target.result as string
      }
    }
    
    reader.onerror = () => reject(new Error('File read error'))
    reader.readAsDataURL(file)
  })
}

