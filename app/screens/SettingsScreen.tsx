import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SettingsScreen: React.FC = () => {
  const SectionHeader: React.FC<{ title: string; style?: object }> = ({ title, style }) => (
    <Text style={[styles.sectionHeader, style]}>{title}</Text>
  );

  const Row: React.FC<{
    label: string;
    value?: string;
    onPress?: () => void;
    isDestructive?: boolean;
  }> = ({ label, value, onPress, isDestructive }) => (
    <TouchableOpacity
      style={styles.row}
      activeOpacity={onPress ? 0.6 : 1}
      onPress={onPress}
    >
      <Text
        style={[
          styles.rowLabel,
          isDestructive && { color: '#E53935' /* đỏ logout / delete */ },
        ]}
      >
        {label}
      </Text>
      {value != null && (
        <Text style={styles.rowValue}>{value}</Text>
      )}
      {onPress && <Ionicons name="chevron-forward" size={20} color="#999" />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => { /* back */ }}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Personal */}
        <SectionHeader title="Personal" />
        <Row label="Profile" onPress={() => {}} />
        <Row label="Shipping Address" onPress={() => {}} />
        <Row label="Payment methods" onPress={() => {}} />

        {/* Account */}
        <SectionHeader title="Account" style={{ marginTop: 32 }} />
        <Row label="Language" value="English" onPress={() => {}} />
        <Row label="About Slada" onPress={() => {}} />
        <Row label="Change password" onPress={() => {}} />
        <Row label="Delete Account" onPress={() => {}} isDestructive />

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={() => {}}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#ddd',
    marginTop:50
  },
  backBtn: { marginRight: 12 },
  title: { fontSize: 20, fontWeight: '600', color: '#333' },

  content: { paddingHorizontal: 16, paddingTop: 24 },

  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#666',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#eee',
    justifyContent: 'space-between',
  },
  rowLabel: { fontSize: 16, color: '#333' },
  rowValue: { fontSize: 16, color: '#666', marginRight: 8 },

  logoutBtn: {
    marginTop: 40,
    alignItems: 'center',
    paddingVertical: 12,
  },
  logoutText: {
    fontSize: 16,
    color: '#E53935',
    fontWeight: '500',
  },
});

export default SettingsScreen;
