/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest'
import { configureStore } from '@reduxjs/toolkit'
import productsReducer, {
  setProducts,
  addProduct,
  updateProduct,
  removeProduct,
  setSelectedProduct,
  setCollections,
  addCollection,
  setCategories,
  setFilters,
  clearFilters,
  setSearch,
  setPagination,
  setSorting,
  bulkUpdateProducts,
  bulkRemoveProducts,
  selectAllProducts,
  selectProductById,
  selectSelectedProduct,
  selectProductFilters,
  selectFilteredProducts,
  selectProductsByCollection,
  selectLowStockProducts,
  type Product,
  type Collection,
  type Category,
  type ProductsState,
} from '../productsSlice'

const mockProduct: Product = {
  id: '1',
  name: 'Test Product',
  description: 'Test product description',
  slug: 'test-product',
  sku: 'TEST-001',
  status: 'active',
  type: 'simple',
  category: 'electronics',
  tags: ['test', 'electronics'],
  images: [
    {
      id: '1',
      url: 'https://example.com/image.jpg',
      alt: 'Test image',
      position: 1,
    },
  ],
  variants: [],
  collections: ['collection-1'],
  seo: {
    title: 'Test Product SEO Title',
    description: 'Test product SEO description',
  },
  pricing: {
    basePrice: 99.99,
    compareAtPrice: 129.99,
    taxable: true,
  },
  inventory: {
    tracked: true,
    quantity: 50,
    policy: 'deny',
    lowStockThreshold: 10,
  },
  shipping: {
    requiresShipping: true,
  },
  attributes: [],
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
}

const mockCollection: Collection = {
  id: 'collection-1',
  name: 'Test Collection',
  slug: 'test-collection',
  productCount: 5,
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
}

const mockCategory: Category = {
  id: 'category-1',
  name: 'Electronics',
  slug: 'electronics',
  productCount: 10,
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
}

const createTestStore = (initialState?: Partial<ProductsState>) => {
  return configureStore({
    reducer: {
      products: productsReducer as any,
    },
    preloadedState: initialState ? { products: initialState } : undefined,
  })
}

