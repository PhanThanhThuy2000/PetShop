// app/screens/PetAllScreen.tsx
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    RefreshControl,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import FeatherIcon from 'react-native-vector-icons/Feather';

// Import API service
import { petsService } from '../services/petsService';
import { Pet } from '../types';

type PetCardProps = {
    item: Pet;
};

const PetCard = ({ item }: PetCardProps) => {
    const navigation = useNavigation<any>();
    
    // Lấy hình ảnh đầu tiên từ mảng images
    const imageUrl = item.images && item.images.length > 0 
        ? item.images[0].url 
        : 'https://via.placeholder.com/200x160?text=No+Image';

    return (
        <TouchableOpacity
            style={styles.cardContainer}
            onPress={() => navigation.navigate('ProductDetail', { productId: item._id })}
        >
            <Image 
                source={{ uri: imageUrl }} 
                style={styles.cardImage}
                defaultSource={{ uri: 'https://via.placeholder.com/200x160?text=Loading...' }}
            />
            <View style={styles.cardDetails}>
                <Text style={styles.cardName} numberOfLines={2}>
                    {item.name}
                </Text>
                <Text style={styles.cardPrice}>
                    {typeof item.price === 'number' 
                        ? `${item.price.toLocaleString('vi-VN')}đ` 
                        : `${item.price}đ`
                    }
                </Text>
                {item.breed_id && (
                    <Text style={styles.cardBreed}>
                        Giống: {typeof item.breed_id === 'object' ? item.breed_id.name : item.breed_id}
                    </Text>
                )}
            </View>
        </TouchableOpacity>
    );
};

