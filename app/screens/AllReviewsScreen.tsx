// app/screens/AllReviewsScreen.tsx
import { FontAwesome } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Review, reviewService, ReviewStats } from '../services/ReviewServices';

interface AllReviewsScreenProps {
    navigation: any;
    route: {
        params: {
            itemId: string;
            itemName: string;
            itemImage?: string;
            isPet: boolean;
            stats: ReviewStats;
        };
    };
}

const AllReviewsScreen: React.FC<AllReviewsScreenProps> = ({ navigation, route }) => {
    const { itemId, itemName, itemImage, isPet, stats: initialStats } = route.params;

    // States
    const [reviews, setReviews] = useState<Review[]>([]);
    const [stats, setStats] = useState<ReviewStats>(initialStats);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [selectedRating, setSelectedRating] = useState<number | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    // Load reviews
    const loadReviews = async (page: number = 1, rating: number | null = null, isRefresh: boolean = false) => {
        try {
            if (page === 1) {
                isRefresh ? setRefreshing(true) : setLoading(true);
            } else {
                setLoadingMore(true);
            }

            let response;
            if (isPet) {
                response = await reviewService.getReviewsByPet(itemId, {
                    page,
                    limit: 10,
                    rating: rating || undefined,
                });
            } else {
                response = await reviewService.getReviewsByProduct(itemId, {
                    page,
                    limit: 10,
                    rating: rating || undefined,
                });
            }

            if (response.success && response.data) {
                const newReviews = response.data.reviews;

                if (page === 1) {
                    setReviews(newReviews);
                } else {
                    setReviews(prev => [...prev, ...newReviews]);
                }

                setStats(response.data.stats);
                setHasMore(response.data.pagination.hasMore);
                setCurrentPage(page);
            }
        } catch (error) {
            console.error('❌ Error loading reviews:', error);
            Alert.alert('Lỗi', 'Không thể tải đánh giá. Vui lòng thử lại.');
        } finally {
            setLoading(false);
            setRefreshing(false);
            setLoadingMore(false);
        }
    };

    // Initial load
    useEffect(() => {
        loadReviews(1, selectedRating);
    }, [selectedRating]);

    // Refresh
    const handleRefresh = useCallback(() => {
        loadReviews(1, selectedRating, true);
    }, [selectedRating]);

    // Load more
    const handleLoadMore = useCallback(() => {
        if (!loadingMore && hasMore) {
            loadReviews(currentPage + 1, selectedRating);
        }
    }, [currentPage, selectedRating, loadingMore, hasMore]);

    // Filter by rating
    const handleRatingFilter = (rating: number) => {
        const newRating = selectedRating === rating ? null : rating;
        setSelectedRating(newRating);
        setCurrentPage(1);
        setHasMore(true);
    };

    // Render individual review
    const renderReviewItem = ({ item: review }: { item: Review }) => (
        <View style={styles.reviewItem}>
            <View style={styles.reviewHeader}>
                <Image
                    source={{
                        uri: review.user_id?.avatar || 'https://via.placeholder.com/40'
                    }}
                    style={styles.userAvatar}
                />
                <View style={styles.reviewUserInfo}>
                    <Text style={styles.reviewUserName}>
                        {review.user_id?.username || 'Người dùng'}
                    </Text>
                    <View style={styles.reviewRating}>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <FontAwesome
                                key={star}
                                name="star"
                                size={14}
                                color={star <= review.rating ? '#FBBF24' : '#E5E7EB'}
                            />
                        ))}
                        <Text style={styles.reviewDate}>
                            {new Date(review.created_at).toLocaleDateString('vi-VN')}
                        </Text>
                    </View>
                </View>
            </View>

            <Text style={styles.reviewComment}>{review.comment}</Text>

            {/* Review Images */}
            {review.images && review.images.length > 0 && (
                <FlatList
                    data={review.images}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(image, index) => `${review._id}-image-${index}`}
                    renderItem={({ item: image }) => (
                        <TouchableOpacity
                            onPress={() => {
                                // TODO: Open image viewer
                            }}
                        >
                            <Image source={{ uri: image.url }} style={styles.reviewImage} />
                        </TouchableOpacity>
                    )}
                    contentContainerStyle={styles.reviewImagesContainer}
                />
            )}
        </View>
    );

    // Render rating filter
    const renderRatingFilter = () => (
        <View style={styles.filterContainer}>
            <Text style={styles.filterTitle}>Lọc theo đánh giá:</Text>
            <FlatList
                data={[
                    { rating: null, label: `Tất cả (${stats.totalReviews})` },
                    { rating: 5, label: `5★ (${stats.distribution.star5})` },
                    { rating: 4, label: `4★ (${stats.distribution.star4})` },
                    { rating: 3, label: `3★ (${stats.distribution.star3})` },
                    { rating: 2, label: `2★ (${stats.distribution.star2})` },
                    { rating: 1, label: `1★ (${stats.distribution.star1})` },
                ]}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item, index) => `filter-${index}`}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={[
                            styles.filterButton,
                            selectedRating === item.rating && styles.filterButtonActive,
                        ]}
                        onPress={() => handleRatingFilter(item.rating)}
                    >
                        <Text
                            style={[
                                styles.filterButtonText,
                                selectedRating === item.rating && styles.filterButtonTextActive,
                            ]}
                        >
                            {item.label}
                        </Text>
                    </TouchableOpacity>
                )}
                contentContainerStyle={styles.filterList}
            />
        </View>
    );

    // Render header
    const renderHeader = () => (
        <View>
            {/* Product/Pet Info */}
            <View style={styles.headerContainer}>
                <Image
                    source={{ uri: itemImage || 'https://via.placeholder.com/60' }}
                    style={styles.itemImage}
                />
                <View style={styles.itemInfo}>
                    <Text style={styles.itemName} numberOfLines={2}>
                        {itemName}
                    </Text>
                    <View style={styles.ratingOverview}>
                        <Text style={styles.avgRating}>{stats.avgRating.toFixed(1)}</Text>
                        <View style={styles.starsContainer}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <FontAwesome
                                    key={star}
                                    name="star"
                                    size={16}
                                    color={star <= Math.round(stats.avgRating) ? '#FBBF24' : '#E5E7EB'}
                                />
                            ))}
                        </View>
                        <Text style={styles.totalReviews}>({stats.totalReviews} đánh giá)</Text>
                    </View>
                </View>
            </View>

            {/* Rating Filter */}
            {renderRatingFilter()}
        </View>
    );

    // Render footer
    const renderFooter = () => {
        if (!loadingMore) return null;
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#2563EB" />
                <Text style={styles.loadingText}>Đang tải thêm...</Text>
            </View>
        );
    };

    // Render empty state
    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <FontAwesome name="star-o" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>
                {selectedRating
                    ? `Không có đánh giá ${selectedRating} sao`
                    : 'Chưa có đánh giá nào'
                }
            </Text>
            <Text style={styles.emptySubtext}>
                {selectedRating
                    ? 'Thử chọn lọc khác hoặc xem tất cả đánh giá'
                    : 'Hãy là người đầu tiên đánh giá!'
                }
            </Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Custom Header */}
            <View style={styles.customHeader}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <FontAwesome name="arrow-left" size={20} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Tất cả đánh giá</Text>
                <View style={styles.headerRight} />
            </View>

            {loading ? (
                <View style={styles.centerLoading}>
                    <ActivityIndicator size="large" color="#2563EB" />
                    <Text style={styles.loadingText}>Đang tải đánh giá...</Text>
                </View>
            ) : (
                <FlatList
                    data={reviews}
                    keyExtractor={(item) => item._id}
                    renderItem={renderReviewItem}
                    ListHeaderComponent={renderHeader}
                    ListEmptyComponent={renderEmptyState}
                    ListFooterComponent={renderFooter}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                    }
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.5}
                    contentContainerStyle={reviews.length === 0 ? styles.emptyContent : undefined}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },

    // Custom Header
    customHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        backgroundColor: '#FFFFFF',
    },

    backButton: {
        padding: 8,
    },

    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
    },

    headerRight: {
        width: 36,
    },

    // Header Content
    headerContainer: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: '#F9FAFB',
    },

    itemImage: {
        width: 60,
        height: 60,
        borderRadius: 8,
        marginRight: 12,
    },

    itemInfo: {
        flex: 1,
    },

    itemName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 8,
    },

    ratingOverview: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    avgRating: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
        marginRight: 8,
    },

    starsContainer: {
        flexDirection: 'row',
        marginRight: 8,
    },

    totalReviews: {
        fontSize: 14,
        color: '#6B7280',
    },

    // Filter
    filterContainer: {
        padding: 16,
        backgroundColor: '#FFFFFF',
    },

    filterTitle: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
        marginBottom: 12,
    },

    filterList: {
        paddingRight: 16,
    },

    filterButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        backgroundColor: '#FFFFFF',
        marginRight: 8,
    },

    filterButtonActive: {
        backgroundColor: '#2563EB',
        borderColor: '#2563EB',
    },

    filterButtonText: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
    },

    filterButtonTextActive: {
        color: '#FFFFFF',
    },

    // Reviews
    reviewItem: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },

    reviewHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 8,
    },

    userAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
    },

    reviewUserInfo: {
        flex: 1,
    },

    reviewUserName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 4,
    },

    reviewRating: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    reviewDate: {
        fontSize: 12,
        color: '#9CA3AF',
        marginLeft: 8,
    },

    reviewComment: {
        fontSize: 14,
        color: '#4B5563',
        lineHeight: 20,
        marginBottom: 8,
    },

    reviewImagesContainer: {
        paddingLeft: 52, // Align with text
    },

    reviewImage: {
        width: 80,
        height: 80,
        borderRadius: 8,
        marginRight: 8,
    },

    // Loading & Empty States
    centerLoading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    loadingContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 16,
    },

    loadingText: {
        fontSize: 14,
        color: '#6B7280',
        marginLeft: 8,
    },

    emptyContent: {
        flexGrow: 1,
    },

    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 64,
    },

    emptyText: {
        fontSize: 18,
        color: '#6B7280',
        textAlign: 'center',
        marginTop: 16,
        marginBottom: 8,
    },

    emptySubtext: {
        fontSize: 14,
        color: '#9CA3AF',
        textAlign: 'center',
    },
});

export default AllReviewsScreen;