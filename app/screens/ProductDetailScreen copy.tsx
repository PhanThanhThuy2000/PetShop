// screens/ProductDetailScreen.tsx
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { FC, useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import { petsService } from '../services/api-services'; // Import petsService
import { Pet, PetImage } from '../types'; // Import Pet and PetImage types

// --- Data Interfaces ---
interface Variation { id: string; image: any; }
interface RelatedItem { id: string; image: any; title: string; price: string; }

// Dữ liệu mẫu cho Related Items (có thể thay bằng API sau)
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
const Header: FC<{ image: any; images: PetImage[] }> = ({ image, images }) => (
  <ImageBackground source={image} style={styles.headerImage}>
    <View style={styles.topIcons}>
      <TouchableOpacity style={styles.iconBtn}>
        <Ionicons name="share-social-outline" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
    <View style={styles.carouselDots}>
      {images.map((_, i) => (
        <View key={i} style={[styles.dot, i === 0 && styles.dotActive]} />
      ))}
    </View>
  </ImageBackground>
);

const VariationSelector: FC<{ images: PetImage[]; onSelect: (v: Variation) => void; selectedId: string }> = ({ images, onSelect, selectedId }) => (
  <FlatList
    data={images.map((img) => ({ id: img._id, image: { uri: img.url } }))}
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
  const petId = route.params?.pet?._id || route.params?.petId; // Lấy petId từ pet object hoặc trực tiếp

  const [pet, setPet] = useState<Pet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVar, setSelectedVar] = useState<Variation | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const { h, m, s } = useCountdown(36 * 60 + 58);

  // Định nghĩa hàm fetchPet
  const fetchPet = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await petsService.getPetById(petId);
      setPet(response.data);
      if (response.data.images && response.data.images.length > 0) {
        setSelectedVar({ id: response.data.images[0]._id, image: { uri: response.data.images[0].url } });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load pet data');
    } finally {
      setIsLoading(false);
    }
  };

  // Gọi API để lấy dữ liệu pet khi component mount
  useEffect(() => {
    if (petId) {
      fetchPet();
    } else {
      setError('No pet ID provided');
      setIsLoading(false);
    }
  }, [petId]);

  // Xử lý trạng thái loading
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Xử lý lỗi hoặc không tìm thấy pet
  if (error || !pet) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || 'Pet not found'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchPet}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Dữ liệu pet
  const productTitle = pet.name || 'Unknown Pet';
  const productPrice = pet.price ? `${pet.price.toLocaleString('vi-VN')}₫` : 'N/A';
  const productImage = pet.images && pet.images.length > 0
    ? { uri: pet.images[0].url }
    : require('@/assets/images/dog.png');
  const breed = pet.breed_id?.name || 'Unknown';
  const age = pet.age ? `${pet.age} year${pet.age > 1 ? 's' : ''}` : 'Unknown';
  const gender = pet.gender || 'Unknown';
  const weight = pet.weight ? `${pet.weight} kg` : 'Unknown'; // Giả sử weight có trong API, nếu không thì để tĩnh

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Product Detail</Text>
        <TouchableOpacity style={styles.headerFav}>
          <Ionicons name="cart-outline" size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView>
        <Header image={productImage} images={pet.images || []} />
        <View style={styles.content}>
          <Text style={styles.productTitle}>{productTitle}</Text>
          <Text style={styles.productPrice}>{productPrice}</Text>
          <Text style={styles.countdownText}>
            Sale ends in {h}h {m}m {s}s
          </Text>

          {pet.images && pet.images.length > 0 && (
            <VariationSelector
              images={pet.images}
              selectedId={selectedVar?.id || ''}
              onSelect={setSelectedVar}
            />
          )}

          <InfoRow label="Breed" value={breed} />
          <InfoRow label="Age" value={age} />
          <InfoRow label="Weight" value={weight} />
          <InfoRow label="Gender" value={gender} />

          <Text style={styles.sectionHeading}>Reviews</Text>
          <ReviewCard navigation={navigation} />

          <Text style={styles.sectionHeading}>Related Items</Text>
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
          onPress={() => navigation.navigate('Cart', { petId: pet._id })}
        >
          <Text style={styles.cartBtnTxt}>Add to cart</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.buyBtn}
          onPress={() => navigation.navigate('Payment', { petId: pet._id })}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#4B5563',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#D94A4A',
    textAlign: 'center',
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});