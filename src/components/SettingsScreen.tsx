import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { settingsStyles } from '../styles';
import { useAuth } from '../hooks/useAuth';

interface SettingsScreenProps {
  onClearAllAlarms: () => void;
  onBack: () => void;
  onTestAlarm?: () => void;
  onShowAuth?: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  onClearAllAlarms,
  onBack,
  onTestAlarm,
  onShowAuth,
}) => {
  const { user, isAuthenticated, signOut } = useAuth();

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out? Your data will remain synced to your account.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          }
        },
      ]
    );
  };
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
        {/* Account Section */}
        <View style={settingsStyles.section}>
          <Text style={settingsStyles.sectionTitle}>Account</Text>
          
          {isAuthenticated ? (
            <>
              <View style={settingsStyles.settingItem}>
                <Text style={settingsStyles.settingLabel}>Signed in as</Text>
                <Text style={settingsStyles.settingValue}>
                  {user?.displayName || user?.email || 'User'}
                </Text>
              </View>
              
              <View style={settingsStyles.settingItem}>
                <Text style={settingsStyles.settingLabel}>User ID</Text>
                <Text style={[settingsStyles.settingValue, { fontSize: 12, fontFamily: 'monospace' }]}>
                  {user?.uid}
                </Text>
              </View>
              
              <View style={settingsStyles.settingItem}>
                <Text style={settingsStyles.settingLabel}>Sync Status</Text>
                <Text style={[settingsStyles.settingValue, { color: '#4CAF50' }]}>
                  ✓ Synced to Cloud
                </Text>
              </View>
              
              <TouchableOpacity 
                style={settingsStyles.clearButton}
                onPress={() => {
                  Alert.alert(
                    'View Your Data',
                    `Your data is stored in Firebase Firestore.\n\nTo view all your data:\n1. Go to: console.firebase.google.com\n2. Select: nooze-app project\n3. Go to: Firestore Database\n4. Find: users/${user?.uid}\n\nYour User ID: ${user?.uid}`,
                    [
                      { text: 'Copy User ID', onPress: () => {
                        // In a real app, you'd copy to clipboard
                        console.log('User ID:', user?.uid);
                      }},
                      { text: 'OK' }
                    ]
                  );
                }}
              >
                <Text style={settingsStyles.clearButtonText}>
                  View Data in Firebase Console
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={settingsStyles.clearButton}
                onPress={handleSignOut}
              >
                <Text style={[settingsStyles.clearButtonText, { color: '#FF6B6B' }]}>
                  Sign Out
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity 
              style={settingsStyles.clearButton}
              onPress={onShowAuth}
            >
              <Text style={settingsStyles.clearButtonText}>
                Sign In to Sync Data
              </Text>
            </TouchableOpacity>
          )}
        </View>

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
