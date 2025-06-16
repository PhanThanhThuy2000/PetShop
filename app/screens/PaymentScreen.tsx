import * as React from 'react';
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5, Entypo } from '@expo/vector-icons';

const PaymentScreen = () => {
  const [shippingMethod, setShippingMethod] = useState<'standard' | 'express'>('standard');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'wallet' | 'vnpay'>('cod');

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="arrow-back" size={24} color="#000" />
        <Text style={styles.headerTitle}>Payment</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Address */}
      <View style={styles.addressBox}>
        <View style={{ flex: 1 }}>
          <Text style={styles.bold}>Phan Thùy <Text style={styles.gray}>(+84 905304321)</Text></Text>
          <Text style={styles.gray}>
            Magnolia MSI B4, next to Pheonix Theatre, Chevasandra, Bengaluru, Karnataka 560023
          </Text>
        </View>
        <MaterialIcons name="edit" size={20} color="#1976D2" />
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
        <ItemRow name="Dog munuô" price="1.000.000 đ" image="https://azpet.com.vn/wp-content/uploads/2019/01/pomeranian.jpg" />
        <ItemRow name="Cat" price="1.000.000 đ" image="https://aquariumcare.vn/upload/user/images/M%C3%A8o%20Ragdoll%206(1).jpg" />
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
          <Text style={styles.shippingPrice}>100.000 đ</Text>
        </TouchableOpacity>
        <Text style={styles.deliveryNote}>Delivered on or before Thursday, 23 April 2020</Text>
      </View>

      {/* Payment Method */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Method</Text>
        {[
          { id: 'cod', label: 'Cash on Delivery', icon: 'money-check' },
          { id: 'wallet', label: 'Wallet', icon: 'wallet' },
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
        <Text style={styles.sectionTitle}>Information pet</Text>
        <SummaryRow label="Merchandise Subtotal" value="2.000.000 đ" />
        <SummaryRow label="Shipping Subtotal" value="100.000 đ" />
        <SummaryRow label="Discount" value="-100.000 đ" />
      </View>

      {/* Total */}
      <View style={styles.totalRow}>
        <Text style={styles.totalText}>Total</Text>
        <Text style={styles.totalPrice}>2.000.000 đ</Text>
      </View>
      <TouchableOpacity style={styles.payButton}>
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
    marginTop:20,
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
    color: 'red',
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
    color: 'red',
  },
  payButton: {
    marginTop: 12,
    backgroundColor: '#1976D2',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  payText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default PaymentScreen;
