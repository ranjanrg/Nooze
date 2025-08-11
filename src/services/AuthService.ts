import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  GoogleAuthProvider,
  signInWithCredential,
  AuthCredential,
  updateProfile
} from 'firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { appleAuth } from '@react-native-apple-authentication/apple-authentication';
import { auth } from '../../firebase.config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  provider: 'google' | 'apple' | 'email';
}

class AuthService {
  private static instance: AuthService;
  private currentUser: AuthUser | null = null;
  private authStateListeners: ((user: AuthUser | null) => void)[] = [];

  private constructor() {
    this.initializeAuth();
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private initializeAuth() {
    console.log('AuthService: Initializing authentication...');
    // Configure Google Sign-In
    try {
      GoogleSignin.configure({
        webClientId: '412893832672-p3qbmv5tm0e534b3vsei5611trp49ajs.apps.googleusercontent.com',
        offlineAccess: true,
      });
      console.log('AuthService: Google Sign-In configured successfully');
    } catch (error) {
      console.error('AuthService: Error configuring Google Sign-In:', error);
    }

    // Listen to auth state changes
    onAuthStateChanged(auth, (user) => {
      console.log('AuthService: Firebase auth state changed:', user ? 'User exists' : 'No user');
      if (user) {
        this.currentUser = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          provider: this.getProviderType(user)
        };
      } else {
        this.currentUser = null;
      }
      
      // Notify all listeners
      this.authStateListeners.forEach(listener => listener(this.currentUser));
    });
  }

  private getProviderType(user: User): 'google' | 'apple' | 'email' {
    const providerId = user.providerData[0]?.providerId;
    if (providerId?.includes('google')) return 'google';
    if (providerId?.includes('apple')) return 'apple';
    return 'email';
  }

