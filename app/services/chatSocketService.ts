import AsyncStorage from '@react-native-async-storage/async-storage';
import io, { Socket } from 'socket.io-client';
import {
    SocketAuthData,
    SocketJoinRoomData,
    SocketNewMessageData,
    SocketRoomUpdatedData,
    SocketSendMessageData,
    SocketStaffJoinedData,
    SocketTypingData,
    SocketUserTypingData
} from '../types';

class ChatSocketService {
  private socket: Socket | null = null;
  private serverUrl = 'http://10.0.2.2:5000';
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
    this.socket.emit('join_room', { roomId } as SocketJoinRoomData);
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
    
    this.socket.emit('send_message', {
      roomId,
      content: content.trim(),
      messageType
    } as SocketSendMessageData);
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
    this.socket.on('new_message', (data: SocketNewMessageData) => {
      console.log('📨 New message received:', data.content?.substring(0, 50));
      this.onNewMessage?.(data);
    });

    this.socket.on('user_typing', (data: SocketUserTypingData) => {
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
      console.log('✅ Successfully joined room:', data.roomId);
    });

    this.socket.on('message_sent', (data) => {
      console.log('✅ Message sent confirmation:', data.messageId);
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