import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { Spin } from 'antd'

import App from './App'
import { store, persistor } from './store'
import { ErrorBoundary } from './components/common/ErrorBoundary'

import './styles/globals.css'

// Performance monitoring setup
if (process.env.NODE_ENV === 'production') {
  // Initialize performance monitoring
  if ('PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach((entry) => {
        if (entry.entryType === 'navigation') {
          console.log('Navigation timing:', entry)
        }
      })
    })
    observer.observe({ entryTypes: ['navigation'] })
  }
}

// Global error handler
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error)
  // TODO: Send to error tracking service (Sentry, etc.)
})

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason)
  // TODO: Send to error tracking service (Sentry, etc.)
})

// Loading component for PersistGate
const PersistGateLoading: React.FC = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    flexDirection: 'column',
    gap: '16px'
  }}>
    <Spin size="large" />
    <div>Loading application...</div>
  </div>
)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <Provider store={store}>
        <PersistGate loading={<PersistGateLoading />} persistor={persistor}>
          <App />
        </PersistGate>
      </Provider>
    </ErrorBoundary>
  </React.StrictMode>
)
