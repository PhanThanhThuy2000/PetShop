// AuthGuardWrapper.tsx - Wrapper component for auth-protected screens

import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useAuth } from '../../hooks/redux';
import { useAuthGuard } from '../utils/authGuard';
import LoginRequired from './LoginRequired';

interface AuthGuardWrapperProps {
  children: React.ReactNode;
  requiresSignUp?: boolean;
  requiresLogin?: boolean;
  featureName: string;
}

const AuthGuardWrapper: React.FC<AuthGuardWrapperProps> = ({
  children,
  requiresSignUp = false,
  requiresLogin = false,
  featureName,
}) => {
  const navigation = useNavigation<any>();
  const { token } = useAuth();
  const { checkAuthAndProceed } = useAuthGuard();

  // If user is authenticated, render the actual component
  if (token) {
    return <>{children}</>;
  }

  // Guest user - show auth required screen
  return (
    <View style={styles.container}>
      <LoginRequired
        title="Yêu cầu đăng nhập"
        description={`Bạn cần đăng nhập để truy cập ${featureName.toLowerCase()}.`}
        primaryLabel="Đăng nhập"
        onPrimaryPress={() => navigation.navigate('Login')}
        showCreateAccount={!!requiresSignUp}
        onCreateAccountPress={() => navigation.navigate('SignUp')}
        createAccountLabel="Tạo tài khoản"
        showGuestLink
        onGuestPress={() => navigation.navigate('Home')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  // styles kept minimal here; visuals handled inside LoginRequired
});

export default AuthGuardWrapper;
