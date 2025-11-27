-- Migration: Create Fee Reminder and Overdue Notification Jobs
-- Automated reminders for fee payments

-- ============================================
-- 1. Enable pg_cron extension
-- ============================================
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================
-- 2. Function to send fee reminders (3 days before due date)
-- ============================================
CREATE OR REPLACE FUNCTION send_fee_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  fee_record RECORD;
  reminder_date DATE;
BEGIN
  -- Calculate date 3 days from now
  reminder_date := CURRENT_DATE + INTERVAL '3 days';

  -- Find fees due in 3 days that haven't received reminders
  FOR fee_record IN
    SELECT 
      sf.id,
      sf.student_id,
      sf.amount,
      sf.due_date,
      s.first_name,
      s.last_name,
      s.email,
      s.user_id
    FROM student_fees sf
    INNER JOIN students s ON sf.student_id = s.id
    WHERE sf.status = 'pending'
      AND sf.due_date = reminder_date
      AND sf.reminder_sent_at IS NULL
      AND s.is_active = true
  LOOP
    -- Mark reminder as sent
    UPDATE student_fees
    SET reminder_sent_at = NOW()
    WHERE id = fee_record.id;

    -- Send notification to student if they have a user_id
    IF fee_record.user_id IS NOT NULL THEN
      BEGIN
        INSERT INTO notifications (
          title,
          message,
          type,
          target_type,
          target_student_ids,
          created_by_id
        ) VALUES (
          'Fee Reminder',
          'Your ' || (SELECT CASE 
            WHEN fee_type = 'registration' THEN 'registration'
            WHEN fee_type = 'monthly' THEN 'monthly'
            WHEN fee_type = 'yearly' THEN 'yearly'
            WHEN fee_type = 'grading' THEN 'grading'
            ELSE 'fee'
          END FROM student_fees WHERE id = fee_record.id) || ' fee of ₹' || fee_record.amount || ' is due in 3 days.',
          'payment',
          'students',
          ARRAY[fee_record.student_id]::uuid[],
          COALESCE((SELECT user_id FROM profiles WHERE role = 'super_admin' LIMIT 1), fee_record.user_id)
        );
      EXCEPTION WHEN OTHERS THEN
        -- Log error but continue processing other fees
        RAISE WARNING 'Failed to create notification for fee reminder: %', SQLERRM;
      END;
    END IF;
  END LOOP;
END;
$$;

-- ============================================
-- 3. Function to mark overdue fees and send notifications
-- ============================================
CREATE OR REPLACE FUNCTION process_overdue_fees()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  fee_record RECORD;
BEGIN
  -- Find fees that are past due date and haven't been marked overdue
  FOR fee_record IN
    SELECT 
      sf.id,
      sf.student_id,
      sf.amount,
      sf.due_date,
      sf.fee_type,
      s.first_name,
      s.last_name,
      s.email,
      s.user_id
    FROM student_fees sf
    INNER JOIN students s ON sf.student_id = s.id
    WHERE sf.status = 'pending'
      AND sf.due_date < CURRENT_DATE
      AND sf.overdue_notification_sent_at IS NULL
      AND s.is_active = true
  LOOP
    -- Update status to overdue
    UPDATE student_fees
    SET 
      status = 'overdue',
      overdue_notification_sent_at = NOW()
    WHERE id = fee_record.id;

    -- Send notification to student if they have a user_id
    IF fee_record.user_id IS NOT NULL THEN
      BEGIN
        INSERT INTO notifications (
          title,
          message,
          type,
          target_type,
          target_student_ids,
          created_by_id
        ) VALUES (
          'Fee Overdue',
          'Your ' || (SELECT CASE 
            WHEN fee_record.fee_type = 'registration' THEN 'registration'
            WHEN fee_record.fee_type = 'monthly' THEN 'monthly'
            WHEN fee_record.fee_type = 'yearly' THEN 'yearly'
            WHEN fee_record.fee_type = 'grading' THEN 'grading'
            ELSE 'fee'
          END) || ' fee of ₹' || fee_record.amount || ' is now overdue. Please contact your branch admin.',
          'payment',
          'students',
          ARRAY[fee_record.student_id]::uuid[],
          COALESCE((SELECT user_id FROM profiles WHERE role = 'super_admin' LIMIT 1), fee_record.user_id)
        );
      EXCEPTION WHEN OTHERS THEN
        -- Log error but continue processing other fees
        RAISE WARNING 'Failed to create notification for overdue fee: %', SQLERRM;
      END;
    END IF;
  END LOOP;
END;
$$;

-- ============================================
-- 4. Function to generate next period fees for monthly/yearly payments
-- ============================================
CREATE OR REPLACE FUNCTION generate_next_period_fees()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  fee_record RECORD;
  next_period_start DATE;
  next_period_end DATE;
  next_due_date DATE;
  fee_amount DECIMAL(10,2);
  student_branch_id UUID;
  current_preference VARCHAR(20);
