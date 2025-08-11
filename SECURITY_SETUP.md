# 🔒 Security Setup for Nooze Firebase Integration

## ⚠️ IMPORTANT: Firebase Configuration

The `firebase.config.js` file contains sensitive API keys and should **NEVER** be committed to git.

## 🛠️ Setup Instructions

### For New Developers:

1. **Copy the template:**
   ```bash
   cp firebase.config.template.js firebase.config.js
   ```

2. **Get your Firebase config:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project
   - Go to Project Settings → General
   - Scroll down to "Your apps" → Web app
   - Copy the config values

3. **Update firebase.config.js:**
   - Replace `YOUR_API_KEY_HERE` with your actual API key
   - Replace `YOUR_PROJECT_ID` with your project ID
   - Replace other placeholder values

4. **Add google-services.json:**
   - Download from Firebase Console → Project Settings → Android app
   - Place in `android/app/google-services.json`

## 🔐 Security Notes

- `firebase.config.js` is in `.gitignore` and will not be committed
- `google-services.json` is also ignored for security
- These files contain sensitive keys - keep them private
- Never share these files publicly

## 🚨 If Keys Are Exposed

If API keys are accidentally committed:
1. Immediately rotate the keys in Firebase Console
2. Update your local config files
3. Force push to remove from git history if needed

## 📱 Firebase Services Used

- **Authentication:** Google Sign-In
- **Firestore:** Real-time database for user data
- **Security Rules:** User isolation and data protection
