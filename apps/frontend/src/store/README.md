# Redux Store Architecture

This directory contains the complete Redux store implementation for the Oda application, built with Redux Toolkit and RTK Query.

## Architecture Overview

The store follows modern Redux patterns with:

- **Redux Toolkit** for simplified Redux logic
- **RTK Query** for efficient API state management
- **Redux Persist** for state persistence
- **Entity Adapters** for normalized state management
- **TypeScript** for type safety throughout

## Directory Structure

```
src/store/
├── index.ts                 # Store configuration and setup
├── hooks.ts                 # Typed hooks for React components
├── Provider.tsx             # React Provider component
├── api/                     # RTK Query API definitions
│   ├── baseApi.ts          # Base API configuration
│   ├── productsApi.ts      # Products API endpoints
│   └── inventoryApi.ts     # Inventory API endpoints
├── slices/                  # Redux slices
│   ├── authSlice.ts        # Authentication state
│   ├── uiSlice.ts          # UI state management
│   ├── productsSlice.ts    # Products state with normalization
│   ├── inventorySlice.ts   # Inventory management state
│   ├── ordersSlice.ts      # Orders state management
│   └── customersSlice.ts   # Customer data state
├── __tests__/              # Store tests
└── examples/               # Usage examples
```

## Key Features

### 1. Type Safety

All slices, actions, and selectors are fully typed with TypeScript:

```typescript
// Typed hooks
export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

// Usage in components
const user = useAppSelector(selectCurrentUser)
const dispatch = useAppDispatch()
```

### 2. State Normalization

Entity adapters are used for normalized state management:

```typescript
const productsAdapter = createEntityAdapter<Product>({
  selectId: (product) => product.id,
  sortComparer: (a, b) => b.updatedAt.localeCompare(a.updatedAt),
})

// Provides normalized CRUD operations
export const {
  selectAll: selectAllProducts,
  selectById: selectProductById,
  selectIds: selectProductIds,
} = productsAdapter.getSelectors((state: RootState) => state.products.products)
```

### 3. RTK Query Integration

Efficient API state management with automatic caching:

```typescript
export const productsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProducts: builder.query<ProductsResponse, ProductsQuery>({
      query: (params) => ({ url: 'products', params }),
      providesTags: ['Product'],
    }),
    createProduct: builder.mutation<Product, CreateProductRequest>({
      query: (product) => ({
        url: 'products',
        method: 'POST',
        body: product,
      }),
      invalidatesTags: ['Product'],
    }),
  }),
})
```

### 4. State Persistence

Critical state is persisted using Redux Persist:

```typescript
const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth', 'ui'], // Only persist auth and UI state
  blacklist: ['api'], // Don't persist API cache
}
```

### 5. Middleware Stack

Custom middleware for enhanced functionality:

- **Session Management**: Automatic session expiry handling
- **Error Handling**: Global error handling for API calls
- **Authentication**: Token refresh and logout on 401 errors
- **Notifications**: Automatic error notifications

## Store Slices

### Auth Slice (`authSlice.ts`)

Manages user authentication and session state:

- User profile and permissions
- JWT token management
- Session expiry tracking
- User preferences
- Async thunks for login/logout/refresh

**Key Actions:**

- `loginUser` - Authenticate user
- `logoutUser` - Clear session
- `refreshToken` - Refresh JWT token
- `updateUserProfile` - Update user data

**Key Selectors:**

- `selectCurrentUser` - Get current user
- `selectIsAuthenticated` - Check auth status
- `selectHasPermission` - Check user permissions

### UI Slice (`uiSlice.ts`)

Manages global UI state:

- Layout state (sidebar, theme)
- Modal management
- Loading states
- Notifications
- Filters and search
- Connection status

**Key Actions:**

- `toggleSidebar` - Toggle sidebar visibility
- `addNotification` - Add notification
- `openModal` / `closeModal` - Modal management
- `setLoading` - Set loading states

### Products Slice (`productsSlice.ts`)

Manages product catalog with normalization:

- Products, collections, categories
- Advanced filtering and search
- Pagination and sorting
- Bulk operations

