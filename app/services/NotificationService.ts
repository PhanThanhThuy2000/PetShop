import Constants from "expo-constants";
import * as Notifications from 'expo-notifications';
import api from '../utils/api-client';
// Types cho notification
export interface NotificationType {
  id: string;
  title: string;
  body: string;
  type: 'order' | 'appointment' | 'chat' | 'promotion' | 'reminder' | 'review' | 'welcome' | 'sale' | 'general';
  isRead: boolean;
  createdAt: string;
  relatedEntityId?: string;
  relatedEntityType?: string;
  data?: any;
}

// Server response type
interface ServerNotification {
  _id: string;
  type: string;
  message: string;
  related_entity_id?: string;
  related_entity_type?: string;
  user_id: string;
  is_read: boolean;
  created_at: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Server response for notifications list
interface NotificationsApiResponse {
  success: boolean;
  data: {
    notifications: ServerNotification[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
  message?: string;
}

// Helper function to transform server notification to client format
function transformNotification(serverNotif: ServerNotification): NotificationType {
  return {
    id: serverNotif._id,
    title: getNotificationTitle(serverNotif.type),
    body: serverNotif.message,
    type: serverNotif.type as NotificationType['type'],
    isRead: serverNotif.is_read,
    createdAt: serverNotif.created_at,
    relatedEntityId: serverNotif.related_entity_id,
    relatedEntityType: serverNotif.related_entity_type,
    data: {}
  };
}

// Helper function to get title based on notification type
function getNotificationTitle(type: string): string {
  switch (type) {
    case 'order':
      return 'Cập nhật đơn hàng';
    case 'appointment':
      return 'Cập nhật lịch hẹn';
    case 'chat':
      return 'Tin nhắn mới';
    case 'promotion':
      return 'Khuyến mãi mới!';
    case 'reminder':
      return 'Nhắc nhở lịch hẹn';
    case 'review':
      return 'Đánh giá mới';
    case 'welcome':
      return 'Chào mừng đến với PetShop!';
    case 'sale':
      return 'Sản phẩm yêu thích đang giảm giá!';
    default:
      return 'Thông báo';
  }
}

// Helper function để xin quyền notification (sử dụng hệ thống mặc định)
async function requestNotificationPermission(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    
    if (existingStatus === 'granted') {
      return true;
    }

    // Sử dụng dialog mặc định của hệ thống
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Lỗi khi xin quyền thông báo:', error);
    return false;
  }
}

// Helper function để xin quyền âm thầm (không hiển thị dialog)
async function requestNotificationPermissionSilently(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    
    if (existingStatus === 'granted') {
      return true;
    }

    // Chỉ yêu cầu nếu chưa từng hỏi
    if (existingStatus === 'undetermined') {
      const { status } = await Notifications.requestPermissionsAsync();
      return status === 'granted';
    }

    return false;
  } catch (error) {
    console.error('Lỗi khi xin quyền thông báo (silent):', error);
    return false;
  }
}

// 1. Đăng ký Push Notifications và lấy token
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  try {
    // Sử dụng permission mặc định của hệ thống
    const hasPermission = await requestNotificationPermission();
    
    if (!hasPermission) {
      console.warn('Không có quyền gửi thông báo');
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId,
    });
    
    console.log('✅ Expo push token:', tokenData.data);
    return tokenData.data;
  } catch (error) {
    console.error('❌ Lỗi khi đăng ký push notification:', error);
    return null;
  }
}

// Khởi tạo permissions khi app khởi động (âm thầm)
export async function initializeNotificationPermissions(): Promise<string | null> {
  try {
    // Kiểm tra và yêu cầu quyền âm thầm
    const hasPermission = await requestNotificationPermissionSilently();
    
    if (!hasPermission) {
      console.log('Chưa có quyền thông báo, sẽ hỏi sau');
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId,
    });
    
    console.log('✅ Expo push token (khởi tạo):', tokenData.data);
    return tokenData.data;
  } catch (error) {
    console.error('❌ Lỗi khi khởi tạo push notification:', error);
    return null;
  }
}

// 2. Gửi token về server
export async function savePushTokenToServer(token: string): Promise<boolean> {
  try {
    const response = await api.post('/push-notifications/token', {
      token: token
    });
    console.log('✅ Token đã được lưu thành công');
    return true;
  } catch (error) {
    console.error('❌ Lỗi khi lưu push token:', error);
    return false;
  }
}

