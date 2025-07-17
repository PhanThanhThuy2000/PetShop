// app/redux/store.ts - CẬP NHẬT để thêm appointment và careService slices
import AsyncStorage from '@react-native-async-storage/async-storage';
import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { FLUSH, PAUSE, PERSIST, persistReducer, persistStore, PURGE, REGISTER, REHYDRATE } from 'redux-persist';
import appointmentReducer from './slices/appointmentSlice'; // NEW
import authReducer from './slices/authSlice';
import careServiceReducer from './slices/careServiceSlice'; // NEW
import cartReducer from './slices/cartSlice';
import chatReducer from './slices/chatSlice';

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth'], // Chỉ persist auth state
  blacklist: ['chat', 'appointments', 'careServices'] // Không persist real-time data
};

const rootReducer = combineReducers({
  auth: authReducer,
  cart: cartReducer,
  chat: chatReducer,
  appointments: appointmentReducer,  // NEW
  careServices: careServiceReducer,  // NEW
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;