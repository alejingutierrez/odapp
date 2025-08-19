import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { selectIsAuthenticated } from '../store/slices/authSlice'

interface PublicRouteProps {
  children: React.ReactNode
  redirectTo?: string
}

export const PublicRoute: React.FC<PublicRouteProps> = ({
  children,
  redirectTo = '/',
}) => {
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const location = useLocation()

  // If user is authenticated, redirect to dashboard or intended page
  if (isAuthenticated) {
    const from = (location.state as any)?.from || redirectTo
    return <Navigate to={from} replace />
  }

  return <>{children}</>
}