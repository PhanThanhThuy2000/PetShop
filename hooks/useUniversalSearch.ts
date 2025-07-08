// app/hooks/useUniversalSearch.ts
import { useState, useCallback } from 'react';
import { productsService, SearchProductsParams } from '../app/services/productsService';
import { petsService, SearchPetsParams } from '../app/services/petsService';
import { Product, Pet } from '../app/types';

export type SearchCategory = 'all' | 'products' | 'pets';

export interface UniversalSearchParams {
  keyword?: string;
  category?: SearchCategory;
  page?: number;
  limit?: number;
}

export interface SearchResult {
  type: 'product' | 'pet';
  data: Product | Pet;
}

export const useUniversalSearch = () => {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchCategory, setSearchCategory] = useState<SearchCategory>('all');
  
  const [productsPagination, setProductsPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalCount: 0,
    hasNextPage: false,
    hasPrevPage: false,
    limit: 10
  });

  const [petsPagination, setPetsPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalCount: 0,
    hasNextPage: false,
    hasPrevPage: false,
    limit: 10
  });

  const searchAll = useCallback(async (params: UniversalSearchParams) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Universal Search: Starting search with params:', params);
      
      const { keyword, page = 1, limit = 5 } = params;
      
      // Search both products and pets concurrently
      const [productsResponse, petsResponse] = await Promise.allSettled([
        productsService.searchProducts({
          keyword,
          page,
          limit
        }),
        petsService.searchPets({
          keyword,
          page,
          limit
        })
      ]);

      const newProducts: Product[] = [];
      const newPets: Pet[] = [];
      const newResults: SearchResult[] = [];

      // Handle products response
      if (productsResponse.status === 'fulfilled' && productsResponse.value.success) {
        const productsData = productsResponse.value.data.products;
        newProducts.push(...productsData);
        
        // Add to universal results
        productsData.forEach(product => {
          newResults.push({ type: 'product', data: product });
        });
        
        setProductsPagination(productsResponse.value.data.pagination);
        console.log('✅ Products found:', productsData.length);
      } else {
        console.error('❌ Products search failed:', productsResponse);
      }

      // Handle pets response  
      if (petsResponse.status === 'fulfilled' && petsResponse.value.success) {
        const petsData = petsResponse.value.data.pets;
        newPets.push(...petsData);
        
        // Add to universal results
        petsData.forEach(pet => {
          newResults.push({ type: 'pet', data: pet });
        });
        
        setPetsPagination(petsResponse.value.data.pagination);
        console.log('✅ Pets found:', petsData.length);
      } else {
        console.error('❌ Pets search failed:', petsResponse);
      }

      // Update state based on append mode
      if (page && page > 1) {
        setProducts(prev => [...prev, ...newProducts]);
        setPets(prev => [...prev, ...newPets]);
        setResults(prev => [...prev, ...newResults]);
      } else {
        setProducts(newProducts);
        setPets(newPets);
        setResults(newResults);
      }

      console.log('📊 Total results:', newResults.length);

    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Có lỗi xảy ra khi tìm kiếm';
      setError(errorMsg);
      console.error('❌ Universal search error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const searchProducts = useCallback(async (params: SearchProductsParams) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Products Only: Searching with params:', params);
      
      const response = await productsService.searchProducts(params);
      
      if (response.success && response.data) {
        if (params.page && params.page > 1) {
          setProducts(prev => [...prev, ...response.data.products]);
        } else {
          setProducts(response.data.products);
        }
        setProductsPagination(response.data.pagination);
        console.log('✅ Products updated:', response.data.products.length);
      } else {
        setError(response.message || 'Tìm kiếm sản phẩm thất bại');
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Có lỗi xảy ra khi tìm kiếm sản phẩm';
      setError(errorMsg);
      console.error('❌ Products search error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const searchPets = useCallback(async (params: SearchPetsParams) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Pets Only: Searching with params:', params);
      
      const response = await petsService.searchPets(params);
      
      if (response.success && response.data) {
        if (params.page && params.page > 1) {
          setPets(prev => [...prev, ...response.data.pets]);
        } else {
          setPets(response.data.pets);
        }
        setPetsPagination(response.data.pagination);
        console.log('✅ Pets updated:', response.data.pets.length);
      } else {
        setError(response.message || 'Tìm kiếm pets thất bại');
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Có lỗi xảy ra khi tìm kiếm pets';
      setError(errorMsg);
      console.error('❌ Pets search error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const resetSearch = useCallback(() => {
    setResults([]);
    setProducts([]);
    setPets([]);
    setError(null);
    setProductsPagination({
      currentPage: 1,
      totalPages: 0,
      totalCount: 0,
      hasNextPage: false,
      hasPrevPage: false,
      limit: 10
    });
    setPetsPagination({
      currentPage: 1,
      totalPages: 0,
      totalCount: 0,
      hasNextPage: false,
      hasPrevPage: false,
      limit: 10
    });
  }, []);

  return {
    // Universal search
    results,
    searchAll,
    
    // Separate searches
    products,
    pets,
    searchProducts,
    searchPets,
    
    // State
    loading,
    error,
    searchCategory,
    setSearchCategory,
    
    // Pagination
    productsPagination,
    petsPagination,
    
    // Utils
    resetSearch
  };
};