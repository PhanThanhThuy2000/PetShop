// api-services.ts
import { ApiResponse, Pet, Product } from '../types';
import api from '../utils/api-client';

export const petsService = {
  async getPets(params: { page?: number; limit?: number; type?: string } = {}) {
    const { page = 1, limit = 10, type } = params
    let url = `/pets?page=${page}&limit=${limit}`
    if (type) {
      url += `&type=${type}`
    }
    const response = await api.get<ApiResponse<Pet[]>>(url)
    return response.data
  },

  async searchPets(query: string, params: { page?: number; limit?: number } = {}) {
    const { page = 1, limit = 10 } = params
    const response = await api.get<ApiResponse<Pet[]>>(`/pets/search?q=${query}&page=${page}&limit=${limit}`)
    return response.data
  },

  async getPetById(id: string) {
    const response = await api.get<ApiResponse<Pet>>(`/pets/${id}`)
    return response.data
  },
}

export const productsService = {
  async getProducts(params: { page?: number; limit?: number; featured?: boolean } = {}) {
    const { page = 1, limit = 10, featured } = params
    let url = `/products?page=${page}&limit=${limit}`
    if (featured) {
      url += `&featured=true`
    }
    const response = await api.get<ApiResponse<Product[]>>(url)
    return response.data
  },

  async searchProducts(query: string, params: { page?: number; limit?: number } = {}) {
    const { page = 1, limit = 10 } = params
    const response = await api.get<ApiResponse<Product[]>>(`/products/search?q=${query}&page=${page}&limit=${limit}`)
    return response.data
  },

  async getProductById(id: string) {
    const response = await api.get<ApiResponse<Product>>(`/products/${id}`);
    return response.data;
  },
};
