import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { usePushNotifications } from '../hooks/usePushNotifications';

interface NotificationBadgeProps {
  style?: any;
  textStyle?: any;
  showZero?: boolean;
}

export function NotificationBadge({ 
  style, 
  textStyle, 
  showZero = false 
}: NotificationBadgeProps) {
  const { unreadCount } = usePushNotifications();

  if (!showZero && unreadCount === 0) {
    return null;
  }

  return (
    <View style={[styles.badge, style]}>
      <Text style={[styles.badgeText, textStyle]}>
        {unreadCount > 99 ? '99+' : unreadCount.toString()}
      </Text>
    </View>
  );
}



const styles = StyleSheet.create({
  badge: {
    backgroundColor: '#ff4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
