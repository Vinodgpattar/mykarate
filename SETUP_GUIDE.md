# Karate Dojo Mobile App - Setup Guide

## Quick Start

### 1. Create `.env.local` file

Since `.env.local` is gitignored, you need to create it manually. Create a file named `.env.local` in the root directory with:

```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://xbqsjvceqagbtijyfrpj.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhicXNqdmNlcWFnYnRpanlmcnBqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MTUyNjcsImV4cCI6MjA3OTM5MTI2N30.L0kGlAuAiRVnJ7cWF7y0j9cNCwYUj6hCYPJ9uMh8DgY
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhicXNqdmNlcWFnYnRpanlmcnBqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzgxNTI2NywiZXhwIjoyMDc5MzkxMjY3fQ.IVpwigoe2-YyJSqjzA6Dyvv3Qm6HQYQEHHCI1CtvAFA

# Database Configuration
DATABASE_URL=postgresql://postgres.xbqsjvceqagbtijyfrpj:KarateApp3791@aws-1-ap-south-1.pooler.supabase.com:6543/postgres
```

### 2. Set Up Database

Run the SQL migration in Supabase SQL Editor:

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `prisma/migrations/001_create_profiles_table.sql`
4. Click "Run"

### 3. Create Admin User

1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add User"
3. Enter:
   - Email: `admin@karatedojo.com` (or your preferred email)
   - Password: `Admin123!` (or your preferred password)
   - ✅ Check "Auto Confirm User"
4. Click "Create User"
5. Create a profile for the admin user by running this SQL in SQL Editor:

```sql
INSERT INTO profiles (id, user_id, role, email)
SELECT gen_random_uuid(), id, 'admin', email
FROM auth.users
WHERE email = 'admin@karatedojo.com'
ON CONFLICT (user_id) DO NOTHING;
```

Replace `admin@karatedojo.com` with the email you used.

### 4. Install Dependencies

```bash
cd karate-dojo-mobile
npm install
```

### 5. Run the App

```bash
# Start Expo development server
npm start

# Then press:
# - 'i' for iOS simulator
# - 'a' for Android emulator
# - Scan QR code with Expo Go app on your phone
```

## What's Included

✅ **Authentication System**
- Login screen
- Role-based routing (Admin/Student)
- Session management

✅ **RBAC (Role-Based Access Control)**
- Profiles table for role management
- Secure role checking

✅ **Notification System**
- Push notification support
- Notification history
- Configurable settings

✅ **Shared Components**
- ErrorBoundary
- DatePicker
- ConfirmDialog

✅ **Infrastructure**
- Supabase integration
- Logger utility
- Theme configuration
- TypeScript setup

## Next Steps

1. **Add your custom features** - The app structure is ready for:
   - Member management
   - Belt progression
   - Class scheduling
   - Attendance tracking
   - Payment management

2. **Customize the UI** - Update colors, icons, and styling in:
   - `src/lib/theme.ts` - Theme colors
   - `app.json` - App configuration

3. **Add database models** - Update `prisma/schema.prisma` with your models

## Troubleshooting

### "Missing Supabase environment variables"
- Make sure `.env.local` exists in the root directory
- Check that all variables are set correctly

### "No profile found"
- Make sure you've run the SQL migration
- Create a profile for your admin user using the SQL above

### Login not working
- Verify the user exists in Supabase Auth
- Check that the profile exists in the profiles table
- Ensure the role is set to 'admin' or 'student'

## Support

For issues or questions, refer to the main README.md file.


