// AuthTestScreen.tsx - Screen để test authentication flows

import { useNavigation } from '@react-navigation/native';
import React from 'react';
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../../hooks/redux';
import { requiresAuth, useAuthGuard } from '../utils/authGuard';

const AuthTestScreen: React.FC = () => {
  const { token, user } = useAuth();
  const { checkAuthAndProceed } = useAuthGuard();
  const navigation = useNavigation() as any;

  const testCases = [
    {
      title: 'Test Favorites (Requires Signup)',
      description: 'Should show signup prompt for guests',
      action: () => {
        checkAuthAndProceed(
          token,
          {
            ...requiresAuth('favorites'),
            onLoginRequired: () => navigation.navigate('Login'),
          },
          () => {
            Alert.alert('Success', 'You can access favorites!');
          }
        );
      }
    },
    {
      title: 'Test Cart (Requires Signup)',
      description: 'Should show signup prompt for guests',
      action: () => {
        checkAuthAndProceed(
          token,
          {
            ...requiresAuth('cart'),
            onLoginRequired: () => navigation.navigate('Login'),
          },
          () => {
            Alert.alert('Success', 'You can access cart!');
          }
        );
      }
    },
    {
      title: 'Test Notifications (Requires Signup)',
      description: 'Should show signup prompt for guests',
      action: () => {
        checkAuthAndProceed(
          token,
          {
            ...requiresAuth('notifications'),
            onLoginRequired: () => navigation.navigate('Login'),
          },
          () => {
            Alert.alert('Success', 'You can access notifications!');
          }
        );
      }
    },
    {
      title: 'Test Chat (Requires Login)',
      description: 'Should show login prompt for guests and registered users without token',
      action: () => {
        checkAuthAndProceed(
          token,
          {
            ...requiresAuth('chat'),
            onLoginRequired: () => navigation.navigate('Login'),
          },
          () => {
            Alert.alert('Success', 'You can access chat!');
          }
        );
      }
    },
    {
      title: 'Test Account (Requires Login)',
      description: 'Should show login prompt for guests and registered users without token',
      action: () => {
        checkAuthAndProceed(
          token,
          {
            ...requiresAuth('account'),
            onLoginRequired: () => navigation.navigate('Login'),
          },
          () => {
            Alert.alert('Success', 'You can access account!');
          }
        );
      }
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Auth Guard Test Screen</Text>
          <Text style={styles.subtitle}>
            Current Status: {token ? 'Logged In' : 'Guest'}
          </Text>
          {user && (
            <Text style={styles.userInfo}>
              User: {user.email || user.username || 'Unknown'}
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Cases:</Text>
          {testCases.map((testCase, index) => (
            <View key={index} style={styles.testCase}>
              <Text style={styles.testTitle}>{testCase.title}</Text>
              <Text style={styles.testDescription}>{testCase.description}</Text>
              <TouchableOpacity
                style={styles.testButton}
                onPress={testCase.action}
              >
                <Text style={styles.testButtonText}>Test</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions:</Text>
          <TouchableOpacity
            style={[styles.button, styles.loginButton]}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.buttonText}>Go to Login</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.signupButton]}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.buttonText}>Go to Signup</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.homeButton]}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.buttonText}>Go to Home</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  userInfo: {
    fontSize: 14,
    color: '#888',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  testCase: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  testTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  testDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  testButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  testButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  loginButton: {
    backgroundColor: '#34C759',
  },
  signupButton: {
    backgroundColor: '#FF9500',
  },
  homeButton: {
    backgroundColor: '#007AFF',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default AuthTestScreen;
