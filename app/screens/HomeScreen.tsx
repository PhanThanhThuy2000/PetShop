// HomeScreen.tsx (Đã cập nhật)

import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TextInput,
  Image,
  FlatList,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';

const categories = [
    { id: '1', name: 'Cats', image: 'https://file.hstatic.net/200000108863/file/3_33cbf6a0308e40ca8962af5e0460397c_grande.png' },
    { id: '2', name: 'Dogs', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSFUAfyVe3Easiycyh3isP9wDQTYuSmGPsPQvLIJdEYvQ_DsFq5Ez2Nh_QjiS3oZ3B8ZPfK9cZQyIStmQMV1lDPLw' },
    { id: '3', name: 'Rabbits', image: 'https://cdn.eva.vn/upload/3-2021/images/2021-09-24/image4-1632449319-210-width600height400.jpg' },
    { id: '4', name: 'Hamsters', image: 'https://encrypted-tbn1.gstatic.com/images?q=tbn:ANd9GcQXXutfOGiZ6MYhA4L47gBE3kR-giotG2iF-j5aMMSIlEJrnOTLCdhovShKPCVofxINNjxIYw0b9KAuIKrYqKAbHA' },
];

const flashSaleData = [
  { id: '1', image: 'https://aquariumcare.vn/upload/user/images/th%E1%BB%8F%20c%E1%BA%A3nh%204(2).jpg', price: '850,000', originalPrice: '1,000,000', sold: 15, total: 20 },
  { id: '2', image: 'https://bizweb.dktcdn.net/100/165/948/products/img-5830-jpg.jpg?v=1502808189430', price: '1,200,000', originalPrice: '1,500,000', sold: 8, total: 10 },
  { id: '3', image: 'https://cocapet.net/wp-content/uploads/2018/08/bear-tam-th%E1%BB%83.jpg', price: '500,000', originalPrice: '750,000', sold: 30, total: 50 },
  { id: '4', image: 'https://file.hstatic.net/200000159621/article/cover_8d54a27928c4408593fa2f4f4e60191b_grande.jpg', price: '900,000', originalPrice: '1,100,000', sold: 5, total: 15 },
];
export const pets = [
    { id: '1', name: 'British Longhair Cat', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSSgjs2sCO0xh0Ve1Sf8mDtBt2UhO9GRZImDw&s', price: '1,000,000', sold: 50 },
    { id: '2', name: 'Shiba Inu Dog', image: 'https://thuvienmeme.com/wp-content/uploads/2024/07/cho-husky-luom-hinh-su-meme.jpg', price: '1,000,000', sold: 50 },
    { id: '3', name: 'British Longhair Cat', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQv44j8zRpM29qyJqHyCC55qdoqwtnUSmswRA&s', price: '1,000,000', sold: 50 },
    { id: '4', name: 'Shiba Inu Dog', image: 'https://pethouse.com.vn/wp-content/uploads/2022/12/Ngoai-hinh-husky-768x1024-1-600x800.jpg', price: '1,000,000', sold: 50 },
    { id: '5', name: 'British Longhair Cat', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTajAsFf6UunJlFGmB-Y6W1Gyk3oqPkpnOCOA&s', price: '1,000,000', sold: 50 },
    { id: '6', name: 'Shiba Inu Dog', image: 'https://i.pinimg.com/236x/e7/8a/d6/e78ad67426f1bc002e9f221e9d0605b9.jpg', price: '1,000,000', sold: 50 },
];

const HomeScreen = () => {
  const navigation = useNavigation() as any;

  // Cập nhật hàm renderCategoryItem
  const renderCategoryItem = ({ item }: { item: typeof categories[0] }) => (
    // Thêm onPress để điều hướng
    <TouchableOpacity
      style={styles.categoryItem}
      onPress={() => navigation.navigate('Breeds', { categoryName: item.name })}
    >
      <View style={styles.categoryImageContainer}>
        <Image source={{ uri: item.image }} style={styles.categoryImage} />
      </View>
      <Text style={styles.categoryText}>{item.name}</Text>
    </TouchableOpacity>
  );
  
  const renderFlashSaleItem = ({ item }: { item: typeof flashSaleData[0] }) => (
    <TouchableOpacity style={styles.flashSaleItem}>
      <Image source={{ uri: item.image }} style={styles.flashSaleImage} />
      <View style={styles.flashSaleDetails}>
        <Text style={styles.flashSalePrice}>{item.price}</Text>
        <View style={styles.progressBarBackground}>
          <View style={[styles.progressBarFill, { width: `${(item.sold / item.total) * 100}%` }]} />
          <Text style={styles.progressBarText}>Sold {item.sold}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderPetItem = ({ item }: { item: typeof pets[0] }) => (
    <TouchableOpacity
      style={styles.petItemContainer}
      onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}>
      <Image source={{ uri: item.image }} style={styles.petItemImage} />
      <View style={styles.petItemDetails}>
        <Text style={styles.petItemName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.petItemPrice}>{item.price}</Text>
        <Text style={styles.petItemSold}>Sold {item.sold}+</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={styles.safeArea.backgroundColor} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>

        <View style={styles.header}>
          <Text style={styles.headerTitle}>Home</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Chat')}>
            <Icon name="message-circle" size={26} color="#2D3748" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color="#A0AEC0" style={styles.searchIcon} />
          <TextInput placeholder="Search for pets..." style={styles.searchInput} placeholderTextColor="#A0AEC0" />
          <TouchableOpacity>
            <Icon name="camera" size={20} color="#A0AEC0" style={styles.cameraIcon} />
          </TouchableOpacity>
        </View>

        <View style={styles.bannerContainer}>
          <Image
            source={{ uri: 'https://lh3.googleusercontent.com/proxy/YGBdiGmx0h-riNmW-TPMA_o5BY-9hLAuEmu3CwdtbG7BN8yo2AevyQgu5TM49Bwuo0GM1eNd1XNVOqoIvF1IVHhFHTDzuy-xPBdGZXfQlK2AY2Xrspkrlz0-8nvwkMagvkGE0JFNUx0gK9O0' }}
            style={styles.bannerImage}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Category</Text>
          </View>
          <FlatList
            data={categories}
            renderItem={renderCategoryItem}
            keyExtractor={item => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryList}
          />
        </View>

        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Flash Sale</Text>
                <Text style={styles.timerText}>Ends in 00:15:30</Text>
            </View>
             <FlatList
                data={flashSaleData}
                renderItem={renderFlashSaleItem}
                keyExtractor={item => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.flashSaleList}
            />
        </View>
        
        {/* All Pets */}
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>For You</Text>
                <TouchableOpacity onPress={() => navigation.navigate('PetAll')}>
                    <Text style={styles.seeAllText}>See All</Text>
                </TouchableOpacity>
            </View>
            <FlatList
                data={pets}
                renderItem={renderPetItem}
                keyExtractor={(item) => item.id}
                numColumns={2}
                scrollEnabled={false}
                columnWrapperStyle={styles.petListRow}
            />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// ... Styles không đổi
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8F9FA' },
  container: { paddingBottom: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 30, paddingBottom: 10 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#2D3748' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, marginHorizontal: 20, paddingHorizontal: 15, marginTop: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  searchIcon: { marginRight: 10 },
  cameraIcon: { marginLeft: 10 },
  searchInput: { flex: 1, height: 48, fontSize: 16, color: '#2D3748' },
  bannerContainer: { marginHorizontal: 20, marginTop: 20 },
  bannerImage: { width: '100%', height: 150, borderRadius: 16 },
  section: { marginTop: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#2D3748' },
  seeAllText: { fontSize: 15, color: '#2563EB', fontWeight: '600' },
  timerText: { fontSize: 15, color: '#D94A4A', fontWeight: '600' },
  categoryList: { paddingHorizontal: 20 },
  categoryItem: { alignItems: 'center', marginRight: 20 },
  categoryImageContainer: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', marginBottom: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  categoryImage: { width: '90%', height: '90%', borderRadius: 30 },
  categoryText: { fontSize: 14, color: '#4A5568', fontWeight: '500' },
  flashSaleList: { paddingHorizontal: 20 },
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
  petListRow: { justifyContent: 'space-between', paddingHorizontal: 20 },
  petItemContainer: { width: '48%', backgroundColor: '#FFFFFF', borderRadius: 16, marginBottom: 20, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#4A5568', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 2 },
  petItemImage: { width: '100%', height: 160, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  petItemDetails: { padding: 12 },
  petItemName: { fontSize: 15, fontWeight: '600', color: '#2D3748', marginBottom: 8, minHeight: 36 },
  petItemPrice: { fontSize: 16, fontWeight: '700', color: '#D94A4A', marginBottom: 8 },
  petItemSold: { fontSize: 12, color: '#718096' },
});

export default HomeScreen;