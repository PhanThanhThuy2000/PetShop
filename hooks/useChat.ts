// app/hooks/useChat.ts
import { useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    addNewMessage,
    addOptimisticMessage,
    clearError,
    clearTypingUsers,
    createChatRoom,
    fetchChatHistory,
    fetchMyRooms,
    fetchUnreadCount,
    setConnectionStatus,
    setCurrentRoom,
    updateRoomStatus,
    updateTypingUsers
} from '../app/redux/slices/chatSlice';
import { AppDispatch, RootState } from '../app/redux/store';
import chatApiService from '../app/services/chatApiService';
import chatSocketService from '../app/services/chatSocketService';
import { SocketNewMessageData, SocketRoomUpdatedData, SocketStaffJoinedData, SocketUserTypingData } from '../app/types';

export const useChat = () => {
  const dispatch = useDispatch<AppDispatch>();
  const chatState = useSelector((state: RootState) => state.chat);
  const authState = useSelector((state: RootState) => state.auth);
  
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentUserRef = useRef<any>(null);

  // ================================
  // SOCKET CONNECTION & SETUP
  // ================================

  const initializeChatConnection = useCallback(async () => {
    if (!authState.token) {
      console.log('❌ No auth token, cannot initialize chat');
      return false;
    }
    try {
      console.log('🔥 Initializing chat connection...');

      // Setup socket event listeners
      setupSocketListeners();

      // Connect to socket server
      const connected = await chatSocketService.connect();
      if (!connected) {
        console.log('❌ Failed to connect to chat server');
        return false;
      }

      // Authenticate with server
      const authenticated = await chatSocketService.authenticate();
      if (!authenticated) {
        console.log('❌ Failed to authenticate with chat server');
        return false;
      }

      // Get current user info
      const userResponse = await chatApiService.getCurrentUser();
      if (userResponse.success) {
        currentUserRef.current = userResponse.data.user;
      }

      console.log('✅ Chat connection initialized successfully');
      return true;

    } catch (error) {
      console.error('❌ Chat initialization error:', error);
      return false;
    }
  }, [authState.token]);

  const setupSocketListeners = useCallback(() => {
    // Connection status
    chatSocketService.onConnectionChange = (connected: boolean) => {
      dispatch(setConnectionStatus(connected));
    };

    // New message received
    chatSocketService.onNewMessage = (data: SocketNewMessageData) => {
      console.log('🔥 useChat: onNewMessage received:', data.content?.substring(0, 50));
      console.log('🔥 useChat: dispatching addNewMessage to Redux...');
      dispatch(addNewMessage(data));
    };

    // Typing indicators
    chatSocketService.onUserTyping = (data: SocketUserTypingData) => {
      dispatch(updateTypingUsers(data));
    };

    // Staff joined notification
    chatSocketService.onStaffJoined = (data: SocketStaffJoinedData) => {
      // Add system message
      const systemMessage: SocketNewMessageData = {
        id: `system_${Date.now()}`,
        roomId: chatState.currentRoom?._id || '',
        content: data.message,
        messageType: 'system',
        sender: {
          id: 'system',
          username: 'System',
          role: 'Admin'
        },
        timestamp: new Date().toISOString(),
        isRead: true
      };
      dispatch(addNewMessage(systemMessage));
    };

    // Room status updates
    chatSocketService.onRoomUpdated = (data: SocketRoomUpdatedData) => {
      dispatch(updateRoomStatus({
        roomId: data.roomId,
        updates: data.updates
      }));
    };

    // Error handling
    chatSocketService.onError = (error: string) => {
      console.error('Socket error:', error);
    };
  }, [dispatch, chatState.currentRoom]);

  // ================================
  // CHAT ACTIONS
  // ================================

  const createNewChatRoom = useCallback(async (subject?: string, priority?: 'low' | 'medium' | 'high') => {
    try {
      const result = await dispatch(createChatRoom({
        subject: subject || 'Customer Support',
        priority: priority || 'medium'
      }));

      if (createChatRoom.fulfilled.match(result)) {
        // Join the room via socket
        chatSocketService.joinRoom(result.payload._id);
        return result.payload;
      }
      
      return null;
    } catch (error) {
      console.error('Error creating chat room:', error);
      return null;
    }
  }, [dispatch]);

  const joinChatRoom = useCallback(async (roomId: string) => {
    try {
      // Fetch chat history
      const result = await dispatch(fetchChatHistory({ roomId }));
      
      if (fetchChatHistory.fulfilled.match(result)) {
        // Join room via socket for real-time updates
        chatSocketService.joinRoom(roomId);
        
        // Clear typing indicators when switching rooms
        dispatch(clearTypingUsers());
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error joining chat room:', error);
      return false;
    }
  }, [dispatch]);

  const sendMessage = useCallback((content: string, messageType: 'text' | 'image' | 'file' = 'text') => {
    if (!chatState.currentRoom || !currentUserRef.current) {
      console.log('❌ No current room or user info');
      return;
    }

    if (!content.trim()) {
      console.log('❌ Cannot send empty message');
      return;
    }

    // Generate temporary ID for optimistic update
    const tempId = `temp_${Date.now()}_${Math.random()}`;

    // Add optimistic message to UI
    dispatch(addOptimisticMessage({
      tempId,
      content: content.trim(),
      roomId: chatState.currentRoom._id,
      userId: currentUserRef.current.id,
      username: currentUserRef.current.username
    }));

    // Send via socket
    chatSocketService.sendMessage(
      chatState.currentRoom._id,
      content.trim(),
      messageType
    );

    // Stop typing indicator
    stopTyping();

    // 🔥 DISABLE auto-remove optimistic message
    // Let the real message replace it via addNewMessage reducer
    // The reducer will automatically replace optimistic messages
    console.log('💬 Message sent, waiting for real message to replace optimistic one');

  }, [chatState.currentRoom, dispatch]);

  const startTyping = useCallback(() => {
    if (!chatState.currentRoom) return;

    chatSocketService.sendTyping(chatState.currentRoom._id, true);

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Auto-stop typing after 3 seconds
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  }, [chatState.currentRoom]);

  const stopTyping = useCallback(() => {
    if (!chatState.currentRoom) return;

    chatSocketService.sendTyping(chatState.currentRoom._id, false);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [chatState.currentRoom]);

  const leaveChatRoom = useCallback(() => {
    if (chatState.currentRoom) {
      chatSocketService.leaveRoom(chatState.currentRoom._id);
      dispatch(setCurrentRoom(null));
      dispatch(clearTypingUsers());
    }
  }, [chatState.currentRoom, dispatch]);

  const loadMyRooms = useCallback(() => {
    dispatch(fetchMyRooms());
  }, [dispatch]);

  const refreshUnreadCount = useCallback(() => {
    dispatch(fetchUnreadCount());
  }, [dispatch]);

  const clearChatError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  // ================================
  // LIFECYCLE MANAGEMENT
  // ================================

  useEffect(() => {
    if (authState.token && !chatState.isConnected) {
      initializeChatConnection();
    }

    return () => {
      // Cleanup typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [authState.token, chatState.isConnected, initializeChatConnection]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      chatSocketService.disconnect();
    };
  }, []);

  // ================================
  // RETURN HOOK INTERFACE
  // ================================

  return {
    // State
    ...chatState,
    
    // Actions
    createNewChatRoom,
    joinChatRoom,
    sendMessage,
    startTyping,
    stopTyping,
    leaveChatRoom,
    loadMyRooms,
    refreshUnreadCount,
    clearChatError,
    
    // Connection
    isConnected: chatState.isConnected,
    
    // Utils
    getTypingText: () => {
      if (chatState.typingUsers.length === 0) return '';
      if (chatState.typingUsers.length === 1) return `${chatState.typingUsers[0]} is typing...`;
      if (chatState.typingUsers.length === 2) return `${chatState.typingUsers.join(' and ')} are typing...`;
      return `${chatState.typingUsers.length} people are typing...`;
    }
  };
};

export default useChat;