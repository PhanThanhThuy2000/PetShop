// app/screens/ProductAllScreen.tsx
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useProductSearch } from '../../hooks/useProductSearch';
import { productsService, SearchProductsParams, FilterOptions } from '../services/productsService';
import { Product } from '../types';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 48) / 2;

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: SearchProductsParams) => void;
  initialFilters: SearchProductsParams;
}

const FilterModal: React.FC<FilterModalProps> = ({ visible, onClose, onApply, initialFilters }) => {
  const [localFilters, setLocalFilters] = useState<SearchProductsParams>(initialFilters);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadFilterOptions();
      setLocalFilters(initialFilters);
    }
  }, [visible, initialFilters]);

  const loadFilterOptions = async () => {
    setLoading(true);
    try {
      const response = await productsService.getFilterOptions();
      if (response.success) {
        setFilterOptions(response.data);
      }
    } catch (error) {
      console.error('Filter options error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters: SearchProductsParams = {
      sortBy: 'created_at',
      sortOrder: 'desc',
      page: 1,
      limit: 10
    };
    setLocalFilters(resetFilters);
    onApply(resetFilters);
    onClose();
  };

  if (loading) {
    return (
      <Modal visible={visible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.loadingText}>Đang tải...</Text>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Lọc sản phẩm</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.filterContent} showsVerticalScrollIndicator={false}>
            {/* Danh mục */}
            <View style={styles.filterSection}>
              <Text style={styles.filterTitle}>Danh mục</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <TouchableOpacity
                  style={[
                    styles.categoryChip,
                    !localFilters.categoryId && styles.categoryChipActive
                  ]}
                  onPress={() => setLocalFilters(prev => ({ ...prev, categoryId: undefined }))}
                >
                  <Text style={[
                    styles.categoryChipText,
                    !localFilters.categoryId && styles.categoryChipTextActive
                  ]}>
                    Tất cả
                  </Text>
                </TouchableOpacity>
                {filterOptions?.categories.map((category) => (
                  <TouchableOpacity
                    key={category._id}
                    style={[
                      styles.categoryChip,
                      localFilters.categoryId === category._id && styles.categoryChipActive
                    ]}
                    onPress={() => setLocalFilters(prev => ({ 
                      ...prev, 
                      categoryId: category._id === localFilters.categoryId ? undefined : category._id 
                    }))}
                  >
                    <Text style={[
                      styles.categoryChipText,
                      localFilters.categoryId === category._id && styles.categoryChipTextActive
                    ]}>
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Khoảng giá */}
            <View style={styles.filterSection}>
              <Text style={styles.filterTitle}>Khoảng giá</Text>
              <View style={styles.priceInputContainer}>
                <TextInput
                  style={styles.priceInput}
                  placeholder="Giá tối thiểu"
                  value={localFilters.minPrice?.toString() || ''}
                  onChangeText={(text) => {
                    const price = text ? Number(text) : undefined;
                    setLocalFilters(prev => ({ ...prev, minPrice: price }));
                  }}
                  keyboardType="numeric"
                />
                <Text style={styles.priceSeperator}>-</Text>
                <TextInput
                  style={styles.priceInput}
                  placeholder="Giá tối đa"
                  value={localFilters.maxPrice?.toString() || ''}
                  onChangeText={(text) => {
                    const price = text ? Number(text) : undefined;
                    setLocalFilters(prev => ({ ...prev, maxPrice: price }));
                  }}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Trạng thái */}
            <View style={styles.filterSection}>
              <Text style={styles.filterTitle}>Trạng thái</Text>
              <View style={styles.statusContainer}>
                {['available', 'sold', 'pending'].map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.statusChip,
                      localFilters.status === status && styles.statusChipActive
                    ]}
                    onPress={() => setLocalFilters(prev => ({ 
                      ...prev, 
                      status: status === localFilters.status ? undefined : status 
                    }))}
                  >
                    <Text style={[
                      styles.statusChipText,
                      localFilters.status === status && styles.statusChipTextActive
                    ]}>
                      {status === 'available' ? 'Có sẵn' : 
                       status === 'sold' ? 'Đã bán' : 'Đang chờ'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Sắp xếp */}
            <View style={styles.filterSection}>
              <Text style={styles.filterTitle}>Sắp xếp theo</Text>
              <View style={styles.sortContainer}>
                {[
                  { key: 'created_at', label: 'Mới nhất' },
                  { key: 'price', label: 'Giá' },
                  { key: 'name', label: 'Tên A-Z' }
                ].map((sort) => (
                  <TouchableOpacity
                    key={sort.key}
                    style={[
                      styles.sortChip,
                      localFilters.sortBy === sort.key && styles.sortChipActive
                    ]}
                    onPress={() => setLocalFilters(prev => ({ ...prev, sortBy: sort.key }))}
                  >
                    <Text style={[
                      styles.sortChipText,
                      localFilters.sortBy === sort.key && styles.sortChipTextActive
                    ]}>
                      {sort.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              {/* Thứ tự sắp xếp */}
              <View style={styles.orderContainer}>
                <TouchableOpacity
                  style={[
                    styles.orderChip,
                    localFilters.sortOrder === 'desc' && styles.orderChipActive
                  ]}
                  onPress={() => setLocalFilters(prev => ({ ...prev, sortOrder: 'desc' }))}
                >
                  <Text style={[
                    styles.orderChipText,
                    localFilters.sortOrder === 'desc' && styles.orderChipTextActive
                  ]}>
                    Giảm dần
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.orderChip,
                    localFilters.sortOrder === 'asc' && styles.orderChipActive
                  ]}
                  onPress={() => setLocalFilters(prev => ({ ...prev, sortOrder: 'asc' }))}
                >
                  <Text style={[
                    styles.orderChipText,
                    localFilters.sortOrder === 'asc' && styles.orderChipTextActive
                  ]}>
                    Tăng dần
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
              <Text style={styles.resetButtonText}>Đặt lại</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
              <Text style={styles.applyButtonText}>Áp dụng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const ProductAllScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { products, loading, error, pagination, searchProducts, resetSearch } = useProductSearch();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [activeFilters, setActiveFilters] = useState<SearchProductsParams>({
    sortBy: 'created_at',
    sortOrder: 'desc',
    page: 1,
    limit: 10
  });
  const [refreshing, setRefreshing] = useState(false);

  // Load initial data
  useFocusEffect(
    useCallback(() => {
      handleSearch('');
    }, [])
  );

  const handleSearch = useCallback((query: string, filters?: SearchProductsParams) => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(() => {
      const searchParams: SearchProductsParams = {
        ...activeFilters,
        ...filters,
        keyword: query.trim() || undefined,
        page: 1,
      };

      console.log('🔍 ProductAllScreen: Searching with params:', searchParams);
      resetSearch();
      searchProducts(searchParams);
    }, 500);

    setSearchTimeout(timeout);
  }, [searchTimeout, activeFilters, resetSearch, searchProducts]);

  const handleLoadMore = useCallback(() => {
    if (!loading && pagination.hasNextPage) {
      const loadMoreParams: SearchProductsParams = {
        ...activeFilters,
        keyword: searchQuery.trim() || undefined,
        page: pagination.currentPage + 1,
      };
      
      console.log('📄 ProductAllScreen: Loading more, page:', pagination.currentPage + 1);
      searchProducts(loadMoreParams);
    }
  }, [loading, pagination, activeFilters, searchQuery, searchProducts]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await handleSearch(searchQuery, activeFilters);
    } finally {
      setRefreshing(false);
    }
  }, [searchQuery, activeFilters, handleSearch]);

  const handleApplyFilters = useCallback((filters: SearchProductsParams) => {
    setActiveFilters(filters);
    handleSearch(searchQuery, filters);
  }, [searchQuery, handleSearch]);

  const renderProductItem = ({ item }: { item: Product }) => (
    <TouchableOpacity 
      style={styles.productCard}
      onPress={() => navigation.navigate('ProductDetail', { id: item._id })}
    >
      <Image 
        source={{ 
          uri: item.images?.[0]?.url || 'https://via.placeholder.com/150' 
        }} 
        style={styles.productImage}
        resizeMode="cover"
      />
      <View style={styles.productInfo}>
        <Text style={styles.categoryText}>
          {item.category_id?.name || 'Sản phẩm'}
        </Text>
        <Text style={styles.productName} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.productPrice}>
          {item.price?.toLocaleString('vi-VN')} đ
        </Text>
        {item.status && (
          <View style={[
            styles.statusBadge,
            item.status === 'available' ? styles.availableBadge :
            item.status === 'sold' ? styles.soldBadge : styles.pendingBadge
          ]}>
            <Text style={[
              styles.statusText,
              item.status === 'available' ? styles.availableText :
              item.status === 'sold' ? styles.soldText : styles.pendingText
            ]}>
              {item.status === 'available' ? 'Có sẵn' : 
               item.status === 'sold' ? 'Đã bán' : 'Đang chờ'}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="search-off" size={64} color="#9CA3AF" />
      <Text style={styles.emptyTitle}>
        {searchQuery ? 'Không tìm thấy sản phẩm' : 'Chưa có sản phẩm nào'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery ? 'Hãy thử từ khóa khác hoặc điều chỉnh bộ lọc' : 'Vui lòng quay lại sau'}
      </Text>
    </View>
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

  const renderError = () => (
    <View style={styles.errorContainer}>
      <MaterialIcons name="error-outline" size={48} color="#EF4444" />
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity 
        style={styles.retryButton}
        onPress={() => handleSearch(searchQuery)}
      >
        <Text style={styles.retryText}>Thử lại</Text>
      </TouchableOpacity>
    </View>
  );

  if (error && products.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        {renderError()}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tất cả sản phẩm</Text>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setShowFilterModal(true)}
        >
          <Ionicons name="filter" size={24} color="#374151" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm sản phẩm..."
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              handleSearch(text);
            }}
            returnKeyType="search"
            onSubmitEditing={() => handleSearch(searchQuery)}
          />
          {searchQuery ? (
            <TouchableOpacity 
              onPress={() => {
                setSearchQuery('');
                handleSearch('');
              }}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Results Count */}
      {pagination.totalCount > 0 && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsText}>
            Tìm thấy {pagination.totalCount} sản phẩm
          </Text>
        </View>
      )}

      {/* Product List */}
      <FlatList
        data={products}
        renderItem={renderProductItem}
        keyExtractor={(item) => item._id}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyComponent}
        ListFooterComponent={renderFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
      />

      {/* Filter Modal */}
      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApply={handleApplyFilters}
        initialFilters={activeFilters}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginTop:15
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    textAlign: 'center',
  },
  filterButton: {
    padding: 8,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
  },
  clearButton: {
    padding: 4,
  },
  resultsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  resultsText: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  row: {
    justifyContent: 'space-between',
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    width: ITEM_WIDTH,
  },
  productImage: {
    width: '100%',
    height: 120,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  productInfo: {
    padding: 12,
  },
  categoryText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    minHeight: 34,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2563EB',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  availableBadge: {
    backgroundColor: '#D1FAE5',
  },
  soldBadge: {
    backgroundColor: '#FEE2E2',
  },
  pendingBadge: {
    backgroundColor: '#FEF3C7',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  availableText: {
    color: '#065F46',
  },
  soldText: {
    color: '#991B1B',
  },
  pendingText: {
    color: '#92400E',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  loadingFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginVertical: 16,
  },
  retryButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%', // Tăng từ 80% lên 90%
    minHeight: '70%', // Thêm chiều cao tối thiểu
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  filterContent: {
    flex: 1,
    padding: 20,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  categoryChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: '#2563EB',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#374151',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceInput: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  priceSeperator: {
    marginHorizontal: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  statusContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statusChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  statusChipActive: {
    backgroundColor: '#2563EB',
  },
  statusChipText: {
    fontSize: 14,
    color: '#374151',
  },
  statusChipTextActive: {
    color: '#FFFFFF',
  },
  sortContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  sortChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  sortChipActive: {
    backgroundColor: '#2563EB',
  },
  sortChipText: {
    fontSize: 14,
    color: '#374151',
  },
  sortChipTextActive: {
    color: '#FFFFFF',
  },
  orderContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  orderChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  orderChipActive: {
    backgroundColor: '#2563EB',
  },
  orderChipText: {
    fontSize: 14,
    color: '#374151',
  },
  orderChipTextActive: {
    color: '#FFFFFF',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  resetButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  applyButton: {
    flex: 1,
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 8,
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default ProductAllScreen;