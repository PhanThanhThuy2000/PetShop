// app/screens/AppointmentListScreen.tsx
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
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

const AppointmentListScreen = () => {
    const navigation = useNavigation<any>();
    const dispatch = useDispatch<AppDispatch>();
    const { token } = useAuth();

    // Redux state
    const { appointments, isLoading, pagination } = useSelector((state: RootState) => state.appointments);

    // Local state
    const [refreshing, setRefreshing] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState<string>('all');

    // Status options
    const statusOptions = [
        { value: 'all', label: 'Tất cả', color: '#666' },
        { value: 'pending', label: 'Chờ xác nhận', color: '#f39c12' },
        { value: 'confirmed', label: 'Đã xác nhận', color: '#27ae60' },
        { value: 'in_progress', label: 'Đang thực hiện', color: '#3498db' },
        { value: 'completed', label: 'Hoàn thành', color: '#2ecc71' },
        { value: 'cancelled', label: 'Đã hủy', color: '#e74c3c' },
    ];

    useFocusEffect(
        useCallback(() => {
            if (!token) {
                Alert.alert('Cảnh báo', 'Vui lòng đăng nhập để xem lịch hẹn', [
                    { text: 'OK', onPress: () => navigation.navigate('Login') }
                ]);
                return;
            }

            loadAppointments();
        }, [token, selectedStatus])
    );

    const loadAppointments = async () => {
        try {
            const params = selectedStatus !== 'all' ? { status: selectedStatus as any } : {};
            await dispatch(getUserAppointments(params));
        } catch (error) {
            console.error('Error loading appointments:', error);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadAppointments();
        setRefreshing(false);
    };

    const handleCancelAppointment = (appointment: Appointment) => {
        Alert.alert(
            'Xác nhận hủy',
            `Bạn có chắc chắn muốn hủy lịch hẹn "${appointment.service_id && typeof appointment.service_id === 'object' ? appointment.service_id.name : 'Dịch vụ'}"?`,
            [
                { text: 'Không', style: 'cancel' },
                {
                    text: 'Hủy lịch',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await dispatch(cancelAppointment(appointment._id)).unwrap();
                            Alert.alert('Thành công', 'Đã hủy lịch hẹn');
                            loadAppointments(); // Reload danh sách
                        } catch (error: any) {
                            Alert.alert('Lỗi', error || 'Không thể hủy lịch hẹn');
                        }
                    }
                }
            ]
        );
    };

    const getStatusColor = (status: string) => {
        const statusOption = statusOptions.find(opt => opt.value === status);
        return statusOption?.color || '#666';
    };

    const getStatusLabel = (status: string) => {
        const statusOption = statusOptions.find(opt => opt.value === status);
        return statusOption?.label || status;
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const canCancelAppointment = (appointment: Appointment) => {
        return ['pending', 'confirmed'].includes(appointment.status);
    };

    const renderAppointmentItem = ({ item }: { item: Appointment }) => {
        const pet = typeof item.pet_id === 'object' ? item.pet_id : null;
        const service = typeof item.service_id === 'object' ? item.service_id : null;
        const staff = typeof item.staff_id === 'object' ? item.staff_id : null;

        return (
            <View style={styles.appointmentCard}>
                {/* Header */}
                <View style={styles.cardHeader}>
                    <View style={styles.statusContainer}>
                        <View
                            style={[
                                styles.statusBadge,
                                { backgroundColor: getStatusColor(item.status) }
                            ]}
                        >
                            <Text style={styles.statusText}>
                                {getStatusLabel(item.status)}
                            </Text>
                        </View>
                    </View>
                    <Text style={styles.appointmentId}>#{item._id.slice(-6)}</Text>
                </View>

                {/* Content */}
                <View style={styles.cardContent}>
                    {/* Pet info */}
                    {pet && (
                        <View style={styles.infoRow}>
                            <Ionicons name="paw" size={16} color="#666" />
                            <Text style={styles.infoText}>{pet.name}</Text>
                        </View>
                    )}

                    {/* Service info */}
                    {service && (
                        <View style={styles.infoRow}>
                            <Ionicons name="medical" size={16} color="#666" />
                            <View style={styles.serviceInfo}>
                                <Text style={styles.infoText}>{service.name}</Text>
                                <Text style={styles.priceText}>
                                    {service.price?.toLocaleString('vi-VN')}đ
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* Date & Time */}
                    <View style={styles.infoRow}>
                        <Ionicons name="calendar" size={16} color="#666" />
                        <Text style={styles.infoText}>
                            {formatDate(item.appointment_date)}
                        </Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Ionicons name="time" size={16} color="#666" />
                        <Text style={styles.infoText}>{item.appointment_time}</Text>
                    </View>

                    {/* Staff info */}
                    {staff && (
                        <View style={styles.infoRow}>
                            <Ionicons name="person" size={16} color="#666" />
                            <Text style={styles.infoText}>NV: {staff.username}</Text>
                        </View>
                    )}

                    {/* Notes */}
                    {item.notes && (
                        <View style={styles.infoRow}>
                            <Ionicons name="document-text" size={16} color="#666" />
                            <Text style={styles.infoText} numberOfLines={2}>
                                {item.notes}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Actions */}
                <View style={styles.cardActions}>
                    <TouchableOpacity
                        style={styles.detailButton}
                        onPress={() => navigation.navigate('AppointmentDetail', {
                            appointmentId: item._id
                        })}
                    >
                        <Text style={styles.detailButtonText}>Chi tiết</Text>
                    </TouchableOpacity>

                    {canCancelAppointment(item) && (
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => handleCancelAppointment(item)}
                        >
                            <Text style={styles.cancelButtonText}>Hủy lịch</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    };

    const renderStatusFilter = () => (
        <View style={styles.filterContainer}>
            <FlatList
                horizontal
                data={statusOptions}
                keyExtractor={(item) => item.value}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={[
                            styles.filterButton,
                            selectedStatus === item.value && styles.filterButtonActive
                        ]}
                        onPress={() => setSelectedStatus(item.value)}
                    >
                        <Text style={[
                            styles.filterButtonText,
                            selectedStatus === item.value && styles.filterButtonTextActive
                        ]}>
                            {item.label}
                        </Text>
                    </TouchableOpacity>
                )}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterList}
            />
        </View>
    );

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color="#ccc" />
            <Text style={styles.emptyStateTitle}>Chưa có lịch hẹn nào</Text>
            <Text style={styles.emptyStateText}>
                Bạn chưa có lịch hẹn nào. Hãy đặt lịch chăm sóc cho thú cưng của bạn!
            </Text>
            <TouchableOpacity
                style={styles.bookButton}
                onPress={() => navigation.navigate('BookAppointment')}
            >
                <Text style={styles.bookButtonText}>Đặt lịch ngay</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Lịch Hẹn Của Tôi</Text>
                <TouchableOpacity onPress={() => navigation.navigate('BookAppointment')}>
                    <Ionicons name="add" size={24} color="#007AFF" />
                </TouchableOpacity>
            </View>

            {/* Status Filter */}
            {renderStatusFilter()}

            {/* Appointments List */}
            {isLoading && !refreshing ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                    <Text style={styles.loadingText}>Đang tải lịch hẹn...</Text>
                </View>
            ) : (
                <FlatList
                    data={appointments}
                    keyExtractor={(item) => item._id}
                    renderItem={renderAppointmentItem}
                    contentContainerStyle={styles.listContainer}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            colors={['#007AFF']}
                        />
                    }
                    ListEmptyComponent={renderEmptyState}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000',
    },
    filterContainer: {
        backgroundColor: '#fff',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    filterList: {
        paddingHorizontal: 16,
    },
    filterButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginRight: 8,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
    },
    filterButtonActive: {
        backgroundColor: '#007AFF',
    },
    filterButtonText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    filterButtonTextActive: {
        color: '#fff',
    },
    listContainer: {
        padding: 16,
        flexGrow: 1,
    },
    appointmentCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        paddingBottom: 8,
    },
    statusContainer: {
        flex: 1,
    },
    statusBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    appointmentId: {
        fontSize: 12,
        color: '#999',
        fontWeight: '500',
    },
    cardContent: {
        paddingHorizontal: 16,
        paddingBottom: 8,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    infoText: {
        fontSize: 14,
        color: '#333',
        marginLeft: 8,
        flex: 1,
    },
    serviceInfo: {
        flex: 1,
        marginLeft: 8,
    },
    priceText: {
        fontSize: 14,
        color: '#007AFF',
        fontWeight: '600',
        marginTop: 2,
    },
    cardActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        padding: 16,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    detailButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#007AFF',
        marginRight: 8,
    },
    detailButtonText: {
        color: '#007AFF',
        fontSize: 14,
        fontWeight: '500',
    },
    cancelButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 6,
        backgroundColor: '#ff3b30',
    },
    cancelButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#666',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    emptyStateTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyStateText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    bookButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    bookButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default AppointmentListScreen;