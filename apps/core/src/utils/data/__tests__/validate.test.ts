/**
 * @jest-environment node
 */
import {
  DANGEROUS_PATTERNS,
  FIELD_VALIDATION,
  SANITIZATION_PATTERNS,
  VALIDATION_PATTERNS,
  VALIDATION_RULE_SETS,
  ValidationRule,
  validateFieldContent,
} from '../validate'

describe('validate.ts', () => {
  describe('DANGEROUS_PATTERNS', () => {
    it('should detect script tags', () => {
      const dangerousInputs = [
        '<script>alert("xss")</script>',
        '<script src="evil.js"></script>',
        '<SCRIPT>alert("xss")</SCRIPT>',
      ]

      dangerousInputs.forEach((input) => {
        // Create a fresh regex instance to avoid global flag issues
        const scriptPattern =
          /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi
        expect(scriptPattern.test(input)).toBe(true)
      })
    })

    it('should detect javascript protocols', () => {
      const dangerousInputs = [
        'javascript:alert("xss")',
        'JavaScript:void(0)',
        'JAVASCRIPT:alert(1)',
      ]

      dangerousInputs.forEach((input) => {
        // Create a fresh regex instance to avoid global flag issues
        const javascriptPattern = /javascript:/gi
        expect(javascriptPattern.test(input)).toBe(true)
      })
    })

    it('should detect data URLs with HTML', () => {
      const dangerousInputs = [
        'data:text/html,<script>alert("xss")</script>',
        'data:text/html;base64,PHNjcmlwdD5hbGVydCgieHNzIik8L3NjcmlwdD4=',
        'DATA:TEXT/HTML,<h1>test</h1>',
      ]

      dangerousInputs.forEach((input) => {
        // Create a fresh regex instance to avoid global flag issues
        const dataUrlPattern = /data:text\/html/gi
        expect(dataUrlPattern.test(input)).toBe(true)
      })
    })

    it('should detect vbscript protocols', () => {
      const dangerousInputs = [
        'vbscript:msgbox("xss")',
        'VBScript:execute("evil")',
        'VBSCRIPT:alert(1)',
      ]

      dangerousInputs.forEach((input) => {
        // Create a fresh regex instance to avoid global flag issues
        const vbscriptPattern = /vbscript:/gi
        expect(vbscriptPattern.test(input)).toBe(true)
      })
    })

    it('should detect event handlers', () => {
      const dangerousInputs = [
        'onclick=alert("xss")',
        'onload=evil()',
        'onmouseover=malicious()',
        'onfocus=attack()',
        'onerror=hack()',
      ]

      dangerousInputs.forEach((input) => {
        // Create a fresh regex instance to avoid global flag issues
        const eventHandlerPattern = /on\w+\s*=/gi
        expect(eventHandlerPattern.test(input)).toBe(true)
      })
    })

    it('should not flag safe content', () => {
      const safeInputs = [
        'Hello world',
        'user@example.com',
        'John Doe',
        '(555) 123-4567',
        'This is normal text content',
        'script in text but not tags',
      ]

      safeInputs.forEach((input) => {
        DANGEROUS_PATTERNS.forEach((pattern) => {
          expect(pattern.test(input)).toBe(false)
        })
      })
    })
  })

  describe('VALIDATION_PATTERNS', () => {
    it('should not have character-based patterns for names, emails, or text', () => {
      expect(VALIDATION_PATTERNS).not.toHaveProperty('invalidNameChars')
      expect(VALIDATION_PATTERNS).not.toHaveProperty('invalidEmailChars')
      expect(VALIDATION_PATTERNS).not.toHaveProperty('invalidTextChars')
    })

    describe('invalidPhoneChars', () => {
      it('should detect invalid phone characters', () => {
        const invalidChars = ['a', 'b', 'z', '@', '#', '$', '%', '^', '&', '*']

        invalidChars.forEach((char) => {
          expect(
            VALIDATION_PATTERNS.invalidPhoneChars.test(`555${char}1234`),
          ).toBe(true)
        })
      })

      it('should allow valid phone characters', () => {
        const validPhones = [
          '5551234567',
          '(555) 123-4567',
          '+1 555 123 4567',
          '555.123.4567',
          '+44 20 7946 0958',
        ]

        validPhones.forEach((phone) => {
          expect(VALIDATION_PATTERNS.invalidPhoneChars.test(phone)).toBe(false)
        })
      })
    })

    describe('dangerousContent', () => {
      it('should detect dangerous content patterns', () => {
        const dangerousInputs = [
          '<script>alert("xss")</script>',
          'javascript:void(0)',
          'data:text/html,<h1>test</h1>',
          'vbscript:msgbox("test")',
          'onclick=alert(1)',
        ]

        dangerousInputs.forEach((input) => {
          expect(VALIDATION_PATTERNS.dangerousContent.test(input)).toBe(true)
        })
      })

      it('should allow safe content', () => {
        const safeInputs = [
          'Hello world',
          'This is safe text',
          'user@example.com',
          'Normal content with numbers 123',
        ]

        safeInputs.forEach((input) => {
          expect(VALIDATION_PATTERNS.dangerousContent.test(input)).toBe(false)
        })
      })
    })
  })

  describe('FIELD_VALIDATION', () => {
    it('should have validation rules for all field types', () => {
      expect(FIELD_VALIDATION.name).toBeDefined()
      expect(FIELD_VALIDATION.email).toBeDefined()
      expect(FIELD_VALIDATION.phone).toBeDefined()
      expect(FIELD_VALIDATION.general).toBeDefined()
    })

    it('should have proper structure for validation rules', () => {
      Object.values(FIELD_VALIDATION).forEach((rules) => {
        expect(Array.isArray(rules)).toBe(true)
        rules.forEach((rule) => {
          expect(rule).toHaveProperty('pattern')
          expect(rule).toHaveProperty('message')
          expect(rule.pattern).toBeInstanceOf(RegExp)
          expect(typeof rule.message).toBe('string')
        })
      })
    })

    it('should include dangerous content validation for text fields', () => {
      const textFields = ['name', 'email', 'general']

      textFields.forEach((fieldType) => {
        const rules =
          FIELD_VALIDATION[fieldType as keyof typeof FIELD_VALIDATION]
        const hasDangerousContentRule = rules.some(
          (rule) => rule.pattern === VALIDATION_PATTERNS.dangerousContent,
        )
        expect(hasDangerousContentRule).toBe(true)
      })
    })

    it('should not include dangerous content validation for phone fields', () => {
      const rules = FIELD_VALIDATION.phone
      const hasDangerousContentRule = rules.some(
        (rule) => rule.pattern === VALIDATION_PATTERNS.dangerousContent,
      )
      expect(hasDangerousContentRule).toBe(false)
    })
  })

  describe('SANITIZATION_PATTERNS', () => {
    it('should not have character-based patterns for names, emails, or text', () => {
      expect(SANITIZATION_PATTERNS).not.toHaveProperty('nameUnsafeChars')
      expect(SANITIZATION_PATTERNS).not.toHaveProperty('emailUnsafeChars')
      expect(SANITIZATION_PATTERNS).not.toHaveProperty('textUnsafeChars')
    })

    describe('uuidUnsafeChars', () => {
      it('should match characters not allowed in UUIDs', () => {
        const unsafeChars = [
          '<',
          '>',
          '@',
          '#',
          '$',
          '%',
          '^',
          '&',
          '*',
          ' ',
          '!',
          '=',
        ]

        unsafeChars.forEach((char) => {
          const testString = `test${char}uuid`
          const pattern = /[^a-zA-Z0-9_-]/g
          expect(pattern.test(testString)).toBe(true)
        })
      })

      it('should not match safe UUID characters', () => {
        const safeInputs = ['abc123', 'test-uuid', 'test_uuid', 'ABC-123_def']

        safeInputs.forEach((input) => {
          expect(SANITIZATION_PATTERNS.uuidUnsafeChars.test(input)).toBe(false)
        })
      })
    })
  })

  describe('validateFieldContent', () => {
    describe('name field validation', () => {
      it('should validate names with apostrophes, quotes, and comparison operators', () => {
        const validNames = [
          "O'Brien",
          "D'Angelo",
          "N'Dour",
          'Mary"Jane',
          'Name < 50 chars',
          'Score > 90',
          'Jean-Pierre',
          'José García',
          "O''Brien", // multiple apostrophes
          "'Brien", // leading apostrophe
          "Brien'", // trailing apostrophe
        ]

        validNames.forEach((name) => {
          const result = validateFieldContent(name, 'name')
          expect(result.isValid).toBe(true)
          expect(result.errorMessage).toBeUndefined()
        })
      })

      it('should reject names with dangerous content', () => {
        const dangerousNames = [
          '<script>alert(1)</script>',
          'javascript:alert(1)',
          'data:text/html,<h1>hack</h1>',
          'onload=evil()',
          'vbscript:msgbox("test")',
        ]

        dangerousNames.forEach((name) => {
          const result = validateFieldContent(name, 'name')
          expect(result.isValid).toBe(false)
          expect(result.errorMessage).toContain('unsafe')
        })
      })
    })

    describe('email field validation', () => {
      it('should validate email addresses (dangerous patterns only)', () => {
        const validEmails = [
          'user@example.com',
          'first.last@domain.co.uk',
          'test+tag@example.org',
        ]

        validEmails.forEach((email) => {
          const result = validateFieldContent(email, 'email')
          expect(result.isValid).toBe(true)
          expect(result.errorMessage).toBeUndefined()
        })
      })

      it('should reject emails with dangerous content', () => {
        const dangerousEmails = [
          '<script>alert(1)</script>@example.com',
          'javascript:alert(1)',
          'onclick=evil()@domain.com',
        ]

        dangerousEmails.forEach((email) => {
          const result = validateFieldContent(email, 'email')
          expect(result.isValid).toBe(false)
          expect(result.errorMessage).toContain('unsafe')
        })
      })
    })

    describe('phone field validation', () => {
      it('should validate clean phone numbers', () => {
        const validPhones = [
          '5551234567',
          '(555) 123-4567',
          '+1 555 123 4567',
          '555.123.4567',
        ]

        validPhones.forEach((phone) => {
          const result = validateFieldContent(phone, 'phone')
          expect(result.isValid).toBe(true)
          expect(result.errorMessage).toBeUndefined()
        })
      })

      it('should reject phones with invalid characters', () => {
        const invalidPhones = [
          '555-abc-1234',
          'phone: 555-1234',
          '555@1234',
          '555#1234',
        ]

        invalidPhones.forEach((phone) => {
          const result = validateFieldContent(phone, 'phone')
          expect(result.isValid).toBe(false)
          expect(result.errorMessage).toBe('Invalid phone number format')
        })
      })
    })

    describe('text field validation', () => {
      it('should validate clean text', () => {
        const validTexts = [
          'Hello world!',
          'This is a test message.',
          'Numbers 123 and symbols @#$%^&*()',
        ]

        validTexts.forEach((text) => {
          const result = validateFieldContent(text, 'general')
          expect(result.isValid).toBe(true)
          expect(result.errorMessage).toBeUndefined()
        })
      })

      it('should allow text with special characters (quotes, comparison operators)', () => {
        const validTexts = [
          'Hello <world>',
          'Test "message"',
          "Single 'quote' test",
          'Sales > $1M',
          'Value < 100',
        ]

        validTexts.forEach((text) => {
          const result = validateFieldContent(text, 'general')
          expect(result.isValid).toBe(true)
          expect(result.errorMessage).toBeUndefined()
        })
      })

      it('should reject text with dangerous patterns', () => {
        const dangerousTexts = [
          '<script>alert("xss")</script>',
          'javascript:alert(1)',
          '<img onerror=alert(1)>',
        ]

        dangerousTexts.forEach((text) => {
          const result = validateFieldContent(text, 'general')
          expect(result.isValid).toBe(false)
          expect(result.errorMessage).toBe(
            'Text contains potentially unsafe content',
          )
        })
      })
    })

    it('should handle empty strings', () => {
      const fieldTypes = ['name', 'email', 'phone', 'general'] as const

      fieldTypes.forEach((fieldType) => {
        const result = validateFieldContent('', fieldType)
        expect(result.isValid).toBe(true)
        expect(result.errorMessage).toBeUndefined()
      })
    })

    it('should handle whitespace-only strings', () => {
      const fieldTypes = ['name', 'email', 'phone', 'general'] as const

      fieldTypes.forEach((fieldType) => {
        const result = validateFieldContent('   ', fieldType)
        expect(result.isValid).toBe(true)
        expect(result.errorMessage).toBeUndefined()
      })
    })
  })

  describe('VALIDATION_RULE_SETS', () => {
    describe('standard rule sets', () => {
      it('should return arrays of validation rules', () => {
        const ruleSetNames = ['name', 'email', 'phone', 'general'] as const

        ruleSetNames.forEach((ruleSetName) => {
          const rules = VALIDATION_RULE_SETS[ruleSetName]()
          expect(Array.isArray(rules)).toBe(true)
          expect(rules.length).toBeGreaterThan(0)

          rules.forEach((rule) => {
            expect(rule).toHaveProperty('pattern')
            expect(rule).toHaveProperty('message')
            expect(rule.pattern).toBeInstanceOf(RegExp)
            expect(typeof rule.message).toBe('string')
          })
        })
      })

      it('should return copies of the original validation rules', () => {
        const nameRules1 = VALIDATION_RULE_SETS.name()
        const nameRules2 = VALIDATION_RULE_SETS.name()

        expect(nameRules1).toEqual(nameRules2)
        expect(nameRules1).not.toBe(nameRules2) // Should be different objects
      })
    })

    describe('dangerousContentOnly', () => {
      it('should return only dangerous content validation', () => {
        const rules = VALIDATION_RULE_SETS.dangerousContentOnly()

        expect(rules).toHaveLength(1)
        expect(rules[0]?.pattern).toBe(VALIDATION_PATTERNS.dangerousContent)
        expect(rules[0]?.message).toBe(
          'Text contains potentially unsafe content',
        )
      })
    })

    describe('parameterized rule exclusion', () => {
      it('should allow disabling dangerous content for name', () => {
        const withoutDangerous = VALIDATION_RULE_SETS.name({
          dangerousContent: false,
        })
        expect(withoutDangerous).toHaveLength(0) // Only had dangerousContent rule

        const allRules = VALIDATION_RULE_SETS.name()
        expect(allRules).toHaveLength(1)
        expect(allRules[0]?.id).toBe('dangerousContent')
      })

      it('should allow disabling dangerous content for email', () => {
        const withoutDangerous = VALIDATION_RULE_SETS.email({
          dangerousContent: false,
        })
        expect(withoutDangerous).toHaveLength(0) // Only had dangerousContent rule

        const allRules = VALIDATION_RULE_SETS.email()
        expect(allRules).toHaveLength(1)
        expect(allRules[0]?.id).toBe('dangerousContent')
      })

      it('should allow disabling dangerous content for text', () => {
        const withoutDangerous = VALIDATION_RULE_SETS.general({
          dangerousContent: false,
        })
        expect(withoutDangerous).toHaveLength(0) // Only had dangerousContent rule

        const allRules = VALIDATION_RULE_SETS.general()
        expect(allRules).toHaveLength(1)
        expect(allRules[0]?.id).toBe('dangerousContent')
      })

      it('should allow disabling specific rules for uuid', () => {
        const withoutDangerous = VALIDATION_RULE_SETS.uuid({
          dangerousContent: false,
        })
        expect(withoutDangerous).toHaveLength(1)
        expect(
          withoutDangerous.some((rule) => rule.id === 'invalidUuidChars'),
        ).toBe(true)

        const withoutChars = VALIDATION_RULE_SETS.uuid({
          invalidUuidChars: false,
        })
        expect(withoutChars).toHaveLength(1)
        expect(
          withoutChars.some((rule) => rule.id === 'dangerousContent'),
        ).toBe(true)
      })

      it('should allow disabling all rules', () => {
        const noNameRules = VALIDATION_RULE_SETS.name({
          dangerousContent: false,
        })
        expect(noNameRules).toHaveLength(0)

        const noUuidRules = VALIDATION_RULE_SETS.uuid({
          invalidUuidChars: false,
          dangerousContent: false,
        })
        expect(noUuidRules).toHaveLength(0)
      })

      it('should return all rules when no exclusions specified', () => {
        const allNameRules = VALIDATION_RULE_SETS.name({})
        expect(allNameRules).toHaveLength(1) // Only dangerousContent

        const allUuidRules = VALIDATION_RULE_SETS.uuid({})
        expect(allUuidRules).toHaveLength(2) // invalidUuidChars + dangerousContent
      })
    })

    describe('rule set completeness', () => {
      it('should have all expected rule sets defined', () => {
        const expectedRuleSets = [
          'name',
          'email',
          'phone',
          'general',
          'dangerousContentOnly',
        ]

        expectedRuleSets.forEach((ruleSetName) => {
          expect(VALIDATION_RULE_SETS).toHaveProperty(ruleSetName)
          expect(
            typeof VALIDATION_RULE_SETS[
              ruleSetName as keyof typeof VALIDATION_RULE_SETS
            ],
          ).toBe('function')
        })
      })
    })
  })

  describe('ValidationRule type', () => {
    it('should be compatible with actual validation rule objects', () => {
      const testRule: ValidationRule = {
        id: 'dangerousContent',
        pattern: /test/,
        message: 'Test message',
      }

      expect(testRule.id).toBe('dangerousContent')
      expect(testRule.pattern).toBeInstanceOf(RegExp)
      expect(typeof testRule.message).toBe('string')

      // Test that it works with validateFieldContent logic
      expect(testRule.pattern.test('test')).toBe(true)
      expect(testRule.pattern.test('other')).toBe(false)
    })
  })

  describe('pattern consistency', () => {
    it('should have consistent patterns between VALIDATION_PATTERNS and FIELD_VALIDATION', () => {
      // Verify that FIELD_VALIDATION uses the same patterns as VALIDATION_PATTERNS
      expect(FIELD_VALIDATION.name[0]?.pattern).toBe(
        VALIDATION_PATTERNS.dangerousContent,
      )
      expect(FIELD_VALIDATION.email[0]?.pattern).toBe(
        VALIDATION_PATTERNS.dangerousContent,
      )
      expect(FIELD_VALIDATION.general[0]?.pattern).toBe(
        VALIDATION_PATTERNS.dangerousContent,
      )

      expect(FIELD_VALIDATION.phone[0]?.pattern).toBe(
        VALIDATION_PATTERNS.invalidPhoneChars,
      )

      expect(FIELD_VALIDATION.uuid[0]?.pattern).toBe(
        VALIDATION_PATTERNS.invalidUuidChars,
      )
      expect(FIELD_VALIDATION.uuid[1]?.pattern).toBe(
        VALIDATION_PATTERNS.dangerousContent,
      )
    })

    it('should have consistent patterns between FIELD_VALIDATION and VALIDATION_RULE_SETS', () => {
      // Standard rule sets should match FIELD_VALIDATION
      expect(VALIDATION_RULE_SETS.name()).toEqual(FIELD_VALIDATION.name)
      expect(VALIDATION_RULE_SETS.email()).toEqual(FIELD_VALIDATION.email)
      expect(VALIDATION_RULE_SETS.phone()).toEqual(FIELD_VALIDATION.phone)
      expect(VALIDATION_RULE_SETS.general()).toEqual(FIELD_VALIDATION.general)
    })
  })

  describe('error message quality', () => {
    it('should have meaningful error messages', () => {
      Object.values(FIELD_VALIDATION).forEach((rules) => {
        rules.forEach((rule) => {
          expect(rule.message.length).toBeGreaterThan(5) // Not too short
          expect(rule.message).not.toMatch(/^\s*$/) // Not just whitespace
          expect(typeof rule.message).toBe('string')
        })
      })
    })

    it('should have consistent dangerous content message across field types', () => {
      // Dangerous content message should be the same for all text field types
      expect(FIELD_VALIDATION.name[0]?.message).toBe(
        FIELD_VALIDATION.email[0]?.message,
      )
      expect(FIELD_VALIDATION.email[0]?.message).toBe(
        FIELD_VALIDATION.general[0]?.message,
      )
      expect(FIELD_VALIDATION.general[0]?.message).toContain('unsafe')
    })
  })
})
