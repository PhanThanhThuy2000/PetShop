// userService.ts
import { ApiResponse, User, LoginRequest, RegisterRequest } from '../types';
import api from '../utils/api-client';

export const userService = {
  // Login user
  async login(credentials: LoginRequest) {
    const response = await api.post<ApiResponse<{ token: string }>>('/users/login', credentials);
    return response.data;
  },

  // Register user
  async register(userData: RegisterRequest) {
    const response = await api.post<ApiResponse<{ token: string }>>('/users/register', userData);
    return response.data;
  },

  // Get current user info
  async getCurrentUser() {
    const response = await api.get<ApiResponse<{ user: User }>>('/users/me');
    return response.data;
  },

  // Update user profile
  async updateProfile(userId: string, userData: Partial<User>) {
    const response = await api.put<ApiResponse<{ user: User }>>(`/users/${userId}`, userData);
    return response.data;
  },

  // Get user by ID
  async getUserById(userId: string) {
    const response = await api.get<ApiResponse<{ user: User }>>(`/users/${userId}`);
    return response.data;
  },

  // Update user avatar (for future implementation)
  async updateAvatar(userId: string, avatarData: FormData) {
    const response = await api.put<ApiResponse<{ user: User }>>(
      `/users/${userId}/avatar`, 
      avatarData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  // Change password (for future implementation)
  async changePassword(currentPassword: string, newPassword: string) {
    const response = await api.put<ApiResponse<{ message: string }>>('/users/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },

  // Delete account (for future implementation)
  async deleteAccount(password: string) {
    const response = await api.delete<ApiResponse<{ message: string }>>('/users/me', {
      data: { password }
    });
    return response.data;
  },
};