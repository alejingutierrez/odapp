import {
  createSlice,
  createEntityAdapter,
  PayloadAction,
} from '@reduxjs/toolkit'

import type { RootState } from '../index'

// Types
export interface Order {
  id: string
  orderNumber: string
  status: OrderStatus
  customerId: string
  customerInfo: CustomerInfo
  items: OrderItem[]
  shipping: ShippingInfo
  billing: BillingInfo
  payment: PaymentInfo
  totals: OrderTotals
  dates: OrderDates
  notes?: string
  tags: string[]
  source: 'web' | 'mobile' | 'pos' | 'shopify' | 'manual'
  fulfillmentStatus: FulfillmentStatus
  financialStatus: FinancialStatus
  riskLevel: 'low' | 'medium' | 'high'
  createdAt: string
  updatedAt: string
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded'
  | 'returned'

export type FulfillmentStatus =
  | 'unfulfilled'
  | 'partial'
  | 'fulfilled'
  | 'cancelled'

export type FinancialStatus =
  | 'pending'
  | 'authorized'
  | 'paid'
  | 'partial'
  | 'refunded'
  | 'voided'

export interface CustomerInfo {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
}

export interface OrderItem {
  id: string
  productId: string
  variantId?: string
  sku: string
  title: string
  variantTitle?: string
  quantity: number
  price: number
  compareAtPrice?: number
  totalDiscount: number
  taxLines: TaxLine[]
  fulfillmentService: string
  fulfillmentStatus: FulfillmentStatus
  image?: string
  properties?: OrderItemProperty[]
}

export interface OrderItemProperty {
  name: string
  value: string
}

export interface TaxLine {
  title: string
  rate: number
  amount: number
}

export interface ShippingInfo {
  address: Address
  method: ShippingMethod
  trackingNumber?: string
  trackingUrl?: string
  carrier?: string
  estimatedDelivery?: string
  actualDelivery?: string
}

export interface Address {
  firstName: string
  lastName: string
  company?: string
  address1: string
  address2?: string
  city: string
  province: string
  country: string
  zip: string
  phone?: string
}

export interface ShippingMethod {
  id: string
  title: string
  price: number
  code: string
  source: string
}

export interface BillingInfo {
  address: Address
  method: PaymentMethod
}

export interface PaymentMethod {
  id: string
  type:
    | 'credit_card'
    | 'debit_card'
    | 'paypal'
    | 'bank_transfer'
    | 'cash'
    | 'other'
  gateway: string
  last4?: string
  brand?: string
}

export interface PaymentInfo {
  transactions: PaymentTransaction[]
  totalPaid: number
  totalRefunded: number
  totalOutstanding: number
}

export interface PaymentTransaction {
  id: string
  type: 'payment' | 'refund' | 'void' | 'authorization'
  status: 'pending' | 'success' | 'failed' | 'cancelled'
  amount: number
  currency: string
  gateway: string
  reference?: string
  createdAt: string
}

export interface OrderTotals {
  subtotal: number
  totalTax: number
  totalShipping: number
  totalDiscount: number
  total: number
  currency: string
}

export interface OrderDates {
  createdAt: string
  updatedAt: string
  confirmedAt?: string
  shippedAt?: string
  deliveredAt?: string
  cancelledAt?: string
}

export interface OrderReturn {
  id: string
  orderId: string
  status: 'pending' | 'approved' | 'rejected' | 'completed'
  reason: string
  items: ReturnItem[]
  refundAmount: number
  restockFee?: number
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface ReturnItem {
  orderItemId: string
  quantity: number
  reason: string
  condition: 'new' | 'used' | 'damaged'
  restockable: boolean
}

export interface OrderFilters {
  search: string
  status: OrderStatus[]
  fulfillmentStatus: FulfillmentStatus[]
  financialStatus: FinancialStatus[]
  source: string[]
  dateRange: [string, string] | null
  amountRange: [number, number] | null
  customerId?: string
}

export interface OrdersState {
  orders: ReturnType<typeof ordersAdapter.getInitialState>
  returns: ReturnType<typeof returnsAdapter.getInitialState>
  selectedOrder: Order | null
  selectedReturn: OrderReturn | null
  filters: OrderFilters
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
    orders: boolean
    returns: boolean
    details: boolean
    actions: boolean
  }
  error: string | null
  stats: OrderStats
}

export interface OrderStats {
  totalOrders: number
  totalRevenue: number
  averageOrderValue: number
  pendingOrders: number
  processingOrders: number
  shippedOrders: number
  deliveredOrders: number
  cancelledOrders: number
  returnedOrders: number
}

// Entity adapters
const ordersAdapter = createEntityAdapter<Order>({
  sortComparer: (a, b) => b.createdAt.localeCompare(a.createdAt),
})

const returnsAdapter = createEntityAdapter<OrderReturn>({
  sortComparer: (a, b) => b.createdAt.localeCompare(a.createdAt),
})

// Initial state
const initialState: OrdersState = {
  orders: ordersAdapter.getInitialState(),
  returns: returnsAdapter.getInitialState(),
  selectedOrder: null,
  selectedReturn: null,
  filters: {
    search: '',
    status: [],
    fulfillmentStatus: [],
    financialStatus: [],
    source: [],
    dateRange: null,
    amountRange: null,
  },
  pagination: {
    page: 1,
    pageSize: 25,
    total: 0,
    totalPages: 0,
  },
  sorting: {
    field: 'createdAt',
    order: 'desc',
  },
  loading: {
    orders: false,
    returns: false,
    details: false,
    actions: false,
  },
  error: null,
  stats: {
    totalOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    pendingOrders: 0,
    processingOrders: 0,
    shippedOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    returnedOrders: 0,
  },
}

// Orders slice
const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    // Orders actions
    setOrders: (state, action: PayloadAction<Order[]>) => {
      ordersAdapter.setAll(state.orders, action.payload)
    },

