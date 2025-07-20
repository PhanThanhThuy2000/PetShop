// app/redux/slices/favouriteSlice.ts - OPTIMIZED VERSION
import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import { AddFavouriteRequest, FavouriteItem, favouriteService } from '../../services/favouriteService';

interface FavouriteState {
    favourites: FavouriteItem[];
    loading: boolean;
    error: string | null;
    favouriteStatusMap: Record<string, boolean>;
    checkingStatus: boolean;
}

const initialState: FavouriteState = {
    favourites: [],
    loading: false,
    error: null,
    favouriteStatusMap: {},
    checkingStatus: false,
};

// ✅ HELPER FUNCTION để tạo key cho status map
const createStatusKey = (data: AddFavouriteRequest): string => {
    return data.pet_id ? `pet_${data.pet_id}` : `product_${data.product_id}`;
};

// ✅ CHECK FAVOURITE STATUS THUNK
export const checkFavouriteStatus = createAsyncThunk(
    'favourites/checkStatus',
    async (params: { product_id?: string; pet_id?: string }, { rejectWithValue }) => {
        try {
            console.log('🔍 Redux: Checking favourite status for:', params);
            const response = await favouriteService.checkFavourite(params);

            const isFavorite = Boolean(response?.data?.isFavorite);
            console.log('✅ Redux: checkFavouriteStatus result:', isFavorite);

            return {
                ...params,
                isFavorite
            };
        } catch (error: any) {
            console.error('❌ Redux checkFavouriteStatus error:', error);
            return {
                ...params,
                isFavorite: false
            };
        }
    }
);

export const addToFavourites = createAsyncThunk(
    'favourites/add',
    async (data: AddFavouriteRequest, { rejectWithValue }) => {
        try {
            console.log('🔄 Redux: Adding to favourites:', data);
            const response = await favouriteService.addFavourite(data);

            const isExisting = response.isExisting || false;
            console.log(`✅ Add favourite response - isExisting: ${isExisting}`);

            return {
                data: response.data,
                requestData: data,
                isExisting
            };
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || '';
            console.error('❌ Redux addToFavourites error:', error);
            return rejectWithValue(errorMessage || error.message || 'Failed to add to favourites');
        }
    }
);

