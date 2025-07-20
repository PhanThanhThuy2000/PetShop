// app/components/ui/FavouriteToast.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Animated,
    Dimensions,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface FavouriteToastProps {
    visible: boolean;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    duration?: number;
    onHide: () => void;
    actionText?: string;
    onActionPress?: () => void;
}

const { width } = Dimensions.get('window');
const TOAST_HEIGHT = 80;
const TOP_OFFSET = Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight || 25) + 10;

export const FavouriteToast: React.FC<FavouriteToastProps> = ({
    visible,
    message,
    type,
    duration = 4000,
    onHide,
    actionText,
    onActionPress,
}) => {
    const [translateY] = useState(new Animated.Value(-TOAST_HEIGHT - TOP_OFFSET));
    const [opacity] = useState(new Animated.Value(0));

    useEffect(() => {
        if (visible) {
            // ✅ SHOW ANIMATION
            Animated.parallel([
                Animated.timing(translateY, {
                    toValue: TOP_OFFSET,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();

            // ✅ AUTO HIDE after duration
            const timer = setTimeout(() => {
                hideToast();
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [visible, duration]);

    const hideToast = () => {
        Animated.parallel([
            Animated.timing(translateY, {
                toValue: -TOAST_HEIGHT - TOP_OFFSET,
                duration: 250,
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
            }),
        ]).start(() => {
            onHide();
        });
    };

    const getToastConfig = () => {
        switch (type) {
            case 'success':
                return {
                    backgroundColor: '#10B981',
                    icon: 'checkmark-circle' as keyof typeof Ionicons.glyphMap,
                    textColor: '#fff',
                    borderColor: '#059669',
                };
            case 'error':
                return {
                    backgroundColor: '#EF4444',
                    icon: 'close-circle' as keyof typeof Ionicons.glyphMap,
                    textColor: '#fff',
                    borderColor: '#DC2626',
                };
            case 'warning':
                return {
                    backgroundColor: '#F59E0B',
                    icon: 'warning' as keyof typeof Ionicons.glyphMap,
                    textColor: '#fff',
                    borderColor: '#D97706',
                };
            case 'info':
            default:
                return {
                    backgroundColor: '#3B82F6',
                    icon: 'information-circle' as keyof typeof Ionicons.glyphMap,
                    textColor: '#fff',
                    borderColor: '#2563EB',
                };
        }
    };

    const config = getToastConfig();

    if (!visible) return null;

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    backgroundColor: config.backgroundColor,
                    borderLeftColor: config.borderColor,
                    transform: [{ translateY }],
                    opacity,
                },
            ]}
        >
            <View style={styles.content}>
                {/* ✅ ICON */}
                <View style={styles.iconContainer}>
                    <Ionicons
                        name={config.icon}
                        size={24}
                        color={config.textColor}
                    />
                </View>

                {/* ✅ MESSAGE */}
                <Text
                    style={[styles.message, { color: config.textColor }]}
                    numberOfLines={2}
                >
                    {message}
                </Text>

                {/* ✅ ACTION BUTTON (optional) */}
                {actionText && onActionPress && (
                    <TouchableOpacity
                        style={[
                            styles.actionButton,
                            { borderColor: `${config.textColor}40` }
                        ]}
                        onPress={onActionPress}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.actionText, { color: config.textColor }]}>
                            {actionText}
                        </Text>
                    </TouchableOpacity>
                )}

                {/* ✅ CLOSE BUTTON */}
                <TouchableOpacity
                    style={styles.closeButton}
                    onPress={hideToast}
                    activeOpacity={0.8}
                >
                    <Ionicons name="close" size={20} color={config.textColor} />
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 16,
        right: 16,
        zIndex: 9999,
        borderRadius: 12,
        borderLeftWidth: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10,
        // ✅ BACKDROP BLUR EFFECT (iOS)
        ...(Platform.OS === 'ios' && {
            backdropFilter: 'blur(10px)',
        }),
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        minHeight: TOAST_HEIGHT,
    },
    iconContainer: {
        marginRight: 12,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    message: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
        lineHeight: 20,
    },
    actionButton: {
        marginLeft: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    actionText: {
        fontSize: 14,
        fontWeight: '600',
    },
    closeButton: {
        marginLeft: 8,
        padding: 4,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
});

export default FavouriteToast;