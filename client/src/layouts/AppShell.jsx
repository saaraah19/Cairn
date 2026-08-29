import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar.jsx'
import { BottomTabBar } from './BottomTabBar.jsx'
import { Wordmark } from '../components/Logo.jsx'
import './AppShell.css'

export function AppShell() {
  return (
    <div className="app-shell">
      <Sidebar />

      <div className="app-shell-main">
        <header className="mobile-header">
          <Wordmark />
        </header>

        <main className="app-shell-content">
          <Outlet />
        </main>
      </div>

      <BottomTabBar />
    </div>
  )
}
