import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Pressable,
  Animated,
  Easing,
  Vibration,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { homeStyles, colors, normalize } from '../styles';

interface ChallengesScreenProps {
  onBackToHome: () => void;
  onSelectChallenge: (challengeType: string) => void;
  isActive?: boolean;
  currentChallengeTitle?: string;
}

export const ChallengesScreen: React.FC<ChallengesScreenProps> = ({
  onBackToHome,
  onSelectChallenge,
  isActive,
  currentChallengeTitle,
}) => {
  const challenges = [
    {
      id: '365-day',
      title: '365‑Day Challenge',
      tagline: 'Change your life',
      duration: '365 days',
      description: 'Commit to a year of early mornings and build a life‑changing habit.'
    },
  ];

  return (
    <SafeAreaView style={homeStyles.container}>
      <LinearGradient
        colors={[colors.primary, '#FFD9A1', colors.background]}
        style={homeStyles.gradientContainer}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: normalize(20),
            paddingTop: normalize(40),
            paddingBottom: normalize(140),
          }}
          showsVerticalScrollIndicator={false}
        >
          {isActive ? (
            <View style={homeStyles.contentMax}>
              <View style={homeStyles.header}>
                <View style={homeStyles.headerLeft}>
                  <Text style={homeStyles.appTitle}>Challenges</Text>
                  <Text style={homeStyles.appSubtitle}>You're already in a challenge</Text>
                </View>
              </View>
              <View style={homeStyles.challengeCard}>
                <Text style={homeStyles.challengeTagline}>Active</Text>
                <Text style={homeStyles.challengeTitle}>{currentChallengeTitle || 'Your current challenge'}</Text>
                <Text style={homeStyles.challengeDescription}>
                  You can’t start a new one until you finish or end the current challenge.
                </Text>
                <TouchableOpacity style={homeStyles.joinButton} onPress={onBackToHome}>
                  <Text style={homeStyles.joinButtonText}>Go to Home</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <AnimatedContent challenges={challenges} onSelectChallenge={onSelectChallenge} />
          )}
        </ScrollView>

        {/* Footer */}
        <View style={homeStyles.footer}>
          <TouchableOpacity
            style={homeStyles.footerTab}
            onPress={onBackToHome}
            accessibilityRole="button"
            accessibilityLabel="Home"
          >
            <MaterialCommunityIcons
              name="home-outline"
              size={normalize(22)}
              style={homeStyles.footerIcon}
              color={colors.secondaryText}
            />
            <Text style={homeStyles.footerLabel}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[homeStyles.footerTab, homeStyles.footerTabActive]}
            accessibilityRole="button"
            accessibilityLabel="Challenges"
          >
            <MaterialCommunityIcons
              name="target"
              size={normalize(22)}
              style={homeStyles.footerIcon}
              color={colors.primaryText}
            />
            <Text style={[homeStyles.footerLabel, homeStyles.footerLabelActive]}>Challenges</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

// Animated content extracted for readability
const AnimatedContent: React.FC<{
  challenges: Array<{ id: string; title: string; tagline: string; duration: string; description: string }>;
  onSelectChallenge: (challengeType: string) => void;
}> = ({ challenges, onSelectChallenge }) => {
  const headerAnim = useRef(new Animated.Value(0)).current;
  const cardAnim = useRef(new Animated.Value(0)).current;
  const ctaScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(headerAnim, { toValue: 1, duration: 280, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(cardAnim, { toValue: 1, duration: 320, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();
  }, [headerAnim, cardAnim]);

  const onPressIn = () => {
    Animated.spring(ctaScale, { toValue: 0.98, useNativeDriver: true, speed: 30, bounciness: 0 }).start();
  };
  const onPressOut = () => {
    Animated.spring(ctaScale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 6 }).start();
  };

  return (
    <View style={homeStyles.contentMax}>
      {/* Header */}
      <Animated.View
        style={{
          opacity: headerAnim,
          transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }],
        }}
      >
        <View style={homeStyles.header}>
          <View style={homeStyles.headerLeft}>
            <Text style={homeStyles.appTitle}>Challenges</Text>
            <Text style={homeStyles.appSubtitle}>Choose your journey</Text>
          </View>
        </View>
      </Animated.View>

      {/* 365‑day Challenge Card */}
      {challenges.map((challenge) => (
        <Animated.View
          key={challenge.id}
          style={{
            opacity: cardAnim,
            transform: [{ translateY: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
          }}
        >
          <View style={[homeStyles.challengeCard, homeStyles.challengeCardSelected]}>
            <View style={homeStyles.challengeCardHeader}>
              <Text style={homeStyles.challengeTagline}>{challenge.tagline}</Text>
              <Text style={homeStyles.challengeTitle}>{challenge.title}</Text>
            </View>
            <Text style={homeStyles.challengeDescription}>{challenge.description}</Text>

            <Animated.View style={{ transform: [{ scale: ctaScale }] }}>
              <Pressable
                android_ripple={{ color: 'rgba(0,0,0,0.1)' }}
                style={homeStyles.primaryCta}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                onPress={() => {
                  Vibration.vibrate(10);
                  onSelectChallenge(challenge.id);
                }}
                accessibilityRole="button"
                accessibilityLabel="Start 365-day challenge"
              >
                <Text style={homeStyles.primaryCtaText}>Start 365‑day challenge</Text>
              </Pressable>
            </Animated.View>

            <Text style={homeStyles.ctaSubLabel}>Best for long‑term transformation</Text>
          </View>
        </Animated.View>
      ))}
    </View>
  );
};
