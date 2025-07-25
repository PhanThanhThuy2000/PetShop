// app/components/PetVariantSelector.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { Pet, PetVariant } from '../app/types/index';

interface PetVariantSelectorProps {
    visible: boolean;
    onClose: () => void;
    pet: Pet;
    onSelectVariant: (variant: PetVariant) => void;
    selectedVariant?: PetVariant | null;
}

interface SelectedFilters {
    color?: string;
    gender?: 'Male' | 'Female';
    age?: number;
    weight?: number;
}

const PetVariantSelector: React.FC<PetVariantSelectorProps> = ({
    visible,
    onClose,
    pet,
    onSelectVariant,
    selectedVariant
}) => {
    const [selectedFilters, setSelectedFilters] = useState<SelectedFilters>({});
    const [filteredVariants, setFilteredVariants] = useState<PetVariant[]>([]);
    const [currentVariant, setCurrentVariant] = useState<PetVariant | null>(selectedVariant || null);
    const [isLoading, setIsLoading] = useState(false);

    // Reset khi modal mở
    useEffect(() => {
        if (visible) {
            setSelectedFilters({});
            setCurrentVariant(selectedVariant || null);
            setFilteredVariants(pet.variants || []);
        }
    }, [visible, pet.variants, selectedVariant]);

    // Filter variants khi user chọn options
    useEffect(() => {
        if (!pet.variants) return;

        let filtered = pet.variants.filter(variant => variant.is_available && variant.stock_quantity > 0);

        if (selectedFilters.color) {
            filtered = filtered.filter(v => v.color === selectedFilters.color);
        }
        if (selectedFilters.gender) {
            filtered = filtered.filter(v => v.gender === selectedFilters.gender);
        }
        if (selectedFilters.age !== undefined) {
            filtered = filtered.filter(v => v.age === selectedFilters.age);
        }
        if (selectedFilters.weight !== undefined) {
            filtered = filtered.filter(v => v.weight === selectedFilters.weight);
        }

        setFilteredVariants(filtered);

        // Nếu variant đang chọn không còn khớp với filter, reset
        if (currentVariant && !filtered.find(v => v._id === currentVariant._id)) {
            setCurrentVariant(null);
        }
    }, [selectedFilters, pet.variants]);

    const handleFilterSelect = (filterType: keyof SelectedFilters, value: any) => {
        setSelectedFilters(prev => ({
            ...prev,
            [filterType]: prev[filterType] === value ? undefined : value
        }));
    };

    const handleVariantSelect = (variant: PetVariant) => {
        setCurrentVariant(variant);
    };

    const handleConfirm = () => {
        if (!currentVariant) {
            Alert.alert('Chọn thú cưng', 'Vui lòng chọn một thú cưng trước khi tiếp tục');
            return;
        }

        onSelectVariant(currentVariant);
        onClose();
    };

    const renderFilterSection = (
        title: string,
        options: any[],
        selectedValue: any,
        onSelect: (value: any) => void,
        keyExtractor: (item: any) => string = (item) => item.toString(),
        labelExtractor: (item: any) => string = (item) => item.toString()
    ) => (
        <View style={styles.filterSection}>
            <Text style={styles.filterTitle}>{title}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterOptions}>
                {options.map((option) => {
                    const key = keyExtractor(option);
                    const label = labelExtractor(option);
                    const isSelected = selectedValue === option;

                    return (
                        <TouchableOpacity
                            key={key}
                            style={[styles.filterOption, isSelected && styles.filterOptionSelected]}
                            onPress={() => onSelect(option)}
                        >
                            <Text style={[styles.filterOptionText, isSelected && styles.filterOptionTextSelected]}>
                                {label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );

    const renderVariantCard = (variant: PetVariant) => {
        const isSelected = currentVariant?._id === variant._id;
        const finalPrice = variant.final_price || (pet.price + variant.price_adjustment);

        return (
            <TouchableOpacity
                key={variant._id}
                style={[styles.variantCard, isSelected && styles.variantCardSelected]}
                onPress={() => handleVariantSelect(variant)}
            >
                <View style={styles.variantInfo}>
                    <Text style={styles.variantName}>{variant.display_name}</Text>
                    <Text style={styles.variantDetails}>
                        Màu: {variant.color} • Cân nặng: {variant.weight}kg
                    </Text>
                    <Text style={styles.variantDetails}>
                        Giới tính: {variant.gender} • Tuổi: {variant.age} năm
                    </Text>
                    <Text style={styles.variantPrice}>{finalPrice.toLocaleString('vi-VN')}₫</Text>
                    {variant.stock_quantity <= 5 && (
                        <Text style={styles.stockWarning}>Chỉ còn {variant.stock_quantity} con</Text>
                    )}
                </View>
                {isSelected && (
                    <View style={styles.selectedIcon}>
                        <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    if (!pet.variants || pet.variants.length === 0) {
        return (
            <Modal visible={visible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.header}>
                            <Text style={styles.title}>Không có thú cưng</Text>
                            <TouchableOpacity onPress={onClose}>
                                <Ionicons name="close" size={24} color="#6B7280" />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.noVariantsText}>
                            Sản phẩm này hiện không có thú cưng nào khả dụng
                        </Text>
                        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                            <Text style={styles.closeButtonText}>Đóng</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        );
    }

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Chọn thú cưng</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color="#6B7280" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                     
                        {/* Variants List */}
                        <View style={styles.variantsContainer}>
                            <Text style={styles.sectionTitle}>
                                Vui lòng chọn thú cưng ({filteredVariants.length})
                            </Text>
                            {filteredVariants.length > 0 ? (
                                filteredVariants.map(renderVariantCard)
                            ) : (
                                <Text style={styles.noResultsText}>
                                    Không có thú cưng
                                </Text>
                            )}
                        </View>
                    </ScrollView>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={[styles.button, styles.cancelButton]}
                            onPress={onClose}
                        >
                            <Text style={styles.cancelButtonText}>Hủy</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.button, styles.confirmButton, !currentVariant && styles.buttonDisabled]}
                            onPress={handleConfirm}
                            disabled={!currentVariant || isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <Text style={styles.confirmButtonText}>
                                    Xác nhận {currentVariant ? `- ${currentVariant.final_price?.toLocaleString('vi-VN')}₫` : ''}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
    </Modal >
  );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '70%',
        minHeight: '70%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    petInfo: {
        marginBottom: 20,
        padding: 15,
        backgroundColor: '#F9FAFB',
        borderRadius: 10,
    },
    petName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 5,
    },
    petPrice: {
        fontSize: 14,
        color: '#6B7280',
    },
    filtersContainer: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 15,
    },
    filterSection: {
        marginBottom: 15,
    },
    filterTitle: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
        marginBottom: 10,
    },
    filterOptions: {
        paddingVertical: 5,
    },
    filterOption: {
        paddingHorizontal: 15,
        paddingVertical: 8,
        marginRight: 10,
        backgroundColor: '#F3F4F6',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#D1D5DB',
    },
    filterOptionSelected: {
        backgroundColor: '#3B82F6',
        borderColor: '#3B82F6',
    },
    filterOptionText: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '500',
    },
    filterOptionTextSelected: {
        color: '#FFFFFF',
    },
    variantsContainer: {
        marginBottom: 20,
    },
    variantCard: {
        flexDirection: 'row',
        padding: 15,
        marginBottom: 10,
        backgroundColor: '#F9FAFB',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    variantCardSelected: {
        backgroundColor: '#EBF4FF',
        borderColor: '#3B82F6',
    },
    variantInfo: {
        flex: 1,
    },
    variantName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 5,
    },
    variantDetails: {
        fontSize: 13,
        color: '#6B7280',
        marginBottom: 3,
    },
    variantPrice: {
        fontSize: 16,
        fontWeight: '700',
        color: '#DC2626',
        marginTop: 5,
    },
    stockWarning: {
        fontSize: 12,
        color: '#F59E0B',
        marginTop: 3,
        fontStyle: 'italic',
    },
    selectedIcon: {
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
    },
    noResultsText: {
        textAlign: 'center',
        color: '#6B7280',
        fontSize: 14,
        padding: 20,
        fontStyle: 'italic',
    },
    noVariantsText: {
        textAlign: 'center',
        color: '#6B7280',
        fontSize: 14,
        padding: 20,
        lineHeight: 20,
    },
    footer: {
        flexDirection: 'row',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        gap: 10,
    },
    button: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 44,
    },
    cancelButton: {
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: '#D1D5DB',
    },
    cancelButtonText: {
        color: '#6B7280',
        fontSize: 14,
        fontWeight: '500',
    },
    confirmButton: {
        backgroundColor: '#10B981',
    },
    confirmButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    buttonDisabled: {
        backgroundColor: '#D1D5DB',
    },
    closeButton: {
        backgroundColor: '#3B82F6',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
    },
    closeButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
});

export default PetVariantSelector;