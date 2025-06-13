import React from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity } from 'react-native';

interface Category {
    id: string;
    name: string;
    image: string;
}

interface PetListProps {
    data: Category[];
    numColumns?: number;
    columnWrapperStyle?: object;
    contentContainerStyle?: object;
}

const PetList: React.FC<PetListProps> = ({ data, numColumns = 2, columnWrapperStyle, contentContainerStyle }) => {
    const renderProduct = ({ item }: { item: Category }) => (
        <TouchableOpacity style={styles.productItem}>
            <Image source={{ uri: item.image }} style={styles.productImage} />
            <Text style={styles.soldText}>Sold (50 Products)</Text>
            <Text style={styles.productText}>{item.name}</Text>
            <Text style={styles.priceText}>1,000,000 đ</Text>
        </TouchableOpacity>
    );

    return (
        <FlatList
            data={data}
            renderItem={renderProduct}
            keyExtractor={item => item.id}
            numColumns={numColumns}
            columnWrapperStyle={columnWrapperStyle}
            contentContainerStyle={contentContainerStyle}
        />
    );
};

const styles = StyleSheet.create({
    productItem: {
        alignItems: 'center',
        margin: 5,
        width: 150,
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 10,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4
    },
    productImage: {
        width: 100,
        height: 100,
        borderRadius: 10
    },
    soldText: {
        fontSize: 12,
        color: '#666',
        paddingTop: 20
    },
    productText: {
        marginTop: 5,
        fontSize: 16
    },
    priceText: {
        fontSize: 14,
        color: 'red',
        marginTop: 5
    },
});

export default PetList;