    addOrder: (state, action: PayloadAction<Order>) => {
      ordersAdapter.addOne(state.orders, action.payload)
    },

    updateOrder: (
      state,
      action: PayloadAction<{ id: string; changes: Partial<Order> }>
    ) => {
      ordersAdapter.updateOne(state.orders, action.payload)
    },

    removeOrder: (state, action: PayloadAction<string>) => {
      ordersAdapter.removeOne(state.orders, action.payload)
      if (state.selectedOrder?.id === action.payload) {
        state.selectedOrder = null
      }
    },

    setSelectedOrder: (state, action: PayloadAction<Order | null>) => {
      state.selectedOrder = action.payload
    },

    // Order status updates
    updateOrderStatus: (
      state,
      action: PayloadAction<{
        id: string
        status: OrderStatus
        timestamp?: string
      }>
    ) => {
      const { id, status, timestamp } = action.payload
      const order = state.orders.entities[id]
      if (order) {
        order.status = status
        order.updatedAt = timestamp || new Date().toISOString()

        // Update specific date fields based on status
        switch (status) {
          case 'confirmed':
            order.dates.confirmedAt = order.updatedAt
            break
          case 'shipped':
            order.dates.shippedAt = order.updatedAt
            break
          case 'delivered':
            order.dates.deliveredAt = order.updatedAt
            break
          case 'cancelled':
            order.dates.cancelledAt = order.updatedAt
            break
        }
      }
    },

    updateFulfillmentStatus: (
      state,
      action: PayloadAction<{
        id: string
        fulfillmentStatus: FulfillmentStatus
      }>
    ) => {
      const { id, fulfillmentStatus } = action.payload
      const order = state.orders.entities[id]
      if (order) {
        order.fulfillmentStatus = fulfillmentStatus
        order.updatedAt = new Date().toISOString()
      }
    },

    updateFinancialStatus: (
      state,
      action: PayloadAction<{ id: string; financialStatus: FinancialStatus }>
    ) => {
      const { id, financialStatus } = action.payload
      const order = state.orders.entities[id]
      if (order) {
        order.financialStatus = financialStatus
        order.updatedAt = new Date().toISOString()
      }
    },

