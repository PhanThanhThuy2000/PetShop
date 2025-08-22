// app/screens/CustomerSupportChatScreen.tsx
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { useAuth } from '../../hooks/useAuth';
import { ChatMessage, ChatRoom, customerChatService } from '../services/chatService';
import { customerSocketService, SocketMessage } from '../services/socketService';
import { API_BASE_URL } from '../utils/api-client';

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
  // Queue tạm để giữ tin nhắn đến sớm trước khi chatRoom sẵn sàng
  const pendingMessagesRef = useRef<SocketMessage[]>([]);
  // Lưu roomId hiện tại ở ref để handler socket dùng ngay, tránh lệ thuộc vào setState async
  const currentRoomIdRef = useRef<string>('');
  const flatListRef = useRef<FlatList>(null);

  const { user } = useAuth();
  const effectiveUserId = useMemo(
    () => (user as any)?.id || (user as any)?._id || currentUserId,
    [user, currentUserId]
  );

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
        setCurrentUserId(userData._id || userData.id || '');
      }

      // Setup socket event listeners TRƯỚC khi connect để tránh miss sự kiện sớm
      setupSocketListeners();

      // Kết nối socket
      await customerSocketService.connect();
      
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
      currentRoomIdRef.current = room._id;
      setChatRoom(room);
      
      // Join room
      customerSocketService.joinRoom(room._id);
      
      // Load chat history ngay sau khi có room
      await loadChatHistory(room);

      // Flush các tin nhắn đã đến trước khi chatRoom sẵn sàng
      if (pendingMessagesRef.current.length > 0) {
        const toAppend = pendingMessagesRef.current
          .filter(m => (m as any).room_id === room._id || (m as any).roomId === room._id)
          .map(m => ({
            _id: m.id,
            content: m.content,
            message_type: m.message_type,
            image_url: m.image_url,
            sender: m.sender,
            created_at: m.created_at,
            isOwnMessage: m.sender.id === currentUserId,
          }));

        if (toAppend.length > 0 && mountedRef.current) {
          // Gộp và loại trùng theo _id
          setMessages(prev => {
            const exist = new Set(prev.map(x => x._id));
            const merged = [...prev];
            for (const msg of toAppend) {
              if (!exist.has(msg._id)) {
                merged.push(msg);
                exist.add(msg._id);
              }
            }
            // Sắp xếp theo thời gian
            merged.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
            return merged;
          });
          scrollToBottom();
        }
        pendingMessagesRef.current = [];
      }
      
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
          isOwnMessage: senderId === effectiveUserId,
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
    const incomingRoomId = (message as any).room_id || (message as any).roomId || (message as any)?.room?._id || '';
    const activeRoomId = chatRoom?._id || currentRoomIdRef.current;
    if (!activeRoomId) {
      // Chưa có room: đẩy vào queue để xử lý sau khi room sẵn sàng
      pendingMessagesRef.current.push(message);
      console.log('⏳ Queued incoming message until room is ready', { incomingRoomId });
      return;
    }

    if (incomingRoomId === activeRoomId) {
      const formattedMessage: ChatBubbleMessage = {
        _id: message.id,
        content: message.content,
        message_type: message.message_type,
        image_url: message.image_url,
        sender: message.sender,
        created_at: message.created_at,
        isOwnMessage: (message.sender as any).id === effectiveUserId || (message.sender as any)._id === effectiveUserId,
      };

      setMessages(prev => [...prev, formattedMessage]);
      scrollToBottom();
    } else {
      // Debug log để chẩn đoán nếu không thỏa điều kiện
      console.log('⚠️ Incoming message ignored due to room mismatch', {
        incomingRoomId,
        currentRoomId: activeRoomId,
        message,
      });
    }
  };

  // Khi state chatRoom được set, flush mọi tin nhắn đã queue
  useEffect(() => {
    if (!chatRoom) return;
    if (pendingMessagesRef.current.length === 0) return;
    const toAppend = pendingMessagesRef.current
      .filter(m => ((m as any).room_id || (m as any).roomId) === chatRoom._id)
      .map(m => ({
        _id: m.id,
        content: m.content,
        message_type: m.message_type,
        image_url: m.image_url,
        sender: m.sender,
        created_at: m.created_at,
        isOwnMessage: (m.sender as any).id === effectiveUserId || (m.sender as any)._id === effectiveUserId,
      }));
    if (toAppend.length > 0) {
      setMessages(prev => {
        const exist = new Set(prev.map(x => x._id));
        const merged = [...prev];
        for (const msg of toAppend) {
          if (!exist.has(msg._id)) {
            merged.push(msg);
            exist.add(msg._id);
          }
        }
        merged.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        return merged;
      });
      scrollToBottom();
    }
    pendingMessagesRef.current = [];
  }, [chatRoom, effectiveUserId]);

  // Re-calc isOwnMessage if effectiveUserId changes
  useEffect(() => {
    if (!effectiveUserId || messages.length === 0) return;
    setMessages(prev => prev.map(m => ({
      ...m,
      isOwnMessage:
        (m.sender as any)?.id === effectiveUserId ||
        (m.sender as any)?._id === effectiveUserId,
    })));
  }, [effectiveUserId]);

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

  const handleTakePhoto = async () => {
    try {
      // Request camera permission
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Lỗi', 'Cần quyền sử dụng máy ảnh để chụp hình.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
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
            name: 'photo.jpg',
          });

          // Send image message
          customerSocketService.sendMessage(
            chatRoom._id,
            'Đã gửi một hình ảnh',
            'image',
            uploadResult.imageUrl
          );
        } catch (error) {
          console.error('Camera image upload error:', error);
          Alert.alert('Lỗi', 'Không thể tải lên hình ảnh. Vui lòng thử lại.');
        } finally {
          setSendingImage(false);
        }
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Lỗi', 'Không thể mở máy ảnh.');
    }
  };

  const getAvatarSource = (avatar_url?: string) => {
    if (!avatar_url) return require('../../assets/images/imageChatdog.png');
    if (avatar_url.startsWith('http')) return { uri: avatar_url };
    // Dùng host từ API_BASE_URL
    const host = API_BASE_URL.replace(/\/?api\/?$/, '');
    return { uri: `${host}${avatar_url}` };
  };

  const isSameDay = (d1: Date, d2: Date) => (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );

  const renderDateSeparator = (dateISO: string) => {
    const date = new Date(dateISO);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const label = isSameDay(date, today)
      ? 'Hôm nay'
      : isSameDay(date, yesterday)
      ? 'Hôm qua'
      : date.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });
    return (
      <View style={styles.dateSeparatorContainer}>
        <View style={styles.dateSeparatorLine} />
        <Text style={styles.dateSeparatorText}>{label}</Text>
        <View style={styles.dateSeparatorLine} />
      </View>
    );
  };

  const renderMessage = ({ item, index }: { item: ChatBubbleMessage; index: number }) => {
    const prev = index > 0 ? messages[index - 1] : undefined;
    const showDateSeparator = !prev || !isSameDay(new Date(prev.created_at), new Date(item.created_at));
    const isSameSenderAsPrev = !!prev && prev.sender.id === item.sender.id;
    const showAvatar = !item.isOwnMessage && (!isSameSenderAsPrev || showDateSeparator);
    const showName = showAvatar; // chỉ hiển thị tên khi bắt đầu nhóm mới

    return (
      <View>
        {showDateSeparator && renderDateSeparator(item.created_at)}
        <View style={[styles.messageRow, item.isOwnMessage ? styles.rowOwn : styles.rowOther]}>
          {!item.isOwnMessage && (
            <View style={styles.leftMeta}>
              {showAvatar ? (
                <Image source={getAvatarSource(item.sender.avatar_url)} style={styles.avatar} />
              ) : (
                <View style={styles.avatarSpacer} />
              )}
            </View>
          )}

          <View style={styles.bubbleGroup}>
            {!item.isOwnMessage && showName && (
              <Text style={styles.senderCaption}>{item.sender.username}</Text>
            )}

            <View style={[
              styles.messageBubble,
              item.isOwnMessage ? styles.ownMessageBubble : styles.otherMessageBubble,
            ]}>
              {item.message_type === 'image' && item.image_url ? (
                <Image source={{ uri: item.image_url }} style={styles.messageImage} resizeMode="cover" />
              ) : (
                <Text style={[styles.messageText, item.isOwnMessage ? styles.ownMessageText : styles.otherMessageText]}>
                  {item.content}
                </Text>
              )}
              <Text style={[styles.messageTimeInline, item.isOwnMessage ? styles.timeOnOwn : styles.timeOnOther]}>
                {new Date(item.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          </View>

          {item.isOwnMessage && <View style={styles.rightSpacer} />}
        </View>
      </View>
    );
  };

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
           contentContainerStyle={styles.messagesContent}
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
              <Ionicons name="image" size={24} color="#4CAF50" />
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.imageButton}
            onPress={handleTakePhoto}
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
  },
  messagesContent: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 12,
  },
  messageContainer: {
    marginVertical: 4,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 6,
  },
  rowOther: {
    justifyContent: 'flex-start',
  },
  rowOwn: {
    justifyContent: 'flex-end',
  },
  leftMeta: {
    width: 32,
    alignItems: 'center',
  },
  rightSpacer: {
    width: 32,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#dfe7f1',
  },
  avatarSpacer: {
    width: 28,
    height: 28,
  },
  bubbleGroup: {
    maxWidth: '80%',
    flexShrink: 1,
  },
  senderCaption: {
    fontSize: 11,
    color: '#667085',
    marginLeft: 8,
    marginBottom: 3,
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    minHeight: 36,
  },
  ownMessageBubble: {
    backgroundColor: '#4CAF50',
  },
  otherMessageBubble: {
    backgroundColor: '#E6F0FF',
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
  messageTimeInline: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  timeOnOwn: {
    color: 'rgba(255,255,255,0.85)',
  },
  timeOnOther: {
    color: '#6b7280',
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
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E6EAF0',
  },
  imageButton: {
    padding: 10,
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E6EAF0',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 120,
    backgroundColor: '#f8fafc',
  },
  sendButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 22,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginLeft: 8,
  },
  dateSeparatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  dateSeparatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E6EAF0',
  },
  dateSeparatorText: {
    marginHorizontal: 10,
    fontSize: 12,
    color: '#8A8F98',
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
