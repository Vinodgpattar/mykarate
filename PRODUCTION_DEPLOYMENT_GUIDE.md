# Production Deployment Guide - Karate Dojo Mobile App
**Step-by-Step Checklist for Production Deployment**

---

## ⚠️ IMPORTANT: Read This First

**Current Status:** The app has **critical security issues** that MUST be fixed before production deployment.

**Critical Blockers:**
1. 🔴 Service role key in mobile app (SECURITY VULNERABILITY)
2. 🔴 RLS policies not verified
3. 🔴 console.log statements in production code

**Estimated Time to Production-Ready:** 2-4 weeks

---

## Phase 1: Critical Security Fixes (Week 1-2)

### Step 1: Remove Service Role Key from Mobile App

**What to do:**
1. Create Supabase Edge Functions for admin operations:
   - `create-student` - For creating students with auth users
   - `create-admin` - For creating branch admins
   - `delete-user` - For deleting users
   - `storage-monitoring` - For storage usage tracking

2. Update mobile app to call Edge Functions instead of using service role key

3. Remove `EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` from `.env.local`

4. Remove service role key code from `src/lib/supabase.ts`

**Time Required:** 3-5 days

**Resources Needed:**
- Supabase Dashboard access
- Knowledge of Supabase Edge Functions
- Testing environment

---

### Step 2: Verify RLS Policies in Supabase

**What to do:**
1. Go to Supabase Dashboard → Authentication → Policies

2. Verify RLS policies for each table:

   **Students Table:**
   - ✅ Students can only read their own data
   - ✅ Super admins can read/write all students
   - ✅ Branch admins can read/write their branch's students
   - ✅ Students cannot update/delete their own records

   **Profiles Table:**
   - ✅ Users can read their own profile
   - ✅ Admins can read all profiles
   - ✅ Only service role can update role field

   **Branches Table:**
   - ✅ Super admins have full access
   - ✅ Branch admins can read their own branch

   **Student Fees Table:**
   - ✅ Students can only read their own fees
   - ✅ Admins can read/write all fees

   **Notifications Table:**
   - ✅ Students can only read notifications sent to them
   - ✅ Admins can read/write all notifications

3. Test with different user roles:
   - Create a test student account
   - Try to access another student's data (should fail)
   - Verify admin can access all data

**Time Required:** 2-3 days

**Resources Needed:**
- Supabase Dashboard access
- Test accounts for each role

---

### Step 3: Remove console.log Statements

**What to do:**
1. Search for all `console.log`, `console.error`, `console.warn` in the codebase

2. Replace with logger utility:
   - `console.log` → `logger.debug()` or `logger.info()`
   - `console.error` → `logger.error()`
   - `console.warn` → `logger.warn()`

3. Verify logger is configured for production (Sentry integration)

4. Test that no console statements remain

**Time Required:** 1-2 days

**Files to Check:**
- `src/context/AuthContext.tsx`
- `src/app/(auth)/login.tsx`
- All other files with console statements

---

### Step 4: Add Error Boundaries

**What to do:**
1. Wrap root app in ErrorBoundary component

2. Add error boundaries to critical screens:
   - Dashboard screens
   - Student creation/edit screens
   - Payment recording screens
   - Notification screens

3. Test error scenarios:
   - Simulate network errors
   - Simulate API failures
   - Verify graceful error handling

**Time Required:** 1 day

---

## Phase 2: Environment Setup (Week 2-3)

### Step 5: Set Up Production Environment Variables

**What to do:**
1. Create production `.env.local` file (DO NOT commit to git)

2. Set required variables:
   ```
   EXPO_PUBLIC_SUPABASE_URL=your_production_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
   EXPO_PUBLIC_SENTRY_DSN=your_sentry_dsn (optional but recommended)
   ```

3. **DO NOT** include service role key in mobile app

4. Verify all environment variables are set

5. Test app with production environment variables

**Time Required:** 1 day

**Important:** Never commit `.env.local` to git!

---

### Step 6: Configure Supabase Production Project

**What to do:**
1. Create a new Supabase project for production (or use existing)

2. Run all database migrations:
   - Go to Supabase Dashboard → SQL Editor
   - Run all migration files in order (001, 002, 003, etc.)
   - Verify all tables are created

3. Set up RLS policies (from Step 2)

4. Create storage buckets:
   - `student-documents` - For student photos and Aadhar cards
   - `admin-profiles` - For admin profile images
   - `notification-images` - For notification images
   - `public-assets` - For public gallery images

5. Configure storage bucket policies:
   - Set appropriate RLS policies for each bucket
   - Verify admins can upload, students can only read their own files

6. Set up Edge Functions (from Step 1)

7. Configure email service (if using):
   - Set up email templates
   - Test email sending

**Time Required:** 2-3 days

**Resources Needed:**
- Supabase Dashboard access
- All migration SQL files

---

### Step 7: Set Up Error Tracking (Sentry)

**What to do:**
1. Create Sentry account (if not already done)

