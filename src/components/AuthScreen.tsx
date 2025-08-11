import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useAuth } from '../hooks/useAuth';
import { colors, normalize } from '../styles';

interface AuthScreenProps {
  onAuthSuccess?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const {
    signInWithGoogle,
    isLoading,
    error,
    clearError,
    isAuthenticated
  } = useAuth();

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      onAuthSuccess?.();
    }
  }, [isAuthenticated, onAuthSuccess]);

  const handleGoogleSignIn = async () => {
    console.log('Google Sign-In button clicked!');
    clearError();
    await signInWithGoogle();
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[colors.primary, '#FFD9A1', colors.background]}
        style={styles.gradientContainer}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Almost there!</Text>
            <Text style={styles.subtitle}>
              Sign in to save your progress and sync across all your devices
            </Text>
          </View>

          {/* Main Card */}
          <View style={styles.card}>
            {/* Motivational Message */}
            <View style={styles.messageContainer}>
              <Text style={styles.messageTitle}>Your morning routine awaits</Text>
              <Text style={styles.messageText}>
                Join thousands who've transformed their mornings. Sign in to keep your progress safe and accessible anywhere.
              </Text>
            </View>

            {/* Google Sign-In Button */}
            <TouchableOpacity
              style={[styles.googleButton, isLoading && styles.disabledButton]}
              onPress={handleGoogleSignIn}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.primaryText} size="small" />
              ) : (
                <>
                  <View style={styles.googleIcon}>
                    <Text style={styles.googleIconText}>G</Text>
                  </View>
                  <Text style={styles.googleButtonText}>Continue with Google</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Benefits */}
            <View style={styles.benefitsContainer}>
              <View style={styles.benefitItem}>
                <Text style={styles.benefitIcon}>🔄</Text>
                <Text style={styles.benefitText}>Sync across devices</Text>
              </View>
              <View style={styles.benefitItem}>
                <Text style={styles.benefitIcon}>🔒</Text>
                <Text style={styles.benefitText}>Never lose your data</Text>
              </View>
              <View style={styles.benefitItem}>
                <Text style={styles.benefitIcon}>📱</Text>
                <Text style={styles.benefitText}>Access anywhere</Text>
              </View>
            </View>
          </View>

          {/* Error Display */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={clearError} style={styles.errorDismissButton}>
                <Text style={styles.errorDismiss}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  gradientContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: normalize(24),
    paddingTop: normalize(40),
    paddingBottom: normalize(30),
  },
  header: {
    alignItems: 'center',
    marginBottom: normalize(40),
  },
  title: {
    fontSize: normalize(28),
    fontWeight: '700',
    color: colors.primaryText,
    marginBottom: normalize(8),
    textAlign: 'center',
  },
  subtitle: {
    fontSize: normalize(16),
    color: colors.secondaryText,
    textAlign: 'center',
    lineHeight: normalize(22),
  },
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: normalize(16),
    padding: normalize(24),
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: normalize(20),
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: normalize(32),
  },
  messageTitle: {
    fontSize: normalize(20),
    fontWeight: '600',
    color: colors.primaryText,
    marginBottom: normalize(8),
    textAlign: 'center',
  },
  messageText: {
    fontSize: normalize(14),
    color: colors.secondaryText,
    textAlign: 'center',
    lineHeight: normalize(20),
  },
  googleButton: {
    backgroundColor: colors.cardBackground,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: normalize(12),
    paddingVertical: normalize(16),
    paddingHorizontal: normalize(20),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: normalize(24),
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  disabledButton: {
    opacity: 0.6,
  },
  googleIcon: {
    width: normalize(20),
    height: normalize(20),
    borderRadius: normalize(10),
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: normalize(12),
  },
  googleIconText: {
    fontSize: normalize(12),
    fontWeight: '700',
    color: colors.lightText,
  },
  googleButtonText: {
    fontSize: normalize(16),
    fontWeight: '600',
    color: colors.primaryText,
  },
  benefitsContainer: {
    gap: normalize(12),
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: normalize(4),
  },
  benefitIcon: {
    fontSize: normalize(16),
    marginRight: normalize(12),
    width: normalize(24),
    textAlign: 'center',
  },
  benefitText: {
    fontSize: normalize(14),
    color: colors.secondaryText,
    flex: 1,
  },
  errorContainer: {
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: normalize(12),
    padding: normalize(16),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorText: {
    color: colors.error,
    fontSize: normalize(14),
    flex: 1,
    marginRight: normalize(12),
  },
  errorDismissButton: {
    paddingVertical: normalize(4),
    paddingHorizontal: normalize(8),
  },
  errorDismiss: {
    color: colors.error,
    fontSize: normalize(14),
    fontWeight: '600',
  },
});