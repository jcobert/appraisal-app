import { type NextRequest, NextResponse } from 'next/server'

/**
 * @jest-environment jsdom
 */

// Mock Kinde middleware to pass-through our handler unchanged for testing
jest.mock('@kinde-oss/kinde-auth-nextjs/middleware', () => ({
  withAuth: (fn: any) => fn,
}))

// Provide a minimal mock for next/server to avoid relying on global Request/Response in Node
jest.mock('next/server', () => {
  class MockNextRequest {
    url: string
    headers: { get: (name: string) => string | null }
    nextUrl: URL
    cookies: {
      get: (name: string) => { name: string; value: string } | undefined
    }

    constructor(input: string, init?: { headers?: Record<string, string> }) {
      this.url = input
      const raw = Object.entries(init?.headers || {})
      const map = new Map<string, string>(
        raw.map(([k, v]) => [k.toLowerCase(), v]),
      )
      this.headers = {
        get: (name: string) => map.get(name.toLowerCase()) ?? null,
      }
      this.nextUrl = new URL(input)

      const cookieHeader = map.get('cookie') || ''
      const cookieMap = new Map<string, string>()
      cookieHeader
        .split(';')
        .map((p) => p.trim())
        .filter(Boolean)
        .forEach((pair) => {
          const idx = pair.indexOf('=')
          if (idx > -1) {
            const key = pair.slice(0, idx).trim()
            const val = pair.slice(idx + 1).trim()
            cookieMap.set(key, val)
          }
        })
      this.cookies = {
        get: (name: string) =>
          cookieMap.has(name)
            ? { name, value: cookieMap.get(name)! }
            : undefined,
      }
    }
  }

  const MockNextResponse = {
    rewrite(url: URL) {
      const headers = new Map<string, string>()
      headers.set('x-middleware-rewrite', url.toString())
      return {
        headers: {
          get: (name: string) => headers.get(name.toLowerCase()) ?? null,
          set: (name: string, value: string) =>
            headers.set(name.toLowerCase(), value),
        },
        cookies: {
          set: jest.fn(),
        },
      }
    },
    next() {
      const headers = new Map<string, string>()
      return {
        headers: {
          get: (name: string) => headers.get(name.toLowerCase()) ?? null,
          set: (name: string, value: string) =>
            headers.set(name.toLowerCase(), value),
        },
        cookies: {
          set: jest.fn(),
        },
      }
    },
  }

  return { NextRequest: MockNextRequest, NextResponse: MockNextResponse }
})

