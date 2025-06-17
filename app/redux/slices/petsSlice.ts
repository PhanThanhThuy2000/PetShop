// app/redux/slices/petsSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { petsService } from '../../services/api';
import { Pet } from '../../types';

interface PetsState {
  pets: Pet[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  page: number;
}

const initialState: PetsState = {
  pets: [],
  loading: false,
  error: null,
  hasMore: true,
  page: 1,
};

// Async thunk để fetch pets từ server
export const fetchPets = createAsyncThunk(
  'pets/fetchPets',
  async (params: { page?: number; limit?: number; reset?: boolean } = {}) => {
    const { page = 1, limit = 10 } = params;
    const response = await api.get<ApiResponse<Pet[]>>(`/pets?page=${page}&limit=${limit}`);
    return {
      pets: response.data.data,
      page,
      hasMore: response.data.data.length === limit,
      reset: params.reset || false,
    };
  }
);

// Async thunk để fetch pets theo category
export const fetchPetsByCategory = createAsyncThunk(
  'pets/fetchPetsByCategory',
  async (params: { type: string; page?: number; limit?: number }) => {
    const { type, page = 1, limit = 10 } = params;
    const response = await api.get<ApiResponse<Pet[]>>(`/pets?type=${type}&page=${page}&limit=${limit}`);
    return {
      pets: response.data.data,
      page,
      hasMore: response.data.data.length === limit,
    };
  }
);

// Async thunk để search pets
export const searchPets = createAsyncThunk(
  'pets/searchPets',
  async (params: { query: string; page?: number; limit?: number }) => {
    const { query, page = 1, limit = 10 } = params;
    const response = await api.get<ApiResponse<Pet[]>>(`/pets/search?q=${query}&page=${page}&limit=${limit}`);
    return {
      pets: response.data.data,
      page,
      hasMore: response.data.data.length === limit,
    };
  }
);

const petsSlice = createSlice({
  name: 'pets',
  initialState,
  reducers: {
    clearPets: (state) => {
      state.pets = [];
      state.page = 1;
      state.hasMore = true;
      state.error = null;
    },
    resetPetsState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // fetchPets
      .addCase(fetchPets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPets.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.reset) {
          state.pets = action.payload.pets;
        } else {
          state.pets = [...state.pets, ...action.payload.pets];
        }
        state.page = action.payload.page;
        state.hasMore = action.payload.hasMore;
      })
      .addCase(fetchPets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch pets';
      })
      // fetchPetsByCategory
      .addCase(fetchPetsByCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPetsByCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.pets = action.payload.pets;
        state.page = action.payload.page;
        state.hasMore = action.payload.hasMore;
      })
      .addCase(fetchPetsByCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch pets by category';
      })
      // searchPets
      .addCase(searchPets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchPets.fulfilled, (state, action) => {
        state.loading = false;
        state.pets = action.payload.pets;
        state.page = action.payload.page;
        state.hasMore = action.payload.hasMore;
      })
      .addCase(searchPets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to search pets';
      });
  },
});

export const { clearPets, resetPetsState } = petsSlice.actions;
export default petsSlice.reducer;
