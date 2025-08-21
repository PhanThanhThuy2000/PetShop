// ChangePassword.tsx (Đã sửa lỗi input)

import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { userService } from '../services/userService';

interface PasswordInputProps {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  showPassword: boolean;
  onTogglePassword: () => void;
  isLoading?: boolean;
}

// ✅ Di chuyển PasswordInput ra ngoài component để tránh re-create
const PasswordInput = React.memo(({
  placeholder,
  value,
  onChangeText,
  showPassword,
  onTogglePassword,
  isLoading = false,
}: PasswordInputProps) => (
  <View style={styles.inputContainer}>
    <TextInput
      style={styles.textInput}
      placeholder={placeholder}
      placeholderTextColor="#A0A0A0"
      value={value}
      onChangeText={onChangeText}
      secureTextEntry={!showPassword}
      editable={!isLoading}
      autoCapitalize="none"
      autoCorrect={false}
      textContentType="password"
      // ✅ Thêm các props quan trọng
      blurOnSubmit={false}
      returnKeyType="next"
    />
    <TouchableOpacity
      style={styles.eyeIcon}
      onPress={onTogglePassword}
      disabled={isLoading}
      activeOpacity={0.7}
    >
      <Ionicons
        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
        size={20}
        color="#A0A0A0"
      />
    </TouchableOpacity>
  </View>
));

const ChangePasswordScreen = () => {
  const navigation = useNavigation<any>();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // ✅ Sử dụng useCallback để tránh re-create functions
  const handleOldPasswordChange = useCallback((text: string) => {
    setOldPassword(text);
  }, []);

  const handleNewPasswordChange = useCallback((text: string) => {
    setNewPassword(text);
  }, []);

  const handleConfirmPasswordChange = useCallback((text: string) => {
    setConfirmPassword(text);
  }, []);

  const toggleOldPassword = useCallback(() => {
    setShowOldPassword(prev => !prev);
  }, []);

  const toggleNewPassword = useCallback(() => {
    setShowNewPassword(prev => !prev);
  }, []);

  const toggleConfirmPassword = useCallback(() => {
    setShowConfirmPassword(prev => !prev);
  }, []);

  const handleUpdatePassword = async () => {
    try {
      // Validation
      if (!oldPassword.trim()) {
        Alert.alert('Lỗi', 'Vui lòng nhập mật khẩu hiện tại');
        return;
      }

      if (!newPassword.trim()) {
        Alert.alert('Lỗi', 'Vui lòng nhập mật khẩu mới');
        return;
      }

      const strongPwd = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
      if (!strongPwd.test(newPassword)) {
        Alert.alert('Lỗi', 'Mật khẩu phải ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt');
        return;
      }

      if (newPassword !== confirmPassword) {
        Alert.alert('Lỗi', 'Mật khẩu mới và mật khẩu xác nhận không khớp');
        return;
      }

      if (oldPassword === newPassword) {
        Alert.alert('Lỗi', 'Mật khẩu mới phải khác mật khẩu hiện tại');
        return;
      }

      setIsLoading(true);

      // Call API
      const response = await userService.changePassword(oldPassword, newPassword, confirmPassword);

      if (response.success) {
        Alert.alert(
          'Thành công',
          'Đổi mật khẩu thành công',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack()
            }
          ]
        );

        // Clear form
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        Alert.alert('Lỗi', response.message || 'Không thể đổi mật khẩu');
      }

    } catch (error: any) {
      console.error('Change password error:', error);
      Alert.alert(
        'Lỗi',
        error.response?.data?.message || 'Đã xảy ra lỗi khi đổi mật khẩu'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thay đổi mật khẩu</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <PasswordInput
          placeholder="Nhập mật khẩu cũ"
          value={oldPassword}
          onChangeText={handleOldPasswordChange}
          showPassword={showOldPassword}
          onTogglePassword={toggleOldPassword}
          isLoading={isLoading}
        />

        <PasswordInput
          placeholder="Nhập mật khẩu mới"
          value={newPassword}
          onChangeText={handleNewPasswordChange}
          showPassword={showNewPassword}
          onTogglePassword={toggleNewPassword}
          isLoading={isLoading}
        />

        <PasswordInput
          placeholder="Xác nhận mật khẩu mới"
          value={confirmPassword}
          onChangeText={handleConfirmPasswordChange}
          showPassword={showConfirmPassword}
          onTogglePassword={toggleConfirmPassword}
          isLoading={isLoading}
        />
      </KeyboardAvoidingView>

      {/* Update Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.updateButton, isLoading && styles.disabledButton]}
          onPress={handleUpdatePassword}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          <Text style={styles.updateButtonText}>
            {isLoading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: 50
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  placeholder: {
    width: 34,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    marginBottom: 20,
    paddingHorizontal: 15,
    height: 56,
    backgroundColor: '#FFFFFF',
    // ✅ Thêm shadow cho đẹp hơn
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
    paddingVertical: 0, // ✅ Đảm bảo text align properly
  },
  eyeIcon: {
    padding: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  updateButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    // ✅ Thêm shadow cho button
    shadowColor: '#2563EB',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    backgroundColor: '#A0A0A0',
    opacity: 0.6,
    shadowOpacity: 0,
    elevation: 0,
  },
  updateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ChangePasswordScreen;