describe('productsSlice', () => {
  describe('product actions', () => {
    it('should set products', () => {
      const store = createTestStore()
      const products = [mockProduct]

      store.dispatch(setProducts(products))

      const state = store.getState().products
      expect(selectAllProducts({ products: state } as any)).toEqual(products)
    })

    it('should add product', () => {
      const store = createTestStore()

      store.dispatch(addProduct(mockProduct))

      const state = store.getState().products
      expect(selectProductById({ products: state } as any, '1')).toEqual(mockProduct)
    })

    it('should update product', () => {
      const store = createTestStore()
      store.dispatch(addProduct(mockProduct))

      const changes = { name: 'Updated Product Name' }
      store.dispatch(updateProduct({ id: '1', changes }))

      const state = store.getState().products
      const updatedProduct = selectProductById({ products: state } as any, '1')
      expect(updatedProduct?.name).toBe('Updated Product Name')
    })

    it('should remove product', () => {
      const store = createTestStore()
      store.dispatch(addProduct(mockProduct))
      store.dispatch(setSelectedProduct(mockProduct))

      store.dispatch(removeProduct('1'))

      const state = store.getState().products
      expect(selectProductById({ products: state } as any, '1')).toBeUndefined()
      expect(selectSelectedProduct({ products: state } as any)).toBeNull()
    })

    it('should set selected product', () => {
      const store = createTestStore()

      store.dispatch(setSelectedProduct(mockProduct))

      const state = store.getState().products
      expect(selectSelectedProduct({ products: state } as any)).toEqual(mockProduct)
    })

    it('should bulk update products', () => {
      const store = createTestStore()
      const product2 = { ...mockProduct, id: '2', name: 'Product 2' }
      store.dispatch(setProducts([mockProduct, product2]))

      const updates = [
        { id: '1', changes: { name: 'Updated Product 1' } },
        { id: '2', changes: { name: 'Updated Product 2' } },
      ]
      store.dispatch(bulkUpdateProducts(updates))

      const state = store.getState().products
      const updatedProduct1 = selectProductById({ products: state } as any, '1')
      const updatedProduct2 = selectProductById({ products: state } as any, '2')

      expect(updatedProduct1?.name).toBe('Updated Product 1')
      expect(updatedProduct2?.name).toBe('Updated Product 2')
    })

    it('should bulk remove products', () => {
      const store = createTestStore()
      const product2 = { ...mockProduct, id: '2', name: 'Product 2' }
      const product3 = { ...mockProduct, id: '3', name: 'Product 3' }
      store.dispatch(setProducts([mockProduct, product2, product3]))
      store.dispatch(setSelectedProduct(mockProduct))

      store.dispatch(bulkRemoveProducts(['1', '2']))

      const state = store.getState().products
      const allProducts = selectAllProducts({ products: state } as any)

      expect(allProducts).toHaveLength(1)
      expect(allProducts[0].id).toBe('3')
      expect(selectSelectedProduct({ products: state } as any)).toBeNull()
    })
  })

  describe('collection actions', () => {
    it('should set collections', () => {
      const store = createTestStore()
      const collections = [mockCollection]

      store.dispatch(setCollections(collections))

      const state = (store.getState() as any).products
      expect(state.collections.ids).toContain('collection-1')
    })

    it('should add collection', () => {
      const store = createTestStore()

      store.dispatch(addCollection(mockCollection))

      const state = (store.getState() as any).products
      expect(state.collections.entities['collection-1']).toEqual(mockCollection)
    })
  })

  describe('category actions', () => {
    it('should set categories', () => {
      const store = createTestStore()
      const categories = [mockCategory]

      store.dispatch(setCategories(categories))

      const state = (store.getState() as any).products
      expect(state.categories.ids).toContain('category-1')
    })
  })

  describe('filter actions', () => {
    it('should set filters', () => {
      const store = createTestStore()
      const filters = { search: 'test', status: ['active'] }

      store.dispatch(setFilters(filters))

      const state = store.getState().products
      expect(selectProductFilters({ products: state } as any)).toMatchObject(filters)
    })

    it('should clear filters', () => {
      const store = createTestStore({
        filters: {
          search: 'test',
          status: ['active'],
          category: [],
          collections: [],
          tags: [],
          priceRange: null,
          inStock: null,
          dateRange: null,
        },
      })

      store.dispatch(clearFilters())

      const state = store.getState().products
      const filters = selectProductFilters({ products: state } as any)
      expect(filters.search).toBe('')
      expect(filters.status).toEqual([])
    })

    it('should set search', () => {
      const store = createTestStore()

      store.dispatch(setSearch('test search'))

      const state = store.getState().products
      expect(selectProductFilters({ products: state } as any).search).toBe(
        'test search'
      )
    })
  })

  describe('pagination and sorting', () => {
    it('should set pagination', () => {
      const store = createTestStore()
      const pagination = { page: 2, pageSize: 50, total: 100, totalPages: 2 }

      store.dispatch(setPagination(pagination))

      const state = (store.getState() as any).products
      expect(state.pagination).toEqual(pagination)
    })

    it('should set sorting', () => {
      const store = createTestStore()
      const sorting = { field: 'name', order: 'asc' as const }

      store.dispatch(setSorting(sorting))

      const state = (store.getState() as any).products
      expect(state.sorting).toEqual(sorting)
    })
  })

  describe('selectors', () => {
    it('should filter products by search term', () => {
      const store = createTestStore()
      const product2 = {
        ...mockProduct,
        id: '2',
        name: 'Another Product',
        description: 'Another product description',
        sku: 'OTHER-001',
        tags: ['other', 'different'],
      }
      store.dispatch(setProducts([mockProduct, product2]))
      store.dispatch(setFilters({ search: 'TEST-001' }))

      const state = store.getState().products
      const filteredProducts = selectFilteredProducts({ products: state } as any)

      expect(filteredProducts).toHaveLength(1)
      expect(filteredProducts[0].name).toBe('Test Product')
    })

    it('should filter products by status', () => {
      const store = createTestStore()
      const draftProduct = { ...mockProduct, id: '2', status: 'draft' as const }
      store.dispatch(setProducts([mockProduct, draftProduct]))
      store.dispatch(setFilters({ status: ['active'] }))

      const state = store.getState().products
      const filteredProducts = selectFilteredProducts({ products: state } as any)

      expect(filteredProducts).toHaveLength(1)
      expect(filteredProducts[0].status).toBe('active')
    })

    it('should filter products by category', () => {
      const store = createTestStore()
      const clothingProduct = { ...mockProduct, id: '2', category: 'clothing' }
      store.dispatch(setProducts([mockProduct, clothingProduct]))
      store.dispatch(setFilters({ category: ['electronics'] }))

      const state = store.getState().products
      const filteredProducts = selectFilteredProducts({ products: state } as any)

      expect(filteredProducts).toHaveLength(1)
      expect(filteredProducts[0].category).toBe('electronics')
    })

    it('should filter products by price range', () => {
      const store = createTestStore()
      const expensiveProduct = {
        ...mockProduct,
        id: '2',
        pricing: { ...mockProduct.pricing, basePrice: 200 },
      }
      store.dispatch(setProducts([mockProduct, expensiveProduct]))
      store.dispatch(setFilters({ priceRange: [50, 150] }))

      const state = store.getState().products
      const filteredProducts = selectFilteredProducts({ products: state } as any)

      expect(filteredProducts).toHaveLength(1)
      expect(filteredProducts[0].pricing.basePrice).toBe(99.99)
    })

    it('should filter products by stock status', () => {
      const store = createTestStore()
      const outOfStockProduct = {
        ...mockProduct,
        id: '2',
        inventory: { ...mockProduct.inventory, quantity: 0 },
      }
      store.dispatch(setProducts([mockProduct, outOfStockProduct]))
      store.dispatch(setFilters({ inStock: true }))

      const state = store.getState().products
      const filteredProducts = selectFilteredProducts({ products: state } as any)

      expect(filteredProducts).toHaveLength(1)
      expect(filteredProducts[0].inventory.quantity).toBeGreaterThan(0)
    })

    it('should select products by collection', () => {
      const store = createTestStore()
      const product2 = {
        ...mockProduct,
        id: '2',
        collections: ['collection-2'],
      }
      store.dispatch(setProducts([mockProduct, product2]))

      const state = store.getState().products
      const collectionProducts = selectProductsByCollection('collection-1')({
        products: state,
      } as any)

      expect(collectionProducts).toHaveLength(1)
      expect(collectionProducts[0].id).toBe('1')
    })

    it('should select low stock products', () => {
      const store = createTestStore()
      const lowStockProduct = {
        ...mockProduct,
        id: '2',
        inventory: {
          ...mockProduct.inventory,
          quantity: 5,
          lowStockThreshold: 10,
        },
      }
      const highStockProduct = {
        ...mockProduct,
        id: '3',
        inventory: {
          ...mockProduct.inventory,
          quantity: 20,
          lowStockThreshold: 10,
        },
      }
      store.dispatch(
        setProducts([mockProduct, lowStockProduct, highStockProduct])
      )

      const state = store.getState().products
      const lowStockProducts = selectLowStockProducts({ products: state } as any)

      expect(lowStockProducts).toHaveLength(1)
      expect(lowStockProducts[0].id).toBe('2')
    })
  })
})
