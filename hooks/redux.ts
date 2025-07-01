import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../app/redux/store';

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export const useAuth = () => {
  const auth = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  return { ...auth, dispatch };
};

export const useCart = () => {
  const cart = useAppSelector((state) => state.cart);
  const dispatch = useAppDispatch();
  return { ...cart, dispatch };
};

// Thêm hook cho pets
export const usePets = () => {
  const pets = useAppSelector((state) => state.pets);
  const dispatch = useAppDispatch();
  return { ...pets, dispatch };
};

// Thêm hook cho products  
export const useProducts = () => {
  const products = useAppSelector((state) => state.products);
  const dispatch = useAppDispatch();
  return { ...products, dispatch };
};