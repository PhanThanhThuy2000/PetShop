import { useNavigation } from '@react-navigation/native';
import { jwtDecode } from 'jwt-decode';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../hooks/redux';
import { vouchersService } from '../services/vouchersService'; // Import vouchersService
import { Voucher } from '../types/index'; // Import Voucher interface từ index.ts

const VoucherScreen = () => {
  const navigation = useNavigation<any>();
  const { token } = useAuth();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);

  // Lấy role từ token
  useEffect(() => {
    if (!token) {
      Alert.alert('Thông báo', 'Vui lòng đăng nhập để xem voucher.', [
        { text: 'OK', onPress: () => navigation.navigate('LoginScreen') },
      ]);
      return;
    }
    try {
      const decoded: any = jwtDecode(token);
      setRole(decoded.role || null);
    } catch {
      setRole(null);
    }
  }, [token]);

  // Gọi API lấy danh sách voucher
  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    const fetchVouchers = async () => {
      setLoading(true);
      try {
        const response = await vouchersService.getVouchers({}, role === 'Admin');
        setVouchers(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        Alert.alert('Lỗi', 'Không thể tải danh sách voucher.');
      } finally {
        setLoading(false);
      }
    };

    fetchVouchers();
  }, [token, role]);

  const getUserIdFromToken = (token: string) => {
    try {
      const decoded: any = jwtDecode(token);
      return decoded.id || decoded.userId;
    } catch {
      return null;
    }
  };

  const handleSaveVoucher = async (voucherId: string) => {
    if (!token) return;

    try {
      const response = await vouchersService.saveVoucher(voucherId);
      Alert.alert('Thành công', response.message);
    } catch (error: any) {
      Alert.alert('Lỗi', error?.response?.data?.message || 'Không thể lưu voucher.');
    }
  };

  // Hàm xử lý quay lại với kiểm tra cải tiến
  const handleGoBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      // Fallback: Quay về màn hình chính với kiểm tra route
      navigation.reset({
        index: 0,
        routes: [{ name: 'HomeScreen' }], // Thay 'HomeScreen' bằng tên màn hình chính của bạn
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Icon name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Vouchers</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <Text style={{ textAlign: 'center', marginTop: 40 }}>Đang tải...</Text>
        ) : vouchers.length === 0 ? (
          <Text style={{ textAlign: 'center', marginTop: 40 }}>Không có voucher.</Text>
        ) : (
          vouchers.map((voucher) => {
            const userId = token ? getUserIdFromToken(token) : null;
            const isCollected = userId ? voucher.saved_by_users?.includes(userId) : false;

            return (
              <View
                key={voucher._id}
                style={[
                  styles.voucherCard,
                  {
                    borderColor: voucher.textColor || '#ff6b6b',
                    backgroundColor: voucher.color || '#ffebeb',
                    borderStyle: voucher.isDashed ? 'dashed' : 'solid',
                  },
                ]}
              >
                <View style={styles.cardTop}>
                  <Text style={[styles.voucherTitle, { color: voucher.textColor || '#ff6b6b' }]}>
                    {voucher.title || 'Voucher'}
                  </Text>
                  <View style={[styles.validTag, { backgroundColor: voucher.textColor || '#ff6b6b' }]}>
                    <Text style={styles.validText}>
                      Hạn: {voucher.expiry_date ? new Date(voucher.expiry_date).toLocaleDateString() : 'N/A'}
                    </Text>
                  </View>
                </View>

                <View style={styles.discountRow}>
                  <View style={[styles.lockIcon, { backgroundColor: voucher.textColor || '#ff6b6b' }]}>
                    <Icon name="lock-closed" size={12} color="#fff" />
                  </View>
                  <Text style={styles.discountText}>
                    {voucher.discount_type === 'percentage'
                      ? `${voucher.discount_value}% off`
                      : `${voucher.discount_value} off`}
                  </Text>
                </View>

                {role !== 'Admin' && (
                  <TouchableOpacity
                    style={[styles.collectBtn, { backgroundColor: voucher.textColor || '#ff6b6b' }]}
                    onPress={() => handleSaveVoucher(voucher._id)}
                    disabled={isCollected}
                  >
                    <Text style={styles.collectBtnText}>{isCollected ? 'Đã lưu' : 'Lưu'}</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default VoucherScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', // Căn giữa nội dung
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  backButton: {
    position: 'absolute', // Định vị tuyệt đối để giữ bên trái
    left: 16, // Đẩy về bên trái
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center', // Căn giữa text
    flex: 1, // Đảm bảo title chiếm không gian còn lại
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 8,
  },
  iconCircle: {
    backgroundColor: '#e8f4ff',
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    backgroundColor: '#007aff',
    borderRadius: 4,
    zIndex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  voucherCard: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    position: 'relative',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  voucherTitle: {
    fontWeight: '600',
    fontSize: 16,
  },
  validTag: {
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  validText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '500',
  },
  discountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  lockIcon: {
    width: 20,
    height: 20,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  discountText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  collectBtn: {
    alignSelf: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  collectBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});