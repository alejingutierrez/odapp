import {
  createSlice,
  createEntityAdapter,
  PayloadAction,
} from '@reduxjs/toolkit'

import type { RootState } from '../index'

// Types
export interface Customer {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  avatar?: string
  status: 'active' | 'inactive' | 'blocked'
  tags: string[]
  addresses: CustomerAddress[]
  defaultAddressId?: string
  preferences: CustomerPreferences
  stats: CustomerStats
  segments: string[]
  loyaltyProgram?: LoyaltyProgram
  notes?: string
  source: 'web' | 'mobile' | 'pos' | 'shopify' | 'import' | 'manual'
  acceptsMarketing: boolean
  taxExempt: boolean
  createdAt: string
  updatedAt: string
  lastOrderAt?: string
  lastLoginAt?: string
}

export interface CustomerAddress {
  id: string
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
  isDefault: boolean
  type: 'shipping' | 'billing' | 'both'
}

export interface CustomerPreferences {
  language: string
  currency: string
  timezone: string
  notifications: {
    email: boolean
    sms: boolean
    push: boolean
  }
  marketing: {
    email: boolean
    sms: boolean
  }
  privacy: {
    dataProcessing: boolean
    analytics: boolean
    thirdParty: boolean
  }
}

export interface CustomerStats {
  totalOrders: number
  totalSpent: number
  averageOrderValue: number
  lifetimeValue: number
  firstOrderDate?: string
  lastOrderDate?: string
  orderFrequency: number
  returnRate: number
  loyaltyPoints: number
}

export interface LoyaltyProgram {
  id: string
  tier: 'bronze' | 'silver' | 'gold' | 'platinum'
  points: number
  pointsToNextTier: number
  benefits: string[]
  joinedAt: string
}

export interface CustomerSegment {
  id: string
  name: string
  description: string
  rules: SegmentRule[]
  customerCount: number
  createdAt: string
  updatedAt: string
}

export interface SegmentRule {
  field: string
  operator:
    | 'equals'
    | 'not_equals'
    | 'greater_than'
    | 'less_than'
    | 'contains'
    | 'not_contains'
  value: string | number
  logicalOperator?: 'and' | 'or'
}

export interface CustomerCommunication {
  id: string
  customerId: string
  type: 'email' | 'sms' | 'call' | 'note' | 'meeting'
  subject: string
  content: string
  direction: 'inbound' | 'outbound'
  status: 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'failed'
  channel: string
  createdBy: string
  createdAt: string
  scheduledAt?: string
  deliveredAt?: string
}

export interface CustomerFilters {
  search: string
  status: string[]
  segments: string[]
  tags: string[]
  source: string[]
  acceptsMarketing: boolean | null
  orderCountRange: [number, number] | null
  spentRange: [number, number] | null
  lastOrderRange: [string, string] | null
  createdRange: [string, string] | null
}

export interface CustomersState {
  customers: ReturnType<typeof customersAdapter.getInitialState>
  segments: ReturnType<typeof segmentsAdapter.getInitialState>
  communications: ReturnType<typeof communicationsAdapter.getInitialState>
  selectedCustomer: Customer | null
  selectedSegment: CustomerSegment | null
  selectedCommunication: CustomerCommunication | null
  filters: CustomerFilters
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
    customers: boolean
    segments: boolean
    communications: boolean
    details: boolean
    export: boolean
  }
  error: string | null
  stats: CustomersStats
}

export interface CustomersStats {
  totalCustomers: number
  activeCustomers: number
  newCustomersThisMonth: number
  averageLifetimeValue: number
  topSpenders: Customer[]
  recentCustomers: Customer[]
  segmentDistribution: Record<string, number>
}

// Entity adapters
const customersAdapter = createEntityAdapter<Customer>({
  sortComparer: (a, b) => b.updatedAt.localeCompare(a.updatedAt),
})

