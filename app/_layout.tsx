import { createStackNavigator } from '@react-navigation/stack';
import 'expo-router/entry';
import App from './app';
import AccountScreen from './screens/AccountScreen';
import LoginScreen from './screens/LoginScreen';
import NewPasswordScreen from './screens/NewPasswordScreen';
import PasswordCodeScreen from './screens/PasswordCodeScreen';
import RecoveryPasswordScreen from './screens/RecoveryPasswordScreen';
import RegisterScreen from './screens/RegisterScreen';
const Stack = createStackNavigator();

export default function RootLayout() {
  return (
    <Stack.Navigator initialRouteName="AccountScreen">
      <Stack.Screen name="app" component={App} options={{ headerShown: false }} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="SignUp" component={RegisterScreen} options={{ headerShown: false }} />
      <Stack.Screen name="PasswordCode" component={PasswordCodeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="RecoveryPasswordScreen" component={RecoveryPasswordScreen} options={{ headerShown: false }} />
      <Stack.Screen name="NewPassword" component={NewPasswordScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Account" component={AccountScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}
