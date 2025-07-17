// app/services/careServiceService.ts
import { ApiResponse, CareService, CareServiceCategory, CreateCareServiceRequest, UpdateCareServiceRequest } from '../types';
import api from '../utils/api-client';

export interface CareServiceSearchParams {
    category?: 'grooming' | 'health' | 'bathing' | 'spa' | 'other';
    active?: boolean;
}

export const careServiceService = {
    // Lấy tất cả dịch vụ chăm sóc
    async getAllServices(params: CareServiceSearchParams = {}): Promise<ApiResponse<CareService[]>> {
        try {
            const queryParams = new URLSearchParams();
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    queryParams.append(key, value.toString());
                }
            });

            console.log('🔍 Getting care services with params:', params);
            const response = await api.get<ApiResponse<CareService[]>>(
                `/care-services?${queryParams.toString()}`
            );
            console.log('✅ Care services loaded:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('❌ Get care services error:', error.response?.data || error.message);
            throw error;
        }
    },

    // Lấy dịch vụ theo ID
    async getServiceById(id: string): Promise<ApiResponse<CareService>> {
        try {
            const response = await api.get<ApiResponse<CareService>>(`/care-services/${id}`);
            return response.data;
        } catch (error: any) {
            console.error('❌ Get service by ID error:', error.response?.data || error.message);
            throw error;
        }
    },

    // Lấy danh sách categories
    async getCategories(): Promise<ApiResponse<CareServiceCategory[]>> {
        try {
            console.log('🔍 Getting care service categories');
            const response = await api.get<ApiResponse<CareServiceCategory[]>>('/care-services/categories');
            console.log('✅ Categories loaded:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('❌ Get categories error:', error.response?.data || error.message);
            throw error;
        }
    },

    // Lấy dịch vụ theo category
    async getServicesByCategory(category: string): Promise<ApiResponse<CareService[]>> {
        try {
            console.log('🔍 Getting services by category:', category);
            const response = await api.get<ApiResponse<CareService[]>>(`/care-services/category/${category}`);
            console.log('✅ Services by category loaded:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('❌ Get services by category error:', error.response?.data || error.message);
            throw error;
        }
    },

    // ADMIN/STAFF: Tạo dịch vụ mới
    async createService(data: CreateCareServiceRequest): Promise<ApiResponse<CareService>> {
        try {
            console.log('🆕 Creating care service:', data);
            const response = await api.post<ApiResponse<CareService>>('/care-services', data);
            console.log('✅ Care service created:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('❌ Create service error:', error.response?.data || error.message);
            throw error;
        }
    },

    // ADMIN/STAFF: Cập nhật dịch vụ
    async updateService(id: string, data: UpdateCareServiceRequest): Promise<ApiResponse<CareService>> {
        try {
            console.log('🔄 Updating care service:', id, data);
            const response = await api.put<ApiResponse<CareService>>(`/care-services/${id}`, data);
            console.log('✅ Care service updated:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('❌ Update service error:', error.response?.data || error.message);
            throw error;
        }
    },

    // ADMIN: Xóa dịch vụ
    async deleteService(id: string): Promise<ApiResponse<void>> {
        try {
            console.log('🗑️ Deleting care service:', id);
            const response = await api.delete<ApiResponse<void>>(`/care-services/${id}`);
            console.log('✅ Care service deleted');
            return response.data;
        } catch (error: any) {
            console.error('❌ Delete service error:', error.response?.data || error.message);
            throw error;
        }
    }
};