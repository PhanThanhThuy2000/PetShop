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
import { petsService } from '../services/api-services';
import { Pet, PetImage } from '../types';

// --- Data Interfaces ---
interface Variation { id: string; image: any; }
interface RelatedItem { id: string; image: any; title: string; price: string; }

// --- Sample Data ---
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
    keyExtractor={(item) => item.id}
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
      <Text numberOfLines={3} style={styles.reviewText}>Lorem ipsum dolor sit amet...</Text>
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
    keyExtractor={(item) => item.id}
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

const FooterBar: FC<{ isFavorite: boolean; toggleFavorite: () => void; navigation: any; petId: string; pet: Pet }> = ({ isFavorite, toggleFavorite, navigation, petId, pet }) => (
  <View style={styles.footer}>
    <TouchableOpacity style={styles.favBtn} onPress={toggleFavorite}>
      <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={24} color={isFavorite ? 'red' : '#000'} />
    </TouchableOpacity>
    <TouchableOpacity
      style={styles.cartBtn}
      onPress={() => navigation.navigate('Cart', { petId })}
    >
      <Text style={styles.cartBtnTxt}>Add to cart</Text>
    </TouchableOpacity>
    <TouchableOpacity
      style={styles.buyBtn}
      onPress={() => {
        // Tạo cartItems từ pet hiện tại
        const cartItems = [{
          id: pet._id,
          title: pet.name,
          price: pet.price,
          quantity: 1,
          image: pet.images && pet.images.length > 0 ? { uri: pet.images[0].url } : require('@/assets/images/dog.png'),
        }];
        // Tính tổng tiền
        const total = pet.price;
        // Điều hướng đến PaymentScreen với cartItems và total
        navigation.navigate('Payment', { cartItems, total, petId });
      }}
    >
      <Text style={styles.buyBtnTxt}>Buy now</Text>
    </TouchableOpacity>
  </View>
);

const ProductDetailScreen: FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const petId = route.params?.pet?._id || route.params?.petId;

  const [pet, setPet] = useState<Pet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVar, setSelectedVar] = useState<Variation | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false); // New state for description toggle
  const { h, m, s } = useCountdown(36 * 60 + 58);

  // Fetch pet data
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

  useEffect(() => {
    if (petId) {
      fetchPet();
    } else {
      setError('No pet ID provided');
      setIsLoading(false);
    }
  }, [petId]);

  // Handle loading state
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

  // Handle error or no pet
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

  // Pet data
  const productTitle = pet.name || 'Unknown Pet';
  const productPrice = pet.price ? `${pet.price.toLocaleString('vi-VN')}₫` : 'N/A';
  const productImage = pet.images && pet.images.length > 0
    ? { uri: pet.images[0].url }
    : require('@/assets/images/dog.png');
  const breed = pet.breed_id?.name || 'Unknown';
  const age = pet.age ? `${pet.age} year${pet.age > 1 ? 's' : ''}` : 'Unknown';
  const gender = pet.gender || 'Unknown';
  const weight = pet.weight ? `${pet.weight} kg` : 'Unknown';
  const description = pet.description || 'Purus in massa tempor nec feugiat...'; // Use pet.description if available

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Product Detail</Text>
        <TouchableOpacity style={styles.headerFav}>
          <Ionicons name="share-social-outline" size={24} />
        </TouchableOpacity>
      </View>
      <ScrollView>
        <Header image={productImage} images={pet.images || []} />
        <View style={styles.content}>
          <View style={[styles.rowCenter, styles.spaceBetween]}>
            <Text style={styles.badge}>Sale</Text>
            <View style={styles.timerBox}>
              <Ionicons name="time-outline" size={16} color="#000" />
              <Text style={styles.timerText}>{`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`}</Text>
            </View>
          </View>
          <View style={[styles.rowCenter, styles.marginTop]}>
            <Text style={styles.price}>{productPrice}</Text>
            <View style={styles.ratingRow}>
              <FontAwesome name="star" size={14} color="#FBBF24" />
              <Text style={styles.ratingText}>4.9</Text>
              <Text style={styles.soldText}>(Sold 50)</Text>
            </View>
          </View>
          <Text style={styles.title}>{productTitle}</Text>
          <Text style={styles.sectionTitle}>Variations</Text>
          {pet.images && pet.images.length > 0 && (
            <VariationSelector
              images={pet.images}
              onSelect={setSelectedVar}
              selectedId={selectedVar?.id || ''}
            />
          )}
          <Text style={styles.sectionTitle}>Information pet</Text>
          <View style={styles.infoBox}>
            <InfoRow label="Gender" value={gender} />
            <InfoRow label="Age" value={age} />
            <InfoRow label="Weight" value={weight} />
            <InfoRow label="Breed" value={breed} />
          </View>
          <Text style={styles.sectionTitle}>Rating & Reviews</Text>
          <View style={styles.reviewHeader}>
            <Text style={styles.avgRating}>4.5</Text>
            <FontAwesome name="star" size={16} color="#FBBF24" />
            <Text style={styles.ratingCount}>Product Ratings (90)</Text>
          </View>
          <ReviewCard navigation={navigation} />
          <Text style={styles.sectionTitle}>Description</Text>
          <Text
            style={styles.descText}
            numberOfLines={isDescriptionExpanded ? undefined : 3} // Truncate to 3 lines when collapsed
          >
            {description}
          </Text>
          <TouchableOpacity
            style={styles.toggleDescBtn}
            onPress={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
          >
            <Text style={styles.toggleDescText}>
              {isDescriptionExpanded ? 'Show Less' : 'Show More'}
            </Text>
          </TouchableOpacity>
          <Image source={productImage} style={styles.descImage} />
          <Text style={styles.sectionTitle}>Pet Related</Text>
          <RelatedGrid />
        </View>
      </ScrollView>
      <FooterBar
        isFavorite={isFavorite}
        toggleFavorite={() => setIsFavorite(f => !f)}
        navigation={navigation}
        petId={pet._id}
        pet={pet} // Thêm prop pet
      />
    </SafeAreaView>
  );
};

