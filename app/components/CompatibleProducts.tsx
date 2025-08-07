// app/components/CompatibleProducts.tsx - Component cho sản phẩm phù hợp với pet type
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import api from '../utils/api-client';

interface CompatibleProduct {
    _id: string;
    name: string;
    price: number;
    images?: Array<{ url: string; is_primary?: boolean }>;
    category_id?: any;
    description?: string;
}

interface CompatibleProductsProps {
    navigation: any;
    petType: string; // 'chó', 'mèo', 'chim', etc.
    limit?: number;
}

const CompatibleProducts: React.FC<CompatibleProductsProps> = ({
    navigation,
    petType,
    limit = 4
}) => {
    const [products, setProducts] = useState<CompatibleProduct[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (petType) {
            loadCompatibleProducts();
        }
    }, [petType]);

    const loadCompatibleProducts = async () => {
        if (!petType) return;

        try {
            setLoading(true);
            console.log('🛍️ Loading compatible products for pet type:', petType);

            // Gọi API pets/products-for/:petType
            const response = await api.get(`/pets/products-for/${petType}?limit=${limit}`);

            if (response.data.success) {
                console.log('✅ Compatible products loaded:', response.data.data);
                setProducts(response.data.data || []);
            }
        } catch (error) {
            console.error('❌ Error loading compatible products:', error);
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    const handleProductPress = (product: CompatibleProduct) => {
        console.log('🎯 Compatible product pressed:', product._id);
        navigation.push('ProductDetail', {
            productId: product._id,
        });
    };

    const getImageUrl = (product: CompatibleProduct): string => {
        if (product.images && product.images.length > 0) {
            const primaryImage = product.images.find(img => img.is_primary);
            return primaryImage?.url || product.images[0]?.url || 'https://via.placeholder.com/150';
        }
        return 'https://via.placeholder.com/150?text=Product';
    };

    const getPetTypeIcon = (type: string): string => {
        const icons: { [key: string]: string } = {
            'chó': '🐕',
            'mèo': '🐱',
            'chim': '🐦',
            'cá': '🐟',
            'hamster': '🐹',
            'thỏ': '🐰',
            'dog': '🐕',
            'cat': '🐱',
            'bird': '🐦',
            'fish': '🐟',
            'rabbit': '🐰'
        };
        return icons[type.toLowerCase()] || '🐾';
    };

    const renderCompatibleProduct = (product: CompatibleProduct, index: number) => (
        <TouchableOpacity
            key={`compatible-${product._id}-${index}`}
            style={styles.productItem}
            onPress={() => handleProductPress(product)}
            activeOpacity={0.7}
        >
            <View style={styles.imageContainer}>
                <Image
                    source={{ uri: getImageUrl(product) }}
                    style={styles.productImage}
                    resizeMode="cover"
                />

                {/* Compatibility Badge */}
                <View style={styles.compatibilityBadge}>
                    <Text style={styles.compatibilityBadgeText}>
                        {getPetTypeIcon(petType)}
                    </Text>
                </View>

                {/* Product Type Badge */}
                <View style={styles.productTypeBadge}>
                    <Text style={styles.productTypeBadgeText}>🛍️</Text>
                </View>
            </View>

            <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={2}>
                    {product.name}
                </Text>

                {product.category_id && (
                    <Text style={styles.productCategory} numberOfLines={1}>
                        {typeof product.category_id === 'object' ? product.category_id?.name : 'Sản phẩm'}
                    </Text>
                )}

                <Text style={styles.productPrice}>
                    {product.price?.toLocaleString('vi-VN')}₫
                </Text>

                <View style={styles.compatibilityInfo}>
                    <Ionicons name="checkmark-circle" size={12} color="#10B981" />
                    <Text style={styles.compatibilityText}>
                        Phù hợp cho {petType}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#2563EB" />
                <Text style={styles.loadingText}>Đang tìm sản phẩm phù hợp...</Text>
            </View>
        );
    }

    if (products.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Không có sản phẩm phù hợp cho {petType}</Text>
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
                {products.map(renderCompatibleProduct)}
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
    productItem: {
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
    productImage: {
        width: '100%',
        height: '100%',
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
    },
    compatibilityBadge: {
        position: 'absolute',
        top: 8,
        left: 8,
        backgroundColor: '#10B981',
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 12,
        minWidth: 24,
        alignItems: 'center',
    },
    compatibilityBadgeText: {
        fontSize: 12,
        color: '#fff',
    },
    productTypeBadge: {
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
    productTypeBadgeText: {
        fontSize: 12,
    },
    productInfo: {
        padding: 12,
    },
    productName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
        lineHeight: 18,
    },
    productCategory: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 4,
    },
    productPrice: {
        fontSize: 13,
        fontWeight: '700',
        color: '#EF4444',
        marginBottom: 6,
    },
    compatibilityInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    compatibilityText: {
        fontSize: 11,
        color: '#10B981',
        fontWeight: '500',
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

export default CompatibleProducts;