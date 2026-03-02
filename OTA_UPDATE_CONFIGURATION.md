# OTA Update Configuration - Complete Documentation

## 📋 Current Status

**Issue:** OTA updates are not being received in production APK despite updates being published.

**Last Update Published:**
- Update Group ID: `84547a2a-1627-4cca-a6b5-c1f675b1a619`
- Runtime Version: `1.0.5`
- Branch: `production`
- Message: "Fix vertical flag gradient and locations screen redesign"
- Published: 11 minutes ago

---

## 🔧 Configuration Files

### 1. app.json - Update Configuration

```json
{
  "expo": {
    "name": "Karate",
    "slug": "karate-dojo-mobile",
    "version": "1.0.5",
    "extra": {
      "eas": {
        "projectId": "62b3f9ab-1f5d-4b85-a73e-35009c880936"
      }
    },
    "updates": {
      "fallbackToCacheTimeout": 0,
      "checkAutomatically": "ON_LOAD",
      "url": "https://u.expo.dev/62b3f9ab-1f5d-4b85-a73e-35009c880936"
    },
    "runtimeVersion": {
      "policy": "appVersion"
    }
  }
}
```

**Key Settings:**
- `checkAutomatically: "ON_LOAD"` - Checks for updates when app loads
- `fallbackToCacheTimeout: 0` - No fallback timeout
- `runtimeVersion.policy: "appVersion"` - Uses app version (1.0.5) as runtime version
- `updates.url` - Points to Expo Updates server

---

### 2. eas.json - Build Configuration

```json
{
  "cli": {
    "version": ">= 16.28.0",
    "appVersionSource": "remote"
  },
  "build": {
    "production": {
      "autoIncrement": true,
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

**Key Settings:**
- `appVersionSource: "remote"` - Version managed by EAS
- `autoIncrement: true` - Build numbers auto-increment
- `buildType: "apk"` - Building APK (not AAB)

---

### 3. package.json - Dependencies

```json
{
  "dependencies": {
    "expo": "~54.0.0",
    "expo-updates": "^29.0.13",
    "expo-router": "^6.0.14"
  }
}
```

**Key Dependencies:**
- `expo-updates: ^29.0.13` - OTA update functionality
- `expo: ~54.0.0` - Expo SDK version
- `expo-router: ^6.0.14` - File-based routing

---

### 4. src/app/_layout.tsx - Update Checking Code

```typescript
import * as Updates from 'expo-updates'
import { logger } from '@/lib/logger'

export default function RootLayout() {
  // Check for app updates on startup
  React.useEffect(() => {
    async function checkForUpdates() {
      try {
        // Check if updates are enabled
        if (!Updates.isEnabled) {
          logger.warn('Updates are not enabled. This might be a development build or updates are disabled.')
          return
        }

        // Only check for updates in production builds
        if (__DEV__) {
          logger.debug('Skipping update check in development mode')
          return
        }

        logger.info('Checking for app updates...')
        
        // Check for updates with timeout
        const update = await Promise.race([
          Updates.checkForUpdateAsync(),
          new Promise<{ isAvailable: false }>((resolve) => 
            setTimeout(() => resolve({ isAvailable: false }), 10000)
          )
        ]) as { isAvailable: boolean; manifest?: any }
        
        if (update.isAvailable) {
          logger.info('Update available, downloading...', { 
            manifest: update.manifest?.id,
            createdAt: update.manifest?.createdAt 
          })
          
          const result = await Updates.fetchUpdateAsync()
          logger.info('Update downloaded successfully', { 
            isNew: result.isNew,
            manifest: result.manifest?.id 
          })
          
          // Reload immediately to apply the update
          logger.info('Reloading app to apply update...')
          await Updates.reloadAsync()
        } else {
          logger.info('App is up to date')
        }
      } catch (error) {
        logger.error('Error checking for updates', error as Error)
        // Don't throw - update failures shouldn't break the app
      }
    }

    // Check immediately and also after a delay
    checkForUpdates()
    const timeoutId = setTimeout(() => {
      checkForUpdates()
    }, 3000)

    return () => clearTimeout(timeoutId)
  }, [])

  return (
    // ... rest of layout
  )
}
```

**Update Check Behavior:**
- Checks immediately on app load
- Checks again after 3 seconds
- 10-second timeout for update check
- Skips in `__DEV__` mode
- Checks `Updates.isEnabled` before proceeding
- Automatically reloads app after downloading update

---

## 📊 Published Updates

### Latest Update (Most Recent)
- **Group ID:** `84547a2a-1627-4cca-a6b5-c1f675b1a619`
- **Runtime Version:** `1.0.5`
- **Platforms:** android, ios
- **Message:** "Fix vertical flag gradient and locations screen redesign"
- **Status:** Published
- **Rollout Percentage:** N/A (100% rollout)

### Previous Update
- **Group ID:** `ec1365ab-3781-4b0a-8189-629edcb0c19b`
- **Runtime Version:** `1.0.5`
- **Message:** "Switch EAS project to new account..."

---

## 🔍 Troubleshooting Information

### Current Setup
1. **Project ID:** `62b3f9ab-1f5d-4b85-a73e-35009c880936`
2. **Updates URL:** `https://u.expo.dev/62b3f9ab-1f5d-4b85-a73e-35009c880936`
3. **Runtime Version Policy:** `appVersion` (uses app.json version: 1.0.5)
4. **Branch:** `production`
5. **Account:** `vinodg`

