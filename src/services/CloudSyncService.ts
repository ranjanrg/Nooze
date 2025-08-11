import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  onSnapshot, 
  serverTimestamp,
  writeBatch,
  collection,
  query,
  where,
  orderBy,
  getDocs
} from 'firebase/firestore';
import { db } from '../../firebase.config';
import { Alarm, Challenge, OnboardingData, ChallengeLogEntry } from '../types';
import AuthService from './AuthService';
import AlarmService from './AlarmService';
import ChallengeService from './ChallengeService';
import NetInfo from '@react-native-community/netinfo';

export interface UserCloudData {
  userId: string;
  profile: {
    displayName: string | null;
    email: string | null;
    userName: string;
    createdAt: any; // Firestore timestamp
    updatedAt: any; // Firestore timestamp
  };
  alarms: Alarm[];
  currentChallenge: Challenge | null;
  challengeLogs: Record<string, ChallengeLogEntry>;
  onboardingData: OnboardingData | null;
  devices: {
    [deviceId: string]: {
      deviceId: string;
      platform: string;
      lastSeen: any; // Firestore timestamp
      appVersion: string;
    };
  };
  syncMetadata: {
    lastSyncAt: any; // Firestore timestamp
    version: number;
  };
}

class CloudSyncService {
  private static instance: CloudSyncService;
  private authService: AuthService;
  private alarmService: AlarmService;
  private challengeService: ChallengeService;
  private isOnline: boolean = true;
  private pendingChanges: any[] = [];
  private syncInProgress: boolean = false;
  private realtimeListeners: (() => void)[] = [];

  private constructor() {
    this.authService = AuthService.getInstance();
    this.alarmService = AlarmService.getInstance();
    this.challengeService = ChallengeService.getInstance();
    this.initializeNetworkListener();
  }

  public static getInstance(): CloudSyncService {
    if (!CloudSyncService.instance) {
      CloudSyncService.instance = new CloudSyncService();
    }
    return CloudSyncService.instance;
  }

  private initializeNetworkListener() {
    NetInfo.addEventListener(state => {
      const wasOnline = this.isOnline;
      this.isOnline = state.isConnected ?? false;
      
      // If we just came online and have pending changes, sync them
      if (!wasOnline && this.isOnline && this.pendingChanges.length > 0) {
        this.syncPendingChanges();
      }
    });
  }

  // Initialize cloud sync for authenticated user
  async initializeCloudSync(): Promise<void> {
    const user = this.authService.getCurrentUser();
    if (!user) {
      console.error('CloudSync: No authenticated user found');
      throw new Error('User not authenticated');
    }

    console.log('CloudSync: Initializing cloud sync for user:', user.uid);
    
    try {
      console.log('CloudSync: Checking if user document exists...');
      // Check if user data exists in cloud
      const userDoc = await this.getUserDocument(user.uid);
      
      if (userDoc.exists()) {
        console.log('CloudSync: User document exists, syncing from cloud...');
        // User exists, sync down from cloud
        await this.syncFromCloud();
      } else {
        console.log('CloudSync: New user, migrating local data to cloud...');
        // New user, migrate local data to cloud
        await this.migrateLocalDataToCloud();
      }

      console.log('CloudSync: Setting up real-time listeners...');
      // Set up real-time listeners
      this.setupRealtimeSync();
      
      console.log('CloudSync: Initialization completed successfully!');
    } catch (error) {
      console.error('CloudSync: Failed to initialize cloud sync:', error);
      console.error('CloudSync: Error details:', JSON.stringify(error, null, 2));
      throw new Error(`Cloud sync initialization failed: ${error.message}`);
    }
  }

