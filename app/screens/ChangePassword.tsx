// ChangePassword.tsx (Đã sửa)

import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { userService } from '../services/userService';

interface PasswordInputProps {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  showPassword: boolean;
  onTogglePassword: () => void;
}

const ChangePasswordScreen = () => {
  // 2. Lấy navigation từ hook
  const navigation = useNavigation<any>();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdatePassword = async () => {
    try {
      // Validation
      if (!oldPassword.trim()) {
        Alert.alert('Error', 'Please enter your current password');
        return;
      }

      if (!newPassword.trim()) {
        Alert.alert('Error', 'Please enter your new password');
        return;
      }

      if (newPassword.length < 6) {
        Alert.alert('Error', 'New password must be at least 6 characters long');
        return;
      }

      if (newPassword !== confirmPassword) {
        Alert.alert('Error', 'New password and confirm password do not match');
        return;
      }

      if (oldPassword === newPassword) {
        Alert.alert('Error', 'New password must be different from current password');
        return;
      }

      setIsLoading(true);

      // Call API
      const response = await userService.changePassword(oldPassword, newPassword, confirmPassword);

      if (response.success) {
        Alert.alert(
          'Success', 
          'Password changed successfully',
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
        Alert.alert('Error', response.message || 'Failed to change password');
      }

    } catch (error: any) {
      console.error('Change password error:', error);
      Alert.alert(
        'Error', 
        error.response?.data?.message || 'An error occurred while changing password'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const PasswordInput = ({
    placeholder,
    value,
    onChangeText,
    showPassword,
    onTogglePassword,
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
      />
      <TouchableOpacity 
        style={styles.eyeIcon} 
        onPress={onTogglePassword}
        disabled={isLoading}
      >
        <Ionicons
          name={showPassword ? 'eye-off-outline' : 'eye-outline'}
          size={20}
          color="#A0A0A0"
        />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        {/* 3. Thêm onPress và sửa lại icon cho đồng bộ */}
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Change Password</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <PasswordInput
          placeholder="Enter your old password"
          value={oldPassword}
          onChangeText={setOldPassword}
          showPassword={showOldPassword}
          onTogglePassword={() => setShowOldPassword(!showOldPassword)}
        />

        <PasswordInput
          placeholder="Enter your new password"
          value={newPassword}
          onChangeText={setNewPassword}
          showPassword={showNewPassword}
          onTogglePassword={() => setShowNewPassword(!showNewPassword)}
        />

        <PasswordInput
          placeholder="Confirm your new password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          showPassword={showConfirmPassword}
          onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
        />
      </KeyboardAvoidingView>

      {/* Update Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.updateButton, isLoading && styles.disabledButton]}
          onPress={handleUpdatePassword}
          disabled={isLoading}
        >
          <Text style={styles.updateButtonText}>
            {isLoading ? 'Updating...' : 'Update Password'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// ... styles không đổi
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop:50
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
    width: 34, // Bằng kích thước nút back để title ở giữa
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
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
  },
  eyeIcon: {
    padding: 5,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  updateButton: {
    backgroundColor: '#2563EB', // Đổi màu cho nổi bật hơn
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#A0A0A0',
    opacity: 0.6,
  },
  updateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});


export default ChangePasswordScreen;