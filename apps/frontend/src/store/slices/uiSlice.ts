import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '../index'

// Types
export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
  actions?: NotificationAction[]
  timestamp: number
  read: boolean
}

export interface NotificationAction {
  label: string
  action: string
  payload?: Record<string, unknown>
}

export interface Modal {
  id: string
  isOpen: boolean
  data?: Record<string, unknown>
}

export interface LoadingState {
  global: boolean
  products: boolean
  inventory: boolean
  orders: boolean
  customers: boolean
  analytics: boolean
  shopify: boolean
}

export interface UIState {
  // Layout
  sidebarCollapsed: boolean
  sidebarWidth: number
  headerHeight: number

  // Theme
  theme: 'light' | 'dark' | 'auto'
  primaryColor: string

  // Modals
  modals: {
    productCreate: Modal
    productEdit: Modal
    productDelete: Modal
    orderDetail: Modal
    orderCreate: Modal
    customerEdit: Modal
    customerDelete: Modal
    inventoryAdjust: Modal
    bulkActions: Modal
    settings: Modal
    shopifySync: Modal
  }

  // Loading states
  loading: LoadingState

  // Notifications
  notifications: Notification[]
  unreadNotificationCount: number

  // Page state
  currentPage: string
  breadcrumbs: Breadcrumb[]
  pageTitle: string

  // Filters and search
  globalSearch: string
  activeFilters: Record<string, unknown>

  // View preferences
  viewMode: 'grid' | 'list' | 'table'
  pageSize: number
  sortBy: string
  sortOrder: 'asc' | 'desc'

  // Connection status
  isOnline: boolean
  websocketConnected: boolean

  // Error boundaries
  errorBoundaries: Record<string, boolean>
}

export interface Breadcrumb {
  label: string
  path?: string
  icon?: string
}

// Initial state
const initialState: UIState = {
  // Layout
  sidebarCollapsed: false,
  sidebarWidth: 256,
  headerHeight: 64,

  // Theme
  theme: 'light',
  primaryColor: '#1890ff',

  // Modals
  modals: {
    productCreate: { id: 'productCreate', isOpen: false },
    productEdit: { id: 'productEdit', isOpen: false },
    productDelete: { id: 'productDelete', isOpen: false },
    orderDetail: { id: 'orderDetail', isOpen: false },
    orderCreate: { id: 'orderCreate', isOpen: false },
    customerEdit: { id: 'customerEdit', isOpen: false },
    customerDelete: { id: 'customerDelete', isOpen: false },
    inventoryAdjust: { id: 'inventoryAdjust', isOpen: false },
    bulkActions: { id: 'bulkActions', isOpen: false },
    settings: { id: 'settings', isOpen: false },
    shopifySync: { id: 'shopifySync', isOpen: false },
  },

  // Loading states
  loading: {
    global: false,
    products: false,
    inventory: false,
    orders: false,
    customers: false,
    analytics: false,
    shopify: false,
  },

  // Notifications
  notifications: [],
  unreadNotificationCount: 0,

  // Page state
  currentPage: '',
  breadcrumbs: [],
  pageTitle: '',

  // Filters and search
  globalSearch: '',
  activeFilters: {},

  // View preferences
  viewMode: 'grid',
  pageSize: 20,
  sortBy: 'createdAt',
  sortOrder: 'desc',

  // Connection status
  isOnline: true,
  websocketConnected: false,

  // Error boundaries
  errorBoundaries: {},
}

