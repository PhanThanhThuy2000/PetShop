import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

type NotificationItem = {
  id: string;
  avatar: any;
  name: string;
  message: string;
  timestamp: string;
};

const NOTIFICATIONS: NotificationItem[] = [
  {
    id: '1',
    avatar: require('../../assets/images/hamster.png'),
    name: 'Robert Doe',
    message: 'shared the meeting Bootcamp',
    timestamp: '18:20 12-12-2025',
  },
  {
    id: '2',
    avatar: require('../../assets/images/hamster.png'),
    name: 'Robert Doe',
    message: 'has sent email update for',
    timestamp: '18:20 12-12-2025',
  },
];

export default function NotificationScreen() {
  const navigation = useNavigation<any>();

  const renderNotificationItem = (item: NotificationItem) => (
    <View key={item.id} style={styles.notificationItem}>
      <Image source={item.avatar} style={styles.avatar} />
      <View style={styles.notificationContent}>
        <Text style={styles.notificationText}>
          <Text style={styles.name}>{item.name}</Text> {item.message}
        </Text>
        <Text style={styles.timestamp}>{item.timestamp}</Text>
      </View>
      <TouchableOpacity style={styles.closeButton}>
        <Ionicons name="close" size={24} color="#000" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{width: 24}} /> 
      </View>

      <ScrollView style={styles.notificationsList}>
        {NOTIFICATIONS.map(renderNotificationItem)}
      </ScrollView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop:25
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  notificationsList: {
    flex: 1,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25, // Bo tròn ảnh avatar
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  name: {
    fontWeight: 'bold', // Dùng bold thay cho 600
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  closeButton: {
    padding: 4,
    marginLeft: 8,
  },
});