  // Migrate existing local data to cloud (first sign-in)
  private async migrateLocalDataToCloud(): Promise<void> {
    const user = this.authService.getCurrentUser();
    if (!user) {
      console.error('CloudSync: No user for migration');
      return;
    }

    try {
      console.log('CloudSync: Starting local data migration...');
      
      // Load all local data
      console.log('CloudSync: Loading local data...');
      const [alarms, currentChallenge, challengeLogs, onboardingData, userName] = await Promise.all([
        this.alarmService.loadAlarms(),
        this.challengeService.getCurrentChallenge(),
        this.challengeService.loadLogs(),
        this.challengeService.getOnboardingData(),
        this.getLocalUserName()
      ]);

      console.log('CloudSync: Local data loaded:', {
        alarms: alarms?.length || 0,
        hasChallenge: !!currentChallenge,
        logsCount: Object.keys(challengeLogs || {}).length,
        hasOnboarding: !!onboardingData,
        userName: userName || 'none'
      });

      // Create cloud document
      const deviceId = this.getDeviceId();
      const cloudData: UserCloudData = {
        userId: user.uid,
        profile: {
          displayName: user.displayName,
          email: user.email,
          userName: userName || user.displayName || 'User',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        },
        alarms: alarms || [],
        currentChallenge: currentChallenge || null,
        challengeLogs: challengeLogs || {},
        onboardingData: onboardingData || null,
        devices: {
          [deviceId]: {
            deviceId: deviceId,
            platform: require('react-native').Platform.OS,
            lastSeen: serverTimestamp(),
            appVersion: '1.9' // TODO: Get from package.json
          }
        },
        syncMetadata: {
          lastSyncAt: serverTimestamp(),
          version: 1
        }
      };

      console.log('CloudSync: Saving to Firestore...');
      console.log('CloudSync: User UID:', user.uid);
      console.log('CloudSync: User auth state:', {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName
      });
      
      await setDoc(doc(db, 'users', user.uid), cloudData);
      console.log('CloudSync: Local data migrated to cloud successfully!');
    } catch (error) {
      console.error('CloudSync: Failed to migrate local data to cloud:', error);
      console.error('CloudSync: Migration error details:', JSON.stringify(error, null, 2));
      throw error;
    }
  }

  // Sync data from cloud to local
  private async syncFromCloud(): Promise<void> {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    try {
      console.log('Syncing data from cloud...');
      const userDoc = await this.getUserDocument(user.uid);
      
      if (!userDoc.exists()) {
        console.warn('User document does not exist in cloud');
        return;
      }

      const cloudData = userDoc.data() as UserCloudData;
      
      // Update local services with cloud data
      if (cloudData.alarms) {
        // Clear local alarms and replace with cloud data
        await this.alarmService.clearAllAlarms();
        for (const alarm of cloudData.alarms) {
          await this.alarmService.addAlarm({
            time: alarm.time,
            repeatDays: alarm.repeatDays,
            isActive: alarm.isActive
          });
        }
      }

      if (cloudData.currentChallenge) {
        await this.challengeService.saveChallenge(cloudData.currentChallenge);
      }

      if (cloudData.challengeLogs) {
        // Merge challenge logs (cloud takes precedence)
        const localLogs = await this.challengeService.loadLogs();
        const mergedLogs = { ...localLogs, ...cloudData.challengeLogs };
        await this.challengeService.saveLogs(mergedLogs);
      }

      if (cloudData.onboardingData) {
        await this.challengeService.saveOnboardingData(cloudData.onboardingData);
      }

      if (cloudData.profile.userName) {
        await this.saveLocalUserName(cloudData.profile.userName);
      }

      // Update device info
      await this.updateDeviceInfo();

      console.log('Data synced from cloud successfully');
    } catch (error) {
      console.error('Failed to sync from cloud:', error);
      throw error;
    }
  }

  // Set up real-time synchronization listeners
  private setupRealtimeSync(): void {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    // Listen to user document changes
    const unsubscribe = onSnapshot(
      doc(db, 'users', user.uid),
      (doc) => {
        if (doc.exists() && !this.syncInProgress) {
          const cloudData = doc.data() as UserCloudData;
          this.handleCloudDataChange(cloudData);
        }
      },
      (error) => {
        console.error('Real-time sync error:', error);
      }
    );

    this.realtimeListeners.push(unsubscribe);
  }

