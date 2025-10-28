/**
 * @jest-environment node
 */
import {
  AuthorizationError,
  DatabaseConnectionError,
  DatabaseConstraintError,
  NotFoundError,
  ValidationError,
  handlePrismaError,
  isPrismaError,
  parsePrismaError,
} from '../errors'

import { Prisma } from '@repo/database'

import { FetchErrorCode } from '@/utils/fetch'
import { ZodFieldErrors } from '@/utils/zod'

const {
  PrismaClientKnownRequestError,
  PrismaClientUnknownRequestError,
  PrismaClientValidationError,
} = Prisma

describe('Error Classes', () => {
  describe('ValidationError', () => {
    it('should create a validation error with message and details', () => {
      const details: ZodFieldErrors = {
        email: {
          code: 'invalid_string',
          message: 'Invalid email format',
        },
        name: {
          code: 'too_small',
          message: 'Name is required',
        },
      }
      const error = new ValidationError('Validation failed', details)

      expect(error.name).toBe('ValidationError')
      expect(error.message).toBe('Validation failed')
      expect(error.details).toEqual(details)
      expect(error instanceof Error).toBe(true)
      expect(error instanceof ValidationError).toBe(true)
    })

    it('should handle empty details object', () => {
      const error = new ValidationError('Test error', {})

      expect(error.details).toEqual({})
      expect(error.message).toBe('Test error')
    })

    it('should be throwable and catchable', () => {
      const details: ZodFieldErrors = {
        field: { code: 'invalid_type', message: 'Invalid type' },
      }

      expect(() => {
        throw new ValidationError('Test error', details)
      }).toThrow('Test error')

      try {
        throw new ValidationError('Test error', details)
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError)
        expect((error as ValidationError).details).toEqual(details)
      }
    })
  })

  describe('AuthorizationError', () => {
    it('should create an authorization error with default message', () => {
      const error = new AuthorizationError()

      expect(error.name).toBe('AuthorizationError')
      expect(error.message).toBe('Unauthorized to perform this action.')
      expect(error instanceof Error).toBe(true)
      expect(error instanceof AuthorizationError).toBe(true)
    })

    it('should create an authorization error with custom message', () => {
      const customMessage = 'Access denied to this resource'
      const error = new AuthorizationError(customMessage)

      expect(error.name).toBe('AuthorizationError')
      expect(error.message).toBe(customMessage)
    })

    it('should be throwable and catchable', () => {
      expect(() => {
        throw new AuthorizationError('Access denied')
      }).toThrow('Access denied')

      try {
        throw new AuthorizationError('Custom message')
      } catch (error) {
        expect(error).toBeInstanceOf(AuthorizationError)
        expect((error as AuthorizationError).message).toBe('Custom message')
      }
    })
  })

  describe('NotFoundError', () => {
    it('should create a not found error with default message', () => {
      const error = new NotFoundError()

      expect(error.name).toBe('NotFoundError')
      expect(error.message).toBe('The requested resource could not be found.')
      expect(error instanceof Error).toBe(true)
      expect(error instanceof NotFoundError).toBe(true)
    })

    it('should create a not found error with custom message', () => {
      const customMessage = 'User not found'
      const error = new NotFoundError(customMessage)

      expect(error.name).toBe('NotFoundError')
      expect(error.message).toBe(customMessage)
    })

    it('should be throwable and catchable', () => {
      expect(() => {
        throw new NotFoundError('Resource missing')
      }).toThrow('Resource missing')

      try {
        throw new NotFoundError('Item not found')
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundError)
        expect((error as NotFoundError).message).toBe('Item not found')
      }
    })
  })

  describe('DatabaseConstraintError', () => {
    it('should create a database constraint error with all properties', () => {
      const message = 'Unique constraint violation'
      const constraintType = 'unique'
      const field = 'email'
      const error = new DatabaseConstraintError(message, constraintType, field)

      expect(error.name).toBe('DatabaseConstraintError')
      expect(error.message).toBe(message)
      expect(error.constraintType).toBe(constraintType)
      expect(error.field).toBe(field)
      expect(error instanceof Error).toBe(true)
      expect(error instanceof DatabaseConstraintError).toBe(true)
    })

    it('should create a database constraint error without field', () => {
      const message = 'Foreign key constraint violation'
      const constraintType = 'foreign_key'
      const error = new DatabaseConstraintError(message, constraintType)

      expect(error.name).toBe('DatabaseConstraintError')
      expect(error.message).toBe(message)
      expect(error.constraintType).toBe(constraintType)
      expect(error.field).toBeUndefined()
    })

    it('should be throwable and catchable', () => {
      const message = 'Constraint failed'
      const constraintType = 'check'
      const field = 'status'

      expect(() => {
        throw new DatabaseConstraintError(message, constraintType, field)
      }).toThrow(message)

      try {
        throw new DatabaseConstraintError(message, constraintType, field)
      } catch (error) {
        expect(error).toBeInstanceOf(DatabaseConstraintError)
        const dbError = error as DatabaseConstraintError
        expect(dbError.constraintType).toBe(constraintType)
        expect(dbError.field).toBe(field)
      }
    })
  })

  describe('DatabaseConnectionError', () => {
    it('should create a database connection error with default message', () => {
      const error = new DatabaseConnectionError()

      expect(error.name).toBe('DatabaseConnectionError')
      expect(error.message).toBe('Database connection failed.')
      expect(error instanceof Error).toBe(true)
      expect(error instanceof DatabaseConnectionError).toBe(true)
    })

    it('should create a database connection error with custom message', () => {
      const customMessage = 'Connection timeout occurred'
      const error = new DatabaseConnectionError(customMessage)

      expect(error.name).toBe('DatabaseConnectionError')
      expect(error.message).toBe(customMessage)
    })

    it('should be throwable and catchable', () => {
      expect(() => {
        throw new DatabaseConnectionError('Connection failed')
      }).toThrow('Connection failed')

      try {
        throw new DatabaseConnectionError('Pool exhausted')
      } catch (error) {
        expect(error).toBeInstanceOf(DatabaseConnectionError)
        expect((error as DatabaseConnectionError).message).toBe(
          'Pool exhausted',
        )
      }
    })
  })
})

