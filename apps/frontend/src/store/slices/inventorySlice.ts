import {
  createSlice,
  createEntityAdapter,
  PayloadAction,
} from '@reduxjs/toolkit'
import type { RootState } from '../index'

// Types
export interface InventoryItem {
  id: string
  productId: string
  variantId?: string
  sku: string
  locationId: string
  quantity: number
  reserved: number
  available: number
  committed: number
  onHand: number
  cost?: number
  lastUpdated: string
  updatedBy: string
}

export interface InventoryLocation {
  id: string
  name: string
  address: string
  type: 'warehouse' | 'store' | 'supplier' | 'virtual'
  active: boolean
  priority: number
  settings: LocationSettings
  createdAt: string
  updatedAt: string
}

export interface LocationSettings {
  allowNegativeStock: boolean
  autoReorderEnabled: boolean
  reorderPoint: number
  reorderQuantity: number
  maxStock?: number
  fulfillmentPriority: number
}

export interface InventoryAdjustment {
  id: string
  type: 'adjustment' | 'transfer' | 'recount' | 'damage' | 'return'
  status: 'pending' | 'approved' | 'rejected' | 'completed'
  items: AdjustmentItem[]
  reason: string
  notes?: string
  approvedBy?: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface AdjustmentItem {
  inventoryItemId: string
  quantityChange: number
  newQuantity: number
  reason: string
  cost?: number
}

export interface InventoryTransfer {
  id: string
  fromLocationId: string
  toLocationId: string
  status: 'pending' | 'in_transit' | 'completed' | 'cancelled'
  items: TransferItem[]
  trackingNumber?: string
  notes?: string
  createdBy: string
  createdAt: string
  updatedAt: string
  completedAt?: string
}

export interface TransferItem {
  inventoryItemId: string
  quantity: number
  received?: number
}

export interface InventoryAlert {
  id: string
  type: 'low_stock' | 'out_of_stock' | 'overstock' | 'negative_stock'
  severity: 'low' | 'medium' | 'high' | 'critical'
  inventoryItemId: string
  message: string
  threshold?: number
  currentValue: number
  acknowledged: boolean
  acknowledgedBy?: string
  acknowledgedAt?: string
  createdAt: string
}

export interface InventoryFilters {
  search: string
  locations: string[]
  products: string[]
  stockStatus: ('in_stock' | 'low_stock' | 'out_of_stock')[]
  lastUpdated: [string, string] | null
}

export interface InventoryState {
  items: ReturnType<typeof inventoryAdapter.getInitialState>
  locations: ReturnType<typeof locationsAdapter.getInitialState>
  adjustments: ReturnType<typeof adjustmentsAdapter.getInitialState>
  transfers: ReturnType<typeof transfersAdapter.getInitialState>
  alerts: ReturnType<typeof alertsAdapter.getInitialState>
  selectedItem: InventoryItem | null
  selectedLocation: InventoryLocation | null
  selectedAdjustment: InventoryAdjustment | null
  selectedTransfer: InventoryTransfer | null
  filters: InventoryFilters
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
    items: boolean
    locations: boolean
    adjustments: boolean
    transfers: boolean
    alerts: boolean
  }
  error: string | null
  realTimeUpdates: boolean
}

// Entity adapters
const inventoryAdapter = createEntityAdapter<InventoryItem>({
  sortComparer: (a, b) => b.lastUpdated.localeCompare(a.lastUpdated),
})

const locationsAdapter = createEntityAdapter<InventoryLocation>({
  sortComparer: (a, b) => a.priority - b.priority,
})

const adjustmentsAdapter = createEntityAdapter<InventoryAdjustment>({
  sortComparer: (a, b) => b.createdAt.localeCompare(a.createdAt),
})

const transfersAdapter = createEntityAdapter<InventoryTransfer>({
  sortComparer: (a, b) => b.createdAt.localeCompare(a.createdAt),
})

const alertsAdapter = createEntityAdapter<InventoryAlert>({
  sortComparer: (a, b) => {
    // Sort by severity first, then by creation date
    const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
    const severityDiff = severityOrder[b.severity] - severityOrder[a.severity]
    if (severityDiff !== 0) return severityDiff
    return b.createdAt.localeCompare(a.createdAt)
  },
})

