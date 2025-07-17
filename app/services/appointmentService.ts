// app/services/appointmentService.ts
import { ApiResponse, Appointment, AvailableSlotsResponse, CreateAppointmentRequest, UpdateAppointmentRequest, UpdateAppointmentStatusRequest } from '../types';
import api from '../utils/api-client';

export interface AppointmentSearchParams {
    status?: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
    page?: number;
    limit?: number;
}

export interface AppointmentListResponse {
    appointments: Appointment[];
    pagination: {
        currentPage: number;
        totalPages: number;
        totalCount: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
    };
}

export const appointmentService = {
    // Tạo lịch hẹn mới
    async createAppointment(data: CreateAppointmentRequest): Promise<ApiResponse<Appointment>> {
        try {
            console.log('🏥 Creating appointment:', data);
            const response = await api.post<ApiResponse<Appointment>>('/appointments', data);
            console.log('✅ Appointment created:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('❌ Create appointment error:', error.response?.data || error.message);
            throw error;
        }
    },

    // Lấy danh sách lịch hẹn của user
    async getUserAppointments(params: AppointmentSearchParams = {}): Promise<ApiResponse<AppointmentListResponse>> {
        try {
            const queryParams = new URLSearchParams();
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    queryParams.append(key, value.toString());
                }
            });

            const response = await api.get<ApiResponse<AppointmentListResponse>>(
                `/appointments/my-appointments?${queryParams.toString()}`
            );
            return response.data;
        } catch (error: any) {
            console.error('❌ Get user appointments error:', error.response?.data || error.message);
            throw error;
        }
    },

    // Lấy chi tiết lịch hẹn
    async getAppointmentById(id: string): Promise<ApiResponse<Appointment>> {
        try {
            const response = await api.get<ApiResponse<Appointment>>(`/appointments/${id}`);
            return response.data;
        } catch (error: any) {
            console.error('❌ Get appointment by ID error:', error.response?.data || error.message);
            throw error;
        }
    },

    // Cập nhật lịch hẹn
    async updateAppointment(id: string, data: UpdateAppointmentRequest): Promise<ApiResponse<Appointment>> {
        try {
            console.log('🔄 Updating appointment:', id, data);
            const response = await api.put<ApiResponse<Appointment>>(`/appointments/${id}`, data);
            console.log('✅ Appointment updated:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('❌ Update appointment error:', error.response?.data || error.message);
            throw error;
        }
    },

    // Hủy lịch hẹn
    async cancelAppointment(id: string): Promise<ApiResponse<Appointment>> {
        try {
            console.log('❌ Cancelling appointment:', id);
            const response = await api.patch<ApiResponse<Appointment>>(`/appointments/${id}/cancel`);
            console.log('✅ Appointment cancelled:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('❌ Cancel appointment error:', error.response?.data || error.message);
            throw error;
        }
    },

    // Lấy khung giờ trống
    async getAvailableSlots(date: string): Promise<ApiResponse<AvailableSlotsResponse>> {
        try {
            console.log('🕒 Getting available slots for date:', date);
            const response = await api.get<ApiResponse<AvailableSlotsResponse>>(
                `/appointments/available-slots?date=${date}`
            );
            console.log('✅ Available slots:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('❌ Get available slots error:', error.response?.data || error.message);
            throw error;
        }
    },

    // ADMIN: Lấy tất cả lịch hẹn
    async getAllAppointments(params: AppointmentSearchParams & { date?: string } = {}): Promise<ApiResponse<AppointmentListResponse>> {
        try {
            const queryParams = new URLSearchParams();
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    queryParams.append(key, value.toString());
                }
            });

            const response = await api.get<ApiResponse<AppointmentListResponse>>(
                `/appointments/admin/all?${queryParams.toString()}`
            );
            return response.data;
        } catch (error: any) {
            console.error('❌ Get all appointments error:', error.response?.data || error.message);
            throw error;
        }
    },

    // ADMIN: Cập nhật trạng thái lịch hẹn
    async updateAppointmentStatus(id: string, data: UpdateAppointmentStatusRequest): Promise<ApiResponse<Appointment>> {
        try {
            console.log('🔄 Updating appointment status:', id, data);
            const response = await api.patch<ApiResponse<Appointment>>(`/appointments/admin/${id}/status`, data);
            console.log('✅ Appointment status updated:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('❌ Update appointment status error:', error.response?.data || error.message);
            throw error;
        }
    }
};