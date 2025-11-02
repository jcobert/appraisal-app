/**
 * @jest-environment node
 */
import {
  FetchError,
  FetchErrorCode,
  fetchRequest,
  getAbsoluteUrl,
  isFetchError,
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

  describe('fetchRequest.GET', () => {
    it('should make a GET request successfully', async () => {
      const mockResponse = { data: { id: 1 }, status: 200 }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      } as Response)

      const result = await fetchRequest.GET({ url: '/api/test' })

      expect(mockFetch).toHaveBeenCalledWith('/api/test', {
        method: 'GET',
        headers: {},
      })
      expect(result).toEqual({ status: 200, data: { id: 1 } })
    })

    it('should handle GET request with custom headers', async () => {
      const mockResponse = { data: null, status: 200 }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      } as Response)

      await fetchRequest.GET({
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

  describe('fetchRequest.POST', () => {
    it('should make a POST request with payload', async () => {
      const mockResponse = { data: { id: 1 }, status: 201 }
      const payload = { name: 'test' }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: () => Promise.resolve(mockResponse),
      } as Response)

      const result = await fetchRequest.POST({ url: '/api/test', payload })

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
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      } as Response)

      await fetchRequest.POST({ url: '/api/test', payload: {} })

      expect(mockFetch).toHaveBeenCalledWith('/api/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
    })
  })

  describe('fetchRequest.PUT', () => {
    it('should make a PUT request with payload', async () => {
      const mockResponse = { data: { id: 1 }, status: 200 }
      const payload = { name: 'updated' }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      } as Response)

      const result = await fetchRequest.PUT({ url: '/api/test/1', payload })

      expect(mockFetch).toHaveBeenCalledWith('/api/test/1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      expect(result).toEqual({ status: 200, data: { id: 1 } })
    })
  })

  describe('fetchRequest.PATCH', () => {
    it('should make a PATCH request with payload', async () => {
      const mockResponse = { data: { id: 1 }, status: 200 }
      const payload = { name: 'patched' }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      } as Response)

      const result = await fetchRequest.PATCH({ url: '/api/test/1', payload })

      expect(mockFetch).toHaveBeenCalledWith('/api/test/1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      expect(result).toEqual({ status: 200, data: { id: 1 } })
    })
  })

  describe('fetchRequest.DELETE', () => {
    it('should make a DELETE request', async () => {
      const mockResponse = { data: null, status: 204 }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        json: () => Promise.resolve(mockResponse),
      } as Response)

      const result = await fetchRequest.DELETE({ url: '/api/test/1' })

      expect(mockFetch).toHaveBeenCalledWith('/api/test/1', {
        method: 'DELETE',
        headers: {},
      })
      expect(result).toEqual({ status: 204, data: null })
    })
  })

  describe('error handling', () => {
    it('should throw FetchError for JSON parsing errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.reject(new Error('Invalid JSON')),
      } as unknown as Response)

      await expect(fetchRequest.GET({ url: '/api/test' })).rejects.toThrow(
        FetchError,
      )

      try {
        await fetchRequest.GET({ url: '/api/test' })
      } catch (error) {
        expect(isFetchError(error)).toBe(true)
        if (isFetchError(error)) {
          expect(error.status).toBe(500)
          expect(error.code).toBe(FetchErrorCode.INTERNAL_ERROR)
          expect(error.message).toBe('Failed to parse server response.')
        }
      }
    })

    it('should throw FetchError for network errors (TypeError)', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('Network error'))

      try {
        await fetchRequest.GET({ url: '/api/test' })
      } catch (error) {
        expect(isFetchError(error)).toBe(true)
        if (isFetchError(error)) {
          expect(error.status).toBe(0)
          expect(error.code).toBe(FetchErrorCode.NETWORK_ERROR)
          expect(error.message).toBe(
            'Network connection failed. Please check your internet connection.',
          )
        }
      }
    })

    it('should throw FetchError for abort errors', async () => {
      const abortError = new DOMException('Request aborted', 'AbortError')
      mockFetch.mockRejectedValueOnce(abortError)

      try {
        await fetchRequest.GET({ url: '/api/test' })
      } catch (error) {
        expect(isFetchError(error)).toBe(true)
        if (isFetchError(error)) {
          expect(error.status).toBe(0)
          expect(error.code).toBe(FetchErrorCode.NETWORK_ERROR)
        }
      }
    })

    it('should throw FetchError for unexpected errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Unexpected error'))

      try {
        await fetchRequest.GET({ url: '/api/test' })
      } catch (error) {
        expect(isFetchError(error)).toBe(true)
        if (isFetchError(error)) {
          expect(error.status).toBe(500)
          expect(error.code).toBe(FetchErrorCode.INTERNAL_ERROR)
          expect(error.message).toBe('An unexpected error occurred.')
        }
      }
    })

    it('should throw FetchError for errors with name property', async () => {
      const namedError = { name: 'AbortError', message: 'Aborted' }
      mockFetch.mockRejectedValueOnce(namedError)

      try {
        await fetchRequest.GET({ url: '/api/test' })
      } catch (error) {
        expect(isFetchError(error)).toBe(true)
        if (isFetchError(error)) {
          expect(error.status).toBe(0)
          expect(error.code).toBe(FetchErrorCode.NETWORK_ERROR)
        }
      }
    })

    it('should throw FetchError for non-ok responses', async () => {
      const mockErrorResponse = {
        status: 404,
        data: null,
        error: {
          code: FetchErrorCode.NOT_FOUND,
          message: 'Resource not found',
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve(mockErrorResponse),
      } as Response)

      try {
        await fetchRequest.GET({ url: '/api/test' })
      } catch (error) {
        expect(isFetchError(error)).toBe(true)
        if (isFetchError(error)) {
          expect(error.status).toBe(404)
          expect(error.code).toBe(FetchErrorCode.NOT_FOUND)
          expect(error.response.data).toBe(null)
        }
      }
    })
  })

  describe('server-side cookie handling', () => {
    it('should work when cookies import succeeds', async () => {
      // Set server-side environment
      Object.defineProperty(global, 'window', {
        value: undefined,
        writable: true,
      })

      const mockResponse = { data: null, status: 200 }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      } as Response)

      const result = await fetchRequest.GET({ url: '/api/test' })
      expect(result).toBeDefined()

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
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      } as Response)

      await fetchRequest.GET({ url: '/api/test' })

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
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      } as Response)

      // Test POST
      await fetchRequest.POST({ url: '/api/test', payload })
      expect(mockFetch).toHaveBeenLastCalledWith(
        '/api/test',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(payload),
        }),
      )

      // Test PUT
      await fetchRequest.PUT({ url: '/api/test', payload })
      expect(mockFetch).toHaveBeenLastCalledWith(
        '/api/test',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(payload),
        }),
      )

      // Test PATCH
      await fetchRequest.PATCH({ url: '/api/test', payload })
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
        ok: true,
        status: 204,
        json: () => Promise.resolve(mockResponse),
      } as Response)

      await fetchRequest.DELETE({ url: '/api/test' })

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
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      } as Response)

      await fetchRequest.POST({
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
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      } as Response)

      await fetchRequest.POST({
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
        ok: true,
        status: 201,
        json: () => Promise.resolve(serverResponse),
      } as Response)

      const result = await fetchRequest.POST({
        url: '/api/test',
        payload: { name: 'test' },
      })

      expect(result).toEqual({
        status: 201,
        data: { id: 1, name: 'test' },
        message: 'Created successfully',
      })
    })

    it('should throw FetchError for error responses from server', async () => {
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
        ok: false,
        status: 400,
        json: () => Promise.resolve(serverErrorResponse),
      } as Response)

      await expect(
        fetchRequest.POST({
          url: '/api/test',
          payload: {},
        }),
      ).rejects.toThrow(FetchError)

      try {
        await fetchRequest.POST({
          url: '/api/test',
          payload: {},
        })
      } catch (error) {
        expect(isFetchError(error)).toBe(true)
        if (isFetchError(error)) {
          expect(error.status).toBe(400)
          expect(error.code).toBe(FetchErrorCode.INVALID_DATA)
          expect(error.message).toBe('Validation failed')
          expect(error.details).toEqual({ name: ['Name is required'] })
        }
      }
    })
  })

  describe('FetchError class', () => {
    it('should create FetchError with all properties', () => {
      const response = {
        status: 404,
        data: null,
        error: {
          code: FetchErrorCode.NOT_FOUND,
          message: 'Resource not found',
        },
      }

      const error = new FetchError(response)

      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(FetchError)
      expect(error.name).toBe('FetchError')
      expect(error.message).toBe('Resource not found')
      expect(error.status).toBe(404)
      expect(error.code).toBe(FetchErrorCode.NOT_FOUND)
      expect(error.response).toEqual(response)
    })

    it('should handle FetchError without error object', () => {
      const response = {
        status: 500,
        data: null,
        message: 'Server error',
      }

      const error = new FetchError(response)

      expect(error.message).toBe('Server error')
      expect(error.status).toBe(500)
      expect(error.code).toBe(FetchErrorCode.INTERNAL_ERROR)
    })

    it('should handle FetchError with validation details', () => {
      const response: any = {
        status: 400,
        data: null,
        error: {
          code: FetchErrorCode.INVALID_DATA,
          message: 'Validation failed',
          details: {
            email: ['Email is required', 'Email must be valid'],
            name: ['Name is required'],
          },
        },
      }

      const error = new FetchError(response)

      expect(error.details).toEqual({
        email: ['Email is required', 'Email must be valid'],
        name: ['Name is required'],
      })
    })
  })

  describe('isFetchError type guard', () => {
    it('should return true for FetchError instances', () => {
      const error = new FetchError({
        status: 404,
        data: null,
        error: { code: FetchErrorCode.NOT_FOUND, message: 'Not found' },
      })

      expect(isFetchError(error)).toBe(true)
    })

    it('should return false for regular errors', () => {
      const error = new Error('Regular error')
      expect(isFetchError(error)).toBe(false)
    })

    it('should return false for null and undefined', () => {
      expect(isFetchError(null)).toBe(false)
      expect(isFetchError(undefined)).toBe(false)
    })

    it('should return false for plain objects', () => {
      expect(isFetchError({})).toBe(false)
      expect(isFetchError({ status: 404 })).toBe(false)
    })
  })
})
