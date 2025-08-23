import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import api from '../utils/api-client'; // Import the configured axios instance

const countries = [
  { code: '+84', name: 'Việt Nam', flag: '🇻🇳' },
];

const PROVINCES_API_BASE_URL = 'https://provinces.open-api.vn/api';

const ShippingAddressScreen = () => {
  const navigation = useNavigation<any>();

  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [modalVisible, setModalVisible] = useState(false);

  const [userName, setUserName] = useState('');
  const [phone, setPhone] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [note, setNote] = useState('');

  const [provinces, setProvinces] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);

  const [province, setProvince] = useState<string>('');
  const [district, setDistrict] = useState<string>('');
  const [ward, setWard] = useState<string>('');

  useEffect(() => {
    axios.get(`${PROVINCES_API_BASE_URL}/?depth=1`).then(res => setProvinces(res.data));
  }, []);

  useEffect(() => {
    if (province) {
      axios.get(`${PROVINCES_API_BASE_URL}/p/${province}?depth=2`).then(res => {
        setDistricts(res.data.districts);
        setDistrict('');
        setWards([]);
        setWard('');
      });
    }
  }, [province]);

  useEffect(() => {
    if (district) {
      axios.get(`${PROVINCES_API_BASE_URL}/d/${district}?depth=2`).then(res => {
        setWards(res.data.wards);
        setWard('');
      });
    }
  }, [district]);

  const handleSaveAddress = async () => {
    if (!userName || !phone || !province || !district || !ward || !postalCode || !note) {
      return Alert.alert('Thiếu thông tin', 'Vui lòng điền đầy đủ các trường.');
    }

    try {
      let token = await AsyncStorage.getItem('token');
      if (!token) return Alert.alert('Không tìm thấy token');
      if (!token.startsWith('Bearer ')) token = 'Bearer ' + token;

      const addressData = {
        name: userName,
        phone,
        province,
        district,
        ward,
        postal_code: postalCode,
        country: selectedCountry.name,
        note,
        is_default: false,
      };

      await api.post('/addresses', addressData);

      Alert.alert('✅ Thành công', 'Đã lưu địa chỉ');
      navigation.goBack();
    } catch (err) {
      console.error(err);
      Alert.alert('Lỗi', 'Không thể lưu địa chỉ');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#2C3E50" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thêm địa chỉ mới</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Country Selection */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Quốc gia</Text>
          <TouchableOpacity style={styles.countrySelector} onPress={() => setModalVisible(true)}>
            <View style={styles.countryInfo}>
              <Text style={styles.flagText}>{selectedCountry.flag}</Text>
              <Text style={styles.countryName}>{selectedCountry.name}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#BDC3C7" />
          </TouchableOpacity>
        </View>

        {/* Personal Information */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Họ và tên *</Text>
            <TextInput
              style={styles.input}
              value={userName}
              onChangeText={setUserName}
              placeholder="Nhập họ và tên"
              placeholderTextColor="#95A5A6"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Số điện thoại *</Text>
            <View style={styles.phoneContainer}>
              <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.flagContainer}>
                <Text style={styles.flagEmoji}>{selectedCountry.flag}</Text>
                <Text style={styles.countryCode}>{selectedCountry.code}</Text>
              </TouchableOpacity>
              <TextInput
                style={[styles.input, styles.phoneInput]}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
                placeholder="Nhập số điện thoại"
                placeholderTextColor="#95A5A6"
              />
            </View>
          </View>
        </View>

        {/* Address Information */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Địa chỉ giao hàng</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tỉnh/Thành phố *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={province}
                onValueChange={(code) => {
                  const selected = provinces.find(p => p.code === code);
                  setProvince(selected?.name || '');
                  if (code) {
                    axios.get(`${PROVINCES_API_BASE_URL}/p/${code}?depth=2`).then(res => {
                      setDistricts(res.data.districts);
                      setDistrict('');
                      setWards([]);
                      setWard('');
                    });
                  }
                }}
                style={styles.picker}
              >
                <Picker.Item label="Chọn tỉnh/thành phố" value="" />
                {provinces.map(p => (
                  <Picker.Item key={p.code} label={p.name} value={p.code} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Quận/Huyện *</Text>
            <View style={[styles.pickerContainer, !province && styles.disabledPicker]}>
              <Picker
                selectedValue={district}
                onValueChange={(code) => {
                  const selected = districts.find(d => d.code === code);
                  setDistrict(selected?.name || '');
                  if (code) {
                    axios.get(`${PROVINCES_API_BASE_URL}/d/${code}?depth=2`).then(res => {
                      setWards(res.data.wards);
                      setWard('');
                    });
                  }
                }}
                enabled={!!province}
                style={styles.picker}
              >
                <Picker.Item label="Chọn quận/huyện" value="" />
                {districts.map(d => (
                  <Picker.Item key={d.code} label={d.name} value={d.code} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phường/Xã *</Text>
            <View style={[styles.pickerContainer, !district && styles.disabledPicker]}>
              <Picker
                selectedValue={ward}
                onValueChange={(code) => {
                  const selected = wards.find(w => w.code === code);
                  setWard(selected?.name || '');
                }}
                enabled={!!district}
                style={styles.picker}
              >
                <Picker.Item label="Chọn phường/xã" value="" />
                {wards.map(w => (
                  <Picker.Item key={w.code} label={w.name} value={w.code} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Địa chỉ cụ thể *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Số nhà, tên đường, khu vực..."
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              placeholderTextColor="#95A5A6"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mã bưu điện *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ví dụ: 700000"
              value={postalCode}
              onChangeText={setPostalCode}
              keyboardType="numeric"
              placeholderTextColor="#95A5A6"
            />
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSaveAddress}>
          <Ionicons name="location" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.saveButtonText}>Lưu địa chỉ</Text>
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Country Selection Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn quốc gia</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#2C3E50" />
              </TouchableOpacity>
            </View>
            {countries.map((country, index) => (
              <TouchableOpacity
                key={index}
                style={styles.countryOption}
                onPress={() => {
                  setSelectedCountry(country);
                  setModalVisible(false);
                }}
              >
                <View style={styles.countryOptionContent}>
                  <Text style={styles.countryOptionFlag}>{country.flag}</Text>
                  <View style={styles.countryOptionInfo}>
                    <Text style={styles.countryOptionName}>{country.name}</Text>
                    <Text style={styles.countryOptionCode}>{country.code}</Text>
                  </View>
                </View>
                {selectedCountry.code === country.code && (
                  <Ionicons name="checkmark" size={20} color="#27AE60" />
                )}
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
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8EAED',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 16,
  },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E8EAED',
  },
  countryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flagText: {
    fontSize: 20,
    marginRight: 12,
  },
  countryName: {
    fontSize: 16,
    color: '#2C3E50',
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#34495E',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E8EAED',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    fontSize: 16,
    color: '#2C3E50',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E8EAED',
    marginRight: 8,
    minWidth: 80,
  },
  flagEmoji: {
    fontSize: 16,
    marginRight: 4,
  },
  countryCode: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  phoneInput: {
    flex: 1,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#E8EAED',
    borderRadius: 8,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  disabledPicker: {
    backgroundColor: '#F8F9FA',
    opacity: 0.6,
  },
  picker: {
    height: 50,
    color: '#2C3E50',
  },
  saveButton: {
    backgroundColor: '#27AE60',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 24,
    elevation: 3,
    shadowColor: '#27AE60',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '85%',
    maxHeight: '70%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E8EAED',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
  },
  countryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
  },
  countryOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  countryOptionFlag: {
    fontSize: 20,
    marginRight: 16,
  },
  countryOptionInfo: {
    flex: 1,
  },
  countryOptionName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2C3E50',
  },
  countryOptionCode: {
    fontSize: 14,
    color: '#7F8C8D',
    marginTop: 2,
  },
});

export default ShippingAddressScreen;