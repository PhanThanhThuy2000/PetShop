
// ===== UPDATED REVIEWS SCREEN =====
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { reviewService } from '../services/ReviewServices';
// import { Review } from '../types';


export interface ReviewImage {
  _id: string;
  url: string;
  is_primary: boolean;
  review_id: string;
  created_at: string;
}

export interface Review {
  _id: string;
  rating: number;
  comment: string;
  created_at: string;
  pet_id: {
    _id: string;
    name: string;
    breed: string;
  };
  user_id: {
    _id: string;
    username: string;
    email: string;
  };
  product_id?: {
    _id: string;
    name: string;
    price: number;
  };
  images?: ReviewImage[]; // Thêm thuộc tính images
}


const { width } = Dimensions.get('window');

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

// Component hiển thị danh sách ảnh của review
const ReviewImages: React.FC<{ images?: any[] }> = ({ images }) => {
  if (!images || images.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.imagesContainer}
    >
      {images.map((image, index) => (
        <TouchableOpacity key={index} style={styles.imageWrapper}>
          <Image
            source={{ uri: image.url }}
            style={styles.reviewImage}
            resizeMode="cover"
          />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// Hàm format thời gian
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));

  if (diffInMinutes < 60) {
    return `${diffInMinutes} phút trước`;
  } else if (diffInHours < 24) {
    return `${diffInHours} giờ trước`;
  } else if (diffInDays < 7) {
    return `${diffInDays} ngày trước`;
  } else {
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }
};

const ReviewItem: React.FC<{
  avatar?: string;
  name: string;
  rating: number;
  text: string;
  petName?: string;
  productName?: string;
  images?: any[];
  createdAt: string;
}> = ({ avatar, name, rating, text, petName, productName, images, createdAt }) => (
  <View style={styles.reviewContainer}>
    <Image
      source={{ uri: avatar || 'https://i.pravatar.cc/150?img=5' }}
      style={styles.avatar}
    />
    <View style={styles.reviewContent}>
      <View style={styles.reviewHeader}>
        <View style={styles.nameAndRating}>
          <Text style={styles.name}>{name}</Text>
          <StarRating rating={rating} />
        </View>
        <Text style={styles.timeStamp}>{formatDate(createdAt)}</Text>
      </View>
      
      <Text style={styles.text}>
        {text}
      </Text>
      
      {/* Hiển thị ảnh review nếu có */}
      <ReviewImages images={images} />
      
      {/* Thông tin thêm */}
      <View style={styles.additionalInfoContainer}>
        {petName && (
          <View style={styles.infoTag}>
            <FontAwesome name="paw" size={12} color="#718096" />
            <Text style={styles.additionalInfo}>Thú cưng: {petName}</Text>
          </View>
        )}
        {productName && (
          <View style={styles.infoTag}>
            <FontAwesome name="shopping-bag" size={12} color="#718096" />
            <Text style={styles.additionalInfo}>Sản phẩm: {productName}</Text>
          </View>
        )}
      </View>
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
      const response = await reviewService.getReviews();
      if (response.data) {
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
        <Text style={styles.headerTitle}>Đánh giá ({reviews.length})</Text>
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
              name={item.user_id.username || 'Người dùng ẩn'}
              rating={item.rating}
              text={item.comment}
              petName={item.pet_id?.name}
              productName={item.product_id?.name}
              images={item.images}
              createdAt={item.created_at}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
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
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  nameAndRating: {
    flex: 1,
  },
  name: {
    fontWeight: '600',
    fontSize: 16,
    marginBottom: 4,
    color: '#111',
  },
  stars: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  starIcon: {
    marginRight: 2,
    color: '#f5b025',
  },
  timeStamp: {
    fontSize: 12,
    color: '#999',
    marginLeft: 8,
  },
  text: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
    marginBottom: 12,
  },
  // Styles cho ảnh review
  imagesContainer: {
    marginVertical: 8,
  },
  imageWrapper: {
    marginRight: 8,
  },
  reviewImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  // Styles cho thông tin thêm
  additionalInfoContainer: {
    marginTop: 8,
  },
  infoTag: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  additionalInfo: {
    fontSize: 12,
    color: '#718096',
    marginLeft: 6,
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
    paddingHorizontal: 20,
  },
  errorText: {
    color: '#e53e3e',
    fontSize: 16,
    textAlign: 'center',
  },
});