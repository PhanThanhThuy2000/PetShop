// app/redux/slices/chatSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { 
  ChatState, 
  ChatRoom, 
  ChatMessage, 
  CreateChatRoomRequest,
  SocketNewMessageData,
  SocketUserTypingData,
  ApiResponse,
  ChatRoomsResponse,
  ChatHistoryResponse,
  UnreadCountResponse
} from '../../types';
import chatApiService from '../../services/chatApiService';

const initialState: ChatState = {
  currentRoom: null,
  rooms: [],
  messages: [],
  isConnected: false,
  isLoadingRooms: false,
  isLoadingMessages: false,
  isSendingMessage: false,
  typingUsers: [],
  unreadCount: 0,
  error: null,
};

// ================================
// ASYNC THUNKS - API CALLS
// ================================

// Tạo chat room mới
export const createChatRoom = createAsyncThunk(
  'chat/createChatRoom',
  async (data: CreateChatRoomRequest, { rejectWithValue }) => {
    try {
      const response = await chatApiService.createChatRoom(data);
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to create chat room';
      return rejectWithValue(message);
    }
  }
);

// Lấy danh sách rooms của user
export const fetchMyRooms = createAsyncThunk(
  'chat/fetchMyRooms',
  async (params: { page?: number; limit?: number } = {}, { rejectWithValue }) => {
    try {
      const { page = 1, limit = 10 } = params;
      const response = await chatApiService.getMyRooms(page, limit);
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to fetch rooms';
      return rejectWithValue(message);
    }
  }
);

// Lấy lịch sử chat
export const fetchChatHistory = createAsyncThunk(
  'chat/fetchChatHistory',
  async (params: { roomId: string; page?: number; limit?: number }, { rejectWithValue }) => {
    try {
      const { roomId, page = 1, limit = 50 } = params;
      const response = await chatApiService.getChatHistory(roomId, page, limit);
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to fetch chat history';
      return rejectWithValue(message);
    }
  }
);

// Lấy số tin nhắn chưa đọc
export const fetchUnreadCount = createAsyncThunk(
  'chat/fetchUnreadCount',
  async (_, { rejectWithValue }) => {
    try {
      const response = await chatApiService.getUnreadCount();
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to fetch unread count';
      return rejectWithValue(message);
    }
  }
);

// Đánh dấu tin nhắn đã đọc
export const markMessageAsRead = createAsyncThunk(
  'chat/markMessageAsRead',
  async (messageId: string, { rejectWithValue }) => {
    try {
      await chatApiService.markMessageAsRead(messageId);
      return messageId;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to mark message as read';
      return rejectWithValue(message);
    }
  }
);

