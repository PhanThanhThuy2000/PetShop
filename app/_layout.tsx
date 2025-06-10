import { createStackNavigator } from '@react-navigation/stack';
import 'expo-router/entry';
import App from './app';
import About from './screens/About';
import AccountScreen from './screens/AccountScreen';
import CartScreen from './screens/CartScreen';
import ChangePassword from './screens/ChangePassword';
import LoginScreen from './screens/LoginScreen';
import NewPasswordScreen from './screens/NewPasswordScreen';
import OrderSuccess from './screens/OrderSuccess';
import PasswordCodeScreen from './screens/PasswordCodeScreen';
import RecoveryPasswordScreen from './screens/RecoveryPasswordScreen';
import RegisterScreen from './screens/RegisterScreen';
import ReviewsScreen from './screens/ReviewsScreen';
import SettingsScreen from './screens/SettingsScreen';
import VoucherScreen from './screens/VoucherScreen';
import WellcomeScreen from './screens/WellcomeScreen';
const Stack = createStackNavigator();
export default function RootLayout() {
  return (
    <Stack.Navigator initialRouteName="Cart">
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
    </Stack.Navigator>
  );
}