export const removeFromFavourites = createAsyncThunk(
    'favourites/remove',
    async (data: AddFavouriteRequest, { rejectWithValue }) => {
        try {
            console.log('🔄 Redux: Removing from favourites:', data);
            const response = await favouriteService.removeFavourite(data);

            const wasExisting = response.wasExisting !== false;
            console.log(`✅ Remove favourite response - wasExisting: ${wasExisting}`);

            return { requestData: data, wasExisting };
        } catch (error: any) {
            console.error('❌ Redux removeFromFavourites error:', error);

            if (error.response?.status === 404) {
                console.log('📝 Item not in favourites, treating as success');
                return { requestData: data, wasExisting: false };
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
            console.error('❌ Redux fetchFavourites error:', error);
            return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch favourites');
        }
    }
);

// Enhanced favouriteSlice.ts with improved state management
const favouriteSlice = createSlice({
    name: 'favourites',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },

        // ✅ ENHANCED setFavouriteStatus với better logging
        setFavouriteStatus: (state, action) => {
            const { pet_id, product_id, isFavorite } = action.payload;
            const key = createStatusKey({ pet_id, product_id });

            console.log('🔧 Redux: setFavouriteStatus called:', {
                key,
                oldValue: state.favouriteStatusMap[key],
                newValue: isFavorite
            });

            state.favouriteStatusMap[key] = isFavorite;
        },

        // ✅ NEW: Force status update - bypasses all checks
        forceSetFavouriteStatus: (state, action) => {
            const { pet_id, product_id, isFavorite } = action.payload;
            const key = createStatusKey({ pet_id, product_id });

            console.log('🔥 Redux: FORCE setFavouriteStatus:', {
                key,
                oldValue: state.favouriteStatusMap[key],
                newValue: isFavorite
            });

            state.favouriteStatusMap[key] = isFavorite;
        },

        rebuildStatusMap: (state) => {
            console.log('🔧 Redux: Rebuilding status map...');
            state.favouriteStatusMap = {};
            state.favourites.forEach(fav => {
                const key = createStatusKey({
                    pet_id: fav.pet_id,
                    product_id: fav.product_id
                });
                state.favouriteStatusMap[key] = true;
            });
            console.log('✅ Redux: Status map rebuilt with', Object.keys(state.favouriteStatusMap).length, 'items');
        },

        clearCheckingStatus: (state) => {
            state.checkingStatus = false;
        }
    },
    extraReducers: (builder) => {
        builder
            // ✅ ENHANCED CHECK FAVOURITE STATUS
            .addCase(checkFavouriteStatus.pending, (state) => {
                state.checkingStatus = true;
            })
            .addCase(checkFavouriteStatus.fulfilled, (state, action) => {
                state.checkingStatus = false;
                const { pet_id, product_id, isFavorite } = action.payload;
                const key = createStatusKey({ pet_id, product_id });

                console.log('✅ Redux: checkFavouriteStatus completed:', {
                    key,
                    oldValue: state.favouriteStatusMap[key],
                    serverValue: isFavorite
                });

                // ✅ ALWAYS UPDATE - server is source of truth
                state.favouriteStatusMap[key] = isFavorite;
            })
            .addCase(checkFavouriteStatus.rejected, (state, action) => {
                state.checkingStatus = false;
                console.error('❌ Redux: checkFavouriteStatus failed:', action.error);
            })

            // ✅ ENHANCED ADD TO FAVOURITES
            .addCase(addToFavourites.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(addToFavourites.fulfilled, (state, action) => {
                state.loading = false;
                const { data: favourite, requestData, isExisting } = action.payload;

                console.log('✅ Redux: addToFavourites completed:', {
                    requestData,
                    isExisting,
                    hasFavouriteData: !!favourite
                });

                // ✅ UPDATE STATUS MAP IMMEDIATELY - regardless of isExisting
                const key = createStatusKey(requestData);
                state.favouriteStatusMap[key] = true;

                // ✅ ADD TO FAVOURITES LIST if not existing and we have data
                if (!isExisting && favourite) {
                    const existingIndex = state.favourites.findIndex(fav =>
                        (requestData.pet_id && fav.pet_id === requestData.pet_id) ||
                        (requestData.product_id && fav.product_id === requestData.product_id)
                    );

                    if (existingIndex === -1) {
                        state.favourites.push(favourite);
                        console.log('✅ Redux: Added new favourite to list');
                    }
                } else if (isExisting) {
                    console.log('📝 Redux: Item already in favourites, status map updated');
                }
            })
            .addCase(addToFavourites.rejected, (state, action) => {
                state.loading = false;
                console.error('❌ Redux: addToFavourites failed:', action.error);
            })

            // ✅ ENHANCED REMOVE FROM FAVOURITES
            .addCase(removeFromFavourites.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(removeFromFavourites.fulfilled, (state, action) => {
                state.loading = false;
                const { requestData, wasExisting } = action.payload;

                console.log('✅ Redux: removeFromFavourites completed:', {
                    requestData,
                    wasExisting
                });

                // ✅ ALWAYS UPDATE STATUS MAP - regardless of wasExisting
                const key = createStatusKey(requestData);
                state.favouriteStatusMap[key] = false;

                // ✅ REMOVE FROM FAVOURITES LIST
                const initialLength = state.favourites.length;
                state.favourites = state.favourites.filter(fav =>
                    !(fav.product_id === requestData.product_id || fav.pet_id === requestData.pet_id)
                );

                const removedCount = initialLength - state.favourites.length;
                console.log(`✅ Redux: Removed ${removedCount} favourite(s) from list`);
            })
            .addCase(removeFromFavourites.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string || 'Failed to remove from favourites';
                console.error('❌ Redux: removeFromFavourites failed:', action.error);
            })

            // ✅ ENHANCED FETCH FAVOURITES
            .addCase(fetchFavourites.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchFavourites.fulfilled, (state, action) => {
                state.loading = false;
                state.favourites = action.payload;

                console.log('✅ Redux: fetchFavourites completed, received', action.payload.length, 'items');

                // ✅ COMPLETELY REBUILD STATUS MAP from fresh data
                const newStatusMap: Record<string, boolean> = {};
                action.payload.forEach((fav: FavouriteItem) => {
                    const key = createStatusKey({
                        pet_id: fav.pet_id,
                        product_id: fav.product_id
                    });
                    newStatusMap[key] = true;
                });

                state.favouriteStatusMap = newStatusMap;
                console.log('✅ Redux: Completely rebuilt status map with', Object.keys(newStatusMap).length, 'items');
                console.log('📋 Redux: New status map keys:', Object.keys(newStatusMap));
            })
            .addCase(fetchFavourites.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string || 'Failed to fetch favourites';
                console.error('❌ Redux: fetchFavourites failed:', action.error);
            });
    },
});

export const {
    clearError,
    setFavouriteStatus,
    forceSetFavouriteStatus, // ✅ NEW ACTION
    rebuildStatusMap,
    clearCheckingStatus
} = favouriteSlice.actions;


// ✅ OPTIMIZED SELECTORS USING createSelector để tránh re-renders
const selectFavouriteState = (state: any) => state.favourites;

export const selectFavourites = createSelector(
    [selectFavouriteState],
    (favouriteState) => favouriteState.favourites
);

export const selectFavouritesLoading = createSelector(
    [selectFavouriteState],
    (favouriteState) => favouriteState.loading
);

export const selectCheckingStatus = createSelector(
    [selectFavouriteState],
    (favouriteState) => favouriteState.checkingStatus
);

export const selectFavouriteStatusMap = createSelector(
    [selectFavouriteState],
    (favouriteState) => favouriteState.favouriteStatusMap
);

// ✅ MEMOIZED SELECTOR cho specific favourite status
export const selectFavouriteStatus = (state: any, pet_id?: string, product_id?: string): boolean => {
    const key = createStatusKey({ pet_id, product_id });
    const statusMap = selectFavouriteStatusMap(state);
    return statusMap[key] || false;
};

export default favouriteSlice.reducer;