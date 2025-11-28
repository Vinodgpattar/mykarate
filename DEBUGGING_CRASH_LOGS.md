# How to View Crash Logs and Debug Issues

## 1. **Android Device Logs (Most Important for Crashes)**

### Using ADB (Android Debug Bridge)

**Prerequisites:**
- Install Android SDK Platform Tools
- Enable USB Debugging on your Android device
- Connect device via USB

**Commands:**

```bash
# View all logs in real-time
adb logcat

# Filter for React Native/JavaScript errors only
adb logcat | grep -i "react\|javascript\|error\|exception"

# Filter for your app only (replace with your package name)
adb logcat | grep "com.karatedojo.mobile"

# View only errors and fatal messages
adb logcat *:E *:F

# Save logs to a file
adb logcat > crash_logs.txt

# Clear logs and start fresh
adb logcat -c && adb logcat > crash_logs.txt
```

**Package Name:** `com.karatedojo.mobile`

### Using Android Studio Logcat
1. Open Android Studio
2. Connect your device
3. Open Logcat tab (bottom panel)
4. Filter by package: `com.karatedojo.mobile`
5. Filter by log level: `Error` or `Fatal`

---

## 2. **EAS Build Logs**

If the app crashes during build or immediately after installation:

1. Go to [EAS Dashboard](https://expo.dev)
2. Navigate to: **Your Project → Builds**
3. Click on the failed build
4. Check the **Build Logs** tab
5. Look for errors in:
   - Install dependencies phase
   - Build phase
   - Native compilation errors

---

## 3. **Development Mode (Expo Go / Development Build)**

### Metro Bundler Console
When running `npx expo start`:
- All console.log/error messages appear in the terminal
- JavaScript errors show stack traces
- Network errors are visible

### React Native Error Screen
- Red error screen appears in the app
- Shows error message and stack trace
- Tap "Reload" to refresh

---

## 4. **Production Error Tracking (Sentry)**

If Sentry is configured (optional):

1. Go to [Sentry Dashboard](https://sentry.io)
2. Navigate to your project
3. View **Issues** tab for crash reports
4. Each crash shows:
   - Error message
   - Stack trace
   - Device info
   - App version
   - User actions before crash

**Note:** Sentry is currently optional and only works if `EXPO_PUBLIC_SENTRY_DSN` is set.

---

## 5. **Common Error Patterns to Look For**

### JavaScript Errors
```
ERROR  Error: [error message]
ERROR  TypeError: [error details]
ERROR  ReferenceError: [variable] is not defined
```

### Native Module Errors
```
ERROR  NativeModule: [module name] is null
ERROR  java.lang.RuntimeException: [error]
```

### Network/API Errors
```
ERROR  Network request failed
ERROR  Supabase: [error message]
```

### Missing Environment Variables
```
ERROR  Missing Supabase environment variables!
ERROR  EXPO_PUBLIC_SUPABASE_URL: MISSING
```

---

## 6. **Quick Debugging Steps**

### Step 1: Check if app starts at all
```bash
adb logcat | grep "AndroidRuntime"
```
Look for "FATAL EXCEPTION" messages

### Step 2: Check React Native errors
```bash
adb logcat | grep -i "react\|js"
```

### Step 3: Check your app's logs
```bash
adb logcat | grep "com.karatedojo.mobile"
```

### Step 4: Check for specific error patterns
```bash
# Missing environment variables
adb logcat | grep -i "supabase\|env\|config"

# Authentication errors
adb logcat | grep -i "auth\|session\|login"

# Database errors
adb logcat | grep -i "database\|sql\|query"
```

---

## 7. **Enable More Verbose Logging**

### In Development
The app already uses `logger` which outputs to console. Check Metro bundler terminal.

### In Production
Add this to see more logs:
```typescript
// In src/lib/logger.ts or similar
if (__DEV__) {
  console.log('Debug info:', data)
}
```

---

## 8. **Using React Native Debugger**

1. Install React Native Debugger
2. Run app in development mode
3. Open debugger (shake device → Debug)
4. View Console tab for all logs
5. View Network tab for API calls

---

## 9. **Check Device Logs Directly (No USB)**

### On Android Device:
1. Install a log viewer app (e.g., "Log Viewer")
2. Grant necessary permissions
3. Filter by your app's package name
4. View crash logs

### Using Wireless ADB:
```bash
# Enable wireless debugging on device
# Connect via IP address
adb connect [device-ip]:5555
adb logcat
```

---

## 10. **Most Common Crash Causes**

1. **Missing Environment Variables**
   - Check: `adb logcat | grep -i "supabase\|env"`
   - Fix: Set variables in EAS Dashboard

2. **Unhandled Promise Rejections**
   - Check: `adb logcat | grep -i "unhandled\|promise"`
   - Fix: Added error handlers (already fixed)

3. **Native Module Not Found**
   - Check: `adb logcat | grep -i "module\|native"`
   - Fix: Rebuild APK after installing dependencies

4. **Out of Memory**
   - Check: `adb logcat | grep -i "memory\|oom"`
   - Fix: Optimize images, reduce app size

5. **Network Errors**
   - Check: `adb logcat | grep -i "network\|connection"`
   - Fix: Check internet connection, API endpoints

---

## Quick Reference Commands

```bash
# Most useful command - see all errors
adb logcat *:E *:F

# See your app's errors only
adb logcat | grep "com.karatedojo.mobile" | grep -i "error\|fatal\|exception"

# Save crash logs to file
adb logcat -d > crash_$(date +%Y%m%d_%H%M%S).txt

# Monitor in real-time and save
adb logcat | tee crash_logs.txt
```

---

## Need Help?

If you see specific error messages, share them and I can help diagnose the issue!

