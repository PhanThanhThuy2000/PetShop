import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';

import {
    Alert,
    Dimensions,
    FlatList,
    Image,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { ordersService } from '../services/OrderApiService';
import { OrderItem } from '../types';
const { width } = Dimensions.get('window');

const OrderItemComponent = ({ item, onOrderCancelled }: { item: OrderItem; onOrderCancelled?: () => void }) => {
    const navigation = useNavigation<any>();
    const [isReviewed, setIsReviewed] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false); // State cho trạng thái hủy đơn

    useEffect(() => {
        // Kiểm tra xem item đã được đánh giá chưa
    }, [item._id]);

    const handleCancelOrder = async () => {
        if (!item.order_id?._id) {
            console.error('❌ Order ID is missing for item:', item._id);
            return;
        }

        // ✅ CONFIRMATION DIALOG
        Alert.alert(
            'Xác nhận hủy đơn hàng',
            `Bạn có chắc chắn muốn hủy đơn hàng`,
            [
                {
                    text: 'Không',
                    style: 'cancel',
                    onPress: () => {
                        console.log('User cancelled the cancel action');
                    }
                },
                {
                    text: 'Có',
                    style: 'destructive',
                    onPress: async () => {
                        await performCancelOrder();
                    }
                }
            ],
            {
                cancelable: true,
                onDismiss: () => {
                    console.log('Dialog dismissed');
                }
            }
        );
    };
    const performCancelOrder = async () => {
        try {
            setIsCancelling(true);
            console.log('🚫 Attempting to cancel order:', item.order_id._id);

            const response = await ordersService.cancelOrder(item.order_id._id);
            console.log('✅ Order cancelled successfully:', response);

            // ✅ SUCCESS NOTIFICATION
            Alert.alert(
                '🎉 Thành công!',
                'Đơn hàng đã được hủy ',
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            // Refresh order list
                            if (onOrderCancelled) {
                                onOrderCancelled();
                            }
                        }
                    }
                ]
            );

        } catch (error: any) {
            console.error('❌ Cancel order error:', error);

            // ✅ DETAILED ERROR HANDLING
            let errorTitle = '❌ Lỗi hủy đơn hàng';
            let errorMessage = 'Không thể hủy đơn hàng. Vui lòng thử lại.';

            if (error.response?.data) {
                if (error.response.data.message) {
                    errorMessage = error.response.data.message;

                    // Customize error message based on status
                    if (error.response.data.message.includes('completed')) {
                        errorTitle = '⚠️ Không thể hủy';
                        errorMessage = 'Đơn hàng đã hoàn thành, không thể hủy.';
                    } else if (error.response.data.message.includes('cancelled')) {
                        errorTitle = '⚠️ Đã hủy';
                        errorMessage = 'Đơn hàng này đã được hủy trước đó.';
                    }
                }
            } else if (error.message) {
                if (error.message === 'Network Error') {
                    errorTitle = '🌐 Lỗi kết nối';
                    errorMessage = 'Không thể kết nối đến server.\nVui lòng kiểm tra internet và thử lại.';
                } else {
                    errorMessage = error.message;
                }
            }

            Alert.alert(
                errorTitle,
                errorMessage,
                [
                    { text: 'Thử lại', onPress: () => handleCancelOrder() },
                    { text: 'Đóng', style: 'cancel' }
                ]
            );
        } finally {
            setIsCancelling(false);
        }
    };

    // ✅ ENHANCED CANCEL BUTTON WITH LOADING STATE
    <TouchableOpacity
        style={[
            styles.cancelButton,
            isCancelling && styles.disabledButton
        ]}
        onPress={handleCancelOrder}
        disabled={isCancelling}
        activeOpacity={0.7}
    >
        <Text style={styles.cancelButtonText}>
            {isCancelling ? '⏳ Đang hủy...' : '🚫 Hủy đơn'}
        </Text>
    </TouchableOpacity>

    // HELPER FUNCTION - XỬ LÝ ẢNH
    const getItemDisplayInfo = () => {
        console.log('🔍 Processing order item:', JSON.stringify(item, null, 2));

        let itemName = 'Sản phẩm không xác định';
        let itemImage = null;
        let itemDescription = '';
        let productId = null;

        // XỬ LÝ THEO CẤU TRÚC MỚI - item_info, item_type, images
        if (item.item_info && item.item_type) {
            const info = item.item_info;
            const type = item.item_type;

            console.log('✅ New format detected:', { type, info });

            if (type === 'variant' && info.variant) {
                itemName = info.name || 'Pet Variant';
                itemDescription = `Biến thể: ${ info.variant.color } - ${ info.variant.weight } kg - ${ info.variant.gender } - ${ info.variant.age } Y`;
                productId = info._id;
            } else if (type === 'pet') {
                itemName = info.name || 'Pet';
                const breedName = typeof info.breed_id === 'object' ? info.breed_id?.name : 'Unknown Breed';
                itemDescription = `${ breedName } - ${ info.gender || 'Unknown' } - ${ info.age || 0 } tuổi`;
                productId = info._id;
            } else if (type === 'product') {
                itemName = info.name || 'Product';
                itemDescription = info.description || 'Pet product';
                productId = info._id;
            }

            // XỬ LÝ ẢNH TỪ IMAGES ARRAY
            console.log('🖼️ Processing images:', {
                hasImages: !!item.images,
                imagesArray: item.images,
                imagesLength: item.images?.length
            });

            if (item.images && Array.isArray(item.images) && item.images.length > 0) {
                const primaryImage = item.images.find(img => img.is_primary === true);
                console.log('🎯 Primary image found:', primaryImage);

                if (primaryImage && primaryImage.url) {
                    itemImage = primaryImage.url;
                    console.log('✅ Using primary image:', itemImage);
                } else {
                    const firstImage = item.images[0];
                    if (firstImage && firstImage.url) {
                        itemImage = firstImage.url;
                        console.log('🔄 Using first image:', itemImage);
                    }
                }
            }
        }
        // FALLBACK: XỬ LÝ CẤU TRÚC CŨ
        else {
            console.log('🔄 Legacy format detected, processing...');

            if (item.variant_id && typeof item.variant_id === 'object') {
                const variant = item.variant_id;
                console.log('🧬 Processing variant:', variant);

                if (variant.pet_id && typeof variant.pet_id === 'object') {
                    itemName = variant.pet_id.name || 'Pet Variant';
                    itemDescription = `Biến thể: ${ variant.color } - ${ variant.weight } kg - ${ variant.gender } - ${ variant.age } Y`;
                    productId = variant.pet_id._id;

                    if (item.images && Array.isArray(item.images) && item.images.length > 0) {
                        const primaryImg = item.images.find(img => img.is_primary) || item.images[0];
                        itemImage = primaryImg?.url;
                        console.log('🖼️ Variant image from item.images:', itemImage);
                    } else if (variant.pet_id.images && Array.isArray(variant.pet_id.images)) {
                        const primaryImg = variant.pet_id.images.find(img => img.is_primary) || variant.pet_id.images[0];
                        itemImage = primaryImg?.url;
                        console.log('🖼️ Variant image from pet_id.images:', itemImage);
                    }
                }
            } else if (item.pet_id && typeof item.pet_id === 'object') {
                const pet = item.pet_id;
                console.log('🐕 Processing pet:', pet);

                itemName = pet.name || 'Pet';
                const breedName = typeof pet.breed_id === 'object' ? pet.breed_id?.name : 'Unknown Breed';
                itemDescription = `${ breedName } - ${ pet.gender || 'Unknown' } - ${ pet.age || 0 } tuổi`;
                productId = pet._id;

                if (pet.images && Array.isArray(pet.images)) {
                    const primaryImg = pet.images.find(img => img.is_primary) || pet.images[0];
                    itemImage = primaryImg?.url;
                    console.log('🖼️ Legacy pet image:', itemImage);
                }
            } else if (item.product_id && typeof item.product_id === 'object') {
                const product = item.product_id;
                console.log('📦 Processing product:', product);

                itemName = product.name || 'Product';
                itemDescription = product.description || 'Pet product';
                productId = product._id;

                if (item.images && Array.isArray(item.images) && item.images.length > 0) {
                    const primaryImg = item.images.find(img => img.is_primary) || item.images[0];
                    itemImage = primaryImg?.url;
                    console.log('🖼️ Product image from item.images:', itemImage);
                } else if (product.images && Array.isArray(product.images) && product.images.length > 0) {
                    const primaryImg = product.images.find(img => img.is_primary) || product.images[0];
                    itemImage = primaryImg?.url;
                    console.log('🖼️ Product image from product.images:', itemImage);
                }
            }
        }

        console.log('✅ Final item info:', {
            itemName,
            itemImage,
            itemDescription,
            productId,
            imageValid: !!itemImage && (itemImage.startsWith('http') || itemImage.startsWith('https'))
        });

        return {
            name: itemName,
            image: itemImage,
            description: itemDescription,
            productId: productId
        };
    };

    const handlePress = () => {
        if (!item.order_id?._id) {
            console.error('❌ Order ID is missing for item:', item._id);
            return;
        }
        console.log('🔍 Navigating to OrderDetail with orderId:', item.order_id._id);
        navigation.navigate('OrderDetail', { orderId: item.order_id._id });
    };

    const handleReview = () => {
        console.log('⭐ Đánh giá mục đơn hàng:', item._id);

        const itemInfo = getItemDisplayInfo();

        const product = {
            id: itemInfo.productId || item._id,
            name: itemInfo.name,
            image: itemInfo.image || 'https://via.placeholder.com/100',
        };

        navigation.navigate('AddReviewScreen', {
            product,
            orderItemId: item._id
        });
    };

    const itemInfo = getItemDisplayInfo();

    return (
        <TouchableOpacity onPress={handlePress}>
            <View style={styles.orderItem}>
                <View style={styles.orderHeader}>
                    <Text style={styles.orderNumber}>#{item._id.slice(-6)}</Text>
                    <Text style={styles.orderDate}>
                        {new Date(item.created_at).toLocaleDateString('vi-VN', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                        })}
                    </Text>
                </View>

                <View style={styles.orderContent}>
                    {itemInfo.image && (itemInfo.image.startsWith('http') || itemInfo.image.startsWith('https')) ? (
                        <Image
                            source={{ uri: itemInfo.image }}
                            style={styles.petImage}
                            defaultSource={{ uri: 'https://via.placeholder.com/100' }}
                            onError={(error) => {
                                console.log('🖼️ Image load error:', error.nativeEvent.error);
                                console.log('🖼️ Failed image URL:', itemInfo.image);
                            }}
                            onLoad={() => {
                                console.log('✅ Image loaded successfully:', itemInfo.image);
                            }}
                        />
                    ) : (
                        <View style={[styles.petImage, styles.placeholderImage]}>
                            <Ionicons name="image-outline" size={24} color="#ccc" />
                            <Text style={styles.debugText}>No Img</Text>
                        </View>
                    )}

                    <View style={styles.orderInfo}>
                        <Text style={styles.petName}>{itemInfo.name}</Text>

                        {itemInfo.description && (
                            <Text style={styles.petDescription} numberOfLines={2}>
                                {itemInfo.description}
                            </Text>
                        )}

                        {item.item_type && (
                            <Text style={styles.itemType}>
                                {item.item_type === 'variant' ? 'Biến thể' : item.item_type === 'pet' ? 'Thú cưng' : 'Sản phẩm'}
                            </Text>
                        )}

                        <Text
                            style={[
                                styles.price,
                                { color: 'red', textDecorationLine: 'line-through' }
                            ]}
                        >
                            {(item.unit_price * item.quantity * 1.1).toLocaleString('vi-VN')} đ
                        </Text>
                        <Text style={styles.price}>
                            Đơn giá: {item.unit_price.toLocaleString('vi-VN')} đ x {item.quantity}
                        </Text>
                        <Text style={[styles.price, styles.totalPrice]}>
                            Tổng tiền: {item.order_id?.total_amount?.toLocaleString('vi-VN')} đ
                        </Text>
                    </View>
                </View>

                <View style={styles.orderFooter}>
                    <Text style={[
                        styles.status,
                        item.order_id.status === 'completed' ? styles.statusCompleted :
                        item.order_id.status === 'pending' ? styles.statusPending :
                        styles.statusCancelled
                    ]}>
                        {item.order_id.status
                            ? item.order_id.status.charAt(0).toUpperCase() + item.order_id.status.slice(1)
                            : 'Không xác định'}
                    </Text>
                    <View style={styles.buttonContainer}>
                        {!isReviewed && item.order_id.status === 'completed' && (
                            <TouchableOpacity style={styles.reviewButton} onPress={handleReview}>
                                <Text style={styles.reviewButtonText}>Đánh giá</Text>
                            </TouchableOpacity>
                        )}
                        {item.order_id.status === 'pending' && (
                            <TouchableOpacity
                                style={[styles.cancelButton, isCancelling && styles.disabledButton]}
                                onPress={handleCancelOrder}
                                disabled={isCancelling}
                            >
                                <Text style={styles.cancelButtonText}>
                                    {isCancelling ? 'Đang hủy...' : 'Hủy đơn'}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const HistoryScreen = () => {
    const navigation = useNavigation<any>();
    const isFocused = useIsFocused();
    const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [isSearching, setIsSearching] = useState<boolean>(false);

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            fetchOrderItems();
            setIsSearching(false);
            return;
        }

        try {
            setIsLoading(true);
            setIsSearching(true);
            console.log('🔍 Searching with keyword:', searchQuery);

            const params = {
                keyword: searchQuery,
                page: 1,
                limit: 20
            };

            console.log('📡 Search params:', params);
            const response = await ordersService.searchOrderItems(params);
            console.log('📋 Search response:', JSON.stringify(response, null, 2));

            const searchResults = response.data || [];
            setOrderItems(searchResults);

            if (searchResults.length === 0) {
                setError('Không tìm thấy mục đơn hàng nào phù hợp');
            } else {
                setError(null);
            }
        } catch (err: any) {
            console.error('❌ Search error:', err.response?.data || err.message);
            setError('Không thể tìm kiếm mục đơn hàng');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchOrderItems = async () => {
        try {
            setIsLoading(true);
            console.log('📦 Fetching order items...');

            const token = await AsyncStorage.getItem('token');
            console.log('🔐 Token exists:', !!token);

            const params = { page: 1, limit: 20 };
            console.log('📡 API params:', params);

            const response = await ordersService.getMyOrderItems(params);
            console.log('📋 API response (full):', JSON.stringify(response, null, 2));

            if (response.data && response.data.length > 0) {
                console.log('🔍 First item structure:', JSON.stringify(response.data[0], null, 2));

                response.data.forEach((orderItem, index) => {
                    console.log(`📋 Item ${ index }: `, {
                        id: orderItem._id,
                        hasImages: !!orderItem.images,
                        imagesCount: orderItem.images?.length || 0,
                        hasItemInfo: !!orderItem.item_info,
                        itemType: orderItem.item_type,
                        hasPetId: !!orderItem.pet_id,
                        hasProductId: !!orderItem.product_id,
                    });
                });
            }

            const items = response.data || [];
            setOrderItems(items);

            if (items.length === 0) {
                console.warn('⚠️ No order items found');
                setError('Không có mục đơn hàng nào để hiển thị');
            } else {
                setError(null);
                console.log(`✅ Loaded ${ items.length } order items`);
            }
        } catch (err: any) {
            console.error('❌ API error:', err.response?.data || err.message);
            setError('Không thể tải danh sách mục đơn hàng');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isFocused) {
            console.log('🔄 Screen focused, refreshing order items...');
            fetchOrderItems();
        }
    }, [isFocused]);

    useEffect(() => {
        fetchOrderItems();
    }, []);

    const toggleSearch = () => {
        if (isSearching && searchQuery) {
            setSearchQuery('');
            fetchOrderItems();
        }
        setIsSearching(!isSearching);
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Đang tải danh sách mục đơn hàng...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (error && orderItems.length === 0) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={fetchOrderItems}>
                        <Text style={styles.retryButtonText}>Thử lại</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#000000" />
                </TouchableOpacity>

                {isSearching ? (
                    <View style={styles.searchContainer}>
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Tìm kiếm theo tên hoặc mã đơn hàng"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            onSubmitEditing={handleSearch}
                            autoFocus
                        />
                    </View>
                ) : (
                    <Text style={styles.headerTitle}>Lịch sử đơn hàng</Text>
                )}

                <TouchableOpacity style={styles.searchButton} onPress={toggleSearch}>
                    <Ionicons name={isSearching ? 'close' : 'search'} size={20} color="#000000" />
                </TouchableOpacity>
            </View>

            {error && orderItems.length === 0 && (
                <View style={styles.errorBanner}>
                    <Text style={styles.errorBannerText}>{error}</Text>
                </View>
            )}

            <FlatList
                data={orderItems}
                renderItem={({ item }) => <OrderItemComponent item={item} onOrderCancelled={fetchOrderItems} />}
                keyExtractor={item => item._id}
                contentContainerStyle={[
                    styles.listContainer,
                    orderItems.length === 0 && styles.emptyListContainer
                ]}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    !isLoading && !error ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="receipt-outline" size={64} color="#ccc" />
                            <Text style={styles.emptyText}>Chưa có đơn hàng nào</Text>
                            <Text style={styles.emptySubtext}>Hãy mua sắm để xem lịch sử đơn hàng</Text>
                        </View>
                    ) : null
                }
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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#EFEFEF',
        paddingTop: 30
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#000000',
    },
    searchButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchContainer: {
        flex: 1,
        marginHorizontal: 8,
    },
    searchInput: {
        backgroundColor: '#F5F5F5',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 16,
    },
    errorBanner: {
        backgroundColor: '#FEE2E2',
        padding: 12,
        marginHorizontal: 16,
        marginTop: 8,
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#EF4444',
    },
    errorBannerText: {
        color: '#DC2626',
        fontSize: 14,
        textAlign: 'center',
    },
    listContainer: {
        paddingVertical: 16,
        paddingHorizontal: 16,
    },
    emptyListContainer: {
        flex: 1,
    },
    orderItem: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 5,
        elevation: 2,
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
    orderNumber: {
        fontSize: 15,
        fontWeight: '700',
        color: '#2d3748',
    },
    orderDate: {
        fontSize: 13,
        color: '#718096',
    },
    orderContent: {
        flexDirection: 'row',
        padding: 16,
    },
    petImage: {
        width: 70,
        height: 70,
        borderRadius: 8,
        marginRight: 16,
        backgroundColor: '#f0f0f0',
    },
    placeholderImage: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f0f0'
    },
    orderInfo: {
        flex: 1,
        justifyContent: 'center'
    },
    petName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2d3748',
        marginBottom: 4,
    },
    petDescription: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
        fontStyle: 'italic',
    },
    itemType: {
        fontSize: 11,
        color: '#007AFF',
        fontWeight: '500',
        marginBottom: 4,
        backgroundColor: '#EBF4FF',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        alignSelf: 'flex-start',
    },
    price: {
        fontSize: 14,
        fontWeight: '500',
        color: '#e53e3e',
        marginBottom: 2,
    },
    totalPrice: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#2d3748',
    },
    orderFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    status: {
        fontSize: 14,
        fontWeight: '600',
    },
    statusCompleted: {
        color: '#38A169',
    },
    statusPending: {
        color: '#DD6B20',
    },
    statusCancelled: {
        color: '#EF4444', // Màu đỏ cho trạng thái cancelled
    },
    buttonContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8, // Khoảng cách giữa các nút
    },
    reviewButton: {
        backgroundColor: '#3182CE',
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 20,
    },
    reviewButtonText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '600',
    },
    cancelButton: {
        backgroundColor: '#EF4444', // Màu đỏ cho nút hủy
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 20,
    },
    cancelButtonText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '600',
    },
    disabledButton: {
        backgroundColor: '#FCA5A5', // Màu nhạt hơn khi disabled
        opacity: 0.7,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 16,
        color: '#2d3748',
        textAlign: 'center',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    errorText: {
        fontSize: 16,
        color: '#e53e3e',
        textAlign: 'center',
        marginBottom: 16,
    },
    retryButton: {
        backgroundColor: '#3182CE',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 80,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#718096',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#A0AEC0',
        textAlign: 'center',
    },
    debugText: {
        fontSize: 8,
        color: '#999',
        marginTop: 2,
    },
    
});

export default HistoryScreen;