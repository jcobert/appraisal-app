import { Prisma } from '@repo/database'
import { isObject } from '@repo/utils'

import { FetchErrorCode } from '@/utils/fetch'
import { ZodFieldErrors } from '@/utils/zod'

/**
 * Custom error class for validation errors with typed details.
 */
export class ValidationError extends Error {
  public readonly details: ZodFieldErrors

  constructor(message: string, details: ZodFieldErrors) {
    super(message)
    this.name = 'ValidationError'
    this.details = details
  }
}

/**
 * Custom error class for authentication errors.
 */
export class AuthenticationError extends Error {
  constructor(message: string = 'User not authenticated.') {
    super(message)
    this.name = 'AuthenticationError'
  }
}

/**
 * Custom error class for authorization errors.
 */
export class AuthorizationError extends Error {
  constructor(message: string = 'Unauthorized to perform this action.') {
    super(message)
    this.name = 'AuthorizationError'
  }
}

/**
 * Custom error class for not found errors.
 */
export class NotFoundError extends Error {
  constructor(message: string = 'The requested resource could not be found.') {
    super(message)
    this.name = 'NotFoundError'
  }
}

/**
 * Custom error class for database constraint errors.
 */
export class DatabaseConstraintError extends Error {
  public readonly constraintType: string
  public readonly field?: string

  constructor(message: string, constraintType: string, field?: string) {
    super(message)
    this.name = 'DatabaseConstraintError'
    this.constraintType = constraintType
    this.field = field
  }
}

/**
 * Custom error class for database connection errors.
 */
export class DatabaseConnectionError extends Error {
  constructor(message: string = 'Database connection failed.') {
    super(message)
    this.name = 'DatabaseConnectionError'
  }
}

/** Checks if `error` was thrown by Prisma client. */
export const isPrismaError = (error: unknown) => {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError ||
    error instanceof Prisma.PrismaClientUnknownRequestError ||
    error instanceof Prisma.PrismaClientValidationError ||
    (error &&
      typeof error === 'object' &&
      'code' in error &&
      typeof error.code === 'string' &&
      (error.code.startsWith('P') || // Prisma error codes
        error.code === 'ECONNREFUSED' || // Network error codes
        error.code === 'ENOTFOUND'))
  )
}

/**
 * @todo Go through and clean up - add any missing codes, make sure msgs are user-friendly.
 *
 * Utility function to parse Prisma errors and return user-friendly messages and error types.
 */
