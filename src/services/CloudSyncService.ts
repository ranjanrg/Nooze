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
  private alarmService: AlarmService | null = null;
  private challengeService: ChallengeService | null = null;
  private isOnline: boolean = true;
  private pendingChanges: any[] = [];
  private readonly MAX_PENDING_CHANGES = 100; // Limit to prevent memory issues
  private readonly MAX_RETRY_ATTEMPTS = 3;
  private readonly INITIAL_RETRY_DELAY = 1000; // 1 second
  private syncInProgress: boolean = false;
  private isSyncingFromCloud: boolean = false;
  private isInitializing: boolean = false;
  private realtimeListeners: (() => void)[] = [];

  private constructor() {
    this.authService = AuthService.getInstance();
    // Don't initialize other services here to avoid circular dependency
    // They will be lazy-loaded when needed
    this.initializeNetworkListener();
  }

  public static getInstance(): CloudSyncService {
    if (!CloudSyncService.instance) {
      CloudSyncService.instance = new CloudSyncService();
    }
    return CloudSyncService.instance;
  }

  // Check if we're currently syncing from cloud (to prevent circular calls)
  public isSyncingFromCloudNow(): boolean {
    return this.isSyncingFromCloud;
  }

  // Add to pending changes with memory management
  private addToPendingChanges(change: any): void {
    // Remove oldest changes if we exceed the limit
    if (this.pendingChanges.length >= this.MAX_PENDING_CHANGES) {
      const removeCount = Math.floor(this.MAX_PENDING_CHANGES * 0.2); // Remove 20% of oldest
      this.pendingChanges.splice(0, removeCount);
      console.warn(`CloudSync: Removed ${removeCount} oldest pending changes to prevent memory issues`);
    }
    
    this.pendingChanges.push(change);
  }

  // Retry mechanism with exponential backoff
  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    operationName: string,
    attempt: number = 1
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (attempt >= this.MAX_RETRY_ATTEMPTS) {
        console.error(`CloudSync: ${operationName} failed after ${this.MAX_RETRY_ATTEMPTS} attempts:`, error);
        throw error;
      }

      const delay = this.INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1); // Exponential backoff
      console.warn(`CloudSync: ${operationName} failed (attempt ${attempt}), retrying in ${delay}ms...`, error.message);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return this.retryWithBackoff(operation, operationName, attempt + 1);
    }
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

  // Lazy load services to avoid circular dependency
  private getAlarmService(): AlarmService {
    if (!this.alarmService) {
      this.alarmService = AlarmService.getInstance();
    }
    return this.alarmService;
  }

  private getChallengeService(): ChallengeService {
    if (!this.challengeService) {
      this.challengeService = ChallengeService.getInstance();
    }
    return this.challengeService;
  }

  // Initialize cloud sync for authenticated user
  async initializeCloudSync(): Promise<void> {
    // Prevent multiple simultaneous initializations
    if (this.isInitializing) {
      console.log('CloudSync: Initialization already in progress, skipping...');
      return;
    }

    const user = this.authService.getCurrentUser();
    if (!user) {
      console.error('CloudSync: No authenticated user found');
      throw new Error('User not authenticated');
    }

    this.isInitializing = true;
    console.log('CloudSync: Initializing cloud sync for user:', user.uid);
    
    try {
      console.log('CloudSync: Checking if user document exists...');
      // Check if user data exists in cloud with retry mechanism
      const userDoc = await this.retryWithBackoff(
        () => this.getUserDocument(user.uid),
        'getUserDocument'
      );
      
      if (userDoc.exists()) {
        console.log('CloudSync: User document exists, checking local data...');
        // Check if we have local data that might be newer
        const challengeService = this.getChallengeService();
        const localLogs = await challengeService.loadLogs();
        const hasLocalData = Object.keys(localLogs).length > 0;
        
        if (hasLocalData) {
          console.log('CloudSync: Local data found, uploading to cloud instead of downloading...');
          // We have local data, so upload it instead of downloading
          await this.migrateLocalDataToCloud();
        } else {
          console.log('CloudSync: No local data, syncing from cloud...');
          // No local data, safe to sync from cloud
          await this.syncFromCloud();
        }
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
    } finally {
      // Always reset the initialization flag
      this.isInitializing = false;
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
      
      // Load all local data directly from AsyncStorage to avoid circular dependency during initialization
      console.log('CloudSync: Loading local data...');
      const [alarms, currentChallenge, challengeLogs, onboardingData, userName] = await Promise.all([
        this.loadAlarmsDirectly(),
        this.loadChallengeDirectly(),
        this.loadLogsDirectly(),
        this.loadOnboardingDirectly(),
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

    // Prevent infinite loops during cloud sync
    this.isSyncingFromCloud = true;

    try {
      console.log('Syncing data from cloud...');
      const userDoc = await this.retryWithBackoff(
        () => this.getUserDocument(user.uid),
        'syncFromCloud getUserDocument'
      );
      
      if (!userDoc.exists()) {
        console.warn('User document does not exist in cloud');
        return;
      }

      const cloudData = userDoc.data() as UserCloudData;
      
      // Update local services with cloud data
      if (cloudData.alarms) {
        // Clear local alarms and replace with cloud data
        const alarmService = this.getAlarmService();
        await alarmService.clearAllAlarms();
        for (const alarm of cloudData.alarms) {
          await alarmService.addAlarm({
            time: alarm.time,
            repeatDays: alarm.repeatDays,
            isActive: alarm.isActive
          });
        }
      }

      if (cloudData.currentChallenge) {
        const challengeService = this.getChallengeService();
        await challengeService.saveChallenge(cloudData.currentChallenge);
      }

      if (cloudData.challengeLogs) {
        // Smart merge challenge logs (preserve both local and cloud data)
        const challengeService = this.getChallengeService();
        const localLogs = await challengeService.loadLogs();
        // Local data takes precedence over cloud data to prevent overwriting newer entries
        const mergedLogs = { ...cloudData.challengeLogs, ...localLogs };
        await challengeService.saveLogs(mergedLogs);
        console.log('CloudSync: Merged logs - Local entries:', Object.keys(localLogs).length, 'Cloud entries:', Object.keys(cloudData.challengeLogs).length, 'Final merged:', Object.keys(mergedLogs).length);
      }

      if (cloudData.onboardingData) {
        const challengeService = this.getChallengeService();
        await challengeService.saveOnboardingData(cloudData.onboardingData);
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
    } finally {
      // Always reset the flag
      this.isSyncingFromCloud = false;
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
      // Queue changes for later sync with memory management
      this.addToPendingChanges({ ...changes, timestamp: Date.now() });
      return;
    }

    try {
      this.syncInProgress = true;
      
      const updateData = {
        ...changes,
        'syncMetadata.lastSyncAt': serverTimestamp(),
        'syncMetadata.version': Date.now() // Simple versioning
      };

      await this.retryWithBackoff(
        () => updateDoc(doc(db, 'users', user.uid), updateData),
        'syncToCloud updateDoc'
      );
      await this.updateDeviceInfo();
      
      console.log('Data synced to cloud successfully');
    } catch (error) {
      console.error('Failed to sync to cloud:', error);
      // Add to pending changes if sync failed with memory management
      this.addToPendingChanges({ ...changes, timestamp: Date.now() });
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

  // Direct loading methods to avoid circular dependency during initialization
  private async loadAlarmsDirectly(): Promise<any[]> {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const alarmsJson = await AsyncStorage.getItem('alarms');
      return alarmsJson ? JSON.parse(alarmsJson) : [];
    } catch {
      return [];
    }
  }

  private async loadChallengeDirectly(): Promise<any | null> {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const challengeJson = await AsyncStorage.getItem('currentChallenge');
      return challengeJson ? JSON.parse(challengeJson) : null;
    } catch {
      return null;
    }
  }

  private async loadLogsDirectly(): Promise<Record<string, any>> {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const logsJson = await AsyncStorage.getItem('challengeLogs');
      return logsJson ? JSON.parse(logsJson) : {};
    } catch {
      return {};
    }
  }

  private async loadOnboardingDirectly(): Promise<any | null> {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const onboardingJson = await AsyncStorage.getItem('onboardingData');
      return onboardingJson ? JSON.parse(onboardingJson) : null;
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
