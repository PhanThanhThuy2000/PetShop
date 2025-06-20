import React from 'react';
import { FlatList, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import PetList from './PetList';
import { useNavigation } from '@react-navigation/native';   

interface Category {
  id: string;
  name: string;
  image: string;
}

const categories: Category[] = [
  { id: '1', name: 'Hamster', image: 'https://hoseiki.vn/wp-content/uploads/2025/03/meo-cute-12.jpg' },
  { id: '2', name: 'Dog', image: 'https://phongvu.vn/cong-nghe/wp-content/uploads/2024/09/Meme-meo-bua-21.jpg' },
  { id: '3', name: 'Cat', image: 'https://sieupet.com/sites/default/files/pictures/images/1-1473150685951-5.jpg' },
  { id: '4', name: 'Rabbit', image: 'https://hoanghamobile.com/tin-tuc/wp-content/uploads/2024/04/anh-con-cho-28.jpg' },
];

export const pets: Category[] = [
  { id: '1', name: 'Hamster', image: 'https://hoseiki.vn/wp-content/uploads/2025/03/meo-cute-12.jpg' },
  { id: '2', name: 'Dog', image: 'https://phongvu.vn/cong-nghe/wp-content/uploads/2024/09/Meme-meo-bua-21.jpg' },
  { id: '3', name: 'Cat', image: 'https://sieupet.com/sites/default/files/pictures/images/1-1473150685951-5.jpg' },
  { id: '4', name: 'Rabbit', image: 'https://hoanghamobile.com/tin-tuc/wp-content/uploads/2024/04/anh-con-cho-28.jpg' },
  { id: '5', name: 'Cat', image: 'https://sieupet.com/sites/default/files/pictures/images/1-1473150685951-5.jpg' },
  { id: '6', name: 'Rabbit', image: 'https://hoanghamobile.com/tin-tuc/wp-content/uploads/2024/04/anh-con-cho-28.jpg' },
];

const HomeScreen: React.FC = () => {
  const navigation = useNavigation();  

  const renderCategory = ({ item }: { item: Category }) => (
    <TouchableOpacity style={styles.categoryItem}>
      <Image source={{ uri: item.image }} style={styles.categoryImage} />
      <Text style={styles.categoryText}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderItem = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}  

    >
      <Image source={{ uri: item.image }} style={styles.itemImage} />
      <Text style={styles.soldText}>Sold (50 Products)</Text>
      <Text style={styles.itemText}>{item.name}</Text>
      <Text style={styles.priceText}>1,000,000 đ</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Shop</Text>
        <View style={styles.searchContainer}>
          <TextInput style={styles.searchInput} placeholder="Search" />
          <Icon name="camera" style={styles.cameraIcon} />
        </View>
      </View>
      <View style={styles.bannerContainer}>
        <Image source={require('@/assets/images/banner-home.png')} style={styles.bannerImage} />
      </View>
      <View style={styles.categorySection}>
        <Text style={styles.sectionTitle}>All Categories</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          <FlatList
            data={categories}
            renderItem={renderCategory}
            keyExtractor={item => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
          />
        </ScrollView>
      </View>
      <View style={styles.flashSaleSection}>
        <View style={styles.flashSaleHeader}>
          <Text style={styles.sectionTitle}>Flash Sale</Text>
          <Text style={styles.timerText}>00:36:58</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.flashSaleScroll}>
          <View style={styles.flashSaleItem}>
            <Image source={require('@/assets/images/cat.png')} style={styles.flashSaleImage} />
            <Text style={styles.discountText}>-20%</Text>
          </View>
          <View style={styles.flashSaleItem}>
            <Image source={require('@/assets/images/cat.png')} style={styles.flashSaleImage} />
            <Text style={styles.discountText}>-20%</Text>
          </View>
          <View style={styles.flashSaleItem}>
            <Image source={require('@/assets/images/cat.png')} style={styles.flashSaleImage} />
            <Text style={styles.discountText}>-20%</Text>
          </View>
          <View style={styles.flashSaleItem}>
            <Image source={require('@/assets/images/cat.png')} style={styles.flashSaleImage} />
            <Text style={styles.discountText}>-20%</Text>
          </View>
        </ScrollView>
      </View>
      <View style={styles.seeAllContainer}>
        <TouchableOpacity
          style={styles.seeAllButton}
          onPress={() => navigation.navigate('PetAll')}>
          <Text style={styles.seeAllText}>See All </Text>
          <Text style={styles.arrowRight}>
            <Icon name="arrow-right" size={15} color="#fff" />
          </Text>
        </TouchableOpacity>
      </View>
      <PetList
        data={pets}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContainer}
      />
      <View style={styles.itemSection}>
        <Text style={styles.sectionTitle}>Item</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.itemScroll}>
          <FlatList
            data={pets.slice(0, 4)}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
          />
        </ScrollView>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { marginTop: 20,flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerTitle: { fontSize: 24, fontWeight: 'bold' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f1f1', borderRadius: 10, padding: 5, width: '70%' },
  searchInput: { flex: 1, height: 20, fontSize: 16 },
  cameraIcon: { width: 20, height: 20, tintColor: '#1e90ff' },
  bannerContainer: { padding: 10, alignItems: 'center' },
  bannerImage: { width: '100%', height: 120, resizeMode: 'cover', borderRadius: 10 },
  categorySection: { padding: 10 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  categoryScroll: { flexGrow: 0 },
  categoryItem: { alignItems: 'center', marginRight: 20 },
  categoryImage: { width: 50, height: 50, borderRadius: 25 },
  categoryText: { marginTop: 5, fontSize: 14 },
  flashSaleSection: { padding: 10 },
  flashSaleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  timerText: { fontSize: 14, color: '#1E90FF' },
  flashSaleScroll: { flexDirection: 'row', paddingVertical: 10 },
  flashSaleItem: { marginRight: 10 },
  flashSaleImage: { width: 100, height: 100, borderRadius: 10 },
  discountText: { position: 'absolute', top: 5, left: 5, backgroundColor: 'red', color: '#fff', padding: 2, borderRadius: 5, fontSize: 12 },
  seeAllContainer: { padding: 10, alignItems: 'flex-end' },
  seeAllButton: { flexDirection: 'row', alignItems: 'center' },
  seeAllText: { fontSize: 16, color: '#1E90FF' },
  arrowRight: { color: '#fff', fontSize: 16, backgroundColor: '#004CFF', borderRadius: 20, padding: 5 },
  row: { justifyContent: 'space-around', paddingHorizontal: 10 },
  listContainer: { paddingBottom: 10 },
  itemSection: { padding: 10 },
  itemScroll: { flexGrow: 0 },
  itemContainer: { alignItems: 'center', marginRight: 10, width: 150, backgroundColor: '#f9f9f9', borderRadius: 10, padding: 10, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  itemImage: { width: 100, height: 100, borderRadius: 10 },
  itemText: { marginTop: 5, fontSize: 16 },
  soldText: { fontSize: 12, color: '#666', paddingTop: 20 },
  priceText: { fontSize: 14, color: 'red', marginTop: 5 },
});

export default HomeScreen;
