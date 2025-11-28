import { supabase } from './supabase'
import { logger } from './logger'
import * as FileSystem from 'expo-file-system/legacy'
import { compressImage } from './image-compression'

export interface Student {
  id: string
  student_id: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  branch_id: string
  user_id: string | null
  date_of_birth: string | null
  gender: string | null
  address: string | null
  aadhar_number: string | null
  student_photo_url: string | null
  aadhar_card_url: string | null
  current_belt: string
  parent_name: string | null
  parent_email: string | null
  parent_phone: string | null
  parent_relation: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  emergency_contact_relation: string | null
  medical_conditions: string | null
  notes: string | null
  profile_completed: boolean
  is_active: boolean
  created_by_id: string | null
  created_at: string
  updated_at: string
}

export interface StudentWithBranch extends Student {
  branch?: {
    id: string
    name: string
    code: string | null
  } | null
}

export interface CreateStudentData {
  firstName: string
  lastName: string
  email: string
  branchId: string
  phone?: string
  paymentType?: 'monthly' | 'yearly' // Payment preference for fees
  enrollmentDate?: string // Join/enrollment date for fee calculation
  registrationPaid?: boolean // Whether registration fee is already paid
  currentBelt?: string // Current belt level (defaults to 'White' if not provided)
}

export interface UpdateStudentData {
  firstName?: string
  lastName?: string
  phone?: string
  dateOfBirth?: string
  gender?: string
  address?: string
  aadharNumber?: string
  studentPhotoUrl?: string
  aadharCardUrl?: string
  currentBelt?: string
  parentName?: string
  parentEmail?: string
  parentPhone?: string
  parentRelation?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
  emergencyContactRelation?: string
  medicalConditions?: string
  notes?: string
  profileCompleted?: boolean
}

/**
 * Generate student ID in format: KSC24-0001
 * Includes retry logic to handle race conditions
 */
export async function generateStudentId(maxRetries: number = 3): Promise<string> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const year = new Date().getFullYear().toString().slice(-2) // "24"
      const prefix = `KSC${year}` // "KSC24"

      // Get the latest student ID for this year
      const { data, error } = await supabase
        .from('students')
        .select('student_id')
        .like('student_id', `${prefix}-%`)
        .order('created_at', { ascending: false })
        .limit(1)

      if (error) {
        logger.warn('Error fetching latest student ID', { error: error.message })
        // On last attempt, return fallback
        if (attempt === maxRetries - 1) {
          const timestamp = Date.now().toString().slice(-4)
          return `KSC${year}-${timestamp}`
        }
        continue
      }

      let nextNumber = 1
      if (data && data.length > 0 && data[0].student_id) {
        // Extract number from ID (e.g., "KSC24-0123" -> 123)
        const parts = data[0].student_id.split('-')
        if (parts.length === 2) {
          const lastNumber = parseInt(parts[1])
          if (!isNaN(lastNumber)) {
            nextNumber = lastNumber + 1
          }
        }
      }

      const nextId = `${prefix}-${String(nextNumber).padStart(4, '0')}`

      // Verify ID doesn't already exist (race condition check)
      const { data: existingStudent } = await supabase
        .from('students')
        .select('id')
        .eq('student_id', nextId)
        .maybeSingle()

      if (!existingStudent) {
        // ID is available
        return nextId
      }

      // ID exists, try again with next number
      if (attempt < maxRetries - 1) {
        logger.warn('Student ID collision detected, retrying', { id: nextId, attempt: attempt + 1 })
        // Small delay to avoid tight loop
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    } catch (error) {
      logger.error('Error generating student ID', error as Error)
      // On last attempt, return fallback
      if (attempt === maxRetries - 1) {
        const year = new Date().getFullYear().toString().slice(-2)
        const timestamp = Date.now().toString().slice(-4)
        return `KSC${year}-${timestamp}`
      }
    }
  }

  // Fallback: return timestamp-based ID
  const year = new Date().getFullYear().toString().slice(-2)
  const timestamp = Date.now().toString().slice(-4)
  return `KSC${year}-${timestamp}`
}

/**
 * Generate secure password (10-12 characters)
 */
export function generateSecurePassword(): string {
  const length = 10
  const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ' // Exclude I, O
  const lowercase = 'abcdefghijkmnopqrstuvwxyz' // Exclude l
  const numbers = '23456789' // Exclude 0, 1
  const allChars = uppercase + lowercase + numbers

  let password = ''
  // Ensure at least one of each type
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]

  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }

  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('')
}

