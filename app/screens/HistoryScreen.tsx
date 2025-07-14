import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
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

const OrderItemComponent = ({ item }: { item: OrderItem }) => {
    const navigation = useNavigation<any>();
    const [isReviewed, setIsReviewed] = useState(false); // Trạng thái kiểm tra xem đã đánh giá chưa

    useEffect(() => {
        // Kiểm tra xem item đã được đánh giá chưa (giả định ban đầu)
        // Hiện tại, không có dữ liệu từ backend, nên ban đầu là false
        // Cần cập nhật từ AddReviewScreen sau khi gửi thành công
    }, [item._id]);

    const handlePress = () => {
        if (!item.order_id?._id) {
            console.error('Order ID is missing for item:', item._id);
            return;
        }
        console.log('Navigating to OrderDetail with orderId:', item.order_id._id);
        navigation.navigate('OrderDetail', { orderId: item.order_id._id });
    };

    const handleReview = () => {
        console.log('Đánh giá mục đơn hàng:', item._id);
        const product = {
            id: item.pet_id?._id || item.product_id?._id || item._id,
            name: item.pet_id?.name || item.product_id?.name || 'Mục không xác định',
            image: item.pet_id?.images?.find(img => img.is_primary)?.url ||
                   item.product_id?.images?.find(img => img.is_primary)?.url ||
                   'https://via.placeholder.com/100',
        };
        navigation.navigate('AddReviewScreen', { product, orderItemId: item._id });
    };

    const itemName = item.pet_id?.name || item.product_id?.name || 'Mục không xác định';
    const itemImage = item.pet_id?.images?.find(img => img.is_primary)?.url ||
        item.product_id?.images?.find(img => img.is_primary)?.url ||
        null;

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
                    {itemImage ? (
                        <Image source={{ uri: itemImage }} style={styles.petImage} />
                    ) : (
                        <View style={[styles.petImage, styles.placeholderImage]} />
                    )}
                    <View style={styles.orderInfo}>
                        <Text style={styles.petName}>{itemName}</Text>
                        <Text
                            style={[
                                styles.price,
                                { color: 'red', textDecorationLine: 'line-through' }
                            ]}
                        >
                            {(item.unit_price * item.quantity).toLocaleString('vi-VN')} đ
                        </Text>
                        <Text style={styles.price}>
                            Tổng tiền: {item.order_id?.total_amount?.toLocaleString('vi-VN')} đ
                        </Text>
                    </View>
                </View>

                <View style={styles.orderFooter}>
                    <Text style={[
                        styles.status,
                        item.order_id.status === 'completed' ? styles.statusCompleted : styles.statusPending
                    ]}>
                        {item.order_id.status
                            ? item.order_id.status.charAt(0).toUpperCase() + item.order_id.status.slice(1)
                            : 'Không xác định'}
                    </Text>
                    {!isReviewed && item.order_id.status === 'completed' && (
                        <TouchableOpacity style={styles.reviewButton} onPress={handleReview}>
                            <Text style={styles.reviewButtonText}>Đánh giá</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );
};

const HistoryScreen = () => {
    const navigation = useNavigation<any>();
    const isFocused = useIsFocused(); // Sử dụng để phát hiện khi quay lại màn hình
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
            const params = { query: searchQuery, page: 1, limit: 20 };
            console.log('Tham số tìm kiếm:', params);
            const response = await ordersService.searchOrderItems(params);
            console.log('Phản hồi tìm kiếm đầy đủ:', JSON.stringify(response, null, 2));
            console.log('Items:', response.data.items || response.data);
            setOrderItems(response.data.items || response.data || []);
            if ((response.data.items || response.data).length === 0) {
                setError('Không tìm thấy mục đơn hàng nào phù hợp');
            } else {
                setError(null);
            }
        } catch (err: any) {
            console.error('Lỗi tìm kiếm:', err.response?.data || err.message);
            setError('Không thể tìm kiếm mục đơn hàng');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchOrderItems = async () => {
        try {
            setIsLoading(true);
            const token = await AsyncStorage.getItem('token');
            console.log('Token gửi đi:', token);
            const params = { page: 1, limit: 20 };
            console.log('Tham số API:', params);
            const response = await ordersService.getMyOrderItems(params);
            console.log('Phản hồi API đầy đủ:', JSON.stringify(response, null, 2));
            setOrderItems(response.data);
            if (response.data.length === 0) {
                console.warn('Cảnh báo: Không tìm thấy mục đơn hàng nào');
                setError('Không có mục đơn hàng nào để hiển thị');
            } else {
                setError(null);
            }
        } catch (err: any) {
            console.error('Lỗi API:', err.response?.data || err.message);
            setError('Không thể tải danh sách mục đơn hàng');
        } finally {
            setIsLoading(false);
        }
    };

    // Cập nhật danh sách khi quay lại từ AddReviewScreen
    useEffect(() => {
        if (isFocused) {
            fetchOrderItems(); // Làm mới danh sách để lấy trạng thái mới
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
                <Text style={styles.loadingText}>Đang tải danh sách mục đơn hàng...</Text>
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView style={styles.container}>
                <Text style={styles.errorText}>{error}</Text>
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
            <FlatList
                data={orderItems}
                renderItem={({ item }) => <OrderItemComponent item={item} />}
                keyExtractor={item => item._id}
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
    listContainer: {
        paddingVertical: 16,
        paddingHorizontal: 16,
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
        backgroundColor: '#f0f0f0'
    },
    placeholderImage: {
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
        marginBottom: 8,
    },
    price: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#e53e3e',
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
    loadingText: {
        flex: 1,
        textAlign: 'center',
        marginTop: 20,
        fontSize: 16,
        color: '#2d3748',
    },
    errorText: {
        flex: 1,
        textAlign: 'center',
        marginTop: 20,
        fontSize: 16,
        color: '#e53e3e',
    }
});

export default HistoryScreen;