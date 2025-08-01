// app/screens/CustomerSupportChatScreen.tsx
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { ChatMessage, ChatRoom, customerChatService } from '../services/chatService';
import { customerSocketService, SocketMessage } from '../services/socketService';

const { width, height } = Dimensions.get('window');

interface ChatBubbleMessage {
  _id: string;
  content: string;
  message_type: 'text' | 'image';
  image_url?: string;
  sender: {
    id: string;
    username: string;
    role: 'User' | 'Staff' | 'Admin';
    avatar_url?: string;
  };
  created_at: string;
  isOwnMessage: boolean;
}

const CustomerSupportChatScreen: React.FC = () => {
  const navigation = useNavigation();
  const [messages, setMessages] = useState<ChatBubbleMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [connectionError, setConnectionError] = useState<string>('');
  const [sendingImage, setSendingImage] = useState(false);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);

  const mountedRef = useRef(true);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    initializeChat();
    
    return () => {
      mountedRef.current = false;
      customerSocketService.disconnect();
    };
  }, []);

  // Debug effect để theo dõi messages
  useEffect(() => {
    console.log('Messages updated:', messages.length);
  }, [messages]);

  // Effect để auto-scroll khi có messages mới
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages.length]);

  const initializeChat = async () => {
    try {
      setLoading(true);
      setConnectionError('');

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
      
    } catch (error) {
      console.error('Initialize chat error:', error);
      setConnectionError('Không thể kết nối đến server. Vui lòng thử lại.');
      setLoading(false);
    }
  };

  const setupSocketListeners = () => {
    customerSocketService.on('authenticated', handleAuthenticated);
    customerSocketService.on('auth_error', handleAuthError);
    customerSocketService.on('room_joined', handleRoomJoined);
    customerSocketService.on('new_message', handleNewMessage);
    customerSocketService.on('error', handleSocketError);
    customerSocketService.on('disconnected', handleDisconnected);
  };

  const handleAuthenticated = async (data: any) => {
    try {
      setIsConnected(true);
      console.log('Authentication successful:', data);
      
      // Bắt đầu chat (tạo hoặc lấy room)
      const room = await customerChatService.startChat();
      setChatRoom(room);
      
      // Join room
      customerSocketService.joinRoom(room._id);
      
      // Load chat history ngay sau khi có room
      await loadChatHistory(room);
      
    } catch (error) {
      console.error('Post-authentication error:', error);
      setConnectionError('Không thể khởi tạo phòng chat.');
    } finally {
      setLoading(false);
    }
  };

  const handleAuthError = (error: any) => {
    console.error('Auth error:', error);
    setConnectionError('Lỗi xác thực. Vui lòng đăng nhập lại.');
    setLoading(false);
  };

  const handleRoomJoined = async (data: any) => {
    console.log('Room joined successfully:', data);
    // History đã được load trong handleAuthenticated
    // Chỉ cần set loading = false nếu chưa được set
    if (loading) {
      setLoading(false);
    }
  };

  const loadChatHistory = async (room?: ChatRoom) => {
    try {
      setLoadingHistory(true);
      const targetRoom = room || chatRoom;
      if (!targetRoom) return;

      console.log('Loading chat history for room:', targetRoom._id);
      const historyData = await customerChatService.getChatHistory(targetRoom._id, 1, 50);
      
      console.log('Raw history data:', historyData);
      console.log('Messages array:', historyData.messages);
      
      // Debug first message structure
      if (historyData.messages && historyData.messages.length > 0) {
        console.log('First message raw:', JSON.stringify(historyData.messages[0], null, 2));
      }
      
      const formattedMessages = formatMessagesForChat(historyData.messages);
      
      console.log('Formatted messages:', formattedMessages.length);
      
      if (mountedRef.current) {
        setMessages(formattedMessages);
        scrollToBottom();
      }
    } catch (error) {
      console.error('Load chat history error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      // Show user-friendly error
      setConnectionError('Không thể tải lịch sử chat. Vui lòng thử lại.');
      
      // Retry sau 3 giây nếu lỗi
      setTimeout(() => {
        if (mountedRef.current && !connectionError) {
          console.log('Retrying loadChatHistory...');
          loadChatHistory(room);
        }
      }, 3000);
    } finally {
      setLoadingHistory(false);
    }
  };

  const formatMessagesForChat = (chatMessages: ChatMessage[]): ChatBubbleMessage[] => {
    if (!chatMessages || !Array.isArray(chatMessages)) {
      console.warn('Invalid chatMessages:', chatMessages);
      return [];
    }

    return chatMessages.map((msg, index) => {
      try {
        // Handle both backend structures: sender_id (from backend) vs sender (from interface)
        const senderData = (msg as any).sender_id || msg.sender;
        
        console.log(`🔍 Message ${index} sender data:`, senderData);
        
        if (!senderData) {
          console.error(`Message ${index} has no sender data:`, msg);
          // Return a fallback message
          return {
            _id: msg._id || `error_${index}`,
            content: msg.content || 'Tin nhắn lỗi',
            message_type: msg.message_type || 'text',
            image_url: msg.image_url,
            sender: {
              id: 'unknown',
              username: 'Unknown User',
              role: 'User' as const,
              avatar_url: undefined,
            },
            created_at: msg.created_at || new Date().toISOString(),
            isOwnMessage: false,
          };
        }

        const senderId = senderData._id || senderData.id;
        
        return {
          _id: msg._id,
          content: msg.content,
          message_type: msg.message_type,
          image_url: msg.image_url,
          sender: {
            id: senderId,
            username: senderData.username || 'Unknown User',
            role: senderData.role || 'User',
            avatar_url: senderData.avatar_url,
          },
          created_at: msg.created_at,
          isOwnMessage: senderId === currentUserId,
        };
      } catch (error) {
        console.error(`Error formatting message ${index}:`, error, msg);
        // Return a fallback message instead of crashing
        return {
          _id: msg._id || `error_${index}`,
          content: 'Lỗi hiển thị tin nhắn',
          message_type: 'text' as const,
          sender: {
            id: 'error',
            username: 'Error',
            role: 'User' as const,
          },
          created_at: new Date().toISOString(),
          isOwnMessage: false,
        };
      }
    });
  };

  const handleNewMessage = (message: SocketMessage) => {
    if (chatRoom && message.room_id === chatRoom._id) {
      const formattedMessage: ChatBubbleMessage = {
        _id: message.id,
        content: message.content,
        message_type: message.message_type,
        image_url: message.image_url,
        sender: message.sender,
        created_at: message.created_at,
        isOwnMessage: message.sender.id === currentUserId,
      };

      setMessages(prev => [...prev, formattedMessage]);
      scrollToBottom();
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      if (flatListRef.current && messages.length > 0) {
        flatListRef.current.scrollToEnd({ animated: true });
      }
    }, 300); // Tăng delay để đảm bảo render hoàn thành
  };

  const handleSocketError = (error: any) => {
    console.error('Socket error:', error);
    Alert.alert('Lỗi', error.message || 'Có lỗi xảy ra với kết nối.');
  };

  const handleDisconnected = () => {
    setIsConnected(false);
    // Alert.alert(
    //   'Mất kết nối',
    //   'Kết nối đã bị ngắt. Bạn có muốn thử kết nối lại?',
    //   [
    //     { text: 'Hủy', style: 'cancel' },
    //     { text: 'Thử lại', onPress: initializeChat },
    //   ]
    // );
  };

  const sendTextMessage = useCallback(async () => {
    if (!chatRoom || !inputText.trim() || sending) return;
    
    setSending(true);
    try {
      customerSocketService.sendMessage(chatRoom._id, inputText.trim(), 'text');
      setInputText('');
    } catch (error) {
      console.error('Send message error:', error);
      Alert.alert('Lỗi', 'Không thể gửi tin nhắn. Vui lòng thử lại.');
    } finally {
      setSending(false);
    }
  }, [chatRoom, inputText, sending]);

  const handleImagePicker = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Lỗi', 'Cần quyền truy cập thư viện ảnh để gửi hình ảnh.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0] && chatRoom) {
        const asset = result.assets[0];
        
        try {
          setSendingImage(true);
          
          // Upload image
          const uploadResult = await customerChatService.uploadImage({
            uri: asset.uri,
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
          
        } catch (error) {
          console.error('Image upload error:', error);
          Alert.alert('Lỗi', 'Không thể tải lên hình ảnh. Vui lòng thử lại.');
        } finally {
          setSendingImage(false);
        }
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Lỗi', 'Không thể mở thư viện ảnh.');
    }
  };

  const renderMessage = ({ item }: { item: ChatBubbleMessage }) => (
    <View style={[
      styles.messageContainer,
      item.isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer
    ]}>
      {!item.isOwnMessage && (
        <View style={styles.senderInfo}>
          <Text style={styles.senderName}>{item.sender.username}</Text>
          <Text style={styles.senderRole}>{item.sender.role === 'Staff' ? 'Nhân viên' : 'Admin'}</Text>
        </View>
      )}
      
      <View style={[
        styles.messageBubble,
        item.isOwnMessage ? styles.ownMessageBubble : styles.otherMessageBubble
      ]}>
        {item.message_type === 'image' && item.image_url ? (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: item.image_url }}
              style={styles.messageImage}
              resizeMode="cover"
            />
            {item.content !== 'Đã gửi một hình ảnh' && (
              <Text style={[
                styles.messageText,
                item.isOwnMessage ? styles.ownMessageText : styles.otherMessageText
              ]}>
                {item.content}
              </Text>
            )}
          </View>
        ) : (
          <Text style={[
            styles.messageText,
            item.isOwnMessage ? styles.ownMessageText : styles.otherMessageText
          ]}>
            {item.content}
          </Text>
        )}
      </View>
      
      <Text style={styles.messageTime}>
        {new Date(item.created_at).toLocaleTimeString('vi-VN', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Hỗ trợ khách hàng</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Đang kết nối...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (connectionError) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Hỗ trợ khách hàng</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.errorContainer}>
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Không thể kết nối</Text>
            <Text style={styles.errorText}>{connectionError}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={initializeChat}>
              <Text style={styles.retryButtonText}>Thử lại</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (!isConnected || !chatRoom) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Hỗ trợ khách hàng</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.errorContainer}>
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Đang kết nối...</Text>
            <Text style={styles.errorText}>Vui lòng đợi trong giây lát</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hỗ trợ khách hàng</Text>
        <View style={styles.connectionStatus}>
          <View style={[styles.statusDot, { backgroundColor: isConnected ? '#4CAF50' : '#f44336' }]} />
        </View>
      </View>
      
      <KeyboardAvoidingView 
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item._id}
          renderItem={renderMessage}
          style={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={scrollToBottom}
          ListHeaderComponent={
            loadingHistory ? (
              <View style={styles.loadingHistoryContainer}>
                <ActivityIndicator size="small" color="#4CAF50" />
                <Text style={styles.loadingHistoryText}>Đang tải tin nhắn...</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            !loadingHistory ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!</Text>
              </View>
            ) : null
          }
        />
        
        <View style={styles.inputContainer}>
          <TouchableOpacity 
            style={styles.imageButton}
            onPress={handleImagePicker}
            disabled={sendingImage}
          >
            {sendingImage ? (
              <ActivityIndicator size="small" color="#4CAF50" />
            ) : (
              <Ionicons name="camera" size={24} color="#4CAF50" />
            )}
          </TouchableOpacity>
          
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Nhập tin nhắn..."
            multiline={true}
            maxLength={1000}
          />
          
          <TouchableOpacity 
            style={[styles.sendButton, { opacity: (!inputText.trim() || sending) ? 0.5 : 1 }]}
            onPress={sendTextMessage}
            disabled={!inputText.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="send" size={20} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
        
        {sendingImage && (
          <View style={styles.sendingImageOverlay}>
            <ActivityIndicator size="small" color="#4CAF50" />
            <Text style={styles.sendingImageText}>Đang gửi hình ảnh...</Text>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  headerRight: {
    width: 40,
  },
  connectionStatus: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messageContainer: {
    marginVertical: 4,
  },
  ownMessageContainer: {
    alignItems: 'flex-end',
  },
  otherMessageContainer: {
    alignItems: 'flex-start',
  },
  senderInfo: {
    marginBottom: 4,
  },
  senderName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
  },
  senderRole: {
    fontSize: 10,
    color: '#999',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  ownMessageBubble: {
    backgroundColor: '#4CAF50',
  },
  otherMessageBubble: {
    backgroundColor: '#E3F2FD',
  },
  messageText: {
    fontSize: 16,
  },
  ownMessageText: {
    color: '#FFFFFF',
  },
  otherMessageText: {
    color: '#333333',
  },
  messageTime: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
  },
  imageContainer: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  imageButton: {
    padding: 8,
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 20,
    padding: 12,
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  errorCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 8,
  },
  errorText: {
    color: '#666',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  sendingImageOverlay: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendingImageText: {
    marginLeft: 8,
    color: '#666',
  },
  loadingHistoryContainer: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingHistoryText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default CustomerSupportChatScreen;