/**
 * Create a new student (minimal data - admin creates)
 */
export async function createStudent(
  data: CreateStudentData,
  createdById: string
): Promise<{ student: Student | null; password: string | null; error: null } | { student: null; password: null; error: Error }> {
  try {
    const normalizedEmail = data.email.toLowerCase().trim()

    // Check if service role key is available
    const { supabaseAdmin } = await import('./supabase')
    if (!supabaseAdmin) {
      return {
        student: null,
        password: null,
        error: new Error('Service role key not configured'),
      }
    }

    // Verify creator is super_admin
    const { data: creatorProfile, error: creatorError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('user_id', createdById)
      .single()

    if (creatorError || !creatorProfile) {
      logger.error('Error verifying creator role', creatorError as Error)
      return {
        student: null,
        password: null,
        error: new Error('Failed to verify permissions'),
      }
    }

    if (creatorProfile.role !== 'super_admin') {
      logger.warn('Unauthorized student creation attempt', { createdById, role: creatorProfile.role })
      return {
        student: null,
        password: null,
        error: new Error('Only super admins can create students'),
      }
    }

    // Validate branch exists and is active
    const { data: branchData, error: branchError } = await supabaseAdmin
      .from('branches')
      .select('id, name, status')
      .eq('id', data.branchId)
      .single()

    if (branchError || !branchData) {
      logger.error('Error validating branch', branchError as Error)
      return {
        student: null,
        password: null,
        error: new Error('Branch not found or invalid'),
      }
    }

    if (branchData.status !== 'active') {
      return {
        student: null,
        password: null,
        error: new Error('Cannot create student for inactive branch'),
      }
    }

    // Check if email already exists
    const { data: existingStudent } = await supabaseAdmin
      .from('students')
      .select('id, email, student_id')
      .eq('email', normalizedEmail)
      .maybeSingle()

    if (existingStudent) {
      logger.warn('Duplicate email detected', { email: normalizedEmail })
      return {
        student: null,
        password: null,
        error: new Error('A student with this email already exists'),
      }
    }

    // Check if auth user already exists
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = users?.find((u: any) => u.email === normalizedEmail)
    if (existingUser) {
      logger.warn('Auth user already exists for email', { email: normalizedEmail })
      return {
        student: null,
        password: null,
        error: new Error('An account with this email already exists'),
      }
    }

    // Generate student ID
    const studentId = await generateStudentId()

    // Generate password
    const password = generateSecurePassword()

    // Create auth user in Supabase
    const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true, // Auto-confirm so they can login immediately
    })

    if (createUserError || !newUser?.user) {
      logger.error('Error creating auth user', createUserError)
      return {
        student: null,
        password: null,
        error: new Error(createUserError?.message || 'Failed to create auth user'),
      }
    }

    const userId = newUser.user.id

    // Create profile for student
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        user_id: userId,
        role: 'student',
        email: normalizedEmail,
      })

    if (profileError) {
      // Cleanup: delete auth user if profile creation fails
      logger.error('Error creating profile, cleaning up auth user', profileError as Error)
      await supabaseAdmin.auth.admin.deleteUser(userId).catch(() => {
        // Ignore cleanup errors
      })
      return {
        student: null,
        password: null,
        error: new Error('Failed to create profile: ' + profileError.message),
      }
    }

    // Create student record
    const { data: studentData, error: studentError } = await supabaseAdmin
      .from('students')
      .insert({
        student_id: studentId,
        first_name: data.firstName.trim(),
        last_name: data.lastName.trim(),
        email: normalizedEmail,
        phone: data.phone?.trim() || null,
        branch_id: data.branchId,
        user_id: userId,
        current_belt: data.currentBelt || 'White',
        profile_completed: false,
        is_active: true,
        created_by_id: createdById,
      })
      .select()
      .single()

    if (studentError) {
      // Cleanup: delete auth user and profile if student creation fails
      logger.error('Error creating student, cleaning up', studentError as Error)
      await supabaseAdmin.auth.admin.deleteUser(userId).catch(() => {})
      Promise.resolve(supabaseAdmin.from('profiles').delete().eq('user_id', userId)).catch(() => {})
      
      // Check if it's a duplicate student_id error and retry
      if (studentError.code === '23505' || studentError.message.includes('duplicate') || studentError.message.includes('unique')) {
        // Retry with new student ID
        const retryStudentId = await generateStudentId()
        const { data: retryData, error: retryError } = await supabaseAdmin
          .from('students')
          .insert({
            student_id: retryStudentId,
            first_name: data.firstName.trim(),
            last_name: data.lastName.trim(),
            email: normalizedEmail,
            phone: data.phone?.trim() || null,
            branch_id: data.branchId,
            user_id: userId,
            current_belt: data.currentBelt || 'White',
            profile_completed: false,
            is_active: true,
            created_by_id: createdById,
          })
          .select()
          .single()

        if (retryError) {
          logger.error('Error creating student on retry', retryError as Error)
          return {
            student: null,
            password: null,
            error: new Error('Failed to create student: ' + retryError.message),
          }
        }

        // Send welcome email for retry
        try {
          const emailApiUrl = process.env.EXPO_PUBLIC_EMAIL_API_URL
          if (emailApiUrl && emailApiUrl !== 'https://your-vercel-app.vercel.app') {
            const emailResponse = await fetch(`${emailApiUrl}/api/email/send-student-welcome`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                email: normalizedEmail,
                name: `${data.firstName} ${data.lastName}`,
                studentId: retryStudentId,
                password,
                branchName: branchData.name,
              }),
            })

            if (!emailResponse.ok) {
              logger.warn('Failed to send welcome email', new Error('Email API returned error'))
            }
          }
        } catch (emailError) {
          logger.warn('Failed to send welcome email', emailError as Error)
        }

        // Initialize fees if payment type is provided
        if (data.paymentType) {
          try {
            const { initializeStudentFees } = await import('./fees')
            const enrollmentDate = data.enrollmentDate || new Date().toISOString().split('T')[0]
            await initializeStudentFees(retryData.id, data.paymentType, enrollmentDate)
            
            // Mark registration fee as paid if already paid
            if (data.registrationPaid) {
              const { supabaseAdmin } = await import('./supabase')
              if (supabaseAdmin) {
                // Find the registration fee and mark it as paid
                const { data: regFee } = await supabaseAdmin
                  .from('student_fees')
                  .select('id, amount')
                  .eq('student_id', retryData.id)
                  .eq('fee_type', 'registration')
                  .maybeSingle()
                
                if (regFee) {
                  await supabaseAdmin
                    .from('student_fees')
                    .update({
                      status: 'paid',
                      paid_amount: regFee.amount,
                      paid_at: new Date(enrollmentDate).toISOString(),
                    })
                    .eq('id', regFee.id)
                  logger.info('Registration fee marked as paid (after retry)', { studentId: retryData.id })
                }
              }
            }
            
            logger.info('Student fees initialized (after retry)', { studentId: retryData.id, paymentType: data.paymentType })
          } catch (feeError) {
            logger.error('Error initializing student fees (after retry)', feeError as Error)
          }
        }

        logger.info('Student created successfully (after retry)', { studentId: retryStudentId, email: normalizedEmail })
        return { student: retryData as Student, password, error: null }
      }
      
      return {
        student: null,
        password: null,
        error: new Error('Failed to create student: ' + studentError.message),
      }
    }

    // Send welcome email
    try {
      const emailApiUrl = process.env.EXPO_PUBLIC_EMAIL_API_URL
      
      if (!emailApiUrl || emailApiUrl === 'https://your-vercel-app.vercel.app') {
        logger.warn('Email API URL not configured, skipping welcome email', {
          email: normalizedEmail,
          studentId,
        })
      } else {
        const emailResponse = await fetch(`${emailApiUrl}/api/email/send-student-welcome`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: normalizedEmail,
            name: `${data.firstName} ${data.lastName}`,
            studentId,
            password,
            branchName: branchData.name,
          }),
        })

        if (!emailResponse.ok) {
          logger.warn('Failed to send welcome email', new Error('Email API returned error'))
        }
      }
    } catch (emailError) {
      logger.warn('Failed to send welcome email', emailError as Error)
      // Don't fail the operation if email fails
    }

    // Initialize fees if payment type is provided
    if (data.paymentType) {
      try {
        const { initializeStudentFees } = await import('./fees')
        const enrollmentDate = data.enrollmentDate || new Date().toISOString().split('T')[0]
        await initializeStudentFees(studentData.id, data.paymentType, enrollmentDate)
        
        // Mark registration fee as paid if already paid
        if (data.registrationPaid) {
          const { supabaseAdmin } = await import('./supabase')
          if (supabaseAdmin) {
            // Find the registration fee and mark it as paid
            const { data: regFee } = await supabaseAdmin
              .from('student_fees')
              .select('id, amount')
              .eq('student_id', studentData.id)
              .eq('fee_type', 'registration')
              .maybeSingle()
            
            if (regFee) {
              await supabaseAdmin
                .from('student_fees')
                .update({
                  status: 'paid',
                  paid_amount: regFee.amount,
                  paid_at: new Date(enrollmentDate).toISOString(),
                })
                .eq('id', regFee.id)
              logger.info('Registration fee marked as paid', { studentId: studentData.id })
            }
          }
        }
        
        logger.info('Student fees initialized', { studentId: studentData.id, paymentType: data.paymentType })
      } catch (feeError) {
        // Log but don't fail student creation if fee initialization fails
        logger.error('Error initializing student fees', feeError as Error)
      }
    }

    logger.info('Student created successfully', { studentId, email: normalizedEmail })
    return { student: studentData as Student, password, error: null }
  } catch (error) {
    logger.error('Unexpected error creating student', error as Error)
    return {
      student: null,
      password: null,
      error: error instanceof Error ? error : new Error('Failed to create student'),
    }
  }
}

