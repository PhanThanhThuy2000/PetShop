// app/services/appointmentService.ts - CẬP NHẬT XỬ LÝ LỖI HỦY LỊCH HẸN
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

// ✅ THÊM: Interface cho response lỗi từ server
export interface AppointmentError {
    success: false;
    message: string;
    data?: {
        currentStatus?: string;
        statusText?: string;
        canCancel?: boolean;
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

    // ✅ CẬP NHẬT: Hủy lịch hẹn với xử lý lỗi chi tiết hơn
    async cancelAppointment(id: string): Promise<ApiResponse<Appointment>> {
        try {
            console.log('❌ Cancelling appointment:', id);
            const response = await api.patch<ApiResponse<Appointment>>(`/appointments/${id}/cancel`);
            console.log('✅ Appointment cancelled:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('❌ Cancel appointment error:', {
                id,
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                message: error.message
            });

            // ✅ Xử lý các loại lỗi cụ thể
            if (error.response?.data) {
                const errorData = error.response.data as AppointmentError;

                // Nếu server trả về thông báo lỗi cụ thể, sử dụng nó
                if (errorData.message) {
                    throw new Error(errorData.message);
                }
            }

            // ✅ Xử lý theo status code
            switch (error.response?.status) {
                case 400:
                    throw new Error(
                        error.response.data?.message ||
                        'Không thể hủy lịch hẹn. Vui lòng kiểm tra trạng thái lịch hẹn.'
                    );
                case 401:
                    throw new Error('Bạn cần đăng nhập để thực hiện thao tác này.');
                case 403:
                    throw new Error('Bạn không có quyền hủy lịch hẹn này.');
                case 404:
                    throw new Error('Không tìm thấy lịch hẹn hoặc lịch hẹn không thuộc về bạn.');
                case 409:
                    throw new Error('Lịch hẹn đã được hủy hoặc có xung đột trạng thái.');
                case 500:
                    throw new Error('Lỗi server. Vui lòng thử lại sau hoặc liên hệ hỗ trợ.');
                default:
                    // Lỗi network hoặc timeout
                    if (error.code === 'NETWORK_ERROR' || error.message.includes('timeout')) {
                        throw new Error('Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet và thử lại.');
                    }

                    throw new Error(
                        error.response?.data?.message ||
                        'Không thể hủy lịch hẹn. Vui lòng thử lại sau.'
                    );
            }
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

    // ✅ THÊM: Kiểm tra xem có thể hủy lịch hẹn không (client-side validation)
    canCancelAppointment(appointment: Appointment): { allowed: boolean; message: string; isLateCancel?: boolean } {
        // Chỉ cho phép hủy khi status là 'pending'
        if (appointment.status !== 'pending') {
            let message = '';
            switch (appointment.status) {
                case 'confirmed':
                    message = 'Lịch hẹn đã được xác nhận và không thể hủy trực tiếp. Vui lòng liên hệ phòng khám để được hỗ trợ.';
                    break;
                case 'in_progress':
                    message = 'Lịch hẹn đang được thực hiện và không thể hủy.';
                    break;
                case 'completed':
                    message = 'Lịch hẹn đã hoàn thành và không thể hủy.';
                    break;
                case 'cancelled':
                    message = 'Lịch hẹn đã được hủy trước đó.';
                    break;
                default:
                    message = 'Không thể hủy lịch hẹn ở trạng thái hiện tại.';
            }
            return { allowed: false, message };
        }

        // Kiểm tra thời gian
        const appointmentDateTime = new Date(`${appointment.appointment_date}T${appointment.appointment_time}`);
        const now = new Date();

        if (appointmentDateTime <= now) {
            return {
                allowed: false,
                message: 'Không thể hủy lịch hẹn đã qua thời gian đặt lịch.'
            };
        }

        // Kiểm tra thời gian hủy muộn (trong vòng 2 giờ)
        const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
        const isLateCancel = appointmentDateTime <= twoHoursFromNow;

        return {
            allowed: true,
            message: '',
            isLateCancel
        };
    },

    // ✅ THÊM: Format status text cho hiển thị
    getStatusText(status: string): string {
        switch (status) {
            case 'pending':
                return 'Chờ xác nhận';
            case 'confirmed':
                return 'Đã xác nhận';
            case 'in_progress':
                return 'Đang thực hiện';
            case 'completed':
                return 'Hoàn thành';
            case 'cancelled':
                return 'Đã hủy';
            default:
                return status;
        }
    },

    // ✅ THÊM: Get status color cho UI
    getStatusColor(status: string): string {
        switch (status) {
            case 'pending':
                return '#F59E0B';
            case 'confirmed':
                return '#3B82F6';
            case 'in_progress':
                return '#8B5CF6';
            case 'completed':
                return '#10B981';
            case 'cancelled':
                return '#EF4444';
            default:
                return '#6B7280';
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