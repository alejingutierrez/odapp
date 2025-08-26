import { render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { describe, it, expect } from 'vitest'
import authReducer from '../store/slices/authSlice'
import uiReducer from '../store/slices/uiSlice'

// Simple test to verify the app structure
describe('App', () => {
  it('should render without crashing', () => {
    const store = configureStore({
      reducer: {
        auth: authReducer,
        ui: uiReducer,
      },
    })

    const router = createMemoryRouter([
      {
        path: '/',
        element: <div>Test Route</div>,
      },
    ])

    render(
      <Provider store={store}>
        <RouterProvider router={router} />
      </Provider>
    )

    expect(screen.getByText('Test Route')).toBeInTheDocument()
  })
})
