import { NavigationProp, useNavigation } from '@react-navigation/native';
import React from 'react';
import {
    FlatList,
    Image,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';


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
    { id: '3', name: 'Shiba Inu Dog', image: 'https://pethouse.com.vn/wp-content/uploads/2022/12/Ngoai-hinh-husky-768x1024-1-600x800.jpg', price: '1.000.000', sold: 50 },
    { id: '4', name: 'British Longhair Cat', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTajAsFf6UunJlFGmB-Y6W1Gyk3oqPkpnOCOA&s', price: '1.000.000', sold: 50 },
    { id: '5', name: 'Shiba Inu Dog', image: 'https://i.pinimg.com/236x/e7/8a/d6/e78ad67426f1bc002e9f221e9d0605b9.jpg', price: '1.000.000', sold: 50 },
    { id: '6', name: 'Shiba Inu Dog', image: 'https://pethouse.com.vn/wp-content/uploads/2022/12/Ngoai-hinh-husky-768x1024-1-600x800.jpg', price: '1,000,000', sold: 50 },
    { id: '7', name: 'British Longhair Cat', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTajAsFf6UunJlFGmB-Y6W1Gyk3oqPkpnOCOA&s', price: '1,000,000', sold: 50 },
    { id: '8', name: 'Shiba Inu Dog', image: 'https://i.pinimg.com/236x/e7/8a/d6/e78ad67426f1bc002e9f221e9d0605b9.jpg', price: '1,000,000', sold: 50 }
];

type RootStackParamList = {
    FavouriteScreen: undefined;
    ProductDetail: undefined;
};

type FavoriteItem = {
    id: string;
    name: string;
    price: string;
    image: any;
    sold?: number;
};

const FavoriteCard = ({ item }: { item: FavoriteItem }) => {
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    
    const imageSource = typeof item.image === 'string' 
        ? { uri: item.image } 
        : item.image;          

    return (
        <TouchableOpacity 
            style={styles.cardContainer}
            onPress={() => navigation.navigate('ProductDetail')}
        >
            <Image source={imageSource} style={styles.cardImage} />
            <View style={styles.cardDetails}>
                <Text style={styles.cardName} numberOfLines={2}>{item.name}</Text>
                <Text style={styles.cardPrice}>{item.price}</Text>
            </View>
        </TouchableOpacity>
    );
};


const FavouriteScreen = () => {
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Favorite</Text>
            </View>
            {/* Thay thế Component cũ bằng FlatList */}
            <FlatList
                data={favoriteItems}
                renderItem={({ item }) => <FavoriteCard item={item} />}
                keyExtractor={(item) => item.id}
                numColumns={2}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
            />

        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 48,
        paddingBottom: 15,
        backgroundColor: '#fff',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#202020',
    },
    filterSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee'
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
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalView: {
        margin: 20,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 15,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        width: '90%',
    },
    // Styles cho danh sách và thẻ sản phẩm
    listContainer: {
        paddingHorizontal: 12,
        paddingTop: 16,
    },
    cardContainer: {
        flex: 1,
        margin: 8,
        backgroundColor: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#4A5568',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    cardImage: {
        width: '100%',
        height: 150,
        backgroundColor: '#f0f0f0', // Thêm màu nền cho ảnh trong lúc tải
    },
    cardDetails: {
        padding: 12,
    },
    cardName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#2d3748',
        marginBottom: 6,
        minHeight: 36,
    },
    cardPrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#e53e3e',
    },
});

export default FavouriteScreen;