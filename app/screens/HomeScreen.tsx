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
          <Image 
            source={{ uri: imageUrl }} 
            style={styles.categoryImage} 
            onError={(error) => {
              console.log('Image load error for category:', item.name, error);
            }}
          />
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
            <View style={[styles.progressBarFill, { width: '70%' }]} />
            <Text style={styles.progressBarText}>Hot Sale</Text>
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
    <View style={styles.categoriesList}>
      {[1, 2, 3, 4].map((item) => (
        <View key={item} style={styles.categoryItem}>
          <View style={[styles.categoryImageContainer, styles.skeletonBackground]}>
            <ActivityIndicator size="small" color="#ccc" />
          </View>
          <View style={[styles.skeletonText, { width: 50, height: 12 }]} />
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#FFE4E1" barStyle="dark-content" />
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.greeting}>Hi, Phước Loc 👋</Text>
            <View style={styles.headerIcons}>
              <TouchableOpacity style={styles.iconButton}>
                <Icon name="bell" size={24} color="#666" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.iconButton}
                onPress={() => navigation.navigate('Cart')}
              >
                <Icon name="shopping-bag" size={24} color="#666" />
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Search Bar */}
          <TouchableOpacity 
            style={styles.searchContainer}
            onPress={() => navigation.navigate('Search')}
          >
            <Icon name="search" size={20} color="#999" />
            <Text style={styles.searchPlaceholder}>Search pets, food, toys...</Text>
          </TouchableOpacity>
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categories</Text>
          {categoriesLoading ? (
            renderCategoryLoadingSkeleton()
          ) : (
            <FlatList
              data={categories}
              renderItem={renderCategoryItem}
              keyExtractor={(item) => item._id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesList}
            />
          )}
        </View>

        {/* Flash Sale Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}> Flash Sale</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#D9534F" />
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
            <Text style={styles.sectionTitle}> Popular Pets</Text>
            <TouchableOpacity onPress={() => navigation.navigate('PetAll')}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#D9534F" />
            </View>
          ) : pets.length > 0 ? (
            <FlatList
              data={pets.slice(0, 6)} // Chỉ hiển thị 6 pets đầu tiên
              renderItem={renderPetItem}
              keyExtractor={(item) => item._id}
              numColumns={2}
              scrollEnabled={false}
              columnWrapperStyle={styles.petRow}
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

// Styles giữ nguyên như cũ + thêm skeleton styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 15,
  },
  iconButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchPlaceholder: {
    marginLeft: 10,
    fontSize: 16,
    color: '#999',
    flex: 1,
  },
  section: {
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  seeAll: {
    fontSize: 14,
    color: '#D9534F',
    fontWeight: '500',
  },
  categoriesList: {
    paddingHorizontal: 20,
    gap: 15,
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: 15,
  },
  categoryImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  categoryText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
  flashSaleList: {
    paddingHorizontal: 20,
    gap: 15,
  },
  flashSaleItem: {
    width: 150,
    backgroundColor: '#fff',
    borderRadius: 15,
    overflow: 'hidden',
    marginRight: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  flashSaleImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  flashSaleDetails: {
    padding: 12,
  },
  flashSalePrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#D9534F',
    marginBottom: 8,
  },
  progressBarBackground: {
    backgroundColor: '#f0f0f0',
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  progressBarFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    backgroundColor: '#D9534F',
    borderRadius: 10,
  },
  progressBarText: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
  petsList: {
    paddingHorizontal: 20,
  },
  petRow: {
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  petItemContainer: {
    flex: 0.48,
    backgroundColor: '#fff',
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  petItemImage: {
    width: '100%',
    height: 140,
    resizeMode: 'cover',
  },
  petItemDetails: {
    padding: 12,
  },
  petItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    minHeight: 32,
  },
  petItemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#D9534F',
    marginBottom: 4,
  },
  petItemSold: {
    fontSize: 12,
    color: '#666',
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
    color: '#666',
    textAlign: 'center',
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#fee',
    marginHorizontal: 20,
    borderRadius: 10,
    marginBottom: 20,
  },
  errorText: {
    fontSize: 14,
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: '#D9534F',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  retryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  // Skeleton loading styles
  skeletonBackground: {
    backgroundColor: '#f0f0f0',
  },
  skeletonText: {
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginTop: 4,
  },
});