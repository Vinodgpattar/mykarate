import { supabaseAdmin } from './supabase'
import { logger } from './logger'

export type FeeType = 'registration' | 'monthly' | 'yearly' | 'grading'
export type PaymentType = 'monthly' | 'yearly'
export type FeeStatus = 'pending' | 'paid' | 'overdue'

export interface FeeConfiguration {
  id: string
  fee_type: FeeType
  branch_id: string | null // Always NULL now (global only)
  belt_level: string | null // For grading fees only
  amount: number
  is_active: boolean
  created_by_id: string | null
  created_at: string
  updated_at: string
}

export interface StudentFee {
  id: string
  student_id: string
  fee_type: FeeType
  amount: number
  due_date: string
  status: FeeStatus
  paid_amount: number
  paid_at: string | null
  payment_method: string | null
  receipt_number: string | null
  notes: string | null
  period_start_date: string | null
  period_end_date: string | null
  belt_grading_id: string | null
  reminder_sent_at: string | null
  overdue_notification_sent_at: string | null
  recorded_by_id: string | null
  created_at: string
  updated_at: string
}

export interface PaymentPreference {
  id: string
  student_id: string
  payment_type: PaymentType
  started_from: string
  created_at: string
  updated_at: string
}

export interface BeltGrading {
  id: string
  student_id: string
  from_belt: string
  to_belt: string
  grading_date: string
  fee_amount: number | null
  student_fee_id: string | null
  created_by_id: string | null
  created_at: string
  updated_at: string
}

/**
 * Get fee configuration for a specific fee type
 * For grading fees, beltLevel is required
 */
export async function getFeeConfiguration(
  feeType: FeeType,
  beltLevel?: string | null
): Promise<{ fee: FeeConfiguration | null; error: null } | { fee: null; error: Error }> {
  try {
    if (!supabaseAdmin) {
      return { fee: null, error: new Error('Service role key not configured') }
    }

    let query = supabaseAdmin
      .from('fee_configurations')
      .select('*')
      .eq('fee_type', feeType)
      .eq('is_active', true)
      .is('branch_id', null) // Only global fees

    // For grading fees, filter by belt_level
    if (feeType === 'grading') {
      if (!beltLevel) {
        return { fee: null, error: new Error('Belt level is required for grading fees') }
      }
      query = query.eq('belt_level', beltLevel)
    } else {
      // For non-grading fees, ensure belt_level is NULL
      query = query.is('belt_level', null)
    }

    const { data, error } = await query.limit(1).maybeSingle()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned, which is OK
      logger.error('Error fetching fee configuration', error as Error)
      return { fee: null, error: new Error(error.message) }
    }

    return { fee: (data as FeeConfiguration) || null, error: null }
  } catch (error) {
    logger.error('Unexpected error fetching fee configuration', error as Error)
    return {
      fee: null,
      error: error instanceof Error ? error : new Error('Failed to fetch fee configuration'),
    }
  }
}

/**
 * Get all fee configurations (for admin)
 * Returns global fees only (no branch-specific)
 */
export async function getAllFeeConfigurations(options?: {
  feeType?: FeeType
}): Promise<{ fees: FeeConfiguration[]; error: null } | { fees: null; error: Error }> {
  try {
    if (!supabaseAdmin) {
      return { fees: null, error: new Error('Service role key not configured') }
    }

    let query = supabaseAdmin
      .from('fee_configurations')
      .select('*')
      .eq('is_active', true)
      .is('branch_id', null) // Only global fees

    if (options?.feeType) {
      query = query.eq('fee_type', options.feeType)
    }

    const { data, error } = await query.order('fee_type', { ascending: true }).order('belt_level', { ascending: true, nullsFirst: true })

    if (error) {
      logger.error('Error fetching fee configurations', error as Error)
      return { fees: null, error: new Error(error.message) }
    }

    return { fees: (data || []) as FeeConfiguration[], error: null }
  } catch (error) {
    logger.error('Unexpected error fetching fee configurations', error as Error)
    return {
      fees: null,
      error: error instanceof Error ? error : new Error('Failed to fetch fee configurations'),
    }
  }
}

/**
 * Create or update fee configuration
 * All fees are global (no branch_id)
 * Grading fees require belt_level
 */
export async function setFeeConfiguration(
  feeType: FeeType,
  amount: number,
  beltLevel: string | null, // For grading fees only
  createdById: string
): Promise<{ fee: FeeConfiguration | null; error: null } | { fee: null; error: Error }> {
  try {
    if (!supabaseAdmin) {
      return { fee: null, error: new Error('Service role key not configured') }
    }

    if (amount < 0) {
      return { fee: null, error: new Error('Fee amount cannot be negative') }
    }

    // Validate grading fees must have belt_level
    if (feeType === 'grading' && !beltLevel) {
      return { fee: null, error: new Error('Grading fees must specify a belt level') }
    }

    // Validate non-grading fees must not have belt_level
    if (feeType !== 'grading' && beltLevel) {
      return { fee: null, error: new Error('Only grading fees can have belt level') }
    }

    // Deactivate existing active fee
    let deactivateQuery = supabaseAdmin
      .from('fee_configurations')
      .update({ is_active: false })
      .eq('fee_type', feeType)
      .eq('is_active', true)
      .is('branch_id', null) // Only global fees

    if (feeType === 'grading' && beltLevel) {
      deactivateQuery = deactivateQuery.eq('belt_level', beltLevel)
    } else if (feeType !== 'grading') {
      deactivateQuery = deactivateQuery.is('belt_level', null)
    }

    const { error: deactivateError } = await deactivateQuery

    if (deactivateError) {
      logger.warn('Error deactivating old fee configuration', { error: deactivateError })
    }

    // Get old amount for history
    const oldFeeResult = await getFeeConfiguration(feeType, beltLevel || undefined)
    const oldAmount = oldFeeResult.fee?.amount || null

    // Create new active fee configuration (always global, no branch_id)
    const { data: newFee, error: createError } = await supabaseAdmin
      .from('fee_configurations')
      .insert({
        fee_type: feeType,
        branch_id: null, // Always NULL (global only)
        belt_level: beltLevel || null,
        amount,
        is_active: true,
        created_by_id: createdById,
      })
      .select()
      .single()

    if (createError || !newFee) {
      logger.error('Error creating fee configuration', createError as Error)
      return { fee: null, error: new Error(createError?.message || 'Failed to create fee configuration') }
    }

    // Record in history if amount changed
    if (oldAmount !== null && oldAmount !== amount) {
      await supabaseAdmin.from('fee_configuration_history').insert({
        fee_configuration_id: newFee.id,
        fee_type: feeType,
        branch_id: null,
        belt_level: beltLevel || null,
        old_amount: oldAmount,
        new_amount: amount,
        changed_by_id: createdById,
      })
    }

    logger.info('Fee configuration set successfully', { feeType, beltLevel, amount })
    return { fee: newFee as FeeConfiguration, error: null }
  } catch (error) {
    logger.error('Unexpected error setting fee configuration', error as Error)
    return {
      fee: null,
      error: error instanceof Error ? error : new Error('Failed to set fee configuration'),
    }
  }
}

