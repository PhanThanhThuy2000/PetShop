import { Ionicons } from '@expo/vector-icons';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';

import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    Image,
    RefreshControl,
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
    const [isCancelling, setIsCancelling] = useState(false);

    useEffect(() => {
        // Kiểm tra xem item đã được đánh giá chưa
    }, [item._id]);

    // ✅ STATUS TEXT HELPER - Di chuyển vào OrderItemComponent
    const getStatusText = (status: string) => {
        switch (status) {
            case 'pending':
                return 'đang chờ xử lý';
            case 'processing':
                return 'đang xử lý';
            case 'completed':
                return 'đã hoàn thành';
            case 'cancelled':
                return 'Đã hủy';
            default:
                return status || 'Không xác định';
        }
    };

    // ✅ CHỨC NĂNG HỦY ĐƠN HÀNG - CẢI THIỆN THEO PATTERN CỦA APPOINTMENT
    const handleCancelOrder = (orderItem: OrderItem) => {
        // Kiểm tra xem có thể hủy không
        const canCancel = canCancelOrder(orderItem);

        if (!canCancel.allowed) {
            Alert.alert(
                'Không thể hủy đơn hàng',
                canCancel.message,
                [
                    { text: 'Đóng', style: 'default' },
                    {
                        text: 'Liên hệ hỗ trợ',
                        onPress: () => {
                            Alert.alert(
                                'Liên hệ hỗ trợ',
                                'Vui lòng gọi hotline: 1900 123 456 hoặc email: support@petcare.com để được hỗ trợ hủy đơn hàng.',
                                [{ text: 'Đã hiểu', style: 'default' }]
                            );
                        }
                    }
                ]
            );
            return;
        }

        // Hiển thị confirmation dialog
        Alert.alert(
            'Xác nhận hủy đơn hàng',
            `Bạn có chắc chắn muốn hủy đơn hàng "${getItemDisplayInfo().name}"?\n\n` +
            `Số tiền: ${item.order_id?.total_amount?.toLocaleString('vi-VN')} đ\n\n` +
            (canCancel.isLateCancel ? '⚠️ Lưu ý: Bạn đang hủy đơn trong thời gian gần.' : ''),
            [
                { text: 'Không hủy', style: 'cancel' },
                {
                    text: 'Xác nhận hủy',
                    style: 'destructive',
                    onPress: () => performCancelOrder(orderItem),
                },
            ]
        );
    };

    // Thực hiện hủy đơn hàng
    const performCancelOrder = async (orderItem: OrderItem) => {
        if (!orderItem.order_id?._id) {
            console.error('❌ Order ID is missing for item:', orderItem._id);
            return;
        }

        setIsCancelling(true);

        try {
            console.log('🚫 Attempting to cancel order:', orderItem.order_id._id);
            const response = await ordersService.cancelOrder(orderItem.order_id._id);

            Alert.alert(
                'Thành công',
                'Đã hủy đơn hàng thành công',
                [{ text: 'OK', style: 'default' }]
            );

            // Refresh danh sách
            if (onOrderCancelled) {
                onOrderCancelled();
            }

        } catch (error: any) {
            console.error('Cancel order error:', error);

            let errorMessage = 'Không thể hủy đơn hàng. Vui lòng thử lại.';

            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                if (error.message === 'Network Error') {
                    errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra internet và thử lại.';
                } else {
                    errorMessage = error.message;
                }
            }

            Alert.alert(
                'Lỗi hủy đơn hàng',
                errorMessage,
                [
                    { text: 'Thử lại', onPress: () => performCancelOrder(orderItem) },
                    { text: 'Đóng', style: 'cancel' }
                ]
            );
        } finally {
            setIsCancelling(false);
        }
    };

    // ✅ LOGIC KIỂM TRA CÓ THỂ HỦY ĐƠN HÀNG
    const canCancelOrder = (orderItem: OrderItem) => {
        console.log('Checking canCancel:', {
            id: orderItem._id,
            status: orderItem.order_id?.status,
            createdAt: orderItem.created_at,
        });

        // Chỉ cho phép hủy khi status là 'pending'
        if (orderItem.order_id?.status !== 'pending') {
            let message = '';
            switch (orderItem.order_id?.status) {
                case 'processing':
                    message = 'Đơn hàng đã được xác nhận và không thể hủy trực tiếp. Vui lòng liên hệ cửa hàng để được hỗ trợ.';
                    break;
                case 'shipped':
                    message = 'Đơn hàng đang được vận chuyển và không thể hủy.';
                    break;
                case 'completed':
                    message = 'Đơn hàng đã đã hoàn thành và không thể hủy.';
                    break;
                case 'cancelled':
                    message = 'Đơn hàng đã được hủy trước đó.';
                    break;
                default:
                    message = 'Không thể hủy đơn hàng ở trạng thái hiện tại.';
            }
            console.log('Cannot cancel:', message);
            return { allowed: false, message };
        }

        try {
            // Kiểm tra thời gian đặt hàng (có thể hủy trong vòng 1 giờ)
            const orderTime = new Date(orderItem.created_at);
            const now = new Date();
            const timeDiff = now.getTime() - orderTime.getTime();
            const hoursDiff = timeDiff / (1000 * 60 * 60);

            if (hoursDiff > 24) {
                console.log('Cannot cancel: Order too old');
                return {
                    allowed: false,
                    message: 'Không thể hủy đơn hàng đã đặt quá 24 giờ.'
                };
            }

            // Kiểm tra hủy muộn (trong vòng 1 giờ cuối)
            const isLateCancel = hoursDiff > 23;

            console.log('Can cancel:', { hoursDiff, isLateCancel });
            return {
                allowed: true,
                message: '',
                isLateCancel
            };
        } catch (error) {
            console.error('Error in canCancelOrder:', error);
            return {
                allowed: false,
                message: 'Lỗi xử lý thời gian. Vui lòng thử lại.',
            };
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending':
                return '#F59E0B';
            case 'processing':
                return '#3B82F6';
            case 'shipped':
                return '#8B5CF6';
            case 'completed':
                return '#10B981';
            case 'cancelled':
                return '#EF4444';
            default:
                return '#6B7280';
        }
    };

    // HELPER FUNCTION - XỬ LÝ ẢNH (giữ nguyên)
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
                itemDescription = `Biến thể: ${info.variant.color} - ${info.variant.weight} kg - ${info.variant.gender} - ${info.variant.age} Y`;
                productId = info._id;
            } else if (type === 'pet') {
                itemName = info.name || 'Pet';
                const breedName = typeof info.breed_id === 'object' ? info.breed_id?.name : 'Unknown Breed';
                itemDescription = `${breedName} - ${info.gender || 'Unknown'} - ${info.age || 0} tuổi`;
                productId = info._id;
            } else if (type === 'product') {
                itemName = info.name || 'Product';
                itemDescription = info.description || 'Pet product';
                productId = info._id;
            }

            // XỬ LÝ ẢNH TỪ IMAGES ARRAY
            if (item.images && Array.isArray(item.images) && item.images.length > 0) {
                const primaryImage = item.images.find(img => img.is_primary === true);
                if (primaryImage && primaryImage.url) {
                    itemImage = primaryImage.url;
                } else {
                    const firstImage = item.images[0];
                    if (firstImage && firstImage.url) {
                        itemImage = firstImage.url;
                    }
                }
            }
        }
        // FALLBACK: XỬ LÝ CẤU TRÚC CŨ
        else {
            console.log('🔄 Legacy format detected, processing...');

            if (item.variant_id && typeof item.variant_id === 'object') {
                const variant = item.variant_id;
                if (variant.pet_id && typeof variant.pet_id === 'object') {
                    itemName = variant.pet_id.name || 'Pet Variant';
                    itemDescription = `Biến thể: ${variant.color} - ${variant.weight} kg - ${variant.gender} - ${variant.age} Y`;
                    productId = variant.pet_id._id;

                    if (item.images && Array.isArray(item.images) && item.images.length > 0) {
                        const primaryImg = item.images.find(img => img.is_primary) || item.images[0];
                        itemImage = primaryImg?.url;
                    } else if (variant.pet_id.images && Array.isArray(variant.pet_id.images)) {
                        const primaryImg = variant.pet_id.images.find(img => img.is_primary) || variant.pet_id.images[0];
                        itemImage = primaryImg?.url;
                    }
                }
            } else if (item.pet_id && typeof item.pet_id === 'object') {
                const pet = item.pet_id;
                itemName = pet.name || 'Pet';
                const breedName = typeof pet.breed_id === 'object' ? pet.breed_id?.name : 'Unknown Breed';
                itemDescription = `${breedName} - ${pet.gender || 'Unknown'} - ${pet.age || 0} tuổi`;
                productId = pet._id;

                if (pet.images && Array.isArray(pet.images)) {
                    const primaryImg = pet.images.find(img => img.is_primary) || pet.images[0];
                    itemImage = primaryImg?.url;
                }
            } else if (item.product_id && typeof item.product_id === 'object') {
                const product = item.product_id;
                itemName = product.name || 'Product';
                itemDescription = product.description || 'Pet product';
                productId = product._id;

                if (item.images && Array.isArray(item.images) && item.images.length > 0) {
                    const primaryImg = item.images.find(img => img.is_primary) || item.images[0];
                    itemImage = primaryImg?.url;
                } else if (product.images && Array.isArray(product.images) && product.images.length > 0) {
                    const primaryImg = product.images.find(img => img.is_primary) || product.images[0];
                    itemImage = primaryImg?.url;
                }
            }
        }

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
        navigation.navigate('OrderDetail', { orderId: item.order_id._id });
    };

    const handleReview = () => {
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
    const canCancel = canCancelOrder(item);

    return (
        <TouchableOpacity onPress={handlePress}>
            <View style={styles.orderItem}>
                {/* ✅ IMPROVED HEADER WITH STATUS BADGE */}
                <View style={styles.orderHeader}>
                    <View style={styles.orderIdContainer}>
                        <Text style={styles.orderNumber}>#{item._id.slice(-6)}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.order_id?.status || '') }]}>
                            <Text style={styles.statusBadgeText}>{getStatusText(item.order_id?.status || '')}</Text>
                        </View>
                    </View>
                    <Text style={styles.orderDate}>
                        {new Date(item.created_at).toLocaleDateString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit',
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
                        />
                    ) : (
                        <View style={[styles.petImage, styles.placeholderImage]}>
                            <Ionicons name="image-outline" size={24} color="#ccc" />
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
                            <View style={styles.itemTypeContainer}>
                                <Text style={styles.itemType}>
                                    {item.item_type === 'variant' ? 'Biến thể' : item.item_type === 'pet' ? 'Thú cưng' : 'Sản phẩm'}
                                </Text>
                            </View>
                        )}

                        <View style={styles.priceContainer}>
                            <Ionicons name="pricetag-outline" size={16} color="#6B7280" />
                            <Text style={styles.price}>
                                {item.unit_price.toLocaleString('vi-VN')} đ x {item.quantity}
                            </Text>
                        </View>
                        <View style={styles.totalPriceContainer}>
                            <Text style={styles.totalPrice}>
                                Tổng tiền: {item.order_id?.total_amount?.toLocaleString('vi-VN')} đ
                            </Text>
                        </View>
                    </View>
                </View>

                {/* ✅ IMPROVED FOOTER WITH BETTER ACTION BUTTONS */}
                <View style={styles.orderFooter}>
                    <TouchableOpacity
                        style={styles.detailButton}
                        onPress={handlePress}
                    >
                        <Text style={styles.detailButtonText}>Chi tiết</Text>
                    </TouchableOpacity>

                    <View style={styles.actionButtons}>
                        {!isReviewed && item.order_id?.status === 'completed' && (
                            <TouchableOpacity style={styles.reviewButton} onPress={handleReview}>
                                <Text style={styles.reviewButtonText}>Đánh giá</Text>
                            </TouchableOpacity>
                        )}

                        {item.order_id?.status === 'pending' && (
                            <TouchableOpacity
                                style={[
                                    styles.cancelButton,
                                    isCancelling && styles.cancelButtonDisabled
                                ]}
                                onPress={() => handleCancelOrder(item)}
                                disabled={isCancelling}
                            >
                                {isCancelling ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.cancelButtonText}>Hủy đơn</Text>
                                )}
                            </TouchableOpacity>
                        )}

                        {item.order_id?.status === 'processing' && (
                            <TouchableOpacity
                                style={styles.contactSupportButton}
                                onPress={() => {
                                    Alert.alert(
                                        'Liên hệ để hủy đơn',
                                        'Đơn hàng đã được xác nhận. Vui lòng liên hệ cửa hàng để được hỗ trợ hủy đơn.\n\nHotline: 1900 123 456\nEmail: support@petcare.com',
                                        [{ text: 'OK', style: 'default' }]
                                    );
                                }}
                            >
                                <Text style={styles.contactSupportButtonText}>Liên hệ hủy</Text>
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
    const [refreshing, setRefreshing] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState<string>('all');

    // ✅ IMPROVED SEARCH FUNCTION WITH CLIENT-SIDE FILTERING
    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            fetchOrderItems();
            setIsSearching(false);
            return;
        }

        try {
            setIsLoading(true);
            setIsSearching(true);

            // Tìm kiếm trước, sau đó filter theo status
            const params = {
                keyword: searchQuery,
                page: 1,
                limit: 50
            };

            console.log('🔍 Searching with params:', params);
            const response = await ordersService.searchOrderItems(params);
            let searchResults = response.data || [];

            // Filter theo trạng thái ở client-side
            if (selectedStatus !== 'all') {
                searchResults = searchResults.filter(item => {
                    const orderStatus = item.order_id?.status;
                    return orderStatus === selectedStatus;
                });
            }

            console.log('🎯 Search results after filter:', searchResults.length);
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

    // ✅ STATUS TEXT HELPER - Di chuyển lên trước để có thể sử dụng trong fetchOrderItems
    const getStatusText = (status: string) => {
        switch (status) {
            case 'pending':
                return 'đang chờ xử lý';
            case 'processing':
                return 'đang xử lý';
            case 'completed':
                return 'đã hoàn thành';
            case 'cancelled':
                return 'Đã hủy';
            default:
                return status || 'Không xác định';
        }
    };

    // ✅ IMPROVED FETCH WITH CLIENT-SIDE STATUS FILTER
    const fetchOrderItems = useCallback(async () => {
        try {
            setIsLoading(true);

            // Luôn lấy tất cả đơn hàng từ API
            const params = {
                page: 1,
                limit: 50 // Tăng limit để có đủ dữ liệu filter
            };

            console.log('🔍 Fetching order items with params:', params);
            const response = await ordersService.getMyOrderItems(params);
            const allItems = response.data || [];

            console.log('📦 All items from API:', allItems.length);
            console.log('🎯 Selected status:', selectedStatus);

            // Filter theo trạng thái ở client-side
            let filteredItems = allItems;
            if (selectedStatus !== 'all') {
                filteredItems = allItems.filter(item => {
                    const orderStatus = item.order_id?.status;
                    console.log('🔍 Item status:', orderStatus, 'Filter:', selectedStatus);
                    return orderStatus === selectedStatus;
                });
            }

            console.log('✅ Filtered items:', filteredItems.length);
            setOrderItems(filteredItems);

            if (filteredItems.length === 0) {
                setError(selectedStatus === 'all'
                    ? 'Không có mục đơn hàng nào để hiển thị'
                    : `Không có đơn hàng nào với trạng thái "${getStatusText(selectedStatus)}"`
                );
            } else {
                setError(null);
            }
        } catch (err: any) {
            console.error('❌ API error:', err.response?.data || err.message);
            setError('Không thể tải danh sách mục đơn hàng');
        } finally {
            setIsLoading(false);
        }
    }, [selectedStatus]);

    // ✅ REFRESH CONTROL
    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchOrderItems();
        setRefreshing(false);
    };

    useEffect(() => {
        if (isFocused) {
            fetchOrderItems();
        }
    }, [isFocused, selectedStatus]);

    const toggleSearch = () => {
        if (isSearching && searchQuery) {
            setSearchQuery('');
            fetchOrderItems();
        }
        setIsSearching(!isSearching);
    };

    // ✅ STATUS FILTER COMPONENT
    const renderStatusFilter = () => {
        const statuses = [
            { key: 'all', label: 'Tất cả', color: '#6B7280' },
            { key: 'pending', label: 'đang chờ xử lý', color: '#F59E0B' },
            { key: 'processing', label: 'đang xử lý', color: '#3B82F6' },
            { key: 'completed', label: 'đã hoàn thành', color: '#10B981' },
            { key: 'cancelled', label: 'Đã hủy', color: '#EF4444' },
        ];

        return (
            <View style={styles.filterContainer}>
                <FlatList
                    data={statuses}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(item) => item.key}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[
                                styles.filterItem,
                                selectedStatus === item.key && { backgroundColor: item.color }
                            ]}
                            onPress={() => setSelectedStatus(item.key)}
                        >
                            <Text
                                style={[
                                    styles.filterText,
                                    selectedStatus === item.key && styles.filterTextActive
                                ]}
                            >
                                {item.label}
                            </Text>
                        </TouchableOpacity>
                    )}
                />
            </View>
        );
    };

    // ✅ EMPTY STATE COMPONENT
    const renderEmptyList = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>Chưa có đơn hàng nào</Text>
            <Text style={styles.emptySubtitle}>
                {selectedStatus === 'all'
                    ? 'Bạn chưa có đơn hàng nào. Hãy mua sắm để xem lịch sử đơn hàng.'
                    : `Không có đơn hàng nào với trạng thái "${getStatusText(selectedStatus)}".`
                }
            </Text>
            <TouchableOpacity
                style={styles.shopNowButton}
                onPress={() => navigation.navigate('Shopping')}
            >
                <Text style={styles.shopNowButtonText}>Mua sắm ngay</Text>
            </TouchableOpacity>
        </View>
    );

    if (isLoading && orderItems.length === 0) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3B82F6" />
                    <Text style={styles.loadingText}>Đang tải danh sách đơn hàng...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />

            {/* ✅ IMPROVED HEADER */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#374151" />
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
                    <Ionicons name={isSearching ? 'close' : 'search'} size={20} color="#374151" />
                </TouchableOpacity>
            </View>

            {/* ✅ STATUS FILTER */}
            {renderStatusFilter()}

            {/* ✅ ORDER LIST WITH REFRESH CONTROL */}
            <FlatList
                data={orderItems}
                renderItem={({ item }) => <OrderItemComponent item={item} onOrderCancelled={fetchOrderItems} />}
                keyExtractor={item => item._id}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={['#3B82F6']}
                    />
                }
                contentContainerStyle={[
                    styles.listContainer,
                    orderItems.length === 0 && styles.emptyListContainer
                ]}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={!isLoading ? renderEmptyList : null}
            />

            {/* ✅ ERROR MESSAGE */}
            {error && orderItems.length > 0 && (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={fetchOrderItems}
                    >
                        <Text style={styles.retryButtonText}>Thử lại</Text>
                    </TouchableOpacity>
                </View>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        marginTop: 20,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#374151',
        flex: 1,
        textAlign: 'center',
    },
    searchButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchContainer: {
        flex: 1,
        marginHorizontal: 8,
    },
    searchInput: {
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 16,
    },

    // ✅ FILTER STYLES
    filterContainer: {
        paddingVertical: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    filterItem: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginLeft: 16,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
    },
    filterText: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
    },
    filterTextActive: {
        color: '#FFFFFF',
        fontWeight: '600',
    },

    // ✅ LIST STYLES
    listContainer: {
        padding: 16,
    },
    emptyListContainer: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#6B7280',
    },

    // ✅ IMPROVED ORDER ITEM STYLES
    orderItem: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    orderIdContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    orderNumber: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#374151',
        marginRight: 8,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    orderDate: {
        fontSize: 12,
        color: '#6B7280',
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
        color: '#374151',
        marginBottom: 4,
    },
    petDescription: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 4,
        fontStyle: 'italic',
    },
    itemTypeContainer: {
        marginBottom: 4,
    },
    itemType: {
        fontSize: 11,
        color: '#3B82F6',
        fontWeight: '500',
        backgroundColor: '#EBF4FF',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        alignSelf: 'flex-start',
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    price: {
        fontSize: 14,
        fontWeight: '500',
        color: '#EF4444',
        marginLeft: 6,
    },
    totalPriceContainer: {
        marginTop: 4,
    },
    totalPrice: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#374151',
    },

    // ✅ IMPROVED FOOTER STYLES
    orderFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    detailButton: {
        flex: 1,
        backgroundColor: '#F3F4F6',
        paddingVertical: 10,
        borderRadius: 8,
        marginRight: 8,
        alignItems: 'center',
    },
    detailButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
    },
    actionButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    reviewButton: {
        backgroundColor: '#3B82F6',
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 16,
    },
    reviewButtonText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '600',
    },
    cancelButton: {
        backgroundColor: '#FEE2E2',
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 16,
        minWidth: 80,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#DC2626',
        fontSize: 13,
        fontWeight: '600',
    },
    cancelButtonDisabled: {
        backgroundColor: '#F3F4F6',
        opacity: 0.6,
    },
    contactSupportButton: {
        backgroundColor: '#FEF3C7',
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 16,
    },
    contactSupportButtonText: {
        color: '#D97706',
        fontSize: 13,
        fontWeight: '600',
    },

    // ✅ EMPTY STATE STYLES
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#374151',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 24,
    },
    shopNowButton: {
        backgroundColor: '#3B82F6',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    shopNowButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },

    // ✅ ERROR STYLES
    errorContainer: {
        position: 'absolute',
        bottom: 20,
        left: 16,
        right: 16,
        backgroundColor: '#FEE2E2',
        padding: 16,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    errorText: {
        fontSize: 14,
        color: '#DC2626',
        flex: 1,
    },
    retryButton: {
        backgroundColor: '#DC2626',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        marginLeft: 12,
    },
    retryButtonText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});
export default HistoryScreen;
