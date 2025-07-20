// hooks/useFavouriteStatus.ts - PREVENTIVE HOOK
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { checkFavouriteStatus, fetchFavourites } from '../app/redux/slices/favouriteSlice';
import { AppDispatch, RootState } from '../app/redux/store';

interface UseFavouriteStatusProps {
    petId?: string;
    productId?: string;
}

export const useFavouriteStatus = ({ petId, productId }: UseFavouriteStatusProps) => {
    const dispatch = useDispatch<AppDispatch>();
    const [isChecking, setIsChecking] = useState(false);

    // ✅ GET STATUS FROM REDUX
    const isFavorite = useSelector((state: RootState) => {
        const key = petId ? `pet_${petId}` : `product_${productId}`;
        return state.favourites.favouriteStatusMap[key] || false;
    });

    // ✅ AUTO-CHECK STATUS ON MOUNT
    useEffect(() => {
        const checkStatus = async () => {
            if (!petId && !productId) return;

            setIsChecking(true);
            try {
                // ✅ FIRST: Check từ server để có latest status
                await dispatch(checkFavouriteStatus({
                    pet_id: petId,
                    product_id: productId
                }));

                // ✅ BACKUP: Fetch all favourites để sync state
                await dispatch(fetchFavourites());

            } catch (error) {
                console.error('Error checking favourite status:', error);
                // ✅ FALLBACK: Still fetch favourites
                dispatch(fetchFavourites());
            } finally {
                setIsChecking(false);
            }
        };

        checkStatus();
    }, [dispatch, petId, productId]);

    // ✅ FORCE REFRESH FUNCTION
    const refreshStatus = async () => {
        setIsChecking(true);
        try {
            await dispatch(fetchFavourites());

            if (petId || productId) {
                await dispatch(checkFavouriteStatus({
                    pet_id: petId,
                    product_id: productId
                }));
            }
        } catch (error) {
            console.error('Error refreshing favourite status:', error);
        } finally {
            setIsChecking(false);
        }
    };

    return {
        isFavorite,
        isChecking,
        refreshStatus
    };
};