// app/services/favouriteService.ts - ENHANCED VERSION
import { ApiResponse } from '../types';
import api from '../utils/api-client';

export interface FavouriteItem {
    _id: string;
    user_id: string;
    product_id?: string;
    pet_id?: string;
    created_at: string;
    updated_at?: string;
}

export interface AddFavouriteRequest {
    product_id?: string;
    pet_id?: string;
}

export interface EnhancedApiResponse<T> extends ApiResponse<T> {
    isExisting?: boolean;
    wasExisting?: boolean;
}

export const favouriteService = {
    // ✅ ENHANCED: Add favourite với better response handling
    async addFavourite(data: AddFavouriteRequest): Promise<EnhancedApiResponse<FavouriteItem>> {
        try {
            console.log('🔥 Adding to favourites:', data);
            const response = await api.post<EnhancedApiResponse<FavouriteItem>>('/favourites', data);

            console.log('✅ Add favourite response:', {
                success: response.data.success,
                isExisting: response.data.isExisting,
                hasData: !!response.data.data
            });

            return response.data;
        } catch (error: any) {
            console.error('❌ Add favourite error details:', {
                status: error.response?.status,
                message: error.response?.data?.message,
                success: error.response?.data?.success,
                fullError: error.response?.data
            });

            // ✅ ENHANCED: Check if this is actually a success case disguised as error
            if (error.response?.status === 200 || error.response?.data?.success === true) {
                console.log('📝 Error response is actually success, returning success');
                return error.response.data;
            }

            throw error;
        }
    },

    // ✅ ENHANCED: Remove favourite 
    async removeFavourite(data: AddFavouriteRequest): Promise<EnhancedApiResponse<void>> {
        try {
            console.log('🗑️ Removing from favourites:', data);
            const response = await api.delete<EnhancedApiResponse<void>>('/favourites', { data });

            console.log('✅ Remove favourite response:', {
                success: response.data.success,
                wasExisting: response.data.wasExisting
            });

            return response.data;
        } catch (error: any) {
            console.error('❌ Remove favourite error details:', {
                status: error.response?.status,
                message: error.response?.data?.message,
                fullError: error.response?.data
            });

            // ✅ TREAT 404 as success (item was already removed)
            if (error.response?.status === 404) {
                console.log('📝 404 error treated as success - item was not in favourites');
                return {
                    success: true,
                    data: undefined as any,
                    message: 'Item was not in favourites',
                    statusCode: 200,
                    wasExisting: false
                };
            }

            throw error;
        }
    },

    // ✅ ENHANCED: Get favourites với better error handling
    async getFavourites(): Promise<ApiResponse<FavouriteItem[]>> {
        try {
            console.log('📋 Fetching favourites...');
            const response = await api.get<ApiResponse<FavouriteItem[]>>('/favourites');

            console.log('✅ Fetch favourites response:', {
                success: response.data.success,
                dataLength: response.data.data?.length || 0,
                statusCode: response.data.statusCode
            });

            // ✅ ENSURE data is always an array
            if (!Array.isArray(response.data.data)) {
                console.warn('⚠️ Response data is not array, defaulting to empty array');
                response.data.data = [];
            }

            return response.data;
        } catch (error: any) {
            console.error('❌ Fetch favourites error:', error.response?.data || error.message);

            // ✅ RETURN EMPTY ARRAY on error rather than throwing
            if (error.response?.status === 401) {
                throw error; // Re-throw auth errors
            }

            console.log('📝 Returning empty favourites array due to error');
            return {
                success: true,
                data: [],
                message: 'Error fetching favourites, returning empty array',
                statusCode: 200
            };
        }
    },

    // ✅ ENHANCED: Check favourite với comprehensive error handling
    async checkFavourite(params: { product_id?: string; pet_id?: string }): Promise<ApiResponse<{ isFavorite: boolean }>> {
        try {
            const queryParams = new URLSearchParams();
            if (params.product_id) queryParams.append('product_id', params.product_id);
            if (params.pet_id) queryParams.append('pet_id', params.pet_id);

            console.log('🔍 Checking favourite status:', params);
            const url = `/favourites/check?${queryParams.toString()}`;
            console.log('🔍 Query URL:', url);

            const response = await api.get<ApiResponse<{ isFavorite: boolean }>>(url);

            console.log('✅ Check favourite response structure:', {
                success: response.data?.success,
                hasData: !!response.data?.data,
                isFavorite: response.data?.data?.isFavorite,
                fullResponse: JSON.stringify(response.data, null, 2)
            });

            // ✅ COMPREHENSIVE NULL CHECKING
            if (!response.data) {
                console.warn('⚠️ Response is null, returning false');
                return {
                    success: true,
                    data: { isFavorite: false },
                    message: 'No response data',
                    statusCode: 200
                };
            }

            if (!response.data.data) {
                console.warn('⚠️ Response.data.data is null, returning false');
                return {
                    success: true,
                    data: { isFavorite: false },
                    message: 'No nested data',
                    statusCode: 200
                };
            }

            if (typeof response.data.data.isFavorite === 'undefined') {
                console.warn('⚠️ isFavorite property is undefined, returning false');
                return {
                    ...response.data,
                    data: { isFavorite: false }
                };
            }

            return response.data;

        } catch (error: any) {
            console.error('❌ Check favourite error details:', {
                status: error.response?.status,
                message: error.response?.data?.message,
                fullError: error.response?.data
            });

            // ✅ COMPREHENSIVE ERROR HANDLING
            if (error.response?.status === 404) {
                console.log('🔍 404 - item not in favourites, returning false');
                return {
                    success: true,
                    data: { isFavorite: false },
                    message: 'Item not found in favourites',
                    statusCode: 200
                };
            }

            if (error.response?.status === 401) {
                throw error; // Re-throw auth errors
            }

            // ✅ DEFAULT FALLBACK: Return false for any other error
            console.log('📝 Unknown error, defaulting to false');
            return {
                success: true,
                data: { isFavorite: false },
                message: 'Error checking favourite status, defaulting to false',
                statusCode: 200
            };
        }
    },

    // ✅ NEW: Bulk check favourites để optimize performance
    async bulkCheckFavourites(items: AddFavouriteRequest[]): Promise<ApiResponse<{ [key: string]: boolean }>> {
        try {
            console.log('🔍 Bulk checking favourites for', items.length, 'items');

            const results: { [key: string]: boolean } = {};

            // ✅ CHECK EACH ITEM (có thể optimize với single API call later)
            for (const item of items) {
                try {
                    const result = await this.checkFavourite(item);
                    const key = item.pet_id ? `pet_${item.pet_id}` : `product_${item.product_id}`;
                    results[key] = result.data.isFavorite;
                } catch (error) {
                    console.error('Error checking individual item:', item, error);
                    const key = item.pet_id ? `pet_${item.pet_id}` : `product_${item.product_id}`;
                    results[key] = false; // Default to false on error
                }
            }

            return {
                success: true,
                data: results,
                message: 'Bulk check completed',
                statusCode: 200
            };
        } catch (error: any) {
            console.error('❌ Bulk check favourites error:', error);
            return {
                success: false,
                data: {},
                message: 'Bulk check failed',
                statusCode: 500
            };
        }
    }
};