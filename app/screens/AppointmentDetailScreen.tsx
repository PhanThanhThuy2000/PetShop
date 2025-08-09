// app/screens/AppointmentDetailScreen.tsx - KHÔNG CÓ CHỨC NĂNG HỦY LỊCH
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '../../hooks/useAuth';
import { getAppointmentById } from '../redux/slices/appointmentSlice';
import { AppDispatch, RootState } from '../redux/store';

const AppointmentDetailScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const dispatch = useDispatch<AppDispatch>();
    const { token } = useAuth();

    const { appointmentId } = route.params;
    const { currentAppointment, isLoading, error } = useSelector((state: RootState) => state.appointments);

    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        if (token && appointmentId) {
            loadAppointmentDetail();
        }
    }, [token, appointmentId]);

    const loadAppointmentDetail = async () => {
        try {
            await dispatch(getAppointmentById(appointmentId)).unwrap();
        } catch (error) {
            console.error('Error loading appointment detail:', error);
            Alert.alert('Lỗi', 'Không thể tải chi tiết lịch hẹn');
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadAppointmentDetail();
        setRefreshing(false);
    };

    const getStatusColor = (status: string = '') => {
        switch (status) {
            case 'pending':
                return '#F59E0B';
            case 'confirmed':
                return '#3B82F6';
            case 'in_progress':
                return '#8B5CF6';
            case 'completed':
                return '#10B981';
            case 'cancelled':
                return '#EF4444';
            default:
                return '#6B7280';
        }
    };

    const getStatusText = (status: string = '') => {
        switch (status) {
            case 'pending':
                return 'Chờ xác nhận';
            case 'confirmed':
                return 'Đã xác nhận';
            case 'in_progress':
                return 'Đang thực hiện';
            case 'completed':
                return 'Hoàn thành';
            case 'cancelled':
                return 'Đã hủy';
            default:
                return 'Không xác định';
        }
    };

    const formatPrice = (price: number = 0) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    const formatDate = (dateString: string = '') => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            weekday: 'long',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const getPetImage = () => {
        if (!currentAppointment?.pet_id?.images) return 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=100&h=100&fit=crop&crop=face';
        const images = currentAppointment.pet_id.images;
        if (images.length > 0) {
            const primaryImage = images.find(img => img.is_primary) || images[0];
            return primaryImage.url;
        }
        return 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=100&h=100&fit=crop&crop=face';
    };

    if (isLoading && !currentAppointment) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={24} color="#374151" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Chi tiết lịch hẹn</Text>
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3B82F6" />
                    <Text style={styles.loadingText}>Đang tải chi tiết lịch hẹn...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (error || !currentAppointment) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={24} color="#374151" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Chi tiết lịch hẹn</Text>
                </View>
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
                    <Text style={styles.errorTitle}>Không thể tải lịch hẹn</Text>
                    <Text style={styles.errorSubtitle}>
                        {error || 'Đã có lỗi xảy ra khi tải chi tiết lịch hẹn'}
                    </Text>
                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={loadAppointmentDetail}
                    >
                        <Text style={styles.retryButtonText}>Thử lại</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color="#374151" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Chi tiết lịch hẹn</Text>
                <TouchableOpacity
                    style={styles.refreshButton}
                    onPress={handleRefresh}
                    disabled={refreshing}
                >
                    <Ionicons
                        name="refresh"
                        size={24}
                        color={refreshing ? "#9CA3AF" : "#3B82F6"}
                    />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={['#3B82F6']}
                    />
                }
            >
                {/* Status Card */}
                <View style={styles.statusCard}>
                    <View style={styles.statusHeader}>
                        <Text style={styles.appointmentId}>
                            #{currentAppointment._id ? currentAppointment._id.slice(-6) : 'N/A'}
                        </Text>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(currentAppointment.status) }]}>
                            <Text style={styles.statusText}>{getStatusText(currentAppointment.status)}</Text>
                        </View>
                    </View>
                    <Text style={styles.createdDate}>
                        Đặt lịch: {formatDate(currentAppointment.created_at)}
                    </Text>

                    {/* ✅ THÔNG BÁO VỀ CHÍNH SÁCH HỦY LỊCH (CHỈ THÔNG TIN) */}
                    {(currentAppointment.status === 'pending' || currentAppointment.status === 'confirmed') && (
                        <View style={styles.cancelInfoBanner}>
                            <Ionicons name="information-circle" size={20} color="#3B82F6" />
                            <Text style={styles.cancelInfoText}>
                                {currentAppointment.status === 'pending'
                                    ? 'Để hủy lịch hẹn, vui lòng trở về màn hình danh sách lịch hẹn.'
                                    : 'Lịch hẹn đã xác nhận không thể hủy trực tiếp. Vui lòng liên hệ phòng khám để được hỗ trợ.'
                                }
                            </Text>
                        </View>
                    )}
                </View>

                {/* Pet Information Card */}
                <View style={styles.infoCard}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="heart" size={24} color="#EC4899" />
                        <Text style={styles.cardTitle}>Thông tin thú cưng</Text>
                    </View>
                    <View style={styles.petInfoContainer}>
                        <Image source={{ uri: getPetImage() }} style={styles.petImage} />
                        <View style={styles.petDetails}>
                            <Text style={styles.petName}>{currentAppointment.pet_id?.name || 'N/A'}</Text>
                            {currentAppointment.pet_id?.age && (
                                <Text style={styles.petAge}>Tuổi: {currentAppointment.pet_id.age}</Text>
                            )}
                            {currentAppointment.pet_id?.weight && (
                                <Text style={styles.petWeight}>Cân nặng: {currentAppointment.pet_id.weight}kg</Text>
                            )}
                            {currentAppointment.pet_id?.gender && (
                                <Text style={styles.petGender}>
                                    Giới tính: {currentAppointment.pet_id.gender === 'Male' ? 'Đực' : 'Cái'}
                                </Text>
                            )}
                        </View>
                    </View>
                </View>

                {/* Service Information Card */}
                <View style={styles.infoCard}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="medical" size={24} color="#10B981" />
                        <Text style={styles.cardTitle}>Dịch vụ</Text>
                    </View>
                    <View style={styles.serviceInfo}>
                        <Text style={styles.serviceName}>{currentAppointment.service_id?.name || 'N/A'}</Text>
                        {currentAppointment.service_id?.description && (
                            <Text style={styles.serviceDescription}>{currentAppointment.service_id.description}</Text>
                        )}
                        <View style={styles.serviceDetails}>
                            <View style={styles.serviceDetailItem}>
                                <Ionicons name="time-outline" size={16} color="#6B7280" />
                                <Text style={styles.serviceDetailText}>
                                    Thời gian: {currentAppointment.service_id?.duration || 0} phút
                                </Text>
                            </View>
                            <View style={styles.serviceDetailItem}>
                                <Ionicons name="pricetag-outline" size={16} color="#6B7280" />
                                <Text style={styles.serviceDetailText}>
                                    Giá: {formatPrice(currentAppointment.service_id?.price)}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Schedule Information Card */}
                <View style={styles.infoCard}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="calendar" size={24} color="#8B5CF6" />
                        <Text style={styles.cardTitle}>Thời gian hẹn</Text>
                    </View>
                    <View style={styles.scheduleInfo}>
                        <View style={styles.scheduleItem}>
                            <Ionicons name="calendar-outline" size={20} color="#8B5CF6" />
                            <View style={styles.scheduleDetails}>
                                <Text style={styles.scheduleLabel}>Ngày</Text>
                                <Text style={styles.scheduleValue}>{formatDate(currentAppointment.appointment_date)}</Text>
                            </View>
                        </View>
                        <View style={styles.scheduleItem}>
                            <Ionicons name="time-outline" size={20} color="#8B5CF6" />
                            <View style={styles.scheduleDetails}>
                                <Text style={styles.scheduleLabel}>Giờ</Text>
                                <Text style={styles.scheduleValue}>{currentAppointment.appointment_time || 'N/A'}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Staff Information Card */}
                {currentAppointment.staff_id && (
                    <View style={styles.infoCard}>
                        <View style={styles.cardHeader}>
                            <Ionicons name="person" size={24} color="#F59E0B" />
                            <Text style={styles.cardTitle}>Nhân viên phụ trách</Text>
                        </View>
                        <View style={styles.staffInfo}>
                            <Text style={styles.staffName}>{currentAppointment.staff_id.username || 'N/A'}</Text>
                            <Text style={styles.staffEmail}>{currentAppointment.staff_id.email || 'N/A'}</Text>
                        </View>
                    </View>
                )}

                {/* Notes Card */}
                {currentAppointment.notes && (
                    <View style={styles.infoCard}>
                        <View style={styles.cardHeader}>
                            <Ionicons name="document-text" size={24} color="#6B7280" />
                            <Text style={styles.cardTitle}>Ghi chú</Text>
                        </View>
                        <Text style={styles.notesText}>{currentAppointment.notes}</Text>
                    </View>
                )}

                {/* Payment Information Card */}
                <View style={styles.infoCard}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="card" size={24} color="#3B82F6" />
                        <Text style={styles.cardTitle}>Thông tin thanh toán</Text>
                    </View>
                    <View style={styles.paymentInfo}>
                        <View style={styles.paymentRow}>
                            <Text style={styles.paymentLabel}>Mã đơn hàng:</Text>
                            <Text style={styles.paymentValue}>
                                #{currentAppointment.order_id && currentAppointment.order_id._id
                                    ? currentAppointment.order_id._id.slice(-6)
                                    : 'N/A'}
                            </Text>
                        </View>
                        <View style={styles.paymentRow}>
                            <Text style={styles.paymentLabel}>Tổng tiền:</Text>
                            <Text style={styles.paymentValueTotal}>{formatPrice(currentAppointment.total_amount)}</Text>
                        </View>
                    </View>
                </View>

                {/* ❌ KHÔNG CÓ CHỨC NĂNG HỦY LỊCH - CHỈ CÓ LIÊN HỆ HỖ TRỢ */}
                <View style={styles.actionContainer}>
                    {/* Nút liên hệ hỗ trợ chung */}
                    <TouchableOpacity
                        style={styles.contactButton}
                        onPress={() => {
                            Alert.alert(
                                'Liên hệ hỗ trợ',
                                'Chọn hình thức liên hệ:\n\n' +
                                '📞 Hotline: 1900 123 456\n' +
                                '📧 Email: support@petcare.com\n' +
                                '💬 Chat: Trong ứng dụng\n' +
                                '🕒 Giờ làm việc: 8:00 - 18:00 (T2-T7)',
                                [
                                    { text: 'Đóng', style: 'cancel' },
                                    {
                                        text: 'Chat ngay',
                                        onPress: () => {
                                            Alert.alert('Tính năng chat', 'Tính năng chat hỗ trợ sẽ được cập nhật sớm');
                                        }
                                    },
                                    {
                                        text: 'Gọi điện',
                                        onPress: () => {
                                            Alert.alert('Tính năng gọi điện', 'Tính năng gọi điện sẽ được cập nhật sớm');
                                        }
                                    }
                                ]
                            );
                        }}
                    >
                        <Ionicons name="chatbubble-outline" size={20} color="#FFFFFF" />
                        <Text style={styles.contactButtonText}>Liên hệ hỗ trợ</Text>
                    </TouchableOpacity>

                    {/* Nút trở về danh sách lịch hẹn */}
                    <TouchableOpacity
                        style={styles.backToListButton}
                        onPress={() => navigation.navigate('AppointmentHistory')}
                    >
                        <Ionicons name="list-outline" size={20} color="#FFFFFF" />
                        <Text style={styles.backToListButtonText}>Xem danh sách lịch hẹn</Text>
                    </TouchableOpacity>

                    {/* ✅ THÔNG TIN VỀ CHÍNH SÁCH HỦY LỊCH */}
                    <View style={styles.cancelPolicyInfo}>
                        <Ionicons name="information-circle-outline" size={16} color="#6B7280" />
                        <Text style={styles.cancelPolicyText}>
                            {currentAppointment.status === 'pending'
                                ? 'Để hủy lịch hẹn, vui lòng trở về màn hình danh sách lịch hẹn.'
                                : currentAppointment.status === 'confirmed'
                                    ? 'Lịch hẹn đã xác nhận cần liên hệ phòng khám để hủy.'
                                    : 'Xem thông tin chi tiết lịch hẹn của bạn.'
                            }
                        </Text>
                    </View>
                </View>

                <View style={styles.bottomSpacer} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        marginTop: 20,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#374151',
        flex: 1,
        textAlign: 'center',
    },
    refreshButton: {
        padding: 8,
    },
    scrollContainer: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#6B7280',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#374151',
        marginTop: 16,
        marginBottom: 8,
    },
    errorSubtitle: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 24,
    },
    retryButton: {
        backgroundColor: '#3B82F6',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },

    // Status card styles
    statusCard: {
        backgroundColor: '#FFFFFF',
        margin: 16,
        marginBottom: 8,
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    statusHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    appointmentId: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#374151',
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    statusText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    createdDate: {
        fontSize: 14,
        color: '#6B7280',
    },
    // ✅ STYLES CHO THÔNG BÁO
    cancelInfoBanner: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#EBF8FF',
        padding: 12,
        borderRadius: 8,
        marginTop: 12,
    },
    cancelInfoText: {
        fontSize: 14,
        color: '#3B82F6',
        marginLeft: 8,
        flex: 1,
        lineHeight: 20,
    },

    // Info card styles
    infoCard: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 16,
        marginBottom: 8,
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#374151',
        marginLeft: 8,
    },

    // Pet info styles
    petInfoContainer: {
        flexDirection: 'row',
    },
    petImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
        marginRight: 16,
    },
    petDetails: {
        flex: 1,
    },
    petName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#374151',
        marginBottom: 4,
    },
    petBreed: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 2,
    },
    petAge: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 2,
    },
    petWeight: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 2,
    },
    petGender: {
        fontSize: 14,
        color: '#6B7280',
    },

    // Service info styles
    serviceInfo: {
        flex: 1,
    },
    serviceName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#374151',
        marginBottom: 8,
    },
    serviceDescription: {
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 20,
        marginBottom: 12,
    },
    serviceDetails: {
        gap: 8,
    },
    serviceDetailItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    serviceDetailText: {
        fontSize: 14,
        color: '#6B7280',
        marginLeft: 8,
    },

    // Schedule info styles
    scheduleInfo: {
        gap: 16,
    },
    scheduleItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    scheduleDetails: {
        marginLeft: 12,
    },
    scheduleLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 2,
    },
    scheduleValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
    },

    // Staff info styles
    staffInfo: {
        gap: 4,
    },
    staffName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
    },
    staffEmail: {
        fontSize: 14,
        color: '#6B7280',
    },

    // Notes styles
    notesText: {
        fontSize: 14,
        color: '#374151',
        lineHeight: 20,
    },

    // Payment info styles
    paymentInfo: {
        gap: 12,
    },
    paymentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    paymentLabel: {
        fontSize: 14,
        color: '#6B7280',
    },
    paymentValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
    },
    paymentValueTotal: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#3B82F6',
    },

    // ❌ KHÔNG CÓ NÚT HỦY - CHỈ CÓ LIÊN HỆ HỖ TRỢ
    actionContainer: {
        marginHorizontal: 16,
        marginTop: 8,
        gap: 12,
    },
    contactButton: {
        backgroundColor: '#3B82F6',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 8,
        gap: 8,
    },
    contactButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    // ✅ THÊM: Nút trở về danh sách
    backToListButton: {
        backgroundColor: '#6B7280',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 8,
        gap: 8,
    },
    backToListButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    // ✅ STYLES CHO THÔNG TIN CHÍNH SÁCH
    cancelPolicyInfo: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#F3F4F6',
        padding: 12,
        borderRadius: 8,
        marginTop: 8,
    },
    cancelPolicyText: {
        fontSize: 13,
        color: '#6B7280',
        marginLeft: 8,
        flex: 1,
        lineHeight: 18,
    },
    bottomSpacer: {
        height: 32,
    },
});

export default AppointmentDetailScreen;