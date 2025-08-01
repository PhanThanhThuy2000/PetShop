// app/screens/PetsByBreedScreen.tsx - GIAO DIỆN ĐÃ TỐI ƯU
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import FeatherIcon from 'react-native-vector-icons/Feather';
import { petsService } from '../services/petsService';
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

  // Load pets khi component mount
  useEffect(() => {
    loadPetsByBreed(true);
  }, [breedId]);

  // Load pets theo breed từ API
  const loadPetsByBreed = async (reset: boolean = false) => {
    if (loading && !refreshing) return;

    try {
      if (reset) {
        setLoading(true);
        setPage(1);
      }

      const currentPage = reset ? 1 : page;

      console.log('🔍 Loading pets for breed:', breedName, 'Page:', currentPage);

      const response = await petsService.searchPets({
        breed_id: breedId,
        status: 'available',
        page: currentPage,
        limit: 10,
        sortBy: 'created_at',
        sortOrder: 'desc',
      });

      if (response.success) {
        const newPets = response.data.pets;
        const pagination = response.data.pagination;

        console.log('✅ Pets loaded:', {
          breed: breedName,
          count: newPets.length,
          total: pagination.totalCount,
          page: currentPage
        });

        if (reset) {
          setPets(newPets);
        } else {
          setPets(prevPets => [...prevPets, ...newPets]);
        }

        setTotalCount(pagination.totalCount);
        setHasMore(pagination.hasNextPage);
        setPage(pagination.currentPage);
      } else {
        throw new Error(response.message || 'Không thể tải thú cưng');
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
    loadPetsByBreed(true);
  };

  // Handle load more
  const handleLoadMore = () => {
    if (hasMore && !loading) {
      setPage(prevPage => prevPage + 1);
      loadPetsByBreed(false);
    }
  };

  // Navigate to pet detail
  const navigateToPetDetail = (pet: Pet) => {
    navigation.navigate('ProductDetail', {
      pet: pet,
      petId: pet._id
    });
  };

  // Render pet item
  const renderPetItem = ({ item }: { item: Pet }) => (
    <TouchableOpacity
      style={styles.petCard}
      onPress={() => navigateToPetDetail(item)}
      activeOpacity={0.8}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{
            uri: item.images?.[0]?.url || 'https://via.placeholder.com/200x150'
          }}
          style={styles.petImage}
          resizeMode="cover"
        />
        <View style={styles.statusOverlay}>
          <View style={[
            styles.statusBadge,
            { backgroundColor: item.status === 'available' ? '#10B981' : '#EF4444' }
          ]}>
            <Text style={styles.statusText}>
              {item.status === 'available' ? 'Có sẵn' : 'Đã bán'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.petInfo}>
        <Text style={styles.petName} numberOfLines={2}>
          {item.name}
        </Text>

        <Text style={styles.petPrice}>
          {item.price?.toLocaleString('vi-VN')}đ
        </Text>

      </View>
    </TouchableOpacity>
  );

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconWrapper}>
        <FeatherIcon name="search" size={48} color="#D1D5DB" />
      </View>
      <Text style={styles.emptyTitle}>Chưa có thú cưng nào</Text>
      <Text style={styles.emptySubtitle}>
        Giống {breedName} hiện chưa có thú cưng nào có sẵn
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => navigation.goBack()}
        activeOpacity={0.8}
      >
        <FeatherIcon name="arrow-left" size={16} color="#FFFFFF" />
        <Text style={styles.emptyButtonText}>Quay lại</Text>
      </TouchableOpacity>
    </View>
  );

  // Render footer loading
  const renderFooter = () => {
    if (!hasMore && pets.length > 0) {
      return (
        <View style={styles.endMessage}>
          <Text style={styles.endMessageText}>
            Đã hiển thị tất cả {totalCount} thú cưng
          </Text>
        </View>
      );
    }

    if (!loading || pets.length === 0) return null;

    return (
      <View style={styles.footerLoading}>
        <ActivityIndicator size="small" color="#3B82F6" />
        <Text style={styles.loadingText}>Đang tải thêm...</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Thú cưng
          </Text>
         
        </View>

        <TouchableOpacity
          style={styles.filterButton}
          activeOpacity={0.7}
        >
          <FeatherIcon name="filter" size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Results Summary */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryLeft}>
          <Text style={styles.summaryText}>
            {totalCount > 0
              ? `${totalCount} kết quả`
              : 'Đang tìm kiếm...'
            }
          </Text>
          {loading && pets.length === 0 && (
            <View style={styles.loadingDot}>
              <ActivityIndicator size="small" color="#3B82F6" />
            </View>
          )}
        </View>

        <View style={styles.summaryRight}>
          <FeatherIcon name="grid" size={16} color="#6B7280" />
          <Text style={styles.viewModeText}>Lưới</Text>
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
            colors={['#3B82F6']}
            tintColor="#3B82F6"
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          !loading && pets.length === 0 ? renderEmptyState : null
        }
        ListFooterComponent={renderFooter}
        ItemSeparatorComponent={() => <View style={{ height: 4 }} />}
        columnWrapperStyle={styles.row}
      />

      {/* Loading Overlay */}
      {loading && pets.length === 0 && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingOverlayText}>
              Đang tải {breedName}...
            </Text>
          </View>
        </View>
      )}
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
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
    fontWeight: '500',
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E7EB',
  },
  summaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  loadingDot: {
    marginLeft: 8,
  },
  summaryRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewModeText: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 6,
    fontWeight: '500',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 24,
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  petCard: {
    flex: 0.48,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    height: 160,
  },
  petImage: {
    width: '100%',
    height: '100%',
  },
  statusOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statusText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  petInfo: {
    padding: 12,
  },
  petName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 6,
    lineHeight: 20,
  },
  petPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#EF4444',
    marginBottom: 8,
  },
  petDetailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  detailText: {
    fontSize: 11,
    color: '#6B7280',
    marginLeft: 4,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  emptyIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    maxWidth: 280,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#3B82F6',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  footerLoading: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  endMessage: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  endMessageText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  loadingContent: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 32,
    paddingVertical: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  loadingOverlayText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
});

export default PetsByBreedScreen;