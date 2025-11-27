import { supabase } from './supabase'
import { logger } from './logger'
import * as FileSystem from 'expo-file-system/legacy'
import { compressImage } from './image-compression'

export interface Profile {
  id: string
  user_id: string
  role: 'super_admin' | 'admin' | 'student'
  email: string | null
  name?: string | null
  branchId: string | null
  phone?: string | null
  address?: string | null
  qualifications?: string | null
  experience?: string | null
  specialization?: string | null
  profileImageUrl?: string | null
  createdAt: string
  updatedAt: string
}

/**
 * Get user profile by user_id
 * This is the ONLY way to get role - no more user_metadata
 */
export async function getProfileByUserId(
  userId: string
): Promise<{ profile: Profile | null; error: null } | { profile: null; error: Error }> {
  try {
    logger.debug('getProfileByUserId: Searching for user_id', { userId })
    
    const { data, error } = await supabase
      .from('profiles')
      .select('id, user_id, role, email, branch_id, createdAt, updatedAt')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      logger.error('getProfileByUserId: Error fetching profile', error as Error)
      return { profile: null, error: new Error(error.message) }
    }

    if (!data) {
      logger.debug('getProfileByUserId: No profile found')
      return { profile: null, error: null }
    }

    logger.debug('getProfileByUserId: Profile found', {
      user_id: data.user_id,
      role: data.role,
      email: data.email,
    })

    return { 
      profile: {
        id: data.id,
        user_id: data.user_id,
        role: data.role as 'super_admin' | 'admin' | 'student',
        email: data.email,
        branchId: data.branch_id || null,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      }, 
      error: null 
    }
  } catch (error) {
    logger.error('Unexpected error fetching profile', error as Error)
    return {
      profile: null,
      error: error instanceof Error ? error : new Error('Failed to fetch profile'),
    }
  }
}

export interface AdminProfileUpdate {
  name?: string | null
  phone?: string | null
  address?: string | null
  qualifications?: string | null
  experience?: string | null
  specialization?: string | null
  profileImageUrl?: string | null
}

/**
 * Get full admin profile with all details including image
 */
export async function getAdminProfileByUserId(
  userId: string
): Promise<{ 
  profile: (Profile & { 
    name?: string | null
    phone?: string | null
    address?: string | null
    qualifications?: string | null
    experience?: string | null
    specialization?: string | null
    profileImageUrl?: string | null
  }) | null
  error: null 
} | { 
  profile: null
  error: Error 
}> {
  try {
    logger.debug('getAdminProfileByUserId: Fetching admin profile', { userId })

    const { data, error } = await supabase
      .from('profiles')
      .select('id, user_id, role, email, name, branch_id, phone, address, qualifications, experience, specialization, profile_image_url, createdAt, updatedAt')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      logger.error('getAdminProfileByUserId: Error fetching profile', error as Error)
      return { profile: null, error: new Error(error.message) }
    }

    if (!data) {
      logger.debug('getAdminProfileByUserId: No profile found')
      return { profile: null, error: null }
    }

    // Only return if user is admin or super_admin
    if (data.role !== 'admin' && data.role !== 'super_admin') {
      logger.debug('getAdminProfileByUserId: User is not an admin')
      return { profile: null, error: new Error('User is not an admin') }
    }

    return {
      profile: {
        id: data.id,
        user_id: data.user_id,
        role: data.role as 'super_admin' | 'admin' | 'student',
        email: data.email,
        name: data.name || null,
        branchId: data.branch_id || null,
        phone: data.phone || null,
        address: data.address || null,
        qualifications: data.qualifications || null,
        experience: data.experience || null,
        specialization: data.specialization || null,
        profileImageUrl: data.profile_image_url || null,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      },
      error: null,
    }
  } catch (error) {
    logger.error('getAdminProfileByUserId: Unexpected error', error as Error)
    return {
      profile: null,
      error: error instanceof Error ? error : new Error('Failed to fetch profile'),
    }
  }
}

/**
 * Update admin profile details
 * Admins can update their own profile information but cannot change their role or branch_id
 */
