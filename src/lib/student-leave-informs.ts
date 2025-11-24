import { supabase, supabaseAdmin } from './supabase'
import { logger } from './logger'
import { createNotification } from './admin-notifications'

export interface LeaveInform {
  id: string
  student_id: string
  message: string
  status: 'pending' | 'approved'
  approved_by: string | null
  approved_at: string | null
  created_at: string
  updated_at: string
  student?: {
    first_name: string
    last_name: string
    student_id: string
    student_photo_url: string | null
  } | null
  approver?: {
    email: string
  } | null
}

export interface CreateLeaveInformData {
  message: string
}

/**
 * Create a new leave inform
 */
export async function createLeaveInform(
  studentId: string,
  data: CreateLeaveInformData
): Promise<{ inform: LeaveInform | null; error: null } | { inform: null; error: Error }> {
  try {
    if (!supabaseAdmin) {
      return { inform: null, error: new Error('Service role key not configured') }
    }

    // Validate message length
    if (!data.message || data.message.trim().length < 10) {
      return { inform: null, error: new Error('Message must be at least 10 characters') }
    }

    // Get student info for notification
    const { data: student, error: studentError } = await supabaseAdmin
      .from('students')
      .select('first_name, last_name, student_id, user_id, branch_id')
      .eq('id', studentId)
      .single()

    if (studentError || !student) {
      logger.error('Error fetching student', studentError as Error)
      return { inform: null, error: new Error('Student not found') }
    }

    // Create leave inform
    const { data: inform, error: createError } = await supabaseAdmin
      .from('student_leave_informs')
      .insert({
        student_id: studentId,
        message: data.message.trim(),
        status: 'pending',
      })
      .select()
      .single()

    if (createError || !inform) {
      logger.error('Error creating leave inform', createError as Error)
      return { inform: null, error: new Error(createError?.message || 'Failed to create leave inform') }
    }

    // Note: Admin will see the new inform in their "Student Informs" tab
    // No notification needed as the notification system only sends to students

    logger.info('Leave inform created successfully', { informId: inform.id, studentId })
    return { inform: inform as LeaveInform, error: null }
  } catch (error) {
    logger.error('Unexpected error creating leave inform', error as Error)
    return {
      inform: null,
      error: error instanceof Error ? error : new Error('Failed to create leave inform'),
    }
  }
}

/**
 * Get all leave informs for a student
 */
export async function getStudentLeaveInforms(
  studentId: string
): Promise<{ informs: LeaveInform[]; error: null } | { informs: null; error: Error }> {
  try {
    if (!supabaseAdmin) {
      return { informs: null, error: new Error('Service role key not configured') }
    }

    const { data: informs, error } = await supabaseAdmin
      .from('student_leave_informs')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('Error fetching student leave informs', error as Error)
      return { informs: null, error: new Error(error.message) }
    }

    return { informs: (informs || []) as LeaveInform[], error: null }
  } catch (error) {
    logger.error('Unexpected error fetching student leave informs', error as Error)
    return {
      informs: null,
      error: error instanceof Error ? error : new Error('Failed to fetch leave informs'),
    }
  }
}

/**
 * Get all leave informs (for admin)
 */
export async function getAllLeaveInforms(options?: {
  status?: 'all' | 'pending' | 'approved'
  search?: string
}): Promise<{ informs: LeaveInform[]; error: null } | { informs: null; error: Error }> {
  try {
    if (!supabaseAdmin) {
      return { informs: null, error: new Error('Service role key not configured') }
    }

    let query = supabaseAdmin
      .from('student_leave_informs')
      .select(`
        *,
        student:students!student_leave_informs_student_id_fkey(
          first_name,
          last_name,
          student_id,
          student_photo_url
        ),
        approver:profiles!student_leave_informs_approved_by_fkey(email)
      `)
      .order('created_at', { ascending: false })

    // Filter by status
    if (options?.status && options.status !== 'all') {
      query = query.eq('status', options.status)
    }

    // Search by student name or message
    if (options?.search) {
      const searchTerm = `%${options.search}%`
      query = query.or(`message.ilike.${searchTerm},student.first_name.ilike.${searchTerm},student.last_name.ilike.${searchTerm}`)
    }

    const { data: informs, error } = await query

    if (error) {
      logger.error('Error fetching all leave informs', error as Error)
      return { informs: null, error: new Error(error.message) }
    }

    return { informs: (informs || []) as LeaveInform[], error: null }
  } catch (error) {
    logger.error('Unexpected error fetching all leave informs', error as Error)
    return {
      informs: null,
      error: error instanceof Error ? error : new Error('Failed to fetch leave informs'),
    }
  }
}

