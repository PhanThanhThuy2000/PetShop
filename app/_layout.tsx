import { createStackNavigator } from '@react-navigation/stack';
import 'expo-router/entry';
import App from './app';

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
import SearchScreen from './screens/SearchScreen';
import SettingsScreen from './screens/SettingsScreen';
import VoucherScreen from './screens/VoucherScreen';
import WellcomeScreen from './screens/WellcomeScreen';
// Trí code bên dưới
import ChatScreen from './screens/ChatScreen';
import ShippingAddressScreen from './screens/ShippingAddressScreen';


// Thắng code bên dưới



// Đức Anh code bên dưới


import ListAdressScreen from './screens/ListAdressScreen';
import PetAllScreen from './screens/PetAllScreen';
const Stack = createStackNavigator();
export default function RootLayout() {
  return (
    <Stack.Navigator initialRouteName="ShippingAddress">
      <Stack.Screen name="app" component={App} options={{ headerShown: false }} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="SignUp" component={RegisterScreen} options={{ headerShown: false }} />
      <Stack.Screen name="PasswordCode" component={PasswordCodeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="RecoveryPassword" component={RecoveryPasswordScreen} options={{ headerShown: false }} />
      <Stack.Screen name="NewPassword" component={NewPasswordScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Account" component={AccountScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Voucher" component={VoucherScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ChangePasswor" component={ChangePassword} options={{ headerShown: false }} />
      <Stack.Screen name="Wellcome" component={WellcomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Reviews" component={ReviewsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Cart" component={CartScreen} options={{ headerShown: false }} />
      <Stack.Screen name="About" component={About} options={{ headerShown: false }} />
      <Stack.Screen name="OrderSuccess" component={OrderSuccess} options={{ headerShown: false }} />
      <Stack.Screen name="Language" component={LanguageScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Search" component={SearchScreen} options={{ headerShown: false }} />
      {/* // Trí code bên dưới */}
      <Stack.Screen name="Chat" component={ChatScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ShippingAddress" component={ShippingAddressScreen} options={{ headerShown: false }} />


      {/* // Thắng code bên dưới */}



      {/* // Đức Anh code bên dưới */}


      

      <Stack.Screen name="PetAll" component={PetAllScreen} options={{ headerShown: false }} />
      <Stack.Screen name="ListAdress" component={ListAdressScreen} options={{ headerShown: false }} />

    </Stack.Navigator>
  );
}
