import { createSlice, createEntityAdapter, PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '../index'

// Types
export interface Product {
  id: string
  name: string
  description: string
  slug: string
  sku: string
  status: 'active' | 'draft' | 'archived'
  type: 'simple' | 'variable'
  category: string
  tags: string[]
  images: ProductImage[]
  variants: ProductVariant[]
  collections: string[]
  seo: ProductSEO
  pricing: ProductPricing
  inventory: ProductInventory
  shipping: ProductShipping
  attributes: ProductAttribute[]
  createdAt: string
  updatedAt: string
  publishedAt?: string
}

export interface ProductImage {
  id: string
  url: string
  alt: string
  position: number
  width?: number
  height?: number
}

export interface ProductVariant {
  id: string
  sku: string
  title: string
  price: number
  compareAtPrice?: number
  cost?: number
  position: number
  options: VariantOption[]
  inventory: VariantInventory
  image?: ProductImage
  weight?: number
  dimensions?: ProductDimensions
  barcode?: string
}

export interface VariantOption {
  name: string
  value: string
}

export interface VariantInventory {
  quantity: number
  tracked: boolean
  policy: 'deny' | 'continue'
  reserved: number
  available: number
}

export interface ProductSEO {
  title?: string
  description?: string
  keywords?: string[]
}

export interface ProductPricing {
  basePrice: number
  compareAtPrice?: number
  cost?: number
  margin?: number
  taxable: boolean
  taxCode?: string
}

export interface ProductInventory {
  tracked: boolean
  quantity: number
  policy: 'deny' | 'continue'
  lowStockThreshold?: number
}

export interface ProductShipping {
  weight?: number
  dimensions?: ProductDimensions
  requiresShipping: boolean
  shippingClass?: string
}

export interface ProductDimensions {
  length: number
  width: number
  height: number
  unit: 'cm' | 'in'
}

export interface ProductAttribute {
  name: string
  value: string
  visible: boolean
  variation: boolean
}

export interface Collection {
  id: string
  name: string
  description?: string
  slug: string
  image?: ProductImage
  rules?: CollectionRule[]
  productCount: number
  createdAt: string
  updatedAt: string
}

export interface CollectionRule {
  field: string
  operator: 'equals' | 'contains' | 'starts_with' | 'ends_with' | 'greater_than' | 'less_than'
  value: string
}

export interface Category {
  id: string
  name: string
  description?: string
  slug: string
  parentId?: string
  image?: ProductImage
  productCount: number
  children?: Category[]
  createdAt: string
  updatedAt: string
}

export interface ProductFilters {
  search: string
  status: string[]
  category: string[]
  collections: string[]
  tags: string[]
  priceRange: [number, number] | null
  inStock: boolean | null
  dateRange: [string, string] | null
}

export interface ProductsState {
  products: ReturnType<typeof productsAdapter.getInitialState>
  collections: ReturnType<typeof collectionsAdapter.getInitialState>
  categories: ReturnType<typeof categoriesAdapter.getInitialState>
  selectedProduct: Product | null
  selectedCollection: Collection | null
  selectedCategory: Category | null
  filters: ProductFilters
  searchResults: string[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
  sorting: {
    field: string
    order: 'asc' | 'desc'
  }
  loading: {
    products: boolean
    collections: boolean
    categories: boolean
    search: boolean
  }
  error: string | null
}

// Entity adapters for normalization
const productsAdapter = createEntityAdapter<Product>({
  selectId: (product) => product.id,
  sortComparer: (a, b) => b.updatedAt.localeCompare(a.updatedAt),
})

const collectionsAdapter = createEntityAdapter<Collection>({
  selectId: (collection) => collection.id,
  sortComparer: (a, b) => a.name.localeCompare(b.name),
})

const categoriesAdapter = createEntityAdapter<Category>({
  selectId: (category) => category.id,
  sortComparer: (a, b) => a.name.localeCompare(b.name),
})

// Initial state
const initialState: ProductsState = {
  products: productsAdapter.getInitialState(),
  collections: collectionsAdapter.getInitialState(),
  categories: categoriesAdapter.getInitialState(),
  selectedProduct: null,
  selectedCollection: null,
  selectedCategory: null,
  filters: {
    search: '',
    status: [],
    category: [],
    collections: [],
    tags: [],
    priceRange: null,
    inStock: null,
    dateRange: null,
  },
  searchResults: [],
  pagination: {
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  },
  sorting: {
    field: 'updatedAt',
    order: 'desc',
  },
  loading: {
    products: false,
    collections: false,
    categories: false,
    search: false,
  },
  error: null,
}

// Products slice
const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    // Product actions
    setProducts: (state, action: PayloadAction<Product[]>) => {
      productsAdapter.setAll(state.products, action.payload)
    },

    addProduct: (state, action: PayloadAction<Product>) => {
      productsAdapter.addOne(state.products, action.payload)
    },

    updateProduct: (state, action: PayloadAction<{ id: string; changes: Partial<Product> }>) => {
      productsAdapter.updateOne(state.products, action.payload)
    },

    removeProduct: (state, action: PayloadAction<string>) => {
      productsAdapter.removeOne(state.products, action.payload)
      // Clear selection if deleted product was selected
      if (state.selectedProduct?.id === action.payload) {
        state.selectedProduct = null
      }
    },

    setSelectedProduct: (state, action: PayloadAction<Product | null>) => {
      state.selectedProduct = action.payload
    },

    // Collection actions
    setCollections: (state, action: PayloadAction<Collection[]>) => {
      collectionsAdapter.setAll(state.collections, action.payload)
    },

    addCollection: (state, action: PayloadAction<Collection>) => {
      collectionsAdapter.addOne(state.collections, action.payload)
    },

    updateCollection: (state, action: PayloadAction<{ id: string; changes: Partial<Collection> }>) => {
      collectionsAdapter.updateOne(state.collections, action.payload)
    },

    removeCollection: (state, action: PayloadAction<string>) => {
      collectionsAdapter.removeOne(state.collections, action.payload)
      if (state.selectedCollection?.id === action.payload) {
        state.selectedCollection = null
      }
    },

    setSelectedCollection: (state, action: PayloadAction<Collection | null>) => {
      state.selectedCollection = action.payload
    },

    // Category actions
    setCategories: (state, action: PayloadAction<Category[]>) => {
      categoriesAdapter.setAll(state.categories, action.payload)
    },

    addCategory: (state, action: PayloadAction<Category>) => {
      categoriesAdapter.addOne(state.categories, action.payload)
    },

    updateCategory: (state, action: PayloadAction<{ id: string; changes: Partial<Category> }>) => {
      categoriesAdapter.updateOne(state.categories, action.payload)
    },

    removeCategory: (state, action: PayloadAction<string>) => {
      categoriesAdapter.removeOne(state.categories, action.payload)
      if (state.selectedCategory?.id === action.payload) {
        state.selectedCategory = null
      }
    },

    setSelectedCategory: (state, action: PayloadAction<Category | null>) => {
      state.selectedCategory = action.payload
    },

    // Filter actions
    setFilters: (state, action: PayloadAction<Partial<ProductFilters>>) => {
      state.filters = { ...state.filters, ...action.payload }
    },

    clearFilters: (state) => {
      state.filters = initialState.filters
    },

    setSearch: (state, action: PayloadAction<string>) => {
      state.filters.search = action.payload
    },

    setSearchResults: (state, action: PayloadAction<string[]>) => {
      state.searchResults = action.payload
    },

    // Pagination actions
    setPagination: (
      state,
      action: PayloadAction<Partial<ProductsState['pagination']>>
    ) => {
      state.pagination = { ...state.pagination, ...action.payload }
    },

    // Sorting actions
    setSorting: (
      state,
      action: PayloadAction<{ field: string; order: 'asc' | 'desc' }>
    ) => {
      state.sorting = action.payload
    },

    // Loading actions
    setLoading: (
      state,
      action: PayloadAction<{ key: keyof ProductsState['loading']; loading: boolean }>
    ) => {
      const { key, loading } = action.payload
      state.loading[key] = loading
    },

    // Error actions
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },

    clearError: (state) => {
      state.error = null
    },

    // Bulk actions
    bulkUpdateProducts: (
      state,
      action: PayloadAction<Array<{ id: string; changes: Partial<Product> }>>
    ) => {
      productsAdapter.updateMany(state.products, action.payload)
    },

    bulkRemoveProducts: (state, action: PayloadAction<string[]>) => {
      productsAdapter.removeMany(state.products, action.payload)
      // Clear selection if any deleted product was selected
      if (state.selectedProduct && action.payload.includes(state.selectedProduct.id)) {
        state.selectedProduct = null
      }
    },

    // Reset actions
    resetProductsState: () => initialState,
  },
})

