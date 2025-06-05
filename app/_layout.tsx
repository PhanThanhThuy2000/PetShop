import { createStackNavigator } from '@react-navigation/stack';
import 'expo-router/entry';
import App from './app';
import LoginScreen from './screens/LoginScreen';
<<<<<<< HEAD
import RecoveryPasswordScreen from './screens/RecoveryPasswordScreen';
=======
import PasswordCodeScreen from './screens/PasswordCodeScreen';
>>>>>>> dd834e02d9a82c4822065a5a0177784b2d6b0989
import RegisterScreen from './screens/RegisterScreen';
const Stack = createStackNavigator();

export default function RootLayout() {
  return (
<<<<<<< HEAD
    <Stack.Navigator initialRouteName="RecoveryPasswordScreen">
      <Stack.Screen name="app" component={App} options={{ headerShown: false }} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="SignUp" component={RegisterScreen} options={{ headerShown: false }} />
      <Stack.Screen name="RecoveryPasswordScreen" component={RecoveryPasswordScreen} options={{ headerShown: false }} />
=======
    <Stack.Navigator initialRouteName="PasswordCode">
      <Stack.Screen name="app" component={App} options={{ headerShown: false }} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="SignUp" component={RegisterScreen} options={{ headerShown: false }} />
       <Stack.Screen name="PasswordCode" component={PasswordCodeScreen} options={{ headerShown: false }} />
>>>>>>> dd834e02d9a82c4822065a5a0177784b2d6b0989
    </Stack.Navigator>
  );
}
