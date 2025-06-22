import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Image,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

const AboutScreen = () => {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About</Text>
        <View style={styles.headerRightIcons} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.iconContainer}>
          <Image 
            source={require('../../assets/images/iconabout.png')} // Đảm bảo đường dẫn này đúng
            style={styles.iconImage}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.title}>About PeShops</Text>

        <Text style={styles.description}>
          Shoppe - Shopping UI kit" is likely a user interface (UI) kit designed to facilitate the development of e-commerce or shopping-related applications. UI kits are collections of pre-designed elements, components, and templates that developers and designers can use to create consistent and visually appealing user interfaces.
        </Text>

        <Text style={styles.contactText}>
          If you need help or you have any questions, feel free to contact me by email.
        </Text>

        <Text style={styles.emailText}>
          hello@mydomain.com
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
    marginTop:25
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    zIndex: -1, 
  },
  headerRightIcons: {
    width: 24 + 10, 
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 50,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 50,
    marginTop: 20,
  },
  iconImage: {
    width: 100,
    height: 100,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 24,
    textAlign: 'left',
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: '#666',
    marginBottom: 28,
    textAlign: 'left',
  },
  contactText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#666',
    marginBottom: 16,
    textAlign: 'left',
  },
  emailText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginBottom: 60,
  },
});

export default AboutScreen;