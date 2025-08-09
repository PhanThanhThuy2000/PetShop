import AsyncStorage from '@react-native-async-storage/async-storage';
import io, { Socket } from 'socket.io-client';
import {
  SocketAuthData,
  SocketJoinRoomData,
  SocketNewMessageData,
  SocketRoomUpdatedData,
  SocketStaffJoinedData,
  SocketTypingData,
  SocketUserTypingData
} from '../types';
import { API_BASE_URL } from '../utils/api-client';

class ChatSocketService {
  private socket: Socket | null = null;
  // Derive socket server from REST API base to avoid environment mismatch
  private serverUrl = API_BASE_URL.replace(/\/?api\/?$/, '');
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  // Event callbacks - sẽ được set từ components
  public onConnectionChange?: (connected: boolean) => void;
  public onNewMessage?: (message: SocketNewMessageData) => void;
  public onUserTyping?: (data: SocketUserTypingData) => void;
  public onStaffJoined?: (data: SocketStaffJoinedData) => void;
  public onRoomUpdated?: (data: SocketRoomUpdatedData) => void;
  public onError?: (error: string) => void;

  /**
   * Kết nối Socket.IO
   */
  async connect(): Promise<boolean> {
    try {
      if (this.socket?.connected) {
        console.log('🔌 Socket already connected');
        return true;
      }

      console.log('🔌 Connecting to Socket.IO server...');

      this.socket = io(this.serverUrl, {
        transports: ['websocket'],
        autoConnect: false,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        timeout: 10000
      });

      this.setupEventListeners();
      this.socket.connect();

      // Wait for connection or timeout
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          console.log('❌ Socket connection timeout');
          resolve(false);
        }, 10000);

        this.socket?.on('connect', () => {
          clearTimeout(timeout);
          console.log('✅ Socket connected successfully');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.onConnectionChange?.(true);
          resolve(true);
        });

