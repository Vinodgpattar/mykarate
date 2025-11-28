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

    // Get student info and validate active status
    const { data: student, error: studentError } = await supabaseAdmin
      .from('students')
      .select('first_name, last_name, student_id, user_id, branch_id, is_active')
      .eq('id', studentId)
      .single()

    if (studentError || !student) {
      logger.error('Error fetching student', studentError as Error)
      return { inform: null, error: new Error('Student not found') }
    }

    // Validate student is active
    if (!student.is_active) {
      logger.warn('Inactive student attempted to create leave inform', { studentId })
      return { inform: null, error: new Error('Only active students can create leave informs') }
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

    // Create notification for admins about the new leave inform
    try {
      // Get all admin user IDs (super admins and branch admins)
      const { data: adminProfiles } = await supabaseAdmin
        .from('profiles')
        .select('user_id, branch_id, role')
        .in('role', ['super_admin', 'admin'])

      if (adminProfiles && adminProfiles.length > 0) {
        // Determine which admins should be notified
        let targetAdminIds: string[] = []
        
        if (student.branch_id) {
          // Notify branch admins for this branch + super admins
          const branchAdmins = adminProfiles
            .filter((p: any) => p.role === 'super_admin' || p.branch_id === student.branch_id)
            .map((p: any) => p.user_id)
          targetAdminIds = branchAdmins
        } else {
          // Notify all admins if student has no branch
          targetAdminIds = adminProfiles.map((p: any) => p.user_id)
        }

        // Get admin user IDs that have push tokens registered
        const { data: adminTokens } = await supabaseAdmin
          .from('user_push_tokens')
          .select('user_id')
          .in('user_id', targetAdminIds)

        const adminUserIdsWithTokens = adminTokens?.map((t: any) => t.user_id) || []

        // Create notification record in notifications table
        const notificationData: any = {
          title: 'New Leave Inform',
          message: `${student.first_name} ${student.last_name} (${student.student_id}) has informed about leave`,
          type: 'system',
          created_by: student.user_id || targetAdminIds[0], // Use student's user_id or first admin as fallback
          target_type: 'all', // System notification
          target_branch_id: null,
          target_student_ids: null,
          sent_at: new Date().toISOString(),
          total_sent: adminUserIdsWithTokens.length,
          read_count: 0,
        }

        const { data: notification, error: notifError } = await supabaseAdmin
          .from('notifications')
          .insert(notificationData)
          .select()
          .single()

        if (!notifError && notification) {
          // Create recipient records for admins
          const recipientRecords = adminUserIdsWithTokens.map((userId: string) => ({
            notification_id: notification.id,
            user_id: userId,
            read: false,
            push_sent: false,
          }))

          await supabaseAdmin.from('notification_recipients').insert(recipientRecords)

          // Send push notifications to admins
          if (adminUserIdsWithTokens.length > 0) {
            const { data: pushTokens } = await supabaseAdmin
              .from('user_push_tokens')
              .select('user_id, token')
              .in('user_id', adminUserIdsWithTokens)

            if (pushTokens && pushTokens.length > 0) {
              const tokens = pushTokens.map((pt: any) => pt.token).filter(Boolean)
              
              if (tokens.length > 0) {
                const { sendExpoPushNotification } = await import('./admin-notifications')
                await sendExpoPushNotification(
                  tokens,
                  'New Leave Inform',
                  `${student.first_name} ${student.last_name} informed about leave`,
                  {
                    notificationId: notification.id,
                    type: 'system',
                    leaveInformId: inform.id,
                  }
                )

                // Update push_sent status for successful sends
                const { data: updatedRecipients } = await supabaseAdmin
                  .from('notification_recipients')
                  .update({ push_sent: true, push_sent_at: new Date().toISOString() })
                  .eq('notification_id', notification.id)
                  .in('user_id', adminUserIdsWithTokens)
                  .select()
              }
            }
          }

          logger.info('Created notification for leave inform', { informId: inform.id, notificationId: notification.id })
        } else {
          logger.warn('Failed to create notification for leave inform', { error: notifError })
        }
      }
    } catch (notifError) {
      // Don't fail the leave inform creation if notification fails
      logger.warn('Error creating notification for leave inform', { error: notifError })
    }

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

    // Note: Search by student name requires client-side filtering
    // Supabase doesn't support nested field search with .or() in this way
    const { data: informs, error } = await query

    if (error) {
      logger.error('Error fetching all leave informs', error as Error)
      return { informs: null, error: new Error(error.message) }
    }

    // Apply search filter client-side (for student name and message)
    let filteredInforms = informs || []
    if (options?.search && filteredInforms.length > 0) {
      const searchTerm = options.search.toLowerCase()
      filteredInforms = filteredInforms.filter((inform: any) => {
        const message = (inform.message || '').toLowerCase()
        const firstName = (inform.student?.first_name || '').toLowerCase()
        const lastName = (inform.student?.last_name || '').toLowerCase()
        const fullName = `${firstName} ${lastName}`.trim()
        return (
          message.includes(searchTerm) ||
          firstName.includes(searchTerm) ||
          lastName.includes(searchTerm) ||
          fullName.includes(searchTerm)
        )
      })
    }

    return { informs: (filteredInforms || []) as LeaveInform[], error: null }
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

    // Verify admin has permission to approve
    const { getProfileByUserId } = await import('./profiles')
    const adminProfileResult = await getProfileByUserId(adminId)
    if (adminProfileResult.error || !adminProfileResult.profile) {
      logger.error('Error verifying admin profile', adminProfileResult.error || new Error('Profile not found'))
      return { success: false, error: new Error('Failed to verify admin permissions') }
    }

    const adminProfile = adminProfileResult.profile
    if (adminProfile.role !== 'super_admin' && adminProfile.role !== 'admin') {
      logger.error('Unauthorized approval attempt', new Error(`User ${adminId} is not an admin`))
      return { success: false, error: new Error('Only admins can approve leave informs') }
    }

    // Get inform with student info
    const { data: inform, error: fetchError } = await supabaseAdmin
      .from('student_leave_informs')
      .select(`
        *,
        student:students!student_leave_informs_student_id_fkey(
          first_name,
          last_name,
          user_id,
          branch_id
        )
      `)
      .eq('id', informId)
      .eq('status', 'pending')
      .single()

    if (fetchError || !inform) {
      logger.error('Error fetching leave inform for approval', fetchError as Error)
      return { success: false, error: new Error('Leave inform not found or already processed') }
    }

    // Validate branch admin can only approve their branch students
    if (adminProfile.role === 'admin') {
      const student = inform.student as { branch_id: string | null } | null
      if (!adminProfile.branchId || student?.branch_id !== adminProfile.branchId) {
        logger.error('Branch admin attempted to approve inform from different branch', {
          adminBranchId: adminProfile.branchId,
          studentBranchId: student?.branch_id,
        })
        return { success: false, error: new Error('You can only approve leave informs for students in your branch') }
      }
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
    const student = inform.student as { first_name: string; last_name: string; user_id: string | null; student_id?: string } | null
    if (student?.user_id) {
      try {
        const notificationResult = await createNotification(
          {
            title: 'Leave Inform Approved',
            message: `Your leave inform has been approved by your teacher.`,
            type: 'alert',
            targetType: 'students',
            targetStudentIds: [inform.student_id],
          },
          adminId
        )

        if (notificationResult.error) {
          logger.warn('Failed to create notification for approved leave inform', { 
            error: notificationResult.error,
            informId,
            studentId: inform.student_id 
          })
        } else {
          logger.info('Notification sent for approved leave inform', { 
            notificationId: notificationResult.notification?.id,
            informId,
            studentId: inform.student_id 
          })
        }
      } catch (notifError) {
        // Don't fail the approval if notification fails
        logger.warn('Failed to send notification for approved leave inform', { 
          error: notifError instanceof Error ? notifError : new Error(String(notifError)),
          informId,
          studentId: inform.student_id 
        })
      }
    } else {
      logger.warn('Cannot send notification for approved leave inform - student has no user_id', {
        informId,
        studentId: inform.student_id
      })
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

/**
 * Delete a leave inform
 */
export async function deleteLeaveInform(
  informId: string,
  adminId: string
): Promise<{ success: boolean; error: null } | { success: false; error: Error }> {
  try {
    if (!supabaseAdmin) {
      return { success: false, error: new Error('Service role key not configured') }
    }

    // Verify admin has permission to delete
    const { getProfileByUserId } = await import('./profiles')
    const adminProfileResult = await getProfileByUserId(adminId)
    if (adminProfileResult.error || !adminProfileResult.profile) {
      logger.error('Error verifying admin profile', adminProfileResult.error || new Error('Profile not found'))
      return { success: false, error: new Error('Failed to verify admin permissions') }
    }

    const adminProfile = adminProfileResult.profile
    if (adminProfile.role !== 'super_admin' && adminProfile.role !== 'admin') {
      logger.error('Unauthorized delete attempt', new Error(`User ${adminId} is not an admin`))
      return { success: false, error: new Error('Only admins can delete leave informs') }
    }

    // Get inform to check branch permissions (for branch admins)
    const { data: inform, error: fetchError } = await supabaseAdmin
      .from('student_leave_informs')
      .select(`
        *,
        student:students!student_leave_informs_student_id_fkey(
          branch_id
        )
      `)
      .eq('id', informId)
      .single()

    if (fetchError || !inform) {
      logger.error('Error fetching leave inform for deletion', fetchError as Error)
      return { success: false, error: new Error('Leave inform not found') }
    }

    // Validate branch admin can only delete their branch students' informs
    if (adminProfile.role === 'admin') {
      const student = inform.student as { branch_id: string | null } | null
      if (!adminProfile.branchId || student?.branch_id !== adminProfile.branchId) {
        logger.error('Branch admin attempted to delete inform from different branch', {
          adminBranchId: adminProfile.branchId,
          studentBranchId: student?.branch_id,
        })
        return { success: false, error: new Error('You can only delete leave informs for students in your branch') }
      }
    }

    // Delete the inform
    const { error: deleteError } = await supabaseAdmin
      .from('student_leave_informs')
      .delete()
      .eq('id', informId)

    if (deleteError) {
      logger.error('Error deleting leave inform', deleteError as Error)
      return { success: false, error: new Error(deleteError.message) }
    }

    logger.info('Leave inform deleted successfully', { informId, adminId })
    return { success: true, error: null }
  } catch (error) {
    logger.error('Unexpected error deleting leave inform', error as Error)
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Failed to delete leave inform'),
    }
  }
}

