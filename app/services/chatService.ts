// app/services/chatService.ts
import api from '../utils/api-client';

export interface ChatRoom {
  _id: string;
  customer_id: {
    _id: string;
    username: string;
    email: string;
    avatar_url?: string;
  };
  status: 'open' | 'closed';
  created_at: string;
  updated_at: string;
  last_message?: {
    _id: string;
    content: string;
    message_type: 'text' | 'image';
    sender_role: 'User' | 'Staff' | 'Admin';
    created_at: string;
  };
}

export interface ChatMessage {
  _id: string;
  room_id: string;
  content: string;
  message_type: 'text' | 'image';
  image_url?: string;
  sender_id: {
    _id: string;
    username: string;
    role: 'User' | 'Staff' | 'Admin';
    avatar_url?: string;
  };
  // Keep both for compatibility
  sender?: {
    id: string;
    username: string;
    role: 'User' | 'Staff' | 'Admin';
    avatar_url?: string;
  };
  sender_role: 'User' | 'Staff' | 'Admin';
  created_at: string;
}

export interface ChatHistoryResponse {
  room: ChatRoom;
  messages: ChatMessage[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    limit: number;
  };
}

class CustomerChatService {
  // Bắt đầu chat - chỉ customer mới có thể làm điều này
  async startChat(): Promise<ChatRoom> {
    try {
      const response = await api.post('/chat/start');
      return response.data.data;
    } catch (error) {
      console.error('Start chat error:', error);
      throw error;
    }
  }

  // Lấy lịch sử chat
  async getChatHistory(roomId: string, page: number = 1, limit: number = 50): Promise<ChatHistoryResponse> {
    try {
      const response = await api.get(`/chat/history/${roomId}?page=${page}&limit=${limit}`);
      return response.data.data;
    } catch (error) {
      console.error('Get chat history error:', error);
      throw error;
    }
  }

  // Upload ảnh cho chat
  async uploadImage(imageFile: {
    uri: string;
    type: string;
    name: string;
  }): Promise<{ imageUrl: string; originalName: string; size: number }> {
    try {
      const formData = new FormData();
      formData.append('image', {
        uri: imageFile.uri,
        type: imageFile.type,
        name: imageFile.name,
      } as any);

      const response = await api.post('/chat/upload-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data.data;
    } catch (error) {
      console.error('Upload image error:', error);
      throw error;
    }
  }
}

export const customerChatService = new CustomerChatService();
