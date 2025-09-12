/**
 * @jest-environment node
 */
import {
  type ApiHandlerConfig,
  createApiHandler,
  toNextResponse,
  withUserFields,
} from '../api-handlers'
import {
  AuthorizationError,
  DatabaseConnectionError,
  DatabaseConstraintError,
  NotFoundError,
  ValidationError,
} from '../errors'
import {
  PrismaClientKnownRequestError,
  PrismaClientUnknownRequestError,
  PrismaClientValidationError,
} from '@prisma/client/runtime/library'
import { NextResponse } from 'next/server'
import { ZodIssueCode } from 'zod'

import { isAuthenticated } from '@/utils/auth'
import { FetchErrorCode } from '@/utils/fetch'

import { SessionUser } from '@/types/auth'

// Mock the auth utility
jest.mock('@/utils/auth', () => ({
  isAuthenticated: jest.fn(),
}))

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn(),
  },
}))

const mockIsAuthenticated = isAuthenticated as jest.MockedFunction<
  typeof isAuthenticated
>
const mockJson = NextResponse.json as jest.MockedFunction<
  typeof NextResponse.json
>

describe('api-handlers', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockJson.mockReturnValue({
      status: 200,
    } as NextResponse)
  })

  describe('ValidationError', () => {
    it('should create a validation error with message and details', () => {
      const details = {
        email: {
          code: ZodIssueCode.invalid_string,
          message: 'Email is required',
        },
      }
      const error = new ValidationError('Validation failed', details)

      expect(error.name).toBe('ValidationError')
      expect(error.message).toBe('Validation failed')
      expect(error.details).toEqual(details)
      expect(error instanceof Error).toBe(true)
    })

    it('should be throwable and catchable', () => {
      const details = {
        name: { code: ZodIssueCode.too_small, message: 'Name is too short' },
      }

      expect(() => {
        throw new ValidationError('Test error', details)
      }).toThrow('Test error')
    })
  })

  describe('AuthorizationError', () => {
    it('should create an authorization error with default message', () => {
      const error = new AuthorizationError()

      expect(error.name).toBe('AuthorizationError')
      expect(error.message).toBe('Unauthorized to perform this action.')
      expect(error instanceof Error).toBe(true)
    })

    it('should create an authorization error with custom message', () => {
      const customMessage = 'Custom unauthorized message'
      const error = new AuthorizationError(customMessage)

      expect(error.name).toBe('AuthorizationError')
      expect(error.message).toBe(customMessage)
    })

    it('should be throwable and catchable', () => {
      expect(() => {
        throw new AuthorizationError('Access denied')
      }).toThrow('Access denied')
    })
  })

  describe('NotFoundError', () => {
    it('should create a not found error with default message', () => {
      const error = new NotFoundError()

      expect(error.name).toBe('NotFoundError')
      expect(error.message).toBe('The requested resource could not be found.')
      expect(error instanceof Error).toBe(true)
    })

    it('should create a not found error with custom message', () => {
      const customMessage = 'Custom not found message'
      const error = new NotFoundError(customMessage)

      expect(error.name).toBe('NotFoundError')
      expect(error.message).toBe(customMessage)
    })

    it('should be throwable and catchable', () => {
      expect(() => {
        throw new NotFoundError('Resource missing')
      }).toThrow('Resource missing')
    })
  })

  describe('withUserFields', () => {
    const userId = 'user-123'
    const basePayload = { name: 'Test', description: 'A test item' }

    it('should add updatedBy field by default', () => {
      const result = withUserFields(basePayload, userId)

      expect(result).toEqual({
        ...basePayload,
        updatedBy: userId,
      })
    })

    it('should add createdBy field when specified', () => {
      const result = withUserFields(basePayload, userId, ['createdBy'])

      expect(result).toEqual({
        ...basePayload,
        createdBy: userId,
      })
    })

    it('should add both createdBy and updatedBy fields when specified', () => {
      const result = withUserFields(basePayload, userId, [
        'createdBy',
        'updatedBy',
      ])

      expect(result).toEqual({
        ...basePayload,
        createdBy: userId,
        updatedBy: userId,
      })
    })

    it('should not add any fields when empty array is provided', () => {
      const result = withUserFields(basePayload, userId, [])

      expect(result).toEqual(basePayload)
    })

    it('should preserve existing payload properties', () => {
      const payloadWithUserFields = {
        ...basePayload,
        updatedBy: 'existing-user',
      }
      const result = withUserFields(payloadWithUserFields, userId)

      expect(result).toEqual({
        ...basePayload,
        updatedBy: userId, // Should override existing value
      })
    })

    it('should work with empty payload', () => {
      const result = withUserFields({}, userId)

      expect(result).toEqual({
        updatedBy: userId,
      })
    })

    it('should preserve nested objects', () => {
      const payloadWithNested = {
        ...basePayload,
        nested: { key: 'value' },
        array: [1, 2, 3],
      }
      const result = withUserFields(payloadWithNested, userId, [
        'createdBy',
        'updatedBy',
      ])

      expect(result).toEqual({
        ...payloadWithNested,
        createdBy: userId,
        updatedBy: userId,
      })
    })
  })

  describe('toNextResponse', () => {
    it('should convert successful response to NextResponse', () => {
      const successResponse = {
        status: 200,
        data: { id: '1', name: 'Test' },
      }

      const result = toNextResponse(successResponse)

      expect(mockJson).toHaveBeenCalledWith(successResponse, { status: 200 })
      expect(result).toBeInstanceOf(Object)
      expect(result).toHaveProperty('status')
    })

    it('should convert error response to NextResponse', () => {
      const errorResponse = {
        status: 400,
        data: null,
        error: {
          code: FetchErrorCode.INVALID_DATA,
          message: 'Invalid data',
        },
      }

      const result = toNextResponse(errorResponse)

      expect(mockJson).toHaveBeenCalledWith(errorResponse, { status: 400 })
      expect(result).toBeInstanceOf(Object)
    })

    it('should default to status 200 when no status provided', () => {
      const response = { data: { test: true } }

      const result = toNextResponse(response)

      expect(mockJson).toHaveBeenCalledWith(response, { status: 200 })
      expect(result).toBeInstanceOf(Object)
    })

    it('should default to status 500 when error exists but no status', () => {
      const response = {
        data: null,
        error: { code: FetchErrorCode.INTERNAL_ERROR, message: 'Error' },
      }

      const result = toNextResponse(response)

      expect(mockJson).toHaveBeenCalledWith(response, { status: 500 })
      expect(result).toBeInstanceOf(Object)
    })

    it('should handle response with message', () => {
      const response = {
        status: 201,
        data: { id: '1' },
        message: 'Created successfully',
      }

      const result = toNextResponse(response)

      expect(mockJson).toHaveBeenCalledWith(response, { status: 201 })
      expect(result).toBeInstanceOf(Object)
    })
  })

  describe('createApiHandler', () => {
    const mockUser: SessionUser = {
      id: 'user-123',
      email: 'test@example.com',
      given_name: 'Test',
      family_name: 'User',
      picture: 'https://example.com/avatar.jpg',
    }
    const mockHandler = jest.fn()

    beforeEach(() => {
      mockHandler.mockClear()
    })

    describe('authentication', () => {
      it('should return 401 when user is not authenticated and auth is required', async () => {
        mockIsAuthenticated.mockResolvedValue({ allowed: false, user: null })
        mockHandler.mockResolvedValue({ data: 'test' })

        const result = await createApiHandler(mockHandler)

        expect(result).toEqual({
          status: 401,
          error: {
            code: FetchErrorCode.NOT_AUTHENTICATED,
            message: 'User not authenticated.',
          },
          data: null,
        })
        expect(mockHandler).not.toHaveBeenCalled()
      })

      it('should proceed when user is authenticated', async () => {
        mockIsAuthenticated.mockResolvedValue({ allowed: true, user: mockUser })
        mockHandler.mockResolvedValue({ data: 'test' })

        const result = await createApiHandler(mockHandler)

        expect(result).toEqual({
          status: 200,
          data: { data: 'test' },
        })
        expect(mockHandler).toHaveBeenCalledWith({ user: mockUser })
      })

      it('should skip auth check when dangerouslyBypassAuthentication is true', async () => {
        // Set up a mock that would fail if called during auth check
        mockIsAuthenticated.mockResolvedValue({ allowed: true, user: mockUser })
        mockHandler.mockResolvedValue({ data: 'test' })

        const config: ApiHandlerConfig = {
          dangerouslyBypassAuthentication: true,
        }
        const result = await createApiHandler(mockHandler, config)

        expect(result).toEqual({
          status: 200,
          data: { data: 'test' },
        })
        // Should still call isAuthenticated to get user for handler
        expect(mockIsAuthenticated).toHaveBeenCalled()
      })

      it('should use custom auth required message', async () => {
        mockIsAuthenticated.mockResolvedValue({ allowed: false, user: null })
        const customMessage = 'Please log in to continue'

        const config: ApiHandlerConfig = {
          messages: { authRequired: customMessage },
        }
        const result = await createApiHandler(mockHandler, config)

        expect(result.error?.message).toBe(customMessage)
      })
    })

    describe('authorization', () => {
      beforeEach(() => {
        mockIsAuthenticated.mockResolvedValue({ allowed: true, user: mockUser })
      })

      it('should return 403 when authorization check fails', async () => {
        const authCheck = jest.fn().mockResolvedValue(false)
        mockHandler.mockResolvedValue({ data: 'test' })

        const config: ApiHandlerConfig = { authorizationCheck: authCheck }
        const result = await createApiHandler(mockHandler, config)

        expect(result).toEqual({
          status: 403,
          data: null,
          error: {
            code: FetchErrorCode.NOT_AUTHORIZED,
            message: 'Unauthorized to perform this action.',
          },
        })
        expect(authCheck).toHaveBeenCalled()
        expect(mockHandler).not.toHaveBeenCalled()
      })

      it('should proceed when authorization check passes', async () => {
        const authCheck = jest.fn().mockResolvedValue(true)
        mockHandler.mockResolvedValue({ data: 'test' })

        const config: ApiHandlerConfig = { authorizationCheck: authCheck }
        const result = await createApiHandler(mockHandler, config)

        expect(result).toEqual({
          status: 200,
          data: { data: 'test' },
        })
        expect(authCheck).toHaveBeenCalled()
        expect(mockHandler).toHaveBeenCalledWith({ user: mockUser })
      })

      it('should return 500 when authorization check throws error', async () => {
        const authCheck = jest
          .fn()
          .mockRejectedValue(new Error('Auth check failed'))
        mockHandler.mockResolvedValue({ data: 'test' })

        const config: ApiHandlerConfig = { authorizationCheck: authCheck }

        // Mock console.error to avoid test output noise
        const consoleSpy = jest
          .spyOn(console, 'error')
          .mockImplementation(() => {})

        const result = await createApiHandler(mockHandler, config)

        expect(result).toEqual({
          status: 500,
          data: null,
          error: {
            code: FetchErrorCode.INTERNAL_ERROR,
            message: 'Authorization check failed.',
          },
        })
        expect(mockHandler).not.toHaveBeenCalled()
        expect(consoleSpy).toHaveBeenCalledWith(
          'Authorization check error:',
          expect.any(Error),
        )

        consoleSpy.mockRestore()
      })

      it('should use custom unauthorized message', async () => {
        const authCheck = jest.fn().mockResolvedValue(false)
        const customMessage = 'Access denied for this resource'

        const config: ApiHandlerConfig = {
          authorizationCheck: authCheck,
          messages: { unauthorized: customMessage },
        }
        const result = await createApiHandler(mockHandler, config)

        expect(result.error?.message).toBe(customMessage)
      })

      it('should use custom auth check failed message', async () => {
        const authCheck = jest.fn().mockRejectedValue(new Error('Auth error'))
        const customMessage = 'Authorization verification failed'

        const config: ApiHandlerConfig = {
          authorizationCheck: authCheck,
          messages: { authCheckFailed: customMessage },
        }

        const consoleSpy = jest
          .spyOn(console, 'error')
          .mockImplementation(() => {})
        const result = await createApiHandler(mockHandler, config)

        expect(result.error?.message).toBe(customMessage)
        consoleSpy.mockRestore()
      })
    })

    describe('handler execution', () => {
      beforeEach(() => {
        mockIsAuthenticated.mockResolvedValue({ allowed: true, user: mockUser })
      })

      it('should return successful response with data', async () => {
        const responseData = { id: '1', name: 'Test' }
        mockHandler.mockResolvedValue(responseData)

        const result = await createApiHandler(mockHandler)

        expect(result).toEqual({
          status: 200,
          data: responseData,
        })
      })

      it('should return successful response with message', async () => {
        const responseData = { id: '1', name: 'Test' }
        const successMessage = 'Operation completed successfully'
        mockHandler.mockResolvedValue(responseData)

        const config: ApiHandlerConfig = {
          messages: { success: successMessage },
        }
        const result = await createApiHandler(mockHandler, config)

        expect(result).toEqual({
          status: 200,
          data: responseData,
          message: successMessage,
        })
      })

      it('should return 404 for null data when not a mutation', async () => {
        mockHandler.mockResolvedValue(null)

        const result = await createApiHandler(mockHandler)

        expect(result).toEqual({
          status: 404,
          data: null,
          error: {
            code: FetchErrorCode.NOT_FOUND,
            message: 'The requested resource could not be found.',
          },
        })
      })

      it('should return 404 for undefined data when not a mutation', async () => {
        mockHandler.mockResolvedValue(undefined)

        const result = await createApiHandler(mockHandler)

        expect(result).toEqual({
          status: 404,
          data: null,
          error: {
            code: FetchErrorCode.NOT_FOUND,
            message: 'The requested resource could not be found.',
          },
        })
      })

      it('should return null data for mutations', async () => {
        mockHandler.mockResolvedValue(null)

        const config: ApiHandlerConfig = { isMutation: true }
        const result = await createApiHandler(mockHandler, config)

        expect(result).toEqual({
          status: 200,
          data: null,
        })
      })

      it('should return undefined data for mutations', async () => {
        mockHandler.mockResolvedValue(undefined)

        const config: ApiHandlerConfig = { isMutation: true }
        const result = await createApiHandler(mockHandler, config)

        expect(result).toEqual({
          status: 200,
          data: undefined,
        })
      })

      it('should handle falsy but not null/undefined values for non-mutations', async () => {
        mockHandler.mockResolvedValue(0)

        const result = await createApiHandler(mockHandler)

        expect(result).toEqual({
          status: 200,
          data: 0,
        })
      })

      it('should handle empty string for non-mutations', async () => {
        mockHandler.mockResolvedValue('')

        const result = await createApiHandler(mockHandler)

        expect(result).toEqual({
          status: 200,
          data: '',
        })
      })

      it('should handle false boolean for non-mutations', async () => {
        mockHandler.mockResolvedValue(false)

        const result = await createApiHandler(mockHandler)

        expect(result).toEqual({
          status: 200,
          data: false,
        })
      })

      it('should use custom not found message', async () => {
        mockHandler.mockResolvedValue(null)
        const customMessage = 'Item not found in database'

        const config: ApiHandlerConfig = {
          messages: { notFound: customMessage },
        }
        const result = await createApiHandler(mockHandler, config)

        expect(result.error?.message).toBe(customMessage)
      })
    })

    describe('error handling', () => {
      beforeEach(() => {
        mockIsAuthenticated.mockResolvedValue({ allowed: true, user: mockUser })
      })

      it('should handle ValidationError', async () => {
        const details = {
          email: {
            code: ZodIssueCode.invalid_string,
            message: 'Email is required',
          },
        }
        const validationError = new ValidationError(
          'Validation failed',
          details,
        )
        mockHandler.mockRejectedValue(validationError)

        const consoleSpy = jest
          .spyOn(console, 'error')
          .mockImplementation(() => {})
        const result = await createApiHandler(mockHandler)

        expect(result).toEqual({
          status: 400,
          data: null,
          error: {
            code: FetchErrorCode.INVALID_DATA,
            message: 'Validation failed',
            details,
          },
        })

        consoleSpy.mockRestore()
      })

      it('should handle AuthorizationError', async () => {
        const authError = new AuthorizationError('Access denied')
        mockHandler.mockRejectedValue(authError)

        const consoleSpy = jest
          .spyOn(console, 'error')
          .mockImplementation(() => {})
        const result = await createApiHandler(mockHandler)

        expect(result).toEqual({
          status: 403,
          data: null,
          error: {
            code: FetchErrorCode.NOT_AUTHORIZED,
            message: 'Access denied',
          },
        })

        consoleSpy.mockRestore()
      })

      it('should handle NotFoundError', async () => {
        const notFoundError = new NotFoundError('Resource not found')
        mockHandler.mockRejectedValue(notFoundError)

        const consoleSpy = jest
          .spyOn(console, 'error')
          .mockImplementation(() => {})
        const result = await createApiHandler(mockHandler)

        expect(result).toEqual({
          status: 404,
          data: null,
          error: {
            code: FetchErrorCode.NOT_FOUND,
            message: 'Resource not found',
          },
        })

        consoleSpy.mockRestore()
      })

      it('should handle generic Error', async () => {
        const genericError = new Error('Something went wrong')
        mockHandler.mockRejectedValue(genericError)

        const consoleSpy = jest
          .spyOn(console, 'error')
          .mockImplementation(() => {})
        const result = await createApiHandler(mockHandler)

        expect(result).toEqual({
          status: 500,
          data: null,
          error: {
            code: FetchErrorCode.INTERNAL_ERROR,
            message: 'Something went wrong',
          },
        })

        consoleSpy.mockRestore()
      })

      it('should handle non-Error thrown values', async () => {
        mockHandler.mockRejectedValue('String error')

        const consoleSpy = jest
          .spyOn(console, 'error')
          .mockImplementation(() => {})
        const result = await createApiHandler(mockHandler)

        expect(result).toEqual({
          status: 500,
          data: null,
          error: {
            code: FetchErrorCode.INTERNAL_ERROR,
            message: 'An unknown failure occurred.',
          },
        })

        consoleSpy.mockRestore()
      })

      it('should use custom general failure message for non-Error values', async () => {
        mockHandler.mockRejectedValue('String error')
        const customMessage = 'System error occurred'

        const config: ApiHandlerConfig = {
          messages: { generalFailure: customMessage },
        }

        const consoleSpy = jest
          .spyOn(console, 'error')
          .mockImplementation(() => {})
        const result = await createApiHandler(mockHandler, config)

        expect(result.error?.message).toBe(customMessage)
        consoleSpy.mockRestore()
      })

      it('should log errors to console', async () => {
        const error = new Error('Test error')
        mockHandler.mockRejectedValue(error)

        const consoleSpy = jest
          .spyOn(console, 'error')
          .mockImplementation(() => {})

        await createApiHandler(mockHandler)

        expect(consoleSpy).toHaveBeenCalledWith('API Handler Error:', error)
        consoleSpy.mockRestore()
      })
    })

    describe('edge cases and configuration', () => {
      beforeEach(() => {
        mockIsAuthenticated.mockResolvedValue({ allowed: true, user: mockUser })
      })

      it('should handle empty config object', async () => {
        mockHandler.mockResolvedValue({ data: 'test' })

        const result = await createApiHandler(mockHandler, {})

        expect(result).toEqual({
          status: 200,
          data: { data: 'test' },
        })
      })

      it('should handle config with only partial messages', async () => {
        mockHandler.mockResolvedValue(null)

        const config: ApiHandlerConfig = {
          messages: { success: 'Custom success' },
        }
        const result = await createApiHandler(mockHandler, config)

        expect(result.error?.message).toBe(
          'The requested resource could not be found.',
        )
      })

      it('should handle missing messages object', async () => {
        mockIsAuthenticated.mockResolvedValue({ allowed: false, user: null })

        const config: ApiHandlerConfig = {
          dangerouslyBypassAuthentication: false,
        }
        const result = await createApiHandler(mockHandler, config)

        expect(result.error?.message).toBe('User not authenticated.')
      })

      it('should handle complex response data structures', async () => {
        const complexData = {
          items: [{ id: 1, name: 'Item 1' }],
          metadata: { total: 1, page: 1 },
          nested: { deep: { value: 'test' } },
        }
        mockHandler.mockResolvedValue(complexData)

        const result = await createApiHandler(mockHandler)

        expect(result).toEqual({
          status: 200,
          data: complexData,
        })
      })

      it('should maintain handler context and parameters', async () => {
        const handlerWithParams = jest.fn().mockImplementation(({ user }) => {
          expect(user).toEqual(mockUser)
          return Promise.resolve({ userId: user.id })
        })

        const result = await createApiHandler(handlerWithParams)

        expect(result.data).toEqual({ userId: mockUser.id })
        expect(handlerWithParams).toHaveBeenCalledWith({ user: mockUser })
      })
    })

    describe('Prisma error handling', () => {
      beforeEach(() => {
        mockIsAuthenticated.mockResolvedValue({ allowed: true, user: mockUser })
      })

      it('should handle PrismaClientKnownRequestError P2002 unique constraint', async () => {
        const prismaError = new PrismaClientKnownRequestError(
          'Unique constraint failed',
          {
            code: 'P2002',
            clientVersion: '5.0.0',
            meta: { target: ['email'] },
          },
        )
        mockHandler.mockRejectedValue(prismaError)

        const consoleSpy = jest
          .spyOn(console, 'error')
          .mockImplementation(() => {})

        const result = await createApiHandler(mockHandler)

        expect(result).toEqual({
          status: 409,
          data: null,
          error: {
            code: FetchErrorCode.DUPLICATE,
            message: 'A record with this email already exists.',
          },
        })
        expect(consoleSpy).toHaveBeenCalledWith(
          'API Handler Error:',
          prismaError,
        )

        consoleSpy.mockRestore()
      })

      it('should handle PrismaClientKnownRequestError P2025 record not found', async () => {
        const prismaError = new PrismaClientKnownRequestError(
          'Record not found',
          {
            code: 'P2025',
            clientVersion: '5.0.0',
          },
        )
        mockHandler.mockRejectedValue(prismaError)

        const consoleSpy = jest
          .spyOn(console, 'error')
          .mockImplementation(() => {})

        const result = await createApiHandler(mockHandler)

        expect(result).toEqual({
          status: 404,
          data: null,
          error: {
            code: FetchErrorCode.NOT_FOUND,
            message: 'The requested record could not be found.',
          },
        })

        consoleSpy.mockRestore()
      })

      it('should handle PrismaClientKnownRequestError P2003 foreign key constraint', async () => {
        const prismaError = new PrismaClientKnownRequestError(
          'Foreign key constraint failed',
          {
            code: 'P2003',
            clientVersion: '5.0.0',
            meta: { field_name: 'userId' },
          },
        )
        mockHandler.mockRejectedValue(prismaError)

        const consoleSpy = jest
          .spyOn(console, 'error')
          .mockImplementation(() => {})

        const result = await createApiHandler(mockHandler)

        expect(result).toEqual({
          status: 400,
          data: null,
          error: {
            code: FetchErrorCode.INVALID_DATA,
            message: 'Invalid reference: the userId record does not exist.',
          },
        })

        consoleSpy.mockRestore()
      })

      it('should handle PrismaClientKnownRequestError P2024 connection timeout', async () => {
        const prismaError = new PrismaClientKnownRequestError(
          'Connection pool timeout',
          {
            code: 'P2024',
            clientVersion: '5.0.0',
          },
        )
        mockHandler.mockRejectedValue(prismaError)

        const consoleSpy = jest
          .spyOn(console, 'error')
          .mockImplementation(() => {})

        const result = await createApiHandler(mockHandler)

        expect(result).toEqual({
          status: 503,
          data: null,
          error: {
            code: FetchErrorCode.DATABASE_FAILURE,
            message: 'Database connection pool timeout.',
          },
        })

        consoleSpy.mockRestore()
      })

      it('should handle PrismaClientValidationError', async () => {
        const prismaError = new PrismaClientValidationError(
          'Invalid data provided',
          {
            clientVersion: '5.0.0',
          },
        )
        mockHandler.mockRejectedValue(prismaError)

        const consoleSpy = jest
          .spyOn(console, 'error')
          .mockImplementation(() => {})

        const result = await createApiHandler(mockHandler)

        expect(result).toEqual({
          status: 400,
          data: null,
          error: {
            code: FetchErrorCode.INVALID_DATA,
            message: 'Invalid data provided to the database.',
          },
        })

        consoleSpy.mockRestore()
      })

      it('should handle PrismaClientUnknownRequestError', async () => {
        const prismaError = new PrismaClientUnknownRequestError(
          'Unknown error occurred',
          {
            clientVersion: '5.0.0',
          },
        )
        mockHandler.mockRejectedValue(prismaError)

        const consoleSpy = jest
          .spyOn(console, 'error')
          .mockImplementation(() => {})

        const result = await createApiHandler(mockHandler)

        expect(result).toEqual({
          status: 500,
          data: null,
          error: {
            code: FetchErrorCode.DATABASE_FAILURE,
            message: 'An unknown database error occurred.',
          },
        })

        consoleSpy.mockRestore()
      })

      it('should handle connection errors ECONNREFUSED', async () => {
        const connectionError = {
          code: 'ECONNREFUSED',
          message: 'Connection refused',
        }
        mockHandler.mockRejectedValue(connectionError)

        const consoleSpy = jest
          .spyOn(console, 'error')
          .mockImplementation(() => {})

        const result = await createApiHandler(mockHandler)

        expect(result).toEqual({
          status: 503,
          data: null,
          error: {
            code: FetchErrorCode.DATABASE_FAILURE,
            message: 'Database connection failed.',
          },
        })

        consoleSpy.mockRestore()
      })

      it('should handle connection errors ENOTFOUND', async () => {
        const connectionError = { code: 'ENOTFOUND', message: 'Host not found' }
        mockHandler.mockRejectedValue(connectionError)

        const consoleSpy = jest
          .spyOn(console, 'error')
          .mockImplementation(() => {})

        const result = await createApiHandler(mockHandler)

        expect(result).toEqual({
          status: 503,
          data: null,
          error: {
            code: FetchErrorCode.DATABASE_FAILURE,
            message: 'Database connection failed.',
          },
        })

        consoleSpy.mockRestore()
      })

      it('should handle DatabaseConstraintError', async () => {
        const constraintError = new DatabaseConstraintError(
          'Unique constraint violated',
          'unique',
          'email',
        )
        mockHandler.mockRejectedValue(constraintError)

        const consoleSpy = jest
          .spyOn(console, 'error')
          .mockImplementation(() => {})

        const result = await createApiHandler(mockHandler)

        expect(result).toEqual({
          status: 409,
          data: null,
          error: {
            code: FetchErrorCode.DUPLICATE,
            message: 'Unique constraint violated',
          },
        })

        consoleSpy.mockRestore()
      })

      it('should handle DatabaseConnectionError', async () => {
        const connectionError = new DatabaseConnectionError(
          'Connection pool exhausted',
        )
        mockHandler.mockRejectedValue(connectionError)

        const consoleSpy = jest
          .spyOn(console, 'error')
          .mockImplementation(() => {})

        const result = await createApiHandler(mockHandler)

        expect(result).toEqual({
          status: 503,
          data: null,
          error: {
            code: FetchErrorCode.DATABASE_FAILURE,
            message: 'Connection pool exhausted',
          },
        })

        consoleSpy.mockRestore()
      })

      it('should handle multiple different Prisma error codes', async () => {
        const testCases = [
          {
            error: new PrismaClientKnownRequestError(
              'Null constraint violated',
              {
                code: 'P2011',
                clientVersion: '5.0.0',
                meta: { constraint: 'name' },
              },
            ),
            expected: {
              status: 400,
              error: {
                code: FetchErrorCode.INVALID_DATA,
                message: 'Required field name cannot be null.',
              },
            },
          },
          {
            error: new PrismaClientKnownRequestError('Missing required value', {
              code: 'P2012',
              clientVersion: '5.0.0',
              meta: { path: 'email' },
            }),
            expected: {
              status: 400,
              error: {
                code: FetchErrorCode.INVALID_DATA,
                message: 'Required field email is missing.',
              },
            },
          },
          {
            error: new PrismaClientKnownRequestError('Invalid ID', {
              code: 'P2014',
              clientVersion: '5.0.0',
            }),
            expected: {
              status: 400,
              error: {
                code: FetchErrorCode.INVALID_DATA,
                message: 'The provided ID is invalid.',
              },
            },
          },
          {
            error: new PrismaClientKnownRequestError(
              'Related record not found',
              {
                code: 'P2015',
                clientVersion: '5.0.0',
              },
            ),
            expected: {
              status: 404,
              error: {
                code: FetchErrorCode.NOT_FOUND,
                message: 'A related record could not be found.',
              },
            },
          },
        ]

        const consoleSpy = jest
          .spyOn(console, 'error')
          .mockImplementation(() => {})

        for (const testCase of testCases) {
          mockHandler.mockRejectedValue(testCase.error)

          const result = await createApiHandler(mockHandler)

          expect(result).toEqual({
            ...testCase.expected,
            data: null,
          })
        }

        consoleSpy.mockRestore()
      })
    })
  })
})
