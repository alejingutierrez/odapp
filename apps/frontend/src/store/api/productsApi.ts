import type { Product, Collection, Category } from '../slices/productsSlice'

import { baseApi } from './baseApi'
// import type { EndpointBuilder } from '@reduxjs/toolkit/query'

export interface ProductsQuery {
  page?: number
  pageSize?: number
  search?: string
  status?: string[]
  category?: string
  collections?: string[]
  tags?: string[]
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface ProductsResponse {
  products: Product[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface CreateProductRequest {
  name: string
  description: string
  category: string
  pricing: {
    basePrice: number
    compareAtPrice?: number
    cost?: number
  }
  inventory: {
    tracked: boolean
    quantity: number
    policy: 'deny' | 'continue'
  }
  images?: Array<{
    url: string
    alt: string
    position: number
  }>
  variants?: Array<{
    title: string
    price: number
    options: Array<{ name: string; value: string }>
  }>
  tags?: string[]
  collections?: string[]
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {
  id: string
}

export const productsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Products
    getProducts: builder.query({
      query: (params: ProductsQuery) => ({
        url: 'products',
        params,
      }),
      providesTags: (result: ProductsResponse | undefined) =>
        result
          ? [
              ...result.products.map(({ id }: { id: string }) => ({
                type: 'Product' as const,
                id,
              })),
              { type: 'Product', id: 'LIST' },
            ]
          : [{ type: 'Product', id: 'LIST' }],
    }),

    getProduct: builder.query({
      query: (id: string) => `products/${id}`,
      providesTags: (_result: Product | undefined, _error: unknown, id: string) => [{ type: 'Product', id }],
    }),

    createProduct: builder.mutation({
      query: (product: CreateProductRequest) => ({
        url: 'products',
        method: 'POST',
        body: product,
      }),
      invalidatesTags: [{ type: 'Product', id: 'LIST' }],
    }),

    updateProduct: builder.mutation({
      query: ({ id, ...patch }: UpdateProductRequest) => ({
        url: `products/${id}`,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: (_result: Product | undefined, _error: unknown, { id }: { id: string }) => [
        { type: 'Product', id },
        { type: 'Product', id: 'LIST' },
      ],
    }),

    deleteProduct: builder.mutation({
      query: (id: string) => ({
        url: `products/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result: void | undefined, _error: unknown, id: string) => [
        { type: 'Product', id },
        { type: 'Product', id: 'LIST' },
      ],
    }),

    bulkUpdateProducts: builder.mutation({
      query: (updates: Array<{ id: string; changes: Partial<Product> }>) => ({
        url: 'products/bulk',
        method: 'PATCH',
        body: { updates },
      }),
      invalidatesTags: [{ type: 'Product', id: 'LIST' }],
    }),

    bulkDeleteProducts: builder.mutation({
      query: (ids: string[]) => ({
        url: 'products/bulk',
        method: 'DELETE',
        body: { ids },
      }),
      invalidatesTags: [{ type: 'Product', id: 'LIST' }],
    }),

    // Collections
    getCollections: builder.query({
      query: () => 'collections',
      providesTags: (result: Collection[] | undefined) =>
        result
          ? [
              ...result.map(({ id }: { id: string }) => ({ type: 'Collection' as const, id })),
              { type: 'Collection', id: 'LIST' },
            ]
          : [{ type: 'Collection', id: 'LIST' }],
    }),

    getCollection: builder.query({
      query: (id: string) => `collections/${id}`,
      providesTags: (_result: Collection | undefined, _error: unknown, id: string) => [{ type: 'Collection', id }],
    }),

    createCollection: builder.mutation({
      query: (collection: Partial<Collection>) => ({
        url: 'collections',
        method: 'POST',
        body: collection,
      }),
      invalidatesTags: [{ type: 'Collection', id: 'LIST' }],
    }),

    updateCollection: builder.mutation({
      query: ({ id, changes }: { id: string; changes: Partial<Collection> }) => ({
        url: `collections/${id}`,
        method: 'PATCH',
        body: changes,
      }),
      invalidatesTags: (_result: Collection | undefined, _error: unknown, { id }: { id: string }) => [
        { type: 'Collection', id },
        { type: 'Collection', id: 'LIST' },
      ],
    }),

    deleteCollection: builder.mutation({
      query: (id: string) => ({
        url: `collections/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result: void | undefined, _error: unknown, id: string) => [
        { type: 'Collection', id },
        { type: 'Collection', id: 'LIST' },
      ],
    }),

    // Categories
    getCategories: builder.query({
      query: () => 'categories',
      providesTags: (result: Category[] | undefined) =>
        result
          ? [
              ...result.map(({ id }: { id: string }) => ({ type: 'Category' as const, id })),
              { type: 'Category', id: 'LIST' },
            ]
          : [{ type: 'Category', id: 'LIST' }],
    }),

    getCategory: builder.query({
      query: (id: string) => `categories/${id}`,
      providesTags: (_result: Category | undefined, _error: unknown, id: string) => [{ type: 'Category', id }],
    }),

    createCategory: builder.mutation({
      query: (category: Partial<Category>) => ({
        url: 'categories',
        method: 'POST',
        body: category,
      }),
      invalidatesTags: [{ type: 'Category', id: 'LIST' }],
    }),

    updateCategory: builder.mutation({
      query: ({ id, changes }: { id: string; changes: Partial<Category> }) => ({
        url: `categories/${id}`,
        method: 'PATCH',
        body: changes,
      }),
      invalidatesTags: (_result: Category | undefined, _error: unknown, { id }: { id: string }) => [
        { type: 'Category', id },
        { type: 'Category', id: 'LIST' },
      ],
    }),

    deleteCategory: builder.mutation({
      query: (id: string) => ({
        url: `categories/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result: void | undefined, _error: unknown, id: string) => [
        { type: 'Category', id },
        { type: 'Category', id: 'LIST' },
      ],
    }),

    // Search
    searchProducts: builder.query({
      query: (searchTerm: string) => ({
        url: 'products/search',
        params: { q: searchTerm },
      }),
      providesTags: [{ type: 'Product', id: 'SEARCH' }],
    }),

    // Analytics
    getProductAnalytics: builder.query({
      query: () => 'products/analytics',
      providesTags: [{ type: 'Product', id: 'ANALYTICS' }],
    }),
  }),
})

export const {
  useGetProductsQuery,
  useGetProductQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useBulkUpdateProductsMutation,
  useBulkDeleteProductsMutation,
  useGetCollectionsQuery,
  useGetCollectionQuery,
  useCreateCollectionMutation,
  useUpdateCollectionMutation,
  useDeleteCollectionMutation,
  useGetCategoriesQuery,
  useGetCategoryQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useSearchProductsQuery,
  useGetProductAnalyticsQuery,
} = productsApi
