import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { alarmStyles } from '../styles';

interface AlarmScreenProps {
  selectedTime: Date;
  repeatDays: number[];
  onTimeChange: (time: Date) => void;
  onRepeatDayToggle: (day: number) => void;
  onSetAlarm: () => void;
  onBack: () => void;
}

export const AlarmScreen: React.FC<AlarmScreenProps> = ({
  selectedTime,
  repeatDays,
  onTimeChange,
  onRepeatDayToggle,
  onSetAlarm,
  onBack,
}) => {
  const [showTimePicker, setShowTimePicker] = useState(false);

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const handleTimeChange = (event: any, date?: Date) => {
    setShowTimePicker(false);
    if (date) {
      onTimeChange(date);
    }
  };

  const showTimePickerModal = () => {
    setShowTimePicker(true);
  };

  return (
    <SafeAreaView style={alarmStyles.container}>
      {/* Header */}
      <View style={alarmStyles.header}>
        <TouchableOpacity style={alarmStyles.backButton} onPress={onBack}>
          <Text style={alarmStyles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={alarmStyles.headerTitle}>Set Alarm</Text>
      </View>

      {/* Content */}
      <View style={alarmStyles.content}>
        {/* Time Picker */}
        <View style={alarmStyles.timePickerContainer}>
          <Text style={alarmStyles.timeDisplay}>
            {selectedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
          <TouchableOpacity 
            style={alarmStyles.button} 
            onPress={showTimePickerModal}
          >
            <Text style={alarmStyles.buttonText}>Change Time</Text>
          </TouchableOpacity>
        </View>

        {/* Repeat Days */}
        <View style={alarmStyles.repeatDaysContainer}>
          <Text style={alarmStyles.repeatDaysTitle}>Repeat on:</Text>
          <View style={alarmStyles.repeatDaysRow}>
            {days.map((day, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  alarmStyles.dayButton,
                  repeatDays.includes(index) && alarmStyles.dayButtonSelected
                ]}
                onPress={() => onRepeatDayToggle(index)}
              >
                <Text style={[
                  alarmStyles.dayButtonText,
                  repeatDays.includes(index) && alarmStyles.dayButtonTextSelected
                ]}>
                  {day}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Set Alarm Button */}
        <View style={alarmStyles.buttonContainer}>
          <TouchableOpacity 
            style={alarmStyles.setAlarmButton} 
            onPress={onSetAlarm}
          >
            <Text style={alarmStyles.setAlarmButtonText}>Set Alarm</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Time Picker Modal */}
      {showTimePicker && (
        <DateTimePicker
          value={selectedTime}
          mode="time"
          is24Hour={false}
          display="default"
          onChange={handleTimeChange}
        />
      )}
    </SafeAreaView>
  );
};
