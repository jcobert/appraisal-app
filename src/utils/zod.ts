import { ZodError, ZodErrorMap, ZodSchema } from 'zod'

export const customErrorMap: ZodErrorMap = (error, ctx) => {
  let message = ctx.defaultError
  switch (error.code) {
    case 'too_small':
      if (error.type === 'string') {
        // String required
        message = 'Field is required'
      } else if (error.type === 'number') {
        // Number min
        message = `Must be at least ${error.minimum}`
      }
      break
    case 'invalid_string':
      if (!ctx.data) {
        message = 'Field is required'
      }
      break
    default:
      break
  }
  return { message: message || ctx.defaultError }
}

export const getInvalidFields = ({ issues }: ZodError) => {
  if (!issues) {
    return undefined
  }
}

export const validatePayload = (schema: ZodSchema, { payload }) => {}
