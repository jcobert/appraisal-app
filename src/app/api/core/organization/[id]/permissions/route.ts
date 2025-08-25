import { NextRequest, NextResponse } from 'next/server'

import { handleGetOrganizationPermissions } from '@/lib/db/handlers/organization-handlers'
import { toNextResponse } from '@/lib/api-handlers'

import { FetchErrorCode, FetchResponse } from '@/utils/fetch'

export const GET = async (
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const organizationId = (await params)?.id
  
  if (!organizationId) {
    return NextResponse.json(
      {
        error: {
          code: FetchErrorCode.INVALID_DATA,
          message: 'Missing organization ID.',
        },
        data: null,
      } satisfies FetchResponse,
      { status: 400 },
    )
  }

  const result = await handleGetOrganizationPermissions(organizationId)
  return toNextResponse(result)
}
