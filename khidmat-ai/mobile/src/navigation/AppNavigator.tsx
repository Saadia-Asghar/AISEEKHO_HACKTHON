import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/HomeScreen';
import AgentTraceScreen from '../screens/AgentTraceScreen';
import ProviderResultsScreen from '../screens/ProviderResultsScreen';
import BookingReceiptScreen from '../screens/BookingReceiptScreen';
import { colors } from '../constants/colors';

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.brandPrimary },
        headerTintColor: '#fff',
        cardStyle: { backgroundColor: colors.surfaceBg }
      }}
    >
      <Stack.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="AgentTrace" 
        component={AgentTraceScreen} 
        options={{ title: 'Agent Reasoning' }} 
      />
      <Stack.Screen 
        name="ProviderResults" 
        component={ProviderResultsScreen} 
        options={{ title: 'Nearby Providers' }} 
      />
      <Stack.Screen 
        name="BookingReceipt" 
        component={BookingReceiptScreen} 
        options={{ title: 'Booking Confirmed ✓' }} 
      />
    </Stack.Navigator>
  );
}
