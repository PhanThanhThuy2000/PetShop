import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { ApiResponse, AuthState, LoginRequest, RegisterRequest, User } from '../../types';
import api from '../../utils/api-client';

const initialState: AuthState = {
  user: null,
  token: null,
  isLoading: false,
  error: null,
};

// Login user
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials: LoginRequest, { rejectWithValue }) => {
    try {
      const response = await api.post<ApiResponse<{ token: string }>>('/users/login', credentials);
      const { token } = response.data.data;
      
      await AsyncStorage.setItem('token', token);
      return { token };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed';
      return rejectWithValue(message);
    }
  }
);

// Register user
export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (userData: RegisterRequest, { rejectWithValue }) => {
    try {
      const response = await api.post<ApiResponse<{ token: string }>>('/users/register', userData);
      const { token } = response.data.data;
      
      await AsyncStorage.setItem('token', token);
      return { token };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Registration failed';
      return rejectWithValue(message);
    }
  }
);

// Get current user info
export const getCurrentUser = createAsyncThunk(
  'auth/getCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get<ApiResponse<{ user: User }>>('/users/me');
      return response.data.data.user;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to get user info';
      return rejectWithValue(message);
    }
  }
);

// Update user avatar
export const updateUserAvatar = createAsyncThunk(
  'auth/updateUserAvatar',
  async (avatarUri: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: AuthState };
      const user = state.auth.user;
      const userId = user?.id || user?.id;
      
      if (!userId) {
        return rejectWithValue('User ID not found');
      }

      // Create FormData for image upload
      const formData = new FormData();
      formData.append('avatar', {
        uri: avatarUri,
        type: 'image/jpeg',
        name: 'avatar.jpg',
      } as any);

      const response = await api.put<ApiResponse<{ user: User }>>(`/users/${userId}/avatar`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data.data.user;
    } catch (error: any) {
      // If multipart upload fails, try sending as JSON
      try {
        const state = getState() as { auth: AuthState };
        const user = state.auth.user;
        const userId = user?.id || user?.id;
        
        const response = await api.put<ApiResponse<{ user: User }>>(`/users/${userId}`, {
          avatar_url: avatarUri
        });
        
        return response.data.data.user;
      } catch (jsonError: any) {
        const message = error.response?.data?.message || 'Failed to update avatar';
        return rejectWithValue(message);
      }
    }
  }
);

// Update user profile
export const updateUserProfile = createAsyncThunk(
  'auth/updateUserProfile',
  async (userData: Partial<User>, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: AuthState };
      const user = state.auth.user;
      const userId = user?.id || user?.id;
      
      if (!userId) {
        return rejectWithValue('User ID not found');
      }

      const response = await api.put<ApiResponse<{ user: User }>>(`/users/${userId}`, userData);
      return response.data.data.user;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update profile';
      return rejectWithValue(message);
    }
  }
);

// Load token from storage
export const loadTokenFromStorage = createAsyncThunk(
  'auth/loadTokenFromStorage',
  async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      return token;
    } catch (error) {
      console.error('Error loading token:', error);
      return null;
    }
  }
);

// Logout user
export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      // Try to call API logout first (while token is still valid)
      try {
        await api.post('/users/logout', {});
      } catch (apiError: any) {
        console.warn('logout:', apiError.response?.data?.message || apiError.message);
      }
      await AsyncStorage.removeItem('token');
      return true;
    } catch (error: any) {
      console.error('Error during logout:', error);
      return true;
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setUser: (state, action) => {
      state.user = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        const decodedToken = JSON.parse(atob(action.payload.token.split('.')[1]));
        if (decodedToken.status === 'banned' || decodedToken.status === 'suspended') {
            state.error = 'Your account is not allowed to log in.';
            state.token = null;
            return;
        }
        state.token = action.payload.token;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Register
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.token = action.payload.token;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Get current user
      .addCase(getCurrentUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.isLoading = false;
        // Normalize the user object to ensure we have both id and id
        const user = action.payload;
        if (user.id && !user.id) {
          user.id = user.id;
        } else if (user.id && !user.id) {
          user.id = user.id;
        }
        state.user = user;
        state.error = null;
      })
      .addCase(getCurrentUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Update user avatar
      .addCase(updateUserAvatar.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateUserAvatar.fulfilled, (state, action) => {
        state.isLoading = false;
        // Update user with new avatar
        const user = action.payload;
        if (user.id && !user.id) {
          user.id = user.id;
        } else if (user.id && !user.id) {
          user.id = user.id;
        }
        state.user = user;
        state.error = null;
      })
      .addCase(updateUserAvatar.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Update user profile
      .addCase(updateUserProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Load token
      .addCase(loadTokenFromStorage.fulfilled, (state, action) => {
        if (action.payload) {
          state.token = action.payload;
        }
      })
      
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.error = null;
      });
  },
});

export const { clearError, setUser } = authSlice.actions;
export default authSlice.reducer;