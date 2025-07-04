import { Entypo, FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Image, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import api, { API_BASE_URL } from '../utils/api-client';
// tai khoan test ngan hang noi dia
// Ngân hàng: NCB
// Số thẻ: 9704198526191432198
// Tên chủ thẻ: NGUYEN VAN A
// Ngày phát hành: 07/15
// Mật khẩu OTP: 123456
// Define Address interface (consistent with ListAddressScreen)
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

const PaymentScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  // Extract data from params with fallback
  const { cartItems, total, selectedAddress } = route.params || { cartItems: [], total: 0, selectedAddress: null };

  const [shippingMethod, setShippingMethod] = useState<'standard' | 'express'>('standard');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'vnpay'>('cod');
  const [address, setAddress] = useState<Address | null>(selectedAddress);
  const [loadingAddress, setLoadingAddress] = useState<boolean>(true);

  const SERVER_URLS = [API_BASE_URL.replace(/\/api$/, '')];

  // Fetch default address
  const fetchDefaultAddress = async () => {
    setLoadingAddress(true);
    try {
      const res = await api.get('/addresses');
      const addresses = res.data.data as Address[];
      const defaultAddress = addresses.find(addr => addr.is_default) || addresses[0] || null;
      setAddress(defaultAddress);
    } catch (error: any) {
      console.error('Lỗi khi lấy địa chỉ:', error.message || error);
      Alert.alert('Lỗi', 'Không thể tải địa chỉ');
    } finally {
      setLoadingAddress(false);
    }
  };

  useEffect(() => {
    // If a selectedAddress is passed, use it; otherwise, fetch the default address
    if (selectedAddress) {
      setAddress(selectedAddress);
      setLoadingAddress(false);
    } else {
      fetchDefaultAddress();
    }

    // Add focus listener to refresh address when returning to PaymentScreen
    const unsubscribe = navigation.addListener('focus', () => {
      if (!selectedAddress) {
        fetchDefaultAddress(); // Refresh address if no selectedAddress is provided
      }
    });

    // Validate total
    if (!total || isNaN(total) || total <= 0) {
      console.warn('Invalid total from route.params:', total);
      Alert.alert('Lỗi', 'Tổng tiền giỏ hàng không hợp lệ. Vui lòng kiểm tra giỏ hàng.');
    }

    return () => unsubscribe;
  }, [navigation, selectedAddress, total]);

  const summaryData = {
    merchandiseSubtotal: total && !isNaN(total) && total > 0 ? total.toLocaleString('vi-VN') + ' ₫' : '0 ₫',
    shippingSubtotal: shippingMethod === 'standard' ? '0 ₫' : '50.000 ₫',
    discount: '10.000 ₫',
  };

  const parseCurrency = (currency: string): number => {
    try {
      const cleaned = currency.replace(/[^\d-]/g, '');
      const value = Number(cleaned);
      if (isNaN(value)) {
        console.warn(`Invalid currency format: ${currency}`);
        return 0;
      }
      return value;
    } catch (error) {
      console.error(`Error parsing currency: ${currency}`, error);
      return 0;
    }
  };

  const calculateTotal = () => {
    const merchandise = parseCurrency(summaryData.merchandiseSubtotal);
    const shipping = parseCurrency(summaryData.shippingSubtotal);
    const discount = parseCurrency(summaryData.discount);

    console.log('Calculating total:', { merchandise, shipping, discount, inputTotal: total });

    if (!total || isNaN(total) || total <= 0) {
      console.warn('Invalid total from route.params:', total);
      Alert.alert('Lỗi', 'Tổng tiền giỏ hàng không hợp lệ. Vui lòng kiểm tra giỏ hàng.');
      return 0;
    }

    const totalCalculated = merchandise + shipping - discount;
    return isNaN(totalCalculated) ? 0 : Math.max(totalCalculated, 0);
  };

  const handleVNPAYPayment = async () => {
    if (paymentMethod !== 'vnpay') {
      Alert.alert('Lỗi', 'Vui lòng chọn phương thức thanh toán VNPay');
      return;
    }

    let lastError = null;
    const totalAmount = calculateTotal();

    for (const serverUrl of SERVER_URLS) {
      try {
        console.log('Trying to connect to:', serverUrl);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(`${serverUrl}/create-vnpay-payment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({ amount: totalAmount }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorText}`);
        }

        const data = await response.json();
        console.log('API response data:', data);

        if (!data.paymentUrl) {
          throw new Error('Payment URL not received from server');
        }

        console.log('Payment URL:', data.paymentUrl);
        const urlParams = new URLSearchParams(data.paymentUrl.split('?')[1]);
        console.log('VNPay vnp_Amount:', urlParams.get('vnp_Amount'));

        const supported = await Linking.canOpenURL(data.paymentUrl);
        console.log('Can open URL:', supported);

        if (supported) {
          await Linking.openURL(data.paymentUrl);

          Linking.addEventListener('url', ({ url }) => {
            console.log('Received URL:', url);
            if (url.includes('success')) {
              navigation.navigate('OrderSuccess');
            } else if (url.includes('failure')) {
              Alert.alert('Lỗi', 'Thanh toán thất bại. Vui lòng thử lại.');
            }
          });
          return;
        } else {
          throw new Error('Không thể mở URL thanh toán');
        }
      } catch (error) {
        const err = error as Error;
        console.log('Failed to connect to', serverUrl, 'Error:', err.message);
        lastError = err;
        continue;
      }
    }

    console.log('All connection attempts failed. Last error:', {
      message: lastError?.message,
      stack: lastError?.stack,
      name: lastError?.name,
    });

    let errorMessage =
      'Không thể kết nối đến máy chủ thanh toán. Vui lòng kiểm tra:\n';

    if (lastError?.name === 'AbortError') {
      errorMessage += 'Lỗi: Kết nối bị timeout sau 5 giây';
    } else {
      errorMessage += 'Chi tiết lỗi: ' + lastError?.message;
    }

    Alert.alert('Lỗi Thanh Toán', errorMessage);
  };

  const handlePay = () => {
    if (!address) {
      Alert.alert('Lỗi', 'Vui lòng chọn hoặc thêm địa chỉ giao hàng');
      navigation.navigate('ListAddress', { selectMode: true, cartItems, total });
      return;
    }

    if (paymentMethod === 'vnpay') {
      handleVNPAYPayment();
    } else if (paymentMethod === 'cod') {
      Alert.alert('Thành công', 'Đặt hàng với phương thức thanh toán COD thành công!');
      navigation.navigate('OrderSuccess');
    } else {
      Alert.alert('Lỗi', 'Vui lòng chọn phương thức thanh toán');
    }
  };

  const isHandled = useRef(false);

  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      const url = event.url;
      if (url.includes('payment-result') && !isHandled.current) {
        isHandled.current = true;
        navigation.navigate('OrderSuccess');
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);

    Linking.getInitialURL().then((url) => {
      if (url && url.includes('payment-result') && !isHandled.current) {
        isHandled.current = true;
        navigation.navigate('OrderSuccess');
      }
    });

    return () => {
      subscription.remove();
    };
  }, [navigation]);

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Address */}
      <View style={styles.addressBox}>
        {loadingAddress ? (
          <Text style={styles.gray}>Đang tải địa chỉ...</Text>
        ) : address ? (
          <>
            <View style={{ flex: 1 }}>
              <Text style={styles.bold}>
                {address.name} <Text style={styles.gray}>({address.phone})</Text>
              </Text>
              <Text style={styles.gray}>
                {`${address.note}, ${address.ward}, ${address.district}, ${address.province}, ${address.postal_code}, ${address.country}`}
              </Text>
            </View>
              <TouchableOpacity onPress={() => navigation.navigate('ListAdress', { selectMode: true, cartItems, total })}>
              <MaterialIcons name="edit" size={20} color="#1976D2" />
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={{ flex: 1 }}>
              <Text style={styles.gray}>Chưa có địa chỉ</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('ListAddress', { selectMode: true, cartItems, total })}>
              <MaterialIcons name="add" size={20} color="#1976D2" />
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Items */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Items</Text>
          <View style={styles.discountTag}>
            <Text style={styles.discountText}>5% Discount</Text>
            <Entypo name="cross" size={12} color="#fff" />
          </View>
        </View>
        {cartItems.map((item: any) => (
          <ItemRow
            key={item.id}
            name={item.title}
            price={(item.price * item.quantity).toLocaleString('vi-VN') + ' ₫'}
            image={item.image?.uri || item.image}
          />
        ))}
      </View>

      {/* Shipping Options */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Shipping Options</Text>
        <TouchableOpacity
          style={[styles.shippingOption, shippingMethod === 'standard' && styles.shippingActive]}
          onPress={() => setShippingMethod('standard')}
        >
          <View style={styles.radioCircle}>
            {shippingMethod === 'standard' && <View style={styles.selectedDot} />}
          </View>
          <View style={styles.shippingLabel}>
            <Text style={styles.shippingText}>Standard</Text>
            <Text style={styles.shippingTime}>5-7 days</Text>
          </View>
          <Text style={styles.shippingFree}>FREE</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.shippingOption, shippingMethod === 'express' && styles.shippingActive]}
          onPress={() => setShippingMethod('express')}
        >
          <View style={styles.radioCircle}>
            {shippingMethod === 'express' && <View style={styles.selectedDot} />}
          </View>
          <View style={styles.shippingLabel}>
            <Text style={styles.shippingText}>Express</Text>
            <Text style={styles.shippingTime}>1-2 days</Text>
          </View>
          <Text style={styles.shippingPrice}>50.000 ₫</Text>
        </TouchableOpacity>
        <Text style={styles.deliveryNote}>Delivered on or before Thursday, 23 April 2020</Text>
      </View>

      {/* Payment Method */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Method</Text>
        {[
          { id: 'cod', label: 'Cash on Delivery', icon: 'money-check' },
          { id: 'vnpay', label: 'Vn Pay', icon: 'money-bill-wave' },
        ].map((method) => (
          <TouchableOpacity
            key={method.id}
            style={styles.paymentOption}
            onPress={() => setPaymentMethod(method.id as any)}
          >
            <FontAwesome5 name={method.icon as any} size={20} color="#1976D2" style={{ width: 30 }} />
            <Text style={{ flex: 1 }}>{method.label}</Text>
            <View style={styles.radioCircle}>
              {paymentMethod === method.id && <View style={styles.selectedDot} />}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Summary</Text>
        <SummaryRow label="Merchandise Subtotal" value={summaryData.merchandiseSubtotal} />
        <SummaryRow label="Shipping Subtotal" value={summaryData.shippingSubtotal} />
        <SummaryRow label="Discount" value={summaryData.discount} />
      </View>

      {/* Total */}
      <View style={styles.totalRow}>
        <Text style={styles.totalText}>Total</Text>
        <Text style={styles.totalPrice}>{calculateTotal().toLocaleString('vi-VN') + ' ₫'}</Text>
      </View>
      <TouchableOpacity style={styles.payButton} onPress={handlePay}>
        <Text style={styles.payText}>Pay</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const ItemRow = ({ name, price, image }: { name: string; price: string; image: string }) => (
  <View style={styles.itemRow}>
    <Image source={{ uri: image }} style={styles.itemImage} />
    <Text style={{ flex: 1 }}>{name}</Text>
    <Text style={styles.itemPrice}>{price}</Text>
  </View>
);

const SummaryRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.summaryRow}>
    <Text style={styles.gray}>{label}</Text>
    <Text style={styles.gray}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
  },
  header: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  addressBox: {
    backgroundColor: '#F2F2F2',
    padding: 14,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  bold: {
    fontWeight: 'bold',
  },
  gray: {
    color: '#666',
    fontSize: 13,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
    fontSize: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  discountTag: {
    flexDirection: 'row',
    backgroundColor: '#1976D2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    alignItems: 'center',
    gap: 4,
  },
  discountText: {
    color: '#fff',
    fontSize: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  itemImage: {
    width: 44,
    height: 44,
    borderRadius: 8,
    marginRight: 12,
  },
  itemPrice: {
    fontWeight: 'bold',
    color: '#000',
  },
  shippingOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F3F3',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  shippingActive: {
    borderWidth: 1,
    borderColor: '#1976D2',
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#1976D2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  selectedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1976D2',
  },
  shippingLabel: {
    flex: 1,
  },
  shippingText: {
    fontWeight: '500',
  },
  shippingTime: {
    color: '#1976D2',
    fontSize: 13,
  },
  shippingFree: {
    color: '#1976D2',
    fontWeight: 'bold',
  },
  shippingPrice: {
    color: '#000',
    fontWeight: 'bold',
  },
  deliveryNote: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 20,
    alignItems: 'center',
  },
  totalText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  payButton: {
    marginTop: 12,
    backgroundColor: '#1976D2',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 20,
  },
  payText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default PaymentScreen;