// app/utils/api.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

export const API_BASE_URL = 'http://192.168.55.102:5000/api'; 

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor request: Tự động thêm token vào mỗi request nếu có
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (token && token !== "null") {
        config.headers.Authorization = `Bearer ${token}`;
        console.log("Interceptor: Token attached:", config.headers.Authorization);
      } else {
        console.log("Interceptor: No valid token found.");
      }
    } catch (error) {
      console.error("Interceptor Request Error:", error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor response: Tự động xử lý khi bị 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      console.warn("Interceptor: 401 Unauthorized -> clearing token.");
      await AsyncStorage.removeItem("token");
      // TODO: Optional - navigate to login screen here
    }
    return Promise.reject(error);
  }
);

export default api;
