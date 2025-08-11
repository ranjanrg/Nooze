// Firebase configuration for Nooze
import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Your Firebase config (extracted from google-services.json)
const firebaseConfig = {
  apiKey: "AIzaSyA3jIXcCepYGrEcPht8Z31IfKwt2wHy-1o",
  authDomain: "nooze-app.firebaseapp.com",
  projectId: "nooze-app",
  storageBucket: "nooze-app.firebasestorage.app",
  messagingSenderId: "412893832672",
  appId: "1:412893832672:android:e93718504d56ade6a1b785"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with persistence
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
} catch (error) {
  // If already initialized, get the existing instance
  auth = getAuth(app);
}

// Initialize Firestore
const db = getFirestore(app);

// Connect to emulator in development (optional)
if (__DEV__ && Platform.OS !== 'web') {
  // Uncomment for local development with Firebase emulator
  // connectFirestoreEmulator(db, 'localhost', 8080);
}

export { auth, db };
export default app;
