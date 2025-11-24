import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper'

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#7B2CBF', // Purple (karate theme)
    secondary: '#6366F1',
    tertiary: '#8B5CF6',
    error: '#F59E0B', // Amber for errors
    background: '#FFFFFF',
    surface: '#F5F5F5',
  },
}

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#7B2CBF',
    secondary: '#6366F1',
    tertiary: '#8B5CF6',
  },
}



