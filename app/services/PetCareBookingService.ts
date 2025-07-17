// // app/services/api-services.ts - CẬP NHẬT để thêm appointment và care service exports
// import { ApiResponse, Order, OrderItem, Pet, Product, Voucher } from '../types';
// import api from '../utils/api-client';

// // Import appointment và care service services
// export { appointmentService } from './appointmentService';
// export { careServiceService } from './careServiceService';

// export const petsService = {
//     async getPets(params: { page?: number; limit?: number; type?: string } = {}) {
//         const { page = 1, limit = 10, type } = params;
//         let url = `/pets?page=${page}&limit=${limit}`;
//         if (type) {
//             url += `&type=${type}`;
//         }
//         const response = await api.get<ApiResponse<Pet[]>>(url);
//         return response.data;
//     },

//     async searchPets(params: {
//         keyword?: string;
//         page?: number;
//         limit?: number;
//         type?: string;
//         user_id?: string; // Thêm để filter pets của user
//     } = {}) {
//         const { page = 1, limit = 10, keyword, type, user_id } = params;

//         const queryParams = new URLSearchParams();
//         queryParams.append('page', page.toString());
//         queryParams.append('limit', limit.toString());

//         if (keyword) queryParams.append('keyword', keyword);
//         if (type) queryParams.append('type', type);
//         if (user_id) queryParams.append('user_id', user_id);

//         const response = await api.get<ApiResponse<{
//             pets: Pet[];
//             pagination: any;
//         }>>(`/pets/search?${queryParams.toString()}`);
//         return response.data;
//     },

//     async getPetById(id: string) {
//         const response = await api.get<ApiResponse<Pet>>(`/pets/${id}`);
//         return response.data;
//     },
// };

// export const productsService = {
//     async getProducts(params: { page?: number; limit?: number; featured?: boolean } = {}) {
//         const { page = 1, limit = 10, featured } = params;
//         let url = `/products?page=${page}&limit=${limit}`;
//         if (featured) {
//             url += `&featured=true`;
//         }
//         const response = await api.get<ApiResponse<Product[]>>(url);
//         return response.data;
//     },

//     async searchProducts(query: string, params: { page?: number; limit?: number } = {}) {
//         const { page = 1, limit = 10 } = params;
//         const response = await api.get<ApiResponse<Product[]>>(`/products/search?q=${query}&page=${page}&limit=${limit}`);
//         return response.data;
//     },

//     async getProductById(id: string) {
//         const response = await api.get<ApiResponse<Product>>(`/products/${id}`);
//         return response.data;
//     },
// };

// export const ordersService = {
//     async getMyOrders(params: { page?: number; limit?: number } = {}) {
//         const { page = 1, limit = 10 } = params;
//         const response = await api.get<ApiResponse<Order[]>>(`/orders?page=${page}&limit=${limit}`);
//         return response.data;
//     },

//     async getOrderById(id: string) {
//         const response = await api.get<ApiResponse<Order>>(`/orders/${id}`);
//         return response.data;
//     },

//     async getMyOrderItems(params: { page?: number; limit?: number } = {}) {
//         const { page = 1, limit = 10 } = params;
//         const response = await api.get<ApiResponse<OrderItem[]>>(`/order_items?page=${page}&limit=${limit}`);
//         return response.data;
//     },

//     async getOrderItemById(id: string) {
//         const response = await api.get<ApiResponse<OrderItem>>(`/order_items/${id}`);
//         return response.data;
//     },

//     async getOrderItemsByOrderId(orderId: string) {
//         const response = await api.get<ApiResponse<OrderItem[]>>(`/order_items/by-order/${orderId}`);
//         return response.data;
//     },
// };

// export const vouchersService = {
//     async getVouchers(params: { page?: number; limit?: number } = {}, isAdmin: boolean = false) {
//         const { page = 1, limit = 10 } = params;
//         const url = isAdmin ? `/vouchers/admin?page=${page}&limit=${limit}` : `/vouchers?page=${page}&limit=${limit}`;
//         const response = await api.get<ApiResponse<Voucher[]>>(url);
//         return response.data;
//     },

//     async saveVoucher(voucherId: string) {
//         const response = await api.post<ApiResponse<Voucher>>(`/vouchers/save/${voucherId}`, {});
//         return response.data;
//     }
// };