import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { onboardingStyles, colors, normalize, homeStyles } from '../styles';

interface ConfirmationScreenProps {
  userName: string;
  selectedChallenge: string;
  selectedTime: string;
  onBack: () => void;
  onConfirm: () => void;
}

const HighlightedText: React.FC<{ text: string; userName: string; selectedTime: string; challengeDays: string }> = ({ 
  text, 
  userName, 
  selectedTime, 
  challengeDays 
}) => {
  const parts = text.split(/(\{Name\}|\{Time\}|\{days\}|\{I promise myself\}|\{golden hours\}|\{my life better\})/);
  
  return (
    <Text
      style={{
        textAlign: 'left',
        lineHeight: normalize(30),
        fontSize: normalize(18),
        color: colors.primaryText,
      }}
    >
      {parts.map((part, index) => {
        switch (part) {
          case '{Name}':
            return (
              <Text key={index} style={{ color: '#FF8C00', fontWeight: '800' }}>
                {userName}
              </Text>
            );
          case '{Time}':
            return (
              <Text key={index} style={{ color: '#FF8C00', fontWeight: '800' }}>
                {selectedTime}
              </Text>
            );
          case '{days}':
            return (
              <Text key={index} style={{ color: '#FF8C00', fontWeight: '800' }}>
                {challengeDays} days
              </Text>
            );
          case '{I promise myself}':
            return (
              <Text key={index} style={{ color: '#FF8C00', fontWeight: '800' }}>
                I promise myself
              </Text>
            );
          case '{golden hours}':
            return (
              <Text key={index} style={{ color: '#FF8C00', fontWeight: '800' }}>
                golden hours
              </Text>
            );
          case '{my life better}':
            return (
              <Text key={index} style={{ color: '#FF8C00', fontWeight: '800' }}>
                my life better
              </Text>
            );
          default:
            return <Text key={index}>{part}</Text>;
        }
      })}
    </Text>
  );
};

export const ConfirmationScreen: React.FC<ConfirmationScreenProps> = ({
  userName,
  selectedChallenge,
  selectedTime,
  onBack,
  onConfirm,
}) => {
  const normalizedChallenge = (selectedChallenge || '').toString().toLowerCase();
  const challengeDays = normalizedChallenge.includes('365') ? '365' : '90';
  
  const commitmentHeader = challengeDays === '365' 
    ? "I'm going to change my life"
    : "I will be the better version of me";

  const commitmentText = `I will wake up at exact {Time} for next {days}.\n\n{I promise myself} I will invest this {golden hours} on something meaningful that makes {my life better}.`;

  return (
    <SafeAreaView style={onboardingStyles.container}>
      <LinearGradient colors={[colors.primary, '#FFD9A1', colors.background]} style={{ flex: 1 }}>
        <View style={onboardingStyles.content}>
          <View style={[homeStyles.contentMax, { marginTop: normalize(48) }]}>
            {/* Name + commitment block */}
            <View
              style={{
                flexGrow: 1,
                justifyContent: 'center',
                alignItems: 'stretch',
                paddingHorizontal: normalize(20),
                paddingBottom: normalize(20),
              }}
            >
              <Text
                style={[
                  onboardingStyles.title,
                  {
                    alignSelf: 'flex-start',
                    textAlign: 'left',
                    fontSize: normalize(40),
                    fontWeight: '800',
                    marginBottom: normalize(12),
                    color: colors.primaryText,
                    letterSpacing: -0.2,
                  },
                ]}
              >
                I'm <Text style={{ color: '#FF8C00' }}>{userName}</Text>
              </Text>

              <View
                style={{
                  backgroundColor: colors.lightText,
                  borderRadius: normalize(16),
                  paddingVertical: normalize(16),
                  paddingHorizontal: normalize(16),
                  borderWidth: 1,
                  borderColor: colors.shadow,
                  elevation: 2,
                  shadowColor: colors.shadow,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.12,
                  shadowRadius: 6,
                }}
              >
                <HighlightedText
                  text={commitmentText}
                  userName={userName}
                  selectedTime={selectedTime}
                  challengeDays={challengeDays}
                />
              </View>
            </View>

            {/* spacer above sticky footer */}
            <View style={{ height: normalize(12) }} />
          </View>
        </View>

        {/* Sticky bottom actions (no background) */}
        <View
          style={[
            homeStyles.stickyCtaBar,
            { backgroundColor: 'transparent', elevation: 0, shadowOpacity: 0, borderTopWidth: 0 },
          ]}
        >
          <TouchableOpacity
            style={homeStyles.stickyCtaButton}
            onPress={onConfirm}
            accessibilityRole="button"
            accessibilityLabel="I Promise"
          >
            <Text style={homeStyles.stickyCtaText}>I Promise</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onBack} style={homeStyles.secondaryLink}>
            <Text style={homeStyles.secondaryLinkText}>Back</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};
