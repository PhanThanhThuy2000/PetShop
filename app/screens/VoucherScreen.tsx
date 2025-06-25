// VoucherScreen.tsx (Đã cập nhật)

import * as React from 'react';
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
// 1. Thêm import
import { useNavigation } from '@react-navigation/native';

const vouchers = [
  // ... dữ liệu không đổi
  {
    id: 1,
    color: '#ffebeb',
    borderColor: '#ff6b6b',
    title: 'Voucher',
    discount: '10% off',
    validUntil: '4.21.20',
    textColor: '#ff6b6b',
  },
  {
    id: 2,
    color: '#e8f4ff',
    borderColor: '#007aff',
    title: 'Voucher',
    discount: '20% off',
    validUntil: '6.20.20',
    textColor: '#007aff',
    isDashed: true,
  },
];

const VoucherScreen = () => {
  // 2. Khởi tạo navigation
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {/* 3. Thay avatar bằng nút back */}
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Vouchers</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconCircle}>
            <Icon name="list" size={16} color="#007aff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconCircle}>
            <View style={styles.notificationDot} />
            <Icon name="ellipsis-horizontal" size={16} color="#007aff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconCircle}>
            <Icon name="settings-outline" size={16} color="#007aff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity style={styles.activeTab}>
          <Text style={styles.activeTabText}>Active Rewards</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.inactiveTab}>
          <Text style={styles.inactiveTabText}>Progress</Text>
        </TouchableOpacity>
      </View>

      {/* Vouchers */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {vouchers.map((voucher) => (
          <View
            key={voucher.id}
            style={[
              styles.voucherCard,
              { 
                borderColor: voucher.borderColor, 
                backgroundColor: voucher.color,
                borderStyle: voucher.isDashed ? 'dashed' : 'solid'
              },
            ]}
          >
            <View style={styles.cardTop}>
              <Text style={[styles.voucherTitle, { color: voucher.textColor }]}>
                {voucher.title}
              </Text>
              <View style={[styles.validTag, { backgroundColor: voucher.textColor }]}>
                <Text style={styles.validText}>Valid Until {voucher.validUntil}</Text>
              </View>
            </View>
            <View style={styles.discountRow}>
              <View style={[styles.lockIcon, { backgroundColor: voucher.textColor }]}>
                <Icon name="lock-closed" size={12} color="#fff" />
              </View>
              <Text style={styles.discountText}>{voucher.discount}</Text>
            </View>
            <TouchableOpacity
              style={[styles.collectBtn, { backgroundColor: voucher.textColor }]}
            >
              <Text style={styles.collectBtnText}>Collected</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

export default VoucherScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
        paddingTop: 50,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
        paddingHorizontal: 16,
    },
    backButton: {
        marginRight: 12,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#000',
    },
    headerIcons: {
        flexDirection: 'row',
        gap: 8,
    },
    iconCircle: {
        backgroundColor: '#e8f4ff',
        width: 38,
        height: 38,
        borderRadius: 19,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    notificationDot: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 8,
        height: 8,
        backgroundColor: '#007aff',
        borderRadius: 4,
        zIndex: 1,
    },
    tabContainer: {
        flexDirection: 'row',
        marginBottom: 20,
        backgroundColor: '#f0f0f0',
        borderRadius: 25,
        padding: 4,
        marginHorizontal: 16,
    },
    activeTab: {
        flex: 1,
        backgroundColor: '#fff',
        paddingVertical: 12,
        borderRadius: 20,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    inactiveTab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
    },
    activeTabText: {
        color: '#007aff',
        fontWeight: '600',
        fontSize: 14,
    },
    inactiveTabText: {
        color: '#8e8e93',
        fontSize: 14,
        fontWeight: '500',
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 20,
    },
    voucherCard: {
        borderWidth: 1.5,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        position: 'relative',
    },
    cardTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    voucherTitle: {
        fontWeight: '600',
        fontSize: 16,
    },
    validTag: {
        borderRadius: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    validText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '500',
    },
    discountRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    lockIcon: {
        width: 20,
        height: 20,
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    discountText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
    },
    collectBtn: {
        alignSelf: 'flex-end',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 6,
    },
    collectBtnText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
});