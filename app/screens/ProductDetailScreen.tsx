// app/screens/ProductDetailScreen.tsx - KẾT HỢP ĐẦY ĐỦ API + REDUX + UI
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { FC, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { useDispatch, useSelector } from 'react-redux';
import { addToCart, getCart } from '../redux/slices/cartSlice';
import { AppDispatch, RootState } from '../redux/store';
import { petsService, productsService } from '../services/api-services';
import { Pet, PetImage, Product, ProductImage } from '../types';

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
const Header: FC<{ image: any; images: (PetImage | ProductImage)[]; selectedImageId: string }> = ({ image, images, selectedImageId }) => {
  const selectedImage = images.find(img => img._id === selectedImageId) || images[0];
  const displayImage = selectedImage ? { uri: selectedImage.url } : image;

  return (
    <ImageBackground source={displayImage} style={styles.headerImage}>
      <View style={styles.carouselDots}>
        {images.map((_, i) => (
          <View key={i} style={[styles.dot, selectedImageId === images[i]._id && styles.dotActive]} />
        ))}
      </View>
    </ImageBackground>
  );
};

const VariationSelector: FC<{ images: (PetImage | ProductImage)[]; onSelect: (v: Variation) => void; selectedId: string }> = ({ images, onSelect, selectedId }) => (
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

// ✅ SỬA: ReviewCard với navigation an toàn
const ReviewCard: FC<{ navigation: any }> = ({ navigation }) => {
  const handleViewAllReviews = () => {
    try {
      console.log('🔍 Navigating to Reviews screen');
      navigation.navigate('Reviews');
    } catch (error) {
      console.error('❌ Navigation error:', error);
      Alert.alert('Lỗi', 'Không thể mở màn hình đánh giá');
    }
  };

  return (
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
          onPress={handleViewAllReviews}
        >
          <Text style={styles.viewAllText}>View All Reviews</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ✅ UPDATED: RelatedGrid với navigation functionality
const RelatedGrid: FC<{ 
  navigation: any; 
  currentItemId?: string; 
  currentItemType?: 'pet' | 'product' 
}> = ({ navigation, currentItemId, currentItemType = 'pet' }) => {
  const [relatedItems, setRelatedItems] = useState<(Pet | Product)[]>([]);
  const [loading, setLoading] = useState(false);

  // Load related items khi component mount
  useEffect(() => {
    loadRelatedItems();
  }, [currentItemId]);

  const loadRelatedItems = async () => {
    try {
      setLoading(true);
      
      if (currentItemType === 'pet') {
        // Lấy pets khác (tạm thời lấy all pets, sau này có thể filter theo breed)
        const response = await petsService.getPets({ limit: 8 });
        
        if (response.success) {
          // Lọc bỏ item hiện tại và chỉ lấy 4 items
          const filteredPets = response.data
            .filter((pet: Pet) => pet._id !== currentItemId)
            .slice(0, 4);
          setRelatedItems(filteredPets);
        }
      } else {
        // Lấy products khác
        const response = await productsService.getProducts({ limit: 8 });
        
        if (response.success) {
          // Lọc bỏ item hiện tại và chỉ lấy 4 items
          const filteredProducts = response.data
            .filter((product: Product) => product._id !== currentItemId)
            .slice(0, 4);
          setRelatedItems(filteredProducts);
        }
      }
    } catch (error) {
      console.error('Error loading related items:', error);
      // Fallback to sample data nếu API fail
      const fallbackData = RELATED_ITEMS.map(item => ({
        _id: item.id,
        name: item.title,
        price: 17000,
        images: [{ url: 'https://via.placeholder.com/150' }]
      })) as any[];
      setRelatedItems(fallbackData);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Navigate đến detail của related item
  const handleRelatedItemPress = (item: Pet | Product) => {
    const isPet = 'breed_id' in item || currentItemType === 'pet';
    
    if (isPet) {
      navigation.push('ProductDetail', { 
        pet: item,
        petId: item._id 
      });
    } else {
      navigation.push('ProductDetail', { 
        productId: item._id 
      });
    }
  };

  const renderRelatedItem = ({ item }: { item: Pet | Product }) => (
    <TouchableOpacity
      style={styles.relatedItem}
      onPress={() => handleRelatedItemPress(item)}
      activeOpacity={0.7}
    >
      <Image 
        source={{ 
          uri: item.images?.[0]?.url || 'https://via.placeholder.com/150' 
        }} 
        style={styles.relatedImg} 
      />
      <Text style={styles.relatedTitle} numberOfLines={2}>
        {item.name}
      </Text>
      <Text style={styles.relatedPrice}>
        {item.price?.toLocaleString('vi-VN')}đ
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.relatedLoadingContainer}>
        <ActivityIndicator size="small" color="#2563EB" />
        <Text style={styles.loadingText}>Đang tải sản phẩm liên quan...</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={relatedItems}
      numColumns={2}
      keyExtractor={(item) => item._id}
      columnWrapperStyle={styles.relatedRow}
      scrollEnabled={false}
      renderItem={renderRelatedItem}
      ListEmptyComponent={
        <View style={styles.emptyRelatedContainer}>
          <Text style={styles.emptyRelatedText}>Không có sản phẩm liên quan</Text>
        </View>
      }
    />
  );
};

// ✅ FooterBar với Redux cart functionality
const FooterBar: FC<{ 
  isFavorite: boolean; 
  toggleFavorite: () => void; 
  navigation: any; 
  petId?: string; 
  productId?: string; 
  item: Pet | Product;
  onAddToCart: () => void;
  isAddingToCart: boolean;
}> = ({ 
  isFavorite, 
  toggleFavorite, 
  navigation, 
  petId, 
  productId, 
  item, 
  onAddToCart,
  isAddingToCart 
}) => (
  <View style={styles.footer}>
    <TouchableOpacity style={styles.favBtn} onPress={toggleFavorite}>
      <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={24} color={isFavorite ? 'red' : '#000'} />
    </TouchableOpacity>
    
    <TouchableOpacity
      style={[styles.cartBtn, isAddingToCart && { opacity: 0.6 }]}
      onPress={onAddToCart}
      disabled={isAddingToCart}
    >
      {isAddingToCart ? (
        <ActivityIndicator size="small" color="#fff" />
      ) : (
        <Text style={styles.cartBtnTxt}>Add to cart</Text>
      )}
    </TouchableOpacity>
    
    <TouchableOpacity
      style={styles.buyBtn}
      onPress={() => {
        const cartItems = [{
          id: item._id,
          title: item.name,
          price: item.price,
          quantity: 1,
          image: item.images && item.images.length > 0 ? { uri: item.images[0].url } : require('@/assets/images/dog.png'),
          type: petId ? 'pet' : 'product',
        }];
        const total = item.price;
        navigation.navigate('Payment', { cartItems, total, petId, productId });
      }}
    >
      <Text style={styles.buyBtnTxt}>Buy now</Text>
    </TouchableOpacity>
  </View>
);

const ProductDetailScreen: FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useDispatch<AppDispatch>();
  
  // ✅ Redux state
  const { isLoading: cartLoading } = useSelector((state: RootState) => state.cart);
  
  // ✅ Lấy params từ cả 2 cách
  const petId = route.params?.pet?._id || route.params?.petId;
  const productId = route.params?.productId || route.params?.id;

  // ✅ Component state
  const [item, setItem] = useState<Pet | Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVar, setSelectedVar] = useState<Variation | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  
  const { h, m, s } = useCountdown(36 * 60 + 58);

  // ✅ Redux Add to Cart functionality
  const handleAddToCart = async () => {
    if (!item) {
      Alert.alert('Lỗi', 'Không tìm thấy thông tin sản phẩm');
      return;
    }

    setIsAddingToCart(true);
    
    try {
      const cartParams = {
        quantity: 1,
        ...(petId ? { pet_id: petId } : { product_id: productId })
      };

      console.log('Adding to cart with params:', cartParams);
      
      // Dispatch Redux action
      await dispatch(addToCart(cartParams)).unwrap();
      
      // Refresh cart data
      dispatch(getCart());
      
      // Show success alert
      Alert.alert(
        'Thành công', 
        `${item.name} đã được thêm vào giỏ hàng`,
        [
          { text: 'Tiếp tục mua sắm', style: 'cancel' },
          { 
            text: 'Xem giỏ hàng', 
            onPress: () => navigation.navigate('Cart') 
          }
        ]
      );
      
    } catch (error: any) {
      console.error('Add to cart error:', error);
      
      // Handle different error types
      let errorMessage = 'Không thể thêm vào giỏ hàng';
      
      if (typeof error === 'string') {
        if (error.includes('already exists in cart')) {
          errorMessage = 'Sản phẩm đã có trong giỏ hàng';
        } else if (error.includes('must have either')) {
          errorMessage = 'Thông tin sản phẩm không hợp lệ';
        } else if (error.includes('network') || error.includes('timeout')) {
          errorMessage = 'Lỗi kết nối. Vui lòng thử lại';
        }
      }
      
      Alert.alert('Lỗi', errorMessage);
    } finally {
      setIsAddingToCart(false);
    }
  };

  // ✅ API fetch functionality với retry logic
  const fetchItem = async (retryCount: number = 0) => {
    const maxRetries = 3;
    try {
      setIsLoading(true);
      setError(null);
      let response;
      
      if (petId) {
        console.log('🐾 Loading Pet:', petId);
        response = await petsService.getPetById(petId);
        setItem(response.data);
        if (response.data.images && response.data.images.length > 0) {
          setSelectedVar({ id: response.data.images[0]._id, image: { uri: response.data.images[0].url } });
        }
        console.log('Pet data fetched:', response.data);
      } else if (productId) {
        console.log('🛍️ Loading Product:', productId);
        response = await productsService.getProductById(productId);
        setItem(response.data);
        if (response.data.images && response.data.images.length > 0) {
          setSelectedVar({ id: response.data.images[0]._id, image: { uri: response.data.images[0].url } });
        }
        console.log('Product data fetched:', response.data);
      } else {
        throw new Error('No pet or product ID provided');
      }
    } catch (err: any) {
      if (err.response?.status === 404 && retryCount < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 2000 * (retryCount + 1)));
        return fetchItem(retryCount + 1);
      }
      setError(err.response?.status === 404 ? 'Item not found on server (404). Check the ID or server endpoint.' : err.message || 'Failed to load item data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (petId || productId) {
      fetchItem();
    } else {
      setError('No item ID provided');
      setIsLoading(false);
    }
  }, [petId, productId]);

  // ✅ Loading state
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

  // ✅ Error state
  if (error || !item) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchItem()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ✅ Process item data
  const productTitle = item.name || 'Unknown Item';
  const productPrice = item.price ? `${item.price.toLocaleString('vi-VN')}₫` : 'N/A';
  const productImage = item.images && item.images.length > 0
    ? { uri: item.images[0].url }
    : require('@/assets/images/dog.png');
  const isPet = 'breed_id' in item;
  const breed = isPet ? (item as Pet).breed_id?.name || 'Unknown' : 'N/A';
  const age = isPet ? ((item as Pet).age ? `${(item as Pet).age} year${(item as Pet).age > 1 ? 's' : ''}` : 'Unknown') : 'N/A';
  const gender = isPet ? (item as Pet).gender || 'Unknown' : 'N/A';
  const weight = isPet ? ((item as Pet).weight ? `${(item as Pet).weight} kg` : 'Unknown') : 'N/A';
  const description = item.description || (isPet ? 'Purus in massa tempor nec feugiat...' : 'No description available');

  return (
    <SafeAreaView style={styles.container}>
      {/* ✅ Header */}
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
        {/* ✅ Main image với carousel */}
        <Header
          image={productImage}
          images={item.images || []}
          selectedImageId={selectedVar?.id || (item.images && item.images[0]?._id) || ''}
        />
        
        <View style={styles.content}>
          {/* ✅ Sale badge và timer */}
          <View style={[styles.rowCenter, styles.spaceBetween]}>
            <Text style={styles.badge}>Sale</Text>
            <View style={styles.timerBox}>
              <Ionicons name="time-outline" size={16} color="#000" />
              <Text style={styles.timerText}>{`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`}</Text>
            </View>
          </View>

          {/* ✅ Price và rating */}
          <View style={[styles.rowCenter, styles.marginTop]}>
            <Text style={styles.price}>{productPrice}</Text>
            <View style={styles.ratingRow}>
              <FontAwesome name="star" size={14} color="#FBBF24" />
              <Text style={styles.ratingText}>4.9</Text>
              <Text style={styles.soldText}>(Sold 50)</Text>
            </View>
          </View>

          {/* ✅ Title */}
          <Text style={styles.title}>{productTitle}</Text>

          {/* ✅ Variations */}
          <Text style={styles.sectionTitle}>Variations</Text>
          {item.images && item.images.length > 0 && (
            <VariationSelector
              images={item.images}
              onSelect={setSelectedVar}
              selectedId={selectedVar?.id || ''}
            />
          )}

          {/* ✅ Information (chỉ cho Pet) */}
          {isPet && (
            <>
              <Text style={styles.sectionTitle}>Information</Text>
              <View style={styles.infoBox}>
                <InfoRow label="Gender" value={gender} />
                <InfoRow label="Age" value={age} />
                <InfoRow label="Weight" value={weight} />
                <InfoRow label="Breed" value={breed} />
              </View>
            </>
          )}

          {/* ✅ Rating & Reviews */}
          <Text style={styles.sectionTitle}>Rating & Reviews</Text>
          <View style={styles.reviewHeader}>
            <Text style={styles.avgRating}>4.5</Text>
            <FontAwesome name="star" size={16} color="#FBBF24" />
            <Text style={styles.ratingCount}>Product Ratings (90)</Text>
          </View>
          <ReviewCard navigation={navigation} />

          {/* ✅ Description */}
          <Text style={styles.sectionTitle}>Description</Text>
          <Text
            style={styles.descText}
            numberOfLines={isDescriptionExpanded ? undefined : 3}
          >
            {description || 'No description available'}
          </Text>
          <TouchableOpacity
            style={styles.toggleDescBtn}
            onPress={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
          >
            <Text style={styles.toggleDescText}>
              {isDescriptionExpanded ? 'Show Less' : 'Show More'}
            </Text>
          </TouchableOpacity>

          {/* ✅ Description image */}
          <Image source={productImage} style={styles.descImage} />

          {/* ✅ Related items - UPDATED với navigation */}
          <Text style={styles.sectionTitle}>Related Items</Text>
          <RelatedGrid 
            navigation={navigation} 
            currentItemId={item._id}
            currentItemType={isPet ? 'pet' : 'product'}
          />
        </View>
      </ScrollView>

      {/* ✅ Bottom actions */}
      <FooterBar
        isFavorite={isFavorite}
        toggleFavorite={() => setIsFavorite(f => !f)}
        navigation={navigation}
        petId={petId}
        productId={productId}
        item={item}
        onAddToCart={handleAddToCart}
        isAddingToCart={isAddingToCart}
      />
    </SafeAreaView>
  );
};

export default ProductDetailScreen;

// ✅ STYLES HOÀN CHỈNH với styles mới cho RelatedGrid
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
  toggleDescBtn: { marginTop: 8, alignSelf: 'flex-start' },
  toggleDescText: { color: '#2563EB', fontWeight: '600' },
  descImage: { width: '100%', height: 200, borderRadius: 8, marginVertical: 16 },
  relatedRow: { justifyContent: 'space-between' },
  relatedItem: { width: '48%', marginBottom: 16 },
  relatedImg: { width: '100%', height: 120, borderRadius: 8 },
  relatedTitle: { marginTop: 8, color: '#374151', fontSize: 14 },
  relatedPrice: { fontWeight: '600', marginTop: 4, color: '#EF4444' },
  // ✅ Styles mới cho RelatedGrid
  relatedLoadingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#666',
  },
  emptyRelatedContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyRelatedText: {
    fontSize: 14,
    color: '#999',
  },
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