  // Handle incoming cloud data changes
  private async handleCloudDataChange(cloudData: UserCloudData): Promise<void> {
    try {
      // TODO: Implement smart merging logic
      // For now, we'll update local data if cloud version is newer
      console.log('Received cloud data update');
      
      // Update local data with cloud changes
      // This is a simplified implementation - in production, you'd want
      // more sophisticated conflict resolution
    } catch (error) {
      console.error('Failed to handle cloud data change:', error);
    }
  }

  // Sync local changes to cloud
  async syncToCloud(changes: Partial<UserCloudData>): Promise<void> {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    if (!this.isOnline) {
      // Queue changes for later sync
      this.pendingChanges.push({ ...changes, timestamp: Date.now() });
      return;
    }

    try {
      this.syncInProgress = true;
      
      const updateData = {
        ...changes,
        'syncMetadata.lastSyncAt': serverTimestamp(),
        'syncMetadata.version': Date.now() // Simple versioning
      };

      await updateDoc(doc(db, 'users', user.uid), updateData);
      await this.updateDeviceInfo();
      
      console.log('Data synced to cloud successfully');
    } catch (error) {
      console.error('Failed to sync to cloud:', error);
      // Add to pending changes if sync failed
      this.pendingChanges.push({ ...changes, timestamp: Date.now() });
    } finally {
      this.syncInProgress = false;
    }
  }

  // Sync pending changes when coming back online
  private async syncPendingChanges(): Promise<void> {
    if (this.pendingChanges.length === 0) return;

    try {
      console.log(`Syncing ${this.pendingChanges.length} pending changes...`);
      
      // Merge all pending changes
      const mergedChanges = this.pendingChanges.reduce((acc, change) => {
        return { ...acc, ...change };
      }, {});

      await this.syncToCloud(mergedChanges);
      this.pendingChanges = [];
      
      console.log('Pending changes synced successfully');
    } catch (error) {
      console.error('Failed to sync pending changes:', error);
    }
  }

  // Update device information
  private async updateDeviceInfo(): Promise<void> {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    const deviceId = this.getDeviceId();
    const deviceInfo = {
      [`devices.${deviceId}`]: {
        deviceId,
        platform: require('react-native').Platform.OS,
        lastSeen: serverTimestamp(),
        appVersion: '1.9' // TODO: Get from package.json
      }
    };

    try {
      await updateDoc(doc(db, 'users', user.uid), deviceInfo);
    } catch (error) {
      console.error('Failed to update device info:', error);
    }
  }

  // Utility methods
  private async getUserDocument(userId: string) {
    return await getDoc(doc(db, 'users', userId));
  }

  private getDeviceId(): string {
    // Generate a unique device ID (you might want to use a more robust method)
    return require('react-native').Platform.OS + '_' + Date.now().toString();
  }

  private async getLocalUserName(): Promise<string | null> {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      return await AsyncStorage.getItem('userName');
    } catch {
      return null;
    }
  }

  private async saveLocalUserName(userName: string): Promise<void> {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem('userName', userName);
    } catch (error) {
      console.error('Failed to save local user name:', error);
    }
  }

  // Public methods for services to trigger sync
  async syncAlarms(alarms: Alarm[]): Promise<void> {
    await this.syncToCloud({ alarms });
  }

  async syncChallenge(challenge: Challenge): Promise<void> {
    await this.syncToCloud({ currentChallenge: challenge });
  }

  async syncChallengeLogs(logs: Record<string, ChallengeLogEntry>): Promise<void> {
    await this.syncToCloud({ challengeLogs: logs });
  }

  async syncOnboardingData(data: OnboardingData): Promise<void> {
    await this.syncToCloud({ onboardingData: data });
  }

  async syncUserName(userName: string): Promise<void> {
    await this.syncToCloud({ 
      'profile.userName': userName,
      'profile.updatedAt': serverTimestamp()
    });
  }

  // Cleanup
  cleanup(): void {
    this.realtimeListeners.forEach(unsubscribe => unsubscribe());
    this.realtimeListeners = [];
  }
}

export default CloudSyncService;
