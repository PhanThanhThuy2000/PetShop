import { Ionicons } from '@expo/vector-icons'; // or react-native-vector-icons
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

const AboutPeShopsScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>9:41</Text>
        <View style={styles.headerRight}>
          <View style={styles.signalBars}>
            <View style={[styles.bar, styles.bar1]} />
            <View style={[styles.bar, styles.bar2]} />
            <View style={[styles.bar, styles.bar3]} />
            <View style={[styles.bar, styles.bar4]} />
          </View>
          <Ionicons name="wifi" size={16} color="#000" />
          <View style={styles.battery}>
            <View style={styles.batteryFill} />
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Shopping Bag Icon */}
        <View style={styles.iconContainer}>
          <Image 
            source={require('../../assets/images/iconabout.png')} // Đường dẫn tới ảnh của bạn
            style={styles.iconImage}
            resizeMode="contain"
          />
        </View>

        {/* Title */}
        <Text style={styles.title}>About PeShops</Text>

        {/* Description */}
        <Text style={styles.description}>
          Shoppe - Shopping UI kit" is likely a user interface (UI) kit designed to facilitate the development of e-commerce or shopping-related applications. UI kits are collections of pre-designed elements, components, and templates that developers and designers can use to create consistent and visually appealing user interfaces.
        </Text>

        {/* Contact Section */}
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
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  signalBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  bar: {
    width: 3,
    backgroundColor: '#000',
    borderRadius: 1,
  },
  bar1: { height: 4 },
  bar2: { height: 6 },
  bar3: { height: 8 },
  bar4: { height: 10 },
  battery: {
    width: 20,
    height: 10,
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 2,
    position: 'relative',
  },
  batteryFill: {
    position: 'absolute',
    left: 1,
    top: 1,
    bottom: 1,
    width: '80%',
    backgroundColor: '#000',
    borderRadius: 1,
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

export default AboutPeShopsScreen;