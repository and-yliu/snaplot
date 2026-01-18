/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
  neo: {
    primary: '#A881EA', // Lavender
    secondary: '#FFA6C9', // Soft Pink
    tertiary: '#FCE762', // Soft Yellow
    text: '#000000',
    background: '#FFF8E7', // Beige
    // backgroundGradient: ['#FFF5C2', '#FFC0CB', '#E0B0FF'], // Removed for now
    border: '#000000',
    card: '#FFFFFF',
    shadow: '#000000',
  }
};

export const Fonts = Platform.select({
  ios: {
    sans: 'Nunito_400Regular',
    serif: 'Nunito_600SemiBold',
    rounded: 'Nunito_700Bold',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'Nunito_400Regular',
    serif: 'Nunito_600SemiBold',
    rounded: 'Nunito_700Bold',
    mono: 'monospace',
  },
  web: {
    sans: 'Nunito_400Regular, sans-serif',
    serif: 'Nunito_600SemiBold, serif',
    rounded: 'Nunito_700Bold, sans-serif',
    mono: 'monospace',
  },
});

