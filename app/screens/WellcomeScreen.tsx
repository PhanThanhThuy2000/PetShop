import { StackNavigationProp } from '@react-navigation/stack';
import React from 'react';
import {
  Image,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type RootStackParamList = {
  SignUp: undefined;
  Login: undefined;
};

type WelcomeScreenNavigationProp = StackNavigationProp<RootStackParamList>;

interface WelcomeScreenProps {
  navigation: WelcomeScreenNavigationProp;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Main Content */}
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/images/LogoWellcome.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Text Content */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>Pet Shops</Text>
          <Text style={styles.subtitle}>Lovely pets of every family</Text>
        </View>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.getStartedButton}
            onPress={() => navigation.navigate('SignUp')}
          >
            <Text style={styles.getStartedText}>Let's get started</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.accountButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.accountText}>I already have an account</Text>
            <View style={styles.arrowContainer}>
              <Text style={styles.arrowIcon}>→</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Home Indicator */}
      <View style={styles.homeIndicator}>
        <View style={styles.indicator} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  logoContainer: {
    marginBottom: 60,
    marginTop: 20,
  },
  logo: {
    width: 320,
    height: 320,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 48,
    fontWeight: '900',
    color: '#1A1A1A',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 20,
    color: '#666666',
    textAlign: 'center',
    fontWeight: '500',
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
    position: 'absolute',
    bottom: 50,
    paddingHorizontal: 24,
  },
  getStartedButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  getStartedText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  accountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  accountText: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '500',
  },
  arrowContainer: {
    width: 32,
    height: 32,
    backgroundColor: '#2563EB',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  arrowIcon: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '400',
    textAlign: 'center',
    transform: [{ translateY: -1 }],
  },
  homeIndicator: {
    alignItems: 'center',
    paddingBottom: 12,
  },
  indicator: {
    width: 100,
    height: 3,
    backgroundColor: '#000000',
    borderRadius: 1.5,
  },
});

export default WelcomeScreen;