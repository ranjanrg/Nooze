import AsyncStorage from '@react-native-async-storage/async-storage';
import { Challenge, OnboardingData, ChallengeLogEntry, DayStatus } from '../types';

class ChallengeService {
  private static instance: ChallengeService;
  private currentChallenge: Challenge | null = null;
  private onboardingData: OnboardingData | null = null;
  private logsByDate: Record<string, ChallengeLogEntry> = {};
  private cloudSyncService: any = null; // Lazy loaded to avoid circular dependency

  private constructor() {}

  public static getInstance(): ChallengeService {
    if (!ChallengeService.instance) {
      ChallengeService.instance = new ChallengeService();
    }
    return ChallengeService.instance;
  }

  async loadChallenge(): Promise<Challenge | null> {
    try {
      const challengeJson = await AsyncStorage.getItem('currentChallenge');
      if (challengeJson) {
        const challenge = JSON.parse(challengeJson);
        this.currentChallenge = {
          ...challenge,
          wakeUpTime: new Date(challenge.wakeUpTime),
          startDate: new Date(challenge.startDate),
        };
        // Load logs
        try {
          const logsJson = await AsyncStorage.getItem('challengeLogs');
          this.logsByDate = logsJson ? JSON.parse(logsJson) : {};
        } catch {}
      }
      return this.currentChallenge;
    } catch (error) {
      console.error('Error loading challenge:', error);
      return null;
    }
  }

  async saveChallenge(challenge: Challenge): Promise<void> {
    try {
      this.currentChallenge = challenge;
      await AsyncStorage.setItem('currentChallenge', JSON.stringify(challenge));
      await this.syncToCloud();
    } catch (error) {
      console.error('Error saving challenge:', error);
    }
  }

