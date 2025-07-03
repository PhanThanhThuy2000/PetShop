import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView, // Thêm ScrollView
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const countries = [
  { code: '+84', name: 'Vietnam', flag: '🇻🇳' },
];

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
    axios.get('https://provinces.open-api.vn/api/?depth=1').then(res => setProvinces(res.data));
  }, []);

  useEffect(() => {
    if (province) {
      axios.get(`https://provinces.open-api.vn/api/p/${province}?depth=2`).then(res => {
        setDistricts(res.data.districts);
        setDistrict('');
        setWards([]);
        setWard('');
      });
    }
  }, [province]);

  useEffect(() => {
    if (district) {
      axios.get(`https://provinces.open-api.vn/api/d/${district}?depth=2`).then(res => {
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

      await axios.post('http://192.168.177.162:5000/api/addresses', addressData, {
        headers: { Authorization: token },
      });

      Alert.alert('✅ Thành công', 'Đã lưu địa chỉ');
      navigation.goBack();
    } catch (err) {
      console.error(err);
      Alert.alert('Lỗi', 'Không thể lưu địa chỉ');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="#000" />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Shipping Address</Text>

        {/* Chọn quốc gia */}
        <Text style={styles.labelSmall}>Country</Text>
        <View style={styles.rowBetween}>
          <Text style={styles.labelLarge}>{selectedCountry.name}</Text>
          <TouchableOpacity onPress={() => setModalVisible(true)}>
            <Ionicons name="arrow-forward-circle" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>

        {/* Tên và số điện thoại */}
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

        {/* Tỉnh / huyện / xã */}
        <Text style={styles.label}>Province</Text>
        <Picker
          selectedValue={province}
          onValueChange={(code) => {
            const selected = provinces.find(p => p.code === code);
            setProvince(selected?.name || '');
            axios.get(`https://provinces.open-api.vn/api/p/${code}?depth=2`).then(res => {
              setDistricts(res.data.districts);
              setDistrict('');
              setWards([]);
              setWard('');
            });
          }}
        >
          <Picker.Item label="Chọn tỉnh" value="" />
          {provinces.map(p => <Picker.Item key={p.code} label={p.name} value={p.code} />)}
        </Picker>

        <Text style={styles.label}>District</Text>
        <Picker
          selectedValue={district}
          onValueChange={(code) => {
            const selected = districts.find(d => d.code === code);
            setDistrict(selected?.name || '');
            axios.get(`https://provinces.open-api.vn/api/d/${code}?depth=2`).then(res => {
              setWards(res.data.wards);
              setWard('');
            });
          }}
          enabled={!!province}
        >
          <Picker.Item label="Chọn huyện" value="" />
          {districts.map(d => <Picker.Item key={d.code} label={d.name} value={d.code} />)}
        </Picker>

        <Text style={styles.label}>Ward</Text>
        <Picker
          selectedValue={ward}
          onValueChange={(code) => {
            const selected = wards.find(w => w.code === code);
            setWard(selected?.name || '');
          }}
          enabled={!!district}
        >
          <Picker.Item label="Chọn xã" value="" />
          {wards.map(w => <Picker.Item key={w.code} label={w.name} value={w.code} />)}
        </Picker>

        {/* Ghi chú và mã bưu chính */}
        <Text style={styles.label}>Ghi chú địa chỉ</Text>
        <TextInput
          style={styles.input}
          placeholder="VD: số nhà, tên đường..."
          value={note}
          onChangeText={setNote}
        />

        <Text style={styles.label}>Postal Code</Text>
        <TextInput
          style={styles.input}
          placeholder="VD: 700000"
          value={postalCode}
          onChangeText={setPostalCode}
        />

        <TouchableOpacity style={styles.saveButton} onPress={handleSaveAddress}>
          <Text style={styles.saveButtonText}>Lưu địa chỉ</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal chọn quốc gia */}
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
  scrollContent: { paddingBottom: 20 }, // Thêm style cho ScrollView
  backButton: { position: 'absolute', top: 40, left: 20, zIndex: 10 },
  title: { fontSize: 22, fontWeight: 'bold', alignSelf: 'center', marginBottom: 20, marginTop: 20 },
  label: { fontSize: 14, marginTop: 15 },
  labelSmall: { fontSize: 12, color: '#777' },
  labelLarge: { fontSize: 16, fontWeight: '600' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  input: {
    borderWidth: 1, borderColor: '#ccc', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#f7f7f7', marginBottom: 5
  },
  phoneRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  flagBox: { padding: 10, backgroundColor: '#e6e6e6', borderRadius: 10, marginRight: 10 },
  saveButton: { backgroundColor: '#0066FF', marginTop: 30, paddingVertical: 15, borderRadius: 10 },
  saveButtonText: { color: '#fff', textAlign: 'center', fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { backgroundColor: '#fff', padding: 20, borderRadius: 12, width: '80%' },
  countryItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
});

export default ShippingAddressScreen;