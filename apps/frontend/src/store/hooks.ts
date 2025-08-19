import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux'
import type { RootState, AppDispatch } from './index'

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

// Custom hooks for common store operations
export const useAuth = () => {
  const auth = useAppSelector((state) => state.auth)
  const dispatch = useAppDispatch()
  
  return {
    ...auth,
    login: (credentials: { email: string; password: string; rememberMe?: boolean }) =>
      dispatch({ type: 'auth/login', payload: credentials }),
    logout: () => dispatch({ type: 'auth/logout' }),
    updateProfile: (updates: any) => dispatch({ type: 'auth/updateProfile', payload: updates }),
    clearError: () => dispatch({ type: 'auth/clearError' }),
  }
}

export const useUI = () => {
  const ui = useAppSelector((state) => state.ui)
  const dispatch = useAppDispatch()
  
  return {
    ...ui,
    toggleSidebar: () => dispatch({ type: 'ui/toggleSidebar' }),
    setSidebarCollapsed: (collapsed: boolean) =>
      dispatch({ type: 'ui/setSidebarCollapsed', payload: collapsed }),
    setTheme: (theme: 'light' | 'dark' | 'auto') =>
      dispatch({ type: 'ui/setTheme', payload: theme }),
    openModal: (modalId: string, data?: any) =>
      dispatch({ type: 'ui/openModal', payload: { modalId, data } }),
    closeModal: (modalId: string) =>
      dispatch({ type: 'ui/closeModal', payload: modalId }),
    addNotification: (notification: any) =>
      dispatch({ type: 'ui/addNotification', payload: notification }),
    setLoading: (key: string, loading: boolean) =>
      dispatch({ type: 'ui/setLoading', payload: { key, loading } }),
  }
}

export const useProducts = () => {
  const products = useAppSelector((state) => state.products)
  const dispatch = useAppDispatch()
  
  return {
    ...products,
    setProducts: (products: any[]) =>
      dispatch({ type: 'products/setProducts', payload: products }),
    addProduct: (product: any) =>
      dispatch({ type: 'products/addProduct', payload: product }),
    updateProduct: (id: string, changes: any) =>
      dispatch({ type: 'products/updateProduct', payload: { id, changes } }),
    setSelectedProduct: (product: any) =>
      dispatch({ type: 'products/setSelectedProduct', payload: product }),
    setFilters: (filters: any) =>
      dispatch({ type: 'products/setFilters', payload: filters }),
    clearFilters: () => dispatch({ type: 'products/clearFilters' }),
  }
}

export const useInventory = () => {
  const inventory = useAppSelector((state) => state.inventory)
  const dispatch = useAppDispatch()
  
  return {
    ...inventory,
    setInventoryItems: (items: any[]) =>
      dispatch({ type: 'inventory/setInventoryItems', payload: items }),
    updateInventoryQuantity: (id: string, quantity: number, reserved?: number) =>
      dispatch({ type: 'inventory/updateInventoryQuantity', payload: { id, quantity, reserved } }),
    setSelectedItem: (item: any) =>
      dispatch({ type: 'inventory/setSelectedItem', payload: item }),
    setFilters: (filters: any) =>
      dispatch({ type: 'inventory/setFilters', payload: filters }),
    acknowledgeAlert: (id: string, acknowledgedBy: string) =>
      dispatch({ type: 'inventory/acknowledgeAlert', payload: { id, acknowledgedBy } }),
  }
}

export const useOrders = () => {
  const orders = useAppSelector((state) => state.orders)
  const dispatch = useAppDispatch()
  
  return {
    ...orders,
    setOrders: (orders: any[]) =>
      dispatch({ type: 'orders/setOrders', payload: orders }),
    addOrder: (order: any) =>
      dispatch({ type: 'orders/addOrder', payload: order }),
    updateOrderStatus: (id: string, status: any, timestamp?: string) =>
      dispatch({ type: 'orders/updateOrderStatus', payload: { id, status, timestamp } }),
    setSelectedOrder: (order: any) =>
      dispatch({ type: 'orders/setSelectedOrder', payload: order }),
    setFilters: (filters: any) =>
      dispatch({ type: 'orders/setFilters', payload: filters }),
    updateTrackingInfo: (id: string, trackingNumber: string, trackingUrl?: string, carrier?: string) =>
      dispatch({ type: 'orders/updateTrackingInfo', payload: { id, trackingNumber, trackingUrl, carrier } }),
  }
}

export const useCustomers = () => {
  const customers = useAppSelector((state) => state.customers)
  const dispatch = useAppDispatch()
  
  return {
    ...customers,
    setCustomers: (customers: any[]) =>
      dispatch({ type: 'customers/setCustomers', payload: customers }),
    addCustomer: (customer: any) =>
      dispatch({ type: 'customers/addCustomer', payload: customer }),
    updateCustomer: (id: string, changes: any) =>
      dispatch({ type: 'customers/updateCustomer', payload: { id, changes } }),
    setSelectedCustomer: (customer: any) =>
      dispatch({ type: 'customers/setSelectedCustomer', payload: customer }),
    setFilters: (filters: any) =>
      dispatch({ type: 'customers/setFilters', payload: filters }),
    addCustomerAddress: (customerId: string, address: any) =>
      dispatch({ type: 'customers/addCustomerAddress', payload: { customerId, address } }),
  }
}