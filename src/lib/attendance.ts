import { supabase, supabaseAdmin } from './supabase'
import { logger } from './logger'

export type AttendanceStatus = 'present' | 'absent' | 'leave'

export interface AttendanceRecord {
  id: string
  student_id: string
  class_date: string
  status: AttendanceStatus
  marked_by: string
  notes: string | null
  created_at: string
  updated_at: string
  student?: {
    first_name: string
    last_name: string
    student_id: string
    student_photo_url: string | null
  } | null
  marked_by_profile?: {
    email: string
  } | null
}

export interface CreateAttendanceRecordData {
  studentId: string
  classDate: string // YYYY-MM-DD format
  status: AttendanceStatus
  notes?: string
}

export interface AttendanceStats {
  totalClasses: number
  presentCount: number
  absentCount: number
  leaveCount: number
  attendancePercentage: number
  attendanceStreak?: number // Consecutive days with "present" status
}

/**
 * Validate date for attendance
 */
function validateAttendanceDate(classDate: string): { valid: boolean; error?: string } {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(classDate)) {
    return { valid: false, error: 'Invalid date format. Use YYYY-MM-DD' }
  }

  const date = new Date(classDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    return { valid: false, error: 'Invalid date' }
  }

  // Allow dates up to 7 days in the future (for advance marking)
  const maxFutureDate = new Date(today)
  maxFutureDate.setDate(maxFutureDate.getDate() + 7)
  
  // Don't allow dates more than 1 year in the past
  const minPastDate = new Date(today)
  minPastDate.setFullYear(minPastDate.getFullYear() - 1)

  if (date > maxFutureDate) {
    return { valid: false, error: 'Cannot mark attendance more than 7 days in the future' }
  }

  if (date < minPastDate) {
    return { valid: false, error: 'Cannot mark attendance for dates more than 1 year ago' }
  }

  return { valid: true }
}

/**
 * Validate student for attendance marking
 */
async function validateStudentForAttendance(
  studentId: string,
  markedByBranchId?: string | null
): Promise<{ valid: boolean; error?: string }> {
  if (!supabaseAdmin) {
    return { valid: false, error: 'Service role key not configured' }
  }

  const { data: student, error } = await supabaseAdmin
    .from('students')
    .select('id, is_active, branch_id')
    .eq('id', studentId)
    .single()

  if (error || !student) {
    return { valid: false, error: 'Student not found' }
  }

  if (!student.is_active) {
    return { valid: false, error: 'Cannot mark attendance for inactive student' }
  }

  // If branch admin, check if student belongs to their branch
  if (markedByBranchId && student.branch_id !== markedByBranchId) {
    return { valid: false, error: 'Student does not belong to your branch' }
  }

  return { valid: true }
}

/**
 * Validate admin for attendance marking
 */
async function validateAdminForAttendance(markedBy: string): Promise<{ valid: boolean; error?: string; branchId?: string | null }> {
  if (!supabaseAdmin) {
    return { valid: false, error: 'Service role key not configured' }
  }

  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('user_id, role, branch_id')
    .eq('user_id', markedBy)
    .single()

  if (error || !profile) {
    return { valid: false, error: 'Admin profile not found' }
  }

  if (profile.role !== 'super_admin' && profile.role !== 'admin') {
    return { valid: false, error: 'Only admins can mark attendance' }
  }

  return { valid: true, branchId: profile.branch_id }
}

/**
 * Mark attendance for a student
 */