const segmentsAdapter = createEntityAdapter<CustomerSegment>({
  sortComparer: (a, b) => a.name.localeCompare(b.name),
})

const communicationsAdapter = createEntityAdapter<CustomerCommunication>({
  sortComparer: (a, b) => b.createdAt.localeCompare(a.createdAt),
})

// Initial state
const initialState: CustomersState = {
  customers: customersAdapter.getInitialState(),
  segments: segmentsAdapter.getInitialState(),
  communications: communicationsAdapter.getInitialState(),
  selectedCustomer: null,
  selectedSegment: null,
  selectedCommunication: null,
  filters: {
    search: '',
    status: [],
    segments: [],
    tags: [],
    source: [],
    acceptsMarketing: null,
    orderCountRange: null,
    spentRange: null,
    lastOrderRange: null,
    createdRange: null,
  },
  pagination: {
    page: 1,
    pageSize: 25,
    total: 0,
    totalPages: 0,
  },
  sorting: {
    field: 'updatedAt',
    order: 'desc',
  },
  loading: {
    customers: false,
    segments: false,
    communications: false,
    details: false,
    export: false,
  },
  error: null,
  stats: {
    totalCustomers: 0,
    activeCustomers: 0,
    newCustomersThisMonth: 0,
    averageLifetimeValue: 0,
    topSpenders: [],
    recentCustomers: [],
    segmentDistribution: {},
  },
}

