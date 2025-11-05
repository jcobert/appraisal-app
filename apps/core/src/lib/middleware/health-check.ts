import { NextRequest, NextResponse } from 'next/server'

import { FetchResponse } from '@/utils/fetch'

import { HealthCheckResponseData } from '@/app/api/health/route'

/**  Health check configuration constants */
export const HEALTH_CHECK_CONFIG = {
  DB_DOWN_COOKIE: 'app-db-down',
  DB_CHECKED_COOKIE: 'app-db-checked',
  DB_DOWN_TTL_SECONDS: 45, // dampen flapping by caching DB down state
  DB_CHECK_INTERVAL_SECONDS: 30, // only check health every 30s when healthy
  MAINTENANCE_PATH: '/maintenance',
  HEALTH_TIMEOUT_MS: 400, // matches health endpoint internal timeout
} as const

/**
 * Checks database health via the /api/health endpoint.
 * Uses a tight timeout to prevent middleware from blocking too long.
 *
 * @param req - The incoming request
 * @returns Promise<boolean> - true if DB is healthy, false otherwise
 */
export const checkDatabaseHealth = async (
  req: NextRequest,
): Promise<boolean> => {
  const healthUrl = new URL('/api/health', req.url)

  const controller = new AbortController()
  const timeoutId = setTimeout(
    () => controller.abort(),
    HEALTH_CHECK_CONFIG.HEALTH_TIMEOUT_MS,
  )

  try {
    const res = await fetch(healthUrl, {
      cache: 'no-store', // Never cache health status
      signal: controller.signal,
    })
    const data = (await res.json()) as FetchResponse<HealthCheckResponseData>
    // Verify both HTTP status and response payload match expected format
    return res.ok && data?.data?.healthy === true
  } catch {
    // Treat any fetch error (timeout, network, etc.) as unhealthy
    return false
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * Middleware handler for database health checking and maintenance mode.
 * Implements dual cookie damping to minimize health check overhead.
 *
 * @param req - The incoming request (after Kinde auth)
 * @returns NextResponse for rewrite/redirect, or void to continue
 */
export const handleDatabaseHealthCheck = async (
  req: NextRequest,
): Promise<NextResponse | void> => {
  const { pathname } = req.nextUrl
  const {
    DB_DOWN_COOKIE,
    DB_CHECKED_COOKIE,
    DB_DOWN_TTL_SECONDS,
    DB_CHECK_INTERVAL_SECONDS,
    MAINTENANCE_PATH,
  } = HEALTH_CHECK_CONFIG

  // Skip health checks for maintenance page itself to prevent redirect loops
  if (pathname.startsWith(MAINTENANCE_PATH)) return

  // Fast path: If DB already marked down via cookie, skip expensive health check
  // This dramatically reduces DB load during outages by relying on cached state
  const downCookie = req.cookies.get(DB_DOWN_COOKIE)
  if (downCookie) {
    const url = new URL(MAINTENANCE_PATH, req.url)
    const res = NextResponse.rewrite(url)
    // Refresh cookie TTL to extend damping period during prolonged outages
    res.cookies.set(DB_DOWN_COOKIE, '1', {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: DB_DOWN_TTL_SECONDS,
    })
    return res
  }

  // Check if we recently verified DB health (prevents excessive checks)
  const recentlyChecked = req.cookies.get(DB_CHECKED_COOKIE)
  if (recentlyChecked) {
    // DB was healthy recently, skip check to reduce load
    return
  }

  // Check health on all matched requests since Next.js RSC headers are inconsistent
  // The cookie damping (30s for healthy, 45s for down) prevents hammering the health endpoint
  const healthy = await checkDatabaseHealth(req)

  if (!healthy) {
    const url = new URL(MAINTENANCE_PATH, req.url)
    const res = NextResponse.rewrite(url)
    // Set cookie to dampen subsequent checks (prevents flapping)
    res.cookies.set(DB_DOWN_COOKIE, '1', {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: DB_DOWN_TTL_SECONDS,
    })
    return res
  }

  // DB is healthy - set a short-lived cookie to prevent repeated checks
  const res = NextResponse.next()
  res.cookies.set(DB_CHECKED_COOKIE, '1', {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: DB_CHECK_INTERVAL_SECONDS,
  })
  return res
}