/**
 * Get all students with optional filters
 */
export async function getStudents(options?: {
  search?: string
  branchId?: string
  belt?: string
  status?: 'all' | 'active' | 'inactive'
  page?: number
  limit?: number
}): Promise<{ students: Student[]; total: number; error: null } | { students: null; total: 0; error: Error }> {
  try {
    let query = supabase
      .from('students')
      .select('*', { count: 'exact' })

    // Apply search filter
    if (options?.search && options.search.trim()) {
      const searchTerm = options.search.trim()
      query = query.or(
        `first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,student_id.ilike.%${searchTerm}%`
      )
    }

    // Apply branch filter
    if (options?.branchId) {
      query = query.eq('branch_id', options.branchId)
    }

    // Apply belt filter
    if (options?.belt) {
      query = query.eq('current_belt', options.belt)
    }

    // Apply status filter
    if (options?.status && options.status !== 'all') {
      query = query.eq('is_active', options.status === 'active')
    }

    // Apply pagination
    const limit = options?.limit || 20
    const page = options?.page || 1
    const offset = (page - 1) * limit

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      logger.error('Error fetching students', error as Error)
      return { students: null, total: 0, error: new Error(error.message) }
    }

    return { students: (data as Student[]) || [], total: count || 0, error: null }
  } catch (error) {
    logger.error('Unexpected error fetching students', error as Error)
    return {
      students: null,
      total: 0,
      error: error instanceof Error ? error : new Error('Failed to fetch students'),
    }
  }
}

