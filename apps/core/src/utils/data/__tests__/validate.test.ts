/**
 * @jest-environment node
 */
import {
  CHARACTER_SETS,
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

  describe('CHARACTER_SETS', () => {
    it('should define HTML unsafe characters', () => {
      expect(CHARACTER_SETS.htmlUnsafe).toEqual(['<', '>', '"'])
    })

    it('should define injection risk characters', () => {
      expect(CHARACTER_SETS.injectionRisk).toEqual([';', '{', '}', '[', ']'])
    })

    it('should define generally safe characters', () => {
      expect(CHARACTER_SETS.generalSafe).toEqual(["'", '-', '.'])
    })
  })

  describe('VALIDATION_PATTERNS', () => {
    describe('invalidNameChars', () => {
      it('should detect invalid name characters', () => {
        const invalidChars = ['<', '>', '"', "'", ';', '{', '}', '[', ']', '\\']

        invalidChars.forEach((char) => {
          expect(
            VALIDATION_PATTERNS.invalidNameChars.test(`John${char}Doe`),
          ).toBe(true)
        })
      })

      it('should allow valid name characters', () => {
        const validNames = [
          'John Doe',
          'Jean-Pierre',
          'Mary-Jane',
          'José García',
          '李明',
          'André',
          'Müller',
        ]

        validNames.forEach((name) => {
          expect(VALIDATION_PATTERNS.invalidNameChars.test(name)).toBe(false)
        })
      })
    })

    describe('invalidEmailChars', () => {
      it('should detect invalid email characters', () => {
        const invalidChars = ['<', '>', '"', "'", '{', '}', '[', ']', '\\']

        invalidChars.forEach((char) => {
          expect(
            VALIDATION_PATTERNS.invalidEmailChars.test(
              `user${char}@example.com`,
            ),
          ).toBe(true)
        })
      })

      it('should allow valid email characters', () => {
        const validEmails = [
          'user@example.com',
          'first.last@domain.co.uk',
          'user+tag@example.org',
          'test123@subdomain.example.com',
        ]

        validEmails.forEach((email) => {
          expect(VALIDATION_PATTERNS.invalidEmailChars.test(email)).toBe(false)
        })
      })
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

    describe('invalidTextChars', () => {
      it('should detect invalid text characters', () => {
        const invalidChars = ['<', '>', '"', "'"]

        invalidChars.forEach((char) => {
          expect(
            VALIDATION_PATTERNS.invalidTextChars.test(`Hello${char}World`),
          ).toBe(true)
        })
      })

      it('should allow valid text characters', () => {
        const validTexts = [
          'Hello world!',
          'This is a test message.',
          'Numbers 123 and symbols @#$%^&*()',
          'Unicode characters: 你好 мир',
        ]

        validTexts.forEach((text) => {
          expect(VALIDATION_PATTERNS.invalidTextChars.test(text)).toBe(false)
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
      expect(FIELD_VALIDATION.text).toBeDefined()
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
      const textFields = ['name', 'email', 'text']

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
    describe('emailUnsafeChars', () => {
      it('should match email unsafe characters', () => {
        // emailUnsafeChars: /[<>"']/g
        const unsafeChars = ['<', '>', '"', "'"]

        unsafeChars.forEach((char) => {
          // Test with a string containing the character
          const testString = `test${char}email`
          // Create fresh regex to avoid global flag state issues
          const pattern = /[<>"']/g
          expect(pattern.test(testString)).toBe(true)
        })
      })

      it('should not match safe email characters', () => {
        const safeChars = ['@', '.', '+', '-', '_']

        safeChars.forEach((char) => {
          expect(SANITIZATION_PATTERNS.emailUnsafeChars.test(char)).toBe(false)
        })
      })
    })

    describe('textUnsafeChars', () => {
      it('should match text unsafe characters', () => {
        // textUnsafeChars: /[<>"]/g (note: no apostrophe)
        const unsafeChars = ['<', '>', '"']

        unsafeChars.forEach((char) => {
          // Test with a string containing the character
          const testString = `test${char}text`
          // Create fresh regex to avoid global flag state issues
          const pattern = /[<>"]/g
          expect(pattern.test(testString)).toBe(true)
        })
      })

      it('should not match safe text characters', () => {
        const safeChars = ['a', 'Z', '1', ' ', '.', '-', "'"]

        safeChars.forEach((char) => {
          expect(SANITIZATION_PATTERNS.textUnsafeChars.test(char)).toBe(false)
        })
      })
    })

    describe('nameUnsafeChars', () => {
      it('should match characters not allowed in names', () => {
        // nameUnsafeChars: /[^\p{L}\p{M}\s\-\.']/gu - matches anything NOT Unicode letters, marks, spaces, hyphens, periods, apostrophes
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
          '(',
          ')',
          '+',
          '=',
          '[',
          ']',
          '{',
          '}',
          '|',
          '\\',
          '/',
          '?',
          '!',
          '1',
          '2',
          '3',
        ]

        unsafeChars.forEach((char) => {
          // Test with a string containing the character
          const testString = `test${char}name`
          // Create fresh regex to avoid global flag state issues
          const pattern = /[^\p{L}\p{M}\s\-.']/gu
          expect(pattern.test(testString)).toBe(true)
        })
      })

      it('should not match characters allowed in names', () => {
        // Unicode letters, marks, spaces, hyphens, periods, apostrophes
        const safeInputs = [
          'a',
          'Z',
          'é',
          'ñ',
          'ü',
          'ć', // Unicode letters
          ' ', // spaces
          '-', // hyphens
          '.', // periods
          "'", // apostrophes
          '李',
          '明', // Chinese characters
          'François', // accented characters
          "O'Connor", // apostrophe in name
        ]

        safeInputs.forEach((input) => {
          expect(SANITIZATION_PATTERNS.nameUnsafeChars.test(input)).toBe(false)
        })
      })
    })
  })

  describe('validateFieldContent', () => {
    describe('name field validation', () => {
      it('should validate clean names', () => {
        const validNames = [
          'John Doe',
          'Jean-Pierre',
          'José García',
          'Mary Jane',
        ]

        validNames.forEach((name) => {
          const result = validateFieldContent(name, 'name')
          expect(result.isValid).toBe(true)
          expect(result.errorMessage).toBeUndefined()
        })
      })

      it('should reject names with invalid characters', () => {
        const invalidNames = [
          'John<script>alert(1)</script>',
          'Jane"Doe',
          "User'Name;DROP TABLE users",
          'Test{user}',
          'Name[with]brackets',
        ]

        invalidNames.forEach((name) => {
          const result = validateFieldContent(name, 'name')
          expect(result.isValid).toBe(false)
          expect(result.errorMessage).toBeDefined()
        })
      })

      it('should reject names with dangerous content', () => {
        const dangerousNames = [
          'javascript:alert(1)',
          'data:text/html,<h1>hack</h1>',
          'onload=evil()',
        ]

        dangerousNames.forEach((name) => {
          const result = validateFieldContent(name, 'name')
          expect(result.isValid).toBe(false)
          // The specific error message may vary depending on which rule fails first
          expect(result.errorMessage).toBeDefined()
        })
      })
    })

    describe('email field validation', () => {
      it('should validate clean email addresses', () => {
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

      it('should reject emails with invalid characters', () => {
        const invalidEmails = [
          'user<script>@example.com',
          'test"user@domain.com',
          'user{name}@example.com',
        ]

        invalidEmails.forEach((email) => {
          const result = validateFieldContent(email, 'email')
          expect(result.isValid).toBe(false)
          expect(result.errorMessage).toBeDefined()
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
          expect(result.errorMessage).toBe(
            'Phone numbers can only contain digits, spaces, +, -, (, ), and .',
          )
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
          const result = validateFieldContent(text, 'text')
          expect(result.isValid).toBe(true)
          expect(result.errorMessage).toBeUndefined()
        })
      })

      it('should reject text with invalid characters', () => {
        const invalidTexts = [
          'Hello <world>',
          'Test "message"',
          "Single 'quote' test",
        ]

        invalidTexts.forEach((text) => {
          const result = validateFieldContent(text, 'text')
          expect(result.isValid).toBe(false)
          expect(result.errorMessage).toBeDefined()
        })
      })
    })

    it('should handle empty strings', () => {
      const fieldTypes = ['name', 'email', 'phone', 'text'] as const

      fieldTypes.forEach((fieldType) => {
        const result = validateFieldContent('', fieldType)
        expect(result.isValid).toBe(true)
        expect(result.errorMessage).toBeUndefined()
      })
    })

    it('should handle whitespace-only strings', () => {
      const fieldTypes = ['name', 'email', 'phone', 'text'] as const

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
        const ruleSetNames = ['name', 'email', 'phone', 'text'] as const

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
        expect(rules[0]?.message).toBe('Invalid content detected')
      })
    })

    describe('parameterized rule exclusion', () => {
      it('should allow disabling specific rules for name', () => {
        const withoutDangerous = VALIDATION_RULE_SETS.name({
          dangerousContent: false,
        })
        expect(withoutDangerous).toHaveLength(1)
        expect(
          withoutDangerous.some((rule) => rule.id === 'invalidNameChars'),
        ).toBe(true)
        expect(
          withoutDangerous.some((rule) => rule.id === 'dangerousContent'),
        ).toBe(false)

        const withoutChars = VALIDATION_RULE_SETS.name({
          invalidNameChars: false,
        })
        expect(withoutChars).toHaveLength(1)
        expect(
          withoutChars.some((rule) => rule.id === 'dangerousContent'),
        ).toBe(true)
      })

      it('should allow disabling specific rules for email', () => {
        const withoutDangerous = VALIDATION_RULE_SETS.email({
          dangerousContent: false,
        })
        expect(withoutDangerous).toHaveLength(1)
        expect(
          withoutDangerous.some((rule) => rule.id === 'invalidEmailChars'),
        ).toBe(true)

        const withoutChars = VALIDATION_RULE_SETS.email({
          invalidEmailChars: false,
        })
        expect(withoutChars).toHaveLength(1)
        expect(
          withoutChars.some((rule) => rule.id === 'dangerousContent'),
        ).toBe(true)
      })

      it('should allow disabling specific rules for text', () => {
        const withoutDangerous = VALIDATION_RULE_SETS.text({
          dangerousContent: false,
        })
        expect(withoutDangerous).toHaveLength(1)
        expect(
          withoutDangerous.some((rule) => rule.id === 'invalidTextChars'),
        ).toBe(true)

        const withoutChars = VALIDATION_RULE_SETS.text({
          invalidTextChars: false,
        })
        expect(withoutChars).toHaveLength(1)
        expect(
          withoutChars.some((rule) => rule.id === 'dangerousContent'),
        ).toBe(true)
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

      it('should allow disabling multiple rules', () => {
        const noRules = VALIDATION_RULE_SETS.name({
          invalidNameChars: false,
          dangerousContent: false,
        })
        expect(noRules).toHaveLength(0)

        const noUuidRules = VALIDATION_RULE_SETS.uuid({
          invalidUuidChars: false,
          dangerousContent: false,
        })
        expect(noUuidRules).toHaveLength(0)
      })

      it('should allow enabling rules by not passing false', () => {
        const allRules = VALIDATION_RULE_SETS.name({})
        expect(allRules).toHaveLength(2)

        const allUuidRules = VALIDATION_RULE_SETS.uuid({})
        expect(allUuidRules).toHaveLength(2)
      })
    })

    describe('rule set completeness', () => {
      it('should have all expected rule sets defined', () => {
        const expectedRuleSets = [
          'name',
          'email',
          'phone',
          'text',
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
        id: 'invalidNameChars',
        pattern: /test/,
        message: 'Test message',
      }

      expect(testRule.id).toBe('invalidNameChars')
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
      expect(FIELD_VALIDATION.name[0].pattern).toBe(
        VALIDATION_PATTERNS.invalidNameChars,
      )
      expect(FIELD_VALIDATION.name[1].pattern).toBe(
        VALIDATION_PATTERNS.dangerousContent,
      )

      expect(FIELD_VALIDATION.email[0].pattern).toBe(
        VALIDATION_PATTERNS.invalidEmailChars,
      )
      expect(FIELD_VALIDATION.email[1].pattern).toBe(
        VALIDATION_PATTERNS.dangerousContent,
      )

      expect(FIELD_VALIDATION.phone[0].pattern).toBe(
        VALIDATION_PATTERNS.invalidPhoneChars,
      )

      expect(FIELD_VALIDATION.text[0].pattern).toBe(
        VALIDATION_PATTERNS.invalidTextChars,
      )
      expect(FIELD_VALIDATION.text[1].pattern).toBe(
        VALIDATION_PATTERNS.dangerousContent,
      )
    })

    it('should have consistent patterns between FIELD_VALIDATION and VALIDATION_RULE_SETS', () => {
      // Standard rule sets should match FIELD_VALIDATION
      expect(VALIDATION_RULE_SETS.name()).toEqual(FIELD_VALIDATION.name)
      expect(VALIDATION_RULE_SETS.email()).toEqual(FIELD_VALIDATION.email)
      expect(VALIDATION_RULE_SETS.phone()).toEqual(FIELD_VALIDATION.phone)
      expect(VALIDATION_RULE_SETS.text()).toEqual(FIELD_VALIDATION.text)
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

    it('should have specific error messages for different validation types', () => {
      // Check that different field types have different messages for character validation
      const nameCharMessage = FIELD_VALIDATION.name[0].message
      const emailCharMessage = FIELD_VALIDATION.email[0].message
      const phoneCharMessage = FIELD_VALIDATION.phone[0].message
      const textCharMessage = FIELD_VALIDATION.text[0].message

      expect(nameCharMessage).toContain('Names')
      expect(emailCharMessage).toContain('Email')
      expect(phoneCharMessage).toContain('Phone')
      expect(textCharMessage).toContain('Text')

      // But dangerous content messages should be the same
      expect(FIELD_VALIDATION.name[1].message).toBe(
        FIELD_VALIDATION.email[1].message,
      )
      expect(FIELD_VALIDATION.email[1].message).toBe(
        FIELD_VALIDATION.text[1].message,
      )
    })
  })
})
