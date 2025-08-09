// components/EditAppointmentModal.tsx - MODAL SỬA LỊCH HẸN CHO MOBILE
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, isBefore, parseISO, startOfDay } from 'date-fns';
import { vi } from 'date-fns/locale';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { getAvailableSlots, updateAppointment } from '../../redux/slices/appointmentSlice';
import { AppDispatch } from '../../redux/store';
import { Appointment } from '../../types';

interface EditAppointmentModalProps {
    visible: boolean;
    onClose: () => void;
    appointment: Appointment | null;
    onSuccess: () => void;
}

interface AvailableSlot {
    time: string;
    available: boolean;
}

const EditAppointmentModal: React.FC<EditAppointmentModalProps> = ({
    visible,
    onClose,
    appointment,
    onSuccess
}) => {
    const dispatch = useDispatch<AppDispatch>();

    // Form state
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedTime, setSelectedTime] = useState('');
    const [notes, setNotes] = useState('');
    const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);

    // UI state
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Khung giờ làm việc
    const workingHours = [
        '08:00', '09:00', '10:00', '11:00',
        '14:00', '15:00', '16:00', '17:00'
    ];

    // Initialize form data when modal opens
    useEffect(() => {
        if (visible && appointment) {
            // Kiểm tra chỉ cho phép sửa khi status = pending
            if (appointment.status !== 'pending') {
                setError('Chỉ có thể sửa lịch hẹn ở trạng thái "Chờ xác nhận"');
                return;
            }

            // Set initial values using date-fns
            const appointmentDate = parseISO(appointment.appointment_date);
            setSelectedDate(appointmentDate);
            setSelectedTime(appointment.appointment_time);
            setNotes(appointment.notes || '');
            setError(null);

            // Load available slots for current date
            loadAvailableSlots(appointmentDate);
        }
    }, [visible, appointment]);

    // Load available time slots
    const loadAvailableSlots = async (date: Date) => {
        setIsLoadingSlots(true);
        try {
            // Format date to YYYY-MM-DD using date-fns
            const dateString = format(date, 'yyyy-MM-dd');
            const response = await dispatch(getAvailableSlots(dateString)).unwrap();

            console.log('✅ Available slots response:', response);

            // ✅ SỬA: Backend trả về `data` chứa mảng các slot AVAILABLE (còn trống)
            let availableSlotsFromAPI: string[] = [];

            if (Array.isArray(response)) {
                // Trường hợp response trực tiếp là array
                availableSlotsFromAPI = response;
            } else if (response.data && Array.isArray(response.data)) {
                // Trường hợp response có cấu trúc { data: [...] }
                availableSlotsFromAPI = response.data;
            } else if (response.availableSlots && Array.isArray(response.availableSlots)) {
                // Trường hợp response có field availableSlots
                availableSlotsFromAPI = response.availableSlots;
            }

            // Create slots array with availability
            const slots = workingHours.map(time => ({
                time,
                // Slot available nếu có trong availableSlotsFromAPI HOẶC là appointment time hiện tại
                available: availableSlotsFromAPI.includes(time) || time === appointment?.appointment_time
            }));

            console.log('✅ Processed slots:', slots);
            setAvailableSlots(slots);
        } catch (error: any) {
            console.error('Load available slots error:', error);
            setError('Không thể tải khung giờ trống');
        } finally {
            setIsLoadingSlots(false);
        }
    };

    // Handle date change
    const handleDateChange = (event: any, date?: Date) => {
        setShowDatePicker(Platform.OS === 'ios');

        if (date) {
            setSelectedDate(date);
            loadAvailableSlots(date);
        }
    };

    // Validate form
    const validateForm = (): string | null => {
        if (!selectedDate) {
            return 'Vui lòng chọn ngày hẹn';
        }

        if (!selectedTime) {
            return 'Vui lòng chọn giờ hẹn';
        }

        // Check if date is not in the past using date-fns
        const today = startOfDay(new Date());
        const selectedDateStart = startOfDay(selectedDate);

        if (isBefore(selectedDateStart, today)) {
            return 'Ngày hẹn không thể trong quá khứ';
        }

        // Check if selected slot is available
        const selectedSlot = availableSlots.find(slot => slot.time === selectedTime);
        if (selectedSlot && !selectedSlot.available) {
            return 'Khung giờ này đã được đặt';
        }

        return null;
    };

    // Handle save
    const handleSave = async () => {
        if (!appointment) return;

        const validationError = validateForm();
        if (validationError) {
            Alert.alert('Lỗi', validationError);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const updateData = {
                appointment_date: format(selectedDate, 'yyyy-MM-dd'),
                appointment_time: selectedTime,
                notes: notes.trim()
            };

            await dispatch(updateAppointment({
                id: appointment._id,
                data: updateData
            })).unwrap();

            Alert.alert(
                'Thành công',
                'Đã cập nhật lịch hẹn thành công',
                [{
                    text: 'OK', onPress: () => {
                        onSuccess();
                        onClose();
                    }
                }]
            );

        } catch (error: any) {
            console.error('Update appointment error:', error);
            Alert.alert(
                'Lỗi',
                error.message || 'Không thể cập nhật lịch hẹn'
            );
        } finally {
            setIsLoading(false);
        }
    };

    // Handle close
    const handleClose = () => {
        setSelectedDate(new Date());
        setSelectedTime('');
        setNotes('');
        setAvailableSlots([]);
        setError(null);
        onClose();
    };

    if (!appointment) return null;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={handleClose}
        >
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleClose}>
                        <Ionicons name="close" size={24} color="#374151" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Sửa lịch hẹn</Text>
                    <TouchableOpacity
                        onPress={handleSave}
                        disabled={isLoading}
                        style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
                    >
                        {isLoading ? (
                            <ActivityIndicator size="small" color="#3B82F6" />
                        ) : (
                            <Text style={styles.saveButtonText}>Lưu</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Appointment Info */}
                    <View style={styles.appointmentInfo}>
                        <Text style={styles.sectionTitle}>Thông tin lịch hẹn</Text>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Thú cưng:</Text>
                            <Text style={styles.infoValue}>{appointment.pet_id.name}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Dịch vụ:</Text>
                            <Text style={styles.infoValue}>{appointment.service_id.name}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Giá:</Text>
                            <Text style={styles.infoPrice}>
                                {appointment.service_id.price?.toLocaleString('vi-VN')}₫
                            </Text>
                        </View>
                    </View>

                    {/* Error Message */}
                    {error && (
                        <View style={styles.errorContainer}>
                            <Ionicons name="alert-circle" size={16} color="#EF4444" />
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    )}

                    {/* Date Selection */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Ngày hẹn</Text>
                        <TouchableOpacity
                            style={styles.dateButton}
                            onPress={() => setShowDatePicker(true)}
                        >
                            <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                            <Text style={styles.dateButtonText}>
                                {format(selectedDate, 'EEEE, dd MMMM yyyy', { locale: vi })}
                            </Text>
                        </TouchableOpacity>

                        {showDatePicker && (
                            <DateTimePicker
                                value={selectedDate}
                                mode="date"
                                display="default"
                                minimumDate={new Date()}
                                onChange={handleDateChange}
                            />
                        )}
                    </View>

                    {/* Time Selection */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Giờ hẹn</Text>

                        {isLoadingSlots ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="small" color="#3B82F6" />
                                <Text style={styles.loadingText}>Đang tải khung giờ...</Text>
                            </View>
                        ) : (
                            <View style={styles.timeGrid}>
                                {availableSlots.map((slot) => (
                                    <TouchableOpacity
                                        key={slot.time}
                                        style={[
                                            styles.timeSlot,
                                            selectedTime === slot.time && styles.timeSlotSelected,
                                            !slot.available && styles.timeSlotDisabled
                                        ]}
                                        onPress={() => slot.available && setSelectedTime(slot.time)}
                                        disabled={!slot.available}
                                    >
                                        <Text style={[
                                            styles.timeSlotText,
                                            selectedTime === slot.time && styles.timeSlotTextSelected,
                                            !slot.available && styles.timeSlotTextDisabled
                                        ]}>
                                            {slot.time}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>

                    {/* Notes */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Ghi chú (tùy chọn)</Text>
                        <TextInput
                            style={styles.notesInput}
                            value={notes}
                            onChangeText={setNotes}
                            placeholder="Nhập ghi chú nếu có..."
                            multiline
                            numberOfLines={3}
                            textAlignVertical="top"
                            maxLength={500}
                        />
                        <Text style={styles.characterCount}>{notes.length}/500</Text>
                    </View>
                </ScrollView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 60 : 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
    },
    saveButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: '#EFF6FF',
    },
    saveButtonDisabled: {
        opacity: 0.5,
    },
    saveButtonText: {
        color: '#3B82F6',
        fontWeight: '600',
    },
    content: {
        flex: 1,
        paddingHorizontal: 16,
    },
    appointmentInfo: {
        backgroundColor: '#F9FAFB',
        padding: 16,
        borderRadius: 12,
        marginTop: 16,
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 12,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    infoLabel: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
    },
    infoValue: {
        fontSize: 14,
        color: '#111827',
        fontWeight: '500',
    },
    infoPrice: {
        fontSize: 14,
        color: '#3B82F6',
        fontWeight: '600',
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF2F2',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#FECACA',
    },
    errorText: {
        color: '#EF4444',
        fontSize: 14,
        marginLeft: 8,
        flex: 1,
    },
    section: {
        marginBottom: 24,
    },
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    dateButtonText: {
        fontSize: 16,
        color: '#111827',
        marginLeft: 12,
        fontWeight: '500',
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    loadingText: {
        color: '#6B7280',
        marginLeft: 8,
    },
    timeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    timeSlot: {
        backgroundColor: '#F9FAFB',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        minWidth: '22%',
        alignItems: 'center',
    },
    timeSlotSelected: {
        backgroundColor: '#3B82F6',
        borderColor: '#3B82F6',
    },
    timeSlotDisabled: {
        backgroundColor: '#F3F4F6',
        borderColor: '#D1D5DB',
    },
    timeSlotText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
    },
    timeSlotTextSelected: {
        color: '#FFFFFF',
    },
    timeSlotTextDisabled: {
        color: '#9CA3AF',
    },
    notesInput: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: '#111827',
        minHeight: 100,
    },
    characterCount: {
        textAlign: 'right',
        color: '#6B7280',
        fontSize: 12,
        marginTop: 4,
    },
});

export default EditAppointmentModal;