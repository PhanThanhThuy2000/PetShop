// app/redux/slices/favouriteSlice.ts - FIXED VERSION
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { AddFavouriteRequest, FavouriteItem, favouriteService } from '../../services/favouriteService';

interface FavouriteState {
    favourites: FavouriteItem[];
    loading: boolean;
    error: string | null;
    // ✅ THÊM favourite status map để track nhanh
    favouriteStatusMap: Record<string, boolean>; // key: "pet_123" hoặc "product_456"
}

const initialState: FavouriteState = {
    favourites: [],
    loading: false,
    error: null,
    favouriteStatusMap: {},
};

// ✅ HELPER FUNCTION để tạo key cho status map
const createStatusKey = (data: AddFavouriteRequest): string => {
    return data.pet_id ? `pet_${data.pet_id}` : `product_${data.product_id}`;
};

export const addToFavourites = createAsyncThunk(
    'favourites/add',
    async (data: AddFavouriteRequest, { rejectWithValue }) => {
        try {
            console.log('🔄 Redux: Adding to favourites:', data);
            const response = await favouriteService.addFavourite(data);
            return { data: response.data, requestData: data };
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || '';

            // ✅ CHECK DUPLICATE CASE TRƯỚC KHI LOG ERROR
            const isDuplicate =
                error.response?.status === 400 && (
                    errorMessage.includes('đã có trong') ||
                    errorMessage.includes('Đã có trong') ||
                    errorMessage.includes('already exists') ||
                    errorMessage.includes('duplicate') ||
                    errorMessage.includes('đã tồn tại') ||
                    errorMessage.includes('yêu thích') ||
                    error.response?.data?.success === false
                );

            if (isDuplicate) {
                // ✅ LOG INFO THAY VÌ ERROR cho duplicate case
                console.log('📝 Item already in favourites, treating as success');

                // ✅ TẠO MOCK FAVOURITE ITEM CHO CASE ĐÃ TỒN TẠI
                const mockFavourite = {
                    _id: 'existing-' + Date.now(),
                    user_id: 'current_user',
                    ...data,
                    created_at: new Date().toISOString()
                } as FavouriteItem;

                // ✅ RETURN SUCCESS THAY VÌ REJECT
                return { data: mockFavourite, requestData: data };
            } else {
                // ✅ CHỈ LOG ERROR CHO CASE THẬT SỰ CÓ LỖI
                console.error('Redux addToFavourites error:', error);
            }

            return rejectWithValue(errorMessage || error.message || 'Failed to add to favourites');
        }
    }
);

export const removeFromFavourites = createAsyncThunk(
    'favourites/remove',
    async (data: AddFavouriteRequest, { rejectWithValue }) => {
        try {
            console.log('🔄 Redux: Removing from favourites:', data);
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
            console.log('🔄 Redux: Fetching favourites...');
            const response = await favouriteService.getFavourites();
            return response.data;
        } catch (error: any) {
            console.error('Redux fetchFavourites error:', error);
            return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch favourites');
        }
    }
);

