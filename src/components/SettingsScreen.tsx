import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { settingsStyles } from '../styles';

interface SettingsScreenProps {
  onClearAllAlarms: () => void;
  onBack: () => void;
  onTestAlarm?: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  onClearAllAlarms,
  onBack,
  onTestAlarm,
}) => {
  return (
    <SafeAreaView style={settingsStyles.container}>
      {/* Header */}
      <View style={settingsStyles.header}>
        <TouchableOpacity style={settingsStyles.backButton} onPress={onBack}>
          <Text style={settingsStyles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={settingsStyles.headerTitle}>Settings</Text>
      </View>

      {/* Content */}
      <ScrollView style={settingsStyles.content}>
        {/* Alarms Section */}
        <View style={settingsStyles.section}>
          <Text style={settingsStyles.sectionTitle}>Alarms</Text>
          
          <View style={settingsStyles.settingItem}>
            <Text style={settingsStyles.settingLabel}>Active Alarms</Text>
            <Text style={settingsStyles.settingValue}>0</Text>
          </View>
          
          <TouchableOpacity 
            style={settingsStyles.clearButton}
            onPress={onClearAllAlarms}
          >
            <Text style={settingsStyles.clearButtonText}>Clear All Alarms</Text>
          </TouchableOpacity>

          {onTestAlarm && (
            <TouchableOpacity 
              style={[settingsStyles.clearButton, { marginTop: 10 }]}
              onPress={onTestAlarm}
            >
              <Text style={settingsStyles.clearButtonText}>Test alarm in 1 minute</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Challenge Section */}
        <View style={settingsStyles.section}>
          <Text style={settingsStyles.sectionTitle}>Challenge</Text>
          
          <View style={settingsStyles.settingItem}>
            <Text style={settingsStyles.settingLabel}>Current Challenge</Text>
            <Text style={settingsStyles.settingValue}>365 Days</Text>
          </View>
          
          <View style={settingsStyles.settingItem}>
            <Text style={settingsStyles.settingLabel}>Days Completed</Text>
            <Text style={settingsStyles.settingValue}>12</Text>
          </View>
          
          <View style={settingsStyles.settingItem}>
            <Text style={settingsStyles.settingLabel}>Current Streak</Text>
            <Text style={settingsStyles.settingValue}>7</Text>
          </View>
        </View>

        {/* App Section */}
        <View style={settingsStyles.section}>
          <Text style={settingsStyles.sectionTitle}>App</Text>
          
          <View style={settingsStyles.settingItem}>
            <Text style={settingsStyles.settingLabel}>Version</Text>
            <Text style={settingsStyles.settingValue}>1.0.0</Text>
          </View>
          
          <View style={settingsStyles.settingItem}>
            <Text style={settingsStyles.settingLabel}>Build</Text>
            <Text style={settingsStyles.settingValue}>1</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
