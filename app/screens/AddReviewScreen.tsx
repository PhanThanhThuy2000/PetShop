import { FontAwesome, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  Platform,
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

const { width } = Dimensions.get('window');

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
        quality: 0.7,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets) {
        const newImages: SelectedImage[] = result.assets.map((asset, index) => {
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
          type: 'image/jpeg',
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
    <View style={styles.starsContainer}>
      <View style={styles.stars}>
        {Array.from({ length: 5 }).map((_, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => onRatingChange(i + 1)}
            style={styles.starButton}
            activeOpacity={0.7}
          >
            <FontAwesome
              name={i < rating ? 'star' : 'star-o'}
              size={32}
              style={[
                styles.starIcon,
                i < rating ? styles.starFilled : styles.starEmpty
              ]}
            />
          </TouchableOpacity>
        ))}
      </View>
      {rating > 0 && (
        <View style={styles.ratingTextContainer}>
          <Text style={styles.ratingText}>
            {rating === 1 && '😔 Rất tệ'}
            {rating === 2 && '😐 Tệ'}
            {rating === 3 && '🙂 Bình thường'}
            {rating === 4 && '😊 Tốt'}
            {rating === 5 && '🤩 Rất tốt'}
          </Text>
        </View>
      )}
    </View>
  );

  // Render ảnh đã chọn
  const renderImageItem = ({ item, index }: { item: SelectedImage; index: number }) => (
    <View style={styles.imageContainer}>
      <Image source={{ uri: item.uri }} style={styles.selectedImage} />
      <TouchableOpacity
        style={styles.removeImageButton}
        onPress={() => removeImage(index)}
        activeOpacity={0.8}
      >
        <View style={styles.removeImageIcon}>
          <Ionicons name="close" size={14} color="#fff" />
        </View>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Viết đánh giá</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Product Info Card */}
        <View style={styles.productCard}>
          <View style={styles.productImageContainer}>
            <Image
              source={{ uri: product?.image || 'https://via.placeholder.com/100' }}
              style={styles.productImage}
            />
          </View>
          <View style={styles.productDetails}>
            <Text style={styles.productName}>{product?.name || 'Sản phẩm'}</Text>
            <Text style={styles.productPrice}>Đánh giá sản phẩm này</Text>
          </View>
        </View>

        {/* Star Rating Section */}
        <View style={styles.ratingSection}>
          <Text style={styles.sectionTitle}>Mức độ hài lòng</Text>
          <StarRating rating={rating} onRatingChange={setRating} />
        </View>

        {/* Comment Section */}
        <View style={styles.commentSection}>
          <Text style={styles.sectionTitle}>Chia sẻ trải nghiệm</Text>
          <View style={styles.textInputContainer}>
            <TextInput
              style={styles.textInput}
              value={comment}
              onChangeText={setComment}
              placeholder="Hãy chia sẻ cảm nhận của bạn về sản phẩm này. Đánh giá chi tiết sẽ giúp người mua khác có thêm thông tin hữu ích..."
              maxLength={500}
              multiline
              textAlignVertical="top"
              placeholderTextColor="#999"
            />
            <View style={styles.characterCountContainer}>
              <Text style={styles.characterCount}>{comment.length}/500</Text>
            </View>
          </View>
        </View>

        {/* Image Section */}
        <View style={styles.imageSection}>
          <View style={styles.imageSectionHeader}>
            <Text style={styles.sectionTitle}>Thêm hình ảnh</Text>
            <Text style={styles.imageCounter}>({selectedImages.length}/3)</Text>
          </View>
          <Text style={styles.sectionSubtitle}>Hình ảnh sẽ giúp đánh giá của bạn hữu ích hơn</Text>

          {selectedImages.length > 0 && (
            <View style={styles.selectedImagesContainer}>
              <FlatList
                data={selectedImages}
                renderItem={renderImageItem}
                keyExtractor={(_, index) => index.toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.imagesList}
              />
            </View>
          )}

          {selectedImages.length < 3 && (
            <TouchableOpacity
              style={styles.addImageButton}
              onPress={selectImages}
              activeOpacity={0.8}
            >
              <View style={styles.addImageIcon}>
                <Ionicons name="camera-outline" size={24} color="#007AFF" />
              </View>
              <Text style={styles.addImageText}>
                {selectedImages.length === 0 ? 'Thêm hình ảnh' : 'Thêm hình ảnh khác'}
              </Text>
              <Text style={styles.addImageSubtext}>Chọn từ thư viện hoặc chụp mới</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            (isCreatingReview || !rating || !comment.trim()) && styles.disabledButton
          ]}
          onPress={handleSubmitReview}
          disabled={isCreatingReview || !rating || !comment.trim()}
          activeOpacity={0.8}
        >
          {isCreatingReview ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.submitButtonText}>Đang gửi...</Text>
            </View>
          ) : (
            <Text style={styles.submitButtonText}>Gửi đánh giá</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    marginTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  headerButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    letterSpacing: -0.3,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  productImageContainer: {
    marginRight: 12,
  },
  productImage: {
    width: 70,
    height: 70,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
  },
  productDetails: {
    flex: 1,
  },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
    lineHeight: 20,
  },
  productPrice: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  ratingSection: {
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  starsContainer: {
    alignItems: 'center',
  },
  stars: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  starButton: {
    padding: 6,
    marginHorizontal: 3,
  },
  starIcon: {
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  starEmpty: {
    color: '#e0e0e0',
  },
  starFilled: {
    color: '#FFD700',
  },
  ratingTextContainer: {
    marginTop: 10,
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
  },
  ratingText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
    textAlign: 'center',
  },
  commentSection: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  textInputContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  textInput: {
    minHeight: 120,
    padding: 16,
    fontSize: 14,
    lineHeight: 20,
    color: '#1a1a1a',
    textAlignVertical: 'top',
  },
  characterCountContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  characterCount: {
    textAlign: 'right',
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  imageSection: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  imageSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  imageCounter: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
    marginLeft: 6,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 16,
    lineHeight: 18,
  },
  selectedImagesContainer: {
    marginBottom: 12,
  },
  imagesList: {
    paddingVertical: 4,
  },
  imageContainer: {
    position: 'relative',
    marginRight: 10,
  },
  selectedImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
  },
  removeImageButton: {
    position: 'absolute',
    top: -4,
    right: -4,
  },
  removeImageIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  addImageButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    ...Platform.select({
      ios: {
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  addImageIcon: {
    marginBottom: 8,
  },
  addImageText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 4,
  },
  addImageSubtext: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  bottomContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  submitButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  disabledButton: {
    backgroundColor: '#ccc',
    ...Platform.select({
      ios: {
        shadowColor: '#ccc',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});