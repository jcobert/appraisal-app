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
  MAX_BACKOFF_MULTIPLIER: 4, // max 4x backoff = 180s (3 minutes)
} as const

/**
 * Circuit breaker state for tracking consecutive failures.
 * Implements exponential backoff to prevent overwhelming a failing database.
 */
const circuitBreaker = {
  consecutiveFailures: 0,
  backoffMultiplier: 1,
  lastFailureTime: 0,

  /** Records a health check failure and increases backoff */
  recordFailure(): number {
    this.consecutiveFailures++
    this.lastFailureTime = Date.now()
    // Exponential backoff: 1x, 2x, 3x, 4x (capped at MAX_BACKOFF_MULTIPLIER)
    this.backoffMultiplier = Math.min(
      this.consecutiveFailures,
      HEALTH_CHECK_CONFIG.MAX_BACKOFF_MULTIPLIER,
    )
    return this.backoffMultiplier
  },

  /** Records a successful health check and resets backoff */
  recordSuccess(): void {
    this.consecutiveFailures = 0
    this.backoffMultiplier = 1
  },

  /** Returns current backoff TTL in seconds */
  getBackoffTTL(): number {
    return HEALTH_CHECK_CONFIG.DB_DOWN_TTL_SECONDS * this.backoffMultiplier
  },

  /** Returns current circuit breaker state for observability */
  getState() {
    return {
      consecutiveFailures: this.consecutiveFailures,
      backoffMultiplier: this.backoffMultiplier,
      lastFailureTime: this.lastFailureTime,
      currentBackoffSeconds: this.getBackoffTTL(),
    }
  },
}

/**
 * Checks database health via the /api/health endpoint.
 * Uses a tight timeout to prevent middleware from blocking too long.
 *
 * @param req - The incoming request
 * @returns `true` if DB is healthy, `false` otherwise
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
 * Implements dual cookie damping with exponential backoff circuit breaker.
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
    // Refresh cookie TTL with current circuit breaker backoff
    // This maintains exponential backoff even on the fast path
    const backoffTTL = circuitBreaker.getBackoffTTL()
    res.cookies.set(DB_DOWN_COOKIE, '1', {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: backoffTTL,
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
  // The cookie damping (30s for healthy, 45s+ for down) prevents overwhelming the health endpoint
  const healthy = await checkDatabaseHealth(req)

  if (!healthy) {
    // Record failure and get exponential backoff multiplier
    const multiplier = circuitBreaker.recordFailure()
    const backoffTTL = circuitBreaker.getBackoffTTL()

    const url = new URL(MAINTENANCE_PATH, req.url)
    const res = NextResponse.rewrite(url)

    // Set cookie with exponential backoff TTL (45s, 90s, 135s, or 180s)
    // This prevents overwhelming a failing DB while allowing eventual recovery checks
    res.cookies.set(DB_DOWN_COOKIE, '1', {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: backoffTTL,
    })

    // Clear the checked cookie since DB is now down (prevents conflicting state)
    res.cookies.delete(DB_CHECKED_COOKIE)

    // Log circuit breaker state in development for debugging
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log(
        `[Health Check] DB down - Circuit breaker: ${multiplier}x backoff (${backoffTTL}s TTL)`,
      )
    }

    return res
  }

  // DB is healthy - reset circuit breaker and set short-lived cookie
  circuitBreaker.recordSuccess()
  const res = NextResponse.next()
  res.cookies.set(DB_CHECKED_COOKIE, '1', {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: DB_CHECK_INTERVAL_SECONDS,
  })
  return res
}
