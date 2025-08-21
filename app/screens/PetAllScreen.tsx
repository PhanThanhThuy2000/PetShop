// app/screens/PetAllScreen.tsx - GIAO DIỆN ĐÃ TỐI ƯU
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
import PetList from '../components/Pet/PetList';
import { petsService } from '../services/petsService';
import { Pet } from '../types';

const PetAllScreen = () => {
    const navigation = useNavigation<any>();

    // State cho API data
    const [pets, setPets] = useState<Pet[]>([]);
    const [allPets, setAllPets] = useState<Pet[]>([]);
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

            const pages = [1, 2, 3];
            const allResults: Pet[] = [];

            for (const pageNum of pages) {
                try {
                    const response = await petsService.getPets({
                        page: pageNum,
                        limit: 20
                    });

                    if (response.data && response.data.length > 0) {
                        allResults.push(...response.data);
                    }

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
            setPets(allResults);

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
                limit: 50
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

        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }

        const timeout = setTimeout(() => {
            if (query.trim()) {
                searchPetsAPI(query.trim());
            } else {
                setPets(allPets);
            }
        }, 500);

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

    // Custom empty component
    const renderEmptyComponent = () => (
        <View style={styles.emptyContainer}>
            <View style={styles.emptyIconWrapper}>
                <FeatherIcon name="search" size={56} color="#E2E8F0" />
            </View>
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
                    activeOpacity={0.8}
                >
                    <Text style={styles.clearSearchText}>Xóa tìm kiếm</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.7}
                >
                    <Ionicons name="arrow-back" size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Thú cưng</Text>
                <View style={styles.placeholder} />
            </View>

            {/* Search Section */}
            <View style={styles.searchSection}>
                <View style={styles.searchContainer}>
                    <FeatherIcon name="search" size={18} color="#9CA3AF" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Tìm kiếm theo tên, giống..."
                        value={searchQuery}
                        onChangeText={handleSearch}
                        autoCapitalize="none"
                        placeholderTextColor="#9CA3AF"
                        returnKeyType="search"
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity
                            onPress={() => handleSearch('')}
                            style={styles.clearButton}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Results Info Bar */}
            <View style={styles.resultsBar}>
                <View style={styles.resultsInfo}>
                    <Text style={styles.resultsText}>
                        {searchQuery
                            ? `${pets.length} kết quả`
                            : `${pets.length} thú cưng`
                        }
                    </Text>
                    {loading && (
                        <View style={styles.loadingWrapper}>
                            <ActivityIndicator size="small" color="#3B82F6" />
                        </View>
                    )}
                </View>
                {searchQuery && (
                    <Text style={styles.searchTerm} numberOfLines={1}>
                        "{searchQuery}"
                    </Text>
                )}
            </View>

            {/* Error Message */}
            {error && (
                <View style={styles.errorContainer}>
                    <View style={styles.errorContent}>
                        <FeatherIcon name="alert-circle" size={20} color="#EF4444" />
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={loadAllPets}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.retryText}>Thử lại</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Pets List */}
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

            {/* Loading Overlay */}
            {refreshing && (
                <View style={styles.loadingOverlay}>
                    <View style={styles.loadingContent}>
                        <ActivityIndicator size="large" color="#3B82F6" />
                        <Text style={styles.loadingText}>Đang tải...</Text>
                    </View>
                </View>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
        borderBottomWidth: 0.5,
        borderBottomColor: '#E5E7EB',
        paddingTop: 30,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        letterSpacing: -0.2,
    },
    placeholder: {
        width: 40,
    },
    searchSection: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 0.5,
        borderBottomColor: '#E5E7EB',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.02,
        shadowRadius: 1,
        elevation: 1,
    },
    searchIcon: {
        marginRight: 12,
    },
    searchInput: {
        flex: 1,
        height: 44,
        fontSize: 15,
        color: '#1F2937',
        fontWeight: '400',
    },
    clearButton: {
        marginLeft: 8,
        padding: 4,
    },
    resultsBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 0.5,
        borderBottomColor: '#E5E7EB',
    },
    resultsInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    resultsText: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
    },
    loadingWrapper: {
        marginLeft: 8,
    },
    searchTerm: {
        fontSize: 13,
        color: '#3B82F6',
        fontWeight: '500',
        fontStyle: 'italic',
        maxWidth: 120,
    },
    errorContainer: {
        margin: 16,
        padding: 16,
        backgroundColor: '#FEF2F2',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FECACA',
    },
    errorContent: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    errorText: {
        color: '#DC2626',
        fontSize: 14,
        fontWeight: '500',
        marginLeft: 8,
        flex: 1,
    },
    retryButton: {
        backgroundColor: '#3B82F6',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
        alignSelf: 'center',
        shadowColor: '#3B82F6',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    retryText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    listWrapper: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    listContainer: {
        paddingHorizontal: 16,
        paddingTop: 20,
        paddingBottom: 24,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
        paddingTop: 80,
    },
    emptyIconWrapper: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 8,
        textAlign: 'center',
        letterSpacing: -0.2,
    },
    emptyText: {
        fontSize: 15,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 22,
        fontWeight: '400',
        marginBottom: 32,
        maxWidth: 280,
    },
    clearSearchBtn: {
        backgroundColor: '#3B82F6',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 24,
        shadowColor: '#3B82F6',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
    },
    clearSearchText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '600',
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
    },
    loadingContent: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 32,
        paddingVertical: 24,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 8,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
    },
});

export default PetAllScreen;