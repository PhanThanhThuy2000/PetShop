// app/redux/slices/productsSlice.ts
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { ApiResponse, Product } from '../../types';
import api from '../../utils/api-client';

interface ProductsState {
  products: Product[];
  flashSaleProducts: Product[];
  loading: boolean;
  flashSaleLoading: boolean;
  error: string | null;
  hasMore: boolean;
  page: number;
}

const initialState: ProductsState = {
  products: [],
  flashSaleProducts: [],
  loading: false,
  flashSaleLoading: false,
  error: null,
  hasMore: true,
  page: 1,
};

// Async thunk để fetch products từ server
export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async (params: { page?: number; limit?: number; reset?: boolean } = {}) => {
    const { page = 1, limit = 10 } = params;
    const response = await api.get<ApiResponse<Product[]>>(`/products?page=${page}&limit=${limit}`);
    return {
      products: response.data.data,
      page,
      hasMore: response.data.data.length === limit,
      reset: params.reset || false,
    };
  }
);

// Async thunk để fetch flash sale products
export const fetchFlashSaleProducts = createAsyncThunk(
  'products/fetchFlashSaleProducts',
  async (params: { limit?: number } = {}) => {
    const { limit = 10 } = params;
    // Giả sử có endpoint cho flash sale hoặc sử dụng random products
    const response = await api.get<ApiResponse<Product[]>>(`/products?limit=${limit}&featured=true`);
    return response.data.data;
  }
);

// Async thunk để search products
export const searchProducts = createAsyncThunk(
  'products/searchProducts',
  async (params: { query: string; page?: number; limit?: number }) => {
    const { query, page = 1, limit = 10 } = params;
    const response = await api.get<ApiResponse<Product[]>>(`/products/search?q=${query}&page=${page}&limit=${limit}`);
    return {
      products: response.data.data,
      page,
      hasMore: response.data.data.length === limit,
    };
  }
);

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    clearProducts: (state) => {
      state.products = [];
      state.page = 1;
      state.hasMore = true;
      state.error = null;
    },
    resetProductsState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // fetchProducts
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.reset) {
          state.products = action.payload.products;
        } else {
          state.products = [...state.products, ...action.payload.products];
        }
        state.page = action.payload.page;
        state.hasMore = action.payload.hasMore;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch products';
      })
      // fetchFlashSaleProducts
      .addCase(fetchFlashSaleProducts.pending, (state) => {
        state.flashSaleLoading = true;
        state.error = null;
      })
      .addCase(fetchFlashSaleProducts.fulfilled, (state, action) => {
        state.flashSaleLoading = false;
        state.flashSaleProducts = action.payload;
      })
      .addCase(fetchFlashSaleProducts.rejected, (state, action) => {
        state.flashSaleLoading = false;
        state.error = action.error.message || 'Failed to fetch flash sale products';
      })
      // searchProducts
      .addCase(searchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload.products;
        state.page = action.payload.page;
        state.hasMore = action.payload.hasMore;
      })
      .addCase(searchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to search products';
      });
  },
});

export const { clearProducts, resetProductsState } = productsSlice.actions;
export default productsSlice.reducer;