export default ProductDetailScreen;

// --- Styles ---
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
  headerImage: { width: '100%', height: 300 },
  topIcons: { position: 'absolute', top: 16, right: 16, flexDirection: 'row' },
  iconBtn: { marginLeft: 12 },
  carouselDots: { position: 'absolute', bottom: 12, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center' },
  dot: { width: 8, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB', margin: 4 },
  dotActive: { backgroundColor: '#2563EB' },
  content: { padding: 16 },
  rowCenter: { flexDirection: 'row', alignItems: 'center' },
  spaceBetween: { justifyContent: 'space-between' },
  badge: { color: '#EF4444', borderColor: '#FECACA', borderWidth: 1, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  timerBox: { flexDirection: 'row', alignItems: 'center', padding: 4, borderColor: '#D1D5DB', borderWidth: 1, borderRadius: 4 },
  timerText: { marginLeft: 4 },
  marginTop: { marginTop: 8 },
  price: { color: '#EF4444', fontSize: 20, fontWeight: 'bold' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginLeft: 16 },
  ratingText: { marginHorizontal: 4 },
  soldText: { color: '#6B7280' },
  title: { fontSize: 24, fontWeight: 'bold', marginVertical: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginTop: 16 },
  varList: { paddingVertical: 8 },
  varItem: { marginRight: 12, borderRadius: 8 },
  varSelected: { borderWidth: 2, borderColor: '#10B981' },
  varImg: { width: 60, height: 60, borderRadius: 8 },
  deliveryContainer: { marginTop: 8 },
  deliveryBar: { flexDirection: 'row', justifyContent: 'space-between', borderWidth: 1, borderColor: '#2563EB', borderRadius: 8, padding: 12, marginBottom: 8, alignItems: 'center' },
  deliveryBarLeft: { flexDirection: 'row', alignItems: 'center' },
  deliveryLabel: { fontWeight: '500', marginRight: 12 },
  datePill: { backgroundColor: '#DBEAFE', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  dateText: { color: '#1D4ED8' },
  delPrice: { fontWeight: 'bold' },
  infoBox: { marginTop: 8 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  infoKey: { color: '#374151' },
  infoVal: { fontWeight: '500' },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  avgRating: { fontSize: 18, fontWeight: '600', marginRight: 4 },
  ratingCount: { color: '#6B7280', marginLeft: 8 },
  reviewCard: { flexDirection: 'row', marginTop: 12, backgroundColor: '#F9FAFB', padding: 12, borderRadius: 8 },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  reviewContent: { flex: 1 },
  reviewer: { fontWeight: '600' },
  starRow: { flexDirection: 'row', marginVertical: 4 },
  reviewText: { color: '#374151', marginBottom: 8 },
  viewAllBtn: { backgroundColor: '#2563EB', borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  viewAllText: { color: '#fff', fontWeight: '600' },
  descText: { color: '#6B7280', lineHeight: 20, marginTop: 8 },
  toggleDescBtn: { marginTop: 8, alignSelf: 'flex-start' }, // Style for toggle button
  toggleDescText: { color: '#2563EB', fontWeight: '600' }, // Style for toggle button text
  descImage: { width: '100%', height: 200, borderRadius: 8, marginVertical: 16 },
  relatedRow: { justifyContent: 'space-between' },
  relatedItem: { width: '48%' },
  relatedImg: { width: '100%', height: 120, borderRadius: 8 },
  relatedTitle: { marginTop: 8, color: '#374151' },
  relatedPrice: { fontWeight: '600', marginTop: 4 },
  footer: { flexDirection: 'row', alignItems: 'center', padding: 16, borderTopWidth: 1, borderColor: '#E5E7EB' },
  favBtn: { padding: 12, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, marginRight: 12 },
  cartBtn: { flex: 1, backgroundColor: '#111827', padding: 12, borderRadius: 8, alignItems: 'center', marginRight: 8 },
  cartBtnTxt: { color: '#fff', fontWeight: '600' },
  buyBtn: { flex: 1, backgroundColor: '#2563EB', padding: 12, borderRadius: 8, alignItems: 'center' },
  buyBtnTxt: { color: '#fff', fontWeight: '600' },
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