import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth, useCart } from '../../hooks/redux';
import {
  clearCart,
  getCart,
  removeFromCart,
  updateCartItem
} from '../redux/slices/cartSlice';

type Item = {
  id: string;
  image: any;
  title: string;
  description?: string;
  price: number;
  quantity?: number;
  _apiId: string;
  petId?: string | null;
  productId?: string | null;
  variantId?: string | null;
  variantInfo?: {
    color?: string;
    weight?: number;
    gender?: string;
    age?: number;
    display_name?: string;
  };
  itemType?: 'pet' | 'product' | 'variant';
};

const { width } = Dimensions.get('window');
const CARD_HEIGHT = 100;
const CARD_PADDING = 10;

export default function CartScreen() {
  const navigation = useNavigation<any>();
  const { items, totalItems, totalAmount, isLoading, dispatch } = useCart();
  const { token } = useAuth();

  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    if (token) {
      dispatch(getCart());
    }
  }, [token, dispatch]);

  const getDisplayItems = () => {
    console.log('🛒 Redux items:', JSON.stringify(items, null, 2));

    return items.map(apiItem => {
      const itemInfo = apiItem.item_info;
      const itemType = apiItem.item_type || 'unknown';
      const unitPrice = apiItem.unit_price || 0;
      const totalPrice = apiItem.total_price;
      const apiId = apiItem._id || `temp-${Math.floor(Math.random() * 1000000)}`;

      if (!itemInfo) {
        console.warn('⚠️ No item_info found for item:', apiItem._id || 'no-id');
        return {
          id: apiId,
          image: require('../../assets/images/dog.png'),
          title: 'Unknown Item',
          description: 'No information',
          price: 0,
          quantity: apiItem.quantity || 1,
          _apiId: apiId,
          petId: null,
          productId: null,
          variantId: null,
          variantInfo: null,
          itemType: 'unknown'
        };
      }

      let description = '';
      let variantInfo = null;
      let petId = null;
      let productId = null;
      let variantId = null;

      // 🔧 FIXED: Xử lý variant items theo structure mới từ CartController
      if (itemType === 'variant' && itemInfo.variant) {
        console.log('🧬 Processing variant item:', itemInfo.variant);

        const variant = itemInfo.variant;
        variantInfo = {
          color: variant.color,
          weight: variant.weight,
          gender: variant.gender,
          age: variant.age,
          display_name: variant.display_name,
          selling_price: variant.selling_price,
          stock_quantity: variant.stock_quantity,
          sku: variant.sku
        };

        description = variant.display_name ||
          `${variant.color} - ${variant.weight}kg - ${variant.gender} - ${variant.age} tuổi`;

        variantId = variant._id;
        petId = itemInfo._id; // Pet info từ itemInfo
      }
      // 🔧 FIXED: Xử lý pet items
      else if (itemType === 'pet') {
        console.log('🐕 Processing pet item:', itemInfo);

        const breedName = typeof itemInfo.breed_id === 'object'
          ? itemInfo.breed_id?.name
          : 'Unknown Breed';

        description = `${breedName} - ${itemInfo.type || 'Unknown'}`;

        // 🔧 ADDED: Thêm thông tin hasVariants nếu có
        if (itemInfo.hasVariants) {
          description += ' (Có variants)';
        }

        petId = itemInfo._id;
      }
      // 🔧 IMPROVED: Xử lý product items
      else if (itemType === 'product') {
        console.log('📦 Processing product item:', itemInfo);

        description = itemInfo.description || 'Pet product';
        productId = itemInfo._id;
      }

      // 🔧 IMPROVED: Xử lý hình ảnh
      let primaryImage = require('../../assets/images/dog.png');
      if (itemInfo.images && Array.isArray(itemInfo.images) && itemInfo.images.length > 0) {
        const foundImage = itemInfo.images.find((img: any) => img.is_primary) || itemInfo.images[0];
        if (foundImage && foundImage.url) {
          primaryImage = { uri: foundImage.url };
        }
      }

      const processedItem = {
        id: apiId,
        image: primaryImage,
        title: itemInfo.name || 'Unknown Item',
        description,
        price: unitPrice || 0, // 🔧 SỬ DỤNG unit_price từ API (backend đã tính sẵn)
        quantity: apiItem.quantity || 1,
        _apiId: apiId,
        petId,
        productId,
        variantId,
        variantInfo,
        itemType
      };

      console.log('✅ Processed item:', JSON.stringify(processedItem, null, 2));
      return processedItem;
    });
  };

  const cartItems = getDisplayItems();

  useEffect(() => {
    if (cartItems.length > 0) {
      const allItemIds = new Set(cartItems.map(item => item._apiId));
      setSelectedItems(allItemIds);
      setSelectAll(true);
    } else {
      setSelectedItems(new Set());
      setSelectAll(false);
    }
  }, [cartItems.length]);

  const toggleSelectItem = (itemId: string) => {
    const newSelectedItems = new Set(selectedItems);
    if (newSelectedItems.has(itemId)) {
      newSelectedItems.delete(itemId);
    } else {
      newSelectedItems.add(itemId);
    }
    setSelectedItems(newSelectedItems);
    setSelectAll(newSelectedItems.size === cartItems.length);
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedItems(new Set());
      setSelectAll(false);
    } else {
      const allItemIds = new Set(cartItems.map(item => item._apiId));
      setSelectedItems(allItemIds);
      setSelectAll(true);
    }
  };

  const getSelectedTotal = () => {
    return cartItems
      .filter(item => selectedItems.has(item._apiId))
      .reduce((sum, item) => {
        const itemTotal = (item.price || 0) * (item.quantity || 1);
        return sum + itemTotal;
      }, 0);
  };

  const getSelectedItems = () => {
    return cartItems.filter(item => selectedItems.has(item._apiId));
  };

  const updateQuantity = async (id: string, delta: number) => {
    const item = cartItems.find(item => item.id === id);
    if (!item || !item._apiId) return;

    const newQuantity = Math.max(1, (item.quantity || 1) + delta);

    try {
      await dispatch(updateCartItem({
        id: item._apiId,
        quantity: newQuantity
      })).unwrap();

      dispatch(getCart());
    } catch (error) {
      console.error('❌ Update quantity error:', error);
      Alert.alert('Lỗi', 'Không thể cập nhật số lượng. Vui lòng thử lại.');
    }
  };

  const handleRemoveFromCart = async (id: string) => {
    const item = cartItems.find(item => item.id === id);
    if (!item || !item._apiId) return;

    Alert.alert(
      'Xóa sản phẩm',
      `Bạn có muốn xóa "${item.title}" khỏi giỏ hàng không?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(removeFromCart(item._apiId)).unwrap();
              const newSelectedItems = new Set(selectedItems);
              newSelectedItems.delete(item._apiId);
              setSelectedItems(newSelectedItems);
              dispatch(getCart());
            } catch (error) {
              console.error('❌ Remove item error:', error);
              Alert.alert('Lỗi', 'Không thể xóa sản phẩm. Vui lòng thử lại.');
            }
          },
        },
      ]
    );
  };

  const handleClearCart = () => {
    Alert.alert(
      'Xóa toàn bộ giỏ hàng',
      'Bạn có chắc chắn muốn xóa toàn bộ sản phẩm khỏi giỏ hàng?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa toàn bộ',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(clearCart()).unwrap();
              setSelectedItems(new Set());
              setSelectAll(false);
              dispatch(getCart());
            } catch (error) {
              console.error('❌ Clear cart error:', error);
              Alert.alert('Lỗi', 'Không thể xóa giỏ hàng. Vui lòng thử lại.');
            }
          },
        },
      ]
    );
  };

  const handleCheckout = async () => {
    try {
      // Đồng bộ giỏ hàng trước khi checkout
      await dispatch(getCart()).unwrap();
      const selectedCartItems = getSelectedItems();

      if (selectedCartItems.length === 0) {
        Alert.alert('Chưa chọn sản phẩm', 'Vui lòng chọn ít nhất một sản phẩm để thanh toán');
        return;
      }

      // 🔧 IMPROVED: Format cart items cho Payment screen
      const formattedCartItems = selectedCartItems.map(item => {
        const formattedItem = {
          id: item._apiId,
          title: item.title,
          price: item.price || 0,
          quantity: item.quantity || 1,
          image: item.image,
          type: item.itemType || (item.petId ? 'pet' : item.productId ? 'product' : 'variant'),
          petId: item.petId || undefined,
          productId: item.productId || undefined,
          variantId: item.variantId || undefined,
          variantInfo: item.variantInfo || undefined,
          _apiId: item._apiId
        };

        console.log('💳 Formatted cart item for payment:', JSON.stringify(formattedItem, null, 2));
        return formattedItem;
      });

      const selectedTotal = getSelectedTotal();

      console.log('🚀 Navigating to Payment with:', {
        totalItems: formattedCartItems.length,
        total: selectedTotal,
        cartItems: formattedCartItems
      });

      navigation.navigate('Payment', {
        cartItems: formattedCartItems,
        total: selectedTotal
      });
    } catch (error) {
      console.error('❌ Checkout error:', error);
      Alert.alert('Lỗi', 'Không thể tiến hành thanh toán. Vui lòng thử lại.');
    }
  };

  const renderCard = (item: Item, isCart: boolean) => (
    <View key={item.id} style={styles.card}>
      {isCart && (
        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => toggleSelectItem(item._apiId)}
        >
          <View style={[
            styles.checkbox,
            selectedItems.has(item._apiId) && styles.checkboxSelected
          ]}>
            {selectedItems.has(item._apiId) && (
              <Ionicons name="checkmark" size={12} color="#fff" />
            )}
          </View>
        </TouchableOpacity>
      )}

      <View style={styles.imgWrapper}>
        <Image
          source={typeof item.image === 'string' ? { uri: item.image } : item.image}
          style={styles.cardImage}
          defaultSource={require('../../assets/images/dog.png')}
        />
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => handleRemoveFromCart(item.id)}
        >
          <MaterialCommunityIcons
            name="delete-outline"
            size={14}
            color="#e74c3c"
          />
        </TouchableOpacity>
      </View>

      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.title}
        </Text>

        {isCart && (
          <>
            {/* 🔧 FIXED: Hiển thị thông tin variant theo structure mới */}
            {item.itemType === 'variant' && item.variantInfo ? (
              <View style={styles.variantInfoContainer}>
                <Text style={styles.variantDetails} numberOfLines={2}>
                  🐾 {item.variantInfo.display_name ||
                    `${item.variantInfo.color} - ${item.variantInfo.weight}kg - ${item.variantInfo.gender} - ${item.variantInfo.age} tuổi`}
                </Text>
                {item.variantInfo.stock_quantity && item.variantInfo.stock_quantity <= 5 && (
                  <Text style={styles.stockWarning}>
                    Chỉ còn {item.variantInfo.stock_quantity} con
                  </Text>
                )}
              </View>
            ) : (
              <Text numberOfLines={2} style={styles.cardDesc}>
                {item.description}
              </Text>
            )}
          </>
        )}

        <View style={styles.priceContainer}>
          {/* 🔧 FIXED: Hiển thị giá - Sử dụng unit_price từ backend */}
          {item.price > 0 ? (
            <>
              <Text style={styles.cardPrice}>
                {(item.price * (item.quantity || 1)).toLocaleString('vi-VN')}₫
              </Text>
              {item.quantity && item.quantity > 1 && (
                <Text style={styles.unitPrice}>
                  {item.price.toLocaleString('vi-VN')}₫ x {item.quantity}
                </Text>
              )}
            </>
          ) : (
            <Text style={styles.priceUnavailable}>
              Liên hệ để biết giá
            </Text>
          )}
        </View>
      </View>

      {isCart && (
        <View style={styles.qtyControl}>
          <TouchableOpacity
            onPress={() => updateQuantity(item.id, -1)}
            style={styles.qtyBtn}
            disabled={isLoading || (item.quantity || 1) <= 1}
          >
            <Text style={[styles.qtyText, (item.quantity || 1) <= 1 && styles.qtyTextDisabled]}>–</Text>
          </TouchableOpacity>
          <Text style={styles.qtyCount}>{item.quantity}</Text>
          <TouchableOpacity
            onPress={() => updateQuantity(item.id, 1)}
            style={styles.qtyBtn}
            disabled={isLoading}
          >
            <Text style={styles.qtyText}>+</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  if (isLoading && cartItems.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Đang tải giỏ hàng...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!token) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons name="person-circle-outline" size={80} color="#C0C0C0" />
          <Text style={styles.emptyTitle}>Vui lòng đăng nhập</Text>
          <Text style={styles.emptySubtext}>Để xem giỏ hàng của bạn</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Updated Header - Theo style của AppointmentHistoryScreen */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Giỏ hàng</Text>

          {cartItems.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleClearCart}
            >
              <Ionicons name="trash-outline" size={24} color="#EF4444" />
            </TouchableOpacity>
          )}

          {/* Placeholder khi không có items để giữ layout cân bằng */}
          {cartItems.length === 0 && (
            <View style={styles.headerPlaceholder} />
          )}
        </View>

        {cartItems.length > 0 && (
          <View style={styles.selectAllContainer}>
            <TouchableOpacity
              style={styles.selectAllButton}
              onPress={toggleSelectAll}
            >
              <View style={[styles.checkbox, selectAll && styles.checkboxSelected]}>
                {selectAll && (
                  <Ionicons name="checkmark" size={12} color="#fff" />
                )}
              </View>
              <Text style={styles.selectAllText}>
                Chọn tất cả ({selectedItems.size}/{cartItems.length})
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {cartItems.length === 0 ? (
          <View style={styles.emptyCart}>
            <Ionicons name="cart-outline" size={60} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>Giỏ hàng trống</Text>
            <Text style={styles.emptySubtext}>Thêm sản phẩm yêu thích vào giỏ hàng để mua sắm</Text>
            <TouchableOpacity
              style={styles.shopNowBtn}
              onPress={() => navigation.navigate('Trang chủ')}
            >
              <Text style={styles.shopNowText}>Mua sắm ngay</Text>
            </TouchableOpacity>
          </View>
        ) : (
          cartItems.map(item => renderCard(item, true))
        )}

      </ScrollView>

      {cartItems.length > 0 && (
        <View style={styles.footer}>
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>
              Chọn ({selectedItems.size} sản phẩm):
            </Text>
            <Text style={styles.totalText}>
              {getSelectedTotal().toLocaleString('vi-VN')}₫
            </Text>
            {isLoading && (
              <ActivityIndicator size="small" color="#3B82F6" style={styles.footerLoader} />
            )}
          </View>
          <TouchableOpacity
            style={[
              styles.checkoutBtn,
              (isLoading || selectedItems.size === 0) && styles.checkoutBtnDisabled
            ]}
            onPress={handleCheckout}
            disabled={isLoading || selectedItems.size === 0}
          >
            <Text style={styles.checkoutText}>
              {selectedItems.size === 0 ? 'Chọn sản phẩm' : `Thanh toán (${selectedItems.size})`}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC' // Updated background color to match AppointmentHistoryScreen
  },
  scroll: {
    padding: 12,
    paddingBottom: 120
  },

  // Updated Header Styles - Theo AppointmentHistoryScreen
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginTop: 20,
    marginBottom: 12,
    marginHorizontal: -12, // Offset scroll padding
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    flex: 1,
    textAlign: 'center',
  },
  clearButton: {
    padding: 8,
  },
  headerPlaceholder: {
    width: 40, // Same width as clearButton to maintain balance
  },

  selectAllContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectAllText: {
    marginLeft: 10,
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  checkboxContainer: {
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    minHeight: CARD_HEIGHT,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  imgWrapper: {
    width: CARD_HEIGHT - 16,
    height: CARD_HEIGHT - 16,
    borderRadius: 6,
    overflow: 'hidden',
    marginLeft: 8,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover'
  },
  deleteBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    padding: 2,
  },
  cardContent: {
    flex: 1,
    paddingHorizontal: CARD_PADDING,
    paddingVertical: 4,
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontWeight: '600',
    fontSize: 14,
    marginBottom: 4,
    color: '#374151',
    lineHeight: 18,
  },
  cardDesc: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 4,
    lineHeight: 14,
  },
  priceContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  cardPrice: {
    fontWeight: '700',
    fontSize: 14,
    color: '#3B82F6',
  },
  unitPrice: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
  },
  priceUnavailable: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  variantInfoContainer: {
    marginBottom: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  variantDetails: {
    fontSize: 11,
    color: '#2563EB',
    lineHeight: 14,
    fontWeight: '500',
  },
  stockWarning: {
    fontSize: 10,
    color: '#F59E0B',
    fontStyle: 'italic',
    fontWeight: '500',
    marginTop: 2,
  },
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  qtyBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 28,
    alignItems: 'center',
  },
  qtyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  qtyTextDisabled: {
    color: '#D1D5DB',
  },
  qtyCount: {
    minWidth: 24,
    textAlign: 'center',
    paddingVertical: 4,
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: -2 },
    elevation: 3,
  },
  totalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  totalLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  totalText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3B82F6',
  },
  footerLoader: {
    marginLeft: 8
  },
  checkoutBtn: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  checkoutBtnDisabled: {
    backgroundColor: '#D1D5DB',
  },
  checkoutText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyCart: {
    alignItems: 'center',
    paddingVertical: 60,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  shopNowBtn: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
  },
  shopNowText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
});