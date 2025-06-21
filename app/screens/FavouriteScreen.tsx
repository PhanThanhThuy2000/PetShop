import FavoriteItemList from '@/components/favorite/FavoriteItemList';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import React from 'react';
import {
    Dimensions,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

const { width } = Dimensions.get('window');
const itemWidth = (width - 60) / 2; 

const favoriteItems = [
  {
    id: '1',
    name: 'Yorkshire Terrier',
    price: '1.000.000 đ',
    image: require('@/assets/images/imageDog.png'),
  },
  {
    id: '2',
    name: 'Golden Retriever',
    price: '1.000.000 đ',
    image: require('@/assets/images/imageDog.png'),
  },
  {
    id: '3',
    name: 'Persian Cat',
    price: '1.000.000 đ',
    image: require('@/assets/images/imageDog.png'),
  },
  {
    id: '4',
    name: 'Siamese Cat',
    price: '1.000.000 đ',
    image: require('@/assets/images/imageDog.png'),
  },
  {
    id: '5',
    name: 'British Shorthair',
    price: '$17,00',
    image: require('@/assets/images/imageDog.png'),
  },
  {
    id: '6',
    name: 'Welsh Corgi',
    price: '$17,00',
    image: require('@/assets/images/imageDog.png'),
  },
];

type RootStackParamList = {
  FavouriteScreen: undefined;
  ProductDetail: undefined; // Add params if ProductDetail expects any
};

const FavouriteScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Favorite</Text>
      </View>
      <View style={styles.filterSection}>
        <View style={styles.dateContainer}>
          <View style={styles.dateFilterPill}>
            <Text style={styles.dateFilterText}>April, 18</Text>
          </View>
        </View>
        
        <TouchableOpacity style={styles.optionsButton}>
          <View style={styles.circleButton}>
            <Icon name="chevron-down" size={20} color="#004BFE" />
          </View>
        </TouchableOpacity>
      </View>
        {/* Favorite Items Grid */}
      <FavoriteItemList 
        data={favoriteItems} 
       onPressItem={(item) => navigation.navigate('ProductDetail')}  
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
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 15,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#202020',
    fontFamily: 'Raleway', 
  },
  filterSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  dateContainer: {
    flex: 1,
  },
  dateFilterPill: {
    backgroundColor: '#E5EBFC',
    borderRadius: 18,
    paddingVertical: 6,
    paddingHorizontal: 15,
    alignSelf: 'flex-start',
  },
  dateFilterText: {
    color: '#004BFE',
    fontWeight: '700',
    fontSize: 15,
    fontFamily: 'Raleway',
  },
  optionsButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#004BFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  itemContainer: {
    width: itemWidth,
    margin: 5,
    marginBottom: 15,
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 9,
    elevation: 3, // Android shadow
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    overflow: 'hidden',
  },
  itemImage: {
    width: '100%',
    height: 171,
    borderTopLeftRadius: 9,
    borderTopRightRadius: 9,
    resizeMode: 'cover',
  },
  itemDetails: {
    padding: 10,
  },
  itemDescription: {
    fontSize: 12,
    color: '#000000',
    marginBottom: 5,
    fontFamily: 'Nunito Sans',
  },
  itemPrice: {
    fontSize: 17,
    fontWeight: '700',
    color: '#202020',
    fontFamily: 'Raleway',
  },
});

export default FavouriteScreen;