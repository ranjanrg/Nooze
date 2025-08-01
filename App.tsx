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
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import KeepAwake from 'react-native-keep-awake';

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

  // Check if app was launched from alarm
  useEffect(() => {
    const checkAlarmLaunch = async () => {
      try {
        const isAlarmLaunch = await AlarmModule.checkIfAlarmLaunch();
        if (isAlarmLaunch) {
          console.log('App launched from alarm!');
          setIsAlarmLaunch(true);
          setIsAlarmActive(true);
          setMathProblem(generateMathProblem());
        }
      } catch (error) {
        console.log('Error checking alarm launch:', error);
      }
    };
    
    checkAlarmLaunch();
  }, []);

  // Listen for app state changes to detect when app comes to foreground
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        // Check if we're coming back from an alarm
        checkAlarmLaunch();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, []);

  const checkAlarmLaunch = async () => {
    try {
      const isAlarmLaunch = await AlarmModule.checkIfAlarmLaunch();
              if (isAlarmLaunch) {
          console.log('App activated from alarm!');
          setIsAlarmLaunch(true);
          setIsAlarmActive(true);
          setMathProblem(generateMathProblem());
        }
    } catch (error) {
      console.log('Error checking alarm launch:', error);
    }
  };

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

  const scheduleAlarm = async (time: Date) => {
    console.log('scheduleAlarm called with time:', time.toLocaleString());
    
    // Check if we have the required permission
    const hasPermission = await AlarmModule.checkDisplayOverAppsPermission();
    if (!hasPermission) {
      setShowPermissionPrompt(true);
      return;
    }
    
    const now = new Date();
    const alarmTime = new Date(time);
    
    // If the time has already passed today, set it for tomorrow
    if (alarmTime <= now) {
      alarmTime.setDate(alarmTime.getDate() + 1);
    }
    
    console.log('Current time:', now.toLocaleString());
    console.log('Alarm time:', alarmTime.toLocaleString());
    
    const triggerTime = alarmTime.getTime();
    const alarmId = nextAlarmId;
    
    console.log('About to call AlarmModule.scheduleAlarm with:', { alarmId, triggerTime });
    
    try {
      console.log('Calling AlarmModule.scheduleAlarm...');
      const result = await AlarmModule.scheduleAlarm({ alarmId, triggerTime });
      console.log('AlarmModule.scheduleAlarm result:', result);
      
      if (result) {
        const newAlarm: Alarm = {
          id: alarmId,
          time: alarmTime,
          isActive: true,
          repeatDays: selectedRepeatDays,
        };
        
        setAlarms(prev => [...prev, newAlarm]);
        setNextAlarmId(prev => prev + 1);
        setCurrentScreen('home'); // Navigate back to home screen
        Alert.alert('Success', 'Alarm set successfully!');
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
      setAlarms(prev => prev.filter(alarm => alarm.id !== alarmId));
      Alert.alert('Success', 'Alarm cancelled');
    } catch (error) {
      console.error('Error cancelling alarm:', error);
      Alert.alert('Error', 'Failed to cancel alarm');
    }
  };

  const checkMathAnswer = () => {
    if (!mathProblem) return;
    
    const userAnswerNum = parseInt(userAnswer);
    if (userAnswerNum === mathProblem.answer) {
      // Stop the alarm sound
      AlarmModule.stopAlarmSound();
      
      Alert.alert('Success!', 'Alarm dismissed!');
      setIsAlarmActive(false);
      setMathProblem(null);
      setUserAnswer('');
      KeepAwake.deactivate();
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
