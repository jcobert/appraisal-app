import {
  type SchemaBundle,
  type ZodFieldErrors,
  fieldBuilder,
  formErrorMap,
  getFieldErrors,
  isValidationSuccess,
  sanitizeFormData,
  sanitizedField,
  sanitizedString,
  validatePayload,
} from '../zod'
import { ZodError, z } from 'zod'

describe('zod utilities', () => {
  describe('formErrorMap', () => {
    it('should return "required" for empty string with too_small error', () => {
      const error = {
        code: 'too_small' as const,
        type: 'string' as const,
        minimum: 1,
        inclusive: true,
        exact: false,
        message: 'String must contain at least 1 character(s)',
        path: ['test'],
      }
      const ctx = {
        defaultError: 'default message',
        data: '',
      }

      const result = formErrorMap(error, ctx)
      expect(result.message).toBe('required')
    })

    it('should return minimum message for number with too_small error', () => {
      const error = {
        code: 'too_small' as const,
        type: 'number' as const,
        minimum: 5,
        inclusive: true,
        exact: false,
        message: 'Number must be greater than or equal to 5',
        path: ['test'],
      }
      const ctx = {
        defaultError: 'default message',
        data: 3,
      }

      const result = formErrorMap(error, ctx)
      expect(result.message).toBe('Must be at least 5')
    })

    it('should return "required" for invalid_string with no data', () => {
      const error = {
        code: 'invalid_string' as const,
        validation: 'email' as const,
        message: 'Invalid email',
        path: ['email'],
      }
      const ctx = {
        defaultError: 'default message',
        data: null,
      }

      const result = formErrorMap(error, ctx)
      expect(result.message).toBe('required')
    })

    it('should return default error for unhandled error codes', () => {
      const error = {
        code: 'invalid_type' as const,
        expected: 'string' as const,
        received: 'number' as const,
        message: 'Expected string, received number',
        path: ['test'],
      }
      const ctx = {
        defaultError: 'default message',
        data: 123,
      }

      const result = formErrorMap(error, ctx)
      expect(result.message).toBe('default message')
    })
  })

  describe('sanitizedString', () => {
    it('should create a string schema with sanitization transform', () => {
      const schema = sanitizedString({ fieldType: 'name' })
      const result = schema.parse('  John<script>alert("xss")</script>  ')

      expect(result).toBe('John')
    })

    it('should work with different field types', () => {
      const emailSchema = sanitizedString({ fieldType: 'email' })
      const phoneSchema = sanitizedString({ fieldType: 'phone' })

      const email = emailSchema.parse('  USER@EXAMPLE.COM  ')
      const phone = phoneSchema.parse('555-CALL-NOW')

      expect(email).toBe('user@example.com')
      expect(phone).toBe('555--') // Letters are removed, only digits and separators remain
    })

    it('should work with context options', () => {
      const serverSchema = sanitizedString({ context: 'server' })
      const clientSchema = sanitizedString({ context: 'client' })

      const serverResult = serverSchema.parse(
        'Hello<script>alert("xss")</script>',
      )
      const clientResult = clientSchema.parse(
        'Hello<script>alert("xss")</script>',
      )

      expect(serverResult).toBe('Hello')
      expect(clientResult).toBe('Hello')
    })
  })

  describe('sanitizedField', () => {
    describe('text() with type="name"', () => {
      it('should sanitize and validate names', () => {
        const schema = sanitizedField.text({ type: 'name' })

        const result = schema.parse('  José María  ')
        expect(result).toBe('José María')
      })

      it('should reject empty names', () => {
        const schema = sanitizedField.text({ type: 'name' })

        expect(() => schema.parse('')).toThrow()
        expect(() => schema.parse('   ')).toThrow()
      })

      it('should remove dangerous patterns from names', () => {
        const schema = sanitizedField.text({ type: 'name' })

        const result = schema.parse('John<script>alert("xss")</script>Doe')
        expect(result).toBe('JohnDoe')
      })

      it('should preserve Unicode characters in names', () => {
        const schema = sanitizedField.text({ type: 'name' })

        const result = schema.parse('José 陈伟 محمد')
        expect(result).toBe('José 陈伟 محمد')
      })

      it('should preserve apostrophes in names', () => {
        const schema = sanitizedField.text({ type: 'name' })

        const result = schema.parse("O'Brien")
        expect(result).toBe("O'Brien")
      })

      it('should preserve quotes in names', () => {
        const schema = sanitizedField.text({ type: 'name' })

        const result = schema.parse('Name "Nickname" Surname')
        expect(result).toBe('Name "Nickname" Surname')
      })

      it('should preserve comparison operators in names', () => {
        const schema = sanitizedField.text({ type: 'name' })

        const result = schema.parse('Sales > $1M')
        expect(result).toBe('Sales > $1M')
      })

      it('should preserve numbers in names', () => {
        const schema = sanitizedField.text({ type: 'name' })

        const result = schema.parse('Building 123')
        expect(result).toBe('Building 123')
      })
    })

    describe('text() with type="email"', () => {
      it('should sanitize and validate emails', () => {
        const schema = sanitizedField.text({ type: 'email' })

        const result = schema.parse('  USER@EXAMPLE.COM  ')
        expect(result).toBe('user@example.com')
      })

      it('should reject invalid emails', () => {
        const schema = sanitizedField.text({ type: 'email' })

        expect(() => schema.parse('invalid-email')).toThrow()
        expect(() => schema.parse('')).toThrow()
      })

      it('should preserve special characters in emails', () => {
        const schema = sanitizedField.text({ type: 'email' })

        // Email sanitization now normalizes but doesn't remove characters
        const result = schema.parse('test+tag@example.com')
        expect(result).toContain('+')
      })

      it('should remove dangerous patterns from emails', () => {
        const schema = sanitizedField.text({ type: 'email' })

        const result = schema.parse(
          'test<script>alert("xss")</script>@example.com',
        )
        expect(result).not.toContain('<script>')
        expect(result).not.toContain('</script>')
      })
    })

    describe('text() with type="phone"', () => {
      it('should sanitize phone numbers', () => {
        const schema = sanitizedField.text({ type: 'phone' })

        const result = schema.parse('555-CALL-NOW')
        expect(result).toBe('555--') // Letters removed, separators kept
      })

      it('should preserve valid phone characters', () => {
        const schema = sanitizedField.text({ type: 'phone' })

        const result = schema.parse('+1 (555) 123-4567')
        expect(result).toBe('+1 (555) 123-4567')
      })

      it('should normalize spaces in phone numbers', () => {
        const schema = sanitizedField.text({ type: 'phone' })

        const result = schema.parse('555   123    4567')
        expect(result).toBe('555 123 4567')
      })
    })

    describe('text() without type (general text)', () => {
      it('should sanitize text content', () => {
        const schema = sanitizedField.text()

        const result = schema.parse(
          'Hello <script>alert("xss")</script> World!',
        )
        expect(result).toBe('Hello World!')
      })

      it('should preserve most text content', () => {
        const schema = sanitizedField.text()

        const result = schema.parse('Hello, World! 123 @#$%')
        expect(result).toBe('Hello, World! 123 @#$%')
      })

      it('should normalize spaces in text', () => {
        const schema = sanitizedField.text()

        const result = schema.parse('Hello   world    test')
        expect(result).toBe('Hello world test') // Text field now normalizes spaces
      })

      it('should preserve quotes and comparison operators in text', () => {
        const schema = sanitizedField.text()

        const result = schema.parse('Sales > $1M "Premium" Tier')
        expect(result).toBe('Sales > $1M "Premium" Tier')
      })
    })

    describe('text() with context', () => {
      it('should apply strict server-side sanitization', () => {
        const schema = sanitizedField.text({ context: 'server' })

        const result = schema.parse('<script>alert("xss")</script>Hello')
        expect(result).toBe('Hello')
      })

      it('should apply lenient client-side sanitization', () => {
        const schema = sanitizedField.text({ context: 'client' })

        const result = schema.parse('<script>alert("xss")</script>Hello')
        expect(result).toBe('Hello')
      })
    })

    describe('text() with type="uuid"', () => {
      it('should create sanitized uuid field', () => {
        const schema = z.object({
          id: sanitizedField.text({ type: 'uuid' }),
        })

        // Valid UUIDs/tokens with alphanumeric, hyphens, underscores
        const result1 = schema.parse({ id: 'abc-123-def' })
        expect(result1.id).toBe('abc-123-def')

        const result2 = schema.parse({ id: 'token_with_underscore' })
        expect(result2.id).toBe('token_with_underscore')

        const result3 = schema.parse({ id: 'a1b2c3d4e5f6' })
        expect(result3.id).toBe('a1b2c3d4e5f6')
      })

      it('should sanitize invalid characters from uuids', () => {
        const schema = z.object({
          id: sanitizedField.text({ type: 'uuid' }),
        })

        // Should strip special characters
        const result1 = schema.parse({ id: 'token!@#$%' })
        expect(result1.id).toBe('token')

        // DANGEROUS_PATTERNS removes <script> tag content, leaving "abc" + "def" = "abcscriptdef"
        // Then uuidUnsafeChars removes remaining invalid chars
        const result2 = schema.parse({ id: 'abc<script>def' })
        expect(result2.id).toBe('abcscriptdef')

        const result3 = schema.parse({ id: "token'OR'1'='1" })
        expect(result3.id).toBe('tokenOR11')
      })

      it('should reject empty strings after sanitization', () => {
        const schema = z.object({
          id: sanitizedField.text({ type: 'uuid' }),
        })

        // Should fail when all characters are stripped
        expect(() => schema.parse({ id: '!@#$%' })).toThrow()
        expect(() => schema.parse({ id: '<>' })).toThrow()
        expect(() => schema.parse({ id: '' })).toThrow()
      })

      it('should handle hex token format (common for crypto.randomBytes)', () => {
        const schema = z.object({
          token: sanitizedField.text({ type: 'uuid' }),
        })

        const hexToken = 'a1b2c3d4e5f67890abcdef'
        const result = schema.parse({ token: hexToken })
        expect(result.token).toBe(hexToken)
      })
    })
  })

  describe('getFieldErrors', () => {
    it('should return undefined for no error', () => {
      const result = getFieldErrors()
      expect(result).toBeUndefined()
    })

    it('should return undefined for error with no issues', () => {
      // Create a real ZodError with empty issues for testing
      const emptyError = new ZodError([])

      const result = getFieldErrors(emptyError)
      expect(result).toBeUndefined()
    })

    it('should map issues to field errors correctly', () => {
      const schema = z.object({
        firstName: z.string().min(1),
        email: z.string().email(),
      })

      const parseResult = schema.safeParse({
        firstName: '',
        email: 'invalid-email',
      })

      expect(parseResult.success).toBe(false)
      if (!parseResult.success) {
        const result = getFieldErrors<{ firstName: string; email: string }>(
          parseResult.error,
        )

        expect(result?.firstName?.code).toBe('too_small')
        expect(result?.email?.code).toBe('invalid_string')
      }
    })

    it('should handle issues without path', () => {
      // Test with an empty path - getFieldErrors filters these out
      const customError = new ZodError([
        {
          code: 'custom',
          message: 'Custom error',
          path: [], // Empty path gets filtered out by our implementation
        },
      ])

      const result = getFieldErrors(customError)
      expect(result).toEqual({}) // Empty object since path is empty
    })
  })

  describe('validatePayload', () => {
    const testSchema = z.object({
      name: sanitizedField.text({ type: 'name' }),
      email: sanitizedField.text({ type: 'email' }),
      age: z.number().min(0),
    })

    it('should return success and data for valid payload', () => {
      const payload = {
        name: '  John Doe  ',
        email: '  JOHN@EXAMPLE.COM  ',
        age: 25,
      }

      const result = validatePayload(testSchema, payload)

      expect(result.success).toBe(true)
      expect(result.errors).toBeNull()
      expect(result.data).toEqual({
        name: 'John Doe',
        email: 'john@example.com',
        age: 25,
      })
    })

    it('should return errors for invalid payload', () => {
      const payload = {
        name: '',
        email: 'invalid-email',
        age: -5,
      }

      const result = validatePayload(testSchema, payload)

      expect(result.success).toBe(false)
      expect(result.data).toBeUndefined()
      expect(result.errors).toBeDefined()
      expect(result.errors?.name).toBeDefined()
      expect(result.errors?.email).toBeDefined()
      expect(result.errors?.age).toBeDefined()
    })

    it('should use custom error map', () => {
      const payload = {
        name: '',
        email: 'john@example.com',
        age: 25,
      }

      const result = validatePayload(testSchema, payload)

      expect(result.errors?.name?.message).toBe('required')
    })

    it('should pass through parse options', () => {
      const payload = {
        name: 'John',
        email: 'john@example.com',
        age: 25,
        extra: 'field',
      }

      const result = validatePayload(testSchema, payload, {
        errorMap: formErrorMap,
      })

      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        name: 'John',
        email: 'john@example.com',
        age: 25,
      })
    })

    it('should handle complex nested errors', () => {
      const complexSchema = z.object({
        user: z.object({
          name: sanitizedField.text({ type: 'name' }),
          contacts: z.array(
            z.object({
              email: sanitizedField.text({ type: 'email' }),
            }),
          ),
        }),
      })

      const payload = {
        user: {
          name: '',
          contacts: [{ email: 'invalid-email' }],
        },
      }

      const result = validatePayload(complexSchema, payload)

      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()
    })
  })

  describe('Type definitions', () => {
    it('should define SchemaBundle type correctly', () => {
      const bundle: SchemaBundle = {
        form: z.string(),
        api: z.string(),
        custom: z.number(),
      }

      expect(bundle.form).toBeDefined()
      expect(bundle.api).toBeDefined()
      expect(bundle.custom).toBeDefined()
    })

    it('should define ZodFieldErrors type correctly', () => {
      const errors: ZodFieldErrors<{ name: string; email: string }> = {
        name: { code: 'too_small', message: 'required' },
        email: { code: 'invalid_string', message: 'Invalid email' },
      }

      expect(errors.name?.code).toBe('too_small')
      expect(errors.email?.message).toBe('Invalid email')
    })
  })

  describe('Integration tests', () => {
    it('should work end-to-end with form validation', () => {
      const userSchema = z.object({
        firstName: sanitizedField.text({ type: 'name' }),
        lastName: sanitizedField.text({ type: 'name' }),
        email: sanitizedField.text({ type: 'email' }),
        phone: sanitizedField.text({ type: 'phone' }).optional(),
      })

      const formData = {
        firstName: '  John  ',
        lastName: '  Doe  ',
        email: '  JOHN.DOE@EXAMPLE.COM  ',
        phone: '555-CALL-NOW',
      }

      const result = validatePayload(userSchema, formData)

      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        firstName: 'John', // Trimmed and normalized
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '555--', // Letters removed, separators kept
      })
    })

    it('should sanitize and remove complete dangerous patterns', () => {
      const userSchema = z.object({
        firstName: sanitizedField.text({ type: 'name' }),
        description: sanitizedField.text(),
      })

      const formData = {
        firstName: 'John<script>alert("xss")</script>Doe',
        description: 'Hello <script>alert("xss")</script> World',
      }

      const result = validatePayload(userSchema, formData)

      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        firstName: 'JohnDoe', // Complete script tag removed
        description: 'Hello World', // Complete script tag removed with normalized spaces
      })
    })

    it('should handle mixed valid and invalid fields', () => {
      const schema = z.object({
        name: sanitizedField.text({ type: 'name' }),
        email: sanitizedField.text({ type: 'email' }),
        website: z.string().url().optional(),
      })

      const payload = {
        name: 'John Doe',
        email: 'invalid-email',
        website: 'not-a-url',
      }

      const result = validatePayload(schema, payload)

      expect(result.success).toBe(false)
      expect(result.errors?.email).toBeDefined()
      expect(result.errors?.website).toBeDefined()
      expect(result.errors?.name).toBeUndefined()
    })

    it('should preserve type safety with sanitized fields', () => {
      const schema = z.object({
        name: sanitizedField.text({ type: 'name' }),
        email: sanitizedField.text({ type: 'email' }),
      })

      type SchemaType = z.infer<typeof schema>

      const data: SchemaType = {
        name: 'John',
        email: 'john@example.com',
      }

      const result = validatePayload(schema, data)
      expect(result.success).toBe(true)
    })
  })

  describe('fieldBuilder', () => {
    describe('text() with type="name"', () => {
      it('should accept valid names', () => {
        const schema = fieldBuilder.text({ type: 'name' })
        expect(schema.parse('John Doe')).toBe('John Doe')
        expect(schema.parse('José María')).toBe('José María')
      })

      it('should accept names with apostrophes and quotes', () => {
        const schema = fieldBuilder.text({ type: 'name' })
        expect(schema.parse("O'Brien")).toBe("O'Brien")
        expect(schema.parse("D'Angelo")).toBe("D'Angelo")
        expect(schema.parse('Name "Nickname" Surname')).toBe(
          'Name "Nickname" Surname',
        )
      })

      it('should accept names with comparison operators', () => {
        const schema = fieldBuilder.text({ type: 'name' })
        expect(schema.parse('Sales > $1M')).toBe('Sales > $1M')
        expect(schema.parse('Value < 100')).toBe('Value < 100')
      })

      it('should reject names with dangerous patterns', () => {
        const schema = fieldBuilder.text({ type: 'name' })
        expect(() => schema.parse('javascript:alert(1)')).toThrow()
        expect(() => schema.parse('<script>alert(1)</script>')).toThrow()
      })

      it('should generate required message from label', () => {
        const schema = fieldBuilder.text({
          type: 'name',
          label: 'First name',
          required: true,
        })
        const result = schema.safeParse('')
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe('First name is required')
        }
      })

      it('should use custom requiredMessage over label', () => {
        const schema = fieldBuilder.text({
          type: 'name',
          label: 'First name',
          requiredMessage: 'Custom message required',
          required: true,
        })
        const result = schema.safeParse('')
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe(
            'Custom message required',
          )
        }
      })
    })

    describe('text() with type="email"', () => {
      it('should accept valid emails', () => {
        const schema = fieldBuilder.text({ type: 'email' })
        expect(schema.parse('test@example.com')).toBe('test@example.com')
      })

      it('should accept emails with special characters', () => {
        const schema = fieldBuilder.text({ type: 'email' })
        const result = schema.parse('user+tag@example.com')
        expect(result).toContain('+')
      })

      it('should reject emails with dangerous patterns', () => {
        const schema = fieldBuilder.text({ type: 'email' })
        expect(() =>
          schema.parse('test<script>alert(1)</script>@example.com'),
        ).toThrow()
      })

      it('should generate required message from label when required', () => {
        const schema = fieldBuilder.text({
          type: 'email',
          label: 'Email address',
          required: true,
        })
        const result = schema.safeParse('')
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe(
            'Email address is required',
          )
        }
      })

      it('should use default email validation message', () => {
        const schema = fieldBuilder.text({ type: 'email' })
        const result = schema.safeParse('invalid-email')
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe(
            'Please enter a valid email address',
          )
        }
      })
    })

    describe('text() with type="phone"', () => {
      it('should accept valid phone numbers', () => {
        const schema = fieldBuilder.text({ type: 'phone' })
        expect(schema.parse('(555) 123-4567')).toBe('(555) 123-4567')
        expect(schema.parse('+1-555-123-4567')).toBe('+1-555-123-4567')
        expect(schema.parse('')).toBe('')
      })

      it('should reject invalid phone characters', () => {
        const schema = fieldBuilder.text({ type: 'phone' })
        expect(() => schema.parse('555-abc-1234')).toThrow()
      })
    })
  })

  describe('sanitizeFormData', () => {
    it('should sanitize specified fields', () => {
      const data = {
        name: 'John<script>alert()</script>',
        email: 'test@example.com',
        phone: '123-456-7890',
        other: 'unchanged',
      }

      const result = sanitizeFormData(data, {
        name: 'name',
        email: 'email',
      })

      // Dangerous patterns are removed completely (including tags)
      expect(result.name).toBe('John')
      expect(result.email).toBe('test@example.com')
      expect(result.other).toBe('unchanged')
    })

    it('should handle empty field types', () => {
      const data = { name: 'John', email: 'test@example.com' }
      const result = sanitizeFormData(data, {})
      expect(result).toEqual(data)
    })

    it('should sanitize uuid fields', () => {
      const data = {
        organizationId: 'org-123!@#',
        token: 'token<script>test',
        name: 'John',
      }

      const result = sanitizeFormData(data, {
        organizationId: 'uuid',
        token: 'uuid',
      })

      expect(result.organizationId).toBe('org-123')
      // DANGEROUS_PATTERNS removes <script> tag, leaving text content "script"
      expect(result.token).toBe('tokenscripttest')
      expect(result.name).toBe('John') // unchanged
    })
  })

  describe('isValidationSuccess', () => {
    it('should return true for successful validation with data', () => {
      const validation = { success: true, data: { name: 'test' } }
      expect(isValidationSuccess(validation)).toBe(true)
    })

    it('should return false when success is false', () => {
      const validation = { success: false, data: { name: 'test' } }
      expect(isValidationSuccess(validation)).toBe(false)
    })

    it('should return false when data is undefined', () => {
      const validation = { success: true, data: undefined }
      expect(isValidationSuccess(validation)).toBe(false)
    })

    it('should return false when both success is false and data is undefined', () => {
      const validation = { success: false, data: undefined }
      expect(isValidationSuccess(validation)).toBe(false)
    })

    it('should return true when data is null (null is not undefined)', () => {
      const validation = { success: true, data: null as any }
      expect(isValidationSuccess(validation)).toBe(true)
    })

    it('should provide proper type narrowing', () => {
      const validation: { success: boolean; data: string | undefined } = {
        success: true,
        data: 'test',
      }

      if (isValidationSuccess(validation)) {
        // TypeScript should infer validation.data as string (not string | undefined)
        expect(typeof validation.data).toBe('string')
        expect(validation.data.toUpperCase()).toBe('TEST') // Should not cause TS error
      }
    })

    it('should work with different data types', () => {
      const numberValidation = { success: true, data: 42 }
      const arrayValidation = { success: true, data: [1, 2, 3] }
      const objectValidation = {
        success: true,
        data: { nested: { value: true } },
      }

      expect(isValidationSuccess(numberValidation)).toBe(true)
      expect(isValidationSuccess(arrayValidation)).toBe(true)
      expect(isValidationSuccess(objectValidation)).toBe(true)

      if (isValidationSuccess(numberValidation)) {
        expect(numberValidation.data + 1).toBe(43)
      }

      if (isValidationSuccess(arrayValidation)) {
        expect(arrayValidation.data.length).toBe(3)
      }

      if (isValidationSuccess(objectValidation)) {
        expect(objectValidation.data.nested.value).toBe(true)
      }
    })
  })

  describe('validatePayload with passthrough option', () => {
    const testSchema = z.object({
      name: z.string().min(1),
      email: z.string().email(),
    })

    it('should exclude unknown fields by default', () => {
      const payload = {
        name: 'John Doe',
        email: 'john@example.com',
        extraField: 'should be removed',
        anotherExtra: 123,
      }

      const result = validatePayload(testSchema, payload)

      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        name: 'John Doe',
        email: 'john@example.com',
      })
      // extraField and anotherExtra should not be present
      expect(result.data).not.toHaveProperty('extraField')
      expect(result.data).not.toHaveProperty('anotherExtra')
    })

    it('should include unknown fields when passthrough is true', () => {
      const payload = {
        name: 'John Doe',
        email: 'john@example.com',
        extraField: 'should be kept',
        anotherExtra: 123,
      }

      const result = validatePayload(testSchema, payload, { passthrough: true })

      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        name: 'John Doe',
        email: 'john@example.com',
        extraField: 'should be kept',
        anotherExtra: 123,
      })
    })

    it('should handle validation errors with passthrough enabled', () => {
      const payload = {
        name: '', // Invalid - too short
        email: 'invalid-email', // Invalid email
        extraField: 'should be kept',
      }

      const result = validatePayload(testSchema, payload, { passthrough: true })

      expect(result.success).toBe(false)
      expect(result.data).toBeUndefined()
      expect(result.errors).toEqual({
        name: { code: 'too_small', message: 'required' },
        email: { code: 'invalid_string', message: 'Invalid email' },
      })
    })

    it('should work with nested schemas and passthrough', () => {
      const nestedSchema = z.object({
        user: z.object({
          name: z.string().min(1),
          age: z.number().min(0),
        }),
        metadata: z.object({
          version: z.string(),
        }),
      })

      const payload = {
        user: {
          name: 'Jane',
          age: 25,
          department: 'Engineering', // Extra field - won't be included because nested objects don't inherit passthrough
        },
        metadata: {
          version: '1.0',
          timestamp: '2023-01-01', // Extra field - won't be included because nested objects don't inherit passthrough
        },
        globalExtra: 'top-level extra', // Extra field - will be included at top level
      }

      const result = validatePayload(nestedSchema, payload, {
        passthrough: true,
      })

      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        user: {
          name: 'Jane',
          age: 25,
          // department not included - nested objects don't get passthrough
        },
        metadata: {
          version: '1.0',
          // timestamp not included - nested objects don't get passthrough
        },
        globalExtra: 'top-level extra', // This is included at the top level
      })
    })

    it('should handle schema without passthrough method gracefully', () => {
      // Create a schema that doesn't have passthrough method
      const primitiveSchema = z.string()
      const payload = { value: 'test' }

      const result = validatePayload(primitiveSchema, payload, {
        passthrough: true,
      })

      expect(result.success).toBe(false) // Should fail because string schema expects string, not object
      expect(result.errors).toBeDefined()
    })

    it('should combine passthrough with other parse options', () => {
      const payload = {
        name: 'John Doe',
        email: 'john@example.com',
        extraField: 'should be kept',
      }

      const result = validatePayload(testSchema, payload, {
        passthrough: true,
        errorMap: (_error, _ctx) => ({ message: 'Custom error' }),
      })

      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        name: 'John Doe',
        email: 'john@example.com',
        extraField: 'should be kept',
      })
    })

    it('should work correctly when passthrough is false explicitly', () => {
      const payload = {
        name: 'John Doe',
        email: 'john@example.com',
        extraField: 'should be removed',
      }

      const result = validatePayload(testSchema, payload, {
        passthrough: false,
      })

      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        name: 'John Doe',
        email: 'john@example.com',
      })
      expect(result.data).not.toHaveProperty('extraField')
    })
  })
})
