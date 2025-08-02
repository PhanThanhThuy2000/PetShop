import { useNavigation } from '@react-navigation/native';
import { useEffect, useRef, useState } from 'react';
import {
  getNotifications,
  getUnreadNotificationCount,
  handleNotificationNavigation,
  initializeNotificationPermissions,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  NotificationType,
  registerForPushNotificationsAsync,
  removePushTokenFromServer,
  savePushTokenToServer,
  setupNotificationListeners
} from '../app/services/NotificationService';
import { useAuth } from './useAuth';

export interface UsePushNotificationsReturn {
  // State
  expoPushToken: string | null;
  notifications: NotificationType[];
  unreadCount: number;
  isLoading: boolean;
  
  // Actions
  initializePushNotifications: () => Promise<void>;
  initializeOnAppStart: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  cleanupOnLogout: () => Promise<void>;
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const navigation = useNavigation();
  const { token } = useAuth(); // Thêm auth check
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const notificationListener = useRef<(() => void) | null>(null);

  // Khởi tạo khi app khởi động (âm thầm, không hiển thị dialog)
  const initializeOnAppStart = async () => {
    // Chỉ khởi tạo khi user đã đăng nhập
    if (!token) {
      console.log('🔕 User not logged in, skipping notification initialization');
      return;
    }

    try {
      setIsLoading(true);
      
      // 1. Thử lấy token mà không hiển thị dialog
      const pushToken = await initializeNotificationPermissions();
      if (pushToken) {
        setExpoPushToken(pushToken);
        
        // 2. Gửi token về server
        await savePushTokenToServer(pushToken);
        
        // 3. Setup listeners
        const cleanup = setupNotificationListeners(
          // Khi nhận notification (foreground)
          (notification) => {
            refreshNotifications();
          },
          
          // Khi user tap vào notification
          (response) => {
            const data = response.notification.request.content.data as any;
            
            if (data?.notificationId && typeof data.notificationId === 'string') {
              markAsRead(data.notificationId);
            }
            
            handleNotificationNavigation(data, navigation);
          }
        );
        
        notificationListener.current = cleanup;
        
        // Load notifications và unread count
        await refreshNotifications();
      }
    } catch (error) {
      console.error('Lỗi khởi tạo push notifications khi app start:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Khởi tạo push notifications (hiển thị dialog xin quyền)
  const initializePushNotifications = async () => {
    // Kiểm tra auth trước khi khởi tạo
    if (!token) {
      console.log('🔕 User not logged in, notifications require authentication');
      return;
    }

    try {
      setIsLoading(true);
      
      // 1. Đăng ký và lấy token
      const pushToken = await registerForPushNotificationsAsync();
      if (pushToken) {
        setExpoPushToken(pushToken);
        
        // 2. Gửi token về server
        await savePushTokenToServer(pushToken);
        
        // 3. Setup listeners
        const cleanup = setupNotificationListeners(
          // Khi nhận notification (foreground)
          (notification) => {
            // Refresh danh sách notifications
            refreshNotifications();
          },
          
          // Khi user tap vào notification
          (response) => {
            const data = response.notification.request.content.data as any;
            
            // Đánh dấu đã đọc nếu có notification ID
            if (data?.notificationId && typeof data.notificationId === 'string') {
              markAsRead(data.notificationId);
            }
            
            // Navigate tới screen tương ứng
            handleNotificationNavigation(data, navigation);
          }
        );
        
        notificationListener.current = cleanup;
        
        // Load notifications và unread count
        await refreshNotifications();
      }
    } catch (error) {
      console.error('Lỗi khởi tạo push notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh danh sách notifications
  const refreshNotifications = async () => {
    // Chỉ load notifications khi user đã đăng nhập
    if (!token) {
      console.log('🔕 No token, skipping notification refresh');
      return;
    }

    try {
      console.log('🔄 Refreshing notifications...');
      
      // Load notifications
      const notificationsResponse = await getNotifications({ page: 1, limit: 50 });
      // console.log('📋 Notifications response:', notificationsResponse);
      
      if (notificationsResponse?.success && notificationsResponse.data) {
        setNotifications(notificationsResponse.data);
        console.log('✅ Notifications updated:', notificationsResponse.data.length, 'items');
      } else {
        console.log('⚠️ No notifications data received');
        setNotifications([]);
      }
      
      // Load unread count
      const count = await getUnreadNotificationCount();
      setUnreadCount(count);
      console.log('🔢 Unread count:', count);
    } catch (error) {
      console.error('❌ Lỗi khi refresh notifications:', error);
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  // Đánh dấu notification đã đọc
  const markAsRead = async (notificationId: string) => {
    if (!token) return;

    try {
      const success = await markNotificationAsRead(notificationId);
      if (success) {
        // Cập nhật local state
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, isRead: true }
              : notif
          )
        );
        
        // Giảm unread count
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Lỗi khi đánh dấu notification đã đọc:', error);
    }
  };

  // Đánh dấu tất cả notifications đã đọc
  const markAllAsRead = async () => {
    if (!token) return;

    try {
      const success = await markAllNotificationsAsRead();
      if (success) {
        // Cập nhật local state
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, isRead: true }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Lỗi khi đánh dấu tất cả notification đã đọc:', error);
    }
  };

  // Cleanup khi user logout
  const cleanupOnLogout = async () => {
    try {
      // Xóa token khỏi server
      await removePushTokenFromServer();
      
      // Cleanup listeners
      if (notificationListener.current) {
        notificationListener.current();
        notificationListener.current = null;
      }
      
      // Reset state
      setExpoPushToken(null);
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Lỗi khi cleanup push notifications:', error);
    }
  };

  // Cleanup khi component unmount
  useEffect(() => {
    return () => {
      if (notificationListener.current) {
        notificationListener.current();
      }
    };
  }, []);

  // Reset notifications khi user logout
  useEffect(() => {
    if (!token) {
      // User đã logout, reset tất cả state
      setExpoPushToken(null);
      setNotifications([]);
      setUnreadCount(0);
      
      // Cleanup listeners
      if (notificationListener.current) {
        notificationListener.current();
        notificationListener.current = null;
      }
    }
  }, [token]);

  return {
    expoPushToken,
    notifications,
    unreadCount,
    isLoading,
    initializePushNotifications,
    initializeOnAppStart,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    cleanupOnLogout,
  };
}
