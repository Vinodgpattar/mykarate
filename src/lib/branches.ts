import { supabase } from './supabase'
import { logger } from './logger'

export interface Branch {
  id: string
  name: string
  code: string | null
  address: string | null
  phone: string | null
  email: string | null
  status: string
  created_by_id: string
  created_at: string
  updated_at: string
}

export interface AdminDetails {
  id: string
  name: string
  email: string
  phone?: string | null
  address?: string | null
  qualifications?: string | null
  experience?: string | null
  specialization?: string | null
}

export interface BranchWithAdmin extends Branch {
  admin?: AdminDetails | null
}

export interface CreateBranchData {
  name: string
  address: string
  phone?: string
  email?: string
  adminName?: string
  adminEmail?: string
  adminPhone?: string
  adminAddress?: string
  adminQualifications?: string
  adminExperience?: string
  adminSpecialization?: string
  assignAdmin?: boolean
  sendEmail?: boolean
}

export interface UpdateBranchData {
  name?: string
  address?: string
  phone?: string
  email?: string
  status?: string
}

// Note: Password generation is now handled by the backend API
// Removed generateSecurePassword function as it's not needed in mobile app

/**
 * Generate branch code if not provided
 * Includes retry logic to handle race conditions
 */
async function generateBranchCode(maxRetries: number = 3): Promise<string> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    // Get the latest branch code
    const { data, error } = await supabase
      .from('branches')
      .select('code')
      .not('code', 'is', null)
      .like('code', 'BR%')
      .order('created_at', { ascending: false })
      .limit(1)

    if (error) {
      logger.warn('Error fetching latest branch code', { error: error.message })
      // On last attempt, return default
      if (attempt === maxRetries - 1) {
        return 'BR001'
      }
      continue
    }

    let nextCode = 'BR001'
    if (data && data.length > 0 && data[0].code) {
      // Extract number from code (e.g., "BR001" -> 1)
      const match = data[0].code.match(/BR(\d+)/)
      if (match) {
        const nextNum = parseInt(match[1]) + 1
        nextCode = `BR${String(nextNum).padStart(3, '0')}`
      }
    }

    // Verify code doesn't already exist (race condition check)
    const { data: existingBranch } = await supabase
      .from('branches')
      .select('id')
      .eq('code', nextCode)
      .maybeSingle()

    if (!existingBranch) {
      // Code is available
      return nextCode
    }

    // Code exists, try again with next number
    if (attempt < maxRetries - 1) {
      logger.warn('Branch code collision detected, retrying', { code: nextCode, attempt: attempt + 1 })
      // Small delay to avoid tight loop
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }

  // Fallback: Generate timestamp-based code if all retries fail
  const timestamp = Date.now().toString().slice(-6)
  return `BR${timestamp}`
}

/**
 * Get all branches with optional search and filter
 * Optionally includes admin details
 */
