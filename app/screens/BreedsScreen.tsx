// app/screens/BreedsScreen.tsx - GIAO DIỆN ĐÃ TỐI ƯU
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
  View
} from 'react-native';
import FeatherIcon from 'react-native-vector-icons/Feather';
import { Breed, categoriesService } from '../services/categoriesService';

type RouteParams = {
  categoryId: string;
  categoryName: string;
};

const BreedsScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const { categoryId, categoryName } = route.params as RouteParams;

  // State management
  const [breeds, setBreeds] = useState<Breed[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Load breeds khi component mount
  useEffect(() => {
    if (categoryId) {
      loadBreedsByCategory();
    }
  }, [categoryId]);

  // Load breeds theo category từ API
  const loadBreedsByCategory = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      console.log('🔍 Loading breeds for category:', categoryId);

      const response = await categoriesService.getBreedsByCategory(categoryId);

      if (response.success) {
        console.log('✅ Breeds loaded:', response.data.length);
        setBreeds(response.data);
      } else {
        throw new Error(response.message || 'Không thể tải danh sách breeds');
      }
    } catch (error: any) {
      console.error('❌ Error loading breeds:', error);
      Alert.alert(
        'Lỗi',
        'Không thể tải danh sách giống. Vui lòng thử lại.',
        [
          { text: 'Thử lại', onPress: () => loadBreedsByCategory() },
          { text: 'Hủy', style: 'cancel' }
        ]
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    loadBreedsByCategory(true);
  };

  // Xử lý khi click vào breed
  const handleBreedPress = (breed: Breed) => {
    console.log('🐕 Breed selected:', breed.name);

    navigation.navigate('PetsByBreed', {
      breedId: breed._id,
      breedName: breed.name,
      categoryId: categoryId,
      categoryName: categoryName
    });
  };

  // Get breed image based on name
  const getBreedImage = (breedName: string) => {
    const name = breedName.toLowerCase();

    if (name.includes('cat') || name.includes('mèo')) {
      return require('../../assets/images/CatBreedsScreen.png');
    } else if (name.includes('dog') || name.includes('chó')) {
      return require('../../assets/images/DogBreedsScreen.png');
    } else if (name.includes('hamster') || name.includes('chuột')) {
      return require('../../assets/images/HamsterBreedsScreen.png');
    } else if (name.includes('rabbit') || name.includes('thỏ')) {
      return require('../../assets/images/RabbitBreedsScreen.png');
    } else if (name.includes('fish') || name.includes('cá')) {
      return require('../../assets/images/FishBreedsScreen.png');
    }

    return require('../../assets/images/DogBreedsScreen.png');
  };

  // Render breed item
  const renderBreedItem = ({ item }: { item: Breed }) => (
    <TouchableOpacity
      style={styles.breedCard}
      onPress={() => handleBreedPress(item)}
      activeOpacity={0.8}
    >
      <View style={styles.imageContainer}>
        <Image
          source={getBreedImage(item.name)}
          style={styles.breedImage}
          resizeMode="cover"
        />
        <View style={styles.imageOverlay}>
          <FeatherIcon name="arrow-right" size={16} color="#FFFFFF" />
        </View>
      </View>

      <View style={styles.breedInfo}>
        <Text style={styles.breedName} numberOfLines={1}>
          {item.name}
        </Text>

        {item.description && (
          <Text style={styles.breedDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        <View style={styles.breedFooter}>
          <Text style={styles.exploreText}>Khám phá</Text>
          <FeatherIcon name="chevron-right" size={14} color="#3B82F6" />
        </View>
      </View>
    </TouchableOpacity>
  );

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconWrapper}>
        <FeatherIcon name="search" size={48} color="#D1D5DB" />
      </View>
      <Text style={styles.emptyTitle}>Chưa có giống nào</Text>
      <Text style={styles.emptySubtitle}>
        Danh mục {categoryName} chưa có giông thú cưng nào
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
          <Text style={styles.headerTitle}>Giống {categoryName}</Text>
          <Text style={styles.headerSubtitle}>
            Chọn giống yêu thích của bạn
          </Text>
        </View>

        <TouchableOpacity
          style={styles.searchButton}
          activeOpacity={0.7}
        >
          <FeatherIcon name="search" size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Stats Bar */}
      <View style={styles.statsContainer}>
        <View style={styles.statsLeft}>
          <Text style={styles.statsText}>
            {breeds.length} giống có sẵn
          </Text>
          {loading && !refreshing && (
            <View style={styles.loadingDot}>
              <ActivityIndicator size="small" color="#3B82F6" />
            </View>
          )}
        </View>

        <View style={styles.statsRight}>
          <FeatherIcon name="grid" size={16} color="#6B7280" />
          <Text style={styles.viewModeText}>Lưới</Text>
        </View>
      </View>

      {/* Breeds Grid */}
      <FlatList
        data={breeds}
        renderItem={renderBreedItem}
        keyExtractor={item => item._id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#3B82F6']}
            tintColor="#3B82F6"
          />
        }
        ListEmptyComponent={
          !loading ? renderEmptyState : null
        }
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
      />

      {/* Loading Overlay */}
      {loading && breeds.length === 0 && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>
              Đang tải danh sách giống...
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
    backgroundColor: '#F9FAFB'
  },
  header: {
    marginTop:20,
    flexDirection: 'row',
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
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    fontWeight: '500',
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E7EB',
  },
  statsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  loadingDot: {
    marginLeft: 8,
  },
  statsRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewModeText: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 6,
    fontWeight: '500',
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  breedCard: {
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
    height: 120,
    backgroundColor: '#F3F4F6',
  },
  breedImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  breedInfo: {
    padding: 12,
  },
  breedName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 6,
    textAlign: 'center',
  },
  breedDescription: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 12,
    minHeight: 32,
  },
  breedFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exploreText: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '600',
    marginRight: 4,
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
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
});

export default BreedsScreen;