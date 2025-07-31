// OrderApiService.ts
import { ApiResponse, Order, OrderItem } from '../types';
import api from '../utils/api-client';

export const ordersService = {
    async getMyOrders(params: { page?: number; limit?: number } = {}) {
        const { page = 1, limit = 10 } = params;
        const response = await api.get<ApiResponse<Order[]>>(`/orders?page=${page}&limit=${limit}`);
        return response.data;
    },

    async getOrderById(id: string) {
        const response = await api.get<ApiResponse<Order>>(`/orders/${id}`);
        return response.data;
    },

    async getMyOrderItems(params: { page?: number; limit?: number } = {}) {
        const { page = 1, limit = 10 } = params;
        const response = await api.get<ApiResponse<OrderItem[]>>(`/order_items?page=${page}&limit=${limit}`);
        return response.data;
    },

    async getOrderItemById(id: string) {
        const response = await api.get<ApiResponse<OrderItem>>(`/order_items/${id}`);
        return response.data;
    },

    async getOrderItemsByOrderId(orderId: string) {
        const response = await api.get<ApiResponse<OrderItem[]>>(`/order_items/by-order/${orderId}`);
        return response.data;
    },

    async searchOrderItems(params: { query: string; page?: number; limit?: number }) {
        const { query, page = 1, limit = 10 } = params;
        const response = await api.get<ApiResponse<OrderItem[]>>(`/order_items/search?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);
        return response.data;
    },

    // CẬP NHẬT: Hủy đơn hàng sử dụng endpoint PATCH
    async cancelOrder(id: string) {
        try {
            const response = await api.patch(`/orders/${id}/cancel`);
            console.log('✅ Cancel order response:', response.data);

            // Handle backend response format: { success, message, data }
            if (response.data.success) {
                return {
                    success: true,
                    message: response.data.message,
                    data: response.data.data
                };
            } else {
                throw new Error(response.data.message || 'Cancel order failed');
            }
        } catch (error: any) {
            console.error('❌ Cancel order error:', error.response?.data || error.message);
            throw error;
        }
    },
};