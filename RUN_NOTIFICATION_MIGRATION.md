# Run Notification System Migration

## ⚠️ Important: Database Migration Required

The notification system requires database tables to be created. You must run the migration before using the notification features.

## 📋 Steps to Run Migration

### 1. Open Supabase SQL Editor

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor** (left sidebar)
3. Click **New Query**

### 2. Copy Migration File

Open the file: `karate-dojo-mobile/prisma/migrations/006_create_notifications_system.sql`

Copy the **entire contents** of the file.

### 3. Paste and Run

1. Paste the SQL into the Supabase SQL Editor
2. Click **Run** (or press Ctrl+Enter / Cmd+Enter)
3. Wait for the migration to complete

You should see: "Success. No rows returned"

### 4. Create Storage Bucket

1. Go to **Storage** in Supabase Dashboard
2. Click **Create bucket**
3. Name: `notification-images`
4. Set to **Public** (toggle on)
5. Click **Create bucket**

### 5. Verify Migration

Run this query in SQL Editor to verify:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('notifications', 'notification_recipients', 'user_push_tokens');
```

You should see all 3 tables listed.

### 6. Test the Feature

1. Go to the app
2. Navigate to **Notifications** tab (Admin)
3. Click **Create** button
4. Try creating a notification

## 🐛 Troubleshooting

### Error: "Could not find the 'created_by' column"
- **Solution:** The migration hasn't been run. Follow steps 1-3 above.

### Error: "relation 'notifications' does not exist"
- **Solution:** The migration hasn't been run. Follow steps 1-3 above.

### Error: "bucket 'notification-images' does not exist"
- **Solution:** Create the storage bucket (step 4 above).

### Migration Fails with "already exists" errors
- **Solution:** This is normal - the migration is idempotent. The errors are safe to ignore if tables already exist.

## ✅ Migration Complete When:

- ✅ All 3 tables exist (notifications, notification_recipients, user_push_tokens)
- ✅ Storage bucket `notification-images` exists and is public
- ✅ You can create notifications without errors


