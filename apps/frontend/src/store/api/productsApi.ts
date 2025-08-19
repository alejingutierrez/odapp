import { baseApi } from './baseApi'
import type { Product, Collection, Category } from '../slices/productsSlice'

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
    getProducts: builder.query<ProductsResponse, ProductsQuery>({
      query: (params) => ({
        url: 'products',
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.products.map(({ id }) => ({ type: 'Product' as const, id })),
              { type: 'Product', id: 'LIST' },
            ]
          : [{ type: 'Product', id: 'LIST' }],
    }),

    getProduct: builder.query<Product, string>({
      query: (id) => `products/${id}`,
      providesTags: (result, error, id) => [{ type: 'Product', id }],
    }),

    createProduct: builder.mutation<Product, CreateProductRequest>({
      query: (product) => ({
        url: 'products',
        method: 'POST',
        body: product,
      }),
      invalidatesTags: [{ type: 'Product', id: 'LIST' }],
    }),

    updateProduct: builder.mutation<Product, UpdateProductRequest>({
      query: ({ id, ...patch }) => ({
        url: `products/${id}`,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Product', id },
        { type: 'Product', id: 'LIST' },
      ],
    }),

    deleteProduct: builder.mutation<void, string>({
      query: (id) => ({
        url: `products/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Product', id },
        { type: 'Product', id: 'LIST' },
      ],
    }),

    bulkUpdateProducts: builder.mutation<
      void,
      Array<{ id: string; changes: Partial<Product> }>
    >({
      query: (updates) => ({
        url: 'products/bulk',
        method: 'PATCH',
        body: { updates },
      }),
      invalidatesTags: [{ type: 'Product', id: 'LIST' }],
    }),

    bulkDeleteProducts: builder.mutation<void, string[]>({
      query: (ids) => ({
        url: 'products/bulk',
        method: 'DELETE',
        body: { ids },
      }),
      invalidatesTags: [{ type: 'Product', id: 'LIST' }],
    }),

    // Collections
    getCollections: builder.query<Collection[], void>({
      query: () => 'collections',
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Collection' as const, id })),
              { type: 'Collection', id: 'LIST' },
            ]
          : [{ type: 'Collection', id: 'LIST' }],
    }),

    getCollection: builder.query<Collection, string>({
      query: (id) => `collections/${id}`,
      providesTags: (result, error, id) => [{ type: 'Collection', id }],
    }),

    createCollection: builder.mutation<Collection, Partial<Collection>>({
      query: (collection) => ({
        url: 'collections',
        method: 'POST',
        body: collection,
      }),
      invalidatesTags: [{ type: 'Collection', id: 'LIST' }],
    }),

    updateCollection: builder.mutation<
      Collection,
      { id: string; changes: Partial<Collection> }
    >({
      query: ({ id, changes }) => ({
        url: `collections/${id}`,
        method: 'PATCH',
        body: changes,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Collection', id },
        { type: 'Collection', id: 'LIST' },
      ],
    }),

    deleteCollection: builder.mutation<void, string>({
      query: (id) => ({
        url: `collections/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Collection', id },
        { type: 'Collection', id: 'LIST' },
      ],
    }),

    // Categories
    getCategories: builder.query<Category[], void>({
      query: () => 'categories',
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Category' as const, id })),
              { type: 'Category', id: 'LIST' },
            ]
          : [{ type: 'Category', id: 'LIST' }],
    }),

    getCategory: builder.query<Category, string>({
      query: (id) => `categories/${id}`,
      providesTags: (result, error, id) => [{ type: 'Category', id }],
    }),

    createCategory: builder.mutation<Category, Partial<Category>>({
      query: (category) => ({
        url: 'categories',
        method: 'POST',
        body: category,
      }),
      invalidatesTags: [{ type: 'Category', id: 'LIST' }],
    }),

    updateCategory: builder.mutation<
      Category,
      { id: string; changes: Partial<Category> }
    >({
      query: ({ id, changes }) => ({
        url: `categories/${id}`,
        method: 'PATCH',
        body: changes,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Category', id },
        { type: 'Category', id: 'LIST' },
      ],
    }),

    deleteCategory: builder.mutation<void, string>({
      query: (id) => ({
        url: `categories/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Category', id },
        { type: 'Category', id: 'LIST' },
      ],
    }),

    // Product search
    searchProducts: builder.query<Product[], string>({
      query: (searchTerm) => ({
        url: 'products/search',
        params: { q: searchTerm },
      }),
      providesTags: [{ type: 'Product', id: 'SEARCH' }],
    }),

    // Product analytics
    getProductAnalytics: builder.query<
      {
        totalProducts: number
        activeProducts: number
        lowStockProducts: number
        topSellingProducts: Product[]
        recentProducts: Product[]
      },
      void
    >({
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
  useLazySearchProductsQuery,
  useGetProductAnalyticsQuery,
} = productsApi