/**
 * Get payment preference for a student
 */
export async function getStudentPaymentPreference(
  studentId: string
): Promise<{ preference: PaymentPreference | null; error: null } | { preference: null; error: Error }> {
  try {
    if (!supabaseAdmin) {
      return { preference: null, error: new Error('Service role key not configured') }
    }

    const { data, error } = await supabaseAdmin
      .from('student_payment_preferences')
      .select('*')
      .eq('student_id', studentId)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') {
      logger.error('Error fetching payment preference', error as Error)
      return { preference: null, error: new Error(error.message) }
    }

    return { preference: (data as PaymentPreference) || null, error: null }
  } catch (error) {
    logger.error('Unexpected error fetching payment preference', error as Error)
    return {
      preference: null,
      error: error instanceof Error ? error : new Error('Failed to fetch payment preference'),
    }
  }
}

/**
 * Set payment preference for a student
 */
export async function setStudentPaymentPreference(
  studentId: string,
  paymentType: PaymentType,
  startedFrom: string
): Promise<{ preference: PaymentPreference | null; error: null } | { preference: null; error: Error }> {
  try {
    if (!supabaseAdmin) {
      return { preference: null, error: new Error('Service role key not configured') }
    }

    // Upsert payment preference
    const { data, error } = await supabaseAdmin
      .from('student_payment_preferences')
      .upsert(
        {
          student_id: studentId,
          payment_type: paymentType,
          started_from: startedFrom,
        },
        {
          onConflict: 'student_id',
        }
      )
      .select()
      .single()

    if (error || !data) {
      logger.error('Error setting payment preference', error as Error)
      return { preference: null, error: new Error(error?.message || 'Failed to set payment preference') }
    }

    logger.info('Payment preference set successfully', { studentId, paymentType })
    return { preference: data as PaymentPreference, error: null }
  } catch (error) {
    logger.error('Unexpected error setting payment preference', error as Error)
    return {
      preference: null,
      error: error instanceof Error ? error : new Error('Failed to set payment preference'),
    }
  }
}

/**
 * Create a student fee
 */
export async function createStudentFee(data: {
  studentId: string
  feeType: FeeType
  amount: number
  dueDate: string
  periodStartDate?: string | null
  periodEndDate?: string | null
  beltGradingId?: string | null
}): Promise<{ fee: StudentFee | null; error: null } | { fee: null; error: Error }> {
  try {
    if (!supabaseAdmin) {
      return { fee: null, error: new Error('Service role key not configured') }
    }

    // Validate amount
    if (data.amount < 0) {
      return { fee: null, error: new Error('Fee amount cannot be negative') }
    }

    // Check if student is active (for monthly/yearly fees)
    if (data.feeType === 'monthly' || data.feeType === 'yearly') {
      const { data: student, error: studentError } = await supabaseAdmin
        .from('students')
        .select('is_active')
        .eq('id', data.studentId)
        .single()

      if (studentError || !student) {
        logger.error('Error fetching student for fee creation', studentError as Error)
        return { fee: null, error: new Error('Student not found') }
      }

      if (!student.is_active) {
        logger.warn('Attempted to create fee for inactive student', { studentId: data.studentId })
        return { fee: null, error: new Error('Cannot create fees for inactive students') }
      }

      // Check for duplicate fee (same type, overlapping period)
      if (data.periodStartDate && data.periodEndDate) {
        // Check for overlapping periods: periods overlap if start1 <= end2 AND end1 >= start2
        const { data: existingFees } = await supabaseAdmin
          .from('student_fees')
          .select('id, period_start_date, period_end_date')
          .eq('student_id', data.studentId)
          .eq('fee_type', data.feeType)
          .in('status', ['pending', 'overdue'])
          .not('period_start_date', 'is', null)
          .not('period_end_date', 'is', null)

        if (existingFees) {
          for (const existing of existingFees) {
            // Check if periods overlap
            if (
              existing.period_start_date <= data.periodEndDate &&
              existing.period_end_date >= data.periodStartDate
            ) {
              logger.warn('Duplicate fee detected - overlapping period', {
                studentId: data.studentId,
                feeType: data.feeType,
                newPeriod: { start: data.periodStartDate, end: data.periodEndDate },
                existingPeriod: {
                  start: existing.period_start_date,
                  end: existing.period_end_date,
                },
              })
              return { fee: null, error: new Error('A fee for this period already exists') }
            }
          }
        }
      }
    }

    // Determine initial status based on due date
    const initialStatus = (() => {
      const dueDateParts = data.dueDate.split('-')
      if (dueDateParts.length !== 3) {
        return 'pending'
      }
      const dueYear = parseInt(dueDateParts[0], 10)
      const dueMonth = parseInt(dueDateParts[1], 10) - 1
      const dueDay = parseInt(dueDateParts[2], 10)
      
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const dueDate = new Date(dueYear, dueMonth, dueDay)
      dueDate.setHours(0, 0, 0, 0)
      
      // If due date is in the future or today, it's pending
      if (dueDate >= today) {
        return 'pending'
      }
      // If due date has passed, it's overdue
      return 'overdue'
    })()

    const { data: fee, error } = await supabaseAdmin
      .from('student_fees')
      .insert({
        student_id: data.studentId,
        fee_type: data.feeType,
        amount: data.amount,
        due_date: data.dueDate,
        status: initialStatus,
        period_start_date: data.periodStartDate || null,
        period_end_date: data.periodEndDate || null,
        belt_grading_id: data.beltGradingId || null,
      })
      .select()
      .single()

    if (error || !fee) {
      logger.error('Error creating student fee', error as Error)
      return { fee: null, error: new Error(error?.message || 'Failed to create student fee') }
    }

    logger.info('Student fee created successfully', { studentId: data.studentId, feeType: data.feeType })
    return { fee: fee as StudentFee, error: null }
  } catch (error) {
    logger.error('Unexpected error creating student fee', error as Error)
    return {
      fee: null,
      error: error instanceof Error ? error : new Error('Failed to create student fee'),
    }
  }
}

/**
 * Helper function to determine correct fee status based on due date
 */
