import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import api from '../utils/api-client';

const RecoveryPasswordScreen = () => {
  const [selectedMethod, setSelectedMethod] = useState('Email');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const navigation = useNavigation<any>();

  return (
    <View style={styles.container}>
      {/* Image container with rounded circle background */}
      <View style={styles.imageContainer}>
        <Image
          source={require('../../assets/images/imageDog.png')}
          style={styles.image}
        />
      </View>
      
      <Text style={styles.title}>Password Recovery</Text>
      <Text style={styles.subtitle}>
        How you would like to restore{'\n'}your password?
      </Text>

      {/* SMS Option */}
      <TouchableOpacity
        style={[
          styles.option,
          selectedMethod === 'SMS' && styles.optionSelectedSMS,
        ]}
        onPress={() => setSelectedMethod('SMS')}
      >
        <Text style={[styles.optionText, selectedMethod === 'SMS' && styles.selectedText]}>
          SMS
        </Text>
        <View style={[
          styles.radioButton,
          selectedMethod === 'SMS' && styles.radioButtonSelected
        ]}>
          {selectedMethod === 'SMS' && (
            <Icon name="check" size={16} color="#FFF" />
          )}
        </View>
      </TouchableOpacity>

      {/* Email Option */}
      <TouchableOpacity
        style={[
          styles.option,
          selectedMethod === 'Email' && styles.optionSelectedEmail,
        ]}
        onPress={() => setSelectedMethod('Email')}
      >
        <Text style={[styles.optionText, selectedMethod === 'Email' && styles.selectedText]}>
          Email
        </Text>
        <View style={[
          styles.radioButton,
          selectedMethod === 'Email' && styles.radioButtonSelectedEmail
        ]}>
          {selectedMethod === 'Email' && (
            <View style={styles.pinkDot} />
          )}
        </View>
      </TouchableOpacity>

      {/* Email Input and New Password */}
      <View style={{ width: '100%', marginTop: 12 }}>
        <TextInput
          placeholder="Enter your email"
          placeholderTextColor="#999"
          style={styles.textInput}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          placeholder="New password"
          placeholderTextColor="#999"
          style={styles.textInput}
          secureTextEntry
          value={newPassword}
          onChangeText={setNewPassword}
        />
      </View>

      {/* Bottom buttons */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.nextButton}
          onPress={async () => {
            if (!email) return;
            try {
              await api.post('/users/forgot-password', { email });
            } catch (_) {}
            navigation.navigate('OtpVerification', {
              mode: 'reset',
              email,
              next: 'Login',
              newPassword,
            });
          }}
        >
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelButton}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>

        {/* Home indicator */}
        <View style={styles.homeIndicator} />
      </View>
    </View>
  );
};

export default RecoveryPasswordScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  textInput: {
    width: '100%',
    height: 48,
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  imageContainer: {
    width: 130, // Tăng từ 100 lên 130
    height: 130, // Tăng từ 100 lên 130
    backgroundColor: '#FFF',
    borderRadius: 65, // Tăng từ 50 lên 65 (bằng 1/2 width/height)
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  image: {
    width: 90, // Tăng từ 70 lên 90
    height: 90, // Tăng từ 70 lên 90
    borderRadius: 45, // Tăng từ 35 lên 45 (bằng 1/2 width/height)
  },
  title: {
    fontSize: 26, // Tăng từ 22 lên 26
    fontWeight: '700', // Tăng từ '600' lên '700'
    color: '#1A1A1A',
    marginBottom: 15, // Tăng từ 12 lên 15
  },
  subtitle: {
    fontSize: 18, // Tăng từ 16 lên 18
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24, // Tăng từ 22 lên 24
    marginBottom: 50,
  },
  option: {
    width: '100%',
    paddingVertical: 18, // Tăng từ 16 lên 18
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: '#FFF',
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  optionSelectedSMS: {
    backgroundColor: '#E8F4FD',
  },
  optionSelectedEmail: {
    backgroundColor: '#FFF0F0',
  },
  optionText: {
    fontSize: 18, // Tăng từ 16 lên 18
    color: '#333333',
    fontWeight: '600', // Tăng từ '500' lên '600'
  },
  selectedText: {
    color: '#1A1A1A',
    fontWeight: '700', // Tăng từ '600' lên '700'
  },
  radioButton: {
    position: 'absolute',
    right: 20,
    width: 22, // Tăng từ 20 lên 22
    height: 22, // Tăng từ 20 lên 22
    borderRadius: 11, // Tăng từ 10 lên 11
    backgroundColor: '#E5E5E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    backgroundColor: '#007AFF',
  },
  radioButtonSelectedEmail: {
    backgroundColor: '#FFB3B3',
  },
  pinkDot: {
    width: 9, // Tăng từ 8 lên 9
    height: 9, // Tăng từ 8 lên 9
    borderRadius: 4.5, // Tăng từ 4 lên 4.5
    backgroundColor: '#FF6B6B',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 24,
    right: 24,
    alignItems: 'center',
    paddingBottom: 40,
  },
  nextButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 18, // Tăng từ 16 lên 18
    width: '100%',
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 18, // Tăng từ 16 lên 18
    fontWeight: '700', // Tăng từ '600' lên '700'
  },
  cancelButton: {
    paddingVertical: 8,
    marginBottom: 20,
  },
  cancelText: {
    color: '#666666',
    fontSize: 18, // Tăng từ 16 lên 18
    fontWeight: '600', // Tăng từ '500' lên '600'
  },
  homeIndicator: {
    width: 134,
    height: 5,
    backgroundColor: '#000000',
    borderRadius: 3,
  },
});