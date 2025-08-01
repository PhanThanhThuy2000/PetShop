// app/components/ChatSupportButton.tsx
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ChatSupportButtonProps {
  style?: any;
  size?: 'small' | 'medium' | 'large';
  variant?: 'floating' | 'inline';
}

const ChatSupportButton: React.FC<ChatSupportButtonProps> = ({ 
  style, 
  size = 'medium',
  variant = 'floating'
}) => {
  const navigation = useNavigation();

  const handlePress = () => {
    // Navigate to chat screen
    navigation.navigate('CustomerSupport' as never);
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { width: 50, height: 50, iconSize: 20, fontSize: 12 };
      case 'large':
        return { width: 70, height: 70, iconSize: 32, fontSize: 16 };
      default:
        return { width: 60, height: 60, iconSize: 24, fontSize: 14 };
    }
  };

  const sizeStyles = getSizeStyles();

  if (variant === 'floating') {
    return (
      <TouchableOpacity
        style={[
          styles.floatingButton,
          {
            width: sizeStyles.width,
            height: sizeStyles.height,
          },
          style,
        ]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <Ionicons 
          name="chatbubble-ellipses" 
          size={sizeStyles.iconSize} 
          color="#FFFFFF" 
        />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.inlineButton, style]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <View style={styles.inlineContent}>
        <Ionicons 
          name="chatbubble-ellipses" 
          size={sizeStyles.iconSize} 
          color="#4CAF50" 
        />
        <Text style={[styles.inlineText, { fontSize: sizeStyles.fontSize }]}>
          Hỗ trợ khách hàng
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  floatingButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    position: 'absolute',
    bottom: 20,
    right: 20,
    zIndex: 1000,
  },
  inlineButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  inlineContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineText: {
    marginLeft: 8,
    color: '#4CAF50',
    fontWeight: '600',
  },
});

export default ChatSupportButton;
