import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import AlarmService from '../services/AlarmService';
import { Alarm } from '../types';

export const useAlarms = () => {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [loading, setLoading] = useState(true);
  const alarmService = AlarmService.getInstance();

  const loadAlarms = useCallback(async () => {
    try {
      setLoading(true);
      const loadedAlarms = await alarmService.loadAlarms();
      setAlarms(loadedAlarms);
    } catch (error) {
      console.error('Error loading alarms:', error);
      Alert.alert('Error', 'Failed to load alarms');
    } finally {
      setLoading(false);
    }
  }, []);

  const addAlarm = useCallback(async (alarm: Omit<Alarm, 'id'>) => {
    try {
      const newAlarm = await alarmService.addAlarm(alarm);
      setAlarms(prev => [...prev, newAlarm]);
      return newAlarm;
    } catch (error) {
      console.error('Error adding alarm:', error);
      Alert.alert('Error', 'Failed to add alarm');
      return null;
    }
  }, []);

  const removeAlarm = useCallback(async (id: string) => {
    try {
      await alarmService.removeAlarm(id);
      setAlarms(prev => prev.filter(alarm => alarm.id !== id));
    } catch (error) {
      console.error('Error removing alarm:', error);
      Alert.alert('Error', 'Failed to remove alarm');
    }
  }, []);

  const clearAllAlarms = useCallback(async () => {
    try {
      await alarmService.clearAllAlarms();
      setAlarms([]);
      Alert.alert('Success', 'All alarms cleared');
    } catch (error) {
      console.error('Error clearing alarms:', error);
      Alert.alert('Error', 'Failed to clear alarms');
    }
  }, []);

  const updateAlarm = useCallback(async (id: string, updates: Partial<Alarm>) => {
    try {
      const updatedAlarm = await alarmService.updateAlarm(id, updates);
      if (updatedAlarm) {
        setAlarms(prev => prev.map(alarm => 
          alarm.id === id ? updatedAlarm : alarm
        ));
      }
      return updatedAlarm;
    } catch (error) {
      console.error('Error updating alarm:', error);
      Alert.alert('Error', 'Failed to update alarm');
      return null;
    }
  }, []);

  useEffect(() => {
    loadAlarms();
  }, [loadAlarms]);

  return {
    alarms,
    loading,
    addAlarm,
    removeAlarm,
    clearAllAlarms,
    updateAlarm,
    refreshAlarms: loadAlarms,
  };
};
