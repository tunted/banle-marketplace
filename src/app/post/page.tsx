'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { validatePhoneNumber, compressImage } from '@/lib/utils'
import { checkRateLimit, recordPostAttempt, getRemainingTimeMinutes } from '@/lib/rateLimit'

interface Province {
  code: string
  name: string
}

interface Ward {
  code: string
  name: string
  province_code: string
}

interface Category {
  id: string
  name: string
  slug: string
  sort_order: number | null
}

export default function PostPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    phone: '',
    location: '',
    description: '',
    category: '',
    province_code: '',
    ward_code: '',
  })
  const [images, setImages] = useState<File[]>([])
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([])
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [rateLimitError, setRateLimitError] = useState<string | null>(null)
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [provinces, setProvinces] = useState<Province[]>([])
  const [wards, setWards] = useState<Ward[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingProvinces, setLoadingProvinces] = useState(false)
  const [loadingWards, setLoadingWards] = useState(false)
  const [loadingCategories, setLoadingCategories] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load categories on mount
  useEffect(() => {
    async function loadCategories() {
      setLoadingCategories(true)
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('id, name, slug, sort_order')
          .order('sort_order', { nullsFirst: false })
          .order('name')

        if (error) {
          console.error('Error fetching categories:', error)
        } else {
          // Sort categories: first by sort_order (nulls last), then by name
          const sortedCategories = (data || []).sort((a, b) => {
            if (a.sort_order !== null && b.sort_order !== null) {
              return a.sort_order - b.sort_order
            }
            if (a.sort_order !== null) return -1
            if (b.sort_order !== null) return 1
            return a.name.localeCompare(b.name)
          })
          setCategories(sortedCategories)
        }
      } catch (err) {
        console.error('Error loading categories:', err)
      } finally {
        setLoadingCategories(false)
      }
    }
    loadCategories()
  }, [])

  // Load provinces on mount
  useEffect(() => {
    async function loadProvinces() {
      setLoadingProvinces(true)
      try {
        const { data, error } = await supabase
          .from('provinces')
          .select('code, name')
          .order('name')

        if (error) {
          console.error('Error fetching provinces:', error)
        } else {
          setProvinces(data || [])
        }
      } catch (err) {
        console.error('Error loading provinces:', err)
      } finally {
        setLoadingProvinces(false)
      }
    }
    loadProvinces()
  }, [])

  // Load wards when province is selected
  useEffect(() => {
    async function loadWards() {
      if (!formData.province_code) {
        setWards([])
        setFormData((prev) => ({ ...prev, ward_code: '' }))
        return
      }

      setLoadingWards(true)
      try {
        const { data, error } = await supabase
          .from('wards')
          .select('code, name, province_code')
          .eq('province_code', formData.province_code)
          .order('name')

        if (error) {
          console.error('Error fetching wards:', error)
          setWards([])
        } else {
          setWards(data || [])
          // Reset ward_code when province changes
          setFormData((prev) => ({ ...prev, ward_code: '' }))
        }
      } catch (err) {
        console.error('Error loading wards:', err)
        setWards([])
      } finally {
        setLoadingWards(false)
      }
    }
    loadWards()
  }, [formData.province_code])

  // Check rate limit on mount
  useEffect(() => {
    const rateLimit = checkRateLimit()
    if (!rateLimit.allowed && rateLimit.remainingTime) {
      const minutes = getRemainingTimeMinutes(rateLimit.remainingTime)
      setRateLimitError(
        `Bạn đã đăng quá nhiều tin trong 1 giờ. Vui lòng đợi ${minutes} phút nữa.`
      )
    }
  }, [])

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setFormErrors((prev) => ({ ...prev, [name]: '' }))
    
    // Validate phone number in real-time
    if (name === 'phone') {
      const trimmedValue = value.trim()
      if (trimmedValue && !validatePhoneNumber(trimmedValue)) {
        setPhoneError('Số điện thoại không hợp lệ. Ví dụ: 0912345678, 0987654321 hoặc +84912345678')
      } else {
        setPhoneError(null)
      }
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setUploadError(null)

    // Validate total count
    if (files.length + images.length > 5) {
      setUploadError('Bạn chỉ có thể tải lên tối đa 5 hình ảnh')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    // Validate each file
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp']
    const maxSize = 2 * 1024 * 1024 // 2MB

    const validFiles: File[] = []
    const errors: string[] = []

    files.forEach((file) => {
      const fileExtension = file.name.split('.').pop()?.toLowerCase()
      
      // Check file type
      if (!allowedTypes.includes(file.type) && !(fileExtension && allowedExtensions.includes(fileExtension))) {
        errors.push(`File "${file.name}" không hợp lệ. Chỉ chấp nhận JPG, PNG, hoặc WEBP.`)
        return
      }

      // Check file size
      if (file.size > maxSize) {
        errors.push(`File "${file.name}" quá lớn. Kích thước tối đa là 2MB.`)
        return
      }

      validFiles.push(file)
    })

    if (errors.length > 0) {
      setUploadError(errors.join(' '))
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    // Add valid files to existing images
    const newImages = [...images, ...validFiles]
    setImages(newImages)
    
    // Create preview URLs using Object URLs (safe for <img> tags)
    const newUrls = validFiles.map(file => URL.createObjectURL(file))
    setImagePreviewUrls([...imagePreviewUrls, ...newUrls])
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeImage = (index: number) => {
    // Revoke object URL to free memory
    URL.revokeObjectURL(imagePreviewUrls[index])
    
    const newImages = images.filter((_, i) => i !== index)
    const newUrls = imagePreviewUrls.filter((_, i) => i !== index)
    setImages(newImages)
    setImagePreviewUrls(newUrls)
    setUploadError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setRateLimitError(null)
    setUploadError(null)
    setFormErrors({})

    try {
      // Check rate limit
      const rateLimit = checkRateLimit()
      if (!rateLimit.allowed) {
        if (rateLimit.remainingTime) {
          const minutes = getRemainingTimeMinutes(rateLimit.remainingTime)
          setRateLimitError(
            `Bạn đã đăng quá nhiều tin trong 1 giờ. Vui lòng đợi ${minutes} phút nữa.`
          )
        } else {
          setRateLimitError('Bạn đã đăng quá nhiều tin trong 1 giờ. Vui lòng thử lại sau.')
        }
        setLoading(false)
        return
      }

      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        console.error('User error when posting:', userError)
        console.log('User:', user)
        alert('Bạn cần đăng nhập để đăng tin.')
        router.push('/login')
        setLoading(false)
        return
      }

      console.log('Creating post for user ID:', user.id, 'Email:', user.email)

      // Validate required fields
      const errors: Record<string, string> = {}
      if (!formData.title.trim()) {
        errors.title = 'Vui lòng nhập tiêu đề'
      }
      if (!formData.price || parseFloat(formData.price) <= 0) {
        errors.price = 'Vui lòng nhập giá hợp lệ'
      }
      if (!formData.phone || !formData.phone.trim()) {
        errors.phone = 'Vui lòng nhập số điện thoại'
      } else {
        const trimmedPhone = formData.phone.trim()
        if (!validatePhoneNumber(trimmedPhone)) {
          errors.phone = 'Số điện thoại không hợp lệ. Ví dụ: 0912345678, 0987654321 hoặc +84912345678'
        }
      }
      if (!formData.category || !formData.category.trim()) {
        errors.category = 'Vui lòng chọn danh mục'
      }
      if (!formData.location.trim()) {
        errors.location = 'Vui lòng nhập địa chỉ'
      }

      if (Object.keys(errors).length > 0) {
        setFormErrors(errors)
        setLoading(false)
        return
      }

      // Step 1: Create post first to get the post ID
      const postData = {
        user_id: user.id,
        title: formData.title.trim(),
        price: parseFloat(formData.price),
        phone: formData.phone.trim(),
        location: formData.location.trim(),
        description: formData.description.trim() || null,
        category: formData.category.trim(),
        image_url: null, // Will be updated after image upload
        province_code: formData.province_code || null,
        ward_code: formData.ward_code || null,
      }

      console.log('Creating post first to get ID...')

      const { data: insertedPost, error: insertError } = await supabase
        .from('posts')
        .insert(postData)
        .select()
        .single()

      if (insertError) {
        console.error('Insert error:', insertError)
        alert(`Lỗi khi tạo tin đăng: ${insertError.message}`)
        setLoading(false)
        return
      }

      if (!insertedPost || !insertedPost.id) {
        alert('Không thể tạo tin đăng. Vui lòng thử lại.')
        setLoading(false)
        return
      }

      const postId = insertedPost.id
      console.log('Post created with ID:', postId)

      // Step 2: Upload images to post ID subfolder
      const imageUrls: string[] = []

      console.log('========================================')
      console.log('[UPLOAD] Starting image upload process')
      console.log('  Post ID:', postId)
      console.log('  Number of images:', images.length)
      console.log('  Image files:', images.map((img, idx) => `${idx + 1}. ${img.name} (${(img.size / 1024).toFixed(2)}KB)`))

      if (images.length > 0) {
        try {
          for (let i = 0; i < images.length; i++) {
            const originalFile = images[i]
            
            // Compress image before upload if needed
            let fileToUpload: Blob | File = originalFile
            
            try {
              // Only compress if file is larger than 500KB
              if (originalFile.size > 500 * 1024) {
                const compressedBlob = await compressImage(originalFile, 1920, 1920, 0.85)
                fileToUpload = new File([compressedBlob], originalFile.name, {
                  type: originalFile.type,
                  lastModified: originalFile.lastModified,
                })
              }
            } catch (compressError) {
              console.warn('Image compression failed, uploading original:', compressError)
              // Fallback to original file if compression fails
            }

            // Generate unique filename: ${Date.now()}-${index}-${file.name}
            const fileName = `${Date.now()}-${i}-${originalFile.name}`
            // Upload to subfolder: {postId}/filename.jpg
            const filePath = `${postId}/${fileName}`

            console.log(`[UPLOAD ${i + 1}] Uploading file...`)
            console.log(`  Original file: ${originalFile.name} (${(originalFile.size / 1024).toFixed(2)}KB)`)
            console.log(`  File to upload: ${fileToUpload instanceof File ? fileToUpload.name : 'Blob'} (${(fileToUpload.size / 1024).toFixed(2)}KB)`)
            console.log(`  Upload path: ${filePath}`)
            console.log(`  Content type: ${originalFile.type}`)
            
            const { error: uploadError, data } = await supabase.storage
              .from('posts')
              .upload(filePath, fileToUpload, {
                cacheControl: '3600',
                contentType: originalFile.type,
                upsert: false,
              })
            
            console.log(`[UPLOAD ${i + 1}] Upload response:`, { error: uploadError, data })

            if (uploadError) {
              console.error('Upload error:', uploadError)
              
              // Handle specific errors
              // Check if statusCode exists (some error types may have it)
              const statusCode = (uploadError as any).statusCode as number | undefined
              const errorMsg = uploadError.message?.toLowerCase() || ''
              
              if (statusCode === 404 || errorMsg.includes('not found') || errorMsg.includes('bucket')) {
                setUploadError('Bucket "posts" chưa được tạo. Vui lòng tạo bucket trong Supabase Dashboard (Storage > New bucket > name: "posts" > Public bucket) rồi chạy lại SQL script create-posts-bucket.sql')
              } else if (statusCode === 403 || statusCode === 400 || errorMsg.includes('permission') || errorMsg.includes('forbidden') || errorMsg.includes('policy')) {
                setUploadError('Không có quyền tải ảnh lên. Vui lòng kiểm tra RLS policies của bucket "posts" trong Supabase.')
              } else if (errorMsg.includes('network') || errorMsg.includes('timeout') || errorMsg.includes('failed to fetch')) {
                setUploadError('Không thể tải ảnh lên. Vui lòng kiểm tra kết nối.')
              } else {
                setUploadError(`Không thể tải ảnh lên: ${uploadError.message || 'Lỗi không xác định'}. Vui lòng thử lại.`)
              }
              
              // Clean up: Delete the post if image upload fails
              await supabase.from('posts').delete().eq('id', postId)
              setLoading(false)
              return
            }

            if (!data) {
              setUploadError('Không thể tải ảnh lên. Vui lòng thử lại.')
              // Clean up: Delete the post if image upload fails
              await supabase.from('posts').delete().eq('id', postId)
              setLoading(false)
              return
            }

            // Store the full path for database: posts/{postId}/filename.jpg
            // This is the complete object path in the storage bucket
            const fullPath = `posts/${filePath}` // filePath is {postId}/filename.jpg, so fullPath is posts/{postId}/filename.jpg
            
            if (!fullPath || !fullPath.startsWith(`posts/${postId}/`)) {
              console.error(`[Upload ${i + 1}] ERROR: Invalid path format!`)
              throw new Error(`Invalid upload path format: ${fullPath}`)
            }
            
            // Store the full path (posts/{postId}/filename.jpg) for database
            imageUrls.push(fullPath)
            console.log(`[UPLOAD ${i + 1}] ✅ Upload successful!`)
            console.log(`  Full path stored: ${fullPath}`)
          }
          
          console.log(`[UPLOAD] All ${imageUrls.length} image(s) uploaded successfully`)
          console.log(`  Image URLs:`, imageUrls)

          // Step 3: Update post with storage path
          // Store the full storage path within the bucket: "{postId}/filename.jpg"
          if (imageUrls.length > 0) {
            const fullPath = imageUrls[0] // Format: "posts/{postId}/filename.jpg"
            // Remove "posts/" prefix to get storage path within bucket
            // fullPath = "posts/{postId}/filename.jpg" -> "{postId}/filename.jpg"
            const pathToStore = fullPath.startsWith('posts/') 
              ? fullPath.substring(6) // Remove "posts/" prefix
              : fullPath // Already without prefix
            
            console.log('[UPLOAD] Storing full storage path')
            console.log('  Full path:', fullPath)
            console.log('  Storage path to store:', pathToStore)
            
            console.log('[UPLOAD] ========================================')
            console.log('[UPLOAD] Updating post with image path')
            console.log('  Post ID:', postId)
            console.log('  Path to store:', pathToStore)
            console.log('  Path type:', typeof pathToStore)
            console.log('  Path length:', pathToStore?.length)
            
            // Verify post exists before updating
            const { data: verifyPost, error: verifyPostError } = await supabase
              .from('posts')
              .select('id, image_url')
              .eq('id', postId)
              .single()
            
            console.log('[UPLOAD] Post verification:', { verifyPost, verifyPostError })
            
            if (verifyPostError) {
              console.error('[UPLOAD] ❌ Cannot verify post exists:', verifyPostError)
            }
            
            // Update the post with image_url
            // NOTE: RLS policy already ensures users can only update their own posts
            console.log('[UPLOAD] Attempting to update post with image_url...')
            console.log('  User ID:', user.id)
            console.log('  Post ID:', postId)
            console.log('  Path to store:', pathToStore)
            
            // First, verify the post belongs to the user (for debugging)
            const { data: verifyOwnership } = await supabase
              .from('posts')
              .select('id, user_id')
              .eq('id', postId)
              .eq('user_id', user.id)
              .single()
            
            console.log('[UPLOAD] Ownership verification:', verifyOwnership)
            
            if (!verifyOwnership) {
              console.error('[UPLOAD] ❌ Post does not belong to user or post not found!')
              setUploadError('Không thể xác minh quyền sở hữu của tin đăng. Vui lòng thử lại.')
              // Continue anyway - let RLS handle it
            }
            
            // Update the post with image_url
            // Strategy: Do UPDATE without SELECT first (to avoid RLS SELECT issues)
            // Then verify separately with a SELECT query
            console.log('[UPLOAD] Step 1: Updating post with image_url (no SELECT to avoid RLS issues)...')
            console.log('  Post ID:', postId)
            console.log('  Setting image_url to:', pathToStore)
            console.log('  User ID:', user.id)
            
            // First attempt: UPDATE without SELECT, let RLS handle authorization
            // Don't use .eq('user_id', user.id) - let RLS policy check it
            console.log('[UPLOAD] Attempting UPDATE (RLS will verify ownership)...')
            const { error: updateError, data: updateResult, count: updateCount } = await supabase
              .from('posts')
              .update({ image_url: pathToStore })
              .eq('id', postId)
              // Note: We don't filter by user_id here - RLS policy will handle it

            console.log('[UPLOAD] Update response (no select):', { 
              error: updateError,
              data: updateResult,
              count: updateCount,
              hasError: !!updateError,
              hasData: !!updateResult
            })
            
            if (updateError) {
              console.error('[UPLOAD] ❌ Update failed:', updateError)
              console.error('  Error code:', updateError.code)
              console.error('  Error message:', updateError.message)
              console.error('  Error details:', updateError.details)
              console.error('  Error hint:', updateError.hint)
              
              // Check if it's an RLS error
              if (updateError.code === '42501' || updateError.code === 'PGRST301' || updateError.message?.includes('permission') || updateError.message?.includes('policy') || updateError.message?.includes('RLS')) {
                console.error('[UPLOAD] ❌ RLS policy is blocking the UPDATE!')
                console.error('  This means the RLS policy "Users can update their own posts" is not working correctly.')
                console.error('  Please run the SQL script: fix-rls-update-policy.sql')
                console.error('  Or manually add WITH CHECK clause to the UPDATE policy')
                setUploadError('RLS policy đang chặn cập nhật. Vui lòng chạy SQL script fix-rls-update-policy.sql trong Supabase Dashboard.')
              } else {
                setUploadError(`Không thể cập nhật ảnh vào database: ${updateError.message || 'Lỗi không xác định. Vui lòng kiểm tra RLS policies.'}`)
              }
              setLoading(false)
              return
            }
            
            // Check if update actually affected any rows
            if (updateCount !== undefined && updateCount === 0) {
              console.error('[UPLOAD] ❌ UPDATE affected 0 rows!')
              console.error('  This means either:')
              console.error('    1. Post does not exist')
              console.error('    2. RLS policy blocked the update (no error but no rows updated)')
              console.error('    3. Post does not belong to current user')
              
              // Verify post exists and belongs to user
              const { data: checkPost, error: checkError } = await supabase
                .from('posts')
                .select('id, user_id, image_url')
                .eq('id', postId)
                .single()
              
              if (checkError || !checkPost) {
                console.error('[UPLOAD] ❌ Cannot verify post exists:', checkError)
                setUploadError('Không thể tìm thấy tin đăng. Vui lòng thử lại.')
              } else if (checkPost.user_id !== user.id) {
                console.error('[UPLOAD] ❌ Post does not belong to user!')
                console.error('  Post user_id:', checkPost.user_id)
                console.error('  Current user_id:', user.id)
                setUploadError('Bạn không có quyền cập nhật tin đăng này.')
              } else {
                console.error('[UPLOAD] ❌ Post exists and belongs to user, but UPDATE affected 0 rows')
                console.error('  This suggests RLS is silently blocking the UPDATE')
                setUploadError('RLS policy đang chặn cập nhật. Vui lòng chạy SQL script fix-rls-update-policy.sql.')
              }
              setLoading(false)
              return
            }
            
            // Wait a brief moment for the update to commit
            await new Promise(resolve => setTimeout(resolve, 200))
            
            // Step 2: Verify the update worked by fetching the post
            console.log('[UPLOAD] Step 2: Verifying update by fetching post...')
            const { data: verifyData, error: verifyFetchError } = await supabase
              .from('posts')
              .select('id, image_url, user_id')
              .eq('id', postId)
              .single()
            
            console.log('[UPLOAD] Verification fetch:', { 
              data: verifyData, 
              error: verifyFetchError,
              image_url: verifyData?.image_url
            })
            
            if (verifyFetchError) {
              console.error('[UPLOAD] ❌ Cannot verify update - fetch failed:', verifyFetchError)
              console.error('  This might mean RLS is blocking SELECT, but UPDATE might have worked')
              
              // Try one more verification with a count query
              const { count: postCount } = await supabase
                .from('posts')
                .select('*', { count: 'exact', head: true })
                .eq('id', postId)
                .eq('user_id', user.id)
              
              console.log('[UPLOAD] Post count check:', { count: postCount })
              
              if (postCount === 1) {
                console.log('[UPLOAD] ⚠️ Post exists but cannot verify image_url due to RLS SELECT blocking')
                console.log('[UPLOAD] ⚠️ UPDATE likely succeeded but SELECT is blocked by RLS')
                // Continue - the update probably worked, we just can't verify due to RLS
              } else {
                setUploadError('Không thể xác minh cập nhật. Vui lòng kiểm tra RLS policies hoặc thử lại.')
                setLoading(false)
                return
              }
            } else if (verifyData) {
              // Successfully fetched - check if image_url was saved
              if (verifyData.image_url === pathToStore) {
                console.log('[UPLOAD] ✅ Update verified! image_url was saved correctly.')
                console.log('  Stored value:', verifyData.image_url)
              } else if (!verifyData.image_url || verifyData.image_url === null) {
                console.error('[UPLOAD] ❌ CRITICAL: Update did NOT work - image_url is still NULL!')
                console.error('  Post ID:', postId)
                console.error('  Expected:', pathToStore)
                console.error('  Got (after update):', verifyData.image_url)
                console.error('  Post user_id:', verifyData.user_id)
                console.error('  Current user_id:', user.id)
                console.error('  User IDs match?', verifyData.user_id === user.id)
                
                // This is critical - UPDATE appeared to succeed but image_url is still null
                // This usually means RLS is silently blocking the UPDATE
                console.error('[UPLOAD] ❌ DIAGNOSIS: UPDATE query returned no error but did not actually update')
                console.error('  This is typically caused by RLS policy blocking UPDATE without WITH CHECK clause')
                console.error('  SOLUTION: Run fix-rls-update-policy.sql in Supabase SQL Editor')
                
                setUploadError('RLS policy đang chặn cập nhật. Vui lòng chạy SQL script "fix-rls-update-policy.sql" trong Supabase Dashboard > SQL Editor. Xem file fix-rls-update-policy.sql trong project.')
                setLoading(false)
                return
              } else {
                console.warn('[UPLOAD] ⚠️ image_url mismatch (but may be acceptable):')
                console.warn('  Expected:', pathToStore)
                console.warn('  Got:', verifyData.image_url)
                console.warn('  This might be a legacy format - continuing anyway')
                // Continue - might be a different format but still valid
              }
            } else {
              console.error('[UPLOAD] ❌ Verification returned no data!')
              console.error('  This might mean RLS is blocking SELECT queries')
              setUploadError('Không thể xác minh cập nhật. RLS có thể đang chặn SELECT. Vui lòng kiểm tra RLS policies.')
              setLoading(false)
              return
            }
            
            console.log('[UPLOAD] ✅ Update process completed successfully!')
            
            console.log('[UPLOAD] ========================================')
          } else {
            console.warn('[UPLOAD] ⚠️ No image URLs were generated - imageUrls array is empty')
            console.warn('  This means no images were uploaded or the upload failed silently')
            console.warn('  images.length:', images.length)
            console.warn('  imageUrls:', imageUrls)
          }
          
          // Final verification: Fetch the post one more time to confirm image_url was saved
          // This is critical - if image_url is not saved, the post is incomplete
          console.log('[UPLOAD] Performing final verification...')
          const { data: finalPost, error: finalError } = await supabase
            .from('posts')
            .select('id, image_url, user_id, title')
            .eq('id', postId)
            .single()
          
          console.log('[UPLOAD] Final verification result:', { 
            post: finalPost, 
            error: finalError,
            image_url: finalPost?.image_url 
          })
          
          // If images were uploaded, image_url MUST not be null
          if (imageUrls.length > 0) {
            // Expected storage path: "{postId}/filename.jpg" (without "posts/" prefix)
            const fullPath = imageUrls[0] // Format: "posts/{postId}/filename.jpg"
            const expectedPath = fullPath.startsWith('posts/') 
              ? fullPath.substring(6) // Remove "posts/" prefix
              : fullPath // Already without prefix
            
            if (!finalPost || !finalPost.image_url) {
              console.error('[UPLOAD] ❌ CRITICAL: Post exists but image_url is NULL!')
              console.error('  Expected image_url (storage path):', expectedPath)
              console.error('  Actual image_url:', finalPost?.image_url)
              console.error('  Final error:', finalError)
              
              // This is a critical error - post exists but image_url is not saved
              // We should NOT continue - the post is incomplete
              setUploadError('Ảnh đã tải lên nhưng không thể lưu đường dẫn vào database. Tin đăng không hoàn chỉnh. Vui lòng thử lại.')
              setLoading(false)
              return // Exit early - don't show success message
            } else if (finalPost.image_url !== expectedPath) {
              console.warn('[UPLOAD] ⚠️ Storage path mismatch (but may be acceptable):')
              console.warn('  Expected:', expectedPath)
              console.warn('  Got:', finalPost.image_url)
              console.warn('  This might be a legacy format - continuing anyway')
            } else {
              console.log('[UPLOAD] ✅ Final verification passed - image_url matches expected storage path')
            }
          }
        } catch (uploadException: any) {
          console.error('[UPLOAD] Exception during upload:', uploadException)
          console.error('  Error message:', uploadException?.message)
          console.error('  Error stack:', uploadException?.stack)
          setUploadError(`Không thể tải ảnh lên: ${uploadException?.message || 'Lỗi không xác định'}`)
          // Clean up: Delete the post if image upload fails
          await supabase.from('posts').delete().eq('id', postId)
          setLoading(false)
          return
        }
      } else {
        console.log('[UPLOAD] No images to upload - images array is empty')
      }
      
      console.log('[UPLOAD] Upload process completed')
      console.log('  Total image URLs:', imageUrls.length)
      console.log('  Final image_url in DB:', imageUrls[0] || 'None')
      console.log('========================================')

      console.log('Post created successfully:', insertedPost)
      console.log('Post ID:', postId)
      console.log('Post user_id:', insertedPost?.user_id)
      console.log('Current user ID:', user.id)
      console.log('Image URL:', imageUrls.length > 0 ? imageUrls[0] : null)

      // Record successful post for rate limiting
      recordPostAttempt()

      // Clean up preview URLs
      imagePreviewUrls.forEach(url => URL.revokeObjectURL(url))

      alert('Đăng tin thành công!')
      router.push('/')
    } catch (error) {
      console.error('Error:', error)
      alert('Đã xảy ra lỗi. Vui lòng thử lại.')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link
        href="/"
        className="text-green-500 hover:text-green-600 mb-4 inline-flex items-center gap-2"
      >
        <span>←</span>
        <span>Quay lại</span>
      </Link>

      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Đăng tin mới</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {rateLimitError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-sm text-red-800">{rateLimitError}</p>
            </div>
          )}
          
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Tiêu đề <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              required
              value={formData.title}
              onChange={handleInputChange}
              className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                formErrors.title ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Nhập tiêu đề tin đăng"
            />
            {formErrors.title && (
              <p className="mt-1 text-sm text-red-600">{formErrors.title}</p>
            )}
          </div>

          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
              Giá (VND) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="price"
              name="price"
              required
              min="0"
              step="1000"
              value={formData.price}
              onChange={handleInputChange}
              className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                formErrors.price ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Nhập giá"
            />
            {formErrors.price && (
              <p className="mt-1 text-sm text-red-600">{formErrors.price}</p>
            )}
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              Danh mục <span className="text-red-500">*</span>
            </label>
            <select
              id="category"
              name="category"
              required
              value={formData.category}
              onChange={handleInputChange}
              disabled={loadingCategories}
              className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white ${
                formErrors.category ? 'border-red-300' : 'border-gray-300'
              } ${loadingCategories ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <option value="">
                {loadingCategories ? 'Đang tải danh mục...' : 'Chọn danh mục'}
              </option>
              {categories.map((category) => (
                <option key={category.id} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </select>
            {formErrors.category && (
              <p className="mt-1 text-sm text-red-600">{formErrors.category}</p>
            )}
            {!formErrors.category && formData.category && (
              <p className="mt-1 text-sm text-green-600">✓ Đã chọn danh mục</p>
            )}
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              Số điện thoại <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              required
              value={formData.phone}
              onChange={handleInputChange}
              className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                formErrors.phone || phoneError ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Nhập số điện thoại (VD: 0912345678)"
            />
            {phoneError && (
              <p className="mt-1 text-sm text-red-600">{phoneError}</p>
            )}
            {formErrors.phone && !phoneError && (
              <p className="mt-1 text-sm text-red-600">{formErrors.phone}</p>
            )}
            {!phoneError && !formErrors.phone && formData.phone && (
              <p className="mt-1 text-sm text-green-600">✓ Số điện thoại hợp lệ</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Khu vực
            </label>
            <div className="space-y-3">
              <div>
                <label htmlFor="province" className="block text-xs text-gray-500 mb-1">
                  Tỉnh/Thành phố
                </label>
                <select
                  id="province"
                  name="province_code"
                  value={formData.province_code}
                  onChange={handleInputChange}
                  disabled={loadingProvinces}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                >
                  <option value="">
                    {loadingProvinces ? 'Đang tải...' : 'Chọn tỉnh/thành phố'}
                  </option>
                  {provinces.map((province) => (
                    <option key={province.code} value={province.code}>
                      {province.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="ward" className="block text-xs text-gray-500 mb-1">
                  Quận/Huyện/Xã
                </label>
                <select
                  id="ward"
                  name="ward_code"
                  value={formData.ward_code}
                  onChange={handleInputChange}
                  disabled={!formData.province_code || loadingWards}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white disabled:bg-gray-50"
                >
                  <option value="">
                    {!formData.province_code
                      ? 'Chọn tỉnh/thành phố trước'
                      : loadingWards
                      ? 'Đang tải...'
                      : 'Chọn quận/huyện/xã'}
                  </option>
                  {wards.map((ward) => (
                    <option key={ward.code} value={ward.code}>
                      {ward.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
              Địa chỉ chi tiết <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="location"
              name="location"
              required
              value={formData.location}
              onChange={handleInputChange}
              className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                formErrors.location ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Nhập địa chỉ chi tiết (số nhà, tên đường...)"
            />
            {formErrors.location && (
              <p className="mt-1 text-sm text-red-600">{formErrors.location}</p>
            )}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Mô tả
            </label>
            <textarea
              id="description"
              name="description"
              rows={6}
              value={formData.description}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              placeholder="Nhập mô tả chi tiết"
            />
          </div>

          <div>
            <label htmlFor="images" className="block text-sm font-medium text-gray-700 mb-2">
              Hình ảnh (Tối đa 5 ảnh, mỗi ảnh tối đa 2MB)
            </label>
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                id="images"
                name="images"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                multiple
                onChange={handleImageChange}
                disabled={loading || images.length >= 5}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading || images.length >= 5}
                className={`px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors ${
                  loading || images.length >= 5 ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {images.length >= 5 ? 'Đã đạt giới hạn' : 'Chọn ảnh'}
              </button>
              
              {uploadError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-600">{uploadError}</p>
                </div>
              )}
              
              {imagePreviewUrls.length > 0 && (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {imagePreviewUrls.map((url, index) => (
                    <div
                      key={index}
                      className="relative w-20 h-20 rounded-lg overflow-hidden border-2 border-gray-300 bg-gray-100 flex-shrink-0"
                    >
                      {/* Use <img> instead of next/image for previews */}
                      {url && url.startsWith('blob:') ? (
                        <img
                          src={url}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback if image fails to load
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                          }}
                        />
                      ) : null}
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        disabled={loading}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold hover:bg-red-600 transition-colors disabled:opacity-50 shadow-md"
                        aria-label="Xóa ảnh"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {images.length === 0 && !loading && (
                <p className="text-sm text-gray-500">
                  Chọn tối đa 5 ảnh (JPG, PNG, WEBP - mỗi ảnh tối đa 2MB)
                </p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md transition-shadow"
          >
            {loading ? 'Đang đăng tin...' : 'Đăng tin miễn phí'}
          </button>
        </form>
      </div>
    </div>
  )
}
