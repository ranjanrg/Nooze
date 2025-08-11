/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Alert, AppState, AppStateStatus, PermissionsAndroid, Platform, Text, TextInput, View } from 'react-native';
import { NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { HomeScreen } from './src/components/HomeScreen';
import { OnboardingScreen } from './src/components/OnboardingScreen';
import { SettingsScreen } from './src/components/SettingsScreen';
import { ChallengesScreen } from './src/components/ChallengesScreen';
import { NameInputScreen } from './src/components/NameInputScreen';
import { TimeSelectionScreen } from './src/components/TimeSelectionScreen';
import { ConfirmationScreen } from './src/components/ConfirmationScreen';
import { useAlarms } from './src/hooks/useAlarms';
import { useChallenge } from './src/hooks/useChallenge';
import { useAuth } from './src/hooks/useAuth';
import { ScreenType, OnboardingData } from './src/types';
import { AuthScreen } from './src/components/AuthScreen';
import { homeStyles } from './src/styles';

const { AlarmModule } = NativeModules;

// Enforce Roboto as the default app font on Android so system font changes don't affect UI
if (Platform.OS === 'android') {
  const defaultFont = { fontFamily: 'Roboto' as const };
  const applyDefaultFont = (Component: any) => {
    // Preserve any existing default style and append our font
    // so per-component styles can still override if needed
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const prev = Component.defaultProps?.style;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    Component.defaultProps = Component.defaultProps || {};
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    Component.defaultProps.style = prev ? [prev, defaultFont] : defaultFont;
  };
  applyDefaultFont(Text);
  applyDefaultFont(TextInput);
}

export default function App() {
  // Authentication
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  
  // Screen navigation
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('home');
  
  // Onboarding state
  const [selectedMotivation, setSelectedMotivation] = useState<string>('');
  const [selectedMorningActivity, setSelectedMorningActivity] = useState<string>('');
  const [selectedPastExperience, setSelectedPastExperience] = useState<string>('');
  const [selectedObstacle, setSelectedObstacle] = useState<string>('');
  const [selectedRoutineRating, setSelectedRoutineRating] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [repeatDays, setRepeatDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [selectedChallenge, setSelectedChallenge] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [isEditingTime, setIsEditingTime] = useState<boolean>(false);
  const { alarms, addAlarm, removeAlarm, clearAllAlarms } = useAlarms();
  const { currentChallenge, startChallenge, calculateProgressPercentage, markDay, dayStatus, completedDaysFromLogs, getLog, refreshLogs, logsVersion } = useChallenge();

  // Check permissions on app start
  useEffect(() => {
    // Ensure notification channel exists before requesting permissions
    try { AlarmModule.createAlarmChannel(); } catch {}
    checkPermissions();
    // Load saved user name for header
    (async () => {
      try {
        const saved = await AsyncStorage.getItem('userName');
        if (saved) setUserName(saved);
      } catch {}
    })();
  }, []);

  // Consume native completion on foreground and update logs
  useEffect(() => {
    const handleAppStateChange = async (state: AppStateStatus) => {
      if (state === 'active') {
        try {
          const data = await AlarmModule.consumeLastCompletion?.();
          if (data && typeof data === 'object') {
            const { dateKey, actualWakeTime } = data as { dateKey?: string; actualWakeTime?: string };
            const date = dateKey ? new Date(dateKey + 'T00:00:00') : new Date();
            await markDay(date, 'completed', { actualWakeTime: actualWakeTime ? new Date(actualWakeTime) : new Date(), solvedMath: true });
            try { await refreshLogs?.(); } catch {}
          }
        } catch (e) {
          // no-op
        }
      }
    };
    const sub = AppState.addEventListener('change', handleAppStateChange);
    // Run once on mount in case app is already active
    handleAppStateChange('active');
    return () => sub.remove();
  }, [markDay]);

  const checkPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        // Android 13+ notification permission (optional for now)
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          {
            title: 'Notification Permission',
            message: 'Nooze needs permission to send notifications',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log('Notification permission granted');
        } else {
          console.log('Notification permission denied');
          // Guide user to system settings when permission is denied or blocked
          Alert.alert(
            'Allow notifications (required)',
            'This permission is necessary for alarms to ring and display over your lock screen. Without it, the alarm UI may not appear and you could miss alarms. Please enable notifications for Nooze.',
            [
              { text: 'Later', style: 'cancel' },
              { text: 'Open settings', onPress: async () => { try { await AlarmModule.openAppNotificationSettings(); } catch {} } },
            ]
          );
        }

        // Android 12+ Exact Alarms capability prompt
        try {
          const canExact = await AlarmModule.canScheduleExactAlarms();
          if (!canExact) {
            Alert.alert(
              'Allow exact alarms (required)',
              'This permission is necessary so your alarm fires at the exact minute every day, even in battery saver/Doze. Without it, Android may delay alarms.',
              [
                { text: 'Not now', style: 'cancel' },
                { text: 'Open settings', onPress: async () => { try { await AlarmModule.openExactAlarmSettings(); } catch {} } },
              ]
            );
          }
        } catch (e) {
          console.warn('Exact alarm capability check failed', e);
        }

        // Post a test notification to surface channel in settings UIs
        try { await AlarmModule.postTestNotification(); } catch {}
      } catch (err) {
        console.warn(err);
      }
    }
  };

  // Navigation handlers
  const navigateToScreen = (screen: ScreenType) => {
    setCurrentScreen(screen);
  };

  const goBack = () => {
    const screenFlow: Record<ScreenType, ScreenType> = {
      question: 'nameInput',
      morningActivities: 'question',
      pastExperience: 'morningActivities',
      obstacles: 'pastExperience',
      routineRating: 'obstacles',
      auth: 'routineRating',
      timeSelection: 'auth',
      confirmation: 'timeSelection',
      home: 'home',
      setAlarm: 'home',
      settings: 'home',
      challenges: 'home',
      nameInput: 'challenges',
    };
    setCurrentScreen(screenFlow[currentScreen]);
  };

  const handleNext = () => {
    const screenFlow: Record<ScreenType, ScreenType> = {
      question: 'morningActivities',
      morningActivities: 'pastExperience',
      pastExperience: 'obstacles',
      obstacles: 'routineRating',
      routineRating: 'auth',
      timeSelection: 'confirmation',
      confirmation: 'home',
      home: 'home',
      setAlarm: 'home',
      settings: 'home',
      challenges: 'home',
      nameInput: 'question',
      auth: 'timeSelection',
    };
    setCurrentScreen(screenFlow[currentScreen]);
  };

  // Onboarding handlers
  const handleOptionSelect = (option: string) => {
    switch (currentScreen) {
      case 'question':
        setSelectedMotivation(option);
        break;
      case 'morningActivities':
        setSelectedMorningActivity(option);
        break;
      case 'pastExperience':
        setSelectedPastExperience(option);
        break;
      case 'obstacles':
        setSelectedObstacle(option);
        break;
      case 'routineRating':
        setSelectedRoutineRating(option);
        break;
    }
  };

  // Challenge handlers
  const handleChallengeSelect = (challengeType: string) => {
    setSelectedChallenge(challengeType);
    setCurrentScreen('nameInput');
  };

  const handleNameSubmit = async (name: string) => {
    setUserName(name);
    try { await AsyncStorage.setItem('userName', name); } catch {}
    // Screen navigation is handled by the caller
  };

  // Onboarding helper to prompt all critical permissions/special access
  const promptCriticalAccess = async () => {
    try {
      // 1) Notifications settings (ensures high-importance channel visible)
      try { await AlarmModule.openAppNotificationSettings(); } catch {}
      // 2) Exact alarms (Android 12+)
      try {
        const canExact = await AlarmModule.canScheduleExactAlarms();
        if (!canExact) { await AlarmModule.openExactAlarmSettings(); }
      } catch {}
      // 3) Battery optimization exclusion (optional)
      try { await AlarmModule.requestIgnoreBatteryOptimizations(); } catch {}
    } catch (e) {
      console.warn('Permission prompts failed', e);
    }
  };

  const handleStartChallenge = async () => {
    const onboardingData: OnboardingData = {
      motivation: selectedMotivation,
      morningActivity: selectedMorningActivity,
      pastExperience: selectedPastExperience,
      obstacle: selectedObstacle,
      routineRating: selectedRoutineRating,
    };

    const challenge = await startChallenge(onboardingData);
    if (challenge) {
      setCurrentScreen('home');
    }
  };

  const handleTimeSelected = async (time: string) => {
    setSelectedTime(time);
    if (isEditingTime) {
      // Parse and schedule immediately, then go back home
      const [timeStr, period] = time.split(' ');
      const [hours, minutes] = timeStr.split(':').map(Number);
      let hour = hours;
      if (period === 'PM' && hours !== 12) {
        hour += 12;
      } else if (period === 'AM' && hours === 12) {
        hour = 0;
      }
      const wakeUpTime = new Date();
      wakeUpTime.setHours(hour, minutes, 0, 0);
      await scheduleAlarm(wakeUpTime, repeatDays, {
        challenge: selectedChallenge,
        userName: userName,
        motivation: selectedMotivation,
        morningActivity: selectedMorningActivity,
        pastExperience: selectedPastExperience,
        obstacle: selectedObstacle,
        routineRating: selectedRoutineRating,
      });
      setIsEditingTime(false);
      setCurrentScreen('home');
    } else {
      setCurrentScreen('confirmation');
    }
  };

  const handleConfirm = async () => {
    // Parse the time string (e.g., "6:00 AM") to a Date object
    const [timeStr, period] = selectedTime.split(' ');
    const [hours, minutes] = timeStr.split(':').map(Number);
    
    let hour = hours;
    if (period === 'PM' && hours !== 12) {
      hour += 12;
    } else if (period === 'AM' && hours === 12) {
      hour = 0;
    }
    
    const wakeUpTime = new Date();
    wakeUpTime.setHours(hour, minutes, 0, 0);
    
    // Schedule the alarm with the selected time
    await scheduleAlarm(wakeUpTime, repeatDays, {
      challenge: selectedChallenge,
      userName: userName,
      motivation: selectedMotivation,
      morningActivity: selectedMorningActivity,
      pastExperience: selectedPastExperience,
      obstacle: selectedObstacle,
      routineRating: selectedRoutineRating,
    });
    
    // Start the challenge
    const onboardingData: OnboardingData = {
      motivation: selectedMotivation,
      morningActivity: selectedMorningActivity,
      pastExperience: selectedPastExperience,
      obstacle: selectedObstacle,
      routineRating: selectedRoutineRating,
    };

    const challenge = await startChallenge(onboardingData);
    if (challenge) {
      setCurrentScreen('home');
    }
  };

  // Edit time flow from Home: open time selection, then confirm new time for future
  const handleEditTime = () => {
    setIsEditingTime(true);
    setCurrentScreen('timeSelection');
  };

  // Skip today: mark missed and refresh logs immediately for UI update
  const handleSkipToday = async () => {
    try {
      await markDay(new Date(), 'missed');
      try { await refreshLogs?.(); } catch {}
    } catch (e) {
      console.warn('Failed to mark day missed', e);
    }
  };

  // Alarm handlers
  const scheduleAlarm = async (time: Date, repeatDaysOverride?: number[], challengeData?: any) => {
    try {
      const alarmTime = new Date(time);
      const now = new Date();
      
      // If the time is earlier today, schedule for tomorrow
      if (alarmTime.getTime() <= now.getTime()) {
        alarmTime.setDate(alarmTime.getDate() + 1);
      }

      const alarmData = {
        triggerTime: alarmTime.getTime(),
        alarmId: 1001,
        hourOfDay: alarmTime.getHours(),
        minuteOfHour: alarmTime.getMinutes(),
      };

      // Prevent duplicate notifications: clear any existing alarms first
      try {
        await AlarmModule.clearAllAlarms();
      } catch (e) {
        // ignore if not implemented on platform
      }
      try {
        await clearAllAlarms();
      } catch (e) {
        // ignore storage clear errors
      }

      await AlarmModule.scheduleAlarm(alarmData);
      
      // Add to local storage
      const newAlarm = await addAlarm({
        time: alarmTime,
        repeatDays: repeatDaysOverride || repeatDays,
        isActive: true,
      });

      if (newAlarm) {
        Alert.alert('Success', 'Alarm scheduled successfully!');
      }
    } catch (error) {
      console.error('Error scheduling alarm:', error);
      Alert.alert('Error', 'Failed to schedule alarm');
    }
  };

  const handleSetAlarm = async () => {
    await scheduleAlarm(new Date());
    setCurrentScreen('home');
  };

  const handleClearAllAlarms = async () => {
    try {
      // Clear native alarms
      await AlarmModule.clearAllAlarms();
      
      // Clear local alarms
      await clearAllAlarms();
      
      Alert.alert('Success', 'All alarms cleared');
    } catch (error) {
      console.error('Error clearing alarms:', error);
      Alert.alert('Error', 'Failed to clear alarms');
    }
  };

  const handleRepeatDayToggle = (day: number) => {
    setRepeatDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  // Derive active wake-up time from stored alarms (if any)
  const activeWakeUpTime = useMemo(() => {
    const active = alarms.find(a => a.isActive);
    if (active) return active.time;
    // Fallback 1: use the most recently selectedTime (string like "6:00 AM")
    if (selectedTime) {
      const [timeStr, period] = selectedTime.split(' ');
      const [h, m] = timeStr.split(':').map(Number);
      let hour24 = h;
      if (period === 'PM' && h !== 12) hour24 += 12;
      if (period === 'AM' && h === 12) hour24 = 0;
      const d = new Date();
      d.setHours(hour24, m, 0, 0);
      return d;
    }
    // Fallback 2: challenge's stored wake-up time (time-of-day)
    if (currentChallenge?.wakeUpTime) {
      return currentChallenge.wakeUpTime;
    }
    return null;
  }, [alarms, selectedTime, currentChallenge]);

  // Derive progress from current challenge
  const totalDaysCount = useMemo(() => {
    return currentChallenge?.duration === '90' ? 90 : 365;
  }, [currentChallenge]);

  const completedDaysCount = useMemo(() => {
    if (!currentChallenge || !currentChallenge.isActive) return 0;
    return Math.min(completedDaysFromLogs(), totalDaysCount);
  }, [currentChallenge, totalDaysCount, completedDaysFromLogs, logsVersion]);

  // Settings handlers
  const openSettings = () => { setCurrentScreen('settings'); };
  const openChallenges = () => { setCurrentScreen('challenges'); };
  const openHome = () => { setCurrentScreen('home'); };

  // Direct start flows from pre-challenge Home
  const startThreeSixtyFiveFlow = () => {
    setSelectedChallenge('365-day');
    setCurrentScreen('nameInput');
  };

  // Render current screen
  const renderCurrentScreen = () => {

    switch (currentScreen) {
      case 'home': 
        return (
          <HomeScreen 
            wakeUpTime={activeWakeUpTime} 
            selectedDuration={null} 
            onOpenSettings={openSettings} 
            onClearAllAlarms={handleClearAllAlarms} 
            onOpenChallenges={openChallenges}
            hasActiveChallenge={!!(currentChallenge && currentChallenge.isActive)}
            onStartThreeSixtyFive={startThreeSixtyFiveFlow}
            userName={userName}
            currentDay={completedDaysCount}
            dayStatusForDate={dayStatus}
            actualWakeTime={(getLog(new Date())?.actualWakeTime ? new Date(getLog(new Date())!.actualWakeTime as any) : null)}
            onEditTime={handleEditTime}
            onSkipToday={handleSkipToday}
            completedDaysCount={completedDaysCount}
            totalDaysCount={totalDaysCount}
          />
        );
      case 'challenges':
        return (
          <ChallengesScreen
            onBackToHome={openHome}
            onSelectChallenge={handleChallengeSelect}
            isActive={!!(currentChallenge && currentChallenge.isActive)}
            currentChallengeTitle={currentChallenge?.duration === '365' ? '365‑Day Challenge' : '90‑Day Challenge'}
          />
        );
      case 'settings': 
        return (
          <SettingsScreen 
            onClearAllAlarms={handleClearAllAlarms} 
            onBack={() => setCurrentScreen('home')}
            onShowAuth={() => setShowAuth(true)}
          />
        );
      case 'nameInput':
        return (
          <NameInputScreen
            challengeType={selectedChallenge}
            onBack={goBack}
            onNext={async (n: string) => { 
              handleNameSubmit(n); 
              // Continue to onboarding questions
              setCurrentScreen('question');
            }}
          />
        );
      case 'auth':
        // If already authenticated, skip to time selection
        if (isAuthenticated && !authLoading) {
          setCurrentScreen('timeSelection');
          return null;
        }
        
        // Show loading while auth is initializing
        if (authLoading) {
          return (
            <View style={[homeStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
              <Text style={homeStyles.appTitle}>Nooze</Text>
              <Text style={homeStyles.subtitle}>Syncing your data...</Text>
            </View>
          );
        }
        
        return (
          <AuthScreen 
            onAuthSuccess={() => {
              setCurrentScreen('timeSelection');
            }} 
          />
        );
      case 'timeSelection':
        return (
          <TimeSelectionScreen
            userName={userName}
            selectedChallenge={selectedChallenge}
            onBack={() => setCurrentScreen('auth')}
            onTimeSelected={handleTimeSelected}
            showBack={!isEditingTime}
          />
        );
      case 'confirmation':
        return (
          <ConfirmationScreen
            userName={userName}
            selectedChallenge={selectedChallenge}
            selectedTime={selectedTime}
            onBack={goBack}
            onConfirm={handleConfirm}
          />
        );
      default: 
        return (
          <OnboardingScreen 
            currentScreen={currentScreen} 
            userName={userName}
            selectedChallenge={selectedChallenge}
            selectedMotivation={selectedMotivation} 
            selectedMorningActivity={selectedMorningActivity} 
            selectedPastExperience={selectedPastExperience} 
            selectedObstacle={selectedObstacle} 
            selectedRoutineRating={selectedRoutineRating} 
            onOptionSelect={handleOptionSelect} 
            onNext={handleNext} 
            onBack={goBack} 
            onStartChallenge={handleStartChallenge} 
          />
        );
    }
  };

  return renderCurrentScreen();
}
