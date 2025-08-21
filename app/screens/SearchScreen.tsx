import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { petsService, productsService } from '../services/api-services';
import { Pet, Product } from '../types';

const { width: screenWidth } = Dimensions.get('window');

interface SearchResult {
  type: 'pet' | 'product';
  data: Pet | Product;
}

interface SearchScreenParams {
  searchQuery?: string;
  searchType?: 'all' | 'pets' | 'products';
}

const SearchScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params as SearchScreenParams;

  // State
  const [searchQuery, setSearchQuery] = useState(params?.searchQuery || '');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'pets' | 'products'>(params?.searchType || 'all');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Pagination
  const [petsPage, setPetsPage] = useState(1);
  const [productsPage, setProductsPage] = useState(1);
  const [hasMorePets, setHasMorePets] = useState(true);
  const [hasMoreProducts, setHasMoreProducts] = useState(true);

  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  // Load recent searches on mount
  useEffect(() => {
    loadRecentSearches();
  }, []);

  // Perform initial search if query provided
  useFocusEffect(
    useCallback(() => {
      if (params?.searchQuery) {
        setSearchQuery(params.searchQuery);
        performSearch(params.searchQuery);
        saveRecentSearch(params.searchQuery);
      }
    }, [params?.searchQuery])
  );

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

  const performSearch = async (query: string, tab: string = activeTab, page: number = 1) => {
    if (!query.trim()) {
      setSearchResults([]);
      setPets([]);
      setProducts([]);
      return;
    }

    setLoading(true);
    setShowSuggestions(false);

    try {
      let newPets: Pet[] = [];
      let newProducts: Product[] = [];

      // PETS SEARCH
      if (tab === 'all' || tab === 'pets') {
        try {
          let petsResponse;

          try {
            // Try new format first
            petsResponse = await petsService.searchPets({
              keyword: query,
              page,
              limit: 20,
            });
          } catch (newApiError) {
            // Fallback to old format
            petsResponse = await petsService.searchPets(query, {
              page,
              limit: 20,
            });
          }

          if (petsResponse && petsResponse.success) {
            const petsData = petsResponse.data?.pets || petsResponse.data || petsResponse.pets || [];

            // Apply client-side filtering for better results
            const filteredPets = Array.isArray(petsData)
              ? petsData.filter((pet: Pet) => {
                const searchTerm = query.toLowerCase().trim();
                const petName = pet.name?.toLowerCase() || '';
                const petBreed = pet.breed_id?.name?.toLowerCase() || '';
                const petType = pet.type?.toLowerCase() || '';
                const petDescription = pet.description?.toLowerCase() || '';

                return (
                  petName.includes(searchTerm) ||
                  petBreed.includes(searchTerm) ||
                  petType.includes(searchTerm) ||
                  petDescription.includes(searchTerm) ||
                  (searchTerm === 'chó' && (petType.includes('dog') || petName.includes('dog'))) ||
                  (searchTerm === 'mèo' && (petType.includes('cat') || petName.includes('cat'))) ||
                  (searchTerm === 'cún' && (petType.includes('dog') || petName.includes('dog')))
                );
              })
              : [];

            newPets = filteredPets;

            if (page === 1) {
              setPets(newPets);
            } else {
              setPets(prev => [...prev, ...newPets]);
            }

            setHasMorePets(newPets.length >= 10);
          } else {
            if (page === 1) setPets([]);
            setHasMorePets(false);
          }
        } catch (petsError) {
          // Try fallback: get all pets and filter client-side
          try {
            const allPetsResponse = await petsService.getPets({ page: 1, limit: 100 });
            if (allPetsResponse.success) {
              const allPets = allPetsResponse.data || [];
              const filteredPets = allPets.filter((pet: Pet) => {
                const searchTerm = query.toLowerCase().trim();
                const petName = pet.name?.toLowerCase() || '';
                const petBreed = pet.breed_id?.name?.toLowerCase() || '';
                const petType = pet.type?.toLowerCase() || '';

                return (
                  petName.includes(searchTerm) ||
                  petBreed.includes(searchTerm) ||
                  petType.includes(searchTerm) ||
                  (searchTerm === 'chó' && petType.includes('dog')) ||
                  (searchTerm === 'mèo' && petType.includes('cat'))
                );
              });

              newPets = filteredPets;
              if (page === 1) setPets(newPets);
              setHasMorePets(false);
            }
          } catch (fallbackError) {
            if (page === 1) setPets([]);
            setHasMorePets(false);
          }
        }
      }

      // PRODUCTS SEARCH
      if (tab === 'all' || tab === 'products') {
        try {
          let productsResponse;

          try {
            // Try new format first
            productsResponse = await productsService.searchProducts({
              keyword: query,
              page,
              limit: 20,
            });
          } catch (newApiError) {
            // Fallback to old format
            productsResponse = await productsService.searchProducts(query, {
              page,
              limit: 20,
            });
          }

          if (productsResponse && productsResponse.success) {
            const productsData =
              productsResponse.data?.products || productsResponse.data || productsResponse.products || [];

            // Apply client-side filtering for better results
            const filteredProducts = Array.isArray(productsData)
              ? productsData.filter((product: Product) => {
                const searchTerm = query.toLowerCase().trim();
                const productName = product.name?.toLowerCase() || '';
                const productCategory =
                  product.category_id?.name?.toLowerCase() || product.category?.name?.toLowerCase() || '';
                const productDescription = product.description?.toLowerCase() || '';

                return (
                  productName.includes(searchTerm) ||
                  productCategory.includes(searchTerm) ||
                  productDescription.includes(searchTerm) ||
                  (searchTerm.includes('thức ăn') &&
                    (productName.includes('food') || productCategory.includes('food'))) ||
                  (searchTerm.includes('đồ chơi') &&
                    (productName.includes('toy') || productCategory.includes('toy')))
                );
              })
              : [];

            newProducts = filteredProducts;

            if (page === 1) {
              setProducts(newProducts);
            } else {
              setProducts(prev => [...prev, ...newProducts]);
            }

            setHasMoreProducts(newProducts.length >= 10);
          } else {
            if (page === 1) setProducts([]);
            setHasMoreProducts(false);
          }
        } catch (productsError) {
          // Try fallback: get all products and filter client-side
          try {
            const allProductsResponse = await productsService.getProducts({ page: 1, limit: 100 });
            if (allProductsResponse.success) {
              const allProducts = allProductsResponse.data || [];
              const filteredProducts = allProducts.filter((product: Product) => {
                const searchTerm = query.toLowerCase().trim();
                const productName = product.name?.toLowerCase() || '';
                const productCategory = product.category_id?.name?.toLowerCase() || '';

                return productName.includes(searchTerm) || productCategory.includes(searchTerm);
              });

              newProducts = filteredProducts;
              if (page === 1) setProducts(newProducts);
              setHasMoreProducts(false);
            }
          } catch (fallbackError) {
            if (page === 1) setProducts([]);
            setHasMoreProducts(false);
          }
        }
      }

      // Combine results for 'all' tab
      if (tab === 'all') {
        const combinedResults: SearchResult[] = [
          ...newPets.map(pet => ({ type: 'pet' as const, data: pet })),
          ...newProducts.map(product => ({ type: 'product' as const, data: product })),
        ];

        if (page === 1) {
          setSearchResults(combinedResults);
        } else {
          setSearchResults(prev => [...prev, ...combinedResults]);
        }
      }

      // Update pagination counters
      if (page === 1) {
        setPetsPage(1);
        setProductsPage(1);
      }
    } catch (error) {
      Alert.alert('Lỗi tìm kiếm', 'Có lỗi xảy ra khi tìm kiếm. Vui lòng thử lại.', [{ text: 'OK' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    setShowSuggestions(text.length > 0);

    // Clear previous timeout
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    // Debounce search
    if (text.trim()) {
      searchTimeout.current = setTimeout(() => {
        performSearch(text, activeTab);
      }, 500);
    } else {
      setSearchResults([]);
      setPets([]);
      setProducts([]);
    }
  };

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      performSearch(searchQuery, activeTab);
      saveRecentSearch(searchQuery);
      setShowSuggestions(false);
    }
  };

  const handleTabChange = (tab: 'all' | 'pets' | 'products') => {
    setActiveTab(tab);
    if (searchQuery.trim()) {
      performSearch(searchQuery, tab);
    }
  };

  const handleRecentSearchPress = (query: string) => {
    setSearchQuery(query);
    performSearch(query, activeTab);
    saveRecentSearch(query);
    setShowSuggestions(false);
  };

  const handleLoadMore = () => {
    if (loading) return;

    if (activeTab === 'pets' && hasMorePets) {
      const nextPage = petsPage + 1;
      setPetsPage(nextPage);
      performSearch(searchQuery, 'pets', nextPage);
    } else if (activeTab === 'products' && hasMoreProducts) {
      const nextPage = productsPage + 1;
      setProductsPage(nextPage);
      performSearch(searchQuery, 'products', nextPage);
    } else if (activeTab === 'all' && (hasMorePets || hasMoreProducts)) {
      const nextPetsPage = hasMorePets ? petsPage + 1 : petsPage;
      const nextProductsPage = hasMoreProducts ? productsPage + 1 : productsPage;
      setPetsPage(nextPetsPage);
      setProductsPage(nextProductsPage);
      performSearch(searchQuery, 'all', Math.max(nextPetsPage, nextProductsPage));
    }
  };

  const handleItemPress = (item: SearchResult) => {
    if (item.type === 'pet') {
      navigation.navigate('ProductDetail', { petId: item.data._id });
    } else {
      navigation.navigate('ProductDetail', { productId: item.data._id });
    }
  };

  const renderSearchSuggestions = () => {
    if (!showSuggestions || !searchQuery) return null;

    return (
      <View style={styles.suggestionsContainer}>
        <FlatList
          data={recentSearches.filter(item => item.toLowerCase().includes(searchQuery.toLowerCase()))}
          keyExtractor={(item, index) => `suggestion - ${index} `}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.suggestionItem} onPress={() => handleRecentSearchPress(item)}>
              <MaterialIcons name="history" size={20} color="#9CA3AF" />
              <Text style={styles.suggestionText}>{item}</Text>
              <MaterialIcons name="arrow-upward" size={16} color="#6B7280" />
            </TouchableOpacity>
          )}
          style={styles.suggestionsList}
        />
      </View>
    );
  };

  const renderTabs = () => (
    <View style={styles.tabsContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'all' && styles.activeTab]}
        onPress={() => handleTabChange('all')}
      >
        <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
          Tất cả ({searchResults.length})
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'pets' && styles.activeTab]}
        onPress={() => handleTabChange('pets')}
      >
        <Text style={[styles.tabText, activeTab === 'pets' && styles.activeTabText]}>
          Thú cưng ({pets.length})
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'products' && styles.activeTab]}
        onPress={() => handleTabChange('products')}
      >
        <Text style={[styles.tabText, activeTab === 'products' && styles.activeTabText]}>
          Sản phẩm ({products.length})
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderSearchItem = ({ item }: { item: SearchResult }) => {
    const isPet = item.type === 'pet';
    const data = item.data as Pet | Product;
    const imageUri = data.images?.[0]?.url || 'https://via.placeholder.com/150';
    // Hiển thị giá từ final_price (cho pet) hoặc price (cho product)
    const price = isPet
      ? (data as Pet).variants && (data as Pet).variants.length > 0 && (data as Pet).variants[0].final_price
        ? (data as Pet).variants[0].final_price.toLocaleString('vi-VN') + '₫'
        : 'Liên hệ'
      : (data as Product).price && (data as Product).price > 0
        ? (data as Product).price.toLocaleString('vi-VN') + '₫'
        : 'Liên hệ';

    return (
      <TouchableOpacity style={styles.gridItem} onPress={() => handleItemPress(item)}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUri }} style={styles.itemImage} />
          <View style={[styles.typeTag, isPet ? styles.petTag : styles.productTag]}>
            <Text style={styles.typeTagText}>{isPet ? 'Pet' : 'SP'}</Text>
          </View>
        </View>
        <View style={styles.itemInfo}>
          <Text style={styles.itemTitle} numberOfLines={2}>
            {data.name || 'Không có tên'}
          </Text>
          <Text style={styles.itemPrice}>{price}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="search-off" size={64} color="#D1D5DB" />
      <Text style={styles.emptyTitle}>
        {searchQuery ? 'Không tìm thấy kết quả' : 'Nhập từ khóa để tìm kiếm'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery
          ? 'Thử tìm kiếm với từ khóa khác hoặc kiểm tra chính tả'
          : 'Tìm kiếm thú cưng và sản phẩm yêu thích của bạn'}
      </Text>
    </View>
  );

  const renderGridContent = () => {
    let data: SearchResult[] = [];
    if (activeTab === 'pets') {
      data = pets.map(pet => ({ type: 'pet' as const, data: pet }));
    } else if (activeTab === 'products') {
      data = products.map(product => ({ type: 'product' as const, data: product }));
    } else {
      data = searchResults;
    }

    return (
      <FlatList
        data={data}
        renderItem={renderSearchItem}
        keyExtractor={(item, index) => `${item.type} -${item.data._id} -${index} `}
        numColumns={2}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        contentContainerStyle={styles.gridContainer}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={
          loading && data.length > 0 ? (
            <View style={styles.loadMoreContainer}>
              <ActivityIndicator size="small" color="#3B82F6" />
              <Text style={styles.loadMoreText}>Đang tải thêm...</Text>
            </View>
          ) : null
        }
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>

        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm thú cưng, sản phẩm..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={handleSearchChange}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
            autoFocus={!params?.searchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => {
                setSearchQuery('');
                setSearchResults([]);
                setPets([]);
                setProducts([]);
                setShowSuggestions(false);
              }}
            >
              <MaterialIcons name="close" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Search Suggestions */}
      {renderSearchSuggestions()}

      {/* Tabs */}
      {(searchQuery && (pets.length > 0 || products.length > 0)) && renderTabs()}

      {/* Content */}
      <View style={styles.content}>{renderGridContent()}</View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  suggestionsContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    maxHeight: 200,
  },
  suggestionsList: {
    maxHeight: 200,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  suggestionText: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#3B82F6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  gridContainer: {
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 20,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  gridItem: {
    width: (screenWidth - 32) / 2 - 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    margin: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  imageContainer: {
    position: 'relative',
  },
  itemImage: {
    width: '100%',
    height: 140,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  itemInfo: {
    padding: 12,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
    lineHeight: 18,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
  },
  typeTag: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    minWidth: 24,
    alignItems: 'center',
  },
  productTag: {
    backgroundColor: 'rgba(59, 130, 246, 0.9)',
  },
  petTag: {
    backgroundColor: 'rgba(34, 197, 94, 0.9)',
  },
  typeTagText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  loadMoreContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    marginTop: 16,
  },
  loadMoreText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default SearchScreen;