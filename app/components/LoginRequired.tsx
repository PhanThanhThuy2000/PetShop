import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

interface LoginRequiredProps {
  title?: string;
  description?: string;
  primaryLabel?: string;
  onPrimaryPress: () => void;
  showCreateAccount?: boolean;
  onCreateAccountPress?: () => void;
  createAccountLabel?: string;
  showGuestLink?: boolean;
  onGuestPress?: () => void;
}

const LoginRequired: React.FC<LoginRequiredProps> = ({
  title = 'Yêu cầu đăng nhập',
  description = 'Bạn cần đăng nhập để tiếp tục.',
  primaryLabel = 'Đăng nhập',
  onPrimaryPress,
  showCreateAccount = false,
  onCreateAccountPress,
  createAccountLabel = 'Tạo tài khoản',
  showGuestLink = true,
  onGuestPress,
}) => {
  return (
    <View style={styles.container}>
      <Icon name="lock" size={80} color="#A0AEC0" />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>

      <View style={styles.buttonContainer}>
        {showCreateAccount && (
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={onCreateAccountPress}
          >
            <Text style={styles.primaryButtonText}>{createAccountLabel}</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={onPrimaryPress}
        >
          <Text style={styles.secondaryButtonText}>{primaryLabel}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D3748',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#2563EB',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  secondaryButtonText: {
    color: '#2D3748',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  linkText: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default LoginRequired;


