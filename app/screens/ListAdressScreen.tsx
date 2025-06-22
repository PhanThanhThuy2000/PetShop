import React, { useState } from 'react'; // Thêm useState
import {
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    FlatList,
    StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

interface Address {
  id: string; // Thêm ID để xác định duy nhất
  name: string;
  phone: string;
  address: string;
  isDefault?: boolean;
}

// Dữ liệu ban đầu
const initialAddresses: Address[] = [
  { id: '1', name: 'Phan Thủy', phone: '(+84) 0363901223', address: '527 đường C6 Phường C6, Quận Bắc Từ Liêm, Hà Nội', isDefault: true },
  { id: '2', name: 'Nguyễn Văn A', phone: '(+84) 0987654321', address: '123 Đường Láng, Phường Láng Thượng, Quận Đống Đa, Hà Nội' },
  { id: '3', name: 'Trần Thị B', phone: '(+84) 0123456789', address: '456 Phố Huế, Phường Ngô Thì Nhậm, Quận Hai Bà Trưng, Hà Nội' },
];

const ListAdressScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  
  // 1. Dùng useState để quản lý danh sách địa chỉ
  const [addresses, setAddresses] = useState(initialAddresses);

  // 2. Hàm xử lý khi chọn một địa chỉ làm mặc định
  const handleSetDefault = (selectedId: string) => {
    const updatedAddresses = addresses.map(address => ({
      ...address,
      // Đặt isDefault là true cho địa chỉ được chọn, false cho các địa chỉ còn lại
      isDefault: address.id === selectedId
    }));
    setAddresses(updatedAddresses);
  };

  const renderAddressItem = ({ item }: { item: Address }) => (
    // 3. Bọc toàn bộ thẻ trong TouchableOpacity
    <TouchableOpacity onPress={() => handleSetDefault(item.id)}>
      <View style={[styles.addressCard, item.isDefault && styles.defaultCardBorder]}>
          <View style={styles.cardHeader}>
              <Text style={styles.name}>{item.name}</Text>
              <View style={styles.cardActions}>
                  {item.isDefault && (
                      <View style={styles.defaultTag}>
                          <Text style={styles.defaultText}>Default</Text>
                      </View>
                  )}
                  <TouchableOpacity 
                      style={styles.editButton}
                      onPress={() => {/* handle edit address */}}
                  >
                      <Ionicons name="pencil-outline" size={20} color="#3182CE" />
                  </TouchableOpacity>
              </View>
          </View>
          <View style={styles.cardBody}>
              <Text style={styles.phone}>{item.phone}</Text>
              <Text style={styles.address}>{item.address}</Text>
          </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>List Addresses</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <FlatList
        data={addresses}
        renderItem={renderAddressItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        extraData={addresses} // Báo cho FlatList biết cần render lại khi state thay đổi
      />

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('AddNewAddress')}
      >
        <Ionicons name="add" size={24} color="#fff" />
        <Text style={styles.addText}>Add New Address</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: '#f8f9fa',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderColor: '#eef0f2',
        paddingTop:35

    },
    backButton: { 
        padding: 5,
    },
    headerTitle: { 
        fontSize: 20, 
        fontWeight: '600',
        color: '#2d3748',
    },
    listContainer: {
        padding: 16,
        paddingBottom: 100,
    },
    addressCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginBottom: 16,
        borderWidth: 1.5, // Tăng độ dày border một chút
        borderColor: '#e2e8f0', // Border mặc định
        shadowColor: "#4A5568",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    defaultCardBorder: {
        borderColor: '#3182CE', // Border màu xanh khi được chọn
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    name: { 
        fontSize: 16, 
        fontWeight: 'bold',
        color: '#2d3748',
        flex: 1,
    },
    cardActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    defaultTag: {
        backgroundColor: '#EBF8FF',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginRight: 10,
    },
    defaultText: { 
        color: '#3182CE', 
        fontSize: 12, 
        fontWeight: '600' 
    },
    cardBody: {},
    phone: { 
        fontSize: 14, 
        color: '#718096',
        marginBottom: 4,
    },
    address: { 
        fontSize: 14, 
        color: '#4a5568',
        lineHeight: 20,
    },
    editButton: {
        padding: 4,
    },
    addButton: {
        position: 'absolute',
        bottom: 24,
        left: 16,
        right: 16,
        backgroundColor: '#3182CE',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 5,
    },
    addText: { 
        color: '#fff', 
        fontSize: 16, 
        fontWeight: 'bold',
        marginLeft: 8,
    },
});

export default ListAdressScreen;