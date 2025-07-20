// ✅ SIMPLIFIED: Custom Alert Component - CHỈ CHO XÓA
import React, { useEffect, useState } from 'react';
import {
    Animated,
    Dimensions,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

interface CustomFavouriteAlertProps {
    visible: boolean;
    onClose: () => void;
    onConfirm: () => void;
    onCancel: () => void;
    itemName: string;
    itemImage?: { uri: string } | any;
}

const { width } = Dimensions.get('window');

export const CustomFavouriteAlert: React.FC<CustomFavouriteAlertProps> = ({
    visible,
    onClose,
    onConfirm,
    onCancel,
    itemName,
    itemImage
}) => {
    const [scaleAnim] = useState(new Animated.Value(0));
    const [opacityAnim] = useState(new Animated.Value(0));

    useEffect(() => {
        if (visible) {
            // ✅ ENTRANCE ANIMATION
            Animated.parallel([
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    tension: 100,
                    friction: 8,
                    useNativeDriver: true,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            // ✅ EXIT ANIMATION
            Animated.parallel([
                Animated.timing(scaleAnim, {
                    toValue: 0,
                    duration: 150,
                    useNativeDriver: true,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 0,
                    duration: 150,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible]);

    const handleConfirm = () => {
        onConfirm();
        onClose();
    };

    const handleCancel = () => {
        onCancel();
        onClose();
    };

    if (!visible) return null;

    return (
        <Modal
            transparent
            visible={visible}
            animationType="none"
            onRequestClose={onClose}
        >
            <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
                <TouchableOpacity
                    style={styles.backdrop}
                    activeOpacity={1}
                    onPress={handleCancel}
                />

                <Animated.View
                    style={[
                        styles.alertContainer,
                        {
                            transform: [{ scale: scaleAnim }],
                            opacity: opacityAnim,
                        }
                    ]}
                >
                    {/* ✅ CONTENT */}
                    <View style={styles.content}>
                        <Text style={styles.message}>
                            Bạn có chắc chắc chắn muốn xóa ?
                        </Text>
                    </View>

                    {/* ✅ ACTIONS - Chỉ có Hủy và Xóa */}
                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={[styles.button, styles.cancelButton]}
                            onPress={handleCancel}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.cancelButtonText}>Hủy</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.button, styles.removeButton]}
                            onPress={handleConfirm}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.confirmButtonText}>Xóa</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    backdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    alertContainer: {
        backgroundColor: '#fff',
        borderRadius: 16,
        width: width * 0.85,
        maxWidth: 340,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 10,
    },
    header: {
        alignItems: 'center',
        paddingTop: 24,
        paddingBottom: 16,
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#EF4444', // Màu đỏ cho xóa
    },
    content: {
        paddingHorizontal: 24,
        alignItems: 'center',
        paddingVertical: 16,
    },
    itemImage: {
        width: 80,
        height: 80,
        borderRadius: 12,
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
        textAlign: 'center',
        marginBottom: 12,
    },
    message: {
        fontSize: 16,
        color: '#000',
        lineHeight: 24,
    },
    actions: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    button: {
        flex: 1,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButton: {
        borderRightWidth: 1,
        borderRightColor: '#E5E7EB',
        backgroundColor: '#fff', // Màu xám nhạt cho Hủy
    },
    removeButton: {
        backgroundColor: '#fff', // Màu đỏ cho Xóa
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
    },
    confirmButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: 'red',
    },
});

// ✅ SIMPLIFIED HOOK - CHỈ CHO XÓA
export const useFavouriteAlert = () => {
    const [alertConfig, setAlertConfig] = useState<{
        visible: boolean;
        itemName: string;
        itemImage?: any;
        onConfirm: () => void;
    }>({
        visible: false,
        itemName: '',
        onConfirm: () => { },
    });

    // ✅ CHỈ có showRemoveAlert - không có showAddAlert
    const showRemoveAlert = (itemName: string, itemImage: any, onConfirm: () => void) => {
        setAlertConfig({
            visible: true,
            itemName,
            itemImage,
            onConfirm,
        });
    };

    const hideAlert = () => {
        setAlertConfig(prev => ({ ...prev, visible: false }));
    };

    return {
        alertConfig,
        showRemoveAlert,
        hideAlert,
    };
};