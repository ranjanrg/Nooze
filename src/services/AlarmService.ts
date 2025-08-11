import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alarm } from '../types';

class AlarmService {
  private static instance: AlarmService;
  private alarms: Alarm[] = [];
  private cloudSyncService: any = null; // Lazy loaded to avoid circular dependency

  private constructor() {}

  public static getInstance(): AlarmService {
    if (!AlarmService.instance) {
      AlarmService.instance = new AlarmService();
    }
    return AlarmService.instance;
  }

  async loadAlarms(): Promise<Alarm[]> {
    try {
      const alarmsJson = await AsyncStorage.getItem('alarms');
      if (alarmsJson) {
        const alarms = JSON.parse(alarmsJson);
        this.alarms = alarms.map((alarm: any) => ({
          ...alarm,
          time: new Date(alarm.time),
        }));
      }
      return this.alarms;
    } catch (error) {
      console.error('Error loading alarms:', error);
      return [];
    }
  }

  async saveAlarms(): Promise<void> {
    try {
      await AsyncStorage.setItem('alarms', JSON.stringify(this.alarms));
      
      // Sync to cloud if user is authenticated
      await this.syncToCloud();
    } catch (error) {
      console.error('Error saving alarms:', error);
    }
  }

  private async syncToCloud(): Promise<void> {
    try {
      if (!this.cloudSyncService) {
        const CloudSyncService = require('./CloudSyncService').default;
        this.cloudSyncService = CloudSyncService.getInstance();
      }
      
      await this.cloudSyncService.syncAlarms(this.alarms);
    } catch (error) {
      // Cloud sync is optional, don't block local operations
      console.warn('Cloud sync failed:', error);
    }
  }

  async addAlarm(alarm: Omit<Alarm, 'id'>): Promise<Alarm> {
    const newAlarm: Alarm = {
      ...alarm,
      id: Date.now().toString(),
    };
    
    this.alarms.push(newAlarm);
    await this.saveAlarms();
    return newAlarm;
  }

  async removeAlarm(id: string): Promise<void> {
    this.alarms = this.alarms.filter(alarm => alarm.id !== id);
    await this.saveAlarms();
  }

  async clearAllAlarms(): Promise<void> {
    this.alarms = [];
    await this.saveAlarms();
  }

  async updateAlarm(id: string, updates: Partial<Alarm>): Promise<Alarm | null> {
    const index = this.alarms.findIndex(alarm => alarm.id === id);
    if (index !== -1) {
      this.alarms[index] = { ...this.alarms[index], ...updates };
      await this.saveAlarms();
      return this.alarms[index];
    }
    return null;
  }

  getAlarms(): Alarm[] {
    return [...this.alarms];
  }

  getAlarmById(id: string): Alarm | undefined {
    return this.alarms.find(alarm => alarm.id === id);
  }

  getActiveAlarms(): Alarm[] {
    return this.alarms.filter(alarm => alarm.isActive);
  }
}

export default AlarmService;