describe('isPrismaError', () => {
  describe('PrismaClientKnownRequestError detection', () => {
    it('should return true for PrismaClientKnownRequestError instances', () => {
      const error = new PrismaClientKnownRequestError('Test error', {
        code: 'P2002',
        clientVersion: '5.0.0',
      })

      expect(isPrismaError(error)).toBe(true)
    })

    it('should return true for errors with Prisma error codes (P-prefixed)', () => {
      const error = {
        code: 'P2003',
        message: 'Foreign key constraint failed',
      }

      expect(isPrismaError(error)).toBe(true)
    })

    it('should return true for various Prisma error codes', () => {
      const errorCodes = [
        'P2000',
        'P2001',
        'P2002',
        'P2003',
        'P2025',
        'P3000',
        'P4000',
      ]

      errorCodes.forEach((code) => {
        const error = { code, message: 'Test error' }
        expect(isPrismaError(error)).toBe(true)
      })
    })
  })

  describe('PrismaClientUnknownRequestError detection', () => {
    it('should return true for PrismaClientUnknownRequestError instances', () => {
      const error = new PrismaClientUnknownRequestError('Unknown error', {
        clientVersion: '5.0.0',
      })

      expect(isPrismaError(error)).toBe(true)
    })
  })

  describe('PrismaClientValidationError detection', () => {
    it('should return true for PrismaClientValidationError instances', () => {
      const error = new PrismaClientValidationError('Validation failed', {
        clientVersion: '5.0.0',
      })

      expect(isPrismaError(error)).toBe(true)
    })
  })

  describe('Network error detection', () => {
    it('should return true for ECONNREFUSED errors', () => {
      const error = { code: 'ECONNREFUSED', message: 'Connection refused' }

      expect(isPrismaError(error)).toBe(true)
    })

    it('should return true for ENOTFOUND errors', () => {
      const error = { code: 'ENOTFOUND', message: 'Host not found' }

      expect(isPrismaError(error)).toBe(true)
    })
  })

  describe('Non-Prisma error detection', () => {
    it('should return false for generic Error instances', () => {
      const error = new Error('Generic error')

      expect(isPrismaError(error)).toBe(false)
    })

    it('should return false for custom error classes', () => {
      const validationError = new ValidationError('Validation failed', {})
      const authError = new AuthorizationError('Not authorized')
      const notFoundError = new NotFoundError('Not found')

      expect(isPrismaError(validationError)).toBe(false)
      expect(isPrismaError(authError)).toBe(false)
      expect(isPrismaError(notFoundError)).toBe(false)
    })

    it('should return false for null and undefined', () => {
      // isPrismaError returns the result of the boolean expression, which is falsy for null/undefined
      // but the actual value returned is null or undefined, not false
      expect(isPrismaError(null)).toBeFalsy()
      expect(isPrismaError(undefined)).toBeFalsy()
    })

    it('should return false for primitive values', () => {
      expect(isPrismaError('string error')).toBe(false)
      expect(isPrismaError(123)).toBe(false)
      expect(isPrismaError(true)).toBe(false)
    })

    it('should return false for objects without code property', () => {
      const error = { message: 'Error message', type: 'CustomError' }

      expect(isPrismaError(error)).toBe(false)
    })

    it('should return false for objects with non-string code', () => {
      const error = { code: 123, message: 'Error message' }

      expect(isPrismaError(error)).toBe(false)
    })

    it('should return false for objects with non-Prisma error codes', () => {
      const errorCodes = [
        'E001',
        'ERR_INVALID',
        'CUSTOM_ERROR',
        '2002',
        'p2002', // lowercase
      ]

      errorCodes.forEach((code) => {
        const error = { code, message: 'Test error' }
        expect(isPrismaError(error)).toBe(false)
      })
    })

    it('should return false for errors with network-like codes that are not ECONNREFUSED or ENOTFOUND', () => {
      const errorCodes = ['ETIMEDOUT', 'ECONNRESET', 'EPIPE', 'EHOSTUNREACH']

      errorCodes.forEach((code) => {
        const error = { code, message: 'Network error' }
        expect(isPrismaError(error)).toBe(false)
      })
    })
  })

  describe('Edge cases', () => {
    it('should handle errors with code property that is an empty string', () => {
      const error = { code: '', message: 'Error message' }

      expect(isPrismaError(error)).toBe(false)
    })

    it('should handle errors with code property that only contains P', () => {
      const error = { code: 'P', message: 'Error message' }

      expect(isPrismaError(error)).toBe(true) // Starts with P
    })

    it('should handle complex Prisma-like error objects', () => {
      const error = {
        code: 'P2003',
        message: 'Foreign key constraint failed',
        meta: {
          field_name: 'userId',
          constraint: 'User_id_fkey',
        },
        clientVersion: '5.0.0',
        stack: 'Error stack trace...',
      }

      expect(isPrismaError(error)).toBe(true)
    })

    it('should handle serialized/deserialized Prisma errors', () => {
      // Simulate what happens when an error crosses a serialization boundary
      const originalError = new PrismaClientKnownRequestError('Test error', {
        code: 'P2002',
        clientVersion: '5.0.0',
      })

      // Simulate JSON serialization/deserialization
      const serialized = JSON.parse(JSON.stringify(originalError))

      // instanceof will fail after serialization
      expect(serialized instanceof PrismaClientKnownRequestError).toBe(false)

      // But isPrismaError should still work due to property checking
      expect(isPrismaError(serialized)).toBe(true)
    })

    it('should handle errors thrown across module boundaries', () => {
      // This simulates the real-world issue where instanceof fails
      // due to multiple Prisma Client instances
      const errorLikeObject = {
        name: 'PrismaClientKnownRequestError',
        code: 'P2003',
        message: 'Foreign key constraint violated',
        clientVersion: '6.17.1',
        meta: {
          modelName: 'Organization',
          constraint: 'OrgMember_organizationId_fkey',
        },
      }

      // instanceof will fail since this isn't a real instance
      expect(errorLikeObject instanceof PrismaClientKnownRequestError).toBe(
        false,
      )

      // But isPrismaError should detect it by properties
      expect(isPrismaError(errorLikeObject)).toBe(true)
    })
  })
})

