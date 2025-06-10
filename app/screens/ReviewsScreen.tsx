// ReviewsScreen.tsx
import React from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

// Data mẫu 39 reviews
const reviews = Array.from({ length: 39 }).map((_, i) => ({
  id: String(i),
  name: 'Veronika',
  avatar: 'https://i.pravatar.cc/150?img=5',
  rating: 4,
  text:
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
}));

// Component hiển thị sao
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

// Component một review item
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
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Reviews</Text>
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
        // Nếu muốn thêm khoảng cách cuối list thì dùng paddingBottom
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
  header: {
    fontSize: 24,
    fontWeight: '600',
    marginHorizontal: 20,
    marginTop: 30,
    marginBottom: 10,
  },
  list: {
    paddingBottom: 20,
  },
  reviewContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
    alignItems: 'flex-start',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 15,
  },
  reviewContent: {
    flex: 1,
  },
  name: {
    fontWeight: '500',
    fontSize: 16,
  },
  stars: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  starIcon: {
    marginRight: 2,
    color: '#f1c40f',
  },
  text: {
    fontSize: 14,
    color: '#555',
  },
});
