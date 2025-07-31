import { FontAwesome, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ImageData, reviewService } from '../services/ReviewServices';

interface SelectedImage extends ImageData {
  uri: string;
  type: string;
  name: string;
}

export default function AddReviewScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { product, orderItemId } = route.params || {};
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isCreatingReview, setIsCreatingReview] = useState(false);
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);

  // Xin quyền truy cập camera và thư viện ảnh
  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
      Alert.alert('Quyền truy cập', 'Cần quyền truy cập camera và thư viện ảnh để thêm ảnh vào đánh giá.');
      return false;
    }
    return true;
  };

  // Chọn ảnh từ thư viện
  const pickFromLibrary = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: Math.max(1, 3 - selectedImages.length),
        quality: 0.7, // Giảm quality để file nhỏ hơn
        allowsEditing: false,
      });

      if (!result.canceled && result.assets) {
        const newImages: SelectedImage[] = result.assets.map((asset, index) => {
          // Đảm bảo có đuôi file đúng
          const fileExtension = asset.uri.split('.').pop()?.toLowerCase() || 'jpg';
          const mimeType = fileExtension === 'png' ? 'image/png' : 'image/jpeg';
          
          return {
            uri: asset.uri,
            type: mimeType,
            name: `review_image_${Date.now()}_${index}.${fileExtension}`,
          };
        });
        
        setSelectedImages(prev => [...prev, ...newImages].slice(0, 3));
        console.log('Images selected:', newImages.length);
      }
    } catch (error) {
      console.error('Error picking images:', error);
      Alert.alert('Lỗi', 'Không thể chọn ảnh. Vui lòng thử lại.');
    }
  };

  // Chụp ảnh
  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
        allowsEditing: true,
        aspect: [1, 1],
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const newImage: SelectedImage = {
          uri: asset.uri,
          type: 'image/jpeg', // Camera luôn cho JPEG
          name: `review_photo_${Date.now()}.jpg`,
        };
        
        setSelectedImages(prev => [...prev, newImage].slice(0, 3));
        console.log('Photo taken:', newImage.name);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Lỗi', 'Không thể chụp ảnh. Vui lòng thử lại.');
    }
  };

  // Chọn nguồn ảnh
  const selectImages = async () => {
    if (selectedImages.length >= 3) {
      Alert.alert('Giới hạn', 'Bạn chỉ có thể thêm tối đa 3 ảnh.');
      return;
    }

    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    Alert.alert(
      'Chọn ảnh',
      'Bạn muốn chọn ảnh từ đâu?',
      [
        { text: 'Thư viện ảnh', onPress: pickFromLibrary },
        { text: 'Chụp ảnh', onPress: takePhoto },
        { text: 'Hủy', style: 'cancel' },
      ]
    );
  };

  // Xóa ảnh
  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  // Gửi đánh giá
  const handleSubmitReview = async () => {
    if (!rating || !comment.trim()) {
      Alert.alert('Lỗi', 'Vui lòng chọn số sao và nhập bình luận.');
      return;
    }

    if (!product || !product.id) {
      Alert.alert('Lỗi', 'Không tìm thấy thông tin sản phẩm. Vui lòng thử lại.');
      console.error('Debug: product object received:', product);
      return;
    }

    setIsCreatingReview(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token || token === 'null') {
        Alert.alert('Lỗi', 'Vui lòng đăng nhập để gửi đánh giá.');
        navigation.navigate('Login');
        return;
      }

      console.log('Submitting review with:', {
        rating,
        commentLength: comment.trim().length,
        imageCount: selectedImages.length,
        petId: product.id
      });

      const response = await reviewService.createReviewWithImages({
        rating,
        comment: comment.trim(),
        pet_id: product.id,
        images: selectedImages.length > 0 ? selectedImages : undefined,
      });

      if (response.success) {
        Alert.alert('Thành công', 'Đánh giá đã được gửi thành công!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('Lỗi', response.message || 'Gửi đánh giá thất bại');
      }
    } catch (error: any) {
      console.error('Submit review error:', error);
      
      let errorMessage = 'Gửi đánh giá thất bại. Vui lòng thử lại.';
      
      if (error.response?.status === 401) {
        errorMessage = 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.';
        navigation.navigate('Login');
      } else if (error.response?.status === 413) {
        errorMessage = 'Ảnh quá lớn. Vui lòng chọn ảnh nhỏ hơn.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Lỗi', errorMessage);
    } finally {
      setIsCreatingReview(false);
    }
  };

  // Component đánh giá sao
  const StarRating: React.FC<{ rating: number; onRatingChange: (rating: number) => void }> = ({ rating, onRatingChange }) => (
    <View style={styles.stars}>
      {Array.from({ length: 5 }).map((_, i) => (
        <TouchableOpacity key={i} onPress={() => onRatingChange(i + 1)}>
          <FontAwesome
            name={i < rating ? 'star' : 'star-o'}
            size={24}
            style={[styles.starIcon, i < rating && styles.starFilled]}
          />
        </TouchableOpacity>
      ))}
    </View>
  );

  // Render ảnh đã chọn
  const renderImageItem = ({ item, index }: { item: SelectedImage; index: number }) => (
    <View style={styles.imageContainer}>
      <Image source={{ uri: item.uri }} style={styles.selectedImage} />
      <TouchableOpacity style={styles.removeImageButton} onPress={() => removeImage(index)}>
        <Ionicons name="close-circle" size={24} color="#ff4444" />
      </TouchableOpacity>
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

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Product Info */}
        <View style={styles.productInfo}>
          <Image 
            source={{ uri: product?.image || 'https://via.placeholder.com/80' }} 
            style={styles.productImage} 
          />
          <Text style={styles.productName}>{product?.name || 'Sản phẩm'}</Text>
        </View>

        {/* Star Rating */}
        <View style={styles.ratingSection}>
          <Text style={styles.ratingLabel}>Đánh giá sản phẩm này *</Text>
          <StarRating rating={rating} onRatingChange={setRating} />
          {rating > 0 && (
            <Text style={styles.ratingText}>
              {rating === 1 && 'Rất tệ'}
              {rating === 2 && 'Tệ'}
              {rating === 3 && 'Bình thường'}
              {rating === 4 && 'Tốt'}
              {rating === 5 && 'Rất tốt'}
            </Text>
          )}
        </View>

        {/* Comment Input */}
        <View style={styles.commentSection}>
          <Text style={styles.commentLabel}>Nhận xét của bạn *</Text>
          <TextInput
            style={styles.textInput}
            value={comment}
            onChangeText={setComment}
            placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
            maxLength={500}
            multiline
            textAlignVertical="top"
          />
          <Text style={styles.characterCount}>{comment.length}/500</Text>
        </View>

        {/* Image Selection */}
        <View style={styles.imageSection}>
          <Text style={styles.imageLabel}>
            Thêm ảnh ({selectedImages.length}/3)
          </Text>
          
          {selectedImages.length > 0 && (
            <FlatList
              data={selectedImages}
              renderItem={renderImageItem}
              keyExtractor={(_, index) => index.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.imagesList}
            />
          )}

          {selectedImages.length < 3 && (
            <TouchableOpacity style={styles.addImageButton} onPress={selectImages}>
              <Ionicons name="camera" size={24} color="#666" />
              <Text style={styles.addImageText}>
                {selectedImages.length === 0 ? 'Thêm ảnh' : 'Thêm ảnh khác'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton, 
            (isCreatingReview || !rating || !comment.trim()) && styles.disabledButton
          ]}
          onPress={handleSubmitReview}
          disabled={isCreatingReview || !rating || !comment.trim()}
        >
          <Text style={styles.submitButtonText}>
            {isCreatingReview ? 'Đang gửi...' : 'Gửi đánh giá'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
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
    marginTop: 20,
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
    flex: 1,
    padding: 16,
  },
  productInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#e9ecef',
  },
  productName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  ratingSection: {
    marginBottom: 24,
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 12,
  },
  stars: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  starIcon: {
    marginHorizontal: 8,
    color: '#ddd',
  },
  starFilled: {
    color: '#ffd700',
  },
  ratingText: {
    textAlign: 'center',
    marginTop: 8,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  commentSection: {
    marginBottom: 24,
  },
  commentLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 12,
  },
  textInput: {
    height: 120,
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
    textAlignVertical: 'top',
  },
  characterCount: {
    textAlign: 'right',
    fontSize: 12,
    color: '#666',
    marginTop: 8,
  },
  imageSection: {
    marginBottom: 32,
  },
  imageLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 12,
  },
  imagesList: {
    marginBottom: 16,
  },
  imageContainer: {
    position: 'relative',
    marginRight: 12,
  },
  selectedImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#e9ecef',
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  addImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderWidth: 2,
    borderColor: '#e9ecef',
    borderStyle: 'dashed',
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
  },
  addImageText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#666',
  },
  submitButton: {
    backgroundColor: '#007bff',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 32,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});