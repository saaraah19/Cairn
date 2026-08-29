import { HomeIcon, OutdoorsIcon, GearIcon, StatisticsIcon, ProfileIcon } from '../components/NavIcons.jsx'

// Single source of truth for the main navigation, shared by the desktop
// sidebar and the mobile bottom tab bar. Community/Explore is intentionally
// absent per 01_PRODUCT_SPEC.md §6 — it has no V1 functionality yet.
export const navItems = [
  { to: '/', label: 'Home', icon: HomeIcon, end: true },
  { to: '/outdoors', label: 'My Outdoors', icon: OutdoorsIcon },
  { to: '/gear', label: 'Gear', icon: GearIcon },
  { to: '/statistics', label: 'Statistics', icon: StatisticsIcon },
  { to: '/profile', label: 'Profile', icon: ProfileIcon },
]
