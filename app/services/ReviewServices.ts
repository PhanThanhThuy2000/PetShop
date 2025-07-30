// services/ReviewServices.ts - FIXED VERSION
import { ApiResponse, Review } from '../types';
import api from '../utils/api-client';

export interface ImageData {
  uri: string;
  type?: string;
  name?: string;
}

export const reviewService = {
  async getReviews() {
    const response = await api.get<ApiResponse<Review[]>>('/reviews');
    return response.data;
  },

  async createReview(reviewData: { rating: number; comment: string; pet_id: string; product_id?: string }) {
    const response = await api.post<ApiResponse<Review>>('/reviews', reviewData);
    return response.data;
  },

  async deleteReview(id: string) {
    const response = await api.delete<ApiResponse<null>>(`/reviews/${id}`);
    return response.data;
  },

  async createReviewWithImages(reviewData: { 
    rating: number; 
    comment: string; 
    pet_id: string; 
    product_id?: string;
    images?: ImageData[];
  }) {
    const formData = new FormData();
    
    // Thêm các field thông tin
    formData.append('rating', reviewData.rating.toString());
    formData.append('comment', reviewData.comment);
    formData.append('pet_id', reviewData.pet_id);
    if (reviewData.product_id) {
      formData.append('product_id', reviewData.product_id);
    }
    
    // Thêm ảnh nếu có - React Native FormData format
    if (reviewData.images && reviewData.images.length > 0) {
      reviewData.images.forEach((image, index) => {
        // React Native FormData cần object với uri, type, name
        const imageFile = {
          uri: image.uri,
          type: image.type || 'image/jpeg',
          name: image.name || `review_image_${Date.now()}_${index}.jpg`,
        };
        
        // Append với field name 'images' (backend expect array)
        formData.append('images', imageFile as any);
      });
    }

    console.log('FormData being sent:', {
      rating: reviewData.rating,
      comment: reviewData.comment,
      pet_id: reviewData.pet_id,
      imageCount: reviewData.images?.length || 0
    });

    try {
      const response = await api.post<ApiResponse<Review>>('/reviews', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // Tăng timeout lên 30s cho upload ảnh
      });
      return response.data;
    } catch (error: any) {
      console.error('Upload error:', error.response?.data || error.message);
      throw error; // Throw original error để có thể debug
    }
  },

  
};

