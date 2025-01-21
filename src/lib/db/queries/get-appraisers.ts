import { Appraiser } from '@prisma/client'

import { CORE_API_ENDPOINTS } from '@/lib/db/config'

import fetch from '@/utils/fetch'

export const getAppraisers = async ({
  server = false,
}: {
  server?: boolean
} = {}) => {
  return await fetch.GET<Appraiser[]>({
    url: `${server ? `${process.env.SITE_BASE_URL}` : ''}${CORE_API_ENDPOINTS.appraiser}`,
  })
}
