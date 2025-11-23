# Auto-Delete Notifications Setup Guide

## Overview

The notification system now automatically deletes notifications older than 7 days. This keeps the database clean and prevents it from growing indefinitely.

## What Was Implemented

### 1. ✅ Database Function
- **File**: `prisma/migrations/010_auto_delete_old_notifications.sql`
- **Function**: `delete_old_notifications()` - Deletes notifications older than 7 days
- **Cascade**: Automatically deletes associated `notification_recipients` (due to ON DELETE CASCADE)

### 2. ✅ Automatic Scheduling
- Uses `pg_cron` to run daily at 2 AM UTC
- Automatically cleans up old notifications
- Safe to run multiple times (idempotent)

### 3. ✅ Manual Delete Buttons
- **Admin Notifications List**: Delete button on each notification card
- **Admin Notification Details**: Delete button in header
- **Confirmation**: Requires confirmation before deletion
- **Image Cleanup**: Attempts to delete associated images from storage

## Setup Instructions

### Step 1: Run the Migration

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Open `prisma/migrations/010_auto_delete_old_notifications.sql`
3. Copy and paste the entire SQL
4. Click **Run**

### Step 2: Verify pg_cron is Enabled

The migration will check if `pg_cron` is available. If you see a notice that it's not available:

1. Go to **Supabase Dashboard** → **Database** → **Extensions**
2. Search for `pg_cron`
3. Enable it if it's not already enabled

### Step 3: Test the Function (Optional)

To test that the function works:

```sql
-- Check how many notifications would be deleted
SELECT COUNT(*) FROM notifications 
WHERE created_at < NOW() - INTERVAL '7 days';

-- Run the cleanup function manually
SELECT delete_old_notifications();

-- Verify it worked
SELECT COUNT(*) FROM notifications 
WHERE created_at < NOW() - INTERVAL '7 days';
```

### Step 4: Verify Cron Schedule

Check if the cron job was scheduled:

```sql
SELECT * FROM cron.job WHERE jobname = 'delete-old-notifications-daily';
```

You should see a row with the schedule `0 2 * * *` (2 AM daily).

## Alternative: Supabase Edge Function (If pg_cron Not Available)

If `pg_cron` is not available in your Supabase plan, you can use a Supabase Edge Function with a cron trigger:

1. Create an Edge Function that calls `delete_old_notifications()`
2. Set up a cron trigger in Supabase Dashboard
3. The function will run daily and clean up old notifications

## How It Works

1. **Daily Cleanup**: Every day at 2 AM UTC, the function runs
2. **Delete Old Notifications**: Removes notifications older than 7 days
3. **Cascade Delete**: Automatically removes associated `notification_recipients`
4. **Image Cleanup**: Images in storage are NOT automatically deleted (they remain in Supabase Storage)

## Manual Delete Feature

### Admin Notifications List
- Each notification card has a delete button (trash icon) on the right
- Click to delete with confirmation dialog
- Shows loading state while deleting

### Notification Details Screen
- Delete button in the header (top right)
- Requires confirmation before deletion
- Navigates back after successful deletion

## Important Notes

1. **7-Day Retention**: Notifications are kept for 7 days, then automatically deleted
2. **No Recovery**: Deleted notifications cannot be recovered
3. **Image Storage**: Images in Supabase Storage are NOT automatically deleted (to save storage operations)
4. **Manual Delete**: Admins can delete notifications immediately using the delete buttons
5. **Cascade**: Deleting a notification also deletes all associated recipients

## Customizing Retention Period

To change from 7 days to a different period, edit the migration file:

```sql
-- Change from 7 days to 30 days
WHERE created_at < NOW() - INTERVAL '30 days';
```

Then run the updated migration.

## Monitoring

Check how many notifications will be deleted:

```sql
SELECT COUNT(*) as old_notifications
FROM notifications 
WHERE created_at < NOW() - INTERVAL '7 days';
```

Check recent cleanup activity:

```sql
SELECT * FROM cron.job_run_details 
WHERE jobname = 'delete-old-notifications-daily'
ORDER BY start_time DESC 
LIMIT 10;
```

## Troubleshooting

### "pg_cron extension not available"
- Enable `pg_cron` in Supabase Dashboard → Database → Extensions
- Or use a Supabase Edge Function with cron trigger instead

### "Cron job not running"
- Check if the job exists: `SELECT * FROM cron.job WHERE jobname = 'delete-old-notifications-daily';`
- Check for errors: `SELECT * FROM cron.job_run_details WHERE jobname = 'delete-old-notifications-daily' ORDER BY start_time DESC LIMIT 5;`

### "Function not found"
- Make sure you ran the migration: `010_auto_delete_old_notifications.sql`
- Verify the function exists: `SELECT * FROM pg_proc WHERE proname = 'delete_old_notifications';`

## ✅ Verification Checklist

- [ ] Migration `010_auto_delete_old_notifications.sql` run successfully
- [ ] Function `delete_old_notifications()` exists
- [ ] Cron job scheduled (or Edge Function set up)
- [ ] Delete buttons visible in admin notifications screen
- [ ] Delete confirmation dialog works
- [ ] Manual delete works correctly
- [ ] Test: Create a notification, wait 7 days, verify it's deleted (or manually test by adjusting the date)

