// app/utils/favouriteUtils.ts - Helper functions cho favourite
export const isDuplicateFavouriteError = (error: any): boolean => {
    if (!error) return false;

    const errorMessage = typeof error === 'string' ? error :
        error.response?.data?.message ||
        error.message || '';

    const duplicateKeywords = [
        'đã có trong',
        'Đã có trong',
        'already exists',
        'duplicate',
        'đã tồn tại',
        'yêu thích',
        'favourite',
        'favorite'
    ];

    return duplicateKeywords.some(keyword =>
        errorMessage.toLowerCase().includes(keyword.toLowerCase())
    ) || (error.response?.data?.success === false && error.response?.status === 400);
};

export const getFavouriteErrorMessage = (error: any, itemName: string): string => {
    if (isDuplicateFavouriteError(error)) {
        return `${itemName} đã được thêm vào danh sách yêu thích`;
    }

    return `Không thể thêm ${itemName} vào danh sách yêu thích. Vui lòng thử lại`;
};

export const logFavouriteAction = (action: 'add' | 'remove', item: any, result: 'success' | 'duplicate' | 'error') => {
    const emoji = action === 'add' ? '❤️' : '🗑️';
    const status = result === 'success' ? '✅' : result === 'duplicate' ? '📝' : '❌';

    console.log(`${emoji} ${status} Favourite ${action}:`, {
        itemId: item.petId || item.productId,
        itemName: item.name,
        result
    });
};