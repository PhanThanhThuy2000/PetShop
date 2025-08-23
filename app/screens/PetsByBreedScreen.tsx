import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import FeatherIcon from 'react-native-vector-icons/Feather';
import PetList from '../components/Pet/PetList'; // ✅ Import PetList component
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
  const [loadingMore, setLoadingMore] = useState(false);

  // Load pets khi component mount hoặc page thay đổi
  useEffect(() => {
    loadPetsByBreed(true);
  }, [breedId]);

  // Load pets theo breed từ API
  const loadPetsByBreed = async (reset: boolean = false) => {
    if ((loading || loadingMore) && !refreshing) return;

    try {
      if (reset) {
        setLoading(true);
        setPage(1);
      } else {
        setLoadingMore(true);
      }

      const currentPage = reset ? 1 : page;

      console.log('🔍 Loading pets for breed:', breedName, 'Page:', currentPage);

      const response = await petsService.getPetsByBreed(breedId, {
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
          page: currentPage,
        });

        if (reset) {
          setPets(newPets);
        } else {
          setPets(prevPets => [...prevPets, ...newPets]);
        }

        setTotalCount(pagination.totalCount);
        setHasMore(pagination.hasNextPage);
        if (pagination.hasNextPage) {
          setPage(currentPage + 1);
        }
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
      setLoadingMore(false);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    loadPetsByBreed(true);
  };

  // Handle load more
  const handleLoadMore = () => {
    if (hasMore && !loading && !loadingMore) {
      loadPetsByBreed(false);
    }
  };

  // Navigate to pet detail
  const navigateToPetDetail = (pet: Pet) => {
    navigation.navigate('ProductDetail', {
      pet: pet,
      petId: pet._id,
    });
  };

  // ✨ Custom Empty Component với style giống original
  const CustomEmptyComponent = () => (
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

  // ✨ Custom Footer Component
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

    if (!loadingMore || pets.length === 0) return null;

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

      {/* Header - Giữ nguyên style original */}
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
            {breedName}
          </Text>
        </View>

        <TouchableOpacity style={styles.filterButton} activeOpacity={0.7}>
          <FeatherIcon name="search" size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Results Summary - Giữ nguyên style original */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryLeft}>
          <Text style={styles.summaryText}>
            {totalCount > 0 ? `${totalCount} kết quả` : 'Đang tìm kiếm...'}
          </Text>
          {loading && pets.length === 0 && (
            <View style={styles.loadingDot}>
              <ActivityIndicator size="small" color="#3B82F6" />
            </View>
          )}
        </View>
      </View>

      {/* ✨ Sử dụng PetList component thay vì custom FlatList */}
      <View style={styles.petListContainer}>
        <PetList
          pets={pets}
          loading={loading && pets.length === 0}
          numColumns={2}
          horizontal={false}
          onPetPress={navigateToPetDetail}
          itemStyle="grid"
          scrollEnabled={true}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={!loading && pets.length === 0 ? CustomEmptyComponent : null}
          // ✨ Thêm RefreshControl và LoadMore functionality
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
          ListFooterComponent={renderFooter}
        />
      </View>

      {/* Loading Overlay - Giữ nguyên style original */}
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

// ✨ Styles được giữ nguyên như original, chỉ thêm petListContainer
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
  // ✨ NEW: Container cho PetList
  petListContainer: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 24,
  },
  // Empty state styles - giữ nguyên như original
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
  // Footer loading styles - giữ nguyên như original
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
  // Loading overlay styles - giữ nguyên như original
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