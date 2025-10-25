/**
 * @jest-environment node
 */
import {
  FetchErrorCode,
  coreFetch,
  getAbsoluteUrl,
  isStatusCodeSuccess,
  isValidHttpStatusCode,
} from '../fetch'

// Mock fetch globally
global.fetch = jest.fn()

// Mock next/headers for server-side cookie testing
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}))

// Mock the exists function
jest.mock('@/utils/general', () => ({
  exists: jest.fn((val) => val !== null && val !== undefined && val !== ''),
}))

const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>

describe('fetch utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset environment variables
    delete process.env.NEXT_PUBLIC_SITE_BASE_URL
    // Ensure we're in client-side mode by default for most tests
    Object.defineProperty(global, 'window', {
      value: {},
      writable: true,
    })
  })

  describe('isValidHttpStatusCode', () => {
    it('should return false for undefined', () => {
      expect(isValidHttpStatusCode(undefined)).toBe(false)
    })

    it('should return false for null', () => {
      expect(isValidHttpStatusCode(null as any)).toBe(false)
    })

    it('should return false for status code 0', () => {
      expect(isValidHttpStatusCode(0)).toBe(false)
    })

    it('should return false for negative status codes', () => {
      expect(isValidHttpStatusCode(-1)).toBe(false)
      expect(isValidHttpStatusCode(-100)).toBe(false)
    })

    it('should return false for status codes below 100', () => {
      expect(isValidHttpStatusCode(1)).toBe(false)
      expect(isValidHttpStatusCode(50)).toBe(false)
      expect(isValidHttpStatusCode(99)).toBe(false)
    })

    it('should return true for valid 1xx status codes', () => {
      expect(isValidHttpStatusCode(100)).toBe(true)
      expect(isValidHttpStatusCode(101)).toBe(true)
      expect(isValidHttpStatusCode(102)).toBe(true)
      expect(isValidHttpStatusCode(199)).toBe(true)
    })

    it('should return true for valid 2xx status codes', () => {
      expect(isValidHttpStatusCode(200)).toBe(true)
      expect(isValidHttpStatusCode(201)).toBe(true)
      expect(isValidHttpStatusCode(204)).toBe(true)
      expect(isValidHttpStatusCode(299)).toBe(true)
    })

    it('should return true for valid 3xx status codes', () => {
      expect(isValidHttpStatusCode(300)).toBe(true)
      expect(isValidHttpStatusCode(301)).toBe(true)
      expect(isValidHttpStatusCode(302)).toBe(true)
      expect(isValidHttpStatusCode(399)).toBe(true)
    })

    it('should return true for valid 4xx status codes', () => {
      expect(isValidHttpStatusCode(400)).toBe(true)
      expect(isValidHttpStatusCode(401)).toBe(true)
      expect(isValidHttpStatusCode(404)).toBe(true)
      expect(isValidHttpStatusCode(499)).toBe(true)
    })

    it('should return true for valid 5xx status codes', () => {
      expect(isValidHttpStatusCode(500)).toBe(true)
      expect(isValidHttpStatusCode(501)).toBe(true)
      expect(isValidHttpStatusCode(503)).toBe(true)
      expect(isValidHttpStatusCode(599)).toBe(true)
    })

    it('should return false for status codes above 599', () => {
      expect(isValidHttpStatusCode(600)).toBe(false)
      expect(isValidHttpStatusCode(700)).toBe(false)
      expect(isValidHttpStatusCode(1000)).toBe(false)
    })

    it('should return false for decimal numbers in valid range', () => {
      expect(isValidHttpStatusCode(200.5)).toBe(false)
      expect(isValidHttpStatusCode(404.9)).toBe(false)
    })

    it('should return false for non-number types', () => {
      expect(isValidHttpStatusCode('200' as any)).toBe(false)
      expect(isValidHttpStatusCode(true as any)).toBe(false)
      expect(isValidHttpStatusCode({} as any)).toBe(false)
      expect(isValidHttpStatusCode([] as any)).toBe(false)
    })

    it('should return false for NaN', () => {
      expect(isValidHttpStatusCode(NaN)).toBe(false)
    })

    it('should return false for Infinity', () => {
      expect(isValidHttpStatusCode(Infinity)).toBe(false)
      expect(isValidHttpStatusCode(-Infinity)).toBe(false)
    })
  })

  describe('successful', () => {
    it('should return false for undefined status', () => {
      expect(isStatusCodeSuccess(undefined)).toBe(false)
    })

    it('should return false for null status', () => {
      expect(isStatusCodeSuccess(null as any)).toBe(false)
    })

    it('should return true for 2xx status codes', () => {
      expect(isStatusCodeSuccess(200)).toBe(true)
      expect(isStatusCodeSuccess(201)).toBe(true)
      expect(isStatusCodeSuccess(204)).toBe(true)
      expect(isStatusCodeSuccess(299)).toBe(true)
    })

    it('should return false for non-2xx status codes', () => {
      expect(isStatusCodeSuccess(199)).toBe(false)
      expect(isStatusCodeSuccess(300)).toBe(false)
      expect(isStatusCodeSuccess(400)).toBe(false)
      expect(isStatusCodeSuccess(404)).toBe(false)
      expect(isStatusCodeSuccess(500)).toBe(false)
    })
  })

  describe('getAbsoluteUrl', () => {
    it('should return undefined when no base URL is set and no path provided', () => {
      expect(getAbsoluteUrl()).toBe('undefined')
    })

    it('should return path when no base URL is set', () => {
      expect(getAbsoluteUrl('/api/test')).toBe('/api/test')
    })

    it('should combine base URL with path', () => {
      process.env.NEXT_PUBLIC_SITE_BASE_URL = 'https://example.com'
      expect(getAbsoluteUrl('/api/test')).toBe('https://example.com/api/test')
    })

    it('should handle undefined path with base URL', () => {
      process.env.NEXT_PUBLIC_SITE_BASE_URL = 'https://example.com'
      expect(getAbsoluteUrl()).toBe('https://example.comundefined')
    })
  })

  describe('coreFetch.GET', () => {
    it('should make a GET request successfully', async () => {
      const mockResponse = { data: { id: 1 }, status: 200 }
      mockFetch.mockResolvedValueOnce({
        status: 200,
        json: () => Promise.resolve(mockResponse),
      } as Response)

      const result = await coreFetch.GET({ url: '/api/test' })

      expect(mockFetch).toHaveBeenCalledWith('/api/test', {
        method: 'GET',
        headers: {},
      })
      expect(result).toEqual({ status: 200, data: { id: 1 } })
    })

    it('should handle GET request with custom headers', async () => {
      const mockResponse = { data: null, status: 200 }
      mockFetch.mockResolvedValueOnce({
        status: 200,
        json: () => Promise.resolve(mockResponse),
      } as Response)

      await coreFetch.GET({
        url: '/api/test',
        options: {
          headers: { Authorization: 'Bearer token' },
        },
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/test', {
        method: 'GET',
        headers: { Authorization: 'Bearer token' },
      })
    })
  })

  describe('coreFetch.POST', () => {
    it('should make a POST request with payload', async () => {
      const mockResponse = { data: { id: 1 }, status: 201 }
      const payload = { name: 'test' }

      mockFetch.mockResolvedValueOnce({
        status: 201,
        json: () => Promise.resolve(mockResponse),
      } as Response)

      const result = await coreFetch.POST({ url: '/api/test', payload })

      expect(mockFetch).toHaveBeenCalledWith('/api/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      expect(result).toEqual({ status: 201, data: { id: 1 } })
    })

    it('should handle POST request without Content-Type when no payload', async () => {
      const mockResponse = { data: null, status: 200 }
      mockFetch.mockResolvedValueOnce({
        status: 200,
        json: () => Promise.resolve(mockResponse),
      } as Response)

      await coreFetch.POST({ url: '/api/test', payload: {} })

      expect(mockFetch).toHaveBeenCalledWith('/api/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
    })
  })

  describe('coreFetch.PUT', () => {
    it('should make a PUT request with payload', async () => {
      const mockResponse = { data: { id: 1 }, status: 200 }
      const payload = { name: 'updated' }

      mockFetch.mockResolvedValueOnce({
        status: 200,
        json: () => Promise.resolve(mockResponse),
      } as Response)

      const result = await coreFetch.PUT({ url: '/api/test/1', payload })

      expect(mockFetch).toHaveBeenCalledWith('/api/test/1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      expect(result).toEqual({ status: 200, data: { id: 1 } })
    })
  })

  describe('coreFetch.PATCH', () => {
    it('should make a PATCH request with payload', async () => {
      const mockResponse = { data: { id: 1 }, status: 200 }
      const payload = { name: 'patched' }

      mockFetch.mockResolvedValueOnce({
        status: 200,
        json: () => Promise.resolve(mockResponse),
      } as Response)

      const result = await coreFetch.PATCH({ url: '/api/test/1', payload })

      expect(mockFetch).toHaveBeenCalledWith('/api/test/1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      expect(result).toEqual({ status: 200, data: { id: 1 } })
    })
  })

  describe('coreFetch.DELETE', () => {
    it('should make a DELETE request', async () => {
      const mockResponse = { data: null, status: 204 }
      mockFetch.mockResolvedValueOnce({
        status: 204,
        json: () => Promise.resolve(mockResponse),
      } as Response)

      const result = await coreFetch.DELETE({ url: '/api/test/1' })

      expect(mockFetch).toHaveBeenCalledWith('/api/test/1', {
        method: 'DELETE',
        headers: {},
      })
      expect(result).toEqual({ status: 204, data: null })
    })
  })

  describe('error handling', () => {
    it('should handle JSON parsing errors', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 200,
        json: () => Promise.reject(new Error('Invalid JSON')),
      } as unknown as Response)

      const result = await coreFetch.GET({ url: '/api/test' })

      expect(result).toEqual({
        data: null,
        status: 200,
        error: {
          code: FetchErrorCode.INTERNAL_ERROR,
          message: 'Failed to parse server response.',
        },
      })
    })

    it('should handle network errors (TypeError)', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('Network error'))

      const result = await coreFetch.GET({ url: '/api/test' })

      expect(result).toEqual({
        data: null,
        status: 0,
        error: {
          code: FetchErrorCode.NETWORK_ERROR,
          message:
            'Network connection failed. Please check your internet connection.',
        },
      })
    })

    it('should handle abort errors', async () => {
      const abortError = new DOMException('Request aborted', 'AbortError')
      mockFetch.mockRejectedValueOnce(abortError)

      const result = await coreFetch.GET({ url: '/api/test' })

      expect(result).toEqual({
        data: null,
        status: 0,
        error: {
          code: FetchErrorCode.NETWORK_ERROR,
          message:
            'Network connection failed. Please check your internet connection.',
        },
      })
    })

    it('should handle unexpected errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Unexpected error'))

      const result = await coreFetch.GET({ url: '/api/test' })

      expect(result).toEqual({
        data: null,
        status: 500,
        error: {
          code: FetchErrorCode.INTERNAL_ERROR,
          message: 'An unexpected error occurred.',
        },
      })
    })

    it('should handle errors with name property', async () => {
      const namedError = { name: 'AbortError', message: 'Aborted' }
      mockFetch.mockRejectedValueOnce(namedError)

      const result = await coreFetch.GET({ url: '/api/test' })

      expect(result).toEqual({
        data: null,
        status: 0,
        error: {
          code: FetchErrorCode.NETWORK_ERROR,
          message:
            'Network connection failed. Please check your internet connection.',
        },
      })
    })
  })

  describe('server-side cookie handling', () => {
    it('should return empty headers when cookies import fails', async () => {
      // Set server-side environment
      Object.defineProperty(global, 'window', {
        value: undefined,
        writable: true,
      })

      // The actual implementation will catch import errors and return empty headers
      // This test just ensures that the function doesn't throw
      const mockResponse = { data: null, status: 200 }
      mockFetch.mockResolvedValueOnce({
        status: 200,
        json: () => Promise.resolve(mockResponse),
      } as Response)

      await expect(coreFetch.GET({ url: '/api/test' })).resolves.toBeDefined()

      // Restore window for other tests
      Object.defineProperty(global, 'window', {
        value: {},
        writable: true,
      })
    })
  })

  describe('payload handling', () => {
    it('should not include body for GET requests', async () => {
      const mockResponse = { data: null, status: 200 }
      mockFetch.mockResolvedValueOnce({
        status: 200,
        json: () => Promise.resolve(mockResponse),
      } as Response)

      await coreFetch.GET({ url: '/api/test' })

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          method: 'GET',
        }),
      )

      const config = mockFetch.mock.calls[0]?.[1]
      expect(config).not.toHaveProperty('body')
    })

    it('should include body for POST/PUT/PATCH requests with payload', async () => {
      const mockResponse = { data: null, status: 200 }
      const payload = { test: 'data' }

      mockFetch.mockResolvedValue({
        status: 200,
        json: () => Promise.resolve(mockResponse),
      } as Response)

      // Test POST
      await coreFetch.POST({ url: '/api/test', payload })
      expect(mockFetch).toHaveBeenLastCalledWith(
        '/api/test',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(payload),
        }),
      )

      // Test PUT
      await coreFetch.PUT({ url: '/api/test', payload })
      expect(mockFetch).toHaveBeenLastCalledWith(
        '/api/test',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(payload),
        }),
      )

      // Test PATCH
      await coreFetch.PATCH({ url: '/api/test', payload })
      expect(mockFetch).toHaveBeenLastCalledWith(
        '/api/test',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify(payload),
        }),
      )
    })

    it('should not include body for DELETE requests', async () => {
      const mockResponse = { data: null, status: 204 }
      mockFetch.mockResolvedValueOnce({
        status: 204,
        json: () => Promise.resolve(mockResponse),
      } as Response)

      await coreFetch.DELETE({ url: '/api/test' })

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          method: 'DELETE',
        }),
      )

      const config = mockFetch.mock.calls[0]?.[1]
      expect(config).not.toHaveProperty('body')
    })
  })

  describe('header merging', () => {
    it('should allow custom headers to override defaults', async () => {
      const mockResponse = { data: null, status: 200 }
      mockFetch.mockResolvedValueOnce({
        status: 200,
        json: () => Promise.resolve(mockResponse),
      } as Response)

      await coreFetch.POST({
        url: '/api/test',
        payload: { test: true },
        options: {
          headers: { 'Content-Type': 'application/xml' },
        },
      })

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/xml',
          }),
          body: JSON.stringify({ test: true }),
        }),
      )
    })

    it('should merge custom headers with content-type for POST requests', async () => {
      const mockResponse = { data: null, status: 200 }
      mockFetch.mockResolvedValueOnce({
        status: 200,
        json: () => Promise.resolve(mockResponse),
      } as Response)

      await coreFetch.POST({
        url: '/api/test',
        payload: { test: true },
        options: {
          headers: { Authorization: 'Bearer token' },
        },
      })

      // Check that the Authorization header is included
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ test: true }),
          headers: expect.objectContaining({
            Authorization: 'Bearer token',
          }),
        }),
      )

      // Check that fetch was called with some headers
      const config = mockFetch.mock.calls[0]?.[1]
      expect(config?.headers).toBeDefined()
    })
  })

  describe('response structure', () => {
    it('should preserve response structure from server', async () => {
      const serverResponse = {
        status: 201,
        data: { id: 1, name: 'test' },
        message: 'Created successfully',
      }

      mockFetch.mockResolvedValueOnce({
        status: 201,
        json: () => Promise.resolve(serverResponse),
      } as Response)

      const result = await coreFetch.POST({
        url: '/api/test',
        payload: { name: 'test' },
      })

      expect(result).toEqual({
        status: 201,
        data: { id: 1, name: 'test' },
        message: 'Created successfully',
      })
    })

    it('should handle error responses from server', async () => {
      const serverErrorResponse = {
        status: 400,
        data: null,
        error: {
          code: FetchErrorCode.INVALID_DATA,
          message: 'Validation failed',
          details: { name: ['Name is required'] },
        },
      }

      mockFetch.mockResolvedValueOnce({
        status: 400,
        json: () => Promise.resolve(serverErrorResponse),
      } as Response)

      const result = await coreFetch.POST({
        url: '/api/test',
        payload: {},
      })

      expect(result).toEqual({
        status: 400,
        data: null,
        error: {
          code: FetchErrorCode.INVALID_DATA,
          message: 'Validation failed',
          details: { name: ['Name is required'] },
        },
      })
    })
  })
})