// Customers slice
const customersSlice = createSlice({
  name: 'customers',
  initialState,
  reducers: {
    // Customer actions
    setCustomers: (state, action: PayloadAction<Customer[]>) => {
      customersAdapter.setAll(state.customers, action.payload)
    },

    addCustomer: (state, action: PayloadAction<Customer>) => {
      customersAdapter.addOne(state.customers, action.payload)
    },

    updateCustomer: (
      state,
      action: PayloadAction<{ id: string; changes: Partial<Customer> }>
    ) => {
      customersAdapter.updateOne(state.customers, action.payload)
    },

    removeCustomer: (state, action: PayloadAction<string>) => {
      customersAdapter.removeOne(state.customers, action.payload)
      if (state.selectedCustomer?.id === action.payload) {
        state.selectedCustomer = null
      }
    },

    setSelectedCustomer: (state, action: PayloadAction<Customer | null>) => {
      state.selectedCustomer = action.payload
    },

    // Customer stats updates
    updateCustomerStats: (
      state,
      action: PayloadAction<{ id: string; stats: Partial<CustomerStats> }>
    ) => {
      const { id, stats } = action.payload
      const customer = state.customers.entities[id]
      if (customer) {
        customer.stats = { ...customer.stats, ...stats }
        customer.updatedAt = new Date().toISOString()
      }
    },

    // Address management
    addCustomerAddress: (
      state,
      action: PayloadAction<{ customerId: string; address: CustomerAddress }>
    ) => {
      const { customerId, address } = action.payload
      const customer = state.customers.entities[customerId]
      if (customer) {
        customer.addresses.push(address)
        if (address.isDefault) {
          customer.defaultAddressId = address.id
          // Remove default from other addresses
          customer.addresses.forEach((addr) => {
            if (addr.id !== address.id) {
              addr.isDefault = false
            }
          })
        }
        customer.updatedAt = new Date().toISOString()
      }
    },

    updateCustomerAddress: (
      state,
      action: PayloadAction<{
        customerId: string
        addressId: string
        changes: Partial<CustomerAddress>
      }>
    ) => {
      const { customerId, addressId, changes } = action.payload
      const customer = state.customers.entities[customerId]
      if (customer) {
        const addressIndex = customer.addresses.findIndex(
          (addr) => addr.id === addressId
        )
        if (addressIndex !== -1) {
          customer.addresses[addressIndex] = {
            ...customer.addresses[addressIndex],
            ...changes,
          }
          if (changes.isDefault) {
            customer.defaultAddressId = addressId
            // Remove default from other addresses
            customer.addresses.forEach((addr, index) => {
              if (index !== addressIndex) {
                addr.isDefault = false
              }
            })
          }
          customer.updatedAt = new Date().toISOString()
        }
      }
    },

    removeCustomerAddress: (
      state,
      action: PayloadAction<{ customerId: string; addressId: string }>
    ) => {
      const { customerId, addressId } = action.payload
      const customer = state.customers.entities[customerId]
      if (customer) {
        customer.addresses = customer.addresses.filter(
          (addr) => addr.id !== addressId
        )
        if (customer.defaultAddressId === addressId) {
          customer.defaultAddressId = customer.addresses[0]?.id
          if (customer.addresses[0]) {
            customer.addresses[0].isDefault = true
          }
        }
        customer.updatedAt = new Date().toISOString()
      }
    },

    // Segments actions
    setSegments: (state, action: PayloadAction<CustomerSegment[]>) => {
      segmentsAdapter.setAll(state.segments, action.payload)
    },

    addSegment: (state, action: PayloadAction<CustomerSegment>) => {
      segmentsAdapter.addOne(state.segments, action.payload)
    },

    updateSegment: (
      state,
      action: PayloadAction<{ id: string; changes: Partial<CustomerSegment> }>
    ) => {
      segmentsAdapter.updateOne(state.segments, action.payload)
    },

    removeSegment: (state, action: PayloadAction<string>) => {
      segmentsAdapter.removeOne(state.segments, action.payload)
      if (state.selectedSegment?.id === action.payload) {
        state.selectedSegment = null
      }
    },

    setSelectedSegment: (
      state,
      action: PayloadAction<CustomerSegment | null>
    ) => {
      state.selectedSegment = action.payload
    },

    // Communications actions
    setCommunications: (
      state,
      action: PayloadAction<CustomerCommunication[]>
    ) => {
      communicationsAdapter.setAll(state.communications, action.payload)
    },

    addCommunication: (state, action: PayloadAction<CustomerCommunication>) => {
      communicationsAdapter.addOne(state.communications, action.payload)
    },

    updateCommunication: (
      state,
      action: PayloadAction<{
        id: string
        changes: Partial<CustomerCommunication>
      }>
    ) => {
      communicationsAdapter.updateOne(state.communications, action.payload)
    },

    setSelectedCommunication: (
      state,
      action: PayloadAction<CustomerCommunication | null>
    ) => {
      state.selectedCommunication = action.payload
    },

    // Filter actions
    setFilters: (state, action: PayloadAction<Partial<CustomerFilters>>) => {
      state.filters = { ...state.filters, ...action.payload }
    },

    clearFilters: (state) => {
      state.filters = initialState.filters
    },

    // Pagination actions
    setPagination: (
      state,
      action: PayloadAction<Partial<CustomersState['pagination']>>
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
        key: keyof CustomersState['loading']
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
    setStats: (state, action: PayloadAction<CustomersStats>) => {
      state.stats = action.payload
    },

    updateStats: (state, action: PayloadAction<Partial<CustomersStats>>) => {
      state.stats = { ...state.stats, ...action.payload }
    },

    // Bulk actions
    bulkUpdateCustomers: (
      state,
      action: PayloadAction<Array<{ id: string; changes: Partial<Customer> }>>
    ) => {
      customersAdapter.updateMany(state.customers, action.payload)
    },

    bulkUpdateCustomerStatus: (
      state,
      action: PayloadAction<{ ids: string[]; status: Customer['status'] }>
    ) => {
      const { ids, status } = action.payload
      const timestamp = new Date().toISOString()

      ids.forEach((id) => {
        const customer = state.customers.entities[id]
        if (customer) {
          customer.status = status
          customer.updatedAt = timestamp
        }
      })
    },

    bulkAddToSegment: (
      state,
      action: PayloadAction<{ customerIds: string[]; segmentId: string }>
    ) => {
      const { customerIds, segmentId } = action.payload
      const timestamp = new Date().toISOString()

      customerIds.forEach((id) => {
        const customer = state.customers.entities[id]
        if (customer && !customer.segments.includes(segmentId)) {
          customer.segments.push(segmentId)
          customer.updatedAt = timestamp
        }
      })
    },

    bulkRemoveFromSegment: (
      state,
      action: PayloadAction<{ customerIds: string[]; segmentId: string }>
    ) => {
      const { customerIds, segmentId } = action.payload
      const timestamp = new Date().toISOString()

      customerIds.forEach((id) => {
        const customer = state.customers.entities[id]
        if (customer) {
          customer.segments = customer.segments.filter(
            (seg) => seg !== segmentId
          )
          customer.updatedAt = timestamp
        }
      })
    },

    // Reset actions
    resetCustomersState: () => initialState,
  },
})

// Actions
export const {
  setCustomers,
  addCustomer,
  updateCustomer,
  removeCustomer,
  setSelectedCustomer,
  updateCustomerStats,
  addCustomerAddress,
  updateCustomerAddress,
  removeCustomerAddress,
  setSegments,
  addSegment,
  updateSegment,
  removeSegment,
  setSelectedSegment,
  setCommunications,
  addCommunication,
  updateCommunication,
  setSelectedCommunication,
  setFilters,
  clearFilters,
  setPagination,
  setSorting,
  setLoading,
  setError,
  clearError,
  setStats,
  updateStats,
  bulkUpdateCustomers,
  bulkUpdateCustomerStatus,
  bulkAddToSegment,
  bulkRemoveFromSegment,
  resetCustomersState,
} = customersSlice.actions

// Selectors
export const {
  selectAll: selectAllCustomers,
  selectById: selectCustomerById,
  selectIds: selectCustomerIds,
  selectEntities: selectCustomerEntities,
  selectTotal: selectCustomersTotal,
} = customersAdapter.getSelectors(
  (state: RootState) => state.customers.customers
)

export const {
  selectAll: selectAllSegments,
  selectById: selectSegmentById,
  selectIds: selectSegmentIds,
  selectEntities: selectSegmentEntities,
  selectTotal: selectSegmentsTotal,
} = segmentsAdapter.getSelectors((state: RootState) => state.customers.segments)

export const {
  selectAll: selectAllCommunications,
  selectById: selectCommunicationById,
  selectIds: selectCommunicationIds,
  selectEntities: selectCommunicationEntities,
  selectTotal: selectCommunicationsTotal,
} = communicationsAdapter.getSelectors(
  (state: RootState) => state.customers.communications
)

// Custom selectors
export const selectSelectedCustomer = (state: RootState) =>
  state.customers.selectedCustomer
export const selectSelectedSegment = (state: RootState) =>
  state.customers.selectedSegment
export const selectSelectedCommunication = (state: RootState) =>
  state.customers.selectedCommunication
export const selectCustomerFilters = (state: RootState) =>
  state.customers.filters
export const selectCustomerPagination = (state: RootState) =>
  state.customers.pagination
export const selectCustomerSorting = (state: RootState) =>
  state.customers.sorting
export const selectCustomersLoading = (state: RootState) =>
  state.customers.loading
export const selectCustomersError = (state: RootState) => state.customers.error
export const selectCustomersStats = (state: RootState) => state.customers.stats

// Filtered customers selector
export const selectFilteredCustomers = (state: RootState) => {
  const customers = selectAllCustomers(state)
  const filters = selectCustomerFilters(state)

  return customers.filter((customer) => {
    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      const matchesSearch =
        customer.email.toLowerCase().includes(searchTerm) ||
        `${customer.firstName} ${customer.lastName}`
          .toLowerCase()
          .includes(searchTerm) ||
        customer.phone?.toLowerCase().includes(searchTerm) ||
        customer.tags.some((tag) => tag.toLowerCase().includes(searchTerm))

      if (!matchesSearch) return false
    }

    // Status filter
    if (
      filters.status.length > 0 &&
      !filters.status.includes(customer.status)
    ) {
      return false
    }

    // Segments filter
    if (filters.segments.length > 0) {
      const hasMatchingSegment = customer.segments.some((segment) =>
        filters.segments.includes(segment)
      )
      if (!hasMatchingSegment) return false
    }

    // Tags filter
    if (filters.tags.length > 0) {
      const hasMatchingTag = customer.tags.some((tag) =>
        filters.tags.includes(tag)
      )
      if (!hasMatchingTag) return false
    }

    // Source filter
    if (
      filters.source.length > 0 &&
      !filters.source.includes(customer.source)
    ) {
      return false
    }

    // Marketing acceptance filter
    if (
      filters.acceptsMarketing !== null &&
      customer.acceptsMarketing !== filters.acceptsMarketing
    ) {
      return false
    }

    // Order count range filter
    if (filters.orderCountRange) {
      const [minOrders, maxOrders] = filters.orderCountRange
      if (
        customer.stats.totalOrders < minOrders ||
        customer.stats.totalOrders > maxOrders
      ) {
        return false
      }
    }

    // Spent range filter
    if (filters.spentRange) {
      const [minSpent, maxSpent] = filters.spentRange
      if (
        customer.stats.totalSpent < minSpent ||
        customer.stats.totalSpent > maxSpent
      ) {
        return false
      }
    }

    // Last order range filter
    if (filters.lastOrderRange && customer.lastOrderAt) {
      const [startDate, endDate] = filters.lastOrderRange
      const lastOrderDate = new Date(customer.lastOrderAt)
      if (
        lastOrderDate < new Date(startDate) ||
        lastOrderDate > new Date(endDate)
      ) {
        return false
      }
    }

    // Created range filter
    if (filters.createdRange) {
      const [startDate, endDate] = filters.createdRange
      const createdDate = new Date(customer.createdAt)
      if (
        createdDate < new Date(startDate) ||
        createdDate > new Date(endDate)
      ) {
        return false
      }
    }

    return true
  })
}

