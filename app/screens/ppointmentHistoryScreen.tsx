// app/screens/AppointmentHistoryScreen.tsx - CHỈ MÀN NÀY CÓ CHỨC NĂNG HỦY LỊCH
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { addHours, isAfter, parseISO } from 'date-fns';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    RefreshControl,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '../../hooks/redux';
import { cancelAppointment, getUserAppointments } from '../redux/slices/appointmentSlice';
import { AppDispatch, RootState } from '../redux/store';
import { Appointment } from '../types';

const AppointmentHistoryScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const dispatch = useDispatch<AppDispatch>();
    const { token } = useAuth();

    // Redux state
    const { appointments, isLoading, error, pagination } = useSelector((state: RootState) => state.appointments);

    // Local state
    const [refreshing, setRefreshing] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState<string>('all');
    const [cancellingId, setCancellingId] = useState<string | null>(null);

    // Load appointments when screen is focused
    useFocusEffect(
        useCallback(() => {
            if (token) {
                loadAppointments();
            }
        }, [token, selectedStatus])
    );

    const loadAppointments = async () => {
        try {
            const params = selectedStatus !== 'all' ? { status: selectedStatus as any } : {};
            await dispatch(getUserAppointments(params)).unwrap();
        } catch (error) {
            console.error('Error loading appointments:', error);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadAppointments();
        setRefreshing(false);
    };

    // ✅ CHỨC NĂNG HỦY LỊCH - CHỈ CÓ Ở MÀN NÀY
    const handleCancelAppointment = (appointment: Appointment) => {
        // Kiểm tra xem có thể hủy không
        const canCancel = canCancelAppointment(appointment);

        if (!canCancel.allowed) {
            Alert.alert(
                'Không thể hủy lịch hẹn',
                canCancel.message,
                [
                    { text: 'Đóng', style: 'default' },
                    {
                        text: 'Liên hệ hỗ trợ',
                        onPress: () => {
                            Alert.alert(
                                'Liên hệ hỗ trợ',
                                'Vui lòng gọi hotline: 1900 123 456 hoặc email: support@petcare.com để được hỗ trợ hủy lịch hẹn.',
                                [{ text: 'Đã hiểu', style: 'default' }]
                            );
                        }
                    }
                ]
            );
            return;
        }

        // Hiển thị confirmation dialog
        Alert.alert(
            'Xác nhận hủy lịch hẹn',
            `Bạn có chắc chắn muốn hủy lịch hẹn dịch vụ "${appointment.service_id.name}" cho ${appointment.pet_id.name}?\n\n` +
            `Thời gian: ${formatDate(appointment.appointment_date)} - ${appointment.appointment_time}\n\n` +
            (canCancel.isLateCancel ? '⚠️ Lưu ý: Bạn đang hủy lịch trong thời gian gần (dưới 2 giờ).' : ''),
            [
                { text: 'Không hủy', style: 'cancel' },
                {
                    text: 'Xác nhận hủy',
                    style: 'destructive',
                    onPress: () => performCancelAppointment(appointment),
                },
            ]
        );
    };

    // Thực hiện hủy lịch hẹn
    const performCancelAppointment = async (appointment: Appointment) => {
        setCancellingId(appointment._id);

        try {
            await dispatch(cancelAppointment(appointment._id)).unwrap();

            Alert.alert(
                'Thành công',
                'Đã hủy lịch hẹn thành công',
                [{ text: 'OK', style: 'default' }]
            );

            // Refresh danh sách
            loadAppointments();

        } catch (error: any) {
            console.error('Cancel appointment error:', error);

            let errorMessage = 'Không thể hủy lịch hẹn. Vui lòng thử lại.';

            if (typeof error === 'string') {
                errorMessage = error;
            } else if (error?.message) {
                errorMessage = error.message;
            }

            Alert.alert(
                'Lỗi hủy lịch hẹn',
                errorMessage,
                [
                    { text: 'Thử lại', onPress: () => performCancelAppointment(appointment) },
                    { text: 'Đóng', style: 'cancel' }
                ]
            );
        } finally {
            setCancellingId(null);
        }
    };

    // ✅ LOGIC KIỂM TRA CÓ THỂ HỦY LỊCH
    const canCancelAppointment = (appointment: Appointment) => {
        console.log('Checking canCancel:', {
            id: appointment._id,
            status: appointment.status,
            date: appointment.appointment_date,
            time: appointment.appointment_time,
        });

        // Chỉ cho phép hủy khi status là 'pending'
        if (appointment.status !== 'pending') {
            let message = '';
            switch (appointment.status) {
                case 'confirmed':
                    message = 'Lịch hẹn đã được xác nhận và không thể hủy trực tiếp. Vui lòng liên hệ phòng khám để được hỗ trợ.';
                    break;
                case 'in_progress':
                    message = 'Lịch hẹn đang được thực hiện và không thể hủy.';
                    break;
                case 'completed':
                    message = 'Lịch hẹn đã hoàn thành và không thể hủy.';
                    break;
                case 'cancelled':
                    message = 'Lịch hẹn đã được hủy trước đó.';
                    break;
                default:
                    message = 'Không thể hủy lịch hẹn ở trạng thái hiện tại.';
            }
            console.log('Cannot cancel:', message);
            return { allowed: false, message };
        }

        try {
            // Parse appointment_date và thêm appointment_time
            const datePart = parseISO(appointment.appointment_date);
            const [hours, minutes] = appointment.appointment_time.split(':').map(Number);
            const appointmentDateTime = new Date(datePart.setHours(hours, minutes, 0, 0));

            // Chuyển về múi giờ +07
            const appointmentDateTimeLocal = addHours(appointmentDateTime, 7);
            const now = new Date();

            console.log('appointmentDateTimeLocal:', appointmentDateTimeLocal.toString());

            if (!isAfter(appointmentDateTimeLocal, now)) {
                console.log('Cannot cancel: Past appointment');
                return {
                    allowed: false,
                    message: 'Không thể hủy lịch hẹn đã qua thời gian đặt lịch.'
                };
            }

            // Kiểm tra thời gian hủy muộn (trong vòng 2 giờ)
            const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
            const isLateCancel = isAfter(twoHoursFromNow, appointmentDateTimeLocal);

            console.log('Can cancel:', { isLateCancel });
            return {
                allowed: true,
                message: '',
                isLateCancel
            };
        } catch (error) {
            console.error('Error in canCancelAppointment:', error);
            return {
                allowed: false,
                message: 'Lỗi xử lý thời gian. Vui lòng thử lại.',
            };
        }
    };

    const getStatusColor = (status: string) => {
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

    const getStatusText = (status: string) => {
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
                return status;
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            weekday: 'long',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const getPetImage = (appointment: Appointment) => {
        const images = appointment.pet_id.images;
        if (images && images.length > 0) {
            const primaryImage = images.find(img => img.is_primary) || images[0];
            return primaryImage.url;
        }
        return 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=100&h=100&fit=crop&crop=face';
    };

    const renderStatusFilter = () => {
        const statuses = [
            { key: 'all', label: 'Tất cả', color: '#6B7280' },
            { key: 'pending', label: 'Chờ xác nhận', color: '#F59E0B' },
            { key: 'confirmed', label: 'Đã xác nhận', color: '#3B82F6' },
            { key: 'in_progress', label: 'Đang thực hiện', color: '#8B5CF6' },
            { key: 'completed', label: 'Hoàn thành', color: '#10B981' },
            { key: 'cancelled', label: 'Đã hủy', color: '#EF4444' },
        ];

        return (
            <View style={styles.filterContainer}>
                <FlatList
                    data={statuses}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(item) => item.key}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[
                                styles.filterItem,
                                selectedStatus === item.key && { backgroundColor: item.color }
                            ]}
                            onPress={() => setSelectedStatus(item.key)}
                        >
                            <Text
                                style={[
                                    styles.filterText,
                                    selectedStatus === item.key && styles.filterTextActive
                                ]}
                            >
                                {item.label}
                            </Text>
                        </TouchableOpacity>
                    )}
                />
            </View>
        );
    };


    const renderAppointmentItem = ({ item }: { item: Appointment }) => {
        const canCancel = canCancelAppointment(item);
        let isUpcoming = false;

        try {
            // Parse appointment_date (ISO format) và thêm appointment_time
            const datePart = parseISO(item.appointment_date); // Chuyển ISO thành Date
            const [hours, minutes] = item.appointment_time.split(':').map(Number);
            const appointmentDateTime = new Date(datePart.setHours(hours, minutes, 0, 0));

            // Chuyển về múi giờ +07 (nếu server trả UTC)
            const appointmentDateTimeLocal = addHours(appointmentDateTime, 7); // Điều chỉnh +07

            isUpcoming = isAfter(appointmentDateTimeLocal, new Date());

            console.log('Appointment check:', {
                id: item._id,
                status: item.status,
                appointmentDateTime: appointmentDateTimeLocal.toString(),
                isUpcoming,
                currentTime: new Date().toString(),
            });
        } catch (error) {
            console.error('Error parsing date:', error, {
                date: item.appointment_date,
                time: item.appointment_time,
            });
        }

        const isCancelling = cancellingId === item._id;

        return (
            <View style={styles.appointmentCard}>
                {/* Header */}
                <View style={styles.appointmentHeader}>
                    <View style={styles.appointmentIdContainer}>
                        <Text style={styles.appointmentId}>#{item._id.slice(-6)}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
                        </View>
                    </View>
                    <Text style={styles.appointmentDate}>
                        {new Date(item.created_at).toLocaleDateString('vi-VN')}
                    </Text>
                </View>

                {/* Content */}
                <View style={styles.appointmentContent}>
                    <Image source={{ uri: getPetImage(item) }} style={styles.petImage} />
                    <View style={styles.appointmentInfo}>
                        <Text style={styles.petName}>{item.pet_id.name}</Text>
                        <Text style={styles.serviceName}>{item.service_id.name}</Text>
                        <View style={styles.appointmentTimeContainer}>
                            <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                            <Text style={styles.appointmentTime}>
                                {formatDate(item.appointment_date)} - {item.appointment_time}
                            </Text>
                        </View>
                        <View style={styles.priceContainer}>
                            <Ionicons name="pricetag-outline" size={16} color="#6B7280" />
                            <Text style={styles.price}>{formatPrice(item.total_amount)}</Text>
                        </View>
                        {item.notes && (
                            <View style={styles.notesContainer}>
                                <Ionicons name="document-text-outline" size={16} color="#6B7280" />
                                <Text style={styles.notes} numberOfLines={2}>{item.notes}</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Actions */}
                <View style={styles.appointmentActions}>
                    <TouchableOpacity
                        style={styles.detailButton}
                        onPress={() => navigation.navigate('AppointmentDetail', { appointmentId: item._id })}
                    >
                        <Text style={styles.detailButtonText}>Chi tiết</Text>
                    </TouchableOpacity>

                    {item.status === 'pending' && isUpcoming && (
                        <TouchableOpacity
                            style={[
                                styles.cancelButton,
                                isCancelling && styles.cancelButtonDisabled
                            ]}
                            onPress={() => handleCancelAppointment(item)}
                            disabled={isCancelling}
                        >
                            {isCancelling ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <Text style={styles.cancelButtonText}>Hủy lịch</Text>
                            )}
                        </TouchableOpacity>
                    )}

                    {item.status === 'confirmed' && (
                        <TouchableOpacity
                            style={styles.contactSupportButton}
                            onPress={() => {
                                Alert.alert(
                                    'Liên hệ để hủy lịch',
                                    'Lịch hẹn đã được xác nhận. Vui lòng liên hệ phòng khám để được hỗ trợ hủy lịch.\n\nHotline: 1900 123 456\nEmail: support@petcare.com',
                                    [{ text: 'OK', style: 'default' }]
                                );
                            }}
                        >
                            <Text style={styles.contactSupportButtonText}>Liên hệ hủy</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    };
    const renderEmptyList = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>Chưa có lịch hẹn nào</Text>
            <Text style={styles.emptySubtitle}>
                {selectedStatus === 'all'
                    ? 'Bạn chưa đặt lịch hẹn nào. Hãy đặt lịch chăm sóc cho thú cưng của bạn.'
                    : `Không có lịch hẹn nào với trạng thái "${getStatusText(selectedStatus)}".`
                }
            </Text>
            <TouchableOpacity
                style={styles.bookNowButton}
                onPress={() => navigation.navigate('PetCareBooking')}
            >
                <Text style={styles.bookNowButtonText}>Đặt lịch ngay</Text>
            </TouchableOpacity>
        </View>
    );

    if (!token) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={24} color="#374151" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Lịch sử đặt lịch</Text>
                </View>
                <View style={styles.loginRequiredContainer}>
                    <Ionicons name="lock-closed-outline" size={64} color="#9CA3AF" />
                    <Text style={styles.loginRequiredTitle}>Cần đăng nhập</Text>
                    <Text style={styles.loginRequiredSubtitle}>
                        Vui lòng đăng nhập để xem lịch sử đặt lịch hẹn
                    </Text>
                    <TouchableOpacity
                        style={styles.loginButton}
                        onPress={() => navigation.navigate('Login')}
                    >
                        <Text style={styles.loginButtonText}>Đăng nhập</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color="#374151" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Lịch sử đặt lịch</Text>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => navigation.navigate('PetCareBooking')}
                >
                    <Ionicons name="add" size={24} color="#3B82F6" />
                </TouchableOpacity>
            </View>

            {/* Status Filter */}
            {renderStatusFilter()}

            {/* Appointments List */}
            {isLoading && appointments.length === 0 ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3B82F6" />
                    <Text style={styles.loadingText}>Đang tải lịch hẹn...</Text>
                </View>
            ) : (
                <FlatList
                    data={appointments}
                    renderItem={renderAppointmentItem}
                    keyExtractor={(item) => item._id}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            colors={['#3B82F6']}
                        />
                    }
                    contentContainerStyle={[
                        styles.listContainer,
                        appointments.length === 0 && styles.emptyListContainer
                    ]}
                    ListEmptyComponent={renderEmptyList}
                    showsVerticalScrollIndicator={false}
                />
            )}

            {/* Error Message */}
            {error && (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={loadAppointments}
                    >
                        <Text style={styles.retryButtonText}>Thử lại</Text>
                    </TouchableOpacity>
                </View>
            )}
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
    addButton: {
        padding: 8,
    },

    // Filter styles
    filterContainer: {
        paddingVertical: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    filterItem: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginLeft: 16,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
    },
    filterText: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
    },
    filterTextActive: {
        color: '#FFFFFF',
        fontWeight: '600',
    },

    // List styles
    listContainer: {
        padding: 16,
    },
    emptyListContainer: {
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

    // Appointment card styles
    appointmentCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    appointmentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    appointmentIdContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    appointmentId: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#374151',
        marginRight: 8,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    appointmentDate: {
        fontSize: 12,
        color: '#6B7280',
    },
    appointmentContent: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    petImage: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginRight: 12,
    },
    appointmentInfo: {
        flex: 1,
    },
    petName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#374151',
        marginBottom: 4,
    },
    serviceName: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 8,
    },
    appointmentTimeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    appointmentTime: {
        fontSize: 14,
        color: '#6B7280',
        marginLeft: 6,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    price: {
        fontSize: 14,
        fontWeight: '600',
        color: '#3B82F6',
        marginLeft: 6,
    },
    notesContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginTop: 4,
    },
    notes: {
        fontSize: 12,
        color: '#6B7280',
        marginLeft: 6,
        flex: 1,
    },
    appointmentActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    detailButton: {
        flex: 1,
        backgroundColor: '#F3F4F6',
        paddingVertical: 10,
        borderRadius: 8,
        marginRight: 8,
        alignItems: 'center',
    },
    detailButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
    },
    // ✅ STYLES CHO NÚT HỦY LỊCH
    cancelButton: {
        flex: 1,
        backgroundColor: '#FEE2E2',
        paddingVertical: 10,
        borderRadius: 8,
        marginLeft: 8,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#DC2626',
    },
    cancelButtonDisabled: {
        backgroundColor: '#F3F4F6',
        opacity: 0.6,
    },
    // ✅ STYLES CHO NÚT LIÊN HỆ HỖ TRỢ
    contactSupportButton: {
        flex: 1,
        backgroundColor: '#FEF3C7',
        paddingVertical: 10,
        borderRadius: 8,
        marginLeft: 8,
        alignItems: 'center',
    },
    contactSupportButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#D97706',
    },

    // Empty state styles
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#374151',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 24,
    },
    bookNowButton: {
        backgroundColor: '#3B82F6',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    bookNowButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },

    // Login required styles
    loginRequiredContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    loginRequiredTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#374151',
        marginTop: 16,
        marginBottom: 8,
    },
    loginRequiredSubtitle: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 24,
    },
    loginButton: {
        backgroundColor: '#3B82F6',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    loginButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },

    // Error styles
    errorContainer: {
        position: 'absolute',
        bottom: 20,
        left: 16,
        right: 16,
        backgroundColor: '#FEE2E2',
        padding: 16,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    errorText: {
        fontSize: 14,
        color: '#DC2626',
        flex: 1,
    },
    retryButton: {
        backgroundColor: '#DC2626',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        marginLeft: 12,
    },
    retryButtonText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});

export default AppointmentHistoryScreen;