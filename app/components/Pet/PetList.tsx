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
import { Pet } from '../../types';
import PetVariantHelpers from '../../utils/petVariantHelpers'; // Import PetVariantHelpers

interface PetListProps {
    pets: Pet[];
    loading?: boolean;
    numColumns?: number;
    horizontal?: boolean;
    showsHorizontalScrollIndicator?: boolean;
    contentContainerStyle?: any;
    onPetPress: (pet: Pet) => void;
    itemStyle?: 'grid' | 'horizontal';
    scrollEnabled?: boolean;
    ListEmptyComponent?: React.ComponentType<any> | React.ReactElement | null;
}

// Safe navigation helper
const safeNavigate = (navigation: any, routeName: string, params?: any) => {
    try {
        navigation.navigate(routeName, params);
    } catch (error) {
        console.warn(`Route '${routeName}' not found, navigating to Search instead`);
        try {
            navigation.navigate('Search', params);
        } catch (fallbackError) {
            console.error('Even Search route not found:', fallbackError);
        }
    }
};

const PetList: React.FC<PetListProps> = ({
    pets,
    loading = false,
    numColumns = 2,
    horizontal = false,
    showsHorizontalScrollIndicator = false,
    contentContainerStyle,
    onPetPress,
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
    const formatPrice = (pet: Pet) => {
        const { price, showFrom } = PetVariantHelpers.formatPetPrice(pet); // Sử dụng formatPetPrice
        return `${price.toLocaleString('vi-VN')}₫`;
    };

    // Helper function để format status
    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'available':
                return { text: 'Có sẵn', color: '#059669' };
            case 'sold':
                return { text: 'Đã bán', color: '#DC2626' };
            default:
                return { text: 'Đã đặt', color: '#D97706' };
        }
    };

    // Enhanced key extractor để đảm bảo uniqueness
    const keyExtractor = (item: Pet, index: number) => {
        // Priority order for generating unique key:
        // 1. Use uniqueKey if available (set by parent component)
        // 2. Use _id if available
        // 3. Use combination of _id and index
        // 4. Use index as fallback

        if ((item as any).uniqueKey) {
            return (item as any).uniqueKey;
        }

        if (item._id) {
            return `pet_${item._id}_${index}`;
        }

        // Fallback - này chỉ xảy ra khi object không có _id (hiếm)
        return `pet_fallback_${index}_${Date.now()}`;
    };

    const renderPetItem = ({ item, index }: { item: Pet; index: number }) => {
        const imageUrl = getImageUrl(item.images);
        const statusInfo = getStatusInfo(item.status);

        if (itemStyle === 'horizontal') {
            return (
                <TouchableOpacity
                    style={styles.horizontalItemContainer}
                    onPress={() => onPetPress(item)}
                    activeOpacity={0.7}
                >
                    <Image
                        source={{ uri: imageUrl }}
                        style={styles.horizontalItemImage}
                        onError={(error) => {
                            console.log('Image load error:', error);
                        }}
                    />
                    <View style={styles.horizontalItemDetails}>
                        <Text style={styles.horizontalItemName} numberOfLines={2}>
                            {item.name}
                        </Text>
                        <Text style={styles.horizontalItemPrice}>
                            {formatPrice(item)} {/* Sử dụng formatPrice với PetVariantHelpers */}
                        </Text>
                        <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '15' }]}>
                            <Text style={[styles.statusText, { color: statusInfo.color }]}>
                                {statusInfo.text}
                            </Text>
                        </View>
                    </View>
                </TouchableOpacity>
            );
        }

        // Grid style (default)
        return (
            <TouchableOpacity
                style={styles.gridItemContainer}
                onPress={() => onPetPress(item)}
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
                    <View style={[styles.statusBadgeOverlay, { backgroundColor: statusInfo.color }]}>
                        <Text style={styles.statusOverlayText}>
                            {statusInfo.text}
                        </Text>
                    </View>
                </View>
                <View style={styles.gridItemDetails}>
                    <Text style={styles.gridItemName} numberOfLines={2}>
                        {item.name}
                    </Text>
                    <Text style={styles.gridItemPrice}>
                        {formatPrice(item)} {/* Sử dụng formatPrice với PetVariantHelpers */}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    const defaultEmptyComponent = () => (
        <View style={styles.emptyContainer}>
            <Icon name="search" size={48} color="#CBD5E0" />
            <Text style={styles.emptyTitle}>Chưa có thú cưng nào</Text>
            <Text style={styles.emptyText}>
                Hãy quay lại sau để xem thêm thú cưng mới
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
            data={pets}
            renderItem={renderPetItem}
            keyExtractor={keyExtractor} // Sử dụng enhanced keyExtractor
            numColumns={horizontal ? 1 : numColumns}
            horizontal={horizontal}
            showsHorizontalScrollIndicator={showsHorizontalScrollIndicator}
            contentContainerStyle={contentContainerStyle}
            scrollEnabled={scrollEnabled}
            columnWrapperStyle={!horizontal && numColumns > 1 ? styles.columnWrapper : undefined}
            ListEmptyComponent={ListEmptyComponent || defaultEmptyComponent}
            showsVerticalScrollIndicator={false}
            // Add extra props để tránh re-render không cần thiết
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            windowSize={10}
            initialNumToRender={6}
            getItemLayout={undefined} // Let FlatList calculate automatically
        />
    );
};

const styles = StyleSheet.create({
    // Grid style
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
    },
    statusBadgeOverlay: {
        position: 'absolute',
        top: 8,
        right: 8,
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 6,
    },
    statusOverlayText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#FFFFFF',
    },

    // Horizontal style
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
    },
    statusBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '600',
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

export default PetList;