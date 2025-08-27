// services/ReviewServices.ts - FIXED VERSION
import { ApiResponse, Review } from '../types';
import api from '../utils/api-client';

export interface ImageData {
  uri: string;
  type?: string;
  name?: string;
}

export interface Review {
  _id: string;
  rating: number;
  comment: string;
  created_at: string;
  updated_at: string;
  pet_id?: {
    _id: string;
    name: string;
    breed: string;
  };
  product_id?: {
    _id: string;
    name: string;
    price: number;
  };
  user_id: {
    _id: string;
    username: string;
    email: string;
    avatar?: string;
  };
  images?: ReviewImage[];
  order_item_id?: string;
}

export interface ReviewImage {
  _id: string;
  url: string;
  is_primary: boolean;
  review_id: string;
  created_at: string;
}
export interface ReviewStats {
  avgRating: number;
  totalReviews: number;
  distribution: {
    star1: number;
    star2: number;
    star3: number;
    star4: number;
    star5: number;
  };
}
export interface ReviewsResponse {
  reviews: Review[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalReviews: number;
    hasMore: boolean;
  };
  stats: ReviewStats;
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
  // ✅ MỚI: Tạo review từ order item với kiểm tra quyền và trạng thái
  async createReviewFromOrderItem(reviewData: {
    rating: number;
    comment: string;
    pet_id?: string; // Thay đổi thành optional
    product_id?: string;
    orderItemId: string;
    images?: ImageData[];
  }) {
    const formData = new FormData();

    // Thêm các field thông tin
    formData.append('rating', reviewData.rating.toString());
    formData.append('comment', reviewData.comment);
    formData.append('orderItemId', reviewData.orderItemId);

    // Chỉ thêm pet_id hoặc product_id nếu chúng tồn tại và hợp lệ
    if (reviewData.pet_id && reviewData.pet_id !== 'undefined') {
      formData.append('pet_id', reviewData.pet_id);
    }
    if (reviewData.product_id && reviewData.product_id !== 'undefined') {
      formData.append('product_id', reviewData.product_id);
    }

    // Thêm ảnh nếu có
    if (reviewData.images && reviewData.images.length > 0) {
      reviewData.images.forEach((image, index) => {
        const imageFile = {
          uri: image.uri,
          type: image.type || 'image/jpeg',
          name: image.name || `review_image_${Date.now()}_${index}.jpg`,
        };
        formData.append('images', imageFile as any);
      });
    }

    console.log('FormData being sent (from order item):', {
      rating: reviewData.rating,
      comment: reviewData.comment,
      pet_id: reviewData.pet_id,
      product_id: reviewData.product_id,
      orderItemId: reviewData.orderItemId,
      imageCount: reviewData.images?.length || 0,
    });

    try {
      const response = await api.post<ApiResponse<Review>>('/reviews/from-order-item', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000,
      });
      return response.data;
    } catch (error: any) {
      console.error('Upload review from order item error:', error.response?.data || error.message);
      throw error;
    }
  },

  // ✅ Lấy đánh giá theo Product ID
  async getReviewsByProduct(
    productId: string,
    params: {
      page?: number;
      limit?: number;
      rating?: number;
    } = {}
  ): Promise<ApiResponse<ReviewsResponse>> {
    try {
      const { page = 1, limit = 10, rating } = params;

      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('limit', limit.toString());
      if (rating) {
        queryParams.append('rating', rating.toString());
      }

      console.log('🔍 Getting reviews for product:', productId, params);

      const url = `/reviews/product/${productId}?${queryParams.toString()}`;
      const response = await api.get<ApiResponse<ReviewsResponse>>(url);

      console.log('✅ Product reviews loaded:', {
        productId,
        totalReviews: response.data?.data?.stats?.totalReviews || 0,
        avgRating: response.data?.data?.stats?.avgRating || 0
      });

      return response.data;
    } catch (error: any) {
      console.error('❌ Get product reviews error:', error.response?.data || error.message);
      throw error;
    }
  },

  // ✅ Lấy đánh giá theo Pet ID  
  async getReviewsByPet(
    petId: string,
    params: {
      page?: number;
      limit?: number;
      rating?: number;
    } = {}
  ): Promise<ApiResponse<ReviewsResponse>> {
    try {
      const { page = 1, limit = 10, rating } = params;

      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('limit', limit.toString());
      if (rating) {
        queryParams.append('rating', rating.toString());
      }

      console.log('🔍 Getting reviews for pet:', petId, params);

      const url = `/reviews/pet/${petId}?${queryParams.toString()}`;
      const response = await api.get<ApiResponse<ReviewsResponse>>(url);

      console.log('✅ Pet reviews loaded:', {
        petId,
        totalReviews: response.data?.data?.stats?.totalReviews || 0,
        avgRating: response.data?.data?.stats?.avgRating || 0
      });

      return response.data;
    } catch (error: any) {
      console.error('❌ Get pet reviews error:', error.response?.data || error.message);
      throw error;
    }
  },
};

