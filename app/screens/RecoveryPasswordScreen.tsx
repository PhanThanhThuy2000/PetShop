import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { Image, StyleSheet, Text, TextInput, TouchableOpacity, View, Alert } from 'react-native';
import api from '../utils/api-client';

const RecoveryPasswordScreen = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigation = useNavigation<any>();

  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        <Image
          source={require('../../assets/images/imageDog.png')}
          style={styles.image}
        />
      </View>
      
      <Text style={styles.title}>Khôi phục mật khẩu</Text>
      <Text style={styles.subtitle}>
        Vui lòng nhập email để nhận mã OTP đặt lại mật khẩu
      </Text>

      <View style={{ width: '100%', marginTop: 12 }}>
        <TextInput
          placeholder="Nhập email của bạn"
          placeholderTextColor="#999"
          style={styles.textInput}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
      </View>

      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.nextButton}
          disabled={isSubmitting}
          onPress={async () => {
            if (!email.trim()) {
              Alert.alert('Thiếu email', 'Vui lòng nhập email của bạn');
              return;
            }
            try {
              setIsSubmitting(true);
              await api.post('/users/forgot-password', { email: email.trim() });
              navigation.navigate('OtpVerification', {
                mode: 'reset',
                email: email.trim(),
                next: 'Login',
              });
            } catch (err: any) {
              const serverMsg = err?.response?.data?.message;
              const friendlyMsg =
                serverMsg === 'Email not found'
                  ? 'Email không tồn tại'
                  : serverMsg === 'Too many requests. Please try again later.'
                  ? 'Bạn đã yêu cầu quá nhiều lần. Vui lòng thử lại sau.'
                  : serverMsg;
              Alert.alert('Lỗi', friendlyMsg || 'Không thể gửi mã OTP. Vui lòng thử lại.');
            } finally {
              setIsSubmitting(false);
            }
          }}
        >
          <Text style={styles.nextButtonText}>Tiếp theo</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelButton}>
          <Text style={styles.cancelText}>Hủy</Text>
        </TouchableOpacity>

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
  optionText: {
    fontSize: 18, // Tăng từ 16 lên 18
    color: '#333333',
    fontWeight: '600', // Tăng từ '500' lên '600'
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