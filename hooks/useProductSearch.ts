// app/hooks/useProductSearch.ts
import { useState, useCallback } from 'react';
import { productsService, SearchProductsParams } from '../app/services/productsService';
import { Product } from '../app/types';

export const useProductSearch = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalCount: 0,
    hasNextPage: false,
    hasPrevPage: false,
    limit: 10
  });

  const searchProducts = useCallback(async (params: SearchProductsParams) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Hook: Searching products with params:', params);
      
      const response = await productsService.searchProducts(params);
      
      console.log('📦 Hook: API response:', response);
      
      if (response.success && response.data) {
        // Append products nếu là load more (page > 1), replace nếu là search mới
        if (params.page && params.page > 1) {
          setProducts(prev => [...prev, ...response.data.products]);
        } else {
          setProducts(response.data.products);
        }
        setPagination(response.data.pagination);
        
        console.log('✅ Hook: Updated products count:', response.data.products.length);
      } else {
        const errorMsg = response.message || 'Tìm kiếm thất bại';
        setError(errorMsg);
        console.error('❌ Hook: API returned error:', errorMsg);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Có lỗi xảy ra khi tìm kiếm';
      setError(errorMsg);
      console.error('❌ Hook: Search error:', {
        message: errorMsg,
        status: err.response?.status,
        data: err.response?.data
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const resetSearch = useCallback(() => {
    setProducts([]);
    setError(null);
    setPagination({
      currentPage: 1,
      totalPages: 0,
      totalCount: 0,
      hasNextPage: false,
      hasPrevPage: false,
      limit: 10
    });
  }, []);

  return {
    products,
    loading,
    error,
    pagination,
    searchProducts,
    resetSearch
  };
};