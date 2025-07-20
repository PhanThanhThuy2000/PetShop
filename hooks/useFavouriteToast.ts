// app/hooks/useFavouriteToast.ts
import { useState } from 'react';

interface ToastConfig {
    visible: boolean;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    actionText?: string;
    onActionPress?: () => void;
}

export const useFavouriteToast = () => {
    const [toastConfig, setToastConfig] = useState<ToastConfig>({
        visible: false,
        message: '',
        type: 'info',
    });

    const showToast = (
        message: string,
        type: 'success' | 'error' | 'info' | 'warning' = 'info',
        actionText?: string,
        onActionPress?: () => void
    ) => {
        setToastConfig({
            visible: true,
            message,
            type,
            actionText,
            onActionPress,
        });
    };

    const hideToast = () => {
        setToastConfig(prev => ({
            ...prev,
            visible: false
        }));
    };

    const showSuccess = (
        message: string,
        actionText?: string,
        onActionPress?: () => void
    ) => {
        showToast(message, 'success', actionText, onActionPress);
    };

    const showError = (
        message: string,
        actionText?: string,
        onActionPress?: () => void
    ) => {
        showToast(message, 'error', actionText, onActionPress);
    };

    const showInfo = (
        message: string,
        actionText?: string,
        onActionPress?: () => void
    ) => {
        showToast(message, 'info', actionText, onActionPress);
    };

    const showWarning = (
        message: string,
        actionText?: string,
        onActionPress?: () => void
    ) => {
        showToast(message, 'warning', actionText, onActionPress);
    };

    // ✅ CONVENIENCE METHODS cho favourite actions
    const showFavouriteAdded = (itemName: string, onUndo?: () => void) => {
        showSuccess(
            `"${itemName}" đã được thêm vào yêu thích`,
            onUndo ? 'Hoàn tác' : undefined,
            onUndo
        );
    };

    const showFavouriteRemoved = (itemName: string, onUndo?: () => void) => {
        showSuccess(
            `"${itemName}" đã được xóa khỏi yêu thích`,
            onUndo ? 'Hoàn tác' : undefined,
            onUndo
        );
    };

    const showFavouriteError = (message?: string) => {
        showError(
            message || 'Không thể cập nhật trạng thái yêu thích. Vui lòng thử lại.'
        );
    };

    const showNetworkError = () => {
        showError(
            'Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet và thử lại.',
            'Thử lại'
        );
    };

    return {
        // Config và basic controls
        toastConfig,
        showToast,
        hideToast,

        // Basic toast types
        showSuccess,
        showError,
        showInfo,
        showWarning,

        // Favourite-specific methods
        showFavouriteAdded,
        showFavouriteRemoved,
        showFavouriteError,
        showNetworkError,
    };
};