// Initial state
const initialState: InventoryState = {
  items: inventoryAdapter.getInitialState(),
  locations: locationsAdapter.getInitialState(),
  adjustments: adjustmentsAdapter.getInitialState(),
  transfers: transfersAdapter.getInitialState(),
  alerts: alertsAdapter.getInitialState(),
  selectedItem: null,
  selectedLocation: null,
  selectedAdjustment: null,
  selectedTransfer: null,
  filters: {
    search: '',
    locations: [],
    products: [],
    stockStatus: [],
    lastUpdated: null,
  },
  pagination: {
    page: 1,
    pageSize: 50,
    total: 0,
    totalPages: 0,
  },
  sorting: {
    field: 'lastUpdated',
    order: 'desc',
  },
  loading: {
    items: false,
    locations: false,
    adjustments: false,
    transfers: false,
    alerts: false,
  },
  error: null,
  realTimeUpdates: true,
}

// Inventory slice
const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    // Inventory items actions
    setInventoryItems: (state, action: PayloadAction<InventoryItem[]>) => {
      inventoryAdapter.setAll(state.items, action.payload)
    },

    addInventoryItem: (state, action: PayloadAction<InventoryItem>) => {
      inventoryAdapter.addOne(state.items, action.payload)
    },

    updateInventoryItem: (
      state,
      action: PayloadAction<{ id: string; changes: Partial<InventoryItem> }>
    ) => {
      inventoryAdapter.updateOne(state.items, action.payload)
    },

    removeInventoryItem: (state, action: PayloadAction<string>) => {
      inventoryAdapter.removeOne(state.items, action.payload)
      if (state.selectedItem?.id === action.payload) {
        state.selectedItem = null
      }
    },

    setSelectedItem: (state, action: PayloadAction<InventoryItem | null>) => {
      state.selectedItem = action.payload
    },

    // Real-time inventory updates
    updateInventoryQuantity: (
      state,
      action: PayloadAction<{ id: string; quantity: number; reserved?: number }>
    ) => {
      const { id, quantity, reserved } = action.payload
      const item = state.items.entities[id]
      if (item) {
        item.quantity = quantity
        if (reserved !== undefined) {
          item.reserved = reserved
        }
        item.available = item.quantity - item.reserved
        item.lastUpdated = new Date().toISOString()
      }
    },

    // Locations actions
    setLocations: (state, action: PayloadAction<InventoryLocation[]>) => {
      locationsAdapter.setAll(state.locations, action.payload)
    },

    addLocation: (state, action: PayloadAction<InventoryLocation>) => {
      locationsAdapter.addOne(state.locations, action.payload)
    },

    updateLocation: (
      state,
      action: PayloadAction<{ id: string; changes: Partial<InventoryLocation> }>
    ) => {
      locationsAdapter.updateOne(state.locations, action.payload)
    },

    removeLocation: (state, action: PayloadAction<string>) => {
      locationsAdapter.removeOne(state.locations, action.payload)
      if (state.selectedLocation?.id === action.payload) {
        state.selectedLocation = null
      }
    },

    setSelectedLocation: (
      state,
      action: PayloadAction<InventoryLocation | null>
    ) => {
      state.selectedLocation = action.payload
    },

    // Adjustments actions
    setAdjustments: (state, action: PayloadAction<InventoryAdjustment[]>) => {
      adjustmentsAdapter.setAll(state.adjustments, action.payload)
    },

    addAdjustment: (state, action: PayloadAction<InventoryAdjustment>) => {
      adjustmentsAdapter.addOne(state.adjustments, action.payload)
    },

    updateAdjustment: (
      state,
      action: PayloadAction<{
        id: string
        changes: Partial<InventoryAdjustment>
      }>
    ) => {
      adjustmentsAdapter.updateOne(state.adjustments, action.payload)
    },

    setSelectedAdjustment: (
      state,
      action: PayloadAction<InventoryAdjustment | null>
    ) => {
      state.selectedAdjustment = action.payload
    },

    // Transfers actions
    setTransfers: (state, action: PayloadAction<InventoryTransfer[]>) => {
      transfersAdapter.setAll(state.transfers, action.payload)
    },

    addTransfer: (state, action: PayloadAction<InventoryTransfer>) => {
      transfersAdapter.addOne(state.transfers, action.payload)
    },

    updateTransfer: (
      state,
      action: PayloadAction<{ id: string; changes: Partial<InventoryTransfer> }>
    ) => {
      transfersAdapter.updateOne(state.transfers, action.payload)
    },

    setSelectedTransfer: (
      state,
      action: PayloadAction<InventoryTransfer | null>
    ) => {
      state.selectedTransfer = action.payload
    },

    // Alerts actions
    setAlerts: (state, action: PayloadAction<InventoryAlert[]>) => {
      alertsAdapter.setAll(state.alerts, action.payload)
    },

    addAlert: (state, action: PayloadAction<InventoryAlert>) => {
      alertsAdapter.addOne(state.alerts, action.payload)
    },

    updateAlert: (
      state,
      action: PayloadAction<{ id: string; changes: Partial<InventoryAlert> }>
    ) => {
      alertsAdapter.updateOne(state.alerts, action.payload)
    },

    removeAlert: (state, action: PayloadAction<string>) => {
      alertsAdapter.removeOne(state.alerts, action.payload)
    },

    acknowledgeAlert: (
      state,
      action: PayloadAction<{ id: string; acknowledgedBy: string }>
    ) => {
      const { id, acknowledgedBy } = action.payload
      const alert = state.alerts.entities[id]
      if (alert) {
        alert.acknowledged = true
        alert.acknowledgedBy = acknowledgedBy
        alert.acknowledgedAt = new Date().toISOString()
      }
    },

    // Filter actions
    setFilters: (state, action: PayloadAction<Partial<InventoryFilters>>) => {
      state.filters = { ...state.filters, ...action.payload }
    },

    clearFilters: (state) => {
      state.filters = initialState.filters
    },

    // Pagination actions
    setPagination: (
      state,
      action: PayloadAction<Partial<InventoryState['pagination']>>
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
        key: keyof InventoryState['loading']
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

    // Real-time updates
    setRealTimeUpdates: (state, action: PayloadAction<boolean>) => {
      state.realTimeUpdates = action.payload
    },

    // Bulk actions
    bulkUpdateInventory: (
      state,
      action: PayloadAction<
        Array<{ id: string; changes: Partial<InventoryItem> }>
      >
    ) => {
      inventoryAdapter.updateMany(state.items, action.payload)
    },

    bulkAcknowledgeAlerts: (
      state,
      action: PayloadAction<{ ids: string[]; acknowledgedBy: string }>
    ) => {
      const { ids, acknowledgedBy } = action.payload
      const timestamp = new Date().toISOString()

      ids.forEach((id) => {
        const alert = state.alerts.entities[id]
        if (alert) {
          alert.acknowledged = true
          alert.acknowledgedBy = acknowledgedBy
          alert.acknowledgedAt = timestamp
        }
      })
    },

    // Reset actions
    resetInventoryState: () => initialState,
  },
})

