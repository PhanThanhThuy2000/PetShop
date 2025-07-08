// app/services/petsService.ts  
import { ApiResponse, Pet } from '../types';
import api from '../utils/api-client';

export interface SearchPetsParams {
  keyword?: string;
  type?: string;
  breed_id?: string;
  categoryId?: string;
  gender?: string;
  status?: string;
  minPrice?: number;
  maxPrice?: number;
  minAge?: number;
  maxAge?: number;
  minWeight?: number;
  maxWeight?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface PetsSearchResponse {
  pets: Pet[];
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

export const petsService = {
  // Tìm kiếm pets - liên kết với API /pets/search
  async searchPets(params: SearchPetsParams = {}): Promise<ApiResponse<PetsSearchResponse>> {
    const queryParams = new URLSearchParams();
    
    // Mapping parameters để match với backend API
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });
    
    try {
      console.log('🔍 Pets API:', `/pets/search?${queryParams.toString()}`);
      
      const response = await api.get<ApiResponse<PetsSearchResponse>>(
        `/pets/search?${queryParams.toString()}`
      );
      
      console.log('✅ Pets API Response:', response.data);
      return response.data;
      
    } catch (error: any) {
      console.error('❌ Pets API Error:', error.response?.data || error.message);
      throw error;
    }
  },

  // Lấy tất cả pets
  async getPets(params: { page?: number; limit?: number; type?: string } = {}) {
    const { page = 1, limit = 10, type } = params;
    let url = `/pets?page=${page}&limit=${limit}`;
    if (type) {
      url += `&type=${type}`;
    }
    const response = await api.get<ApiResponse<Pet[]>>(url);
    return response.data;
  },

  // Lấy pet theo ID
  async getPetById(id: string) {
    const response = await api.get<ApiResponse<Pet>>(`/pets/${id}`);
    return response.data;
  },

  // Lấy filter options cho pets
  async getFilterOptions() {
    try {
      const response = await api.get<ApiResponse<any>>('/pets/filter-options');
      return response.data;
    } catch (error: any) {
      console.error('❌ Pets Filter Options Error:', error.response?.data || error.message);
      throw error;
    }
  },
};