BEGIN
  -- Find paid monthly/yearly fees that need next period generation
  FOR fee_record IN
    SELECT 
      sf.id,
      sf.student_id,
      sf.fee_type,
      sf.period_end_date,
      s.branch_id,
      spp.payment_type
    FROM student_fees sf
    INNER JOIN students s ON sf.student_id = s.id
    LEFT JOIN student_payment_preferences spp ON spp.student_id = s.id
    WHERE sf.status = 'paid'
      AND sf.fee_type IN ('monthly', 'yearly')
      AND sf.period_end_date IS NOT NULL
      AND sf.period_end_date < CURRENT_DATE
      AND s.is_active = true
      -- Only generate if payment preference matches fee type (or no preference set yet)
      AND (spp.payment_type = sf.fee_type OR spp.payment_type IS NULL)
      -- Check if next period fee doesn't already exist
      AND NOT EXISTS (
        SELECT 1 FROM student_fees
        WHERE student_id = sf.student_id
          AND fee_type = sf.fee_type
          AND status IN ('pending', 'overdue')
          AND period_start_date > sf.period_end_date
      )
  LOOP
    -- Verify payment preference still matches (student might have switched)
    -- If preference changed, skip generating this fee type
    SELECT payment_type INTO current_preference
    FROM student_payment_preferences
    WHERE student_id = fee_record.student_id;
    
    -- If preference exists and doesn't match, skip
    IF current_preference IS NOT NULL AND current_preference != fee_record.fee_type THEN
      CONTINUE;
    END IF;

    -- Get current fee amount for this type (global fees only)
    SELECT amount INTO fee_amount
    FROM fee_configurations
    WHERE fee_type = fee_record.fee_type
      AND branch_id IS NULL
      AND belt_level IS NULL
      AND is_active = true
    LIMIT 1;

    -- If fee configuration exists, create next period fee
    IF fee_amount IS NOT NULL THEN
      -- Calculate next period dates
      next_period_start := fee_record.period_end_date + INTERVAL '1 day';
      
      IF fee_record.fee_type = 'monthly' THEN
        next_period_end := next_period_start + INTERVAL '1 month';
      ELSE -- yearly
        next_period_end := next_period_start + INTERVAL '1 year';
      END IF;
      
      next_due_date := next_period_end + INTERVAL '1 day';

      -- Create next period fee (with error handling)
      BEGIN
        INSERT INTO student_fees (
          student_id,
          fee_type,
          amount,
          due_date,
          status,
          period_start_date,
          period_end_date
        ) VALUES (
          fee_record.student_id,
          fee_record.fee_type,
          fee_amount,
          next_due_date,
          'pending',
          next_period_start,
          next_period_end
        );
      EXCEPTION WHEN unique_violation THEN
        -- Fee already exists, skip
        RAISE WARNING 'Next period fee already exists for student %', fee_record.student_id;
      WHEN OTHERS THEN
        -- Log other errors but continue
        RAISE WARNING 'Failed to create next period fee for student %: %', fee_record.student_id, SQLERRM;
      END;
    END IF;
  END LOOP;
END;
$$;

-- ============================================
-- 5. Schedule cron jobs
-- ============================================
-- Note: These jobs will run daily at 9 AM UTC
-- Adjust the schedule as needed for your timezone

-- Schedule fee reminder job (runs daily at 9 AM UTC)
SELECT cron.schedule(
  'send-fee-reminders-daily',
  '0 9 * * *', -- 9 AM daily (UTC)
  $$SELECT send_fee_reminders();$$
);

-- Schedule overdue fee processing (runs daily at 9 AM UTC)
SELECT cron.schedule(
  'process-overdue-fees-daily',
  '0 9 * * *', -- 9 AM daily (UTC)
  $$SELECT process_overdue_fees();$$
);

-- Schedule next period fee generation (runs daily at 9 AM UTC)
SELECT cron.schedule(
  'generate-next-period-fees-daily',
  '0 9 * * *', -- 9 AM daily (UTC)
  $$SELECT generate_next_period_fees();$$
);

-- ============================================
-- Migration Complete
-- ============================================
-- Summary:
-- 1. Created send_fee_reminders() function - sends reminders 3 days before due date
-- 2. Created process_overdue_fees() function - marks overdue fees and sends notifications
-- 3. Created generate_next_period_fees() function - auto-generates next period fees after payment
-- 4. Scheduled all functions to run daily at 9 AM UTC via pg_cron
--
-- To verify scheduled jobs:
-- SELECT * FROM cron.job WHERE jobname LIKE '%fee%';
--
-- To check job execution history:
-- SELECT * FROM cron.job_run_details 
-- WHERE jobid IN (SELECT jobid FROM cron.job WHERE jobname LIKE '%fee%')
-- ORDER BY start_time DESC LIMIT 20;
--
-- To unschedule a job:
-- SELECT cron.unschedule('send-fee-reminders-daily');
-- SELECT cron.unschedule('process-overdue-fees-daily');
-- SELECT cron.unschedule('generate-next-period-fees-daily');

