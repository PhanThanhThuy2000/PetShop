import { useRouter } from 'expo-router';
import React from 'react';
import {
    Dimensions,
    FlatList,
    Image,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

const { width } = Dimensions.get('window');

const orderHistory = [
  {
    id: '1',
    orderNumber: '#23982',
    petName: 'Yorkshire Terrier',
    image: require('@/assets/images/imageDog.png'),
    date: 'September 21, 2023',
    price: '1.000.000 đ',
    status: 'Completed',
  },
  {
    id: '2',
    orderNumber: '#23983',
    petName: 'Golden Retriever',
    image: require('@/assets/images/imageDog.png'),
    date: 'September 18, 2023',
    price: '1.000.000 đ',
    status: 'Completed',
  },
  {
    id: '3',
    orderNumber: '#23984',
    petName: 'Persian Cat',
    image: require('@/assets/images/imageDog.png'),
    date: 'September 15, 2023',
    price: '1.000.000 đ',
    status: 'Completed',
  },
  {
    id: '4',
    orderNumber: '#23985',
    petName: 'Siamese Cat',
    image: require('@/assets/images/imageDog.png'),
    date: 'September 10, 2023',
    price: '1.000.000 đ',
    status: 'Completed',
  },
];

const HistoryScreen = () => {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  const handleSearch = () => {
    console.log('Search pressed');
  };

  const handleReview = (itemId: string) => {
    console.log('Review item:', itemId);
    router.push(`/screens/ReviewsScreen?itemId=${itemId}`);
  };
  const renderItem = ({ item }: { item: typeof orderHistory[0] }) => (
    <View style={styles.orderItem}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderNumber}>{item.orderNumber}</Text>
        <Text style={styles.orderDate}>{item.date.split(',')[0]}</Text>
      </View>

      <View style={styles.orderContent}>
        <Image source={item.image} style={styles.petImage} />
        
        <View style={styles.orderInfo}>
          <Text style={styles.petName}>{item.petName}</Text>
          <Text style={styles.price}>{item.price}</Text>
          <Text style={styles.status}>{item.status}</Text>
        </View>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.reviewButton} onPress={() => handleReview(item.id)}>
            <Text style={styles.reviewButtonText}>Review</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Icon name="chevron-left" size={24} color="#000000" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Orders History</Text>
        
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Icon name="search" size={18} color="#000000" />
        </TouchableOpacity>
      </View>
        <FlatList
        data={orderHistory}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 21,
    fontWeight: '600',
    color: '#000000',
    fontFamily: 'Raleway',
  },
  searchButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    paddingTop: 0,
    paddingHorizontal: 16,
  },
  orderItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  orderContent: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  petImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  orderInfo: {
    flex: 1,
  },
  buttonContainer: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#004BFE',
    fontFamily: 'Raleway',
  },
  orderDate: {
    fontSize: 14,
    color: '#8E8E93',
    fontFamily: 'Nunito Sans',
  },
  petName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
    fontFamily: 'Raleway',
  },
  price: {
    fontSize: 14,
    color: '#202020',
    marginBottom: 4,
    fontFamily: 'Nunito Sans',
  },
  status: {
    fontSize: 12,
    color: '#4CD964',
    fontFamily: 'Nunito Sans',
  },
  reviewButton: {
    backgroundColor: '#004BFE',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  reviewButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Raleway',
  },
});

export default HistoryScreen;