export async function updateAdminProfile(
  userId: string,
  updates: AdminProfileUpdate
): Promise<{ success: boolean; error: null } | { success: false; error: Error }> {
  try {
    logger.debug('updateAdminProfile: Updating profile', { userId, updates })

    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('id, user_id, role')
      .eq('user_id', userId)
      .maybeSingle()

    if (fetchError) {
      logger.error('updateAdminProfile: Error fetching profile', fetchError as Error)
      return { success: false, error: new Error(fetchError.message) }
    }

    if (!profile) {
      logger.error('updateAdminProfile: Profile not found', new Error('Profile not found'))
      return { success: false, error: new Error('Profile not found') }
    }

    // Only allow admins and super_admins to update their profile
    if (profile.role !== 'admin' && profile.role !== 'super_admin') {
      logger.error('updateAdminProfile: Unauthorized role', new Error('Only admins can update profile'))
      return { success: false, error: new Error('Unauthorized') }
    }

    // Build update object - only include fields that are provided
    const updateData: Record<string, any> = {}
    if (updates.name !== undefined) updateData.name = updates.name?.trim() || null
    if (updates.phone !== undefined) updateData.phone = updates.phone?.trim() || null
    if (updates.address !== undefined) updateData.address = updates.address?.trim() || null
    if (updates.qualifications !== undefined) updateData.qualifications = updates.qualifications?.trim() || null
    if (updates.experience !== undefined) updateData.experience = updates.experience?.trim() || null
    if (updates.specialization !== undefined) updateData.specialization = updates.specialization?.trim() || null
    if (updates.profileImageUrl !== undefined) updateData.profile_image_url = updates.profileImageUrl || null

    logger.debug('updateAdminProfile: Update data prepared', { updateData, userId })

    // Check if updateData is empty
    if (Object.keys(updateData).length === 0) {
      logger.warn('updateAdminProfile: No fields to update', { updates })
      return { success: false, error: new Error('No fields to update') }
    }

    const { data: updatedData, error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('user_id', userId)
      .select('name, phone, address, qualifications, experience, specialization, profile_image_url')

    if (updateError) {
      logger.error('updateAdminProfile: Error updating profile', updateError as Error, { updateData })
      return { success: false, error: new Error(updateError.message) }
    }

    logger.info('updateAdminProfile: Profile updated successfully', { 
      userId, 
      updatedFields: Object.keys(updateData),
      updatedData: updatedData?.[0] 
    })
    return { success: true, error: null }
  } catch (error) {
    logger.error('updateAdminProfile: Unexpected error', error as Error)
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Failed to update profile'),
    }
  }
}

/**
 * Upload admin profile image to Supabase Storage
 */
export async function uploadAdminProfileImage(
  imageUri: string,
  userId: string
): Promise<{ url: string | null; error: Error | null }> {
  try {
    const { supabaseAdmin } = await import('./supabase')
    if (!supabaseAdmin) {
      return { url: null, error: new Error('Service role key not configured') }
    }

    // Check if storage bucket exists
    const { data: buckets, error: bucketError } = await supabaseAdmin.storage.listBuckets()
    if (bucketError) {
      logger.error('Error checking storage buckets', bucketError as Error)
      return { url: null, error: new Error('Failed to access storage') }
    }

    const bucketExists = buckets?.some((b) => b.id === 'admin-profiles')
    if (!bucketExists) {
      return { 
        url: null, 
        error: new Error(
          'Storage bucket "admin-profiles" not found. Please create it in Supabase Dashboard → Storage.'
        ) 
      }
    }

    // Compress image before upload
    logger.info('Compressing admin profile image before upload...')
    const { uri: compressedUri, size: compressedSize, originalSize } = await compressImage(imageUri, 'profile')
    logger.info('Admin profile image compressed', {
      originalSize,
      compressedSize,
      reduction: `${((1 - compressedSize / originalSize) * 100).toFixed(1)}%`,
    })

    // Read compressed file as ArrayBuffer
    const base64 = await FileSystem.readAsStringAsync(compressedUri, {
      encoding: FileSystem.EncodingType.Base64,
    })

    // Convert base64 to ArrayBuffer
    const binaryString = atob(base64)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    // Generate filename: {userId}.jpg
    const filename = `${userId}.jpg`
    const filePath = filename

    // Upload to Supabase Storage
    const { data: uploadData, error } = await supabase.storage
      .from('admin-profiles')
      .upload(filePath, bytes.buffer, {
        contentType: 'image/jpeg',
        upsert: true, // Overwrite if exists
      })

    if (error) {
      logger.error('Error uploading admin profile image', error as Error)
      return { url: null, error: new Error(`Failed to upload image: ${error.message}`) }
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('admin-profiles')
      .getPublicUrl(filePath)

    if (!urlData?.publicUrl) {
      return { url: null, error: new Error('Failed to get image URL') }
    }

    logger.info('Admin profile image uploaded successfully', { userId, url: urlData.publicUrl })
    return { url: urlData.publicUrl, error: null }
  } catch (error) {
    logger.error('Unexpected error uploading admin profile image', error as Error)
    return {
      url: null,
      error: error instanceof Error ? error : new Error('Failed to upload image'),
    }
  }
}


