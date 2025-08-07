// app/components/RelatedItems.tsx - Sử dụng API có sẵn
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import api from '../utils/api-client';

interface RelatedItem {
    _id: string;
    name: string;
    price: number;
    images?: Array<{ url: string; is_primary?: boolean }>;
    itemType: 'pet' | 'product';
    relationshipType?: string;
    breed_id?: any;
    category_id?: any;
}

interface RelatedItemsProps {
    navigation: any;
    currentItemId: string;
    currentItemType: 'pet' | 'product';
    limit?: number;
}

const RelatedItems: React.FC<RelatedItemsProps> = ({
    navigation,
    currentItemId,
    currentItemType,
    limit = 8
}) => {
    const [relatedItems, setRelatedItems] = useState<RelatedItem[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (currentItemId && currentItemType) {
            loadRelatedItems();
        }
    }, [currentItemId, currentItemType]);

    const loadRelatedItems = async () => {
        try {
            setLoading(true);
            console.log('🔗 Loading related items for:', { currentItemId, currentItemType });

            let response;

            if (currentItemType === 'pet') {
                // Gọi API pets/:id/related
                response = await api.get(`/pets/${currentItemId}/related?limit=${limit}`);
            } else {
                // Gọi API products/:id/related  
                response = await api.get(`/products/${currentItemId}/related?limit=${limit}`);
            }

            if (response.data.success) {
                console.log('✅ Related items response:', response.data.data);
                const relatedData = response.data.data.relatedItems || [];
                setRelatedItems(relatedData);
            }
        } catch (error) {
            console.error('❌ Error loading related items:', error);
            setRelatedItems([]);
        } finally {
            setLoading(false);
        }
    };

    const handleItemPress = (item: RelatedItem) => {
        console.log('🎯 Related item pressed:', {
            itemType: item.itemType,
            itemId: item._id,
        });

        if (item.itemType === 'pet') {
            navigation.push('ProductDetail', {
                petId: item._id,
            });
        } else {
            navigation.push('ProductDetail', {
                productId: item._id,
            });
        }
    };

    const getImageUrl = (item: RelatedItem): string => {
        if (item.images && item.images.length > 0) {
            const primaryImage = item.images.find(img => img.is_primary);
            return primaryImage?.url || item.images[0]?.url || 'https://via.placeholder.com/150';
        }
        return 'https://via.placeholder.com/150?text=No+Image';
    };

    const getRelationshipBadge = (relationshipType?: string) => {
        const badges = {
            'same-breed': { text: 'Cùng giống', color: '#10B981' },
            'same-category': { text: 'Cùng loại', color: '#3B82F6' },
            'pet-compatible': { text: 'Phù hợp', color: '#8B5CF6' },
            'similar-price': { text: 'Giá tương tự', color: '#F59E0B' },
            'similar': { text: 'Tương tự', color: '#6B7280' }
        };

        const badge = badges[relationshipType as keyof typeof badges] || badges.similar;

        return (
            <View style={[styles.relationshipBadge, { backgroundColor: badge.color }]}>
                <Text style={styles.relationshipBadgeText}>{badge.text}</Text>
            </View>
        );
    };

    const renderRelatedItem = (item: RelatedItem, index: number) => (
        <TouchableOpacity
            key={`${item._id}-${index}`}
            style={styles.relatedItem}
            onPress={() => handleItemPress(item)}
            activeOpacity={0.7}
        >
            <View style={styles.imageContainer}>
                <Image
                    source={{ uri: getImageUrl(item) }}
                    style={styles.relatedImage}
                    resizeMode="cover"
                />
                {item.relationshipType && getRelationshipBadge(item.relationshipType)}
                <View style={styles.itemTypeBadge}>
                    <Text style={styles.itemTypeBadgeText}>
                        {item.itemType === 'pet' ? '🐾' : '🛍️'}
                    </Text>
                </View>
            </View>

            <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={2}>
                    {item.name}
                </Text>
                <Text style={styles.itemPrice}>
                    {item.price?.toLocaleString('vi-VN')}₫
                </Text>
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#2563EB" />
                <Text style={styles.loadingText}>Đang tải sản phẩm liên quan...</Text>
            </View>
        );
    }

    if (relatedItems.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                    Không có {currentItemType === 'pet' ? 'thú cưng' : 'sản phẩm'} liên quan
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContainer}
            >
                {relatedItems.map(renderRelatedItem)}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 16,
    },
    scrollContainer: {
        paddingHorizontal: 16,
        gap: 12,
    },
    relatedItem: {
        width: 140,
        backgroundColor: '#fff',
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
        marginBottom: 8,
    },
    imageContainer: {
        position: 'relative',
        width: '100%',
        height: 100,
    },
    relatedImage: {
        width: '100%',
        height: '100%',
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
    },
    relationshipBadge: {
        position: 'absolute',
        top: 8,
        left: 8,
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 4,
    },
    relationshipBadgeText: {
        fontSize: 10,
        color: '#fff',
        fontWeight: '600',
    },
    itemTypeBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 12,
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemTypeBadgeText: {
        fontSize: 12,
    },
    itemInfo: {
        padding: 12,
    },
    itemName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
        lineHeight: 18,
    },
    itemPrice: {
        fontSize: 13,
        fontWeight: '700',
        color: '#EF4444',
        marginBottom: 4,
    },
    loadingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 32,
    },
    loadingText: {
        marginTop: 8,
        fontSize: 14,
        color: '#6B7280',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 32,
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
        marginTop: 16,
    },
    emptyText: {
        fontSize: 14,
        color: '#9CA3AF',
        textAlign: 'center',
    },
});

export default RelatedItems;