// HistoryScreen.tsx (Đã thiết kế lại)

import React from 'react';
import {
    Dimensions,
    FlatList,
    Image,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

type OrderHistoryItem = {
  id: string;
  orderNumber: string;
  petName: string;
  image: any;
  date: string;
  price: string;
  status: string;
};

const orderHistory: OrderHistoryItem[] = [
  // ... dữ liệu không đổi
  {
    id: '1',
    orderNumber: '#23982',
    petName: 'Yorkshire Terrier',
    image: require('@/assets/images/imageDog.png'),
    date: 'September 21, 2023',
    price: '1.000.000 đ',
    status: 'Completed',
  },
  {
    id: '2',
    orderNumber: '#23983',
    petName: 'Golden Retriever',
    image: require('@/assets/images/imageDog.png'),
    date: 'September 18, 2023',
    price: '1.000.000 đ',
    status: 'Completed',
  },
  {
    id: '3',
    orderNumber: '#23984',
    petName: 'Persian Cat',
    image: require('@/assets/images/imageDog.png'),
    date: 'September 15, 2023',
    price: '1.000.000 đ',
    status: 'Completed',
  },
];

type OrderItemProps = {
  item: OrderHistoryItem;
};

const OrderItem = ({ item }: OrderItemProps) => {
    const navigation = useNavigation<any>();

    const handleReview = (itemId: string) => {
        console.log('Review item:', itemId);
        navigation.navigate('Reviews', { itemId: itemId });
    };

    return (
        <View style={styles.orderItem}>
            <View style={styles.orderHeader}>
                <Text style={styles.orderNumber}>{item.orderNumber}</Text>
                <Text style={styles.orderDate}>{item.date}</Text>
            </View>

            <View style={styles.orderContent}>
                <Image source={item.image} style={styles.petImage} />
                <View style={styles.orderInfo}>
                    <Text style={styles.petName}>{item.petName}</Text>
                    <Text style={styles.price}>{item.price}</Text>
                </View>
            </View>

            <View style={styles.orderFooter}>
                <Text style={[
                    styles.status, 
                    item.status === 'Completed' ? styles.statusCompleted : styles.statusPending
                ]}>
                    {item.status}
                </Text>
                <TouchableOpacity style={styles.reviewButton} onPress={() => handleReview(item.id)}>
                    <Text style={styles.reviewButtonText}>Review</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const HistoryScreen = () => {
  // 2. Sử dụng useNavigation
  const navigation = useNavigation<any>();

  const handleSearch = () => {
    console.log('Search pressed');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
        <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                {/* 3. Đổi icon và cách điều hướng */}
                <Ionicons name="arrow-back" size={24} color="#000000" />
            </TouchableOpacity>
            
            <Text style={styles.headerTitle}>Orders History</Text>
            
            <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
                <Ionicons name="search" size={20} color="#000000" />
            </TouchableOpacity>
        </View>
        <FlatList
            data={orderHistory}
            renderItem={({item}) => <OrderItem item={item} />}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
        />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa', // Thay đổi màu nền
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#EFEFEF',
        paddingTop:30
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#000000',
    },
    searchButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContainer: {
        paddingVertical: 16,
        paddingHorizontal: 16,
    },
    // Giao diện thẻ lịch sử mới
    orderItem: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 5,
        elevation: 2,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F5',
    },
    orderNumber: {
        fontSize: 15,
        fontWeight: '700',
        color: '#2d3748',
    },
    orderDate: {
        fontSize: 13,
        color: '#718096',
    },
    orderContent: {
        flexDirection: 'row',
        padding: 16,
    },
    petImage: {
        width: 70,
        height: 70,
        borderRadius: 8,
        marginRight: 16,
        backgroundColor: '#f0f0f0'
    },
    orderInfo: {
        flex: 1,
        justifyContent: 'center'
    },
    petName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2d3748',
        marginBottom: 8,
    },
    price: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#e53e3e',
    },
    orderFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    status: {
        fontSize: 14,
        fontWeight: '600',
    },
    statusCompleted: {
        color: '#38A169', // Màu xanh cho trạng thái thành công
    },
    statusPending: {
        color: '#DD6B20', // Màu cam cho trạng thái chờ
    },
    reviewButton: {
        backgroundColor: '#3182CE',
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 20,
    },
    reviewButtonText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '600',
    },
});

export default HistoryScreen;