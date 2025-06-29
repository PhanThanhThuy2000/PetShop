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
  created_at: string;
  updated_at: string;
}

export const categoriesService = {
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
};