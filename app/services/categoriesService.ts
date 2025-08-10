// app/services/categoriesService.ts - Updated với Breed Search
import { ApiResponse } from '../types';
import api from '../utils/api-client';

export interface Category {
  _id: string;
  name: string;
  description?: string;
  images?: CategoryImage[];
  created_at: string;
  updated_at: string;
}

export interface CategoryImage {
  _id: string;
  url: string;
  is_primary: boolean;
  category_id: string;
}

export interface Breed {
  _id: string;
  name: string;
  description?: string;
  category_id: Category;
  images?: BreedImage[];
  stats?: BreedStats;
  created_at: string;
  updated_at: string;
}

export interface BreedImage {
  _id: string;
  url: string;
  is_primary: boolean;
  breed_id: string;
  created_at: string;
}

export interface BreedStats {
  totalPets: number;
  availablePets: number;
  soldPets: number;
  avgPrice: number;
}

export interface BreedSearchParams {
  keyword?: string;
  categoryId?: string;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'created_at';
  sortOrder?: 'asc' | 'desc';
  includeStats?: boolean;
  includeImages?: boolean;
}

export interface BreedSearchResponse {
  breeds: Breed[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    limit: number;
  };
  searchInfo: {
    keyword: string;
    categoryId: string | null;
    resultsCount: number;
  };
}

export interface BreedSuggestion {
  _id: string;
  name: string;
  category: string;
}

export interface BreedSuggestionsResponse {
  suggestions: BreedSuggestion[];
  keyword: string;
  totalSuggestions: number;
}

export const categoriesService = {
  // ===== EXISTING METHODS =====

  // Lấy tất cả categories
  async getCategories(): Promise<ApiResponse<Category[]>> {
    const response = await api.get<ApiResponse<Category[]>>('/categories');
    return response.data;
  },

  // Lấy category theo ID
  async getCategoryById(id: string): Promise<ApiResponse<Category>> {
    const response = await api.get<ApiResponse<Category>>(`/categories/${id}`);
    return response.data;
  },

  // Lấy tất cả breeds
  async getBreeds(): Promise<ApiResponse<Breed[]>> {
    const response = await api.get<ApiResponse<Breed[]>>('/breeds');
    return response.data;
  },

  // Lấy breeds theo category
  async getBreedsByCategory(categoryId: string): Promise<ApiResponse<Breed[]>> {
    const response = await api.get<ApiResponse<Breed[]>>(`/breeds/category/${categoryId}`);
    return response.data;
  },

  // ===== NEW SEARCH METHODS =====

  // 🔍 Tìm kiếm breeds theo tên
  async searchBreeds(params: BreedSearchParams = {}): Promise<ApiResponse<BreedSearchResponse>> {
    const queryParams = new URLSearchParams();

    // Mapping parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    try {
      console.log('🔍 Breed Search API:', `/breeds/search?${queryParams.toString()}`);

      const response = await api.get<ApiResponse<BreedSearchResponse>>(
        `/breeds/search?${queryParams.toString()}`
      );

      console.log('✅ Breed Search Response:', response.data);
      return response.data;

    } catch (error: any) {
      console.error('❌ Breed Search Error:', error.response?.data || error.message);
      throw error;
    }
  },

  // 💡 Lấy gợi ý tìm kiếm breeds
  async getBreedSearchSuggestions(keyword: string, limit: number = 5): Promise<ApiResponse<BreedSuggestionsResponse>> {
    try {
      const queryParams = new URLSearchParams({
        keyword,
        limit: limit.toString()
      });

      console.log('💡 Breed Suggestions API:', `/breeds/search/suggestions?${queryParams.toString()}`);

      const response = await api.get<ApiResponse<BreedSuggestionsResponse>>(
        `/breeds/search/suggestions?${queryParams.toString()}`
      );

      console.log('✅ Breed Suggestions Response:', response.data);
      return response.data;

    } catch (error: any) {
      console.error('❌ Breed Suggestions Error:', error.response?.data || error.message);
      throw error;
    }
  },

  // 🔍 Tìm kiếm breeds trong category cụ thể
  async searchBreedsInCategory(
    categoryId: string,
    keyword: string,
    options: Partial<BreedSearchParams> = {}
  ): Promise<ApiResponse<BreedSearchResponse>> {
    return this.searchBreeds({
      keyword,
      categoryId,
      ...options
    });
  },

  // 📊 Lấy breeds với thống kê
  async getBreedsWithStats(categoryId?: string): Promise<ApiResponse<BreedSearchResponse>> {
    return this.searchBreeds({
      categoryId,
      includeStats: true,
      includeImages: true,
      limit: 50
    });
  }
};