function getCorrectFeeStatus(fee: StudentFee): FeeStatus {
  // If fee is paid, it stays paid
  if (fee.status === 'paid') {
    return 'paid'
  }

  // If fee is fully paid (paid_amount >= amount), it should be paid
  if ((fee.paid_amount || 0) >= fee.amount) {
    return 'paid'
  }

  // Parse dates safely to avoid timezone issues
  // Parse due_date as YYYY-MM-DD format (local time, not UTC)
  const dueDateParts = fee.due_date.split('-')
  if (dueDateParts.length !== 3) {
    logger.warn('Invalid due_date format', { dueDate: fee.due_date, feeId: fee.id })
    return 'pending' // Default to pending if date is invalid
  }

  const dueYear = parseInt(dueDateParts[0], 10)
  const dueMonth = parseInt(dueDateParts[1], 10) - 1 // Month is 0-indexed
  const dueDay = parseInt(dueDateParts[2], 10)

  // Create date objects in local timezone (not UTC)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const dueDate = new Date(dueYear, dueMonth, dueDay)
  dueDate.setHours(0, 0, 0, 0)

  // Validate dates
  if (isNaN(today.getTime()) || isNaN(dueDate.getTime())) {
    logger.warn('Invalid date created', { today: today.getTime(), dueDate: dueDate.getTime(), feeId: fee.id })
    return 'pending'
  }

  // Compare dates: if due date is in the future, it's pending
  if (dueDate > today) {
    return 'pending'
  }

  // If due date is today, it's still pending (not overdue until tomorrow)
  if (dueDate.getTime() === today.getTime()) {
    return 'pending'
  }

  // If due date has passed and fee is not fully paid, it's overdue
  if (dueDate < today) {
    return 'overdue'
  }

  // Default to pending
  return 'pending'
}

/**
 * Ensure upcoming yearly fee is generated when within one month of current period end
 * This function checks if a student has a paid yearly fee ending within one month,
 * and generates the next yearly fee if it doesn't exist yet.
 */
async function ensureUpcomingYearlyFee(studentId: string): Promise<void> {
  try {
    if (!supabaseAdmin) {
      return
    }

    // Get student's payment preference
    const prefResult = await getStudentPaymentPreference(studentId)
    if (!prefResult.preference || prefResult.preference.payment_type !== 'yearly') {
      // Student is not on yearly plan, nothing to do
      return
    }

    // Get the most recent paid yearly fee
    const { data: paidYearlyFees, error: feesError } = await supabaseAdmin
      .from('student_fees')
      .select('*')
      .eq('student_id', studentId)
      .eq('fee_type', 'yearly')
      .eq('status', 'paid')
      .not('period_end_date', 'is', null)
      .order('period_end_date', { ascending: false })
      .limit(1)

    if (feesError || !paidYearlyFees || paidYearlyFees.length === 0) {
      // No paid yearly fees found, nothing to do
      return
    }

    const currentFee = paidYearlyFees[0] as StudentFee
    if (!currentFee.period_end_date) {
      return
    }

    // Check if we're within one month of the period end date
    const periodEndDate = new Date(currentFee.period_end_date)
    periodEndDate.setHours(0, 0, 0, 0)

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Calculate one month before period end
    const periodEndYear = periodEndDate.getFullYear()
    const periodEndMonth = periodEndDate.getMonth()
    const periodEndDay = periodEndDate.getDate()
    
    // Calculate target month (one month before)
    let targetYear = periodEndYear
    let targetMonth = periodEndMonth - 1
    
    // Handle year underflow (January -> December of previous year)
    if (targetMonth < 0) {
      targetMonth = 11 // December
      targetYear = periodEndYear - 1
    }
    
    // Create one month before date (use same day of month, but handle month-end edge cases)
    const oneMonthBefore = new Date(targetYear, targetMonth, periodEndDay)
    
    // If the day doesn't exist in the target month, set to last day of target month
    if (oneMonthBefore.getMonth() !== targetMonth) {
      oneMonthBefore.setDate(0) // Go to last day of previous month (which is the target month)
    }
    
    oneMonthBefore.setHours(0, 0, 0, 0)

    // Only generate if we're at or past the "one month before" date
    if (today < oneMonthBefore) {
      // Too early, don't generate yet
      return
    }

    // Check if next fee already exists
    const { data: existingNextFee } = await supabaseAdmin
      .from('student_fees')
      .select('id')
      .eq('student_id', studentId)
      .eq('fee_type', 'yearly')
      .gt('period_start_date', currentFee.period_end_date)
      .maybeSingle()

    if (existingNextFee) {
      // Next fee already exists, nothing to do
      return
    }

    // Generate the next yearly fee
    await generateNextPeriodFee(studentId, 'yearly', currentFee.period_end_date)

    logger.info('Upcoming yearly fee generated', {
      studentId,
      currentPeriodEnd: currentFee.period_end_date,
    })
  } catch (error) {
    logger.error('Unexpected error ensuring upcoming yearly fee', error as Error)
    // Don't throw - this is a background operation
  }
}

/**
 * Get all fees for a student
 */
export async function getStudentFees(
  studentId: string,
  options?: {
    status?: FeeStatus | 'all'
    feeType?: FeeType | 'all'
  }
): Promise<{ fees: StudentFee[]; error: null } | { fees: null; error: Error }> {
  try {
    if (!supabaseAdmin) {
      return { fees: null, error: new Error('Service role key not configured') }
    }

    // Ensure upcoming yearly fee is generated if needed (one month before period end)
    // This runs in the background and won't block the query
    ensureUpcomingYearlyFee(studentId).catch((err) => {
      logger.error('Error in ensureUpcomingYearlyFee', err as Error)
    })

    let query = supabaseAdmin.from('student_fees').select('*').eq('student_id', studentId)

    if (options?.status && options.status !== 'all') {
      query = query.eq('status', options.status)
    }

    if (options?.feeType && options.feeType !== 'all') {
      query = query.eq('fee_type', options.feeType)
    }

    const { data, error } = await query.order('due_date', { ascending: false })

    if (error) {
      logger.error('Error fetching student fees', error as Error)
      return { fees: null, error: new Error(error.message) }
    }

    // Correct status for each fee based on due date
    const correctedFees = (data || []).map((fee: StudentFee) => {
      const correctStatus = getCorrectFeeStatus(fee)
      // If status is incorrect, update it in the database (async, don't wait)
      if (fee.status !== correctStatus && fee.status !== 'paid') {
        // Only update if it's not paid (paid status should never change)
        // Log the correction for debugging
        logger.debug('Correcting fee status in getStudentFees', {
          feeId: fee.id,
          oldStatus: fee.status,
          newStatus: correctStatus,
          dueDate: fee.due_date,
          today: new Date().toISOString().split('T')[0],
        })
        supabaseAdmin
          .from('student_fees')
          .update({ status: correctStatus })
          .eq('id', fee.id)
          .then(() => {
            logger.debug('Fee status corrected in database', { feeId: fee.id, newStatus: correctStatus })
          })
          .catch((err) => {
            logger.error('Error correcting fee status in database', err as Error, { feeId: fee.id })
          })
      }
      // Always return the corrected status in the response, even if DB update is pending
      return { ...fee, status: correctStatus }
    })

    return { fees: correctedFees as StudentFee[], error: null }
  } catch (error) {
    logger.error('Unexpected error fetching student fees', error as Error)
    return {
      fees: null,
      error: error instanceof Error ? error : new Error('Failed to fetch student fees'),
    }
  }
}

