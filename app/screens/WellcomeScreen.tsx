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
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC"/>
      
      <View style={styles.contentContainer}>
        <Image
          source={require('../../assets/images/LogoWellcome.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Pet Shops</Text>
        <Text style={styles.subtitle}>Lovely pets of every family</Text>
      </View>

      <View style={styles.footerContainer}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.primaryButtonText}>Let's get started</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('SignUp')}
        >
          <Text style={styles.secondaryButtonText}>I already have an account</Text>
          <View style={styles.arrowIconContainer}>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center', 
    paddingHorizontal: 24,
  },
  footerContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40, 
  },
  logo: {
    width: 180,
    height: 180,
    marginBottom: 40,
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold', // Dùng bold thay vì 900
    color: '#1A1A1A',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    fontWeight: '400', // Giảm độ đậm
    lineHeight: 24,
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 16, // Tăng padding cho nút to hơn
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 20, // Tăng khoảng cách giữa 2 nút
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 15,
    color: '#666666',
    fontWeight: '500',
  },
  arrowIconContainer: {
    width: 32,
    height: 32,
    backgroundColor: '#2563EB',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
});

export default WelcomeScreen;