// ================================
// CHAT SLICE
// ================================

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    // Socket connection state
    setConnectionStatus: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
      if (!action.payload) {
        state.typingUsers = []; // Clear typing when disconnected
      }
    },

    // Set current active room
    setCurrentRoom: (state, action: PayloadAction<ChatRoom | null>) => {
      state.currentRoom = action.payload;
      state.messages = []; // Clear messages when switching room
      state.typingUsers = []; // Clear typing indicators
    },

    // Add new message (from Socket.IO)
    addNewMessage: (state, action: PayloadAction<SocketNewMessageData>) => {
      const messageData = action.payload;
      
      console.log('🔥 Redux: Adding new message:', messageData.content?.substring(0, 50));
      
      // Convert socket message data to ChatMessage format
      const newMessage: ChatMessage = {
        _id: messageData.id,
        room_id: messageData.roomId,
        sender_id: {
          _id: messageData.sender.id,
          username: messageData.sender.username,
          avatar_url: messageData.sender.avatar_url,
          role: messageData.sender.role as 'User' | 'Staff' | 'Admin'
        },
        content: messageData.content,
        message_type: messageData.messageType as 'text' | 'image' | 'file' | 'system',
        is_read: messageData.isRead,
        read_by: [],
        created_at: messageData.timestamp,
        updated_at: messageData.timestamp
      };

      // Only add if message is for current room
      if (state.currentRoom && messageData.roomId === state.currentRoom._id) {
        // 🔥 FIX: Check for both real ID and temp ID duplicates
        const existingMessageIndex = state.messages.findIndex(msg => 
          msg._id === messageData.id || 
          msg._id.startsWith('temp_') // Remove any optimistic messages
        );
        
        if (existingMessageIndex !== -1) {
          console.log('🔄 Redux: Replacing existing message at index:', existingMessageIndex);
          // Replace existing message (could be optimistic)
          state.messages[existingMessageIndex] = newMessage;
        } else {
          console.log('➕ Redux: Adding new message to state');
          state.messages.push(newMessage);
        }
        
        console.log('📊 Redux: Total messages after add:', state.messages.length);
        
        // 🔥 FIX: Reset sending state when real message arrives
        state.isSendingMessage = false;
      }

      // Update last_message_at for the room
      const room = state.rooms.find(r => r._id === messageData.roomId);
      if (room) {
        room.last_message_at = messageData.timestamp;
      }
    },

    // Add optimistic message (when user sends)
    addOptimisticMessage: (state, action: PayloadAction<{ 
      tempId: string; 
      content: string; 
      roomId: string; 
      userId: string;
      username: string;
    }>) => {
      const { tempId, content, roomId, userId, username } = action.payload;
      
      console.log('⚡ Redux: Adding optimistic message:', tempId);
      
      if (state.currentRoom && roomId === state.currentRoom._id) {
        const optimisticMessage: ChatMessage = {
          _id: tempId, // Temporary ID
          room_id: roomId,
          sender_id: {
            _id: userId,
            username: username,
            role: 'User'
          },
          content: content,
          message_type: 'text',
          is_read: false,
          read_by: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        state.messages.push(optimisticMessage);
        state.isSendingMessage = true;
        
        console.log('📊 Redux: Messages after optimistic add:', state.messages.length);
      }
    },

    // Remove optimistic message when real message arrives
    removeOptimisticMessage: (state, action: PayloadAction<string>) => {
      const tempId = action.payload;
      console.log('🗑️ Redux: Removing optimistic message:', tempId);
      console.log('📊 Redux: Messages before remove:', state.messages.length);
      
      const beforeCount = state.messages.length;
      state.messages = state.messages.filter(msg => msg._id !== tempId);
      const afterCount = state.messages.length;
      
      console.log('📊 Redux: Messages after remove:', afterCount);
      console.log('🔄 Redux: Removed count:', beforeCount - afterCount);
      
      state.isSendingMessage = false;
    },

    // Update typing users
    updateTypingUsers: (state, action: PayloadAction<SocketUserTypingData>) => {
      const { username, isTyping } = action.payload;
      
      if (isTyping) {
        // Add user to typing list if not already there
        if (!state.typingUsers.includes(username)) {
          state.typingUsers.push(username);
        }
      } else {
        // Remove user from typing list
        state.typingUsers = state.typingUsers.filter(user => user !== username);
      }
    },

    // Clear typing users (when changing room)
    clearTypingUsers: (state) => {
      state.typingUsers = [];
    },

    // Update room status (when staff joins, etc.)
    updateRoomStatus: (state, action: PayloadAction<{
      roomId: string;
      updates: Partial<ChatRoom>;
    }>) => {
      const { roomId, updates } = action.payload;
      
      const room = state.rooms.find(r => r._id === roomId);
      if (room) {
        Object.assign(room, updates);
      }
      
      if (state.currentRoom && state.currentRoom._id === roomId) {
        Object.assign(state.currentRoom, updates);
      }
    },

    // Clear error
    clearError: (state) => {
      state.error = null;
    },

    // Reset chat state (when logout)
    resetChatState: (state) => {
      Object.assign(state, initialState);
    },

    // Set messages loading state
    setMessagesLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoadingMessages = action.payload;
    }
  },

  extraReducers: (builder) => {
    builder
      // Create Chat Room
      .addCase(createChatRoom.pending, (state) => {
        state.isLoadingRooms = true;
        state.error = null;
      })
      .addCase(createChatRoom.fulfilled, (state, action) => {
        state.isLoadingRooms = false;
        state.currentRoom = action.payload;
        
        // Add to rooms list if not already there
        const existingRoom = state.rooms.find(r => r._id === action.payload._id);
        if (!existingRoom) {
          state.rooms.unshift(action.payload);
        }
      })
      .addCase(createChatRoom.rejected, (state, action) => {
        state.isLoadingRooms = false;
        state.error = action.payload as string;
      })

      // Fetch My Rooms
      .addCase(fetchMyRooms.pending, (state) => {
        state.isLoadingRooms = true;
        state.error = null;
      })
      .addCase(fetchMyRooms.fulfilled, (state, action) => {
        state.isLoadingRooms = false;
        state.rooms = action.payload.rooms;
      })
      .addCase(fetchMyRooms.rejected, (state, action) => {
        state.isLoadingRooms = false;
        state.error = action.payload as string;
      })

      // Fetch Chat History
      .addCase(fetchChatHistory.pending, (state) => {
        state.isLoadingMessages = true;
        state.error = null;
      })
      .addCase(fetchChatHistory.fulfilled, (state, action) => {
        state.isLoadingMessages = false;
        state.messages = action.payload.messages;
        state.currentRoom = action.payload.room;
      })
      .addCase(fetchChatHistory.rejected, (state, action) => {
        state.isLoadingMessages = false;
        state.error = action.payload as string;
      })

      // Fetch Unread Count
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload.total_unread;
      })

      // Mark Message As Read
      .addCase(markMessageAsRead.fulfilled, (state, action) => {
        const messageId = action.payload;
        const message = state.messages.find(msg => msg._id === messageId);
        if (message) {
          message.is_read = true;
        }
      });
  },
});

// Export actions
export const {
  setConnectionStatus,
  setCurrentRoom,
  addNewMessage,
  addOptimisticMessage,
  removeOptimisticMessage,
  updateTypingUsers,
  clearTypingUsers,
  updateRoomStatus,
  clearError,
  resetChatState,
  setMessagesLoading
} = chatSlice.actions;

// Export reducer
export default chatSlice.reducer;