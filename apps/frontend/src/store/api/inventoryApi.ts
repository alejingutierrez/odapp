import type {
  InventoryItem,
  InventoryLocation,
  InventoryAdjustment,
  InventoryTransfer,
  InventoryAlert,
} from '../slices/inventorySlice'

import { baseApi } from './baseApi'
// import type { EndpointBuilder } from '@reduxjs/toolkit/query'

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
    getInventoryItems: builder.query({
      query: (params: InventoryQuery) => ({
        url: 'inventory',
        params,
      }),
      providesTags: (result: InventoryResponse | undefined) =>
        result
          ? [
              ...result.items.map(({ id }: { id: string }) => ({
                type: 'Inventory' as const,
                id,
              })),
              { type: 'Inventory', id: 'LIST' },
            ]
          : [{ type: 'Inventory', id: 'LIST' }],
    }),

    getInventoryItem: builder.query({
      query: (id: string) => `inventory/${id}`,
      providesTags: (_result: InventoryItem | undefined, _error: unknown, id: string) => [{ type: 'Inventory', id }],
    }),

    updateInventoryItem: builder.mutation({
      query: ({ id, ...patch }: { id: string } & UpdateInventoryRequest) => ({
        url: `inventory/${id}`,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: (_result: InventoryItem | undefined, _error: unknown, { id }: { id: string }) => [
        { type: 'Inventory', id },
        { type: 'Inventory', id: 'LIST' },
      ],
    }),

    bulkUpdateInventory: builder.mutation({
      query: (updates: Array<{ id: string } & UpdateInventoryRequest>) => ({
        url: 'inventory/bulk',
        method: 'PATCH',
        body: { updates },
      }),
      invalidatesTags: [{ type: 'Inventory', id: 'LIST' }],
    }),

    // Inventory locations
    getLocations: builder.query({
      query: () => 'inventory/locations',
      providesTags: (result: InventoryLocation[] | undefined) =>
        result
          ? [
              ...result.map(({ id }: { id: string }) => ({
                type: 'Location' as const,
                id,
              })),
              { type: 'Location', id: 'LIST' },
            ]
          : [{ type: 'Location', id: 'LIST' }],
    }),

    getLocation: builder.query({
      query: (id: string) => `inventory/locations/${id}`,
      providesTags: (_result: InventoryLocation | undefined, _error: unknown, id: string) => [{ type: 'Location', id }],
    }),

    createLocation: builder.mutation({
      query: (location: Partial<InventoryLocation>) => ({
        url: 'inventory/locations',
        method: 'POST',
        body: location,
      }),
      invalidatesTags: [{ type: 'Location', id: 'LIST' }],
    }),

    updateLocation: builder.mutation({
      query: ({ id, changes }: { id: string; changes: Partial<InventoryLocation> }) => ({
        url: `inventory/locations/${id}`,
        method: 'PATCH',
        body: changes,
      }),
      invalidatesTags: (_result: InventoryLocation | undefined, _error: unknown, { id }: { id: string }) => [
        { type: 'Location', id },
        { type: 'Location', id: 'LIST' },
      ],
    }),

    deleteLocation: builder.mutation({
      query: (id: string) => ({
        url: `inventory/locations/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result: void | undefined, _error: unknown, id: string) => [
        { type: 'Location', id },
        { type: 'Location', id: 'LIST' },
      ],
    }),

    // Inventory adjustments
    getAdjustments: builder.query({
      query: () => 'inventory/adjustments',
      providesTags: (result: InventoryAdjustment[] | undefined) =>
        result
          ? [
              ...result.map(({ id }: { id: string }) => ({
                type: 'Adjustment' as const,
                id,
              })),
              { type: 'Adjustment', id: 'LIST' },
            ]
          : [{ type: 'Adjustment', id: 'LIST' }],
    }),

    getAdjustment: builder.query({
      query: (id: string) => `inventory/adjustments/${id}`,
      providesTags: (_result: InventoryAdjustment | undefined, _error: unknown, id: string) => [{ type: 'Adjustment', id }],
    }),

    createAdjustment: builder.mutation({
      query: (adjustment: CreateAdjustmentRequest) => ({
        url: 'inventory/adjustments',
        method: 'POST',
        body: adjustment,
      }),
      invalidatesTags: [
        { type: 'Adjustment', id: 'LIST' },
        { type: 'Inventory', id: 'LIST' },
      ],
    }),

    // Inventory transfers
    getTransfers: builder.query({
      query: () => 'inventory/transfers',
      providesTags: (result: InventoryTransfer[] | undefined) =>
        result
          ? [
              ...result.map(({ id }: { id: string }) => ({
                type: 'Transfer' as const,
                id,
              })),
              { type: 'Transfer', id: 'LIST' },
            ]
          : [{ type: 'Transfer', id: 'LIST' }],
    }),

    getTransfer: builder.query({
      query: (id: string) => `inventory/transfers/${id}`,
      providesTags: (_result: InventoryTransfer | undefined, _error: unknown, id: string) => [{ type: 'Transfer', id }],
    }),

    createTransfer: builder.mutation({
      query: (transfer: CreateTransferRequest) => ({
        url: 'inventory/transfers',
        method: 'POST',
        body: transfer,
      }),
      invalidatesTags: [
        { type: 'Transfer', id: 'LIST' },
        { type: 'Inventory', id: 'LIST' },
      ],
    }),

    // Inventory alerts
    getAlerts: builder.query({
      query: () => 'inventory/alerts',
      providesTags: (result: InventoryAlert[] | undefined) =>
        result
          ? [
              ...result.map(({ id }: { id: string }) => ({
                type: 'Alert' as const,
                id,
              })),
              { type: 'Alert', id: 'LIST' },
            ]
          : [{ type: 'Alert', id: 'LIST' }],
    }),

    getAlert: builder.query({
      query: (id: string) => `inventory/alerts/${id}`,
      providesTags: (_result: InventoryAlert | undefined, _error: unknown, id: string) => [{ type: 'Alert', id }],
    }),

    acknowledgeAlert: builder.mutation({
      query: (id: string) => ({
        url: `inventory/alerts/${id}/acknowledge`,
        method: 'POST',
      }),
      invalidatesTags: (_result: void | undefined, _error: unknown, id: string) => [
        { type: 'Alert', id },
        { type: 'Alert', id: 'LIST' },
      ],
    }),

    bulkAcknowledgeAlerts: builder.mutation({
      query: (ids: string[]) => ({
        url: 'inventory/alerts/bulk-acknowledge',
        method: 'POST',
        body: { ids },
      }),
      invalidatesTags: [{ type: 'Alert', id: 'LIST' }],
    }),

    // Analytics
    getInventoryAnalytics: builder.query({
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
  useGetTransfersQuery,
  useGetTransferQuery,
  useCreateTransferMutation,
  useGetAlertsQuery,
  useGetAlertQuery,
  useAcknowledgeAlertMutation,
  useBulkAcknowledgeAlertsMutation,
  useGetInventoryAnalyticsQuery,
} = inventoryApi
