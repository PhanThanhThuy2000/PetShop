import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

type Item = {
  id: number;
  image: any;
  title: string;
  description?: string;
  price: number;
  quantity?: number;
};

const { width } = Dimensions.get('window');
const CARD_HEIGHT = 100;
const CARD_PADDING = 12;

export default function CartScreen() {
  const [cartItems, setCartItems] = useState<Item[]>([
    {
      id: 1,
      image: require('../../assets/images/dog.png'),
      title: 'Green Parrot',
      description: 'Lorem ipsum dolor sit amet consectetur.',
      price: 1000000,
      quantity: 1,
    },
    {
      id: 2,
      image: require('../../assets/images/cat.png'),
      title: 'Cute Kitten',
      description: 'Lorem ipsum dolor sit amet consectetur.',
      price: 1000000,
      quantity: 1,
    },
  ]);

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

  const updateQuantity = (id: number, delta: number) => {
    setCartItems(items =>
      items.map(item =>
        item.id === id
          ? { ...item, quantity: Math.max(1, (item.quantity || 1) + delta) }
          : item
      )
    );
  };

  const removeFromCart = (id: number) =>
    setCartItems(items => items.filter(item => item.id !== id));

  const removeFromWishlist = (id: number) =>
    setWishlistItems(items => items.filter(item => item.id !== id));

  const total = cartItems.reduce(
    (sum, x) => sum + x.price * (x.quantity || 1),
    0
  );

  const renderCard = (item: Item, isCart: boolean) => (
    <View key={item.id} style={styles.card}>
      {/* Image + Trash overlay */}
      <View style={styles.imgWrapper}>
        <Image source={item.image} style={styles.cardImage} />
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() =>
            isCart ? removeFromCart(item.id) : removeFromWishlist(item.id)
          }
        >
          <MaterialCommunityIcons
            name="delete-outline"
            size={18}
            color="#e74c3c"
          />
        </TouchableOpacity>
      </View>

      {/* Text content */}
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        {isCart && (
          <Text numberOfLines={1} style={styles.cardDesc}>
            {item.description}
          </Text>
        )}
        <Text style={styles.cardPrice}>
          {item.price.toLocaleString('vi-VN')}₫
        </Text>
      </View>

      {/* Action button */}
      {isCart ? (
        <View style={styles.qtyControl}>
          <TouchableOpacity
            onPress={() => updateQuantity(item.id, -1)}
            style={styles.qtyBtn}
          >
            <Text style={styles.qtyText}>–</Text>
          </TouchableOpacity>
          <Text style={styles.qtyCount}>{item.quantity}</Text>
          <TouchableOpacity
            onPress={() => updateQuantity(item.id, 1)}
            style={styles.qtyBtn}
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Cart</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{cartItems.length}</Text>
          </View>
        </View>

        {/* Shipping Address */}
        <View style={styles.addressCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.addressLabel}>Shipping Address</Text>
            <Text>Vui lòng nhập địa chỉ nhận hàng</Text>
          </View>
          <TouchableOpacity>
            <Ionicons name="pencil" size={20} color="#007AFF" />
          </TouchableOpacity>
        </View>

        {/* Cart Items */}
        {cartItems.map(item => renderCard(item, true))}

        {/* Wishlist */}
        <Text style={styles.sectionTitle}>From Your Wishlist</Text>
        {wishlistItems.map(item => renderCard(item, false))}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.totalText}>
          Total: {(total / 23000).toFixed(2)} $
        </Text>
        <TouchableOpacity style={styles.checkoutBtn}>
          <Text style={styles.checkoutText}>Checkout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' , marginTop:20},
  scroll: { padding: 16, paddingBottom: 120 },

  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', flex: 1 },
  badge: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: { color: '#fff', fontWeight: '600', fontSize: 12 },

  addressCard: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
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
    backgroundColor: '#fff',
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
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
  },
  qtyBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  qtyText: { fontSize: 18, fontWeight: '600' },
  qtyCount: { minWidth: 24, textAlign: 'center', paddingVertical: 4 },

  cartBtn: {
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },

  footer: {
    position: 'absolute',
    bottom: 0,
    width,
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#eee',
    alignItems: 'center',
  },
  totalText: { flex: 1, fontSize: 18, fontWeight: '600' },
  checkoutBtn: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  checkoutText: { color: '#fff', fontWeight: '600' },
});
