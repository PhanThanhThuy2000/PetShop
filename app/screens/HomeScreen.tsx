import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

// Import API services
import { petsService, productsService } from '../services/api-services';
import { categoriesService, Category } from '../services/categoriesService';

const HomeScreen = () => {
  const navigation = useNavigation() as any;

  // Local state
  const [pets, setPets] = useState([]);
  const [products, setProducts] = useState([]);
  const [flashSaleProducts, setFlashSaleProducts] = useState([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load data khi component mount
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load categories và pets/products song song
      await Promise.all([
        loadCategories(),
        loadPetsAndProducts()
      ]);

    } catch (error: any) {
      console.error('Error loading initial data:', error);
      setError(error.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      setCategoriesLoading(true);
      const response = await categoriesService.getCategories();
      setCategories(response.data || []);
    } catch (error: any) {
      console.error('Error loading categories:', error);
      // Fallback to default categories nếu API lỗi
      setCategories([
        {
          _id: '1',
          name: 'Cats',
          images: [{ url: 'https://file.hstatic.net/200000108863/file/3_33cbf6a0308e40ca8962af5e0460397c_grande.png' }]
        },
        {
          _id: '2',
          name: 'Dogs',
          images: [{ url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSFUAfyVe3Easiycyh3isP9wDQTYuSmGPsPQvLIJdEYvQ_DsFq5Ez2Nh_QjiS3oZ3B8ZPfK9cZQyIStmQMV1lDPLw' }]
        },
        {
          _id: '3',
          name: 'Rabbits',
          images: [{ url: 'https://cdn.eva.vn/upload/3-2021/images/2021-09-24/image4-1632449319-210-width600height400.jpg' }]
        },
        {
          _id: '4',
          name: 'Hamsters',
          images: [{ url: 'https://encrypted-tbn1.gstatic.com/images?q=tbn:ANd9GcQXXutfOGiZ6MYhA4L47gBE3kR-giotG2iF-j5aMMSIlEJrnOTLCdhovShKPCVofxINNjxIYw0b9KAuIKrYqKAbHA' }]
        },
      ] as Category[]);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const loadPetsAndProducts = async () => {
    try {
      // Load pets và products song song
      const [petsResponse, productsResponse, flashSaleResponse] = await Promise.all([
        petsService.getPets({ page: 1, limit: 6 }),
        productsService.getProducts({ page: 1, limit: 10 }),
        productsService.getProducts({ limit: 4, featured: true })
      ]);

      setPets(petsResponse.data || []); 
      setProducts(productsResponse.data || []); 
      setFlashSaleProducts(flashSaleResponse.data || []);

    } catch (error: any) {
      console.error('Error loading pets and products:', error);
      throw error; // Re-throw để loadInitialData có thể catch
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  };

  // Helper function để lấy hình ảnh đầu tiên
  const getImageUrl = (images: any[] = []) => {
    if (images && images.length > 0) {
      return images.find(img => img.is_primary)?.url || images[0]?.url;
    }
    return 'https://via.placeholder.com/150?text=No+Image';
  };

  // Helper function để format giá
  const formatPrice = (price: number) => {
    return price?.toLocaleString('vi-VN') || '0';
  };

  const renderCategoryItem = ({ item }: { item: Category }) => {
    const imageUrl = getImageUrl(item.images);

    return (
      <TouchableOpacity
        style={styles.categoryItem}
        onPress={() => navigation.navigate('Breeds', {
          categoryId: item._id,
          categoryName: item.name
        })}
      >
        <View style={styles.categoryImageContainer}>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.categoryImage}
              onError={(error) => {
                console.log('Image load error for category:', item.name, error);
              }}
            />
          ) : (
            <Text style={styles.categoryText}>{item.name[0]}</Text>
          )}
        </View>
        <Text style={styles.categoryText}>{item.name}</Text>
      </TouchableOpacity>
    );
  };

  const renderFlashSaleItem = ({ item }: { item: any }) => {
    const imageUrl = getImageUrl(item.images);
    return (
      <TouchableOpacity style={styles.flashSaleItem}>
        <Image
          source={{ uri: imageUrl }}
          style={styles.flashSaleImage}
        />
        <View style={styles.flashSaleDetails}>
          <Text style={styles.flashSalePrice}>{formatPrice(item.price)}</Text>
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `${(item.sold / item.total) * 100}%` }]} />
            <Text style={styles.progressBarText}>Sold {item.sold || 0}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderPetItem = ({ item }: { item: any }) => {
    const imageUrl = getImageUrl(item.images);
    return (
      <TouchableOpacity
        style={styles.petItemContainer}
        onPress={() => navigation.navigate('ProductDetail', { productId: item._id, type: 'pet' })}
      >
        <Image
          source={{ uri: imageUrl }}
          style={styles.petItemImage}
        />
        <View style={styles.petItemDetails}>
          <Text style={styles.petItemName} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={styles.petItemPrice}>{formatPrice(item.price)}</Text>
          <Text style={styles.petItemSold}>
            {item.breed_id?.name || item.type || 'Pet'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Render loading skeleton cho categories
  const renderCategoryLoadingSkeleton = () => (
    <View style={styles.categoryList}>
      {[1, 2, 3, 4].map((item) => (
        <View key={item} style={styles.categoryItem}>
          <View style={[styles.categoryImageContainer, styles.skeletonBackground]}>
            <ActivityIndicator size="small" color="#A0AEC0" />
          </View>
          <View style={[styles.skeletonText, { width: 50, height: 12 }]} />
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={styles.safeArea.backgroundColor} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Home</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Chat')}>
            <Icon name="message-circle" size={26} color="#2D3748" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color="#A0AEC0" style={styles.searchIcon} />
          <TextInput
            placeholder="Search for pets..."
            style={styles.searchInput}
            placeholderTextColor="#A0AEC0"
          />
          <TouchableOpacity>
            <Icon name="camera" size={20} color="#A0AEC0" style={styles.cameraIcon} />
          </TouchableOpacity>
        </View>

        {/* Banner */}
        <View style={styles.bannerContainer}>
          <Image
            source={{ uri: 'https://lh3.googleusercontent.com/proxy/YGBdiGmx0h-riNmW-TPMA_o5BY-9hLAuEmu3CwdtbG7BN8yo2AevyQgu5TM49Bwuo0GM1eNd1XNVOqoIvF1IVHhFHTDzuy-xPBdGZXfQlK2AY2Xrspkrlz0-8nvwkMagvkGE0JFNUx0gK9O0' }}
            style={styles.bannerImage}
          />
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Category</Text>
          </View>
          {categoriesLoading ? (
            renderCategoryLoadingSkeleton()
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

        {/* Flash Sale Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Flash Sale</Text>
            <Text style={styles.timerText}>Ends in 00:15:30</Text>
          </View>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#2563EB" />
            </View>
          ) : flashSaleProducts.length > 0 ? (
            <FlatList
              data={flashSaleProducts}
              renderItem={renderFlashSaleItem}
              keyExtractor={(item) => item._id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.flashSaleList}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No flash sale products</Text>
            </View>
          )}
        </View>

        {/* Popular Pets Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>For You</Text>
            <TouchableOpacity onPress={() => navigation.navigate('PetAll')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#2563EB" />
            </View>
          ) : pets.length > 0 ? (
            <FlatList
              data={pets.slice(0, 6)}
              renderItem={renderPetItem}
              keyExtractor={(item) => item._id}
              numColumns={2}
              scrollEnabled={false}
              columnWrapperStyle={styles.petListRow}
              contentContainerStyle={styles.petsList}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No pets available</Text>
            </View>
          )}
        </View>

        {/* Error handling */}
        {error && (
          <View style={styles.errorContainer}>
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
    </SafeAreaView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA'
  },
  container: {
    paddingBottom: 20
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 10
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D3748'
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 20,
    paddingHorizontal: 15,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  searchIcon: {
    marginRight: 10
  },
  cameraIcon: {
    marginLeft: 10
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#2D3748'
  },
  bannerContainer: {
    marginHorizontal: 20,
    marginTop: 20
  },
  bannerImage: {
    width: '100%',
    height: 150,
    borderRadius: 16
  },
  section: {
    marginTop: 24
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D3748'
  },
  seeAllText: {
    fontSize: 15,
    color: '#2563EB',
    fontWeight: '600'
  },
  timerText: {
    fontSize: 15,
    color: '#D94A4A',
    fontWeight: '600'
  },
  categoryList: {
    paddingHorizontal: 20
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: 20
  },
  categoryImageContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  categoryImage: {
    width: '90%',
    height: '90%',
    borderRadius: 30
  },
  categoryText: {
    fontSize: 14,
    color: '#4A5568',
    fontWeight: '500'
  },
  flashSaleList: {
    paddingHorizontal: 20
  },
  flashSaleItem: {
    width: 140,
    marginRight: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  flashSaleImage: {
    width: '100%',
    height: 140,
  },
  flashSaleDetails: {
    padding: 10,
  },
  flashSalePrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#D94A4A',
    marginBottom: 8,
  },
  progressBarBackground: {
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 9,
    backgroundColor: '#F87171',
    position: 'absolute',
  },
  progressBarText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#991B1B',
    alignSelf: 'center',
  },
  petListRow: {
    justifyContent: 'space-between',
    paddingHorizontal: 20
  },
  petsList: {
    paddingHorizontal: 20,
  },
  petItemContainer: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#4A5568',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2
  },
  petItemImage: {
    width: '100%',
    height: 160,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16
  },
  petItemDetails: {
    padding: 12
  },
  petItemName: {
    fontSize: 15,
    fontWeight: '600',
  color: '#2D3748',
  marginBottom: 8,
  minHeight: 36
},
  petItemPrice: {
  fontSize: 16,
  fontWeight: '700',
  color: '#D94A4A',
  marginBottom: 8
},
  petItemSold: {
  fontSize: 12,
  color: '#718096'
},
  loadingContainer: {
  padding: 20,
  alignItems: 'center',
},
  emptyContainer: {
  padding: 20,
  alignItems: 'center',
},
  emptyText: {
  fontSize: 16,
  color: '#4A5568',
  textAlign: 'center',
},
  errorContainer: {
  padding: 20,
  alignItems: 'center',
  backgroundColor: '#FEE2E2',
  marginHorizontal: 20,
  borderRadius: 10,
  marginBottom: 20,
},
  errorText: {
  fontSize: 14,
  color: '#D94A4A',
  textAlign: 'center',
  marginBottom: 10,
},
  retryButton: {
  backgroundColor: '#D94A4A',
  paddingHorizontal: 20,
  paddingVertical: 8,
  borderRadius: 20,
},
  retryText: {
  color: '#FFFFFF',
  fontSize: 14,
  fontWeight: '500',
},
  skeletonBackground: {
  backgroundColor: '#E2E8F0',
},
  skeletonText: {
  backgroundColor: '#E2E8F0',
  borderRadius: 4,
  marginTop: 4,
},
});