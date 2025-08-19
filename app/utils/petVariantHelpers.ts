// utils/petVariantHelpers.ts
import { Pet, PetVariant } from '../types';

/**
 * Shared utility functions for handling PetVariant pricing
 * Sử dụng pattern này để tránh duplicate code và đảm bảo consistency
 */
export const PetVariantHelpers = {
    /**
     * Lấy giá cuối cùng từ variant - KHÔNG CẦN basePetPrice
     */
    getFinalPrice: (variant: PetVariant): number => {
        // 1. Ưu tiên selling_price nếu có
        if (variant.selling_price && variant.selling_price > 0) {
            return variant.selling_price;
        }

        // 2. Fallback: final_price đã tính sẵn
        if (variant.final_price && variant.final_price > 0) {
            return variant.final_price;
        }

        // 3. Fallback: import_price nếu không có gì khác
        if (variant.import_price && variant.import_price > 0) {
            return variant.import_price;
        }

        // 4. Final fallback: price_adjustment (legacy)
        return Math.abs(variant.price_adjustment || 0);
    },

    /**
     * Lấy display name của variant
     */
    getDisplayName: (variant: PetVariant): string => {
        if (variant.variant_name) return variant.variant_name;
        if (variant.display_name) return variant.display_name;

        // Tạo display name từ thuộc tính
        return `${variant.color} - ${variant.weight}kg - ${variant.gender} - ${variant.age} years`;
    },

    /**
     * Kiểm tra variant có available không
     */
    isVariantAvailable: (variant: PetVariant): boolean => {
        return variant.is_available && (variant.stock_quantity || 0) > 0;
    },

    /**
     * Lấy giá nhập để tính profit margin
     */
    getImportPrice: (variant: PetVariant): number => {
        return variant.import_price || 0;
    },

    /**
     * Tính profit margin
     */
    getProfitMargin: (variant: PetVariant): number => {
        const finalPrice = PetVariantHelpers.getFinalPrice(variant);
        const importPrice = PetVariantHelpers.getImportPrice(variant);

        if (importPrice <= 0) return 0;

        return ((finalPrice - importPrice) / importPrice) * 100;
    },

    /**
     * Lấy giá từ Pet - CHỈ TỪ VARIANTS
     */
    getPetPrice: (pet: Pet): number => {
        if (pet.variants && pet.variants.length > 0) {
            // Lấy giá thấp nhất từ variants available
            const availableVariants = pet.variants.filter(v => PetVariantHelpers.isVariantAvailable(v));
            if (availableVariants.length > 0) {
                return Math.min(...availableVariants.map(v => PetVariantHelpers.getFinalPrice(v)));
            }
            // Nếu không có variant available, lấy variant đầu tiên
            return PetVariantHelpers.getFinalPrice(pet.variants[0]);
        }
        // Không có variants = không có giá
        return 0;
    },

    /**
     * Lấy giá cao nhất từ variants
     */
    getPetMaxPrice: (pet: Pet): number => {
        if (pet.variants && pet.variants.length > 0) {
            const availableVariants = pet.variants.filter(v => PetVariantHelpers.isVariantAvailable(v));
            if (availableVariants.length > 0) {
                return Math.max(...availableVariants.map(v => PetVariantHelpers.getFinalPrice(v)));
            }
            return PetVariantHelpers.getFinalPrice(pet.variants[0]);
        }
        return 0;
    },

    /**
     * Kiểm tra pet có available variants không
     */
    hasAvailableVariants: (pet: Pet): boolean => {
        return pet.variants?.some(v => PetVariantHelpers.isVariantAvailable(v)) || false;
    },

    /**
     * Lấy variant mặc định (giá thấp nhất, có sẵn)
     */
    getDefaultVariant: (pet: Pet): PetVariant | null => {
        if (!pet.variants?.length) return null;

        const availableVariants = pet.variants.filter(v => PetVariantHelpers.isVariantAvailable(v));
        if (!availableVariants.length) return pet.variants[0]; // Fallback variant đầu tiên

        return availableVariants.reduce((min, variant) =>
            PetVariantHelpers.getFinalPrice(variant) < PetVariantHelpers.getFinalPrice(min) ? variant : min
        );
    },

    /**
     * Kiểm tra có nên hiển thị "Từ" trong giá không
     */
    shouldShowPricePrefix: (pet: Pet): boolean => {
        if (!pet.variants?.length) return false;

        const availableVariants = pet.variants.filter(v => PetVariantHelpers.isVariantAvailable(v));
        if (availableVariants.length <= 1) return false;

        const prices = availableVariants.map(v => PetVariantHelpers.getFinalPrice(v));
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);

        return minPrice !== maxPrice; // Hiển thị "Từ" nếu có nhiều mức giá
    },

    /**
     * Format giá hiển thị với "Từ" prefix nếu cần
     */
    formatPetPrice: (pet: Pet): { price: number; showFrom: boolean } => {
        const price = PetVariantHelpers.getPetPrice(pet);
        const showFrom = PetVariantHelpers.shouldShowPricePrefix(pet);

        return { price, showFrom };
    },

    /**
     * Lấy thông tin tóm tắt variants
     */
    getVariantSummary: (pet: Pet): { total: number; available: number; colors: string[] } => {
        if (!pet.variants?.length) {
            return { total: 0, available: 0, colors: [] };
        }

        const availableVariants = pet.variants.filter(v => PetVariantHelpers.isVariantAvailable(v));
        const colors = [...new Set(pet.variants.map(v => v.color))];

        return {
            total: pet.variants.length,
            available: availableVariants.length,
            colors: colors
        };
    }
};

// Export default cho convenience
export default PetVariantHelpers;

// Các constant hữu ích
export const VARIANT_CONSTANTS = {
    MIN_PRICE: 0,
    DEFAULT_STOCK: 1,
    MAX_VARIANTS_DISPLAY: 10,
} as const;

// Type guards
export const isPetWithVariants = (pet: Pet): pet is Pet & { variants: PetVariant[] } => {
    return pet.variants !== undefined && pet.variants.length > 0;
};

export const isVariantWithSellingPrice = (variant: PetVariant): variant is PetVariant & { selling_price: number } => {
    return variant.selling_price !== undefined && variant.selling_price > 0;
};