import { FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Image, Linking, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { vouchersService } from '../services/vouchersService';
import { ApiResponse, Order, OrderItem, Voucher } from '../types/index';
import api, { API_BASE_URL } from '../utils/api-client';

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

  const { cartItems, total, selectedAddress, petId, productId } = route.params || { cartItems: [], total: 0, selectedAddress: null, petId: null, productId: null };

  const [shippingMethod, setShippingMethod] = useState<'standard' | 'express'>('standard');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'vnpay'>('cod');
  const [address, setAddress] = useState<Address | null>(selectedAddress);
  const [loadingAddress, setLoadingAddress] = useState<boolean>(true);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [userVouchers, setUserVouchers] = useState<Voucher[]>([]);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const selectedVoucherRef = useRef<Voucher | null>(null);

  // Cập nhật ref mỗi khi selectedVoucher thay đổi
  useEffect(() => {
    selectedVoucherRef.current = selectedVoucher;
  }, [selectedVoucher]);

  const SERVER_URLS = [API_BASE_URL.replace(/\/api$/, '')];

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

  const fetchUserVouchers = async () => {
    try {
      const response = await api.get('/vouchers');
      if (response.data.success) {
        // Nếu có thể lấy được user ID hiện tại, uncomment dòng này và thay thế getCurrentUserId()
        // const currentUserId = getCurrentUserId(); 

        const validVouchers = response.data.data.filter((voucher: Voucher) => {
          const isNotExpired = new Date(voucher.expiry_date) > new Date();
          const hasUsageLeft = (voucher.used_count || 0) < voucher.max_usage;
          const meetsMinAmount = total >= voucher.min_purchase_amount;
          const isActive = voucher.status === 'active';

          // Kiểm tra user đã lưu voucher này chưa
          const isSavedByUser = voucher.saved_by_users && voucher.saved_by_users.length > 0;

          // Nếu có currentUserId, có thể check chính xác hơn:
          // const isSavedByUser = voucher.saved_by_users && voucher.saved_by_users.includes(currentUserId);

          console.log('Filtering voucher:', {
            voucherId: voucher._id,
            title: voucher.title,
            isNotExpired,
            hasUsageLeft,
            meetsMinAmount,
            isActive,
            isSavedByUser,
            saved_by_users_count: voucher.saved_by_users?.length || 0
          });

          return isNotExpired && hasUsageLeft && meetsMinAmount && isActive && isSavedByUser;
        });

        setUserVouchers(validVouchers);
      }
    } catch (error) {
      console.error('Error fetching user vouchers:', error);
    }
  };

  const calculateDiscount = () => {
    // Ưu tiên sử dụng voucher từ ref, fallback về state
    const currentVoucher = selectedVoucherRef.current || selectedVoucher;

    if (!currentVoucher) return 0;

    if (currentVoucher.discount_type === 'percentage') {
      return Math.min(total * (currentVoucher.discount_value / 100), total * 0.5);
    } else {
      return Math.min(currentVoucher.discount_value, total);
    }
  };

  useEffect(() => {
    console.log('Received total from route.params:', total);
    if (selectedAddress) {
      setAddress(selectedAddress);
      setLoadingAddress(false);
    } else {
      fetchDefaultAddress();
    }

    const unsubscribe = navigation.addListener('focus', () => {
      if (!selectedAddress) {
        fetchDefaultAddress();
      }
    });

    if (!total || isNaN(total) || total <= 0) {
      console.warn('Invalid total from route.params:', total);
      Alert.alert('Lỗi', 'Tổng tiền giỏ hàng không hợp lệ. Vui lòng kiểm tra giỏ hàng.');
    }

    return () => unsubscribe;
  }, [navigation, selectedAddress, total]);

  useEffect(() => {
    fetchUserVouchers();
  }, [total]);

  const summaryData = {
    merchandiseSubtotal: total && !isNaN(total) && total > 0 ? total.toLocaleString('vi-VN') + ' ₫' : '0 ₫',
    shippingSubtotal: shippingMethod === 'standard' ? '0 ₫' : '50.000 ₫',
    discount: selectedVoucher ? calculateDiscount().toLocaleString('vi-VN') + ' ₫' : '0 ₫',
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
    const discount = calculateDiscount(); // Sử dụng calculateDiscount() trực tiếp

    console.log('Calculating total:', {
      merchandise,
      shipping,
      discount,
      inputTotal: total,
      selectedVoucher: selectedVoucher?._id,
      voucherDiscount: selectedVoucher ? calculateDiscount() : 0
    });

    if (!total || isNaN(total) || total <= 0) {
      console.warn('Invalid total from route.params:', total);
      Alert.alert('Lỗi', 'Tổng tiền giỏ hàng không hợp lệ. Vui lòng kiểm tra giỏ hàng.');
      return 0;
    }

    const totalCalculated = merchandise + shipping - discount;
    const finalTotal = isNaN(totalCalculated) ? 0 : Math.max(totalCalculated, 0);

    console.log('Final calculated total:', finalTotal);
    return finalTotal;
  };

  // Hàm cập nhật voucher thành used (dùng chung cho COD và VNPay)
  const updateVoucherAsUsed = async () => {
    console.log('=== updateVoucherAsUsed called ===');
    console.log('selectedVoucher:', selectedVoucher);
    console.log('selectedVoucherRef.current:', selectedVoucherRef.current);

    const currentVoucher = selectedVoucherRef.current || selectedVoucher;

    if (!currentVoucher) {
      console.log('No selectedVoucher, returning...');
      return;
    }

    // Kiểm tra nếu voucher đã được sử dụng rồi thì không cập nhật nữa
    if (currentVoucher.status === 'used' || currentVoucher.status === 'inactive') {
      console.log('Voucher already used or inactive, skipping update...');
      return;
    }

    const isValidVoucher =
      currentVoucher.status === 'active' &&
      (currentVoucher.used_count || 0) < currentVoucher.max_usage &&
      new Date(currentVoucher.expiry_date) > new Date() &&
      total >= currentVoucher.min_purchase_amount;

    console.log('Voucher validation result:', isValidVoucher);
    console.log('Voucher validation details:', {
      status: currentVoucher.status,
      used_count: currentVoucher.used_count,
      max_usage: currentVoucher.max_usage,
      expiry_date: currentVoucher.expiry_date,
      total,
      min_purchase_amount: currentVoucher.min_purchase_amount,
    });

    if (!isValidVoucher) {
      Alert.alert('Lỗi', 'Voucher không hợp lệ hoặc đã hết hạn. Vui lòng kiểm tra chi tiết trong console.');
      return;
    }

    try {
      const newUsedCount = (currentVoucher.used_count || 0) + 1;
      const updateData = {
        status: newUsedCount >= currentVoucher.max_usage ? 'inactive' : 'active' as 'pending' | 'active' | 'inactive' | 'expired',
        used_count: newUsedCount,
        used_at: new Date().toISOString(),
      };
      console.log('Updating voucher with data:', updateData);

      const updatedVoucher = await vouchersService.updateVoucher(currentVoucher._id, updateData);
      console.log('API response for updateVoucher:', updatedVoucher);

      // Cập nhật cả state và ref với data từ API response
      const apiResponseVoucher = updatedVoucher.data || updatedVoucher;
      const newVoucherState = {
        ...currentVoucher,
        ...apiResponseVoucher,
      };

      setSelectedVoucher(newVoucherState);
      selectedVoucherRef.current = newVoucherState;

      console.log('Updated selectedVoucher state:', newVoucherState);

      await fetchUserVouchers();
      console.log('=== updateVoucherAsUsed completed successfully ===');
    } catch (error: any) {
      console.error('Error using voucher:', error.response?.data || error.message);

      // Nếu lỗi là voucher đã được sử dụng, thì cũng coi như thành công
      if (error.response?.data?.message === 'Voucher không hoạt động') {
        console.log('Voucher already used, treating as success...');
        await fetchUserVouchers();
        return;
      }

      Alert.alert('Lỗi', `Không thể cập nhật trạng thái voucher: ${error.response?.data?.message || error.message}`);
    }
  };

  // 🔧 FIXED PaymentScreen.tsx - Hỗ trợ variant trong createOrderAndOrderItem
  const createOrderAndOrderItem = async (vnpayData: any) => {
    try {
      console.log('vnpayData:', vnpayData);
      console.log('cartItems:', JSON.stringify(cartItems, null, 2));
      console.log('address:', address);

      // Bước 1: Tạo Order
      const orderData = {
        total_amount: calculateTotal(),
        status: vnpayData.vnp_ResponseCode === '00' && vnpayData.vnp_TransactionStatus === '00' ? 'completed' : 'pending',
        payment_method: vnpayData.paymentMethod || 'vnpay',
        vnpay_transaction_id: vnpayData.vnp_TxnRef || null,
        payment_date: vnpayData.vnp_PayDate || null,
        user_id: vnpayData.user_id,
      };
      const orderResponse = await api.post<ApiResponse<Order>>('/orders', orderData);
      const savedOrder = orderResponse.data.data;
      console.log('Order created:', savedOrder);

      // Bước 2: Tạo OrderItem cho mỗi mục trong cartItems - 🔧 SỬA ĐỂ HỖ TRỢ VARIANT
      let validItemsCount = 0;
      for (const item of cartItems) {
        console.log('Processing item:', JSON.stringify(item, null, 2));

        // 🆕 Khởi tạo orderItemData cơ bản
        const orderItemData = {
          quantity: item.quantity || 1,
          unit_price: item.price,
          order_id: savedOrder._id,
          addresses_id: address?._id,
          // Khởi tạo tất cả các ID về null
          pet_id: null,
          product_id: null,
          variant_id: null
        };

        // 🆕 XỬ LÝ THEO TYPE VỚI VARIANT SUPPORT
        if (item.type === 'variant' && item.variantId) {
          // Variant item - ưu tiên variant_id
          orderItemData.variant_id = item.variantId;
          console.log('✅ Added variant_id:', item.variantId);

        } else if (item.type === 'pet' && item.petId) {
          // Direct pet item (legacy)
          orderItemData.pet_id = item.petId;
          console.log('✅ Added pet_id:', item.petId);

        } else if (item.type === 'product' && item.productId) {
          // Product item
          orderItemData.product_id = item.productId;
          console.log('✅ Added product_id:', item.productId);

        } else {
          // 🔧 FALLBACK: Thử tìm ID từ item.id
          console.warn('⚠️ No specific type ID found, trying item.id:', item.id);

          if (item.variantId) {
            orderItemData.variant_id = item.variantId;
          } else if (item.petId) {
            orderItemData.pet_id = item.petId;
          } else if (item.productId) {
            orderItemData.product_id = item.productId;
          } else if (item.id) {
            // Cuối cùng, sử dụng item.id dựa trên type
            if (item.type === 'variant') {
              orderItemData.variant_id = item.id;
            } else if (item.type === 'pet') {
              orderItemData.pet_id = item.id;
            } else if (item.type === 'product') {
              orderItemData.product_id = item.id;
            }
          }
        }

        console.log('Final orderItemData:', orderItemData);

        // 🔧 VALIDATION: Kiểm tra có ít nhất một ID
        if (!orderItemData.pet_id && !orderItemData.product_id && !orderItemData.variant_id) {
          console.error('❌ Invalid order item: missing all IDs', {
            item,
            orderItemData
          });
          Alert.alert('Lỗi', `Không thể tạo mục đơn hàng cho "${item.title || 'Unknown Item'}": Thiếu thông tin ID`);
          continue;
        }

        // 🔧 Loại bỏ các trường null để tránh lỗi validation
        const cleanOrderItemData = Object.fromEntries(
          Object.entries(orderItemData).filter(([_, value]) => value !== null)
        );

        console.log('Clean orderItemData:', cleanOrderItemData);

        try {
          const orderItemResponse = await api.post<ApiResponse<OrderItem>>('/order_items', cleanOrderItemData);
          console.log('✅ OrderItem created:', orderItemResponse.data.data);
          validItemsCount++;
        } catch (itemError: any) {
          console.error('❌ Failed to create OrderItem:', itemError.response?.data || itemError.message);
          Alert.alert('Lỗi', `Không thể tạo OrderItem cho "${item.title}": ${itemError.message}`);
        }
      }

      // Kiểm tra xem có OrderItem nào được tạo không
      if (validItemsCount === 0) {
        throw new Error('No valid order items were created');
      }

      console.log(`✅ Successfully created ${validItemsCount} order items`);

      // Chuyển hướng đến màn hình thành công
      navigation.navigate('OrderSuccess', { orderId: savedOrder._id });

    } catch (error: any) {
      console.error('❌ Lỗi khi tạo Order/OrderItem:', error.response?.data || error.message);
      Alert.alert('Lỗi', 'Không thể lưu đơn hàng. Vui lòng kiểm tra giỏ hàng và thử lại.');
    }
  };

  const handleVNPAYPayment = async () => {
    if (paymentMethod !== 'vnpay') {
      Alert.alert('Lỗi', 'Vui lòng chọn phương thức thanh toán VNPay');
      return;
    }

    if (!address) {
      Alert.alert('Lỗi', 'Vui lòng chọn hoặc thêm địa chỉ giao hàng');
      navigation.navigate('ListAddress', { selectMode: true, cartItems, total });
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

  const isHandled = useRef(false);

  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      const url = event.url;
      if (url.includes('payment-result') && !isHandled.current) {
        isHandled.current = true;

        const urlParams = new URLSearchParams(url.split('?')[1]);
        const responseCode = urlParams.get('vnp_ResponseCode');
        const transactionStatus = urlParams.get('vnp_TransactionStatus');
        const vnpayData = Object.fromEntries(urlParams);

        console.log('VNPay response:', vnpayData);

        if (responseCode === '00' && transactionStatus === '00') {
          await createOrderAndOrderItem(vnpayData);
          if (selectedVoucher) {
            Alert.alert('Thành công', `Thanh toán hoàn tất! Voucher ${selectedVoucher.title || 'Giảm giá'} đã được sử dụng.`);
          } else {
            Alert.alert('Thành công', 'Thanh toán hoàn tất!');
          }
        } else {
          Alert.alert('Lỗi', 'Thanh toán thất bại. Vui lòng thử lại.');
        }
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);

    Linking.getInitialURL().then(async (url) => {
      if (url && url.includes('payment-result') && !isHandled.current) {
        isHandled.current = true;
        const urlParams = new URLSearchParams(url.split('?')[1]);
        const responseCode = urlParams.get('vnp_ResponseCode');
        const transactionStatus = urlParams.get('vnp_TransactionStatus');
        const vnpayData = Object.fromEntries(urlParams);

        console.log('VNPay initial URL response:', vnpayData);

        if (responseCode === '00' && transactionStatus === '00') {
          await createOrderAndOrderItem(vnpayData);
          if (selectedVoucher) {
            Alert.alert('Thành công', `Thanh toán hoàn tất! Voucher ${selectedVoucher.title || 'Giảm giá'} đã được sử dụng.`);
          } else {
            Alert.alert('Thành công', 'Thanh toán hoàn tất!');
          }
        } else {
          Alert.alert('Lỗi', 'Thanh toán thất bại. Vui lòng thử lại.');
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [navigation, address, cartItems, total]); // Không cần selectedVoucher vì đã dùng ref

  const handlePay = () => {
    if (!address) {
      Alert.alert('Lỗi', 'Vui lòng chọn hoặc thêm địa chỉ giao hàng');
      navigation.navigate('ListAddress', { selectMode: true, cartItems, total });
      return;
    }

    if (paymentMethod === 'vnpay') {
      handleVNPAYPayment();
    } else if (paymentMethod === 'cod') {
      createOrderAndOrderItem({ paymentMethod: 'cod' });
      if (selectedVoucher) {
        Alert.alert('Thành công', `Đơn hàng đã được tạo! Voucher ${selectedVoucher.title || 'Giảm giá'} đã được sử dụng.`);
      } else {
        Alert.alert('Thành công', 'Đơn hàng đã được tạo!');
      }
    } else {
      Alert.alert('Lỗi', 'Vui lòng chọn phương thức thanh toán');
    }
  };

  const VoucherModal = () => (
    <Modal
      visible={showVoucherModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowVoucherModal(false)}>
            <Ionicons name="close" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Chọn Voucher</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.modalContent}>
          <TouchableOpacity
            style={[styles.voucherOption, !selectedVoucher && styles.voucherSelected]}
            onPress={() => {
              setSelectedVoucher(null);
              setShowVoucherModal(false);
            }}
          >
            <Text style={styles.voucherOptionText}>Không sử dụng voucher</Text>
            {!selectedVoucher && <Ionicons name="checkmark-circle" size={20} color="#1976D2" />}
          </TouchableOpacity>

          {userVouchers.map((voucher) => (
            <TouchableOpacity
              key={voucher._id}
              style={[
                styles.voucherOption,
                selectedVoucher?._id === voucher._id && styles.voucherSelected
              ]}
              onPress={() => {
                setSelectedVoucher(voucher);
                setShowVoucherModal(false);
              }}
            >
              <View style={styles.voucherInfo}>
                <View style={[styles.voucherIcon, { backgroundColor: voucher.textColor || '#ff6b6b' }]}>
                  <Ionicons name="pricetag" size={16} color="#fff" />
                </View>
                <View style={styles.voucherDetails}>
                  <Text style={styles.voucherTitle}>{voucher.title || 'Voucher'}</Text>
                  <Text style={styles.voucherDiscount}>
                    {voucher.discount_type === 'percentage'
                      ? `Giảm ${voucher.discount_value}%`
                      : `Giảm ${voucher.discount_value.toLocaleString('vi-VN')} ₫`}
                  </Text>
                  <Text style={styles.voucherCondition}>
                    Đơn tối thiểu: {voucher.min_purchase_amount.toLocaleString('vi-VN')} ₫
                  </Text>
                  <Text style={styles.voucherExpiry}>
                    HSD: {new Date(voucher.expiry_date).toLocaleDateString('vi-VN')}
                  </Text>
                </View>
              </View>
              {selectedVoucher?._id === voucher._id && (
                <Ionicons name="checkmark-circle" size={20} color="#1976D2" />
              )}
            </TouchableOpacity>
          ))}

          {userVouchers.length === 0 && (
            <View style={styles.emptyVoucher}>
              <Text style={styles.emptyVoucherText}>Không có voucher đã lưu nào khả dụng</Text>
              <Text style={styles.emptyVoucherSubText}>Hãy lưu voucher từ trang voucher để sử dụng khi thanh toán</Text>
              <TouchableOpacity
                style={styles.goToVoucherBtn}
                onPress={() => {
                  setShowVoucherModal(false);
                  navigation.navigate('VoucherScreen');
                }}
              >
                <Text style={styles.goToVoucherBtnText}>Xem và lưu voucher</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  return (
    <>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payment</Text>
          <View style={{ width: 24 }} />
        </View>

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
              <TouchableOpacity onPress={() => navigation.navigate('ListAddress', { selectMode: true, cartItems, total })}>
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

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Items</Text>
            <TouchableOpacity
              style={styles.voucherSelector}
              onPress={() => setShowVoucherModal(true)}
            >
              {selectedVoucher ? (
                <View style={styles.selectedVoucherTag}>
                  <Ionicons name="pricetag" size={12} color="#fff" />
                  <Text style={styles.selectedVoucherText}>
                    {selectedVoucher.discount_type === 'percentage'
                      ? `${selectedVoucher.discount_value}% off`
                      : `${selectedVoucher.discount_value.toLocaleString('vi-VN')} ₫ off`}
                  </Text>
                  <Ionicons name="chevron-down" size={12} color="#fff" />
                </View>
              ) : (
                <View style={styles.noVoucherTag}>
                  <Ionicons name="add" size={12} color="#1976D2" />
                  <Text style={styles.noVoucherText}>Chọn voucher</Text>
                  <Ionicons name="chevron-down" size={12} color="#1976D2" />
                </View>
              )}
            </TouchableOpacity>
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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <SummaryRow label="Merchandise Subtotal" value={summaryData.merchandiseSubtotal} />
          <SummaryRow label="Shipping Subtotal" value={summaryData.shippingSubtotal} />
          {selectedVoucher && (
            <View style={styles.voucherDiscountRow}>
              <View style={styles.voucherDiscountLabel}>
                <Ionicons name="pricetag" size={16} color="#1976D2" />
                <Text style={styles.voucherDiscountText}>
                  Voucher ({selectedVoucher.title || 'Giảm giá'})
                </Text>
              </View>
              <Text style={styles.voucherDiscountValue}>
                -{calculateDiscount().toLocaleString('vi-VN')} ₫
              </Text>
            </View>
          )}
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalText}>Total</Text>
          <Text style={styles.totalPrice}>{calculateTotal().toLocaleString('vi-VN') + ' ₫'}</Text>
        </View>
        <TouchableOpacity style={styles.payButton} onPress={handlePay}>
          <Text style={styles.payText}>Pay</Text>
        </TouchableOpacity>
      </ScrollView>

      <VoucherModal />
    </>
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
    flex: 1,
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
    marginBottom: 12,
  },
  voucherSelector: {
    flexShrink: 0,
  },
  selectedVoucherTag: {
    flexDirection: 'row',
    backgroundColor: '#1976D2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    alignItems: 'center',
    gap: 4,
  },
  selectedVoucherText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  noVoucherTag: {
    flexDirection: 'row',
    backgroundColor: '#f0f8ff',
    borderWidth: 1,
    borderColor: '#1976D2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    alignItems: 'center',
    gap: 4,
  },
  noVoucherText: {
    color: '#1976D2',
    fontSize: 12,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  voucherOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  voucherSelected: {
    borderColor: '#1976D2',
    backgroundColor: '#f0f8ff',
  },
  voucherOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  voucherInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  voucherIcon: {
    width: 32,
    height: 32,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  voucherDetails: {
    flex: 1,
  },
  voucherTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  voucherDiscount: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1976D2',
    marginBottom: 2,
  },
  voucherDiscountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#f0f8ff',
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#1976D2',
  },
  voucherDiscountLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  voucherDiscountText: {
    color: '#1976D2',
    fontSize: 13,
    fontWeight: '500',
  },
  voucherDiscountValue: {
    color: '#1976D2',
    fontSize: 13,
    fontWeight: '600',
  },
  voucherCondition: {
    fontSize: 12,
    color: '#666',
    marginBottom: 1,
  },
  voucherExpiry: {
    fontSize: 12,
    color: '#999',
  },
  emptyVoucher: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyVoucherText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyVoucherSubText: {
    fontSize: 14,
    color: '#999',
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: 20,
  },
  goToVoucherBtn: {
    backgroundColor: '#1976D2',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  goToVoucherBtnText: {
    color: '#fff',
    fontWeight: '600',
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