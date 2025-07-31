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
import AddReviewScreen from './screens/AddReviewScreen';
import AppointmentDetailScreen from './screens/AppointmentDetailScreen';
import AppointmentListScreen from './screens/AppointmentListScreen';
import BreedsScreen from './screens/BreedsScreen';
import CartScreen from './screens/CartScreen';
import ChangePassword from './screens/ChangePassword';
import ChatScreen from './screens/ChatScreen';
import EditAdressScreen from './screens/EditAdressScreen';
import EditInfomationScreen from './screens/EditInfomationScreen';
import FavouriteScreen from './screens/FavouriteScreen';
import HistoryScreen from './screens/HistoryScreen';
import LanguageScreen from './screens/LanguageScreen';
import ListAdressScreen from './screens/ListAdressScreen';
import LoginScreen from './screens/LoginScreen';
import NewPasswordScreen from './screens/NewPasswordScreen';
import OrderDetailScreen from './screens/OrderDetailScreen';
import OrderSuccess from './screens/OrderSuccessScreen';
import PasswordCodeScreen from './screens/PasswordCodeScreen';
import PaymentScreen from './screens/PaymentScreen';
import PetAllScreen from './screens/PetAllScreen';
import PetCareBookingScreen from './screens/PetCareBookingScreen';
import PetsByBreedScreen from './screens/PetsByBreedScreen';
import ProductAllScreen from './screens/ProductAllScreen';
import ProductDetailScreen from './screens/ProductDetailScreen';
import PushNotificationScreen from './screens/PushNotificationScreen';
import RecoveryPasswordScreen from './screens/RecoveryPasswordScreen';
import RegisterScreen from './screens/RegisterScreen';
import ReviewsScreen from './screens/ReviewsScreen';
import SearchScreen from './screens/SearchScreen';
import SettingsScreen from './screens/SettingsScreen';
import ShippingAddressScreen from './screens/ShippingAddressScreen';
import UniversalSearchScreen from './screens/UniversalSearchScreen';
import VoucherScreen from './screens/VoucherScreen';
import WellcomeScreen from './screens/WellcomeScreen';
import ppointmentHistoryScreen from './screens/ppointmentHistoryScreen';

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
    <Stack.Navigator initialRouteName="Wellcome">
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

      {/* Push Notifications screen */}
      <Stack.Screen
        name="PushNotifications"
        component={PushNotificationScreen}
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
        name="ListAddress"
        component={ListAdressScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="EditAdress"
        component={EditAdressScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ProductAll"
        component={ProductAllScreen}
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

      <Stack.Screen
        name="UniversalSearch"
        component={UniversalSearchScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="OrderDetail"
        component={OrderDetailScreen}
        options={{ headerShown: false }}
      />
         <Stack.Screen
        name="AddReviewScreen"
        component={AddReviewScreen}
         />
      <Stack.Screen
        name="PetsByBreed"
        component={PetsByBreedScreen}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="PetCareBooking"
        component={PetCareBookingScreen}
        options={{ headerShown: false }}  
      />

      <Stack.Screen
        name="AppointmentHistory"
        component={ppointmentHistoryScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AppointmentDetail"
        component={AppointmentDetailScreen}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="AppointmentList"
        component={AppointmentListScreen}
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