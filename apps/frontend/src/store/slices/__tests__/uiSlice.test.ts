import { describe, it, expect } from 'vitest'
import { configureStore, type Reducer } from '@reduxjs/toolkit'
import uiReducer, {
  toggleSidebar,
  setSidebarCollapsed,
  setTheme,
  openModal,
  closeModal,
  closeAllModals,
  setLoading,
  addNotification,
  removeNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearNotifications,
  setCurrentPage,
  setBreadcrumbs,
  setGlobalSearch,
  setActiveFilters,
  addFilter,
  removeFilter,
  clearFilters,
  setViewMode,
  setSorting,
  setOnlineStatus,
  setWebSocketStatus,
  selectSidebarCollapsed,
  selectTheme,
  selectModal,
  selectLoading,
  selectNotifications,
  selectUnreadNotificationCount,
  selectGlobalSearch,
  selectActiveFilters,
  selectHasActiveFilters,
  selectIsOnline,
  selectWebSocketConnected,
  type UIState,
  type Notification,
} from '../uiSlice'

const createTestStore = (initialState?: Partial<UIState>) => {
  const store = configureStore({
    reducer: {
      ui: uiReducer as Reducer<UIState>,
    },
    preloadedState: {
      ui: {
        sidebarCollapsed: false,
        sidebarWidth: 256,
        headerHeight: 64,
        theme: 'light' as const,
        primaryColor: '#1890ff',
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
        loading: {
          global: false,
          products: false,
          inventory: false,
          orders: false,
          customers: false,
          analytics: false,
          shopify: false,
        },
        notifications: [],
        unreadNotificationCount: 0,
        currentPage: '',
        breadcrumbs: [],
        pageTitle: '',
        globalSearch: '',
        activeFilters: {},
        viewMode: 'grid' as const,
        pageSize: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc' as const,
        isOnline: true,
        websocketConnected: false,
        errorBoundaries: {},
        ...initialState,
      },
    },
  })

  return {
    ...store,
    getState: () => ({ ui: store.getState().ui }),
    dispatch: store.dispatch,
  }
}