  private toDateKey(date: Date): string {
    const d = new Date(date);
    d.setHours(0,0,0,0);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  async loadLogs(): Promise<Record<string, ChallengeLogEntry>> {
    try {
      const logsJson = await AsyncStorage.getItem('challengeLogs');
      this.logsByDate = logsJson ? JSON.parse(logsJson) : {};
      return this.logsByDate;
    } catch {
      return {};
    }
  }

  private async saveLogsToStorage(): Promise<void> {
    await AsyncStorage.setItem('challengeLogs', JSON.stringify(this.logsByDate));
    await this.syncLogsToCloud();
  }

  async saveLogs(logs: Record<string, ChallengeLogEntry>): Promise<void> {
    this.logsByDate = logs;
    await this.saveLogsToStorage();
  }

  private async syncToCloud(): Promise<void> {
    try {
      if (!this.cloudSyncService) {
        const CloudSyncService = require('./CloudSyncService').default;
        this.cloudSyncService = CloudSyncService.getInstance();
      }
      
      // Skip sync if we're already syncing from cloud (prevents circular calls)
      if (this.cloudSyncService.isSyncingFromCloudNow()) {
        console.log('ChallengeService: Skipping challenge sync to cloud (already syncing from cloud)');
        return;
      }
      
      if (this.currentChallenge) {
        await this.cloudSyncService.syncChallenge(this.currentChallenge);
      }
    } catch (error) {
      console.warn('Cloud sync failed:', error);
    }
  }

  private async syncLogsToCloud(): Promise<void> {
    try {
      if (!this.cloudSyncService) {
        const CloudSyncService = require('./CloudSyncService').default;
        this.cloudSyncService = CloudSyncService.getInstance();
      }
      
      // Skip sync if we're already syncing from cloud (prevents circular calls)
      if (this.cloudSyncService.isSyncingFromCloudNow()) {
        console.log('ChallengeService: Skipping logs sync to cloud (already syncing from cloud)');
        return;
      }
      
      await this.cloudSyncService.syncChallengeLogs(this.logsByDate);
    } catch (error) {
      console.warn('Cloud sync failed:', error);
    }
  }

  private async syncOnboardingToCloud(): Promise<void> {
    try {
      if (!this.cloudSyncService) {
        const CloudSyncService = require('./CloudSyncService').default;
        this.cloudSyncService = CloudSyncService.getInstance();
      }
      
      // Skip sync if we're already syncing from cloud (prevents circular calls)
      if (this.cloudSyncService.isSyncingFromCloudNow()) {
        console.log('ChallengeService: Skipping onboarding sync to cloud (already syncing from cloud)');
        return;
      }
      
      if (this.onboardingData) {
        await this.cloudSyncService.syncOnboardingData(this.onboardingData);
      }
    } catch (error) {
      console.warn('Cloud sync failed:', error);
    }
  }

  async markDay(date: Date, status: DayStatus, info?: { actualWakeTime?: Date; solvedMath?: boolean }): Promise<void> {
    const key = this.toDateKey(date);
    this.logsByDate[key] = {
      dateKey: key,
      status,
      actualWakeTime: info?.actualWakeTime ? info.actualWakeTime.toISOString() : undefined,
      solvedMath: info?.solvedMath,
    };
    await this.saveLogsToStorage();
  }

  getDayStatus(date: Date): DayStatus | null {
    const key = this.toDateKey(date);
    return this.logsByDate[key]?.status ?? null;
  }

  getLog(date: Date): ChallengeLogEntry | undefined {
    const key = this.toDateKey(date);
    return this.logsByDate[key];
  }

  getCompletedDaysCount(challenge: Challenge): number {
    const startKey = this.toDateKey(challenge.startDate);
    const totalDays = challenge.duration === '365' ? 365 : 90;
    // Count completed days within challenge window based on logs
    const keys = Object.keys(this.logsByDate).sort();
    let count = 0;
    for (const k of keys) {
      if (k >= startKey && count < totalDays) {
        if (this.logsByDate[k].status === 'completed') count += 1;
      }
    }
    return count;
  }

  async startChallenge(
    onboardingData: OnboardingData,
    options?: { wakeUpTime?: Date; duration?: '90' | '365'; startDate?: Date }
  ): Promise<Challenge> {
    // Build challenge using provided options with sensible defaults
    const defaultWakeUpTime = new Date(2024, 0, 1, 6, 0);
    const challenge: Challenge = {
      id: Date.now().toString(),
      wakeUpTime: options?.wakeUpTime ?? defaultWakeUpTime,
      duration: options?.duration ?? '365',
      motivation: onboardingData.motivation,
      activities: [onboardingData.morningActivity],
      startDate: options?.startDate ?? new Date(),
      isActive: true,
    };

    await this.saveChallenge(challenge);
    await this.saveOnboardingData(onboardingData);
    return challenge;
  }

  async endChallenge(): Promise<void> {
    if (this.currentChallenge) {
      this.currentChallenge.isActive = false;
      await this.saveChallenge(this.currentChallenge);
    }
  }

  async getCurrentChallenge(): Promise<Challenge | null> {
    if (!this.currentChallenge) {
      return await this.loadChallenge();
    }
    return this.currentChallenge;
  }

  async loadOnboardingData(): Promise<OnboardingData | null> {
    try {
      const dataJson = await AsyncStorage.getItem('onboardingData');
      if (dataJson) {
        const data = JSON.parse(dataJson);
        this.onboardingData = data; // No need to parse wakeUpTime since it's removed
      }
      return this.onboardingData;
    } catch (error) {
      console.error('Error loading onboarding data:', error);
      return null;
    }
  }

  async saveOnboardingData(data: OnboardingData): Promise<void> {
    try {
      this.onboardingData = data;
      await AsyncStorage.setItem('onboardingData', JSON.stringify(data));
      await this.syncOnboardingToCloud();
    } catch (error) {
      console.error('Error saving onboarding data:', error);
    }
  }

  async getOnboardingData(): Promise<OnboardingData | null> {
    if (!this.onboardingData) {
      return await this.loadOnboardingData();
    }
    return this.onboardingData;
  }

  calculateProgress(challenge: Challenge): number {
    const now = new Date();
    const startDate = new Date(challenge.startDate);
    const daysElapsed = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const totalDays = challenge.duration === '365' ? 365 : 90;
    return Math.min(Math.max(daysElapsed, 0), totalDays);
  }

  calculateProgressPercentage(challenge: Challenge): number {
    const progress = this.calculateProgress(challenge);
    const totalDays = challenge.duration === '365' ? 365 : 90;
    return Math.round((progress / totalDays) * 100);
  }

  isChallengeCompleted(challenge: Challenge): boolean {
    const progress = this.calculateProgress(challenge);
    const totalDays = challenge.duration === '365' ? 365 : 90;
    return progress >= totalDays;
  }

  getDaysRemaining(challenge: Challenge): number {
    const progress = this.calculateProgress(challenge);
    const totalDays = challenge.duration === '365' ? 365 : 90;
    return Math.max(totalDays - progress, 0);
  }
}

export default ChallengeService;