        this.socket?.on('connect_error', (error) => {
          clearTimeout(timeout);
          console.log('❌ Socket connection error:', error.message);
          this.onError?.(`Connection failed: ${error.message}`);
          resolve(false);
        });
      });

    } catch (error) {
      console.error('❌ Socket connection error:', error);
      this.onError?.(`Failed to connect: ${error}`);
      return false;
    }
  }

  /**
   * Xác thực với server
   */
  async authenticate(): Promise<boolean> {
    try {
      if (!this.socket?.connected) {
        console.log('❌ Socket not connected, cannot authenticate');
        return false;
      }

      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.log('❌ No token found for authentication');
        this.onError?.('No authentication token found');
        return false;
      }

      console.log('🔐 Authenticating with server...');

      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          console.log('❌ Authentication timeout');
          resolve(false);
        }, 5000);

        // Listen for auth success
        this.socket?.once('authenticated', (data) => {
          clearTimeout(timeout);
          console.log('✅ Authentication successful:', data.user?.username);
          resolve(true);
        });

        // Listen for auth error
        this.socket?.once('auth_error', (data) => {
          clearTimeout(timeout);
          console.log('❌ Authentication failed:', data.message);
          this.onError?.(`Authentication failed: ${data.message}`);
          resolve(false);
        });

        // Send auth event
        this.socket?.emit('authenticate', { token } as SocketAuthData);
      });

    } catch (error) {
      console.error('❌ Authentication error:', error);
      this.onError?.(`Authentication error: ${error}`);
      return false;
    }
  }

  /**
   * Join room để nhận messages
   */
  joinRoom(roomId: string): void {
    if (!this.socket?.connected) {
      console.log('❌ Socket not connected, cannot join room');
      return;
    }

    console.log(`📥 Joining room: ${roomId}`);
    console.log('🔥 Socket connected:', this.socket.connected);
    console.log('🔥 Socket ID:', this.socket.id);
    console.log('🔥 Emitting join_chat event...');
    
    // Server expects 'join_chat'
    this.socket.emit('join_chat', { roomId } as SocketJoinRoomData);
  }

  /**
   * Leave room
   */
  leaveRoom(roomId: string): void {
    if (!this.socket?.connected) {
      return;
    }

    console.log(`📤 Leaving room: ${roomId}`);
    this.socket.emit('leave_room', { roomId });
  }

  /**
   * Gửi tin nhắn
   */
  sendMessage(roomId: string, content: string, messageType: 'text' | 'image' | 'file' = 'text'): void {
    if (!this.socket?.connected) {
      console.log('❌ Socket not connected, cannot send message');
      this.onError?.('Not connected to chat server');
      return;
    }

    if (!content.trim()) {
      console.log('❌ Cannot send empty message');
      return;
    }

    console.log(`💬 Sending message to room ${roomId}: ${content.substring(0, 50)}...`);
    console.log('🔥 Socket connected:', this.socket.connected);
    console.log('🔥 Socket ID:', this.socket.id);
    
    const messageData = {
      roomId,
      content: content.trim(),
      messageType
    };
    
    console.log('🔥 Emitting send_message with data:', JSON.stringify(messageData, null, 2));
    
    this.socket.emit('send_message', messageData);
  }

  /**
   * Gửi typing indicator
   */
  sendTyping(roomId: string, isTyping: boolean): void {
    if (!this.socket?.connected) {
      return;
    }

    this.socket.emit(isTyping ? 'typing_start' : 'typing_stop', {
      roomId
    } as SocketTypingData);
  }

  /**
   * Ngắt kết nối
   */
  disconnect(): void {
    if (this.socket) {
      console.log('🔌 Disconnecting socket...');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.onConnectionChange?.(false);
    }
  }

  /**
   * Kiểm tra trạng thái kết nối
   */
  get connected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    if (!this.socket) return;
    // Connection events
    this.socket.on('connect', () => {
      console.log('✅ Socket connected');
      this.isConnected = true;
      this.onConnectionChange?.(true);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
      this.isConnected = false;
      this.onConnectionChange?.(false);
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 Socket reconnected after ${attemptNumber} attempts`);
      this.reconnectAttempts = 0;
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`🔄 Socket reconnection attempt ${attemptNumber}`);
      this.reconnectAttempts = attemptNumber;
    });

    this.socket.on('reconnect_failed', () => {
      console.log('❌ Socket reconnection failed');
      this.onError?.('Failed to reconnect to chat server');
    });

    // Chat events
    const normalizeId = (value: any): string => {
      if (!value) return '';
      if (typeof value === 'string') return value;
      if (typeof value === 'object') return value.id || value._id || '';
      return '';
    };

    const handleIncomingMessage = (raw: any) => {
      console.log('🔥 RAW MESSAGE RECEIVED:', JSON.stringify(raw, null, 2));

      const data: SocketNewMessageData = {
        id: normalizeId(raw.id) || normalizeId(raw._id) || normalizeId(raw.messageId),
        roomId:
          (typeof raw.roomId === 'object' ? normalizeId(raw.roomId) : raw.roomId) ||
          (typeof raw.room_id === 'object' ? normalizeId(raw.room_id) : raw.room_id) ||
          (typeof raw.room === 'object' ? normalizeId(raw.room) : raw.room) ||
          '',
        content: raw.content ?? raw.message ?? '',
        messageType: raw.messageType || raw.message_type || 'text',
        sender: {
          id: normalizeId(raw.sender) || normalizeId(raw.sender_id) || normalizeId(raw.user) || '',
          username: raw.sender?.username || raw.sender_id?.username || raw.user?.username || 'Unknown',
          avatar_url: raw.sender?.avatar_url || raw.sender_id?.avatar_url || raw.user?.avatar_url,
          role: raw.sender?.role || raw.sender_role || raw.sender_id?.role || 'Staff',
        },
        timestamp: raw.timestamp || raw.created_at || new Date().toISOString(),
        isRead: raw.isRead ?? raw.is_read ?? false,
      };

      console.log('📨 Normalized message data:', JSON.stringify(data, null, 2));
      console.log('📨 Calling onNewMessage callback...');
      this.onNewMessage?.(data);
    };

    // Primary event name
    this.socket.on('new_message', handleIncomingMessage);
    // Possible alternate event names from server
    this.socket.on('message', handleIncomingMessage);
    this.socket.on('message_created', handleIncomingMessage);
    this.socket.on('chat_message', handleIncomingMessage);
    this.socket.on('room_message', handleIncomingMessage);

    this.socket.on('user_typing', (raw: any) => {
      const data: SocketUserTypingData = {
        userId: raw.userId || raw.user_id || raw.id || '',
        username: raw.username || raw.user_name || 'Unknown',
        isTyping: raw.isTyping ?? raw.is_typing ?? false,
      };
      this.onUserTyping?.(data);
    });

    this.socket.on('staff_joined', (data: SocketStaffJoinedData) => {
      console.log('👮 Staff joined room:', data.staffName);
      this.onStaffJoined?.(data);
    });

    this.socket.on('room_updated', (data: SocketRoomUpdatedData) => {
      console.log('🔄 Room updated:', data.roomId);
      this.onRoomUpdated?.(data);
    });

    this.socket.on('room_joined', (data) => {
      console.log('✅ Successfully joined room:', JSON.stringify(data, null, 2));
    });

    this.socket.on('message_sent', (data) => {
      console.log('✅ Message sent confirmation:', JSON.stringify(data, null, 2));
    });

    this.socket.on('user_joined', (data) => {
      console.log('👤 User joined room:', JSON.stringify(data, null, 2));
    });

    this.socket.on('user_left', (data) => {
      console.log('👤 User left room:', JSON.stringify(data, null, 2));
    });

    // Error events
    this.socket.on('error', (data) => {
      console.log('❌ Socket error:', data.message);
      this.onError?.(data.message);
    });

    this.socket.on('connect_error', (error) => {
      console.log('❌ Socket connection error:', error.message);
      this.onError?.(`Connection error: ${error.message}`);
    });
  }

  /**
   * Clean up event listeners
   */
  removeAllListeners(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }
}

export default new ChatSocketService();