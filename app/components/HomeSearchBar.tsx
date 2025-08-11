// app/components/HomeSearchBar.tsx
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    FlatList,
    Image,
    Keyboard,
    Modal,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { petsService } from '../services/api-services';
import { productsService } from '../services/productsService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface SearchSuggestion {
    id: string;
    type: 'product' | 'pet' | 'category' | 'recent';
    title: string;
    subtitle?: string;
    imageUri?: string;
    price?: number;
}

interface HomeSearchBarProps {
    onSearchFocus?: () => void;
    onSearchBlur?: () => void;
    placeholder?: string;
}

const HomeSearchBar: React.FC<HomeSearchBarProps> = ({
    onSearchFocus,
    onSearchBlur,
    placeholder = "Tìm kiếm thú cưng, sản phẩm..."
}) => {
    const navigation = useNavigation();
    const [searchQuery, setSearchQuery] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const [popularSearches] = useState([
        'Chó Golden', 'Mèo Ba Tư', 'Thức ăn cho chó', 'Đồ chơi mèo',
        'Poodle', 'Husky', 'Phụ kiện thú cưng', 'Vitamin'
    ]);
    const [isLoading, setIsLoading] = useState(false);

    // NEW: Quick word suggestions based on input
    const [wordSuggestions, setWordSuggestions] = useState<string[]>([]);

    // Common search terms database
    const commonSearchTerms = [
        'chó', 'mèo', 'thức ăn', 'đồ chơi', 'phụ kiện', 'vitamin', 'thuốc', 'lồng',
        'Golden Retriever', 'Poodle', 'Husky', 'Shiba', 'Corgi', 'Bulldog',
        'Mèo Ba Tư', 'Mèo Anh', 'Mèo Nga', 'British Shorthair', 'Scottish Fold',
        'thức ăn khô', 'thức ăn ướt', 'snack', 'bánh thưởng', 'sữa',
        'đồ chơi cao su', 'bóng tennis', 'dây kéo', 'vòng cổ', 'rọ mõm',
        'shampoo', 'lược', 'kéo cắt móng', 'thuốc tẩy giun', 'vitamin tổng hợp'
    ];

    const searchInputRef = useRef<TextInput>(null);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const searchTimeout = useRef<NodeJS.Timeout | null>(null);

    // Load recent searches from storage
    useEffect(() => {
        loadRecentSearches();
    }, []);

    // NEW: Generate word suggestions based on input
    useEffect(() => {
        if (searchQuery.trim()) {
            const filtered = commonSearchTerms.filter(term =>
                term.toLowerCase().includes(searchQuery.toLowerCase()) &&
                term.toLowerCase() !== searchQuery.toLowerCase()
            ).slice(0, 5);
            setWordSuggestions(filtered);
        } else {
            setWordSuggestions([]);
        }
    }, [searchQuery]);

    const loadRecentSearches = async () => {
        try {
            const recent = await AsyncStorage.getItem('recent_searches');
            if (recent) {
                setRecentSearches(JSON.parse(recent));
            }
        } catch (error) {
            console.log('Error loading recent searches:', error);
        }
    };

    const saveRecentSearch = async (query: string) => {
        try {
            const trimmedQuery = query.trim();
            if (!trimmedQuery) return;

            let updatedRecent = [trimmedQuery, ...recentSearches.filter(item => item !== trimmedQuery)];
            updatedRecent = updatedRecent.slice(0, 10); // Keep only 10 recent searches

            setRecentSearches(updatedRecent);
            await AsyncStorage.setItem('recent_searches', JSON.stringify(updatedRecent));
        } catch (error) {
            console.log('Error saving recent search:', error);
        }
    };

    const clearRecentSearches = async () => {
        try {
            setRecentSearches([]);
            await AsyncStorage.removeItem('recent_searches');
        } catch (error) {
            console.log('Error clearing recent searches:', error);
        }
    };

    // NEW: Delete individual recent search
    const deleteRecentSearch = async (searchToDelete: string) => {
        try {
            const updatedRecent = recentSearches.filter(item => item !== searchToDelete);
            setRecentSearches(updatedRecent);
            await AsyncStorage.setItem('recent_searches', JSON.stringify(updatedRecent));
        } catch (error) {
            console.log('Error deleting recent search:', error);
        }
    };

    // Search suggestions with debouncing
    const fetchSuggestions = useCallback(async (query: string) => {
        if (!query.trim()) {
            setSuggestions([]);
            return;
        }

        setIsLoading(true);
        try {
            // Search both products and pets concurrently
            const [productsResponse, petsResponse] = await Promise.allSettled([
                productsService.searchProducts({ keyword: query, limit: 3 }),
                petsService.searchPets(query, { limit: 3 })
            ]);

            const suggestions: SearchSuggestion[] = [];

            // Add product suggestions
            if (productsResponse.status === 'fulfilled' && productsResponse.value.success) {
                const products = productsResponse.value.data?.products || productsResponse.value.data || [];
                products.forEach(product => {
                    suggestions.push({
                        id: product._id,
                        type: 'product',
                        title: product.name,
                        subtitle: `${product.price?.toLocaleString('vi-VN')} đ`,
                        imageUri: product.images?.[0]?.url,
                        price: product.price,
                    });
                });
            }

            // Add pet suggestions
            if (petsResponse.status === 'fulfilled' && petsResponse.value.success) {
                const pets = petsResponse.value.data || [];
                pets.forEach(pet => {
                    suggestions.push({
                        id: pet._id,
                        type: 'pet',
                        title: pet.name,
                        subtitle: `${pet.breed_id?.name || pet.breed || ''} • ${pet.price?.toLocaleString('vi-VN')} đ`,
                        imageUri: pet.images?.[0]?.url,
                        price: pet.price,
                    });
                });
            }

            setSuggestions(suggestions);
        } catch (error) {
            console.log('Error fetching suggestions:', error);
            setSuggestions([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleSearchChange = useCallback((text: string) => {
        setSearchQuery(text);

        // Clear previous timeout
        if (searchTimeout.current) {
            clearTimeout(searchTimeout.current);
        }

        // Debounce search for API suggestions
        searchTimeout.current = setTimeout(() => {
            fetchSuggestions(text);
        }, 300);
    }, [fetchSuggestions]);

    const handleFocus = () => {
        setIsFocused(true);
        setShowModal(true);
        onSearchFocus?.();

        // Animate modal
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const handleBlur = () => {
        setIsFocused(false);
        onSearchBlur?.();
    };

    // UPDATED: Only close modal with back button, not by tapping outside
    const closeModal = () => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 150,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 50,
                duration: 150,
                useNativeDriver: true,
            }),
        ]).start(() => {
            setShowModal(false);
            setSearchQuery('');
            setSuggestions([]);
            setWordSuggestions([]);
            searchInputRef.current?.blur();
            Keyboard.dismiss();
        });
    };

    const performSearch = (query: string) => {
        const trimmedQuery = query.trim();
        if (!trimmedQuery) return;

        saveRecentSearch(trimmedQuery);
        closeModal();

        // Navigate to SearchScreen
        navigation.navigate('SearchScreen', {
            searchQuery: trimmedQuery,
            searchType: 'all'
        });
    };

    const handleSuggestionPress = (suggestion: SearchSuggestion) => {
        closeModal();

        if (suggestion.type === 'product') {
            navigation.navigate('ProductDetail', { productId: suggestion.id });
        } else if (suggestion.type === 'pet') {
            navigation.navigate('PetDetail', { id: suggestion.id });
        } else if (suggestion.type === 'recent') {
            setSearchQuery(suggestion.title);
            performSearch(suggestion.title);
        }
    };

    const openCamera = () => {
        // TODO: Implement camera search functionality
        console.log('Open camera for visual search');
    };

    // NEW: Render word suggestions
    const renderWordSuggestions = () => {
        if (wordSuggestions.length === 0) return null;

        return (
            <View style={styles.wordSuggestionsContainer}>
                <Text style={styles.wordSuggestionsTitle}>Gợi ý từ khóa</Text>
                <View style={styles.wordSuggestionsWrapper}>
                    {wordSuggestions.map((word, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.wordSuggestionChip}
                            onPress={() => {
                                setSearchQuery(word);
                                performSearch(word);
                            }}
                        >
                            <Text style={styles.wordSuggestionText}>{word}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        );
    };

    const renderSuggestionItem = ({ item }: { item: SearchSuggestion }) => (
        <TouchableOpacity
            style={styles.suggestionItem}
            onPress={() => handleSuggestionPress(item)}
        >
            <View style={styles.suggestionContent}>
                {item.imageUri ? (
                    <Image source={{ uri: item.imageUri }} style={styles.suggestionImage} />
                ) : (
                    <View style={[styles.suggestionImage, styles.placeholderImage]}>
                        <MaterialIcons
                            name={item.type === 'product' ? 'shopping-bag' : 'pets'}
                            size={20}
                            color="#9CA3AF"
                        />
                    </View>
                )}

                <View style={styles.suggestionText}>
                    <Text style={styles.suggestionTitle} numberOfLines={1}>
                        {item.title}
                    </Text>
                    {item.subtitle && (
                        <Text style={styles.suggestionSubtitle} numberOfLines={1}>
                            {item.subtitle}
                        </Text>
                    )}
                </View>

                <View style={styles.suggestionMeta}>
                    <View style={[styles.typeTag,
                    item.type === 'product' ? styles.productTag : styles.petTag
                    ]}>
                        <Text style={[styles.typeTagText,
                        item.type === 'product' ? styles.productTagText : styles.petTagText
                        ]}>
                            {item.type === 'product' ? 'SP' : 'TC'}
                        </Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );

    // UPDATED: Recent search item with delete option
    const renderRecentSearchItem = ({ item }: { item: string }) => (
        <TouchableOpacity
            style={styles.recentItem}
            onPress={() => {
                setSearchQuery(item);
                performSearch(item);
            }}
        >
            <MaterialIcons name="history" size={20} color="#9CA3AF" />
            <Text style={styles.recentText}>{item}</Text>
            <View style={styles.recentActions}>
                <TouchableOpacity
                    style={styles.insertButton}
                    onPress={() => setSearchQuery(item)}
                >
                    <MaterialIcons name="arrow-upward" size={16} color="#6B7280" />
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => deleteRecentSearch(item)}
                >
                    <MaterialIcons name="close" size={16} color="#EF4444" />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    const renderPopularSearchItem = ({ item }: { item: string }) => (
        <TouchableOpacity
            style={styles.popularChip}
            onPress={() => {
                setSearchQuery(item);
                performSearch(item);
            }}
        >
            <Text style={styles.popularChipText}>{item}</Text>
        </TouchableOpacity>
    );

    return (
        <>
            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <TouchableOpacity
                    style={styles.searchBar}
                    onPress={handleFocus}
                >
                    <Icon name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
                    <TextInput
                        ref={searchInputRef}
                        style={styles.searchInput}
                        placeholder={placeholder}
                        placeholderTextColor="#9CA3AF"
                        value={searchQuery}
                        onChangeText={handleSearchChange}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        onSubmitEditing={() => performSearch(searchQuery)}
                        returnKeyType="search"
                        blurOnSubmit={false}
                    />
                    <TouchableOpacity
                        style={styles.cameraButton}
                        onPress={openCamera}
                    >
                        <Icon name="camera" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                </TouchableOpacity>
            </View>

            {/* Search Modal */}
            <Modal
                visible={showModal}
                transparent={true}
                animationType="none"
                onRequestClose={closeModal}
            >
                {/* UPDATED: Remove onPress from overlay to prevent closing */}
                <View style={styles.modalOverlay}>
                    <Animated.View
                        style={[
                            styles.modalContent,
                            {
                                opacity: fadeAnim,
                                transform: [{ translateY: slideAnim }]
                            }
                        ]}
                    >
                        <SafeAreaView style={styles.modalSafeArea}>
                            {/* UPDATED: Modal Header with back icon */}
                            <View style={styles.modalHeader}>
                                <TouchableOpacity
                                    style={styles.backButton}
                                    onPress={closeModal}
                                >
                                    <MaterialIcons name="arrow-back" size={24} color="#374151" />
                                </TouchableOpacity>
                                <View style={styles.modalSearchBar}>
                                    <Icon name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
                                    <TextInput
                                        style={styles.modalSearchInput}
                                        placeholder={placeholder}
                                        placeholderTextColor="#9CA3AF"
                                        value={searchQuery}
                                        onChangeText={handleSearchChange}
                                        onSubmitEditing={() => performSearch(searchQuery)}
                                        returnKeyType="search"
                                        autoFocus={true}
                                    />
                                    {searchQuery ? (
                                        <TouchableOpacity
                                            style={styles.clearButton}
                                            onPress={() => {
                                                setSearchQuery('');
                                                setSuggestions([]);
                                                setWordSuggestions([]);
                                            }}
                                        >
                                            <MaterialIcons name="close" size={20} color="#9CA3AF" />
                                        </TouchableOpacity>
                                    ) : null}
                                </View>
                            </View>

                            {/* Search Content */}
                            <View style={styles.searchContent}>
                                {isLoading ? (
                                    <View style={styles.loadingContainer}>
                                        <Text style={styles.loadingText}>Đang tìm kiếm...</Text>
                                    </View>
                                ) : (
                                    <>
                                        {/* NEW: Word suggestions when typing */}
                                        {renderWordSuggestions()}

                                        {suggestions.length > 0 ? (
                                            // Search Suggestions
                                            <View style={styles.section}>
                                                <Text style={styles.sectionTitle}>Kết quả gợi ý</Text>
                                                <FlatList
                                                    data={suggestions}
                                                    renderItem={renderSuggestionItem}
                                                    keyExtractor={(item) => `${item.type}-${item.id}`}
                                                    showsVerticalScrollIndicator={false}
                                                    keyboardShouldPersistTaps="handled"
                                                />
                                            </View>
                                        ) : searchQuery.length > 2 ? (
                                            // No API Results but show search button
                                            <View style={styles.noResultsContainer}>
                                                <MaterialIcons name="search" size={48} color="#D1D5DB" />
                                                <Text style={styles.noResultsText}>Tìm kiếm "{searchQuery}"</Text>
                                                <TouchableOpacity
                                                    style={styles.searchButton}
                                                    onPress={() => performSearch(searchQuery)}
                                                >
                                                    <Icon name="search" size={20} color="#FFFFFF" />
                                                    <Text style={styles.searchButtonText}>Tìm kiếm</Text>
                                                </TouchableOpacity>
                                            </View>
                                        ) : (
                                            // Default Content
                                            <View style={styles.defaultContent}>
                                                {/* Recent Searches */}
                                                {recentSearches.length > 0 && (
                                                    <View style={styles.section}>
                                                        <View style={styles.sectionHeader}>
                                                            <Text style={styles.sectionTitle}>Tìm kiếm gần đây</Text>
                                                            <TouchableOpacity onPress={clearRecentSearches}>
                                                                <Text style={styles.clearAllText}>Xóa tất cả</Text>
                                                            </TouchableOpacity>
                                                        </View>
                                                        <FlatList
                                                            data={recentSearches}
                                                            renderItem={renderRecentSearchItem}
                                                            keyExtractor={(item, index) => `recent-${index}`}
                                                            showsVerticalScrollIndicator={false}
                                                            keyboardShouldPersistTaps="handled"
                                                        />
                                                    </View>
                                                )}

                                                {/* Popular Searches */}
                                                <View style={styles.section}>
                                                    <Text style={styles.sectionTitle}>Tìm kiếm phổ biến</Text>
                                                    <View style={styles.popularContainer}>
                                                        {popularSearches.map((item, index) => (
                                                            <TouchableOpacity
                                                                key={index}
                                                                style={styles.popularChip}
                                                                onPress={() => {
                                                                    setSearchQuery(item);
                                                                    performSearch(item);
                                                                }}
                                                            >
                                                                <Text style={styles.popularChipText}>{item}</Text>
                                                            </TouchableOpacity>
                                                        ))}
                                                    </View>
                                                </View>
                                            </View>
                                        )}
                                    </>
                                )}
                            </View>
                        </SafeAreaView>
                    </Animated.View>
                </View>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    // Main Search Bar
    searchContainer: {
        paddingHorizontal: 20,
        marginTop: 10,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
    },
    searchIcon: {
        marginRight: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#1F2937',
        paddingVertical: 0,
    },
    cameraButton: {
        marginLeft: 12,
        padding: 4,
    },

    // Modal Overlay
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        marginTop: 44, // Status bar height
    },
    modalSafeArea: {
        flex: 1,
    },

    // UPDATED: Modal Header with back button
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        backgroundColor: '#FFFFFF',
    },
    backButton: {
        padding: 8,
        marginRight: 8,
    },
    modalSearchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    modalSearchInput: {
        flex: 1,
        fontSize: 16,
        color: '#1F2937',
        paddingVertical: 0,
        marginLeft: 8,
    },
    clearButton: {
        padding: 4,
    },

    // Search Content
    searchContent: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    section: {
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 12,
    },
    clearAllText: {
        fontSize: 14,
        color: '#6B7280',
    },

    // NEW: Word suggestions
    wordSuggestionsContainer: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    wordSuggestionsTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
        marginBottom: 8,
    },
    wordSuggestionsWrapper: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    wordSuggestionChip: {
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        marginRight: 8,
        marginBottom: 4,
        borderWidth: 1,
        borderColor: '#DBEAFE',
    },
    wordSuggestionText: {
        fontSize: 14,
        color: '#1D4ED8',
        fontWeight: '500',
    },

    // Suggestion Items
    suggestionItem: {
        marginBottom: 12,
    },
    suggestionContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    suggestionImage: {
        width: 48,
        height: 48,
        borderRadius: 8,
        marginRight: 12,
    },
    placeholderImage: {
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    suggestionText: {
        flex: 1,
    },
    suggestionTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: '#1F2937',
        marginBottom: 2,
    },
    suggestionSubtitle: {
        fontSize: 14,
        color: '#6B7280',
    },
    suggestionMeta: {
        alignItems: 'flex-end',
    },
    typeTag: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    productTag: {
        backgroundColor: '#EFF6FF',
    },
    petTag: {
        backgroundColor: '#F0FDF4',
    },
    typeTagText: {
        fontSize: 12,
        fontWeight: '500',
    },
    productTagText: {
        color: '#1D4ED8',
    },
    petTagText: {
        color: '#16A34A',
    },

    // UPDATED: Recent Search Items with delete
    recentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    recentText: {
        flex: 1,
        fontSize: 16,
        color: '#374151',
        marginLeft: 12,
    },
    recentActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    insertButton: {
        padding: 4,
        marginRight: 8,
    },
    deleteButton: {
        padding: 4,
    },

    // Popular Searches
    popularContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 8,
    },
    popularChip: {
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
        marginBottom: 8,
    },
    popularChipText: {
        fontSize: 14,
        color: '#374151',
        fontWeight: '500',
    },

    // Loading & Empty States
    loadingContainer: {
        padding: 40,
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 16,
        color: '#6B7280',
        marginTop: 8,
    },
    noResultsContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    noResultsText: {
        fontSize: 18,
        fontWeight: '500',
        color: '#374151',
        marginTop: 16,
        textAlign: 'center',
        marginBottom: 16,
    },
    searchButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#3B82F6',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
        elevation: 2,
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    searchButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    defaultContent: {
        flex: 1,
    },
});

export default HomeSearchBar;