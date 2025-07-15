// app/screens/BreedsScreen.tsx - Đơn giản chỉ hiển thị breeds và navigate
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
  Alert
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { categoriesService, Breed } from '../services/categoriesService';

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

  // Load breeds khi component mount
  useEffect(() => {
    if (categoryId) {
      loadBreedsByCategory();
    }
  }, [categoryId]);

  // Load breeds theo category từ API
  const loadBreedsByCategory = async () => {
    try {
      setLoading(true);
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
          { text: 'Thử lại', onPress: loadBreedsByCategory },
          { text: 'Hủy' }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  // Xử lý khi click vào breed - navigate đến màn thú cưng được lọc
  const handleBreedPress = (breed: Breed) => {
    console.log('🐕 Breed selected:', breed.name);
    
    // Navigate đến màn thú cưng với filter theo breed
    navigation.navigate('PetsByBreed', {
      breedId: breed._id,
      breedName: breed.name,
      categoryId: categoryId,
      categoryName: categoryName
    });
  };

  // Render breed item
  const renderBreedItem = ({ item }: { item: Breed }) => (
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
      </View>
    </TouchableOpacity>
  );

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="paw-outline" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>Chưa có giống nào</Text>
      <Text style={styles.emptySubtitle}>
        Danh mục {categoryName} chưa có giống nào
      </Text>
    </View>
  );

  // Loading state
  if (loading) {
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
        <Text style={styles.title}>Giống {categoryName}</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Results Summary */}
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryText}>
          {breeds.length} giống trong {categoryName}
        </Text>
      </View>
      
      {/* Breeds Grid */}
      <View style={styles.contentBox}>
        <FlatList
          data={breeds}
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
  summaryContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
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
    width: 90,
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
    lineHeight: 16,
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