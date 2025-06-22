import React, { useState } from 'react';
import {
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
// 1. Thêm các import cần thiết
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

type Message = {
  id: number;
  text?: string;
  isUser: boolean;
  timestamp: string;
  type: 'text' | 'image';
};

const ChatScreen = () => {
  // 2. Khởi tạo navigation
  const navigation = useNavigation<any>();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hello, and welcome to Customer Care Service...",
      isUser: false,
      timestamp: "9:41",
      type: 'text'
    },
    {
      id: 2,
      text: "Order Issues",
      isUser: true,
      timestamp: "9:42",
      type: 'text'
    },
    {
      id: 3,
      text: "I didn't receive my parcel",
      isUser: true,
      timestamp: "9:42",
      type: 'text'
    },
    {
      id: 4,
      isUser: false,
      timestamp: "9:42",
      type: 'image'
    },
    {
      id: 5,
      text: "Hello, Amanda! I'm Maggy, your personal assistant from Customer Care Service. Let me go through your order and check its current status. Wait a moment please.",
      isUser: false,
      timestamp: "9:43",
      type: 'text'
    },
    {
      id: 6,
      text: "Hello, Maggy! Sure!",
      isUser: true,
      timestamp: "9:43",
      type: 'text'
    }
  ]);

  const [inputText, setInputText] = useState('');

  const sendMessage = () => {
    if (inputText.trim()) {
      const newMessage: Message = {
        id: messages.length + 1,
        text: inputText,
        isUser: true,
        timestamp: new Date().toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: false,
        }),
        type: 'text'
      };
      setMessages([...messages, newMessage]);
      setInputText('');
    }
  };

  const MessageBubble = ({ message }: { message: Message }) => {
    // Trường hợp đặc biệt cho nút như "Order Issues"
    if (message.isUser && message.text === 'Order Issues') {
      return (
        <View style={styles.specialUserMessageContainer}>
          <View style={styles.specialBubble}>
            <Image source={require('../../assets/images/Check.png')} style={styles.checkIcon} />
            <Text style={styles.specialText}>{message.text}</Text>
          </View>
          <Image
            source={require('../../assets/images/use.png')}
            style={styles.userAvatarSmall}
          />
        </View>
      );
    }

    // Trường hợp là ảnh
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

    // Tin nhắn văn bản thường
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
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={styles.header}>
        {/* 3. Thêm nút back vào đây */}
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>

        <View style={styles.headerLeft}>
          <Image
            source={require('../../assets/images/avata.png')}
            style={styles.avatar}
          />
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>Maggy Lee</Text>
            <Text style={styles.headerSubtitle}>Customer Care Service</Text>
          </View>
        </View>
        <Text style={styles.typingIndicator}>typing</Text>
      </View>

      {/* Messages */}
      <ScrollView style={styles.messagesContainer} showsVerticalScrollIndicator={false}>
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
      </ScrollView>

      {/* Input */}
      <View style={styles.inputContainer}>
        <View style={styles.leftButtons}>
          <TouchableOpacity style={styles.iconButton}>
            <Image source={require('../../assets/images/Actions.png')} style={styles.iconImage} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Image source={require('../../assets/images/Photo.png')} style={styles.iconImage} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Image source={require('../../assets/images/Gallery.png')} style={styles.iconImage} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Image source={require('../../assets/images/Audio.png')} style={styles.iconImage} />
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Nhập tin nhắn..."
          multiline
          onSubmitEditing={sendMessage}
        />

        <View style={styles.rightButtons}>
          <TouchableOpacity style={styles.iconButton}>
            <Image source={require('../../assets/images/Emoji.png')} style={styles.iconImage} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
            <Image source={require('../../assets/images/Like.png')} style={styles.iconImage} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
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
  // 4. Thêm style cho nút back
  backButton: {
    marginRight: 12,
  },
  headerLeft: {
    flex: 1, // Để phần này chiếm không gian còn lại
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  headerInfo: {
    // Bỏ flex: 1 ở đây
  },
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
  typingIndicator: {
    fontSize: 12,
    color: '#4A90E2',
    fontStyle: 'italic',
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
  userMessageText: {
    color: '#fff',
  },
  botMessage: {
    backgroundColor: '#f0f0f0',
    alignSelf: 'flex-start',
  },
  botMessageText: {
    color: '#333',
  },
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
    backgroundColor: '#4A90E2',
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
  tintColor: '#fff'
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

});

export default ChatScreen;