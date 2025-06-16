import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {
  Ionicons,
  MaterialIcons,
  MaterialCommunityIcons,
  FontAwesome5,
  FontAwesome,
} from '@expo/vector-icons';

const AccountScreen: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Comida');

  const purchaseStatuses = [
    {
      key: 'ToPay',
      label: 'To Pay',
      icon: <FontAwesome5 name="wallet" size={24} color="#FF5757" />,
      badge: 1,
    },
    {
      key: 'Order',
      label: 'Order',
      icon: <MaterialIcons name="inventory" size={24} color="#4A90E2" />,
    },
    {
      key: 'ToReceive',
      label: 'To Receive',
      icon: <MaterialCommunityIcons name="truck-delivery-outline" size={24} color="#4A90E2" />,
    },
    {
      key: 'Voucher',
      label: 'Voucher',
      icon: <FontAwesome name="ticket" size={24} color="#4A90E2" />,
    },
  ];

  const categories = [
    {
      key: 'Comida',
      label: 'Comida',
      icon: <Ionicons name="fast-food-outline" size={24} />,
    },
    {
      key: 'Pruning',
      label: 'Pruning',
      icon: <MaterialCommunityIcons name="lamp-outline" size={24} />,
    },
    {
      key: 'Vacinas',
      label: 'Vacinas',
      icon: <FontAwesome5 name="syringe" size={24} />,
    },
    {
      key: 'Petshop',
      label: 'Petshop',
      icon: <FontAwesome5 name="paw" size={24} />,
    },
    {
      key: 'Medicamentos',
      label: 'Medicamentos',
      icon: <MaterialCommunityIcons name="pill" size={24} />,
    },
    {
      key: 'Higiene',
      label: 'Higiene',
      icon: <MaterialCommunityIcons name="sofa-outline" size={24} />,
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Image
          source={{ uri: 'https://example.com/avatar.jpg' }}
          style={styles.avatar}
        />
        <View style={styles.headerControls}>
          <View style={styles.myActivityPill}>
            <Text style={styles.myActivityText}>My Activity</Text>
          </View>
          <TouchableOpacity style={styles.iconButton}>
            <MaterialIcons name="grid-view" size={24} color="#4A90E2" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <MaterialIcons name="format-list-bulleted" size={24} color="#4A90E2" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="settings-outline" size={24} color="#4A90E2" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Greeting */}
      <Text style={styles.greeting}>Hello, Amanda!</Text>

      {/* Purchases Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <MaterialIcons name="assignment" size={20} color="#FF5757" />
            <Text style={styles.cardTitle}>My Purchases</Text>
          </View>
          <TouchableOpacity>
            <Text style={styles.viewAllText}>View Purchases History</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.statusRow}>
          {purchaseStatuses.map((status) => (
            <View key={status.key} style={styles.statusItem}>
              <View style={styles.statusIconContainer}>
                {status.icon}
                {status.badge ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{status.badge}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.statusLabel}>{status.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Categories Card */}
      <View style={[styles.card, { marginTop: 16 }]}>  
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.key}
              style={[
                styles.categoryItem,
                selectedCategory === cat.key && styles.categoryItemSelected,
              ]}
              onPress={() => setSelectedCategory(cat.key)}
            >
              {React.cloneElement(cat.icon, {
                color: selectedCategory === cat.key ? '#FFFFFF' : '#B0BEC5',
              })}
              <Text
                style={[
                  styles.categoryLabel,
                  selectedCategory === cat.key && { color: '#FFFFFF' },
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Bottom Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItem}>
          <Ionicons name="home" size={24} color="#4A90E2" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <Ionicons name="heart-outline" size={24} color="#607D8B" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <Ionicons name="list-circle-outline" size={24} color="#607D8B" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <Ionicons name="mail-outline" size={24} color="#607D8B" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <Ionicons name="person-outline" size={24} color="#607D8B" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5', padding: 16 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  headerControls: { flexDirection: 'row', alignItems: 'center' },
  myActivityPill: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
  },
  myActivityText: { color: '#1976D2', fontWeight: '600' },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  greeting: { fontSize: 24, fontWeight: '700', marginTop: 16 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: { fontSize: 16, fontWeight: '600', marginLeft: 8 },
  viewAllText: { fontSize: 12, color: '#1976D2' },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statusItem: { alignItems: 'center' },
  statusIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF3D00',
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#FFFFFF', fontSize: 10 },
  statusLabel: { marginTop: 4, fontSize: 12, color: '#607D8B' },
  categoryItem: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  categoryItemSelected: { backgroundColor: '#7B1FA2' },
  categoryLabel: { marginTop: 4, fontSize: 12, color: '#607D8B' },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderColor: '#ECEFF1',
  },
  tabItem: { alignItems: 'center' },
});

export default AccountScreen;