describe('Middleware DB Health Gating', () => {
  const importMiddleware = async () => {
    // Re-import to apply mocks cleanly between tests
    jest.resetModules()
    const mod = await import('../middleware')
    return mod.default as (req: NextRequest) => Promise<NextResponse | void>
  }

  const makeRequest = (url: string, accept = 'text/html') => {
    const { NextRequest } = require('next/server')
    return new NextRequest(url, { headers: { accept } }) as NextRequest
  }

  beforeEach(() => {
    ;(global as any).fetch = jest.fn()
  })

  afterEach(() => {
    jest.restoreAllMocks()
    delete (global as any).fetch
  })

  it('rewrites to /maintenance when health endpoint is down', async () => {
    // Mock fetch to health to return 503
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ status: 503, data: null, error: {} }),
    } as any)

    const middleware = await importMiddleware()
    const req = makeRequest('https://example.com/dashboard')
    const res = await middleware(req)

    expect(res).toBeDefined()
    const rewrite = (res as any)!.headers.get('x-middleware-rewrite') || ''
    expect(rewrite.endsWith('/maintenance')).toBe(true)
  })

  it('sets db-checked cookie when health is OK', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 200,
        data: { healthy: true, timestamp: Date.now() },
        error: null,
      }),
    } as any)

    const middleware = await importMiddleware()
    const req = makeRequest('https://example.com/dashboard')
    const res = await middleware(req)

    // Should return NextResponse.next() with cookie set
    expect(res).toBeDefined()
    expect((res as any).cookies.set).toHaveBeenCalledWith(
      'app-db-checked',
      '1',
      expect.objectContaining({
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 30, // DB_CHECK_INTERVAL_SECONDS
      }),
    )
  })

  it('checks health on all matched requests (including non-HTML)', async () => {
    const fetchSpy = (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 200,
        data: { healthy: true, timestamp: Date.now() },
        error: null,
      }),
    } as any)

    const middleware = await importMiddleware()
    const req = makeRequest(
      'https://example.com/app.js',
      'application/javascript',
    )
    const res = await middleware(req)

    // Now checks health on all requests due to inconsistent RSC headers
    expect(fetchSpy).toHaveBeenCalled()
    expect(res).toBeDefined()
    expect((res as any).cookies.set).toHaveBeenCalledWith(
      'app-db-checked',
      '1',
      expect.any(Object),
    )
  })

  it('treats RSC (text/x-component) requests as navigations and rewrites when down', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ status: 503, data: null, error: {} }),
    } as any)

    const middleware = await importMiddleware()
    const req = makeRequest('https://example.com/', 'text/x-component')
    const res = await middleware(req)

    expect(res).toBeDefined()
    const rewrite = (res as any)!.headers.get('x-middleware-rewrite') || ''
    expect(rewrite.endsWith('/maintenance')).toBe(true)
  })

  it('refreshes cookie TTL when DB already marked down', async () => {
    const middleware = await importMiddleware()
    const { NextRequest } = require('next/server')
    const req = new NextRequest('https://example.com/dashboard', {
      headers: {
        accept: 'text/html',
        cookie: 'app-db-down=1',
      },
    })

    const res = await middleware(req)

    expect(res).toBeDefined()
    const rewrite = (res as any)!.headers.get('x-middleware-rewrite') || ''
    expect(rewrite.endsWith('/maintenance')).toBe(true)
    // Verify cookie was refreshed (set method called)
    expect((res as any).cookies.set).toHaveBeenCalledWith(
      'app-db-down',
      '1',
      expect.objectContaining({
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 45,
      }),
    )
    // Verify we didn't call health check (fast path optimization)
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('checks health even for prefetch requests (shouldCheckHealth returns true)', async () => {
    const fetchSpy = (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 200,
        data: { healthy: true, timestamp: Date.now() },
        error: null,
      }),
    } as any)

    const middleware = await importMiddleware()
    const { NextRequest } = require('next/server')
    const req = new NextRequest('https://example.com/dashboard', {
      headers: {
        accept: 'text/html',
        purpose: 'prefetch',
      },
    })

    const res = await middleware(req)

    // shouldCheckHealth returns true, so health is checked
    expect(fetchSpy).toHaveBeenCalled()
    expect(res).toBeDefined()
  })

  it('treats fetch timeout as unhealthy', async () => {
    // Mock fetch to timeout
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error('Timeout error'),
    )

    const middleware = await importMiddleware()
    const req = makeRequest('https://example.com/dashboard')
    const res = await middleware(req)

    expect(res).toBeDefined()
    const rewrite = (res as any)!.headers.get('x-middleware-rewrite') || ''
    expect(rewrite.endsWith('/maintenance')).toBe(true)
  })

  it('verifies health response payload structure', async () => {
    // Mock fetch with wrong payload format (missing data.healthy)
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 200, data: { healthy: false } }),
    } as any)

    const middleware = await importMiddleware()
    const req = makeRequest('https://example.com/dashboard')
    const res = await middleware(req)

    // Should rewrite because data.healthy !== true
    expect(res).toBeDefined()
    const rewrite = (res as any)!.headers.get('x-middleware-rewrite') || ''
    expect(rewrite.endsWith('/maintenance')).toBe(true)
  })

  it('returns NextResponse with db-checked cookie when health is properly formatted', async () => {
    // Mock correct response format
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 200,
        data: { healthy: true, timestamp: Date.now() },
        error: null,
      }),
    } as any)

    const middleware = await importMiddleware()
    const req = makeRequest('https://example.com/dashboard')
    const res = await middleware(req)

    // Returns NextResponse.next() with db-checked cookie
    expect(res).toBeDefined()
    expect((res as any).cookies.set).toHaveBeenCalledWith(
      'app-db-checked',
      '1',
      expect.any(Object),
    )
  })

  it('treats requests with next-router-state-tree header as navigations', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ status: 503, data: null, error: {} }),
    } as any)

    const middleware = await importMiddleware()
    const { NextRequest } = require('next/server')
    // Simulate Next.js App Router client-side navigation
    const req = new NextRequest('https://example.com/dashboard', {
      headers: {
        accept: '*/*',
        'next-router-state-tree': '%5B%22%22%2C%7B%22children%22',
      },
    })

    const res = await middleware(req)

    expect(res).toBeDefined()
    const rewrite = (res as any)!.headers.get('x-middleware-rewrite') || ''
    expect(rewrite.endsWith('/maintenance')).toBe(true)
  })

  it('treats requests with rsc=1 header as navigations', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ status: 503, data: null, error: {} }),
    } as any)

    const middleware = await importMiddleware()
    const { NextRequest } = require('next/server')
    // Simulate RSC request
    const req = new NextRequest('https://example.com/dashboard', {
      headers: {
        accept: '*/*',
        rsc: '1',
      },
    })

    const res = await middleware(req)

    expect(res).toBeDefined()
    const rewrite = (res as any)!.headers.get('x-middleware-rewrite') || ''
    expect(rewrite.endsWith('/maintenance')).toBe(true)
  })

  it('skips health check when db-checked cookie is present (damping for healthy state)', async () => {
    const fetchSpy = (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
    } as any)

    const middleware = await importMiddleware()
    const { NextRequest } = require('next/server')
    const req = new NextRequest('https://example.com/dashboard', {
      headers: {
        accept: 'text/html',
        cookie: 'app-db-checked=1',
      },
    })

    const res = await middleware(req)

    // Should skip health check and return early (undefined)
    expect(res).toBeUndefined()
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('sets db-down cookie with correct TTL when health check fails', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ status: 503, data: null, error: {} }),
    } as any)

    const middleware = await importMiddleware()
    const req = makeRequest('https://example.com/dashboard')
    const res = await middleware(req)

    expect(res).toBeDefined()
    expect((res as any).cookies.set).toHaveBeenCalledWith(
      'app-db-down',
      '1',
      expect.objectContaining({
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 45, // DB_DOWN_TTL_SECONDS
      }),
    )
  })

  it('skips maintenance page itself to prevent redirect loops', async () => {
    const fetchSpy = (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
    } as any)

    const middleware = await importMiddleware()
    const req = makeRequest('https://example.com/maintenance')
    const res = await middleware(req)

    // Should skip all checks for maintenance page
    expect(res).toBeUndefined()
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('handles requests with accept */* by checking health (fallback for inconsistent headers)', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 200,
        data: { healthy: true, timestamp: Date.now() },
        error: null,
      }),
    } as any)

    const middleware = await importMiddleware()
    const { NextRequest } = require('next/server')
    const req = new NextRequest('https://example.com/dashboard', {
      headers: {
        accept: '*/*',
      },
    })

    const res = await middleware(req)

    // Should check health even with generic accept header
    expect(global.fetch).toHaveBeenCalled()
    expect(res).toBeDefined()
    expect((res as any).cookies.set).toHaveBeenCalledWith(
      'app-db-checked',
      '1',
      expect.any(Object),
    )
  })

  it('prioritizes db-down cookie over db-checked cookie', async () => {
    const fetchSpy = (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
    } as any)

    const middleware = await importMiddleware()
    const { NextRequest } = require('next/server')
    // Both cookies present - db-down should take precedence
    const req = new NextRequest('https://example.com/dashboard', {
      headers: {
        accept: 'text/html',
        cookie: 'app-db-down=1; app-db-checked=1',
      },
    })

    const res = await middleware(req)

    // Should use fast path for db-down without checking health
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(res).toBeDefined()
    const rewrite = (res as any)!.headers.get('x-middleware-rewrite') || ''
    expect(rewrite.endsWith('/maintenance')).toBe(true)
  })

  it('calls health endpoint with correct URL and timeout', async () => {
    const fetchSpy = (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 200,
        data: { healthy: true, timestamp: Date.now() },
        error: null,
      }),
    } as any)

    const middleware = await importMiddleware()
    const req = makeRequest('https://example.com/dashboard')
    await middleware(req)

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        href: 'https://example.com/api/health',
      }),
      expect.objectContaining({
        cache: 'no-store',
        signal: expect.any(Object),
      }),
    )
  })
})
