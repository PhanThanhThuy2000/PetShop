import { createStackNavigator } from '@react-navigation/stack';
import 'expo-router/entry';
import React from 'react';
import App from './app';
import LoginScreen from './screens/LoginScreen';
import SignUpScreen from './screens/RegisterScreen';
const Stack = createStackNavigator();

export default function RootLayout() {
  return (
    <Stack.Navigator initialRouteName="app">
      <Stack.Screen name="app" component={App} options={{ headerShown: false }} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="SignUp" component={SignUpScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}
