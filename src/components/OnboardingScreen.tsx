import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { onboardingStyles, colors, homeStyles } from '../styles';
import { ScreenType } from '../types';

interface OnboardingScreenProps {
  currentScreen: ScreenType;
  userName?: string;
  selectedChallenge?: string;
  selectedMotivation?: string;
  selectedMorningActivity?: string;
  selectedPastExperience?: string;
  selectedObstacle?: string;
  selectedRoutineRating?: string;
  onOptionSelect: (option: string) => void;
  onNext: () => void;
  onBack: () => void;
  onStartChallenge: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  currentScreen,
  userName,
  selectedChallenge,
  selectedMotivation,
  selectedMorningActivity,
  selectedPastExperience,
  selectedObstacle,
  selectedRoutineRating,
  onOptionSelect,
  onNext,
  onBack,
  onStartChallenge,
}) => {
  const getScreenData = () => {
    switch (currentScreen) {
      case 'question':
        return {
          title: 'Why do you want to wake up early?',
          subtitle: 'Choose the option that best aligns with you.',
          options: [
            { icon: '●', title: 'To be healthier', subtitle: 'Improve my physical and mental well-being' },
            { icon: '●●', title: 'To have extra time for myself', subtitle: 'Enjoy quiet moments before the day starts' },
            { icon: '●●●', title: 'To get more done', subtitle: 'Increase my productivity and achieve goals' },
            { icon: '●●\n●●', title: 'To boost my mood and energy', subtitle: 'Start each day feeling positive and energized' }
          ],
          selectedOption: selectedMotivation,
        };
      case 'morningActivities':
        return {
          title: 'What will you do with your extra morning time?',
          subtitle: 'Choose the option that best aligns with you.',
          options: [
            { icon: '●', title: 'Exercise or Meditate', subtitle: 'Focus on physical and mental wellness' },
            { icon: '●●', title: 'Work on a personal project', subtitle: 'Develop skills or pursue passions' },
            { icon: '●●●', title: 'Enjoy quiet time or reflect', subtitle: 'Practice mindfulness and self-reflection' },
            { icon: '●●\n●●', title: 'Read something inspiring', subtitle: 'Learn and grow through reading' }
          ],
          selectedOption: selectedMorningActivity,
        };
      case 'pastExperience':
        return {
          title: 'Have you ever tried to wake up early?',
          subtitle: 'Choose the option that best aligns with you.',
          options: [
            { icon: '●', title: 'Yes, I already do it', subtitle: 'I have an established morning routine' },
            { icon: '●●', title: 'Yes, I\'ve tried but didn\'t stick', subtitle: 'I struggled to maintain consistency' },
            { icon: '●●●', title: 'Yes, sometimes but not consistently', subtitle: 'I do it occasionally but want to improve' },
            { icon: '●●\n●●', title: 'No, this is my first time', subtitle: 'I\'m completely new to early rising' }
          ],
          selectedOption: selectedPastExperience,
        };
      case 'obstacles':
        return {
          title: 'What is stopping you from waking up early?',
          subtitle: 'Choose the option that best aligns with you.',
          options: [
            { icon: '●', title: 'I go to bed too late', subtitle: 'My sleep schedule needs adjustment' },
            { icon: '●●', title: 'I struggle to get out of bed', subtitle: 'I hit snooze and stay in bed' },
            { icon: '●●●', title: 'I need more motivation', subtitle: 'I lack clear goals or purpose' },
            { icon: '●●\n●●', title: 'Other reasons', subtitle: 'Different challenges I face' }
          ],
          selectedOption: selectedObstacle,
        };
      case 'routineRating':
        return {
          title: 'How would you rate your current morning routine?',
          subtitle: 'Choose the option that best aligns with you.',
          options: [
            { icon: '●', title: 'Chaotic, I struggle to wake up', subtitle: 'My mornings are disorganized' },
            { icon: '●●', title: 'Okay, but inconsistent', subtitle: 'I have some structure but it varies' },
            { icon: '●●●', title: 'I have a routine, but it could be better', subtitle: 'I\'m on the right track but want to improve' },
            { icon: '●●\n●●', title: 'My mornings are already positive', subtitle: 'I have a good foundation to build on' }
          ],
          selectedOption: selectedRoutineRating,
        };
      default:
        return {
          title: '',
          subtitle: '',
          options: [],
          selectedOption: '',
        };
    }
  };

  const screenData = getScreenData();
  const isOptionSelected = screenData.selectedOption && screenData.selectedOption !== '';
  const isLastScreen = currentScreen === 'routineRating';
  
  // Calculate progress based on current screen
  const getProgress = () => {
    const screenOrder = ['question', 'morningActivities', 'pastExperience', 'obstacles', 'routineRating', 'timeSelection', 'confirmation'];
    const currentIndex = screenOrder.indexOf(currentScreen);
    // Name input is 15%, each question is 12% (60% total for 5 questions), time selection is 12.5%, confirmation is 12.5%
    // So questions start at 15% and go up to 75%, then time selection goes to 87.5%, then confirmation goes to 100%
    return 15 + ((currentIndex + 1) / screenOrder.length) * 85;
  };

  const renderQuestionScreen = () => (
    <View style={onboardingStyles.content}>
      {/* Header with back button and progress */}
      <View style={onboardingStyles.header}>
      </View>

      {/* Question and subtitle */}
      <View style={onboardingStyles.questionContainer}>
        <Text style={onboardingStyles.title}>{screenData.title}</Text>
        <Text style={onboardingStyles.subtitle}>
          {screenData.subtitle}
        </Text>
      </View>

      {/* Options */}
      <View style={onboardingStyles.optionsContainer}>
        {screenData.options.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={[
              onboardingStyles.optionCard,
              screenData.selectedOption === option.title && onboardingStyles.optionCardSelected
            ]}
            onPress={() => onOptionSelect(option.title)}
          >
            <View style={onboardingStyles.optionContent}>
              <Text style={[
                onboardingStyles.optionIcon,
                screenData.selectedOption === option.title && { color: colors.lightText }
              ]}>{option.icon}</Text>
              <View style={onboardingStyles.optionTextContainer}>
                <Text style={[
                  onboardingStyles.optionTitle,
                  screenData.selectedOption === option.title && onboardingStyles.optionTitleSelected
                ]}>
                  {option.title}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Continue button */}
      <View style={onboardingStyles.buttonContainer}>
        <TouchableOpacity 
          style={[homeStyles.primaryCtaSmall, !isOptionSelected && { opacity: 0.6 }]}
          onPress={onNext}
          disabled={!isOptionSelected}
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
  );

  return (
    <SafeAreaView style={onboardingStyles.container}>
      <LinearGradient
        colors={[colors.primary, '#FFD9A1', colors.background]}
        style={{ flex: 1 }}
      >
        {renderQuestionScreen()}
      </LinearGradient>
    </SafeAreaView>
  );
};
