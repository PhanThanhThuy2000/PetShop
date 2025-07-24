// app/services/petVariantService.ts
import api from '../utils/api-client';

import { ApiResponse, PetVariant, PetVariantOptions, VariantFilters } from '../types/index';

class PetVariantService {
    private baseUrl: string;

    constructor() {
        this.baseUrl = `${api}/api/pet-variants`;
    }

    // Lấy tất cả biến thể của một pet
    async getVariantsByPetId(petId: string): Promise<ApiResponse<PetVariant[]>> {
        try {
            const response = await fetch(`${this.baseUrl}/pet/${petId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Get variants by pet ID error:', error);
            throw new Error('Failed to fetch pet variants');
        }
    }

    // Lấy biến thể với filter
    async getVariantsWithFilter(
        petId: string,
        filters: VariantFilters
    ): Promise<ApiResponse<PetVariant[]>> {
        try {
            const queryParams = new URLSearchParams();

            if (filters.color) queryParams.append('color', filters.color);
            if (filters.gender) queryParams.append('gender', filters.gender);
            if (filters.minAge !== undefined) queryParams.append('minAge', filters.minAge.toString());
            if (filters.maxAge !== undefined) queryParams.append('maxAge', filters.maxAge.toString());
            if (filters.minWeight !== undefined) queryParams.append('minWeight', filters.minWeight.toString());
            if (filters.maxWeight !== undefined) queryParams.append('maxWeight', filters.maxWeight.toString());

            const response = await fetch(`${this.baseUrl}/pet/${petId}/filter?${queryParams}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Get filtered variants error:', error);
            throw new Error('Failed to fetch filtered variants');
        }
    }

    // Lấy options cho filter dropdown
    async getVariantOptions(petId: string): Promise<ApiResponse<PetVariantOptions>> {
        try {
            const response = await fetch(`${this.baseUrl}/pet/${petId}/options`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Get variant options error:', error);
            throw new Error('Failed to fetch variant options');
        }
    }

    // Lấy thông tin chi tiết một biến thể
    async getVariantById(variantId: string): Promise<ApiResponse<PetVariant>> {
        try {
            const response = await fetch(`${this.baseUrl}/${variantId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Get variant by ID error:', error);
            throw new Error('Failed to fetch variant details');
        }
    }

    // ================================
    // ADMIN/STAFF METHODS
    // ================================

    // Tạo biến thể mới (cần auth)
    async createVariant(
        variantData: Partial<PetVariant>,
        token: string
    ): Promise<ApiResponse<PetVariant>> {
        try {
            const response = await fetch(`${this.baseUrl}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(variantData),
            });

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Create variant error:', error);
            throw new Error('Failed to create variant');
        }
    }

    // Cập nhật biến thể (cần auth)
    async updateVariant(
        variantId: string,
        updateData: Partial<PetVariant>,
        token: string
    ): Promise<ApiResponse<PetVariant>> {
        try {
            const response = await fetch(`${this.baseUrl}/${variantId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(updateData),
            });

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Update variant error:', error);
            throw new Error('Failed to update variant');
        }
    }

    // Xóa biến thể (cần auth)
    async deleteVariant(variantId: string, token: string): Promise<ApiResponse<null>> {
        try {
            const response = await fetch(`${this.baseUrl}/${variantId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Delete variant error:', error);
            throw new Error('Failed to delete variant');
        }
    }
}

// Export singleton instance
export const petVariantService = new PetVariantService();
export default petVariantService;