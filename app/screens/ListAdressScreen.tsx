import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import api from '../utils/api-client'; // Import the configured axios instance

interface Address {
  _id: string;
  name: string;
  phone: string;
  note: string;
  province: string;
  district: string;
  ward: string;
  postal_code: string;
  country: string;
  is_default?: boolean;
}

const ListAddressScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [showModal, setShowModal] = useState(false);

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const res = await api.get('/addresses');
      setAddresses(res.data.data);
    } catch (error: any) {
      console.error('Lỗi khi lấy địa chỉ:', error.message || error);
      Alert.alert('Lỗi', 'Không thể tải địa chỉ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
    // Add listener to refresh addresses when screen is focused
    const unsubscribe = navigation.addListener('focus', () => {
      fetchAddresses();
    });
    // Cleanup listener on unmount
    return unsubscribe;
  }, [navigation]);

  const setAsDefault = async (id: string) => {
    try {
      await api.put(`/addresses/${id}`, { is_default: true });
      fetchAddresses();
    } catch (error) {
      console.error('Lỗi đặt mặc định:', error);
      Alert.alert('Lỗi', 'Không thể đặt mặc định');
    }
  };

  const deleteAddress = async (id: string) => {
    Alert.alert('Xác nhận', 'Bạn có chắc muốn xóa địa chỉ này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/addresses/${id}`);
            Alert.alert('Thành công', 'Đã xóa địa chỉ');
            fetchAddresses();
          } catch (error) {
            console.error('Lỗi xóa địa chỉ:', error);
            Alert.alert('Lỗi', 'Không thể xóa địa chỉ');
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: Address }) => (
    <View style={[styles.card, item.is_default && styles.defaultBorder]}>
      <View style={styles.cardHeader}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{item.name}</Text>
          {item.is_default && <View style={styles.defaultTag}><Text style={styles.defaultText}>Default</Text></View>}
        </View>
        <View style={styles.actions}>
          <TouchableOpacity onPress={() => navigation.navigate('EditAddress', { address: item })}>
            <Ionicons name="pencil-outline" size={20} color="#3182CE" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => deleteAddress(item._id)} style={{ marginLeft: 10 }}>
            <Ionicons name="trash-outline" size={20} color="#e53e3e" />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity onPress={() => { setSelectedAddress(item); setShowModal(true); }}>
        <Text style={styles.phone}>{item.phone}</Text>
        <Text style={styles.address}>
          {item.note}, {item.ward}, {item.district}, {item.province}, {item.postal_code}, {item.country}
        </Text>
      </TouchableOpacity>

      {!item.is_default && (
        <TouchableOpacity onPress={() => setAsDefault(item._id)} style={styles.setDefaultBtn}>
          <Text style={styles.setDefaultText}>Đặt làm mặc định</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Danh sách địa chỉ</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#3182CE" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={addresses}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        />
      )}

      <TouchableOpacity
        style={styles.addBtn}
        onPress={() => navigation.navigate('ShippingAddress')}
      >
        <Ionicons name="add" size={22} color="#fff" />
        <Text style={styles.addBtnText}>Thêm địa chỉ mới</Text>
      </TouchableOpacity>

      {showModal && selectedAddress && (
        <Modal visible transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Chi tiết địa chỉ</Text>
              <Text>Tên: {selectedAddress.name || '(Chưa có)'}</Text>
              <Text>SĐT: {selectedAddress.phone || '(Chưa có)'}</Text>
              <Text>Ghi chú: {selectedAddress.note || '(Chưa có)'}</Text>
              <Text>Xã/Phường: {selectedAddress.ward || '(Chưa có)'}</Text>
              <Text>Quận/Huyện: {selectedAddress.district || '(Chưa có)'}</Text>
              <Text>Tỉnh/Thành phố: {selectedAddress.province || '(Chưa có)'}</Text>
              <Text>Mã bưu chính: {selectedAddress.postal_code || '(Chưa có)'}</Text>
              <Text>Quốc gia: {selectedAddress.country || '(Chưa có)'}</Text>

              <TouchableOpacity style={styles.closeBtn} onPress={() => setShowModal(false)}>
                <Text style={styles.closeBtnText}>Đóng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, backgroundColor: '#fff', elevation: 2, paddingTop: 40
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#2d3748' },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16,
    borderWidth: 1.2, borderColor: '#e2e8f0'
  },
  defaultBorder: { borderColor: '#3182CE' },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10
  },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  name: { fontSize: 16, fontWeight: 'bold' },
  defaultTag: {
    backgroundColor: '#E0F2FF', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginLeft: 8
  },
  defaultText: { fontSize: 12, color: '#007AFF', fontWeight: '600' },
  phone: { fontSize: 14, marginBottom: 4 },
  address: { fontSize: 14, color: '#4a5568', lineHeight: 20 },
  actions: { flexDirection: 'row' },
  setDefaultBtn: {
    marginTop: 10, backgroundColor: '#edf2f7', paddingVertical: 6,
    paddingHorizontal: 12, borderRadius: 8, alignSelf: 'flex-start'
  },
  setDefaultText: { color: '#3182CE', fontWeight: '500', fontSize: 13 },
  addBtn: {
    position: 'absolute', bottom: 20, left: 20, right: 20,
    backgroundColor: '#3182CE', flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', paddingVertical: 14, borderRadius: 10
  },
  addBtnText: { color: '#fff', marginLeft: 8, fontWeight: '600' },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center'
  },
  modalContent: {
    backgroundColor: '#fff', width: '85%', padding: 20, borderRadius: 12
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  closeBtn: {
    marginTop: 20, backgroundColor: '#3182CE', paddingVertical: 10,
    borderRadius: 6, alignSelf: 'flex-end', paddingHorizontal: 20
  },
  closeBtnText: { color: '#fff', fontWeight: '600' }
});

export default ListAddressScreen;