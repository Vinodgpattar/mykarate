# EAS Environment Variables Setup Guide

## 🔴 CRITICAL: App Won't Work Without These!

Your APK is crashing because **environment variables are not set in EAS Build**. 

**For production APK builds, environment variables MUST be set in EAS Dashboard, NOT just in `.env.local`** (`.env.local` only works for development).

---

## ✅ Step-by-Step: Set Environment Variables in EAS Dashboard

### Step 1: Go to EAS Dashboard

1. Open: https://expo.dev/accounts/vinodgpattar/projects/karate-dojo-mobile
2. Click on **"Variables"** in the left sidebar (or go to: https://expo.dev/accounts/vinodgpattar/projects/karate-dojo-mobile/variables)

### Step 2: Add Required Variables

For **EACH** variable below:

1. Click **"Add Variable"** or **"Create Variable"**
2. Enter the **Key** (exact name)
3. Enter the **Value**
4. Select environments: **Production** ✅, **Preview** ✅, **Development** ✅
5. Click **"Save"** or **"Create"**

---

## 📋 Required Variables

### 1. EXPO_PUBLIC_SUPABASE_URL (REQUIRED)

**Key:** `EXPO_PUBLIC_SUPABASE_URL`

**Value:** Your Supabase project URL
- Example: `https://abcdefghijklmnop.supabase.co`
- Get from: Supabase Dashboard → Settings → API → Project URL

**Environments:** Production ✅, Preview ✅, Development ✅

---

### 2. EXPO_PUBLIC_SUPABASE_ANON_KEY (REQUIRED)

**Key:** `EXPO_PUBLIC_SUPABASE_ANON_KEY`

**Value:** Your Supabase anon/public key
- Example: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (long JWT token)
- Get from: Supabase Dashboard → Settings → API → anon public key

**Environments:** Production ✅, Preview ✅, Development ✅

---

### 3. EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY (OPTIONAL - but recommended)

**Key:** `EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`

**Value:** Your Supabase service role key
- Example: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (long JWT token)
- Get from: Supabase Dashboard → Settings → API → service_role key (click "Reveal")
- ⚠️ **Keep this secret!** Never share it publicly.

**Environments:** Production ✅, Preview ✅, Development ✅

**Note:** This is optional, but required for admin features (creating students, etc.)

---

### 4. EXPO_PUBLIC_EMAIL_API_URL (OPTIONAL)

**Key:** `EXPO_PUBLIC_EMAIL_API_URL`

**Value:** Your mess-management web app URL
- Example: `https://your-mess-management-app.vercel.app`
- Get from: Your Vercel deployment URL

**Environments:** Production ✅, Preview ✅, Development ✅

**Note:** If not set, email features will be skipped (not critical)

---

## 🔍 How to Get Supabase Credentials

1. Go to: https://supabase.com/dashboard
2. Select your project
3. Navigate to: **Settings** → **API**
4. Copy:
   - **Project URL** → `EXPO_PUBLIC_SUPABASE_URL`
   - **anon public key** → `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** (click "Reveal") → `EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`

---

## ✅ After Adding Variables

1. **Rebuild the APK:**
   ```bash
   eas build --platform android --profile production
   ```

2. **Wait for build to complete** (20-60 minutes)

3. **Download and install the new APK**

4. **Test the app** - it should now open without crashing!

---

## 🚨 Important Notes

- **Environment variables are baked into the APK at build time**
- **You MUST rebuild the APK after adding/changing variables**
- **`.env.local` only works for development (Expo Go)**
- **For production APK, variables MUST be in EAS Dashboard**

---

## 🔧 Quick Checklist

- [ ] Go to EAS Dashboard → Variables
- [ ] Add `EXPO_PUBLIC_SUPABASE_URL`
- [ ] Add `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Add `EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` (optional but recommended)
- [ ] Add `EXPO_PUBLIC_EMAIL_API_URL` (optional)
- [ ] Set all variables for Production, Preview, Development
- [ ] Rebuild APK: `eas build --platform android --profile production`
- [ ] Install and test new APK

---

## 📱 What Happens Now

After you set the environment variables and rebuild:

1. **App will open** (no more crashing!)
2. **If variables are still missing**, you'll see a helpful error screen with instructions
3. **Once variables are set**, the app will work normally

---

## 🆘 Still Having Issues?

If the app still crashes after setting variables:

1. **Check EAS Dashboard** - Verify variables are set correctly
2. **Check variable names** - Must be EXACT (case-sensitive)
3. **Check variable values** - No extra spaces or quotes
4. **Rebuild APK** - Variables are only included at build time
5. **Check build logs** - Look for any errors during build

---

**The app is now configured to show a helpful error screen instead of crashing, but you still need to set the environment variables in EAS Dashboard!**







