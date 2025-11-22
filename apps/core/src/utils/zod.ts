import { SanitizeTextInputOptions, sanitizeTextInput } from './data/sanitize'
import {
  StringFieldType,
  VALIDATION_RULE_SETS,
  ValidationRule,
} from './data/validate'
import { ParseParams, ZodError, ZodErrorMap, ZodIssue, ZodSchema, z } from 'zod'

/**
 * A collection of related schemas for validating different aspects of an entity.
 *
 * @example
 * ```typescript
 * const userSchema = {
 *   form: z.object({
 *     firstName: fieldBuilder.text({ type: 'name', label: 'First name' }),
 *     lastName: fieldBuilder.text({ type: 'name', label: 'Last name' }),
 *     email: fieldBuilder.text({ type: 'email', label: 'Email address' }),
 *   }),
 *   entity: z.object({ userId: z.string().min(1), organizationId: z.string().min(1) }),
 *   api: z.object({
 *     firstName: sanitizedField.text({ type: 'name' }),
 *     lastName: sanitizedField.text({ type: 'name' })
 *   }),
 * } satisfies SchemaBundle
 *
 * // Usage in handlers:
 * const payloadValidation = validatePayload(userSchema.api, requestBody)
 * const entityValidation = validatePayload(userSchema.entity, { userId, organizationId })
 * ```
 */
