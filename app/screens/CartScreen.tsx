// app/screens/CartScreen.tsx - THÊM NÚT QUAY LẠI
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
  id: number;
  image: any;
  title: string;
  description?: string;
  price: number;
  quantity?: number;
  _apiId?: string;
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
    console.log('🔍 Raw cart items from API:', JSON.stringify(items, null, 2));

    return items.map(apiItem => {
      console.log('🛒 Processing cart item:', JSON.stringify(apiItem, null, 2));

      const itemInfo = apiItem.item_info;
      const itemType = apiItem.item_type || 'unknown';
      const unitPrice = apiItem.unit_price || 0;

      if (!itemInfo) {
        console.warn('⚠️ No item_info found');
        return {
          id: Math.floor(Math.random() * 1000000),
          image: require('../../assets/images/dog.png'),
          title: 'Unknown Item',
          description: 'No information',
          price: 0,
          quantity: apiItem.quantity || 1,
          _apiId: apiItem._id,
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

      if (itemType === 'variant' && itemInfo.variant) {
        variantInfo = {
          color: itemInfo.variant.color,
          weight: itemInfo.variant.weight,
          gender: itemInfo.variant.gender,
          age: itemInfo.variant.age,
          display_name: itemInfo.variant.display_name
        };
        description = itemInfo.variant.display_name ||
          `${itemInfo.variant.color} - ${itemInfo.variant.weight}kg - ${itemInfo.variant.gender} - ${itemInfo.variant.age}Y`;
        variantId = itemInfo.variant._id;
        petId = itemInfo._id;
      }
      else if (itemType === 'pet') {
        const breedName = typeof itemInfo.breed_id === 'object'
          ? itemInfo.breed_id?.name
          : 'Unknown Breed';
        description = `${breedName} - ${itemInfo.gender || 'Unknown'} - ${itemInfo.age || 0}y`;
        petId = itemInfo._id;
      }
      else if (itemType === 'product') {
        description = 'Pet product';
        productId = itemInfo._id;
      }

      let primaryImage = require('../../assets/images/dog.png');
      if (itemInfo.images && Array.isArray(itemInfo.images) && itemInfo.images.length > 0) {
        const foundImage = itemInfo.images.find((img: any) => img.is_primary) || itemInfo.images[0];
        if (foundImage && foundImage.url) {
          primaryImage = { uri: foundImage.url };
        }
      }

      const displayId = parseInt(apiItem._id.replace(/\D/g, '')) || Math.floor(Math.random() * 1000000);

      const processedItem = {
        id: displayId,
        image: primaryImage,
        title: itemInfo.name || 'Unknown Item',
        description,
        price: unitPrice,
        quantity: apiItem.quantity || 1,
        _apiId: apiItem._id,
        petId,
        productId,
        variantId,
        variantInfo,
        itemType
      };

      return processedItem;
    });
  };

  const cartItems = getDisplayItems();

  useEffect(() => {
    if (cartItems.length > 0) {
      const allItemIds = new Set(cartItems.map(item => item._apiId || ''));
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
      const allItemIds = new Set(cartItems.map(item => item._apiId || ''));
      setSelectedItems(allItemIds);
      setSelectAll(true);
    }
  };

  const getSelectedTotal = () => {
    return cartItems
      .filter(item => selectedItems.has(item._apiId || ''))
      .reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
  };

  const getSelectedItems = () => {
    return cartItems.filter(item => selectedItems.has(item._apiId || ''));
  };

  const updateQuantity = async (id: number, delta: number) => {
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
      Alert.alert('Error', 'Failed to update quantity');
    }
  };

  const handleRemoveFromCart = async (id: number) => {
    const item = cartItems.find(item => item.id === id);
    if (!item || !item._apiId) return;

    Alert.alert(
      'Xóa sản phẩm',
      `Bạn có muốn xóa ${item.title} khỏi giỏ hàng không?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(removeFromCart(item._apiId)).unwrap();
              const newSelectedItems = new Set(selectedItems);
              newSelectedItems.delete(item._apiId || '');
              setSelectedItems(newSelectedItems);
              dispatch(getCart());
            } catch (error) {
              Alert.alert('Error', 'Failed to remove item');
            }
          },
        },
      ]
    );
  };

  const handleClearCart = () => {
    Alert.alert(
      'Xóa',
      'Xóa toàn bộ sản phẩm khỏi giỏ hàng?',
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
              Alert.alert('Error', 'Failed to clear cart');
            }
          },
        },
      ]
    );
  };

  const handleCheckout = () => {
    const selectedCartItems = getSelectedItems();

    if (selectedCartItems.length === 0) {
      Alert.alert('No Items Selected', 'Please select items to checkout');
      return;
    }

    const formattedCartItems = selectedCartItems.map(item => ({
      id: item.variantId || item.petId || item.productId || item._apiId,
      title: item.title,
      price: item.price,
      quantity: item.quantity || 1,
      image: item.image,
      type: item.itemType || (item.petId ? 'pet' : 'product'),
      petId: item.petId || null,
      productId: item.productId || null,
      variantId: item.variantId || null,
      variantInfo: item.variantInfo || null,
    }));

    const selectedTotal = getSelectedTotal();

    navigation.navigate('Payment', {
      cartItems: formattedCartItems,
      total: selectedTotal
    });
  };

  // 🔧 RENDER CARD TỐI ỨU - Gọn gàng hơn
  const renderCard = (item: Item, isCart: boolean) => (
    <View key={item.id} style={styles.card}>
      {/* Checkbox */}
      {isCart && (
        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => toggleSelectItem(item._apiId || '')}
        >
          <View style={[
            styles.checkbox,
            selectedItems.has(item._apiId || '') && styles.checkboxSelected
          ]}>
            {selectedItems.has(item._apiId || '') && (
              <Ionicons name="checkmark" size={12} color="#fff" />
            )}
          </View>
        </TouchableOpacity>
      )}

      {/* Image Container */}
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

      {/* Content Container */}
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.title}
        </Text>

        {/* Variant Info hoặc Description */}
        {isCart && (
          <>
            {item.itemType === 'variant' && item.variantInfo ? (
              <View style={styles.variantInfoContainer}>
                <Text style={styles.variantDetails} numberOfLines={1}>
                  {item.variantInfo.display_name ||
                    `${item.variantInfo.color} - ${item.variantInfo.weight}kg`}
                </Text>
              </View>
            ) : (
              <Text numberOfLines={1} style={styles.cardDesc}>
                {item.description}
              </Text>
            )}
          </>
        )}

        {/* Price Container */}
        <View style={styles.priceContainer}>
          <Text style={styles.cardPrice}>
            {(item.price * (item.quantity || 1)).toLocaleString('vi-VN')}₫
          </Text>
          {item.quantity && item.quantity > 1 && (
            <Text style={styles.unitPrice}>
              {item.price.toLocaleString('vi-VN')}₫
            </Text>
          )}
        </View>
      </View>

      {/* Quantity Control */}
      {isCart && (
        <View style={styles.qtyControl}>
          <TouchableOpacity
            onPress={() => updateQuantity(item.id, -1)}
            style={styles.qtyBtn}
            disabled={isLoading}
          >
            <Text style={styles.qtyText}>–</Text>
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
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading cart...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!token) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons name="person-circle-outline" size={80} color="#C0C0C0" />
          <Text style={styles.emptyTitle}>Làm ơn login trước</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* ✅ HEADER MỚI VỚI NÚT QUAY LẠI */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Giỏ hàng</Text>

          <View style={styles.headerRight}>
            {cartItems.length > 0 && (
              <TouchableOpacity onPress={handleClearCart} style={styles.clearButton}>
                <Ionicons name="trash-outline" size={20} color="#e01111ff" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Select All Section */}
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

        {/* Cart Items */}
        {cartItems.length === 0 ? (
          <View style={styles.emptyCart}>
            <Ionicons name="cart-outline" size={60} color="#C0C0C0" />
            <Text style={styles.emptyTitle}>Your cart is empty</Text>
            <Text style={styles.emptySubtext}>Add some items to get started!</Text>
          </View>
        ) : (
          cartItems.map(item => renderCard(item, true))
        )}

      </ScrollView>

      {/* Footer */}
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
              <ActivityIndicator size="small" color="#007AFF" style={styles.footerLoader} />
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
              Đặt hàng ({selectedItems.size})
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
    backgroundColor: '#f8f9fa'
  },
  scroll: {
    padding: 12,
    paddingBottom: 120
  },

  // ✅ HEADER STYLES MỚI - Có nút back
  header: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    color: '#1a1a1a',
    textAlign: 'center',
    marginRight: 8, // Để cân bằng với nút back
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  badge: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 11
  },
  clearButton: {
    marginLeft: 10,
    padding: 4,
  },
  clearText: {
    color: '#e74c3c',
    fontSize: 18,
    fontWeight: '600'
  },

  // Select All Section - Compact hơn
  selectAllContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  selectAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectAllText: {
    marginLeft: 10,
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },

  // Checkbox Styles - Nhỏ hơn
  checkboxContainer: {
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },

  // Card styles - Compact và gọn gàng
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    minHeight: CARD_HEIGHT,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
    paddingVertical: 8,
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

  // Card content - Tối ưu spacing
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
    color: '#1a1a1a',
    lineHeight: 18,
  },
  cardDesc: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
    lineHeight: 14,
  },

  // Price container - Organized
  priceContainer: {
    flexDirection: 'column',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  cardPrice: {
    fontWeight: '700',
    fontSize: 14,
    color: '#007AFF',
    flex: 1,
  },
  unitPrice: {
    fontSize: 10,
    color: '#999',
    marginLeft: 8,
  },

  // Variant info styles - Compact
  variantInfoContainer: {
    marginBottom: 4,
  },
  variantDetails: {
    fontSize: 11,
    color: '#666',
    lineHeight: 14,
  },

  // Quantity control - Compact
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e8e8e8',
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
    color: '#333',
  },
  qtyCount: {
    minWidth: 24,
    textAlign: 'center',
    paddingVertical: 4,
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },

  // Footer styles - Compact
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#eee',
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
    color: '#666',
    fontWeight: '500',
  },
  totalText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#007AFF',
  },
  footerLoader: { marginLeft: 8 },
  checkoutBtn: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  checkoutBtnDisabled: {
    backgroundColor: '#cccccc',
  },
  checkoutText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },

  // Loading và empty states
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyCart: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
  },
});