// Actions
export const {
  setProducts,
  addProduct,
  updateProduct,
  removeProduct,
  setSelectedProduct,
  setCollections,
  addCollection,
  updateCollection,
  removeCollection,
  setSelectedCollection,
  setCategories,
  addCategory,
  updateCategory,
  removeCategory,
  setSelectedCategory,
  setFilters,
  clearFilters,
  setSearch,
  setSearchResults,
  setPagination,
  setSorting,
  setLoading,
  setError,
  clearError,
  bulkUpdateProducts,
  bulkRemoveProducts,
  resetProductsState,
} = productsSlice.actions

// Selectors
export const {
  selectAll: selectAllProducts,
  selectById: selectProductById,
  selectIds: selectProductIds,
  selectEntities: selectProductEntities,
  selectTotal: selectProductsTotal,
} = productsAdapter.getSelectors((state: RootState) => state.products.products)

export const {
  selectAll: selectAllCollections,
  selectById: selectCollectionById,
  selectIds: selectCollectionIds,
  selectEntities: selectCollectionEntities,
  selectTotal: selectCollectionsTotal,
} = collectionsAdapter.getSelectors((state: RootState) => state.products.collections)

export const {
  selectAll: selectAllCategories,
  selectById: selectCategoryById,
  selectIds: selectCategoryIds,
  selectEntities: selectCategoryEntities,
  selectTotal: selectCategoriesTotal,
} = categoriesAdapter.getSelectors((state: RootState) => state.products.categories)

