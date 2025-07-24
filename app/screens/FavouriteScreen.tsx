// app/screens/FavouriteScreen.tsx - CẬP NHẬT VỚI REDUX VÀ API THỰC
import { NavigationProp, useNavigation } from '@react-navigation/native';
import React, { useEffect } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    RefreshControl,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchFavourites } from '../redux/slices/favouriteSlice';
import { AppDispatch, RootState } from '../redux/store';
import { FavouriteItem } from '../services/favouriteService';

type RootStackParamList = {
    FavouriteScreen: undefined;
    ProductDetail: { pet?: any; petId?: string; productId?: string };
};

// ✅ COMPONENT CHO TỪNG FAVOURITE ITEM
const FavoriteCard = ({ item }: { item: FavouriteItem }) => {
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();

    // ✅ LẤY THÔNG TIN TỪ PET HOẶC PRODUCT
    const favoriteItem = (item as any).pet_id || (item as any).product_id;

    if (!favoriteItem) {
        console.warn('⚠️ Favourite item missing pet_id or product_id:', item);
        return null;
    }

    // ✅ XỬ LÝ HÌNH ẢNH
    const imageSource = favoriteItem.images && favoriteItem.images.length > 0
        ? { uri: favoriteItem.images[0].url }
        : require('@/assets/images/dog.png');

    // ✅ XỬ LÝ GIÁ
    const price = favoriteItem.price
        ? `${favoriteItem.price.toLocaleString('vi-VN')} đ`
        : 'Liên hệ';

    // ✅ NAVIGATE ĐẾN PRODUCT DETAIL
    const handlePress = () => {
        try {
            if (item.pet_id) {
                // Navigate đến pet detail
                navigation.navigate('ProductDetail', {
                    pet: favoriteItem,
                    petId: favoriteItem._id
                });
            } else if (item.product_id) {
                // Navigate đến product detail
                navigation.navigate('ProductDetail', {
                    productId: favoriteItem._id
                });
            }
        } catch (error) {
            console.error('❌ Navigation error:', error);
        }
    };

    return (
        <TouchableOpacity
            style={styles.cardContainer}
            onPress={handlePress}
            activeOpacity={0.7}
        >
            <Image source={imageSource} style={styles.cardImage} />
            <View style={styles.cardDetails}>
                <Text style={styles.cardName} numberOfLines={2}>
                    {favoriteItem.name || 'Unknown Item'}
                </Text>
                <Text style={styles.cardPrice}>{price}</Text>

                {/* ✅ HIỂN THỊ LOẠI ITEM */}
                <View style={styles.itemTypeContainer}>
                    <Text style={[
                        styles.itemTypeText,
                        { backgroundColor: item.pet_id ? '#E3F2FD' : '#F3E5F5' }
                    ]}>
                        {item.pet_id ? 'Pet' : 'Product'}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );
};

// ✅ MAIN COMPONENT
const FavouriteScreen = () => {
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    const dispatch = useDispatch<AppDispatch>();

    // ✅ REDUX STATE
    const { favourites, loading, error } = useSelector((state: RootState) => state.favourites);

    // ✅ FETCH FAVOURITES KHI COMPONENT MOUNT
    useEffect(() => {
        console.log('🔄 FavouriteScreen mounted, fetching favourites...');
        dispatch(fetchFavourites());
    }, [dispatch]);

    // ✅ REFRESH HANDLER
    const handleRefresh = () => {
        console.log('🔄 Refreshing favourites...');
        dispatch(fetchFavourites());
    };

    // ✅ RENDER FAVORITE ITEM
    const renderFavoriteItem = ({ item }: { item: FavouriteItem }) => {
        return <FavoriteCard item={item} />;
    };

    // ✅ LOADING STATE
    if (loading && favourites.length === 0) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Yêu thích</Text>
                </View>

                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#2563EB" />
                    <Text style={styles.loadingText}>Đang tải danh sách yêu thích...</Text>
                </View>
            </SafeAreaView>
        );
    }

    // ✅ ERROR STATE
    if (error && favourites.length === 0) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Yêu thích</Text>
                </View>

                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>Không thể tải danh sách yêu thích</Text>
                    <Text style={styles.errorSubText}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
                        <Text style={styles.retryText}>Thử lại</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // ✅ MAIN RENDER
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* ✅ HEADER */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Yêu thích</Text>
                <Text style={styles.headerSubtitle}>
                    {favourites.length} sản phẩm
                </Text>
            </View>

            {/* ✅ FAVOURITES LIST */}
            <FlatList
                data={favourites}
                renderItem={renderFavoriteItem}
                keyExtractor={(item) => item._id}
                numColumns={2}
                contentContainerStyle={[
                    styles.listContainer,
                    favourites.length === 0 && styles.emptyListContainer
                ]}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={loading}
                        onRefresh={handleRefresh}
                        colors={['#2563EB']}
                        tintColor="#2563EB"
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyIcon}>💔</Text>
                        <Text style={styles.emptyTitle}>Chưa có sản phẩm yêu thích</Text>
                        <Text style={styles.emptyText}>
                            Hãy thêm những sản phẩm bạn thích vào danh sách để dễ dàng tìm lại sau này
                        </Text>
                        <TouchableOpacity
                            style={styles.browseButton}
                            onPress={() => navigation.navigate('Home' as any)}
                        >
                            <Text style={styles.browseButtonText}>Khám phá ngay</Text>
                        </TouchableOpacity>
                    </View>
                }
            />
        </SafeAreaView>
    );
};

// ✅ STYLES CẬP NHẬT
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
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#202020',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },

    // ✅ LOADING STATES
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },

    // ✅ ERROR STATES
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    errorText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#dc2626',
        textAlign: 'center',
        marginBottom: 8,
    },
    errorSubText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20,
    },
    retryButton: {
        backgroundColor: '#2563EB',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },

    // ✅ LIST STYLES
    listContainer: {
        paddingHorizontal: 12,
        paddingTop: 16,
        paddingBottom: 20,
    },
    emptyListContainer: {
        flexGrow: 1,
    },

    // ✅ CARD STYLES
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
        backgroundColor: '#f0f0f0',
        resizeMode: 'cover',
    },
    cardDetails: {
        padding: 12,
        position: 'relative',
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
        marginBottom: 8,
    },

    // ✅ ITEM TYPE BADGE
    itemTypeContainer: {
        position: 'absolute',
        top: 8,
        right: 8,
    },
    itemTypeText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#666',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        overflow: 'hidden',
    },

    // ✅ EMPTY STATE
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        paddingVertical: 60,
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#374151',
        textAlign: 'center',
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 24,
    },
    browseButton: {
        backgroundColor: '#2563EB',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    browseButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default FavouriteScreen;