### Potential Issues

1. **Runtime Version Mismatch**
   - APK was built with runtime version `1.0.5`
   - Updates are published for runtime version `1.0.5`
   - ✅ Should match

2. **Update Channel/Branch**
   - Updates published to `production` branch
   - APK should be configured to check `production` branch
   - ⚠️ Need to verify APK was built with correct channel

3. **Update URL Mismatch**
   - `app.json` has: `https://u.expo.dev/62b3f9ab-1f5d-4b85-a73e-35009c880936`
   - This should match the project ID
   - ✅ Matches

4. **Build Configuration**
   - APK build type: `apk`
   - Should include `expo-updates` in build
   - ⚠️ Need to verify APK was built with updates enabled

---

## 🧪 Testing Checklist

### To Verify Update Configuration:

1. **Check APK Build Info:**
   ```bash
   # Check if APK was built with updates enabled
   # Look for expo-updates in the build
   ```

2. **Verify Runtime Version:**
   - APK runtime version must match update runtime version
   - Both should be `1.0.5`

3. **Check Update Channel:**
   - APK should be configured to check `production` branch
   - Updates are published to `production` branch

4. **Network Connectivity:**
   - Device must have internet connection
   - Update check happens on app load

5. **App State:**
   - App must be fully closed (not backgrounded)
   - Reopen app to trigger update check

---

## 📝 Commands Reference

### Publish Update
```bash
eas update --channel production --auto --message "Your update message"
```

### List Updates
```bash
eas update:list --branch production --limit 5
```

### View Update Details
```bash
eas update:view <update-group-id>
```

### Check Current Account
```bash
eas whoami
```

---

## 🔗 Important URLs

- **EAS Dashboard:** https://expo.dev/accounts/vinodg/projects/karate-dojo-mobile
- **Updates Dashboard:** https://expo.dev/accounts/vinodg/projects/karate-dojo-mobile/updates
- **Latest Update:** https://expo.dev/accounts/vinodg/projects/karate-dojo-mobile/updates/84547a2a-1627-4cca-a6b5-c1f675b1a619

---

## ⚠️ Common Issues & Solutions

### Issue 1: Updates Not Downloading
**Possible Causes:**
- APK was built without `expo-updates` enabled
- Runtime version mismatch
- Network connectivity issues
- Update channel mismatch

**Solution:**
- Rebuild APK with `eas build --platform android --profile production`
- Ensure runtime version matches (1.0.5)
- Verify network connection
- Check update channel in build

### Issue 2: Updates Check But Don't Apply
**Possible Causes:**
- Update downloaded but reload failed
- Cache issues
- Update manifest corrupted

**Solution:**
- Clear app cache
- Force close and reopen app
- Check logs for reload errors

### Issue 3: Updates.isEnabled Returns False
**Possible Causes:**
- Development build (not production)
- Updates disabled in build
- Using Expo Go (updates don't work in Expo Go)

**Solution:**
- Use production build from EAS Build
- Verify `expo-updates` is included in build
- Don't use Expo Go for testing updates

---

## 📱 How Updates Should Work

1. **User opens app** (production APK)
2. **App checks `Updates.isEnabled`** → Should return `true` in production
3. **App checks `__DEV__`** → Should be `false` in production APK
4. **App calls `Updates.checkForUpdateAsync()`**
5. **If update available:**
   - Downloads update via `Updates.fetchUpdateAsync()`
   - Reloads app via `Updates.reloadAsync()`
   - User sees new version

---

## 🔍 Debugging Steps

1. **Check if updates are enabled:**
   ```typescript
   console.log('Updates enabled:', Updates.isEnabled)
   console.log('Is dev mode:', __DEV__)
   console.log('Update URL:', Updates.updateId)
   ```

2. **Check runtime version:**
   ```typescript
   console.log('Runtime version:', Updates.runtimeVersion)
   ```

3. **Manually trigger update check:**
   ```typescript
   const update = await Updates.checkForUpdateAsync()
   console.log('Update available:', update.isAvailable)
   ```

4. **Check update manifest:**
   ```typescript
   if (update.isAvailable) {
     console.log('Update manifest:', update.manifest)
   }
   ```

---

## 📋 Verification Checklist

- [ ] APK was built with `eas build --platform android --profile production`
- [ ] APK runtime version is `1.0.5` (matches app.json version)
- [ ] Updates are published to `production` branch
- [ ] Update runtime version is `1.0.5` (matches APK)
- [ ] `app.json` has correct `updates.url`
- [ ] `app.json` has `checkAutomatically: "ON_LOAD"`
- [ ] `expo-updates` package is installed (`^29.0.13`)
- [ ] Update checking code is in `_layout.tsx`
- [ ] App is production build (not Expo Go, not dev build)
- [ ] Device has internet connection
- [ ] App is fully closed and reopened

---

**Last Updated:** After publishing update `84547a2a-1627-4cca-a6b5-c1f675b1a619`
**Status:** Updates published but not being received in production APK




