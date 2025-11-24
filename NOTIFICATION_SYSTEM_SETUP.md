# Notification System Setup Guide

## ✅ Implementation Complete

The notification system has been fully implemented with:
- Database schema and migrations
- Admin screens (list, create, details)
- Student screens (view notifications)
- Push notification support
- Image upload support
- Read tracking

## 📋 Setup Steps

### 1. Run Database Migration

Execute the SQL migration in Supabase SQL Editor:

```sql
-- File: karate-dojo-mobile/prisma/migrations/006_create_notifications_system.sql
-- Copy and paste the entire file content into Supabase SQL Editor
```

This will create:
- `notifications` table
- `notification_recipients` table
- `user_push_tokens` table
- RLS policies
- Indexes and triggers

**Note:** The migration is idempotent - safe to run multiple times.

### 2. Create Supabase Storage Bucket

1. Go to Supabase Dashboard → Storage
2. Click "Create bucket"
3. Name: `notification-images`
4. Set to **Public** (for easy image access)
5. Click "Create bucket"

### 3. Update Prisma Schema (Already Done)

The Prisma schema has been updated with:
- `Notification` model
- `NotificationRecipient` model
- `UserPushToken` model

Run:
```bash
npx prisma generate
```

### 4. Configure Expo Push Notifications

Add to `app.json`:
```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "your-project-id"
      }
    },
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#7B2CBF"
        }
      ]
    ]
  }
}
```

Get your project ID from: https://expo.dev/accounts/[your-account]/projects/[your-project]

### 5. Test the System

1. **Admin Side:**
   - Navigate to "Notifications" tab
   - Click "Create" button
   - Fill in title, message, select type
   - Optionally add image
   - Select target (All/Branch/Specific Students)
   - Send notification

2. **Student Side:**
   - Navigate to "Notifications" tab
   - View received notifications
   - Tap to mark as read
   - See unread count badge

## 🎯 Features

### Notification Types
- **Announcement** - General announcements
- **Alert** - Important alerts
- **Reminder** - Reminders
- **Achievement** - Achievements
- **Event** - Events
- **Payment** - Payment related
- **Class** - Class updates
- **System** - System notifications

### Targeting Options
- **All Students** - Send to all active students
- **Specific Branch** - Send to students in a branch
- **Specific Students** - Manually select students

### Image Support
- Upload from camera or gallery
- Max size: 5MB (handled by Expo)
- Stored in Supabase Storage
- Public URLs for easy access

### Push Notifications
- Automatically sent when notification is created
- Uses Expo Push API
- Works when app is closed
- Tracks delivery status

### Read Tracking
- Mark as read/unread
- Read timestamp
- Unread count badge
- Read statistics for admins

## 📱 Screens

### Admin Screens
- **Notifications List** (`notifications.tsx`)
  - View all sent notifications
  - Search and filter
  - Statistics
  - Navigate to details

- **Create Notification** (`create-notification.tsx`)
  - Form with title, message, type
  - Image upload (camera/gallery)
  - Target selection
  - Preview and send

- **Notification Details** (`notification-details.tsx`)
  - Full notification content
  - Image display
  - Recipient list with read status
  - Statistics

### Student Screens
- **Notifications** (`notifications.tsx`)
  - List of received notifications
  - Unread badge
  - Mark as read on tap
  - Image display
  - Pull to refresh

## 🔒 Permissions

### Who Can Send
- **Super Admin** - Can send to all students, any branch, or specific students

### Who Can Receive
- **Students** - Can receive and read notifications sent to them

## 🐛 Troubleshooting

### Push Notifications Not Working
1. Check Expo project ID in `app.json`
2. Verify push token is registered in `user_push_tokens` table
3. Check notification permissions are granted
4. Verify Expo Push API is accessible

### Images Not Uploading
1. Check Supabase Storage bucket exists and is public
2. Verify service role key is configured
3. Check image file size (should be < 5MB)

### Notifications Not Appearing
1. Check RLS policies are correct
2. Verify user is a recipient in `notification_recipients` table
3. Check notification was sent successfully

## 📝 Notes

- The migration is idempotent - safe to run multiple times
- Image upload uses base64 encoding for React Native compatibility
- Push tokens are automatically registered on login
- Read count is automatically updated via database trigger


