# Fee Date Assignment Logic - Complete Documentation

This document explains the complete logic for fee date assignment in the Karate Dojo app for all scenarios.

## Overview

The app handles 4 types of fees:
1. **Registration Fee** - One-time fee when student enrolls
2. **Monthly Fee** - Recurring monthly fees
3. **Yearly Fee** - Recurring yearly fees
4. **Grading Fee** - One-time fee when student upgrades belt

## Key Concepts

### Date Fields
- **`due_date`**: The date by which the fee must be paid
- **`period_start_date`**: Start of the billing period (for monthly/yearly fees only)
- **`period_end_date`**: End of the billing period (for monthly/yearly fees only)
- **`enrollment_date`**: The date when the student enrolled/joined

### Fee Status Logic
- **Pending**: Due date is today or in the future
- **Overdue**: Due date has passed and fee is not fully paid
- **Paid**: Fee is fully paid (paid_amount >= amount)

---

## Scenario 1: New Student Registration (Initial Fee Creation)

**Function**: `initializeStudentFees(studentId, paymentType, enrollmentDate)`

### 1.1 Registration Fee

**Due Date Assignment**:
- `due_date` = `enrollmentDate` (exact enrollment date)
- No period dates (period_start_date and period_end_date are NULL)

**Example**:
- Enrollment Date: `2024-01-15`
- Registration Fee Due Date: `2024-01-15`

### 1.2 Monthly Fee (First Period)

**Period Start Calculation**:
1. Extract enrollment day of month (e.g., if enrollment is Jan 15, day = 15)
2. Get today's date
3. Compare today's day with enrollment day:
   - **If today's day < enrollment day**: 
     - Period starts: Current month + enrollment day
     - Example: Today = Jan 10, Enrollment = Jan 15 → Period Start = Jan 15 (current month)
   - **If today's day >= enrollment day**:
     - Period starts: Next month + enrollment day
     - Example: Today = Jan 20, Enrollment = Jan 15 → Period Start = Feb 15 (next month)

**Period End Calculation**:
- Add exactly 1 month to period start
- Handle month overflow (e.g., Jan 31 + 1 month = Feb 28/29, not Mar 3)
- If month overflow occurs, set to last day of target month

**Due Date Calculation**:
- `due_date` = `period_end_date` + 1 day
- Due date is the day after the period ends

**Examples**:

**Example A**: New student registered today
- Enrollment Date: `2024-01-15` (today)
- Today: `2024-01-15`
- Enrollment Day: `15`
- Today's Day: `15` (equal to enrollment day)
- **Period Start**: `2024-02-15` (next month, enrollment day)
- **Period End**: `2024-03-15` (period start + 1 month)
- **Due Date**: `2024-03-16` (period end + 1 day)

**Example B**: New student registered earlier this month
- Enrollment Date: `2024-01-10` (past date)
- Today: `2024-01-20`
- Enrollment Day: `10`
- Today's Day: `20` (greater than enrollment day)
- **Period Start**: `2024-02-10` (next month, enrollment day)
- **Period End**: `2024-03-10` (period start + 1 month)
- **Due Date**: `2024-03-11` (period end + 1 day)

**Example C**: New student registered later this month
- Enrollment Date: `2024-01-25` (past date)
- Today: `2024-01-20`
- Enrollment Day: `25`
- Today's Day: `20` (less than enrollment day)
- **Period Start**: `2024-01-25` (current month, enrollment day)
- **Period End**: `2024-02-25` (period start + 1 month)
- **Due Date**: `2024-02-26` (period end + 1 day)

**Example D**: Month overflow handling
- Enrollment Date: `2024-01-31`
- Today: `2024-01-15`
- Enrollment Day: `31`
- Today's Day: `15` (less than enrollment day)
- **Period Start**: `2024-01-31` (current month)
- **Period End**: `2024-02-29` (Feb 29 in leap year, or Feb 28 in non-leap year)
- **Due Date**: `2024-03-01` (period end + 1 day)

### 1.3 Yearly Fee (First Period)

