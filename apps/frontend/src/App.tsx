import React from 'react'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { NotificationProvider } from './components/common/NotificationProvider'
import './styles/globals.css'

function App() {
  return (
    <NotificationProvider>
      <RouterProvider router={router} />
    </NotificationProvider>
  )
}

export default App
