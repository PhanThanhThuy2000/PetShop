// app/redux/slices/appointmentSlice.ts
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { AppointmentSearchParams, appointmentService } from '../../services/appointmentService';
import { AppointmentState, CreateAppointmentRequest, UpdateAppointmentRequest, UpdateAppointmentStatusRequest } from '../../types';

const initialState: AppointmentState = {
    appointments: [],
    currentAppointment: null,
    availableSlots: [],
    isLoading: false,
    error: null,
    pagination: undefined,
};

// Async thunks
export const createAppointment = createAsyncThunk(
    'appointments/createAppointment',
    async (data: CreateAppointmentRequest, { rejectWithValue }) => {
        try {
            const response = await appointmentService.createAppointment(data);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Không thể tạo lịch hẹn');
        }
    }
);

export const getUserAppointments = createAsyncThunk(
    'appointments/getUserAppointments',
    async (params: AppointmentSearchParams = {}, { rejectWithValue }) => {
        try {
            const response = await appointmentService.getUserAppointments(params);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Không thể tải danh sách lịch hẹn');
        }
    }
);

export const getAppointmentById = createAsyncThunk(
    'appointments/getAppointmentById',
    async (id: string, { rejectWithValue }) => {
        try {
            const response = await appointmentService.getAppointmentById(id);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Không thể tải chi tiết lịch hẹn');
        }
    }
);

export const updateAppointment = createAsyncThunk(
    'appointments/updateAppointment',
    async ({ id, data }: { id: string; data: UpdateAppointmentRequest }, { rejectWithValue }) => {
        try {
            const response = await appointmentService.updateAppointment(id, data);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Không thể cập nhật lịch hẹn');
        }
    }
);

export const cancelAppointment = createAsyncThunk(
    'appointments/cancelAppointment',
    async (id: string, { rejectWithValue }) => {
        try {
            const response = await appointmentService.cancelAppointment(id);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Không thể hủy lịch hẹn');
        }
    }
);

export const getAvailableSlots = createAsyncThunk(
    'appointments/getAvailableSlots',
    async (date: string, { rejectWithValue }) => {
        try {
            const response = await appointmentService.getAvailableSlots(date);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Không thể tải khung giờ trống');
        }
    }
);

export const getAllAppointments = createAsyncThunk(
    'appointments/getAllAppointments',
    async (params: AppointmentSearchParams & { date?: string } = {}, { rejectWithValue }) => {
        try {
            const response = await appointmentService.getAllAppointments(params);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Không thể tải danh sách lịch hẹn');
        }
    }
);

export const updateAppointmentStatus = createAsyncThunk(
    'appointments/updateAppointmentStatus',
    async ({ id, data }: { id: string; data: UpdateAppointmentStatusRequest }, { rejectWithValue }) => {
        try {
            const response = await appointmentService.updateAppointmentStatus(id, data);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Không thể cập nhật trạng thái lịch hẹn');
        }
    }
);

const appointmentSlice = createSlice({
    name: 'appointments',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        clearCurrentAppointment: (state) => {
            state.currentAppointment = null;
        },
        clearAvailableSlots: (state) => {
            state.availableSlots = [];
        },
        resetAppointmentState: () => initialState,
    },
    extraReducers: (builder) => {
        builder
            // Create appointment
            .addCase(createAppointment.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(createAppointment.fulfilled, (state, action) => {
                state.isLoading = false;
                state.appointments.unshift(action.payload);
                state.currentAppointment = action.payload;
            })
            .addCase(createAppointment.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })

            // Get user appointments
            .addCase(getUserAppointments.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(getUserAppointments.fulfilled, (state, action) => {
                state.isLoading = false;
                state.appointments = action.payload.appointments;
                state.pagination = action.payload.pagination;
            })
            .addCase(getUserAppointments.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })

            // Get appointment by ID
            .addCase(getAppointmentById.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(getAppointmentById.fulfilled, (state, action) => {
                state.isLoading = false;
                state.currentAppointment = action.payload;
            })
            .addCase(getAppointmentById.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })

            // Update appointment
            .addCase(updateAppointment.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(updateAppointment.fulfilled, (state, action) => {
                state.isLoading = false;
                const index = state.appointments.findIndex(app => app._id === action.payload._id);
                if (index !== -1) {
                    state.appointments[index] = action.payload;
                }
                state.currentAppointment = action.payload;
            })
            .addCase(updateAppointment.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })

            // Cancel appointment
            .addCase(cancelAppointment.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(cancelAppointment.fulfilled, (state, action) => {
                state.isLoading = false;
                const index = state.appointments.findIndex(app => app._id === action.payload._id);
                if (index !== -1) {
                    state.appointments[index] = action.payload;
                }
                state.currentAppointment = action.payload;
            })
            .addCase(cancelAppointment.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })

            // Get available slots
            .addCase(getAvailableSlots.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(getAvailableSlots.fulfilled, (state, action) => {
                state.isLoading = false;
                state.availableSlots = action.payload.availableSlots;
            })
            .addCase(getAvailableSlots.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })

            // Get all appointments (Admin)
            .addCase(getAllAppointments.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(getAllAppointments.fulfilled, (state, action) => {
                state.isLoading = false;
                state.appointments = action.payload.appointments;
                state.pagination = action.payload.pagination;
            })
            .addCase(getAllAppointments.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })

            // Update appointment status (Admin)
            .addCase(updateAppointmentStatus.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(updateAppointmentStatus.fulfilled, (state, action) => {
                state.isLoading = false;
                const index = state.appointments.findIndex(app => app._id === action.payload._id);
                if (index !== -1) {
                    state.appointments[index] = action.payload;
                }
                state.currentAppointment = action.payload;
            })
            .addCase(updateAppointmentStatus.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });
    },
});

export const {
    clearError,
    clearCurrentAppointment,
    clearAvailableSlots,
    resetAppointmentState
} = appointmentSlice.actions;

export default appointmentSlice.reducer;