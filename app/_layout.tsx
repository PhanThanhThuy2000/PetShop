import { createStackNavigator } from '@react-navigation/stack';
import 'expo-router/entry';
import App from './app';
import LoginScreen from './screens/LoginScreen';
import RecoveryPasswordScreen from './screens/RecoveryPasswordScreen';
import RegisterScreen from './screens/RegisterScreen';
const Stack = createStackNavigator();

export default function RootLayout() {
  return (
    <Stack.Navigator initialRouteName="RecoveryPasswordScreen">
      <Stack.Screen name="app" component={App} options={{ headerShown: false }} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="SignUp" component={RegisterScreen} options={{ headerShown: false }} />
      <Stack.Screen name="RecoveryPasswordScreen" component={RecoveryPasswordScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}