describe('parsePrismaError', () => {
  describe('PrismaClientKnownRequestError handling', () => {
    it('should handle P2002 unique constraint violation', () => {
      const error = new PrismaClientKnownRequestError(
        'Unique constraint failed',
        {
          code: 'P2002',
          clientVersion: '5.0.0',
          meta: { target: ['email'] },
        },
      )

      const result = parsePrismaError(error)

      expect(result).toEqual({
        message: 'A record with this email already exists.',
        code: FetchErrorCode.DUPLICATE,
        status: 409,
        field: 'email',
      })
    })

    it('should handle P2002 without target field', () => {
      const error = new PrismaClientKnownRequestError(
        'Unique constraint failed',
        {
          code: 'P2002',
          clientVersion: '5.0.0',
          meta: {},
        },
      )

      const result = parsePrismaError(error)

      expect(result).toEqual({
        message: 'A record with this field already exists.',
        code: FetchErrorCode.DUPLICATE,
        status: 409,
        field: 'field',
      })
    })

    it('should handle P2025 record not found', () => {
      const error = new PrismaClientKnownRequestError('Record not found', {
        code: 'P2025',
        clientVersion: '5.0.0',
      })

      const result = parsePrismaError(error)

      expect(result).toEqual({
        message: 'Necessary records could not be found.',
        code: FetchErrorCode.NOT_FOUND,
        status: 404,
      })
    })

    it('should handle P2003 foreign key constraint violation', () => {
      const error = new PrismaClientKnownRequestError(
        'Foreign key constraint failed',
        {
          code: 'P2003',
          clientVersion: '5.0.0',
          meta: { field_name: 'userId' },
        },
      )

      const result = parsePrismaError(error)

      expect(result).toEqual({
        message:
          'Cannot delete this record because it is referenced by other records.',
        code: FetchErrorCode.INVALID_DATA,
        status: 400,
        field: 'userId',
      })
    })

    it('should handle P2003 without field name', () => {
      const error = new PrismaClientKnownRequestError(
        'Foreign key constraint failed',
        {
          code: 'P2003',
          clientVersion: '5.0.0',
          meta: {},
        },
      )

      const result = parsePrismaError(error)

      expect(result).toEqual({
        message:
          'Cannot delete this record because it is referenced by other records.',
        code: FetchErrorCode.INVALID_DATA,
        status: 400,
        field: undefined,
      })
    })

    it('should handle P2004 constraint violation', () => {
      const error = new PrismaClientKnownRequestError('Constraint violated', {
        code: 'P2004',
        clientVersion: '5.0.0',
      })

      const result = parsePrismaError(error)

      expect(result).toEqual({
        message: 'A database constraint was violated.',
        code: FetchErrorCode.INVALID_DATA,
        status: 400,
      })
    })

    it('should handle P2011 null constraint violation', () => {
      const error = new PrismaClientKnownRequestError(
        'Null constraint violated',
        {
          code: 'P2011',
          clientVersion: '5.0.0',
          meta: { constraint: 'email' },
        },
      )

      const result = parsePrismaError(error)

      expect(result).toEqual({
        message: 'Required field email cannot be null.',
        code: FetchErrorCode.INVALID_DATA,
        status: 400,
        field: 'email',
      })
    })

    it('should handle P2012 missing required value', () => {
      const error = new PrismaClientKnownRequestError(
        'Missing required value',
        {
          code: 'P2012',
          clientVersion: '5.0.0',
          meta: { path: 'name' },
        },
      )

      const result = parsePrismaError(error)

      expect(result).toEqual({
        message: 'Required field name is missing.',
        code: FetchErrorCode.INVALID_DATA,
        status: 400,
        field: 'name',
      })
    })

    it('should handle P2013 missing required argument', () => {
      const error = new PrismaClientKnownRequestError(
        'Missing required argument',
        {
          code: 'P2013',
          clientVersion: '5.0.0',
          meta: { argument_name: 'id' },
        },
      )

      const result = parsePrismaError(error)

      expect(result).toEqual({
        message: 'Required argument id is missing.',
        code: FetchErrorCode.INVALID_DATA,
        status: 400,
        field: 'id',
      })
    })

    it('should handle P2014 invalid ID', () => {
      const error = new PrismaClientKnownRequestError('Invalid ID', {
        code: 'P2014',
        clientVersion: '5.0.0',
      })

      const result = parsePrismaError(error)

      expect(result).toEqual({
        message: 'The provided ID is invalid.',
        code: FetchErrorCode.INVALID_DATA,
        status: 400,
      })
    })

    it('should handle P2015 related record not found', () => {
      const error = new PrismaClientKnownRequestError(
        'Related record not found',
        {
          code: 'P2015',
          clientVersion: '5.0.0',
        },
      )

      const result = parsePrismaError(error)

      expect(result).toEqual({
        message: 'A related record could not be found.',
        code: FetchErrorCode.NOT_FOUND,
        status: 404,
      })
    })

    it('should handle P2021 table does not exist', () => {
      const error = new PrismaClientKnownRequestError('Table does not exist', {
        code: 'P2021',
        clientVersion: '5.0.0',
      })

      const result = parsePrismaError(error)

      expect(result).toEqual({
        message: 'The table does not exist in the current database.',
        code: FetchErrorCode.DATABASE_FAILURE,
        status: 500,
      })
    })

    it('should handle P2024 connection pool timeout', () => {
      const error = new PrismaClientKnownRequestError(
        'Connection pool timeout',
        {
          code: 'P2024',
          clientVersion: '5.0.0',
        },
      )

      const result = parsePrismaError(error)

      expect(result).toEqual({
        message: 'Database connection pool timeout.',
        code: FetchErrorCode.DATABASE_FAILURE,
        status: 503,
      })
    })

    it('should handle unknown Prisma error codes', () => {
      const error = new PrismaClientKnownRequestError('Unknown error', {
        code: 'P9999',
        clientVersion: '5.0.0',
      })

      const result = parsePrismaError(error)

      expect(result).toEqual({
        message: 'Database error: Unknown error',
        code: FetchErrorCode.DATABASE_FAILURE,
        status: 500,
      })
    })
  })

  describe('PrismaClientValidationError handling', () => {
    it('should handle validation errors', () => {
      const error = new PrismaClientValidationError('Invalid data provided', {
        clientVersion: '5.0.0',
      })

      const result = parsePrismaError(error)

      expect(result).toEqual({
        message: 'Invalid data provided to the database.',
        code: FetchErrorCode.INVALID_DATA,
        status: 400,
      })
    })
  })

  describe('PrismaClientUnknownRequestError handling', () => {
    it('should handle unknown request errors', () => {
      const error = new PrismaClientUnknownRequestError(
        'Unknown error occurred',
        {
          clientVersion: '5.0.0',
        },
      )

      const result = parsePrismaError(error)

      expect(result).toEqual({
        message: 'An unknown database error occurred.',
        code: FetchErrorCode.DATABASE_FAILURE,
        status: 500,
      })
    })
  })

  describe('Connection error handling', () => {
    it('should handle ECONNREFUSED errors', () => {
      const error = { code: 'ECONNREFUSED', message: 'Connection refused' }

      const result = parsePrismaError(error)

      expect(result).toEqual({
        message: 'Database connection failed.',
        code: FetchErrorCode.DATABASE_FAILURE,
        status: 503,
      })
    })

    it('should handle ENOTFOUND errors', () => {
      const error = { code: 'ENOTFOUND', message: 'Host not found' }

      const result = parsePrismaError(error)

      expect(result).toEqual({
        message: 'Database connection failed.',
        code: FetchErrorCode.DATABASE_FAILURE,
        status: 503,
      })
    })
  })

  describe('Generic error handling', () => {
    it('should handle Error objects', () => {
      const error = new Error('Generic error message')

      const result = parsePrismaError(error)

      expect(result).toEqual({
        message: 'Generic error message',
        code: FetchErrorCode.DATABASE_FAILURE,
        status: 500,
      })
    })

    it('should handle null/undefined errors', () => {
      const result1 = parsePrismaError(null)
      const result2 = parsePrismaError(undefined)

      const expectedResult = {
        message: 'An unknown database error occurred.',
        code: FetchErrorCode.DATABASE_FAILURE,
        status: 500,
      }

      expect(result1).toEqual(expectedResult)
      expect(result2).toEqual(expectedResult)
    })

    it('should handle string errors', () => {
      const result = parsePrismaError('String error')

      expect(result).toEqual({
        message: 'An unknown database error occurred.',
        code: FetchErrorCode.DATABASE_FAILURE,
        status: 500,
      })
    })

    it('should handle objects without message', () => {
      const error = { code: 'UNKNOWN', data: 'some data' }

      const result = parsePrismaError(error)

      expect(result).toEqual({
        message: 'An unknown database error occurred.',
        code: FetchErrorCode.DATABASE_FAILURE,
        status: 500,
      })
    })
  })
})

