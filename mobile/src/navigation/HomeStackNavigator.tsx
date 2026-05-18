import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import ResultsScreen from '../screens/ResultsScreen';
import BookingConfirmScreen from '../screens/BookingConfirmScreen';
import TraceScreen from '../screens/TraceScreen';
import { useTheme } from '../hooks/useTheme';

export type HomeStackParamList = {
  Home: undefined;
  Results: undefined;
  BookingConfirm: undefined;
  AgentTrace: undefined;
};

const Stack = createNativeStackNavigator<HomeStackParamList>();

export default function HomeStackNavigator() {
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Results" component={ResultsScreen} options={{ title: 'Providers' }} />
      <Stack.Screen name="BookingConfirm" component={BookingConfirmScreen} options={{ title: 'Confirmed', headerShown: false }} />
      <Stack.Screen name="AgentTrace" component={TraceScreen} options={{ title: 'Agent trace' }} />
    </Stack.Navigator>
  );
}