export async function markAttendance(
  data: CreateAttendanceRecordData,
  markedBy: string
): Promise<{ record: AttendanceRecord | null; error: null } | { record: null; error: Error }> {
  try {
    if (!supabaseAdmin) {
      return { record: null, error: new Error('Service role key not configured') }
    }

    // Validate date
    const dateValidation = validateAttendanceDate(data.classDate)
    if (!dateValidation.valid) {
      return { record: null, error: new Error(dateValidation.error || 'Invalid date') }
    }

    // Validate admin
    const adminValidation = await validateAdminForAttendance(markedBy)
    if (!adminValidation.valid) {
      return { record: null, error: new Error(adminValidation.error || 'Invalid admin') }
    }

    // Validate student
    const studentValidation = await validateStudentForAttendance(data.studentId, adminValidation.branchId)
    if (!studentValidation.valid) {
      return { record: null, error: new Error(studentValidation.error || 'Invalid student') }
    }

    // Check if record already exists
    const { data: existing } = await supabaseAdmin
      .from('attendance_records')
      .select('id')
      .eq('student_id', data.studentId)
      .eq('class_date', data.classDate)
      .single()

    let record: AttendanceRecord | null = null

    if (existing) {
      // Update existing record
      const { data: updated, error: updateError } = await supabaseAdmin
        .from('attendance_records')
        .update({
          status: data.status,
          notes: data.notes || null,
          marked_by: markedBy,
          // updated_at will be set by trigger
        })
        .eq('id', existing.id)
        .select(`
          *,
          student:students!attendance_records_student_id_fkey(
            first_name,
            last_name,
            student_id,
            student_photo_url
          ),
          marked_by_profile:profiles!attendance_records_marked_by_fkey(email)
        `)
        .single()

      if (updateError) {
        logger.error('Error updating attendance record', updateError as Error)
        return { record: null, error: new Error(updateError.message) }
      }

      record = updated as AttendanceRecord
    } else {
      // Create new record
      const { data: created, error: createError } = await supabaseAdmin
        .from('attendance_records')
        .insert({
          student_id: data.studentId,
          class_date: data.classDate,
          status: data.status,
          notes: data.notes || null,
          marked_by: markedBy,
        })
        .select(`
          *,
          student:students!attendance_records_student_id_fkey(
            first_name,
            last_name,
            student_id,
            student_photo_url
          ),
          marked_by_profile:profiles!attendance_records_marked_by_fkey(email)
        `)
        .single()

      if (createError) {
        logger.error('Error creating attendance record', createError as Error)
        return { record: null, error: new Error(createError.message) }
      }

      record = created as AttendanceRecord
    }

    logger.info('Attendance marked successfully', {
      studentId: data.studentId,
      classDate: data.classDate,
      status: data.status,
    })

    return { record, error: null }
  } catch (error) {
    logger.error('Unexpected error marking attendance', error as Error)
    return {
      record: null,
      error: error instanceof Error ? error : new Error('Failed to mark attendance'),
    }
  }
}

/**
 * Mark attendance for multiple students (bulk operation)
 */
export async function markBulkAttendance(
  records: Array<{ studentId: string; status: AttendanceStatus }>,
  classDate: string,
  markedBy: string
): Promise<{ success: boolean; error: null } | { success: false; error: Error }> {
  try {
    if (!supabaseAdmin) {
      return { success: false, error: new Error('Service role key not configured') }
    }

    // Validate date
    const dateValidation = validateAttendanceDate(classDate)
    if (!dateValidation.valid) {
      return { success: false, error: new Error(dateValidation.error || 'Invalid date') }
    }

    // Validate admin
    const adminValidation = await validateAdminForAttendance(markedBy)
    if (!adminValidation.valid) {
      return { success: false, error: new Error(adminValidation.error || 'Invalid admin') }
    }

    // Validate all students before bulk operation
    const studentIds = [...new Set(records.map((r) => r.studentId))]
    const invalidStudents: string[] = []

    for (const studentId of studentIds) {
      const studentValidation = await validateStudentForAttendance(studentId, adminValidation.branchId)
      if (!studentValidation.valid) {
        invalidStudents.push(studentId)
      }
    }

    if (invalidStudents.length > 0) {
      logger.warn('Invalid students found in bulk attendance', { invalidStudents })
      return {
        success: false,
        error: new Error(
          `Cannot mark attendance for ${invalidStudents.length} invalid student(s). Please check if students are active and belong to your branch.`
        ),
      }
    }

    // Get existing records for this date
    const { data: existingRecords } = await supabaseAdmin
      .from('attendance_records')
      .select('student_id, id')
      .eq('class_date', classDate)
      .in('student_id', studentIds)

    // Prepare upsert data
    const upsertData = records.map((record) => ({
      student_id: record.studentId,
      class_date: classDate,
      status: record.status,
      marked_by: markedBy,
      // updated_at will be set by trigger on update
    }))

    // Use upsert to handle both insert and update
    const { error: upsertError } = await supabaseAdmin
      .from('attendance_records')
      .upsert(upsertData, {
        onConflict: 'student_id,class_date',
      })

    if (upsertError) {
      logger.error('Error bulk marking attendance', upsertError as Error)
      return { success: false, error: new Error(upsertError.message) }
    }

    logger.info('Bulk attendance marked successfully', {
      count: records.length,
      classDate,
      markedBy,
    })

    return { success: true, error: null }
  } catch (error) {
    logger.error('Unexpected error bulk marking attendance', error as Error)
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Failed to mark bulk attendance'),
    }
  }
}