// Actions
export const {
  setInventoryItems,
  addInventoryItem,
  updateInventoryItem,
  removeInventoryItem,
  setSelectedItem,
  updateInventoryQuantity,
  setLocations,
  addLocation,
  updateLocation,
  removeLocation,
  setSelectedLocation,
  setAdjustments,
  addAdjustment,
  updateAdjustment,
  setSelectedAdjustment,
  setTransfers,
  addTransfer,
  updateTransfer,
  setSelectedTransfer,
  setAlerts,
  addAlert,
  updateAlert,
  removeAlert,
  acknowledgeAlert,
  setFilters,
  clearFilters,
  setPagination,
  setSorting,
  setLoading,
  setError,
  clearError,
  setRealTimeUpdates,
  bulkUpdateInventory,
  bulkAcknowledgeAlerts,
  resetInventoryState,
} = inventorySlice.actions

// Selectors
export const {
  selectAll: selectAllInventoryItems,
  selectById: selectInventoryItemById,
  selectIds: selectInventoryItemIds,
  selectEntities: selectInventoryItemEntities,
  selectTotal: selectInventoryItemsTotal,
} = inventoryAdapter.getSelectors((state: RootState) => state.inventory.items)

export const {
  selectAll: selectAllLocations,
  selectById: selectLocationById,
  selectIds: selectLocationIds,
  selectEntities: selectLocationEntities,
  selectTotal: selectLocationsTotal,
} = locationsAdapter.getSelectors(
  (state: RootState) => state.inventory.locations
)

export const {
  selectAll: selectAllAdjustments,
  selectById: selectAdjustmentById,
  selectIds: selectAdjustmentIds,
  selectEntities: selectAdjustmentEntities,
  selectTotal: selectAdjustmentsTotal,
} = adjustmentsAdapter.getSelectors(
  (state: RootState) => state.inventory.adjustments
)

