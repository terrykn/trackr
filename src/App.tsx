import { createBrowserRouter, RouterProvider } from 'react-router'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import StatsPage from './pages/StatsPage'
import TimerPage from './pages/TimerPage'
import { KonstaProvider } from 'konsta/react'
import { App as KonstaApp } from 'konsta/react'
import CreateEventPage from './pages/CreateEventPage'
import EditEventPage from './pages/EditEventPage'

function App() {
  const router = createBrowserRouter([
    {
      path: '/',
      element: <HomePage />
    },
    {
      path: '/login',
      element: <LoginPage />
    },
    {
      path: '/stats',
      element: <StatsPage />
    },
    {
      path: '/timer',
      element: <TimerPage />
    },
    {
      path: '/create',
      element: <CreateEventPage />
    },
    {
      path: '/edit/:eventId',
      element: <EditEventPage />
    }
  ])

  return (
    <KonstaProvider theme='ios'>
      <KonstaApp theme='ios'>
        <RouterProvider router={router} />
      </KonstaApp>
    </KonstaProvider>
  )
}

export default App
