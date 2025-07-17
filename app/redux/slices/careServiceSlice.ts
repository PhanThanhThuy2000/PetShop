// app/redux/slices/careServiceSlice.ts
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { CareServiceSearchParams, careServiceService } from '../../services/careServiceService';
import { CareServiceState, CreateCareServiceRequest, UpdateCareServiceRequest } from '../../types';

const initialState: CareServiceState = {
    services: [],
    categories: [],
    currentService: null,
    isLoading: false,
    error: null,
};

// Async thunks
export const getAllServices = createAsyncThunk(
    'careServices/getAllServices',
    async (params: CareServiceSearchParams = {}, { rejectWithValue }) => {
        try {
            const response = await careServiceService.getAllServices(params);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Không thể tải danh sách dịch vụ');
        }
    }
);

export const getServiceById = createAsyncThunk(
    'careServices/getServiceById',
    async (id: string, { rejectWithValue }) => {
        try {
            const response = await careServiceService.getServiceById(id);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Không thể tải thông tin dịch vụ');
        }
    }
);

export const getCategories = createAsyncThunk(
    'careServices/getCategories',
    async (_, { rejectWithValue }) => {
        try {
            const response = await careServiceService.getCategories();
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Không thể tải danh sách categories');
        }
    }
);

export const getServicesByCategory = createAsyncThunk(
    'careServices/getServicesByCategory',
    async (category: string, { rejectWithValue }) => {
        try {
            const response = await careServiceService.getServicesByCategory(category);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Không thể tải dịch vụ theo category');
        }
    }
);

export const createService = createAsyncThunk(
    'careServices/createService',
    async (data: CreateCareServiceRequest, { rejectWithValue }) => {
        try {
            const response = await careServiceService.createService(data);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Không thể tạo dịch vụ');
        }
    }
);

export const updateService = createAsyncThunk(
    'careServices/updateService',
    async ({ id, data }: { id: string; data: UpdateCareServiceRequest }, { rejectWithValue }) => {
        try {
            const response = await careServiceService.updateService(id, data);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Không thể cập nhật dịch vụ');
        }
    }
);

export const deleteService = createAsyncThunk(
    'careServices/deleteService',
    async (id: string, { rejectWithValue }) => {
        try {
            await careServiceService.deleteService(id);
            return id;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Không thể xóa dịch vụ');
        }
    }
);

const careServiceSlice = createSlice({
    name: 'careServices',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        clearCurrentService: (state) => {
            state.currentService = null;
        },
        resetCareServiceState: () => initialState,
    },
    extraReducers: (builder) => {
        builder
            // Get all services
            .addCase(getAllServices.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(getAllServices.fulfilled, (state, action) => {
                state.isLoading = false;
                state.services = action.payload;
            })
            .addCase(getAllServices.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })

            // Get service by ID
            .addCase(getServiceById.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(getServiceById.fulfilled, (state, action) => {
                state.isLoading = false;
                state.currentService = action.payload;
            })
            .addCase(getServiceById.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })

            // Get categories
            .addCase(getCategories.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(getCategories.fulfilled, (state, action) => {
                state.isLoading = false;
                state.categories = action.payload;
            })
            .addCase(getCategories.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })

            // Get services by category
            .addCase(getServicesByCategory.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(getServicesByCategory.fulfilled, (state, action) => {
                state.isLoading = false;
                state.services = action.payload;
            })
            .addCase(getServicesByCategory.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })

            // Create service
            .addCase(createService.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(createService.fulfilled, (state, action) => {
                state.isLoading = false;
                state.services.unshift(action.payload);
                state.currentService = action.payload;
            })
            .addCase(createService.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })

            // Update service
            .addCase(updateService.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(updateService.fulfilled, (state, action) => {
                state.isLoading = false;
                const index = state.services.findIndex(service => service._id === action.payload._id);
                if (index !== -1) {
                    state.services[index] = action.payload;
                }
                state.currentService = action.payload;
            })
            .addCase(updateService.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })

            // Delete service
            .addCase(deleteService.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(deleteService.fulfilled, (state, action) => {
                state.isLoading = false;
                state.services = state.services.filter(service => service._id !== action.payload);
                if (state.currentService?._id === action.payload) {
                    state.currentService = null;
                }
            })
            .addCase(deleteService.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });
    },
});

export const {
    clearError,
    clearCurrentService,
    resetCareServiceState
} = careServiceSlice.actions;

export default careServiceSlice.reducer;