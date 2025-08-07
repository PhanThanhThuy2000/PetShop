// app/services/productsService.ts  
import { ApiResponse, Pet, Product } from '../types';
import api from '../utils/api-client';

export interface SearchProductsParams {
  keyword?: string;
  categoryId?: string;
  status?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface FilterOptions {
  categories: Array<{ _id: string; name: string }>;
  statuses: string[];
  priceRange: { minPrice: number; maxPrice: number };
}

export interface SearchResponse {
  products: Product[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    limit: number;
  };
  filters: any;
}
export interface RelatedItemsResponse {
  relatedItems: Array<Product | Pet>;
  breakdown?: {
    sameCategory?: number;
    relatedPets?: number;
    similarPrice?: number;
  };
}

export const productsService = {
  // Tìm kiếm sản phẩm - liên kết với API /products/search
  async searchProducts(params: SearchProductsParams = {}): Promise<ApiResponse<SearchResponse>> {
    const queryParams = new URLSearchParams();
    
    // Mapping parameters để match với backend API
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });
    
    try {
      console.log('🔍 Calling API:', `/products/search?${queryParams.toString()}`);
      
      const response = await api.get<ApiResponse<SearchResponse>>(
        `/products/search?${queryParams.toString()}`
      );
      
      console.log('✅ API Response:', response.data);
      return response.data;
      
    } catch (error: any) {
      console.error('❌ API Error:', error.response?.data || error.message);
      throw error;
    }
  },

  // Lấy filter options - liên kết với API /products/filter-options  
  async getFilterOptions(): Promise<ApiResponse<FilterOptions>> {
    try {
      const response = await api.get<ApiResponse<FilterOptions>>('/products/filter-options');
      return response.data;
    } catch (error: any) {
      console.error('❌ Filter Options Error:', error.response?.data || error.message);
      throw error;
    }
  },

  // Lấy tất cả sản phẩm
  async getProducts(params: { page?: number; limit?: number } = {}) {
    const { page = 1, limit = 10 } = params;
    const response = await api.get<ApiResponse<Product[]>>(`/products?page=${page}&limit=${limit}`);
    return response.data;
  },

  // Lấy sản phẩm theo ID
  async getProductById(id: string) {
    const response = await api.get<ApiResponse<Product>>(`/products/${id}`);
    return response.data;
  },
  // Lấy các items liên quan (products và pets) - API /products/:id/related
  async getRelatedItems(id: string, limit: number = 8): Promise<ApiResponse<RelatedItemsResponse>> {
    try {
      console.log('🔗 Product Related Items API:', `/products/${id}/related?limit=${limit}`);
      const response = await api.get<ApiResponse<RelatedItemsResponse>>(`/products/${id}/related?limit=${limit}`);
      console.log('✅ Product Related Items Response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Product Related Items API Error:', error.response?.data || error.message);
      throw error;
    }
  },
};