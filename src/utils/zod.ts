import { ParseParams, ZodError, ZodErrorMap, ZodIssue, ZodSchema } from 'zod'

/** A collection of related schemas. */
export type SchemaBundle = {
  /** Schema for front-end validation. */
  form?: ZodSchema
  /** Schema for back-end validation. */
  api?: ZodSchema
} & { [key: string]: ZodSchema }

/** Issues from parsing a zod schema, formatted as an object by field. */
export type ZodFieldErrors<
  T extends Record<string, unknown> = Record<string, unknown>,
> = {
  [field in keyof T]?: Pick<ZodIssue, 'code' | 'message'>
}

/** Zod error map with some defaults. */
export const formErrorMap: ZodErrorMap = (error, ctx) => {
  let message = ctx.defaultError
  switch (error.code) {
    case 'too_small':
      if (error.type === 'string') {
        // String required
        message = 'required'
      } else if (error.type === 'number') {
        // Number min
        message = `Must be at least ${error.minimum}`
      }
      break
    case 'invalid_string':
      if (!ctx.data) {
        message = 'required'
      }
      break
    default:
      break
  }
  return { message: message || ctx.defaultError }
}

/** Returns a map of errors by field. */
export const getFieldErrors = <T extends Record<string, unknown>>(
  error?: ZodError,
) => {
  const { issues } = error || {}
  if (!issues?.length) {
    return undefined
  }
  const errors = issues?.reduce((prev, issue) => {
    const { code, message, path } = issue
    const field = path?.[0]?.toString() || ('' as keyof T)
    if (field) {
      prev[field] = { code, message }
    }
    return prev
  }, {} as ZodFieldErrors<T>)
  return errors
}

/** Runs a zod parse of the `payload` and returns the result with any errors in a streamlined format. */
export const validatePayload = <
  TSchema extends ZodSchema,
  TPayload extends Record<string, unknown>,
>(
  schema: TSchema,
  payload: TPayload,
  options?: Partial<ParseParams>,
) => {
  const { ...parseOptions } = options || {}
  const result = schema.safeParse(payload, {
    errorMap: formErrorMap,
    ...parseOptions,
  })
  const fieldErrors = getFieldErrors<TSchema['_input']>(result?.error)
  return {
    data: result?.data,
    success: result?.success ?? false,
    errors:
      !fieldErrors || !Object.keys(fieldErrors)?.length ? null : fieldErrors,
  }
}
