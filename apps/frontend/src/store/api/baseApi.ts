import {
  createApi,
  fetchBaseQuery,
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react'

import type { RootState } from '../index'

// Define base query with authentication
const baseQuery = fetchBaseQuery({
  baseUrl: '/api/v1',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token
    if (token) {
      headers.set('authorization', `Bearer ${token}`)
    }
    headers.set('content-type', 'application/json')
    return headers
  },
})

// Enhanced base query with error handling and token refresh
const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions)

  if (result.error && result.error.status === 401) {
    // Try to refresh token
    const refreshResult = await baseQuery(
      {
        url: '/auth/refresh',
        method: 'POST',
        body: {
          refreshToken: (api.getState() as RootState).auth.refreshToken,
        },
      },
      api,
      extraOptions
    )

    if (refreshResult.data) {
      // Store the new token
      api.dispatch({
        type: 'auth/setCredentials',
        payload: refreshResult.data,
      })

      // Retry the original query
      result = await baseQuery(args, api, extraOptions)
    } else {
      // Refresh failed, logout user
      api.dispatch({ type: 'auth/logout' })
    }
  }

  return result
}

// Create the base API
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'Product',
    'Collection',
    'Category',
    'Inventory',
    'Order',
    'Customer',
    'User',
    'ShopifySync',
    'Analytics',
    'Transfer',
    'Alert',
    'Location',
    'Adjustment',
  ],
  endpoints: () => ({}),
})

export default baseApi
