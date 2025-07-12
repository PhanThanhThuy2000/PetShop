// app/screens/PetAllScreen.tsx - Updated to support breed filtering
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
    FlatList,
    Image,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    ActivityIndicator,
    RefreshControl,
    Alert,
} from 'react-native';
import { petsService, SearchPetsParams } from '../services/petsService';
import { Pet } from '../types';

type RouteParams = {
    breedId?: string;
    breedName?: string;
    categoryId?: string;
    categoryName?: string;
};

const PetAllScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    
    // Get params from navigation
    const params = route.params as RouteParams || {};
    const { breedId, breedName, categoryId, categoryName } = params;

    // State management
    const [pets, setPets] = useState<Pet[]>([]);
    const [filteredPets, setFilteredPets] = useState<Pet[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    // Build initial filters based on navigation params
    const [filters, setFilters] = useState<SearchPetsParams>(() => {
        const initialFilters: SearchPetsParams = {
            status: 'available',
            sortBy: 'created_at',
            sortOrder: 'desc',
        };

        // Add breed filter if navigated from BreedsScreen
        if (breedId) {
            initialFilters.breed_id = breedId;
        }

        // Add category filter if available
        if (categoryId && !breedId) {
            initialFilters.categoryId = categoryId;
        }

        return initialFilters;
    });

    // Load pets when component mounts or filters change
    useEffect(() => {
        loadPets(true);
    }, [filters]);

    // Filter pets locally based on search query
    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredPets(pets);
        } else {
            const filtered = pets.filter(pet =>
                pet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (pet.description && pet.description.toLowerCase().includes(searchQuery.toLowerCase()))
            );
            setFilteredPets(filtered);
        }
    }, [searchQuery, pets]);

    // Load pets from API
    const loadPets = async (reset: boolean = false) => {
        if (loading && !refreshing) return;
        
        try {
            if (reset) {
                setLoading(true);
                setPage(1);
            }

            const currentPage = reset ? 1 : page;
            
            const response = await petsService.searchPets({
                ...filters,
                keyword: searchQuery || undefined,
                page: currentPage,
                limit: 10,
            });

            if (response.success) {
                const newPets = response.data.pets;
                const pagination = response.data.pagination;
                
                if (reset) {
                    setPets(newPets);
                } else {
                    setPets(prevPets => [...prevPets, ...newPets]);
                }
                
                setTotalCount(pagination.totalCount);
                setHasMore(pagination.hasNextPage);
                setPage(pagination.currentPage);
                
                console.log('✅ Pets loaded:', {
                    filters,
                    count: newPets.length,
                    total: pagination.totalCount,
                });
            } else {
                throw new Error(response.message || 'Failed to load pets');
            }
        } catch (error: any) {
            console.error('❌ Error loading pets:', error);
            Alert.alert(
                'Lỗi',
                'Không thể tải danh sách thú cưng. Vui lòng thử lại.',
                [{ text: 'OK' }]
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Handle refresh
    const handleRefresh = () => {
        setRefreshing(true);
        loadPets(true);
    };

    // Handle load more
    const handleLoadMore = () => {
        if (hasMore && !loading && searchQuery === '') {
            setPage(prevPage => prevPage + 1);
            loadPets(false);
        }
    };

    // Clear filters
    const clearFilters = () => {
        setFilters({
            status: 'available',
            sortBy: 'created_at',
            sortOrder: 'desc',
        });
        setSearchQuery('');
    };

    // Get screen title based on navigation params
    const getScreenTitle = () => {
        if (breedName) {
            return `${breedName}`;
        }
        if (categoryName) {
            return `${categoryName} Pets`;
        }
        return 'All Pets';
    };

    // Get filter description
    const getFilterDescription = () => {
        if (breedName && categoryName) {
            return `Giống ${breedName} trong ${categoryName}`;
        }
        if (breedName) {
            return `Tất cả ${breedName}`;
        }
        if (categoryName) {
            return `Tất cả thú cưng ${categoryName}`;
        }
        return 'Tất cả thú cưng';
    };

    // Render pet card
    const PetCard = ({ item }: { item: Pet }) => (
        <TouchableOpacity
            style={styles.cardContainer}
            onPress={() => navigation.navigate('ProductDetail', { 
                productId: item._id,
                productType: 'pet'
            })}
            activeOpacity={0.7}
        >
            <Image 
                source={{ 
                    uri: item.images?.[0]?.url || 'https://via.placeholder.com/150' 
                }} 
                style={styles.cardImage} 
            />
            <View style={styles.cardDetails}>
                <Text style={styles.cardName} numberOfLines={2}>{item.name}</Text>
                <Text style={styles.cardPrice}>
                    {item.price?.toLocaleString('vi-VN')}đ
                </Text>
                
                {/* Pet specific details */}
                <View style={styles.petDetails}>
                    {item.breed_id && typeof item.breed_id === 'object' && (
                        <Text style={styles.breedText} numberOfLines={1}>
                            {item.breed_id.name}
                        </Text>
                    )}
                    <View style={styles.petMeta}>
                        {item.age && (
                            <Text style={styles.metaText}>🎂 {item.age}t</Text>
                        )}
                        {item.gender && (
                            <Text style={styles.metaText}>
                                {item.gender === 'Male' ? '♂️' : '♀️'}
                            </Text>
                        )}
                    </View>
                </View>
                
                <View style={[
                    styles.statusBadge,
                    { backgroundColor: item.status === 'available' ? '#28a745' : '#dc3545' }
                ]}>
                    <Text style={styles.statusText}>
                        {item.status === 'available' ? 'Có sẵn' : 'Đã bán'}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    // Render empty state
    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="paw-outline" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>
                {searchQuery ? 'Không tìm thấy thú cưng nào' : 'Chưa có thú cưng nào'}
            </Text>
            <Text style={styles.emptySubtitle}>
                {searchQuery 
                    ? `Không có kết quả cho "${searchQuery}"`
                    : getFilterDescription()
                }
            </Text>
            {(breedId || categoryId) && (
                <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
                    <Text style={styles.clearButtonText}>Xem tất cả pets</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    // Render loading footer
    const renderFooter = () => {
        if (!loading || pets.length === 0 || searchQuery !== '') return null;
        
        return (
            <View style={styles.footerLoading}>
                <ActivityIndicator size="small" color="#0066cc" />
                <Text style={styles.loadingText}>Đang tải thêm...</Text>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
            
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity 
                    style={styles.backButton} 
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle} numberOfLines={1}>
                        {getScreenTitle()}
                    </Text>
                    <Text style={styles.headerSubtitle}>
                        {getFilterDescription()}
                    </Text>
                </View>
                <View style={{ width: 24 }} />
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <View style={styles.searchInputContainer}>
                    <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder={`Tìm kiếm ${breedName || 'thú cưng'}...`}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        returnKeyType="search"
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={20} color="#666" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Filter Info */}
            <View style={styles.filterInfo}>
                <Text style={styles.resultCount}>
                    {searchQuery 
                        ? `${filteredPets.length} kết quả cho "${searchQuery}"`
                        : `${totalCount} thú cưng`
                    }
                </Text>
                
                {(breedId || categoryId) && (
                    <TouchableOpacity onPress={clearFilters}>
                        <Text style={styles.clearFiltersText}>Xóa bộ lọc</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Pets Grid */}
            <FlatList
                data={searchQuery ? filteredPets : pets}
                renderItem={({ item }) => <PetCard item={item} />}
                keyExtractor={item => item._id}
                numColumns={2}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={['#0066cc']}
                    />
                }
                onEndReached={searchQuery ? undefined : handleLoadMore}
                onEndReachedThreshold={0.1}
                ListEmptyComponent={
                    !loading && pets.length === 0 ? renderEmptyState : null
                }
                ListFooterComponent={renderFooter}
            />

            {/* Loading Overlay */}
            {loading && pets.length === 0 && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#0066cc" />
                    <Text style={styles.loadingText}>
                        Đang tải {breedName || 'thú cưng'}...
                    </Text>
                </View>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: '#f8f9fa' 
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
    },
    backButton: {
        marginRight: 10,
    },
    headerContent: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#666',
        marginTop: 2,
    },
    searchContainer: {
        backgroundColor: '#fff',
        paddingHorizontal: 15,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
    },
    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: 25,
        paddingHorizontal: 15,
        paddingVertical: 8,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
    filterInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 10,
        backgroundColor: '#fff',
    },
    resultCount: {
        fontSize: 14,
        color: '#666',
    },
    clearFiltersText: {
        fontSize: 14,
        color: '#0066cc',
        fontWeight: '500',
    },
    listContainer: {
        padding: 10,
    },
    cardContainer: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 12,
        margin: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardImage: {
        width: '100%',
        height: 150,
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
    },
    cardDetails: {
        padding: 12,
    },
    cardName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 5,
    },
    cardPrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#e74c3c',
        marginBottom: 5,
    },
    petDetails: {
        marginBottom: 8,
    },
    breedText: {
        fontSize: 12,
        color: '#0066cc',
        fontWeight: '500',
        marginBottom: 3,
    },
    petMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    metaText: {
        fontSize: 12,
        color: '#666',
    },
    statusBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        color: '#fff',
        fontWeight: '500',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 40,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginTop: 15,
        marginBottom: 5,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 20,
    },
    clearButton: {
        backgroundColor: '#0066cc',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    clearButtonText: {
        color: '#fff',
        fontWeight: '500',
    },
    footerLoading: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 20,
    },
    loadingText: {
        marginLeft: 10,
        fontSize: 14,
        color: '#666',
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default PetAllScreen;