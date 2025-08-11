import { useNavigation, useRoute } from '@react-navigation/native';
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
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

// Import components and services
import { NotificationBadge } from '../../components/NotificationBadge';
import { useAuth } from '../../hooks/redux';
import ChatSupportButton from '../components/ChatSupportButton';
import HomeSearchBar from '../components/HomeSearchBar'; // Import the new component
import PetList from '../components/Pet/PetList';
import ProductList from '../components/ProductList';
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
  const route = useRoute();
  const { token } = useAuth();

  // Main data state
  const [pets, setPets] = useState<Pet[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [petsLoading, setPetsLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fallback data if API doesn't work
  const fallbackCategories = [
    { _id: '1', name: 'Cats', images: [{ url: 'https://file.hstatic.net/200000108863/file/3_33cbf6a0308e40ca8962af5e0460397c_grande.png' }] },
  ];

  const fallbackPets = [
    { _id: '1', name: 'British Longhair Cat', images: [{ url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSSgjs2sCO0xh0Ve1Sf8mDtBt2UhO9GRZImDw&s' }], price: 1000000, breed_id: { name: 'British' } },
  ];

  const fallbackProducts = [
    { _id: '1', name: 'Dog Food Premium', images: [{ url: 'https://bizweb.dktcdn.net/100/165/948/products/img-5830-jpg.jpg?v=1502808189430' }], price: 250000, category: 'Food' },
  ];

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load all data in parallel
      await Promise.all([
        loadCategories(),
        loadPets(),
        loadProducts(),
      ]);

    } catch (error: any) {
      setError(error.message || 'Failed to load data');

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
      const response = await categoriesService.getCategories();
      if (response.success && response.data && response.data.length > 0) {
        setCategories(response.data);
      } else {
        setCategories(fallbackCategories as Category[]);
      }
    } catch (error: any) {
      setCategories(fallbackCategories as Category[]);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const loadPets = async () => {
    try {
      setPetsLoading(true);
      const response = await petsService.getPets({ page: 1, limit: 6 });
      if (response.success && response.data && response.data.length > 0) {
        setPets(response.data);
      } else {
        setPets(fallbackPets as Pet[]);
      }
    } catch (error: any) {
      setPets(fallbackPets as Pet[]);
    } finally {
      setPetsLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      setProductsLoading(true);
      const response = await productsService.getProducts({ page: 1, limit: 10 });
      if (response.success && response.data && response.data.length > 0) {
        setProducts(response.data);
      } else {
        setProducts(fallbackProducts as Product[]);
      }
    } catch (error: any) {
      setProducts(fallbackProducts as Product[]);
    } finally {
      setProductsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  };

  const handlePetPress = (pet: Pet) => {
    safeNavigate(navigation, 'ProductDetail', { pet: pet });
  };

  const handleProductPress = (product: Product) => {
    safeNavigate(navigation, 'ProductDetail', { productId: product._id });
  };

  const getImageUrl = (images: any[] = []) => {
    if (images && images.length > 0) {
      const primaryImage = images.find(img => img.is_primary);
      return primaryImage?.url || images[0]?.url;
    }
    return 'https://via.placeholder.com/150?text=No+Image';
  };

  // Category item renderer
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
              // Handle image error silently
            }}
          />
        </View>
        <Text style={styles.categoryText}>{item.name}</Text>
      </TouchableOpacity>
    );
  };

  // Empty components
  const PetEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No pets available</Text>
    </View>
  );

  const ProductEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No products available</Text>
    </View>
  );

  // Search handlers for HomeSearchBar
  const handleSearchFocus = () => {
    // Optional: Add any additional logic when search is focused
    console.log('Search focused');
  };

  const handleSearchBlur = () => {
    // Optional: Add any additional logic when search is blurred
    console.log('Search blurred');
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

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Pet Store</Text>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={() => navigation.navigate('PushNotifications')}
            >
              <Icon name="bell" size={24} color="#2D3748" />
              <NotificationBadge
                style={styles.notificationBadge}
                textStyle={styles.badgeText}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* NEW: HomeSearchBar Component - Replacing the old search */}
        <View style={styles.searchSection}>
          <HomeSearchBar
            placeholder="Tìm kiếm thú cưng, sản phẩm..."
            onSearchFocus={handleSearchFocus}
            onSearchBlur={handleSearchBlur}
          />
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
            <Text style={styles.sectionTitle}>Danh mục</Text>
          </View>
          {categoriesLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#2563EB" />
              <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
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

        {/* Pets Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Thú cưng</Text>
            <TouchableOpacity onPress={() => safeNavigate(navigation, 'PetAll')}>
              <Text style={styles.seeAllText}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>

          <PetList
            pets={pets}
            loading={petsLoading}
            numColumns={2}
            horizontal={false}
            scrollEnabled={false}
            onPetPress={handlePetPress}
            itemStyle="grid"
            contentContainerStyle={styles.petListContent}
            ListEmptyComponent={PetEmptyComponent}
          />
        </View>

        {/* Products Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Vật phẩm</Text>
            <TouchableOpacity onPress={() => safeNavigate(navigation, 'ProductAll')}>
              <Text style={styles.seeAllText}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>

          <ProductList
            products={products}
            loading={productsLoading}
            numColumns={1}
            horizontal={true}
            scrollEnabled={true}
            onProductPress={handleProductPress}
            itemStyle="horizontal"
            contentContainerStyle={styles.productListContent}
            showsHorizontalScrollIndicator={false}
            ListEmptyComponent={ProductEmptyComponent}
          />
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

      {/* Floating Chat Support Button */}
      <ChatSupportButton
        variant="floating"
        size="medium"
      />
    </SafeAreaView>
  );
};

// Styles - Cleaned up and optimized
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA'
  },
  container: {
    paddingBottom: 20
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 10
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D3748'
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  notificationButton: {
    position: 'relative',
    padding: 4,
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },

  // NEW: Search section wrapper
  searchSection: {
    paddingTop: 5, // Small top padding
  },

  // Banner
  bannerContainer: {
    marginHorizontal: 20,
    marginTop: 20
  },
  bannerImage: {
    width: '100%',
    height: 150,
    borderRadius: 16,
    backgroundColor: '#F1F5F9'
  },

  // Sections
  section: {
    marginTop: 24
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D3748'
  },
  seeAllText: {
    fontSize: 15,
    color: '#2563EB',
    fontWeight: '600'
  },

  // Categories
  categoryList: {
    paddingHorizontal: 20
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: 20
  },
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
  categoryImage: {
    width: '90%',
    height: '90%',
    borderRadius: 30
  },
  categoryText: {
    fontSize: 14,
    color: '#4A5568',
    fontWeight: '500'
  },

  // Lists
  petListContent: {
    paddingHorizontal: 20,
  },
  productListContent: {
    paddingHorizontal: 20,
  },

  // Loading states
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

  // Empty states
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },

  // Error handling
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
});

export default HomeScreen;