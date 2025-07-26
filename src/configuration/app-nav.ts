import { LayoutDashboard } from 'lucide-react'
import { RiOrganizationChart } from 'react-icons/ri'

import { NavItem } from '@/utils/nav'

/** Navigation menu items for the authenticated app. */
export const APP_NAVIGATION_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    url: '/dashboard',
    icon: LayoutDashboard,
    protected: true,
  },
  {
    id: 'organizations',
    name: 'Organizations',
    url: '/organizations',
    icon: RiOrganizationChart,
    protected: true,
  },
]
