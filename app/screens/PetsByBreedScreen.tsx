// app/screens/PetsByBreedScreen.tsx - Screen hiển thị pets theo breed
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { petsService, SearchPetsParams } from '../services/petsService';
import { Pet } from '../types';

type RouteParams = {
  breedId: string;
  breedName: string;
  categoryId?: string;
  categoryName?: string;
};

const PetsByBreedScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  
  const { breedId, breedName, categoryId, categoryName } = route.params as RouteParams;
  
  // State management
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState<SearchPetsParams>({
    breed_id: breedId,
    status: 'available',
    sortBy: 'created_at',
    sortOrder: 'desc',
  });

  // Load pets when component mounts
  useEffect(() => {
    loadPets(true);
  }, [breedId]);

  // Load pets by breed
  const loadPets = async (reset: boolean = false) => {
    if (loading && !refreshing) return;
    
    try {
      if (reset) {
        setLoading(true);
        setPage(1);
      }

      const currentPage = reset ? 1 : page;
      
      const response = await petsService.searchPets({
        ...filters,
        page: currentPage,
        limit: 10,
      });

      if (response.success) {
        const newPets = response.data.pets;
        const pagination = response.data.pagination;
        
        if (reset) {
          setPets(newPets);
        } else {
          setPets(prevPets => [...prevPets, ...newPets]);
        }
        
        setTotalCount(pagination.totalCount);
        setHasMore(pagination.hasNextPage);
        setPage(pagination.currentPage);
        
        console.log('✅ Pets loaded:', {
          breed: breedName,
          count: newPets.length,
          total: pagination.totalCount,
        });
      } else {
        throw new Error(response.message || 'Failed to load pets');
      }
    } catch (error: any) {
      console.error('❌ Error loading pets:', error);
      Alert.alert(
        'Lỗi',
        'Không thể tải danh sách thú cưng. Vui lòng thử lại.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    loadPets(true);
  };

  // Handle load more
  const handleLoadMore = () => {
    if (hasMore && !loading) {
      setPage(prevPage => prevPage + 1);
      loadPets(false);
    }
  };

  // Handle filter changes
  const updateFilters = (newFilters: Partial<SearchPetsParams>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    // Re-load pets with new filters
    setTimeout(() => loadPets(true), 100);
  };

  // Handle sort change
  const handleSortChange = () => {
    Alert.alert(
      'Sắp xếp theo',
      'Chọn cách sắp xếp',
      [
        {
          text: 'Mới nhất',
          onPress: () => updateFilters({ sortBy: 'created_at', sortOrder: 'desc' })
        },
        {
          text: 'Cũ nhất', 
          onPress: () => updateFilters({ sortBy: 'created_at', sortOrder: 'asc' })
        },
        {
          text: 'Giá tăng dần',
          onPress: () => updateFilters({ sortBy: 'price', sortOrder: 'asc' })
        },
        {
          text: 'Giá giảm dần',
          onPress: () => updateFilters({ sortBy: 'price', sortOrder: 'desc' })
        },
        { text: 'Hủy', style: 'cancel' }
      ]
    );
  };

  // Handle filter by status
  const handleStatusFilter = () => {
    Alert.alert(
      'Trạng thái',
      'Chọn trạng thái thú cưng',
      [
        {
          text: 'Có sẵn',
          onPress: () => updateFilters({ status: 'available' })
        },
        {
          text: 'Đã bán',
          onPress: () => updateFilters({ status: 'sold' })
        },
        {
          text: 'Tạm ngưng',
          onPress: () => updateFilters({ status: 'inactive' })
        },
        {
          text: 'Tất cả',
          onPress: () => updateFilters({ status: undefined })
        },
        { text: 'Hủy', style: 'cancel' }
      ]
    );
  };

  // Render pet item
  const renderPetItem = ({ item }: { item: Pet }) => (
    <TouchableOpacity
      style={styles.petCard}
      onPress={() => navigation.navigate('ProductDetail', { 
        productId: item._id,
        productType: 'pet' 
      })}
      activeOpacity={0.7}
    >
      <Image
        source={{ 
          uri: item.images?.[0]?.url || 'https://via.placeholder.com/150' 
        }}
        style={styles.petImage}
      />
      
      <View style={styles.petInfo}>
        <Text style={styles.petName} numberOfLines={2}>
          {item.name}
        </Text>
        
        <Text style={styles.petPrice}>
          {item.price?.toLocaleString('vi-VN')}đ
        </Text>
        
        <View style={styles.petDetails}>
          {item.age && (
            <Text style={styles.petDetail}>
              🎂 {item.age} tuổi
            </Text>
          )}
          {item.gender && (
            <Text style={styles.petDetail}>
              {item.gender === 'Male' ? '♂️' : '♀️'} {item.gender}
            </Text>
          )}
        </View>
        
        <View style={styles.statusContainer}>
          <View style={[
            styles.statusBadge,
            { backgroundColor: item.status === 'available' ? '#28a745' : '#dc3545' }
          ]}>
            <Text style={styles.statusText}>
              {item.status === 'available' ? 'Có sẵn' : 'Đã bán'}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="paw-outline" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>Chưa có thú cưng nào</Text>
      <Text style={styles.emptySubtitle}>
        Giống {breedName} hiện chưa có thú cưng nào có sẵn
      </Text>
    </View>
  );

  // Render footer loading
  const renderFooter = () => {
    if (!loading || pets.length === 0) return null;
    
    return (
      <View style={styles.footerLoading}>
        <ActivityIndicator size="small" color="#0066cc" />
        <Text style={styles.loadingText}>Đang tải thêm...</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {breedName}
          </Text>
          {categoryName && (
            <Text style={styles.headerSubtitle}>
              {categoryName}
            </Text>
          )}
        </View>
        
        <View style={{ width: 24 }} />
      </View>

      {/* Filter Bar */}
      <View style={styles.filterBar}>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={handleSortChange}
        >
          <Ionicons name="swap-vertical-outline" size={16} color="#666" />
          <Text style={styles.filterButtonText}>Sắp xếp</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={handleStatusFilter}
        >
          <Ionicons name="filter-outline" size={16} color="#666" />
          <Text style={styles.filterButtonText}>Trạng thái</Text>
        </TouchableOpacity>
        
        <View style={styles.resultsCount}>
          <Text style={styles.resultsText}>
            {totalCount} kết quả
          </Text>
        </View>
      </View>

      {/* Pets List */}
      <FlatList
        data={pets}
        keyExtractor={(item) => item._id}
        renderItem={renderPetItem}
        numColumns={2}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#0066cc']}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListEmptyComponent={
          !loading && pets.length === 0 ? renderEmptyState : null
        }
        ListFooterComponent={renderFooter}
      />

      {/* Loading Overlay for initial load */}
      {loading && pets.length === 0 && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#0066cc" />
          <Text style={styles.loadingText}>Đang tải {breedName}...</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    marginTop:20
  },
  backButton: {
    marginRight: 10,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 10,
  },
  filterButtonText: {
    marginLeft: 5,
    fontSize: 14,
    color: '#666',
  },
  resultsCount: {
    flex: 1,
    alignItems: 'flex-end',
  },
  resultsText: {
    fontSize: 14,
    color: '#666',
  },
  listContainer: {
    padding: 10,
  },
  petCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  petImage: {
    width: '100%',
    height: 150,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  petInfo: {
    padding: 12,
  },
  petName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  petPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 5,
  },
  petDetails: {
    marginBottom: 8,
  },
  petDetail: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  statusContainer: {
    alignItems: 'flex-start',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 15,
    marginBottom: 5,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  footerLoading: {
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
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PetsByBreedScreen;