import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { FlatList, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

const categories = [
    { id: '1', name: 'Hamster', image: 'https://hoseiki.vn/wp-content/uploads/2025/03/meo-cute-12.jpg' },
    { id: '2', name: 'Dog', image: 'https://phongvu.vn/cong-nghe/wp-content/uploads/2024/09/Meme-meo-bua-21.jpg' },
    { id: '3', name: 'Cat', image: 'https://sieupet.com/sites/default/files/pictures/images/1-1473150685951-5.jpg' },
    { id: '4', name: 'Rabbit', image: 'https://hoanghamobile.com/tin-tuc/wp-content/uploads/2024/04/anh-con-cho-28.jpg' },
];

const PetShopScreen = () => {
    const navigation = useNavigation();

    const renderCategory = ({ item }: { item: { id: string; name: string; image: string } }) => (
        <TouchableOpacity style={styles.categoryItem}>
            <Image source={{ uri: item.image }} style={styles.categoryImage} />
            <Text style={styles.categoryText}>{item.name}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Shop</Text>
                <View style={styles.searchContainer}>
                    <TextInput style={styles.searchInput} placeholder="Search" />
                    <Icon name="camera" style={styles.cameraIcon} />
                </View>
            </View>
            <View style={styles.bannerContainer}>
                <Image source={require('@/assets/images/banner-home.png')} style={styles.bannerImage} />
            </View>
            <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
                <TouchableOpacity style={styles.filterButton}>
                    <Image source={require('@/assets/images/dog-icon.png')} style={styles.iconDog} />
                    <Text style={styles.filterText}>Dog</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.filterButton}>
                    <Image source={require('@/assets/images/cat-icon.png')} style={styles.iconCat} />
                    <Text style={styles.filterText}>Cat</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.filterButton}>
                    <Image source={require('@/assets/images/item.png')} style={styles.iconCat} />
                    <Text style={styles.filterText}>Item</Text>
                </TouchableOpacity>
            </ScrollView>
            <View style={styles.seeAllContainer}>
                <TouchableOpacity style={styles.seeAllButton}>
                    <Text style={styles.seeAllText}>See All</Text>
                    <Text style={styles.arrowRight}>
                        <Icon name="arrow-right" size={15} color="#fff" />
                    </Text>
                </TouchableOpacity>
            </View>
            <FlatList
                data={categories}
                renderItem={renderCategory}
                keyExtractor={item => item.id}
                numColumns={2}
                columnWrapperStyle={styles.row}
                contentContainerStyle={styles.listContainer}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff', marginTop: 20 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
    headerTitle: { fontSize: 24, fontWeight: 'bold' },
    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f1f1', borderRadius: 10, padding: 5, width: '70%' },
    searchInput: { flex: 1, height: 20, fontSize: 16 },
    cameraIcon: { width: 20, height: 20, tintColor: '#1e90ff', alignItems: "center", lineHeight: 20, fontSize: 15, color: "#0042E0" },
    bannerContainer: { padding: 10, alignItems: 'center' },
    iconCat: { width: 30, height: 20 },
    iconDog: { width: 30, height: 20 },
    bannerImage: { width: '100%', height: 120, resizeMode: 'cover', borderRadius: 10 },
    filterContainer: { flexDirection: 'row', padding: 10, backgroundColor: '#f9f9f9' },
    filterButton: { flexDirection: 'row', paddingHorizontal: 30, paddingVertical: 10, backgroundColor: '#fff', borderRadius: 20, borderWidth: 1, borderColor: '#ddd', alignItems: 'center', marginRight: 10 },
    activeFilter: { backgroundColor: '#ffcc00' },
    filterText: { fontSize: 16, height: 20, lineHeight: 20 },
    seeAllContainer: { alignItems: 'flex-end' },
    seeAllButton: { padding: 10, flexDirection: 'row', alignItems: 'center' },
    seeAllText: { color: '#000', fontSize: 16, marginRight: 5 },
    arrowRight: { color: '#fff', fontSize: 16, backgroundColor: '#004CFF', borderRadius: 20, padding: 5 },
    row: { justifyContent: 'space-around' },
    listContainer: { paddingBottom: 10 },
    categoryItem: { alignItems: 'center', margin: 10 },
    categoryImage: { width: 100, height: 100, borderRadius: 10 },
    categoryText: { marginTop: 5, fontSize: 16 },
});

export default PetShopScreen;