/**
 * Record payment for a student fee
 */
export async function recordPayment(
  studentFeeId: string,
  paymentData: {
    amount: number
    paymentMethod: string
    receiptNumber?: string | null
    notes?: string | null
    recordedById: string
  }
): Promise<{ success: boolean; error: null } | { success: false; error: Error }> {
  try {
    if (!supabaseAdmin) {
      return { success: false, error: new Error('Service role key not configured') }
    }

    // Get current fee
    const { data: fee, error: fetchError } = await supabaseAdmin
      .from('student_fees')
      .select('*')
      .eq('id', studentFeeId)
      .single()

    if (fetchError || !fee) {
      logger.error('Error fetching student fee for payment', fetchError as Error)
      return { success: false, error: new Error('Student fee not found') }
    }

    if (fee.status === 'paid') {
      return { success: false, error: new Error('Fee is already paid') }
    }

    // Validate payment amount
    if (paymentData.amount <= 0) {
      return { success: false, error: new Error('Payment amount must be greater than zero') }
    }

    const currentPaidAmount = fee.paid_amount || 0
    const remainingAmount = fee.amount - currentPaidAmount

    if (paymentData.amount > remainingAmount) {
      return {
        success: false,
        error: new Error(`Payment amount (₹${paymentData.amount.toFixed(2)}) exceeds remaining balance (₹${remainingAmount.toFixed(2)})`),
      }
    }

    const newPaidAmount = currentPaidAmount + paymentData.amount
    const totalAmount = fee.amount

    // Update fee with race condition protection: only update if paid_amount hasn't changed
    const updateData: any = {
      paid_amount: newPaidAmount,
      recorded_by_id: paymentData.recordedById,
      payment_method: paymentData.paymentMethod,
      receipt_number: paymentData.receiptNumber || null,
      notes: paymentData.notes || null,
    }

    // If fully paid
    if (newPaidAmount >= totalAmount) {
      updateData.status = 'paid'
      updateData.paid_at = new Date().toISOString()
    }

    // Use WHERE clause to ensure paid_amount hasn't changed (race condition protection)
    const { error: updateError } = await supabaseAdmin
      .from('student_fees')
      .update(updateData)
      .eq('id', studentFeeId)
      .eq('paid_amount', currentPaidAmount) // Only update if paid_amount hasn't changed

    if (updateError) {
      logger.error('Error recording payment', updateError as Error)
      return { success: false, error: new Error(updateError.message) }
    }

    // Check if update actually happened (race condition check)
    const { data: updatedFee, error: verifyError } = await supabaseAdmin
      .from('student_fees')
      .select('paid_amount')
      .eq('id', studentFeeId)
      .single()

    if (verifyError || !updatedFee) {
      logger.error('Error verifying payment update', verifyError as Error)
      return { success: false, error: new Error('Failed to verify payment was recorded') }
    }

    // If paid_amount didn't change, it means another payment was recorded concurrently
    if (updatedFee.paid_amount !== newPaidAmount) {
      logger.warn('Payment recording conflict detected', {
        studentFeeId,
        expectedPaidAmount: newPaidAmount,
        actualPaidAmount: updatedFee.paid_amount,
      })
      return {
        success: false,
        error: new Error('Payment conflict: Another payment was recorded simultaneously. Please try again.'),
      }
    }

    // If monthly fee is fully paid, generate next period fee immediately
    // For yearly fees, next fee will be generated one month before period end (handled by ensureUpcomingYearlyFee)
    if (newPaidAmount >= totalAmount && fee.fee_type === 'monthly') {
      await generateNextPeriodFee(fee.student_id, fee.fee_type, fee.period_end_date)
    }

    logger.info('Payment recorded successfully', { studentFeeId, amount: paymentData.amount })
    return { success: true, error: null }
  } catch (error) {
    logger.error('Unexpected error recording payment', error as Error)
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Failed to record payment'),
    }
  }
}

/**
 * Generate next period fee for monthly/yearly payments
 */
