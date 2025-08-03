/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  NativeModules,
  AppState,
  ScrollView,
  Linking,
  BackHandler,
  StatusBar,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import KeepAwake from 'react-native-keep-awake';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { AlarmModule } = NativeModules;

interface Alarm {
  id: number;
  time: Date;
  isActive: boolean;
  repeatDays: number[]; // 0=Sunday, 1=Monday, etc.
}

interface MathProblem {
  num1: number;
  num2: number;
  operator: string;
  answer: number;
}

function App() {
  // Configure status bar for visibility
  useEffect(() => {
    StatusBar.setBarStyle('dark-content');
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor('white');
      StatusBar.setTranslucent(false);
    }
  }, []);

  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isAlarmActive, setIsAlarmActive] = useState(false);
  const [mathProblem, setMathProblem] = useState<MathProblem | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [nextAlarmId, setNextAlarmId] = useState(1);
  const [isAlarmLaunch, setIsAlarmLaunch] = useState(false);
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<'home' | 'setAlarm'>('home');
  const [selectedRepeatDays, setSelectedRepeatDays] = useState<number[]>([1, 2, 3, 4, 5]); // Monday to Friday
  const [currentAlarmId, setCurrentAlarmId] = useState<number | null>(null);

  // Load saved alarms when app starts
  useEffect(() => {
    const loadSavedAlarms = async () => {
      const savedAlarms = await loadAlarmsFromStorage();
      if (savedAlarms.length > 0) {
        setAlarms(savedAlarms);
        // Set nextAlarmId to be higher than the highest existing alarm ID
        const maxId = Math.max(...savedAlarms.map(alarm => alarm.id));
        setNextAlarmId(maxId + 1);
        console.log('Loaded', savedAlarms.length, 'alarms from storage');
      }
    };
    
    loadSavedAlarms();
  }, []);

  // Check if app was launched from alarm (only on initial load)
  useEffect(() => {
    const checkAlarmLaunch = async () => {
      try {
        const isAlarmLaunch = await AlarmModule.checkIfAlarmLaunch();
        if (isAlarmLaunch && !isAlarmActive) {
          console.log('App launched from alarm!');
          setIsAlarmLaunch(true);
          setIsAlarmActive(true);
          setMathProblem(generateMathProblem());
          
          // Find the alarm that was triggered (the one that's due now)
          const now = new Date();
          const triggeredAlarm = alarms.find(alarm => {
            const alarmTime = new Date(alarm.time);
            const timeDiff = Math.abs(alarmTime.getTime() - now.getTime());
            return timeDiff < 60000; // Within 1 minute
          });
          
          if (triggeredAlarm) {
            setCurrentAlarmId(triggeredAlarm.id);
            console.log('Current alarm ID set to:', triggeredAlarm.id);
          }
        }
      } catch (error) {
        console.log('Error checking alarm launch:', error);
      }
    };
    
    checkAlarmLaunch();
  }, []); // Only run on initial load, not when alarms or isAlarmActive changes

  // Listen for app state changes to detect when app comes to foreground
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: string) => {
      if (nextAppState === 'active' && !isAlarmActive) {
        // Only check for alarm launch if we're not already in an alarm state
        try {
          const isAlarmLaunch = await AlarmModule.checkIfAlarmLaunch();
          if (isAlarmLaunch && !isAlarmActive) {
            console.log('App activated from alarm!');
            setIsAlarmLaunch(true);
            setIsAlarmActive(true);
            setMathProblem(generateMathProblem());
            
            // Find the alarm that was triggered
            const now = new Date();
            const triggeredAlarm = alarms.find(alarm => {
              const alarmTime = new Date(alarm.time);
              const timeDiff = Math.abs(alarmTime.getTime() - now.getTime());
              return timeDiff < 60000; // Within 1 minute
            });
            
            if (triggeredAlarm) {
              setCurrentAlarmId(triggeredAlarm.id);
              console.log('Current alarm ID set to:', triggeredAlarm.id);
            }
          }
        } catch (error) {
          console.log('Error checking alarm launch:', error);
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [isAlarmActive, alarms]);



  useEffect(() => {
    if (isAlarmActive) {
      KeepAwake.activate();
    } else {
      KeepAwake.deactivate();
    }
  }, [isAlarmActive]);

  // Prevent back button when alarm is active
  useEffect(() => {
    const backAction = () => {
      if (isAlarmActive) {
        // Prevent back button from working during alarm
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove();
  }, [isAlarmActive]);

  const generateMathProblem = (): MathProblem => {
    const num1 = Math.floor(Math.random() * 90) + 10; // 10-99
    const num2 = Math.floor(Math.random() * 90) + 10; // 10-99
    const operators = ['+', '-', '*'];
    const operator = operators[Math.floor(Math.random() * operators.length)];
    
    let answer: number;
    switch (operator) {
      case '+':
        answer = num1 + num2;
        break;
      case '-':
        answer = num1 - num2;
        break;
      case '*':
        answer = num1 * num2;
        break;
      default:
        answer = num1 + num2;
    }
    
    return { num1, num2, operator, answer };
  };

  // Helper functions for persistent storage
  const saveAlarmsToStorage = async (alarmsToSave: Alarm[]) => {
    try {
      const alarmsData = alarmsToSave.map(alarm => ({
        ...alarm,
        time: alarm.time.toISOString(), // Convert Date to string for storage
      }));
      await AsyncStorage.setItem('nooze_alarms', JSON.stringify(alarmsData));
      console.log('Alarms saved to storage:', alarmsToSave.length);
    } catch (error) {
      console.error('Error saving alarms to storage:', error);
    }
  };

  const loadAlarmsFromStorage = async (): Promise<Alarm[]> => {
    try {
      const alarmsData = await AsyncStorage.getItem('nooze_alarms');
      if (alarmsData) {
        const parsedAlarms = JSON.parse(alarmsData).map((alarm: any) => ({
          ...alarm,
          time: new Date(alarm.time), // Convert string back to Date
        }));
        console.log('Alarms loaded from storage:', parsedAlarms.length);
        return parsedAlarms;
      }
      return [];
    } catch (error) {
      console.error('Error loading alarms from storage:', error);
      return [];
    }
  };

  // Helper function to calculate next valid alarm time based on repeat days
  const calculateNextAlarmTime = (selectedTime: Date, repeatDays: number[]): Date => {
    const now = new Date();
    const alarmTime = new Date(selectedTime);
    
    // Get current day of week (0 = Sunday, 1 = Monday, etc.)
    const currentDay = now.getDay();
    
    // If no repeat days selected, just set for next occurrence
    if (repeatDays.length === 0) {
      if (alarmTime <= now) {
        alarmTime.setDate(alarmTime.getDate() + 1);
      }
      return alarmTime;
    }
    
    // Check if today is a selected repeat day
    const isTodaySelected = repeatDays.includes(currentDay);
    
    if (isTodaySelected) {
      // If today is selected and time hasn't passed, set for today
      if (alarmTime > now) {
        return alarmTime;
      }
    }
    
    // Find the next selected day
    let daysToAdd = 1;
    let nextDay = (currentDay + daysToAdd) % 7;
    
    // Look for the next selected day within the next 7 days
    while (daysToAdd <= 7) {
      if (repeatDays.includes(nextDay)) {
        break;
      }
      daysToAdd++;
      nextDay = (currentDay + daysToAdd) % 7;
    }
    
    // Set the alarm for the next selected day
    const nextAlarmTime = new Date(selectedTime);
    nextAlarmTime.setDate(nextAlarmTime.getDate() + daysToAdd);
    
    return nextAlarmTime;
  };

  const scheduleAlarm = async (time: Date) => {
    console.log('scheduleAlarm called with time:', time.toLocaleString());
    console.log('Selected repeat days:', selectedRepeatDays);
    
    // Check if we have the required permission
    const hasPermission = await AlarmModule.checkDisplayOverAppsPermission();
    if (!hasPermission) {
      setShowPermissionPrompt(true);
      return;
    }
    
    // Calculate the next valid alarm time based on repeat days
    const nextAlarmTime = calculateNextAlarmTime(time, selectedRepeatDays);
    
    console.log('Current time:', new Date().toLocaleString());
    console.log('Original selected time:', time.toLocaleString());
    console.log('Calculated next alarm time:', nextAlarmTime.toLocaleString());
    
    const triggerTime = nextAlarmTime.getTime();
    const alarmId = nextAlarmId;
    
    console.log('About to call AlarmModule.scheduleAlarm with:', { alarmId, triggerTime });
    
    try {
      console.log('Calling AlarmModule.scheduleAlarm...');
      const result = await AlarmModule.scheduleAlarm({ alarmId, triggerTime });
      console.log('AlarmModule.scheduleAlarm result:', result);
      
      if (result) {
        const newAlarm: Alarm = {
          id: alarmId,
          time: nextAlarmTime,
          isActive: true,
          repeatDays: selectedRepeatDays,
        };
        
        const updatedAlarms = [...alarms, newAlarm];
        setAlarms(updatedAlarms);
        setNextAlarmId(prev => prev + 1);
        
        // Save alarms to persistent storage
        await saveAlarmsToStorage(updatedAlarms);
        
        setCurrentScreen('home'); // Navigate back to home screen
        
        // Show informative message about when alarm will ring
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const nextDayName = dayNames[nextAlarmTime.getDay()];
        Alert.alert('Success', `Alarm set for ${nextDayName} at ${nextAlarmTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}!`);
      } else {
        Alert.alert('Error', 'Failed to set alarm');
      }
    } catch (error) {
      console.error('Error scheduling alarm:', error);
      Alert.alert('Error', 'Failed to set alarm');
    }
  };

  const cancelAlarm = async (alarmId: number) => {
    try {
      await AlarmModule.cancelAlarm(alarmId);
      const updatedAlarms = alarms.filter(alarm => alarm.id !== alarmId);
      setAlarms(updatedAlarms);
      
      // Save updated alarms to persistent storage
      await saveAlarmsToStorage(updatedAlarms);
      
      Alert.alert('Success', 'Alarm cancelled');
    } catch (error) {
      console.error('Error cancelling alarm:', error);
      Alert.alert('Error', 'Failed to cancel alarm');
    }
  };

  const checkMathAnswer = async () => {
    if (!mathProblem) return;
    
    const userAnswerNum = parseInt(userAnswer);
    if (userAnswerNum === mathProblem.answer) {
      // Stop the alarm sound
      AlarmModule.stopAlarmSound();
      
      // Reset alarm state FIRST (before any alerts)
      console.log('Resetting alarm state...');
      setIsAlarmActive(false);
      setMathProblem(null);
      setUserAnswer('');
      setCurrentAlarmId(null);
      KeepAwake.deactivate();
      
      // Handle recurring alarm logic
      if (currentAlarmId !== null) {
        const currentAlarm = alarms.find(alarm => alarm.id === currentAlarmId);
        
        if (currentAlarm && currentAlarm.repeatDays.length > 0) {
          // This is a recurring alarm - schedule the next occurrence
          console.log('Scheduling next occurrence for recurring alarm:', currentAlarmId);
          
          // Calculate next occurrence based on repeat days
          const nextAlarmTime = calculateNextAlarmTime(currentAlarm.time, currentAlarm.repeatDays);
          
          // Create new alarm ID for the next occurrence
          const newAlarmId = nextAlarmId;
          
          try {
            // Schedule the next occurrence
            const result = await AlarmModule.scheduleAlarm({ 
              alarmId: newAlarmId, 
              triggerTime: nextAlarmTime.getTime() 
            });
            
            if (result) {
              // Update the alarm with new time and ID
              const updatedAlarms = alarms.map(alarm => 
                alarm.id === currentAlarmId 
                  ? { ...alarm, id: newAlarmId, time: nextAlarmTime }
                  : alarm
              );
              
              setAlarms(updatedAlarms);
              setNextAlarmId(prev => prev + 1);
              
              // Save to storage
              await saveAlarmsToStorage(updatedAlarms);
              
              // Show next occurrence info
              const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
              const nextDayName = dayNames[nextAlarmTime.getDay()];
              Alert.alert('Success!', `Alarm dismissed! Next alarm set for ${nextDayName} at ${nextAlarmTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
            } else {
              Alert.alert('Success!', 'Alarm dismissed!');
            }
          } catch (error) {
            console.error('Error scheduling next occurrence:', error);
            Alert.alert('Success!', 'Alarm dismissed!');
          }
        } else {
          // Non-recurring alarm - just dismiss
          Alert.alert('Success!', 'Alarm dismissed!');
        }
      } else {
        Alert.alert('Success!', 'Alarm dismissed!');
      }
    } else {
      Alert.alert('Wrong Answer!', 'Try again!');
      setUserAnswer('');
    }
  };

  const startAlarm = () => {
    setIsAlarmActive(true);
    setMathProblem(generateMathProblem());
  };

  const openSettings = () => {
    if (Platform.OS === 'android') {
      Linking.openSettings();
    }
  };

  if (isAlarmActive && mathProblem) {
    return (
      <SafeAreaView style={styles.alarmContainer}>
        <View style={styles.alarmContent}>
          <Text style={styles.alarmTitle}>WAKE UP!</Text>
          <Text style={styles.alarmSubtitle}>Solve this to stop the alarm!</Text>
          <Text style={styles.mathProblem}>
            {mathProblem.num1} {mathProblem.operator} {mathProblem.num2} = ?
          </Text>
          <TextInput
            style={styles.answerInput}
            value={userAnswer}
            onChangeText={setUserAnswer}
            keyboardType="numeric"
            autoFocus={true}
            onSubmitEditing={checkMathAnswer}
          />
          <TouchableOpacity style={styles.submitButton} onPress={checkMathAnswer}>
            <Text style={styles.submitButtonText}>Submit Answer</Text>
          </TouchableOpacity>
          <Text style={styles.warningText}>You cannot exit until you solve this!</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Permission prompt modal
  if (showPermissionPrompt) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionPromptContainer}>
          <Text style={styles.permissionPromptTitle}>Permission Required</Text>
          <Text style={styles.permissionPromptDescription}>
            To wake you up with math challenges over your lock screen, Nooze needs permission to display over other apps.
          </Text>
          <TouchableOpacity 
            style={styles.permissionPromptButton} 
            onPress={() => {
              openSettings();
              setShowPermissionPrompt(false);
            }}
          >
            <Text style={styles.permissionPromptButtonText}>Allow</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.permissionPromptCancelButton} 
            onPress={() => setShowPermissionPrompt(false)}
          >
            <Text style={styles.permissionPromptCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Home Screen
  const renderHomeScreen = () => (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Nooze</Text>
          <Text style={styles.headerSubtitle}>Wake up at exact time!</Text>
        </View>
      </View>

      <View style={styles.alarmsSection}>
        <Text style={styles.sectionTitle}>Active Alarms</Text>
        
        {alarms.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No active alarms</Text>
            <Text style={styles.emptyStateSubtext}>Tap + to set your first alarm</Text>
          </View>
        ) : (
          alarms.map(alarm => (
            <View key={alarm.id} style={styles.alarmItem}>
              <View style={styles.alarmInfo}>
                <Text style={styles.alarmTime}>
                  {alarm.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
                <Text style={styles.alarmDate}>
                  {alarm.repeatDays.length > 0 
                    ? alarm.repeatDays.map(day => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day]).join(', ')
                    : alarm.time.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
                  }
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => cancelAlarm(alarm.id)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => setCurrentScreen('setAlarm')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );

  // Set Alarm Screen
  const renderSetAlarmScreen = () => (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => setCurrentScreen('home')}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Nooze</Text>
          <Text style={styles.headerSubtitle}>Wake up at exact time</Text>
        </View>
      </View>

      <View style={styles.setAlarmContent}>
        <Text style={styles.setAlarmTitle}>Choose Alarm Time</Text>
        
        <TouchableOpacity style={styles.timeInput} onPress={() => setShowTimePicker(true)}>
          <Text style={styles.timeInputText}>
            {selectedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </TouchableOpacity>
        
        {showTimePicker && (
          <DateTimePicker
            value={selectedTime}
            mode="time"
            is24Hour={false}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, date) => {
              setShowTimePicker(Platform.OS === 'ios');
              if (date) {
                setSelectedTime(date);
              }
            }}
          />
        )}
        
        <Text style={styles.repeatTitle}>Repeat on</Text>
        <View style={styles.repeatDaysContainer}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.repeatDayButton,
                selectedRepeatDays.includes(index) && styles.repeatDayButtonSelected
              ]}
              onPress={() => {
                if (selectedRepeatDays.includes(index)) {
                  setSelectedRepeatDays(prev => prev.filter(d => d !== index));
                } else {
                  setSelectedRepeatDays(prev => [...prev, index]);
                }
              }}
            >
              <Text style={[
                styles.repeatDayText,
                selectedRepeatDays.includes(index) && styles.repeatDayTextSelected
              ]}>
                {day}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <TouchableOpacity 
          style={styles.setAlarmButton} 
          onPress={() => scheduleAlarm(selectedTime)}
        >
          <Text style={styles.setAlarmButtonText}>Set Alarm</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  // Main render
  if (currentScreen === 'setAlarm') {
    return renderSetAlarmScreen();
  }

  return renderHomeScreen();
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    backgroundColor: '#f8f8f8',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'black',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  fab: {
    position: 'absolute',
    bottom: 120,
    alignSelf: 'center',
    backgroundColor: 'black',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  fabText: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
  },
  alarmInfo: {
    flex: 1,
  },
  alarmDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    padding: 10,
    position: 'absolute',
    left: 20,
    zIndex: 1,
  },
  backButtonText: {
    color: 'black',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: 'black',
    fontSize: 72,
    fontWeight: '900',
    textAlign: 'center',
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerSubtitle: {
    color: '#666',
    fontSize: 18,
    marginTop: 0,
    textAlign: 'center',
  },
  setAlarmContent: {
    flex: 1,
    padding: 20,
    justifyContent: 'flex-start',
    paddingTop: 40,
  },
  setAlarmTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'black',
    textAlign: 'left',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: 'black',
  },
  timeInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 15,
    marginBottom: 30,
    backgroundColor: '#fafafa',
  },
  timeInputText: {
    fontSize: 18,
    textAlign: 'center',
    color: 'black',
  },
  setAlarmButton: {
    backgroundColor: 'black',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 30,
  },
  setAlarmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  alarmsSection: {
    padding: 20,
    backgroundColor: '#fafafa',
    margin: 10,
    borderRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  noAlarmsText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
  },
  alarmItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  alarmTime: {
    fontSize: 18,
    color: 'black',
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: 'black',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'black',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 14,
  },

  alarmContainer: {
    flex: 1,
    backgroundColor: '#d32f2f',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alarmContent: {
    alignItems: 'center',
    padding: 20,
  },
  alarmTitle: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  alarmSubtitle: {
    fontSize: 18,
    color: 'white',
    marginBottom: 40,
    textAlign: 'center',
  },
  mathProblem: {
    fontSize: 36,
    color: 'white',
    marginBottom: 30,
    fontWeight: 'bold',
  },
  answerInput: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    fontSize: 24,
    width: 200,
    textAlign: 'center',
    marginBottom: 20,
    color: 'black',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    minWidth: 150,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  warningText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
  },
  permissionPromptContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  permissionPromptTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  permissionPromptDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  permissionPromptButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    marginBottom: 15,
    minWidth: 120,
    alignItems: 'center',
  },
  permissionPromptButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  permissionPromptCancelButton: {
    paddingVertical: 10,
  },
  permissionPromptCancelText: {
    color: '#666',
    fontSize: 16,
  },
  repeatTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'black',
    marginTop: 20,
    marginBottom: 15,
    textAlign: 'left',
  },
  repeatDaysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  repeatDayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fafafa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  repeatDayButtonSelected: {
    backgroundColor: 'black',
    borderColor: 'black',
  },
  repeatDayText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
  },
  repeatDayTextSelected: {
    color: 'white',
  },
});

export default App;
