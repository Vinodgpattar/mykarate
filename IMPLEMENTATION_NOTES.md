# Branch Management Implementation Notes

## ✅ Completed

1. **Database Schema**
   - Branch model added to Prisma schema
   - Profile model updated with branchId and super_admin role
   - SQL migration file created

2. **Email API Endpoints (Web App)**
   - `/api/email/send-admin-welcome` - Welcome email for new admins
   - `/api/email/send-admin-removed` - Removal email for removed admins

3. **Mobile App Screens**
   - Branch list screen with React Native Paper
   - Create/Edit branch screen
   - Assign/Change admin screen

4. **Library Functions**
   - Branch CRUD operations
   - Admin assignment functions

## ⚠️ Important: Admin User Creation

The `assignAdminToBranch` function currently returns an error because creating auth users requires the service role key, which should NOT be in the mobile app.

### Solution Options:

**Option 1: Create Backend API Endpoint (Recommended)**
Create an API endpoint in your backend (can be in mess-management-app or a separate API):

```typescript
// POST /api/admin/create-user
// Requires: email, password, name, branchId
// Returns: { userId, success }
```

Then update `assignAdminToBranch` in `src/lib/branches.ts` to call this API.

**Option 2: Use Supabase Edge Function**
Create a Supabase Edge Function that handles user creation with service role key.

**Option 3: Temporary Workaround**
For development, you can temporarily add the service role key to `.env.local` and update the code, but this is NOT recommended for production.

## 📋 Next Steps

1. **Run Database Migration**
   - Execute `prisma/migrations/002_create_branches_table.sql` in Supabase SQL Editor

2. **Set Up Email API URL**
   - Add to `.env.local`: `EXPO_PUBLIC_EMAIL_API_URL=https://your-vercel-app.vercel.app`
   - Update the URL in `src/lib/branches.ts` if needed

3. **Create Admin User Creation API**
   - Implement the backend API endpoint for creating admin users
   - Update `assignAdminToBranch` function to use it

4. **Test the Flow**
   - Create a super_admin profile in database
   - Test branch creation
   - Test admin assignment (after implementing API)

## 🔐 Security Notes

- Service role key should NEVER be in mobile app
- All admin user creation should go through backend API
- RLS policies are set up for branch access control
- Super admins have full access, branch admins can only see their branch


