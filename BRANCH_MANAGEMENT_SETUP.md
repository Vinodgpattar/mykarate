# Branch Management Setup Guide

## ✅ Implementation Complete

The branch management feature has been fully implemented with proper RBAC using the profiles table.

## 📋 Setup Steps

### 1. Run Database Migration

Execute the SQL migration in Supabase SQL Editor:

```sql
-- File: karate-dojo-mobile/prisma/migrations/002_create_branches_table.sql
-- Copy and paste the entire file content into Supabase SQL Editor
```

This will:
- Create the `branches` table
- Add `branch_id` column to `profiles` table
- Set up RLS policies

### 2. Update Your Profile to Super Admin

In Supabase SQL Editor, run:

```sql
-- Replace 'your-user-id' with your actual user ID from auth.users
UPDATE profiles 
SET role = 'super_admin' 
WHERE user_id = 'your-user-id'::uuid;
```

To find your user ID:
1. Go to Supabase Dashboard → Authentication → Users
2. Find your user and copy the UUID
3. Use it in the SQL above

### 3. Configure Email API URL

Add to your `.env.local` file:

```env
EXPO_PUBLIC_EMAIL_API_URL=https://your-mess-management-app.vercel.app
```

Replace with your actual Vercel deployment URL for the mess-management-app.

### 4. Deploy Web App API Endpoints

Make sure your mess-management-app is deployed to Vercel with:
- `/api/admin/create-user` - Creates auth user and profile
- `/api/email/send-admin-welcome` - Sends welcome email
- `/api/email/send-admin-removed` - Sends removal email

## 🎯 How It Works

### Branch Creation Flow:
1. Super Admin creates branch → Mobile app calls Supabase directly
2. Branch saved to `branches` table
3. If "Assign Admin" checked → Calls `/api/admin/create-user`
4. Backend creates:
   - Auth user in Supabase Auth (NO user_metadata.role)
   - Profile in `profiles` table with `role='admin'` and `branchId`
5. Welcome email sent via `/api/email/send-admin-welcome`

### Admin Assignment Flow:
1. Super Admin assigns admin → Mobile app calls `/api/admin/create-user`
2. Backend creates auth user + profile (role stored in profiles table)
3. Welcome email sent with credentials

### Change Admin Flow:
1. Super Admin changes admin → Mobile app:
   - Removes old admin (sets `branch_id` to null in profiles)
   - Sends removal email to old admin
   - Creates new admin (same as assignment flow)
   - Sends welcome email to new admin

## 🔐 Security

- ✅ Roles stored in `profiles` table (not user_metadata)
- ✅ Service role key only in backend (web app)
- ✅ RLS policies protect branch data
- ✅ Super admin only can manage branches
- ✅ Branch admins can only see their branch

## 📱 Mobile App Features

- **Branch List**: View all branches with status
- **Create Branch**: Simple form (name, optional code, optional address)
- **Edit Branch**: Update branch details
- **Delete Branch**: Soft delete if has students
- **Assign Admin**: Create admin user and assign to branch
- **Change Admin**: Replace current admin

## 🧪 Testing

1. **Test Branch Creation**:
   - Login as super_admin
   - Go to Branches tab
   - Create a new branch
   - Verify it appears in the list

2. **Test Admin Assignment**:
   - Select a branch
   - Click "Admin" button
   - Enter admin name and email
   - Check "Send welcome email"
   - Verify admin receives email with credentials

3. **Test Admin Login**:
   - Use credentials from email
   - Login should work
   - Should route to admin dashboard
   - Should only see their branch data

## ⚠️ Important Notes

1. **Email API URL**: Must be set in `.env.local` for email sending to work
2. **Backend API**: The `/api/admin/create-user` endpoint must be deployed
3. **Database**: Both apps use the same Supabase project/database
4. **Profile Role**: Always stored in `profiles` table, never in `user_metadata`

## 🐛 Troubleshooting

**"Branch not found" error**:
- Make sure the migration was run
- Check that branch exists in Supabase

**"Failed to create admin user"**:
- Check that `/api/admin/create-user` endpoint is deployed
- Verify `EXPO_PUBLIC_EMAIL_API_URL` is set correctly
- Check backend logs for errors

**"Email not sent"**:
- Verify `EXPO_PUBLIC_EMAIL_API_URL` is correct
- Check that Gmail credentials are set in web app
- Verify email API endpoints are deployed

**"Access denied"**:
- Make sure your profile has `role='super_admin'`
- Check RLS policies are set up correctly