/**
 * Get student by ID
 */
export async function getStudentById(
  studentId: string
): Promise<{ student: StudentWithBranch | null; error: null } | { student: null; error: Error }> {
  try {
    const { data, error } = await supabase
      .from('students')
      .select(`
        *,
        branch:branches(id, name, code)
      `)
      .eq('id', studentId)
      .single()

    if (error) {
      logger.error('Error fetching student', error as Error)
      return { student: null, error: new Error(error.message) }
    }

    return { student: data as StudentWithBranch, error: null }
  } catch (error) {
    logger.error('Unexpected error fetching student', error as Error)
    return {
      student: null,
      error: error instanceof Error ? error : new Error('Failed to fetch student'),
    }
  }
}

/**
 * Get student by user ID (for student's own profile)
 */
export async function getStudentByUserId(
  userId: string
): Promise<{ student: StudentWithBranch | null; error: null } | { student: null; error: Error }> {
  try {
    const { data, error } = await supabase
      .from('students')
      .select(`
        *,
        branch:branches(id, name, code)
      `)
      .eq('user_id', userId)
      .single()

    if (error) {
      logger.error('Error fetching student by user ID', error as Error)
      return { student: null, error: new Error(error.message) }
    }

    return { student: data as StudentWithBranch, error: null }
  } catch (error) {
    logger.error('Unexpected error fetching student by user ID', error as Error)
    return {
      student: null,
      error: error instanceof Error ? error : new Error('Failed to fetch student'),
    }
  }
}

/**
 * Update student
 */
