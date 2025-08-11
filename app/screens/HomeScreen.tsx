import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Keyboard,
  Modal,
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
import { NotificationBadge } from '../../components/NotificationBadge';
import { useAuth } from '../../hooks/redux';
import ChatSupportButton from '../components/ChatSupportButton';
import PetList from '../components/Pet/PetList';
import ProductList from '../components/ProductList';
import { petsService, productsService } from '../services/api-services';
import { categoriesService, Category } from '../services/categoriesService';
import { Pet, Product } from '../types';

const { width: screenWidth } = Dimensions.get('window');

// Search suggestion interface
interface SearchSuggestion {
  id: string;
  type: 'product' | 'pet' | 'recent';
  title: string;
  subtitle?: string;
  imageUri?: string;
  price?: number;
}

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

  // Existing state
  const [pets, setPets] = useState<Pet[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [petsLoading, setPetsLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // NEW: Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<SearchSuggestion[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // NEW: Popular searches
  const [popularSearches] = useState([
    'Golden Retriever', 'Mèo Ba Tư', 'Thức ăn Royal Canin',
    'Đồ chơi cho chó', 'Vitamin cho thú cưng', 'Poodle'
  ]);

  // NEW: Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const searchInputRef = useRef<TextInput>(null);

  // Existing fallback data
  const fallbackCategories = [
    { _id: '1', name: 'Cats', images: [{ url: 'https://file.hstatic.net/200000108863/file/3_33cbf6a0308e40ca8962af5e0460397c_grande.png' }] },
  ];

  const fallbackPets = [
    { _id: '1', name: 'British Longhair Cat', images: [{ url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSSgjs2sCO0xh0Ve1Sf8mDtBt2UhO9GRZImDw&s' }], price: 1000000, breed_id: { name: 'British' } },
  ];

  const fallbackProducts = [
    { _id: '1', name: 'Dog Food Premium', images: [{ url: 'https://bizweb.dktcdn.net/100/165/948/products/img-5830-jpg.jpg?v=1502808189430' }], price: 250000, category: 'Food' },
  ];

  // NEW: Load recent searches
  useEffect(() => {
    loadRecentSearches();
  }, []);

  useEffect(() => {
    loadInitialData();
  }, []);

  // NEW: Recent searches functions
  const loadRecentSearches = async () => {
    try {
      const recent = await AsyncStorage.getItem('recent_searches');
      if (recent) {
        setRecentSearches(JSON.parse(recent));
      }
    } catch (error) {
      console.log('Error loading recent searches:', error);
    }
  };

  const saveRecentSearch = async (query: string) => {
    try {
      const trimmedQuery = query.trim();
      if (!trimmedQuery) return;

      let updatedRecent = [trimmedQuery, ...recentSearches.filter(item => item !== trimmedQuery)];
      updatedRecent = updatedRecent.slice(0, 10);

      setRecentSearches(updatedRecent);
      await AsyncStorage.setItem('recent_searches', JSON.stringify(updatedRecent));
    } catch (error) {
      console.log('Error saving recent search:', error);
    }
  };

  const clearRecentSearches = async () => {
    try {
      setRecentSearches([]);
      await AsyncStorage.removeItem('recent_searches');
    } catch (error) {
      console.log('Error clearing recent searches:', error);
    }
  };

  // NEW: Search functions - Simplified for suggestions only
  const fetchSearchSuggestions = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchSuggestions([]);
      return;
    }

    setIsSearching(true);
    try {
      // Get quick suggestions (just a few items for preview)
      const [productsResponse, petsResponse] = await Promise.allSettled([
        productsService.searchProducts(query, { limit: 2 }),
        petsService.searchPets(query, { limit: 2 })
      ]);

      const suggestions: SearchSuggestion[] = [];

      // Add product suggestions
      if (productsResponse.status === 'fulfilled' && productsResponse.value.success) {
        const products = productsResponse.value.data || [];
        products.forEach(product => {
          suggestions.push({
            id: product._id,
            type: 'product',
            title: product.name,
            subtitle: `${product.price?.toLocaleString('vi-VN')} đ`,
            imageUri: product.images?.[0]?.url,
            price: product.price,
          });
        });
      }

      // Add pet suggestions
      if (petsResponse.status === 'fulfilled' && petsResponse.value.success) {
        const pets = petsResponse.value.data || [];
        pets.forEach(pet => {
          suggestions.push({
            id: pet._id,
            type: 'pet',
            title: pet.name,
            subtitle: `${pet.breed_id?.name} • ${pet.price?.toLocaleString('vi-VN')} đ`,
            imageUri: pet.images?.[0]?.url,
            price: pet.price,
          });
        });
      }

      setSearchSuggestions(suggestions);
    } catch (error) {
      console.log('Error fetching suggestions:', error);
      setSearchSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);

    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    // Only show suggestions, don't perform full search
    searchTimeout.current = setTimeout(() => {
      fetchSearchSuggestions(text);
    }, 300);
  }, [fetchSearchSuggestions]);

  // NEW: Search modal functions
  const openSearchModal = () => {
    setShowSearchModal(true);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeSearchModal = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 50,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowSearchModal(false);
      setSearchQuery('');
      setSearchSuggestions([]);
      Keyboard.dismiss();
    });
  };

  const performSearch = (query: string) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    saveRecentSearch(trimmedQuery);
    closeSearchModal();

    // Navigate to SearchScreen with the search query
    safeNavigate(navigation, 'Search', {
      searchQuery: trimmedQuery,
      searchType: 'all'
    });
  };

  const handleSuggestionPress = (suggestion: SearchSuggestion) => {
    if (suggestion.type === 'recent') {
      // For recent searches, perform the search
      performSearch(suggestion.title);
    } else {
      // For product/pet suggestions, navigate directly to detail
      closeSearchModal();

      if (suggestion.type === 'product') {
        safeNavigate(navigation, 'ProductDetail', { productId: suggestion.id });
      } else if (suggestion.type === 'pet') {
        safeNavigate(navigation, 'ProductDetail', { pet: { _id: suggestion.id } });
      }
    }
  };

  // Existing functions remain unchanged
  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

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

  // NEW: Render search suggestion item
  const renderSuggestionItem = ({ item }: { item: SearchSuggestion }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => handleSuggestionPress(item)}
    >
      <View style={styles.suggestionContent}>
        {item.imageUri ? (
          <Image source={{ uri: item.imageUri }} style={styles.suggestionImage} />
        ) : (
          <View style={[styles.suggestionImage, styles.placeholderImage]}>
            <MaterialIcons
              name={item.type === 'product' ? 'shopping-bag' : 'pets'}
              size={20}
              color="#9CA3AF"
            />
          </View>
        )}

        <View style={styles.suggestionText}>
          <Text style={styles.suggestionTitle} numberOfLines={1}>
            {item.title}
          </Text>
          {item.subtitle && (
            <Text style={styles.suggestionSubtitle} numberOfLines={1}>
              {item.subtitle}
            </Text>
          )}
        </View>

        <View style={[styles.typeTag,
        item.type === 'product' ? styles.productTag : styles.petTag
        ]}>
          <Text style={[styles.typeTagText,
          item.type === 'product' ? styles.productTagText : styles.petTagText
          ]}>
            {item.type === 'product' ? 'SP' : 'TC'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderRecentSearchItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={styles.recentItem}
      onPress={() => {
        setSearchQuery(item);
        performSearch(item);
      }}
    >
      <MaterialIcons name="history" size={20} color="#9CA3AF" />
      <Text style={styles.recentText}>{item}</Text>
      <TouchableOpacity
        style={styles.insertButton}
        onPress={() => setSearchQuery(item)}
      >
        <MaterialIcons name="arrow-upward" size={16} color="#6B7280" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  // Existing render functions remain unchanged
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
            }}
          />
        </View>
        <Text style={styles.categoryText}>{item.name}</Text>
      </TouchableOpacity>
    );
  };

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

        {/* ENHANCED Search Bar */}
        <TouchableOpacity
          style={styles.searchContainer}
          onPress={openSearchModal}
        >
          <Icon name="search" size={20} color="#A0AEC0" style={styles.searchIcon} />
          <Text style={styles.searchPlaceholder}>Tìm kiếm thú cưng, sản phẩm...</Text>
          <TouchableOpacity>
            <Icon name="camera" size={20} color="#A0AEC0" style={styles.cameraIcon} />
          </TouchableOpacity>
        </TouchableOpacity>

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

      {/* NEW: Search Modal */}
      <Modal
        visible={showSearchModal}
        transparent={true}
        animationType="none"
        onRequestClose={closeSearchModal}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={closeSearchModal}
        >
          <Animated.View
            style={[
              styles.modalContent,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <SafeAreaView style={styles.modalSafeArea}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <View style={styles.modalSearchBar}>
                  <Icon name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
                  <TextInput
                    ref={searchInputRef}
                    style={styles.modalSearchInput}
                    placeholder="Tìm kiếm thú cưng, sản phẩm..."
                    placeholderTextColor="#9CA3AF"
                    value={searchQuery}
                    onChangeText={handleSearchChange}
                    onSubmitEditing={() => performSearch(searchQuery)}
                    returnKeyType="search"
                    autoFocus={true}
                  />
                  {searchQuery ? (
                    <TouchableOpacity
                      style={styles.clearButton}
                      onPress={() => {
                        setSearchQuery('');
                        setSearchSuggestions([]);
                      }}
                    >
                      <MaterialIcons name="close" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                  ) : null}
                </View>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={closeSearchModal}
                >
                  <Text style={styles.cancelText}>Hủy</Text>
                </TouchableOpacity>
              </View>

              {/* Search Content */}
              <View style={styles.searchContent}>
                {isSearching ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#2563EB" />
                    <Text style={styles.loadingText}>Đang tìm kiếm...</Text>
                  </View>
                ) : searchSuggestions.length > 0 ? (
                  // Search Suggestions
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Gợi ý tìm kiếm</Text>
                    <FlatList
                      data={searchSuggestions}
                      renderItem={renderSuggestionItem}
                      keyExtractor={(item) => `${item.type}-${item.id}`}
                      showsVerticalScrollIndicator={false}
                      keyboardShouldPersistTaps="handled"
                    />
                    {/* NEW: Search Button */}
                    <TouchableOpacity
                      style={styles.searchButton}
                      onPress={() => performSearch(searchQuery)}
                    >
                      <Icon name="search" size={20} color="#FFFFFF" />
                      <Text style={styles.searchButtonText}>
                        Tìm kiếm "{searchQuery}"
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : searchQuery.length > 0 ? (
                  // Show search button when no suggestions
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Tìm kiếm</Text>
                    <TouchableOpacity
                      style={styles.searchButton}
                      onPress={() => performSearch(searchQuery)}
                    >
                      <Icon name="search" size={20} color="#FFFFFF" />
                      <Text style={styles.searchButtonText}>
                        Tìm kiếm "{searchQuery}"
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  // Default Content
                  <View style={styles.defaultContent}>
                    {/* Recent Searches */}
                    {recentSearches.length > 0 && (
                      <View style={styles.modalSection}>
                        <View style={styles.modalSectionHeader}>
                          <Text style={styles.modalSectionTitle}>Tìm kiếm gần đây</Text>
                          <TouchableOpacity onPress={clearRecentSearches}>
                            <Text style={styles.clearAllText}>Xóa tất cả</Text>
                          </TouchableOpacity>
                        </View>
                        <FlatList
                          data={recentSearches}
                          renderItem={renderRecentSearchItem}
                          keyExtractor={(item, index) => `recent-${index}`}
                          showsVerticalScrollIndicator={false}
                          keyboardShouldPersistTaps="handled"
                        />
                      </View>
                    )}

                    {/* Popular Searches */}
                    <View style={styles.modalSection}>
                      <Text style={styles.modalSectionTitle}>Tìm kiếm phổ biến</Text>
                      <View style={styles.popularGridContainer}>
                        {popularSearches.map((item, index) => (
                          <TouchableOpacity
                            key={index}
                            style={styles.popularModalChip}
                            onPress={() => {
                              setSearchQuery(item);
                              performSearch(item);
                            }}
                          >
                            <Text style={styles.popularModalChipText}>{item}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </View>
                )}
              </View>
            </SafeAreaView>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

// Enhanced Styles
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

  // ENHANCED Search Container - now touchable
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 20,
    paddingHorizontal: 15,
    paddingVertical: 12,
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
  searchPlaceholder: {
    flex: 1,
    color: '#A0AEC0',
  },

  // NEW: Popular searches on home
  popularContainer: {
    paddingHorizontal: 20,
    gap: 8,
  },
  popularChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  popularChipText: {
    fontSize: 12,
    color: '#1D4ED8',
    fontWeight: '500',
    marginLeft: 4,
  },

  bannerContainer: { marginHorizontal: 20, marginTop: 20 },
  bannerImage: {
    width: '100%',
    height: 150,
    borderRadius: 16,
    backgroundColor: '#F1F5F9'
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

  petListContent: {
    paddingHorizontal: 20,
  },

  productListContent: {
    paddingHorizontal: 20,
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

  // NEW: Search Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    marginTop: 44, // Status bar height
  },
  modalSafeArea: {
    flex: 1,
  },

  // Modal Header
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  modalSearchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 12,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    paddingVertical: 0,
    marginLeft: 8,
  },
  clearButton: {
    padding: 4,
  },
  cancelButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  cancelText: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '500',
  },

  // Search Content
  searchContent: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  clearAllText: {
    fontSize: 14,
    color: '#6B7280',
  },

  // Suggestion Items
  suggestionItem: {
    marginBottom: 12,
  },
  suggestionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  suggestionImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
  },
  placeholderImage: {
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestionText: {
    flex: 1,
  },
  suggestionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  suggestionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  typeTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 32,
    alignItems: 'center',
  },
  productTag: {
    backgroundColor: '#EFF6FF',
  },
  petTag: {
    backgroundColor: '#F0FDF4',
  },
  typeTagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  productTagText: {
    color: '#1D4ED8',
  },
  petTagText: {
    color: '#16A34A',
  },

  // Recent Search Items
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  recentText: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
  },
  insertButton: {
    padding: 4,
  },

  // Popular Searches in Modal
  popularGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  popularModalChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  popularModalChipText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },

  // No Results
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#374151',
    marginTop: 16,
    textAlign: 'center',
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  defaultContent: {
    flex: 1,
  },

  // NEW: Search Button
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 16,
    elevation: 2,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default HomeScreen;