import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSelector } from 'react-redux';
import useChat from '../../hooks/useChat';
import { RootState } from '../redux/store';
import { ChatMessage } from '../types';

const ChatScreen = () => {
  const navigation = useNavigation<any>();
  const scrollViewRef = useRef<ScrollView>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Redux state
  const authState = useSelector((state: RootState) => state.auth);

  // Chat hook
  const {
    currentRoom,
    messages,
    isConnected,
    isLoadingMessages,
    isSendingMessage,
    typingUsers,
    error,
    createNewChatRoom,
    joinChatRoom,
    sendMessage,
    startTyping,
    stopTyping,
    clearChatError,
    getTypingText
  } = useChat();

  // Local state
  const [inputText, setInputText] = useState('');
  const [isInitializing, setIsInitializing] = useState(true);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  // Quick reply suggestions (UX improvement)
  const QUICK_REPLIES: Array<{ label: string; value: string }> = [
    { label: 'Vấn đề đơn hàng', value: 'Order Issues' },
    { label: 'Tư vấn sản phẩm', value: 'Product Inquiry' },
    { label: 'Chính sách đổi trả', value: 'Return Policy' },
    { label: 'Vận chuyển & giao hàng', value: 'Shipping' },
  ];

  // ================================
  // LIFECYCLE & INITIALIZATION
  // ================================

  useEffect(() => {
    initializeChat();
  }, []);

  useEffect(() => {
    // Auto scroll to bottom when new messages arrive
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  useEffect(() => {
    // Show error alerts
    if (error) {
      Alert.alert('Chat Error', error, [
        { text: 'OK', onPress: () => clearChatError() }
      ]);
    }
  }, [error]);
  

  const initializeChat = async () => {
    try {
      setIsInitializing(true);

      if (!authState.token) {
        Alert.alert('Authentication Required', 'Please login to use chat');
        navigation.goBack();
        return;
      }

      // Wait for socket connection to be established
      console.log('🔌 Waiting for socket connection...');
      let attempts = 0;
      const maxAttempts = 10;
      
      while (!isConnected && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 500));
        attempts++;
        console.log(`🔄 Connection attempt ${attempts}/${maxAttempts}, connected: ${isConnected}`);
      }

      if (!isConnected) {
        console.log('❌ Socket connection timeout');
        Alert.alert('Connection Error', 'Unable to connect to chat server. Please check your internet connection.');
        return;
      }

      console.log('✅ Socket connected, creating chat room...');

      // Try to create or get existing chat room
      const room = await createNewChatRoom('Customer Support', 'medium');

      if (room) {
        console.log('✅ Chat room ready:', room._id);
        // joinChatRoom is called automatically in createNewChatRoom
      } else {
        console.log('❌ Failed to create/get chat room');
        Alert.alert('Chat Error', 'Unable to start chat. Please try again.');
      }

    } catch (error) {
      console.error('Chat initialization error:', error);
      Alert.alert('Chat Error', 'Failed to initialize chat');
    } finally {
      setIsInitializing(false);
    }
  };

  // ================================
  // MESSAGE HANDLING
  // ================================

  const handleSendMessage = () => {
    if (!inputText.trim()) {
      return;
    }

    if (!isConnected) {
      Alert.alert('Connection Error', 'Not connected to chat server');
      return;
    }

    if (!currentRoom) {
      Alert.alert('Error', 'No active chat room');
      return;
    }

    // Send message via chat hook
    sendMessage(inputText.trim(), 'text');

    // Clear input
    setInputText('');

    // Stop typing indicator
    handleStopTyping();
  };

  const handleInputChange = (text: string) => {
    setInputText(text);

    if (text.trim() && isConnected && currentRoom) {
      handleStartTyping();
    } else {
      handleStopTyping();
    }
  };

  const handleStartTyping = () => {
    startTyping();

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Auto-stop typing after 2 seconds of no input
    typingTimeoutRef.current = setTimeout(() => {
      handleStopTyping();
    }, 2000);
  };

  const handleStopTyping = () => {
    stopTyping();

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  // ================================
  // MESSAGE UTILITIES (UX)
  // ================================

  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  const formatDateHeader = (iso: string) => {
    const date = new Date(iso);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (isSameDay(date, today)) return 'Hôm nay';
    if (isSameDay(date, yesterday)) return 'Hôm qua';

    return date.toLocaleDateString('vi-VN', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const renderDateSeparator = (dateISO: string) => (
    <View style={styles.dateSeparatorContainer}>
      <View style={styles.dateSeparatorLine} />
      <Text style={styles.dateSeparatorText}>{formatDateHeader(dateISO)}</Text>
      <View style={styles.dateSeparatorLine} />
    </View>
  );

  // ================================
  // MESSAGE RENDERING
  // ================================

  const formatMessageForUI = (message: ChatMessage) => {
    const isUser = message.sender_id.role === 'User';

    return {
      id: message._id,
      text: message.content,
      isUser: isUser,
      timestamp: new Date(message.created_at).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: false,
      }),
      type: message.message_type === 'image' ? 'image' : 'text',
      sender: message.sender_id,
      isSystem: message.message_type === 'system'
    };
  };

  const MessageBubble = ({ message }: { message: ReturnType<typeof formatMessageForUI> }) => {
    // System message
    if (message.isSystem) {
      return (
        <View style={styles.systemMessageContainer}>
          <Text style={styles.systemMessageText}>{message.text}</Text>
        </View>
      );
    }

    // Special handling for "Order Issues" (keep existing design)
    if (message.isUser && message.text === 'Order Issues') {
      return (
        <View style={styles.specialUserMessageContainer}>
          <View style={styles.specialBubble}>
            <Image source={require('../../assets/images/Check.png')} style={styles.checkIcon} />
            <Text style={styles.specialText}>{message.text}</Text>
          </View>
          <Image source={require('../../assets/images/use.png')} style={styles.userAvatarSmall} />
        </View>
      );
    }

    // Image message
    if (message.type === 'image') {
      return (
        <View
          style={[
            styles.imageContainer,
            { alignSelf: message.isUser ? 'flex-end' : 'flex-start' }
          ]}
        >
          <Image
            source={
              message.isUser
                ? require('../../assets/images/use.png')
                : require('../../assets/images/imageChatdog.png')
            }
            style={styles.productImage}
          />
        </View>
      );
    }

    // Regular text message
    return (
      <View
        style={[
          styles.messageBubble,
          message.isUser ? styles.userMessage : styles.botMessage
        ]}
      >
        <Text
          style={[
            styles.messageText,
            message.isUser ? styles.userMessageText : styles.botMessageText
          ]}
        >
          {message.text}
        </Text>

        {/* Footer meta: timestamp and sender info/checkmark */}
        <View style={[styles.bubbleFooter, message.isUser ? styles.footerRight : styles.footerLeft]}>
          {!message.isUser && message.sender && (
            <View style={styles.staffMetaContainer}>
              <Image source={require('../../assets/images/imageChatdog.png')} style={styles.staffAvatarSmall} />
              <Text style={styles.senderName}>{message.sender.username}</Text>
            </View>
          )}
          <View style={styles.footerSpacer} />
          <Text style={[styles.timestampText, message.isUser ? styles.timestampTextOnPrimary : null]}>
            {message.timestamp}
          </Text>
          {message.isUser && (
            <Image source={require('../../assets/images/Check.png')} style={[styles.checkIconSmall, message.isUser ? styles.checkOnPrimary : null]} />
          )}
        </View>
      </View>
    );
  };

  // ================================
  // RENDER METHODS
  // ================================

  const renderConnectionStatus = () => {
    if (!isConnected) {
      return (
        <View style={styles.connectionBanner}>
          <Text style={styles.connectionText}>Reconnecting...</Text>
        </View>
      );
    }
    return null;
  };

  const renderTypingIndicator = () => {
    const typingText = getTypingText();
    if (typingText) {
      return (
        <View style={styles.typingContainer}>
          <Text style={styles.typingText}>{typingText}</Text>
        </View>
      );
    }
    return null;
  };

  const handleQuickReplyPress = (value: string) => {
    if (!isConnected || !currentRoom) return;
    sendMessage(value, 'text');
  };

  const renderQuickReplies = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.quickRepliesContainer}
    >
      {QUICK_REPLIES.map((qr) => (
        <TouchableOpacity
          key={qr.value}
          onPress={() => handleQuickReplyPress(qr.value)}
          style={styles.quickReplyChip}
        >
          <Text style={styles.quickReplyText}>{qr.label}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const handleScroll = (event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const distanceFromBottom = contentSize.height - (contentOffset.y + layoutMeasurement.height);
    setShowScrollToBottom(distanceFromBottom > 120);
  };

  const renderLoadingState = () => {
    if (isInitializing) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.loadingText}>Connecting to chat...</Text>
        </View>
      );
    }
    return null;
  };

  // Show loading screen during initialization
  if (isInitializing) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        {renderLoadingState()}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Connection Status Banner */}
      {renderConnectionStatus()}

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>

        <View style={styles.headerLeft}>
          <Image source={require('../../assets/images/avata.png')} style={styles.avatar} />
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>
              {currentRoom?.assigned_staff_id?.username || 'Customer Support'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {currentRoom?.status === 'active' ? 'Online' : 'Waiting for staff...'}
            </Text>
          </View>
        </View>

        {/* Connection indicator */}
        <View style={[
          styles.statusIndicator,
          { backgroundColor: isConnected ? '#4CAF50' : '#FF5722' }
        ]} />
      </View>

      {/* Quick replies (only when no messages) */}
      {messages.length === 0 && renderQuickReplies()}

      {/* Messages with date separators */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {isLoadingMessages && (
          <View style={styles.loadingMessagesContainer}>
            <ActivityIndicator size="small" color="#4A90E2" />
            <Text style={styles.loadingMessagesText}>Loading messages...</Text>
          </View>
        )}

        {!isLoadingMessages && messages.length === 0 && (
          <View style={styles.emptyStateContainer}>
            <Image source={require('../../assets/images/illustration.png')} style={styles.emptyStateImage} />
            <Text style={styles.emptyStateTitle}>Hỗ trợ khách hàng</Text>
            <Text style={styles.emptyStateSubtitle}>Hãy bắt đầu cuộc trò chuyện hoặc chọn một gợi ý ở trên</Text>
          </View>
        )}

        {messages.map((message, index) => {
          const prev = index > 0 ? messages[index - 1] : null;
          const showSeparator = !prev ||
            !isSameDay(new Date(prev.created_at), new Date(message.created_at));

          return (
            <View key={message._id}>
              {showSeparator && renderDateSeparator(message.created_at)}
              <MessageBubble message={formatMessageForUI(message)} />
            </View>
          );
        })}

        {/* Typing indicator */}
        {renderTypingIndicator()}
      </ScrollView>

      {showScrollToBottom && (
        <TouchableOpacity
          style={styles.scrollToBottomButton}
          onPress={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          <Ionicons name="chevron-down" size={20} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Input */}
      <View style={styles.inputContainer}>
        <View style={styles.leftButtons}>
          <TouchableOpacity style={styles.iconButton}>
            <Image source={require('../../assets/images/action.png')} style={styles.iconImage} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Image source={require('../../assets/images/camera.png')} style={styles.iconImage} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Image source={require('../../assets/images/picture.png')} style={styles.iconImage} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Image source={require('../../assets/images/mic.png')} style={styles.iconImage} />
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={handleInputChange}
          placeholder="Nhập tin nhắn..."
          multiline
          onSubmitEditing={handleSendMessage}
          editable={Boolean(isConnected && currentRoom && !isSendingMessage)}
        />

        <View style={styles.rightButtons}>
          <TouchableOpacity style={styles.iconButton}>
            <Image source={require('../../assets/images/Emoji.png')} style={styles.iconImage} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || !isConnected || isSendingMessage) && styles.sendButtonDisabled
            ]}
            onPress={handleSendMessage}
            disabled={!inputText.trim() || !isConnected || isSendingMessage}
          >
            {isSendingMessage ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Image
                source={
                  inputText.trim()
                    ? require('../../assets/images/send.png')
                    : require('../../assets/images/Like.png')
                }
                style={styles.iconImage}
              />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginTop: 20,

  },
  backButton: { marginRight: 12 },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  headerInfo: {},
  headerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A90E2',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  messageBubble: {
    marginVertical: 4,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    maxWidth: '80%',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  userMessage: {
    backgroundColor: '#4A90E2',
    alignSelf: 'flex-end',
  },
  userMessageText: { color: '#fff' },
  botMessage: {
    backgroundColor: '#F4F6FA',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#E6EAF0',
  },
  botMessageText: { color: '#333' },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  imageContainer: {
    alignItems: 'center',
    marginVertical: 16,
    marginLeft: 3,
  },
  productImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  leftButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    borderRadius: 20,
    padding: 6,
    marginHorizontal: 2,
  },
  iconImage: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  textInput: {
    flex: 1,
    minHeight: 36,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 8,
    fontSize: 14,
    backgroundColor: '#f8f8f8',
  },
  sendButton: {
    borderRadius: 20,
    padding: 6,
    marginLeft: 4,
  },
  specialUserMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginVertical: 4,
  },
  specialBubble: {
    flexDirection: 'row',
    backgroundColor: '#1877F2',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignItems: 'center',
  },
  checkIcon: {
    width: 16,
    height: 16,
    marginRight: 6,
    tintColor: '#fff',
  },
  specialText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  userAvatarSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginLeft: 8,
  },

  // 🔥 NEW STYLES FOR REAL-TIME FEATURES
  connectionBanner: {
    backgroundColor: '#FF5722',
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  connectionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  typingContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  typingText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  systemMessageContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  systemMessageText: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    overflow: 'hidden',
  },
  senderName: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
    fontWeight: '500',
  },
  staffMetaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  staffAvatarSmall: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 6,
  },
  bubbleFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  footerLeft: {
    justifyContent: 'flex-start',
  },
  footerRight: {
    justifyContent: 'flex-end',
  },
  footerSpacer: {
    flex: 1,
  },
  timestampText: {
    fontSize: 10,
    color: '#8A8F98',
    marginLeft: 8,
  },
  timestampTextOnPrimary: {
    color: 'rgba(255,255,255,0.85)',
  },
  checkIconSmall: {
    width: 14,
    height: 14,
    marginLeft: 6,
    tintColor: '#8A8F98',
  },
  checkOnPrimary: {
    tintColor: 'rgba(255,255,255,0.85)',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  loadingMessagesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  loadingMessagesText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },

  typingIndicator: {
    fontSize: 12,
    color: '#4A90E2',
    fontStyle: 'italic',
  },
  // Empty state
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyStateImage: {
    width: 160,
    height: 120,
    resizeMode: 'contain',
    marginBottom: 12,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  emptyStateSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  // Scroll to bottom
  scrollToBottomButton: {
    position: 'absolute',
    right: 16,
    bottom: 94,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4A90E2',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  // Date separators
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
  // Quick replies
  quickRepliesContainer: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4,
  },
  quickReplyChip: {
    backgroundColor: '#F4F6FA',
    borderWidth: 1,
    borderColor: '#E6EAF0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
  },
  quickReplyText: {
    color: '#333',
    fontSize: 13,
  },
});

export default ChatScreen;
