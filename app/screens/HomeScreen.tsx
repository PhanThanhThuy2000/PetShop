// HomeScreen.tsx - Load dữ liệu thực từ API
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { Pet, Product } from '../types';

// Safe navigation helper
const safeNavigate = (navigation: any, routeName: string, params?: any) => {
  try {
    navigation.navigate(routeName, params);
  } catch (error) {
    console.warn(`Route '${routeName}' not found, navigating to Search instead`);
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
  const [pets, setPets] = useState<Pet[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [flashSaleProducts, setFlashSaleProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [petsLoading, setPetsLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fallback data nếu API không hoạt động
  const fallbackCategories = [
    { _id: '1', name: 'Cats', images: [{ url: 'https://file.hstatic.net/200000108863/file/3_33cbf6a0308e40ca8962af5e0460397c_grande.png' }] },
    { _id: '2', name: 'Dogs', images: [{ url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSFUAfyVe3Easiycyh3isP9wDQTYuSmGPsPQvLIJdEYvQ_DsFq5Ez2Nh_QjiS3oZ3B8ZPfK9cZQyIStmQMV1lDPLw' }] },
    { _id: '3', name: 'Rabbits', images: [{ url: 'https://cdn.eva.vn/upload/3-2021/images/2021-09-24/image4-1632449319-210-width600height400.jpg' }] },
    { _id: '4', name: 'Hamsters', images: [{ url: 'https://encrypted-tbn1.gstatic.com/images?q=tbn:ANd9GcQXXutfOGiZ6MYhA4L47gBE3kR-giotG2iF-j5aMMSIlEJrnOTLCdhovShKPCVofxINNjxIYw0b9KAuIKrYqKAbHA' }] },
  ];

  const fallbackPets = [
    { _id: '1', name: 'British Longhair Cat', images: [{ url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSSgjs2sCO0xh0Ve1Sf8mDtBt2UhO9GRZImDw&s' }], price: 1000000, breed_id: { name: 'British' } },
    { _id: '2', name: 'Shiba Inu Dog', images: [{ url: 'https://thuvienmeme.com/wp-content/uploads/2024/07/cho-husky-luom-hinh-su-meme.jpg' }], price: 1000000, breed_id: { name: 'Shiba' } },
  ];

  const fallbackProducts = [
    { _id: '1', name: 'Dog Food Premium', images: [{ url: 'https://bizweb.dktcdn.net/100/165/948/products/img-5830-jpg.jpg?v=1502808189430' }], price: 250000, category: 'Food' },
    { _id: '2', name: 'Cat Toy Ball', images: [{ url: 'https://cocapet.net/wp-content/uploads/2018/08/bear-tam-th%E1%BB%83.jpg' }], price: 120000, category: 'Toy' },
  ];

  // Load data khi component mount
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🚀 Starting to load initial data...');

      // Load tất cả dữ liệu song song
      await Promise.all([
        loadCategories(),
        loadPets(),
        loadProducts(),
        loadFlashSaleProducts()
      ]);

      console.log('✅ All initial data loaded successfully');
    } catch (error: any) {
      console.error('❌ Error loading initial data:', error);
      setError(error.message || 'Failed to load data');
      
      // Show alert to user about the error
      Alert.alert(
        'Loading Error',
        'Some data could not be loaded. Using offline data.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      setCategoriesLoading(true);
      console.log('📁 Loading categories...');
      
      const response = await categoriesService.getCategories();
      
      if (response.success && response.data && response.data.length > 0) {
        console.log('✅ Categories loaded:', response.data.length, 'items');
        setCategories(response.data);
      } else {
        console.log('⚠️ No categories from API, using fallback');
        setCategories(fallbackCategories as Category[]);
      }
    } catch (error: any) {
      console.error('❌ Error loading categories:', error);
      setCategories(fallbackCategories as Category[]);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const loadPets = async () => {
    try {
      setPetsLoading(true);
      console.log('🐕 Loading pets...');
      
      const response = await petsService.getPets({ page: 1, limit: 6 });
      
      if (response.success && response.data && response.data.length > 0) {
        console.log('✅ Pets loaded:', response.data.length, 'items');
        console.log('🔍 First pet:', response.data[0]);
        setPets(response.data);
      } else {
        console.log('⚠️ No pets from API, using fallback');
        setPets(fallbackPets as Pet[]);
      }
    } catch (error: any) {
      console.error('❌ Error loading pets:', error);
      console.log('🔄 Using fallback pets data');
      setPets(fallbackPets as Pet[]);
    } finally {
      setPetsLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      setProductsLoading(true);
      console.log('🛍️ Loading products...');
      
      const response = await productsService.getProducts({ page: 1, limit: 10 });
      
      if (response.success && response.data && response.data.length > 0) {
        console.log('✅ Products loaded:', response.data.length, 'items');
        console.log('🔍 First product:', response.data[0]);
        setProducts(response.data);
      } else {
        console.log('⚠️ No products from API, using fallback');
        setProducts(fallbackProducts as Product[]);
      }
    } catch (error: any) {
      console.error('❌ Error loading products:', error);
      console.log('🔄 Using fallback products data');
      setProducts(fallbackProducts as Product[]);
    } finally {
      setProductsLoading(false);
    }
  };

  const loadFlashSaleProducts = async () => {
    try {
      console.log('⚡ Loading flash sale products...');
      
      // Try to get featured products for flash sale
      const response = await productsService.getProducts({ limit: 4, featured: true });
      
      if (response.success && response.data && response.data.length > 0) {
        console.log('✅ Flash sale products loaded:', response.data.length, 'items');
        setFlashSaleProducts(response.data);
      } else {
        // If no featured products, get first 4 regular products
        console.log('⚠️ No featured products, getting regular products for flash sale');
        const regularResponse = await productsService.getProducts({ limit: 4 });
        
        if (regularResponse.success && regularResponse.data && regularResponse.data.length > 0) {
          setFlashSaleProducts(regularResponse.data);
        } else {
          console.log('🔄 Using fallback for flash sale');
          setFlashSaleProducts(fallbackProducts.slice(0, 4) as Product[]);
        }
      }
    } catch (error: any) {
      console.error('❌ Error loading flash sale products:', error);
      setFlashSaleProducts(fallbackProducts.slice(0, 4) as Product[]);
    }
  };

  const onRefresh = async () => {
    console.log('🔄 Refreshing data...');
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  };

  // Helper function để lấy hình ảnh đầu tiên
  const getImageUrl = (images: any[] = []) => {
    if (images && images.length > 0) {
      const primaryImage = images.find(img => img.is_primary);
      return primaryImage?.url || images[0]?.url;
    }
    return 'https://via.placeholder.com/150?text=No+Image';
  };

  // Helper function để format giá
  const formatPrice = (price: number) => {
    if (!price) return '0';
    return price.toLocaleString('vi-VN') + '₫';
  };

  // Render functions
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
              console.log('❌ Image load error for category:', item.name, error);
            }}
          />
        </View>
        <Text style={styles.categoryText}>{item.name}</Text>
      </TouchableOpacity>
    );
  };

  const renderFlashSaleItem = ({ item }: { item: Product }) => {
    const imageUrl = getImageUrl(item.images);
    return (
      <TouchableOpacity 
        style={styles.flashSaleItem}
        onPress={() => safeNavigate(navigation, 'ProductDetail', { productId: item._id })}
      >
        <Image
          source={{ uri: imageUrl }}
          style={styles.flashSaleImage}
          onError={(error) => {
            console.log('❌ Flash sale image error:', item.name, error);
          }}
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

  const renderPetItem = ({ item }: { item: Pet }) => {
    const imageUrl = getImageUrl(item.images);
    return (
      <TouchableOpacity
        style={styles.petItemContainer}
        onPress={() => safeNavigate(navigation, 'ProductDetail', { pet: item })} // truyền object pet
      >
        
        <Image
          source={{ uri: imageUrl }}
          style={styles.petItemImage}
          onError={(error) => {
            console.log('❌ Pet image error:', item.name, error); 
          }}
        />
        <View style={styles.petItemDetails}>
          <Text style={styles.petItemName} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={styles.petItemPrice}>{formatPrice(item.price)}</Text>
          <Text style={styles.petItemSold}>
            {item.breed_id?.name || item.type || 'Available'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderProductItem = ({ item }: { item: Product }) => {
    const imageUrl = getImageUrl(item.images);
    console.log('🎨 Rendering product:', item.name, 'with image:', imageUrl);
    
    return (
      <TouchableOpacity
        style={styles.itemContainer}
        onPress={() => safeNavigate(navigation, 'ProductDetail', { productId: item._id })}
      >
        <Image
          source={{ uri: imageUrl }}
          style={styles.itemImage}
          onError={(error) => {
            console.log('❌ Product image error:', item.name, error);
          }}
        />
        <View style={styles.itemDetails}>
          <Text style={styles.itemName} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={styles.itemPrice}>{formatPrice(item.price)}</Text>
          <Text style={styles.itemSold}>
            Stock: {(item as any).stock || 'Available'}
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
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={['#2563EB']}
            tintColor="#2563EB"
          />
        }
      >

        <View style={styles.header}>
          <Text style={styles.headerTitle}>Pet Store</Text>
          <TouchableOpacity onPress={() => safeNavigate(navigation, 'Chat')}>
            <Icon name="message-circle" size={26} color="#2D3748" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color="#A0AEC0" style={styles.searchIcon} />
          <TextInput 
            placeholder="Search for pets & products..." 
            style={styles.searchInput} 
            placeholderTextColor="#A0AEC0" 
            onFocus={() => safeNavigate(navigation, 'Search')}
          />
          <TouchableOpacity>
            <Icon name="camera" size={20} color="#A0AEC0" style={styles.cameraIcon} />
          </TouchableOpacity>
        </View>

        {/* Banner */}
        <View style={styles.bannerContainer}>
          <Image
            source={{ uri: 'https://lh3.googleusercontent.com/proxy/YGBdiGmx0h-riNmW-TPMA_o5BY-9hLAuEmu3CwdtbG7BN8yo2AevyQgu5TM49Bwuo0GM1eNd1XNVOqoIvF1IVHhFHTDzuy-xPBdGZXfQlK2AY2Xrspkrlz0-8nvwkMagvkGE0JFNUx0gK9O0' }}
            style={styles.bannerImage}
          />
        </View>

        {/* Categories Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Categories</Text>
          </View>
          {categoriesLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#2563EB" />
              <Text style={styles.loadingText}>Loading categories...</Text>
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

        {/* Flash Sale Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Flash Sale</Text>
            <Text style={styles.timerText}>Ends in 00:15:30</Text>
          </View>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#D94A4A" />
              <Text style={styles.loadingText}>Loading flash sale...</Text>
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
        
        {/* Pets Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>For You - Pets</Text>
            <TouchableOpacity onPress={() => safeNavigate(navigation, 'PetAll')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          {petsLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#2563EB" />
              <Text style={styles.loadingText}>Loading pets...</Text>
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

        {/* Products Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Pet Products</Text>
            <TouchableOpacity onPress={() => safeNavigate(navigation, 'ProductAll')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          {productsLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#2563EB" />
              <Text style={styles.loadingText}>Loading products...</Text>
            </View>
          ) : products.length > 0 ? (
            <View>
     
              <FlatList
                data={products}
                renderItem={renderProductItem}
                keyExtractor={(item) => item._id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.itemScrollList}
              />
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No products available</Text>
            </View>
          )}
        </View>

        {/* Error handling */}
        {error && (
          <View style={styles.errorContainer}>
            <Icon name="alert-circle" size={24} color="#D32F2F" />
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

// Styles
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8F9FA' },
  container: { paddingBottom: 20 },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingTop: 30, 
    paddingBottom: 10 
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#2D3748' },
  
  searchContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFFFFF', 
    borderRadius: 12, 
    marginHorizontal: 20, 
    paddingHorizontal: 15, 
    marginTop: 10, 
    borderWidth: 1, 
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchIcon: { marginRight: 10 },
  cameraIcon: { marginLeft: 10 },
  searchInput: { flex: 1, height: 48, fontSize: 16, color: '#2D3748' },
  
  bannerContainer: { marginHorizontal: 20, marginTop: 20 },
  bannerImage: { 
    width: '100%', 
    height: 150, 
    borderRadius: 16,
    backgroundColor: '#F1F5F9' // Placeholder color while loading
  },
  
  section: { marginTop: 24 },
  sectionHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    marginBottom: 16 
  },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#2D3748' },
  seeAllText: { fontSize: 15, color: '#2563EB', fontWeight: '600' },
  timerText: { fontSize: 15, color: '#D94A4A', fontWeight: '600' },
  
  categoryList: { paddingHorizontal: 20 },
  categoryItem: { alignItems: 'center', marginRight: 20 },
  categoryImageContainer: { 
    width: 64, 
    height: 64, 
    borderRadius: 32, 
    backgroundColor: '#FFFFFF', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 8, 
    borderWidth: 1, 
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
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
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  flashSaleImage: { width: '100%', height: 140, backgroundColor: '#F1F5F9' },
  flashSaleDetails: { padding: 10 },
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
  petItemContainer: { 
    width: '48%', 
    backgroundColor: '#FFFFFF', 
    borderRadius: 16, 
    marginBottom: 20, 
    borderWidth: 1, 
    borderColor: '#E2E8F0', 
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  petItemImage: { 
    width: '100%', 
    height: 160, 
    borderTopLeftRadius: 16, 
    borderTopRightRadius: 16,
    backgroundColor: '#F1F5F9'
  },
  petItemDetails: { padding: 12 },
  petItemName: { 
    fontSize: 15, 
    fontWeight: '600', 
    color: '#2D3748', 
    marginBottom: 8, 
    minHeight: 36 
  },
  petItemPrice: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: '#D94A4A', 
    marginBottom: 8 
  },
  petItemSold: { fontSize: 12, color: '#718096' },
  
  itemScrollList: { paddingHorizontal: 20 },
  itemContainer: {
    width: 160,
    marginRight: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  itemImage: {
    width: '100%',
    height: 120,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    backgroundColor: '#F1F5F9'
  },
  itemDetails: { padding: 12 },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 8,
    minHeight: 32,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2563EB',
    marginBottom: 6,
  },
  itemSold: { fontSize: 12, color: '#718096' },
  
  resultCount: { 
    paddingHorizontal: 20, 
    marginBottom: 10, 
    color: '#666',
    fontSize: 14,
    fontStyle: 'italic'
  },
  
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#666',
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
    backgroundColor: '#FEF2F2',
    marginHorizontal: 20,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    fontSize: 14,
    color: '#DC2626',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  
  debugContainer: {
    padding: 15,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 20,
    borderRadius: 8,
    marginTop: 20,
  },
  debugText: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'monospace',
  },
});

export default HomeScreen;