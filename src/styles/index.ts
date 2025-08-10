import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// Responsive sizing utility
export const normalize = (size: number) => {
  const scale = width / 375; // Base width of 375 (iPhone X)
  const newSize = size * scale;
  return Math.round(newSize);
};

// Color palette
export const colors = {
  // Primary colors
  primary: '#FFB347', // Sunrise Orange
  secondary: '#4A90E2', // Muted Blue
  accent: '#88B04B', // Sage Green
  
  // Background colors
  background: '#FAFAFA', // Off-White
  cardBackground: '#FFFFFF', // Pure White
  
  // Text colors
  primaryText: '#3C3C3C', // Slate Gray
  secondaryText: '#707070', // Cool Gray
  lightText: '#FFFFFF',
  
  // Status colors
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#FF6B6B',
  
  // Shadows
  shadow: 'rgba(0, 0, 0, 0.1)',
  shadowDark: 'rgba(0, 0, 0, 0.2)',
};

// Common styles
export const commonStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  
  // Header styles
  header: {
    backgroundColor: colors.cardBackground,
    padding: normalize(16),
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.shadow,
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  
  headerTextContainer: {
    flex: 1,
  },
  
  headerTitle: {
    fontSize: normalize(24),
    fontWeight: 'bold',
    color: colors.primaryText,
    marginBottom: normalize(4),
  },
  
  headerSubtitle: {
    fontSize: normalize(14),
    color: colors.secondaryText,
    fontWeight: '500',
  },
  
  // Content styles
  content: {
    flex: 1,
  },
  
  contentContainer: {
    padding: normalize(16),
    paddingBottom: normalize(100),
  },
  
  // Card styles
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: normalize(12),
    padding: normalize(16),
    marginBottom: normalize(16),
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  
  // Button styles
  button: {
    backgroundColor: colors.primary,
    paddingVertical: normalize(12),
    paddingHorizontal: normalize(24),
    borderRadius: normalize(8),
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  
  buttonText: {
    color: colors.lightText,
    fontSize: normalize(16),
    fontWeight: '600',
  },
  
  buttonDisabled: {
    backgroundColor: colors.secondaryText,
    opacity: 0.6,
  },
  
  // FAB styles
  fab: {
    position: 'absolute',
    bottom: normalize(24),
    right: normalize(24),
    width: normalize(56),
    height: normalize(56),
    borderRadius: normalize(28),
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: colors.shadowDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  
  fabText: {
    color: colors.lightText,
    fontSize: normalize(24),
    fontWeight: 'bold',
  },
  
  // Section styles
  section: {
    marginBottom: normalize(24),
  },
  
  sectionTitle: {
    fontSize: normalize(18),
    fontWeight: '600',
    color: colors.primaryText,
    marginBottom: normalize(12),
  },
  
  // Empty state styles
  emptyState: {
    alignItems: 'center',
    paddingVertical: normalize(32),
  },
  
  emptyStateText: {
    fontSize: normalize(16),
    color: colors.secondaryText,
    fontWeight: '500',
    marginBottom: normalize(8),
  },
  
  emptyStateSubtext: {
    fontSize: normalize(14),
    color: colors.secondaryText,
    textAlign: 'center',
  },
});

// Home screen specific styles
export const homeStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  
  gradientContainer: {
    flex: 1,
  },
  contentMax: {
    width: '100%',
    // Keep a readable line length on tablets/large screens
    // Use a fixed cap instead of scaled width so it doesn’t balloon on very wide devices
    maxWidth: 480,
    alignSelf: 'center',
  },
  
  content: {
    flex: 1,
    paddingHorizontal: normalize(20),
    paddingTop: normalize(40),
    paddingBottom: normalize(20),
  },
  
  // Header styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: normalize(24),
  },
  
  headerLeft: {
    flex: 1,
  },
  
  appTitle: {
    fontSize: normalize(24),
    fontWeight: '700',
    color: colors.primaryText,
    marginBottom: normalize(2),
  },
  
  appSubtitle: {
    fontSize: normalize(14),
    color: colors.secondaryText,
    fontWeight: '400',
  },
  
  streakButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: normalize(12),
    paddingVertical: normalize(8),
    borderRadius: normalize(16),
    borderWidth: 1,
    borderColor: colors.shadow,
  },
  
  streakIcon: {
    fontSize: normalize(16),
    marginRight: normalize(4),
  },
  
  streakText: {
    fontSize: normalize(14),
    fontWeight: '600',
    color: colors.primaryText,
  },
  
  // Day selector
  daySelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: normalize(24),
  },
  
  dayCircle: {
    width: normalize(40),
    height: normalize(50),
    borderRadius: normalize(20),
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.shadow,
  },
  
  dayCircleSelected: {
    backgroundColor: colors.primaryText,
    borderColor: colors.primaryText,
  },
  dayCircleCompleted: {
    backgroundColor: '#2FBF71',
    borderColor: '#2FBF71',
  },
  dayCircleMissed: {
    backgroundColor: '#FDECEC',
    borderColor: '#F99B9B',
  },
  
  dayText: {
    fontSize: normalize(12),
    fontWeight: '500',
    color: colors.primaryText,
    marginBottom: normalize(2),
  },
  
  dayTextSelected: {
    color: colors.lightText,
  },
  dayTextCompleted: {
    color: colors.lightText,
  },
  dayTextMissed: {
    color: '#D95353',
    fontWeight: '700',
  },
  
  dayNumber: {
    fontSize: normalize(10),
    fontWeight: '400',
    color: colors.secondaryText,
  },
  
  dayNumberSelected: {
    color: colors.lightText,
  },
  dayNumberCompleted: {
    color: colors.lightText,
  },
  dayNumberMissed: {
    color: '#D95353',
    fontWeight: '700',
  },
  
  // Main card
  mainCard: {
    backgroundColor: colors.lightText,
    borderRadius: normalize(16),
    padding: normalize(20),
    marginBottom: normalize(20),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  
  mainCardLeft: {
    flex: 1,
  },
  
  mainValue: {
    fontSize: normalize(32),
    fontWeight: '700',
    color: colors.primaryText,
    marginBottom: normalize(4),
  },
  
  mainLabel: {
    fontSize: normalize(14),
    color: colors.secondaryText,
    fontWeight: '400',
  },
  
  mainCardRight: {
    alignItems: 'center',
  },
  
  progressCircle: {
    width: normalize(60),
    height: normalize(60),
    borderRadius: normalize(30),
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.shadow,
  },
  
  progressIcon: {
    fontSize: normalize(24),
  },
  
  // Stats container
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: normalize(20),
  },
  
  statCard: {
    backgroundColor: colors.lightText,
    borderRadius: normalize(12),
    padding: normalize(16),
    flex: 1,
    marginHorizontal: normalize(4),
    alignItems: 'center',
    elevation: 1,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  
  statValue: {
    fontSize: normalize(20),
    fontWeight: '700',
    color: colors.primaryText,
    marginBottom: normalize(4),
  },
  
  statLabel: {
    fontSize: normalize(12),
    color: colors.secondaryText,
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: normalize(8),
  },
  
  statIcon: {
    width: normalize(24),
    height: normalize(24),
    borderRadius: normalize(12),
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  statIconText: {
    fontSize: normalize(12),
  },
  
  // Page indicator
  pageIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: normalize(24),
    gap: normalize(8),
  },
  
  pageDot: {
    width: normalize(8),
    height: normalize(8),
    borderRadius: normalize(4),
    backgroundColor: colors.primaryText,
  },
  
  pageDotInactive: {
    backgroundColor: colors.shadow,
  },
  
  // Recent section
  recentSection: {
    flex: 1,
  },
  
  sectionTitle: {
    fontSize: normalize(18),
    fontWeight: '600',
    color: colors.primaryText,
    marginBottom: normalize(16),
  },
  
  recentCard: {
    backgroundColor: colors.lightText,
    borderRadius: normalize(12),
    padding: normalize(20),
    elevation: 1,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  
  recentText: {
    fontSize: normalize(16),
    fontWeight: '500',
    color: colors.primaryText,
    marginBottom: normalize(8),
  },
  
  recentSubtext: {
    fontSize: normalize(14),
    color: colors.secondaryText,
    fontWeight: '400',
  },
  
  // Floating action button
  fab: {
    position: 'absolute',
    bottom: normalize(24),
    right: normalize(24),
    width: normalize(56),
    height: normalize(56),
    borderRadius: normalize(28),
    backgroundColor: colors.primaryText,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  
  fabText: {
    color: colors.lightText,
    fontSize: normalize(24),
    fontWeight: '600',
  },
  // Footer styles
  footer: {
    flexDirection: 'row',
    backgroundColor: colors.lightText,
    borderTopWidth: 1,
    borderTopColor: colors.shadow,
    paddingHorizontal: normalize(20),
    paddingVertical: normalize(12),
    paddingBottom: normalize(20), // Extra padding for safe area
  },
  footerTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: normalize(6),
    gap: normalize(4),
  },
  footerTabActive: {},
  footerIcon: {
    marginBottom: normalize(2),
  },
  footerLabel: {
    fontSize: normalize(12),
    color: colors.secondaryText,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  footerLabelActive: {
    color: colors.primaryText,
  },
  // Challenge screen styles
  welcomeSection: {
    marginBottom: normalize(24),
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: normalize(24),
    fontWeight: '600',
    color: colors.primaryText,
    textAlign: 'center',
  },
  heroTitle: {
    fontSize: normalize(28),
    fontWeight: '800',
    color: colors.primaryText,
    textAlign: 'center',
    marginBottom: normalize(8),
  },
  heroSubtitle: {
    fontSize: normalize(16),
    color: colors.secondaryText,
    textAlign: 'center',
  },
  stepsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: normalize(10),
    marginTop: normalize(16),
    marginBottom: normalize(16),
  },
  stepperContainer: {
    backgroundColor: colors.lightText,
    borderRadius: normalize(12),
    padding: normalize(12),
    marginBottom: normalize(16),
    elevation: 1,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  stepperItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepperBullet: {
    width: normalize(24),
    height: normalize(24),
    borderRadius: normalize(12),
    backgroundColor: colors.primaryText,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: normalize(12),
  },
  stepperBulletText: {
    color: colors.lightText,
    fontSize: normalize(12),
    fontWeight: '700',
  },
  stepperTexts: {
    flex: 1,
  },
  stepperTitle: {
    fontSize: normalize(14),
    fontWeight: '700',
    color: colors.primaryText,
    marginBottom: normalize(2),
  },
  stepperSubtitle: {
    fontSize: normalize(12),
    color: colors.secondaryText,
  },
  stepperLine: {
    height: normalize(12),
    marginLeft: normalize(12),
    borderLeftWidth: 2,
    borderLeftColor: colors.shadow,
    marginVertical: normalize(8),
  },
  stepCard: {
    flex: 1,
    backgroundColor: colors.lightText,
    borderRadius: normalize(12),
    padding: normalize(12),
    alignItems: 'center',
    elevation: 1,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  stepIcon: {
    fontSize: normalize(18),
    marginBottom: normalize(6),
  },
  stepTitle: {
    fontSize: normalize(14),
    fontWeight: '700',
    color: colors.primaryText,
    marginBottom: normalize(2),
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: normalize(12),
    color: colors.secondaryText,
    textAlign: 'center',
  },
  benefitsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: normalize(8),
    marginBottom: normalize(16),
  },
  benefitChip: {
    backgroundColor: colors.lightText,
    borderRadius: normalize(20),
    paddingVertical: normalize(6),
    paddingHorizontal: normalize(12),
    borderWidth: 1,
    borderColor: colors.shadow,
  },
  benefitText: {
    fontSize: normalize(12),
    color: colors.primaryText,
    fontWeight: '600',
  },
  timelineCard: {
    backgroundColor: colors.lightText,
    borderRadius: normalize(12),
    padding: normalize(16),
    marginBottom: normalize(16),
    elevation: 1,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: normalize(8),
  },
  timelineText: {
    fontSize: normalize(14),
    color: colors.primaryText,
    fontWeight: '600',
  },
  timelineArrow: {
    fontSize: normalize(16),
    color: colors.secondaryText,
    marginHorizontal: normalize(4),
  },
  permissionsContainer: {
    backgroundColor: colors.lightText,
    borderRadius: normalize(12),
    padding: normalize(16),
    marginBottom: normalize(16),
    elevation: 1,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  permissionsTitle: {
    fontSize: normalize(14),
    fontWeight: '700',
    color: colors.primaryText,
    marginBottom: normalize(8),
  },
  permissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: normalize(8),
    borderTopWidth: 1,
    borderTopColor: colors.shadow,
  },
  permissionIcon: {
    fontSize: normalize(16),
    marginRight: normalize(8),
  },
  permissionLabel: {
    flex: 1,
    fontSize: normalize(14),
    color: colors.primaryText,
    marginLeft: normalize(8),
  },
  permissionStatus: {
    fontSize: normalize(12),
    color: colors.secondaryText,
    fontWeight: '600',
  },
  primaryCta: {
    backgroundColor: colors.primaryText,
    paddingVertical: normalize(18),
    borderRadius: normalize(24),
    alignItems: 'center',
    elevation: 3,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  primaryCtaText: {
    color: colors.lightText,
    fontSize: normalize(18),
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  primaryCtaSmall: {
    backgroundColor: colors.primaryText,
    paddingVertical: normalize(14),
    borderRadius: normalize(16),
    alignItems: 'center',
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  primaryCtaSmallText: {
    color: colors.lightText,
    fontSize: normalize(16),
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  ctaSubLabel: {
    textAlign: 'center',
    color: colors.primaryText,
    opacity: 0.8,
    marginTop: normalize(8),
    marginBottom: normalize(8),
    fontSize: normalize(12),
    fontWeight: '600',
  },
  secondaryLink: {
    alignItems: 'center',
    paddingVertical: normalize(10),
  },
  secondaryLinkText: {
    color: colors.secondaryText,
    fontSize: normalize(14),
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  stickyCtaBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: normalize(20),
    paddingBottom: normalize(20),
    paddingTop: normalize(12),
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderTopWidth: 1,
    borderTopColor: colors.shadow,
  },
  stickyCtaButton: {
    backgroundColor: colors.primary,
    paddingVertical: normalize(16),
    borderRadius: normalize(16),
    alignItems: 'center',
  },
  stickyCtaText: {
    color: colors.lightText,
    fontSize: normalize(16),
    fontWeight: '700',
  },
  challengesContainer: {
    flex: 1,
    gap: normalize(20),
  },
  challengeCard: {
    backgroundColor: colors.lightText,
    borderRadius: normalize(20),
    padding: normalize(24),
    borderWidth: 0,
    elevation: 8,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    minHeight: normalize(140),
  },
  challengeCardSelected: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  challengeCardHeader: {
    marginBottom: normalize(12),
  },
  challengeTagline: {
    fontSize: normalize(14),
    fontWeight: '600',
    color: colors.primary,
    marginBottom: normalize(4),
    textTransform: 'uppercase',
    letterSpacing: normalize(1),
  },
  challengeTaglineSelected: {
    color: colors.lightText,
  },
  challengeIcon: {
    fontSize: normalize(24),
    marginRight: normalize(12),
  },
  challengeTitle: {
    fontSize: normalize(24),
    fontWeight: '700',
    color: colors.primaryText,
    marginBottom: normalize(8),
  },
  challengeTitleSelected: {
    color: colors.lightText,
  },
  challengeDescription: {
    fontSize: normalize(16),
    color: colors.secondaryText,
    marginBottom: normalize(16),
    lineHeight: normalize(22),
  },
  challengeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    paddingHorizontal: normalize(16),
    paddingVertical: normalize(8),
    borderRadius: normalize(20),
  },
  challengeBadgeText: {
    fontSize: normalize(14),
    color: colors.lightText,
    fontWeight: '600',
  },
  joinButton: {
    backgroundColor: colors.primary,
    paddingVertical: normalize(12),
    paddingHorizontal: normalize(24),
    borderRadius: normalize(12),
    alignItems: 'center',
    marginTop: normalize(16),
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  joinButtonSelected: {
    backgroundColor: colors.lightText,
  },
  joinButtonText: {
    fontSize: normalize(16),
    fontWeight: '600',
    color: colors.lightText,
  },
  joinButtonTextSelected: {
    color: colors.primary,
  },
  instructionSection: {
    marginTop: normalize(32),
    alignItems: 'center',
  },
  instructionText: {
    fontSize: normalize(14),
    color: colors.secondaryText,
    fontStyle: 'italic',
  },
  // Name input screen styles
  nameInputContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: normalize(20),
  },
  nameInputTitle: {
    fontSize: normalize(28),
    fontWeight: '700',
    color: colors.primaryText,
    textAlign: 'center',
    marginBottom: normalize(12),
  },
  nameInputSubtitle: {
    fontSize: normalize(16),
    color: colors.primaryText,
    textAlign: 'center',
    marginBottom: normalize(40),
    lineHeight: normalize(22),
  },
  nameInput: {
    width: '100%',
    backgroundColor: colors.lightText,
    borderRadius: normalize(12),
    paddingHorizontal: normalize(20),
    paddingVertical: normalize(16),
    fontSize: normalize(18),
    color: colors.primaryText,
    borderWidth: 2,
    borderColor: colors.primaryText,
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  nameInputWrapper: {
    width: '100%',
    position: 'relative',
  },
  nameInputRightIcon: {
    position: 'absolute',
    right: normalize(14),
    top: normalize(16),
  },
  helperSmallText: {
    marginTop: normalize(8),
    fontSize: normalize(12),
    color: colors.secondaryText,
    textAlign: 'center',
  },
  eyebrowText: {
    textAlign: 'center',
    color: colors.primaryText,
    opacity: 0.8,
    marginBottom: normalize(8),
    fontSize: normalize(12),
    fontWeight: '600',
  },
});

// Onboarding styles
export const onboardingStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.lightText, // Pure white background
  },
  gradientContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: normalize(20),
    paddingTop: normalize(20),
    paddingBottom: normalize(20),
  },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: normalize(40),
    gap: normalize(16),
    paddingTop: normalize(8),
    paddingHorizontal: normalize(4),
  },
  
  backButton: {
    backgroundColor: colors.lightText,
    paddingHorizontal: normalize(16),
    paddingVertical: normalize(8),
    borderRadius: normalize(20),
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: colors.shadow,
  },
  backButtonIcon: {
    fontSize: normalize(14),
    color: colors.primaryText,
    fontWeight: '600',
  },
  
  progressContainer: {
    flex: 1,
    marginLeft: normalize(8),
  },
  
  progressBar: {
    height: normalize(4),
    backgroundColor: colors.background,
    borderRadius: normalize(2),
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: colors.shadow,
  },
  
  progressFill: {
    height: '100%',
    backgroundColor: colors.primaryText,
    borderRadius: normalize(2),
  },
  
  questionContainer: {
    marginBottom: normalize(20),
  },
  
  title: {
    fontSize: normalize(24),
    fontWeight: '700',
    color: colors.primaryText,
    textAlign: 'center',
    marginBottom: normalize(8),
  },
  
  subtitle: {
    fontSize: normalize(16),
    color: colors.secondaryText,
    textAlign: 'center',
  },
  
  optionsContainer: {
    flex: 1,
    gap: normalize(12),
    justifyContent: 'center',
    marginBottom: normalize(40),
  },
  
  optionCard: {
    backgroundColor: colors.background,
    borderRadius: normalize(12),
    padding: normalize(10),
    borderWidth: 1,
    borderColor: colors.shadow,
    elevation: 0,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    minHeight: normalize(50),
  },
  
  optionCardSelected: {
    backgroundColor: colors.primaryText,
    borderColor: colors.primaryText,
  },
  
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(16),
  },
  
  optionIcon: {
    fontSize: normalize(18),
    width: normalize(40),
    textAlign: 'center',
    color: colors.primaryText,
    fontWeight: 'bold',
    lineHeight: normalize(16),
  },
  
  optionTextContainer: {
    flex: 1,
    paddingVertical: normalize(4),
  },
  
  optionTitle: {
    fontSize: normalize(18),
    color: colors.primaryText,
    fontWeight: '600',
    marginBottom: normalize(4),
    letterSpacing: -0.2,
  },
  
  optionTitleSelected: {
    color: colors.lightText,
  },
  
  optionSubtitle: {
    fontSize: normalize(16),
    color: colors.secondaryText,
    lineHeight: normalize(22),
    fontWeight: '400',
  },
  
  optionSubtitleSelected: {
    color: colors.lightText,
    opacity: 0.9,
  },
  
  buttonContainer: {
    marginTop: normalize(32),
    paddingHorizontal: normalize(4),
  },
  
  nextButton: {
    backgroundColor: colors.background,
    paddingVertical: normalize(18),
    borderRadius: normalize(12),
    alignItems: 'center',
    minHeight: normalize(56),
    elevation: 0,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    borderWidth: 1,
    borderColor: colors.shadow,
  },
  
  nextButtonText: {
    color: colors.secondaryText,
    fontSize: normalize(18),
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  
  nextButtonDisabled: {
    backgroundColor: colors.background,
    elevation: 0,
    shadowOpacity: 0,
  },
  
  nextButtonDisabledText: {
    color: colors.secondaryText,
  },
  backButtonBottom: {
    backgroundColor: colors.background,
    paddingVertical: normalize(12),
    paddingHorizontal: normalize(24),
    borderRadius: normalize(12),
    alignItems: 'center',
    marginTop: normalize(12),
    borderWidth: 1,
    borderColor: colors.shadow,
  },
  backButtonBottomText: {
    fontSize: normalize(16),
    fontWeight: '600',
    color: colors.primaryText,
  },
  // Alarm setting styles
  alarmStyles: {
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    
    header: {
      backgroundColor: colors.cardBackground,
      padding: normalize(16),
      flexDirection: 'row',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: colors.shadow,
    },
    
    backButton: {
      padding: normalize(8),
      marginRight: normalize(8),
    },
    
    backButtonText: {
      fontSize: normalize(16),
      color: colors.primary,
      fontWeight: '600',
    },
    
    headerTitle: {
      fontSize: normalize(18),
      fontWeight: '600',
      color: colors.primaryText,
      flex: 1,
    },
    
    content: {
      flex: 1,
      padding: normalize(16),
    },
    
    timePickerContainer: {
      alignItems: 'center',
      marginVertical: normalize(32),
    },
    
    timePicker: {
      width: normalize(200),
      height: normalize(200),
    },
    
    timeDisplay: {
      fontSize: normalize(48),
      fontWeight: 'bold',
      color: colors.primaryText,
      marginBottom: normalize(16),
    },
    
    repeatDaysContainer: {
      marginTop: normalize(24),
    },
    
    repeatDaysTitle: {
      fontSize: normalize(16),
      fontWeight: '600',
      color: colors.primaryText,
      marginBottom: normalize(12),
    },
    
    repeatDaysRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: normalize(8),
    },
    
    dayButton: {
      flex: 1,
      paddingVertical: normalize(8),
      paddingHorizontal: normalize(4),
      marginHorizontal: normalize(2),
      borderRadius: normalize(8),
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.shadow,
    },
    
    dayButtonSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    
    dayButtonText: {
      fontSize: normalize(12),
      fontWeight: '500',
      color: colors.primaryText,
    },
    
    dayButtonTextSelected: {
      color: colors.lightText,
    },
    
    buttonContainer: {
      marginTop: normalize(32),
    },
    
    setAlarmButton: {
      backgroundColor: colors.primary,
      paddingVertical: normalize(16),
      borderRadius: normalize(8),
      alignItems: 'center',
    },
    
    setAlarmButtonText: {
      color: colors.lightText,
      fontSize: normalize(18),
      fontWeight: '600',
    },
  },
  // Settings styles
  settingsStyles: {
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    
    header: {
      backgroundColor: colors.cardBackground,
      padding: normalize(16),
      flexDirection: 'row',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: colors.shadow,
    },
    
    backButton: {
      padding: normalize(8),
      marginRight: normalize(8),
    },
    
    backButtonText: {
      fontSize: normalize(16),
      color: colors.primary,
      fontWeight: '600',
    },
    
    headerTitle: {
      fontSize: normalize(18),
      fontWeight: '600',
      color: colors.primaryText,
      flex: 1,
    },
    
    content: {
      flex: 1,
      padding: normalize(16),
    },
    
    section: {
      marginBottom: normalize(24),
    },
    
    sectionTitle: {
      fontSize: normalize(16),
      fontWeight: '600',
      color: colors.primaryText,
      marginBottom: normalize(12),
    },
    
    settingItem: {
      backgroundColor: colors.cardBackground,
      padding: normalize(16),
      borderRadius: normalize(8),
      marginBottom: normalize(8),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    
    settingLabel: {
      fontSize: normalize(16),
      color: colors.primaryText,
      fontWeight: '500',
    },
    
    settingValue: {
      fontSize: normalize(14),
      color: colors.secondaryText,
    },
    
    clearButton: {
      backgroundColor: colors.error,
      paddingVertical: normalize(12),
      paddingHorizontal: normalize(24),
      borderRadius: normalize(8),
      alignItems: 'center',
    },
    
    clearButtonText: {
      color: colors.lightText,
      fontSize: normalize(16),
      fontWeight: '600',
    },
  },
  // Time selection screen styles
  timeSelectionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: normalize(20),
  },
  timeSelectionTitle: {
    fontSize: normalize(28),
    fontWeight: '700',
    color: colors.primaryText,
    textAlign: 'center',
    marginBottom: normalize(12),
  },
  timeSelectionSubtitle: {
    fontSize: normalize(16),
    color: colors.secondaryText,
    textAlign: 'center',
    marginBottom: normalize(40),
    lineHeight: normalize(22),
  },
  timeOptionsContainer: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: normalize(24),
  },
  timeOptionCard: {
    backgroundColor: colors.lightText,
    borderRadius: normalize(12),
    paddingHorizontal: normalize(20),
    paddingVertical: normalize(16),
    borderWidth: 2,
    borderColor: colors.shadow,
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    minWidth: normalize(140),
    alignItems: 'center',
  },
  timeOptionCardSelected: {
    borderColor: colors.primaryText,
    backgroundColor: colors.primaryText,
  },
  timeOptionText: {
    fontSize: normalize(18),
    fontWeight: '600',
    color: colors.primaryText,
  },
  timeOptionTextSelected: {
    color: colors.lightText,
  },
  helperTextContainer: {
    alignItems: 'center',
    marginBottom: normalize(32),
  },
  helperText: {
    fontSize: normalize(14),
    color: colors.secondaryText,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
