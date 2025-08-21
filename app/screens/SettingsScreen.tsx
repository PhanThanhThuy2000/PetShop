import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
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
import { clearError, logoutUser } from '../redux/slices/authSlice';

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user, dispatch } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Function to show "Not Developed" alert
  const showNotDevelopedAlert = () => {
    Alert.alert(
      'Thông báo',
      'Tính năng đang phát triển',
      [{ text: 'OK', style: 'cancel' }]
    );
  };

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
      disabled={!onPress || isLoggingOut}
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

  const handleLogout = async () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có muốn đăng xuất tài khoản không ?',
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: async () => {
            setIsLoggingOut(true);
            try {
              await dispatch(logoutUser()).unwrap();
              dispatch(clearError());
              navigation.navigate('Login' as never);
            } catch (error: any) {
              navigation.navigate('Login' as never);
            } finally {
              setIsLoggingOut(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Cài đặt</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Personal Section */}
        <Text style={styles.sectionHeader}>Thông tin</Text>
        <View style={styles.sectionContainer}>
          <Row label="Tài khoản" onPress={() => navigation.navigate('EditInfomation')} />
          <Row label="Địa chỉ" onPress={() => navigation.navigate('ListAddress')} />
          <Row label="Thanh toán" onPress={showNotDevelopedAlert} />
        </View>

        <Text style={styles.sectionHeader}>Tài khoản và bảo mật</Text>
        <View style={styles.sectionContainer}>
          <Row label="Ngôn ngữ" value="Tiếng Việt" onPress={showNotDevelopedAlert} />
          <Row label="Thông tin" onPress={() => navigation.navigate('About')} />
          <Row label="Đổi mật khẩu" onPress={() => navigation.navigate('ChangePassword')} />
          <Row label="Xóa tài khoản" onPress={showNotDevelopedAlert} />
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={[styles.logoutBtn, isLoggingOut && styles.disabledLogoutBtn]}
          onPress={handleLogout}
          disabled={isLoggingOut}
        >
          <Text style={styles.logoutText}>
            {isLoggingOut ? 'Logging out...' : 'Đăng xuất'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f7' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#e5e5e5',
    backgroundColor: '#fff',
    marginTop: 50,
  },
  backBtn: { padding: 6 },
  title: { fontSize: 20, fontWeight: '600', color: '#333' },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6d6d72',
    paddingHorizontal: 16,
    marginBottom: 12,
    marginTop:10
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
    marginHorizontal: 16,
    alignItems: 'center',
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  disabledLogoutBtn: {
    backgroundColor: '#f5f5f5',
    opacity: 0.6,
  },
  logoutText: {
    fontSize: 16,
    color: '#E53935',
    fontWeight: '500',
  },
});

export default SettingsScreen;