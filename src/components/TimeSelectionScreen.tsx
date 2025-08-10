import React, { useMemo, useRef, useState } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, FlatList, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { onboardingStyles, colors, normalize, homeStyles } from '../styles';

interface TimeSelectionScreenProps {
  userName: string;
  selectedChallenge: string;
  onBack: () => void;
  onTimeSelected: (time: string) => void;
  showBack?: boolean;
}

export const TimeSelectionScreen: React.FC<TimeSelectionScreenProps> = ({
  userName,
  selectedChallenge,
  onBack,
  onTimeSelected,
  showBack = true,
}) => {
  // Wheel pickers: Hour / Minute / Period
  const hours = useMemo(() => [4, 5, 6, 7], []);
  const minutes = useMemo(() => Array.from({ length: 60 }, (_, i) => i), []);
  const periods = useMemo(() => ['AM'], []); // constrained to AM only

  const [hourIndex, setHourIndex] = useState<number>(hours.indexOf(6));
  const [minuteIndex, setMinuteIndex] = useState<number>(0);
  const [periodIndex, setPeriodIndex] = useState<number>(0);
  // Indices represent the value centered in the highlight box

  const hourListRef = useRef<FlatList<number>>(null);
  const minuteListRef = useRef<FlatList<number>>(null);
  const periodListRef = useRef<FlatList<string>>(null);

  const pad = (n: number) => String(n).padStart(2, '0');

  const hour = hours[hourIndex];
  const minute = minutes[minuteIndex];
  const period = periods[periodIndex];

  const currentTime = useMemo(() => `${pad(hour)}:${pad(minute)} ${period}`, [hour, minute, period]);
  const selectedTime = useMemo(() => `${pad(hours[hourIndex])}:${pad(minutes[minuteIndex])} ${periods[periodIndex]}`, [hourIndex, minuteIndex, periodIndex]);

  // Enforce constraints: 4:00 AM - 7:00 AM. If hour is 7, minute must be 0
  const withinAllowedWindow = useMemo(() => {
    if (period !== 'AM') return false;
    if (hour === 7) return minute === 0;
    return hour >= 4 && hour <= 7;
  }, [hour, minute, period]);
  const withinAllowedSelected = useMemo(() => {
    const hh = hours[hourIndex];
    const mm = minutes[minuteIndex];
    const pp = periods[periodIndex];
    if (pp !== 'AM') return false;
    if (hh === 7) return mm === 0;
    return hh >= 4 && hh <= 7;
  }, [hourIndex, minuteIndex, periodIndex]);

  const ITEM_HEIGHT = normalize(44);
  const VISIBLE_COUNT = 5; // should be odd
  const PADDING = (VISIBLE_COUNT - 1) / 2 * ITEM_HEIGHT;
  const SELECT_BG = '#ECECEE';

  const hoursOffsets = useMemo(() => hours.map((_, i) => i * ITEM_HEIGHT), [hours]);
  const minutesOffsets = useMemo(() => minutes.map((_, i) => i * ITEM_HEIGHT), [minutes]);
  const periodOffsets = useMemo(() => periods.map((_, i) => i * ITEM_HEIGHT), [periods]);
  const clampIndex = (idx: number, len: number) => Math.max(0, Math.min(len - 1, idx));

  const makeOnMomentumEnd = <T,>(ref: React.RefObject<FlatList<T> | null>, setIndex: (i: number) => void, length: number) => (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = e.nativeEvent.contentOffset.y;
    // With content padding, the center index is offset by PADDING
    const index = clampIndex(Math.round((offsetY) / ITEM_HEIGHT), length);
    setIndex(index);
  };

  const getItemLayout = (_: any, index: number) => ({ length: ITEM_HEIGHT, offset: PADDING + ITEM_HEIGHT * index, index });

  // When hour goes to 7, clamp minutes to 0
  const handleHourChange = (index: number) => {
    setHourIndex(index);
    const newHour = hours[index];
    if (newHour === 7 && minuteIndex !== 0) {
      setMinuteIndex(0);
      // snap minutes to 0
      minuteListRef.current?.scrollToIndex({ index: 0, animated: true, viewOffset: PADDING });
    }
  };

  const handleStart = () => {
    const chosenHour = hours[hourIndex];
    const chosenPeriod = periods[periodIndex];
    const chosenMinute = chosenHour === 7 ? 0 : minutes[minuteIndex];
    const value = `${pad(chosenHour)}:${pad(chosenMinute)} ${chosenPeriod}`;
    if (chosenPeriod === 'AM' && ((chosenHour > 4 && chosenHour < 7) || chosenHour === 4 || (chosenHour === 7 && chosenMinute === 0))) {
      onTimeSelected(value);
    }
  };

  return (
    <SafeAreaView style={onboardingStyles.container}>
      <LinearGradient colors={[colors.primary, '#FFD9A1', colors.background]} style={{ flex: 1 }}>
        <View style={onboardingStyles.content}>
          <View style={homeStyles.contentMax}>
            {/* Question + subtitle */}
            <View style={[onboardingStyles.questionContainer, { marginTop: normalize(48) }]}>
              <Text style={onboardingStyles.title}>Select your exact wake-up time</Text>
              <Text style={onboardingStyles.subtitle}>
                Choose a time between 4:00 AM and 7:00 AM for your {selectedChallenge}
              </Text>
              <Text style={[onboardingStyles.subtitle, { marginTop: normalize(8), fontWeight: '600', color: colors.primaryText }]}>Selected: {selectedTime}</Text>
            </View>

            {/* Wheel controls */}
            <View style={{ flex: 1, justifyContent: 'center' }}>
              <View style={{ alignItems: 'center', marginBottom: normalize(16) }}>
                <Text style={{ fontSize: normalize(36), fontWeight: '800', color: colors.primaryText }}>
                  {selectedTime}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                {/* Hour wheel */}
                <View style={{ width: '40%', alignItems: 'center' }}>
                  <View style={{ height: ITEM_HEIGHT * VISIBLE_COUNT, width: '100%', position: 'relative' }}>
                    {/* Center highlight pill behind text */}
                    <View pointerEvents="none" style={{ position: 'absolute', top: ITEM_HEIGHT * ((VISIBLE_COUNT - 1) / 2), left: normalize(8), right: normalize(8), height: ITEM_HEIGHT, backgroundColor: SELECT_BG, borderRadius: normalize(12), zIndex: 0 }} />
                    <FlatList
                      ref={hourListRef}
                      data={hours}
                      keyExtractor={(item) => `h-${item}`}
                      showsVerticalScrollIndicator={false}
                      snapToOffsets={hoursOffsets.map(v => v)}
                      snapToAlignment="center"
                      disableIntervalMomentum
                      decelerationRate="normal"
                      getItemLayout={getItemLayout}
                      initialScrollIndex={hourIndex}
                      onMomentumScrollEnd={makeOnMomentumEnd(hourListRef, handleHourChange, hours.length)}
                      onScroll={(e) => {
                        const idx = clampIndex(Math.round((e.nativeEvent.contentOffset.y) / ITEM_HEIGHT), hours.length);
                        if (idx !== hourIndex && idx >= 0 && idx < hours.length) setHourIndex(idx);
                      }}
                      scrollEventThrottle={16}
                      style={{ zIndex: 1 }}
                      contentContainerStyle={{ paddingTop: PADDING, paddingBottom: PADDING }}
                      renderItem={({ item, index }) => (
                        <View style={{ height: ITEM_HEIGHT, justifyContent: 'center', alignItems: 'center' }}>
                          <Text style={{ fontSize: normalize(22), fontWeight: index === hourIndex ? '800' as const : '600' as const, color: index === hourIndex ? colors.primaryText : colors.secondaryText, opacity: index === hourIndex ? 1 : 0.5 }}>
                            {pad(item)}
                          </Text>
                        </View>
                      )}
                    />
                  </View>
                </View>

                {/* Minute wheel */}
                <View style={{ width: '40%', alignItems: 'center' }}>
                  <View style={{ height: ITEM_HEIGHT * VISIBLE_COUNT, width: '100%', position: 'relative' }}>
                    <View pointerEvents="none" style={{ position: 'absolute', top: ITEM_HEIGHT * ((VISIBLE_COUNT - 1) / 2), left: normalize(8), right: normalize(8), height: ITEM_HEIGHT, backgroundColor: SELECT_BG, borderRadius: normalize(12), zIndex: 0 }} />
                    <FlatList
                      ref={minuteListRef}
                      data={minutes}
                      keyExtractor={(item) => `m-${item}`}
                      showsVerticalScrollIndicator={false}
                      snapToOffsets={minutesOffsets.map(v => v)}
                      snapToAlignment="center"
                      disableIntervalMomentum
                      decelerationRate="normal"
                      scrollEnabled={hours[hourIndex] !== 7}
                      getItemLayout={getItemLayout}
                      initialScrollIndex={minuteIndex}
                      onMomentumScrollEnd={makeOnMomentumEnd(minuteListRef, setMinuteIndex, minutes.length)}
                      onScroll={(e) => {
                        // If hour is 7, keep minutes at 00
                        if (hours[hourIndex] === 7) {
                          if (minuteIndex !== 0) setMinuteIndex(0);
                          return;
                        }
                        const idx = clampIndex(Math.round((e.nativeEvent.contentOffset.y) / ITEM_HEIGHT), minutes.length);
                        if (idx !== minuteIndex && idx >= 0 && idx < minutes.length) setMinuteIndex(idx);
                      }}
                      scrollEventThrottle={16}
                      style={{ zIndex: 1 }}
                      contentContainerStyle={{ paddingTop: PADDING, paddingBottom: PADDING }}
                      renderItem={({ item, index }) => (
                        <View style={{ height: ITEM_HEIGHT, justifyContent: 'center', alignItems: 'center' }}>
                          <Text style={{ fontSize: normalize(22), fontWeight: index === minuteIndex ? '800' as const : '600' as const, color: index === minuteIndex ? colors.primaryText : colors.secondaryText, opacity: index === minuteIndex ? 1 : 0.5 }}>
                            {pad(item)}
                          </Text>
                        </View>
                      )}
                    />
                  </View>
                </View>

                {/* Period wheel (AM only) */}
                <View style={{ width: '15%', alignItems: 'center' }}>
                  <View style={{ height: ITEM_HEIGHT * VISIBLE_COUNT, width: '100%', position: 'relative' }}>
                    <View pointerEvents="none" style={{ position: 'absolute', top: ITEM_HEIGHT * ((VISIBLE_COUNT - 1) / 2), left: normalize(8), right: normalize(8), height: ITEM_HEIGHT, backgroundColor: SELECT_BG, borderRadius: normalize(12), zIndex: 0 }} />
                    <FlatList
                      ref={periodListRef}
                      data={periods}
                      keyExtractor={(item) => `p-${item}`}
                      showsVerticalScrollIndicator={false}
                      snapToOffsets={periodOffsets.map(v => v)}
                      snapToAlignment="center"
                      disableIntervalMomentum
                      decelerationRate="normal"
                      getItemLayout={getItemLayout}
                      initialScrollIndex={periodIndex}
                      onMomentumScrollEnd={makeOnMomentumEnd(periodListRef, setPeriodIndex, periods.length)}
                      onScroll={(e) => {
                        const idx = clampIndex(Math.round((e.nativeEvent.contentOffset.y) / ITEM_HEIGHT), periods.length);
                        if (idx !== periodIndex && idx >= 0 && idx < periods.length) setPeriodIndex(idx);
                      }}
                      scrollEventThrottle={16}
                      style={{ zIndex: 1 }}
                      contentContainerStyle={{ paddingTop: PADDING, paddingBottom: PADDING }}
                      renderItem={({ item, index }) => (
                        <View style={{ height: ITEM_HEIGHT, justifyContent: 'center', alignItems: 'center' }}>
                          <Text style={{ fontSize: normalize(18), fontWeight: index === periodIndex ? '800' as const : '600' as const, color: index === periodIndex ? colors.primaryText : colors.secondaryText, opacity: index === periodIndex ? 1 : 0.5 }}>
                            {item}
                          </Text>
                        </View>
                      )}
                    />
                  </View>
                </View>
              </View>
            </View>

            {/* spacer to avoid overlap with sticky footer if needed */}
            <View style={{ height: normalize(12) }} />
          </View>
        </View>
        {/* Sticky bottom actions (no background) */}
        <View style={[homeStyles.stickyCtaBar, { backgroundColor: 'transparent', elevation: 0, shadowOpacity: 0, borderTopWidth: 0 }] }>
          <TouchableOpacity
            style={[homeStyles.stickyCtaButton, !withinAllowedWindow && { opacity: 0.6 }]}
            onPress={handleStart}
            disabled={!withinAllowedWindow}
            accessibilityRole="button"
            accessibilityLabel="Start my challenge"
          >
            <Text style={homeStyles.stickyCtaText}>Start My Challenge</Text>
          </TouchableOpacity>

          {showBack && (
            <TouchableOpacity onPress={onBack} style={homeStyles.secondaryLink} accessibilityRole="button" accessibilityLabel="Go back">
              <Text style={homeStyles.secondaryLinkText}>Back</Text>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};


