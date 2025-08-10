import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import ChallengeService from '../services/ChallengeService';
import { Challenge, OnboardingData, DayStatus, ChallengeLogEntry } from '../types';

export const useChallenge = () => {
  const [currentChallenge, setCurrentChallenge] = useState<Challenge | null>(null);
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [logsVersion, setLogsVersion] = useState(0);
  const challengeService = ChallengeService.getInstance();

  const loadChallenge = useCallback(async () => {
    try {
      setLoading(true);
      const [challenge, data] = await Promise.all([
        challengeService.getCurrentChallenge(),
        challengeService.getOnboardingData(),
      ]);
      setCurrentChallenge(challenge);
      setOnboardingData(data);
    } catch (error) {
      console.error('Error loading challenge:', error);
      Alert.alert('Error', 'Failed to load challenge data');
    } finally {
      setLoading(false);
    }
  }, []);

  const startChallenge = useCallback(async (data: OnboardingData) => {
    try {
      const challenge = await challengeService.startChallenge(data);
      setCurrentChallenge(challenge);
      setOnboardingData(data);
      Alert.alert('Success', 'Challenge started successfully!');
      return challenge;
    } catch (error) {
      console.error('Error starting challenge:', error);
      Alert.alert('Error', 'Failed to start challenge');
      return null;
    }
  }, []);

  const endChallenge = useCallback(async () => {
    try {
      await challengeService.endChallenge();
      setCurrentChallenge(prev => prev ? { ...prev, isActive: false } : null);
      Alert.alert('Success', 'Challenge ended');
    } catch (error) {
      console.error('Error ending challenge:', error);
      Alert.alert('Error', 'Failed to end challenge');
    }
  }, []);

  const calculateProgress = useCallback((challenge: Challenge) => {
    return challengeService.calculateProgress(challenge);
  }, []);

  const calculateProgressPercentage = useCallback((challenge: Challenge) => {
    return challengeService.calculateProgressPercentage(challenge);
  }, []);

  const isChallengeCompleted = useCallback((challenge: Challenge) => {
    return challengeService.isChallengeCompleted(challenge);
  }, []);

  const getDaysRemaining = useCallback((challenge: Challenge) => {
    return challengeService.getDaysRemaining(challenge);
  }, []);

  useEffect(() => {
    loadChallenge();
  }, [loadChallenge]);

  return {
    currentChallenge,
    onboardingData,
    loading,
    logsVersion,
    startChallenge,
    endChallenge,
    calculateProgress,
    calculateProgressPercentage,
    isChallengeCompleted,
    getDaysRemaining,
    refreshChallenge: loadChallenge,
    refreshLogs: async () => { await challengeService.loadLogs(); setLogsVersion(v => v + 1); },
    markDay: async (date: Date, status: DayStatus, info?: { actualWakeTime?: Date; solvedMath?: boolean }) => {
      await challengeService.markDay(date, status, info);
      setLogsVersion(v => v + 1);
    },
    dayStatus: (date: Date) => challengeService.getDayStatus(date),
    getLog: (date: Date): ChallengeLogEntry | undefined => challengeService.getLog(date),
    completedDaysFromLogs: () => currentChallenge ? challengeService.getCompletedDaysCount(currentChallenge) : 0,
  };
};
