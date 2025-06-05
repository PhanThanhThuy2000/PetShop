import { createStackNavigator } from '@react-navigation/stack';
import 'expo-router/entry';
import React from 'react';
import App from './app';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
const Stack = createStackNavigator();

export default function RootLayout() {
  return (
    <Stack.Navigator initialRouteName="SignUp">
      <Stack.Screen name="app" component={App} options={{ headerShown: false }} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="SignUp" component={RegisterScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}
