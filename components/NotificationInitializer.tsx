import { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { usePushNotifications } from '../hooks/usePushNotifications';

/**
 * Component để khởi tạo push notifications khi app khởi động
 * Chỉ khởi tạo khi user đã đăng nhập
 */
export function NotificationInitializer() {
  const { token } = useAuth();
  const { initializeOnAppStart } = usePushNotifications();

  useEffect(() => {
    // Chỉ khởi tạo push notifications khi user đã đăng nhập
    if (token) {
      initializeOnAppStart();
    }
  }, [token]); // Re-run khi token thay đổi

  // Component này không render gì cả
  return null;
}

export default NotificationInitializer;
