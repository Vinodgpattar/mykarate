# Karate Dojo App - New Expo Account Deployment Guide

## 🎯 Overview

This guide will help you deploy the Karate Dojo app using a **new Expo account** after your previous account hit the free tier limits.

---

## ✅ Prerequisites

1. **New Expo account** created (sign up at https://expo.dev)
2. **EAS CLI** installed globally
3. **Supabase project** credentials ready
4. **Node.js** and **npm** installed

---

## 📋 Step-by-Step Deployment

### Step 1: Install EAS CLI

```bash
npm install -g eas-cli
```

Verify installation:
```bash
eas --version
```

---

### Step 2: Log in to Your New Expo Account

```bash
cd karate-dojo-mobile
eas login
```

Enter your **new Expo account** credentials when prompted.

---

### Step 3: Initialize EAS Build Configuration

```bash
eas build:configure
```

This will:
- Link your project to the new Expo account
- Create/update `eas.json` if needed
- Generate a new project ID

**Note:** If prompted about project ownership, choose to create a new project in your new account.

---

### Step 4: Verify `eas.json` Configuration

Your `eas.json` should look like this:

```json
{
  "cli": {
    "version": ">= 16.28.0",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "autoIncrement": true,
      "android": {
        "buildType": "apk"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

---

### Step 5: Set Environment Variables in EAS Dashboard

**CRITICAL:** Environment variables must be set in EAS Dashboard for production builds. `.env.local` only works for development.

#### 5.1: Go to EAS Dashboard

1. Visit: https://expo.dev/accounts/[YOUR-NEW-ACCOUNT-NAME]/projects/karate-dojo-mobile
2. Click **"Variables"** in the left sidebar
3. Or go directly to: https://expo.dev/accounts/[YOUR-NEW-ACCOUNT-NAME]/projects/karate-dojo-mobile/variables

#### 5.2: Add Required Variables

For **EACH** variable below:

1. Click **"Add Variable"** or **"Create Variable"**
2. Enter the **exact Key name** (case-sensitive)
3. Enter the **Value**
4. Select environments: **Production** ✅, **Preview** ✅, **Development** ✅
5. Click **"Save"** or **"Create"**

---

### 📋 Required Environment Variables

#### 1. EXPO_PUBLIC_SUPABASE_URL (REQUIRED)

**Key:** `EXPO_PUBLIC_SUPABASE_URL`

**Value:** Your Supabase project URL
- Example: `https://abcdefghijklmnop.supabase.co`
- Get from: Supabase Dashboard → Settings → API → Project URL

**Environments:** Production ✅, Preview ✅, Development ✅

---

#### 2. EXPO_PUBLIC_SUPABASE_ANON_KEY (REQUIRED)

**Key:** `EXPO_PUBLIC_SUPABASE_ANON_KEY`

**Value:** Your Supabase anon/public key
- Example: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (long JWT token)
- Get from: Supabase Dashboard → Settings → API → anon public key

**Environments:** Production ✅, Preview ✅, Development ✅

---

#### 3. EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY (OPTIONAL but Recommended)

**Key:** `EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`

**Value:** Your Supabase service role key
- Example: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (long JWT token)
- Get from: Supabase Dashboard → Settings → API → service_role key (click "Reveal")
- ⚠️ **Keep this secret!** Never share it publicly.

**Environments:** Production ✅, Preview ✅, Development ✅

**Note:** Required for admin features (creating students, managing branches, etc.)

---

#### 4. EXPO_PUBLIC_EMAIL_API_URL (OPTIONAL)

**Key:** `EXPO_PUBLIC_EMAIL_API_URL`

**Value:** Your email API URL (if you have a backend for sending emails)
- Example: `https://your-email-api.vercel.app`
- Get from: Your backend deployment URL

**Environments:** Production ✅, Preview ✅, Development ✅

**Note:** If not set, email features will be skipped (not critical for basic functionality)

---

#### 5. EXPO_PUBLIC_SENTRY_DSN (OPTIONAL)

**Key:** `EXPO_PUBLIC_SENTRY_DSN`

**Value:** Your Sentry DSN for error tracking
- Example: `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`
- Get from: Sentry Dashboard → Settings → Client Keys (DSN)

**Environments:** Production ✅, Preview ✅, Development ✅

**Note:** Only needed if you're using Sentry for error tracking

---

### Step 6: Build the APK

#### For Production Build:

```bash
eas build --platform android --profile production
```

#### For Preview/Testing Build:

```bash
eas build --platform android --profile preview
```

#### For Development Build:

```bash
eas build --platform android --profile development
```

---

### Step 7: Monitor Build Progress

- Build progress will be shown in the terminal
- Or check: https://expo.dev/accounts/[YOUR-ACCOUNT]/projects/karate-dojo-mobile/builds
- Builds typically take **20-60 minutes**

---

### Step 8: Download and Install APK

Once the build completes:

1. **Download the APK** from the EAS Dashboard
2. **Transfer to your Android device**
3. **Install the APK** (enable "Install from unknown sources" if needed)
4. **Test the app** - it should now work without crashing!

---

## 🔧 Quick Checklist

- [ ] Installed EAS CLI: `npm install -g eas-cli`
- [ ] Logged into new account: `eas login`
- [ ] Initialized EAS: `eas build:configure`
- [ ] Verified `eas.json` configuration
- [ ] Added `EXPO_PUBLIC_SUPABASE_URL` in EAS Dashboard
- [ ] Added `EXPO_PUBLIC_SUPABASE_ANON_KEY` in EAS Dashboard
- [ ] Added `EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` in EAS Dashboard (optional but recommended)
- [ ] Added `EXPO_PUBLIC_EMAIL_API_URL` in EAS Dashboard (optional)
- [ ] Added `EXPO_PUBLIC_SENTRY_DSN` in EAS Dashboard (optional)
- [ ] Set all variables for Production, Preview, Development
- [ ] Started build: `eas build --platform android --profile production`
- [ ] Downloaded and tested APK

---

## 🚨 Important Notes

1. **Environment Variables are Baked In**: Variables are included in the APK at build time. You **MUST rebuild** after adding/changing variables.

2. **`.env.local` Only Works for Development**: For production APK builds, variables **MUST** be in EAS Dashboard.

3. **Project ID**: The old project ID has been removed from `app.json`. A new one will be generated when you run `eas build:configure`.

4. **Project Slug**: If `karate-dojo-mobile` is already taken in your new account, you'll be prompted to choose a different slug.

5. **Rebuild After Changes**: If you change environment variables later, you must rebuild the APK.

---

## 🐛 Troubleshooting

### "Project not found" error

**Solution:**
```bash
eas init
```
This will create the project in your new account.

---

### "Authentication failed"

**Solution:**
- Make sure you're logged in: `eas login`
- Check you're using the correct account
- Try logging out and back in: `eas logout` then `eas login`

---

### Build fails with "Missing environment variable"

**Solution:**
- Verify all required variables are set in EAS Dashboard
- Check variable names are exact (case-sensitive)
- Ensure variables are set for the correct environment (Production/Preview/Development)
- Rebuild the APK after adding variables

---

### "Slug already taken"

**Solution:**
- Choose a different slug when prompted during `eas build:configure`
- Or update `app.json` with a unique slug before building

---

### App crashes on startup

**Solution:**
1. Check EAS Dashboard - Verify all required variables are set
2. Check variable names - Must be EXACT (case-sensitive)
3. Check variable values - No extra spaces or quotes
4. Rebuild APK - Variables are only included at build time
5. Check build logs - Look for any errors during build

---

## 📱 What Happens After Deployment

Once you've set the environment variables and rebuilt:

1. ✅ **App will open** (no more crashing!)
2. ✅ **If variables are still missing**, you'll see a helpful error screen with instructions
3. ✅ **Once variables are set**, the app will work normally
4. ✅ **All features** (students, branches, notifications, etc.) will function properly

---

## 🔄 Updating the App

### After Making Code Changes:

1. **Update version** in `app.json`:
   ```json
   "version": "1.0.6"  // Increment version
   ```

2. **Rebuild APK**:
   ```bash
   eas build --platform android --profile production
   ```

3. **Download and distribute** the new APK

---

## 📚 Additional Resources

- **EAS Build Documentation**: https://docs.expo.dev/build/introduction/
- **Environment Variables Guide**: https://docs.expo.dev/build-reference/variables/
- **EAS Dashboard**: https://expo.dev
- **Supabase Dashboard**: https://supabase.com/dashboard

---

## ✅ Success Indicators

You'll know everything is working when:

1. ✅ Build completes successfully (green checkmark in EAS Dashboard)
2. ✅ APK downloads without errors
3. ✅ App installs on Android device
4. ✅ App opens without crashing
5. ✅ Login screen appears (or shows helpful error if variables missing)
6. ✅ All features work as expected

---

**Last Updated**: After new account setup
**Status**: Ready for deployment with new Expo account




