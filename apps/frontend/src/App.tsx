import { RouterProvider } from 'react-router-dom'

import { NotificationProvider } from './components/common/NotificationProvider'
import { router } from './router'
import './styles/globals.css'

function App() {
  return (
    <NotificationProvider>
      <RouterProvider router={router} />
    </NotificationProvider>
  )
}

export default App
