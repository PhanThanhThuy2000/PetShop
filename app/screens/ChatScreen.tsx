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
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

      // Wait a bit for socket connection to initialize
      await new Promise(resolve => setTimeout(resolve, 1000));

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

        {/* Show sender name for staff messages */}
        {!message.isUser && message.sender && (
          <Text style={styles.senderName}>
            {message.sender.username}
          </Text>
        )}
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

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {isLoadingMessages && (
          <View style={styles.loadingMessagesContainer}>
            <ActivityIndicator size="small" color="#4A90E2" />
            <Text style={styles.loadingMessagesText}>Loading messages...</Text>
          </View>
        )}

        {messages.map((message) => (
          <MessageBubble key={message._id} message={formatMessageForUI(message)} />
        ))}

        {/* Typing indicator */}
        {renderTypingIndicator()}
      </ScrollView>

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
          editable={isConnected && currentRoom && !isSendingMessage}
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
  },
  userMessage: {
    backgroundColor: '#4A90E2',
    alignSelf: 'flex-end',
  },
  userMessageText: { color: '#fff' },
  botMessage: {
    backgroundColor: '#f0f0f0',
    alignSelf: 'flex-start',
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
});

export default ChatScreen;
