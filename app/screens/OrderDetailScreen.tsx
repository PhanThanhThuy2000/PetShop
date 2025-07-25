// OrderDetailScreen.tsx - CẬP NHẬT HỖ TRỢ VARIANT DATA
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
            <View style={styles.container}>
                <Text style={styles.errorText}>Đang tải chi tiết đơn hàng...</Text>
            </View>
        );
    }

    if (error || !order) {
        return (
            <View style={styles.container}>
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
                ? `${orderItems[0].addresses_id.name}, ${orderItems[0].addresses_id.phone}, ${orderItems[0].addresses_id.note ? orderItems[0].addresses_id.note + ', ' : ''}${orderItems[0].addresses_id.ward}, ${orderItems[0].addresses_id.district}, ${orderItems[0].addresses_id.province}, ${orderItems[0].addresses_id.country}`
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

    return (
        <ScrollView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Chi tiết đơn hàng</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Status Banner */}
            <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Trạng thái đơn hàng</Text>
                <View style={styles.statusBanner}>
                    <Text style={styles.statusText}>{orderDetail.status}</Text>
                </View>
            </View>

            {/* User Info */}
            <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Thông tin khách hàng</Text>
                <View style={styles.infoBox}>
                    <Ionicons name="person" size={16} color="#000" />
                    <View style={styles.infoTextContainer}>
                        <Text style={styles.infoText}>Khách hàng: {orderDetail.userName}</Text>
                    </View>
                </View>
            </View>

            {/* Address */}
            <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Địa chỉ giao hàng</Text>
                <View style={styles.infoBox}>
                    <Ionicons name="location" size={16} color="#000" />
                    <Text style={styles.infoText}>{orderDetail.address}</Text>
                </View>
            </View>

            {/* Payment Info */}
            <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Thông tin thanh toán</Text>
                <View style={styles.infoBox}>
                    <Ionicons name="card" size={16} color="#000" />
                    <View style={styles.infoTextContainer}>
                        <Text style={styles.infoText}>Phương thức thanh toán: {orderDetail.paymentMethod}</Text>
                        {orderDetail.paymentMethod !== 'Thanh toán khi nhận hàng' && (
                            <Text style={styles.infoText}>Mã giao dịch VNPay: {orderDetail.vnpayTransactionId}</Text>
                        )}
                        <Text style={styles.infoText}>Ngày thanh toán: {new Date(order.created_at).toLocaleDateString('vi-VN')}</Text>
                    </View>
                </View>
            </View>

            {/* Product Items - 🔧 CẬP NHẬT XỬ LÝ DỮ LIỆU */}
            <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Danh sách sản phẩm</Text>
                {orderItems.length > 0 ? (
                    orderItems.map((item, index) => {
                        const itemInfo = getItemDisplayInfo(item);

                        return (
                            <View key={index} style={styles.productContainer}>
                                <Image
                                    source={{ uri: itemInfo.image }}
                                    style={styles.productImage}
                                    defaultSource={{ uri: 'https://via.placeholder.com/100' }}
                                />
                                <View style={styles.productDetails}>
                                    <Text style={styles.productName}>{itemInfo.name}</Text>

                                    {/* 🆕 Hiển thị mô tả item */}
                                    {itemInfo.description && (
                                        <Text style={styles.productDescription}>{itemInfo.description}</Text>
                                    )}

                                    <Text style={styles.originalPrice}>
                                        đ{(item.unit_price * 1.1).toLocaleString()}
                                    </Text>
                                    <Text style={styles.discountedPrice}>đ{item.unit_price.toLocaleString()}</Text>
                                    <Text style={styles.quantity}>Số lượng: x{item.quantity}</Text>

                                    {/* 🆕 Hiển thị item type */}
                                    {item.item_type && (
                                        <Text style={styles.itemType}>
                                            Loại: {item.item_type === 'variant' ? 'Biến thể' : item.item_type === 'pet' ? 'Thú cưng' : 'Sản phẩm'}
                                        </Text>
                                    )}
                                </View>
                            </View>
                        );
                    })
                ) : (
                    <Text style={styles.errorText}>Không có mục đơn hàng nào để hiển thị</Text>
                )}
            </View>

            {/* Total */}
            <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Tổng cộng</Text>
                <View style={styles.totalContainer}>
                    <Text style={styles.totalText}>Thành tiền:</Text>
                    <Text style={styles.totalAmount}>đ{orderDetail.total.toLocaleString()}</Text>
                </View>
            </View>

            {/* Order History */}
            <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Lịch sử đơn hàng</Text>
                {orderDetail.orderHistory.map((item, index) => (
                    <View key={index} style={styles.historyItem}>
                        <Text style={styles.historyLabel}>{item.label}</Text>
                        <Text style={styles.historyTime}>{item.time}</Text>
                    </View>
                ))}
            </View>

            {/* Order ID */}
            <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Mã đơn hàng</Text>
                <View style={styles.orderIdContainer}>
                    <Text style={styles.orderIdText}>Mã đơn hàng:</Text>
                    <Text style={styles.orderIdValue}>{orderDetail.orderId}</Text>
                    <TouchableOpacity style={styles.checkButton}>
                        <Text style={styles.checkButtonText}>SAO CHÉP</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Actions */}
            <View style={styles.sectionContainer}>
                <View style={styles.actionContainer}>
                    <TouchableOpacity style={styles.actionButton}>
                        <Text style={styles.actionButtonText}>Xem đánh giá của bạn</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton}>
                        <Text style={styles.actionButtonText}>Yêu cầu trả hàng/hoàn tiền</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f8f8',
        paddingHorizontal: 16,
        paddingTop: 8,
    },
    sectionContainer: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        marginBottom: 16,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#333',
    },
    statusBanner: {
        backgroundColor: '#4CAF50',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    statusText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    infoTextContainer: {
        marginLeft: 12,
        flex: 1,
    },
    infoText: {
        color: '#444',
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 4,
    },
    productContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 8,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    productImage: {
        width: 80,
        height: 80,
        borderRadius: 8,
    },
    productDetails: {
        flex: 1,
        marginLeft: 12,
        justifyContent: 'space-between',
    },
    productName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    // 🆕 THÊM STYLES MỚI
    productDescription: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
        fontStyle: 'italic',
    },
    itemType: {
        fontSize: 11,
        color: '#007AFF',
        fontWeight: '500',
        marginTop: 2,
    },
    originalPrice: {
        textDecorationLine: 'line-through',
        color: '#888',
        fontSize: 14,
    },
    discountedPrice: {
        fontSize: 16,
        fontWeight: '600',
        color: '#e53e3e',
    },
    quantity: {
        color: '#666',
        fontSize: 14,
    },
    totalContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    totalText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    totalAmount: {
        fontSize: 16,
        fontWeight: '700',
        color: '#e53e3e',
    },
    historyItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    historyLabel: {
        color: '#333',
        fontSize: 14,
    },
    historyTime: {
        color: '#666',
        fontSize: 14,
    },
    orderIdContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    orderIdText: {
        color: '#333',
        fontSize: 14,
        fontWeight: '600',
    },
    orderIdValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        flex: 1,
        marginLeft: 8,
    },
    checkButton: {
        backgroundColor: '#3182CE',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    checkButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    actionContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    actionButton: {
        flex: 1,
        backgroundColor: '#3182CE',
        padding: 8,
        borderRadius: 8,
        alignItems: 'center',
        marginHorizontal: 8,
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    errorText: {
        fontSize: 16,
        color: '#e53e3e',
        textAlign: 'center',
        marginVertical: 20,
    },
    backButton: {
        backgroundColor: '#3182CE',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20,
        width: '50%',
        alignSelf: 'center',
    },
    backButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default OrderDetailScreen;