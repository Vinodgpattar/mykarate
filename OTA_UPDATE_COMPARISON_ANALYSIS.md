# OTA Update Comparison: Karate Dojo vs Mess Management

## 📊 Executive Summary

**Karate Dojo Mobile**: Updates NOT working ❌  
**Mess Management Mobile**: Updates working ✅

This document provides a detailed side-by-side comparison to identify why one works and the other doesn't.

---

## 1. Project Configuration (app.json)

### Karate Dojo Mobile
```json
{
  "expo": {
    "name": "Karate",
    "slug": "karate-dojo-mobile",
    "version": "1.0.6",
    "owner": "blizlabss",
    "extra": {
      "eas": {
        "projectId": "300cdaf4-66d6-44f6-97a2-218d005054b5"
      }
    },
    "updates": {
      "fallbackToCacheTimeout": 0,
      "checkAutomatically": "ON_LOAD",
      "url": "https://u.expo.dev/300cdaf4-66d6-44f6-97a2-218d005054b5"
    },
    "runtimeVersion": {
      "policy": "appVersion"
    }
  }
}
```

**Key Points:**
- ✅ Project ID: `300cdaf4-66d6-44f6-97a2-218d005054b5` (new account: blizlabss)
- ✅ Runtime Version: `1.0.6` (from appVersion policy)
- ✅ Updates URL: Correct for new project ID
- ✅ Check Automatically: `ON_LOAD`
- ⚠️ **Owner field present**: `"owner": "blizlabss"`

### Mess Management Mobile
```json
{
  "expo": {
    "name": "Mess Management",
    "slug": "mess-management-mobile",
    "version": "1.0.0",
    "extra": {
      "eas": {
        "projectId": "bba34f1c-e0b4-46dd-9aea-aab2a4eb3629"
      }
    },
    "updates": {
      "fallbackToCacheTimeout": 0,
      "checkAutomatically": "ON_LOAD",
      "url": "https://u.expo.dev/bba34f1c-e0b4-46dd-9aea-aab2a4eb3629"
    },
    "runtimeVersion": {
      "policy": "appVersion"
    }
  }
}
```

**Key Points:**
- ✅ Project ID: `bba34f1c-e0b4-46dd-9aea-aab2a4eb3629`
- ✅ Runtime Version: `1.0.0` (from appVersion policy)
- ✅ Updates URL: Correct
- ✅ Check Automatically: `ON_LOAD`
- ✅ **No owner field** (uses default account)

**🔍 DIFFERENCE #1**: Karate Dojo has `"owner": "blizlabss"` field, Mess Management doesn't.

---

## 2. Build Configuration (eas.json)

