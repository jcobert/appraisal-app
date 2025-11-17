import { QueryClient } from '@tanstack/react-query'

import { FetchError, FetchErrorCode, FetchResponse } from '@/utils/fetch'
import {
  createQueryClient,
  filteredQueryKey,
  prefetchQuery,
} from '@/utils/query'

describe('Query Utils', () => {
  describe('createQueryClient', () => {
    it('should create a QueryClient with default options', () => {
      const queryClient = createQueryClient()

      expect(queryClient).toBeInstanceOf(QueryClient)
      expect(
        queryClient.getDefaultOptions().queries?.refetchOnWindowFocus,
      ).toBe(false)
      expect(queryClient.getDefaultOptions().queries?.staleTime).toBe(
        5 * 60 * 1000,
      )
      expect(queryClient.getDefaultOptions().queries?.enabled).toBe(false)
    })

    it('should merge custom query options with defaults', () => {
      const queryClient = createQueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: true,
            retry: 3,
          },
        },
      })

      expect(
        queryClient.getDefaultOptions().queries?.refetchOnWindowFocus,
      ).toBe(true)
      expect(queryClient.getDefaultOptions().queries?.staleTime).toBe(
        5 * 60 * 1000,
      )
      expect(queryClient.getDefaultOptions().queries?.retry).toBe(3)
    })

    it('should allow overriding default staleTime', () => {
      const customStaleTime = 10 * 60 * 1000
      const queryClient = createQueryClient({
        defaultOptions: {
          queries: {
            staleTime: customStaleTime,
          },
        },
      })

      expect(queryClient.getDefaultOptions().queries?.staleTime).toBe(
        customStaleTime,
      )
    })

    it('should support mutation options', () => {
      const queryClient = createQueryClient({
        defaultOptions: {
          mutations: {
            retry: 2,
          },
        },
      })

      expect(queryClient.getDefaultOptions().mutations?.retry).toBe(2)
    })

    it('should support top-level QueryClient config', () => {
      const queryClient = createQueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: true,
          },
        },
      })

      expect(queryClient).toBeInstanceOf(QueryClient)
    })
  })

  describe('filteredQueryKey', () => {
    it('should return base key when no params provided', () => {
      const baseKey = ['organizations']
      const params = {}

      const result = filteredQueryKey(params, baseKey)

      expect(result).toEqual(['organizations'])
    })

    it('should append defined params to base key', () => {
      const baseKey = ['organizations']
      const params = { id: 'org-123', status: 'active' }

      const result = filteredQueryKey(params, baseKey)

      expect(result).toEqual([
        'organizations',
        { id: 'org-123', status: 'active' },
      ])
    })

    it('should filter out undefined params', () => {
      const baseKey = ['organizations']
      const params = { id: 'org-123', status: undefined, type: null }

      const result = filteredQueryKey(params, baseKey)

      expect(result).toEqual(['organizations', { id: 'org-123', type: null }])
    })

    it('should handle params with falsy values (except undefined)', () => {
      const baseKey = ['users']
      const params = { active: false, count: 0, name: '' }

      const result = filteredQueryKey(params, baseKey)

      expect(result).toEqual(['users', { active: false, count: 0, name: '' }])
    })

    it('should handle nested base keys', () => {
      const baseKey = ['organizations', 'members']
      const params = { organizationId: 'org-123' }

      const result = filteredQueryKey(params, baseKey)

      expect(result).toEqual([
        'organizations',
        'members',
        { organizationId: 'org-123' },
      ])
    })

    it('should handle multiple undefined params', () => {
      const baseKey = ['data']
      const params = {
        id: undefined,
        name: undefined,
        status: undefined,
      }

      const result = filteredQueryKey(params, baseKey)

      expect(result).toEqual(['data'])
    })

    it('should preserve param order in filtered object', () => {
      const baseKey = ['items']
      const params = { z: 'last', a: 'first', m: 'middle' }

      const result = filteredQueryKey(params, baseKey)

      expect(result).toEqual(['items', { z: 'last', a: 'first', m: 'middle' }])
    })
  })

  describe('prefetchQuery', () => {
    it('should return result when handler succeeds', async () => {
      const mockResponse: FetchResponse<{ id: string; name: string }> = {
        status: 200,
        data: { id: '1', name: 'Test Org' },
      }
      const handler = jest.fn().mockResolvedValue(mockResponse)

      const queryFn = prefetchQuery(handler)
      const result = await queryFn()

      expect(handler).toHaveBeenCalledTimes(1)
      expect(result).toEqual(mockResponse)
    })

    it('should throw FetchError when handler returns non-success status', async () => {
      const mockErrorResponse: FetchResponse<null> = {
        status: 404,
        data: null,
        error: {
          code: FetchErrorCode.NOT_FOUND,
          message: 'Organization not found',
        },
      }
      const handler = jest.fn().mockResolvedValue(mockErrorResponse)

      const queryFn = prefetchQuery(handler)

      await expect(queryFn()).rejects.toThrow(FetchError)

      try {
        await queryFn()
      } catch (error) {
        expect(error).toBeInstanceOf(FetchError)
        if (error instanceof FetchError) {
          expect(error.status).toBe(404)
          expect(error.code).toBe(FetchErrorCode.NOT_FOUND)
          expect(error.message).toBe('Organization not found')
        }
      }
    })

    it('should throw FetchError for 400 status', async () => {
      const mockErrorResponse: FetchResponse<null> = {
        status: 400,
        data: null,
        error: {
          code: FetchErrorCode.INVALID_DATA,
          message: 'Invalid request',
          details: {
            name: { code: 'invalid_type', message: 'Name is required' },
          },
        },
      }
      const handler = jest.fn().mockResolvedValue(mockErrorResponse)

      const queryFn = prefetchQuery(handler)

      await expect(queryFn()).rejects.toThrow(FetchError)

      try {
        await queryFn()
      } catch (error) {
        if (error instanceof FetchError) {
          expect(error.status).toBe(400)
          expect(error.code).toBe(FetchErrorCode.INVALID_DATA)
          expect(error.details).toEqual({
            name: { code: 'invalid_type', message: 'Name is required' },
          })
        }
      }
    })

    it('should throw FetchError for 500 status', async () => {
      const mockErrorResponse: FetchResponse<null> = {
        status: 500,
        data: null,
        error: {
          code: FetchErrorCode.INTERNAL_ERROR,
          message: 'Internal server error',
        },
      }
      const handler = jest.fn().mockResolvedValue(mockErrorResponse)

      const queryFn = prefetchQuery(handler)

      await expect(queryFn()).rejects.toThrow(FetchError)

      try {
        await queryFn()
      } catch (error) {
        if (error instanceof FetchError) {
          expect(error.status).toBe(500)
          expect(error.code).toBe(FetchErrorCode.INTERNAL_ERROR)
        }
      }
    })

    it('should handle success status with no data', async () => {
      const mockResponse: FetchResponse<null> = {
        status: 204,
        data: null,
      }
      const handler = jest.fn().mockResolvedValue(mockResponse)

      const queryFn = prefetchQuery(handler)
      const result = await queryFn()

      expect(result).toEqual(mockResponse)
    })

    it('should handle undefined status as non-success', async () => {
      const mockErrorResponse: FetchResponse<null> = {
        status: undefined,
        data: null,
        error: {
          code: FetchErrorCode.INTERNAL_ERROR,
          message: 'Unknown error',
        },
      }
      const handler = jest.fn().mockResolvedValue(mockErrorResponse)

      const queryFn = prefetchQuery(handler)

      await expect(queryFn()).rejects.toThrow(FetchError)
    })

    it('should preserve type information for data', async () => {
      type CustomData = { id: string; email: string; roles: string[] }
      const mockResponse: FetchResponse<CustomData> = {
        status: 200,
        data: {
          id: 'user-1',
          email: 'test@example.com',
          roles: ['admin', 'user'],
        },
      }
      const handler = jest.fn().mockResolvedValue(mockResponse)

      const queryFn = prefetchQuery<CustomData>(handler)
      const result = await queryFn()

      expect(result.data).toEqual(mockResponse.data)
      expect(result.data?.roles).toHaveLength(2)
    })

    it('should work with handlers that return arrays', async () => {
      type OrgData = { id: string; name: string }[]
      const mockResponse: FetchResponse<OrgData> = {
        status: 200,
        data: [
          { id: '1', name: 'Org 1' },
          { id: '2', name: 'Org 2' },
        ],
      }
      const handler = jest.fn().mockResolvedValue(mockResponse)

      const queryFn = prefetchQuery<OrgData>(handler)
      const result = await queryFn()

      expect(result.data).toHaveLength(2)
      expect(result.data?.[0]?.name).toBe('Org 1')
    })
  })
})
