// OrderDetailScreen.tsx - GIAO DIỆN CẢI THIỆN
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ordersService } from '../services/OrderApiService';
import { Order, OrderItem } from '../types';

interface OrderDetailScreenProps {
    route: { params: { orderId: string } };
}

const OrderDetailScreen: React.FC<OrderDetailScreenProps> = ({ route }) => {
    const { orderId } = route.params;
    const navigation = useNavigation<any>();
    const [order, setOrder] = useState<Order | null>(null);
    const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchOrderDetails = async () => {
            try {
                setIsLoading(true);
                console.log('🔍 Fetching order with ID:', orderId);

                const orderResponse = await ordersService.getOrderById(orderId);
                console.log('📋 Order Response:', JSON.stringify(orderResponse, null, 2));
                setOrder(orderResponse.data);

                console.log('📦 Fetching order items for order ID:', orderId);
                const orderItemsResponse = await ordersService.getOrderItemsByOrderId(orderId);
                console.log('📋 Order Items Response:', JSON.stringify(orderItemsResponse, null, 2));

                setOrderItems(orderItemsResponse.data || []);

                if (!orderItemsResponse.data || orderItemsResponse.data.length === 0) {
                    console.warn('⚠️ Không tìm thấy mục đơn hàng nào cho orderId:', orderId);
                    setError('Không tìm thấy mục đơn hàng nào cho đơn hàng này');
                }
            } catch (err: any) {
                console.error('❌ Lỗi khi lấy chi tiết đơn hàng:', err.response?.data || err.message);
                setError(err.response?.data?.message || 'Không thể tải chi tiết đơn hàng');
            } finally {
                setIsLoading(false);
            }
        };

        fetchOrderDetails();
    }, [orderId]);

    // 🔧 HELPER FUNCTION để lấy thông tin item
    const getItemDisplayInfo = (item: OrderItem) => {
        console.log('🔍 Processing item:', JSON.stringify(item, null, 2));

        let itemName = 'Sản phẩm không xác định';
        let itemImage = 'https://via.placeholder.com/100';
        let itemDescription = '';

        // 🆕 XỬ LÝ THEO CẤU TRÚC MỚI
        if (item.item_info && item.item_type) {
            const info = item.item_info;
            const type = item.item_type;

            console.log('✅ New format detected:', { type, info });

            if (type === 'variant' && info.variant) {
                // Variant item
                itemName = info.name || 'Pet Variant';
                itemDescription = `Biến thể: ${info.variant.color} - ${info.variant.weight}kg - ${info.variant.gender} - ${info.variant.age}Y`;
            } else if (type === 'pet') {
                // Direct pet item
                itemName = info.name || 'Pet';
                const breedName = typeof info.breed_id === 'object' ? info.breed_id?.name : 'Unknown Breed';
                itemDescription = `${breedName} - ${info.gender || 'Unknown'} - ${info.age || 0} tuổi`;
            } else if (type === 'product') {
                // Product item
                itemName = info.name || 'Product';
                itemDescription = info.description || 'Pet product';
            }

            // Lấy hình ảnh từ images array
            if (item.images && item.images.length > 0) {
                const primaryImage = item.images.find(img => img.is_primary) || item.images[0];
                if (primaryImage && primaryImage.url) {
                    itemImage = primaryImage.url;
                }
            }
        }
        // 🔧 FALLBACK: XỬ LÝ CẤU TRÚC CŨ
        else if (item.pet_id || item.product_id || item.variant_id) {
            console.log('🔄 Legacy format detected, processing...');

            if (item.variant_id && typeof item.variant_id === 'object') {
                // Variant item (legacy)
                const variant = item.variant_id;
                if (variant.pet_id && typeof variant.pet_id === 'object') {
                    itemName = variant.pet_id.name || 'Pet Variant';
                    itemDescription = `Biến thể: ${variant.color} - ${variant.weight}kg - ${variant.gender} - ${variant.age}Y`;
                    itemImage = variant.pet_id.images?.find(img => img.is_primary)?.url || itemImage;
                }
            } else if (item.pet_id && typeof item.pet_id === 'object') {
                // Pet item (legacy)
                itemName = item.pet_id.name || 'Pet';
                itemImage = item.pet_id.images?.find(img => img.is_primary)?.url || itemImage;
                const breedName = typeof item.pet_id.breed_id === 'object' ? item.pet_id.breed_id?.name : 'Unknown Breed';
                itemDescription = `${breedName} - ${item.pet_id.gender || 'Unknown'} - ${item.pet_id.age || 0} tuổi`;
            } else if (item.product_id && typeof item.product_id === 'object') {
                // Product item (legacy)
                itemName = item.product_id.name || 'Product';
                itemImage = item.product_id.images?.find(img => img.is_primary)?.url || itemImage;
                itemDescription = item.product_id.description || 'Pet product';
            }
        }

        console.log('✅ Final item info:', { itemName, itemImage, itemDescription });

        return {
            name: itemName,
            image: itemImage,
            description: itemDescription
        };
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Đang tải chi tiết đơn hàng...</Text>
            </View>
        );
    }

    if (error || !order) {
        return (
            <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={64} color="#FF6B6B" />
                <Text style={styles.errorTitle}>Có lỗi xảy ra</Text>
                <Text style={styles.errorText}>{error || `Không tìm thấy đơn hàng (Mã: ${orderId})`}</Text>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Text style={styles.backButtonText}>Quay lại</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const orderDetail = {
        orderId: order._id,
        status:
            order.status === 'completed'
                ? 'Đơn hàng đã hoàn thành'
                : order.status === 'pending'
                    ? 'Đơn hàng đang chờ xử lý'
                    : order.status === 'processing'
                        ? 'Đơn hàng đang xử lý'
                        : 'Đơn hàng đã hủy',
        total: order.total_amount,
        address:
            orderItems[0]?.addresses_id && typeof orderItems[0].addresses_id === 'object'
                ? `${orderItems[0].addresses_id.name}, ${orderItems[0].addresses_id.phone}, ${orderItems[0].addresses_id.ward}, ${orderItems[0].addresses_id.district}, ${orderItems[0].addresses_id.province}`
                : 'Chưa có thông tin địa chỉ',
        deliveryDate: new Date(order.updated_at).toLocaleString('vi-VN'),
        paymentMethod: order.payment_method === 'cod' ? 'Thanh toán khi nhận hàng' : order.payment_method || 'Không xác định',
        vnpayTransactionId: order.vnpay_transaction_id || 'Không có',
        paymentDate: order.payment_date ? new Date(order.payment_date).toLocaleString('vi-VN') : 'Chưa thanh toán',
        userId: order.user_id?._id || 'Không xác định',
        userName: order.user_id?.username || 'Không xác định',
        orderHistory: [
            { label: 'Thời gian đặt hàng', time: new Date(order.created_at).toLocaleString('vi-VN') },
            order.payment_date ? { label: 'Thời gian thanh toán', time: new Date(order.payment_date).toLocaleString('vi-VN') } : null,
        ].filter(item => item !== null),
    };

    const getStatusColor = () => {
        switch (order.status) {
            case 'completed': return '#4CAF50';
            case 'processing': return '#FF9800';
            case 'pending': return '#2196F3';
            default: return '#F44336';
        }
    };

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backIcon}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Chi tiết đơn hàng</Text>
                <View style={styles.headerSpacer} />
            </View>

            {/* Order ID Card */}
            <View style={styles.orderIdCard}>
                <View style={styles.orderIdHeader}>
                    <Text style={styles.orderIdLabel}>Mã đơn hàng</Text>
                    <TouchableOpacity style={styles.copyButton}>
                        <Ionicons name="copy-outline" size={16} color="#007AFF" />
                        <Text style={styles.copyButtonText}>Sao chép</Text>
                    </TouchableOpacity>
                </View>
                <Text style={styles.orderIdValue}>{orderDetail.orderId}</Text>
            </View>

            {/* Status Card */}
            <View style={[styles.statusCard, { backgroundColor: getStatusColor() }]}>
                <Ionicons name="checkmark-circle" size={24} color="#fff" />
                <Text style={styles.statusText}>{orderDetail.status}</Text>
            </View>

            {/* Customer Info */}
            <View style={styles.infoCard}>
                <Text style={styles.cardTitle}>Thông tin khách hàng</Text>
                <View style={styles.infoRow}>
                    <Ionicons name="person-outline" size={20} color="#666" />
                    <Text style={styles.infoText}>{orderDetail.userName}</Text>
                </View>
            </View>

            {/* Delivery Address */}
            <View style={styles.infoCard}>
                <Text style={styles.cardTitle}>Địa chỉ giao hàng</Text>
                <View style={styles.infoRow}>
                    <Ionicons name="location-outline" size={20} color="#666" />
                    <Text style={styles.infoTextMultiline}>{orderDetail.address}</Text>
                </View>
            </View>

            {/* Payment Info */}
            <View style={styles.infoCard}>
                <Text style={styles.cardTitle}>Thông tin thanh toán</Text>
                <View style={styles.infoColumn}>
                    <View style={styles.infoRow}>
                        <Ionicons name="card-outline" size={20} color="#666" />
                        <Text style={styles.infoText}>{orderDetail.paymentMethod}</Text>
                    </View>
                    {orderDetail.paymentMethod !== 'Thanh toán khi nhận hàng' && (
                        <View style={styles.infoRowSecondary}>
                            <Text style={styles.infoLabel}>Mã giao dịch VNPay:</Text>
                            <Text style={styles.infoValue}>{orderDetail.vnpayTransactionId}</Text>
                        </View>
                    )}
                    <View style={styles.infoRowSecondary}>
                        <Text style={styles.infoLabel}>Ngày thanh toán:</Text>
                        <Text style={styles.infoValue}>{new Date(order.created_at).toLocaleDateString('vi-VN')}</Text>
                    </View>
                </View>
            </View>

            {/* Products */}
            <View style={styles.productsCard}>
                <Text style={styles.cardTitle}>Danh sách sản phẩm ({orderItems.length} sản phẩm)</Text>
                {orderItems.length > 0 ? (
                    orderItems.map((item, index) => {
                        const itemInfo = getItemDisplayInfo(item);
                        return (
                            <View key={index} style={styles.productItem}>
                                <Image
                                    source={{ uri: itemInfo.image }}
                                    style={styles.productImage}
                                    defaultSource={{ uri: 'https://via.placeholder.com/100' }}
                                />
                                <View style={styles.productInfo}>
                                    <Text style={styles.productName}>{itemInfo.name}</Text>
                                    {itemInfo.description && (
                                        <Text style={styles.productDescription}>{itemInfo.description}</Text>
                                    )}
                                    <View style={styles.priceRow}>
                                        <Text style={styles.originalPrice}>
                                            đ{(item.unit_price * 1.1).toLocaleString()}
                                        </Text>
                                        <Text style={styles.currentPrice}>
                                            đ{item.unit_price.toLocaleString()}
                                        </Text>
                                    </View>
                                    <Text style={styles.quantity}>Số lượng: {item.quantity}</Text>
                                </View>
                            </View>
                        );
                    })
                ) : (
                    <View style={styles.emptyProducts}>
                        <Ionicons name="cube-outline" size={48} color="#ccc" />
                        <Text style={styles.emptyText}>Không có sản phẩm nào</Text>
                    </View>
                )}
            </View>

            {/* Order Summary */}
            <View style={styles.summaryCard}>
                <Text style={styles.cardTitle}>Tổng cộng đơn hàng</Text>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Thành tiền:</Text>
                    <Text style={styles.summaryAmount}>đ{orderDetail.total.toLocaleString()}</Text>
                </View>
            </View>

            {/* Order History */}
            <View style={styles.historyCard}>
                <Text style={styles.cardTitle}>Lịch sử đơn hàng</Text>
                {orderDetail.orderHistory.map((item, index) => (
                    <View key={index} style={styles.historyItem}>
                        <View style={styles.historyDot} />
                        <View style={styles.historyContent}>
                            <Text style={styles.historyLabel}>{item.label}</Text>
                            <Text style={styles.historyTime}>{item.time}</Text>
                        </View>
                    </View>
                ))}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f7fa',
    },

    // Loading & Error States
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f7fa',
    },
    loadingText: {
        fontSize: 16,
        color: '#666',
        marginTop: 16,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f7fa',
        paddingHorizontal: 32,
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#333',
        marginTop: 16,
        marginBottom: 8,
    },
    errorText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 60,
        paddingBottom: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e8eaed',
    },
    backIcon: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: '#f8f9fa',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    headerSpacer: {
        width: 40,
    },

    // Order ID Card
    orderIdCard: {
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginTop: 16,
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    orderIdHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    orderIdLabel: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    copyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f8ff',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    copyButtonText: {
        fontSize: 12,
        color: '#007AFF',
        fontWeight: '500',
        marginLeft: 4,
    },
    orderIdValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },

    // Status Card
    statusCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 16,
        marginTop: 12,
        padding: 16,
        borderRadius: 12,
    },
    statusText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },

    // Info Cards
    infoCard: {
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginTop: 12,
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoColumn: {
        gap: 12,
    },
    infoText: {
        fontSize: 15,
        color: '#333',
        marginLeft: 12,
        flex: 1,
    },
    infoTextMultiline: {
        fontSize: 15,
        color: '#333',
        marginLeft: 12,
        flex: 1,
        lineHeight: 22,
    },
    infoRowSecondary: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingLeft: 32,
    },
    infoLabel: {
        fontSize: 14,
        color: '#666',
    },
    infoValue: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },

    // Products Card
    productsCard: {
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginTop: 12,
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    productItem: {
        flexDirection: 'row',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    productImage: {
        width: 80,
        height: 80,
        borderRadius: 8,
        backgroundColor: '#f8f9fa',
    },
    productInfo: {
        flex: 1,
        marginLeft: 12,
        justifyContent: 'space-between',
    },
    productName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    productDescription: {
        fontSize: 13,
        color: '#666',
        lineHeight: 18,
        marginBottom: 8,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    originalPrice: {
        fontSize: 13,
        color: '#999',
        textDecorationLine: 'line-through',
    },
    currentPrice: {
        fontSize: 16,
        fontWeight: '600',
        color: '#e53e3e',
    },
    quantity: {
        fontSize: 14,
        color: '#666',
    },
    emptyProducts: {
        alignItems: 'center',
        paddingVertical: 32,
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
        marginTop: 8,
    },

    // Summary Card
    summaryCard: {
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginTop: 12,
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    summaryLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    summaryAmount: {
        fontSize: 18,
        fontWeight: '700',
        color: '#e53e3e',
    },

    // History Card
    historyCard: {
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginTop: 12,
        marginBottom: 32,
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    historyItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 8,
    },
    historyDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#007AFF',
        marginTop: 6,
        marginRight: 12,
    },
    historyContent: {
        flex: 1,
    },
    historyLabel: {
        fontSize: 15,
        fontWeight: '500',
        color: '#333',
        marginBottom: 2,
    },
    historyTime: {
        fontSize: 13,
        color: '#666',
    },

    // Buttons
    backButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    backButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default OrderDetailScreen;