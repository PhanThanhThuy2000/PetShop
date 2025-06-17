// app/redux/slices/cartSlice.ts
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { AddToCartRequest, ApiResponse, CartItem, CartState } from '../../types';
import api from '../../utils/api';

const initialState: CartState = {
  items: [],
  totalItems: 0,
  totalAmount: 0,
  isLoading: false,
  error: null,
};

// Add to cart - sử dụng API: POST /api/cart
export const addToCart = createAsyncThunk(
  'cart/addToCart',
  async (cartData: AddToCartRequest, { rejectWithValue }) => {
    try {
      console.log('🛒 Redux: Adding to cart:', cartData);
      const response = await api.post<ApiResponse<CartItem>>('/cart', cartData);
      return {
        item: response.data.data,
        message: response.data.message,
        isUpdate: response.data.statusCode === 200
      };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to add to cart';
      return rejectWithValue({
        message,
        statusCode: error.response?.status || 500
      });
    }
  }
);

// Get cart - sử dụng API: GET /api/cart
export const getCart = createAsyncThunk(
  'cart/getCart',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get<ApiResponse<{
        items: CartItem[];
        totalItems: number;
        totalAmount: number;
        totalQuantity: number;
      }>>('/cart');
      
      return response.data.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to get cart';
      return rejectWithValue(message);
    }
  }
);

// Update cart item - sử dụng API: PUT /api/cart/:id
export const updateCartItem = createAsyncThunk(
  'cart/updateCartItem',
  async ({ id, quantity }: { id: string; quantity: number }, { rejectWithValue }) => {
    try {
      const response = await api.put<ApiResponse<CartItem>>(`/cart/${id}`, { quantity });
      return response.data.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update cart item';
      return rejectWithValue(message);
    }
  }
);

// Remove from cart - sử dụng API: DELETE /api/cart/:id
export const removeFromCart = createAsyncThunk(
  'cart/removeFromCart',
  async (id: string, { rejectWithValue }) => {
    try {
      await api.delete(`/cart/${id}`);
      return id;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to remove from cart';
      return rejectWithValue(message);
    }
  }
);

// Clear cart - sử dụng API: DELETE /api/cart
export const clearCart = createAsyncThunk(
  'cart/clearCart',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.delete<ApiResponse<{ deletedCount: number }>>('/cart');
      return response.data.data?.deletedCount || 0;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to clear cart';
      return rejectWithValue(message);
    }
  }
);

// Get cart count - sử dụng API: GET /api/cart/count
export const getCartCount = createAsyncThunk(
  'cart/getCartCount',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get<ApiResponse<{ count: number; totalQuantity: number }>>('/cart/count');
      return response.data.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to get cart count';
      return rejectWithValue(message);
    }
  }
);

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    clearCartError: (state) => {
      state.error = null;
    },
    resetCart: (state) => {
      state.items = [];
      state.totalItems = 0;
      state.totalAmount = 0;
      state.error = null;
    },
    // Local state update for optimistic UI
    optimisticAddToCart: (state, action) => {
      const { pet_id, product_id, quantity } = action.payload;
      const existingItemIndex = state.items.findIndex(item => 
        (pet_id && item.pet_id?._id === pet_id) || 
        (product_id && item.product_id?._id === product_id)
      );
      
      if (existingItemIndex >= 0) {
        // Update existing item
        state.items[existingItemIndex].quantity += quantity;
      } else {
        // Add new item (will be replaced by real data from server)
        const newItem = {
          _id: 'temp-' + Date.now(),
          user_id: 'temp',
          pet_id: pet_id ? { _id: pet_id, name: 'Loading...', price: 0 } : null,
          product_id: product_id ? { _id: product_id, name: 'Loading...', price: 0 } : null,
          quantity,
          added_at: new Date().toISOString()
        } as CartItem;
        state.items.unshift(newItem);
      }
      
      // Recalculate totals
      state.totalItems = state.items.length;
      state.totalAmount = state.items.reduce((sum, item) => {
        const price = item.pet_id?.price || item.product_id?.price || 0;
        return sum + (price * item.quantity);
      }, 0);
    },
  },
  extraReducers: (builder) => {
    builder
      // Add to cart
      .addCase(addToCart.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;
        // Don't update state here, let getCart handle it
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Get cart
      .addCase(getCart.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getCart.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload.items;
        state.totalItems = action.payload.totalItems;
        state.totalAmount = action.payload.totalAmount;
        state.error = null;
      })
      .addCase(getCart.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Update cart item
      .addCase(updateCartItem.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateCartItem.fulfilled, (state) => {
        state.isLoading = false;
        // Will be updated by getCart call
      })
      .addCase(updateCartItem.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Remove from cart
      .addCase(removeFromCart.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(removeFromCart.fulfilled, (state, action) => {
        state.isLoading = false;
        // Optimistically remove from UI
        state.items = state.items.filter(item => item._id !== action.payload);
        state.totalItems = state.items.length;
        state.totalAmount = state.items.reduce((sum, item) => {
          const price = item.pet_id?.price || item.product_id?.price || 0;
          return sum + (price * item.quantity);
        }, 0);
      })
      .addCase(removeFromCart.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Clear cart
      .addCase(clearCart.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(clearCart.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = [];
        state.totalItems = 0;
        state.totalAmount = 0;
      })
      .addCase(clearCart.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Get cart count
      .addCase(getCartCount.fulfilled, (state, action) => {
        state.totalItems = action.payload.count;
      });
  },
});

export const { clearCartError, resetCart, optimisticAddToCart } = cartSlice.actions;
export default cartSlice.reducer;