// UI slice
const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Layout actions
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed
    },

    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload
    },

    setSidebarWidth: (state, action: PayloadAction<number>) => {
      state.sidebarWidth = action.payload
    },

    // Theme actions
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'auto'>) => {
      state.theme = action.payload
    },

    setPrimaryColor: (state, action: PayloadAction<string>) => {
      state.primaryColor = action.payload
    },

    // Modal actions
    openModal: (
      state,
      action: PayloadAction<{
        modalId: keyof UIState['modals']
        data?: Record<string, unknown>
      }>
    ) => {
      const { modalId, data } = action.payload
      if (state.modals[modalId]) {
        state.modals[modalId].isOpen = true
        state.modals[modalId].data = data
      }
    },

    closeModal: (state, action: PayloadAction<keyof UIState['modals']>) => {
      const modalId = action.payload
      if (state.modals[modalId]) {
        state.modals[modalId].isOpen = false
        state.modals[modalId].data = undefined
      }
    },

    closeAllModals: (state) => {
      Object.keys(state.modals).forEach((key) => {
        const modalKey = key as keyof UIState['modals']
        state.modals[modalKey].isOpen = false
        state.modals[modalKey].data = undefined
      })
    },

    // Loading actions
    setLoading: (
      state,
      action: PayloadAction<{ key: keyof LoadingState; loading: boolean }>
    ) => {
      const { key, loading } = action.payload
      state.loading[key] = loading
    },

    setGlobalLoading: (state, action: PayloadAction<boolean>) => {
      state.loading.global = action.payload
    },

    // Notification actions
    addNotification: (
      state,
      action: PayloadAction<Omit<Notification, 'id' | 'timestamp' | 'read'>>
    ) => {
      const notification: Notification = {
        ...action.payload,
        id: `notification-${Date.now()}-${Math.random()}`,
        timestamp: Date.now(),
        read: false,
      }
      state.notifications.unshift(notification)
      state.unreadNotificationCount += 1
    },

    removeNotification: (state, action: PayloadAction<string>) => {
      const index = state.notifications.findIndex(
        (n) => n.id === action.payload
      )
      if (index !== -1) {
        const notification = state.notifications[index]
        if (!notification.read) {
          state.unreadNotificationCount -= 1
        }
        state.notifications.splice(index, 1)
      }
    },

    markNotificationAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(
        (n) => n.id === action.payload
      )
      if (notification && !notification.read) {
        notification.read = true
        state.unreadNotificationCount -= 1
      }
    },

    markAllNotificationsAsRead: (state) => {
      state.notifications.forEach((notification) => {
        notification.read = true
      })
      state.unreadNotificationCount = 0
    },

    clearNotifications: (state) => {
      state.notifications = []
      state.unreadNotificationCount = 0
    },

    // Page state actions
    setCurrentPage: (state, action: PayloadAction<string>) => {
      state.currentPage = action.payload
    },

    setBreadcrumbs: (state, action: PayloadAction<Breadcrumb[]>) => {
      state.breadcrumbs = action.payload
    },

    setPageTitle: (state, action: PayloadAction<string>) => {
      state.pageTitle = action.payload
    },

    // Search and filter actions
    setGlobalSearch: (state, action: PayloadAction<string>) => {
      state.globalSearch = action.payload
    },

    setActiveFilters: (
      state,
      action: PayloadAction<Record<string, unknown>>
    ) => {
      state.activeFilters = action.payload
    },

    addFilter: (
      state,
      action: PayloadAction<{ key: string; value: unknown }>
    ) => {
      const { key, value } = action.payload
      state.activeFilters[key] = value
    },

    removeFilter: (state, action: PayloadAction<string>) => {
      delete state.activeFilters[action.payload]
    },

    clearFilters: (state) => {
      state.activeFilters = {}
    },

    // View preference actions
    setViewMode: (state, action: PayloadAction<'grid' | 'list' | 'table'>) => {
      state.viewMode = action.payload
    },

    setPageSize: (state, action: PayloadAction<number>) => {
      state.pageSize = action.payload
    },

    setSorting: (
      state,
      action: PayloadAction<{ sortBy: string; sortOrder: 'asc' | 'desc' }>
    ) => {
      const { sortBy, sortOrder } = action.payload
      state.sortBy = sortBy
      state.sortOrder = sortOrder
    },

    // Connection status actions
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload
    },

    setWebSocketStatus: (state, action: PayloadAction<boolean>) => {
      state.websocketConnected = action.payload
    },

    // Error boundary actions
    setErrorBoundary: (
      state,
      action: PayloadAction<{ component: string; hasError: boolean }>
    ) => {
      const { component, hasError } = action.payload
      state.errorBoundaries[component] = hasError
    },

    clearErrorBoundary: (state, action: PayloadAction<string>) => {
      delete state.errorBoundaries[action.payload]
    },

    // Reset actions
    resetUIState: () => initialState,
  },
})

// Actions
export const {
  toggleSidebar,
  setSidebarCollapsed,
  setSidebarWidth,
  setTheme,
  setPrimaryColor,
  openModal,
  closeModal,
  closeAllModals,
  setLoading,
  setGlobalLoading,
  addNotification,
  removeNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearNotifications,
  setCurrentPage,
  setBreadcrumbs,
  setPageTitle,
  setGlobalSearch,
  setActiveFilters,
  addFilter,
  removeFilter,
  clearFilters,
  setViewMode,
  setPageSize,
  setSorting,
  setOnlineStatus,
  setWebSocketStatus,
  setErrorBoundary,
  clearErrorBoundary,
  resetUIState,
} = uiSlice.actions

// Selectors
export const selectSidebarCollapsed = (state: RootState) =>
  state.ui.sidebarCollapsed
export const selectSidebarWidth = (state: RootState) => state.ui.sidebarWidth
export const selectTheme = (state: RootState) => state.ui.theme
export const selectPrimaryColor = (state: RootState) => state.ui.primaryColor

export const selectModal =
  (modalId: keyof UIState['modals']) => (state: RootState) =>
    state.ui.modals[modalId]

export const selectLoading = (key: keyof LoadingState) => (state: RootState) =>
  state.ui.loading[key]

export const selectGlobalLoading = (state: RootState) => state.ui.loading.global
export const selectAnyLoading = (state: RootState) =>
  Object.values(state.ui.loading).some(Boolean)

export const selectNotifications = (state: RootState) => state.ui.notifications
export const selectUnreadNotificationCount = (state: RootState) =>
  state.ui.unreadNotificationCount
export const selectRecentNotifications =
  (limit = 5) =>
  (state: RootState) =>
    state.ui.notifications.slice(0, limit)

export const selectCurrentPage = (state: RootState) => state.ui.currentPage
export const selectBreadcrumbs = (state: RootState) => state.ui.breadcrumbs
export const selectPageTitle = (state: RootState) => state.ui.pageTitle

export const selectGlobalSearch = (state: RootState) => state.ui.globalSearch
export const selectActiveFilters = (state: RootState) => state.ui.activeFilters
export const selectHasActiveFilters = (state: RootState) =>
  Object.keys(state.ui.activeFilters).length > 0

export const selectViewMode = (state: RootState) => state.ui.viewMode
export const selectPageSize = (state: RootState) => state.ui.pageSize
export const selectSorting = (state: RootState) => ({
  sortBy: state.ui.sortBy,
  sortOrder: state.ui.sortOrder,
})

export const selectIsOnline = (state: RootState) => state.ui.isOnline
export const selectWebSocketConnected = (state: RootState) =>
  state.ui.websocketConnected
export const selectConnectionStatus = (state: RootState) => ({
  isOnline: state.ui.isOnline,
  websocketConnected: state.ui.websocketConnected,
})

export const selectErrorBoundaries = (state: RootState) =>
  state.ui.errorBoundaries
export const selectHasErrors = (state: RootState) =>
  Object.values(state.ui.errorBoundaries).some(Boolean)

export default uiSlice.reducer
