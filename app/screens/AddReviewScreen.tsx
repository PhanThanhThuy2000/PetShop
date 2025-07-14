import { FontAwesome, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useState } from 'react';
import {
  Alert,
  Image,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { reviewService } from '../services/ReviewServices';



export default function AddReviewScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { product, orderItemId } = route.params || {}; 
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isCreatingReview, setIsCreatingReview] = useState(false);

  const handleSubmitReview = async () => {
    if (!rating || !comment) {
      Alert.alert('Lỗi', 'Vui lòng chọn số sao và nhập bình luận.');
      return;
    }

    if (!product?.id) {
      Alert.alert('Lỗi', 'pet_id hoặc product_id không được cung cấp. Vui lòng kiểm tra lại.');
      console.error('Debug: product object received:', product);
      return;
    }

    setIsCreatingReview(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token || token === 'null') {
        Alert.alert('Lỗi', 'Vui lòng đăng nhập để gửi đánh giá.');
        return;
      }

      console.log('pet_id gửi đi:', product.id); // Log để debug
      const response = await reviewService.createReview({
        rating,
        comment,
        pet_id: product.id, // Sử dụng product.id làm pet_id
      });
      if (response.success) {
        Alert.alert('Thành công', 'Đánh giá đã được gửi thành công!');
        // Quay lại và gửi thông tin orderItemId đã được đánh giá
        navigation.navigate('History', { reviewedOrderItemId: orderItemId });
      } else {
        Alert.alert('Lỗi', `Gửi đánh giá thất bại: ${response.message || 'Lỗi không xác định'}`);
      }
    } catch (error: any) {
      console.error('Lỗi chi tiết:', error.response?.data || error.message);
      Alert.alert(
        'Lỗi',
        `Gửi đánh giá thất bại: ${
          error.response?.data?.message || error.message || 'Kiểm tra kết nối hoặc liên hệ hỗ trợ'
        }`
      );
    } finally {
      setIsCreatingReview(false);
    }
  };

  const StarRating: React.FC<{ rating: number; onRatingChange: (rating: number) => void }> = ({ rating, onRatingChange }) => (
    <View style={styles.stars}>
      {Array.from({ length: 5 }).map((_, i) => (
        <TouchableOpacity key={i} onPress={() => onRatingChange(i + 1)}>
          <FontAwesome
            name={i < rating ? 'star' : 'star-o'}
            size={20}
            style={[styles.starIcon, i < rating && styles.starFilled]}
          />
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Viết đánh giá</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color="#000" />
        </TouchableOpacity>
      </View>
      <View style={styles.content}>
        <Image source={{ uri: product?.image || 'https://via.placeholder.com/100' }} style={styles.productImage} />
        <Text style={styles.productName}>{product?.name || 'Sản phẩm'}</Text>
        <StarRating rating={rating} onRatingChange={setRating} />
        <Text style={styles.ratingLabel}>Đánh giá sản phẩm này*</Text>
        <TextInput
          style={styles.textInput}
          value={comment}
          onChangeText={setComment}
          placeholder="Chia sẻ suy nghĩ của bạn"
          maxLength={300}
          multiline
        />
        <View style={styles.mediaOption}>
          <Text style={styles.mediaLabel}>Thêm ảnh hoặc video</Text>
          <TouchableOpacity>
            <Ionicons name="camera" size={24} color="#000" />
            <Text style={styles.mediaAction}>Thêm ảnh hoặc video</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={[styles.submitButton, isCreatingReview && styles.disabledButton]}
          onPress={handleSubmitReview}
          disabled={isCreatingReview}
        >
          <Text style={styles.submitButtonText}>Gửi</Text>
        </TouchableOpacity>
      </View>
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
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginTop: 10,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  content: {
    padding: 16,
  },
  productImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginBottom: 10,
  },
  productName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 10,
  },
  stars: {
    flexDirection: 'row',
    marginVertical: 10,
  },
  starIcon: {
    marginRight: 5,
    color: '#ccc',
  },
  starFilled: {
    color: '#ffd700',
  },
  ratingLabel: {
    fontSize: 14,
    color: '#ff2d55',
    marginBottom: 10,
  },
  textInput: {
    height: 100,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    textAlignVertical: 'top',
  },
  mediaOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  mediaLabel: {
    fontSize: 14,
    marginRight: 10,
  },
  mediaAction: {
    fontSize: 14,
    color: '#0000EE',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    marginRight: 10,
  },
  checkboxLabel: {
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: '#ff2d55',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});