export async function updateStudent(
  studentId: string,
  updates: UpdateStudentData,
  updatedBy?: string
): Promise<{ student: Student | null; error: null } | { student: null; error: Error }> {
  try {
    const updateData: any = {}
    
    if (updates.firstName !== undefined) updateData.first_name = updates.firstName.trim()
    if (updates.lastName !== undefined) updateData.last_name = updates.lastName.trim()
    if (updates.phone !== undefined) updateData.phone = updates.phone?.trim() || null
    if (updates.dateOfBirth !== undefined) updateData.date_of_birth = updates.dateOfBirth || null
    if (updates.gender !== undefined) updateData.gender = updates.gender || null
    if (updates.address !== undefined) updateData.address = updates.address?.trim() || null
    if (updates.aadharNumber !== undefined) updateData.aadhar_number = updates.aadharNumber?.trim() || null
    if (updates.studentPhotoUrl !== undefined) updateData.student_photo_url = updates.studentPhotoUrl || null
    if (updates.aadharCardUrl !== undefined) updateData.aadhar_card_url = updates.aadharCardUrl || null
    if (updates.currentBelt !== undefined) updateData.current_belt = updates.currentBelt
    if (updates.parentName !== undefined) updateData.parent_name = updates.parentName?.trim() || null
    if (updates.parentEmail !== undefined) updateData.parent_email = updates.parentEmail?.trim() || null
    if (updates.parentPhone !== undefined) updateData.parent_phone = updates.parentPhone?.trim() || null
    if (updates.parentRelation !== undefined) updateData.parent_relation = updates.parentRelation || null
    if (updates.emergencyContactName !== undefined) updateData.emergency_contact_name = updates.emergencyContactName?.trim() || null
    if (updates.emergencyContactPhone !== undefined) updateData.emergency_contact_phone = updates.emergencyContactPhone?.trim() || null
    if (updates.emergencyContactRelation !== undefined) updateData.emergency_contact_relation = updates.emergencyContactRelation || null
    if (updates.medicalConditions !== undefined) updateData.medical_conditions = updates.medicalConditions?.trim() || null
    if (updates.notes !== undefined) updateData.notes = updates.notes?.trim() || null
    if (updates.profileCompleted !== undefined) updateData.profile_completed = updates.profileCompleted

    const { data, error } = await supabase
      .from('students')
      .update(updateData)
      .eq('id', studentId)
      .select()
      .single()

    if (error) {
      logger.error('Error updating student', error as Error)
      return { student: null, error: new Error(error.message) }
    }

    logger.info('Student updated successfully', { studentId })
    return { student: data as Student, error: null }
  } catch (error) {
    logger.error('Unexpected error updating student', error as Error)
    return {
      student: null,
      error: error instanceof Error ? error : new Error('Failed to update student'),
    }
  }
}

/**
 * Delete student (soft or hard delete)
 */
