// app/services/socketService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import io, { Socket } from 'socket.io-client';
import { API_BASE_URL } from '../utils/api-client';

export interface SocketMessage {
  id: string;
  room_id: string;
  content: string;
  message_type: 'text' | 'image';
  image_url?: string;
  sender: {
    id: string;
    username: string;
    role: 'User' | 'Staff' | 'Admin';
    avatar_url?: string;
  };
  sender_role: 'User' | 'Staff' | 'Admin';
  created_at: string;
}

class CustomerSocketService {
  private socket: Socket | null = null;
  private isConnected: boolean = false;
  private listeners: { [event: string]: Function[] } = {};

  constructor() {
    this.listeners = {};
  }

  async connect(): Promise<boolean> {
    try {
      if (this.socket?.connected) {
        return true;
      }

      // Lấy server URL từ API base URL
      const serverUrl = API_BASE_URL.replace('/api', '');
      
      this.socket = io(serverUrl, {
        transports: ['websocket'],
        timeout: 20000,
        forceNew: true,
      });

      return new Promise((resolve, reject) => {
        if (!this.socket) {
          reject(new Error('Socket not initialized'));
          return;
        }

        this.socket.on('connect', () => {
          console.log('✅ Socket connected');
          this.isConnected = true;
          this.emit('connected', {});
          resolve(true);
        });

        this.socket.on('disconnect', () => {
          console.log('❌ Socket disconnected');
          this.isConnected = false;
          this.emit('disconnected', {});
        });

        this.socket.on('connect_error', (error) => {
          console.error('❌ Socket connection error:', error);
          this.isConnected = false;
          reject(error);
        });

        // Lắng nghe các events từ server
        this.socket.on('authenticated', (data) => {
          console.log('✅ Authentication successful:', data);
          this.emit('authenticated', data);
        });

        this.socket.on('auth_error', (error) => {
          console.error('❌ Authentication error:', error);
          this.emit('auth_error', error);
        });

        this.socket.on('room_joined', (data) => {
          console.log('✅ Room joined:', data);
          this.emit('room_joined', data);
        });

        this.socket.on('new_message', (message: SocketMessage) => {
          console.log('📩 New message received:', message);
          this.emit('new_message', message);
        });

        this.socket.on('message_sent', (data) => {
          console.log('✅ Message sent confirmation:', data);
          this.emit('message_sent', data);
        });

        this.socket.on('user_joined', (data) => {
          console.log('👤 User joined:', data);
          this.emit('user_joined', data);
        });

        this.socket.on('error', (error) => {
          console.error('❌ Socket error:', error);
          this.emit('error', error);
        });

        // Timeout cho connection
        setTimeout(() => {
          if (!this.isConnected) {
            reject(new Error('Connection timeout'));
          }
        }, 10000);
      });
    } catch (error) {
      console.error('Socket connection error:', error);
      throw error;
    }
  }

  async authenticate(): Promise<void> {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token || token === 'null') {
        throw new Error('No authentication token found');
      }

      if (this.socket && this.isConnected) {
        this.socket.emit('authenticate', { token });
      } else {
        throw new Error('Socket not connected');
      }
    } catch (error) {
      console.error('Authentication error:', error);
      throw error;
    }
  }

  joinRoom(roomId: string): void {
    if (this.socket && this.isConnected) {
      console.log('🚪 Joining room:', roomId);
      this.socket.emit('join_chat', { roomId });
    } else {
      console.error('❌ Cannot join room: Socket not connected');
    }
  }

  sendMessage(
    roomId: string, 
    content: string, 
    messageType: 'text' | 'image' = 'text', 
    imageUrl?: string
  ): void {
    if (this.socket && this.isConnected) {
      const messageData = {
        roomId,
        content,
        messageType,
        imageUrl: messageType === 'image' ? imageUrl : undefined,
      };
      
      console.log('📤 Sending message:', messageData);
      this.socket.emit('send_message', messageData);
    } else {
      console.error('❌ Cannot send message: Socket not connected');
    }
  }

  // Event listener management
  on(event: string, callback: Function): void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event: string, callback: Function): void {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  private emit(event: string, data: any): void {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  disconnect(): void {
    if (this.socket) {
      console.log('🔌 Disconnecting socket...');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.listeners = {};
    }
  }

  isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }
}

export const customerSocketService = new CustomerSocketService();
