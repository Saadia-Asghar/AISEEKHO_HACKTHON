import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider, MD3LightTheme } from 'react-native-paper';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppNavigator from './src/navigation/AppNavigator';
import { colors } from './src/constants/colors';
import { useAppStore } from './src/store/appStore';

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.brandPrimary,
    secondary: colors.brandSecondary,
    error: colors.brandError,
    background: colors.surfaceBg,
    surface: '#fff'
  },
};

export default function App() {
  const setUserLocation = useAppStore(state => state.setUserLocation);

  useEffect(() => {
    async function setupApp() {
      // Init notifications
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      // Load last location
      try {
        const storedLoc = await AsyncStorage.getItem('userLocation');
        if (storedLoc) {
          setUserLocation(JSON.parse(storedLoc));
        } else {
          // Default to Islamabad center
          setUserLocation({ lat: 33.6844, lng: 73.0479 });
        }
      } catch (e) {
        // Fallback
        setUserLocation({ lat: 33.6844, lng: 73.0479 });
      }
    }
    
    setupApp();
  }, []);

  return (
    <PaperProvider theme={theme}>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </PaperProvider>
  );
}
