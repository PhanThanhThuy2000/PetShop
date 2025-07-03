// screens/ProductDetailScreen.tsx
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { FC, useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  ImageBackground,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// --- Data Interfaces & Sample Data ---
interface Variation { id: string; image: any; }
interface RelatedItem { id: string; image: any; title: string; price: string; }

const VARIATIONS: Variation[] = Array.from({ length: 4 }).map((_, i) => ({
  id: `${i}`,
  image: require('@/assets/images/dog.png'),
}));

const RELATED_ITEMS: RelatedItem[] = Array.from({ length: 4 }).map((_, i) => ({
  id: `${i}`,
  image: require('@/assets/images/dog.png'),
  title: 'Lorem ipsum dolor sit amet consectetur',
  price: '$17.00',
}));

// --- Countdown Hook ---
function useCountdown(initialSeconds: number) {
  const [seconds, setSeconds] = useState(initialSeconds);
  useEffect(() => {
    if (seconds <= 0) return;
    const timer = setTimeout(() => setSeconds(seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);
  return {
    h: Math.floor(seconds / 3600),
    m: Math.floor((seconds % 3600) / 60),
    s: seconds % 60,
  };
}

// --- Subcomponents ---
const Header: FC = () => (
  <ImageBackground source={require('@/assets/images/dog.png')} style={styles.headerImage}>
    <View style={styles.topIcons}>
      <TouchableOpacity style={styles.iconBtn}>
        <Ionicons name="share-social-outline" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
    <View style={styles.carouselDots}>
      {VARIATIONS.map((_, i) => (
        <View key={i} style={[styles.dot, i === 0 && styles.dotActive]} />
      ))}
    </View>
  </ImageBackground>
);

const VariationSelector: FC<{ onSelect: (v: Variation) => void; selectedId: string }> = ({ onSelect, selectedId }) => (
  <FlatList
    data={VARIATIONS}
    horizontal
    keyExtractor={item => item.id}
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={styles.varList}
    renderItem={({ item }) => (
      <TouchableOpacity
        style={[styles.varItem, item.id === selectedId && styles.varSelected]}
        onPress={() => onSelect(item)}
      >
        <Image source={item.image} style={styles.varImg} />
      </TouchableOpacity>
    )}
  />
);

const InfoRow: FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoKey}>{label}</Text>
    <Text style={styles.infoVal}>{value}</Text>
  </View>
);

// 1. Sửa ReviewCard để nhận 'navigation'
const ReviewCard: FC<{ navigation: any }> = ({ navigation }) => (
  <View style={styles.reviewCard}>
    <Image source={require('@/assets/images/dog.png')} style={styles.avatar} />
    <View style={styles.reviewContent}>
      <Text style={styles.reviewer}>Veronika</Text>
      <View style={styles.starRow}>
        {Array.from({ length: 5 }).map((_, i) => (
          <FontAwesome key={i} name="star" size={14} color="#FBBF24" />
        ))}
      </View>
      <Text numberOfLines={3} style={styles.reviewText}>Lorem ipsum dolor sit amet.</Text>
      {/* 2. Thêm onPress để điều hướng */}
      <TouchableOpacity 
        style={styles.viewAllBtn}
        onPress={() => navigation.navigate('Reviews')}
      >
        <Text style={styles.viewAllText}>View All Reviews</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const RelatedGrid: FC = () => (
  <FlatList
    data={RELATED_ITEMS}
    numColumns={2}
    keyExtractor={item => item.id}
    columnWrapperStyle={styles.relatedRow}
    scrollEnabled={false}
    renderItem={({ item }) => (
      <View style={styles.relatedItem}>
        <Image source={item.image} style={styles.relatedImg} />
        <Text style={styles.relatedTitle}>{item.title}</Text>
        <Text style={styles.relatedPrice}>{item.price}</Text>
      </View>
    )}
  />
);

// --- Main Screen ---
const ProductDetailScreen: FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const pet = route.params?.pet;

  // Nếu có pet thì lấy dữ liệu từ pet, không thì dùng mẫu
  const productTitle = pet?.name || 'Cute Pomeranian Dog';
  const productPrice = pet?.price ? `${pet.price.toLocaleString('vi-VN')}₫` : '$25.00';
  const productImage = pet?.images?.[0]?.url
    ? { uri: pet.images[0].url }
    : require('@/assets/images/dog.png');
  const breed = pet?.breed_id?.name || 'Pomeranian';

  const [selectedVar, setSelectedVar] = useState(VARIATIONS[0]);
  const [isFavorite, setIsFavorite] = useState(false);
  const { h, m, s } = useCountdown(36 * 60 + 58);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Product Detail</Text>
        <TouchableOpacity  style={styles.headerFav}>
          <Ionicons
            name='cart-outline'
            size={24}
          />
        </TouchableOpacity>
      </View>

      <ScrollView>
        {/* Header sửa lại để lấy ảnh pet */}
        <ImageBackground source={productImage} style={styles.headerImage}>
          <View style={styles.topIcons}>
            <TouchableOpacity style={styles.iconBtn}>
              <Ionicons name="share-social-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={styles.carouselDots}>
            {VARIATIONS.map((_, i) => (
              <View key={i} style={[styles.dot, i === 0 && styles.dotActive]} />
            ))}
          </View>
        </ImageBackground>

        <View style={styles.content}>
          <Text style={styles.productTitle}>{productTitle}</Text>
          <Text style={styles.productPrice}>{productPrice}</Text>
          <Text style={styles.countdownText}>
            Sale ends in {h}h {m}m {s}s
          </Text>

          <VariationSelector selectedId={selectedVar.id} onSelect={setSelectedVar} />
          <InfoRow label="Breed" value={breed} />
          <InfoRow label="age" value="2 year" />
          <InfoRow label="weight" value="2 kg" />
          <InfoRow label="gender" value="Male" />

          <Text style={styles.sectionHeading}>Reviews</Text>
          {/* 3. Truyền navigation vào cho ReviewCard */}
          <ReviewCard navigation={navigation} />

          <Text style={styles.sectionHeading}>Related Items</Text>
          <RelatedGrid />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.favBtn}
          onPress={() => setIsFavorite(f => !f)}
        >
          <Ionicons 
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={24}
            color={isFavorite ? 'red' : '#000'}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cartBtn}
          onPress={() => navigation.navigate('Cart')}
        >
          <Text style={styles.cartBtnTxt}>Add to cart</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.buyBtn}
          onPress={() => navigation.navigate('Payment')}
        >
          <Text style={styles.buyBtnTxt}>Buy now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default ProductDetailScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingTop: 35, 
  },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 20, fontWeight: 'bold' },
  headerFav: { padding: 4 },

  headerImage: { width: '100%', height: 300, justifyContent: 'space-between' },
  topIcons: { alignSelf: 'flex-end', padding: 16, flexDirection: 'row' },
  iconBtn: { marginLeft: 12 },
  carouselDots: { paddingBottom: 12, flexDirection: 'row', justifyContent: 'center' },
  dot: { width: 8, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB', margin: 4 },
  dotActive: { backgroundColor: '#2563EB' },

  content: { padding: 16 },
  productTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 8, color: '#111827' },
  productPrice: { fontSize: 22, color: '#E63946', marginBottom: 12, fontWeight: 'bold' },
  countdownText: { color: '#1E90FF', marginBottom: 16, fontWeight: '500' },
  sectionHeading: { fontSize: 18, fontWeight: '600', marginVertical: 16, color: '#111827' },

  varList: { paddingVertical: 8 },
  varItem: { marginRight: 12, borderRadius: 10, borderWidth: 1, borderColor: '#ddd' },
  varSelected: { borderWidth: 2, borderColor: '#10B981' },
  varImg: { width: 64, height: 64, borderRadius: 8 },

  deliveryContainer: { marginVertical: 12 },
  deliveryBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    alignItems: 'center',
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deliveryLabel: { fontWeight: '600', marginBottom: 4, fontSize: 16, color: '#374151' },
  datePill: { backgroundColor: '#DBEAFE', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-start' },
  dateText: { color: '#1D4ED8', fontWeight: '500' },
  delPrice: { fontWeight: 'bold', fontSize: 16 },

  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  infoKey: { color: '#4B5563', fontSize: 15 },
  infoVal: { fontWeight: '600', fontSize: 15, color: '#111827' },

  reviewCard: { flexDirection: 'row', backgroundColor: '#F9FAFB', padding: 16, borderRadius: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, marginRight: 12 },
  reviewContent: { flex: 1 },
  reviewer: { fontWeight: 'bold', fontSize: 16, color: '#111827' },
  starRow: { flexDirection: 'row', marginVertical: 4 },
  reviewText: { color: '#374151', marginBottom: 12, lineHeight: 20 },
  viewAllBtn: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  viewAllText: { color: '#2563EB', fontWeight: '600' },

  relatedRow: { justifyContent: 'space-between' },
  relatedItem: { width: '48%', marginBottom: 16 },
  relatedImg: { width: '100%', height: 120, borderRadius: 8, backgroundColor: '#f0f0f0' },
  relatedTitle: { marginTop: 8, color: '#374151', minHeight: 36 },
  relatedPrice: { fontWeight: 'bold', marginTop: 4, fontSize: 16, color: '#111827' },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#E5E7EB',
  },
  favBtn: { padding: 12, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, marginRight: 12 },
  cartBtn: {
    flex: 1,
    backgroundColor: '#111827',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  cartBtnTxt: { color: '#fff', fontWeight: '600', fontSize: 16 },
  buyBtn: {
    flex: 1,
    backgroundColor: '#2563EB',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buyBtnTxt: { color: '#fff', fontWeight: '600', fontSize: 16 },
});