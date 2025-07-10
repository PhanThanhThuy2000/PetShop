// api-services.ts
import { ApiResponse, Order, OrderItem } from '../types';
import api from '../utils/api-client';
// api-services.ts
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
  };