async function generateNextPeriodFee(
  studentId: string,
  feeType: 'monthly' | 'yearly',
  previousPeriodEndDate: string | null
): Promise<void> {
  try {
    if (!previousPeriodEndDate) {
      logger.warn('Cannot generate next period fee: no previous period end date', { studentId, feeType })
      return
    }

    // Get student's branch and payment preference
    const { data: student, error: studentError } = await supabaseAdmin
      .from('students')
      .select('branch_id, is_active')
      .eq('id', studentId)
      .single()

    if (studentError || !student) {
      logger.error('Error fetching student for next period fee', studentError as Error)
      return
    }

    if (!student.is_active) {
      logger.warn('Cannot generate next period fee for inactive student', { studentId })
      return
    }

    // Check payment preference matches fee type
    const prefResult = await getStudentPaymentPreference(studentId)
    if (prefResult.preference && prefResult.preference.payment_type !== feeType) {
      logger.info('Payment preference changed, skipping fee generation', {
        studentId,
        feeType,
        currentPreference: prefResult.preference.payment_type,
      })
      return
    }

    // Get current fee amount (global fees, no branch_id needed)
    const feeResult = await getFeeConfiguration(feeType)
    if (feeResult.error || !feeResult.fee) {
      logger.error('Error fetching fee configuration for next period', feeResult.error || new Error('Fee not found'))
      return
    }

    // Get enrollment day from payment preference for monthly fees
    let enrollmentDay: number | null = null
    if (feeType === 'monthly' && prefResult.preference) {
      const enrollmentDateObj = new Date(prefResult.preference.started_from)
      enrollmentDay = enrollmentDateObj.getDate()
    }

    // Parse the previous period end date properly
    const previousEnd = new Date(previousPeriodEndDate)
    previousEnd.setHours(0, 0, 0, 0) // Normalize to start of day
    
    let periodStart: Date
    let periodEnd: Date
    let dueDate: Date

    if (feeType === 'monthly') {
      // For monthly fees: due date should always be the enrollment day of the next month
      // Get the next month's enrollment day
      const nextMonth = new Date(previousEnd)
      nextMonth.setMonth(nextMonth.getMonth() + 1)
      
      if (enrollmentDay) {
        // Use enrollment day of next month
        dueDate = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), enrollmentDay)
      } else {
        // Fallback: use the same day as previous period end (shouldn't happen, but safety)
        dueDate = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), previousEnd.getDate())
      }
      
      dueDate.setHours(0, 0, 0, 0)
      
      // Period should cover from previous enrollment day to day before due date
      // Period start: previous month's enrollment day (or day after previous period end)
      periodStart = new Date(previousEnd)
      periodStart.setDate(periodStart.getDate() + 1) // Day after previous period ends
      periodStart.setHours(0, 0, 0, 0)
      
      // Period end: day before due date (end of day)
      periodEnd = new Date(dueDate)
      periodEnd.setDate(periodEnd.getDate() - 1)
      periodEnd.setHours(23, 59, 59, 999)
    } else {
      // For yearly fees: period starts the day after previous period ends
      periodStart = new Date(previousEnd)
      periodStart.setDate(periodStart.getDate() + 1)
      periodStart.setHours(0, 0, 0, 0)

      // Calculate period end
      periodEnd = new Date(periodStart)
      // yearly - add exactly 1 year
      const startYear = periodStart.getFullYear()
      const startMonth = periodStart.getMonth()
      const startDay = periodStart.getDate()
      
      // Set to exactly 1 year later
      periodEnd.setFullYear(startYear + 1, startMonth, startDay)
      
      // Handle leap year edge case (Feb 29 -> Feb 28 in non-leap year)
      if (periodEnd.getDate() !== startDay) {
        // Leap year adjustment needed
        periodEnd.setDate(0) // Go to last day of previous month (Feb 28)
      }
      periodEnd.setHours(23, 59, 59, 999) // End of day

      // Due date is one month before period end (available to pay from one month before)
      // Calculate one month before period end
      const periodEndYear = periodEnd.getFullYear()
      const periodEndMonth = periodEnd.getMonth()
      const periodEndDay = periodEnd.getDate()
      
      // Calculate target month (one month before)
      let targetYear = periodEndYear
      let targetMonth = periodEndMonth - 1
      
      // Handle year underflow (January -> December of previous year)
      if (targetMonth < 0) {
        targetMonth = 11 // December
        targetYear = periodEndYear - 1
      }
      
      // Create due date (use same day of month, but handle month-end edge cases)
      dueDate = new Date(targetYear, targetMonth, periodEndDay)
      
      // If the day doesn't exist in the target month (e.g., Jan 31 -> Feb 31 becomes Mar 3),
      // set to last day of target month
      if (dueDate.getMonth() !== targetMonth) {
        dueDate.setDate(0) // Go to last day of previous month (which is the target month)
      }
      
      dueDate.setHours(0, 0, 0, 0)
    }

    // Check for existing fee for this period
    const { data: existingFee } = await supabaseAdmin
      .from('student_fees')
      .select('id')
      .eq('student_id', studentId)
      .eq('fee_type', feeType)
      .eq('period_start_date', periodStart.toISOString().split('T')[0])
      .eq('period_end_date', periodEnd.toISOString().split('T')[0])
      .maybeSingle()

    if (existingFee) {
      logger.info('Next period fee already exists, skipping generation', {
        studentId,
        feeType,
        periodStart: periodStart.toISOString().split('T')[0],
      })
      return
    }

    // Create next period fee
    await createStudentFee({
      studentId,
      feeType,
      amount: feeResult.fee.amount,
      dueDate: dueDate.toISOString().split('T')[0],
      periodStartDate: periodStart.toISOString().split('T')[0],
      periodEndDate: periodEnd.toISOString().split('T')[0],
    })

    logger.info('Next period fee generated', { studentId, feeType, periodStart, periodEnd })
  } catch (error) {
    logger.error('Unexpected error generating next period fee', error as Error)
  }
}

/**
 * Initialize fees for a new student (registration fee + first monthly/yearly fee)
 */
