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

// Interface mới để nhóm orders
interface GroupedOrder {
    orderId: string;
    orderInfo: {
        _id: string;
        total_amount: number;
        status: string;
        payment_method: string;
        created_at: string;
    };
    items: OrderItem[];
    addresses_id: any;
}

// Helper function để lấy thông tin hiển thị của item
const getItemDisplayInfo = (item: OrderItem) => {
    let itemName = 'Sản phẩm không xác định';
    let itemImage = null;
    let itemDescription = '';
    let productId = null;
    let itemType = 'product'; // default

    // Xử lý theo cấu trúc mới - item_info, item_type, images
    if (item.item_info && item.item_type) {
        const info = item.item_info;
        const type = item.item_type;
        itemType = type;

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

        // Xử lý ảnh từ images array
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
    // Fallback: xử lý cấu trúc cũ
    else {
        if (item.variant_id && typeof item.variant_id === 'object') {
            const variant = item.variant_id;
            itemType = 'variant';
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
            itemType = 'pet';
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
            itemType = 'product';
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
        productId: productId,
        type: itemType
    };
};

// Function để sắp xếp items: pets trước, products sau
const sortItemsByType = (items: OrderItem[]) => {
    return [...items].sort((a, b) => {
        const aInfo = getItemDisplayInfo(a);
        const bInfo = getItemDisplayInfo(b);

        // Pet và variant có priority cao hơn product
        const aIsPet = aInfo.type === 'pet' || aInfo.type === 'variant';
        const bIsPet = bInfo.type === 'pet' || bInfo.type === 'variant';

        if (aIsPet && !bIsPet) return -1;
        if (!aIsPet && bIsPet) return 1;
        return 0;
    });
};

// Function để nhóm order items theo order_id
const groupOrderItems = (orderItems: OrderItem[]): GroupedOrder[] => {
    const grouped = orderItems.reduce((acc, item) => {
        if (!item.order_id?._id) return acc;

        const orderId = item.order_id._id;

        if (!acc[orderId]) {
            acc[orderId] = {
                orderId,
                orderInfo: item.order_id,
                items: [],
                addresses_id: item.addresses_id
            };
        }

        acc[orderId].items.push(item);
        return acc;
    }, {} as Record<string, GroupedOrder>);

    // Chuyển về array, sắp xếp items và sắp xếp theo thời gian tạo (mới nhất trước)
    return Object.values(grouped).map(group => ({
        ...group,
        items: sortItemsByType(group.items)
    })).sort((a, b) =>
        new Date(b.orderInfo.created_at).getTime() - new Date(a.orderInfo.created_at).getTime()
    );
};

// Component hiển thị grouped order với tính năng expand/collapse
const GroupedOrderComponent = ({ groupedOrder, onOrderCancelled }: {
    groupedOrder: GroupedOrder;
    onOrderCancelled?: () => void
}) => {
    const navigation = useNavigation<any>();
    const [isCancelling, setIsCancelling] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return '#F59E0B';
            case 'processing': return '#3B82F6';
            case 'shipped': return '#8B5CF6';
            case 'completed': return '#10B981';
            case 'cancelled': return '#EF4444';
            default: return '#6B7280';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'pending': return 'Đang chờ xử lý';
            case 'processing': return 'Đang xử lý';
            case 'shipped': return 'Đang giao hàng';
            case 'completed': return 'Đã hoàn thành';
            case 'cancelled': return 'Đã hủy';
            default: return status || 'Không xác định';
        }
    };

    const canCancelOrder = (orderInfo: any) => {
        if (orderInfo.status !== 'pending') {
            let message = '';
            switch (orderInfo.status) {
                case 'processing':
                    message = 'Đơn hàng đã được xác nhận và không thể hủy trực tiếp. Vui lòng liên hệ cửa hàng.';
                    break;
                case 'shipped':
                    message = 'Đơn hàng đang được vận chuyển và không thể hủy.';
                    break;
                case 'completed':
                    message = 'Đơn hàng đã hoàn thành và không thể hủy.';
                    break;
                case 'cancelled':
                    message = 'Đơn hàng đã được hủy trước đó.';
                    break;
                default:
                    message = 'Không thể hủy đơn hàng ở trạng thái hiện tại.';
            }
            return { allowed: false, message };
        }

        try {
            const orderTime = new Date(orderInfo.created_at);
            const now = new Date();
            const hoursDiff = (now.getTime() - orderTime.getTime()) / (1000 * 60 * 60);

            if (hoursDiff > 24) {
                return {
                    allowed: false,
                    message: 'Không thể hủy đơn hàng đã đặt quá 24 giờ.'
                };
            }

            const isLateCancel = hoursDiff > 23;
            return { allowed: true, message: '', isLateCancel };
        } catch (error) {
            return {
                allowed: false,
                message: 'Lỗi xử lý thời gian. Vui lòng thử lại.',
            };
        }
    };

    const handleCancelOrder = () => {
        const canCancel = canCancelOrder(groupedOrder.orderInfo);

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
                                'Vui lòng gọi hotline: 1900 123 456 hoặc email: support@petcare.com',
                                [{ text: 'Đã hiểu', style: 'default' }]
                            );
                        }
                    }
                ]
            );
            return;
        }

        Alert.alert(
            'Xác nhận hủy đơn hàng',
            `Bạn có chắc chắn muốn hủy đơn hàng #${groupedOrder.orderId.slice(-6)}?\n\n` +
            `Số tiền: ${groupedOrder.orderInfo.total_amount?.toLocaleString('vi-VN')} đ\n` +
            `Số sản phẩm: ${groupedOrder.items.length}`,
            [
                { text: 'Không hủy', style: 'cancel' },
                {
                    text: 'Xác nhận hủy',
                    style: 'destructive',
                    onPress: performCancelOrder,
                },
            ]
        );
    };

    const performCancelOrder = async () => {
        setIsCancelling(true);
        try {
            await ordersService.cancelOrder(groupedOrder.orderId);
            Alert.alert('Thành công', 'Đã hủy đơn hàng thành công');
            if (onOrderCancelled) onOrderCancelled();
        } catch (error: any) {
            let errorMessage = 'Không thể hủy đơn hàng. Vui lòng thử lại.';
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            }
            Alert.alert('Lỗi hủy đơn hàng', errorMessage);
        } finally {
            setIsCancelling(false);
        }
    };

    const handlePress = () => {
        navigation.navigate('OrderDetail', { orderId: groupedOrder.orderId });
    };

    // Render từng item trong order
    const renderOrderItem = (item: OrderItem, index: number) => {
        const itemInfo = getItemDisplayInfo(item);

        return (
            <View key={item._id} style={[styles.orderItemDetail, index > 0 && styles.orderItemBorder]}>
                {itemInfo.image && itemInfo.image.startsWith('http') ? (
                    <Image
                        source={{ uri: itemInfo.image }}
                        style={styles.itemImage}
                        defaultSource={{ uri: 'https://via.placeholder.com/60' }}
                    />
                ) : (
                    <View style={[styles.itemImage, styles.placeholderImage]}>
                        <Ionicons name="image-outline" size={20} color="#ccc" />
                    </View>
                )}

                <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{itemInfo.name}</Text>
                    {itemInfo.description && (
                        <Text style={styles.itemDescription} numberOfLines={1}>
                            {itemInfo.description}
                        </Text>
                    )}
                    <View style={styles.itemTypeContainer}>
                        <Text style={[
                            styles.itemType,
                            itemInfo.type === 'pet' || itemInfo.type === 'variant'
                                ? styles.petType
                                : styles.productType
                        ]}>
                            {itemInfo.type === 'variant' ? 'Biến thể' :
                                itemInfo.type === 'pet' ? 'Thú cưng' : 'Sản phẩm'}
                        </Text>
                    </View>
                    <View style={styles.itemPriceContainer}>
                        <Text style={styles.itemPrice}>
                            {item.unit_price.toLocaleString('vi-VN')} đ x {item.quantity}
                        </Text>
                    </View>
                </View>
            </View>
        );
    };

    // Lấy items để hiển thị
    const getDisplayItems = () => {
        if (groupedOrder.items.length <= 1) {
            return groupedOrder.items;
        }

        // Luôn hiển thị pet/variant đầu tiên
        const sortedItems = groupedOrder.items;
        const firstItem = sortedItems[0];
        const firstItemInfo = getItemDisplayInfo(firstItem);

        if (isExpanded) {
            return sortedItems;
        }

        // Nếu item đầu tiên là pet/variant, chỉ hiển thị nó
        if (firstItemInfo.type === 'pet' || firstItemInfo.type === 'variant') {
            return [firstItem];
        }

        // Nếu không có pet, hiển thị item đầu tiên (product)
        return [firstItem];
    };

    const displayItems = getDisplayItems();
    const totalItems = groupedOrder.items.length;
    const hasMoreItems = totalItems > 1 && !isExpanded;

    return (
        <TouchableOpacity onPress={handlePress}>
            <View style={styles.groupedOrderCard}>
                {/* Header */}
                <View style={styles.orderHeader}>
                    <View style={styles.orderIdContainer}>
                        <Text style={styles.orderNumber}>
                            #{groupedOrder.orderId.slice(-6)}
                        </Text>
                        <View style={[
                            styles.statusBadge,
                            { backgroundColor: getStatusColor(groupedOrder.orderInfo.status) }
                        ]}>
                            <Text style={styles.statusBadgeText}>
                                {getStatusText(groupedOrder.orderInfo.status)}
                            </Text>
                        </View>
                    </View>
                    <Text style={styles.orderDate}>
                        {new Date(groupedOrder.orderInfo.created_at).toLocaleDateString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                        })}
                    </Text>
                </View>

                {/* Items List */}
                <View style={styles.itemsList}>
                    {displayItems.map((item, index) => renderOrderItem(item, index))}

                    {/* Expand/Collapse Button */}
                    {totalItems > 1 && (
                        <TouchableOpacity
                            style={styles.expandButton}
                            onPress={(e) => {
                                e.stopPropagation();
                                setIsExpanded(!isExpanded);
                            }}
                        >
                            <Text style={styles.expandButtonText}>
                                {isExpanded
                                    ? 'Thu gọn'
                                    : `Xem thêm ${totalItems - displayItems.length} sản phẩm`
                                }
                            </Text>
                            <Ionicons
                                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                                size={16}
                                color="#3B82F6"
                            />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Footer */}
                <View style={styles.orderFooter}>
                    <View style={styles.orderSummary}>
                        <Text style={styles.itemCount}>
                            {groupedOrder.items.length} sản phẩm
                        </Text>
                        <Text style={styles.totalAmount}>
                            Tổng: {groupedOrder.orderInfo.total_amount.toLocaleString('vi-VN')} đ
                        </Text>
                    </View>

                    <View style={styles.actionButtons}>
                        <TouchableOpacity style={styles.detailButton} onPress={handlePress}>
                            <Text style={styles.detailButtonText}>Chi tiết</Text>
                        </TouchableOpacity>

                        {groupedOrder.orderInfo.status === 'pending' && (
                            <TouchableOpacity
                                style={[styles.cancelButton, isCancelling && styles.cancelButtonDisabled]}
                                onPress={handleCancelOrder}
                                disabled={isCancelling}
                            >
                                {isCancelling ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.cancelButtonText}>Hủy</Text>
                                )}
                            </TouchableOpacity>
                        )}

                        {groupedOrder.orderInfo.status === 'processing' && (
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
    const [groupedOrders, setGroupedOrders] = useState<GroupedOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [isSearching, setIsSearching] = useState<boolean>(false);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState<string>('all');

    const getStatusText = (status: string) => {
        switch (status) {
            case 'pending': return 'Đang chờ xử lý';
            case 'processing': return 'Đang xử lý';
            case 'shipped': return 'Đang giao hàng';
            case 'completed': return 'Đã hoàn thành';
            case 'cancelled': return 'Đã hủy';
            default: return status || 'Không xác định';
        }
    };

    // Function nhóm order items thành grouped orders
    const groupAndFilterOrders = (items: OrderItem[]) => {
        let grouped = groupOrderItems(items);

        // Filter theo status nếu cần
        if (selectedStatus !== 'all') {
            grouped = grouped.filter(group => group.orderInfo.status === selectedStatus);
        }

        return grouped;
    };

    // Fetch order items và nhóm chúng
    const fetchOrderItems = useCallback(async () => {
        try {
            setIsLoading(true);

            const params = { page: 1, limit: 50 };
            console.log('Fetching order items with params:', params);

            const response = await ordersService.getMyOrderItems(params);
            const allItems = response.data || [];

            console.log('All items from API:', allItems.length);
            setOrderItems(allItems);

            // Nhóm và filter orders
            const grouped = groupAndFilterOrders(allItems);
            console.log('Grouped orders:', grouped.length);
            setGroupedOrders(grouped);

            if (grouped.length === 0) {
                setError(selectedStatus === 'all'
                    ? 'Không có đơn hàng nào'
                    : `Không có đơn hàng với trạng thái "${getStatusText(selectedStatus)}"`
                );
            } else {
                setError(null);
            }
        } catch (err: any) {
            console.error('API error:', err);
            setError('Không thể tải danh sách đơn hàng');
        } finally {
            setIsLoading(false);
        }
    }, [selectedStatus]);

    // Search function
    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            fetchOrderItems();
            setIsSearching(false);
            return;
        }

        try {
            setIsLoading(true);
            setIsSearching(true);

            const params = {
                query: searchQuery,
                page: 1,
                limit: 50
            };

            console.log('Searching with params:', params);
            const response = await ordersService.searchOrderItems(params);
            const searchResults = response.data || [];

            console.log('Search results:', searchResults.length);
            setOrderItems(searchResults);

            // Nhóm và filter search results
            const grouped = groupAndFilterOrders(searchResults);
            setGroupedOrders(grouped);

            if (grouped.length === 0) {
                setError('Không tìm thấy đơn hàng nào phù hợp');
            } else {
                setError(null);
            }
        } catch (err: any) {
            console.error('Search error:', err);
            setError('Không thể tìm kiếm đơn hàng: ' + (err.response?.data?.message || err.message));
        } finally {
            setIsLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchOrderItems();
        setRefreshing(false);
    };

    const toggleSearch = () => {
        if (isSearching && searchQuery) {
            setSearchQuery('');
            fetchOrderItems();
        }
        setIsSearching(!isSearching);
    };

    useEffect(() => {
        if (isFocused) {
            fetchOrderItems();
        }
    }, [isFocused, selectedStatus]);

    // Re-group when selectedStatus changes
    useEffect(() => {
        if (orderItems.length > 0) {
            const grouped = groupAndFilterOrders(orderItems);
            setGroupedOrders(grouped);
        }
    }, [selectedStatus, orderItems]);

    // Status filter component
    const renderStatusFilter = () => {
        const statuses = [
            { key: 'all', label: 'Tất cả', color: '#6B7280' },
            { key: 'pending', label: 'Đang chờ xử lý', color: '#F59E0B' },
            { key: 'processing', label: 'Đang xử lý', color: '#3B82F6' },
            { key: 'shipped', label: 'Đang giao hàng', color: '#8B5CF6' },
            { key: 'completed', label: 'Đã hoàn thành', color: '#10B981' },
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

    // Empty state component
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

    if (isLoading && groupedOrders.length === 0) {
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

            {/* Header */}
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

            {/* Status Filter */}
            {renderStatusFilter()}

            {/* Grouped Orders List */}
            <FlatList
                data={groupedOrders}
                renderItem={({ item }) => (
                    <GroupedOrderComponent
                        groupedOrder={item}
                        onOrderCancelled={fetchOrderItems}
                    />
                )}
                keyExtractor={item => item.orderId}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={['#3B82F6']}
                    />
                }
                contentContainerStyle={[
                    styles.listContainer,
                    groupedOrders.length === 0 && styles.emptyListContainer
                ]}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={!isLoading ? renderEmptyList : null}
            />

            {/* Error Message */}
            {error && groupedOrders.length > 0 && (
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

    // Filter styles
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

    // List styles
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

    // Grouped order styles
    groupedOrderCard: {
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
        fontSize: 16,
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

    // Items list styles
    itemsList: {
        paddingHorizontal: 16,
    },
    orderItemDetail: {
        flexDirection: 'row',
        paddingVertical: 12,
    },
    orderItemBorder: {
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        marginTop: 8,
        paddingTop: 12,
    },
    itemImage: {
        width: 60,
        height: 60,
        borderRadius: 8,
        marginRight: 12,
        backgroundColor: '#F3F4F6',
    },
    placeholderImage: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    itemName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 2,
    },
    itemDescription: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 4,
        fontStyle: 'italic',
    },
    itemTypeContainer: {
        marginBottom: 4,
    },
    itemType: {
        fontSize: 10,
        fontWeight: '500',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        alignSelf: 'flex-start',
    },
    petType: {
        color: '#059669',
        backgroundColor: '#D1FAE5',
    },
    productType: {
        color: '#3B82F6',
        backgroundColor: '#EBF4FF',
    },
    itemPriceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    itemPrice: {
        fontSize: 13,
        fontWeight: '500',
        color: '#EF4444',
    },

    // Expand button styles
    expandButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        marginTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    expandButtonText: {
        fontSize: 13,
        color: '#3B82F6',
        fontWeight: '500',
        marginRight: 4,
    },

    // Footer styles
    orderFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    orderSummary: {
        flex: 1,
    },
    itemCount: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 2,
    },
    totalAmount: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#374151',
    },
    actionButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    detailButton: {
        backgroundColor: '#F3F4F6',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    detailButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#374151',
    },
    cancelButton: {
        backgroundColor: '#FEE2E2',
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 16,
        minWidth: 60,
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
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    contactSupportButtonText: {
        color: '#D97706',
        fontSize: 12,
        fontWeight: '600',
    },

    // Empty state styles
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

    // Error styles
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