import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { reviewService } from '../services/ReviewServices';
import { Review } from '../types';

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
  avatar?: string;
  name: string;
  rating: number;
  text: string;
  petName?: string;
  productName?: string;
}> = ({ avatar, name, rating, text, petName, productName }) => (
  <View style={styles.reviewContainer}>
    <Image
      source={{ uri: avatar || 'https://i.pravatar.cc/150?img=5' }}
      style={styles.avatar}
    />
    <View style={styles.reviewContent}>
      <Text style={styles.name}>{name}</Text>
      <StarRating rating={rating} />
      <Text style={styles.text} numberOfLines={3}>
        {text}
      </Text>
      {petName && <Text style={styles.additionalInfo}>Thú cưng: {petName}</Text>}
      {productName && <Text style={styles.additionalInfo}>Sản phẩm: {productName}</Text>}
    </View>
  </View>
);

export default function ReviewsScreen() {
  const navigation = useNavigation<any>();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = async () => {
    try {
      setIsLoading(true);
      const response = await reviewService.getReviews(); // Không cần params vì API không hỗ trợ
      if (response.data) { // Kiểm tra response.data thay vì success
        setReviews(response.data);
      } else {
        setError('Không thể tải danh sách đánh giá.');
      }
    } catch (err: any) {
      setError('Không thể tải đánh giá. Vui lòng thử lại sau.');
      console.error('Lỗi khi lấy đánh giá:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
    const unsubscribe = navigation.addListener('focus', () => {
      fetchReviews();
    });
    return unsubscribe;
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reviews ({reviews.length})</Text>
        <View style={{ width: 24 }} />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text>Đang tải...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <ReviewItem
              avatar={undefined} // API không trả về avatar, sử dụng fallback
              name={item.user_id.username || 'Người dùng ẩn'}
              rating={item.rating}
              text={item.comment}
              petName={item.pet_id?.name}
              productName={item.product_id?.name}
            />
          )}
          contentContainerStyle={styles.list}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
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
    backgroundColor: '#e0e0e0',
  },
  reviewContent: {
    flex: 1,
  },
  name: {
    fontWeight: '600',
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
  additionalInfo: {
    fontSize: 12,
    color: '#718096',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
  },
});