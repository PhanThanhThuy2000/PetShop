// app/screens/SearchScreen.tsx (Debug Version)
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
  Alert
} from 'react-native';
import { useProductSearch } from '../../hooks/useProductSearch';
import { Product } from '../types';

const numColumns = 2;
const ITEM_WIDTH = (Dimensions.get('window').width - 48) / numColumns;

export default function SearchScreen({ navigation }: any) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    categoryId: '',
    minPrice: '',
    maxPrice: '',
    sortBy: 'created_at',
    sortOrder: 'desc' as 'asc' | 'desc'
  });
  
  const { products, loading, error, pagination, searchProducts, resetSearch } = useProductSearch();

  // Debounce search - chờ 800ms sau khi người dùng ngừng gõ
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  const handleSearch = useCallback((query: string) => {
    console.log('🎯 SearchScreen: Starting search for:', query);
    
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(() => {
      console.log('⏰ SearchScreen: Debounce timeout triggered');
      
      // Reset previous results
      resetSearch();
      
      if (query.trim()) {
        console.log('🔍 SearchScreen: Calling searchProducts with keyword:', query);
        searchProducts({
          keyword: query.trim(), // Đảm bảo sử dụng 'keyword' parameter
          ...filters,
          page: 1,
          limit: 10
        });
      } else {
        console.log('📝 SearchScreen: Empty query, loading all products');
        // Nếu không có từ khóa, tải tất cả sản phẩm
        searchProducts({
          page: 1,
          limit: 10
        });
      }
    }, 800);

    setSearchTimeout(timeout);
  }, [filters, searchProducts, resetSearch]);

  useEffect(() => {
    console.log('🔄 SearchScreen: Search query changed to:', searchQuery);
    handleSearch(searchQuery);
  }, [searchQuery]);

  // Load initial products when component mounts
  useEffect(() => {
    console.log('🚀 SearchScreen: Component mounted, loading initial products');
    searchProducts({
      page: 1,
      limit: 10
    });
  }, []);

  // Load more sản phẩm khi scroll đến cuối
  const loadMoreProducts = useCallback(() => {
    if (!loading && pagination.hasNextPage) {
      console.log('📄 SearchScreen: Loading more products, page:', pagination.currentPage + 1);
      searchProducts({
        keyword: searchQuery || undefined,
        ...filters,
        page: pagination.currentPage + 1,
        limit: 10
      });
    }
  }, [loading, pagination, searchQuery, filters, searchProducts]);

  const renderProductItem = ({ item }: { item: Product }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => {
        console.log('🎯 SearchScreen: Product selected:', item._id);
        navigation.navigate('ProductDetail', { id: item._id });
      }}
    >
      <Image 
        source={{ 
          uri: item.images?.[0]?.url || 'https://via.placeholder.com/150' 
        }} 
        style={styles.image}
        onError={() => console.log('🖼️ Image load error for product:', item._id)}
      />
      <Text style={styles.sold}>
        {item.category_id?.name || 'Uncategorized'}
      </Text>
      <Text style={styles.name} numberOfLines={2}>
        {item.name}
      </Text>
      <Text style={styles.price}>
        {item.price?.toLocaleString('vi-VN')} đ
      </Text>
    </TouchableOpacity>
  );

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
        {searchQuery ? 'Không tìm thấy sản phẩm nào' : 'Nhập từ khóa để tìm kiếm'}
      </Text>
      {error && (
        <Text style={styles.errorText}>Lỗi: {error}</Text>
      )}
    </View>
  );

  const handleRetry = () => {
    console.log('🔄 SearchScreen: Retry button pressed');
    resetSearch();
    handleSearch(searchQuery);
  };

  // Debug: Show current state
  const showDebugInfo = () => {
    Alert.alert('Debug Info', 
      `Products: ${products.length}\n` +
      `Loading: ${loading}\n` +
      `Error: ${error || 'None'}\n` +
      `Query: "${searchQuery}"\n` +
      `Page: ${pagination.currentPage}/${pagination.totalPages}\n` +
      `Total: ${pagination.totalCount}`
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchBarRow}>
        <TouchableOpacity 
          style={styles.iconButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        
        <View style={styles.searchBarContainer}>
          <TextInput
            style={styles.searchBar}
            placeholder="Tìm kiếm sản phẩm..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
        </View>
        
        <TouchableOpacity 
          style={styles.iconButton}
          onPress={showDebugInfo}
        >
          <MaterialIcons name="info" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Hiển thị thông tin tìm kiếm */}
      {(searchQuery || products.length > 0) && (
        <View style={styles.searchInfo}>
          <Text style={styles.searchInfoText}>
            {searchQuery 
              ? `Tìm thấy ${pagination.totalCount} sản phẩm cho "${searchQuery}"`
              : `Hiển thị ${pagination.totalCount} sản phẩm`
            }
          </Text>
        </View>
      )}

      {/* Loading cho lần tìm kiếm đầu tiên */}
      {loading && products.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Đang tìm kiếm...</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={renderProductItem}
          keyExtractor={(item) => item._id}
          numColumns={numColumns}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyComponent}
          ListFooterComponent={renderFooter}
          onEndReached={loadMoreProducts}
          onEndReachedThreshold={0.1}
        />
      )}

      {/* Hiển thị lỗi nếu có */}
      {error && products.length > 0 && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={handleRetry}
          >
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 40,
  },
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  iconButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBarContainer: {
    flex: 1,
    paddingHorizontal: 8,
  },
  searchBar: {
    height: 36,
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  searchInfo: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F8F9FA',
  },
  searchInfoText: {
    fontSize: 14,
    color: '#666',
  },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 16,
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
  },
  image: {
    width: '100%',
    height: 90,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: '#F1F5F9',
  },
  sold: {
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
  errorContainer: {
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    margin: 16,
    borderRadius: 8,
  },
  errorText: {
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 8,
  },
  retryButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});