**Period Start Calculation**:
1. Compare enrollment date with today:
   - **If enrollment date >= today** (enrollment is today or future):
     - Period starts: Enrollment date itself
     - Example: Enrollment = Jan 15, 2024, Today = Jan 15, 2024 → Period Start = Jan 15, 2024
   
   - **If enrollment date < today** (enrollment is in the past):
     - Compare enrollment month/day with today's month/day:
       - **If enrollment month/day hasn't passed this year**:
         - Period starts: Current year + enrollment month/day
         - Example: Enrollment = Dec 15, 2023, Today = Jan 20, 2024 → Period Start = Dec 15, 2024
       - **If enrollment month/day has passed this year**:
         - Period starts: Next year + enrollment month/day
         - Example: Enrollment = Jan 15, 2023, Today = Jan 20, 2024 → Period Start = Jan 15, 2025

**Period End Calculation**:
- Add exactly 1 year to period start
- Handle leap year edge case (Feb 29 → Feb 28 in non-leap year)
- If leap year adjustment needed, set to last day of previous month (Feb 28)

**Due Date Calculation**:
- `due_date` = `period_end_date` + 1 day

**Examples**:

**Example A**: New student registered today
- Enrollment Date: `2024-01-15` (today)
- Today: `2024-01-15`
- **Period Start**: `2024-01-15` (enrollment date)
- **Period End**: `2025-01-15` (exactly 1 year later)
- **Due Date**: `2025-01-16` (period end + 1 day)

**Example B**: Old student registered with past date
- Enrollment Date: `2023-06-15` (past date)
- Today: `2024-01-20`
- Enrollment Month/Day: `06-15`
- Today's Month/Day: `01-20` (enrollment day hasn't passed this year)
- **Period Start**: `2024-06-15` (current year, enrollment month/day)
- **Period End**: `2025-06-15` (exactly 1 year later)
- **Due Date**: `2025-06-16` (period end + 1 day)

**Example C**: Old student registered with past date (enrollment day passed this year)
- Enrollment Date: `2023-01-10` (past date)
- Today: `2024-01-20`
- Enrollment Month/Day: `01-10`
- Today's Month/Day: `01-20` (enrollment day has passed this year)
- **Period Start**: `2025-01-10` (next year, enrollment month/day)
- **Period End**: `2026-01-10` (exactly 1 year later)
- **Due Date**: `2026-01-11` (period end + 1 day)

**Example D**: Leap year handling
- Enrollment Date: `2024-02-29` (leap year)
- Today: `2024-01-15`
- **Period Start**: `2024-02-29` (enrollment date)
- **Period End**: `2025-02-28` (Feb 28 in non-leap year 2025)
- **Due Date**: `2025-03-01` (period end + 1 day)

---

## Scenario 2: Next Period Fee Generation (After Payment)

**Function**: `generateNextPeriodFee(studentId, feeType, previousPeriodEndDate)`

**Trigger**: When a monthly/yearly fee is fully paid (paid_amount >= amount)

### 2.1 Monthly Fee (Next Period)

**Period Start Calculation**:
- `period_start` = `previous_period_end` + 1 day
- The new period starts the day after the previous period ends

**Period End Calculation**:
- Add exactly 1 month to period start
- Handle month overflow (same as initial fee)

**Due Date Calculation**:
- `due_date` = `period_end_date` + 1 day

**Example**:
- Previous Period End: `2024-02-15`
- **Period Start**: `2024-02-16` (previous end + 1 day)
- **Period End**: `2024-03-16` (period start + 1 month)
- **Due Date**: `2024-03-17` (period end + 1 day)

### 2.2 Yearly Fee (Next Period)

**Period Start Calculation**:
- `period_start` = `previous_period_end` + 1 day

**Period End Calculation**:
- Add exactly 1 year to period start
- Handle leap year edge case

**Due Date Calculation**:
- `due_date` = `period_end_date` + 1 day

**Example**:
- Previous Period End: `2025-01-15`
- **Period Start**: `2025-01-16` (previous end + 1 day)
- **Period End**: `2026-01-16` (exactly 1 year later)
- **Due Date**: `2026-01-17` (period end + 1 day)

### 2.3 Validation Checks

Before generating next period fee:
1. ✅ Student must be active (`is_active = true`)
2. ✅ Payment preference must match fee type
3. ✅ Next period fee must not already exist (check for duplicate periods)
4. ✅ Previous period end date must exist

---

## Scenario 3: Belt Grading Fee

**Function**: `recordBeltGrading(...)`