describe('uiSlice', () => {
  describe('layout actions', () => {
    it('should toggle sidebar', () => {
      const store = createTestStore({ sidebarCollapsed: false })

      store.dispatch(toggleSidebar())
      expect((store.getState() as { ui: UIState }).ui.sidebarCollapsed).toBe(
        true
      )

      store.dispatch(toggleSidebar())
      expect((store.getState() as { ui: UIState }).ui.sidebarCollapsed).toBe(
        false
      )
    })

    it('should set sidebar collapsed state', () => {
      const store = createTestStore()

      store.dispatch(setSidebarCollapsed(true))
      expect((store.getState() as { ui: UIState }).ui.sidebarCollapsed).toBe(
        true
      )

      store.dispatch(setSidebarCollapsed(false))
      expect((store.getState() as { ui: UIState }).ui.sidebarCollapsed).toBe(
        false
      )
    })

    it('should set theme', () => {
      const store = createTestStore()

      store.dispatch(setTheme('dark'))
      expect((store.getState() as { ui: UIState }).ui.theme).toBe('dark')

      store.dispatch(setTheme('auto'))
      expect((store.getState() as { ui: UIState }).ui.theme).toBe('auto')
    })
  })

  describe('modal actions', () => {
    it('should open modal', () => {
      const store = createTestStore()
      const modalData = { productId: '123' }

      store.dispatch(openModal({ modalId: 'productEdit', data: modalData }))

      const state = (store.getState() as { ui: UIState }).ui
      expect(state.modals.productEdit.isOpen).toBe(true)
      expect(state.modals.productEdit.data).toEqual(modalData)
    })

    it('should close modal', () => {
      const store = createTestStore({
        modals: {
          productCreate: { id: 'productCreate', isOpen: false },
          productEdit: {
            id: 'productEdit',
            isOpen: true,
            data: { productId: '123' },
          },
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
      })

      store.dispatch(closeModal('productEdit'))

      const state = (store.getState() as { ui: UIState }).ui
      expect(state.modals.productEdit.isOpen).toBe(false)
      expect(state.modals.productEdit.data).toBeUndefined()
    })

    it('should close all modals', () => {
      const store = createTestStore({
        modals: {
          productCreate: { id: 'productCreate', isOpen: true },
          productEdit: { id: 'productEdit', isOpen: true },
          productDelete: { id: 'productDelete', isOpen: false },
          orderDetail: { id: 'orderDetail', isOpen: true },
          orderCreate: { id: 'orderCreate', isOpen: false },
          customerEdit: { id: 'customerEdit', isOpen: false },
          customerDelete: { id: 'customerDelete', isOpen: false },
          inventoryAdjust: { id: 'inventoryAdjust', isOpen: false },
          bulkActions: { id: 'bulkActions', isOpen: false },
          settings: { id: 'settings', isOpen: false },
          shopifySync: { id: 'shopifySync', isOpen: false },
        },
      })

      store.dispatch(closeAllModals())

      const state = (store.getState() as { ui: UIState }).ui
      Object.values(state.modals).forEach(
        (modal: { isOpen: boolean; data?: unknown }) => {
          expect(modal.isOpen).toBe(false)
          expect(modal.data).toBeUndefined()
        }
      )
    })
  })

  describe('loading actions', () => {
    it('should set loading state', () => {
      const store = createTestStore()

      store.dispatch(setLoading({ key: 'products', loading: true }))
      expect((store.getState() as { ui: UIState }).ui.loading.products).toBe(
        true
      )

      store.dispatch(setLoading({ key: 'products', loading: false }))
      expect((store.getState() as { ui: UIState }).ui.loading.products).toBe(
        false
      )
    })
  })

  describe('notification actions', () => {
    it('should add notification', () => {
      const store = createTestStore()
      const notification = {
        type: 'success' as const,
        title: 'Success',
        message: 'Operation completed successfully',
      }

      store.dispatch(addNotification(notification))

      const state = (store.getState() as { ui: UIState }).ui
      expect(state.notifications).toHaveLength(1)
      expect(state.notifications[0]).toMatchObject(notification)
      expect(state.notifications[0].id).toBeDefined()
      expect(state.notifications[0].timestamp).toBeDefined()
      expect(state.notifications[0].read).toBe(false)
      expect(state.unreadNotificationCount).toBe(1)
    })

    it('should remove notification', () => {
      const notification: Notification = {
        id: 'test-notification',
        type: 'info',
        title: 'Test',
        message: 'Test message',
        timestamp: Date.now(),
        read: false,
      }

      const store = createTestStore({
        notifications: [notification],
        unreadNotificationCount: 1,
      })

      store.dispatch(removeNotification('test-notification'))

      const state = (store.getState() as { ui: UIState }).ui
      expect(state.notifications).toHaveLength(0)
      expect(state.unreadNotificationCount).toBe(0)
    })

    it('should mark notification as read', () => {
      const notification: Notification = {
        id: 'test-notification',
        type: 'info',
        title: 'Test',
        message: 'Test message',
        timestamp: Date.now(),
        read: false,
      }

      const store = createTestStore({
        notifications: [notification],
        unreadNotificationCount: 1,
      })

      store.dispatch(markNotificationAsRead('test-notification'))

      const state = (store.getState() as { ui: UIState }).ui
      expect(state.notifications[0].read).toBe(true)
      expect(state.unreadNotificationCount).toBe(0)
    })

    it('should mark all notifications as read', () => {
      const notifications: Notification[] = [
        {
          id: 'notification-1',
          type: 'info',
          title: 'Test 1',
          message: 'Test message 1',
          timestamp: Date.now(),
          read: false,
        },
        {
          id: 'notification-2',
          type: 'warning',
          title: 'Test 2',
          message: 'Test message 2',
          timestamp: Date.now(),
          read: false,
        },
      ]

      const store = createTestStore({
        notifications,
        unreadNotificationCount: 2,
      })

      store.dispatch(markAllNotificationsAsRead())

      const state = (store.getState() as { ui: UIState }).ui
      expect(state.notifications.every((n: { read: boolean }) => n.read)).toBe(
        true
      )
      expect(state.unreadNotificationCount).toBe(0)
    })

    it('should clear all notifications', () => {
      const notifications: Notification[] = [
        {
          id: 'notification-1',
          type: 'info',
          title: 'Test 1',
          message: 'Test message 1',
          timestamp: Date.now(),
          read: false,
        },
      ]

      const store = createTestStore({
        notifications,
        unreadNotificationCount: 1,
      })

      store.dispatch(clearNotifications())

      const state = (store.getState() as { ui: UIState }).ui
      expect(state.notifications).toHaveLength(0)
      expect(state.unreadNotificationCount).toBe(0)
    })
  })

  describe('page state actions', () => {
    it('should set current page', () => {
      const store = createTestStore()

      store.dispatch(setCurrentPage('products'))
      expect((store.getState() as { ui: UIState }).ui.currentPage).toBe(
        'products'
      )
    })

    it('should set breadcrumbs', () => {
      const store = createTestStore()
      const breadcrumbs = [
        { label: 'Home', path: '/' },
        { label: 'Products', path: '/products' },
        { label: 'Edit Product' },
      ]

      store.dispatch(setBreadcrumbs(breadcrumbs))
      expect((store.getState() as { ui: UIState }).ui.breadcrumbs).toEqual(
        breadcrumbs
      )
    })
  })

  describe('search and filter actions', () => {
    it('should set global search', () => {
      const store = createTestStore()

      store.dispatch(setGlobalSearch('test search'))
      expect((store.getState() as { ui: UIState }).ui.globalSearch).toBe(
        'test search'
      )
    })

    it('should set active filters', () => {
      const store = createTestStore()
      const filters = { status: 'active', category: 'electronics' }

      store.dispatch(setActiveFilters(filters))
      expect((store.getState() as { ui: UIState }).ui.activeFilters).toEqual(
        filters
      )
    })

    it('should add filter', () => {
      const store = createTestStore({ activeFilters: { status: 'active' } })

      store.dispatch(addFilter({ key: 'category', value: 'electronics' }))

      const state = (store.getState() as { ui: UIState }).ui
      expect(state.activeFilters).toEqual({
        status: 'active',
        category: 'electronics',
      })
    })

    it('should remove filter', () => {
      const store = createTestStore({
        activeFilters: { status: 'active', category: 'electronics' },
      })

      store.dispatch(removeFilter('category'))

      const state = (store.getState() as { ui: UIState }).ui
      expect(state.activeFilters).toEqual({ status: 'active' })
    })

    it('should clear filters', () => {
      const store = createTestStore({
        activeFilters: { status: 'active', category: 'electronics' },
      })

      store.dispatch(clearFilters())
      expect((store.getState() as { ui: UIState }).ui.activeFilters).toEqual({})
    })
  })

  describe('view preference actions', () => {
    it('should set view mode', () => {
      const store = createTestStore()

      store.dispatch(setViewMode('list'))
      expect((store.getState() as { ui: UIState }).ui.viewMode).toBe('list')
    })

    it('should set sorting', () => {
      const store = createTestStore()
      const sorting = { sortBy: 'name', sortOrder: 'asc' as const }

      store.dispatch(setSorting(sorting))

      const state = (store.getState() as { ui: UIState }).ui
      expect(state.sortBy).toBe('name')
      expect(state.sortOrder).toBe('asc')
    })
  })

  describe('connection status actions', () => {
    it('should set online status', () => {
      const store = createTestStore()

      store.dispatch(setOnlineStatus(false))
      expect((store.getState() as { ui: UIState }).ui.isOnline).toBe(false)

      store.dispatch(setOnlineStatus(true))
      expect((store.getState() as { ui: UIState }).ui.isOnline).toBe(true)
    })

    it('should set websocket status', () => {
      const store = createTestStore()

      store.dispatch(setWebSocketStatus(true))
      expect((store.getState() as { ui: UIState }).ui.websocketConnected).toBe(
        true
      )

      store.dispatch(setWebSocketStatus(false))
      expect((store.getState() as { ui: UIState }).ui.websocketConnected).toBe(
        false
      )
    })
  })

  describe('selectors', () => {
    it('should select sidebar collapsed state', () => {
      const store = createTestStore({ sidebarCollapsed: true })
      const state = store.getState() as { ui: UIState }

      expect(selectSidebarCollapsed(state as any)).toBe(true)
    })

    it('should select theme', () => {
      const store = createTestStore({ theme: 'dark' })
      const state = store.getState() as { ui: UIState }

      expect(selectTheme(state as any)).toBe('dark')
    })

    it('should select modal state', () => {
      const store = createTestStore({
        modals: {
          productCreate: { id: 'productCreate', isOpen: false },
          productEdit: { id: 'productEdit', isOpen: true, data: { id: '123' } },
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
      })
      const state = store.getState() as { ui: UIState }

      const productEditModal = selectModal('productEdit')(state as any)
      expect(productEditModal.isOpen).toBe(true)
      expect(productEditModal.data).toEqual({ id: '123' })
    })

    it('should select loading state', () => {
      const store = createTestStore({
        loading: {
          global: false,
          products: true,
          inventory: false,
          orders: false,
          customers: false,
          analytics: false,
          shopify: false,
        },
      })
      const state = store.getState() as { ui: UIState }

      expect(selectLoading('products')(state as any)).toBe(true)

      expect(selectLoading('inventory')(state as any)).toBe(false)
    })

    it('should select notifications', () => {
      const notifications: Notification[] = [
        {
          id: 'notification-1',
          type: 'info',
          title: 'Test',
          message: 'Test message',
          timestamp: Date.now(),
          read: false,
        },
      ]

      const store = createTestStore({
        notifications,
        unreadNotificationCount: 1,
      })
      const state = store.getState() as { ui: UIState }

      expect(selectNotifications(state as any)).toEqual(notifications)

      expect(selectUnreadNotificationCount(state as any)).toBe(1)
    })

    it('should select global search', () => {
      const store = createTestStore({ globalSearch: 'test search' })
      const state = store.getState() as { ui: UIState }

      expect(selectGlobalSearch(state as any)).toBe('test search')
    })

    it('should select active filters', () => {
      const filters = { status: 'active', category: 'electronics' }
      const store = createTestStore({ activeFilters: filters })
      const state = store.getState() as { ui: UIState }

      expect(selectActiveFilters(state as any)).toEqual(filters)

      expect(selectHasActiveFilters(state as any)).toBe(true)
    })

    it('should select connection status', () => {
      const store = createTestStore({
        isOnline: true,
        websocketConnected: false,
      })
      const state = store.getState() as { ui: UIState }

      expect(selectIsOnline(state as any)).toBe(true)

      expect(selectWebSocketConnected(state as any)).toBe(false)
    })
  })
})
