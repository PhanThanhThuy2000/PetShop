// PetCareBookingScreen.tsx - CẬP NHẬT XỬ LÝ DỮ LIỆU
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '../../hooks/redux';
import { createAppointment, getAvailableSlots } from '../redux/slices/appointmentSlice';
import { getAllServices } from '../redux/slices/careServiceSlice';
import { AppDispatch, RootState } from '../redux/store';
import { ordersService } from '../services/OrderApiService';
import { CustomerInfo, Service, TimeSlot } from '../types/PetCareBooking';

// Interfaces gốc
interface Pet {
    id: string;
    name: string;
    type: string;
    breed: string;
    age: string;
    image: string;
}

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
    // 🆕 XỬ LÝ CẤU TRÚC MỚI
    item_info?: any;
    item_type?: 'pet' | 'product' | 'variant';
    images?: Array<{ url: string; is_primary?: boolean }>;
    quantity: number;
    unit_price: number;
    order_id: any;
}

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
    // 🆕 XỬ LÝ CẤU TRÚC MỚI
    variant_id?: {
        _id: string;
        pet_id: {
            _id: string;
            name: string;
            type?: string;
            breed_id?: string | { name: string };
            age?: number;
            price?: number;
        };
        color: string;
        weight: number;
        gender: string;
        age: number;
        price_adjustment: number;
    };
    item_info?: any;
    item_type?: 'pet' | 'product' | 'variant';
    images?: Array<{ url: string; is_primary?: boolean }>;
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

    // State gốc
    const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [selectedTime, setSelectedTime] = useState<string>('');
    const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
        name: user?.username || '',
        phone: user?.phone || '',
        email: user?.email || '',
        notes: ''
    });
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [showCalendar, setShowCalendar] = useState(false);

    // Backend data state
    const [purchasedPets, setPurchasedPets] = useState<PurchasedPetOrderItem[]>([]);
    const [petsLoading, setPetsLoading] = useState(false);

    // 🔧 CẬP NHẬT HELPER FUNCTION ĐỂ XỬ LÝ CẢ 2 FORMAT + VARIANT
    const extractPetFromOrderItem = (orderItem: ApiOrderItem) => {
        console.log('🔍 Extracting pet from order item:', JSON.stringify(orderItem, null, 2));

        let petData = null;
        let petId = null;

        // 🆕 XỬ LÝ CẤU TRÚC MỚI - item_type với các loại khác nhau
        if (orderItem.item_type) {
            console.log('✅ New format detected with item_type:', orderItem.item_type);

            if (orderItem.item_type === 'pet') {
                // Direct pet item - data trong item_info
                if (orderItem.item_info) {
                    petData = orderItem.item_info;
                    petId = orderItem.item_info._id;
                    console.log('🐕 Direct pet item found:', petId);
                } else {
                    console.log('❌ Pet item but no item_info');
                }
            } else if (orderItem.item_type === 'variant') {
                // 🔧 XỬ LÝ VARIANT - có thể có data ở nhiều nơi
                console.log('🧬 Processing variant item...');

                // Cách 1: Data trong variant_id.pet_id (như log hiện tại)
                if (orderItem.variant_id && orderItem.variant_id.pet_id) {
                    petData = orderItem.variant_id.pet_id;
                    petId = orderItem.variant_id.pet_id._id;
                    console.log('🧬 Variant pet found in variant_id.pet_id:', petId);
                }
                // Cách 2: Data trong item_info.variant (backup)
                else if (orderItem.item_info && orderItem.item_info.variant && orderItem.item_info.pet_id) {
                    petData = orderItem.item_info.pet_id;
                    petId = orderItem.item_info.pet_id._id;
                    console.log('🧬 Variant pet found in item_info.pet_id:', petId);
                }
                // Cách 3: Data trong item_info chính (backup)
                else if (orderItem.item_info && orderItem.item_info._id) {
                    petData = orderItem.item_info;
                    petId = orderItem.item_info._id;
                    console.log('🧬 Variant pet found in item_info:', petId);
                } else {
                    console.log('❌ Variant item but no pet data found');
                }
            } else if (orderItem.item_type === 'product') {
                console.log('📦 Product item - skipping (not a pet)');
                return null;
            } else {
                console.log('❌ Unknown item type:', orderItem.item_type);
            }
        }
        // 🔧 FALLBACK: XỬ LÝ CẤU TRÚC CŨ
        else if (orderItem.pet_id) {
            console.log('🔄 Legacy format detected - using pet_id');
            petData = orderItem.pet_id;
            petId = orderItem.pet_id._id;
        } else if (orderItem.variant_id && orderItem.variant_id.pet_id) {
            console.log('🔄 Legacy variant format detected - using variant_id.pet_id');
            petData = orderItem.variant_id.pet_id;
            petId = orderItem.variant_id.pet_id._id;
        } else {
            console.log('❌ No pet data found in any format');
        }

        if (!petData || !petId) {
            console.log('❌ Failed to extract pet data');
            return null;
        }

        console.log('✅ Pet data extracted:', {
            id: petId,
            name: petData.name,
            type: petData.type
        });

        return {
            _id: orderItem._id,
            pet_id: petData,
            quantity: orderItem.quantity,
            unit_price: orderItem.unit_price,
            order_id: orderItem.order_id,
            // Preserve additional data
            item_info: orderItem.item_info,
            item_type: orderItem.item_type,
            variant_id: orderItem.variant_id, // 🔧 Preserve full variant object
            images: orderItem.images
        };
    };

    // Convert purchased pets sang format gốc
    const pets: Pet[] = purchasedPets.map(orderItem => {
        const pet = orderItem.pet_id;
        console.log('🔄 Converting pet:', JSON.stringify(pet, null, 2));

        if (!pet) {
            console.log('❌ Pet is null/undefined');
            return null;
        }

        // 🔧 XỬ LÝ HÌNH ẢNH - ưu tiên từ orderItem.images, fallback về pet.images
        let petImage = 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=100&h=100&fit=crop&crop=face';

        if (orderItem.images && orderItem.images.length > 0) {
            const primaryImg = orderItem.images.find(img => img.is_primary) || orderItem.images[0];
            if (primaryImg && primaryImg.url) {
                petImage = primaryImg.url;
                console.log('🖼️ Using image from orderItem.images:', petImage);
            }
        } else if (pet.images && pet.images.length > 0) {
            petImage = pet.images[0].url;
            console.log('🖼️ Using image from pet.images:', petImage);
        }

        // 🆕 XỬ LÝ THÔNG TIN VARIANT - Thêm chi tiết từ variant
        let petName = pet.name || 'Thú cưng';
        let petType = pet.type || 'Chưa rõ loại';
        let petBreed = 'Chưa rõ giống';
        let petAge = 'Chưa rõ tuổi';
        let variantInfo = '';

        // 🔧 CẬP NHẬT LOGIC LẤY BREED - ưu tiên từ nhiều nguồn
        console.log('🔍 Processing breed info:', {
            breed_id: pet.breed_id,
            breed_id_type: typeof pet.breed_id,
            breed_id_name: pet.breed_id?.name
        });

        if (pet.breed_id) {
            if (typeof pet.breed_id === 'object' && pet.breed_id.name) {
                petBreed = pet.breed_id.name;
                console.log('✅ Got breed from breed_id.name:', petBreed);
            } else if (typeof pet.breed_id === 'string' && pet.breed_id.trim()) {
                petBreed = pet.breed_id;
                console.log('✅ Got breed from breed_id string:', petBreed);
            } else {
                console.log('❌ breed_id exists but invalid format');
            }
        }

        // 🔧 FALLBACK: Thử lấy từ variant pet nếu có
        if (petBreed === 'Chưa rõ giống' && orderItem.variant_id?.pet_id?.breed_id) {
            const variantPetBreed = orderItem.variant_id.pet_id.breed_id;
            if (typeof variantPetBreed === 'object' && variantPetBreed.name) {
                petBreed = variantPetBreed.name;
                console.log('✅ Got breed from variant pet breed_id.name:', petBreed);
            } else if (typeof variantPetBreed === 'string' && variantPetBreed.trim()) {
                petBreed = variantPetBreed;
                console.log('✅ Got breed from variant pet breed_id string:', petBreed);
            }
        }

        // 🔧 FALLBACK: Thử lấy từ item_info nếu có
        if (petBreed === 'Chưa rõ giống' && orderItem.item_info?.breed_id) {
            const itemBreed = orderItem.item_info.breed_id;
            if (typeof itemBreed === 'object' && itemBreed.name) {
                petBreed = itemBreed.name;
                console.log('✅ Got breed from item_info breed_id.name:', petBreed);
            } else if (typeof itemBreed === 'string' && itemBreed.trim()) {
                petBreed = itemBreed;
                console.log('✅ Got breed from item_info breed_id string:', petBreed);
            }
        }

        console.log('🏷️ Final breed:', petBreed);

        // Lấy age info từ pet gốc
        if (pet.age) {
            petAge = `${pet.age} tuổi`;
        }

        // 🔧 THÊM THÔNG TIN VARIANT NẾU CÓ
        if (orderItem.variant_id) {
            const variant = orderItem.variant_id;
            console.log('🧬 Processing variant info:', variant);

            if (variant.color || variant.weight || variant.gender || variant.age) {
                const variantParts = [];

                if (variant.color) variantParts.push(`Màu: ${variant.color}`);
                if (variant.weight) variantParts.push(`${variant.weight}kg`);
                if (variant.gender) variantParts.push(variant.gender === 'Male' ? 'Đực' : 'Cái');
                if (variant.age) {
                    variantParts.push(`${variant.age} tuổi`);
                    petAge = `${variant.age} tuổi`; // Override pet age với variant age
                }

                variantInfo = variantParts.join(' • ');
                console.log('🧬 Variant info constructed:', variantInfo);
            }
        } else if (orderItem.item_type === 'variant' && orderItem.item_info?.variant) {
            // Fallback: Lấy từ item_info.variant
            const variant = orderItem.item_info.variant;
            console.log('🧬 Processing variant from item_info:', variant);

            if (variant.color || variant.weight || variant.gender || variant.age) {
                const variantParts = [];

                if (variant.color) variantParts.push(`Màu: ${variant.color}`);
                if (variant.weight) variantParts.push(`${variant.weight}kg`);
                if (variant.gender) variantParts.push(variant.gender === 'Male' ? 'Đực' : 'Cái');
                if (variant.age) {
                    variantParts.push(`${variant.age} tuổi`);
                    petAge = `${variant.age} tuổi`;
                }

                variantInfo = variantParts.join(' • ');
                console.log('🧬 Variant info from item_info:', variantInfo);
            }
        }

        const convertedPet = {
            id: pet._id,
            name: petName,
            type: petType,
            breed: variantInfo ? `${petBreed} (${variantInfo})` : petBreed, // 🆕 Thêm variant info vào breed
            age: petAge,
            image: petImage
        };

        console.log('✅ Converted pet with variant info:', convertedPet);
        return convertedPet;
    }).filter((pet): pet is Pet => pet !== null);

    console.log('🎯 Final converted pets:', pets.length, pets);

    // Convert backend services sang format gốc
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

    // Convert availableSlots thành timeSlots format gốc với safe check
    console.log('🕐 Available slots from Redux:', availableSlots, 'Type:', typeof availableSlots, 'Is Array:', Array.isArray(availableSlots));

    const timeSlots: TimeSlot[] = [
        { time: '08:00', available: Array.isArray(availableSlots) ? availableSlots.includes('08:00') : true },
        { time: '09:00', available: Array.isArray(availableSlots) ? availableSlots.includes('09:00') : true },
        { time: '10:00', available: Array.isArray(availableSlots) ? availableSlots.includes('10:00') : true },
        { time: '11:00', available: Array.isArray(availableSlots) ? availableSlots.includes('11:00') : true },
        { time: '14:00', available: Array.isArray(availableSlots) ? availableSlots.includes('14:00') : true },
        { time: '15:00', available: Array.isArray(availableSlots) ? availableSlots.includes('15:00') : true },
        { time: '16:00', available: Array.isArray(availableSlots) ? availableSlots.includes('16:00') : true },
        { time: '17:00', available: Array.isArray(availableSlots) ? availableSlots.includes('17:00') : true }
    ];

    // Load backend data
    useEffect(() => {
        if (!token) {
            Alert.alert('Cảnh báo', 'Vui lòng đăng nhập để đặt lịch hẹn', [
                { text: 'OK', onPress: () => navigation.navigate('Login') }
            ]);
            return;
        }

        loadBackendData();
    }, [token]);

    // Load available slots khi chọn ngày
    useEffect(() => {
        if (selectedDate && selectedDate.length > 0) {
            const dateParts = selectedDate.split('/');
            if (
                dateParts.length === 3 &&
                dateParts[0].length === 2 &&
                dateParts[1].length === 2 &&
                dateParts[2].length === 4
            ) {
                const apiDate = `${dateParts[2]}-${dateParts[1].padStart(2, '0')}-${dateParts[0].padStart(2, '0')}`;
                if (!isNaN(Date.parse(apiDate))) {
                    dispatch(getAvailableSlots(apiDate));
                } else {
                    console.warn('❌ Invalid date format:', apiDate);
                    Alert.alert('Lỗi', 'Ngày không hợp lệ. Vui lòng nhập đúng định dạng DD/MM/YYYY.');
                }
            } else {
                console.warn('❌ Invalid date input:', selectedDate);
            }
        }
    }, [selectedDate]);

    const loadBackendData = async () => {
        try {
            await dispatch(getAllServices({ active: true }));
            await loadPurchasedPets();
        } catch (error) {
            console.error('Error loading backend data:', error);
        }
    };

    // 🔧 CẬP NHẬT HÀM LOAD PETS ĐỂ XỬ LÝ CẢ 2 FORMAT
    const loadPurchasedPets = async () => {
        try {
            setPetsLoading(true);
            console.log('🔍 Loading purchased pets...');

            const response = await ordersService.getMyOrderItems({
                limit: 100
            });

            console.log('📦 Raw API response:', response);
            console.log('📦 Response data:', response.data);
            console.log('📦 Response data type:', Array.isArray(response.data) ? 'array' : typeof response.data);

            if (response.data && Array.isArray(response.data)) {
                console.log('✅ API call successful, processing data...');
                console.log('📊 Total order items:', response.data.length);

                // 🔧 DEBUG: Log first few items để hiểu cấu trúc
                response.data.slice(0, 3).forEach((item, index) => {
                    console.log(`📋 Order item ${index}:`, JSON.stringify(item, null, 2));
                });

                // 🆕 CẬP NHẬT LOGIC FILTER - XỬ LÝ CẢ 2 FORMAT
                const petOrderItems = response.data.map((item: ApiOrderItem) => {
                    return extractPetFromOrderItem(item);
                }).filter((item): item is PurchasedPetOrderItem => item !== null);

                console.log('🐾 Extracted pet order items:', petOrderItems.length);

                // 🔧 DEBUG: Log extracted items structure
                petOrderItems.forEach((item, index) => {
                    console.log(`🔍 Extracted item ${index}:`, {
                        id: item._id,
                        pet_name: item.pet_id?.name,
                        has_variant_id: !!item.variant_id,
                        variant_id_structure: item.variant_id ? Object.keys(item.variant_id) : 'none',
                        item_type: item.item_type
                    });
                });

                // Remove duplicates dựa trên pet ID
                const uniquePets: PurchasedPetOrderItem[] = [];
                const seenPetIds = new Set<string>();

                petOrderItems.forEach((item) => {
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

            // 🔧 FALLBACK DATA cho testing
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
                    order_id: { _id: 'order1' }
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
                    order_id: { _id: 'order2' }
                }
            ]);
        } finally {
            setPetsLoading(false);
        }
    };

    // Hàm xử lý chọn ngày từ calendar
    const handleDateSelect = (day: { dateString: string }) => {
        const date = new Date(day.dateString);
        const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
        setSelectedDate(formattedDate);
        setShowCalendar(false);
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    const handleBooking = async () => {
        if (selectedPet && selectedService && selectedDate && selectedTime && customerInfo.name && customerInfo.phone) {
            try {
                const dateParts = selectedDate.split('/');
                const apiDate = `${dateParts[2]}-${dateParts[1].padStart(2, '0')}-${dateParts[0].padStart(2, '0')}`;

                const selectedPetOrderItem = purchasedPets.find(item => item.pet_id?._id === selectedPet?.id);
                const backendService = backendServices.find(s => s._id === selectedService.id);

                if (!selectedPetOrderItem || !selectedPetOrderItem.pet_id || !backendService) {
                    Alert.alert('Lỗi', 'Không tìm thấy thông tin cần thiết để đặt lịch');
                    return;
                }

                if (!selectedPetOrderItem.order_id || !selectedPetOrderItem.order_id._id) {
                    Alert.alert('Lỗi', 'Thú cưng này không thuộc đơn hàng hợp lệ. Vui lòng chọn lại.');
                    return;
                }

                console.log('🔍 Selected pet order item structure:', JSON.stringify(selectedPetOrderItem, null, 2));

                // 🔧 XỬ LÝ APPOINTMENT DATA - Support variant
                const appointmentData = {
                    pet_id: selectedPetOrderItem.pet_id._id, // Pet ID thực sự
                    service_id: backendService._id,
                    appointment_date: apiDate,
                    appointment_time: selectedTime,
                    notes: customerInfo.notes.trim() || undefined,
                    order_id: selectedPetOrderItem.order_id._id,
                    total_amount: backendService.price
                };

                // 🆕 THÊM THÔNG TIN VARIANT NẾU CÓ
                console.log('🔍 Checking for variant info in selectedPetOrderItem:');
                console.log('- variant_id exists:', !!selectedPetOrderItem.variant_id);
                console.log('- variant_id value:', selectedPetOrderItem.variant_id);
                console.log('- item_type exists:', !!selectedPetOrderItem.item_type);
                console.log('- item_type value:', selectedPetOrderItem.item_type);

                if (selectedPetOrderItem.variant_id && selectedPetOrderItem.variant_id._id) {
                    appointmentData.variant_id = selectedPetOrderItem.variant_id._id;
                    appointmentData.item_type = 'variant';
                    console.log('🧬 Adding variant info to appointment:', {
                        variant_id: appointmentData.variant_id,
                        item_type: appointmentData.item_type
                    });
                } else if (selectedPetOrderItem.item_type === 'variant') {
                    // Fallback: Nếu có item_type nhưng không có variant_id object
                    appointmentData.item_type = 'variant';
                    console.log('🧬 Variant item type detected but no variant_id object');

                    // 🔧 TRY TO FIND VARIANT ID FROM OTHER FIELDS
                    if (selectedPetOrderItem._id) {
                        // Có thể order item ID chính là variant
                        console.log('🔍 Trying to use order item ID as reference:', selectedPetOrderItem._id);
                    }
                } else {
                    appointmentData.item_type = 'pet';
                    console.log('🐕 Direct pet item');
                }

                console.log('📦 Final appointment data:', JSON.stringify(appointmentData, null, 2));

                await dispatch(createAppointment(appointmentData)).unwrap();
                setShowConfirmation(true);
            } catch (error: any) {
                console.error('❌ Appointment creation error:', error);
                Alert.alert('Lỗi', error.message || 'Không thể đặt lịch hẹn. Vui lòng thử lại.');
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
        setCustomerInfo({
            name: user?.username || '',
            phone: user?.phone || '',
            email: user?.email || '',
            notes: ''
        });
        setShowConfirmation(false);
    };

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

                    {selectedService && (
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Ionicons name="calendar" size={24} color="#8B5CF6" />
                                <Text style={styles.sectionTitle}>Chọn ngày & giờ</Text>
                            </View>
                            <Text style={styles.inputLabel}>Chọn ngày</Text>
                            <TouchableOpacity
                                style={styles.dateInput}
                                onPress={() => setShowCalendar(true)}
                            >
                                <Text style={styles.dateInputText}>
                                    {selectedDate || 'DD/MM/YYYY'}
                                </Text>
                            </TouchableOpacity>
                            <Modal
                                visible={showCalendar}
                                animationType="slide"
                                transparent={true}
                                onRequestClose={() => setShowCalendar(false)}
                            >
                                <View style={styles.modalContainer}>
                                    <View style={styles.calendarContainer}>
                                        <Calendar
                                            onDayPress={handleDateSelect}
                                            minDate={new Date().toISOString().split('T')[0]}
                                            theme={{
                                                selectedDayBackgroundColor: '#3B82F6',
                                                todayTextColor: '#3B82F6',
                                                arrowColor: '#3B82F6',
                                            }}
                                        />
                                        <TouchableOpacity
                                            style={styles.closeButton}
                                            onPress={() => setShowCalendar(false)}
                                        >
                                            <Text style={styles.closeButtonText}>Đóng</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </Modal>
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

                    {selectedTime && (
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

                    {selectedTime && customerInfo.name && customerInfo.phone && (
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
        marginTop: 20

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
    dateInputText: {
        fontSize: 16,
        color: '#374151',
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
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    calendarContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        width: '90%',
        maxWidth: 400,
    },
    closeButton: {
        backgroundColor: '#3B82F6',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 16,
    },
    closeButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
});

export default PetCareBookingScreen;