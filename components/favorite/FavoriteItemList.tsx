import React from 'react';
import {
    Dimensions,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const { width } = Dimensions.get('window');
const itemWidth = (width - 60) / 2; 

interface FavoriteItem {
  id: string;
  name: string;
  price: string;
  image: any;
}

interface FavoriteItemListProps {
  data: FavoriteItem[];
  onPressItem?: (item: FavoriteItem) => void;
}

const FavoriteItemList: React.FC<FavoriteItemListProps> = ({ data, onPressItem }) => {
  
  const renderItem = ({ item }: { item: FavoriteItem }) => (
    <TouchableOpacity 
      style={styles.itemContainer} 
      onPress={() => onPressItem && onPressItem(item)}
    >
      <View style={styles.itemCard}>
        <Image source={item.image} style={styles.itemImage} />
        <View style={styles.itemDetails}>
          <Text style={styles.itemDescription} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={styles.itemPrice}>{item.price}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={item => item.id}
      numColumns={2}
      contentContainerStyle={styles.gridContainer}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
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
    elevation: 3, 
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

export default FavoriteItemList;
