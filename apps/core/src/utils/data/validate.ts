/**
 * Centralized validation patterns and character sets for input sanitization and validation.
 * This is the single source of truth for all general character validation rules across the application.
 */

/** Dangerous text patterns that should always be blocked. */
export const DANGEROUS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, // Script tags
  /javascript:/gi, // JavaScript protocol
  /data:text\/html/gi, // Data URLs with HTML
  /vbscript:/gi, // VBScript protocol
  /on\w+\s*=/gi, // Event handlers like onclick=
] as const

/** Context-specific character sets. */
export const CHARACTER_SETS = {
  /** Characters that are dangerous in HTML context but may be OK elsewhere. */
  htmlUnsafe: ['<', '>', '"'],
  /** Characters that could be used in injection attacks. */
  injectionRisk: [';', '{', '}', '[', ']'],
  /** Characters typically safe in text like names. */
  generalSafe: ["'", '-', '.'],
} as const

/**
 * Validation regex patterns for different field types.
 * These patterns test for **INVALID** characters that should be rejected.
 */
export const VALIDATION_PATTERNS = {
  /** Characters not allowed in names. */
  invalidNameChars: /[<>"';{}[\]\\]/,

  /** Characters not allowed in emails. */
  invalidEmailChars: /[<>"'{}[\]\\]/,

  /** Characters not allowed in phone numbers. */
  invalidPhoneChars: /[^\d\s+\-().]/,

  /** Special characters not allowed in general text. */
  invalidTextChars: /[<>"']/,

  /** Combined dangerous patterns for any field. */
  dangerousContent: /<script|javascript:|data:text\/html|vbscript:|on\w+\s*=/i,
} as const

/**
 * Predefined validation messages for common patterns.
 */
const VALIDATION_MESSAGES = {
  invalidNameChars:
    'Names cannot contain special characters like < > " \' ; { } [ ] \\',
  invalidEmailChars:
    'Email cannot contain special characters like < > " \' { } [ ] \\',
  invalidPhoneChars:
    'Phone numbers can only contain digits, spaces, +, -, (, ), and .',
  invalidTextChars: 'Text cannot contain < > " \' characters',
  dangerousContent: 'Invalid content detected',
} as const satisfies { [key in keyof typeof VALIDATION_PATTERNS]: string }

/**
 * A regex validation rule with pattern and associated error message.
 */
export type ValidationRule = {
  id: keyof typeof VALIDATION_PATTERNS
  pattern: RegExp
  message: string
}

/**
 * A mapping of validation patterns and associated error messages,
 * for various common field types.
 */
export const FIELD_VALIDATION = {
  name: [
    {
      id: 'invalidNameChars',
      pattern: VALIDATION_PATTERNS.invalidNameChars,
      message: VALIDATION_MESSAGES.invalidNameChars,
    },
    {
      id: 'dangerousContent',
      pattern: VALIDATION_PATTERNS.dangerousContent,
      message: VALIDATION_MESSAGES.dangerousContent,
    },
  ],

  email: [
    {
      id: 'invalidEmailChars',
      pattern: VALIDATION_PATTERNS.invalidEmailChars,
      message: VALIDATION_MESSAGES.invalidEmailChars,
    },
    {
      id: 'dangerousContent',
      pattern: VALIDATION_PATTERNS.dangerousContent,
      message: VALIDATION_MESSAGES.dangerousContent,
    },
  ],

  phone: [
    {
      id: 'invalidPhoneChars',
      pattern: VALIDATION_PATTERNS.invalidPhoneChars,
      message: VALIDATION_MESSAGES.invalidPhoneChars,
    },
  ],

  text: [
    {
      id: 'invalidTextChars',
      pattern: VALIDATION_PATTERNS.invalidTextChars,
      message: VALIDATION_MESSAGES.invalidTextChars,
    },
    {
      id: 'dangerousContent',
      pattern: VALIDATION_PATTERNS.dangerousContent,
      message: VALIDATION_MESSAGES.dangerousContent,
    },
  ],
} as const satisfies { [field: string]: ValidationRule[] }

/**
 * Sanitization patterns used for cleaning user input.
 * These patterns define what characters to **REMOVE** during sanitization.
 */
export const SANITIZATION_PATTERNS = {
  /** Characters to remove from emails. */
  emailUnsafeChars: /[<>"']/g,

  /** Characters to remove from general text. */
  textUnsafeChars: /[<>"]/g,

  /** @todo Allow numeric characters if they're not already. */
  /** Characters to remove from names (anything NOT Unicode letters, marks, spaces, hyphens, periods, apostrophes). */
  nameUnsafeChars: /[^\p{L}\p{M}\s\-.']/gu,
} as const

/**
 * Utility function to test if a value passes validation for a specific field type.
 */
export const validateFieldContent = (
  value: string,
  fieldType: keyof typeof FIELD_VALIDATION,
): { isValid: boolean; errorMessage?: string } => {
  const rules = FIELD_VALIDATION?.[fieldType]

  for (const rule of rules) {
    if (rule.pattern.test(value)) {
      return {
        isValid: false,
        errorMessage: rule.message,
      }
    }
  }

  return { isValid: true }
}

/**
 * Flexible validation rule sets that can be customized.
 * Use these with createValidatedField for full control over validation.
 *
 * By default, all validation rules are applied. To disable specific rules,
 * pass an object with the rule ID set to false.
 *
 * @example
 * // Get all standard name validation rules
 * VALIDATION_RULE_SETS.name()
 *
 * // Get name validation without dangerous content check
 * VALIDATION_RULE_SETS.name({ dangerousContent: false })
 *
 * // Get only character validation, no dangerous content
 * VALIDATION_RULE_SETS.name({ dangerousContent: false })
 */
export const VALIDATION_RULE_SETS = {
  /** Standard name validation rules */
  name: (options: { [key in ValidationRule['id']]?: boolean } = {}) =>
    FIELD_VALIDATION.name.filter((rule) => options[rule.id] !== false),

  /** Standard email validation rules */
  email: (options: { [key in ValidationRule['id']]?: boolean } = {}) =>
    FIELD_VALIDATION.email.filter((rule) => options[rule.id] !== false),

  /** Standard phone validation rules */
  phone: (options: { [key in ValidationRule['id']]?: boolean } = {}) =>
    FIELD_VALIDATION.phone.filter((rule) => options[rule.id] !== false),

  /** Standard text validation rules */
  text: (options: { [key in ValidationRule['id']]?: boolean } = {}) =>
    FIELD_VALIDATION.text.filter((rule) => options[rule.id] !== false),

  /** Only dangerous content validation (no character restrictions) */
  dangerousContentOnly: (): ValidationRule[] => [
    {
      id: 'dangerousContent',
      pattern: VALIDATION_PATTERNS.dangerousContent,
      message: VALIDATION_MESSAGES.dangerousContent,
    },
  ],
} as const
