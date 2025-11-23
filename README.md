# Karate Dojo Management Mobile App

A React Native mobile application for managing a karate dojo, built with Expo, TypeScript, and Supabase.

## Features

- ✅ **RBAC Authentication** - Role-based access control (Admin/Student)
- ✅ **Notification System** - Push notifications support
- ✅ **Supabase Integration** - Authentication and database
- ✅ **Expo Router** - File-based routing
- ✅ **TypeScript** - Full type safety
- ✅ **React Native Paper** - Material Design components

## Tech Stack

- **React Native** with Expo
- **TypeScript**
- **Expo Router** - File-based routing
- **Supabase** - Authentication & Database
- **React Native Paper** - UI components
- **React Query** - Data fetching
- **Prisma** - Database ORM (ready for use)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the root directory with your Supabase credentials:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
EXPO_PUBLIC_EMAIL_API_URL=https://your-mess-management-app.vercel.app
```

### 3. Set Up Database

First, create the `profiles` table in your Supabase database. Run this SQL in the Supabase SQL Editor:

```sql
-- Create profiles table for RBAC
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL,
  email TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS profiles_user_id_idx ON profiles(user_id);
CREATE INDEX IF NOT EXISTS profiles_role_idx ON profiles(role);
CREATE INDEX IF NOT EXISTS profiles_email_idx ON profiles(email);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can do everything (for server-side operations)
CREATE POLICY "Service role full access"
  ON profiles FOR ALL
  USING (auth.role() = 'service_role');
```

### 4. Create Admin User

1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add User"
3. Enter:
   - Email: `admin@example.com` (or your preferred email)
   - Password: `Admin123!` (or your preferred password)
   - ✅ Check "Auto Confirm User"
4. Click "Create User"
5. Create a profile for the admin user by running this SQL:

```sql
INSERT INTO profiles (id, user_id, role, email)
SELECT gen_random_uuid(), id, 'admin', email
FROM auth.users
WHERE email = 'admin@example.com'
ON CONFLICT (user_id) DO NOTHING;
```

### 5. Run the App

```bash
# Start Expo development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android
```

## Project Structure

```
karate-dojo-mobile/
├── src/
│   ├── app/              # Expo Router pages
│   │   ├── (auth)/       # Authentication routes
│   │   ├── (admin)/      # Admin routes
│   │   └── (student)/    # Student routes
│   ├── components/       # Reusable components
│   │   └── shared/       # Shared UI components
│   ├── context/          # React contexts
│   │   ├── AuthContext.tsx
│   │   └── NotificationContext.tsx
│   └── lib/              # Utilities
│       ├── supabase.ts
│       ├── profiles.ts
│       ├── notifications.ts
│       └── logger.ts
├── prisma/
│   └── schema.prisma     # Database schema
└── package.json
```

## Authentication Flow

1. User logs in via `/(auth)/login`
2. App checks authentication status
3. App fetches user profile from `profiles` table
4. App routes based on role:
   - `admin` → `/(admin)/(tabs)/dashboard`
   - `student` → `/(student)/(tabs)/dashboard`

## Adding Features

The app is set up with:
- ✅ Authentication system
- ✅ RBAC (Role-based access control)
- ✅ Notification system
- ✅ Shared components
- ✅ Error handling

You can now add your custom features:
- Member management
- Belt progression tracking
- Class scheduling
- Attendance tracking
- Payment management
- etc.

## Database Schema

The app uses Prisma for database management. The schema is in `prisma/schema.prisma`. Currently includes:

- `Profile` - User roles and authentication

Add your custom models to the schema as needed.

## Notes

- The `.env.local` file is gitignored for security
- Make sure to set up RLS policies in Supabase for security
- The notification system is ready but may need additional setup for push notifications

## License

Private project