export const {
  selectAll: selectAllTransfers,
  selectById: selectTransferById,
  selectIds: selectTransferIds,
  selectEntities: selectTransferEntities,
  selectTotal: selectTransfersTotal,
} = transfersAdapter.getSelectors(
  (state: RootState) => state.inventory.transfers
)

export const {
  selectAll: selectAllAlerts,
  selectById: selectAlertById,
  selectIds: selectAlertIds,
  selectEntities: selectAlertEntities,
  selectTotal: selectAlertsTotal,
} = alertsAdapter.getSelectors((state: RootState) => state.inventory.alerts)

// Custom selectors
export const selectSelectedItem = (state: RootState) =>
  state.inventory.selectedItem
export const selectSelectedLocation = (state: RootState) =>
  state.inventory.selectedLocation
export const selectSelectedAdjustment = (state: RootState) =>
  state.inventory.selectedAdjustment
export const selectSelectedTransfer = (state: RootState) =>
  state.inventory.selectedTransfer

export const selectInventoryFilters = (state: RootState) =>
  state.inventory.filters
export const selectInventoryPagination = (state: RootState) =>
  state.inventory.pagination
export const selectInventorySorting = (state: RootState) =>
  state.inventory.sorting
export const selectInventoryLoading = (state: RootState) =>
  state.inventory.loading
export const selectInventoryError = (state: RootState) => state.inventory.error
export const selectRealTimeUpdates = (state: RootState) =>
  state.inventory.realTimeUpdates

// Filtered inventory items selector
export const selectFilteredInventoryItems = (state: RootState) => {
  const items = selectAllInventoryItems(state)
  const filters = selectInventoryFilters(state)

  return items.filter((item) => {
    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      if (!item.sku.toLowerCase().includes(searchTerm)) {
        return false
      }
    }

    // Location filter
    if (
      filters.locations.length > 0 &&
      !filters.locations.includes(item.locationId)
    ) {
      return false
    }

    // Product filter
    if (
      filters.products.length > 0 &&
      !filters.products.includes(item.productId)
    ) {
      return false
    }

    // Stock status filter
    if (filters.stockStatus.length > 0) {
      const stockStatus = item.available > 0 ? 'in_stock' : 'out_of_stock'
      // Add low stock logic here if needed
      if (!filters.stockStatus.includes(stockStatus)) {
        return false
      }
    }

    // Last updated filter
    if (filters.lastUpdated) {
      const [startDate, endDate] = filters.lastUpdated
      const itemDate = new Date(item.lastUpdated)
      if (itemDate < new Date(startDate) || itemDate > new Date(endDate)) {
        return false
      }
    }

    return true
  })
}

// Inventory by location selector
export const selectInventoryByLocation =
  (locationId: string) => (state: RootState) => {
    const items = selectAllInventoryItems(state)
    return items.filter((item) => item.locationId === locationId)
  }

// Low stock items selector
export const selectLowStockItems = (state: RootState) => {
  const items = selectAllInventoryItems(state)
  const locations = selectAllLocations(state)
  const locationMap = new Map(locations.map((loc) => [loc.id, loc]))

  return items.filter((item) => {
    const location = locationMap.get(item.locationId)
    if (!location) return false

    const reorderPoint = location.settings.reorderPoint || 10
    return item.available <= reorderPoint
  })
}

// Out of stock items selector
export const selectOutOfStockItems = (state: RootState) => {
  const items = selectAllInventoryItems(state)
  return items.filter((item) => item.available <= 0)
}

// Unacknowledged alerts selector
export const selectUnacknowledgedAlerts = (state: RootState) => {
  const alerts = selectAllAlerts(state)
  return alerts.filter((alert) => !alert.acknowledged)
}

// Critical alerts selector
export const selectCriticalAlerts = (state: RootState) => {
  const alerts = selectAllAlerts(state)
  return alerts.filter(
    (alert) => alert.severity === 'critical' && !alert.acknowledged
  )
}

// Pending adjustments selector
export const selectPendingAdjustments = (state: RootState) => {
  const adjustments = selectAllAdjustments(state)
  return adjustments.filter((adjustment) => adjustment.status === 'pending')
}

// Active transfers selector
export const selectActiveTransfers = (state: RootState) => {
  const transfers = selectAllTransfers(state)
  return transfers.filter(
    (transfer) =>
      transfer.status === 'pending' || transfer.status === 'in_transit'
  )
}

export default inventorySlice.reducer