**Due Date Assignment**:
- `due_date` = `gradingDate` (the date when belt grading was recorded)
- No period dates (period_start_date and period_end_date are NULL)

**Example**:
- Grading Date: `2024-03-10`
- Grading Fee Due Date: `2024-03-10`

---

## Scenario 4: Fee Status Determination

**Function**: `getCorrectFeeStatus(fee)`

### Status Logic

1. **If fee is paid**: Status = `'paid'` (never changes)
2. **If paid_amount >= amount**: Status = `'paid'` (fully paid)
3. **If due_date > today**: Status = `'pending'` (future due date)
4. **If due_date === today**: Status = `'pending'` (due today, not overdue until tomorrow)
5. **If due_date < today**: Status = `'overdue'` (past due date)

### Date Comparison Method

- Uses local timezone (not UTC)
- Dates are normalized to start of day (00:00:00)
- Parses `due_date` as YYYY-MM-DD format
- Compares dates without time components

---

## Scenario 5: Payment Preference Switch

**Function**: `switchPaymentPreference(studentId, newPaymentType, switchDate)`

**Behavior**:
- Updates payment preference record
- Old pending fees remain (not cancelled)
- New fees generated after switch date will use new payment type
- Next period fee generation checks payment preference before creating fee

**Note**: Existing pending fees are not automatically cancelled or modified.

---

## Edge Cases Handled

### 1. Month Overflow
- **Problem**: Jan 31 + 1 month = Mar 3 (incorrect)
- **Solution**: Check if date changed after adding month, if yes, set to last day of target month
- **Result**: Jan 31 + 1 month = Feb 28/29 (correct)

### 2. Leap Year
- **Problem**: Feb 29 + 1 year = Mar 1 in non-leap year (incorrect)
- **Solution**: Check if date changed after adding year, if yes, set to last day of previous month
- **Result**: Feb 29 + 1 year = Feb 28 in non-leap year (correct)

### 3. Old Student Registration
- **Problem**: Registering old student with past enrollment date creates fees for past periods
- **Solution**: Align period start with enrollment day/month but use current or next period
- **Result**: Fees start from current or next period, not past periods

### 4. Duplicate Period Prevention
- **Check**: Before creating monthly/yearly fee, verify no overlapping period exists
- **Logic**: Periods overlap if `start1 <= end2 AND end1 >= start2`
- **Result**: Prevents duplicate fees for same period

### 5. Inactive Student Protection
- **Check**: Cannot create monthly/yearly fees for inactive students
- **Result**: Only active students receive recurring fees

---

## Summary Table

| Fee Type | Due Date | Period Start | Period End | Notes |
|----------|----------|-------------|------------|-------|
| **Registration** | Enrollment date | NULL | NULL | One-time fee |
| **Monthly (Initial)** | Period end + 1 day | Aligned with enrollment day (current/next month) | Period start + 1 month | Handles month overflow |
| **Monthly (Next)** | Period end + 1 day | Previous period end + 1 day | Period start + 1 month | Generated after payment |
| **Yearly (Initial)** | Period end + 1 day | Enrollment date or aligned with enrollment month/day | Period start + 1 year | Handles leap year |
| **Yearly (Next)** | Period end + 1 day | Previous period end + 1 day | Period start + 1 year | Generated after payment |
| **Grading** | Grading date | NULL | NULL | One-time fee, linked to belt grading |

---

## Key Functions Reference

1. **`initializeStudentFees()`** - Creates initial fees for new student
2. **`generateNextPeriodFee()`** - Creates next period fee after payment
3. **`createStudentFee()`** - Creates a single fee record
4. **`getCorrectFeeStatus()`** - Determines correct fee status based on due date
5. **`recordBeltGrading()`** - Creates grading fee when belt is upgraded
6. **`switchPaymentPreference()`** - Changes student's payment plan

---

## Important Notes

1. **All dates are stored in YYYY-MM-DD format** (ISO date string)
2. **Date comparisons use local timezone** (not UTC)
3. **Period dates are only for monthly/yearly fees** (NULL for registration/grading)
4. **Due date is always period end + 1 day** for monthly/yearly fees
5. **Status is automatically corrected** when fetching fees if due date has passed
6. **Next period fee is generated automatically** when monthly/yearly fee is fully paid
7. **Enrollment day alignment** ensures fees are always due on the same day of month/year


