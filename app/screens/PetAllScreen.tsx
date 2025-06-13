import React from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { pets } from './HomeScreen'; // Import products from PetShopScreen
import PetList from './PetList';

interface Category {
    id: string;
    name: string;
    image: string;
}

const PetAllScreen: React.FC = () => {
    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Shop</Text>
                <View style={styles.searchContainer}>
                    <TextInput style={styles.searchInput} placeholder="Search" />
                    <Icon name="camera" style={styles.cameraIcon} />
                </View>
            </View>
            <View style={styles.categorySection}>
                <Text style={styles.sectionTitle}>All</Text>
            </View>
            <PetList
                data={pets}
                numColumns={2}
                columnWrapperStyle={styles.row}
                contentContainerStyle={styles.listContainer}
            />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff', marginTop: 20 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
    headerTitle: { fontSize: 24, fontWeight: 'bold' },
    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f1f1', borderRadius: 10, padding: 5, width: '70%' },
    searchInput: { flex: 1, height: 20, fontSize: 16 },
    cameraIcon: { width: 20, height: 20, tintColor: '#1e90ff' },
    categorySection: { padding: 10 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
    row: { justifyContent: 'space-around', paddingHorizontal: 10 },
    listContainer: { paddingBottom: 10 },
});

export default PetAllScreen;