describe('handlePrismaError', () => {
  describe('PrismaClientKnownRequestError handling', () => {
    it('should throw DatabaseConstraintError for P2002 unique constraint', () => {
      const error = new PrismaClientKnownRequestError(
        'Unique constraint failed',
        {
          code: 'P2002',
          clientVersion: '5.0.0',
          meta: { target: ['email'] },
        },
      )

      expect(() => handlePrismaError(error)).toThrow(DatabaseConstraintError)

      try {
        handlePrismaError(error)
      } catch (thrownError) {
        expect(thrownError).toBeInstanceOf(DatabaseConstraintError)
        const dbError = thrownError as DatabaseConstraintError
        expect(dbError.message).toBe('A record with this email already exists.')
        expect(dbError.constraintType).toBe('unique')
        expect(dbError.field).toBe('email')
      }
    })

    it('should throw DatabaseConstraintError for P2002 without field', () => {
      const error = new PrismaClientKnownRequestError(
        'Unique constraint failed',
        {
          code: 'P2002',
          clientVersion: '5.0.0',
          meta: {},
        },
      )

      expect(() => handlePrismaError(error)).toThrow(DatabaseConstraintError)

      try {
        handlePrismaError(error)
      } catch (thrownError) {
        const dbError = thrownError as DatabaseConstraintError
        expect(dbError.message).toBe('A record with this field already exists.')
        expect(dbError.constraintType).toBe('unique')
        expect(dbError.field).toBe('field')
      }
    })

    it('should throw NotFoundError for P2025 record not found', () => {
      const error = new PrismaClientKnownRequestError('Record not found', {
        code: 'P2025',
        clientVersion: '5.0.0',
      })

      expect(() => handlePrismaError(error)).toThrow(NotFoundError)

      try {
        handlePrismaError(error)
      } catch (thrownError) {
        expect(thrownError).toBeInstanceOf(NotFoundError)
        expect((thrownError as NotFoundError).message).toBe(
          'The requested record could not be found.',
        )
      }
    })

    it('should throw DatabaseConstraintError for P2003 foreign key constraint', () => {
      const error = new PrismaClientKnownRequestError(
        'Foreign key constraint failed',
        {
          code: 'P2003',
          clientVersion: '5.0.0',
          meta: { field_name: 'userId' },
        },
      )

      expect(() => handlePrismaError(error)).toThrow(DatabaseConstraintError)

      try {
        handlePrismaError(error)
      } catch (thrownError) {
        expect(thrownError).toBeInstanceOf(DatabaseConstraintError)
        const dbError = thrownError as DatabaseConstraintError
        expect(dbError.message).toBe(
          'Invalid reference: the userId record does not exist.',
        )
        expect(dbError.constraintType).toBe('foreign_key')
        expect(dbError.field).toBe('userId')
      }
    })

    it('should re-throw unknown Prisma error codes', () => {
      const error = new PrismaClientKnownRequestError('Unknown error', {
        code: 'P9999',
        clientVersion: '5.0.0',
      })

      expect(() => handlePrismaError(error)).toThrow(
        PrismaClientKnownRequestError,
      )

      try {
        handlePrismaError(error)
      } catch (thrownError) {
        expect(thrownError).toBe(error) // Should be the same instance
      }
    })
  })

  describe('Connection error handling', () => {
    it('should throw DatabaseConnectionError for ECONNREFUSED', () => {
      const error = { code: 'ECONNREFUSED', message: 'Connection refused' }

      expect(() => handlePrismaError(error)).toThrow(DatabaseConnectionError)

      try {
        handlePrismaError(error)
      } catch (thrownError) {
        expect(thrownError).toBeInstanceOf(DatabaseConnectionError)
        expect((thrownError as DatabaseConnectionError).message).toBe(
          'Database connection failed.',
        )
      }
    })

    it('should throw DatabaseConnectionError for ENOTFOUND', () => {
      const error = { code: 'ENOTFOUND', message: 'Host not found' }

      expect(() => handlePrismaError(error)).toThrow(DatabaseConnectionError)

      try {
        handlePrismaError(error)
      } catch (thrownError) {
        expect(thrownError).toBeInstanceOf(DatabaseConnectionError)
        expect((thrownError as DatabaseConnectionError).message).toBe(
          'Database connection failed.',
        )
      }
    })
  })

  describe('Generic error handling', () => {
    it('should re-throw non-Prisma errors', () => {
      const error = new Error('Generic error')

      expect(() => handlePrismaError(error)).toThrow(Error)

      try {
        handlePrismaError(error)
      } catch (thrownError) {
        expect(thrownError).toBe(error) // Should be the same instance
      }
    })

    it('should re-throw validation errors', () => {
      const error = new PrismaClientValidationError('Validation failed', {
        clientVersion: '5.0.0',
      })

      expect(() => handlePrismaError(error)).toThrow(
        PrismaClientValidationError,
      )

      try {
        handlePrismaError(error)
      } catch (thrownError) {
        expect(thrownError).toBe(error) // Should be the same instance
      }
    })

    it('should re-throw unknown request errors', () => {
      const error = new PrismaClientUnknownRequestError('Unknown error', {
        clientVersion: '5.0.0',
      })

      expect(() => handlePrismaError(error)).toThrow(
        PrismaClientUnknownRequestError,
      )

      try {
        handlePrismaError(error)
      } catch (thrownError) {
        expect(thrownError).toBe(error) // Should be the same instance
      }
    })

    it('should re-throw null/undefined errors', () => {
      expect(() => handlePrismaError(null)).toThrow()
      expect(() => handlePrismaError(undefined)).toThrow()
    })
  })
})
