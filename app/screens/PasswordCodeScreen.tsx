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

const PasswordCodeScreen = () => {
  const [code, setCode] = useState(['', '', '', '']);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const phoneNumber = '+98*******00';

  const handleCodeChange = (text: string, index: number) => {
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    // Auto-focus next input
    if (text && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    // Handle backspace to go to previous input
    if (key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSendAgain = () => {
    // Implement resend code logic here
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
          <Text style={styles.title}>Password Recovery</Text>

          {/* Instructions */}
          <Text style={styles.description}>
            Enter 4-digits code we sent you{'\n'}on your phone number
          </Text>

          {/* Phone Number */}
          <Text style={styles.phoneNumber}>{phoneNumber}</Text>

          {/* Code Input - 4 separate boxes */}
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
                secureTextEntry
              />
            ))}
          </View>

          {/* Send Again Button */}
          <TouchableOpacity
            style={styles.sendAgainButton}
            onPress={handleSendAgain}
          >
            <Text style={styles.sendAgainText}>Send Again</Text>
          </TouchableOpacity>

          {/* Cancel Button */}
          <TouchableOpacity style={styles.cancelButton}>
            <Text style={styles.cancelText}>Cancel</Text>
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
    width: '70%',
    marginBottom: 60,
  },
  codeInput: {
    width: 50,
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    fontSize: 20,
    fontWeight: '600',
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
  sendAgainButton: {
    marginTop: 200,
    width: '80%',
    height: 50,
    backgroundColor: '#ff69b4',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    elevation: 2,
    shadowColor: '#ff69b4',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  sendAgainText: {
   
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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