export type SchemaBundle = {
  /** Schema for front-end form validation. */
  form?: ZodSchema
  /** Schema for validating request body/payload data (server-side). */
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

/**
 * Helper to create sanitized string schemas with common patterns.
 */
export const sanitizedString = (options: SanitizeTextInputOptions = {}) => {
  return z.string().transform((val) => sanitizeTextInput(val, options))
}

/**
 * Pre-configured sanitized string schemas for common field types.
 */
export const sanitizedField = {
  /**
   * Sanitized text field with optional type specification.
   * @param options.type - Field type: 'name', 'email', 'phone', 'uuid', or 'general' (default)
   * @param options.context - Sanitization context: 'server' or 'client'
   */
  text: (
    options: {
      type?: StringFieldType
      context?: 'server' | 'client'
    } = {},
  ) => {
    const { type, context } = options
    const fieldType = type || 'general'

    const baseSchema = sanitizedString({ fieldType, context })

    // Add type-specific validation
    switch (type) {
      case 'name':
        return baseSchema.pipe(z.string().nonempty())
      case 'email':
        return baseSchema.pipe(z.string().email())
      case 'uuid':
        return baseSchema.pipe(z.string().nonempty())
      case 'phone':
      default:
        return baseSchema
    }
  },
}

/**
 * Custom validation rule to use in field builder.
 */
export type CustomValidationRule = Omit<ValidationRule, 'id'>

/**
 * Flexible field builder options for customizing validation behavior.
 */
export type FieldBuilderOptions = {
  /** Field type: 'name', 'email', 'phone', 'uuid', or 'general' (default). */
  type?: StringFieldType
  /** Field label used to generate default error messages. */
  label?: string
  /** Custom error message for required validation. */
  requiredMessage?: string
  /** Whether the field is required (default: false). */
  required?: boolean
  /** Custom validation rules to apply. */
  customRules?: CustomValidationRule[]
  /** Predefined rule set to use (overrides customRules if both provided). */
  ruleSet?: ValidationRule[]
  /** Additional Zod refinements to apply. */
  additionalRefinements?: Array<{
    check: (val: string) => boolean
    message: string
  }>
}

/**
 * Create a flexible validated field with customizable options.
 * This gives you full control over validation rules, messages, and requirements.
 */
export const createValidatedField = (options: FieldBuilderOptions = {}) => {
  const {
    type,
    label,
    requiredMessage,
    required = false,
    customRules = [],
    ruleSet,
    additionalRefinements = [],
  } = options

  // Generate default messages from label if provided
  const defaultRequiredMessage = label
    ? `${label} is required`
    : 'This field is required'

  const defaultEmailMessage = 'Please enter a valid email address'

  const finalRequiredMessage = requiredMessage || defaultRequiredMessage

  // Start with base schema
  let schema: z.ZodString | z.ZodUnion<[z.ZodString, z.ZodLiteral<''>]> = z
    .string()
    .trim()

  // Add required validation if needed
  if (required) {
    schema = schema.nonempty(finalRequiredMessage)
  }

  // Add type-specific validation
  switch (type) {
    case 'email':
      schema = schema.email(defaultEmailMessage)
      if (!required) schema = schema.or(z.literal(''))
      break
    case 'name':
    case 'phone':
    case 'uuid':
    default:
      // No additional validation needed
      break
  }

  // Apply validation rules (use ruleSet if provided, otherwise customRules)
  const rulesToApply = ruleSet || customRules

  // Build the final schema by chaining refinements
  const finalSchema = rulesToApply.reduce(
    (currentSchema: z.ZodType<string>, rule) => {
      return currentSchema.refine(
        (val) => !rule.pattern.test(val),
        rule.message,
      )
    },
    schema,
  )

  // Apply additional custom refinements
  const schemaWithRefinements = additionalRefinements.reduce(
    (currentSchema: z.ZodType<string>, refinement) => {
      return currentSchema.refine(refinement.check, refinement.message)
    },
    finalSchema,
  )

  return schemaWithRefinements
}

/**
 * Convenient preset field builders with sensible defaults but full customization options.
 */
export const fieldBuilder = {
  /**
   * Create a text field with optional type specification and customization.
   * @param options.type - Field type: 'name', 'email', 'phone', 'uuid', or 'general'
   * @param options.ruleSet - Validation rule set to apply ('standard', 'dangerousOnly', 'none')
   * @param options.label - Field label for error messages
   * @param options.required - Whether field is required (default: false)
   */
  text: (
    options: Omit<FieldBuilderOptions, 'ruleSet'> & {
      /** Use a specific rule set instead of default rules. */
      ruleSet?: 'standard' | 'dangerousOnly' | 'none'
    } = {},
  ) => {
    const { type, ruleSet = 'standard', ...otherOptions } = options

    // Determine rules based on type and ruleSet
    let rules: ValidationRule[] = []

    switch (ruleSet) {
      case 'standard':
        if (type === 'name') {
          rules = VALIDATION_RULE_SETS.name()
        } else if (type === 'email') {
          rules = VALIDATION_RULE_SETS.email()
        } else if (type === 'phone') {
          rules = VALIDATION_RULE_SETS.phone()
        } else if (type === 'uuid') {
          rules = VALIDATION_RULE_SETS.uuid()
        } else {
          rules = VALIDATION_RULE_SETS.general()
        }
        break
      case 'dangerousOnly':
        rules = VALIDATION_RULE_SETS.dangerousContentOnly()
        break
      case 'none':
        rules = []
        break
    }

    return createValidatedField({
      type,
      ruleSet: rules,
      ...otherOptions,
    })
  },
}

/**
 * Sanitizes form data before submission.
 * Use this in onSubmit handlers, for client-side validation.
 */
export const sanitizeFormData = <T extends Record<string, unknown>>(
  data: T,
  fieldTypes: Partial<Record<keyof T, StringFieldType>> = {},
): T => {
  const sanitized = { ...data }

  Object.entries(fieldTypes).forEach(([key, fieldType]) => {
    const value = sanitized[key as keyof T]
    if (typeof value === 'string' && fieldType) {
      sanitized[key as keyof T] = sanitizeTextInput(value, {
        fieldType,
      }) as T[keyof T]
    }
  })

  return sanitized
}

/** Type guard to check if Zod validation succeeded. */
export const isValidationSuccess = <T>(validation: {
  success: boolean
  data: T | undefined
}): validation is { success: true; data: T } => {
  return validation.success && validation.data !== undefined
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
  TPassthrough extends boolean = false,
>(
  schema: TSchema,
  payload: TPayload,
  options?: Partial<ParseParams> & {
    /** Whether to pass through unknown fields (preserves fields not in schema). */
    passthrough?: TPassthrough
  },
): {
  data: (TPassthrough extends true ? TPayload : z.output<TSchema>) | undefined
  success: boolean
  errors: ZodFieldErrors<z.input<TSchema>> | null
} => {
  const { passthrough = false, ...parseOptions } = options || {}

  // Apply passthrough if requested
  const finalSchema: TSchema =
    passthrough && 'passthrough' in schema
      ? (schema as any).passthrough()
      : schema

  const result = finalSchema.safeParse(payload, {
    errorMap: formErrorMap,
    ...parseOptions,
  }) as z.SafeParseReturnType<TPayload, z.output<TSchema>>

  const fieldErrors = getFieldErrors<TSchema['_input']>(result?.error)

  return {
    data: result?.data,
    success: result?.success ?? false,
    errors:
      !fieldErrors || !Object.keys(fieldErrors)?.length ? null : fieldErrors,
  }
}
