# Deployment Strategy - Version 1.0.6

## 📋 Summary

**Decision: REBUILD REQUIRED** ✅

This version includes new native dependencies that require a full rebuild. After this rebuild, future UI-only changes can be deployed via OTA updates.

---

## 🔄 Changes in This Version (1.0.6)

### Native Dependencies Added (Requires Rebuild)
- ✅ `react-native-youtube-iframe` - YouTube video player
- ✅ `react-native-webview` - WebView support for YouTube player

### UI/Feature Changes (Can be OTA after rebuild)
- ✅ YouTube video upload support in admin gallery
- ✅ YouTube video playback in public gallery
- ✅ Belt system extended (Brown 4 - 4th Kyu)
- ✅ Programs page redesign (high-conversion layout)
- ✅ Contact page redesign (official brand icons)
- ✅ Gallery image display fixes
- ✅ Welcome hero section improvements

---

## 🚀 Deployment Steps

### Step 1: Rebuild App (Required)

```bash
cd karate-dojo-mobile

# Build for Android (Production)
eas build --platform android --profile production

# Build for iOS (if needed)
eas build --platform ios --profile production
```

**Why Rebuild?**
- New native dependencies (`react-native-youtube-iframe`, `react-native-webview`)
- Native modules require native code compilation
- Cannot be added via OTA updates

### Step 2: Test the Build

1. Install the new APK/IPA on test devices
2. Verify YouTube video functionality works
3. Test all redesigned pages
4. Confirm belt system updates

### Step 3: Submit to Stores (if applicable)

```bash
# Submit to Google Play
eas submit --platform android --profile production

# Submit to App Store (if applicable)
eas submit --platform ios --profile production
```

---

## 📱 Future Updates (After Rebuild)

### Can Use OTA Updates For:
- ✅ UI/UX improvements
- ✅ Component redesigns
- ✅ Styling changes
- ✅ Bug fixes (JavaScript only)
- ✅ Feature additions (no new native deps)
- ✅ Content updates
- ✅ Database schema changes (if handled properly)

### Cannot Use OTA Updates For:
- ❌ New native dependencies
- ❌ Changes to `app.json` (permissions, plugins)
- ❌ Native code changes
- ❌ Expo SDK version upgrades
- ❌ Build configuration changes

---

## 🔄 OTA Update Workflow (After Rebuild)

### 1. Make Changes
- Update JavaScript/TypeScript code
- Modify UI components
- Update styling

### 2. Publish OTA Update

```bash
cd karate-dojo-mobile

# Publish to production channel
eas update --channel production --auto --message "Your update description"
```

### 3. Verify Update
- Users will receive update on next app launch
- Update downloads automatically
- App reloads with new changes

---

## 📊 Version History

| Version | Type | Changes | Deployment Method |
|---------|------|---------|-------------------|
| 1.0.6 | Major | Native deps + UI redesigns | **REBUILD** |
| 1.0.5 | Minor | Previous features | OTA/Previous Build |
| ... | ... | ... | ... |

---

## ⚠️ Important Notes

### Runtime Version
- Current: `1.0.6` (matches app version due to `runtimeVersion.policy: "appVersion"`)
- All OTA updates must match this runtime version
- If you change native code, increment version and rebuild

### Update Channel
- Production builds use: `production` channel
- Updates published to: `production` branch
- Configured in: `eas.json`

### Testing OTA Updates
1. Build production APK with version 1.0.6
2. Install on device
3. Make UI-only changes
4. Publish OTA update
5. Close and reopen app
6. Verify update applied

---

## 🎯 Best Practices

### When to Rebuild:
- ✅ Adding new native dependencies
- ✅ Changing app permissions
- ✅ Updating Expo SDK
- ✅ Major version releases
- ✅ Security updates requiring native changes

### When to Use OTA:
- ✅ UI/UX improvements
- ✅ Bug fixes (JS only)
- ✅ Feature additions (no native deps)
- ✅ Content updates
- ✅ Performance optimizations (JS)
- ✅ Minor version updates

---

## 📝 Commands Reference

### Build Commands
```bash
# Production Android build
eas build --platform android --profile production

# Production iOS build
eas build --platform ios --profile production

# Preview build (for testing)
eas build --platform android --profile preview
```

### OTA Update Commands
```bash
# Publish update to production
eas update --channel production --auto --message "Update description"

# List recent updates
eas update:list --branch production --limit 5

# View update details
eas update:view <update-group-id>
```

### Submit Commands
```bash
# Submit to Google Play
eas submit --platform android

# Submit to App Store
eas submit --platform ios
```

---

## ✅ Checklist for This Release

- [x] Update app version to 1.0.6
- [ ] Rebuild Android APK
- [ ] Rebuild iOS IPA (if applicable)
- [ ] Test YouTube video functionality
- [ ] Test all redesigned pages
- [ ] Verify belt system updates
- [ ] Test gallery fixes
- [ ] Submit to app stores (if applicable)
- [ ] Document any issues found

---

## 🚨 After Rebuild

Once version 1.0.6 is built and deployed:

1. **Future UI changes** can be deployed via OTA
2. **No rebuild needed** for JavaScript-only changes
3. **Faster deployment** for bug fixes and improvements
4. **Better user experience** (updates download automatically)

---

**Next Steps:** Rebuild the app with version 1.0.6, then use OTA for all future UI-only updates.



