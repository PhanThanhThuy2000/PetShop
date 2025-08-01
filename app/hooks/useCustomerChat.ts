// app/hooks/useCustomerChat.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { ChatMessage, ChatRoom, customerChatService } from '../services/chatService';
import { customerSocketService, SocketMessage } from '../services/socketService';

export interface UseChatReturn {
  // State
  messages: ChatMessage[];
  chatRoom: ChatRoom | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  sendingImage: boolean;
  
  // Actions
  initializeChat: () => Promise<void>;
  sendMessage: (text: string) => void;
  sendImageMessage: (imageUri: string) => Promise<void>;
  clearError: () => void;
  disconnect: () => void;
}

export const useCustomerChat = (): UseChatReturn => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sendingImage, setSendingImage] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  useEffect(() => {
    return () => {
      customerSocketService.disconnect();
    };
  }, []);

  const setupSocketListeners = useCallback(() => {
    customerSocketService.on('authenticated', handleAuthenticated);
    customerSocketService.on('auth_error', handleAuthError);
    customerSocketService.on('room_joined', handleRoomJoined);
    customerSocketService.on('new_message', handleNewMessage);
    customerSocketService.on('error', handleSocketError);
    customerSocketService.on('disconnected', handleDisconnected);
  }, []);

  const handleAuthenticated = useCallback(async (data: any) => {
    try {
      setIsConnected(true);
      setError(null);
      console.log('Authentication successful:', data);
      
      // Bắt đầu chat (tạo hoặc lấy room)
      const room = await customerChatService.startChat();
      setChatRoom(room);
      
      // Join room
      customerSocketService.joinRoom(room._id);
      
    } catch (error: any) {
      console.error('Post-authentication error:', error);
      setError('Không thể khởi tạo phòng chat.');
    }
  }, []);

  const handleAuthError = useCallback((error: any) => {
    console.error('Auth error:', error);
    setError('Lỗi xác thực. Vui lòng đăng nhập lại.');
    setIsLoading(false);
  }, []);

  const handleRoomJoined = useCallback(async (data: any) => {
    try {
      if (chatRoom) {
        // Load chat history
        await loadChatHistory();
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
      setError('Không thể tải lịch sử chat.');
    } finally {
      setIsLoading(false);
    }
  }, [chatRoom]);

  const loadChatHistory = useCallback(async () => {
    try {
      if (!chatRoom) return;

      const historyData = await customerChatService.getChatHistory(chatRoom._id, 1, 50);
      setMessages(historyData.messages);
    } catch (error) {
      console.error('Load chat history error:', error);
      throw error;
    }
  }, [chatRoom]);

  const handleNewMessage = useCallback((message: SocketMessage) => {
    if (chatRoom && message.room_id === chatRoom._id) {
      const formattedMessage: ChatMessage = {
        _id: message.id,
        room_id: message.room_id,
        content: message.content,
        message_type: message.message_type,
        image_url: message.image_url,
        sender: message.sender,
        sender_role: message.sender_role,
        created_at: message.created_at,
      };

      setMessages(prev => [...prev, formattedMessage]);
    }
  }, [chatRoom]);

  const handleSocketError = useCallback((error: any) => {
    console.error('Socket error:', error);
    setError(error.message || 'Có lỗi xảy ra với kết nối.');
  }, []);

  const handleDisconnected = useCallback(() => {
    setIsConnected(false);
    setError('Kết nối đã bị ngắt.');
  }, []);

  const initializeChat = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Lấy thông tin user từ AsyncStorage
      const userDataString = await AsyncStorage.getItem('userData');
      if (userDataString) {
        const userData = JSON.parse(userDataString);
        setCurrentUserId(userData._id);
      }

      // Kết nối socket
      await customerSocketService.connect();
      
      // Setup socket event listeners
      setupSocketListeners();
      
      // Authenticate
      await customerSocketService.authenticate();
      
    } catch (error: any) {
      console.error('Initialize chat error:', error);
      setError('Không thể kết nối đến server. Vui lòng thử lại.');
      setIsLoading(false);
    }
  }, [setupSocketListeners]);

  const sendMessage = useCallback((text: string) => {
    if (!chatRoom || !text.trim()) return;
    
    try {
      customerSocketService.sendMessage(chatRoom._id, text.trim(), 'text');
    } catch (error: any) {
      console.error('Send message error:', error);
      setError('Không thể gửi tin nhắn. Vui lòng thử lại.');
    }
  }, [chatRoom]);

  const sendImageMessage = useCallback(async (imageUri: string) => {
    if (!chatRoom) return;
    
    try {
      setSendingImage(true);
      
      // Upload image
      const uploadResult = await customerChatService.uploadImage({
        uri: imageUri,
        type: 'image/jpeg',
        name: 'image.jpg',
      });

      // Send image message
      customerSocketService.sendMessage(
        chatRoom._id,
        'Đã gửi một hình ảnh',
        'image',
        uploadResult.imageUrl
      );
      
    } catch (error: any) {
      console.error('Image upload error:', error);
      setError('Không thể tải lên hình ảnh. Vui lòng thử lại.');
    } finally {
      setSendingImage(false);
    }
  }, [chatRoom]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const disconnect = useCallback(() => {
    customerSocketService.disconnect();
    setIsConnected(false);
    setMessages([]);
    setChatRoom(null);
  }, []);

  return {
    messages,
    chatRoom,
    isConnected,
    isLoading,
    error,
    sendingImage,
    initializeChat,
    sendMessage,
    sendImageMessage,
    clearError,
    disconnect,
  };
};
