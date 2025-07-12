// app/screens/BreedsScreen.tsx - Hoàn toàn mới với hiển thị giá và navigation
import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import { 
  FlatList, 
  Image, 
  SafeAreaView, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View,
  ActivityIndicator,
  TextInput,
  Alert
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { categoriesService, Breed } from '../services/categoriesService';
import { petsService } from '../services/petsService';

type RouteParams = {
  categoryId: string;
  categoryName: string;
};

const BreedsScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  
  // Lấy params từ navigation
  const { categoryId, categoryName } = route.params as RouteParams;
  
  // State management
  const [breeds, setBreeds] = useState<Breed[]>([]);
  const [filteredBreeds, setFilteredBreeds] = useState<Breed[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [breedPrices, setBreedPrices] = useState<{[key: string]: number}>({});

  // Load breeds khi component mount
  useEffect(() => {
    if (categoryId) {
      loadBreedsByCategory();
    }
  }, [categoryId]);

  // Filter breeds khi search text thay đổi
  useEffect(() => {
    if (searchText.trim() === '') {
      setFilteredBreeds(breeds);
    } else {
      const filtered = breeds.filter(breed =>
        breed.name.toLowerCase().includes(searchText.toLowerCase()) ||
        (breed.description && breed.description.toLowerCase().includes(searchText.toLowerCase()))
      );
      setFilteredBreeds(filtered);
    }
  }, [searchText, breeds]);

  // Load breeds theo category từ API
  const loadBreedsByCategory = async () => {
    try {
      setLoading(true);
      console.log('🔍 Loading breeds for category:', categoryId);
      
      const response = await categoriesService.getBreedsByCategory(categoryId);
      
      if (response.success) {
        console.log('✅ Breeds loaded:', response.data.length);
        setBreeds(response.data);
        setFilteredBreeds(response.data);
        
        // Load giá cho mỗi breed
        loadBreedPrices(response.data);
      } else {
        throw new Error(response.message || 'Không thể tải danh sách breeds');
      }
    } catch (error: any) {
      console.error('❌ Error loading breeds:', error);
      Alert.alert(
        'Lỗi',
        'Không thể tải danh sách giống. Vui lòng thử lại.',
        [
          { text: 'Thử lại', onPress: loadBreedsByCategory },
          { text: 'Hủy' }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  // Load giá thấp nhất cho mỗi breed
  const loadBreedPrices = async (breedList: Breed[]) => {
    const prices: {[key: string]: number} = {};
    
    console.log('💰 Loading prices for breeds...');
    
    for (const breed of breedList) {
      try {
        const petResponse = await petsService.searchPets({
          breed_id: breed._id,
          status: 'available',
          limit: 1,
          page: 1,
          sortBy: 'price',
          sortOrder: 'asc' // Lấy giá thấp nhất
        });
        
        if (petResponse.success && petResponse.data.pets.length > 0) {
          prices[breed._id] = petResponse.data.pets[0].price || 0;
          console.log(`💰 ${breed.name}: ${prices[breed._id].toLocaleString('vi-VN')}đ`);
        } else {
          prices[breed._id] = 0;
        }
      } catch (error) {
        console.warn(`❌ Failed to load price for breed ${breed.name}:`, error);
        prices[breed._id] = 0;
      }
    }
    
    setBreedPrices(prices);
    console.log('✅ All breed prices loaded');
  };

  // Xử lý khi click vào breed - navigate đến màn thú cưng
  const handleBreedPress = (breed: Breed) => {
    console.log('🐕 Breed selected:', breed.name);
    
    // Navigate đến màn thú cưng của breed này
    navigation.navigate('PetsByBreed', {
      breedId: breed._id,
      breedName: breed.name,
      categoryId: categoryId,
      categoryName: categoryName
    });
  };

  // Render breed item
  const renderBreedItem = ({ item }: { item: Breed }) => {
    const minPrice = breedPrices[item._id] || 0;
    
    return (
      <TouchableOpacity
        style={styles.breedCard}
        onPress={() => handleBreedPress(item)}
        activeOpacity={0.7}
      >
        {/* Breed Image */}
        <View style={styles.imageContainer}>
          <Image 
            source={
              // Placeholder images dựa trên tên breed
              item.name.toLowerCase().includes('cat') || item.name.toLowerCase().includes('mèo')
                ? require('../../assets/images/CatBreedsScreen.png')
                : item.name.toLowerCase().includes('dog') || item.name.toLowerCase().includes('chó')
                ? require('../../assets/images/DogBreedsScreen.png')
                : item.name.toLowerCase().includes('hamster') || item.name.toLowerCase().includes('chuột')
                ? require('../../assets/images/HamsterBreedsScreen.png')
                : item.name.toLowerCase().includes('rabbit') || item.name.toLowerCase().includes('thỏ')
                ? require('../../assets/images/RabbitBreedsScreen.png')
                : item.name.toLowerCase().includes('fish') || item.name.toLowerCase().includes('cá')
                ? require('../../assets/images/FishBreedsScreen.png')
                : require('../../assets/images/DogBreedsScreen.png') // Default
            }
            style={styles.breedImage} 
            resizeMode="cover" 
          />
        </View>
        
        {/* Breed Info */}
        <View style={styles.breedInfo}>
          <Text style={styles.breedName} numberOfLines={1}>
            {item.name}
          </Text>
          
          {item.description && (
            <Text style={styles.breedDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}
          
          {/* Hiển thị giá */}

        </View>
      </TouchableOpacity>
    );
  };

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="paw-outline" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>
        {searchText ? 'Không tìm thấy giống nào' : 'Chưa có giống nào'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {searchText 
          ? `Không có kết quả cho "${searchText}"`
          : `Danh mục ${categoryName} chưa có giống nào`
        }
      </Text>
      {searchText && (
        <TouchableOpacity 
          style={styles.clearSearchButton} 
          onPress={() => setSearchText('')}
        >
          <Text style={styles.clearSearchText}>Xóa tìm kiếm</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // Loading state
  if (loading && breeds.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>Giống {categoryName}</Text>
          <View style={{ width: 24 }} />
        </View>
        
        {/* Loading */}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066cc" />
          <Text style={styles.loadingText}>Đang tải danh sách giống...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Breeds {categoryName}</Text>
        <View style={{ width: 24 }} />
      </View>
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={`Tìm kiếm giống ${categoryName}...`}
            value={searchText}
            onChangeText={setSearchText}
            returnKeyType="search"
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Results Summary */}
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryText}>
          {searchText 
            ? `${filteredBreeds.length} kết quả cho "${searchText}"`
            : `${breeds.length} giống trong ${categoryName}`
          }
        </Text>
        
        {loading && breeds.length > 0 && (
          <ActivityIndicator size="small" color="#0066cc" />
        )}
      </View>
      
      {/* Breeds Grid */}
      <View style={styles.contentBox}>
        <FlatList
          data={filteredBreeds}
          renderItem={renderBreedItem}
          keyExtractor={item => item._id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
          refreshing={loading}
          onRefresh={loadBreedsByCategory}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f8f9fa' 
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    marginTop:20
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  searchContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  summaryContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryText: {
    fontSize: 14,
    color: '#666',
  },
  contentBox: {
    flex: 1,
    padding: 10,
  },
  row: {
    justifyContent: 'space-around',
  },
  listContent: {
    paddingBottom: 20,
  },
  breedCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 5,
    padding: 15,
    width: '45%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  breedImage: {
    width: 150,
    height: 90,
    borderRadius: 10,
  },
  breedInfo: {
    alignItems: 'center',
  },
  breedName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 6,
  },
  breedDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 16,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  priceLabel: {
    fontSize: 12,
    color: '#666',
    marginRight: 4,
  },
  priceNumber: {
    fontSize: 16,
    color: '#e74c3c',
    fontWeight: 'bold',
  },
  priceCurrency: {
    fontSize: 12,
    color: '#e74c3c',
    fontWeight: '500',
    marginLeft: 2,
  },
  contactPrice: {
    fontSize: 14,
    color: '#0066cc',
    fontWeight: '600',
    textAlign: 'center',
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
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  clearSearchButton: {
    backgroundColor: '#0066cc',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  clearSearchText: {
    color: '#fff',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
  },
});

export default BreedsScreen;