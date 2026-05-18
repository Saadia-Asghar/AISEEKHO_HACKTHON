import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import ResultsScreen from '../screens/ResultsScreen';
import TraceScreen from '../screens/TraceScreen';
import ReceiptScreen from '../screens/ReceiptScreen';
import { colors } from '../constants/theme';

export type RootStackParamList = {
  Home: undefined;
  Results: undefined;
  Trace: undefined;
  Receipt: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
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
      <Stack.Screen name="Results" component={ResultsScreen} options={{ title: 'Booking Result' }} />
      <Stack.Screen name="Trace" component={TraceScreen} options={{ title: 'Agent Trace' }} />
      <Stack.Screen name="Receipt" component={ReceiptScreen} options={{ title: 'Receipt' }} />
    </Stack.Navigator>
  );
}
