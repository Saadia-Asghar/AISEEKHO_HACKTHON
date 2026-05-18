import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import ResultsScreen from '../screens/ResultsScreen';
import TraceScreen from '../screens/TraceScreen';
import ReceiptScreen from '../screens/ReceiptScreen';
import RateScreen from '../screens/RateScreen';
import PaymentScreen from '../screens/PaymentScreen';
import { colors } from '../constants/theme';

export type HomeStackParamList = {
  Home: undefined;
  Results: undefined;
  Rate: undefined;
  Trace: undefined;
  Receipt: undefined;
};

const Stack = createNativeStackNavigator<HomeStackParamList>();

export default function HomeStackNavigator() {
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
      <Stack.Screen name="Payment" component={PaymentScreen} options={{ title: 'Pay & confirm' }} />
      <Stack.Screen name="Rate" component={RateScreen} options={{ title: 'Rate your worker' }} />
      <Stack.Screen name="Trace" component={TraceScreen} options={{ title: 'Agent Trace' }} />
      <Stack.Screen name="Receipt" component={ReceiptScreen} options={{ title: 'Receipt' }} />
    </Stack.Navigator>
  );
}
