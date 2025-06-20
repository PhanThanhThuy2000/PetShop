// screens/ListAdressScreen.tsx
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';

interface Address {
  name: string;
  phone: string;
  address: string;
  isDefault?: boolean;
}

const ListAddress: Address[] = [
  { name: 'Phan Thủy', phone: '(+84) 0363901223', address: '527 đường C6 Phường C6, Quận Bắc Từ Liêm, Hà Nội', isDefault: true },
  { name: 'Phan Thủy', phone: '(+84) 0363901223', address: '527 đường C6 Phường C6, Quận Bắc Từ Liêm, Hà Nội' },
];

const ListAdressScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('Payment')}>
  <Icon name="arrow-left" size={24} color="#000" />
</TouchableOpacity>
        <Text style={styles.headerTitle}>List Addresses</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {ListAddress.map((item, index) => (
          <View key={index} style={styles.paymentItem}>
            <View style={styles.details}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.phone}>{item.phone}</Text>
              <Text style={styles.address}>{item.address}</Text>
            </View>
            <View style={styles.actions}>
              {item.isDefault && (
                <TouchableOpacity style={styles.defaultButton}>
                  <Text style={styles.defaultText}>Default</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => {/* handle edit address */}}>
                <Icon name="edit" size={20} color="#1E90FF" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('ShippingAddress')}
      >
        <View style={styles.addContent}>
          <Icon name="plus" size={16} color="#fff" style={styles.addIcon} />
          <Text style={styles.addText}>Add</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 10 },
  header: {
     marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  backButton: { position: 'absolute', left: 0 },
  headerTitle: { fontSize: 24, fontWeight: 'bold' },
  scrollContent: { paddingBottom: 20 },
  paymentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  details: { flex: 1 },
  name: { fontSize: 16, fontWeight: 'bold' },
  phone: { fontSize: 14, color: '#666' },
  address: { fontSize: 14, color: '#666' },
  actions: { flexDirection: 'row', alignItems: 'center' },
  defaultButton: {
    backgroundColor: '#1E90FF',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  defaultText: { color: '#fff', fontSize: 12 },
  addButton: {
    backgroundColor: '#1E90FF',
    paddingVertical: 12,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  addContent: { flexDirection: 'row', alignItems: 'center' },
  addIcon: { marginRight: 5 },
  addText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default ListAdressScreen;
