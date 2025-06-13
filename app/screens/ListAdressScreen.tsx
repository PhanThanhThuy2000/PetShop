import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

interface Adress {
    name: string;
    phone: string;
    address: string;
    isDefault?: boolean;
}

const ListAdress: Adress[] = [
    { name: 'Phan Thủy', phone: '(+84) 0363901223', address: '527 đường C6 Nhà Phường C6 nhà 2,Quận bác từ liêm ,Hà Nội', isDefault: true },
    { name: 'Phan Thủy', phone: '(+84) 0363901223', address: '527 đường C6 Nhà Phường C6 nhà 2,Quận bác từ liêm ,Hà Nội' },
];

const ListAdressScreen: React.FC = () => {
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton}>
                    <Icon name="arrow-left" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Payment</Text>
            </View>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {ListAdress.map((method, index) => (
                    <View key={index} style={styles.paymentItem}>
                        <View style={styles.details}>
                            <Text style={styles.name}>{method.name}</Text>
                            <Text style={styles.phone}>{method.phone}</Text>
                            <Text style={styles.address}>{method.address}</Text>
                        </View>
                        <View style={styles.actions}>
                            {method.isDefault && (
                                <TouchableOpacity style={styles.defaultButton}>
                                    <Text style={styles.defaultText}>Default</Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity>
                                <Icon name="edit" size={20} color="#1E90FF" />
                            </TouchableOpacity>
                        </View>
                    </View>
                ))}
            </ScrollView>
            <TouchableOpacity style={styles.addButton} onPress={() => { /* Add navigation or action here */ }}>
                <View style={styles.addContent}>
                    <Icon name="plus" size={16} color="#fff" style={styles.addIcon} />
                    <Text style={styles.addText}>Add</Text>
                </View>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff', padding: 10 ,marginTop: 20},
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20
    },
    backButton: {
        position: 'absolute',
        left: 0
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center'
    },
    scrollContent: { paddingBottom: 20 },
    paymentItem: { flexDirection: 'row', justifyContent: 'space-between', padding: 10, borderBottomWidth: 1, borderBottomColor: '#eee', alignItems: 'center' },
    details: { flex: 1 },
    name: { fontSize: 16, fontWeight: 'bold' },
    phone: { fontSize: 14, color: '#666' },
    address: { fontSize: 14, color: '#666' },
    actions: { flexDirection: 'row', alignItems: 'center' },
    defaultButton: { backgroundColor: '#1E90FF', paddingVertical: 5, paddingHorizontal: 10, borderRadius: 5, marginRight: 10 },
    defaultText: { color: '#fff', fontSize: 12 },
    addButton: { backgroundColor: '#1E90FF', paddingVertical: 12, borderRadius: 5, alignItems: 'center', marginTop: 10 },
    addText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    addContent: { flexDirection: 'row', alignItems: 'center' },
    addIcon: { marginRight: 5 },
});

export default ListAdressScreen;