import { MdOutlineSpaceDashboard } from 'react-icons/md'
import { RiOrganizationChart } from 'react-icons/ri'

import { NavItem } from '@/utils/nav'

export const NAVIGATION_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    url: '/dashboard',
    icon: MdOutlineSpaceDashboard,
    protected: true,
  },
  {
    id: 'organizations',
    name: 'Organizations',
    url: '/organizations',
    icon: RiOrganizationChart,
    protected: true,
  },
  // { id: 'appraisers', name: 'Appraisers', url: '/appraisers', protected: true },
]
