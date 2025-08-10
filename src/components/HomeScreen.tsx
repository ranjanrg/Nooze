import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Pressable,
  Vibration,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { homeStyles, colors, normalize } from '../styles';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface HomeScreenProps {
  wakeUpTime?: Date | null;
  selectedDuration?: string | null;
  onOpenSettings: () => void;
  onClearAllAlarms: () => void;
  onOpenChallenges: () => void;
  hasActiveChallenge?: boolean;
  onStartThreeSixtyFive?: () => void;
  userName?: string;
  currentDay?: number;
  dayStatusForDate?: (date: Date) => 'completed' | 'missed' | 'pending' | null;
  actualWakeTime?: Date | null;
  onEditTime?: () => void;
  onSkipToday?: () => void;
  onTestAlarm?: () => void;
  completedDaysCount?: number;
  totalDaysCount?: number;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  wakeUpTime,
  selectedDuration,
  onOpenSettings,
  onClearAllAlarms,
  onOpenChallenges,
  hasActiveChallenge,
  onStartThreeSixtyFive,
  userName,
  currentDay,
  dayStatusForDate,
  actualWakeTime,
  onEditTime,
  onSkipToday,
  onTestAlarm,
  completedDaysCount,
  totalDaysCount,
}) => {
  const isActive = !!hasActiveChallenge;
  const gradientColors = [colors.primary, '#FFD9A1', colors.background];
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);

  // TODO: replace with real challenge progress from state/service
  const totalDays = totalDaysCount ?? 365;
  const completedDays = completedDaysCount ?? Math.max(1, currentDay || 1);
  const progressPct = useMemo(() => Number(((completedDays / totalDays) * 100).toFixed(2)), [completedDays, totalDays]);

  // Animated progress
  const progressAnim = useRef(new Animated.Value(0)).current; // 0..100
  const [displayPct, setDisplayPct] = useState(0);
  const progressScale = progressAnim.interpolate({ inputRange: [0, 100], outputRange: [0, 1] });

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progressPct,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [progressPct]);

  useEffect(() => {
    const id = progressAnim.addListener(({ value }) => {
      setDisplayPct(Number(value.toFixed(2)));
    });
    return () => progressAnim.removeListener(id);
  }, [progressAnim]);
  const pad2 = (n: number) => String(n).padStart(2, '0');

  // Build current week days (Sun-Sat) with today highlighted
  const weekDays = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=Sun .. 6=Sat
    const startOfWeek = new Date(today);
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(today.getDate() - dayOfWeek);
    const labels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return {
        label: labels[i],
        dateDisplay: pad2(d.getDate()),
        isToday: i === dayOfWeek,
        date: d,
        status: dayStatusForDate ? dayStatusForDate(d) : null,
      };
    });
  }, [dayStatusForDate]);

  // Determine if today is completed (for "Solved math")
  const isTodayCompleted = useMemo(() => {
    try {
      return dayStatusForDate ? dayStatusForDate(new Date()) === 'completed' : false;
    } catch {
      return false;
    }
  }, [dayStatusForDate]);

  const formatTime = (date: Date | null | undefined) => {
    if (!date) return '—';
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const period = hours >= 12 ? 'PM' : 'AM';
    const h12 = hours % 12 === 0 ? 12 : hours % 12;
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(h12)}:${pad(minutes)} ${period}`;
  };

  const getNextAlarmDate = (date: Date | null | undefined) => {
    if (!date) return null;
    const now = new Date();
    const next = new Date(now);
    next.setHours(date.getHours(), date.getMinutes(), 0, 0);
    if (next <= now) next.setDate(next.getDate() + 1);
    return next;
  };

  const formatDayOfWeek = (date: Date | null) => {
    if (!date) return '';
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[date.getDay()];
  };

  const computeNextAlarmDiff = (date: Date | null | undefined) => {
    if (!date) return '';
    const now = new Date();
    const next = new Date(now);
    next.setHours(date.getHours(), date.getMinutes(), 0, 0);
    if (next <= now) {
      next.setDate(next.getDate() + 1);
    }
    const diffMs = next.getTime() - now.getTime();
    const diffMin = Math.round(diffMs / 60000);
    const hours = Math.floor(diffMin / 60);
    const mins = diffMin % 60;
    return `in ${hours}h ${mins}m`;
  };

  // Sticky CTA visibility based on scroll
  const scrollY = useRef(new Animated.Value(0)).current;
  const ctaTranslate = useRef(new Animated.Value(80)).current;
  const [ctaShown, setCtaShown] = useState(false);

  const handleScroll = (e: any) => {
    const y = e.nativeEvent.contentOffset.y;
    if (y > 12 && !ctaShown) {
      setCtaShown(true);
      Animated.spring(ctaTranslate, { toValue: 0, useNativeDriver: true, bounciness: 0, speed: 20 }).start();
    } else if (y <= 12 && ctaShown) {
      setCtaShown(false);
      Animated.timing(ctaTranslate, { toValue: 80, duration: 200, useNativeDriver: true, easing: Easing.out(Easing.quad) }).start();
    }
  };

  // Press scale animation for CTA
  const ctaScale = useRef(new Animated.Value(1)).current;
  const onPrimaryPressIn = () => {
    Animated.spring(ctaScale, { toValue: 0.98, useNativeDriver: true, bounciness: 0, speed: 30 }).start();
  };
  const onPrimaryPressOut = () => {
    Animated.spring(ctaScale, { toValue: 1, useNativeDriver: true, bounciness: 6, speed: 20 }).start();
  };

  // Stepper enter animations
  const stepAnims = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];
  useEffect(() => {
    const animations = stepAnims.map((v, i) =>
      Animated.timing(v, { toValue: 1, duration: 320, delay: i * 80, useNativeDriver: true })
    );
    Animated.stagger(80, animations).start();
  }, []);
  return (
    <SafeAreaView style={homeStyles.container}>
      <LinearGradient
        colors={gradientColors}
        style={homeStyles.gradientContainer}
      >
        <Animated.ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: normalize(20),
            paddingTop: normalize(40),
            // Extra bottom space so sticky CTA never overlaps content on small/tall devices
            paddingBottom: normalize(160),
          }}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
        >
          <View style={homeStyles.contentMax}>
            {/* Header */}
            <View style={homeStyles.header}>
              <View style={homeStyles.headerLeft}>
                <Text style={homeStyles.appTitle}>Nooze</Text>
                <Text style={homeStyles.appSubtitle}>Hii, {userName || 'there'}!</Text>
              </View>
              {isActive && (currentDay || 0) > 0 ? (
                <View style={homeStyles.streakButton}>
                  <Text style={homeStyles.streakText}>{`Day ${currentDay}`}</Text>
                </View>
              ) : null}
            </View>
          {isActive ? (
            <View style={homeStyles.contentMax}>
              {/* Day Selector */}
              <View style={homeStyles.daySelector}>
                {weekDays.map((item, index) => (
                  <TouchableOpacity
                    key={`${item.label}-${index}`}
                    style={[
                      homeStyles.dayCircle,
                      item.isToday && !item.status && homeStyles.dayCircleSelected,
                      item.status === 'completed' && homeStyles.dayCircleCompleted,
                      item.status === 'missed' && homeStyles.dayCircleMissed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`${item.label} ${item.dateDisplay}`}
                    accessibilityState={{ selected: !!(item.isToday || item.status === 'completed') }}
                  >
                    <Text
                      style={[
                        homeStyles.dayText,
                        (item.isToday && !item.status) && homeStyles.dayTextSelected,
                        item.status === 'completed' && homeStyles.dayTextCompleted,
                        item.status === 'missed' && homeStyles.dayTextMissed,
                      ]}
                    >
                      {item.label}
                    </Text>
                    <Text
                      style={[
                        homeStyles.dayNumber,
                        (item.isToday && !item.status) && homeStyles.dayNumberSelected,
                        item.status === 'completed' && homeStyles.dayNumberCompleted,
                        item.status === 'missed' && homeStyles.dayNumberMissed,
                      ]}
                    >
                      {item.dateDisplay}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Next Alarm Card */}
              <View style={homeStyles.mainCard}>
                <View style={homeStyles.mainCardLeft}>
                  <Text style={homeStyles.mainLabel}>Next alarm</Text>
                  {(() => {
                    const next = getNextAlarmDate(wakeUpTime || null);
                    const day = formatDayOfWeek(next);
                    const time = formatTime(wakeUpTime || null);
                    return (
                      <>
                        <Text style={homeStyles.mainValue}>{day ? `${day}, ${time}` : '—'}</Text>
                        <Text style={[homeStyles.mainLabel, { marginTop: normalize(4) }]}>
                          {computeNextAlarmDiff(wakeUpTime || null)}
                        </Text>
                      </>
                    );
                  })()}
                </View>
              </View>

              {/* Overall Progress */}
              <View style={homeStyles.mainCard}>
                <View style={{ flex: 1 }}>
                  <Text style={homeStyles.mainLabel}>Progress</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                    <Text style={homeStyles.mainValue}>{displayPct}%</Text>
                    <Text style={[homeStyles.mainLabel, { marginBottom: normalize(2) }]}>{completedDays} / {totalDays} days</Text>
                  </View>
                  <View style={{ marginTop: normalize(12), height: normalize(10), backgroundColor: colors.background, borderRadius: normalize(6), overflow: 'hidden', borderWidth: 1, borderColor: colors.shadow }}>
                    <Animated.View style={{ transform: [{ scaleX: progressScale }], transformOrigin: 'left', width: '100%', height: '100%', backgroundColor: colors.primaryText }} />
                  </View>
                </View>
              </View>

              {/* (Removed) Stats Cards */}

              {/* Today checklist */}
              <View style={homeStyles.timelineCard}>
                <Text style={homeStyles.sectionTitle}>Today</Text>
                <View style={homeStyles.timelineRow}>
                  <Text style={homeStyles.timelineText}>Wake up time</Text>
                  <Text style={homeStyles.timelineText}>
                    {actualWakeTime ? formatTime(actualWakeTime) : 'Pending'}
                  </Text>
                </View>
                <View style={homeStyles.timelineRow}>
                  <Text style={homeStyles.timelineText}>Solved math</Text>
                  <Text style={[homeStyles.timelineText, { color: isTodayCompleted ? colors.primaryText : colors.secondaryText }]}>
                    {isTodayCompleted ? 'Yes' : 'Pending'}
                  </Text>
                </View>
              </View>

              {/* Quick actions */}
              <View style={{ flexDirection: 'row', gap: normalize(8), marginBottom: normalize(20) }}>
                <TouchableOpacity style={[homeStyles.statCard, { flex: 1 }]} onPress={onEditTime}>
                  <Text style={homeStyles.statValue}>Edit time</Text>
                  <Text style={homeStyles.statLabel}>Adjust your alarm</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[homeStyles.statCard, { flex: 1 }]} onPress={() => setShowSkipConfirm(true)}>
                  <Text style={homeStyles.statValue}>Skip</Text>
                  <Text style={homeStyles.statLabel}>Skip today</Text>
                </TouchableOpacity>
                {onTestAlarm && (
                  <TouchableOpacity style={[homeStyles.statCard, { flex: 1 }]} onPress={onTestAlarm}>
                    <Text style={homeStyles.statValue}>Test</Text>
                    <Text style={homeStyles.statLabel}>2 min alarm</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Page Indicator removed */}
            </View>
          ) : (
            <View style={homeStyles.contentMax}>
              <View style={homeStyles.welcomeSection}>
                <Text style={homeStyles.heroTitle}>Own your mornings</Text>
                <Text style={homeStyles.heroSubtitle}>Pick a challenge, set your time, build your streak.</Text>
              </View>

              {/* How it works - vertical stepper */}
              <View style={homeStyles.stepperContainer}>
                <Animated.View style={[homeStyles.stepperItem, { opacity: stepAnims[0], transform: [{ translateY: stepAnims[0].interpolate({ inputRange: [0,1], outputRange: [8,0] }) }] }]}>
                  <View style={homeStyles.stepperBullet}><Text style={homeStyles.stepperBulletText}>1</Text></View>
                  <View style={homeStyles.stepperTexts}>
                    <Text style={homeStyles.stepperTitle}>Pick a challenge</Text>
                    <Text style={homeStyles.stepperSubtitle}>90 or 365 days — your pace.</Text>
                  </View>
                </Animated.View>
                <View style={homeStyles.stepperLine} />
                <Animated.View style={[homeStyles.stepperItem, { opacity: stepAnims[1], transform: [{ translateY: stepAnims[1].interpolate({ inputRange: [0,1], outputRange: [8,0] }) }] }]}>
                  <View style={homeStyles.stepperBullet}><Text style={homeStyles.stepperBulletText}>2</Text></View>
                  <View style={homeStyles.stepperTexts}>
                    <Text style={homeStyles.stepperTitle}>Set your time</Text>
                    <Text style={homeStyles.stepperSubtitle}>Choose your daily wake-up.</Text>
                  </View>
                </Animated.View>
                <View style={homeStyles.stepperLine} />
                <Animated.View style={[homeStyles.stepperItem, { opacity: stepAnims[2], transform: [{ translateY: stepAnims[2].interpolate({ inputRange: [0,1], outputRange: [8,0] }) }] }]}>
                  <View style={homeStyles.stepperBullet}><Text style={homeStyles.stepperBulletText}>3</Text></View>
                  <View style={homeStyles.stepperTexts}>
                    <Text style={homeStyles.stepperTitle}>Wake up and solve math</Text>
                    <Text style={homeStyles.stepperSubtitle}>Dismiss the alarm by solving a quick puzzle.</Text>
                  </View>
                </Animated.View>
                <View style={homeStyles.stepperLine} />
                <Animated.View style={[homeStyles.stepperItem, { opacity: stepAnims[3], transform: [{ translateY: stepAnims[3].interpolate({ inputRange: [0,1], outputRange: [8,0] }) }] }]}>
                  <View style={homeStyles.stepperBullet}><Text style={homeStyles.stepperBulletText}>4</Text></View>
                  <View style={homeStyles.stepperTexts}>
                    <Text style={[homeStyles.stepperTitle, { color: colors.primary }]}>Change your life</Text>
                    <Text style={homeStyles.stepperSubtitle}>Build a streak that sticks.</Text>
                  </View>
                </Animated.View>
              </View>

              {/* Removed friction sections: Benefits, Preview, Permissions */}

              {/* Primary CTA */}
              <TouchableOpacity style={homeStyles.primaryCta} onPress={onStartThreeSixtyFive || onOpenChallenges}>
                <Text style={homeStyles.primaryCtaText}>Start 365‑day challenge</Text>
              </TouchableOpacity>
              <Text style={homeStyles.ctaSubLabel}>Best for long‑term transformation</Text>
            </View>
          )}
          </View>
        </Animated.ScrollView>

        {/* Sticky primary CTA */}
        {!isActive && (
          <Animated.View
            style={[
              homeStyles.stickyCtaBar,
              // Add platform-aware extra bottom padding to respect gesture/nav bars
              { paddingBottom: Platform.OS === 'android' ? normalize(28) : normalize(32) },
              { transform: [{ translateY: ctaTranslate }] },
            ]}
          >
            <Animated.View style={{ transform: [{ scale: ctaScale }] }}>
            <Pressable
              android_ripple={{ color: 'rgba(0,0,0,0.1)' }}
              style={homeStyles.stickyCtaButton}
              onPress={() => {
                Vibration.vibrate(10);
                (onStartThreeSixtyFive || onOpenChallenges)?.();
              }}
              onPressIn={onPrimaryPressIn}
              onPressOut={onPrimaryPressOut}
              accessibilityRole="button"
              accessibilityLabel="Start 365-day challenge"
            >
              <Text style={homeStyles.stickyCtaText}>Start 365‑day challenge</Text>
            </Pressable>
            </Animated.View>
          </Animated.View>
        )}

        {/* Footer */}
        <View style={homeStyles.footer}>
          <TouchableOpacity
            style={[homeStyles.footerTab, homeStyles.footerTabActive]}
            accessibilityRole="button"
            accessibilityLabel="Home"
          >
            <MaterialCommunityIcons
              name="home-outline"
              size={normalize(22)}
              style={homeStyles.footerIcon}
              color={colors.primaryText}
            />
            <Text style={[homeStyles.footerLabel, homeStyles.footerLabelActive]}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={homeStyles.footerTab}
            onPress={onOpenChallenges}
            accessibilityRole="button"
            accessibilityLabel="Challenges"
          >
            <MaterialCommunityIcons
              name="target"
              size={normalize(22)}
              style={homeStyles.footerIcon}
              color={colors.secondaryText}
            />
            <Text style={homeStyles.footerLabel}>Challenges</Text>
          </TouchableOpacity>
        </View>

        {/* Skip confirmation modal */}
        {showSkipConfirm && (
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.3)',
              alignItems: 'center',
              justifyContent: 'center',
              padding: normalize(20),
            }}
            accessibilityRole="alert"
          >
            <View
              style={{
                width: '100%',
                maxWidth: homeStyles.contentMax.maxWidth,
                backgroundColor: colors.lightText,
                borderRadius: normalize(16),
                padding: normalize(20),
                borderWidth: 1,
                borderColor: colors.shadow,
              }}
            >
              <Text style={{ fontSize: normalize(18), fontWeight: '800', color: colors.primaryText, marginBottom: normalize(8) }}>
                Skip today?
              </Text>
              <Text style={{ fontSize: normalize(14), color: colors.secondaryText, marginBottom: normalize(16) }}>
                We'll mark today as missed and reduce your progress for this challenge.
              </Text>
              <TouchableOpacity
                style={homeStyles.stickyCtaButton}
                onPress={() => {
                  onSkipToday?.();
                  setShowSkipConfirm(false);
                }}
                accessibilityRole="button"
                accessibilityLabel="Confirm skip today"
              >
                <Text style={homeStyles.stickyCtaText}>Skip today</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowSkipConfirm(false)}
                style={homeStyles.secondaryLink}
                accessibilityRole="button"
                accessibilityLabel="Cancel"
              >
                <Text style={homeStyles.secondaryLinkText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </LinearGradient>
    </SafeAreaView>
  );
};
