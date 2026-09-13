import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar.jsx'
import { BottomTabBar } from './BottomTabBar.jsx'
import { Wordmark } from '../components/Logo.jsx'
import { NotificationBell } from '../features/notifications/NotificationBell.jsx'
import { NotificationsProvider } from '../features/notifications/NotificationsContext.jsx'
import './AppShell.css'

export function AppShell() {
  return (
    // Wraps Sidebar (bell), the mobile header (bell), and Outlet (which
    // renders NotificationsPage at /notifications) all under one provider,
    // so the bell's badge and the inbox page share a single unread count —
    // see NotificationsContext.jsx for why that's necessary.
    <NotificationsProvider>
      <div className="app-shell">
        <Sidebar />

        <div className="app-shell-main">
          <header className="mobile-header">
            <Wordmark />
            <NotificationBell />
          </header>

          <main className="app-shell-content">
            <Outlet />
          </main>
        </div>

        <BottomTabBar />
      </div>
    </NotificationsProvider>
  )
}
