import { HomeIcon, OutdoorsIcon, GearIcon, StatisticsIcon, ProfileIcon, ExploreIcon } from '../components/NavIcons.jsx'

// Single source of truth for the main navigation, shared by the desktop
// sidebar and the mobile bottom tab bar. Explore was intentionally absent
// per 01_PRODUCT_SPEC.md §6 until Community had real functionality behind
// it — that condition is now met (docs/08_COMMUNITY_PROPOSAL.md M4).
export const navItems = [
  { to: '/', label: 'Home', icon: HomeIcon, end: true },
  { to: '/outdoors', label: 'My Outdoors', icon: OutdoorsIcon },
  { to: '/gear', label: 'Gear', icon: GearIcon },
  { to: '/statistics', label: 'Statistics', icon: StatisticsIcon },
  { to: '/explore', label: 'Explore', icon: ExploreIcon },
  { to: '/profile', label: 'Profile', icon: ProfileIcon },
]