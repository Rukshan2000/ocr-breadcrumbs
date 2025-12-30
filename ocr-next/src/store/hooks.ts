import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from './index';

/**
 * Custom Redux hooks with proper TypeScript typing
 * 
 * Usage:
 * const dispatch = useAppDispatch();
 * const auth = useAppSelector(state => state.auth);
 */

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