// Customers by segment selector
export const selectCustomersBySegment =
  (segmentId: string) => (state: RootState) => {
    const customers = selectAllCustomers(state)
    return customers.filter((customer) => customer.segments.includes(segmentId))
  }

// High value customers selector
export const selectHighValueCustomers =
  (threshold = 1000) =>
  (state: RootState) => {
    const customers = selectAllCustomers(state)
    return customers.filter(
      (customer) => customer.stats.lifetimeValue >= threshold
    )
  }

// Recent customers selector
export const selectRecentCustomers =
  (days = 30) =>
  (state: RootState) => {
    const customers = selectAllCustomers(state)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    return customers.filter(
      (customer) => new Date(customer.createdAt) >= cutoffDate
    )
  }

// Active customers selector
export const selectActiveCustomers = (state: RootState) => {
  const customers = selectAllCustomers(state)
  return customers.filter((customer) => customer.status === 'active')
}

// Customers with no orders selector
export const selectCustomersWithNoOrders = (state: RootState) => {
  const customers = selectAllCustomers(state)
  return customers.filter((customer) => customer.stats.totalOrders === 0)
}

// Communications by customer selector
export const selectCommunicationsByCustomer =
  (customerId: string) => (state: RootState) => {
    const communications = selectAllCommunications(state)
    return communications.filter(
      (communication) => communication.customerId === customerId
    )
  }

// Top spending customers selector
export const selectTopSpendingCustomers =
  (limit = 10) =>
  (state: RootState) => {
    const customers = selectAllCustomers(state)
    return [...customers]
      .sort((a, b) => b.stats.totalSpent - a.stats.totalSpent)
      .slice(0, limit)
  }

export default customersSlice.reducer