    // Tracking updates
    updateTrackingInfo: (
      state,
      action: PayloadAction<{
        id: string
        trackingNumber: string
        trackingUrl?: string
        carrier?: string
      }>
    ) => {
      const { id, trackingNumber, trackingUrl, carrier } = action.payload
      const order = state.orders.entities[id]
      if (order) {
        order.shipping.trackingNumber = trackingNumber
        if (trackingUrl) order.shipping.trackingUrl = trackingUrl
        if (carrier) order.shipping.carrier = carrier
        order.updatedAt = new Date().toISOString()
      }
    },

    // Returns actions
    setReturns: (state, action: PayloadAction<OrderReturn[]>) => {
      returnsAdapter.setAll(state.returns, action.payload)
    },

    addReturn: (state, action: PayloadAction<OrderReturn>) => {
      returnsAdapter.addOne(state.returns, action.payload)
    },

    updateReturn: (
      state,
      action: PayloadAction<{ id: string; changes: Partial<OrderReturn> }>
    ) => {
      returnsAdapter.updateOne(state.returns, action.payload)
    },

    setSelectedReturn: (state, action: PayloadAction<OrderReturn | null>) => {
      state.selectedReturn = action.payload
    },

    // Filter actions
    setFilters: (state, action: PayloadAction<Partial<OrderFilters>>) => {
      state.filters = { ...state.filters, ...action.payload }
    },

    clearFilters: (state) => {
      state.filters = initialState.filters
    },

    // Pagination actions
    setPagination: (
      state,
      action: PayloadAction<Partial<OrdersState['pagination']>>
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
      action: PayloadAction<{
        key: keyof OrdersState['loading']
        loading: boolean
      }>
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

    // Stats actions
    setStats: (state, action: PayloadAction<OrderStats>) => {
      state.stats = action.payload
    },

    updateStats: (state, action: PayloadAction<Partial<OrderStats>>) => {
      state.stats = { ...state.stats, ...action.payload }
    },

    // Bulk actions
    bulkUpdateOrders: (
      state,
      action: PayloadAction<Array<{ id: string; changes: Partial<Order> }>>
    ) => {
      ordersAdapter.updateMany(state.orders, action.payload)
    },

    bulkUpdateOrderStatus: (
      state,
      action: PayloadAction<{ ids: string[]; status: OrderStatus }>
    ) => {
      const { ids, status } = action.payload
      const timestamp = new Date().toISOString()

      ids.forEach((id) => {
        const order = state.orders.entities[id]
        if (order) {
          order.status = status
          order.updatedAt = timestamp
        }
      })
    },

    // Reset actions
    resetOrdersState: () => initialState,
  },
})

// Actions
export const {
  setOrders,
  addOrder,
  updateOrder,
  removeOrder,
  setSelectedOrder,
  updateOrderStatus,
  updateFulfillmentStatus,
  updateFinancialStatus,
  updateTrackingInfo,
  setReturns,
  addReturn,
  updateReturn,
  setSelectedReturn,
  setFilters,
  clearFilters,
  setPagination,
  setSorting,
  setLoading,
  setError,
  clearError,
  setStats,
  updateStats,
  bulkUpdateOrders,
  bulkUpdateOrderStatus,
  resetOrdersState,
} = ordersSlice.actions

// Selectors
export const {
  selectAll: selectAllOrders,
  selectById: selectOrderById,
  selectIds: selectOrderIds,
  selectEntities: selectOrderEntities,
  selectTotal: selectOrdersTotal,
} = ordersAdapter.getSelectors((state: RootState) => state.orders.orders)

export const {
  selectAll: selectAllReturns,
  selectById: selectReturnById,
  selectIds: selectReturnIds,
  selectEntities: selectReturnEntities,
  selectTotal: selectReturnsTotal,
} = returnsAdapter.getSelectors((state: RootState) => state.orders.returns)

// Custom selectors
export const selectSelectedOrder = (state: RootState) =>
  state.orders.selectedOrder
export const selectSelectedReturn = (state: RootState) =>
  state.orders.selectedReturn
