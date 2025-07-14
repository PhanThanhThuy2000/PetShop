import { ApiResponse, Review } from '../types';
import api from '../utils/api-client';

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
};