export const checkFavouriteStatus = createAsyncThunk(
    'favourites/check',
    async (params: { product_id?: string; pet_id?: string }, { rejectWithValue }) => {
        try {
            console.log('🔍 Redux checkFavouriteStatus called with:', params);
            const response = await favouriteService.checkFavourite(params);
            console.log('✅ Redux checkFavouriteStatus response:', response);

            return {
                ...params,
                isFavorite: Boolean(response?.data?.isFavorite)
            };
        } catch (error: any) {
            console.error('Redux checkFavouriteStatus error:', error);
            // ✅ FALLBACK: Trả về false thay vì reject
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

        // ✅ SYNC LOCAL FAVOURITE STATUS
        setFavouriteStatus: (state, action) => {
            const { pet_id, product_id, isFavorite } = action.payload;
            const key = createStatusKey({ pet_id, product_id });
            state.favouriteStatusMap[key] = isFavorite;
        },

        // ✅ REBUILD STATUS MAP từ favourites array
        rebuildStatusMap: (state) => {
            state.favouriteStatusMap = {};
            state.favourites.forEach(fav => {
                const key = createStatusKey({
                    pet_id: fav.pet_id,
                    product_id: fav.product_id
                });
                state.favouriteStatusMap[key] = true;
            });
        },
    },
    extraReducers: (builder) => {
        builder
            // ✅ ADD TO FAVOURITES
            .addCase(addToFavourites.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(addToFavourites.fulfilled, (state, action) => {
                state.loading = false;
                const { data: favourite, requestData } = action.payload;

                // ✅ KIỂM TRA XEM ITEM ĐÃ CÓ TRONG STATE CHƯA
                const existingIndex = state.favourites.findIndex(fav =>
                    (requestData.pet_id && fav.pet_id === requestData.pet_id) ||
                    (requestData.product_id && fav.product_id === requestData.product_id)
                );

                if (existingIndex === -1) {
                    // Thêm mới
                    state.favourites.push(favourite);
                    console.log('✅ Added new favourite to state');
                } else {
                    console.log('📝 Favourite already exists in state, skipping add');
                }

                // ✅ UPDATE STATUS MAP
                const key = createStatusKey(requestData);
                state.favouriteStatusMap[key] = true;
            })
            .addCase(addToFavourites.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string || 'Failed to add to favourites';
            })

            // ✅ REMOVE FROM FAVOURITES
            .addCase(removeFromFavourites.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(removeFromFavourites.fulfilled, (state, action) => {
                state.loading = false;
                const { product_id, pet_id } = action.payload;

                // ✅ REMOVE FROM FAVOURITES ARRAY
                const initialLength = state.favourites.length;
                state.favourites = state.favourites.filter(fav =>
                    !(fav.product_id === product_id || fav.pet_id === pet_id)
                );

                const removedCount = initialLength - state.favourites.length;
                console.log(`✅ Removed ${removedCount} favourite(s) from state`);

                // ✅ UPDATE STATUS MAP
                const key = createStatusKey(action.payload);
                state.favouriteStatusMap[key] = false;
            })
            .addCase(removeFromFavourites.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string || 'Failed to remove from favourites';
            })

            // ✅ FETCH FAVOURITES
            .addCase(fetchFavourites.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchFavourites.fulfilled, (state, action) => {
                state.loading = false;
                state.favourites = action.payload;

                // ✅ REBUILD STATUS MAP
                state.favouriteStatusMap = {};
                action.payload.forEach((fav: FavouriteItem) => {
                    const key = createStatusKey({
                        pet_id: fav.pet_id,
                        product_id: fav.product_id
                    });
                    state.favouriteStatusMap[key] = true;
                });
            })
            .addCase(fetchFavourites.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string || 'Failed to fetch favourites';
            })

            // ✅ CHECK FAVOURITE STATUS
            .addCase(checkFavouriteStatus.fulfilled, (state, action) => {
                const { pet_id, product_id, isFavorite } = action.payload;
                const key = createStatusKey({ pet_id, product_id });
                state.favouriteStatusMap[key] = isFavorite;
            });
    },
});

export const { clearError, setFavouriteStatus, rebuildStatusMap } = favouriteSlice.actions;

// ✅ SELECTORS để sử dụng trong components
export const selectFavouriteStatus = (state: any, pet_id?: string, product_id?: string): boolean => {
    const key = createStatusKey({ pet_id, product_id });
    return state.favourites.favouriteStatusMap[key] || false;
};

// ✅ SELECTOR để lấy tất cả favourites
export const selectFavourites = (state: any) => state.favourites.favourites;

// ✅ SELECTOR để lấy loading state
export const selectFavouritesLoading = (state: any) => state.favourites.loading;

export default favouriteSlice.reducer;