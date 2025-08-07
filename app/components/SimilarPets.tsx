// app/components/SimilarPets.tsx - Component cho pets tương tự
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import api from '../utils/api-client';

interface SimilarPet {
    _id: string;
    name: string;
    price: number;
    images?: Array<{ url: string; is_primary?: boolean }>;
    breed_id?: any;
    type: string;
    similarityScore: number;
}

interface SimilarPetsProps {
    navigation: any;
    petId?: string;
    limit?: number;
    showSimilarityScore?: boolean;
}

const SimilarPets: React.FC<SimilarPetsProps> = ({
    navigation,
    petId,
    limit = 6,
    showSimilarityScore = true
}) => {
    const [similarPets, setSimilarPets] = useState<SimilarPet[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (petId) {
            loadSimilarPets();
        }
    }, [petId]);

    const loadSimilarPets = async () => {
        if (!petId) return;

        try {
            setLoading(true);
            console.log('🧠 Loading similar pets for:', petId);

            // Gọi API pets/:id/similar-advanced
            const response = await api.get(`/pets/${petId}/similar-advanced?limit=${limit}`);

            if (response.data.success) {
                console.log('✅ Similar pets loaded:', response.data.data);
                setSimilarPets(response.data.data.similarPets || []);
            }
        } catch (error) {
            console.error('❌ Error loading similar pets:', error);
            setSimilarPets([]);
        } finally {
            setLoading(false);
        }
    };

    const handlePetPress = (pet: SimilarPet) => {
        console.log('🎯 Similar pet pressed:', pet._id, 'Score:', pet.similarityScore);
        navigation.push('ProductDetail', {
            petId: pet._id,
        });
    };

    const getImageUrl = (pet: SimilarPet): string => {
        if (pet.images && pet.images.length > 0) {
            const primaryImage = pet.images.find(img => img.is_primary);
            return primaryImage?.url || pet.images[0]?.url || 'https://via.placeholder.com/150';
        }
        return 'https://via.placeholder.com/150?text=Pet';
    };

    const getSimilarityColor = (score: number): string => {
        if (score >= 180) return '#10B981'; // Rất tương tự - xanh lá
        if (score >= 120) return '#3B82F6'; // Tương tự - xanh dương  
        if (score >= 80) return '#F59E0B';  // Khá tương tự - vàng
        return '#EF4444'; // Ít tương tự - đỏ
    };

    const getSimilarityLabel = (score: number): string => {
        if (score >= 180) return 'Rất giống';
        if (score >= 120) return 'Giống';
        if (score >= 80) return 'Khá giống';
        return 'Có điểm tương tự';
    };

    const renderSimilarPet = (pet: SimilarPet, index: number) => (
        <TouchableOpacity
            key={`similar-${pet._id}-${index}`}
            style={styles.petItem}
            onPress={() => handlePetPress(pet)}
            activeOpacity={0.7}
        >
            <View style={styles.imageContainer}>
                <Image
                    source={{ uri: getImageUrl(pet) }}
                    style={styles.petImage}
                    resizeMode="cover"
                />

                {/* Similarity Badge */}
                {showSimilarityScore && (
                    <View style={[
                        styles.similarityBadge,
                        { backgroundColor: getSimilarityColor(pet.similarityScore) }
                    ]}>
                        <Text style={styles.similarityBadgeText}>
                            {Math.round(pet.similarityScore)}
                        </Text>
                    </View>
                )}

                {/* Pet Type Badge */}
                <View style={styles.petTypeBadge}>
                    <Text style={styles.petTypeBadgeText}>🐾</Text>
                </View>
            </View>

            <View style={styles.petInfo}>
                <Text style={styles.petName} numberOfLines={2}>
                    {pet.name}
                </Text>

                <Text style={styles.petBreed} numberOfLines={1}>
                    {typeof pet.breed_id === 'object' ? pet.breed_id?.name : 'Chưa rõ giống'}
                </Text>

                <Text style={styles.petPrice}>
                    {pet.price?.toLocaleString('vi-VN')}₫
                </Text>

                {showSimilarityScore && (
                    <View style={styles.similarityInfo}>
                        <Ionicons
                            name="analytics-outline"
                            size={12}
                            color={getSimilarityColor(pet.similarityScore)}
                        />
                        <Text style={[
                            styles.similarityText,
                            { color: getSimilarityColor(pet.similarityScore) }
                        ]}>
                            {getSimilarityLabel(pet.similarityScore)}
                        </Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#2563EB" />
                <Text style={styles.loadingText}>Đang tìm thú cưng tương tự...</Text>
            </View>
        );
    }

    if (similarPets.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Không có thú cưng tương tự</Text>
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
                {similarPets.map(renderSimilarPet)}
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
    petItem: {
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
    petImage: {
        width: '100%',
        height: '100%',
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
    },
    similarityBadge: {
        position: 'absolute',
        top: 8,
        left: 8,
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 12,
        minWidth: 24,
        alignItems: 'center',
    },
    similarityBadgeText: {
        fontSize: 10,
        color: '#fff',
        fontWeight: '700',
    },
    petTypeBadge: {
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
    petTypeBadgeText: {
        fontSize: 12,
    },
    petInfo: {
        padding: 12,
    },
    petName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
        lineHeight: 18,
    },
    petBreed: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 4,
    },
    petPrice: {
        fontSize: 13,
        fontWeight: '700',
        color: '#EF4444',
        marginBottom: 6,
    },
    similarityInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    similarityText: {
        fontSize: 11,
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

export default SimilarPets;