/**
 * Get a single leave inform by ID
 */
export async function getLeaveInformById(
  informId: string
): Promise<{ inform: LeaveInform | null; error: null } | { inform: null; error: Error }> {
  try {
    if (!supabaseAdmin) {
      return { inform: null, error: new Error('Service role key not configured') }
    }

    const { data: inform, error } = await supabaseAdmin
      .from('student_leave_informs')
      .select(`
        *,
        student:students!student_leave_informs_student_id_fkey(
          first_name,
          last_name,
          student_id,
          student_photo_url
        ),
        approver:profiles!student_leave_informs_approved_by_fkey(email)
      `)
      .eq('id', informId)
      .single()

    if (error) {
      logger.error('Error fetching leave inform', error as Error)
      return { inform: null, error: new Error(error.message) }
    }

    return { inform: inform as LeaveInform, error: null }
  } catch (error) {
    logger.error('Unexpected error fetching leave inform', error as Error)
    return {
      inform: null,
      error: error instanceof Error ? error : new Error('Failed to fetch leave inform'),
    }
  }
}

/**
 * Approve a leave inform
 */
export async function approveLeaveInform(
  informId: string,
  adminId: string
): Promise<{ success: boolean; error: null } | { success: false; error: Error }> {
  try {
    if (!supabaseAdmin) {
      return { success: false, error: new Error('Service role key not configured') }
    }

    // Get inform with student info
    const { data: inform, error: fetchError } = await supabaseAdmin
      .from('student_leave_informs')
      .select(`
        *,
        student:students!student_leave_informs_student_id_fkey(
          first_name,
          last_name,
          user_id
        )
      `)
      .eq('id', informId)
      .eq('status', 'pending')
      .single()

    if (fetchError || !inform) {
      logger.error('Error fetching leave inform for approval', fetchError as Error)
      return { success: false, error: new Error('Leave inform not found or already processed') }
    }

    // Update inform status
    const { error: updateError } = await supabaseAdmin
      .from('student_leave_informs')
      .update({
        status: 'approved',
        approved_by: adminId,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', informId)
      .eq('status', 'pending') // Only approve if still pending

    if (updateError) {
      logger.error('Error approving leave inform', updateError as Error)
      return { success: false, error: new Error(updateError.message) }
    }

    // Send notification to student if they have a user_id
    const student = inform.student as { first_name: string; last_name: string; user_id: string | null } | null
    if (student?.user_id) {
      try {
        await createNotification(
          {
            title: 'Leave Inform Approved',
            message: 'Your teacher has approved your leave inform.',
            type: 'alert',
            targetType: 'students',
            targetStudentIds: [inform.student_id],
          },
          adminId
        )
      } catch (notifError) {
        // Don't fail the approval if notification fails
        logger.warn('Failed to send notification for approved leave inform', { error: notifError })
      }
    }

    logger.info('Leave inform approved successfully', { informId, adminId })
    return { success: true, error: null }
  } catch (error) {
    logger.error('Unexpected error approving leave inform', error as Error)
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Failed to approve leave inform'),
    }
  }
}

/**
 * Get count of pending leave informs (for admin dashboard)
 */
export async function getPendingInformsCount(): Promise<{ count: number; error: null } | { count: 0; error: Error }> {
  try {
    if (!supabaseAdmin) {
      return { count: 0, error: new Error('Service role key not configured') }
    }

    const { count, error } = await supabaseAdmin
      .from('student_leave_informs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    if (error) {
      logger.error('Error counting pending leave informs', error as Error)
      return { count: 0, error: new Error(error.message) }
    }

    return { count: count || 0, error: null }
  } catch (error) {
    logger.error('Unexpected error counting pending leave informs', error as Error)
    return {
      count: 0,
      error: error instanceof Error ? error : new Error('Failed to count pending informs'),
    }
  }
}

