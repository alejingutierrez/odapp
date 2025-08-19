import React, { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { Spin } from 'antd'
import { selectIsAuthenticated, selectAuthLoading, selectSessionExpiry, refreshToken } from '../store/slices/authSlice'
import { AppDispatch } from '../store'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredPermission?: {
    resource: string
    action: string
  }
  fallbackPath?: string
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermission,
  fallbackPath = '/auth/login',
}) => {
  const dispatch = useDispatch<AppDispatch>()
  const location = useLocation()
  
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const isLoading = useSelector(selectAuthLoading)
  const sessionExpiry = useSelector(selectSessionExpiry)

  // Check if session is about to expire and refresh token
  useEffect(() => {
    if (isAuthenticated && sessionExpiry) {
      const now = Date.now()
      const timeUntilExpiry = sessionExpiry - now
      
      // Refresh token if it expires in less than 5 minutes
      if (timeUntilExpiry < 5 * 60 * 1000 && timeUntilExpiry > 0) {
        dispatch(refreshToken())
      }
    }
  }, [isAuthenticated, sessionExpiry, dispatch])

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <Spin size="large" />
        <div>Authenticating...</div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <Navigate 
        to={fallbackPath} 
        state={{ from: location.pathname + location.search }} 
        replace 
      />
    )
  }

  // TODO: Add permission checking when RBAC is fully implemented
  // if (requiredPermission) {
  //   const hasPermission = useSelector(selectHasPermission(
  //     requiredPermission.resource,
  //     requiredPermission.action
  //   ))
  //   
  //   if (!hasPermission) {
  //     return <Navigate to="/unauthorized" replace />
  //   }
  // }

  return <>{children}</>
}

// Higher-order component for permission-based route protection
export const withPermission = (
  resource: string,
  action: string,
  fallbackPath = '/unauthorized'
) => {
  return function PermissionWrapper(Component: React.ComponentType) {
    return function ProtectedComponent(props: any) {
      return (
        <ProtectedRoute 
          requiredPermission={{ resource, action }} 
          fallbackPath={fallbackPath}
        >
          <Component {...props} />
        </ProtectedRoute>
      )
    }
  }
}

// Hook for checking permissions in components
export const usePermission = (resource: string, action: string): boolean => {
  // TODO: Implement when RBAC is ready
  // return useSelector(selectHasPermission(resource, action))
  return true // Temporary - allow all for now
}

// Hook for checking multiple permissions
export const usePermissions = (permissions: Array<{ resource: string; action: string }>): boolean[] => {
  // TODO: Implement when RBAC is ready
  return permissions.map(() => true) // Temporary - allow all for now
}