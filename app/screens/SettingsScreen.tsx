// screens/SettingsScreen.js
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const SettingsScreen = () => {
  const navigation = useNavigation();

  const handleDeleteAccountPress = () => {
    navigation.navigate('DeleteTest'); // Chuyển sang màn DeletingAccountScreen
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personal</Text>
        <TouchableOpacity style={styles.option}>
          <Text style={styles.optionText}>Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.option}>
          <Text style={styles.optionText}>Shipping Address</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.option}>
          <Text style={styles.optionText}>Payment methods</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.option}>
          <Text style={styles.optionText}>Account</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Language</Text>
        <TouchableOpacity style={styles.option}>
          <Text style={styles.optionText}>English</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About Slada</Text>
        <TouchableOpacity style={styles.option}>
          <Text style={styles.optionText}>Change password</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.option} onPress={handleDeleteAccountPress}>
          <Text style={styles.optionTextDelete}>Delete Account</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.logoutButton}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 10,
  },
  option: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
  optionTextDelete: {
    fontSize: 16,
    color: '#ef5350', // Màu đỏ cho Delete Account để nổi bật
  },
  logoutButton: {
    backgroundColor: '#ef5350',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SettingsScreen;