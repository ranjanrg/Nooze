# Nooze App - Organized File Structure

This directory contains the organized source code for the Nooze React Native app.

## 📁 Directory Structure

```
src/
├── components/          # React components
│   ├── HomeScreen.tsx   # Main home screen with challenge cards
│   ├── OnboardingScreen.tsx # Onboarding flow screens
│   ├── AlarmScreen.tsx  # Alarm setting screen
│   ├── SettingsScreen.tsx # Settings screen
│   └── index.ts         # Component exports
├── hooks/               # Custom React hooks
│   ├── useAlarms.ts     # Alarm state management
│   ├── useChallenge.ts  # Challenge state management
│   └── index.ts         # Hook exports
├── services/            # Business logic services
│   ├── AlarmService.ts  # Alarm CRUD operations
│   ├── ChallengeService.ts # Challenge management
│   └── index.ts         # Service exports
├── styles/              # Styling and theming
│   └── index.ts         # All styles and design system
├── types/               # TypeScript type definitions
│   └── index.ts         # All interfaces and types
└── README.md           # This file
```

## 🧩 Components

### HomeScreen
- Displays active challenge progress
- Shows motivation card
- Lists active alarms
- Floating action button for new alarms

### OnboardingScreen
- Handles all onboarding flow screens
- Question-based interface
- Dynamic content based on current screen
- Progress tracking through onboarding

### AlarmScreen
- Time picker for alarm setting
- Repeat day selection
- Alarm scheduling interface

### SettingsScreen
- App settings and configuration
- Alarm management
- Challenge statistics

## 🎣 Custom Hooks

### useAlarms
- Manages alarm state
- CRUD operations for alarms
- Loading states and error handling

### useChallenge
- Manages challenge state
- Challenge progress tracking
- Onboarding data management

## 🔧 Services

### AlarmService
- Singleton service for alarm operations
- AsyncStorage integration
- Alarm CRUD operations

### ChallengeService
- Challenge lifecycle management
- Progress calculations
- Onboarding data persistence

## 🎨 Styling

### Design System
- Consistent color palette
- Responsive sizing with `normalize()`
- Component-specific style sheets
- Common styles for reusability

### Color Palette
- **Primary**: Sunrise Orange (`#FFB347`)
- **Secondary**: Muted Blue (`#4A90E2`)
- **Accent**: Sage Green (`#88B04B`)
- **Background**: Off-White (`#FAFAFA`)
- **Text**: Slate Gray (`#3C3C3C`)

## 📝 Types

### Core Interfaces
- `Alarm`: Alarm data structure
- `Challenge`: Challenge data structure
- `OnboardingData`: Onboarding flow data
- `ScreenType`: Navigation screen types

## 🚀 Usage

### Importing Components
```typescript
import { HomeScreen, OnboardingScreen } from './src/components';
```

### Using Hooks
```typescript
import { useAlarms, useChallenge } from './src/hooks';
```

### Using Services
```typescript
import { AlarmService, ChallengeService } from './src/services';
```

## 🔄 Benefits of This Structure

1. **Separation of Concerns**: Each file has a single responsibility
2. **Reusability**: Components and hooks can be easily reused
3. **Maintainability**: Easy to find and modify specific functionality
4. **Scalability**: Easy to add new features and components
5. **Type Safety**: Full TypeScript support with proper interfaces
6. **Testing**: Isolated components and services are easier to test

## 📱 App Features

- **365 Days Wake-Up Challenge**: Long-term habit building
- **Math Problem Dismissal**: Prevents easy alarm dismissal
- **Progress Tracking**: Visual progress indicators
- **Motivational Content**: Daily inspiration quotes
- **Flexible Alarm Scheduling**: Custom times and repeat patterns
- **Settings Management**: App configuration and data management