export async function getBranches(options?: {
  search?: string
  status?: 'all' | 'active' | 'inactive'
  page?: number
  limit?: number
  includeAdmin?: boolean
}): Promise<{ branches: (Branch | BranchWithAdmin)[]; total: number; error: null } | { branches: null; total: 0; error: Error }> {
  try {
    let query = supabase
      .from('branches')
      .select('*', { count: 'exact' })

    // Apply search filter
    if (options?.search && options.search.trim()) {
      const searchTerm = options.search.trim()
      query = query.or(`name.ilike.%${searchTerm}%,code.ilike.%${searchTerm}%,address.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
    }

    // Apply status filter
    if (options?.status && options.status !== 'all') {
      query = query.eq('status', options.status)
    }

    // Apply pagination
    const limit = options?.limit || 50
    const page = options?.page || 1
    const offset = (page - 1) * limit

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      logger.error('Error fetching branches', error as Error)
      return { branches: null, total: 0, error: new Error(error.message) }
    }

    const branches = (data as Branch[]) || []

    // If admin details requested, fetch them
    if (options?.includeAdmin && branches.length > 0) {
      const branchesWithAdmin: BranchWithAdmin[] = await Promise.all(
        branches.map(async (branch) => {
          const { data: adminProfile } = await supabase
            .from('profiles')
            .select('id, email, phone, address, qualifications, experience, specialization')
            .eq('branch_id', branch.id)
            .eq('role', 'admin')
            .maybeSingle()

          let adminInfo: AdminDetails | null = null
          if (adminProfile) {
            adminInfo = {
              id: adminProfile.id,
              name: adminProfile.email || 'Admin',
              email: adminProfile.email || '',
              phone: adminProfile.phone || null,
              address: adminProfile.address || null,
              qualifications: adminProfile.qualifications || null,
              experience: adminProfile.experience || null,
              specialization: adminProfile.specialization || null,
            }
          }

          return {
            ...branch,
            admin: adminInfo,
          }
        })
      )

      return { branches: branchesWithAdmin, total: count || 0, error: null }
    }

    return { branches, total: count || 0, error: null }
  } catch (error) {
    logger.error('Unexpected error fetching branches', error as Error)
    return {
      branches: null,
      total: 0,
      error: error instanceof Error ? error : new Error('Failed to fetch branches'),
    }
  }
}

/**
 * Get branch statistics
 */
export async function getBranchStatistics(): Promise<{
  total: number
  active: number
  inactive: number
  admins: number
  newThisMonth: number
  error: null
} | {
  total: 0
  active: 0
  inactive: 0
  admins: 0
  newThisMonth: 0
  error: Error
}> {
  try {
    // Get all branches
    const { data: branches, error: branchesError } = await supabase
      .from('branches')
      .select('id, status, created_at')

    if (branchesError) {
      logger.error('Error fetching branches for statistics', branchesError as Error)
      return {
        total: 0,
        active: 0,
        inactive: 0,
        admins: 0,
        newThisMonth: 0,
        error: new Error(branchesError.message),
      }
    }

    const total = branches?.length || 0
    const active = branches?.filter(b => b.status === 'active').length || 0
    const inactive = total - active

    // Get new branches this month
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const newThisMonth = branches?.filter(b => {
      const createdAt = new Date(b.created_at)
      return createdAt >= startOfMonth
    }).length || 0

    // Get admin count
    const { data: admins, error: adminsError } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'admin')
      .not('branch_id', 'is', null)

    const adminCount = adminsError ? 0 : (admins?.length || 0)

    return {
      total,
      active,
      inactive,
      admins: adminCount,
      newThisMonth,
      error: null,
    }
  } catch (error) {
    logger.error('Unexpected error fetching branch statistics', error as Error)
    return {
      total: 0,
      active: 0,
      inactive: 0,
      admins: 0,
      newThisMonth: 0,
      error: error instanceof Error ? error : new Error('Failed to fetch statistics'),
    }
  }
}

/**
 * Get branch by ID
 */
export async function getBranchById(branchId: string): Promise<{ branch: BranchWithAdmin | null; error: null } | { branch: null; error: Error }> {
  try {
    // First get the branch
    const { data: branchData, error: branchError } = await supabase
      .from('branches')
      .select('*')
      .eq('id', branchId)
      .single()

    if (branchError) {
      logger.error('Error fetching branch', branchError as Error)
      return { branch: null, error: new Error(branchError.message) }
    }

    // Then get the admin profile for this branch
    const { data: adminProfile, error: adminError } = await supabase
      .from('profiles')
      .select('id, email, user_id, phone, address, qualifications, experience, specialization')
      .eq('branch_id', branchId)
      .eq('role', 'admin')
      .maybeSingle()

    if (adminError) {
      logger.warn('Error fetching admin profile', adminError as Error)
    }

    // Format admin info
    let adminInfo: AdminDetails | null = null
    if (adminProfile) {
      adminInfo = {
        id: adminProfile.id,
        name: adminProfile.email || 'Admin',
        email: adminProfile.email || '',
        phone: adminProfile.phone || null,
        address: adminProfile.address || null,
        qualifications: adminProfile.qualifications || null,
        experience: adminProfile.experience || null,
        specialization: adminProfile.specialization || null,
      }
    }

    return {
      branch: {
        ...branchData,
        admin: adminInfo,
      } as BranchWithAdmin,
      error: null,
    }
  } catch (error) {
    logger.error('Unexpected error fetching branch', error as Error)
    return {
      branch: null,
      error: error instanceof Error ? error : new Error('Failed to fetch branch'),
    }
  }
}

/**
 * Log audit trail for branch operations
 */
async function logBranchAudit(
  branchId: string,
  action: string,
  oldValues: any,
  newValues: any,
  changedBy: string
): Promise<void> {
  try {
    const { supabaseAdmin } = await import('./supabase')
    if (!supabaseAdmin) return

    await supabaseAdmin
      .from('branch_audit_logs')
      .insert({
        branch_id: branchId,
        action,
        old_values: oldValues ? JSON.stringify(oldValues) : null,
        new_values: newValues ? JSON.stringify(newValues) : null,
        changed_by: changedBy,
      })
  } catch (error) {
    logger.warn('Failed to log audit trail', error as Error)
    // Don't fail the operation if audit logging fails
  }
}

/**
 * Log email sending
 */
async function logEmail(
  recipient: string,
  subject: string,
  body: string,
  emailType: string,
  status: 'sent' | 'failed',
  errorMessage?: string
): Promise<void> {
  try {
    const { supabaseAdmin } = await import('./supabase')
    if (!supabaseAdmin) return

    await supabaseAdmin
      .from('email_logs')
      .insert({
        recipient,
        subject,
        body,
        email_type: emailType,
        status,
        error_message: errorMessage || null,
      })
  } catch (error) {
    logger.warn('Failed to log email', error as Error)
  }
}

/**
 * Create a new branch with optional admin assignment
 */
export async function createBranch(
  data: CreateBranchData,
  createdById: string
): Promise<{ branch: Branch | null; error: null } | { branch: null; error: Error }> {
  try {
    // Verify creator is super_admin
    const { getProfileByUserId } = await import('./profiles')
    const profileResult = await getProfileByUserId(createdById)
    
    if (profileResult.error || !profileResult.profile) {
      logger.error('Error verifying creator profile', profileResult.error || new Error('Profile not found'))
      return { branch: null, error: new Error('Failed to verify user permissions') }
    }

    if (profileResult.profile.role !== 'super_admin') {
      logger.error('Unauthorized branch creation attempt', new Error(`User ${createdById} is not super_admin`))
      return { branch: null, error: new Error('Only super admins can create branches') }
    }

    // Check for duplicate branch name (case-insensitive)
    const trimmedName = data.name.trim()
    const { data: existingBranch } = await supabase
      .from('branches')
      .select('id')
      .ilike('name', trimmedName)
      .maybeSingle()

    if (existingBranch) {
      logger.warn('Duplicate branch name detected', { name: trimmedName })
      return { branch: null, error: new Error('A branch with this name already exists') }
    }

    // Generate code if not provided
    const branchCode = await generateBranchCode()

    // Create branch
    const { data: branchData, error: branchError } = await supabase
      .from('branches')
      .insert({
        name: trimmedName,
        code: branchCode,
        address: data.address?.trim() || null,
        phone: data.phone?.trim() || null,
        email: data.email?.trim() || null,
        status: 'active',
        created_by_id: createdById,
      })
      .select()
      .single()

    if (branchError) {
      logger.error('Error creating branch', branchError as Error)
      // Check if it's a duplicate code error
      if (branchError.code === '23505' || branchError.message.includes('duplicate') || branchError.message.includes('unique')) {
        // Retry with new code
        const retryCode = await generateBranchCode()
        const { data: retryData, error: retryError } = await supabase
          .from('branches')
          .insert({
            name: trimmedName,
            code: retryCode,
            address: data.address?.trim() || null,
            phone: data.phone?.trim() || null,
            email: data.email?.trim() || null,
            status: 'active',
            created_by_id: createdById,
          })
          .select()
          .single()

        if (retryError) {
          logger.error('Error creating branch on retry', retryError as Error)
          return { branch: null, error: new Error(retryError.message) }
        }

        const retryBranch = retryData as Branch
        // Log audit trail
        await logBranchAudit(
          retryBranch.id,
          'create',
          null,
          retryBranch,
          createdById
        )

        // Assign admin if requested
        if (data.assignAdmin && data.adminEmail && data.adminName) {
          const adminResult = await assignAdminToBranch(
            retryBranch.id,
            data.adminEmail,
            data.adminName,
            {
              phone: data.adminPhone,
              address: data.adminAddress,
              qualifications: data.adminQualifications,
              experience: data.adminExperience,
              specialization: data.adminSpecialization,
            },
            data.sendEmail ?? true
          )

          if (adminResult.error) {
            logger.warn('Branch created but admin assignment failed', adminResult.error)
          }
        }

        logger.info('Branch created successfully (after retry)', { branchId: retryBranch.id, name: retryBranch.name })
        return { branch: retryBranch, error: null }
      }
      return { branch: null, error: new Error(branchError.message) }
    }

    const branch = branchData as Branch

    // Log audit trail
    await logBranchAudit(
      branch.id,
      'create',
      null,
      branch,
      createdById
    )

    // Assign admin if requested
    if (data.assignAdmin && data.adminEmail && data.adminName) {
      const adminResult = await assignAdminToBranch(
        branch.id,
        data.adminEmail,
        data.adminName,
        {
          phone: data.adminPhone,
          address: data.adminAddress,
          qualifications: data.adminQualifications,
          experience: data.adminExperience,
          specialization: data.adminSpecialization,
        },
        data.sendEmail ?? true
      )

      if (adminResult.error) {
        logger.warn('Branch created but admin assignment failed', adminResult.error)
        // Don't fail - branch is created
      }
    }

    logger.info('Branch created successfully', { branchId: branch.id, name: branch.name })
    return { branch, error: null }
  } catch (error) {
    logger.error('Unexpected error creating branch', error as Error)
    return {
      branch: null,
      error: error instanceof Error ? error : new Error('Failed to create branch'),
    }
  }
}

/**
 * Update a branch
 */
export async function updateBranch(
  branchId: string,
  updates: UpdateBranchData,
  changedBy: string
): Promise<{ branch: Branch | null; error: null } | { branch: null; error: Error }> {
  try {
    // Get old values for audit log
    const oldBranch = await getBranchById(branchId)
    const oldValues = oldBranch.branch ? { ...oldBranch.branch } : null

    // Check for duplicate branch name if name is being updated
    if (updates.name !== undefined) {
      const trimmedName = updates.name.trim()
      const { data: existingBranch } = await supabase
        .from('branches')
        .select('id')
        .ilike('name', trimmedName)
        .neq('id', branchId) // Exclude current branch
        .maybeSingle()

      if (existingBranch) {
        logger.warn('Duplicate branch name detected on update', { name: trimmedName, branchId })
        return { branch: null, error: new Error('A branch with this name already exists') }
      }
    }

    const updateData: any = {}
    if (updates.name !== undefined) updateData.name = updates.name.trim()
    if (updates.address !== undefined) updateData.address = updates.address?.trim() || null
    if (updates.phone !== undefined) updateData.phone = updates.phone?.trim() || null
    if (updates.email !== undefined) updateData.email = updates.email?.trim() || null
    if (updates.status !== undefined) updateData.status = updates.status

    const { data, error } = await supabase
      .from('branches')
      .update(updateData)
      .eq('id', branchId)
      .select()
      .single()

    if (error) {
      logger.error('Error updating branch', error as Error)
      return { branch: null, error: new Error(error.message) }
    }

    const newValues = data as Branch

    // Log audit trail
    await logBranchAudit(
      branchId,
      'update',
      oldValues,
      newValues,
      changedBy
    )

    logger.info('Branch updated successfully', { branchId })
    return { branch: newValues, error: null }
  } catch (error) {
    logger.error('Unexpected error updating branch', error as Error)
    return {
      branch: null,
      error: error instanceof Error ? error : new Error('Failed to update branch'),
    }
  }
}

/**
 * Delete a branch (soft delete by setting status to inactive)
 */
export async function deleteBranch(branchId: string, deletedBy: string): Promise<{ success: boolean; error: null } | { success: false; error: Error }> {
  try {
    // Check if service role key is available
    const { supabaseAdmin } = await import('./supabase')
    if (!supabaseAdmin) {
      return {
        success: false,
        error: new Error('Service role key not configured'),
      }
    }

    // Verify deleter is super_admin
    const { getProfileByUserId } = await import('./profiles')
    const profileResult = await getProfileByUserId(deletedBy)
    
    if (profileResult.error || !profileResult.profile) {
      logger.error('Error verifying deleter profile', profileResult.error || new Error('Profile not found'))
      return { success: false, error: new Error('Failed to verify user permissions') }
    }

    if (profileResult.profile.role !== 'super_admin') {
      logger.warn('Unauthorized branch deletion attempt', { deletedBy, role: profileResult.profile.role })
      return { success: false, error: new Error('Only super admins can delete branches') }
    }

    // Get branch details for audit log
    const branch = await getBranchById(branchId)
    const oldValues = branch.branch ? { ...branch.branch } : null

    // Check if branch has students
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id')
      .eq('branch_id', branchId)
      .limit(1)

    if (studentsError) {
      logger.error('Error checking branch students', studentsError as Error)
      return {
        success: false,
        error: new Error('Failed to verify branch students. Cannot delete branch. Please try again.'),
      }
    }

    // If branch has students, soft delete (set status to inactive)
    if (students && students.length > 0) {
      // Get student count for warning message
      const { count: studentCount } = await supabase
        .from('students')
        .select('id', { count: 'exact', head: true })
        .eq('branch_id', branchId)

      const { error } = await supabase
        .from('branches')
        .update({ status: 'inactive' })
        .eq('id', branchId)

      if (error) {
        logger.error('Error soft deleting branch', error as Error)
        return { success: false, error: new Error(error.message) }
      }

      // Log audit trail
      await logBranchAudit(
        branchId,
        'delete',
        oldValues,
        { status: 'inactive', studentCount: studentCount || 0 },
        deletedBy
      )

      logger.info('Branch soft deleted (set to inactive)', { 
        branchId, 
        studentCount: studentCount || 0,
        message: `Branch has ${studentCount || 0} student(s) - set to inactive instead of deleting`
      })
      return { success: true, error: null }
    }

    // If no students, hard delete
    const { error } = await supabase
      .from('branches')
      .delete()
      .eq('id', branchId)

    if (error) {
      logger.error('Error deleting branch', error as Error)
      return { success: false, error: new Error(error.message) }
    }

    // Log audit trail
    await logBranchAudit(
      branchId,
      'delete',
      oldValues,
      null,
      deletedBy
    )

    logger.info('Branch deleted successfully', { branchId })
    return { success: true, error: null }
  } catch (error) {
    logger.error('Unexpected error deleting branch', error as Error)
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Failed to delete branch'),
    }
  }
}

/**
 * Generate a secure random password
 */
function generateSecurePassword(): string {
  const length = 12
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  let password = ''
  // Ensure at least one of each required type
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]
  password += '0123456789'[Math.floor(Math.random() * 10)]
  password += '!@#$%^&*'[Math.floor(Math.random() * 8)]
  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)]
  }
  // Shuffle
  return password.split('').sort(() => Math.random() - 0.5).join('')
}

/**
 * Assign admin to branch
 * Creates auth user and profile directly, then sends email via web app
 * Supports admin reuse - if email exists, reuses account and generates new password
 */
export async function assignAdminToBranch(
  branchId: string,
  adminEmail: string,
  adminName: string,
  adminDetails?: {
    phone?: string
    address?: string
    qualifications?: string
    experience?: string
    specialization?: string
  },
  sendEmail: boolean = true
): Promise<{ success: boolean; password: string | null; isReused: boolean; error: null } | { success: false; password: null; isReused: false; error: Error }> {
  try {
    const normalizedEmail = adminEmail.toLowerCase().trim()

    // Check if service role key is available
    const { supabaseAdmin } = await import('./supabase')
    if (!supabaseAdmin) {
      return {
        success: false,
        password: null,
        error: new Error('Service role key not configured. Please set EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY in .env.local'),
      }
    }

    // Verify branch exists
    const branch = await getBranchById(branchId)
    if (!branch.branch) {
      return {
        success: false,
        password: null,
        error: new Error('Branch not found'),
      }
    }

    const password = generateSecurePassword()

    // Check if user already exists
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = users?.find(u => u.email === normalizedEmail)
    
    let userId: string
    let isReused = false

    if (existingUser) {
      // User exists - check if they have a profile with a branch
      const { data: existingProfile } = await supabaseAdmin
        .from('profiles')
        .select('id, role, branch_id')
        .eq('user_id', existingUser.id)
        .maybeSingle()
      
      // CRITICAL FIX: Prevent assigning super_admin as branch admin
      if (existingProfile && existingProfile.role === 'super_admin') {
        return {
          success: false,
          password: null,
          isReused: false,
          error: new Error('Cannot assign a super admin as a branch admin. Super admins manage all branches.'),
        }
      }
      
      if (existingProfile && existingProfile.branch_id) {
        // Admin already assigned to a branch - reuse but update branch
        isReused = true
        
        // Remove from old branch (set branch_id to null)
        await supabaseAdmin
          .from('profiles')
          .update({ branch_id: null })
          .eq('id', existingProfile.id)
        
        // Update password for security
        await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
          password,
        })

        // Update profile with new branch and admin details
        // IMPORTANT: Do NOT update role - preserve existing role (should be 'admin')
        const { error: profileUpdateError } = await supabaseAdmin
          .from('profiles')
          .update({
            branch_id: branchId,
            phone: adminDetails?.phone?.trim() || null,
            address: adminDetails?.address?.trim() || null,
            qualifications: adminDetails?.qualifications?.trim() || null,
            experience: adminDetails?.experience?.trim() || null,
            specialization: adminDetails?.specialization?.trim() || null,
            // Note: role is NOT updated here - it should remain 'admin'
          })
          .eq('id', existingProfile.id)

        if (profileUpdateError) {
          logger.error('Error updating profile for existing admin', profileUpdateError as Error)
          return {
            success: false,
            password: null,
            isReused: false,
            error: new Error('Failed to update profile: ' + profileUpdateError.message),
          }
        }

        userId = existingUser.id
        logger.info('Reused existing admin account', { userId, branchId })
      } else if (existingProfile && !existingProfile.branch_id) {
        // Profile exists but no branch - update with new branch
        // Note: We already checked for super_admin above, so this should be safe
        isReused = true
        await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
          password,
        })

        // IMPORTANT: Do NOT update role - preserve existing role
        const { error: profileUpdateError } = await supabaseAdmin
          .from('profiles')
          .update({
            branch_id: branchId,
            phone: adminDetails?.phone?.trim() || null,
            address: adminDetails?.address?.trim() || null,
            qualifications: adminDetails?.qualifications?.trim() || null,
            experience: adminDetails?.experience?.trim() || null,
            specialization: adminDetails?.specialization?.trim() || null,
            // Note: role is NOT updated here - preserve existing role
          })
          .eq('id', existingProfile.id)

        if (profileUpdateError) {
          logger.error('Error updating profile', profileUpdateError as Error)
          return {
            success: false,
            password: null,
            isReused: false,
            error: new Error('Failed to update profile: ' + profileUpdateError.message),
          }
        }

        userId = existingUser.id
        logger.info('Updated existing profile with branch', { userId, branchId })
      } else {
        // User exists but no profile - create profile
        isReused = true
        await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
          password,
        })

        const { error: profileInsertError } = await supabaseAdmin
          .from('profiles')
          .insert({
            user_id: existingUser.id,
            role: 'admin',
            email: normalizedEmail,
            branch_id: branchId,
            phone: adminDetails?.phone?.trim() || null,
            address: adminDetails?.address?.trim() || null,
            qualifications: adminDetails?.qualifications?.trim() || null,
            experience: adminDetails?.experience?.trim() || null,
            specialization: adminDetails?.specialization?.trim() || null,
          })

        if (profileInsertError) {
          logger.error('Error creating profile for existing user', profileInsertError as Error)
          return {
            success: false,
            password: null,
            isReused: false,
            error: new Error('Failed to create profile: ' + profileInsertError.message),
          }
        }

        userId = existingUser.id
        logger.info('Created profile for existing user', { userId, branchId })
      }
    } else {
      // Create new auth user
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: normalizedEmail,
        password,
        email_confirm: true,
        // Note: We don't set user_metadata.role - role is stored in profiles table
      })

      if (createError || !newUser?.user) {
        logger.error('Error creating auth user', createError)
        return {
          success: false,
          password: null,
          error: new Error(createError?.message || 'Failed to create auth user'),
        }
      }

      userId = newUser.user.id

      // Create profile with role='admin' and branchId (id will be auto-generated)
      const { error: profileInsertError } = await supabaseAdmin
        .from('profiles')
        .insert({
          user_id: userId,
          role: 'admin',
          email: normalizedEmail,
          branch_id: branchId,
          phone: adminDetails?.phone?.trim() || null,
          address: adminDetails?.address?.trim() || null,
          qualifications: adminDetails?.qualifications?.trim() || null,
          experience: adminDetails?.experience?.trim() || null,
          specialization: adminDetails?.specialization?.trim() || null,
        })

      if (profileInsertError) {
        // If profile creation fails, try to delete the auth user
        logger.error('Error creating profile, attempting to clean up auth user', profileInsertError as Error)
        await supabaseAdmin.auth.admin.deleteUser(userId).catch(() => {
          // Ignore cleanup errors
        })

        return {
          success: false,
          password: null,
          error: new Error('Failed to create profile: ' + profileInsertError.message),
        }
      }

      logger.info('Created admin user and profile', { userId, email: normalizedEmail, branchId })
    }

    // Note: No need to update branch with admin_id - the relationship is via profiles.branch_id
    // The admin is already linked through the profile's branch_id field

    // Send appropriate email via web app (if requested)
    if (sendEmail) {
      try {
        const emailApiUrl = process.env.EXPO_PUBLIC_EMAIL_API_URL
        
        if (!emailApiUrl || emailApiUrl === 'https://your-vercel-app.vercel.app') {
          logger.warn('Email API URL not configured, skipping email send', {
            email: normalizedEmail,
            branchId,
          })
          // Log email as failed due to missing configuration
          await logEmail(
            normalizedEmail,
            isReused ? `Branch Assignment - ${branch.branch.name}` : `Welcome as Branch Admin - ${branch.branch.name}`,
            '',
            isReused ? 'admin_assignment' : 'admin_welcome',
            'failed',
            'Email API URL not configured. Please set EXPO_PUBLIC_EMAIL_API_URL in environment variables.'
          )
        } else {
          let emailEndpoint = '/api/email/send-admin-welcome'
          let emailType = 'admin_welcome'
          
          if (isReused) {
            emailEndpoint = '/api/email/send-admin-assignment'
            emailType = 'admin_assignment'
          }

          const emailResponse = await fetch(`${emailApiUrl}${emailEndpoint}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: normalizedEmail,
              name: adminName,
              password,
              branchName: branch.branch.name,
              branchCode: branch.branch.code,
            }),
          })

          const emailBody = `Welcome to ${branch.branch?.name || 'the branch'}. Your login credentials: Email: ${normalizedEmail}, Password: ${password}`

          if (emailResponse.ok) {
            await logEmail(
              normalizedEmail,
              isReused ? `Branch Assignment - ${branch.branch.name}` : `Welcome as Branch Admin - ${branch.branch.name}`,
              emailBody,
              emailType,
              'sent'
            )
          } else {
            const errorText = await emailResponse.text()
            await logEmail(
              normalizedEmail,
              isReused ? `Branch Assignment - ${branch.branch.name}` : `Welcome as Branch Admin - ${branch.branch.name}`,
              emailBody,
              emailType,
              'failed',
              errorText
            )
            logger.warn('Failed to send email', new Error('Email API returned error'))
          }
        }
      } catch (emailError) {
        await logEmail(
          normalizedEmail,
          isReused ? `Branch Assignment - ${branch.branch.name}` : `Welcome as Branch Admin - ${branch.branch.name}`,
          '',
          isReused ? 'admin_assignment' : 'admin_welcome',
          'failed',
          emailError instanceof Error ? emailError.message : 'Unknown error'
        )
        logger.warn('Failed to send email', emailError as Error)
        // Don't fail the operation if email fails
      }
    }

    // Log audit trail for admin assignment
    await logBranchAudit(
      branchId,
      isReused ? 'admin_reassigned' : 'admin_assigned',
      null,
      { adminEmail: normalizedEmail, adminName, isReused },
      branch.branch.created_by_id
    )

    logger.info('Admin assigned to branch successfully', { branchId, adminEmail, isReused })
    return { success: true, password, isReused, error: null }
  } catch (error) {
    logger.error('Unexpected error assigning admin', error as Error)
    return {
      success: false,
      password: null,
      isReused: false,
      error: error instanceof Error ? error : new Error('Failed to assign admin'),
    }
  }
}