export const parsePrismaError = (
  error: unknown,
): {
  message: string
  code: FetchErrorCode
  status: number
  field?: string
} => {
  // Handle Prisma Client Known Request Errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002': {
        // Unique constraint violation
        const field = error.meta?.target as string[] | undefined
        const fieldName = field?.[0] || 'field'
        return {
          message: `A record with this ${fieldName} already exists.`,
          code: FetchErrorCode.DUPLICATE,
          status: 409,
          field: fieldName,
        }
      }
      case 'P2003': {
        // Foreign key constraint violation
        const field = error.meta?.field_name as string | undefined
        return {
          message:
            'Cannot delete this record because it is referenced by other records.',
          code: FetchErrorCode.INVALID_DATA,
          status: 400,
          field,
        }
      }
      case 'P2004': {
        // Constraint violation
        return {
          message: 'A database constraint was violated.',
          code: FetchErrorCode.INVALID_DATA,
          status: 400,
        }
      }
      case 'P2011': {
        // Null constraint violation
        const field = error.meta?.constraint as string | undefined
        return {
          message: `Required field ${field || 'value'} cannot be null.`,
          code: FetchErrorCode.INVALID_DATA,
          status: 400,
          field,
        }
      }
      case 'P2012': {
        // Missing required value
        const field = error.meta?.path as string | undefined
        return {
          message: `Required field ${field || 'value'} is missing.`,
          code: FetchErrorCode.INVALID_DATA,
          status: 400,
          field,
        }
      }
      case 'P2013': {
        // Missing required argument
        const field = error.meta?.argument_name as string | undefined
        return {
          message: `Required argument ${field || 'value'} is missing.`,
          code: FetchErrorCode.INVALID_DATA,
          status: 400,
          field,
        }
      }
      case 'P2014': {
        // Invalid ID
        return {
          message: 'The provided ID is invalid.',
          code: FetchErrorCode.INVALID_DATA,
          status: 400,
        }
      }
      case 'P2015': {
        // Related record not found
        return {
          message: 'A related record could not be found.',
          code: FetchErrorCode.NOT_FOUND,
          status: 404,
        }
      }
      case 'P2016': {
        // Query interpretation error
        return {
          message: 'The query could not be interpreted.',
          code: FetchErrorCode.INVALID_DATA,
          status: 400,
        }
      }
      case 'P2017': {
        // Records not connected
        return {
          message: 'The records are not connected.',
          code: FetchErrorCode.INVALID_DATA,
          status: 400,
        }
      }
      case 'P2018': {
        // Required connected records not found
        return {
          message: 'Required connected records were not found.',
          code: FetchErrorCode.NOT_FOUND,
          status: 404,
        }
      }
      case 'P2019': {
        // Input error
        return {
          message: 'Input error in the provided data.',
          code: FetchErrorCode.INVALID_DATA,
          status: 400,
        }
      }
      case 'P2020': {
        // Value out of range
        return {
          message: 'Value out of range for the field type.',
          code: FetchErrorCode.INVALID_DATA,
          status: 400,
        }
      }
      case 'P2021': {
        // Table does not exist
        return {
          message: 'The table does not exist in the current database.',
          code: FetchErrorCode.DATABASE_FAILURE,
          status: 500,
        }
      }
      case 'P2022': {
        // Column does not exist
        return {
          message: 'The column does not exist in the current database.',
          code: FetchErrorCode.DATABASE_FAILURE,
          status: 500,
        }
      }
      case 'P2023': {
        // Inconsistent column data
        return {
          message: 'Inconsistent column data in the database.',
          code: FetchErrorCode.DATABASE_FAILURE,
          status: 500,
        }
      }
      case 'P2024': {
        // Connection pool timeout
        return {
          message: 'Database connection pool timeout.',
          code: FetchErrorCode.DATABASE_FAILURE,
          status: 503,
        }
      }
      case 'P2025': {
        // Record not found
        return {
          message: 'Necessary records could not be found.',
          code: FetchErrorCode.NOT_FOUND,
          status: 404,
        }
      }
      case 'P2027': {
        // Multiple errors occurred
        return {
          message: 'Multiple database errors occurred during the operation.',
          code: FetchErrorCode.DATABASE_FAILURE,
          status: 500,
        }
      }
      default: {
        return {
          message: `Database error: ${error.message}`,
          code: FetchErrorCode.DATABASE_FAILURE,
          status: 500,
        }
      }
    }
  }

  // Handle Prisma Client Validation Errors
  if (error instanceof Prisma.PrismaClientValidationError) {
    return {
      message: 'Invalid data provided to the database.',
      code: FetchErrorCode.INVALID_DATA,
      status: 400,
    }
  }

  // Handle Prisma Client Unknown Request Errors
  if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    return {
      message: 'An unknown database error occurred.',
      code: FetchErrorCode.DATABASE_FAILURE,
      status: 500,
    }
  }

  // Handle connection errors
  if (error && typeof error === 'object' && 'code' in error) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return {
        message: 'Database connection failed.',
        code: FetchErrorCode.DATABASE_FAILURE,
        status: 503,
      }
    }
  }

  // Default fallback
  return {
    message:
      isObject(error) &&
      'message' in error &&
      typeof error?.message === 'string'
        ? error?.message
        : 'An unknown database error occurred.',
    code: FetchErrorCode.DATABASE_FAILURE,
    status: 500,
  }
}

/**
 * Helper function to create appropriate database errors from Prisma errors.
 * This can be used in query functions to throw more specific errors.
 */
export const handlePrismaError = (error: any): never => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002': {
        // Unique constraint violation
        const field = error.meta?.target as string[] | undefined
        const fieldName = field?.[0] || 'field'
        throw new DatabaseConstraintError(
          `A record with this ${fieldName} already exists.`,
          'unique',
          fieldName,
        )
      }
      case 'P2025': {
        // Record not found
        throw new NotFoundError('The requested record could not be found.')
      }
      case 'P2003': {
        // Foreign key constraint violation
        const field = error.meta?.field_name as string | undefined
        throw new DatabaseConstraintError(
          `Invalid reference: the ${field || 'referenced'} record does not exist.`,
          'foreign_key',
          field,
        )
      }
      default: {
        // For other Prisma errors, re-throw to be handled by parsePrismaError
        throw error
      }
    }
  }

  // Handle connection errors
  if (error && typeof error === 'object' && 'code' in error) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      throw new DatabaseConnectionError('Database connection failed.')
    }
  }

  // Re-throw the original error to be handled by parsePrismaError
  throw error
}