export async function deleteStudent(
  studentId: string,
  hardDelete: boolean = false,
  deletedBy: string
): Promise<{ success: boolean; error: null } | { success: false; error: Error }> {
  try {
    const { supabaseAdmin } = await import('./supabase')
    if (!supabaseAdmin) {
      return {
        success: false,
        error: new Error('Service role key not configured'),
      }
    }

    // Verify deleter is super_admin
    const { data: deleterProfile, error: deleterError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('user_id', deletedBy)
      .single()

    if (deleterError || !deleterProfile) {
      logger.error('Error verifying deleter role', deleterError as Error)
      return {
        success: false,
        error: new Error('Failed to verify permissions'),
      }
    }

    if (deleterProfile.role !== 'super_admin') {
      logger.warn('Unauthorized student deletion attempt', { deletedBy, role: deleterProfile.role })
      return {
        success: false,
        error: new Error('Only super admins can delete students'),
      }
    }

    // Get student info for cleanup
    const student = await getStudentById(studentId)
    if (!student.student) {
      return {
        success: false,
        error: new Error('Student not found'),
      }
    }

    if (hardDelete) {
      // Hard delete: Remove everything
      // IMPORTANT: Order matters due to foreign key constraints
      // 1. Delete student record FIRST (cascades to attendance, fees, leave informs, etc.)
      // 2. Validate and delete profile (check for RESTRICT constraints)
      // 3. Delete auth user (cascades to profile if still exists)
      // 4. Delete storage files (non-critical, can fail)

      const userId = student.student.user_id
      let studentDeleted = false
      let profileDeleted = false
      let authUserDeleted = false

      try {
        // Step 1: Delete student record FIRST
        // This will cascade delete: attendance_records, student_fees, fee_payments, 
        // belt_gradings, student_leave_informs, password_reset_tokens
        const { error: studentError } = await supabaseAdmin
          .from('students')
          .delete()
          .eq('id', studentId)

        if (studentError) {
          logger.error('Error deleting student record', studentError as Error)
          return { success: false, error: new Error(`Failed to delete student: ${studentError.message}`) }
        }

        studentDeleted = true
        logger.info('Student record deleted successfully', { studentId })

        // Step 2: Validate and delete profile
        // Check for RESTRICT constraints (attendance_records.marked_by)
        if (userId) {
          // Check if profile is referenced by attendance records
          const { count: attendanceCount, error: countError } = await supabaseAdmin
            .from('attendance_records')
            .select('*', { count: 'exact', head: true })
            .eq('marked_by', userId)

          if (countError) {
            logger.warn('Error checking attendance records for profile', { userId, error: countError })
            // Continue anyway - will try to delete
          } else if (attendanceCount && attendanceCount > 0) {
            // Profile is referenced by attendance records from other students
            // This shouldn't happen for students, but could for admins who became students
            logger.warn('Profile is referenced by attendance records', {
              userId,
              count: attendanceCount,
              message: 'Profile deletion may fail due to RESTRICT constraint'
            })
            
            // Try to delete anyway - if it fails, auth user deletion will handle it via CASCADE
            try {
              const { error: profileError } = await supabaseAdmin
                .from('profiles')
                .delete()
                .eq('user_id', userId)

              if (profileError) {
                logger.warn('Profile deletion failed (expected due to RESTRICT constraint)', {
                  userId,
                  error: profileError,
                  message: 'Will be handled by auth user CASCADE deletion'
                })
                // Don't fail - auth user deletion will cascade delete it
              } else {
                profileDeleted = true
                logger.info('Profile deleted successfully', { userId })
              }
            } catch (profileError) {
              logger.warn('Exception during profile deletion', {
                userId,
                error: profileError instanceof Error ? profileError : new Error(String(profileError))
              })
              // Continue - auth user deletion will handle it
            }
          } else {
            // Safe to delete profile - no attendance records reference it
            try {
              const { error: profileError } = await supabaseAdmin
                .from('profiles')
                .delete()
                .eq('user_id', userId)

              if (profileError) {
                logger.error('Error deleting profile', profileError as Error)
                // Don't fail yet - try auth user deletion which will cascade
              } else {
                profileDeleted = true
                logger.info('Profile deleted successfully', { userId })
              }
            } catch (profileError) {
              logger.error('Exception during profile deletion', {
                userId,
                error: profileError instanceof Error ? profileError : new Error(String(profileError))
              })
              // Continue - auth user deletion will handle it
            }
          }

          // Step 3: Delete auth user
          // This will CASCADE delete profile if it still exists
          try {
            await supabaseAdmin.auth.admin.deleteUser(userId)
            authUserDeleted = true
            logger.info('Auth user deleted successfully', { userId })
            
            // If profile wasn't deleted before, it's now deleted via CASCADE
            if (!profileDeleted) {
              logger.info('Profile deleted via CASCADE from auth user deletion', { userId })
            }
          } catch (authError) {
            logger.error('Error deleting auth user', {
              userId,
              error: authError instanceof Error ? authError : new Error(String(authError))
            })
            // This is critical - return error
            return {
              success: false,
              error: new Error(`Failed to delete authentication user: ${authError instanceof Error ? authError.message : String(authError)}`)
            }
          }
        }

        // Step 4: Delete storage files (non-critical, can fail without affecting deletion)
        const filesToDelete: string[] = []
        
        if (student.student.student_photo_url) {
          // Extract file path from URL
          // URL format: https://project.supabase.co/storage/v1/object/public/student-documents/photos/{studentId}/file.jpg
          const url = student.student.student_photo_url
          const match = url.match(/\/student-documents\/(.+)$/)
          if (match && match[1]) {
            filesToDelete.push(match[1])
          }
        }
        
        if (student.student.aadhar_card_url) {
          // Extract file path from URL
          const url = student.student.aadhar_card_url
          const match = url.match(/\/student-documents\/(.+)$/)
          if (match && match[1]) {
            filesToDelete.push(match[1])
          }
        }

        // Delete files from storage (non-blocking - failure doesn't affect deletion success)
        if (filesToDelete.length > 0) {
          try {
            await supabaseAdmin.storage.from('student-documents').remove(filesToDelete)
            logger.info('Deleted student files from storage', { studentId, files: filesToDelete.length })
          } catch (storageError) {
            // Log but don't fail - file deletion is optional
            logger.warn('Failed to delete student files from storage (non-critical)', {
              studentId,
              files: filesToDelete.length,
              error: storageError instanceof Error ? storageError : new Error(String(storageError))
            })
          }
        }

        // Success - all critical deletions completed
        logger.info('Student hard delete completed successfully', {
          studentId,
          userId,
          studentDeleted,
          profileDeleted: profileDeleted || (userId && authUserDeleted), // Profile deleted either directly or via CASCADE
          authUserDeleted
        })

        return { success: true, error: null }
      } catch (error) {
        // Unexpected error during deletion process
        logger.error('Unexpected error during hard delete', {
          studentId,
          userId,
          studentDeleted,
          profileDeleted,
          authUserDeleted,
          error: error instanceof Error ? error : new Error(String(error))
        })

        // If student was deleted but profile/auth user deletion failed, we have partial deletion
        if (studentDeleted && (!profileDeleted || !authUserDeleted)) {
          return {
            success: false,
            error: new Error('Partial deletion occurred. Student record deleted but profile/auth user deletion failed. Manual cleanup may be required.')
          }
        }

        return {
          success: false,
          error: error instanceof Error ? error : new Error('Failed to delete student')
        }
      }
    } else {
      // Soft delete: Set is_active = false
      const { error } = await supabaseAdmin
        .from('students')
        .update({ is_active: false })
        .eq('id', studentId)

      if (error) {
        logger.error('Error soft deleting student', error as Error)
        return { success: false, error: new Error(error.message) }
      }
    }

    logger.info('Student deleted successfully', { studentId, hardDelete })
    return { success: true, error: null }
  } catch (error) {
    logger.error('Unexpected error deleting student', error as Error)
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Failed to delete student'),
    }
  }
}

