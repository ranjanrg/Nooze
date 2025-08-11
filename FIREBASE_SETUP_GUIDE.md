# Firebase Setup Guide for Nooze

This guide will help you set up Firebase Authentication and Firestore for your paid Nooze app to enable cross-device data synchronization.

## Prerequisites

- Google account
- React Native development environment set up
- Nooze app codebase

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name: `nooze-app` (or your preferred name)
4. Enable Google Analytics (recommended for paid apps)
5. Click "Create project"

## Step 2: Add Android App

1. In Firebase console, click "Add app" → Android icon
2. Enter Android package name: `com.nooze` (match your app's package name)
3. Enter app nickname: "Nooze Android"
4. Download `google-services.json`
5. Place `google-services.json` in `android/app/` directory

## Step 3: Add iOS App (if supporting iOS)

1. Click "Add app" → iOS icon
2. Enter iOS bundle ID: `com.nooze` (match your iOS bundle ID)
3. Enter app nickname: "Nooze iOS"
4. Download `GoogleService-Info.plist`
5. Add to iOS project in Xcode

## Step 4: Enable Authentication

1. In Firebase console, go to "Authentication" → "Get started"
2. Go to "Sign-in method" tab
3. Enable these providers:
   - **Google**: Click "Enable" → Configure OAuth consent screen
   - **Apple**: Click "Enable" → Configure Apple Sign-In
   - **Email/Password**: Click "Enable" (for fallback option)

### Google Sign-In Configuration

1. In Google provider settings, note the "Web client ID"
2. Update `firebase.config.js`:
   ```javascript
   // Replace with your actual config
   const firebaseConfig = {
     apiKey: "your-api-key-here",
     authDomain: "nooze-app.firebaseapp.com",
     projectId: "nooze-app",
     storageBucket: "nooze-app.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:android:abcdef123456"
   };
   ```

3. Update `src/services/AuthService.ts`:
   ```javascript
   GoogleSignin.configure({
     webClientId: 'your-web-client-id-here.apps.googleusercontent.com',
     offlineAccess: true,
   });
   ```

## Step 5: Set up Firestore Database

1. Go to "Firestore Database" → "Create database"
2. Choose "Start in production mode" (for paid apps)
3. Select location (choose closest to your users)
4. Click "Done"

### Security Rules

Replace the default rules with these production-ready rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## Step 6: Install Dependencies

Run these commands in your project root:

```bash
# Firebase SDK
npm install @react-native-firebase/app @react-native-firebase/auth @react-native-firebase/firestore

# Google Sign-In
npm install @react-native-google-signin/google-signin

# Apple Sign-In (iOS only)
npm install @react-native-apple-authentication/apple-authentication

# Network detection
npm install @react-native-community/netinfo

# iOS setup
cd ios && pod install && cd ..
```

## Step 7: Android Configuration

### Update `android/app/build.gradle`

Add at the bottom:
```gradle
apply plugin: 'com.google.gms.google-services'
```

### Update `android/build.gradle`

Add to dependencies:
```gradle
dependencies {
    classpath 'com.google.gms:google-services:4.3.15'
    // ... other dependencies
}
```

### Update `android/app/src/main/AndroidManifest.xml`

Add internet permission (if not already present):
```xml
<uses-permission android:name="android.permission.INTERNET" />
```

## Step 8: iOS Configuration (if supporting iOS)

### Update `ios/Podfile`

Ensure minimum iOS version:
```ruby
platform :ios, '11.0'
```

### Configure URL Schemes

1. Open iOS project in Xcode
2. Go to project settings → Info → URL Types
3. Add URL scheme from `GoogleService-Info.plist` (REVERSED_CLIENT_ID)

## Step 9: Test Authentication

1. Build and run the app
2. Try signing in with Google/Apple
3. Check Firebase console → Authentication → Users to see new users

## Step 10: Test Data Sync

1. Sign in on one device
2. Create some challenge data
3. Sign in with same account on another device
4. Verify data syncs correctly

## Production Considerations

### Security
- Review Firestore security rules
- Enable App Check for additional security
- Monitor authentication events

### Performance
- Enable Firestore offline persistence
- Monitor Cloud Functions usage
- Set up proper indexes for queries

### Monitoring
- Enable Crashlytics
- Set up Performance Monitoring
- Monitor authentication success rates

### Costs
- Firebase has generous free tiers
- Firestore charges per read/write
- Authentication is free for most use cases
- Monitor usage in Firebase console

## Troubleshooting

### Common Issues

**Google Sign-In fails:**
- Check SHA1 fingerprint in Firebase console
- Verify `webClientId` is correct
- Ensure Google Services plugin is applied

**Data not syncing:**
- Check Firestore security rules
- Verify user is authenticated
- Check network connectivity
- Look for errors in console logs

**Build errors:**
- Clean and rebuild: `cd android && ./gradlew clean && cd .. && npx react-native run-android`
- Ensure all dependencies are installed
- Check for version conflicts

### Getting Help

- Firebase documentation: https://firebase.google.com/docs
- React Native Firebase: https://rnfirebase.io/
- Community support: Stack Overflow with `firebase` and `react-native` tags

## Environment Variables (Optional)

For multiple environments (dev/staging/prod), consider using:
- React Native Config for environment-specific Firebase configs
- Separate Firebase projects for each environment

## Next Steps

After setup is complete:
1. Test thoroughly on multiple devices
2. Implement proper error handling
3. Add data export functionality
4. Consider implementing family sharing
5. Monitor usage and costs

---

**Important**: Keep your Firebase configuration files (`google-services.json`, `GoogleService-Info.plist`) secure and never commit them to public repositories. Use environment variables or secure storage for sensitive configuration.
