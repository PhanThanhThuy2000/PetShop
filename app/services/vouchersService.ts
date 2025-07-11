// api-services.ts
import { ApiResponse, Voucher } from '../types';
import api from '../utils/api-client';

export const vouchersService = {
    async getVouchers(params: { page?: number; limit?: number } = {}, isAdmin: boolean = false) {
        const { page = 1, limit = 10 } = params;
        const url = isAdmin ? `/vouchers/admin?page=${page}&limit=${limit}` : `/vouchers?page=${page}&limit=${limit}`;
        const response = await api.get<ApiResponse<Voucher[]>>(url);
        return response.data;
    },

    async saveVoucher(voucherId: string) {
        const response = await api.post<ApiResponse<Voucher>>(`/vouchers/save/${voucherId}`, {});
        return response.data;
    }
};