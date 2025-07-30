// app/screens/PetAllScreen.tsx - SỬA ĐỂ SỬ DỤNG PetList COMPONENT
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import FeatherIcon from 'react-native-vector-icons/Feather';

// Import API service, types và PetList component
import PetList from '../components/Pet/PetList'; // Import PetList component
import { petsService } from '../services/petsService';
import { Pet } from '../types';

const PetAllScreen = () => {
    const navigation = useNavigation<any>();

    // State cho API data
    const [pets, setPets] = useState<Pet[]>([]);
    const [allPets, setAllPets] = useState<Pet[]>([]); // Store all pets for local search
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

    // Load all pets từ API để có data cho search
    const loadAllPets = async () => {
        try {
            setLoading(true);
            setError(null);

            // Load nhiều trang để có đủ data cho search local
            const pages = [1, 2, 3]; // Load 3 trang đầu
            const allResults: Pet[] = [];

            for (const pageNum of pages) {
                try {
                    const response = await petsService.getPets({
                        page: pageNum,
                        limit: 20 // Tăng limit để lấy nhiều data hơn
                    });

                    if (response.data && response.data.length > 0) {
                        allResults.push(...response.data);
                    }

                    // Nếu page này trả về ít hơn limit thì không có page tiếp theo
                    if (response.data.length < 20) {
                        break;
                    }
                } catch (err) {
                    console.log(`Không thể load page ${pageNum}:`, err);
                    break;
                }
            }

            console.log('✅ Loaded all pets:', allResults.length);
            setAllPets(allResults);
            setPets(allResults); // Hiển thị tất cả ban đầu

        } catch (err: any) {
            console.error('❌ Load all pets error:', err);
            setError('Không thể tải dữ liệu thú cưng');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Tìm kiếm API khi có từ khóa
    const searchPetsAPI = async (keyword: string) => {
        try {
            setLoading(true);
            setError(null);

            console.log('🔍 Searching pets with keyword:', keyword);

            const response = await petsService.searchPets({
                keyword: keyword,
                page: 1,
                limit: 50 // Tăng limit để có nhiều kết quả hơn
            });

            if (response.data && response.data.pets) {
                console.log('✅ Search results:', response.data.pets.length);
                setPets(response.data.pets);
            } else {
                console.log('🔍 No search results from API');
                setPets([]);
            }

        } catch (err: any) {
            console.error('❌ Search pets error:', err);

            // Fallback to local search nếu API search fail
            console.log('🔄 Falling back to local search');
            performLocalSearch(keyword);
        } finally {
            setLoading(false);
        }
    };

    // Tìm kiếm local backup
    const performLocalSearch = (keyword: string) => {
        if (!keyword.trim()) {
            setPets(allPets);
            return;
        }

        const filtered = allPets.filter(pet =>
            pet.name.toLowerCase().includes(keyword.toLowerCase()) ||
            (pet.breed_id?.name && pet.breed_id.name.toLowerCase().includes(keyword.toLowerCase())) ||
            (pet.type && pet.type.toLowerCase().includes(keyword.toLowerCase()))
        );

        console.log(`🔍 Local search "${keyword}" found: ${filtered.length} pets`);
        setPets(filtered);
    };

    // Handle search với debounce
    const handleSearch = (query: string) => {
        setSearchQuery(query);

        // Clear previous timeout
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }

        // Set new timeout
        const timeout = setTimeout(() => {
            if (query.trim()) {
                searchPetsAPI(query.trim());
            } else {
                setPets(allPets); // Show all pets when no search
            }
        }, 500); // 500ms debounce

        setSearchTimeout(timeout);
    };

    // Handle pet press - navigate to detail
    const handlePetPress = (pet: Pet) => {
        navigation.navigate('ProductDetail', {
            petId: pet._id,
            pet: pet
        });
    };

    // Initial load
    useEffect(() => {
        loadAllPets();

        // Cleanup timeout on unmount
        return () => {
            if (searchTimeout) {
                clearTimeout(searchTimeout);
            }
        };
    }, []);

    // Refresh
    const onRefresh = () => {
        setRefreshing(true);
        setSearchQuery('');
        loadAllPets();
    };

    // Custom empty component với search context
    const renderEmptyComponent = () => (
        <View style={styles.emptyContainer}>
            <FeatherIcon name="search" size={48} color="#CBD5E0" />
            <Text style={styles.emptyTitle}>
                {searchQuery
                    ? `Không tìm thấy thú cưng nào`
                    : 'Chưa có thú cưng nào'
                }
            </Text>
            <Text style={styles.emptyText}>
                {searchQuery
                    ? `Không có kết quả cho "${searchQuery}"`
                    : 'Hãy quay lại sau để xem thêm thú cưng mới'
                }
            </Text>
            {searchQuery && (
                <TouchableOpacity
                    style={styles.clearSearchBtn}
                    onPress={() => handleSearch('')}
                >
                    <Text style={styles.clearSearchText}>Xóa tìm kiếm</Text>
                </TouchableOpacity>
            )}
        </View>
    );

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
                <Text style={styles.headerTitle}>Pet All</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Search Box */}
            <View style={styles.searchSection}>
                <View style={styles.searchContainer}>
                    <FeatherIcon name="search" size={20} color="#A0AEC0" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search Pet..."
                        value={searchQuery}
                        onChangeText={handleSearch}
                        autoCapitalize="none"
                        placeholderTextColor="#A0AEC0"
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity
                            onPress={() => handleSearch('')}
                            style={styles.clearButton}
                        >
                            <Ionicons name="close-circle" size={20} color="#A0AEC0" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Search Info */}
            <View style={styles.searchInfo}>
                <Text style={styles.searchInfoText}>
                    {searchQuery
                        ? `Tìm thấy ${pets.length} kết quả cho "${searchQuery}"`
                        : `Hiển thị ${pets.length} thú cưng`
                    }
                </Text>
                {loading && <ActivityIndicator size="small" color="#2563EB" style={styles.loadingIndicator} />}
            </View>

            {/* Error Message */}
            {error && (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={loadAllPets}
                    >
                        <Text style={styles.retryText}>Thử lại</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Pets List - SỬ DỤNG PetList COMPONENT */}
            <View style={styles.listWrapper}>
                <PetList
                    pets={pets}
                    loading={loading && pets.length === 0}
                    numColumns={2}
                    onPetPress={handlePetPress}
                    itemStyle="grid"
                    contentContainerStyle={styles.listContainer}
                    ListEmptyComponent={renderEmptyComponent}
                />
            </View>

            {/* Pull to refresh overlay */}
            {refreshing && (
                <View style={styles.refreshOverlay}>
                    <ActivityIndicator size="large" color="#2563EB" />
                </View>
            )}
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
        paddingTop: 35,
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
    clearButton: {
        marginLeft: 10,
        padding: 4,
    },
    searchInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eef0f2',
    },
    searchInfoText: {
        fontSize: 14,
        color: '#6B7280',
    },
    loadingIndicator: {
        marginLeft: 8,
    },
    errorContainer: {
        margin: 16,
        padding: 16,
        backgroundColor: '#FEF2F2',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#FECACA',
    },
    errorText: {
        color: '#DC2626',
        textAlign: 'center',
        marginBottom: 8,
    },
    retryButton: {
        backgroundColor: '#2563EB',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 6,
        alignSelf: 'center',
    },
    retryText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    listWrapper: {
        flex: 1,
    },
    listContainer: {
        paddingHorizontal: 12,
        paddingTop: 16,
        paddingBottom: 20,
    },
    // Custom empty styles cho context cụ thể
    emptyContainer: {
        flex: 1,
        marginTop: 100,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
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
        marginBottom: 20,
    },
    clearSearchBtn: {
        backgroundColor: '#2563EB',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 6,
    },
    clearSearchText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    refreshOverlay: {
        position: 'absolute',
        top: 100,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 1000,
    },
});

export default PetAllScreen;