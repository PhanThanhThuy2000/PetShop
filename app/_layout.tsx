import { createStackNavigator } from '@react-navigation/stack';
import 'expo-router/entry';
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';

// Redux store
import { loadTokenFromStorage } from './redux/slices/authSlice';
import { persistor, store } from './redux/store';

// Main 
import App from './app';

// Import all screens
import About from './screens/AboutScreen';
import AccountScreen from './screens/AccountScreen';
import CartScreen from './screens/CartScreen';
import ChangePassword from './screens/ChangePassword';
import LanguageScreen from './screens/LanguageScreen';
import LoginScreen from './screens/LoginScreen';
import NewPasswordScreen from './screens/NewPasswordScreen';
import OrderSuccess from './screens/OrderSuccessScreen';
import PasswordCodeScreen from './screens/PasswordCodeScreen';
import ProductDetailScreen from './screens/ProductDetailScreen';
import RecoveryPasswordScreen from './screens/RecoveryPasswordScreen';
import RegisterScreen from './screens/RegisterScreen';
import ReviewsScreen from './screens/ReviewsScreen';
import SettingsScreen from './screens/SettingsScreen';
import VoucherScreen from './screens/VoucherScreen';
import WellcomeScreen from './screens/WellcomeScreen';

// Trí code screens
import ChatScreen from './screens/ChatScreen';
import ShippingAddressScreen from './screens/ShippingAddressScreen';

// Thắng code screens
import BreedsScreen from './screens/BreedsScreen';
import DeletingAccountScreen from './screens/DeletingAccountScreen';
import SearchScreen from './screens/SearchScreen';

// Đức Anh code screens
import EditInfomationScreen from './screens/EditInfomationScreen';
import FavouriteScreen from './screens/FavouriteScreen';
import HistoryScreen from './screens/HistoryScreen';
import ListAdressScreen from './screens/ListAdressScreen';
import PaymentScreen from './screens/PaymentScreen';
import PetAllScreen from './screens/PetAllScreen';


const Stack = createStackNavigator();

const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#004CFF" />
    <Text style={styles.loadingText}>Loading PetShop...</Text>
  </View>
);

const AppNavigator = () => {
  useEffect(() => {
    store.dispatch(loadTokenFromStorage());
  }, []);

  return (
    <Stack.Navigator initialRouteName="Settings">
      {/* Main app with bottom tabs */}
      <Stack.Screen 
        name="app" 
        component={App} 
        options={{ headerShown: false }} 
      />
      
      {/* Authentication screens */}
      <Stack.Screen 
        name="Login" 
        component={LoginScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="SignUp" 
        component={RegisterScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="PasswordCode" 
        component={PasswordCodeScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="RecoveryPassword" 
        component={RecoveryPasswordScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="NewPassword" 
        component={NewPasswordScreen} 
        options={{ headerShown: false }} 
      />
      
      {/* Welcome screen */}
      <Stack.Screen 
        name="Wellcome" 
        component={WellcomeScreen} 
        options={{ headerShown: false }} 
      />
      
      {/* Account & Settings screens */}
      <Stack.Screen 
        name="Account" 
        component={AccountScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="ChangePassword" 
        component={ChangePassword} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="Language" 
        component={LanguageScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="About" 
        component={About} 
        options={{ headerShown: false }} 
      />
      
      {/* Shopping & Cart screens */}
      <Stack.Screen 
        name="Cart" 
        component={CartScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="ProductDetail" 
        component={ProductDetailScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="Reviews" 
        component={ReviewsScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="Voucher" 
        component={VoucherScreen} 
        options={{ headerShown: false }} 
      />
      
      {/* Order & Payment screens */}
      <Stack.Screen 
        name="Payment" 
        component={PaymentScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="OrderSuccess" 
        component={OrderSuccess} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="ShippingAddress" 
        component={ShippingAddressScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="ListAdress" 
        component={ListAdressScreen} 
        options={{ headerShown: false }} 
      />
      
      {/* Pet & Product screens */}
      <Stack.Screen 
        name="PetAll" 
        component={PetAllScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="Breeds" 
        component={BreedsScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="Search" 
        component={SearchScreen} 
        options={{ headerShown: false }} 
      />
      
      {/* Communication screens */}
      <Stack.Screen 
        name="Chat" 
        component={ChatScreen} 
        options={{ headerShown: false }} 
      />
      {/* Test Delete Account screen */}
      <Stack.Screen
        name="DeleteTest"
        component={DeletingAccountScreen}
        options={{ headerShown: true, title: 'Delete Account' }}
      />
      <Stack.Screen 
        name="Favourite" 
        component={FavouriteScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="History" 
        component={HistoryScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="EditInfomation" 
        component={EditInfomationScreen} 
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

export default function RootLayout() {
  return (
    <Provider store={store}>
      <PersistGate 
        loading={<LoadingScreen />} 
        persistor={persistor}
      >
        <AppNavigator />
      </PersistGate>
    </Provider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
    fontWeight: '500',
  },
});