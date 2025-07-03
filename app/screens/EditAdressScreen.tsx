import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import api from '../utils/api-client'; // Import the configured axios instance

const countries = [
  { code: '+84', name: 'Vietnam', flag: '🇻🇳' },
];

const PROVINCES_API_BASE_URL = 'https://provinces.open-api.vn/api';
const EditAddressScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const address = route.params?.address;

  const [selectedCountry, setSelectedCountry] = useState(
    countries.find(c => c.name === address?.country) || countries[0]
  );
  const [modalVisible, setModalVisible] = useState(false);

  const [userName, setUserName] = useState(address?.name || '');
  const [phone, setPhone] = useState(address?.phone || '');
  const [postalCode, setPostalCode] = useState(address?.postal_code || '');
  const [note, setNote] = useState(address?.note || '');

  const [provinces, setProvinces] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);

  const [province, setProvince] = useState<string>('');
  const [district, setDistrict] = useState<string>('');
  const [ward, setWard] = useState<string>('');

  // Fetch provinces on load and set initial province code
  useEffect(() => {
    axios
      .get(`${PROVINCES_API_BASE_URL}/?depth=1`)
      .then(res => {
        if (Array.isArray(res.data)) {
          setProvinces(res.data);
          // Match address?.province (name) to province code
          if (address?.province) {
            const matchedProvince = res.data.find(
              (p: any) => p.name === address.province
            );
            if (matchedProvince) {
              setProvince(matchedProvince.code.toString());
            }
          }
        } else {
          console.error('Provinces data is not an array:', res.data);
          setProvinces([]);
        }
      })
      .catch(err => {
        console.error('Error fetching provinces:', err);
        setProvinces([]);
      });
  }, [address?.province]);

  // Fetch districts when province changes
  useEffect(() => {
    if (province && !isNaN(parseInt(province))) {
      axios
        .get(`${PROVINCES_API_BASE_URL}/p/${province}?depth=2`)
        .then(res => {
          if (res.data?.districts && Array.isArray(res.data.districts)) {
            setDistricts(res.data.districts);
            // Match address?.district (name) to district code
            if (address?.district && res.data.districts.length > 0) {
              const matchedDistrict = res.data.districts.find(
                (d: any) => d.name === address.district
              );
              if (matchedDistrict) {
                setDistrict(matchedDistrict.code.toString());
              }
            }
          } else {
            console.error('Districts data is not valid:', res.data);
            setDistricts([]);
          }
        })
        .catch(err => {
          console.error('Error fetching districts:', err);
          setDistricts([]);
        });
    } else {
      setDistricts([]);
      setDistrict('');
    }
  }, [province, address?.district]);

  // Fetch wards when district changes
  useEffect(() => {
    if (district && !isNaN(parseInt(district))) {
      axios
        .get(`${PROVINCES_API_BASE_URL}/d/${district}?depth=2`)
        .then(res => {
          if (res.data?.wards && Array.isArray(res.data.wards)) {
            setWards(res.data.wards);
            // Match address?.ward (name) to ward code
            if (address?.ward && res.data.wards.length > 0) {
              const matchedWard = res.data.wards.find(
                (w: any) => w.name === address.ward
              );
              if (matchedWard) {
                setWard(matchedWard.code.toString());
              }
            }
          } else {
            console.error('Wards data is not valid:', res.data);
            setWards([]);
          }
        })
        .catch(err => {
          console.error('Error fetching wards:', err);
          setWards([]);
        });
    } else {
      setWards([]);
      setWard('');
    }
  }, [district, address?.ward]);

  const handleUpdateAddress = async () => {
    if (!userName || !phone || !province || !district || !ward || !postalCode || !note) {
      return Alert.alert('Thiếu thông tin', 'Vui lòng điền đầy đủ các trường.');
    }

    try {
      let token = await AsyncStorage.getItem('token');
      if (!token) return Alert.alert('Không tìm thấy token');
      if (!token.startsWith('Bearer ')) token = 'Bearer ' + token;

      // Map codes back to names for the API update
      const selectedProvince = provinces.find(p => p.code.toString() === province);
      const selectedDistrict = districts.find(d => d.code.toString() === district);
      const selectedWard = wards.find(w => w.code.toString() === ward);

      const updatedData = {
        name: userName,
        phone,
        province: selectedProvince?.name || '',
        district: selectedDistrict?.name || '',
        ward: selectedWard?.name || '',
        postal_code: postalCode,
        country: selectedCountry.name,
        note,
        is_default: address?.is_default || false,
      };

      await api.put(`/addresses/${address._id}`, updatedData);

      Alert.alert('✅ Thành công', 'Cập nhật địa chỉ thành công');
      navigation.navigate('ListAdress');
    } catch (error) {
      console.error('Lỗi cập nhật địa chỉ:', error);
      Alert.alert('Lỗi', 'Không thể cập nhật địa chỉ');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="#000" />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Update Shipping Address</Text>

        <Text style={styles.labelSmall}>Country</Text>
        <View style={styles.rowBetween}>
          <Text style={styles.labelLarge}>{selectedCountry.name}</Text>
          <TouchableOpacity onPress={() => setModalVisible(true)}>
            <Ionicons name="arrow-forward-circle" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Full Name</Text>
        <TextInput style={styles.input} value={userName} onChangeText={setUserName} placeholder="Full Name" />

        <Text style={styles.label}>Phone</Text>
        <View style={styles.phoneRow}>
          <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.flagBox}>
            <Text style={{ fontSize: 20 }}>{selectedCountry.flag}</Text>
          </TouchableOpacity>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            placeholder={selectedCountry.code}
          />
        </View>

        <Text style={styles.label}>Province</Text>
        <Picker selectedValue={province} onValueChange={v => setProvince(v)}>
          <Picker.Item label="Chọn tỉnh" value="" />
          {provinces.map(p => (
            <Picker.Item
              key={p.code || `province-${p.name}`}
              label={p.name || 'Unknown'}
              value={p.code ? p.code.toString() : ''}
            />
          ))}
        </Picker>

        <Text style={styles.label}>District</Text>
        <Picker selectedValue={district} onValueChange={v => setDistrict(v)} enabled={!!province}>
          <Picker.Item label="Chọn huyện" value="" />
          {districts.map(d => (
            <Picker.Item
              key={d.code || `district-${d.name}`}
              label={d.name || 'Unknown'}
              value={d.code ? d.code.toString() : ''}
            />
          ))}
        </Picker>

        <Text style={styles.label}>Ward</Text>
        <Picker selectedValue={ward} onValueChange={v => setWard(v)} enabled={!!district}>
          <Picker.Item label="Chọn xã" value="" />
          {wards.map(w => (
            <Picker.Item
              key={w.code || `ward-${w.name}`}
              label={w.name || 'Unknown'}
              value={w.code ? w.code.toString() : ''}
            />
          ))}
        </Picker>

        <Text style={styles.label}>Ghi chú địa chỉ</Text>
        <TextInput style={styles.input} placeholder="VD: số nhà, tên đường..." value={note} onChangeText={setNote} />

        <Text style={styles.label}>Postal Code</Text>
        <TextInput style={styles.input} placeholder="VD: 700000" value={postalCode} onChangeText={setPostalCode} />

        <TouchableOpacity style={styles.saveButton} onPress={handleUpdateAddress}>
          <Text style={styles.saveButtonText}>Update Address</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="slide">
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
                  {country.flag} {country.name} ({country.code})
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
  container: { padding: 20, backgroundColor: '#fff', flex: 1 },
  backButton: { position: 'absolute', top: 40, left: 20, zIndex: 10 },
  scrollContent: { paddingBottom: 20 },
  title: { fontSize: 22, fontWeight: 'bold', alignSelf: 'center', marginBottom: 20, marginTop: 20 },
  label: { fontSize: 14, marginTop: 15 },
  labelSmall: { fontSize: 12, color: '#777' },
  labelLarge: { fontSize: 16, fontWeight: '600' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#f7f7f7',
    marginBottom: 5,
  },
  phoneRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  flagBox: { padding: 10, backgroundColor: '#e6e6e6', borderRadius: 10, marginRight: 10 },
  saveButton: { backgroundColor: '#0066FF', marginTop: 30, paddingVertical: 15, borderRadius: 10 },
  saveButtonText: { color: '#fff', textAlign: 'center', fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { backgroundColor: '#fff', padding: 20, borderRadius: 12, width: '80%' },
  countryItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
});

export default EditAddressScreen;