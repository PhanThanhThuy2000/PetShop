import { useNavigation, useRoute } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../../hooks/redux';
import { verifyRegistrationOtp } from '../redux/slices/authSlice';
import api from '../utils/api-client';

const PasswordCodeScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { dispatch, isLoading } = useAuth();
  const { mode = 'register', email = '', next = 'Login', newPassword } = route.params || {};

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const targetLabel = email || '+** hidden **';

  const handleCodeChange = (text: string, index: number) => {
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    // Auto-focus next input
    if (text && index < newCode.length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    // Handle backspace to go to previous input and clear it
    if (key === 'Backspace') {
      if (!code[index] && index > 0) {
        const newCode = [...code];
        newCode[index - 1] = '';
        setCode(newCode);
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handleSendAgain = async () => {
    try {
      if (mode === 'register') {
        // Re-trigger register to resend OTP is not ideal; usually a dedicated resend endpoint.
        // Here we show a message or implement when backend supports resend.
        // noop
      } else if (mode === 'reset' && email) {
        await api.post('/users/forgot-password', { email });
      }
    } catch (_) {}
  };

  const handleConfirm = async () => {
    const otp = code.join('');
    if (!otp || otp.length < 4) {
      return;
    }
    try {
      if (mode === 'register') {
        await dispatch(verifyRegistrationOtp({ email, otp })).unwrap();
        navigation.navigate('app');
      } else if (mode === 'reset') {
        // newPassword must be provided from prior screen
        await api.post('/users/reset-password', { email, otp, newPassword });
        navigation.navigate(next);
      }
    } catch (e) {}
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{
          headerShown: false,
        }} 
      />
      
      <View style={styles.content}>
        {/* Logo/Icon - Made larger and more rounded */}
        <View style={styles.logoContainer}>
          <Image
            source={require('@/assets/images/logo.png')}
            style={styles.logo}
          />
        </View>

        {/* Content below logo */}
        <View style={styles.bottomContent}>
          {/* Title */}
          <Text style={styles.title}>{mode === 'register' ? 'Verify Your Email' : 'Password Recovery'}</Text>

          {/* Instructions */}
          <Text style={styles.description}>
            Enter the code we sent to{mode === 'register' ? ' your email' : ''}
          </Text>

          {/* Phone Number */}
          <Text style={styles.phoneNumber}>{targetLabel}</Text>

          {/* Code Input - 6 separate boxes */}
          <View style={styles.codeContainer}>
            {code.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => { inputRefs.current[index] = ref; }}
                style={styles.codeInput}
                value={digit}
                onChangeText={(text) => handleCodeChange(text, index)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                maxLength={1}
                keyboardType="number-pad"
                textAlign="center"
                autoCapitalize="none"
                autoCorrect={false}
              />
            ))}
          </View>

          {/* Confirm Button */}
          <TouchableOpacity
            style={styles.verifyButton}
            onPress={handleConfirm}
            disabled={isLoading}
          >
            <Text style={styles.verifyText}>Verify</Text>
          </TouchableOpacity>

          {/* Send Again */}
          <TouchableOpacity
            style={styles.sendAgainWrapper}
            onPress={handleSendAgain}
          >
            <Text style={styles.sendAgainText}>Send again</Text>
          </TouchableOpacity>

         
        </View>
      </View>
      
      {/* Home indicator */}
      <View style={styles.homeIndicator} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 100,
    zIndex: 1,
  },
  logoContainer: {
    width: 140, // Increased from 100
    height: 140, // Increased from 100
    borderRadius: 70, // Made fully circular (half of width/height)
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 80,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    zIndex: 2,
  },
  logo: {
    width: 100, // Increased from 70
    height: 100, // Increased from 70
    resizeMode: 'contain',
  },
  bottomContent: {
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 24,
    color: '#333',
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  phoneNumber: {
    fontSize: 16,
    color: '#333',
    marginBottom: 60,
    fontWeight: '500',
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '90%',
    marginBottom: 60,
  },
  codeInput: {
    width: 48,
    height: 56,
    borderWidth: 1.5,
    borderColor: '#cfd4dc',
    borderRadius: 10,
    fontSize: 22,
    fontWeight: '700',
    backgroundColor: '#fff',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  verifyButton: {
    marginTop: 24,
    width: '80%',
    height: 50,
    backgroundColor: '#007AFF',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  verifyText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  sendAgainWrapper: {
    marginTop: 12,
  },
  sendAgainText: {
    color: '#666',
    fontSize: 12,
    fontWeight: '500',
  },
  cancelButton: {
    padding: 12,
  },
  cancelText: {
    color: '#666',
    fontSize: 16,
  },
  homeIndicator: {
    width: 134,
    height: 5,
    backgroundColor: '#000',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 8,
  },
});

export default PasswordCodeScreen;