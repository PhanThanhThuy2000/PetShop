import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<any>();

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
      disabled={!onPress}
    >
      <Text
        style={[
          styles.rowLabel,
          isDestructive && { color: '#E53935' }, 
        ]}
      >
        {label}
      </Text>
      <View style={styles.rowRightContent}>
        {value != null && (
          <Text style={styles.rowValue}>{value}</Text>
        )}
        {onPress && <Ionicons name="chevron-forward" size={20} color="#999" />}
      </View>
    </TouchableOpacity>
  );

  // const handleLogout = () => {
  //   // Xử lý đăng xuất
  // };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 36 }} /> 
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Mục Personal */}
        <Text style={styles.sectionHeader}>Personal</Text>
        <View style={styles.sectionContainer}>
          <Row label="Profile" onPress={() => navigation.navigate('EditInfomation')} />
          <Row label="Shipping Address" onPress={() => navigation.navigate('ListAdress')} />
          <Row label="Payment methods" onPress={() => navigation.goBack()} />
        </View>

        <Text style={styles.sectionHeader}>Account</Text>
        <View style={styles.sectionContainer}>
          <Row label="Language" value="English" onPress={() => navigation.navigate('Language')} />
          <Row label="About Slada" onPress={() => navigation.navigate('About')} />
          <Row label="Change password" onPress={() => navigation.navigate('ChangePassword')} />
          <Row label="Delete Account" onPress={() => { /* Xử lý xóa tài khoản */ }} isDestructive />
        </View>

        {/* Nút Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={() => { handleLogout() }}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f7' }, // Màu nền xám nhẹ
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#e5e5e5',
    backgroundColor: '#fff',
    marginTop:50
  },
  backBtn: { padding: 6 },
  title: { fontSize: 20, fontWeight: '600', color: '#333' },
  content: { paddingVertical: 24 },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6d6d72',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionContainer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e5e5e5',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderColor: '#e5e5e5',
  },
  rowLabel: { fontSize: 16, color: '#333' },
  rowRightContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowValue: { fontSize: 16, color: '#8e8e93', marginRight: 8 },
  logoutBtn: {
    marginTop: 32,
    marginHorizontal:16,
    alignItems: 'center',
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  logoutText: {
    fontSize: 16,
    color: '#E53935',
    fontWeight: '500',
  },
});

export default SettingsScreen;