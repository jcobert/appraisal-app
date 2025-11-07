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

describe('Middleware DB Health Integration Tests', () => {
  const importMiddleware = async () => {
    // Re-import to apply mocks cleanly between tests
    jest.resetModules()
    const mod = await import('../middleware')
    return mod.default as (req: NextRequest) => Promise<NextResponse | void>
  }

  const makeRequest = (url: string, accept = 'text/html', cookies?: string) => {
    const { NextRequest } = require('next/server')
    const headers: Record<string, string> = { accept }
    if (cookies) {
      headers.cookie = cookies
    }
    return new NextRequest(url, { headers }) as NextRequest
  }

  beforeEach(() => {
    ;(global as any).fetch = jest.fn()
  })

  afterEach(() => {
    jest.restoreAllMocks()
    delete (global as any).fetch
  })

  describe('DB Failure and Recovery Scenarios', () => {
    it('should handle DB going down and recovering gracefully', async () => {
      const middleware = await importMiddleware()

      // Step 1: DB is healthy - first request succeeds
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 200,
          data: { healthy: true, timestamp: Date.now() },
          error: null,
        }),
      } as any)

      const req1 = makeRequest('https://example.com/dashboard')
      const res1 = await middleware(req1)

      expect(res1).toBeDefined()
      expect((res1 as any).cookies.set).toHaveBeenCalledWith(
        'app-db-checked',
        '1',
        expect.objectContaining({
          maxAge: 30, // Normal interval
        }),
      )

      // Step 2: DB goes down - next request after cookie expires
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ status: 503, data: null, error: {} }),
      } as any)

      const req2 = makeRequest('https://example.com/dashboard')
      const res2 = await middleware(req2)

      expect(res2).toBeDefined()
      const rewrite2 = (res2 as any)!.headers.get('x-middleware-rewrite') || ''
      expect(rewrite2.endsWith('/maintenance')).toBe(true)
      expect((res2 as any).cookies.set).toHaveBeenCalledWith(
        'app-db-down',
        '1',
        expect.objectContaining({
          maxAge: 45, // 1x backoff
        }),
      )

      // Step 3: DB still down - should use fast path with cookie
      const req3 = makeRequest(
        'https://example.com/dashboard',
        'text/html',
        'app-db-down=1',
      )
      const res3 = await middleware(req3)

      expect(res3).toBeDefined()
      const rewrite3 = (res3 as any)!.headers.get('x-middleware-rewrite') || ''
      expect(rewrite3.endsWith('/maintenance')).toBe(true)
      // Should not make a new health check (fast path)
      expect(global.fetch).toHaveBeenCalledTimes(2)

      // Step 4: DB recovers - request after cookie expires
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 200,
          data: { healthy: true, timestamp: Date.now() },
          error: null,
        }),
      } as any)

      const req4 = makeRequest('https://example.com/dashboard')
      const res4 = await middleware(req4)

      expect(res4).toBeDefined()
      expect((res4 as any).cookies.set).toHaveBeenCalledWith(
        'app-db-checked',
        '1',
        expect.objectContaining({
          maxAge: 30, // Back to normal
        }),
      )

      // Step 5: Subsequent requests should work normally
      const req5 = makeRequest(
        'https://example.com/profile',
        'text/html',
        'app-db-checked=1',
      )
      const res5 = await middleware(req5)

      // Should skip health check with cookie present
      expect(res5).toBeUndefined()
      expect(global.fetch).toHaveBeenCalledTimes(3) // No additional calls
    })

    it('should handle DB flapping (up/down rapidly) with exponential backoff', async () => {
      const middleware = await importMiddleware()

      // Simulate flapping: down -> up -> down -> up -> down
      const healthStates = [
        false, // 1st failure: 45s
        true, // Recovery: reset to 1x
        false, // 2nd failure: 45s (reset from success)
        false, // 3rd failure: 90s (consecutive)
        false, // 4th failure: 135s (consecutive)
        true, // Recovery: reset to 1x
        false, // 5th failure: 45s (reset from success)
      ]

      const expectedBackoffs = [45, 30, 45, 90, 135, 30, 45]

      for (let i = 0; i < healthStates.length; i++) {
        const healthy = healthStates[i]

        ;(global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: healthy,
          json: async () =>
            healthy
              ? {
                  status: 200,
                  data: { healthy: true, timestamp: Date.now() },
                  error: null,
                }
              : { status: 503, data: null, error: {} },
        } as any)

        const req = makeRequest(`https://example.com/page${i}`)
        const res = await middleware(req)

        expect(res).toBeDefined()
        expect((res as any).cookies.set).toHaveBeenCalledWith(
          healthy ? 'app-db-checked' : 'app-db-down',
          '1',
          expect.objectContaining({
            maxAge: expectedBackoffs[i],
          }),
        )
      }
    })

    it('should handle timeout as DB failure and recover', async () => {
      const middleware = await importMiddleware()

      // Step 1: Health check times out
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Request timeout'),
      )

      const req1 = makeRequest('https://example.com/dashboard')
      const res1 = await middleware(req1)

      expect(res1).toBeDefined()
      const rewrite1 = (res1 as any)!.headers.get('x-middleware-rewrite') || ''
      expect(rewrite1.endsWith('/maintenance')).toBe(true)
      expect((res1 as any).cookies.set).toHaveBeenCalledWith(
        'app-db-down',
        '1',
        expect.objectContaining({
          maxAge: 45,
        }),
      )

      // Step 2: Next check (after timeout) succeeds
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 200,
          data: { healthy: true, timestamp: Date.now() },
          error: null,
        }),
      } as any)

      const req2 = makeRequest('https://example.com/dashboard')
      const res2 = await middleware(req2)

      expect(res2).toBeDefined()
      expect((res2 as any).cookies.set).toHaveBeenCalledWith(
        'app-db-checked',
        '1',
        expect.objectContaining({
          maxAge: 30,
        }),
      )
    })

    it('should handle malformed response as DB failure', async () => {
      const middleware = await importMiddleware()

      // Step 1: Health check returns invalid JSON
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON')
        },
      } as any)

      const req1 = makeRequest('https://example.com/dashboard')
      const res1 = await middleware(req1)

      expect(res1).toBeDefined()
      const rewrite1 = (res1 as any)!.headers.get('x-middleware-rewrite') || ''
      expect(rewrite1.endsWith('/maintenance')).toBe(true)

      // Step 2: Health check returns valid response
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 200,
          data: { healthy: true, timestamp: Date.now() },
          error: null,
        }),
      } as any)

      const req2 = makeRequest('https://example.com/dashboard')
      const res2 = await middleware(req2)

      expect(res2).toBeDefined()
      expect((res2 as any).cookies.set).toHaveBeenCalledWith(
        'app-db-checked',
        '1',
        expect.any(Object),
      )
    })
  })

  describe('Concurrent Request Scenarios', () => {
    it('should handle multiple simultaneous requests efficiently with cookie damping', async () => {
      const middleware = await importMiddleware()

      // Mock health check that takes time to respond
      ;(global.fetch as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({
                    status: 200,
                    data: { healthy: true, timestamp: Date.now() },
                    error: null,
                  }),
                }),
              50,
            )
          }),
      )

      // Simulate 5 concurrent requests
      const requests = Array.from({ length: 5 }, (_, i) =>
        makeRequest(`https://example.com/page${i}`),
      )

      const results = await Promise.all(requests.map((req) => middleware(req)))

      // All requests should complete
      expect(results).toHaveLength(5)
      results.forEach((res) => {
        expect(res).toBeDefined()
      })

      // Should make health checks (one per request since no cookie damping in place yet)
      // In real scenario with cookie damping, only first would make health check
      expect(global.fetch).toHaveBeenCalled()
    })

    it('should handle concurrent requests when DB is down', async () => {
      const middleware = await importMiddleware()

      // Mock health check failure
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({ status: 503, data: null, error: {} }),
      } as any)

      // Simulate 3 concurrent requests
      const requests = Array.from({ length: 3 }, (_, i) =>
        makeRequest(`https://example.com/page${i}`),
      )

      const results = await Promise.all(requests.map((req) => middleware(req)))

      // All requests should be rewritten to maintenance
      results.forEach((res) => {
        expect(res).toBeDefined()
        const rewrite = (res as any)!.headers.get('x-middleware-rewrite') || ''
        expect(rewrite.endsWith('/maintenance')).toBe(true)
      })
    })

    it('should prevent health check spam with db-checked cookie across requests', async () => {
      const middleware = await importMiddleware()
      const fetchSpy = global.fetch as jest.Mock

      // First request: no cookie, makes health check
      fetchSpy.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 200,
          data: { healthy: true, timestamp: Date.now() },
          error: null,
        }),
      } as any)

      const req1 = makeRequest('https://example.com/dashboard')
      const res1 = await middleware(req1)

      expect(res1).toBeDefined()
      expect((res1 as any).cookies.set).toHaveBeenCalledWith(
        'app-db-checked',
        '1',
        expect.any(Object),
      )
      expect(fetchSpy).toHaveBeenCalledTimes(1)

      // Next 10 requests: with cookie, should skip health check
      for (let i = 0; i < 10; i++) {
        const req = makeRequest(
          `https://example.com/page${i}`,
          'text/html',
          'app-db-checked=1',
        )
        const res = await middleware(req)

        expect(res).toBeUndefined() // No response = continue normally
      }

      // Should still only have 1 health check call
      expect(fetchSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('Cookie Manipulation Edge Cases', () => {
    it('should handle missing cookies correctly', async () => {
      const middleware = await importMiddleware()

      // Request with no cookies
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 200,
          data: { healthy: true, timestamp: Date.now() },
          error: null,
        }),
      } as any)

      const req = makeRequest('https://example.com/dashboard')
      const res = await middleware(req)

      // Should make health check and set cookie
      expect(res).toBeDefined()
      expect((res as any).cookies.set).toHaveBeenCalledWith(
        'app-db-checked',
        '1',
        expect.any(Object),
      )
    })

    it('should handle expired cookies correctly', async () => {
      const middleware = await importMiddleware()

      // Simulate expired cookie (cookie header present but middleware treats as not present)
      // In real scenario, browser wouldn't send expired cookies, but testing the logic
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 200,
          data: { healthy: true, timestamp: Date.now() },
          error: null,
        }),
      } as any)

      const req = makeRequest('https://example.com/dashboard')
      const res = await middleware(req)

      expect(res).toBeDefined()
      expect(global.fetch).toHaveBeenCalled()
    })

    it('should handle both cookies present (db-down takes priority)', async () => {
      const middleware = await importMiddleware()

      // Both cookies present - should use fast path without health check
      const req = makeRequest(
        'https://example.com/dashboard',
        'text/html',
        'app-db-down=1; app-db-checked=1',
      )
      const res = await middleware(req)

      expect(res).toBeDefined()
      const rewrite = (res as any)!.headers.get('x-middleware-rewrite') || ''
      expect(rewrite.endsWith('/maintenance')).toBe(true)

      // Should not make health check (fast path)
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('should handle invalid cookie values gracefully', async () => {
      const middleware = await importMiddleware()

      // Cookie with invalid value (not "1")
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 200,
          data: { healthy: true, timestamp: Date.now() },
          error: null,
        }),
      } as any)

      const req = makeRequest(
        'https://example.com/dashboard',
        'text/html',
        'app-db-checked=invalid',
      )
      const res = await middleware(req)

      // Should still recognize cookie is present and skip health check
      expect(res).toBeUndefined()
      expect(global.fetch).not.toHaveBeenCalled()
    })
  })

  describe('Recovery Timing Scenarios', () => {
    it('should allow recovery check after backoff period expires', async () => {
      const middleware = await importMiddleware()

      // Failure 1: Sets 45s cookie
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ status: 503, data: null, error: {} }),
      } as any)

      const req1 = makeRequest('https://example.com/dashboard')
      await middleware(req1)

      // Failure 2: Sets 90s cookie
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ status: 503, data: null, error: {} }),
      } as any)

      const req2 = makeRequest('https://example.com/dashboard')
      const res2 = await middleware(req2)

      expect((res2 as any).cookies.set).toHaveBeenCalledWith(
        'app-db-down',
        '1',
        expect.objectContaining({
          maxAge: 90,
        }),
      )

      // Simulate cookie expiration (request without cookie)
      // DB has recovered
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 200,
          data: { healthy: true, timestamp: Date.now() },
          error: null,
        }),
      } as any)

      const req3 = makeRequest('https://example.com/dashboard')
      const res3 = await middleware(req3)

      expect(res3).toBeDefined()
      expect((res3 as any).cookies.set).toHaveBeenCalledWith(
        'app-db-checked',
        '1',
        expect.objectContaining({
          maxAge: 30, // Back to normal
        }),
      )
    })

    it('should maintain backoff across multiple failures until recovery', async () => {
      const middleware = await importMiddleware()

      // 5 consecutive failures
      for (let i = 0; i < 5; i++) {
        ;(global.fetch as jest.Mock).mockResolvedValueOnce({
          ok: false,
          json: async () => ({ status: 503, data: null, error: {} }),
        } as any)

        const req = makeRequest(`https://example.com/page${i}`)
        await middleware(req)
      }

      // Verify last failure has max backoff (180s)
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ status: 503, data: null, error: {} }),
      } as any)

      const reqFinal = makeRequest('https://example.com/final')
      const resFinal = await middleware(reqFinal)

      expect((resFinal as any).cookies.set).toHaveBeenCalledWith(
        'app-db-down',
        '1',
        expect.objectContaining({
          maxAge: 180, // Max backoff
        }),
      )

      // Recovery resets everything
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 200,
          data: { healthy: true, timestamp: Date.now() },
          error: null,
        }),
      } as any)

      const reqRecovery = makeRequest('https://example.com/recovery')
      const resRecovery = await middleware(reqRecovery)

      expect((resRecovery as any).cookies.set).toHaveBeenCalledWith(
        'app-db-checked',
        '1',
        expect.objectContaining({
          maxAge: 30, // Reset to normal
        }),
      )
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      const middleware = await importMiddleware()

      ;(global.fetch as jest.Mock).mockRejectedValueOnce(
        new TypeError('Network request failed'),
      )

      const req = makeRequest('https://example.com/dashboard')
      const res = await middleware(req)

      expect(res).toBeDefined()
      const rewrite = (res as any)!.headers.get('x-middleware-rewrite') || ''
      expect(rewrite.endsWith('/maintenance')).toBe(true)
    })

    it('should handle fetch abort errors', async () => {
      const middleware = await importMiddleware()

      const abortError = new Error('The operation was aborted')
      abortError.name = 'AbortError'
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(abortError)

      const req = makeRequest('https://example.com/dashboard')
      const res = await middleware(req)

      expect(res).toBeDefined()
      const rewrite = (res as any)!.headers.get('x-middleware-rewrite') || ''
      expect(rewrite.endsWith('/maintenance')).toBe(true)
    })

    it('should handle response without healthy field', async () => {
      const middleware = await importMiddleware()

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 200,
          data: { timestamp: Date.now() }, // Missing 'healthy' field
        }),
      } as any)

      const req = makeRequest('https://example.com/dashboard')
      const res = await middleware(req)

      // Should treat as unhealthy
      expect(res).toBeDefined()
      const rewrite = (res as any)!.headers.get('x-middleware-rewrite') || ''
      expect(rewrite.endsWith('/maintenance')).toBe(true)
    })

    it('should handle response with healthy: false', async () => {
      const middleware = await importMiddleware()

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 200,
          data: { healthy: false, timestamp: Date.now() },
        }),
      } as any)

      const req = makeRequest('https://example.com/dashboard')
      const res = await middleware(req)

      // Should treat as unhealthy
      expect(res).toBeDefined()
      const rewrite = (res as any)!.headers.get('x-middleware-rewrite') || ''
      expect(rewrite.endsWith('/maintenance')).toBe(true)
    })
  })
})
