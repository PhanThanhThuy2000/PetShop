import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const countries = [
  { code: '+84', name: 'Vietnam', flag: '🇻🇳' },
  { code: '+1', name: 'USA', flag: '🇺🇸' },
  { code: '+91', name: 'India', flag: '🇮🇳' },
  { code: '+92', name: 'Pakistan', flag: '🇵🇰' },
];

const ShippingAddressScreen = () => {
  const [selectedCountry, setSelectedCountry] = useState(countries[3]); // mặc định 🇵🇰
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <View style={styles.container}>
      {/* Nút back */}
      <TouchableOpacity onPress={() => {}} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="black" />
      </TouchableOpacity>

      {/* Tiêu đề */}
      <Text style={styles.title}>Shipping Address</Text>

      {/* Chọn quốc gia */}
      <Text style={styles.labelSmall}>Country</Text>
      <View style={styles.rowBetween}>
        <Text style={styles.labelLarge}>Choose your country</Text>
        <TouchableOpacity>
          <Ionicons name="arrow-forward-circle" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Tên người dùng */}
      <Text style={styles.label}>user name</Text>
      <TextInput style={styles.input} placeholder="Enter full name" />

      {/* Số điện thoại */}
      <Text style={styles.label}>Phone Number</Text>
      <View style={styles.phoneRow}>
        {/* Bấm để chọn quốc gia */}
        <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.flagBox}>
          <Text style={{ fontSize: 20 }}>{selectedCountry.flag}</Text>
        </TouchableOpacity>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholder={selectedCountry.code}
          keyboardType="phone-pad"
        />
      </View>

      {/* Thành phố */}
      <Text style={styles.label}>Town / City</Text>
      <TextInput style={styles.input} placeholder="Select City" />

      {/* Địa chỉ */}
      <Text style={styles.label}>
        Street Address <Text style={{ color: 'red' }}>*</Text>
      </Text>
      <TextInput style={styles.input} placeholder="Enter street address" />

      {/* Mô tả */}
      <Text style={styles.label}>Describe</Text>
      <TextInput style={styles.input} placeholder="Enter describe" />

      {/* Nút lưu */}
      <TouchableOpacity style={styles.saveButton}>
        <Text style={styles.saveButtonText}>Save Changes</Text>
      </TouchableOpacity>

      {/* Modal chọn quốc gia */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {countries.map((country, index) => (
              <TouchableOpacity
                key={index}
                style={styles.countryItem}
                onPress={() => {
                  setSelectedCountry(country);
                  setModalVisible(false);
                }}
              >
                <Text style={{ fontSize: 18 }}>
                  {country.flag}  {country.name} ({country.code})
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    alignSelf: 'center',
    marginBottom: 20,
    marginTop: 17,
  },
  labelSmall: {
    fontSize: 12,
    color: '#777',
  },
  labelLarge: {
    fontSize: 16,
    fontWeight: '600',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    marginBottom: 5,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#f7f7f7',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  flagBox: {
    padding: 10,
    backgroundColor: '#e6e6e6',
    borderRadius: 10,
    marginRight: 10,
  },
  saveButton: {
    backgroundColor: '#0066FF',
    marginTop: 30,
    paddingVertical: 15,
    borderRadius: 10,
  },
  saveButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    width: '80%',
  },
  countryItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
});

export default ShippingAddressScreen;
