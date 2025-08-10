import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Keyboard,
  TouchableWithoutFeedback,
  Animated,
  Easing,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { homeStyles, colors, normalize, onboardingStyles } from '../styles';

interface NameInputScreenProps {
  challengeType: string;
  onBack: () => void;
  onNext: (name: string) => void;
}

export const NameInputScreen: React.FC<NameInputScreenProps> = ({
  challengeType,
  onBack,
  onNext,
}) => {
  const [name, setName] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const isNameValid = useMemo(() => name.trim().length > 0, [name]);
  const contentAnim = useRef(new Animated.Value(0)).current;
  const buttonsAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => {});
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {});
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    Animated.stagger(120, [
      Animated.timing(contentAnim, {
        toValue: 1,
        duration: 320,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(buttonsAnim, {
        toValue: 1,
        duration: 280,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [contentAnim, buttonsAnim]);

  const handleNext = () => {
    const trimmed = name.trim();
    if (trimmed) onNext(trimmed);
  };

  return (
    <SafeAreaView style={homeStyles.container}>
      <LinearGradient
        colors={[colors.primary, '#FFD9A1', colors.background]}
        style={homeStyles.gradientContainer}
      >
        <KeyboardAvoidingView 
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View
              style={{
                flex: 1,
                paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0,
              }}
            >
              <View style={onboardingStyles.content}>
              {/* Centered question/input */}
              <Animated.View
                style={{
                  flex: 1,
                  justifyContent: 'center',
                  opacity: contentAnim,
                  transform: [
                    {
                      translateY: contentAnim.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }),
                    },
                  ],
                }}
              >
                <View style={homeStyles.contentMax}>
                  <View style={[homeStyles.nameInputContainer, { flex: 0 }]}> 
                    <Text style={[homeStyles.nameInputTitle, { textAlign: 'center', marginBottom: normalize(16) }]}>What is your name?</Text>
                    <View style={homeStyles.nameInputWrapper}>
                      <TextInput
                        style={[
                          homeStyles.nameInput,
                          isFocused && { borderColor: colors.primary, shadowOpacity: 0.15 },
                        ]}
                        placeholder="Enter your name"
                        placeholderTextColor={colors.secondaryText}
                        value={name}
                        onChangeText={setName}
                        autoFocus={true}
                        autoCapitalize="words"
                        autoCorrect={false}
                        returnKeyType="done"
                        selectionColor={colors.primaryText}
                        maxLength={30}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        onSubmitEditing={handleNext}
                        blurOnSubmit
                        enablesReturnKeyAutomatically
                        accessibilityLabel="Name"
                      />
                    </View>
                  </View>
                </View>
              </Animated.View>

              {/* Bottom button container, pinned similar to other screens */}
              <Animated.View
                style={{
                  opacity: buttonsAnim,
                  transform: [
                    { translateY: buttonsAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) },
                  ],
                }}
              >
                <View style={homeStyles.contentMax}>
                  <View style={onboardingStyles.buttonContainer}>
                  <TouchableOpacity 
                    style={[homeStyles.primaryCtaSmall, !isNameValid && { opacity: 0.6 }]}
                    onPress={handleNext}
                    disabled={!isNameValid}
                    accessibilityRole="button"
                    accessibilityLabel="Continue"
                  >
                    <Text style={homeStyles.primaryCtaSmallText}>Continue</Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={onBack} style={homeStyles.secondaryLink}>
                    <Text style={homeStyles.secondaryLinkText}>Back</Text>
                  </TouchableOpacity>
                </View>
                </View>
              </Animated.View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
};