/**
 * Reactivate a student (set is_active = true)
 */
export async function reactivateStudent(
  studentId: string,
  reactivatedBy: string
): Promise<{ success: boolean; error: null } | { success: false; error: Error }> {
  try {
    const { supabaseAdmin } = await import('./supabase')
    if (!supabaseAdmin) {
      return {
        success: false,
        error: new Error('Service role key not configured'),
      }
    }

    // Check if student exists
    const student = await getStudentById(studentId)
    if (!student.student) {
      return {
        success: false,
        error: new Error('Student not found'),
      }
    }

    // Update is_active to true
    const { error } = await supabaseAdmin
      .from('students')
      .update({ is_active: true })
      .eq('id', studentId)

    if (error) {
      logger.error('Error reactivating student', error as Error)
      return { success: false, error: new Error(error.message) }
    }

    logger.info('Student reactivated successfully', { studentId, reactivatedBy })
    return { success: true, error: null }
  } catch (error) {
    logger.error('Unexpected error reactivating student', error as Error)
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Failed to reactivate student'),
    }
  }
}

/**
 * Get student statistics
 */
export async function getStudentStatistics(branchId?: string): Promise<{
  total: number
  active: number
  inactive: number
  profileCompleted: number
  profileIncomplete: number
  error: null
} | {
  total: 0
  active: 0
  inactive: 0
  profileCompleted: 0
  profileIncomplete: 0
  error: Error
}> {
  try {
    let query = supabase.from('students').select('id, is_active, profile_completed', { count: 'exact' })

    if (branchId) {
      query = query.eq('branch_id', branchId)
    }

    const { data, error, count } = await query

    if (error) {
      logger.error('Error fetching student statistics', error as Error)
      return {
        total: 0,
        active: 0,
        inactive: 0,
        profileCompleted: 0,
        profileIncomplete: 0,
        error: new Error(error.message),
      }
    }

    const students = data || []
    const total = count || 0
    const active = students.filter((s) => s.is_active).length
    const inactive = total - active
    const profileCompleted = students.filter((s) => s.profile_completed).length
    const profileIncomplete = total - profileCompleted

    return {
      total,
      active,
      inactive,
      profileCompleted,
      profileIncomplete,
      error: null,
    }
  } catch (error) {
    logger.error('Unexpected error fetching student statistics', error as Error)
    return {
      total: 0,
      active: 0,
      inactive: 0,
      profileCompleted: 0,
      profileIncomplete: 0,
      error: error instanceof Error ? error : new Error('Failed to fetch statistics'),
    }
  }
}

