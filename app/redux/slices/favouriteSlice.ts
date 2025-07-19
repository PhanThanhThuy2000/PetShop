// app/redux/slices/favouriteSlice.ts - SỬA LỖI VỚI ERROR HANDLING
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { AddFavouriteRequest, FavouriteItem, favouriteService } from '../../services/favouriteService';

interface FavouriteState {
    favourites: FavouriteItem[];
    loading: boolean;
    error: string | null;
}

const initialState: FavouriteState = {
    favourites: [],
    loading: false,
    error: null,
};

export const addToFavourites = createAsyncThunk(
    'favourites/add',
    async (data: AddFavouriteRequest, { rejectWithValue }) => {
        try {
            const response = await favouriteService.addFavourite(data);
            return response.data;
        } catch (error: any) {
            console.error('Redux addToFavourites error:', error);

            // ✅ XỬ LÝ TRƯỜNG HỢP ĐÃ TỒN TẠI - RETURN SUCCESS THAY VÌ REJECT
            if (error.response?.status === 400 &&
                error.response?.data?.message?.includes('đã có trong')) {
                console.log('📝 Item already in favourites, treating as success');

                // ✅ TẠO MOCK FAVOURITE ITEM CHO CASE ĐÃ TỒN TẠI
                return {
                    _id: 'existing-' + Date.now(),
                    user_id: 'current_user',
                    ...data,
                    created_at: new Date().toISOString()
                } as FavouriteItem;
            }

            return rejectWithValue(error.response?.data?.message || error.message || 'Failed to add to favourites');
        }
    }
);

export const removeFromFavourites = createAsyncThunk(
    'favourites/remove',
    async (data: AddFavouriteRequest, { rejectWithValue }) => {
        try {
            await favouriteService.removeFavourite(data);
            return data;
        } catch (error: any) {
            console.error('Redux removeFromFavourites error:', error);

            // ✅ XỬ LÝ TRƯỜNG HỢP KHÔNG TÌM THẤY - RETURN SUCCESS
            if (error.response?.status === 404) {
                console.log('📝 Item not in favourites, treating as success');
                return data;
            }

            return rejectWithValue(error.response?.data?.message || error.message || 'Failed to remove from favourites');
        }
    }
);

export const fetchFavourites = createAsyncThunk(
    'favourites/fetchAll',
    async (_, { rejectWithValue }) => {
        try {
            const response = await favouriteService.getFavourites();
            return response.data;
        } catch (error: any) {
            console.error('Redux fetchFavourites error:', error);
            return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch favourites');
        }
    }
);

// ✅ SỬA LỖI: checkFavouriteStatus với error handling
export const checkFavouriteStatus = createAsyncThunk(
    'favourites/check',
    async (params: { product_id?: string; pet_id?: string }, { rejectWithValue }) => {
        try {
            console.log('🔍 Redux checkFavouriteStatus called with:', params);
            const response = await favouriteService.checkFavourite(params);
            console.log('✅ Redux checkFavouriteStatus response:', response);

            // ✅ KIỂM TRA RESPONSE STRUCTURE
            if (!response || !response.data) {
                console.warn('⚠️ Invalid response structure, defaulting to false');
                return { ...params, isFavorite: false };
            }

            return {
                ...params,
                isFavorite: Boolean(response.data.isFavorite) // ✅ Đảm bảo là boolean
            };
        } catch (error: any) {
            console.error('Redux checkFavouriteStatus error:', error);
            // ✅ FALLBACK: Trả về false thay vì reject
            console.log('🔄 Falling back to isFavorite: false due to error');
            return { ...params, isFavorite: false };
        }
    }
);

const favouriteSlice = createSlice({
    name: 'favourites',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        // ✅ THÊM ACTION ĐỂ SYNC FAVOURITE STATUS
        syncFavouriteStatus: (state, action) => {
            const { pet_id, product_id, isFavorite } = action.payload;

            if (!isFavorite) {
                // Remove from state if not favorite
                state.favourites = state.favourites.filter(fav =>
                    !(fav.pet_id === pet_id || fav.product_id === product_id)
                );
            }
        },
    },
    extraReducers: (builder) => {
        builder
            // Add to favourites
            .addCase(addToFavourites.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
     
            .addCase(addToFavourites.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string || 'Failed to add to favourites';
            })
            // Remove from favourites
            .addCase(removeFromFavourites.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
    
            .addCase(removeFromFavourites.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string || 'Failed to remove from favourites';
            })
            // Fetch favourites
            .addCase(fetchFavourites.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchFavourites.fulfilled, (state, action) => {
                state.loading = false;
                state.favourites = action.payload;
            })
            .addCase(fetchFavourites.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string || 'Failed to fetch favourites';
            })
            // ✅ SỬA LỖI: Check favourite status
            .addCase(checkFavouriteStatus.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(checkFavouriteStatus.fulfilled, (state) => {
                state.loading = false;
                // Không cần update state, chỉ cần return result
            })
            .addCase(checkFavouriteStatus.rejected, (state, action) => {
                state.loading = false;
                // ✅ KHÔNG SET ERROR cho check status vì đã có fallback
                console.log('⚠️ checkFavouriteStatus rejected, but handled gracefully');
            })
        // ✅ ADD TO FAVOURITES - XỬ LÝ DUPLICATE
            .addCase(addToFavourites.fulfilled, (state, action) => {
                state.loading = false;

                // ✅ KIỂM TRA XEM ITEM ĐÃ CÓ TRONG STATE CHƯA
                const { pet_id, product_id } = action.payload;
                const existingIndex = state.favourites.findIndex(fav =>
                    (pet_id && fav.pet_id === pet_id) ||
                    (product_id && fav.product_id === product_id)
                );

                if (existingIndex === -1) {
                    // Chỉ thêm nếu chưa có
                    state.favourites.push(action.payload);
                    console.log('✅ Added new favourite to state');
                } else {
                    console.log('📝 Favourite already exists in state, skipping add');
                }
            })

        // ✅ REMOVE FROM FAVOURITES - XỬ LÝ NOT FOUND
        .addCase(removeFromFavourites.fulfilled, (state, action) => {
            state.loading = false;
            const { product_id, pet_id } = action.payload;

            const initialLength = state.favourites.length;
            state.favourites = state.favourites.filter(fav =>
                !(fav.product_id === product_id || fav.pet_id === pet_id)
            );

            const removedCount = initialLength - state.favourites.length;
            console.log(`✅ Removed ${removedCount} favourite(s) from state`);
        })
    },
});

export const { clearError, syncFavouriteStatus } = favouriteSlice.actions;
export default favouriteSlice.reducer;