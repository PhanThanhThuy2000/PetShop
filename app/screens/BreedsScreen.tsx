import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { FlatList, Image, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

type BreedItem = {
  id: string;
  name: string;
  image: any;
};

const DATA = [
  { id: '1', name: 'Hamster', image: require('../../assets/images/HamsterBreedsScreen.png') },
  { id: '2', name: 'Dog', image: require('../../assets/images/DogBreedsScreen.png') },
  { id: '3', name: 'Cat', image: require('../../assets/images/CatBreedsScreen.png') },
  { id: '4', name: 'Rabbit', image: require('../../assets/images/RabbitBreedsScreen.png') },
  { id: '5', name: 'Watch', image: require('../../assets/images/WatchBreedsScreen.png') }, 
  { id: '6', name: 'Fish', image: require('../../assets/images/FishBreedsScreen.png') },
];

const BreedsScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const { categoryName } = route.params;

  const renderItem = ({ item }: { item: BreedItem }) => (
    <View style={styles.card}>
      <Image source={item.image} style={styles.image} resizeMode="cover" />
      <Text style={styles.cardText}>{item.name}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {/* SỬA LẠI LỆNH ĐIỀU HƯỚNG TẠI ĐÂY */}
        <TouchableOpacity onPress={() => navigation.navigate('app', { screen: 'Home' })}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.title}>Breeds {categoryName}</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.contentBox}>
        <FlatList
          data={DATA}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingTop: 30,
  },
  title: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', flex: 1, color: '#222' },
  contentBox: {
    flex: 1,
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#B3D1FF',
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  listContent: { paddingBottom: 16 },
  row: { justifyContent: 'space-between', marginBottom: 20 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    width: '48%',
    paddingVertical: 16,
    paddingHorizontal: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 3,
  },
  image: { width: 110, height: 80, borderRadius: 14, marginBottom: 12, borderWidth: 1, borderColor: '#e0e0e0' },
  cardText: { fontSize: 17, fontWeight: '600', textAlign: 'center', color: '#333' },
});

export default BreedsScreen;