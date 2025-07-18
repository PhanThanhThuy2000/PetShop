
// app/utils/api.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
export const API_BASE_URL = "http://192.168.0.102:5000/api"

// app/utils/api.ts

// Ngân hàng: NCB
// Số thẻ: 9704198526191432198
// Tên chủ thẻ: NGUYEN VAN A
// Ngày phát hành: 07/15
// Mật khẩu OTP: 123456
//192.168.1.134 - duc
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
      // console.warn("Interceptor: 401 Unauthorized -> clearing token.");
      await AsyncStorage.removeItem("token");
      // TODO: Optional - navigate to login screen here
    }

    return Promise.reject(error);
  }
);
export default api;