import { createStackNavigator } from '@react-navigation/stack';
import 'expo-router/entry';
import App from './app';
import LoginScreen from './screens/LoginScreen';
import PasswordCodeScreen from './screens/PasswordCodeScreen';
import RegisterScreen from './screens/RegisterScreen';
const Stack = createStackNavigator();

export default function RootLayout() {
  return (
    <Stack.Navigator initialRouteName="PasswordCode">
      <Stack.Screen name="app" component={App} options={{ headerShown: false }} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="SignUp" component={RegisterScreen} options={{ headerShown: false }} />
       <Stack.Screen name="PasswordCode" component={PasswordCodeScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}
