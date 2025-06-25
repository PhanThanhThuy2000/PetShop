import React from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity, 
  StatusBar,
} from 'react-native';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const reviews = Array.from({ length: 39 }).map((_, i) => ({
  id: String(i),
  name: 'Veronika',
  avatar: 'https://i.pravatar.cc/150?img=5',
  rating: 4,
  text:
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
}));

const StarRating: React.FC<{ rating: number }> = ({ rating }) => (
  <View style={styles.stars}>
    {Array.from({ length: 5 }).map((_, i) => (
      <FontAwesome
        key={i}
        name={i < rating ? 'star' : 'star-o'}
        size={14}
        style={styles.starIcon}
      />
    ))}
  </View>
);

const ReviewItem: React.FC<{
  avatar: string;
  name: string;
  rating: number;
  text: string;
}> = ({ avatar, name, rating, text }) => (
  <View style={styles.reviewContainer}>
    <Image source={{ uri: avatar }} style={styles.avatar} />
    <View style={styles.reviewContent}>
      <Text style={styles.name}>{name}</Text>
      <StarRating rating={rating} />
      <Text style={styles.text} numberOfLines={3}>
        {text}
      </Text>
    </View>
  </View>
);

export default function ReviewsScreen() {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header với nút back */}
      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reviews ({reviews.length})</Text>
        <View style={{ width: 24 }} /> 
      </View>

      <FlatList
        data={reviews}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ReviewItem
            avatar={item.avatar}
            name={item.name}
            rating={item.rating}
            text={item.text}
          />
        )}
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  // Styles mới cho header
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginTop: 30,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111',
  },
  list: {
    paddingBottom: 20,
  },
  reviewContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomColor: '#f0f0f0',
    borderBottomWidth: 1,
    alignItems: 'flex-start',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 15,
    backgroundColor: '#e0e0e0'
  },
  reviewContent: {
    flex: 1,
  },
  name: {
    fontWeight: '600', // Đậm hơn một chút
    fontSize: 16,
    marginBottom: 2,
  },
  stars: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  starIcon: {
    marginRight: 2,
    color: '#f5b025', 
  },
  text: {
    fontSize: 14,
    color: '#444', 
    lineHeight: 20, 
  },
});