/**
 * Get attendance records for a student
 */
export async function getStudentAttendance(
  studentId: string,
  options?: {
    startDate?: string
    endDate?: string
    limit?: number
  }
): Promise<{ records: AttendanceRecord[]; error: null } | { records: null; error: Error }> {
  try {
    if (!supabaseAdmin) {
      return { records: null, error: new Error('Service role key not configured') }
    }

    let query = supabaseAdmin
      .from('attendance_records')
      .select(`
        *,
        student:students!attendance_records_student_id_fkey(
          first_name,
          last_name,
          student_id,
          student_photo_url
        ),
        marked_by_profile:profiles!attendance_records_marked_by_fkey(email)
      `)
      .eq('student_id', studentId)
      .order('class_date', { ascending: false })

    if (options?.startDate) {
      query = query.gte('class_date', options.startDate)
    }

    if (options?.endDate) {
      query = query.lte('class_date', options.endDate)
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    const { data: records, error } = await query

    if (error) {
      logger.error('Error fetching student attendance', error as Error)
      return { records: null, error: new Error(error.message) }
    }

    return { records: (records || []) as AttendanceRecord[], error: null }
  } catch (error) {
    logger.error('Unexpected error fetching student attendance', error as Error)
    return {
      records: null,
      error: error instanceof Error ? error : new Error('Failed to fetch attendance'),
    }
  }
}

/**
 * Get attendance records for a class date (for admin)
 */
export async function getClassAttendance(
  classDate: string,
  branchId?: string
): Promise<{ records: AttendanceRecord[]; error: null } | { records: null; error: Error }> {
  try {
    if (!supabaseAdmin) {
      return { records: null, error: new Error('Service role key not configured') }
    }

    let query = supabaseAdmin
      .from('attendance_records')
      .select(`
        *,
        student:students!attendance_records_student_id_fkey(
          first_name,
          last_name,
          student_id,
          student_photo_url,
          branch_id
        ),
        marked_by_profile:profiles!attendance_records_marked_by_fkey(
          email,
          user_id
        )
      `)
      .eq('class_date', classDate)

    const { data: records, error } = await query

    if (error) {
      logger.error('Error fetching class attendance', error as Error)
      return { records: null, error: new Error(error.message) }
    }

    // Filter by branch if specified
    let filteredRecords = records || []
    if (branchId) {
      filteredRecords = filteredRecords.filter(
        (r: any) => r.student?.branch_id === branchId
      )
    }

    // Sort by student first name (client-side sorting since Supabase doesn't support nested field ordering)
    filteredRecords.sort((a: any, b: any) => {
      const nameA = (a.student?.first_name || '').toLowerCase()
      const nameB = (b.student?.first_name || '').toLowerCase()
      return nameA.localeCompare(nameB)
    })

    return { records: filteredRecords as AttendanceRecord[], error: null }
  } catch (error) {
    logger.error('Unexpected error fetching class attendance', error as Error)
    return {
      records: null,
      error: error instanceof Error ? error : new Error('Failed to fetch class attendance'),
    }
  }
}

/**
 * Get attendance statistics for a student
 */
/**
 * Calculate attendance streak from attendance records
 * Streak counts consecutive "present" statuses from most recent date backwards
 * Only counts days where student was marked as "present"
 * Streak breaks on "absent" or "leave" status, or if there's a large gap (>7 days)
 */
function calculateAttendanceStreak(records: AttendanceRecord[]): number {
  if (records.length === 0) return 0

  // Sort records by date descending (most recent first)
  const sortedRecords = [...records].sort((a, b) => {
    const dateA = new Date(a.class_date).getTime()
    const dateB = new Date(b.class_date).getTime()
    return dateB - dateA
  })

  // If no records or most recent is not "present", streak is 0
  if (sortedRecords.length === 0 || sortedRecords[0].status !== 'present') {
    return 0
  }

  let streak = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Start from the most recent record
  for (let i = 0; i < sortedRecords.length; i++) {
    const record = sortedRecords[i]
    const recordDate = new Date(record.class_date)
    recordDate.setHours(0, 0, 0, 0)

    // Only count "present" status for the streak
    if (record.status === 'present') {
      if (i === 0) {
        // First record - check if it's recent (within last 7 days)
        const daysDiff = Math.floor((today.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24))
        if (daysDiff <= 7) {
          streak = 1
        } else {
          // Too old, no active streak
          return 0
        }
      } else {
        // Check if this record is consecutive with the previous one
        const prevRecord = sortedRecords[i - 1]
        const prevDate = new Date(prevRecord.class_date)
        prevDate.setHours(0, 0, 0, 0)
        
        const daysDiff = Math.floor((prevDate.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24))
        
        // If dates are within 7 days (allowing for non-class days), continue the streak
        // But if gap is more than 7 days, streak likely ended
        if (daysDiff <= 7) {
          streak++
        } else {
          // Large gap found, streak ends
          break
        }
      }
    } else {
      // Non-present status (absent or leave) found, streak ends
      break
    }
  }

  return streak
}

export async function getStudentAttendanceStats(
  studentId: string,
  startDate?: string,
  endDate?: string
): Promise<{ stats: AttendanceStats; error: null } | { stats: null; error: Error }> {
  try {
    const result = await getStudentAttendance(studentId, { startDate, endDate })

    if (result.error) {
      return { stats: null, error: result.error }
    }

    const records = result.records || []
    const totalClasses = records.length
    const presentCount = records.filter((r) => r.status === 'present').length
    const absentCount = records.filter((r) => r.status === 'absent').length
    const leaveCount = records.filter((r) => r.status === 'leave').length

    const attendancePercentage =
      totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 0

    // Calculate attendance streak
    const attendanceStreak = calculateAttendanceStreak(records)

    return {
      stats: {
        totalClasses,
        presentCount,
        absentCount,
        leaveCount,
        attendancePercentage,
        attendanceStreak,
      },
      error: null,
    }
  } catch (error) {
    logger.error('Unexpected error calculating attendance stats', error as Error)
    return {
      stats: null,
      error: error instanceof Error ? error : new Error('Failed to calculate stats'),
    }
  }
}

/**
 * Get all students for a branch (for marking attendance)
 */
export async function getStudentsForAttendance(
  branchId?: string
): Promise<{ students: Array<{ id: string; first_name: string; last_name: string; student_id: string; student_photo_url: string | null }>; error: null } | { students: null; error: Error }> {
  try {
    if (!supabaseAdmin) {
      return { students: null, error: new Error('Service role key not configured') }
    }

    let query = supabaseAdmin
      .from('students')
      .select('id, first_name, last_name, student_id, student_photo_url')
      .eq('is_active', true)
      .order('first_name', { ascending: true })

    if (branchId) {
      query = query.eq('branch_id', branchId)
    }

    const { data: students, error } = await query

    if (error) {
      logger.error('Error fetching students for attendance', error as Error)
      return { students: null, error: new Error(error.message) }
    }

    return {
      students: (students || []) as Array<{
        id: string
        first_name: string
        last_name: string
        student_id: string
        student_photo_url: string | null
      }>,
      error: null,
    }
  } catch (error) {
    logger.error('Unexpected error fetching students for attendance', error as Error)
    return {
      students: null,
      error: error instanceof Error ? error : new Error('Failed to fetch students'),
    }
  }
}

