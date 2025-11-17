import { prisma } from '@repo/database'

import { FetchErrorCode, FetchResponse } from '@/utils/fetch'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export type HealthCheckResponseData = { healthy: boolean; timestamp: number }

/**
 * Generic timeout wrapper for promises.
 * Used to enforce a strict timeout on database queries to prevent blocking.
 */
const withTimeout = <T>(prom: Promise<T>, ms: number): Promise<T> => {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => reject(new Error('timeout')), ms)
    prom.then(
      (v) => {
        clearTimeout(id)
        resolve(v)
      },
      (e) => {
        clearTimeout(id)
        reject(e)
      },
    )
  })
}

/**
 * Health check endpoint for database connectivity.
 * Used by middleware to gate app access during outages and by external monitoring.
 * Returns standardized FetchResponse format for consistency with other API endpoints.
 *
 * @returns 200 with healthy status or 503 with error details
 */
export const GET = async () => {
  try {
    // Fast DB liveness probe with 400ms timeout to prevent blocking
    // Simple SELECT 1 query is sufficient to verify connectivity
    await withTimeout(prisma.$queryRaw`SELECT 1`, 400)

    return Response.json(
      {
        status: 200,
        data: { healthy: true, timestamp: Date.now() },
      } satisfies FetchResponse<HealthCheckResponseData>,
      {
        status: 200,
        headers: { 'cache-control': 'no-store, max-age=0' },
      },
    )
  } catch {
    return Response.json(
      {
        status: 503,
        data: { healthy: false, timestamp: Date.now() },
        error: {
          code: FetchErrorCode.DATABASE_FAILURE,
          message: 'Database is unavailable',
        },
      } satisfies FetchResponse<HealthCheckResponseData>,
      {
        status: 503,
        headers: { 'cache-control': 'no-store, max-age=0' },
      },
    )
  }
}
