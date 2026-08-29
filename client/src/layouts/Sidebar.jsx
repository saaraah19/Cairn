import { NavLink } from 'react-router-dom'
import { Wordmark } from '../components/Logo.jsx'
import { navItems } from './navItems.js'
import './Sidebar.css'

export function Sidebar() {
  return (
    <nav className="sidebar" aria-label="Main navigation">
      <div className="sidebar-brand">
        <Wordmark />
      </div>

      <ul className="sidebar-list">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
            >
              <Icon />
              <span>{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