const PetAllScreen = () => {
    const navigation = useNavigation<any>();

    // State management
    const [pets, setPets] = useState<Pet[]>([]);
    const [filteredPets, setFilteredPets] = useState<Pet[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(1);

    // Load dữ liệu pets từ API
    const loadPets = async (pageNumber: number = 1, isRefresh: boolean = false) => {
        try {
            if (pageNumber === 1) {
                setLoading(true);
            }
            setError(null);

            console.log(`🔄 Loading pets - Page: ${pageNumber}`);

            const response = await petsService.searchPets({
                page: pageNumber,
                limit: 20, // Load 20 pets mỗi lần
                keyword: searchQuery.trim() || undefined
            });

            if (response.success && response.data) {
                const newPets = response.data.pets || [];
                
                if (isRefresh || pageNumber === 1) {
                    // Refresh hoặc load lần đầu
                    setPets(newPets);
                    setFilteredPets(newPets);
                } else {
                    // Load more - thêm vào danh sách hiện tại
                    setPets(prev => [...prev, ...newPets]);
                    setFilteredPets(prev => [...prev, ...newPets]);
                }

                // Cập nhật pagination info
                const pagination = response.data.pagination;
                setHasMore(pagination?.hasNextPage || false);
                setPage(pageNumber);

                console.log(`✅ Loaded ${newPets.length} pets successfully`);
            } else {
                throw new Error(response.message || 'Không thể tải dữ liệu pets');
            }
        } catch (error: any) {
            console.error('❌ Load pets error:', error);
            setError(error.message || 'Có lỗi xảy ra khi tải dữ liệu');
            
            // Hiển thị thông báo lỗi
            Alert.alert(
                'Lỗi', 
                'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng và thử lại.',
                [{ text: 'OK' }]
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Tìm kiếm pets
    const searchPets = async (query: string) => {
        try {
            setLoading(true);
            setError(null);

            console.log(`🔍 Searching pets with query: "${query}"`);

            const response = await petsService.searchPets({
                keyword: query.trim(),
                page: 1,
                limit: 20
            });

            if (response.success && response.data) {
                const searchResults = response.data.pets || [];
                setPets(searchResults);
                setFilteredPets(searchResults);
                setPage(1);
                setHasMore(response.data.pagination?.hasNextPage || false);

                console.log(`✅ Found ${searchResults.length} pets`);
            }
        } catch (error: any) {
            console.error('❌ Search pets error:', error);
            setError('Không thể tìm kiếm. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    // Load more pets (pagination)
    const loadMorePets = () => {
        if (!loading && hasMore) {
            loadPets(page + 1, false);
        }
    };

    // Pull to refresh
    const onRefresh = () => {
        setRefreshing(true);
        setPage(1);
        loadPets(1, true);
    };

    // Effect: Load dữ liệu khi component mount
    useEffect(() => {
        loadPets(1, true);
    }, []);

    // Effect: Tìm kiếm khi searchQuery thay đổi
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchQuery.trim() === '') {
                // Nếu search rỗng, load lại tất cả pets
                loadPets(1, true);
            } else {
                // Tìm kiếm với query
                searchPets(searchQuery);
            }
        }, 500); // Debounce 500ms

        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    // Render loading state
    if (loading && pets.length === 0) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
                
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>All Pets</Text>
                    <View style={{ width: 24 }} />
                </View>

                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#004CFF" />
                    <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
            
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>All Pets</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Search Section */}
            <View style={styles.searchSection}>
                <View style={styles.searchContainer}>
                    <FeatherIcon name="search" size={20} color="#A0AEC0" style={styles.searchIcon} />
                    <TextInput 
                        placeholder="Tìm kiếm thú cưng..." 
                        style={styles.searchInput} 
                        placeholderTextColor="#A0AEC0"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        returnKeyType="search"
                        onSubmitEditing={() => searchPets(searchQuery)}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <FeatherIcon name="x" size={20} color="#A0AEC0" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Error State */}
            {error && (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={() => loadPets(1, true)}>
                        <Text style={styles.retryText}>Thử lại</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Pets List */}
            <FlatList
                data={filteredPets}
                renderItem={({ item }) => <PetCard item={item} />}
                keyExtractor={(item) => item._id}
                numColumns={2}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#004CFF']}
                        tintColor="#004CFF"
                    />
                }
                onEndReached={loadMorePets}
                onEndReachedThreshold={0.5}
                ListFooterComponent={() => (
                    loading && pets.length > 0 ? (
                        <View style={styles.footerLoading}>
                            <ActivityIndicator size="small" color="#004CFF" />
                            <Text style={styles.footerLoadingText}>Đang tải thêm...</Text>
                        </View>
                    ) : null
                )}
                ListEmptyComponent={
                    !loading ? (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>
                                {searchQuery ? 'Không tìm thấy kết quả nào' : 'Không có dữ liệu'}
                            </Text>
                        </View>
                    ) : null
                }
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
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eef0f2',
        paddingTop: 35
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#2d3748',
    },
    searchSection: {
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eef0f2',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        paddingHorizontal: 15,
        borderWidth: 1,
        borderColor: '#e2e8f0'
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        height: 48,
        fontSize: 16,
        color: '#2D3748'
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
    },
    errorContainer: {
        backgroundColor: '#FED7D7',
        margin: 16,
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    errorText: {
        color: '#C53030',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 10,
    },
    retryButton: {
        backgroundColor: '#E53E3E',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 6,
    },
    retryText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
    listContainer: {
        paddingHorizontal: 12,
        paddingTop: 16,
        paddingBottom: 20,
    },
    cardContainer: {
        flex: 1,
        margin: 8,
        backgroundColor: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#4A5568',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 3,
    },
    cardImage: {
        width: '100%',
        height: 160,
        backgroundColor: '#f7fafc',
    },
    cardDetails: {
        padding: 12,
    },
    cardName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#2d3748',
        marginBottom: 8,
        minHeight: 36,
    },
    cardPrice: {
        fontSize: 16,
        fontWeight: '700',
        color: '#e53e3e',
        marginBottom: 4,
    },
    cardBreed: {
        fontSize: 12,
        color: '#718096',
    },
    emptyContainer: {
        flex: 1,
        marginTop: 50,
        alignItems: 'center',
        justifyContent: 'center'
    },
    emptyText: {
        fontSize: 16,
        color: '#718096',
        textAlign: 'center',
    },
    footerLoading: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    footerLoadingText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#666',
    },
});

export default PetAllScreen;