// Xóa token khỏi server khi user logout
export async function removePushTokenFromServer(): Promise<boolean> {
  try {
    await api.delete('/push-notifications/token');
    console.log('Token đã được xóa khỏi server');
    return true;
  } catch (error) {
    console.error('Lỗi khi xóa push token:', error);
    return false;
  }
}

// Lấy danh sách notifications
export async function getNotifications(params: {
  page?: number;
  limit?: number;
  isRead?: boolean;
} = {}): Promise<ApiResponse<NotificationType[]> | null> {
  try {
    const { page = 1, limit = 20, isRead } = params;
    let url = `/push-notifications/notifications?page=${page}&limit=${limit}`;
    
    if (isRead !== undefined) {
      url += `&isRead=${isRead}`;
    }
    
    console.log('🔍 Fetching notifications from:', url);
    
    const response = await api.get<NotificationsApiResponse>(url);
    console.log('📋 Server response:', response.data);
    
    if (!response.data.success) {
      console.error('❌ Server returned error:', response.data.message);
      return null;
    }
    
    // Transform server notifications to client format
    const transformedNotifications = response.data.data.notifications.map(transformNotification);
    
    return {
      success: true,
      data: transformedNotifications,
      pagination: {
        ...response.data.data.pagination,
        itemsPerPage: limit
      }
    };
  } catch (error: any) {
    if (error.code !== 'NETWORK_ERROR') {
      console.error('❌ Lỗi khi lấy notifications:', error.response?.data || error.message);
    }
    return null;
  }
}

// Đánh dấu notification đã đọc
export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  try {
    await api.put(`/push-notifications/notifications/${notificationId}/read`);
    return true;
  } catch (error) {
    console.error('Lỗi khi đánh dấu notification đã đọc:', error);
    return false;
  }
}

// Đánh dấu tất cả notifications đã đọc
export async function markAllNotificationsAsRead(): Promise<boolean> {
  try {
    await api.put('/push-notifications/notifications/read-all');
    return true;
  } catch (error) {
    console.error('Lỗi khi đánh dấu tất cả notifications đã đọc:', error);
    return false;  
  }
}

// Lấy số lượng notification chưa đọc
export async function getUnreadNotificationCount(): Promise<number> {
  try {
    const response = await api.get<ApiResponse<{ count: number } | { unreadCount: number }>>('/push-notifications/notifications/unread-count');
    
    if (response.data.success && response.data.data) {
      // Support both formats from server
      const data = response.data.data as any;
      return data.count || data.unreadCount || 0;
    }
    
    return 0;
  } catch (error: any) {
    if (error.code !== 'NETWORK_ERROR') {
      console.error('❌ Lỗi khi lấy số notification chưa đọc:', error.response?.data || error.message);
    }
    return 0;
  }
}

// 3. Setup listeners cho notifications
export function setupNotificationListeners(
  onNotificationReceived?: (notification: Notifications.Notification) => void,
  onNotificationTapped?: (response: Notifications.NotificationResponse) => void
) {
  // Listener khi nhận notification (foreground)
  const notificationListener = Notifications.addNotificationReceivedListener(notification => {
    console.log('Notification received:', notification);
    
    if (onNotificationReceived) {
      onNotificationReceived(notification);
    }
  });

  // Listener khi user tap vào notification
  const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
    console.log('Notification tapped:', response);
    
    if (onNotificationTapped) {
      onNotificationTapped(response);
    }
  });

  // Return cleanup function
  return () => {
    Notifications.removeNotificationSubscription(notificationListener);
    Notifications.removeNotificationSubscription(responseListener);
  };
}

// Helper function để xử lý navigation khi tap notification
export function handleNotificationNavigation(
  notificationData: any,
  navigation: any
) {
  const { type, relatedEntityId, senderId } = notificationData;
  
  switch (type) {
    case 'order':
      navigation.navigate('OrderDetailScreen', { orderId: relatedEntityId });
      break;
    case 'chat':
      navigation.navigate('CustomerSupport', { userId: senderId });
      break;
    case 'appointment':
      navigation.navigate('AppointmentListScreen', { appointmentId: relatedEntityId });
      break;
    case 'promotion':
      navigation.navigate('VoucherScreen');
      break;
    case 'review':
      navigation.navigate('ReviewsScreen', { productId: relatedEntityId });
      break;
    case 'sale':
      navigation.navigate('ProductDetailScreen', { productId: relatedEntityId });
      break;
    default:
      console.log('Unknown notification type:', type);
  }
}

// Tùy chỉnh behavior của notification khi app đang mở
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});