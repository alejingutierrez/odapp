import { baseApi } from './baseApi'
import type {
  InventoryItem,
  InventoryLocation,
  InventoryAdjustment,
  InventoryTransfer,
  InventoryAlert,
} from '../slices/inventorySlice'

export interface InventoryQuery {
  page?: number
  pageSize?: number
  search?: string
  locationId?: string
  productId?: string
  stockStatus?: ('in_stock' | 'low_stock' | 'out_of_stock')[]
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface InventoryResponse {
  items: InventoryItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface UpdateInventoryRequest {
  quantity?: number
  reserved?: number
  cost?: number
  reason?: string
}

export interface CreateAdjustmentRequest {
  type: 'adjustment' | 'recount' | 'damage' | 'return'
  items: Array<{
    inventoryItemId: string
    quantityChange: number
    reason: string
    cost?: number
  }>
  reason: string
  notes?: string
}

export interface CreateTransferRequest {
  fromLocationId: string
  toLocationId: string
  items: Array<{
    inventoryItemId: string
    quantity: number
  }>
  notes?: string
}

export const inventoryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Inventory items
    getInventoryItems: builder.query<InventoryResponse, InventoryQuery>({
      query: (params) => ({
        url: 'inventory',
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: 'Inventory' as const, id })),
              { type: 'Inventory', id: 'LIST' },
            ]
          : [{ type: 'Inventory', id: 'LIST' }],
    }),

    getInventoryItem: builder.query<InventoryItem, string>({
      query: (id) => `inventory/${id}`,
      providesTags: (result, error, id) => [{ type: 'Inventory', id }],
    }),

    updateInventoryItem: builder.mutation<
      InventoryItem,
      { id: string } & UpdateInventoryRequest
    >({
      query: ({ id, ...patch }) => ({
        url: `inventory/${id}`,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Inventory', id },
        { type: 'Inventory', id: 'LIST' },
      ],
    }),

    bulkUpdateInventory: builder.mutation<
      void,
      Array<{ id: string } & UpdateInventoryRequest>
    >({
      query: (updates) => ({
        url: 'inventory/bulk',
        method: 'PATCH',
        body: { updates },
      }),
      invalidatesTags: [{ type: 'Inventory', id: 'LIST' }],
    }),

    // Locations
    getLocations: builder.query<InventoryLocation[], void>({
      query: () => 'inventory/locations',
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Location' as const, id })),
              { type: 'Location', id: 'LIST' },
            ]
          : [{ type: 'Location', id: 'LIST' }],
    }),

    getLocation: builder.query<InventoryLocation, string>({
      query: (id) => `inventory/locations/${id}`,
      providesTags: (result, error, id) => [{ type: 'Location', id }],
    }),

    createLocation: builder.mutation<InventoryLocation, Partial<InventoryLocation>>({
      query: (location) => ({
        url: 'inventory/locations',
        method: 'POST',
        body: location,
      }),
      invalidatesTags: [{ type: 'Location', id: 'LIST' }],
    }),

    updateLocation: builder.mutation<
      InventoryLocation,
      { id: string; changes: Partial<InventoryLocation> }
    >({
      query: ({ id, changes }) => ({
        url: `inventory/locations/${id}`,
        method: 'PATCH',
        body: changes,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Location', id },
        { type: 'Location', id: 'LIST' },
      ],
    }),

    deleteLocation: builder.mutation<void, string>({
      query: (id) => ({
        url: `inventory/locations/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Location', id },
        { type: 'Location', id: 'LIST' },
      ],
    }),

    // Adjustments
    getAdjustments: builder.query<InventoryAdjustment[], void>({
      query: () => 'inventory/adjustments',
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Adjustment' as const, id })),
              { type: 'Adjustment', id: 'LIST' },
            ]
          : [{ type: 'Adjustment', id: 'LIST' }],
    }),

    getAdjustment: builder.query<InventoryAdjustment, string>({
      query: (id) => `inventory/adjustments/${id}`,
      providesTags: (result, error, id) => [{ type: 'Adjustment', id }],
    }),

    createAdjustment: builder.mutation<InventoryAdjustment, CreateAdjustmentRequest>({
      query: (adjustment) => ({
        url: 'inventory/adjustments',
        method: 'POST',
        body: adjustment,
      }),
      invalidatesTags: [
        { type: 'Adjustment', id: 'LIST' },
        { type: 'Inventory', id: 'LIST' },
      ],
    }),

    approveAdjustment: builder.mutation<InventoryAdjustment, string>({
      query: (id) => ({
        url: `inventory/adjustments/${id}/approve`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Adjustment', id },
        { type: 'Adjustment', id: 'LIST' },
        { type: 'Inventory', id: 'LIST' },
      ],
    }),

    rejectAdjustment: builder.mutation<InventoryAdjustment, { id: string; reason: string }>({
      query: ({ id, reason }) => ({
        url: `inventory/adjustments/${id}/reject`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Adjustment', id },
        { type: 'Adjustment', id: 'LIST' },
      ],
    }),

    // Transfers
    getTransfers: builder.query<InventoryTransfer[], void>({
      query: () => 'inventory/transfers',
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Transfer' as const, id })),
              { type: 'Transfer', id: 'LIST' },
            ]
          : [{ type: 'Transfer', id: 'LIST' }],
    }),

    getTransfer: builder.query<InventoryTransfer, string>({
      query: (id) => `inventory/transfers/${id}`,
      providesTags: (result, error, id) => [{ type: 'Transfer', id }],
    }),

    createTransfer: builder.mutation<InventoryTransfer, CreateTransferRequest>({
      query: (transfer) => ({
        url: 'inventory/transfers',
        method: 'POST',
        body: transfer,
      }),
      invalidatesTags: [
        { type: 'Transfer', id: 'LIST' },
        { type: 'Inventory', id: 'LIST' },
      ],
    }),

    completeTransfer: builder.mutation<
      InventoryTransfer,
      { id: string; receivedItems: Array<{ inventoryItemId: string; received: number }> }
    >({
      query: ({ id, receivedItems }) => ({
        url: `inventory/transfers/${id}/complete`,
        method: 'POST',
        body: { receivedItems },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Transfer', id },
        { type: 'Transfer', id: 'LIST' },
        { type: 'Inventory', id: 'LIST' },
      ],
    }),

    cancelTransfer: builder.mutation<InventoryTransfer, string>({
      query: (id) => ({
        url: `inventory/transfers/${id}/cancel`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Transfer', id },
        { type: 'Transfer', id: 'LIST' },
        { type: 'Inventory', id: 'LIST' },
      ],
    }),

    // Alerts
    getAlerts: builder.query<InventoryAlert[], void>({
      query: () => 'inventory/alerts',
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Alert' as const, id })),
              { type: 'Alert', id: 'LIST' },
            ]
          : [{ type: 'Alert', id: 'LIST' }],
    }),

    acknowledgeAlert: builder.mutation<InventoryAlert, string>({
      query: (id) => ({
        url: `inventory/alerts/${id}/acknowledge`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Alert', id },
        { type: 'Alert', id: 'LIST' },
      ],
    }),

    bulkAcknowledgeAlerts: builder.mutation<void, string[]>({
      query: (ids) => ({
        url: 'inventory/alerts/bulk-acknowledge',
        method: 'POST',
        body: { ids },
      }),
      invalidatesTags: [{ type: 'Alert', id: 'LIST' }],
    }),

    // Analytics
    getInventoryAnalytics: builder.query<
      {
        totalItems: number
        lowStockItems: number
        outOfStockItems: number
        totalValue: number
        locationBreakdown: Array<{
          locationId: string
          locationName: string
          itemCount: number
          totalValue: number
        }>
        alertsSummary: {
          critical: number
          high: number
          medium: number
          low: number
        }
      },
      void
    >({
      query: () => 'inventory/analytics',
      providesTags: [{ type: 'Inventory', id: 'ANALYTICS' }],
    }),
  }),
})

export const {
  useGetInventoryItemsQuery,
  useGetInventoryItemQuery,
  useUpdateInventoryItemMutation,
  useBulkUpdateInventoryMutation,
  useGetLocationsQuery,
  useGetLocationQuery,
  useCreateLocationMutation,
  useUpdateLocationMutation,
  useDeleteLocationMutation,
  useGetAdjustmentsQuery,
  useGetAdjustmentQuery,
  useCreateAdjustmentMutation,
  useApproveAdjustmentMutation,
  useRejectAdjustmentMutation,
  useGetTransfersQuery,
  useGetTransferQuery,
  useCreateTransferMutation,
  useCompleteTransferMutation,
  useCancelTransferMutation,
  useGetAlertsQuery,
  useAcknowledgeAlertMutation,
  useBulkAcknowledgeAlertsMutation,
  useGetInventoryAnalyticsQuery,
} = inventoryApi