/**
 * Change branch admin
 */
export async function changeBranchAdmin(
  branchId: string,
  newAdminEmail: string,
  newAdminName: string,
  adminDetails?: {
    phone?: string
    address?: string
    qualifications?: string
    experience?: string
    specialization?: string
  },
  sendEmails: boolean = true
): Promise<{ success: boolean; password: string | null; error: null } | { success: false; password: null; error: Error }> {
  try {
    // Get current branch and admin
    const branch = await getBranchById(branchId)
    if (!branch.branch) {
      return {
        success: false,
        password: null,
        error: new Error('Branch not found'),
      }
    }

    const oldAdmin = branch.branch.admin

    // Remove old admin (set branch_id to null)
    if (oldAdmin) {
      const { supabaseAdmin } = await import('./supabase')
      if (supabaseAdmin) {
        const { error: removeError } = await supabaseAdmin
          .from('profiles')
          .update({ branch_id: null })
          .eq('id', oldAdmin.id)

        if (removeError) {
          logger.warn('Error removing old admin', removeError as Error)
        }

        // Send removal email if requested
        if (sendEmails && oldAdmin.email) {
          try {
            const emailApiUrl = process.env.EXPO_PUBLIC_EMAIL_API_URL
            
            if (!emailApiUrl || emailApiUrl === 'https://your-vercel-app.vercel.app') {
              logger.warn('Email API URL not configured, skipping removal email', {
                email: oldAdmin.email,
                branchId,
              })
              await logEmail(
                oldAdmin.email,
                `Branch Admin Change Notification - ${branch.branch.name}`,
                '',
                'admin_removed',
                'failed',
                'Email API URL not configured. Please set EXPO_PUBLIC_EMAIL_API_URL in environment variables.'
              )
            } else {
              const emailResponse = await fetch(`${emailApiUrl}/api/email/send-admin-removed`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  email: oldAdmin.email,
                  name: oldAdmin.name,
                  branchName: branch.branch.name,
                  branchCode: branch.branch.code,
                }),
              })

              const emailBody = `You have been removed as admin from ${branch.branch?.name || 'the branch'} branch.`
              if (emailResponse.ok) {
                await logEmail(
                  oldAdmin.email,
                  `Branch Admin Change Notification - ${branch.branch.name}`,
                  emailBody,
                  'admin_removed',
                  'sent'
                )
              } else {
                await logEmail(
                  oldAdmin.email,
                  `Branch Admin Change Notification - ${branch.branch.name}`,
                  emailBody,
                  'admin_removed',
                  'failed',
                  await emailResponse.text()
                )
              }
            }
          } catch (emailError) {
            await logEmail(
              oldAdmin.email,
              `Branch Admin Change Notification - ${branch.branch.name}`,
              '',
              'admin_removed',
              'failed',
              emailError instanceof Error ? emailError.message : 'Unknown error'
            )
            logger.warn('Failed to send removal email', emailError as Error)
          }
        }

        // Log audit trail
        await logBranchAudit(
          branchId,
          'admin_removed',
          { adminEmail: oldAdmin.email, adminName: oldAdmin.name },
          null,
          branch.branch.created_by_id
        )
      }
    }

    // Assign new admin (this will create user, profile, and send email)
    const result = await assignAdminToBranch(branchId, newAdminEmail, newAdminName, adminDetails, sendEmails)
    
    if (!result.success) {
      return {
        success: false,
        password: null,
        error: result.error,
      }
    }

    // Success - return with password
    return {
      success: true,
      password: result.password,
      error: null,
    }
  } catch (error) {
    logger.error('Unexpected error changing branch admin', error as Error)
    return {
      success: false,
      password: null,
      error: error instanceof Error ? error : new Error('Failed to change branch admin'),
    }
  }
}