export const selectOrderFilters = (state: RootState) => state.orders.filters
export const selectOrderPagination = (state: RootState) =>
  state.orders.pagination
export const selectOrderSorting = (state: RootState) => state.orders.sorting
export const selectOrdersLoading = (state: RootState) => state.orders.loading
export const selectOrdersError = (state: RootState) => state.orders.error
export const selectOrderStats = (state: RootState) => state.orders.stats

// Filtered orders selector
export const selectFilteredOrders = (state: RootState) => {
  const orders = selectAllOrders(state)
  const filters = selectOrderFilters(state)

  return orders.filter((order) => {
    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      const matchesSearch =
        order.orderNumber.toLowerCase().includes(searchTerm) ||
        order.customerInfo.email.toLowerCase().includes(searchTerm) ||
        `${order.customerInfo.firstName} ${order.customerInfo.lastName}`
          .toLowerCase()
          .includes(searchTerm) ||
        order.items.some(
          (item) =>
            item.title.toLowerCase().includes(searchTerm) ||
            item.sku.toLowerCase().includes(searchTerm)
        )

      if (!matchesSearch) return false
    }

    // Status filters
    if (filters.status.length > 0 && !filters.status.includes(order.status)) {
      return false
    }

    if (
      filters.fulfillmentStatus.length > 0 &&
      !filters.fulfillmentStatus.includes(order.fulfillmentStatus)
    ) {
      return false
    }

    if (
      filters.financialStatus.length > 0 &&
      !filters.financialStatus.includes(order.financialStatus)
    ) {
      return false
    }

    // Source filter
    if (filters.source.length > 0 && !filters.source.includes(order.source)) {
      return false
    }

    // Date range filter
    if (filters.dateRange) {
      const [startDate, endDate] = filters.dateRange
      const orderDate = new Date(order.createdAt)
      if (orderDate < new Date(startDate) || orderDate > new Date(endDate)) {
        return false
      }
    }

    // Amount range filter
    if (filters.amountRange) {
      const [minAmount, maxAmount] = filters.amountRange
      if (order.totals.total < minAmount || order.totals.total > maxAmount) {
        return false
      }
    }

    // Customer filter
    if (filters.customerId && order.customerId !== filters.customerId) {
      return false
    }

    return true
  })
}

// Orders by status selectors
export const selectOrdersByStatus =
  (status: OrderStatus) => (state: RootState) => {
    const orders = selectAllOrders(state)
    return orders.filter((order) => order.status === status)
  }

export const selectPendingOrders = (state: RootState) => {
  const orders = selectAllOrders(state)
  return orders.filter((order) => order.status === 'pending')
}

export const selectProcessingOrders = (state: RootState) => {
  const orders = selectAllOrders(state)
  return orders.filter((order) => order.status === 'processing')
}

export const selectShippedOrders = (state: RootState) => {
  const orders = selectAllOrders(state)
  return orders.filter((order) => order.status === 'shipped')
}

// Orders by customer selector
export const selectOrdersByCustomer =
  (customerId: string) => (state: RootState) => {
    const orders = selectAllOrders(state)
    return orders.filter((order) => order.customerId === customerId)
  }

// Recent orders selector
export const selectRecentOrders =
  (limit = 10) =>
  (state: RootState) => {
    const orders = selectAllOrders(state)
    return orders.slice(0, limit)
  }

// High value orders selector
export const selectHighValueOrders =
  (threshold = 1000) =>
  (state: RootState) => {
    const orders = selectAllOrders(state)
    return orders.filter((order) => order.totals.total >= threshold)
  }

// Returns by order selector
export const selectReturnsByOrder = (orderId: string) => (state: RootState) => {
  const returns = selectAllReturns(state)
  return returns.filter((orderReturn) => orderReturn.orderId === orderId)
}

// Pending returns selector
export const selectPendingReturns = (state: RootState) => {
  const returns = selectAllReturns(state)
  return returns.filter((orderReturn) => orderReturn.status === 'pending')
}

export default ordersSlice.reducer
