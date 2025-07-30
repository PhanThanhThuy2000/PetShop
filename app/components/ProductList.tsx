import React from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { Product } from '../types';

interface ProductListProps {
    products: Product[];
    loading?: boolean;
    numColumns?: number;
    horizontal?: boolean;
    showsHorizontalScrollIndicator?: boolean;
    contentContainerStyle?: any;
    onProductPress: (product: Product) => void;
    itemStyle?: 'grid' | 'horizontal';
    scrollEnabled?: boolean;
    ListEmptyComponent?: React.ComponentType<any> | React.ReactElement | null;
}

const ProductList: React.FC<ProductListProps> = ({
    products,
    loading = false,
    numColumns = 2,
    horizontal = false,
    showsHorizontalScrollIndicator = false,
    contentContainerStyle,
    onProductPress,
    itemStyle = 'grid',
    scrollEnabled = true,
    ListEmptyComponent,
}) => {

    // Helper function để lấy hình ảnh đầu tiên
    const getImageUrl = (images: any[] = []) => {
        if (images && images.length > 0) {
            const primaryImage = images.find(img => img.is_primary);
            return primaryImage?.url || images[0]?.url;
        }
        return 'https://via.placeholder.com/150?text=No+Image';
    };

    // Helper function để format giá
    const formatPrice = (price: number) => {
        if (!price) return '0₫';
        return price.toLocaleString('vi-VN') + '₫';
    };

    // Helper function để get stock status - cải tiến từ PetList
    const getStockInfo = (product: Product) => {
        const stock = (product as any).stock || 0;
        if (stock > 10) {
            return { text: 'Còn hàng', color: '#059669' };
        } else if (stock > 0) {
            return { text: `Còn ${stock}`, color: '#D97706' };
        } else {
            return { text: 'Hết hàng', color: '#DC2626' };
        }
    };

    const renderProductItem = ({ item }: { item: Product }) => {
        const imageUrl = getImageUrl(item.images);
        const stockInfo = getStockInfo(item);

        if (itemStyle === 'horizontal') {
            return (
                <TouchableOpacity
                    style={styles.horizontalItemContainer}
                    onPress={() => onProductPress(item)}
                    activeOpacity={0.7}
                >
                    <View style={styles.imageContainer}>
                        <Image
                            source={{ uri: imageUrl }}
                            style={styles.horizontalItemImage}
                            onError={(error) => {
                                console.log('Image load error:', error);
                            }}
                        />
                        <View style={[styles.stockBadgeOverlay, { backgroundColor: stockInfo.color }]}>
                            <Text style={styles.stockOverlayText}>
                                {stockInfo.text}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.horizontalItemDetails}>
                        <Text style={styles.horizontalItemName} numberOfLines={2}>
                            {item.name}
                        </Text>
                        <Text style={styles.horizontalItemPrice}>
                            {formatPrice(item.price)}
                        </Text>
                    </View>
                </TouchableOpacity>
            );
        }

        // Grid style (default) - cải tiến layout
        return (
            <TouchableOpacity
                style={styles.gridItemContainer}
                onPress={() => onProductPress(item)}
                activeOpacity={0.7}
            >
                <View style={styles.imageContainer}>
                    <Image
                        source={{ uri: imageUrl }}
                        style={styles.gridItemImage}
                        onError={(error) => {
                            console.log('Image load error:', error);
                        }}
                    />
                    <View style={[styles.stockBadgeOverlay, { backgroundColor: stockInfo.color }]}>
                        <Text style={styles.stockOverlayText}>
                            {stockInfo.text}
                        </Text>
                    </View>
                </View>
                <View style={styles.gridItemDetails}>
                    <Text style={styles.gridItemName} numberOfLines={2}>
                        {item.name}
                    </Text>
                    <Text style={styles.gridItemPrice}>
                        {formatPrice(item.price)}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    const defaultEmptyComponent = () => (
        <View style={styles.emptyContainer}>
            <Icon name="package" size={48} color="#CBD5E0" />
            <Text style={styles.emptyTitle}>Chưa có sản phẩm nào</Text>
            <Text style={styles.emptyText}>
                Hãy quay lại sau để xem thêm sản phẩm mới
            </Text>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2563EB" />
                <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
            </View>
        );
    }

    return (
        <FlatList
            data={products}
            renderItem={renderProductItem}
            keyExtractor={(item) => item._id}
            numColumns={horizontal ? 1 : numColumns}
            horizontal={horizontal}
            showsHorizontalScrollIndicator={showsHorizontalScrollIndicator}
            contentContainerStyle={contentContainerStyle}
            scrollEnabled={scrollEnabled}
            columnWrapperStyle={!horizontal && numColumns > 1 ? styles.columnWrapper : undefined}
            ListEmptyComponent={ListEmptyComponent || defaultEmptyComponent}
            showsVerticalScrollIndicator={false}
        />
    );
};

const styles = StyleSheet.create({
    // Grid style - cải tiến từ PetList
    columnWrapper: {
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    gridItemContainer: {
        width: '48%',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
        overflow: 'hidden',
    },
    imageContainer: {
        position: 'relative',
    },
    gridItemImage: {
        width: '100%',
        height: 140,
        backgroundColor: '#F9FAFB'
    },
    gridItemDetails: {
        padding: 10,
    },
    gridItemName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
        lineHeight: 18,
        minHeight: 36,
    },
    gridItemPrice: {
        fontSize: 15,
        fontWeight: '700',
        color: '#DC2626',
        marginBottom: 4,
    },
    gridItemCategory: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '500',
    },
    stockBadgeOverlay: {
        position: 'absolute',
        top: 8,
        right: 8,
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 6,
    },
    stockOverlayText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#FFFFFF',
    },

    // Horizontal style - cải tiến kích thước và layout
    horizontalItemContainer: {
        width: 150,
        marginRight: 12,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
        overflow: 'hidden',
    },
    horizontalItemImage: {
        width: '100%',
        height: 100,
        backgroundColor: '#F9FAFB'
    },
    horizontalItemDetails: {
        padding: 8,
    },
    horizontalItemName: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1F2937',
        lineHeight: 16,
        minHeight: 32,
    },
    horizontalItemPrice: {
        fontSize: 14,
        fontWeight: '700',
        color: '#DC2626',
        marginBottom: 4,
    },
    horizontalItemCategory: {
        fontSize: 11,
        color: '#6B7280',
        fontWeight: '500',
    },

    // Loading and empty states
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
    },

    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2937',
        marginTop: 12,
        marginBottom: 6,
        textAlign: 'center',
    },
    emptyText: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 20,
        fontWeight: '400',
    },
});

export default ProductList;