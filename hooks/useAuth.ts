// hooks/useAuth.ts
import { useSelector, useDispatch } from 'react-redux';

export const useAuth = () => {
  const dispatch = useDispatch();
  const authState = useSelector((state: any) => state.auth);

  return {
    user: authState?.user || null,
    token: authState?.token || null,
    isLoading: authState?.isLoading || false,
    error: authState?.error || null,
    isAuthenticated: !!authState?.token,
    dispatch,
  };
};