**Key Features:**

- Entity normalization for performance
- Complex filtering logic
- Relationship management (products ↔ collections)

### Inventory Slice (`inventorySlice.ts`)

Manages inventory and stock levels:

- Multi-location inventory
- Real-time stock updates
- Adjustments and transfers
- Alerts and notifications

### Orders Slice (`ordersSlice.ts`)

Manages order lifecycle:

- Order status tracking
- Payment and fulfillment status
- Returns and refunds
- Order analytics

### Customers Slice (`customersSlice.ts`)

Manages customer data (CRM/CDP):

- Customer profiles and preferences
- Segmentation and analytics
- Communication history
- Address management

## Usage Patterns

### 1. Basic State Access

```typescript
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { selectCurrentUser, loginUser } from '@/store/slices/authSlice'

const MyComponent = () => {
  const dispatch = useAppDispatch()
  const user = useAppSelector(selectCurrentUser)

  const handleLogin = async () => {
    await dispatch(loginUser(credentials)).unwrap()
  }

  return <div>Welcome, {user?.firstName}!</div>
}
```

### 2. RTK Query Usage

```typescript
import { useGetProductsQuery, useCreateProductMutation } from '@/store/api/productsApi'

const ProductList = () => {
  const { data, isLoading, error } = useGetProductsQuery({
    page: 1,
    pageSize: 20,
  })

  const [createProduct, { isLoading: creating }] = useCreateProductMutation()

  if (isLoading) return <Spinner />
  if (error) return <ErrorMessage />

  return (
    <div>
      {data?.products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
```

### 3. Complex Selectors

```typescript
import { createSelector } from '@reduxjs/toolkit'
import {
  selectAllProducts,
  selectProductFilters,
} from '@/store/slices/productsSlice'

// Memoized filtered products selector
const selectFilteredProducts = createSelector(
  [selectAllProducts, selectProductFilters],
  (products, filters) => {
    return products.filter((product) => {
      // Complex filtering logic
      if (filters.search && !product.name.includes(filters.search)) {
        return false
      }
      // ... more filters
      return true
    })
  }
)
```

### 4. Async Actions with Error Handling

```typescript
const handleAsyncAction = async () => {
  try {
    const result = await dispatch(someAsyncAction(data)).unwrap()

    dispatch(
      addNotification({
        type: 'success',
        title: 'Success',
        message: 'Operation completed successfully',
      })
    )
  } catch (error) {
    dispatch(
      addNotification({
        type: 'error',
        title: 'Error',
        message: error.message || 'Operation failed',
      })
    )
  }
}
```

## Testing

The store includes comprehensive tests:

- **Unit tests** for each slice
- **Integration tests** for store configuration
- **Async action tests** with mocked API calls
- **Selector tests** for complex filtering logic

Run tests with:

```bash
pnpm test src/store
```

## Performance Considerations

1. **Normalization**: Entity adapters provide O(1) lookups
2. **Memoization**: Selectors are memoized with Reselect
3. **Code Splitting**: API slices can be loaded on demand
4. **Persistence**: Only critical state is persisted
5. **Cache Management**: RTK Query handles automatic cache invalidation

## Best Practices

1. **Use typed hooks** instead of raw Redux hooks
2. **Prefer RTK Query** for server state management
3. **Use entity adapters** for normalized collections
4. **Create memoized selectors** for derived state
5. **Handle async actions** with proper error handling
6. **Use the `unwrap()` method** to handle promise rejections
7. **Keep slices focused** on single domains
8. **Use proper TypeScript types** throughout

## Migration Guide

When adding new features:

1. **Create API endpoints** in appropriate API slice
2. **Add state management** in relevant slice
3. **Create selectors** for data access
4. **Add actions** for state mutations
5. **Write tests** for new functionality
6. **Update types** as needed

## Debugging

The store includes Redux DevTools integration:

- **Time-travel debugging** in development
- **Action replay** and state inspection
- **Performance monitoring** with trace enabled
- **Custom middleware** for logging and debugging

Access DevTools in browser development tools when running in development mode.
