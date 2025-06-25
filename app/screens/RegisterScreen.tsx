import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import CountryPicker from 'react-native-country-picker-modal';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerContainer}>
          <Text style={styles.title}>SignUp</Text>
          <Image
            source={require('@/assets/images/signup.png')}
            style={styles.illustration}
          />
        </View>

        <View style={styles.formContainer}>
          <TextInput
            style={styles.input}
            placeholder="Name"
            placeholderTextColor="#C0C0C0"
          />

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#C0C0C0"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <View style={styles.passwordWrapper}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Password"
              placeholderTextColor="#C0C0C0"
              secureTextEntry
            />
            <Icon name="eye-off" size={20} color="#C0C0C0" />
          </View>

          <View style={styles.phoneWrapper}>
            <View style={styles.countryButton}>
              <CountryPicker
                countryCode="GB"
                withFilter
                withFlag
                withCallingCode
                withAlphaFilter
                onSelect={() => {}}
                visible={false}
              />
              <Text style={styles.countryText}>GB (+44)</Text>
              <Icon name="chevron-down" size={16} color="#C0C0C0" style={{ marginLeft: 4 }} />
            </View>
            <TextInput
              style={styles.phoneInput}
              placeholder="Your number"
              placeholderTextColor="#C0C0C0"
              keyboardType="phone-pad"
            />
          </View>

          <TouchableOpacity style={styles.buttonPrimary}>
            <Text style={styles.buttonPrimaryText}>Next</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.cancelContainer} 
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default RegisterScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flexGrow: 1,
  },

  headerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 40,
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#000000',
  },
  illustration: {
    width: 250,
    height: 250,
    resizeMode: 'contain',
  },

  formContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 70,
  },
  input: {
    height: 48,
    backgroundColor: '#F2F2F2',
    borderRadius: 24,
    paddingHorizontal: 20,
    fontSize: 18,
    fontWeight: '500',
    color: '#000000',
    marginTop: 16,
  },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F2',
    borderRadius: 24,
    height: 48,
    paddingHorizontal: 20,
    marginTop: 16,
  },
  passwordInput: {
    flex: 1,
    fontSize: 18,
    color: '#000000',
  },
  phoneWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F2',
    borderRadius: 24,
    height: 48,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  countryButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countryText: {
    fontSize: 16,
    color: '#000000',
    marginLeft: 6,
  },
  phoneInput: {
    flex: 1,
    fontSize: 18,
    color: '#000000',
    marginLeft: 10,
    fontWeight: '500'
  },

  buttonPrimary: {
    height: 50,
    backgroundColor: '#0066FF',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
  },
  buttonPrimaryText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },

  cancelContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 18,
    color: '#000000',
    fontWeight: '600'
  },
});