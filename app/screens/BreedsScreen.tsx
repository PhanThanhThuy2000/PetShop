// app/screens/BreedsScreen.tsx - THÊM CHỨC NĂNG TÌM KIẾM TRỰC TIẾP
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
  TextInput,
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

  // State management - GIỮ NGUYÊN CŨ
  const [breeds, setBreeds] = useState<Breed[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // ✅ THÊM MỚI: State cho search
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredBreeds, setFilteredBreeds] = useState<Breed[]>([]);
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Load breeds khi component mount - GIỮ NGUYÊN
  useEffect(() => {
    if (categoryId) {
      loadBreedsByCategory();
    }
  }, [categoryId]);

  // ✅ THÊM MỚI: Filter breeds khi search query thay đổi
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredBreeds(breeds);
      setSearchSuggestions([]);
      setShowSuggestions(false);
    } else {
      // Filter breeds
      const filtered = breeds.filter(breed =>
        breed.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (breed.description && breed.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredBreeds(filtered);

      // Generate suggestions
      if (searchQuery.length >= 1) {
        generateSuggestions(searchQuery);
      }
    }
  }, [searchQuery, breeds]);

  // ✅ THÊM MỚI: Generate search suggestions
  const generateSuggestions = (query: string) => {
    const suggestions = new Set<string>();
    const queryLower = query.toLowerCase();

    breeds.forEach(breed => {
      // Suggest breed names that contain the query
      if (breed.name.toLowerCase().includes(queryLower)) {
        suggestions.add(breed.name);
      }

      // Suggest words from descriptions
      if (breed.description) {
        const words = breed.description.toLowerCase().split(/\s+/);
        words.forEach(word => {
          if (word.length >= 3 && word.includes(queryLower)) {
            suggestions.add(word);
          }
        });
      }
    });

    // Convert to array and limit to 6 suggestions
    const suggestionArray = Array.from(suggestions).slice(0, 6);
    setSearchSuggestions(suggestionArray);
    setShowSuggestions(suggestionArray.length > 0 && filteredBreeds.length === 0);
  };

  // Load breeds theo category từ API - GIỮ NGUYÊN
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
        setFilteredBreeds(response.data); // ✅ THÊM: Cập nhật filteredBreeds
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

  // Handle refresh - GIỮ NGUYÊN
  const handleRefresh = () => {
    loadBreedsByCategory(true);
  };

  // ✅ THÊM MỚI: Handle search functions
  const handleSearchPress = () => {
    setShowSearchInput(!showSearchInput);
    if (showSearchInput) {
      // Đóng search, reset về danh sách gốc
      setSearchQuery('');
      setFilteredBreeds(breeds);
      setSearchSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSearchClear = () => {
    setSearchQuery('');
    setFilteredBreeds(breeds);
    setSearchSuggestions([]);
    setShowSuggestions(false);
  };

  const handleSuggestionPress = (suggestion: string) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
  };

  // Xử lý khi click vào breed - GIỮ NGUYÊN
  const handleBreedPress = (breed: Breed) => {
    console.log('🐕 Breed selected:', breed.name);

    navigation.navigate('PetsByBreed', {
      breedId: breed._id,
      breedName: breed.name,
      categoryId: categoryId,
      categoryName: categoryName
    });
  };

  // Get breed image - GIỮ NGUYÊN HOÀN TOÀN
  const getBreedImage = (breed: Breed) => {
    // 1. Ưu tiên sử dụng ảnh từ API nếu có
    if (breed.images && breed.images.length > 0) {
      // Tìm ảnh primary trước
      const primaryImage = breed.images.find(img => img.is_primary);
      if (primaryImage?.url) {
        return { uri: primaryImage.url };
      }

      // Nếu không có primary, lấy ảnh đầu tiên
      if (breed.images[0]?.url) {
        return { uri: breed.images[0].url };
      }
    }

    // 2. Fallback theo category name nếu có
    if (breed.category_id && typeof breed.category_id === 'object' && breed.category_id.name) {
      const categoryName = breed.category_id.name.toLowerCase();

      if (categoryName.includes('cat') || categoryName.includes('mèo')) {
        return require('../../assets/images/CatBreedsScreen.png');
      } else if (categoryName.includes('dog') || categoryName.includes('chó')) {
        return require('../../assets/images/DogBreedsScreen.png');
      } else if (categoryName.includes('hamster') || categoryName.includes('chuột')) {
        return require('../../assets/images/HamsterBreedsScreen.png');
      } else if (categoryName.includes('rabbit') || categoryName.includes('thỏ')) {
        return require('../../assets/images/RabbitBreedsScreen.png');
      } else if (categoryName.includes('fish') || categoryName.includes('cá')) {
        return require('../../assets/images/FishBreedsScreen.png');
      }
    }

    // 3. Fallback theo breed name
    const breedName = breed.name.toLowerCase();

    if (breedName.includes('cat') || breedName.includes('mèo')) {
      return require('../../assets/images/CatBreedsScreen.png');
    } else if (breedName.includes('dog') || breedName.includes('chó')) {
      return require('../../assets/images/DogBreedsScreen.png');
    } else if (breedName.includes('hamster') || breedName.includes('chuột')) {
      return require('../../assets/images/HamsterBreedsScreen.png');
    } else if (breedName.includes('rabbit') || breedName.includes('thỏ')) {
      return require('../../assets/images/RabbitBreedsScreen.png');
    } else if (breedName.includes('fish') || breedName.includes('cá')) {
      return require('../../assets/images/FishBreedsScreen.png');
    }

    // 4. Default fallback dựa trên categoryName hiện tại
    const currentCategoryName = categoryName.toLowerCase();
    if (currentCategoryName.includes('cat') || currentCategoryName.includes('mèo')) {
      return require('../../assets/images/CatBreedsScreen.png');
    } else if (currentCategoryName.includes('dog') || currentCategoryName.includes('chó')) {
      return require('../../assets/images/DogBreedsScreen.png');
    } else if (currentCategoryName.includes('hamster') || currentCategoryName.includes('chuột')) {
      return require('../../assets/images/HamsterBreedsScreen.png');
    } else if (currentCategoryName.includes('rabbit') || currentCategoryName.includes('thỏ')) {
      return require('../../assets/images/RabbitBreedsScreen.png');
    } else if (currentCategoryName.includes('fish') || currentCategoryName.includes('cá')) {
      return require('../../assets/images/FishBreedsScreen.png');
    }

    // 5. Ultimate fallback
    return require('../../assets/images/DogBreedsScreen.png');
  };

  // Render breed item - GIỮ NGUYÊN
  const renderBreedItem = ({ item }: { item: Breed }) => (
    <TouchableOpacity
      style={styles.breedCard}
      onPress={() => handleBreedPress(item)}
      activeOpacity={0.8}
    >
      <View style={styles.imageContainer}>
        <Image
          source={getBreedImage(item)}
          style={styles.breedImage}
          resizeMode="cover"
          onError={(error) => {
            console.warn('Image load error for breed:', item.name, error);
          }}
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

  // ✅ THÊM MỚI: Render search suggestions
  const renderSearchSuggestions = () => {
    if (!showSuggestions || searchSuggestions.length === 0) {
      return null;
    }

    return (
      <View style={styles.suggestionsContainer}>
        <Text style={styles.suggestionsTitle}>Gợi ý tìm kiếm</Text>
        {searchSuggestions.map((suggestion, index) => (
          <TouchableOpacity
            key={index}
            style={styles.suggestionItem}
            onPress={() => handleSuggestionPress(suggestion)}
            activeOpacity={0.7}
          >
            <FeatherIcon name="search" size={16} color="#9CA3AF" style={styles.suggestionIcon} />
            <Text style={styles.suggestionText}>{suggestion}</Text>
            <FeatherIcon name="arrow-up-left" size={14} color="#D1D5DB" />
          </TouchableOpacity>
        ))}
      </View>
    );
  };
  const renderEmptySearchState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconWrapper}>
        <FeatherIcon name="search" size={48} color="#D1D5DB" />
      </View>
      <Text style={styles.emptyTitle}>Không tìm thấy kết quả</Text>
      <Text style={styles.emptySubtitle}>
        Không tìm thấy giống nào với từ khóa "{searchQuery}"
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={handleSearchClear}
        activeOpacity={0.8}
      >
        <FeatherIcon name="refresh-cw" size={16} color="#FFFFFF" />
        <Text style={styles.emptyButtonText}>Xóa tìm kiếm</Text>
      </TouchableOpacity>
    </View>
  );

  // Render empty state - CHỈNH SỬA NHẸ
  const renderEmptyState = () => {
    // Nếu đang search và không có kết quả
    if (searchQuery.trim() && filteredBreeds.length === 0) {
      return renderEmptySearchState();
    }

    // Empty state gốc
    return (
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
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header - CHỈNH SỬA NHẸ */}
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
            {searchQuery.trim() ? `Tìm kiếm: "${searchQuery}"` : 'Chọn giống yêu thích của bạn'}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.searchButton, showSearchInput && styles.searchButtonActive]}
          onPress={handleSearchPress}
          activeOpacity={0.7}
        >
          <FeatherIcon
            name={showSearchInput ? "x" : "search"}
            size={20}
            color={showSearchInput ? "#3B82F6" : "#6B7280"}
          />
        </TouchableOpacity>
      </View>

      {/* ✅ THÊM MỚI: Search Input */}
      {showSearchInput && (
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <FeatherIcon name="search" size={18} color="#9CA3AF" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder={`Tìm kiếm giống ${categoryName.toLowerCase()}...`}
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus={true}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={handleSearchClear}
                style={styles.clearButton}
                activeOpacity={0.7}
              >
                <FeatherIcon name="x-circle" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* ✅ THÊM MỚI: Search Suggestions */}
      {renderSearchSuggestions()}

      {/* Stats Bar - CHỈNH SỬA NHẸ */}
      <View style={styles.statsContainer}>
        <View style={styles.statsLeft}>
          <Text style={styles.statsText}>
            {filteredBreeds.length} giống có sẵn
            {searchQuery.trim() && filteredBreeds.length !== breeds.length && (
              <Text style={styles.searchResultText}> (từ {breeds.length})</Text>
            )}
          </Text>
          {loading && !refreshing && (
            <View style={styles.loadingDot}>
              <ActivityIndicator size="small" color="#3B82F6" />
            </View>
          )}
        </View>
      </View>

      {/* Breeds Grid - THAY ĐỔI data từ breeds thành filteredBreeds */}
      {!showSuggestions && (
        <FlatList
          data={filteredBreeds}
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
      )}

      {/* Loading Overlay - GIỮ NGUYÊN */}
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
  // ✅ GIỮ NGUYÊN TẤT CẢ STYLES CŨ
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB'
  },
  header: {
    marginTop: 20,
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
  // ✅ THÊM MỚI: Search button active state
  searchButtonActive: {
    backgroundColor: '#EBF8FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  // ✅ THÊM MỚI: Search container styles
  searchContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E7EB',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 42,
    fontSize: 16,
    color: '#1F2937',
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  // ✅ THÊM MỚI: Suggestions styles
  suggestionsContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E7EB',
    maxHeight: 250,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F3F4F6',
  },
  suggestionIcon: {
    marginRight: 12,
  },
  suggestionText: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  // ✅ GIỮ NGUYÊN các styles khác...
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
  // ✅ THÊM MỚI: Search result text style
  searchResultText: {
    color: '#9CA3AF',
    fontSize: 13,
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