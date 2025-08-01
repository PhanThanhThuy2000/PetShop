// app/navigation/ChatNavigator.tsx
import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import CustomerSupportChatScreen from '../screens/CustomerSupportChatScreen2';

export type ChatStackParamList = {
  CustomerSupport: undefined;
};

const Stack = createStackNavigator<ChatStackParamList>();

const ChatNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false, // Vì screen đã có header riêng
      }}
    >
      <Stack.Screen 
        name="CustomerSupport" 
        component={CustomerSupportChatScreen}
        options={{
          title: 'Hỗ trợ khách hàng',
        }}
      />
    </Stack.Navigator>
  );
};

export default ChatNavigator;