// Custom selectors
export const selectSelectedProduct = (state: RootState) => state.products.selectedProduct
export const selectSelectedCollection = (state: RootState) => state.products.selectedCollection
export const selectSelectedCategory = (state: RootState) => state.products.selectedCategory

export const selectProductFilters = (state: RootState) => state.products.filters
export const selectSearchResults = (state: RootState) => state.products.searchResults
export const selectProductPagination = (state: RootState) => state.products.pagination
export const selectProductSorting = (state: RootState) => state.products.sorting
export const selectProductsLoading = (state: RootState) => state.products.loading
export const selectProductsError = (state: RootState) => state.products.error

// Filtered products selector
export const selectFilteredProducts = (state: RootState) => {
  const products = selectAllProducts(state)
  const filters = selectProductFilters(state)
  
  return products.filter((product) => {
    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      const matchesSearch = 
        product.name.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm) ||
        product.sku.toLowerCase().includes(searchTerm) ||
        product.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      
      if (!matchesSearch) return false
    }
    
    // Status filter
    if (filters.status.length > 0 && !filters.status.includes(product.status)) {
      return false
    }
    
    // Category filter
    if (filters.category.length > 0 && !filters.category.includes(product.category)) {
      return false
    }
    
    // Collections filter
    if (filters.collections.length > 0) {
      const hasMatchingCollection = product.collections.some(collection =>
        filters.collections.includes(collection)
      )
      if (!hasMatchingCollection) return false
    }
    
    // Tags filter
    if (filters.tags.length > 0) {
      const hasMatchingTag = product.tags.some(tag =>
        filters.tags.includes(tag)
      )
      if (!hasMatchingTag) return false
    }
    
    // Price range filter
    if (filters.priceRange) {
      const [minPrice, maxPrice] = filters.priceRange
      if (product.pricing.basePrice < minPrice || product.pricing.basePrice > maxPrice) {
        return false
      }
    }
    
    // In stock filter
    if (filters.inStock !== null) {
      const isInStock = product.inventory.quantity > 0
      if (filters.inStock !== isInStock) return false
    }
    
    // Date range filter
    if (filters.dateRange) {
      const [startDate, endDate] = filters.dateRange
      const productDate = new Date(product.createdAt)
      if (productDate < new Date(startDate) || productDate > new Date(endDate)) {
        return false
      }
    }
    
    return true
  })
}

// Products by collection selector
export const selectProductsByCollection = (collectionId: string) => (state: RootState) => {
  const products = selectAllProducts(state)
  return products.filter(product => product.collections.includes(collectionId))
}

// Products by category selector
export const selectProductsByCategory = (categoryId: string) => (state: RootState) => {
  const products = selectAllProducts(state)
  return products.filter(product => product.category === categoryId)
}

// Low stock products selector
export const selectLowStockProducts = (state: RootState) => {
  const products = selectAllProducts(state)
  return products.filter(product => {
    if (!product.inventory.tracked) return false
    const threshold = product.inventory.lowStockThreshold || 10
    return product.inventory.quantity <= threshold
  })
}

// Category tree selector
export const selectCategoryTree = (state: RootState) => {
  const categories = selectAllCategories(state)
  const categoryMap = new Map(categories.map(cat => [cat.id, { ...cat, children: [] }]))
  const rootCategories: Category[] = []
  
  categories.forEach(category => {
    const categoryWithChildren = categoryMap.get(category.id)!
    if (category.parentId) {
      const parent = categoryMap.get(category.parentId)
      if (parent) {
        parent.children = parent.children || []
        parent.children.push(categoryWithChildren)
      }
    } else {
      rootCategories.push(categoryWithChildren)
    }
  })
  
  return rootCategories
}

export default productsSlice.reducer