  // Google Sign-In
  async signInWithGoogle(): Promise<AuthUser> {
    try {
      console.log('🔵 Step 1: Checking Play Services...');
      await GoogleSignin.hasPlayServices();
      
      console.log('🔵 Step 1.5: Signing out to clear cached tokens...');
      try {
        await GoogleSignin.signOut();
      } catch (signOutError) {
        console.log('Sign out not needed (no previous session)');
      }
      
      console.log('🔵 Step 2: Starting fresh Google Sign-In...');
      const userInfo = await GoogleSignin.signIn();
      console.log('🔵 Step 3: Google Sign-In successful!');
      console.log('Google Sign-In userInfo:', JSON.stringify(userInfo, null, 2));
      
      // Extract tokens from the correct structure
      console.log('🔵 Step 4: Extracting tokens...');
      const { idToken, accessToken } = userInfo.data || userInfo;
      console.log('Tokens - idToken exists:', !!idToken, 'accessToken exists:', !!accessToken);
      
      if (!idToken) {
        console.error('❌ No idToken received from Google Sign-In');
        throw new Error('No idToken received from Google Sign-In');
      }
      
      // Debug token timing
      console.log('🔵 Current timestamp:', Math.floor(Date.now() / 1000));
      try {
        const tokenPayload = JSON.parse(atob(idToken.split('.')[1]));
        console.log('🔵 Token issued at (iat):', tokenPayload.iat);
        console.log('🔵 Token expires at (exp):', tokenPayload.exp);
        console.log('🔵 Token age (seconds):', Math.floor(Date.now() / 1000) - tokenPayload.iat);
      } catch (e) {
        console.log('Could not decode token for debugging');
      }
      
      console.log('🔵 Step 5: Creating Google credential...');
      const googleCredential = GoogleAuthProvider.credential(idToken, accessToken);
      
      console.log('🔵 Step 6: Attempting Firebase authentication...');
      const result = await signInWithCredential(auth, googleCredential);
      console.log('🔵 Step 7: Firebase auth successful for:', result.user.email);
      
      console.log('🔵 Step 8: Checking current user state...');
      if (!this.currentUser) {
        console.error('❌ Current user is null after successful Firebase auth');
        // Wait a moment for auth state to update
        await new Promise(resolve => setTimeout(resolve, 1000));
        if (!this.currentUser) {
          throw new Error('Authentication failed - user state not updated');
        }
      }
      
      console.log('🔵 Step 9: Sign-in completed successfully!');
      return this.currentUser;
    } catch (error) {
      console.error('❌ Google sign-in error at step:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      throw new Error(`Google sign-in failed: ${error.message}`);
    }
  }

  // Apple Sign-In (iOS only)
  async signInWithApple(): Promise<AuthUser> {
    if (Platform.OS !== 'ios') {
      throw new Error('Apple Sign-In is only available on iOS');
    }

    try {
      const appleAuthRequestResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
      });

      if (!appleAuthRequestResponse.identityToken) {
        throw new Error('Apple Sign-In failed - no identity token');
      }

      // Create Firebase credential
      const { identityToken, nonce } = appleAuthRequestResponse;
      const appleCredential = new (require('firebase/auth')).OAuthProvider('apple.com').credential({
        idToken: identityToken,
        rawNonce: nonce,
      });

      const result = await signInWithCredential(auth, appleCredential);
      
      // Update display name if available from Apple
      if (appleAuthRequestResponse.fullName?.givenName && !result.user.displayName) {
        const displayName = `${appleAuthRequestResponse.fullName.givenName} ${appleAuthRequestResponse.fullName.familyName || ''}`.trim();
        await updateProfile(result.user, { displayName });
      }

      if (!this.currentUser) {
        throw new Error('Authentication failed');
      }
      
      return this.currentUser;
    } catch (error) {
      console.error('Apple sign-in error:', error);
      throw new Error('Apple sign-in failed');
    }
  }

  // Email/Password Sign-In
  async signInWithEmail(email: string, password: string): Promise<AuthUser> {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      
      if (!this.currentUser) {
        throw new Error('Authentication failed');
      }
      
      return this.currentUser;
    } catch (error) {
      console.error('Email sign-in error:', error);
      throw new Error('Invalid email or password');
    }
  }

  // Email/Password Sign-Up
  async signUpWithEmail(email: string, password: string, displayName?: string): Promise<AuthUser> {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      if (displayName) {
        await updateProfile(result.user, { displayName });
      }
      
      if (!this.currentUser) {
        throw new Error('Authentication failed');
      }
      
      return this.currentUser;
    } catch (error) {
      console.error('Email sign-up error:', error);
      throw new Error('Failed to create account');
    }
  }

  // Sign Out
  async signOut(): Promise<void> {
    try {
      // Sign out from Google if signed in
      if (await GoogleSignin.isSignedIn()) {
        await GoogleSignin.signOut();
      }
      
      await firebaseSignOut(auth);
      this.currentUser = null;
      
      // Clear any cached auth data
      await AsyncStorage.removeItem('lastSignInMethod');
    } catch (error) {
      console.error('Sign out error:', error);
      throw new Error('Failed to sign out');
    }
  }

  // Get current user
  getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  // Add auth state listener
  onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void {
    this.authStateListeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.authStateListeners.indexOf(callback);
      if (index > -1) {
        this.authStateListeners.splice(index, 1);
      }
    };
  }

  // Save sign-in method for future reference
  private async saveSignInMethod(method: 'google' | 'apple' | 'email') {
    try {
      await AsyncStorage.setItem('lastSignInMethod', method);
    } catch (error) {
      console.warn('Failed to save sign-in method:', error);
    }
  }

  // Get last used sign-in method
  async getLastSignInMethod(): Promise<'google' | 'apple' | 'email' | null> {
    try {
      return await AsyncStorage.getItem('lastSignInMethod') as 'google' | 'apple' | 'email' | null;
    } catch (error) {
      return null;
    }
  }
}

export default AuthService;