export async function initializeStudentFees(
  studentId: string,
  paymentType: PaymentType,
  enrollmentDate: string
): Promise<{ success: boolean; error: null } | { success: false; error: Error }> {
  try {
    // Set payment preference (use enrollment date for historical record)
    await setStudentPaymentPreference(studentId, paymentType, enrollmentDate)

    // Parse enrollment date to extract the day of month
    const enrollmentDateObj = new Date(enrollmentDate)
    enrollmentDateObj.setHours(0, 0, 0, 0)
    const enrollmentDay = enrollmentDateObj.getDate() // Get day of month (1-31)
    const enrollmentMonth = enrollmentDateObj.getMonth() // Get month (0-11)
    
    // Get today's date
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayDay = today.getDate()
    const todayMonth = today.getMonth()
    const todayYear = today.getFullYear()

    // Get registration fee (global, no branch_id needed)
    const regFeeResult = await getFeeConfiguration('registration')
    if (regFeeResult.error || !regFeeResult.fee) {
      logger.warn('Registration fee not configured')
    } else {
      // Create registration fee with enrollment date (historical record)
      await createStudentFee({
        studentId,
        feeType: 'registration',
        amount: regFeeResult.fee.amount,
        dueDate: enrollmentDate,
      })
    }

    // Get monthly/yearly fee (global, no branch_id needed)
    const periodFeeResult = await getFeeConfiguration(paymentType)
    if (periodFeeResult.error || !periodFeeResult.fee) {
      logger.warn(`${paymentType} fee not configured`)
    } else {
      // Calculate period start date and due date based on enrollment day pattern
      let periodStart: Date
      let periodEnd: Date
      let dueDate: Date
      
      if (paymentType === 'monthly') {
        // For monthly fees: due date should always be the enrollment day of the month
        // If enrollment day hasn't passed this month, due date is this month
        // If enrollment day has passed this month, due date is next month
        
        if (todayDay < enrollmentDay) {
          // Enrollment day hasn't passed this month - due date is this month
          dueDate = new Date(todayYear, todayMonth, enrollmentDay)
        } else {
          // Enrollment day has passed this month - due date is next month
          dueDate = new Date(todayYear, todayMonth + 1, enrollmentDay)
        }
        
        dueDate.setHours(0, 0, 0, 0)
        
        // Period should cover from previous enrollment day to day before due date
        // Period start: previous month's enrollment day
        periodStart = new Date(dueDate)
        periodStart.setMonth(periodStart.getMonth() - 1)
        periodStart.setHours(0, 0, 0, 0)
        
        // Period end: day before due date (end of day)
        periodEnd = new Date(dueDate)
        periodEnd.setDate(periodEnd.getDate() - 1)
        periodEnd.setHours(23, 59, 59, 999)
      } else {
        // For yearly fees: period should start from enrollment date (or today if enrollment is in the past)
        const enrollmentYear = enrollmentDateObj.getFullYear()
        
        // If enrollment date is today or in the future, start period from enrollment date
        if (enrollmentDateObj >= today) {
          // Enrollment is today or future - use enrollment date as period start
          periodStart = new Date(enrollmentYear, enrollmentMonth, enrollmentDay)
        } else {
          // Enrollment is in the past - align with enrollment day but use current or next year
          if (todayMonth < enrollmentMonth || (todayMonth === enrollmentMonth && todayDay < enrollmentDay)) {
            // Enrollment day hasn't passed this year - use current year with enrollment month/day
            periodStart = new Date(todayYear, enrollmentMonth, enrollmentDay)
          } else {
            // Enrollment day has passed this year - use next year with enrollment month/day
            periodStart = new Date(todayYear + 1, enrollmentMonth, enrollmentDay)
          }
        }
        
        periodStart.setHours(0, 0, 0, 0)
        
        // Calculate period end date
        periodEnd = new Date(periodStart)
        // yearly - add exactly 1 year
        const startYear = periodStart.getFullYear()
        const startMonth = periodStart.getMonth()
        const startDay = periodStart.getDate()
        
        // Set to exactly 1 year later
        periodEnd.setFullYear(startYear + 1, startMonth, startDay)
        
        // Handle leap year edge case (Feb 29 -> Feb 28 in non-leap year)
        if (periodEnd.getDate() !== startDay) {
          // Leap year adjustment needed
          periodEnd.setDate(0) // Go to last day of previous month (Feb 28)
        }
        periodEnd.setHours(23, 59, 59, 999) // End of day

        // Due date is the enrollment date (immediate collection on first day)
        // For initial yearly fee, collect on enrollment date
        // Next yearly fee will be due one month before period end (handled by ensureUpcomingYearlyFee)
        dueDate = new Date(periodStart) // Use period start (enrollment date) as due date
        dueDate.setHours(0, 0, 0, 0)
      }

      // Create first period fee
      await createStudentFee({
        studentId,
        feeType: paymentType,
        amount: periodFeeResult.fee.amount,
        dueDate: dueDate.toISOString().split('T')[0],
        periodStartDate: periodStart.toISOString().split('T')[0],
        periodEndDate: periodEnd.toISOString().split('T')[0],
      })

      logger.info('Student fees initialized with aligned period', {
        studentId,
        paymentType,
        enrollmentDate,
        enrollmentDay,
        periodStart: periodStart.toISOString().split('T')[0],
        periodEnd: periodEnd.toISOString().split('T')[0],
        dueDate: dueDate.toISOString().split('T')[0],
      })
    }

    logger.info('Student fees initialized', { studentId, paymentType, enrollmentDate })
    return { success: true, error: null }
  } catch (error) {
    logger.error('Unexpected error initializing student fees', error as Error)
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Failed to initialize student fees'),
    }
  }
}

/**
 * Record belt grading and create grading fee
 */
export async function recordBeltGrading(data: {
  studentId: string
  fromBelt: string
  toBelt: string
  gradingDate: string
  createdById: string
}): Promise<{ grading: BeltGrading | null; fee: StudentFee | null; error: null } | { grading: null; fee: null; error: Error }> {
  try {
    if (!supabaseAdmin) {
      return { grading: null, fee: null, error: new Error('Service role key not configured') }
    }

    // Get student's branch and current belt
    const { data: student, error: studentError } = await supabaseAdmin
      .from('students')
      .select('branch_id, current_belt, is_active')
      .eq('id', data.studentId)
      .single()

    if (studentError || !student) {
      logger.error('Error fetching student for belt grading', studentError as Error)
      return { grading: null, fee: null, error: new Error('Student not found') }
    }

    if (!student.is_active) {
      return { grading: null, fee: null, error: new Error('Cannot grade belt for inactive student') }
    }

    // Validate from_belt matches current_belt
    if (student.current_belt !== data.fromBelt) {
      logger.warn('Belt mismatch in grading', {
        studentId: data.studentId,
        currentBelt: student.current_belt,
        fromBelt: data.fromBelt,
      })
      return {
        grading: null,
        fee: null,
        error: new Error(`Student's current belt is ${student.current_belt}, not ${data.fromBelt}`),
      }
    }

    // Get grading fee for the TO belt (the belt they're upgrading to)
    const gradingFeeResult = await getFeeConfiguration('grading', data.toBelt)
    if (gradingFeeResult.error || !gradingFeeResult.fee) {
      logger.warn('Grading fee not configured for belt', { belt: data.toBelt })
    }

    // Create belt grading record
    const { data: grading, error: gradingError } = await supabaseAdmin
      .from('belt_gradings')
      .insert({
        student_id: data.studentId,
        from_belt: data.fromBelt,
        to_belt: data.toBelt,
        grading_date: data.gradingDate,
        fee_amount: gradingFeeResult.fee?.amount || null,
        created_by_id: data.createdById,
      })
      .select()
      .single()

    if (gradingError || !grading) {
      logger.error('Error creating belt grading', gradingError as Error)
      return { grading: null, fee: null, error: new Error(gradingError?.message || 'Failed to create belt grading') }
    }

    // Update student's current belt
    await supabaseAdmin
      .from('students')
      .update({ current_belt: data.toBelt })
      .eq('id', data.studentId)

    // Create grading fee if fee is configured
    let fee: StudentFee | null = null
    if (gradingFeeResult.fee) {
      const feeResult = await createStudentFee({
        studentId: data.studentId,
        feeType: 'grading',
        amount: gradingFeeResult.fee.amount,
        dueDate: data.gradingDate,
        beltGradingId: grading.id,
      })

      if (feeResult.fee) {
        fee = feeResult.fee

        // Update grading record with fee ID
        await supabaseAdmin
          .from('belt_gradings')
          .update({ student_fee_id: fee.id })
          .eq('id', grading.id)
      }
    }

    logger.info('Belt grading recorded successfully', { studentId: data.studentId, fromBelt: data.fromBelt, toBelt: data.toBelt })
    return { grading: grading as BeltGrading, fee, error: null }
  } catch (error) {
    logger.error('Unexpected error recording belt grading', error as Error)
    return {
      grading: null,
      fee: null,
      error: error instanceof Error ? error : new Error('Failed to record belt grading'),
    }
  }
}

/**
 * Switch student payment preference (monthly <-> yearly)
 * Creates first fee of new type immediately with switch date as due date
 */
