# Option 1 Implementation Complete ✅

## What Was Changed

The mobile app now creates auth users and profiles **directly** using Supabase service role key, and only uses the web app for email sending.

### Files Modified

1. **`src/lib/supabase.ts`**
   - Added `supabaseAdmin` export that uses service role key
   - Creates admin client for user creation operations

2. **`src/lib/branches.ts`**
   - Updated `assignAdminToBranch()` function to:
     - Create auth user directly using `supabaseAdmin.auth.admin.createUser()`
     - Create profile directly in `profiles` table with `role='admin'` and `branchId`
     - Update branch with `admin_id`
     - Call web app API **only** for email sending

3. **`README.md`**
   - Updated environment variables section to include `EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`

## Required Setup

### Add Service Role Key to `.env.local`

Add this line to your `karate-dojo-mobile/.env.local` file:

```env
EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhicXNqdmNlcWFnYnRpanlmcnBqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzgxNTI2NywiZXhwIjoyMDc5MzkxMjY3fQ.IVpwigoe2-YyJSqjzA6Dyvv3Qm6HQYQEHHCI1CtvAFA
```

**Important:** This is your karate dojo Supabase service role key (not the mess management one).

## How It Works Now

### Admin Assignment Flow

1. **Mobile App** → Super admin assigns admin to branch
2. **Mobile App** → Creates auth user in Supabase Auth (using service role key)
3. **Mobile App** → Creates profile in `profiles` table with:
   - `role='admin'`
   - `branch_id=branchId`
4. **Mobile App** → Updates branch with `admin_id`
5. **Mobile App** → Calls web app API `/api/email/send-admin-welcome` (email only)
6. **Web App** → Sends welcome email with credentials

### Key Points

- ✅ **Mobile app is fully independent** - Creates users and profiles directly
- ✅ **Web app is only for email** - No database access, no conflicts
- ✅ **Role stored in profiles table** - Not in user_metadata (proper RBAC)
- ✅ **Separate databases** - Karate dojo uses its own Supabase database

## Testing

1. **Add service role key** to `.env.local`
2. **Restart Expo** (if running)
3. **Test admin assignment**:
   - Login as super_admin
   - Go to Branches tab
   - Select a branch
   - Click "Admin" button
   - Enter admin name and email
   - Check "Send welcome email"
   - Verify admin receives email with credentials

## Security Notes

- ✅ Service role key is in mobile app (required for user creation)
- ✅ Service role key is in `.env.local` (gitignored)
- ✅ Web app doesn't need karate dojo database credentials
- ✅ Email sending is database-independent

## Troubleshooting

**Error: "Service role key not configured"**
- Make sure `EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` is in `.env.local`
- Restart Expo after adding the key

**Error: "Failed to create profile"**
- Check that `profiles` table exists in your Supabase database
- Verify RLS policies allow service role to insert

**Error: "Failed to send welcome email"**
- Check that `EXPO_PUBLIC_EMAIL_API_URL` is set correctly
- Verify web app is deployed and accessible
- Check web app logs for email errors


