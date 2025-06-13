import { MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Dimensions, FlatList, Image, ImageSourcePropType, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const DATA: Product[] = Array(8).fill({
    id: Math.random().toString(),
    image: require('../../assets/images/channgan.png'),
    sold: 50,
    name: 'Hamster',
    price: '1.000.000 đ',
});

const numColumns = 2;
const ITEM_WIDTH = (Dimensions.get('window').width - 48) / numColumns;

// Define Product type
interface Product {
    id: string;
    image: ImageSourcePropType;
    sold: number;
    name: string;
    price: string;
}

export default function SearchScreen() {
    const [search, setSearch] = useState('');

    const renderItem = ({ item }: { item: Product }) => (
        <View style={styles.card}>
            <Image source={item.image} style={styles.image} />
            <Text style={styles.sold}>Sold ({item.sold} Products)</Text>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.price}>{item.price}</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.searchBarRow}>
                <TouchableOpacity style={styles.iconButton}>
                    <MaterialIcons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <View style={styles.searchBarContainer}>
                    <TextInput
                        style={styles.searchBar}
                        placeholder="Search Product..."
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>
                <TouchableOpacity style={styles.iconButton}>
                    <MaterialIcons name="filter-list" size={24} color="#333" />
                </TouchableOpacity>
            </View>
            <FlatList
                data={DATA}
                renderItem={renderItem}
                keyExtractor={(_, idx) => idx.toString()}
                numColumns={numColumns}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        paddingTop: 40,
    },
    searchBarRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        marginBottom: 12,
    },
    iconButton: {
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchBarContainer: {
        flex: 1,
        paddingHorizontal: 8,
    },
    searchBar: {
        height: 36,
        backgroundColor: '#f2f2f2',
        borderRadius: 8,
        paddingHorizontal: 12,
        fontSize: 14,
    },
    listContent: {
        paddingHorizontal: 12,
        paddingBottom: 16,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
        margin: 10,
        alignItems: 'flex-start',
        width: ITEM_WIDTH,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    image: {
        width: '100%',
        height: 90,
        borderRadius: 10,
        marginBottom: 8,
    },
    sold: {
        color: '#888',
        fontSize: 13,
        marginBottom: 2,
    },
    name: {
        fontWeight: 'bold',
        fontSize: 15,
        marginBottom: 2,
    },
    price: {
        color: '#d60000',
        fontWeight: 'bold',
        fontSize: 16,
    },
});