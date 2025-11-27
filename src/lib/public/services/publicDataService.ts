import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import type { Instructor, PublicGalleryItem, Branch, PublicData } from '../types/public.types'

/**
 * Get logo URL from Supabase storage
 */
export async function getLogoUrl(): Promise<{ logoUrl: string | null; error: null } | { logoUrl: null; error: Error }> {
  try {
    // Try .jpg first (actual file), then fallback to .png
    const { data: jpgData } = supabase.storage
      .from('public-assets')
      .getPublicUrl('logo/dojo-logo.jpg')
    
    const logoUrl = jpgData?.publicUrl || null
    logger.info('Logo URL fetched', { url: logoUrl })
    
    return { logoUrl, error: null }
  } catch (error) {
    logger.error('Error getting logo URL', error as Error)
    return {
      logoUrl: null,
      error: error instanceof Error ? error : new Error('Failed to get logo URL'),
    }
  }
}

/**
 * Get all active branches
 */
export async function getBranches(): Promise<{ branches: Branch[]; error: null } | { branches: null; error: Error }> {
  try {
    const { data, error } = await supabase
      .from('branches')
      .select('id, name, code, address, phone, email, status')
      .eq('status', 'active')
      .order('name', { ascending: true })

    if (error) {
      logger.error('Error fetching branches', error as Error)
      return { branches: null, error: new Error(error.message) }
    }

    return { branches: (data as Branch[]) || [], error: null }
  } catch (error) {
    logger.error('Unexpected error fetching branches', error as Error)
    return {
      branches: null,
      error: error instanceof Error ? error : new Error('Failed to fetch branches'),
    }
  }
}

/**
 * Get all instructors (featured first, then by order_index)
 */
export async function getInstructors(): Promise<{ instructors: Instructor[]; error: null } | { instructors: null; error: Error }> {
  try {
    const { data, error } = await supabase
      .from('instructors')
      .select('*')
      .order('is_featured', { ascending: false })
      .order('order_index', { ascending: true })
      .order('name', { ascending: true })

    if (error) {
      logger.error('Error fetching instructors', error as Error)
      return { instructors: null, error: new Error(error.message) }
    }

    return { instructors: (data as Instructor[]) || [], error: null }
  } catch (error) {
    logger.error('Unexpected error fetching instructors', error as Error)
    return {
      instructors: null,
      error: error instanceof Error ? error : new Error('Failed to fetch instructors'),
    }
  }
}

/**
 * Get count of active students
 */
export async function getStudentCount(): Promise<{ count: number; error: null } | { count: 0; error: Error }> {
  try {
    const { count, error } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    if (error) {
      logger.error('Error counting students', error as Error)
      return { count: 0, error: new Error(error.message) }
    }

    return { count: count || 0, error: null }
  } catch (error) {
    logger.error('Unexpected error counting students', error as Error)
    return {
      count: 0,
      error: error instanceof Error ? error : new Error('Failed to count students'),
    }
  }
}

/**
 * Get public gallery items (active, featured first)
 */
export async function getGalleryItems(): Promise<{ items: PublicGalleryItem[]; error: null } | { items: null; error: Error }> {
  try {
    const { data, error } = await supabase
      .from('public_gallery')
      .select('*')
      .eq('is_active', true)
      .order('is_featured', { ascending: false })
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('Error fetching gallery items', error as Error)
      return { items: null, error: new Error(error.message) }
    }

    return { items: (data as PublicGalleryItem[]) || [], error: null }
  } catch (error) {
    logger.error('Unexpected error fetching gallery items', error as Error)
    return {
      items: null,
      error: error instanceof Error ? error : new Error('Failed to fetch gallery items'),
    }
  }
}

/**
 * Get all public data at once (for initial load)
 * Handles partial failures gracefully - returns data for successful requests
 */
export async function getPublicData(): Promise<{ data: PublicData; error: null } | { data: null; error: Error }> {
  try {
    const [branchesResult, instructorsResult, studentCountResult, galleryResult, logoResult] = await Promise.allSettled([
      getBranches(),
      getInstructors(),
      getStudentCount(),
      getGalleryItems(),
      getLogoUrl(),
    ])

    // Extract results, handling both fulfilled and rejected promises
    const branches = branchesResult.status === 'fulfilled' && !branchesResult.value.error
      ? branchesResult.value.branches || []
      : []
    
    const instructors = instructorsResult.status === 'fulfilled' && !instructorsResult.value.error
      ? instructorsResult.value.instructors || []
      : []
    
    const studentCount = studentCountResult.status === 'fulfilled' && !studentCountResult.value.error
      ? studentCountResult.value.count || 0
      : 0
    
    const galleryItems = galleryResult.status === 'fulfilled' && !galleryResult.value.error
      ? galleryResult.value.items || []
      : []
    
    const logoUrl = logoResult.status === 'fulfilled' && !logoResult.value.error
      ? logoResult.value.logoUrl
      : null

    // Log any errors but don't fail completely
    const errors: string[] = []
    
    if (branchesResult.status === 'rejected' || (branchesResult.status === 'fulfilled' && branchesResult.value.error)) {
      const errorMsg = branchesResult.status === 'rejected' 
        ? branchesResult.reason?.message || 'Unknown error'
        : branchesResult.value.error?.message || 'Unknown error'
      errors.push(`Branches: ${errorMsg}`)
      logger.warn('Failed to fetch branches', new Error(errorMsg))
    }
    
    if (instructorsResult.status === 'rejected' || (instructorsResult.status === 'fulfilled' && instructorsResult.value.error)) {
      const errorMsg = instructorsResult.status === 'rejected'
        ? instructorsResult.reason?.message || 'Unknown error'
        : instructorsResult.value.error?.message || 'Unknown error'
      errors.push(`Instructors: ${errorMsg}`)
      logger.warn('Failed to fetch instructors', new Error(errorMsg))
    }
    
    if (studentCountResult.status === 'rejected' || (studentCountResult.status === 'fulfilled' && studentCountResult.value.error)) {
      const errorMsg = studentCountResult.status === 'rejected'
        ? studentCountResult.reason?.message || 'Unknown error'
        : studentCountResult.value.error?.message || 'Unknown error'
      errors.push(`Student count: ${errorMsg}`)
      logger.warn('Failed to fetch student count', new Error(errorMsg))
    }
    
    if (galleryResult.status === 'rejected' || (galleryResult.status === 'fulfilled' && galleryResult.value.error)) {
      const errorMsg = galleryResult.status === 'rejected'
        ? galleryResult.reason?.message || 'Unknown error'
        : galleryResult.value.error?.message || 'Unknown error'
      errors.push(`Gallery: ${errorMsg}`)
      logger.warn('Failed to fetch gallery items', new Error(errorMsg))
    }

    // Only fail if ALL critical data failed (branches and instructors)
    if (branches.length === 0 && instructors.length === 0) {
      logger.error('All critical public data failed to load', new Error(errors.join(', ')))
      return {
        data: null,
        error: new Error('Unable to load public content. Please try again later.'),
      }
    }

    // Log partial failures but return partial data
    if (errors.length > 0) {
      logger.warn('Some public data failed to load, returning partial data', { errors })
    }

    return {
      data: {
        branches,
        instructors,
        studentCount,
        galleryItems,
        logoUrl,
      },
      error: null,
    }
  } catch (error) {
    logger.error('Unexpected error fetching public data', error as Error)
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Failed to fetch public data'),
    }
  }
}

