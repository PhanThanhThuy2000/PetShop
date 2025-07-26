// AuthGuardWrapper.tsx - Wrapper component for auth-protected screens

import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useAuth } from '../../hooks/redux';
import { useAuthGuard } from '../utils/authGuard';

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
      <View style={styles.content}>
        <Icon name="lock" size={80} color="#A0AEC0" />
        <Text style={styles.title}>Authentication Required</Text>
        <Text style={styles.description}>
          You need to be signed in to access {featureName.toLowerCase()}.
        </Text>
        
        <View style={styles.buttonContainer}>
          {requiresSignUp && (
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={() => navigation.navigate('SignUp')}
            >
              <Text style={styles.primaryButtonText}>Create Account</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.secondaryButtonText}>Login</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.linkText}>Continue browsing as guest</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D3748',
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#718096',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
  },
  button: {
    paddingVertical: 16,
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
    paddingVertical: 12,
    alignItems: 'center',
  },
  linkText: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default AuthGuardWrapper;