export async function switchPaymentPreference(
  studentId: string,
  newPaymentType: PaymentType,
  switchDate: string
): Promise<{ success: boolean; error: null } | { success: false; error: Error }> {
  try {
    if (!supabaseAdmin) {
      return { success: false, error: new Error('Service role key not configured') }
    }

    // Validate switch date format
    const switchDateObj = new Date(switchDate)
    if (isNaN(switchDateObj.getTime())) {
      return { success: false, error: new Error('Invalid switch date format. Use YYYY-MM-DD') }
    }
    switchDateObj.setHours(0, 0, 0, 0)

    // Get current preference
    const currentPrefResult = await getStudentPaymentPreference(studentId)
    if (currentPrefResult.error) {
      return { success: false, error: currentPrefResult.error }
    }

    // If already on this payment type, no change needed
    if (currentPrefResult.preference?.payment_type === newPaymentType) {
      return { success: true, error: null }
    }

    // Get student's branch and current preference
    const { data: student, error: studentError } = await supabaseAdmin
      .from('students')
      .select('branch_id, is_active')
      .eq('id', studentId)
      .single()

    if (studentError || !student) {
      return { success: false, error: new Error('Student not found') }
    }

    if (!student.is_active) {
      return { success: false, error: new Error('Cannot switch payment preference for inactive student') }
    }

    // Get current preference
    const currentPref = currentPrefResult.preference
    const oldPaymentType = currentPref?.payment_type

    // Check for pending fees of old type (for logging, but don't modify them)
    if (oldPaymentType) {
      const { data: pendingFees } = await supabaseAdmin
        .from('student_fees')
        .select('id, fee_type, due_date, amount')
        .eq('student_id', studentId)
        .eq('fee_type', oldPaymentType)
        .in('status', ['pending', 'overdue'])

      if (pendingFees && pendingFees.length > 0) {
        logger.info('Found pending fees of old payment type (will remain pending for admin to handle)', {
          studentId,
          oldType: oldPaymentType,
          pendingFeesCount: pendingFees.length,
        })
      }
    }

    // Update payment preference
    await setStudentPaymentPreference(studentId, newPaymentType, switchDate)

    // Get fee configuration for new payment type
    const feeResult = await getFeeConfiguration(newPaymentType)
    if (feeResult.error || !feeResult.fee) {
      logger.warn('Fee configuration not found for new payment type, preference updated but no fee created', {
        studentId,
        newPaymentType,
      })
      return { success: true, error: null } // Still return success, preference is updated
    }

    // Calculate period and due dates for the first fee of new type
    let periodStart: Date
    let periodEnd: Date
    let dueDate: Date

    if (newPaymentType === 'yearly') {
      // For yearly: period starts from switch date, ends 1 year later, due date is switch date (immediate collection)
      periodStart = new Date(switchDateObj)
      periodStart.setHours(0, 0, 0, 0)

      // Period end: exactly 1 year from switch date, minus 1 day (day before next due date)
      // Example: Switch date Nov 27, 2025 -> Period end Nov 26, 2026 (day before Nov 27, 2026)
      const startYear = periodStart.getFullYear()
      const startMonth = periodStart.getMonth()
      const startDay = periodStart.getDate()

      // Calculate next year's same date
      const nextYearDate = new Date(startYear + 1, startMonth, startDay)
      
      // Handle leap year edge case (Feb 29 -> Feb 28 in non-leap year)
      if (nextYearDate.getDate() !== startDay) {
        nextYearDate.setDate(0) // Go to last day of previous month (Feb 28)
      }

      // Period end is day before next due date (next year's switch date - 1 day)
      periodEnd = new Date(nextYearDate)
      periodEnd.setDate(periodEnd.getDate() - 1)
      periodEnd.setHours(23, 59, 59, 999)

      // Due date is switch date (immediate collection)
      dueDate = new Date(switchDateObj)
      dueDate.setHours(0, 0, 0, 0)
    } else {
      // For monthly: period starts from switch date, ends 1 month later, due date is switch date (immediate collection)
      periodStart = new Date(switchDateObj)
      periodStart.setHours(0, 0, 0, 0)

      // Period end: exactly 1 month from switch date, minus 1 day
      periodEnd = new Date(periodStart)
      periodEnd.setMonth(periodEnd.getMonth() + 1)

      // Handle month overflow (e.g., Jan 31 + 1 month should be Feb 28/29, not Mar 3)
      if (periodEnd.getDate() !== periodStart.getDate()) {
        // Date changed due to month overflow, set to last day of target month
        periodEnd.setDate(0) // Go to last day of previous month
      }

      // Period end is day before next due date
      periodEnd.setDate(periodEnd.getDate() - 1)
      periodEnd.setHours(23, 59, 59, 999)

      // Due date is switch date (immediate collection)
      dueDate = new Date(switchDateObj)
      dueDate.setHours(0, 0, 0, 0)
    }

    // Check if fee already exists for this period (avoid duplicates)
    const { data: existingFee } = await supabaseAdmin
      .from('student_fees')
      .select('id')
      .eq('student_id', studentId)
      .eq('fee_type', newPaymentType)
      .eq('period_start_date', periodStart.toISOString().split('T')[0])
      .eq('period_end_date', periodEnd.toISOString().split('T')[0])
      .maybeSingle()

    if (existingFee) {
      logger.info('Fee for this period already exists, skipping creation', {
        studentId,
        newPaymentType,
        periodStart: periodStart.toISOString().split('T')[0],
      })
      return { success: true, error: null }
    }

    // Create first fee of new payment type
    const feeCreateResult = await createStudentFee({
      studentId,
      feeType: newPaymentType,
      amount: feeResult.fee.amount,
      dueDate: dueDate.toISOString().split('T')[0],
      periodStartDate: periodStart.toISOString().split('T')[0],
      periodEndDate: periodEnd.toISOString().split('T')[0],
    })

    if (feeCreateResult.error) {
      logger.error('Error creating fee after payment preference switch', feeCreateResult.error)
      // Still return success since preference was updated
      return { success: true, error: null }
    }

    logger.info('Payment preference switched and first fee created', {
      studentId,
      oldType: oldPaymentType,
      newType: newPaymentType,
      switchDate,
      feeId: feeCreateResult.fee?.id,
      dueDate: dueDate.toISOString().split('T')[0],
      periodStart: periodStart.toISOString().split('T')[0],
      periodEnd: periodEnd.toISOString().split('T')[0],
    })

    return { success: true, error: null }
  } catch (error) {
    logger.error('Unexpected error switching payment preference', error as Error)
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Failed to switch payment preference'),
    }
  }
}

