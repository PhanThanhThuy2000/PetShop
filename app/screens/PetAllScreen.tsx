import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
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
} from 'react-native';
import FeatherIcon from 'react-native-vector-icons/Feather';
// import { pets as originalPets } from './HomeScreen'; // Import dữ liệu pet từ HomeScreen

// const pets = originalPets.map(pet => ({
//     ...pet,
//     price: typeof pet.price === 'string' ? Number(pet.price) : pet.price,
// }));

type Pet = {
    id: string;
    name: string;
    price: number;
    sold: number;
    image: string;
};

const PetCard = ({ item }: { item: Pet }) => {
    const navigation = useNavigation<any>();
    return (
        <TouchableOpacity
            style={styles.cardContainer}
            onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
        >
            <Image source={{ uri: item.image }} style={styles.cardImage} />
            <View style={styles.cardDetails}>
                <Text style={styles.cardName} numberOfLines={2}>{item.name}</Text>
                <Text style={styles.cardPrice}>{item.price}đ</Text>
                <Text style={styles.cardSold}>Đã bán {item.sold}+</Text>
            </View>
        </TouchableOpacity>
    );
};

const PetAllScreen = () => {
    const navigation = useNavigation<any>();

    // 1. Thêm state để quản lý text tìm kiếm và danh sách đã lọc
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredPets, setFilteredPets] = useState(pets);

    // 2. Thêm useEffect để lọc danh sách mỗi khi text tìm kiếm thay đổi
    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredPets(pets);
        } else {
            const filteredData = pets.filter(pet =>
                pet.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredPets(filteredData);
        }
    }, [searchQuery]);

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

            {/* 3. Thêm thanh tìm kiếm vào đây */}
            <View style={styles.searchSection}>
                <View style={styles.searchContainer}>
                    <FeatherIcon name="search" size={20} color="#A0AEC0" style={styles.searchIcon} />
                    <TextInput 
                        placeholder="Search for pets..." 
                        style={styles.searchInput} 
                        placeholderTextColor="#A0AEC0"
                        value={searchQuery}
                        onChangeText={setSearchQuery} // Cập nhật state khi gõ
                    />
                    <TouchableOpacity>
                        <FeatherIcon name="camera" size={20} color="#A0AEC0" style={styles.cameraIcon} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Danh sách thú cưng */}
            <FlatList
                // 4. Sử dụng danh sách đã lọc
                data={filteredPets}
                renderItem={({ item }) => <PetCard item={item} />}
                keyExtractor={item => item.id}
                numColumns={2}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                // Hiển thị thông báo nếu không có kết quả
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No pets found.</Text>
                    </View>
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
        paddingTop:35
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#2d3748',
    },
    // Styles cho thanh tìm kiếm
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
    cameraIcon: {
        marginLeft: 10,
    },
    searchInput: {
        flex: 1,
        height: 48,
        fontSize: 16,
        color: '#2D3748'
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
        marginBottom: 8,
    },
    cardSold: {
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
        color: '#718096'
    }
});

export default PetAllScreen;