/**
 * Upload student photo to Supabase Storage
 */
export async function uploadStudentPhoto(
  imageUri: string,
  studentId: string
): Promise<{ url: string | null; error: Error | null }> {
  try {
    const { supabaseAdmin } = await import('./supabase')
    if (!supabaseAdmin) {
      return { url: null, error: new Error('Service role key not configured') }
    }

    // Check if storage bucket exists (use admin for check)
    const { data: buckets, error: bucketError } = await supabaseAdmin.storage.listBuckets()
    if (bucketError) {
      logger.error('Error checking storage buckets', bucketError as Error)
      return { url: null, error: new Error('Failed to access storage') }
    }

    const bucketExists = buckets?.some((b) => b.id === 'student-documents')
    if (!bucketExists) {
      return { 
        url: null, 
        error: new Error(
          'Storage bucket "student-documents" not found. Please create it in Supabase Dashboard → Storage.'
        ) 
      }
    }

    // Compress image before upload
    logger.info('Compressing student photo before upload...')
    const { uri: compressedUri, size: compressedSize, originalSize } = await compressImage(imageUri, 'profile')
    logger.info('Student photo compressed', {
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

    // Generate unique filename
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 9)
    const filename = `photos/${studentId}/${timestamp}_${random}.jpg`
    const filePath = filename

    // Upload to Supabase Storage (use regular supabase client for RLS)
    const { data: uploadData, error } = await supabase.storage
      .from('student-documents')
      .upload(filePath, bytes.buffer, {
        contentType: 'image/jpeg',
        upsert: false,
      })

    if (error) {
      logger.error('Error uploading student photo', error as Error)
      return { url: null, error: new Error(error.message) }
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('student-documents')
      .getPublicUrl(filePath)

    if (!urlData?.publicUrl) {
      return { url: null, error: new Error('Failed to get image URL') }
    }

    logger.info('Student photo uploaded successfully', { studentId, url: urlData.publicUrl })
    return { url: urlData.publicUrl, error: null }
  } catch (error) {
    logger.error('Unexpected error uploading student photo', error as Error)
    return { url: null, error: error instanceof Error ? error : new Error('Failed to upload photo') }
  }
}

/**
 * Upload Aadhar card to Supabase Storage
 */
export async function uploadAadharCard(
  imageUri: string,
  studentId: string
): Promise<{ url: string | null; error: Error | null }> {
  try {
    const { supabaseAdmin } = await import('./supabase')
    if (!supabaseAdmin) {
      return { url: null, error: new Error('Service role key not configured') }
    }

    // Check if storage bucket exists (use admin for check)
    const { data: buckets, error: bucketError } = await supabaseAdmin.storage.listBuckets()
    if (bucketError) {
      logger.error('Error checking storage buckets', bucketError as Error)
      return { url: null, error: new Error('Failed to access storage') }
    }

    const bucketExists = buckets?.some((b) => b.id === 'student-documents')
    if (!bucketExists) {
      return { 
        url: null, 
        error: new Error(
          'Storage bucket "student-documents" not found. Please create it in Supabase Dashboard → Storage.'
        ) 
      }
    }

    // Compress image before upload (document type for Aadhar cards)
    logger.info('Compressing Aadhar card before upload...')
    const { uri: compressedUri, size: compressedSize, originalSize } = await compressImage(imageUri, 'document')
    logger.info('Aadhar card compressed', {
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

    // Generate unique filename
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 9)
    const filename = `aadhar/${studentId}/${timestamp}_${random}.jpg`
    const filePath = filename

    // Upload to Supabase Storage (use regular supabase client for RLS)
    const { data: uploadData, error } = await supabase.storage
      .from('student-documents')
      .upload(filePath, bytes.buffer, {
        contentType: 'image/jpeg',
        upsert: false,
      })

    if (error) {
      logger.error('Error uploading Aadhar card', error as Error)
      return { url: null, error: new Error(error.message) }
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('student-documents')
      .getPublicUrl(filePath)

    if (!urlData?.publicUrl) {
      return { url: null, error: new Error('Failed to get image URL') }
    }

    logger.info('Aadhar card uploaded successfully', { studentId, url: urlData.publicUrl })
    return { url: urlData.publicUrl, error: null }
  } catch (error) {
    logger.error('Unexpected error uploading Aadhar card', error as Error)
    return { url: null, error: error instanceof Error ? error : new Error('Failed to upload Aadhar card') }
  }
}

