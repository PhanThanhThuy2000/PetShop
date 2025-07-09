import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
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
// 1. Thêm import cho useNavigation
import { useNavigation } from '@react-navigation/native';
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
  _apiId?: string; // Thêm _apiId để lưu ID gốc từ API
};

const { width } = Dimensions.get('window');
const CARD_HEIGHT = 100;
const CARD_PADDING = 12;

export default function CartScreen() {
  const navigation = useNavigation<any>();

  const { items, totalItems, totalAmount, isLoading, dispatch } = useCart();
  const { token } = useAuth();

  const [wishlistItems, setWishlistItems] = useState<Item[]>([
    {
      id: 3,
      image: require('../../assets/images/hamster.png'),
      title: 'Colorful Fish',
      price: 1000000,
    },
    {
      id: 4,
      image: require('../../assets/images/rabbit.png'),
      title: 'Fluffy Puppy',
      price: 1000000,
    },
  ]);

  useEffect(() => {
    if (token) {
      dispatch(getCart());
    }
  }, [token, dispatch]);

  const getDisplayItems = () => {
    return items.map(apiItem => {
      const itemData = apiItem.pet_id || apiItem.product_id;
      const primaryImage = itemData?.images?.find(img => img.is_primary) || itemData?.images?.[0];

      return {
        id: parseInt(apiItem._id.replace(/\D/g, '')) || Math.random(),
        image: primaryImage?.url ? { uri: primaryImage.url } : require('../../assets/images/dog.png'),
        title: itemData?.name || 'Unknown Item',
        description: apiItem.pet_id
          ? `${apiItem.pet_id.breed_id?.name || 'Unknown Breed'} - ${apiItem.pet_id.gender || 'Unknown'} - ${apiItem.pet_id.age || 0}y`
          : 'Pet product',
        price: Number(itemData?.price) || 0,
        quantity: apiItem.quantity || 1,
        _apiId: apiItem._id,
        petId: apiItem.pet_id?._id || null, // Thêm petId
        productId: apiItem.product_id?._id || null, // Thêm productId
      };
    });
  };

  const cartItems = getDisplayItems();
  console.log('cartItems:', JSON.stringify(cartItems, null, 2));
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
      'Remove Item',
      `Are you sure you want to remove ${item.title} from your cart?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(removeFromCart(item._apiId)).unwrap();
              dispatch(getCart());
            } catch (error) {
              Alert.alert('Error', 'Failed to remove item');
            }
          },
        },
      ]
    );
  };

  const removeFromWishlist = (id: number) =>
    setWishlistItems(items => items.filter(item => item.id !== id));

  const handleClearCart = () => {
    Alert.alert(
      'Clear Cart',
      'Are you sure you want to remove all items from your cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(clearCart()).unwrap();
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
    if (cartItems.length === 0) {
      Alert.alert('Empty Cart', 'Please add items to your cart first');
      return;
    }

    // Chuẩn hóa dữ liệu cartItems để truyền sang PaymentScreen
    const formattedCartItems = cartItems.map(item => ({
      id: item.petId || item.productId || item._apiId, // Sử dụng petId hoặc productId làm id
      title: item.title,
      price: item.price,
      quantity: item.quantity || 1,
      image: item.image,
      type: item.petId ? 'pet' : 'product', // Thêm trường type
      petId: item.petId || null, // Giữ petId
      productId: item.productId || null, // Giữ productId
    }));

    console.log('Navigating to Payment with:', { cartItems: formattedCartItems, total });
    navigation.navigate('Payment', { cartItems: formattedCartItems, total });
  };

  const total = totalAmount || cartItems.reduce(
    (sum, x) => sum + x.price * (x.quantity || 1),
    0
  );
  console.log('total:', total);

  const renderCard = (item: Item, isCart: boolean) => (
    <View key={item.id} style={styles.card}>
      <View style={styles.imgWrapper}>
        <Image 
          source={typeof item.image === 'string' ? { uri: item.image } : item.image} 
          style={styles.cardImage} 
          defaultSource={require('../../assets/images/dog.png')}
        />
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() =>
            isCart ? handleRemoveFromCart(item.id) : removeFromWishlist(item.id)
          }
        >
          <MaterialCommunityIcons
            name="delete-outline"
            size={18}
            color="#e74c3c"
          />
        </TouchableOpacity>
      </View>

      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        {isCart && (
          <Text numberOfLines={1} style={styles.cardDesc}>
            {item.description}
          </Text>
        )}
        <Text style={styles.cardPrice}>
          {(item.price * (item.quantity || 1)).toLocaleString('vi-VN')}₫

        </Text>
      </View>

      {isCart ? (
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
      ) : (
        <TouchableOpacity style={styles.cartBtn}>
          <Ionicons name="cart-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
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
          <Text style={styles.emptyTitle}>Please login to view your cart</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Cart</Text>
          <View style={styles.headerRight}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{totalItems || cartItems.length}</Text>
            </View>
            {cartItems.length > 0 && (
              <TouchableOpacity onPress={handleClearCart} style={styles.clearButton}>
                <Text style={styles.clearText}>Clear All</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

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

      {cartItems.length > 0 && (
        <View style={styles.footer}>
          <View style={styles.totalContainer}>
            <Text style={styles.totalText}>
              Total: {(total).toLocaleString('vi-VN')}₫
            </Text>
            {isLoading && (
              <ActivityIndicator size="small" color="#007AFF" style={styles.footerLoader} />
            )}
          </View>
          <TouchableOpacity 
            style={[styles.checkoutBtn, isLoading && styles.checkoutBtnDisabled]} 
            onPress={handleCheckout}
            disabled={isLoading}
          >
            <Text style={styles.checkoutText}>Checkout</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { padding: 16, paddingBottom: 120 },

  header: { 
    marginTop:10,
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    marginBottom: 16 
  },
  headerTitle: { fontSize: 28, fontWeight: 'bold', flex: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  badge: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: { color: '#fff', fontWeight: '600', fontSize: 12 },
  clearButton: { marginLeft: 12 },
  clearText: { color: '#e74c3c', fontSize: 14, fontWeight: '600' },

  addressCard: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
    alignItems: 'center', // Căn giữa các item theo chiều dọc
  },
  addressLabel: { fontWeight: '600', marginBottom: 4 },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 24,
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    height: CARD_HEIGHT,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  imgWrapper: {
    width: CARD_HEIGHT,
    height: CARD_HEIGHT,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    overflow: 'hidden',
  },
  cardImage: { width: '100%', height: '100%' },
  deleteBtn: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    padding: 4,
  },

  cardContent: {
    flex: 1,
    paddingHorizontal: CARD_PADDING,
  },
  cardTitle: { fontWeight: '600', fontSize: 16, marginBottom: 4 },
  cardDesc: { fontSize: 12, color: '#666', marginBottom: 4 },
  cardPrice: { fontWeight: '700' },

  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
  },
  qtyBtn: { paddingHorizontal: 10, paddingVertical: 6 },
  qtyText: { fontSize: 18, fontWeight: '600' },
  qtyCount: { minWidth: 28, textAlign: 'center', paddingVertical: 6, fontSize: 16 },

  cartBtn: {
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#eee',
    alignItems: 'center',
  },
  totalContainer: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  totalText: { fontSize: 18, fontWeight: '600' },
  footerLoader: { marginLeft: 8 },
  checkoutBtn: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  checkoutBtnDisabled: {
    backgroundColor: '#cccccc',
  },
  checkoutText: { color: '#fff', fontWeight: '600' },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
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
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});