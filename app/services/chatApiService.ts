import { 
  ApiResponse, 
  ChatRoom, 
  ChatRoomsResponse, 
  ChatHistoryResponse, 
  UnreadCountResponse,
  CreateChatRoomRequest 
} from '../types';
import api from '../utils/api-client';

class ChatApiService {
  /**
   * Tạo chat room mới (Customer only)
   */
  async createChatRoom(data: CreateChatRoomRequest): Promise<ApiResponse<ChatRoom>> {
    const response = await api.post<ApiResponse<ChatRoom>>('/chat/rooms', data);
    return response.data;
  }

  /**
   * Lấy danh sách rooms của user hiện tại
   */
  async getMyRooms(page = 1, limit = 10): Promise<ApiResponse<ChatRoomsResponse>> {
    const response = await api.get<ApiResponse<ChatRoomsResponse>>(
      `/chat/rooms/my?page=${page}&limit=${limit}`
    );
    return response.data;
  }

  /**
   * Lấy lịch sử chat của một room
   */
  async getChatHistory(roomId: string, page = 1, limit = 50): Promise<ApiResponse<ChatHistoryResponse>> {
    const response = await api.get<ApiResponse<ChatHistoryResponse>>(
      `/chat/messages/${roomId}?page=${page}&limit=${limit}`
    );
    return response.data;
  }

  /**
   * Staff lấy danh sách rooms pending
   */
  async getPendingRooms(page = 1, limit = 10): Promise<ApiResponse<ChatRoomsResponse>> {
    const response = await api.get<ApiResponse<ChatRoomsResponse>>(
      `/chat/rooms/pending?page=${page}&limit=${limit}`
    );
    return response.data;
  }

  /**
   * Staff lấy danh sách rooms đã assign
   */
  async getAssignedRooms(page = 1, limit = 10): Promise<ApiResponse<ChatRoomsResponse>> {
    const response = await api.get<ApiResponse<ChatRoomsResponse>>(
      `/chat/rooms/assigned?page=${page}&limit=${limit}`
    );
    return response.data;
  }

  /**
   * Staff assign room cho bản thân
   */
  async assignRoom(roomId: string): Promise<ApiResponse<ChatRoom>> {
    const response = await api.patch<ApiResponse<ChatRoom>>(`/chat/rooms/${roomId}/assign`);
    return response.data;
  }

  /**
   * Đóng room
   */
  async closeRoom(roomId: string, reason?: string): Promise<ApiResponse<ChatRoom>> {
    const response = await api.patch<ApiResponse<ChatRoom>>(`/chat/rooms/${roomId}/close`, {
      reason
    });
    return response.data;
  }

  /**
   * Đánh dấu tin nhắn đã đọc
   */
  async markMessageAsRead(messageId: string): Promise<ApiResponse<null>> {
    const response = await api.patch<ApiResponse<null>>(`/chat/messages/${messageId}/read`);
    return response.data;
  }

  /**
   * Lấy số tin nhắn chưa đọc
   */
  async getUnreadCount(): Promise<ApiResponse<UnreadCountResponse>> {
    const response = await api.get<ApiResponse<UnreadCountResponse>>('/chat/unread-count');
    return response.data;
  }

  /**
   * Lấy user info hiện tại (để có username, role cho Socket)
   */
  async getCurrentUser() {
    const response = await api.get('/users/me');
    return response.data;
  }
}

export default new ChatApiService();