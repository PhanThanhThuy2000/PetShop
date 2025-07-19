// app/services/favouriteService.ts - SỬA LỖI VỚI ERROR HANDLING
import { ApiResponse } from '../types';
import api from '../utils/api-client';

export interface FavouriteItem {
    _id: string;
    user_id: string;
    product_id?: string;
    pet_id?: string;
    created_at: string;
}

export interface AddFavouriteRequest {
    product_id?: string;
    pet_id?: string;
}

export const favouriteService = {
    // Thêm vào yêu thích
    async addFavourite(data: AddFavouriteRequest): Promise<ApiResponse<FavouriteItem>> {
        try {
            console.log('🔥 Adding to favourites:', data);
            const response = await api.post<ApiResponse<FavouriteItem>>('/favourites', data);
            console.log('✅ Add favourite response:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('❌ Add favourite error:', error.response?.data || error.message);
            throw error;
        }
    },

    // Xóa khỏi yêu thích
    async removeFavourite(data: AddFavouriteRequest): Promise<ApiResponse<void>> {
        try {
            console.log('🗑️ Removing from favourites:', data);
            const response = await api.delete<ApiResponse<void>>('/favourites', { data });
            console.log('✅ Remove favourite response:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('❌ Remove favourite error:', error.response?.data || error.message);
            throw error;
        }
    },

    // Lấy danh sách yêu thích với populated data
    async getFavourites(): Promise<ApiResponse<FavouriteItem[]>> {
        try {
            console.log('📋 Fetching favourites...');
            const response = await api.get<ApiResponse<FavouriteItem[]>>('/favourites');
            console.log('✅ Fetch favourites response structure:', {
                success: response.data.success,
                dataLength: response.data.data?.length,
                firstItem: response.data.data?.[0] ? {
                    _id: response.data.data[0]._id,
                    has_pet_id: !!response.data.data[0].pet_id,
                    has_product_id: !!response.data.data[0].product_id,
                    pet_id_type: typeof response.data.data[0].pet_id,
                    product_id_type: typeof response.data.data[0].product_id
                } : null
            });
            return response.data;
        } catch (error: any) {
            console.error('❌ Fetch favourites error:', error.response?.data || error.message);
            throw error;
        }
    },

    // ✅ SỬA LỖI: Kiểm tra có trong yêu thích hay không với error handling
    async checkFavourite(params: { product_id?: string; pet_id?: string }): Promise<ApiResponse<{ isFavorite: boolean }>> {
        try {
            const queryParams = new URLSearchParams();
            if (params.product_id) queryParams.append('product_id', params.product_id);
            if (params.pet_id) queryParams.append('pet_id', params.pet_id);

            console.log('🔍 Checking favourite status:', params);
            console.log('🔍 Query URL:', `/favourites/check?${queryParams.toString()}`);

            const response = await api.get<ApiResponse<{ isFavorite: boolean }>>(`/favourites/check?${queryParams.toString()}`);
            console.log('✅ Check favourite full response:', JSON.stringify(response.data, null, 2));

            // ✅ KIỂM TRA VÀ XỬ LÝ RESPONSE
            if (!response.data) {
                console.warn('⚠️ Response data is null, defaulting to false');
                return {
                    success: true,
                    data: { isFavorite: false },
                    message: 'No data returned',
                    statusCode: 200
                } as ApiResponse<{ isFavorite: boolean }>;
            }

            // ✅ KIỂM TRA CẤU TRÚC DATA
            if (!response.data.data) {
                console.warn('⚠️ Response data.data is null, defaulting to false');
                return {
                    success: true,
                    data: { isFavorite: false },
                    message: 'No nested data returned',
                    statusCode: 200
                } as ApiResponse<{ isFavorite: boolean }>;
            }

            // ✅ KIỂM TRA isFavorite PROPERTY
            if (typeof response.data.data.isFavorite === 'undefined') {
                console.warn('⚠️ isFavorite property missing, defaulting to false');
                return {
                    ...response.data,
                    data: { isFavorite: false }
                };
            }

            return response.data;

        } catch (error: any) {
            console.error('❌ Check favourite error:', error.response?.data || error.message);

            // ✅ FALLBACK: Trả về false nếu có lỗi
            if (error.response?.status === 404) {
                console.log('🔍 404 error - item not in favourites, returning false');
                return {
                    success: true,
                    data: { isFavorite: false },
                    message: 'Item not found in favourites',
                    statusCode: 200
                } as ApiResponse<{ isFavorite: boolean }>;
            }

            throw error;
        }
    },
};