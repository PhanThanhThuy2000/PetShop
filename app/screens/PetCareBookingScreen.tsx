import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '../../hooks/redux';
import { createAppointment, getAvailableSlots } from '../redux/slices/appointmentSlice';
import { getAllServices } from '../redux/slices/careServiceSlice';
import { AppDispatch, RootState } from '../redux/store';
import { ordersService } from '../services/OrderApiService'; // Thêm import ordersService từ OrderApiService
import { CustomerInfo, Service, TimeSlot } from '../types/PetCareBooking'; // Thêm OrderItem type

// Interfaces gốc - GIỮ NGUYÊN
interface Pet {
    id: string;
    name: string;
    type: string;
    breed: string;
    age: string;
    image: string;
}

// Thêm interface cho PurchasedPet
interface PurchasedPetOrderItem {
    _id: string;
    pet_id?: {
        _id: string;
        name: string;
        type: string;
        breed_id: string | { name: string };
        age?: number;
        images?: { url: string }[];
    };
    quantity: number;
    unit_price: number;
    order_id: any;
}

// Interface cho API response OrderItem
interface ApiOrderItem {
    _id: string;
    pet_id?: {
        _id: string;
        name: string;
        type: string;
        breed_id: string | { name: string };
        age?: number;
        images?: { url: string }[];
    };
    product_id?: {
        _id: string;
        name: string;
        price: number;
    };
    quantity: number;
    unit_price: number;
    order_id: any;
}

const PetCareBookingScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const dispatch = useDispatch<AppDispatch>();
    const { token, user } = useAuth();

    // Redux state cho backend
    const { services: backendServices, isLoading: servicesLoading } = useSelector((state: RootState) => state.careServices);
    const { availableSlots, isLoading: appointmentLoading } = useSelector((state: RootState) => state.appointments);

    // State gốc - GIỮ NGUYÊN
    const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [selectedTime, setSelectedTime] = useState<string>('');
    const [selectedLocation, setSelectedLocation] = useState<string>('');
    const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
        name: user?.username || '',
        phone: user?.phone || '',
        email: user?.email || '',
        notes: ''
    });
    const [showConfirmation, setShowConfirmation] = useState(false);

    // Backend data state - THAY ĐỔI TÊN BIẾN
    const [purchasedPets, setPurchasedPets] = useState<PurchasedPetOrderItem[]>([]);
    const [petsLoading, setPetsLoading] = useState(false);

    // Convert purchased pets sang format gốc - CẬP NHẬT LOGIC
    const pets: Pet[] = purchasedPets.map(orderItem => {
        const pet = orderItem.pet_id;
        console.log('🔄 Converting pet:', JSON.stringify(pet, null, 2));

        if (!pet) {
            console.log('❌ Pet is null/undefined');
            return null;
        }

        const convertedPet = {
            id: pet._id,
            name: pet.name || 'Thú cưng',
            type: pet.type || 'Chưa rõ loại',
            breed: typeof pet.breed_id === 'object' ? pet.breed_id.name : (pet.breed_id || 'Chưa rõ giống'),
            age: pet.age ? `${pet.age} tuổi` : 'Chưa rõ tuổi',
            image: pet.images && pet.images.length > 0 ? pet.images[0].url : 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=100&h=100&fit=crop&crop=face'
        };

        console.log('✅ Converted pet:', convertedPet);
        return convertedPet;
    }).filter((pet): pet is Pet => pet !== null);

    console.log('🎯 Final converted pets:', pets.length, pets);

    // Convert backend services sang format gốc - GIỮ NGUYÊN
    const services: Service[] = backendServices.map(service => {
        const getServiceIcon = (category: string) => {
            switch (category) {
                case 'bathing': return '🛁';
                case 'health': return '🩺';
                case 'grooming': return '✂️';
                case 'spa': return '💆';
                default: return '💆';
            }
        };

        return {
            id: service._id,
            name: service.name,
            price: service.price,
            duration: `${service.duration} phút`,
            description: service.description || '',
            icon: getServiceIcon(service.category)
        };
    });

    // Static data gốc - GIỮ NGUYÊN
    const locations = [
        'PetShop Chi nhánh 1 - Quận 1, TP.HCM',
        'PetShop Chi nhánh 2 - Quận 3, TP.HCM',
        'PetShop Chi nhánh 3 - Quận 7, TP.HCM'
    ];

    // Convert availableSlots thành timeSlots format gốc - GIỮ NGUYÊN
    const timeSlots: TimeSlot[] = [
        { time: '08:00', available: availableSlots.includes('08:00') },
        { time: '09:00', available: availableSlots.includes('09:00') },
        { time: '10:00', available: availableSlots.includes('10:00') },
        { time: '11:00', available: availableSlots.includes('11:00') },
        { time: '14:00', available: availableSlots.includes('14:00') },
        { time: '15:00', available: availableSlots.includes('15:00') },
        { time: '16:00', available: availableSlots.includes('16:00') },
        { time: '17:00', available: availableSlots.includes('17:00') }
    ];

    // Load backend data - GIỮ NGUYÊN
    useEffect(() => {
        if (!token) {
            Alert.alert('Cảnh báo', 'Vui lòng đăng nhập để đặt lịch hẹn', [
                { text: 'OK', onPress: () => navigation.navigate('Login') }
            ]);
            return;
        }

        loadBackendData();
    }, [token]);

    // Load available slots khi chọn ngày - GIỮ NGUYÊN
    useEffect(() => {
        if (selectedDate && selectedDate.length > 0) {
            // Validate DD/MM/YYYY
            const dateParts = selectedDate.split('/');
            if (
                dateParts.length === 3 &&
                dateParts[0].length === 2 &&
                dateParts[1].length === 2 &&
                dateParts[2].length === 4
            ) {
                const apiDate = `${dateParts[2]}-${dateParts[1].padStart(2, '0')}-${dateParts[0].padStart(2, '0')}`;
                // Kiểm tra ngày hợp lệ bằng Date
                if (!isNaN(Date.parse(apiDate))) {
                    dispatch(getAvailableSlots(apiDate));
                } else {
                    console.warn('❌ Invalid date format:', apiDate);
                    Alert.alert('Lỗi', 'Ngày không hợp lệ. Vui lòng nhập đúng định dạng DD/MM/YYYY.');
                }
            } else {
                console.warn('❌ Invalid date input:', selectedDate);
                // Có thể báo lỗi cho user nếu muốn
            }
        }
    }, [selectedDate]);

    const loadBackendData = async () => {
        try {
            // Load services
            await dispatch(getAllServices({ active: true }));

            // Load purchased pets - THAY ĐỔI
            await loadPurchasedPets();

            // ALTERNATIVE: Nếu getMyOrderItems không hoạt động, thử getMyOrders
            // await loadPurchasedPetsAlternative();
        } catch (error) {
            console.error('Error loading backend data:', error);
        }
    };

    // ALTERNATIVE METHOD - Thử approach khác nếu getMyOrderItems không hoạt động
    const loadPurchasedPetsAlternative = async () => {
        try {
            console.log('🔄 Trying alternative method...');

            // Lấy orders của user trước
            const ordersResponse = await ordersService.getMyOrders({ limit: 100 });
            console.log('📦 Orders response:', JSON.stringify(ordersResponse, null, 2));

            let ordersData = null;

            // Handle different response formats
            if (ordersResponse && ordersResponse.success && ordersResponse.data) {
                ordersData = ordersResponse.data;
            } else if (ordersResponse && ordersResponse.data) {
                ordersData = ordersResponse.data;
            } else if (Array.isArray(ordersResponse)) {
                ordersData = ordersResponse;
            }

            if (ordersData && Array.isArray(ordersData)) {
                console.log('📋 Found orders:', ordersData.length);
                const allPurchasedPets: PurchasedPetOrderItem[] = [];

                // Loop qua từng order để lấy order items
                for (const order of ordersData) {
                    try {
                        console.log(`🔍 Loading items for order: ${order._id}`);
                        const orderItemsResponse = await ordersService.getOrderItemsByOrderId(order._id);
                        console.log(`📋 Order ${order._id} items response:`, JSON.stringify(orderItemsResponse, null, 2));

                        let itemsData = null;

                        if (orderItemsResponse && orderItemsResponse.success && orderItemsResponse.data) {
                            itemsData = orderItemsResponse.data;
                        } else if (orderItemsResponse && orderItemsResponse.data) {
                            itemsData = orderItemsResponse.data;
                        } else if (Array.isArray(orderItemsResponse)) {
                            itemsData = orderItemsResponse;
                        }

                        if (itemsData && Array.isArray(itemsData)) {
                            const petItems = itemsData.filter((item: any) => {
                                console.log(`🔍 Item ${item._id} has pet_id:`, !!item.pet_id);
                                return item.pet_id && item.pet_id !== null;
                            });

                            console.log(`🐾 Found ${petItems.length} pet items in order ${order._id}`);
                            allPurchasedPets.push(...petItems);
                        }
                    } catch (itemError) {
                        console.error(`❌ Error loading items for order ${order._id}:`, itemError);
                    }
                }

                console.log('🎯 All purchased pets (alternative):', allPurchasedPets.length);

                if (allPurchasedPets.length > 0) {
                    // Remove duplicates
                    const uniquePets: PurchasedPetOrderItem[] = [];
                    const seenPetIds = new Set<string>();

                    allPurchasedPets.forEach((item: any) => {
                        const petId = item.pet_id?._id;
                        if (petId && !seenPetIds.has(petId)) {
                            seenPetIds.add(petId);
                            uniquePets.push(item);
                        }
                    });

                    console.log('🎯 Unique pets from alternative method:', uniquePets.length);
                    setPurchasedPets(uniquePets);
                    return;
                }
            }

            // If alternative method also fails, show alert
            console.log('⚠️ Alternative method found no pets');
            Alert.alert(
                'Thông báo',
                'Bạn chưa mua thú cưng nào. Vui lòng mua thú cưng trước khi đặt lịch chăm sóc.',
                [
                    { text: 'Mua thú cưng', onPress: () => navigation.navigate('PetAll') },
                    { text: 'Quay lại', onPress: () => navigation.goBack() }
                ]
            );

        } catch (error) {
            console.error('❌ Alternative method failed:', error);

            // Final fallback - use sample data for testing
            console.log('🔄 Using fallback data for testing...');
            setPurchasedPets([
                {
                    _id: '1',
                    pet_id: {
                        _id: '1',
                        name: 'Buddy',
                        type: 'Chó',
                        breed_id: 'Golden Retriever',
                        age: 2,
                        images: [{ url: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=100&h=100&fit=crop&crop=face' }]
                    },
                    quantity: 1,
                    unit_price: 5000000,
                    order_id: null
                },
                {
                    _id: '2',
                    pet_id: {
                        _id: '2',
                        name: 'Mimi',
                        type: 'Mèo',
                        breed_id: 'British Shorthair',
                        age: 1,
                        images: [{ url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=100&h=100&fit=crop&crop=face' }]
                    },
                    quantity: 1,
                    unit_price: 3000000,
                    order_id: null
                }
            ]);
        }
    };

    // HÀM MỚI - Lấy pet đã mua từ order items
    const loadPurchasedPets = async () => {
        try {
            setPetsLoading(true);
            console.log('🔍 Loading purchased pets...');

            const response = await ordersService.getMyOrderItems({
                limit: 100 // Lấy nhiều items để đảm bảo không bị thiếu
            });

            console.log('📦 Raw API response:', response);
            console.log('📦 Response data:', response.data);

            // Sửa điều kiện này:
            if (response.data && Array.isArray(response.data)) {
                console.log('✅ API call successful, processing data...');
                console.log('📊 Total order items:', response.data.length);

                // Debug: Log first few items để xem structure
                response.data.slice(0, 3).forEach((item, index) => {
                    console.log(`📋 Order item ${index}:`, JSON.stringify(item, null, 2));
                });

                // Lọc chỉ lấy order items có pet_id (không lấy product)
                const petOrderItems = response.data.filter((item: ApiOrderItem) => {
                    const hasPet = item.pet_id && item.pet_id !== null;
                    console.log(`🔍 Item ${item._id} has pet:`, hasPet, 'pet_id:', item.pet_id);
                    return hasPet;
                });

                console.log('🐾 Filtered pet order items:', petOrderItems.length);

                // Loại bỏ duplicate pets (cùng 1 pet có thể được mua nhiều lần)
                const uniquePets: PurchasedPetOrderItem[] = [];
                const seenPetIds = new Set<string>();

                petOrderItems.forEach((item: ApiOrderItem) => {
                    const petId = item.pet_id?._id;
                    console.log(`🔍 Processing pet_id: ${petId}`);

                    if (petId && !seenPetIds.has(petId)) {
                        seenPetIds.add(petId);
                        uniquePets.push(item);
                        console.log(`✅ Added unique pet: ${item.pet_id?.name} (${petId})`);
                    } else {
                        console.log(`❌ Skipped pet (duplicate or invalid): ${petId}`);
                    }
                });

                console.log('🎯 Final unique pets:', uniquePets.length);
                setPurchasedPets(uniquePets);

                if (uniquePets.length === 0) {
                    console.log('⚠️ No pets found in orders');
                    Alert.alert(
                        'Thông báo',
                        'Bạn chưa mua thú cưng nào. Vui lòng mua thú cưng trước khi đặt lịch chăm sóc.',
                        [
                            { text: 'Mua thú cưng', onPress: () => navigation.navigate('PetAll') },
                            { text: 'Quay lại', onPress: () => navigation.goBack() }
                        ]
                    );
                }
            } else {
                console.log('❌ API response not successful or no data');
                console.log('Response:', response);
                throw new Error('API response not successful');
            }
        } catch (error) {
            console.error('❌ Error loading purchased pets:', error);
            Alert.alert('Lỗi', 'Không thể tải danh sách thú cưng đã mua. Vui lòng thử lại.');

            // Fallback về data mẫu nếu API lỗi (cho development)
            console.log('🔄 Using fallback data...');
            setPurchasedPets([
                {
                    _id: '1',
                    pet_id: {
                        _id: '1',
                        name: 'Buddy',
                        type: 'Chó',
                        breed_id: 'Golden Retriever',
                        age: 2,
                        images: [{ url: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=100&h=100&fit=crop&crop=face' }]
                    },
                    quantity: 1,
                    unit_price: 5000000,
                    order_id: null
                },
                {
                    _id: '2',
                    pet_id: {
                        _id: '2',
                        name: 'Mimi',
                        type: 'Mèo',
                        breed_id: 'British Shorthair',
                        age: 1,
                        images: [{ url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=100&h=100&fit=crop&crop=face' }]
                    },
                    quantity: 1,
                    unit_price: 3000000,
                    order_id: null
                }
            ]);
        } finally {
            setPetsLoading(false);
        }
    };

    // Functions gốc - GIỮ NGUYÊN
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    const handleBooking = async () => {
        if (selectedPet && selectedService && selectedDate && selectedTime && selectedLocation && customerInfo.name && customerInfo.phone) {
            try {
                // Convert DD/MM/YYYY sang YYYY-MM-DD cho API
                const dateParts = selectedDate.split('/');
                const apiDate = `${dateParts[2]}-${dateParts[1].padStart(2, '0')}-${dateParts[0].padStart(2, '0')}`;

                // Tìm backend pet và service từ selected items - CẬP NHẬT LOGIC
                const selectedPetOrderItem = purchasedPets.find(item => item.pet_id?._id === selectedPet?.id);
                const backendService = backendServices.find(s => s._id === selectedService.id);

                if (!selectedPetOrderItem || !selectedPetOrderItem.pet_id || !backendService) {
                    // Fallback về logic cũ nếu không tìm thấy backend data
                    setShowConfirmation(true);
                    return;
                }

                // NEW CHECK - Validate order_id
                if (!selectedPetOrderItem.order_id || !selectedPetOrderItem.order_id._id) {
                    Alert.alert('Lỗi', 'Thú cưng này không thuộc đơn hàng hợp lệ. Vui lòng chọn lại.');
                    return;
                }

                const appointmentData = {
                    pet_id: selectedPetOrderItem.pet_id._id,
                    service_id: backendService._id,
                    appointment_date: apiDate,
                    appointment_time: selectedTime,
                    notes: customerInfo.notes.trim() || undefined,
                    order_id: selectedPetOrderItem.order_id._id,
                    price: backendService.price,
                    total_amount: backendService.price // Thêm dòng này để khớp với backend
                };
                console.log('📦 Appointment data:', appointmentData);

                await dispatch(createAppointment(appointmentData)).unwrap();
                setShowConfirmation(true);
            } catch (error: any) {
                Alert.alert('Lỗi', error || 'Không thể đặt lịch hẹn. Vui lòng thử lại.');
            }
        } else {
            Alert.alert('Thiếu thông tin', 'Vui lòng điền đầy đủ thông tin để đặt lịch');
        }
    };

    const resetForm = () => {
        setSelectedPet(null);
        setSelectedService(null);
        setSelectedDate('');
        setSelectedTime('');
        setSelectedLocation('');
        setCustomerInfo({
            name: user?.username || '',
            phone: user?.phone || '',
            email: user?.email || '',
            notes: ''
        });
        setShowConfirmation(false);
    };

    // Render functions gốc - GIỮ NGUYÊN
    const renderPetItem = ({ item }: { item: Pet }) => (
        <TouchableOpacity
            style={[
                styles.petItem,
                selectedPet?.id === item.id && styles.selectedItem
            ]}
            onPress={() => setSelectedPet(item)}
        >
            <Image source={{ uri: item.image }} style={styles.petImage} />
            <View style={styles.petInfo}>
                <Text style={styles.petName}>{item.name}</Text>
                <Text style={styles.petDetails}>{item.type} - {item.breed}</Text>
                <Text style={styles.petAge}>{item.age}</Text>
            </View>
            {selectedPet?.id === item.id && (
                <Ionicons name="checkmark-circle" size={24} color="#3B82F6" />
            )}
        </TouchableOpacity>
    );

    const renderServiceItem = ({ item }: { item: Service }) => (
        <TouchableOpacity
            style={[
                styles.serviceItem,
                selectedService?.id === item.id && styles.selectedItem
            ]}
            onPress={() => setSelectedService(item)}
        >
            <View style={styles.serviceHeader}>
                <View style={styles.serviceIconContainer}>
                    <Text style={styles.serviceIcon}>{item.icon}</Text>
                    <View>
                        <Text style={styles.serviceName}>{item.name}</Text>
                        <Text style={styles.serviceDuration}>{item.duration}</Text>
                    </View>
                </View>
                {selectedService?.id === item.id && (
                    <Ionicons name="checkmark-circle" size={24} color="#3B82F6" />
                )}
            </View>
            <Text style={styles.serviceDescription}>{item.description}</Text>
            <Text style={styles.servicePrice}>{formatPrice(item.price)}</Text>
        </TouchableOpacity>
    );

    const renderTimeSlot = ({ item }: { item: TimeSlot }) => (
        <TouchableOpacity
            style={[
                styles.timeSlot,
                selectedTime === item.time && styles.selectedTimeSlot,
                !item.available && styles.unavailableTimeSlot
            ]}
            onPress={() => item.available && setSelectedTime(item.time)}
            disabled={!item.available}
        >
            <Text style={[
                styles.timeSlotText,
                selectedTime === item.time && styles.selectedTimeSlotText,
                !item.available && styles.unavailableTimeSlotText
            ]}>
                {item.time}
            </Text>
        </TouchableOpacity>
    );

    const renderLocationItem = ({ item }: { item: string }) => (
        <TouchableOpacity
            style={[
                styles.locationItem,
                selectedLocation === item && styles.selectedItem
            ]}
            onPress={() => setSelectedLocation(item)}
        >
            <Text style={styles.locationText}>{item}</Text>
            {selectedLocation === item && (
                <Ionicons name="checkmark-circle" size={24} color="#3B82F6" />
            )}
        </TouchableOpacity>
    );

    // Confirmation screen gốc - GIỮ NGUYÊN + thêm navigation
    if (showConfirmation) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.confirmationContainer}>
                    <View style={styles.confirmationCard}>
                        <View style={styles.successIcon}>
                            <Ionicons name="checkmark-circle" size={80} color="#10B981" />
                        </View>
                        <Text style={styles.confirmationTitle}>Đặt lịch thành công!</Text>
                        <Text style={styles.confirmationMessage}>
                            Chúng tôi đã nhận được yêu cầu đặt lịch của bạn. Nhân viên sẽ liên hệ xác nhận trong vòng 30 phút.
                        </Text>
                        <View style={styles.bookingInfo}>
                            <Text style={styles.bookingInfoTitle}>Thông tin đặt lịch:</Text>
                            <Text style={styles.bookingInfoItem}>• Thú cưng: {selectedPet?.name} ({selectedPet?.type})</Text>
                            <Text style={styles.bookingInfoItem}>• Dịch vụ: {selectedService?.name}</Text>
                            <Text style={styles.bookingInfoItem}>• Ngày: {selectedDate}</Text>
                            <Text style={styles.bookingInfoItem}>• Giờ: {selectedTime}</Text>
                            <Text style={styles.bookingInfoItem}>• Địa điểm: {selectedLocation}</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.newBookingButton}
                            onPress={resetForm}
                        >
                            <Text style={styles.newBookingButtonText}>Đặt lịch mới</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    // Main UI gốc - GIỮ NGUYÊN + cập nhật message khi không có pet
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color="#374151" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Đặt lịch chăm sóc thú cưng</Text>
            </View>

            <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                <View style={styles.content}>
                    {/* Progress Steps - GIỮ NGUYÊN */}
                    <View style={styles.progressContainer}>
                        <View style={styles.progressStep}>
                            <View style={[styles.progressCircle, styles.activeProgress]}>
                                <Text style={styles.progressText}>1</Text>
                            </View>
                            <Text style={styles.progressLabel}>Chọn thú cưng</Text>
                        </View>
                        <View style={styles.progressLine} />
                        <View style={styles.progressStep}>
                            <View style={[styles.progressCircle, selectedPet && styles.activeProgress]}>
                                <Text style={styles.progressText}>2</Text>
                            </View>
                            <Text style={styles.progressLabel}>Chọn dịch vụ</Text>
                        </View>
                        <View style={styles.progressLine} />
                        <View style={styles.progressStep}>
                            <View style={[styles.progressCircle, selectedService && styles.activeProgress]}>
                                <Text style={styles.progressText}>3</Text>
                            </View>
                            <Text style={styles.progressLabel}>Chọn thời gian</Text>
                        </View>
                    </View>

                    {/* Pet Selection - CẬP NHẬT MESSAGE */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="heart" size={24} color="#EC4899" />
                            <Text style={styles.sectionTitle}>Chọn thú cưng đã mua</Text>
                        </View>
                        {petsLoading ? (
                            <View style={{ padding: 20, alignItems: 'center' }}>
                                <ActivityIndicator size="small" color="#3B82F6" />
                                <Text style={{ marginTop: 10, color: '#6B7280' }}>Đang tải thú cưng đã mua...</Text>
                            </View>
                        ) : pets.length === 0 ? (
                            <View style={{ padding: 20, alignItems: 'center' }}>
                                <Ionicons name="sad-outline" size={48} color="#9CA3AF" />
                                <Text style={{ marginTop: 10, color: '#6B7280', textAlign: 'center' }}>
                                    Bạn chưa mua thú cưng nào.{'\n'}
                                    Vui lòng mua thú cưng trước khi đặt lịch chăm sóc.
                                </Text>
                                <TouchableOpacity
                                    style={[styles.bookingButton, { marginTop: 15, backgroundColor: '#10B981' }]}
                                    onPress={() => navigation.navigate('PetAll')}
                                >
                                    <Text style={styles.bookingButtonText}>Mua thú cưng ngay</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <FlatList
                                data={pets}
                                renderItem={renderPetItem}
                                keyExtractor={(item) => item.id}
                                scrollEnabled={false}
                            />
                        )}
                    </View>

                    {/* Service Selection - GIỮ NGUYÊN */}
                    {selectedPet && (
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="card" size={24} color="#10B981" />
                                <Text style={styles.sectionTitle}>Chọn dịch vụ</Text>
                            </View>
                            {servicesLoading ? (
                                <View style={{ padding: 20, alignItems: 'center' }}>
                                    <ActivityIndicator size="small" color="#3B82F6" />
                                </View>
                            ) : (
                                <FlatList
                                    data={services}
                                    renderItem={renderServiceItem}
                                    keyExtractor={(item) => item.id}
                                    scrollEnabled={false}
                                />
                            )}
                        </View>
                    )}

                    {/* Date & Time Selection - GIỮ NGUYÊN */}
                    {selectedService && (
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="calendar" size={24} color="#8B5CF6" />
                                <Text style={styles.sectionTitle}>Chọn ngày & giờ</Text>
                            </View>
                            <Text style={styles.inputLabel}>Chọn ngày</Text>
                            <TextInput
                                style={styles.dateInput}
                                value={selectedDate}
                                onChangeText={setSelectedDate}
                                placeholder="DD/MM/YYYY"
                                placeholderTextColor="#9CA3AF"
                            />
                            <Text style={styles.inputLabel}>Chọn giờ</Text>
                            {appointmentLoading && selectedDate ? (
                                <View style={{ padding: 20, alignItems: 'center' }}>
                                    <ActivityIndicator size="small" color="#3B82F6" />
                                </View>
                            ) : (
                                <FlatList
                                    data={timeSlots}
                                    renderItem={renderTimeSlot}
                                    keyExtractor={(item) => item.time}
                                    numColumns={4}
                                    scrollEnabled={false}
                                    columnWrapperStyle={styles.timeSlotRow}
                                />
                            )}
                        </View>
                    )}

                    {/* Location Selection - GIỮ NGUYÊN */}
                    {selectedTime && (
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="location" size={24} color="#EF4444" />
                                <Text style={styles.sectionTitle}>Chọn địa điểm</Text>
                            </View>
                            <FlatList
                                data={locations}
                                renderItem={renderLocationItem}
                                keyExtractor={(item) => item}
                                scrollEnabled={false}
                            />
                        </View>
                    )}

                    {/* Customer Information - GIỮ NGUYÊN */}
                    {selectedLocation && (
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="person" size={24} color="#F59E0B" />
                                <Text style={styles.sectionTitle}>Thông tin khách hàng</Text>
                            </View>
                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>Họ và tên *</Text>
                                <TextInput
                                    style={styles.textInput}
                                    value={customerInfo.name}
                                    onChangeText={(text) => setCustomerInfo({ ...customerInfo, name: text })}
                                    placeholder="Nhập họ và tên"
                                    placeholderTextColor="#9CA3AF"
                                />
                            </View>
                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>Số điện thoại *</Text>
                                <TextInput
                                    style={styles.textInput}
                                    value={customerInfo.phone}
                                    onChangeText={(text) => setCustomerInfo({ ...customerInfo, phone: text })}
                                    placeholder="Nhập số điện thoại"
                                    placeholderTextColor="#9CA3AF"
                                    keyboardType="phone-pad"
                                />
                            </View>
                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>Email</Text>
                                <TextInput
                                    style={styles.textInput}
                                    value={customerInfo.email}
                                    onChangeText={(text) => setCustomerInfo({ ...customerInfo, email: text })}
                                    placeholder="Nhập email"
                                    placeholderTextColor="#9CA3AF"
                                    keyboardType="email-address"
                                />
                            </View>
                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>Ghi chú</Text>
                                <TextInput
                                    style={[styles.textInput, styles.notesInput]}
                                    value={customerInfo.notes}
                                    onChangeText={(text) => setCustomerInfo({ ...customerInfo, notes: text })}
                                    placeholder="Ghi chú thêm (tùy chọn)"
                                    placeholderTextColor="#9CA3AF"
                                    multiline
                                    numberOfLines={3}
                                />
                            </View>
                        </View>
                    )}

                    {/* Booking Summary - GIỮ NGUYÊN */}
                    {selectedLocation && customerInfo.name && customerInfo.phone && (
                        <View style={styles.summarySection}>
                            <Text style={styles.summaryTitle}>Tóm tắt đặt lịch</Text>
                            <View style={styles.summaryItem}>
                                <Text style={styles.summaryLabel}>Thú cưng:</Text>
                                <Text style={styles.summaryValue}>{selectedPet?.name} ({selectedPet?.type})</Text>
                            </View>
                            <View style={styles.summaryItem}>
                                <Text style={styles.summaryLabel}>Dịch vụ:</Text>
                                <Text style={styles.summaryValue}>{selectedService?.name}</Text>
                            </View>
                            <View style={styles.summaryItem}>
                                <Text style={styles.summaryLabel}>Ngày giờ:</Text>
                                <Text style={styles.summaryValue}>{selectedDate} - {selectedTime}</Text>
                            </View>
                            <View style={styles.summaryItem}>
                                <Text style={styles.summaryLabel}>Thời gian:</Text>
                                <Text style={styles.summaryValue}>{selectedService?.duration}</Text>
                            </View>
                            <View style={styles.summaryItem}>
                                <Text style={styles.summaryLabel}>Địa điểm:</Text>
                                <Text style={[styles.summaryValue, styles.locationValue]}>{selectedLocation}</Text>
                            </View>
                            <View style={styles.summaryDivider} />
                            <View style={styles.summaryItem}>
                                <Text style={styles.summaryTotalLabel}>Tổng tiền:</Text>
                                <Text style={styles.summaryTotalValue}>
                                    {formatPrice(selectedService?.price || 0)}
                                </Text>
                            </View>
                            <TouchableOpacity
                                style={[
                                    styles.bookingButton,
                                    appointmentLoading && { backgroundColor: '#9CA3AF' }
                                ]}
                                onPress={handleBooking}
                                disabled={appointmentLoading}
                            >
                                {appointmentLoading ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.bookingButtonText}>Xác nhận đặt lịch</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

// Styles gốc - GIỮ NGUYÊN 100%
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    backButton: {
        marginRight: 16,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#374151',
    },
    scrollContainer: {
        flex: 1,
    },
    content: {
        padding: 16,
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    progressStep: {
        alignItems: 'center',
    },
    progressCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#E5E7EB',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 4,
    },
    activeProgress: {
        backgroundColor: '#3B82F6',
    },
    progressText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    progressLabel: {
        fontSize: 12,
        color: '#6B7280',
    },
    progressLine: {
        width: 32,
        height: 1,
        backgroundColor: '#E5E7EB',
        marginHorizontal: 8,
    },
    section: {
        marginBottom: 24,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#374151',
        marginLeft: 8,
    },
    petItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#E5E7EB',
        marginBottom: 8,
    },
    selectedItem: {
        borderColor: '#3B82F6',
        backgroundColor: '#EFF6FF',
    },
    petImage: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginRight: 12,
    },
    petInfo: {
        flex: 1,
    },
    petName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#374151',
    },
    petDetails: {
        fontSize: 14,
        color: '#6B7280',
    },
    petAge: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    serviceItem: {
        padding: 12,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#E5E7EB',
        marginBottom: 8,
    },
    serviceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    serviceIconContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    serviceIcon: {
        fontSize: 24,
        marginRight: 12,
    },
    serviceName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#374151',
    },
    serviceDuration: {
        fontSize: 12,
        color: '#6B7280',
    },
    serviceDescription: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 8,
    },
    servicePrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#3B82F6',
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    dateInput: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#FFFFFF',
        marginBottom: 16,
    },
    timeSlotRow: {
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    timeSlot: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        marginHorizontal: 2,
    },
    selectedTimeSlot: {
        backgroundColor: '#3B82F6',
    },
    unavailableTimeSlot: {
        backgroundColor: '#F9FAFB',
    },
    timeSlotText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
    },
    selectedTimeSlotText: {
        color: '#FFFFFF',
    },
    unavailableTimeSlotText: {
        color: '#9CA3AF',
    },
    locationItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#E5E7EB',
        marginBottom: 8,
    },
    locationText: {
        fontSize: 14,
        color: '#374151',
        flex: 1,
    },
    inputContainer: {
        marginBottom: 16,
    },
    textInput: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#FFFFFF',
    },
    notesInput: {
        height: 80,
        textAlignVertical: 'top',
    },
    summarySection: {
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
    },
    summaryTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#374151',
        marginBottom: 16,
    },
    summaryItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    summaryLabel: {
        fontSize: 14,
        color: '#6B7280',
    },
    summaryValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        textAlign: 'right',
        flex: 1,
        marginLeft: 8,
    },
    locationValue: {
        fontSize: 12,
    },
    summaryDivider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginVertical: 8,
    },
    summaryTotalLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#374151',
    },
    summaryTotalValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#3B82F6',
    },
    bookingButton: {
        backgroundColor: '#3B82F6',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 16,
    },
    bookingButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    confirmationContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    confirmationCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 32,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8,
        width: '100%',
        maxWidth: 400,
    },
    successIcon: {
        marginBottom: 24,
    },
    confirmationTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#374151',
        marginBottom: 16,
        textAlign: 'center',
    },
    confirmationMessage: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 24,
    },
    bookingInfo: {
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        width: '100%',
    },
    bookingInfoTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#374151',
        marginBottom: 8,
    },
    bookingInfoItem: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 4,
    },
    newBookingButton: {
        backgroundColor: '#3B82F6',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        width: '100%',
    },
    newBookingButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
});

export default PetCareBookingScreen;