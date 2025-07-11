// app/screens/UniversalSearchScreen.tsx
import { MaterialIcons } from '@expo/vector-icons';
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Dimensions, 
  FlatList, 
  Image, 
  StyleSheet, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  View,
  ActivityIndicator,
  Alert,
  ScrollView
} from 'react-native';
import { useUniversalSearch, SearchCategory, SearchResult } from '../../hooks/useUniversalSearch';
import { Product, Pet } from '../types';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 48) / 2;

export default function UniversalSearchScreen({ navigation }: any) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<SearchCategory>('all');
  
  const { 
    results,
    products, 
    pets,
    loading, 
    error, 
    productsPagination,
    petsPagination,
    searchAll,
    searchProducts,
    searchPets,
    resetSearch
  } = useUniversalSearch();

  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  const handleSearch = useCallback((query: string, category: SearchCategory = 'all') => {
    console.log('🎯 UniversalSearch: Starting search for:', query, 'in category:', category);
    
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(() => {
      console.log('⏰ UniversalSearch: Debounce timeout triggered');
      
      resetSearch();
      
      if (query.trim()) {
        console.log('🔍 UniversalSearch: Calling search functions');
        
        switch (category) {
          case 'all':
            searchAll({ keyword: query.trim(), page: 1, limit: 5 });
            break;
          case 'products':
            searchProducts({ keyword: query.trim(), page: 1, limit: 10 });
            break;
          case 'pets':
            searchPets({ keyword: query.trim(), page: 1, limit: 10 });
            break;
        }
      } else {
        // Load initial data when no search query
        if (category === 'all') {
          searchAll({ page: 1, limit: 5 });
        } else if (category === 'products') {
          searchProducts({ page: 1, limit: 10 });
        } else if (category === 'pets') {
          searchPets({ page: 1, limit: 10 });
        }
      }
    }, 800);

    setSearchTimeout(timeout);
  }, [resetSearch, searchAll, searchProducts, searchPets]);

  useEffect(() => {
    console.log('🔄 UniversalSearch: Search query or tab changed:', searchQuery, activeTab);
    handleSearch(searchQuery, activeTab);
  }, [searchQuery, activeTab]);

  useEffect(() => {
    console.log('🚀 UniversalSearch: Component mounted');
    handleSearch('', 'all');
  }, []);

  const loadMoreProducts = useCallback(() => {
    if (!loading && productsPagination.hasNextPage) {
      console.log('📄 Loading more products, page:', productsPagination.currentPage + 1);
      searchProducts({
        keyword: searchQuery || undefined,
        page: productsPagination.currentPage + 1,
        limit: 10
      });
    }
  }, [loading, productsPagination, searchQuery, searchProducts]);

  const loadMorePets = useCallback(() => {
    if (!loading && petsPagination.hasNextPage) {
      console.log('📄 Loading more pets, page:', petsPagination.currentPage + 1);
      searchPets({
        keyword: searchQuery || undefined,
        page: petsPagination.currentPage + 1,
        limit: 10
      });
    }
  }, [loading, petsPagination, searchQuery, searchPets]);

  const renderProductItem = ({ item }: { item: Product }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => navigation.navigate('ProductDetail', { id: item._id })}
    >
      <Image 
        source={{ 
          uri: item.images?.[0]?.url || 'https://via.placeholder.com/150' 
        }} 
        style={styles.image}
      />
      <View style={styles.badge}>
        <Text style={styles.badgeText}>Sản phẩm</Text>
      </View>
      <Text style={styles.category}>
        {item.category_id?.name || 'Danh mục'}
      </Text>
      <Text style={styles.name} numberOfLines={2}>
        {item.name}
      </Text>
      <Text style={styles.price}>
        {item.price?.toLocaleString('vi-VN')} đ
      </Text>
    </TouchableOpacity>
  );

  const renderPetItem = ({ item }: { item: Pet }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => navigation.navigate('PetDetail', { id: item._id })}
    >
      <Image 
        source={{ 
          uri: item.images?.[0]?.url || 'https://via.placeholder.com/150' 
        }} 
        style={styles.image}
      />
      <View style={[styles.badge, styles.petBadge]}>
        <Text style={styles.badgeText}>Thú cưng</Text>
      </View>
      <Text style={styles.category}>
        {item.breed_id?.name || item.type || 'Giống'}
      </Text>
      <Text style={styles.name} numberOfLines={2}>
        {item.name}
      </Text>
      <Text style={styles.price}>
        {item.price?.toLocaleString('vi-VN')} đ
      </Text>
    </TouchableOpacity>
  );

  const renderUniversalItem = ({ item }: { item: SearchResult }) => {
    if (item.type === 'product') {
      return renderProductItem({ item: item.data as Product });
    } else {
      return renderPetItem({ item: item.data as Pet });
    }
  };

  const renderTabContent = () => {
    if (loading && getCurrentData().length === 0) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Đang tìm kiếm...</Text>
        </View>
      );
    }

    const data = getCurrentData();
    const pagination = getCurrentPagination();
    const loadMore = getCurrentLoadMore();

    return (
      <FlatList
        data={data}
        renderItem={activeTab === 'all' ? renderUniversalItem : 
          activeTab === 'products' ? renderProductItem : renderPetItem}
        keyExtractor={(item) => activeTab === 'all' ? 
          `${(item as SearchResult).type}-${((item as SearchResult).data as any)._id}` :
          (item as any)._id}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyComponent}
        ListFooterComponent={renderFooter}
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
      />
    );
  };

  const getCurrentData = () => {
    switch (activeTab) {
      case 'all': return results;
      case 'products': return products;
      case 'pets': return pets;
      default: return [];
    }
  };

  const getCurrentPagination = () => {
    switch (activeTab) {
      case 'products': return productsPagination;
      case 'pets': return petsPagination;
      default: return { hasNextPage: false };
    }
  };

  const getCurrentLoadMore = () => {
    switch (activeTab) {
      case 'products': return loadMoreProducts;
      case 'pets': return loadMorePets;
      default: return () => {};
    }
  };

  const getCurrentCount = () => {
    switch (activeTab) {
      case 'all': return productsPagination.totalCount + petsPagination.totalCount;
      case 'products': return productsPagination.totalCount;
      case 'pets': return petsPagination.totalCount;
      default: return 0;
    }
  };

  const renderFooter = () => {
    if (!loading) return null;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color="#2563EB" />
        <Text style={styles.loadingText}>Đang tải thêm...</Text>
      </View>
    );
  };

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="search-off" size={64} color="#A0AEC0" />
      <Text style={styles.emptyText}>
        {searchQuery ? 'Không tìm thấy kết quả nào' : 'Nhập từ khóa để tìm kiếm'}
      </Text>
      {error && (
        <Text style={styles.errorText}>Lỗi: {error}</Text>
      )}
    </View>
  );

  const showDebugInfo = () => {
    Alert.alert('Debug Info', 
      `Tab: ${activeTab}\n` +
      `Products: ${products.length}\n` +
      `Pets: ${pets.length}\n` +
      `Results: ${results.length}\n` +
      `Loading: ${loading}\n` +
      `Error: ${error || 'None'}\n` +
      `Query: "${searchQuery}"`
    );
  };

  return (
    <View style={styles.container}>
      {/* Header with search */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={20} color="#A0AEC0" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm sản phẩm và thú cưng..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
        </View>
        
        <TouchableOpacity 
          style={styles.debugButton}
          onPress={showDebugInfo}
        >
          <MaterialIcons name="info" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { key: 'all', label: 'Tất cả', count: getCurrentCount() },
            { key: 'products', label: 'Sản phẩm', count: productsPagination.totalCount },
            { key: 'pets', label: 'Thú cưng', count: petsPagination.totalCount }
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.activeTab]}
              onPress={() => setActiveTab(tab.key as SearchCategory)}
            >
              <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
                {tab.label}
                {tab.count > 0 && ` (${tab.count})`}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Search results info */}
      {(searchQuery || getCurrentData().length > 0) && (
        <View style={styles.searchInfo}>
          <Text style={styles.searchInfoText}>
            {searchQuery 
              ? `Tìm thấy ${getCurrentCount()} kết quả cho "${searchQuery}"`
              : `Hiển thị ${getCurrentCount()} mục`
            }
          </Text>
        </View>
      )}

      {/* Content */}
      {renderTabContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  debugButton: {
    padding: 8,
    marginLeft: 8,
  },
  tabContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginHorizontal: 4,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#2563EB',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#2563EB',
    fontWeight: '600',
  },
  searchInfo: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F8F9FA',
  },
  searchInfoText: {
    fontSize: 13,
    color: '#666',
  },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 16,
    paddingTop: 8,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    margin: 6,
    alignItems: 'flex-start',
    width: ITEM_WIDTH,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 90,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: '#F1F5F9',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#2563EB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    zIndex: 1,
  },
  petBadge: {
    backgroundColor: '#059669',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  category: {
    color: '#888',
    fontSize: 12,
    marginBottom: 2,
  },
  name: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 4,
    color: '#333',
  },
  price: {
    color: '#d60000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 14,
  },
  loadingFooter: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  errorText: {
    marginTop: 8,
    color: '#DC2626',
    textAlign: 'center',
    fontSize: 14,
  },
});