import { createStackNavigator } from '@react-navigation/stack';
import 'expo-router/entry';
import App from './app';
import LoginScreen from './screens/LoginScreen';
import NewPasswordScreen from './screens/NewPasswordScreen';
import PasswordCodeScreen from './screens/PasswordCodeScreen';
import RecoveryPasswordScreen from './screens/RecoveryPasswordScreen';
import RegisterScreen from './screens/RegisterScreen';
import SettingsScreen from './screens/SettingsScreen';
const Stack = createStackNavigator();

export default function RootLayout() {
  return (
    <Stack.Navigator initialRouteName="SettingsScreen">
      <Stack.Screen name="app" component={App} options={{ headerShown: false }} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="SignUp" component={RegisterScreen} options={{ headerShown: false }} />
      <Stack.Screen name="PasswordCode" component={PasswordCodeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="RecoveryPasswordScreen" component={RecoveryPasswordScreen} options={{ headerShown: false }} />
      <Stack.Screen name="NewPassword" component={NewPasswordScreen} options={{ headerShown: false }} />
      <Stack.Screen name="SettingsScreen" component={SettingsScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}
