// HomeScreen.tsx - Giao diện gốc đơn giản với dữ liệu từ API
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

// Import API services
import { petsService, productsService } from '../services/api-services';
import { categoriesService, Category } from '../services/categoriesService';

// Safe navigation helper
const safeNavigate = (navigation: any, routeName: string, params?: any) => {
  try {
    navigation.navigate(routeName, params);
  } catch (error) {
    console.warn(`Route '${routeName}' not found, navigating to Search instead`);
    // Fallback to Search or available route
    try {
      navigation.navigate('Search', params);
    } catch (fallbackError) {
      console.error('Even Search route not found:', fallbackError);
    }
  }
};

const HomeScreen = () => {
  const navigation = useNavigation() as any;

  // State cho dữ liệu API
  const [pets, setPets] = useState([]);
  const [products, setProducts] = useState([]);
  const [flashSaleProducts, setFlashSaleProducts] = useState([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fallback data nếu API không hoạt động
  const fallbackCategories = [
    { _id: '1', name: 'Cats', images: [{ url: 'https://file.hstatic.net/200000108863/file/3_33cbf6a0308e40ca8962af5e0460397c_grande.png' }] },
    { _id: '2', name: 'Dogs', images: [{ url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSFUAfyVe3Easiycyh3isP9wDQTYuSmGPsPQvLIJdEYvQ_DsFq5Ez2Nh_QjiS3oZ3B8ZPfK9cZQyIStmQMV1lDPLw' }] },
    { _id: '3', name: 'Rabbits', images: [{ url: 'https://cdn.eva.vn/upload/3-2021/images/2021-09-24/image4-1632449319-210-width600height400.jpg' }] },
    { _id: '4', name: 'Hamsters', images: [{ url: 'https://encrypted-tbn1.gstatic.com/images?q=tbn:ANd9GcQXXutfOGiZ6MYhA4L47gBE3kR-giotG2iF-j5aMMSIlEJrnOTLCdhovShKPCVofxINNjxIYw0b9KAuIKrYqKAbHA' }] },
  ];

  const fallbackFlashSale = [
    { _id: '1', images: [{ url: 'https://aquariumcare.vn/upload/user/images/th%E1%BB%8F%20c%E1%BA%A3nh%204(2).jpg' }], price: 850000 },
    { _id: '2', images: [{ url: 'https://bizweb.dktcdn.net/100/165/948/products/img-5830-jpg.jpg?v=1502808189430' }], price: 1200000 },
    { _id: '3', images: [{ url: 'https://cocapet.net/wp-content/uploads/2018/08/bear-tam-th%E1%BB%83.jpg' }], price: 500000 },
    { _id: '4', images: [{ url: 'https://file.hstatic.net/200000159621/article/cover_8d54a27928c4408593fa2f4f4e60191b_grande.jpg' }], price: 900000 },
  ];

  const fallbackPets = [
    { _id: '1', name: 'British Longhair Cat', images: [{ url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSSgjs2sCO0xh0Ve1Sf8mDtBt2UhO9GRZImDw&s' }], price: 1000000, breed_id: { name: 'British' } },
    { _id: '2', name: 'Shiba Inu Dog', images: [{ url: 'https://thuvienmeme.com/wp-content/uploads/2024/07/cho-husky-luom-hinh-su-meme.jpg' }], price: 1000000, breed_id: { name: 'Shiba' } },
    { _id: '3', name: 'British Longhair Cat', images: [{ url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQv44j8zRpM29qyJqHyCC55qdoqwtnUSmswRA&s' }], price: 1000000, breed_id: { name: 'British' } },
    { _id: '4', name: 'Shiba Inu Dog', images: [{ url: 'https://pethouse.com.vn/wp-content/uploads/2022/12/Ngoai-hinh-husky-768x1024-1-600x800.jpg' }], price: 1000000, breed_id: { name: 'Shiba' } },
    { _id: '5', name: 'British Longhair Cat', images: [{ url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTajAsFf6UunJlFGmB-Y6W1Gyk3oqPkpnOCOA&s' }], price: 1000000, breed_id: { name: 'British' } },
    { _id: '6', name: 'Shiba Inu Dog', images: [{ url: 'https://i.pinimg.com/236x/e7/8a/d6/e78ad67426f1bc002e9f221e9d0605b9.jpg' }], price: 1000000, breed_id: { name: 'Shiba' } },
  ];

  // Load data khi component mount
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load categories và pets/products song song
      await Promise.all([
        loadCategories(),
        loadPetsAndProducts()
      ]);

    } catch (error: any) {
      console.error('Error loading initial data:', error);
      setError(error.message || 'Failed to load data');
      
      // Sử dụng fallback data khi có lỗi
      setCategories(fallbackCategories as Category[]);
      setFlashSaleProducts(fallbackFlashSale);
      setPets(fallbackPets);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      setCategoriesLoading(true);
      const response = await categoriesService.getCategories();
      setCategories(response.data || fallbackCategories);
    } catch (error: any) {
      console.error('Error loading categories:', error);
      setCategories(fallbackCategories as Category[]);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const loadPetsAndProducts = async () => {
    try {
      // Load pets và products song song
      const [petsResponse, productsResponse, flashSaleResponse] = await Promise.all([
        petsService.getPets({ page: 1, limit: 6 }),
        productsService.getProducts({ page: 1, limit: 10 }),
        productsService.getProducts({ limit: 4, featured: true })
      ]);

      setPets(petsResponse.data || fallbackPets);
      setProducts(productsResponse.data || []);
      setFlashSaleProducts(flashSaleResponse.data || fallbackFlashSale);

    } catch (error: any) {
      console.error('Error loading pets and products:', error);
      // Sử dụng fallback data
      setPets(fallbackPets);
      setFlashSaleProducts(fallbackFlashSale);
      throw error;
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  };

  // Helper function để lấy hình ảnh đầu tiên
  const getImageUrl = (images: any[] = []) => {
    if (images && images.length > 0) {
      return images.find(img => img.is_primary)?.url || images[0]?.url;
    }
    return 'https://via.placeholder.com/150?text=No+Image';
  };

  // Helper function để format giá
  const formatPrice = (price: number) => {
    return price?.toLocaleString('vi-VN') || '0';
  };

  // Render functions với giao diện gốc đơn giản
  const renderCategoryItem = ({ item }: { item: Category }) => {
    const imageUrl = getImageUrl(item.images);

    return (
      <TouchableOpacity
        style={styles.categoryItem}
        onPress={() => {
          safeNavigate(navigation, 'Breeds', {
            categoryId: item._id,
            categoryName: item.name
          });
        }}
      >
        <View style={styles.categoryImageContainer}>
          <Image
            source={{ uri: imageUrl }}
            style={styles.categoryImage}
            onError={(error) => {
              console.log('Image load error for category:', item.name, error);
            }}
          />
        </View>
        <Text style={styles.categoryText}>{item.name}</Text>
      </TouchableOpacity>
    );
  };

  const renderFlashSaleItem = ({ item }: { item: any }) => {
    const imageUrl = getImageUrl(item.images);
    return (
      <TouchableOpacity style={styles.flashSaleItem}>
        <Image
          source={{ uri: imageUrl }}
          style={styles.flashSaleImage}
        />
        <View style={styles.flashSaleDetails}>
          <Text style={styles.flashSalePrice}>{formatPrice(item.price)}</Text>
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: '70%' }]} />
            <Text style={styles.progressBarText}>Sold 15</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderPetItem = ({ item }: { item: any }) => {
    const imageUrl = getImageUrl(item.images);
    return (
      <TouchableOpacity
        style={styles.petItemContainer}
        onPress={() => safeNavigate(navigation, 'ProductDetail', { productId: item._id })}
      >
        <Image
          source={{ uri: imageUrl }}
          style={styles.petItemImage}
        />
        <View style={styles.petItemDetails}>
          <Text style={styles.petItemName} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={styles.petItemPrice}>{formatPrice(item.price)}</Text>
          <Text style={styles.petItemSold}>
            {item.breed_id?.name || item.type || 'Sold 50+'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={styles.safeArea.backgroundColor} />
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >

        <View style={styles.header}>
          <Text style={styles.headerTitle}>Home</Text>
          <TouchableOpacity onPress={() => safeNavigate(navigation, 'Chat')}>
            <Icon name="message-circle" size={26} color="#2D3748" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color="#A0AEC0" style={styles.searchIcon} />
          <TextInput 
            placeholder="Search for pets..." 
            style={styles.searchInput} 
            placeholderTextColor="#A0AEC0" 
            onFocus={() => safeNavigate(navigation, 'Search')}
          />
          <TouchableOpacity>
            <Icon name="camera" size={20} color="#A0AEC0" style={styles.cameraIcon} />
          </TouchableOpacity>
        </View>

        <View style={styles.bannerContainer}>
          <Image
            source={{ uri: 'https://lh3.googleusercontent.com/proxy/YGBdiGmx0h-riNmW-TPMA_o5BY-9hLAuEmu3CwdtbG7BN8yo2AevyQgu5TM49Bwuo0GM1eNd1XNVOqoIvF1IVHhFHTDzuy-xPBdGZXfQlK2AY2Xrspkrlz0-8nvwkMagvkGE0JFNUx0gK9O0' }}
            style={styles.bannerImage}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Category</Text>
          </View>
          {categoriesLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#2563EB" />
            </View>
          ) : (
            <FlatList
              data={categories}
              renderItem={renderCategoryItem}
              keyExtractor={(item) => item._id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryList}
            />
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Flash Sale</Text>
            <Text style={styles.timerText}>Ends in 00:15:30</Text>
          </View>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#D94A4A" />
            </View>
          ) : flashSaleProducts.length > 0 ? (
            <FlatList
              data={flashSaleProducts}
              renderItem={renderFlashSaleItem}
              keyExtractor={(item) => item._id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.flashSaleList}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No flash sale products</Text>
            </View>
          )}
        </View>
        
        {/* All Pets */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>For You</Text>
            <TouchableOpacity onPress={() => safeNavigate(navigation, 'PetAll')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#2563EB" />
            </View>
          ) : pets.length > 0 ? (
            <FlatList
              data={pets}
              renderItem={renderPetItem}
              keyExtractor={(item) => item._id}
              numColumns={2}
              scrollEnabled={false}
              columnWrapperStyle={styles.petListRow}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No pets available</Text>
            </View>
          )}
        </View>

        {/* Error handling */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={loadInitialData}
            >
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// Styles của giao diện gốc đơn giản
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8F9FA' },
  container: { paddingBottom: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 30, paddingBottom: 10 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#2D3748' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, marginHorizontal: 20, paddingHorizontal: 15, marginTop: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  searchIcon: { marginRight: 10 },
  cameraIcon: { marginLeft: 10 },
  searchInput: { flex: 1, height: 48, fontSize: 16, color: '#2D3748' },
  bannerContainer: { marginHorizontal: 20, marginTop: 20 },
  bannerImage: { width: '100%', height: 150, borderRadius: 16 },
  section: { marginTop: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#2D3748' },
  seeAllText: { fontSize: 15, color: '#2563EB', fontWeight: '600' },
  timerText: { fontSize: 15, color: '#D94A4A', fontWeight: '600' },
  categoryList: { paddingHorizontal: 20 },
  categoryItem: { alignItems: 'center', marginRight: 20 },
  categoryImageContainer: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', marginBottom: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  categoryImage: { width: '90%', height: '90%', borderRadius: 30 },
  categoryText: { fontSize: 14, color: '#4A5568', fontWeight: '500' },
  flashSaleList: { paddingHorizontal: 20 },
  flashSaleItem: {
    width: 140,
    marginRight: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  flashSaleImage: {
    width: '100%',
    height: 140,
  },
  flashSaleDetails: {
    padding: 10,
  },
  flashSalePrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#D94A4A',
    marginBottom: 8,
  },
  progressBarBackground: {
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 9,
    backgroundColor: '#F87171',
    position: 'absolute',
  },
  progressBarText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#991B1B',
    alignSelf: 'center',
  },
  petListRow: { justifyContent: 'space-between', paddingHorizontal: 20 },
  petItemContainer: { width: '48%', backgroundColor: '#FFFFFF', borderRadius: 16, marginBottom: 20, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#4A5568', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 2 },
  petItemImage: { width: '100%', height: 160, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  petItemDetails: { padding: 12 },
  petItemName: { fontSize: 15, fontWeight: '600', color: '#2D3748', marginBottom: 8, minHeight: 36 },
  petItemPrice: { fontSize: 16, fontWeight: '700', color: '#D94A4A', marginBottom: 8 },
  petItemSold: { fontSize: 12, color: '#718096' },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#fee',
    marginHorizontal: 20,
    borderRadius: 10,
    marginBottom: 20,
  },
  errorText: {
    fontSize: 14,
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: '#D94A4A',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  retryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default HomeScreen;