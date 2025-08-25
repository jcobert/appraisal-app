import { Organization } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'

import { organizationSchema } from '@/lib/db/schemas/organization'
import { handleGetOrganization, handleUpdateOrganization, handleDeleteOrganization } from '@/lib/db/handlers/organization-handlers'
import { toNextResponse } from '@/lib/api-handlers'

import { isAuthenticated } from '@/utils/auth'
import { FetchErrorCode, FetchResponse } from '@/utils/fetch'
import { validatePayload } from '@/utils/zod'

// =============
//      GET
// =============
export const GET = async (
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const organizationId = (await params)?.id
  const result = await handleGetOrganization(organizationId)
  return toNextResponse(result)
}

// =============
//      PUT
// =============
export const PUT = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { allowed, user } = await isAuthenticated()

  // No user
  if (!allowed) {
    return NextResponse.json(
      {
        error: {
          code: FetchErrorCode.AUTH,
          message: 'User not authenticated.',
        },
        data: null,
      } satisfies FetchResponse<Organization>,
      { status: 401 },
    )
  }

  try {
    const organizationId = (await params)?.id
    const payload = (await req.json()) as Organization

    const validation = validatePayload(organizationSchema.api, payload)

    // Bad data from client
    if (!validation?.success) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: FetchErrorCode.INVALID_DATA,
            message: 'Invalid data provided.',
            details: validation?.errors,
          },
        } satisfies FetchResponse<Organization>,
        { status: 400 },
      )
    }

    const result = await handleUpdateOrganization(organizationId, {
      ...payload,
      updatedBy: user?.id,
    })
    
    return toNextResponse(result)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log('\n\nError updating organization:\n', error)
    return NextResponse.json(
      {
        data: null,
        error: {
          code: FetchErrorCode.FAILURE,
          message: 'An unknown failure occurred.',
        },
      } satisfies FetchResponse<Organization>,
      { status: 500 },
    )
  }
}

// ==============
//     DELETE
// ==============
export const DELETE = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const organizationId = (await params)?.id
  
  // Bad data from client
  if (!organizationId) {
    return NextResponse.json(
      {
        data: null,
        error: {
          code: FetchErrorCode.INVALID_DATA,
          message: 'Missing required fields.',
        },
      } satisfies FetchResponse<Organization>,
      { status: 400 },
    )
  }

  const result = await handleDeleteOrganization(organizationId)
  return toNextResponse(result)
}
