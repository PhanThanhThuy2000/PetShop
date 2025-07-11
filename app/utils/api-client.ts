
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

export const API_BASE_URL = "http://192.168.0.104:5000/api"
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
})

// Interceptor duy nhất để tự động thêm token vào mỗi yêu cầu
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem("token")
      console.log("API Client Interceptor: Token retrieved from AsyncStorage:", token) // Debug: Kiểm tra token lấy được

      // Chỉ thêm token nếu nó tồn tại và không phải là chuỗi 'null'
      if (token && token !== "null") {
        config.headers.Authorization = `Bearer ${token}`
        console.log("API Client Interceptor: Authorization header set to:", config.headers.Authorization) // Debug: Kiểm tra header đã đặt
      } else {
        console.log(
          'API Client Interceptor: No valid token found or token is "null" string. Authorization header not set.',
        )
      }
    } catch (error) {
      console.error("API Client Interceptor Error: Failed to get token from AsyncStorage:", error)
    }
    return config
  },
  (error) => {
    // Xử lý lỗi trước khi gửi yêu cầu
    return Promise.reject(error)
  },
)

// Interceptor để xử lý response (ví dụ: xóa token khi 401 Unauthorized)
api.interceptors.response.use(
  (response) => {
    return response
  },
  async (error) => {
    if (error.response?.status === 401) {
      console.warn("API Response Error: 401 Unauthorized. Removing token from AsyncStorage.")
      await AsyncStorage.removeItem("token")
      // Bạn có thể thêm logic điều hướng người dùng về màn hình đăng nhập ở đây nếu cần
    }

    return Promise.reject(error)
  },
)
export default api;

