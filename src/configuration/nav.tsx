import { RiOrganizationChart } from 'react-icons/ri'

import { NavItem } from '@/utils/nav'

export const NAVIGATION_ITEMS: NavItem[] = [
  {
    id: 'organizations',
    name: 'Organizations',
    url: '/organizations',
    icon: RiOrganizationChart,
    protected: true,
  },
  // { id: 'appraisers', name: 'Appraisers', url: '/appraisers', protected: true },
]