2. Create a new project for mobile app

3. Get Sentry DSN

4. Add DSN to `.env.local`:
   ```
   EXPO_PUBLIC_SENTRY_DSN=your_sentry_dsn
   ```

5. Verify Sentry integration:
   - Test error reporting
   - Verify errors appear in Sentry dashboard

6. Set up error alerts:
   - Configure email/Slack notifications
   - Set up error thresholds

**Time Required:** 1 day

**Resources Needed:**
- Sentry account
- Sentry DSN

---

## Phase 3: Testing & Quality Assurance (Week 3)

### Step 8: Comprehensive Testing

**What to do:**
1. **Functional Testing:**
   - Test all admin features
   - Test all student features
   - Test public view
   - Test navigation flows
   - Test form submissions
   - Test image uploads

2. **Security Testing:**
   - Test RLS policies (students cannot access other students' data)
   - Test authentication (login/logout)
   - Test authorization (role-based access)
   - Test input validation

3. **Performance Testing:**
   - Test app startup time
   - Test image loading
   - Test data fetching
   - Test with slow network

4. **Error Testing:**
   - Test with no internet connection
   - Test with invalid credentials
   - Test with missing data
   - Test error boundaries

5. **Device Testing:**
   - Test on Android devices
   - Test on iOS devices (if applicable)
   - Test on different screen sizes
   - Test on different OS versions

**Time Required:** 3-5 days

**Resources Needed:**
- Test devices
- Test accounts
- Test data

---

### Step 9: Load Testing

**What to do:**
1. Test with multiple concurrent users:
   - 10 users
   - 50 users
   - 100 users (if applicable)

2. Monitor:
   - Response times
   - Error rates
   - Database performance
   - Storage usage

3. Identify bottlenecks:
   - Slow queries
   - Memory issues
   - Network issues

4. Optimize if needed:
   - Add indexes
   - Optimize queries
   - Add caching

**Time Required:** 1-2 days

**Resources Needed:**
- Load testing tools
- Monitoring tools

---

## Phase 4: App Store Preparation (Week 3-4)

### Step 10: Prepare App Store Assets

**What to do:**
1. **App Icons:**
   - Create app icon (1024x1024 for iOS, various sizes for Android)
   - Create adaptive icon for Android
   - Create splash screen image

2. **Screenshots:**
   - Take screenshots of all major screens
   - Create screenshots for different device sizes
   - Create promotional images

3. **App Store Listing:**
   - Write app description
   - Write app keywords
   - Write release notes
   - Create app preview video (optional)

4. **Privacy Policy:**
   - Create privacy policy document
   - Host it online (or include in app)
   - Link to it in app store listing

5. **Terms of Service:**
   - Create terms of service document
   - Host it online
   - Link to it in app

**Time Required:** 2-3 days

**Resources Needed:**
- Design tools
- App store developer accounts

---

### Step 11: Configure App Build Settings

**What to do:**
1. **Update app.json:**
   - Set production app name
   - Set production bundle identifier
   - Set production version number
   - Configure app icons and splash screen

2. **Android Configuration:**
   - Set package name
   - Configure signing key
   - Set minimum SDK version
   - Configure permissions

3. **iOS Configuration (if applicable):**
   - Set bundle identifier
   - Configure signing certificates
   - Set minimum iOS version
   - Configure permissions

4. **Build Configuration:**
   - Set production environment
   - Configure build variants
   - Set up code signing

**Time Required:** 1-2 days

**Resources Needed:**
- App store developer accounts
- Signing certificates

---

## Phase 5: Pre-Deployment Checklist (Week 4)

### Step 12: Final Pre-Deployment Checks

**What to do:**
1. **Code Review:**
   - Review all recent changes
   - Verify no debug code
   - Verify no test data
   - Verify no hardcoded credentials

2. **Environment Verification:**
   - Verify all environment variables are set
   - Verify production Supabase project is configured
   - Verify Edge Functions are deployed
   - Verify storage buckets are set up

3. **Database Verification:**
   - Verify all migrations are applied
   - Verify RLS policies are active
   - Verify indexes are created
   - Verify test data is removed

4. **Security Verification:**
   - Verify service role key is removed from mobile app
   - Verify RLS policies are tested
   - Verify error messages don't leak sensitive info
   - Verify input validation is in place

5. **Performance Verification:**
   - Verify image compression is working
   - Verify storage usage is monitored
   - Verify app performance is acceptable
   - Verify no memory leaks

6. **Documentation:**
   - Update deployment documentation
   - Document environment setup
   - Document rollback procedures
   - Document support procedures

**Time Required:** 1-2 days

---

## Phase 6: Deployment (Week 4)

### Step 13: Build Production App

**What to do:**
1. **For Android:**
   - Run: `eas build --platform android --profile production`
   - Or use: `expo build:android`
   - Wait for build to complete
   - Download APK/AAB file

2. **For iOS (if applicable):**
   - Run: `eas build --platform ios --profile production`
   - Or use: `expo build:ios`
   - Wait for build to complete
   - Download IPA file

3. **Verify Build:**
   - Check build size
   - Verify version number
   - Verify bundle identifier
   - Test build on device

**Time Required:** 2-4 hours (build time)

**Resources Needed:**
- EAS account (or Expo account)
- Build credits

---

### Step 14: Submit to App Stores

**What to do:**
1. **Google Play Store:**
   - Go to Google Play Console
   - Create new app (if first time)
   - Upload AAB file
   - Fill in app store listing
   - Submit for review
   - Wait for approval (1-3 days)

2. **Apple App Store (if applicable):**
   - Go to App Store Connect
   - Create new app (if first time)
   - Upload IPA file
   - Fill in app store listing
   - Submit for review
   - Wait for approval (1-7 days)

3. **Monitor Submission:**
   - Check submission status
   - Respond to review feedback
   - Fix any issues
   - Resubmit if needed

**Time Required:** 1-7 days (review time)

**Resources Needed:**
- App store developer accounts
- App store listing assets

---

## Phase 7: Post-Deployment (Week 4+)

### Step 15: Monitor Production

**What to do:**
1. **Error Monitoring:**
   - Monitor Sentry dashboard daily
   - Check for new errors
   - Investigate critical errors
   - Fix issues promptly

2. **Performance Monitoring:**
   - Monitor app performance
   - Check storage usage
   - Monitor database performance
   - Check API response times

3. **User Feedback:**
   - Monitor app store reviews
   - Respond to user feedback
   - Track user issues
   - Plan improvements

4. **Analytics:**
   - Monitor user engagement
   - Track feature usage
   - Monitor retention
   - Analyze user behavior

**Time Required:** Ongoing

**Resources Needed:**
- Monitoring tools
- Analytics tools

---

### Step 16: Set Up Backup & Recovery

**What to do:**
1. **Database Backups:**
   - Verify Supabase automatic backups are enabled
   - Set up manual backup schedule
   - Test backup restoration
   - Document backup procedures

2. **Storage Backups:**
   - Set up storage backup (if needed)
   - Document backup procedures
   - Test restoration

3. **Code Backups:**
   - Verify code is in git repository
   - Tag production releases
   - Document rollback procedures

4. **Disaster Recovery Plan:**
   - Document recovery procedures
   - Test recovery scenarios
   - Train team on recovery

**Time Required:** 1-2 days

**Resources Needed:**
- Backup tools
- Recovery testing environment

---

## Quick Reference Checklist

### Must Do Before Production:
- [ ] Remove service role key from mobile app
- [ ] Create Edge Functions for admin operations
- [ ] Verify all RLS policies
- [ ] Remove all console.log statements
- [ ] Add error boundaries
- [ ] Set up production environment variables
- [ ] Configure production Supabase project
- [ ] Set up Sentry error tracking
- [ ] Test all features thoroughly
- [ ] Prepare app store assets
- [ ] Build production app
- [ ] Submit to app stores

### Should Do Before Production:
- [ ] Add input sanitization
- [ ] Add environment variable validation
- [ ] Add basic unit tests
- [ ] Set up CI/CD pipeline
- [ ] Create deployment documentation
- [ ] Set up monitoring alerts

### Nice to Have:
- [ ] Performance monitoring
- [ ] User analytics
- [ ] A/B testing
- [ ] Feature flags

---

## Estimated Timeline

| Phase | Duration | Status |
|-------|----------|--------|
| Phase 1: Critical Security Fixes | 1-2 weeks | ⚠️ Not Started |
| Phase 2: Environment Setup | 1 week | ⚠️ Not Started |
| Phase 3: Testing | 1 week | ⚠️ Not Started |
| Phase 4: App Store Preparation | 1 week | ⚠️ Not Started |
| Phase 5: Pre-Deployment | 3-5 days | ⚠️ Not Started |
| Phase 6: Deployment | 1-7 days | ⚠️ Not Started |
| Phase 7: Post-Deployment | Ongoing | ⚠️ Not Started |

**Total Estimated Time: 4-6 weeks**

---

## Important Notes

1. **DO NOT deploy with service role key in mobile app** - This is a critical security vulnerability

2. **DO NOT skip RLS policy verification** - This could lead to data breaches

3. **DO NOT deploy without testing** - Unknown bugs will cause issues in production

4. **DO NOT skip error tracking** - You need to know when things break

5. **DO commit to git frequently** - Version control is essential

6. **DO document everything** - Future you will thank you

---

## Support Resources

- **Supabase Documentation:** https://supabase.com/docs
- **Expo Documentation:** https://docs.expo.dev
- **Sentry Documentation:** https://docs.sentry.io
- **React Native Documentation:** https://reactnative.dev/docs/getting-started

---

## Next Steps

1. Start with Phase 1: Critical Security Fixes
2. Work through each phase sequentially
3. Don't skip steps
4. Test thoroughly at each phase
5. Document everything

**Good luck with your deployment! 🚀**