### Karate Dojo Mobile
```json
{
  "cli": {
    "version": ">= 16.28.0",
    "appVersionSource": "remote"
  },
  "build": {
    "production": {
      "autoIncrement": true,
      "channel": "production",
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

### Mess Management Mobile
```json
{
  "cli": {
    "version": ">= 16.28.0",
    "appVersionSource": "remote"
  },
  "build": {
    "production": {
      "autoIncrement": true,
      "channel": "production",
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

**✅ IDENTICAL**: Both have identical `eas.json` configurations.

---

## 3. Build History

### Karate Dojo Mobile (Latest Build)
```
ID:                       a3dbdc1a-783d-45c7-bd57-1c65a89cce72
Platform:                 Android
Status:                   finished
Profile:                  production
Distribution:             store
Channel:                  production ✅
SDK Version:              54.0.0
Runtime Version:          1.0.6 ✅
Version:                  1.0.6 ✅
Version code:             3
Started by:               blizlabss
Started at:               5/12/2025, 6:09:51 pm
Finished at:              5/12/2025, 6:19:51 pm
```

**Key Points:**
- ✅ Built with new account (blizlabss)
- ✅ Channel: `production`
- ✅ Runtime Version: `1.0.6`
- ✅ Built AFTER account switch

### Mess Management Mobile
- Build details not accessible (different account)
- Presumably built with correct account from the start

**🔍 DIFFERENCE #2**: Karate Dojo was built AFTER account switch, Mess Management was built with original account.

---

## 4. Update History

### Karate Dojo Mobile (Latest Update)
```
Branch:                   production
Runtime Version:          1.0.6 ✅
Message:                  "Fix date picker blank screen in production builds"
Group ID:                 ba94b893-cb82-48ce-8629-10885a6854ff
Platforms:               android, ios
Published:               15 minutes ago by blizlabss
```

**Key Points:**
- ✅ Runtime Version: `1.0.6` (matches build)
- ✅ Branch: `production` (matches channel)
- ✅ Published to new account

### Mess Management Mobile
- Update details not accessible (different account)
- Updates are working, so configuration is correct

---

## 5. Update Check Code (_layout.tsx)

### Karate Dojo Mobile
```typescript
React.useEffect(() => {
  async function checkForUpdates() {
    try {
      if (!Updates.isEnabled) {
        logger.warn('Updates are not enabled...')
        return
      }

      if (__DEV__) {
        logger.debug('Skipping update check in development mode')
        return
      }

      logger.info('Checking for app updates...')
      
      const update = await Promise.race([
        Updates.checkForUpdateAsync(),
        new Promise<{ isAvailable: false }>((resolve) => 
          setTimeout(() => resolve({ isAvailable: false }), 10000)
        )
      ]) as { isAvailable: boolean; manifest?: any }
      
      if (update.isAvailable) {
        logger.info('Update available, downloading...')
        const result = await Updates.fetchUpdateAsync()
        logger.info('Update downloaded successfully')
        await Updates.reloadAsync()
      } else {
        logger.info('App is up to date')
      }
    } catch (error) {
      logger.error('Error checking for updates', error as Error)
    }
  }

  checkForUpdates()
  const timeoutId = setTimeout(() => {
    checkForUpdates()
  }, 3000)

  return () => clearTimeout(timeoutId)
}, [])
```

### Mess Management Mobile
```typescript
React.useEffect(() => {
  async function checkForUpdates() {
    try {
      if (!Updates.isEnabled) {
        logger.warn('Updates are not enabled...')
        return
      }

      if (__DEV__) {
        logger.debug('Skipping update check in development mode')
        return
      }

      logger.info('Checking for app updates...')

      const update = await Promise.race([
        Updates.checkForUpdateAsync(),
        new Promise<{ isAvailable: false }>((resolve) =>
          setTimeout(() => resolve({ isAvailable: false }), 10000)
        ),
      ]) as { isAvailable: boolean; manifest?: any }

      if (update.isAvailable) {
        logger.info('Update available, downloading...')
        const result = await Updates.fetchUpdateAsync()
        logger.info('Update downloaded successfully')
        await Updates.reloadAsync()
      } else {
        logger.info('App is up to date')
      }
    } catch (error) {
      logger.error('Error checking for updates', error as Error)
    }
  }

  checkForUpdates()
  const timeoutId = setTimeout(() => {
    checkForUpdates()
  }, 3000)

  return () => clearTimeout(timeoutId)
}, [])
```

**✅ IDENTICAL**: Both have identical update checking logic.

---

## 6. Dependencies (package.json)

### Karate Dojo Mobile
```json
{
  "dependencies": {
    "expo": "~54.0.0",
    "expo-updates": "^29.0.13",
    "expo-router": "^6.0.14",
    "react": "19.1.0",
    "react-native": "0.81.5"
  }
}
```

### Mess Management Mobile
```json
{
  "dependencies": {
    "expo": "~54.0.0",
    "expo-updates": "^29.0.13",
    "expo-router": "^6.0.14",
    "react": "19.1.0",
    "react-native": "0.81.5"
  }
}
```

**✅ IDENTICAL**: Both use the same versions of critical packages.

---

## 7. Account Information

### Karate Dojo Mobile
- **Current Account**: `blizlabss` (new account)
- **Previous Account**: `vinodg` (old account, ran out of free limits)
- **Project ID**: `300cdaf4-66d6-44f6-97a2-218d005054b5` (new)
- **Old Project ID**: `62b3f9ab-1f5d-4b85-a73e-35009c880936` (old)
- **Account Switch**: Happened recently (5/12/2025)

### Mess Management Mobile
- **Account**: Original account (not switched)
- **Project ID**: `bba34f1c-e0b4-46dd-9aea-aab2a4eb3629`
- **Status**: Always used same account

**🔍 DIFFERENCE #3**: Karate Dojo switched accounts, Mess Management didn't.

---

## 8. Potential Issues Identified

### Issue #1: Owner Field in app.json
**Karate Dojo has:**
```json
"owner": "blizlabss"
```

**Mess Management doesn't have this field.**

**Hypothesis**: The `owner` field might cause issues with update resolution. When EAS builds the app, it might embed the owner information, and if there's a mismatch, updates might not resolve correctly.

### Issue #2: Account Switch Timing
**Karate Dojo:**
- Switched accounts recently
- Built APK after account switch
- Published updates to new account
- But updates not working

**Mess Management:**
- Never switched accounts
- Always worked with same account
- Updates working

**Hypothesis**: There might be a caching or configuration issue from the account switch that wasn't fully resolved.

### Issue #3: Update Already Embedded
**Possibility**: The update might already be embedded in the APK build, so `checkForUpdateAsync()` returns `isAvailable: false` because the app already has the latest update.

**How to verify**: Check if the DatePicker fix is already in the installed APK.

---

## 9. Debugging Steps

### Step 1: Verify Project ID in Running App
Add this to `_layout.tsx`:
```typescript
logger.info('🔍 UPDATE DEBUG', {
  isEnabled: Updates.isEnabled,
  runtimeVersion: Updates.runtimeVersion,
  channel: Updates.channel,
  updateId: Updates.updateId,
  manifest: Updates.manifest,
})
```

### Step 2: Check Update URL
The app should be checking:
- ✅ `https://u.expo.dev/300cdaf4-66d6-44f6-97a2-218d005054b5`

If it's checking the old URL:
- ❌ `https://u.expo.dev/62b3f9ab-1f5d-4b85-a73e-35009c880936`

Then the APK has the wrong project ID embedded.

### Step 3: Verify Runtime Version Match
- Build Runtime Version: `1.0.6`
- Update Runtime Version: `1.0.6`
- ✅ Should match

### Step 4: Check Channel Match
- Build Channel: `production`
- Update Branch: `production`
- ✅ Should match

---

## 10. Recommended Fixes

### Fix #1: Remove Owner Field (Test)
Try removing the `owner` field from `app.json`:
```json
{
  "expo": {
    // ... other config ...
    // Remove this line:
    // "owner": "blizlabss"
  }
}
```

Then rebuild and test.

### Fix #2: Verify APK Project ID
Check if the installed APK is actually from the latest build:
1. Download APK: https://expo.dev/artifacts/eas/mez8zWUjAFqz72uxBztDHd.apk
2. Uninstall old app completely
3. Install this APK
4. Check logs for project ID

### Fix #3: Publish Test Update
Publish a very obvious test update:
```bash
eas update --branch production --message "TEST UPDATE - If you see this, updates work!"
```

Then check if it appears in the app.

### Fix #4: Check Update Manifest
Add logging to see what `checkForUpdateAsync()` returns:
```typescript
const update = await Updates.checkForUpdateAsync()
console.log('Update check result:', JSON.stringify(update, null, 2))
```

---

## 11. Comparison Summary Table

| Aspect | Karate Dojo | Mess Management | Match? |
|--------|-------------|-----------------|--------|
| **Project ID** | `300cdaf4-66d6-44f6-97a2-218d005054b5` | `bba34f1c-e0b4-46dd-9aea-aab2a4eb3629` | ✅ Different (expected) |
| **Runtime Version** | `1.0.6` | `1.0.0` | ✅ Different (expected) |
| **Channel** | `production` | `production` | ✅ Same |
| **Check Automatically** | `ON_LOAD` | `ON_LOAD` | ✅ Same |
| **eas.json** | Identical | Identical | ✅ Same |
| **Update Code** | Identical | Identical | ✅ Same |
| **Dependencies** | Same versions | Same versions | ✅ Same |
| **Owner Field** | `"owner": "blizlabss"` | Not present | ❌ **DIFFERENT** |
| **Account Switch** | Yes (recent) | No | ❌ **DIFFERENT** |
| **Updates Working** | ❌ No | ✅ Yes | ❌ **DIFFERENT** |

---

## 12. Most Likely Root Cause

Based on the comparison, the most likely issues are:

1. **Owner Field**: The `"owner": "blizlabss"` field in `app.json` might be causing update resolution issues
2. **Account Switch Artifacts**: Some cached configuration from the old account might still be present
3. **Update Already Embedded**: The update might already be in the APK, so no new update is detected

---

## 13. Next Steps

1. **Add comprehensive debug logging** to see what the app is actually checking
2. **Remove owner field** from `app.json` and rebuild
3. **Verify APK is from latest build** (uninstall and reinstall)
4. **Publish a very obvious test update** to verify delivery
5. **Check logs** for the actual update check results

---

## 14. Files to Check

### Karate Dojo Mobile
- `app.json` - Line 66: `"owner": "blizlabss"` ⚠️
- `src/app/_layout.tsx` - Update check code
- `eas.json` - Build configuration

### Mess Management Mobile
- `app.json` - No owner field ✅
- `src/app/_layout.tsx` - Update check code
- `eas.json` - Build configuration

---

**Generated**: 5/12/2025  
**Purpose**: Compare working vs non-working OTA update configurations