/**
 * Get all fees (for admin - with filters)
 */
export async function getAllFees(options?: {
  studentId?: string
  branchId?: string
  status?: FeeStatus | 'all'
  feeType?: FeeType | 'all'
  startDate?: string
  endDate?: string
}): Promise<{ fees: StudentFee[]; error: null } | { fees: null; error: Error }> {
  try {
    if (!supabaseAdmin) {
      return { fees: null, error: new Error('Service role key not configured') }
    }

    let query = supabaseAdmin
      .from('student_fees')
      .select(`
        *,
        student:students!student_fees_student_id_fkey(
          id,
          first_name,
          last_name,
          student_id,
          branch_id
        )
      `)

    if (options?.studentId) {
      query = query.eq('student_id', options.studentId)
    }

    // Note: Can't filter by nested field directly in Supabase, will filter client-side
    // if (options?.branchId) {
    //   query = query.eq('student.branch_id', options.branchId)
    // }

    if (options?.status && options.status !== 'all') {
      query = query.eq('status', options.status)
    }

    if (options?.feeType && options.feeType !== 'all') {
      query = query.eq('fee_type', options.feeType)
    }

    if (options?.startDate) {
      query = query.gte('due_date', options.startDate)
    }

    if (options?.endDate) {
      query = query.lte('due_date', options.endDate)
    }

    const { data, error } = await query.order('due_date', { ascending: false })

    if (error) {
      logger.error('Error fetching all fees', error as Error)
      return { fees: null, error: new Error(error.message) }
    }

    // Filter by branch_id client-side if specified (since Supabase doesn't support nested field filtering)
    let filteredData = data || []
    if (options?.branchId) {
      filteredData = filteredData.filter((fee: any) => fee.student?.branch_id === options.branchId)
    }

    // Correct status for each fee based on due date
    const correctedFees = filteredData.map((fee: StudentFee) => {
      const correctStatus = getCorrectFeeStatus(fee)
      // If status is incorrect, update it in the database (async, don't wait)
      if (fee.status !== correctStatus && fee.status !== 'paid') {
        // Only update if it's not paid (paid status should never change)
        // Log the correction for debugging
        logger.debug('Correcting fee status', {
          feeId: fee.id,
          oldStatus: fee.status,
          newStatus: correctStatus,
          dueDate: fee.due_date,
          today: new Date().toISOString().split('T')[0],
        })
        supabaseAdmin
          .from('student_fees')
          .update({ status: correctStatus })
          .eq('id', fee.id)
          .then(() => {
            logger.debug('Fee status corrected in database', { feeId: fee.id, newStatus: correctStatus })
          })
          .catch((err) => {
            logger.error('Error correcting fee status in database', err as Error, { feeId: fee.id })
          })
      }
      // Always return the corrected status in the response, even if DB update is pending
      return { ...fee, status: correctStatus }
    })

    return { fees: correctedFees as StudentFee[], error: null }
  } catch (error) {
    logger.error('Unexpected error fetching all fees', error as Error)
    return {
      fees: null,
      error: error instanceof Error ? error : new Error('Failed to fetch fees'),
    }
  }
}

/**
 * Get fees due for reminders (3 days before due date)
 */
export async function getFeesDueForReminder(
  daysBefore: number = 3
): Promise<{ fees: StudentFee[]; error: null } | { fees: null; error: Error }> {
  try {
    if (!supabaseAdmin) {
      return { fees: null, error: new Error('Service role key not configured') }
    }

    const reminderDate = new Date()
    reminderDate.setDate(reminderDate.getDate() + daysBefore)
    const reminderDateStr = reminderDate.toISOString().split('T')[0]

    const { data, error } = await supabaseAdmin
      .from('student_fees')
      .select('*')
      .eq('status', 'pending')
      .eq('due_date', reminderDateStr)
      .is('reminder_sent_at', null)

    if (error) {
      logger.error('Error fetching fees due for reminder', error as Error)
      return { fees: null, error: new Error(error.message) }
    }

    return { fees: (data || []) as StudentFee[], error: null }
  } catch (error) {
    logger.error('Unexpected error fetching fees due for reminder', error as Error)
    return {
      fees: null,
      error: error instanceof Error ? error : new Error('Failed to fetch fees due for reminder'),
    }
  }
}

/**
 * Get overdue fees
 */
export async function getOverdueFees(): Promise<{ fees: StudentFee[]; error: null } | { fees: null; error: Error }> {
  try {
    if (!supabaseAdmin) {
      return { fees: null, error: new Error('Service role key not configured') }
    }

    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await supabaseAdmin
      .from('student_fees')
      .select('*')
      .eq('status', 'pending')
      .lt('due_date', today)
      .is('overdue_notification_sent_at', null)

    if (error) {
      logger.error('Error fetching overdue fees', error as Error)
      return { fees: null, error: new Error(error.message) }
    }

    return { fees: (data || []) as StudentFee[], error: null }
  } catch (error) {
    logger.error('Unexpected error fetching overdue fees', error as Error)
    return {
      fees: null,
      error: error instanceof Error ? error : new Error('Failed to fetch overdue fees'),
    }
  }
}

/**
 * Mark reminder as sent
 */
export async function markReminderSent(feeId: string): Promise<{ success: boolean; error: null } | { success: false; error: Error }> {
  try {
    if (!supabaseAdmin) {
      return { success: false, error: new Error('Service role key not configured') }
    }

    const { error } = await supabaseAdmin
      .from('student_fees')
      .update({ reminder_sent_at: new Date().toISOString() })
      .eq('id', feeId)

    if (error) {
      logger.error('Error marking reminder as sent', error as Error)
      return { success: false, error: new Error(error.message) }
    }

    return { success: true, error: null }
  } catch (error) {
    logger.error('Unexpected error marking reminder as sent', error as Error)
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Failed to mark reminder as sent'),
    }
  }
}

/**
 * Mark overdue notification as sent and update status
 */
export async function markOverdueNotificationSent(feeId: string): Promise<{ success: boolean; error: null } | { success: false; error: Error }> {
  try {
    if (!supabaseAdmin) {
      return { success: false, error: new Error('Service role key not configured') }
    }

    const { error } = await supabaseAdmin
      .from('student_fees')
      .update({
        status: 'overdue',
        overdue_notification_sent_at: new Date().toISOString(),
      })
      .eq('id', feeId)

    if (error) {
      logger.error('Error marking overdue notification as sent', error as Error)
      return { success: false, error: new Error(error.message) }
    }

    return { success: true, error: null }
  } catch (error) {
    logger.error('Unexpected error marking overdue notification as sent', error as Error)
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Failed to mark overdue notification as sent'),
    }
  }
}

