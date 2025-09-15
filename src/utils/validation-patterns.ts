/**
 * Centralized validation patterns and character sets for input sanitization and validation.
 * This is the single source of truth for all character validation rules across the application.
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
  generalSafe: ["'", '-', ' ', '.'],
} as const

/**
 * Validation regex patterns for different field types.
 * These patterns test for INVALID characters that should be rejected.
 */
export const VALIDATION_PATTERNS = {
  /** Characters not allowed in names */
  invalidNameChars: /[<>"';{}[\]\\]/,

  /** Characters not allowed in emails */
  invalidEmailChars: /[<>"'{}[\]\\]/,

  /** Characters not allowed in phone numbers */
  invalidPhoneChars: /[^\d\s\+\-\(\)\.]/,

  /** Basic text characters not allowed */
  invalidTextChars: /[<>"']/,

  /** Combined dangerous patterns for any field */
  dangerousContent: /<script|javascript:|data:text\/html|vbscript:|on\w+\s*=/i,
} as const

/**
 * Field-specific validation rules that bundle pattern and message together.
 * Each rule is an object with pattern and message properties.
 */
export const FIELD_VALIDATION = {
  name: [
    {
      pattern: VALIDATION_PATTERNS.invalidNameChars,
      message: 'Names cannot contain special characters like < > " \' ; { } [ ] \\',
    },
    {
      pattern: VALIDATION_PATTERNS.dangerousContent,
      message: 'Invalid content detected',
    },
  ],

  email: [
    {
      pattern: VALIDATION_PATTERNS.invalidEmailChars,
      message: 'Email cannot contain special characters like < > " \' { } [ ] \\',
    },
    {
      pattern: VALIDATION_PATTERNS.dangerousContent,
      message: 'Invalid content detected',
    },
  ],

  phone: [
    {
      pattern: VALIDATION_PATTERNS.invalidPhoneChars,
      message: 'Phone numbers can only contain digits, spaces, +, -, (, ), and .',
    },
  ],

  text: [
    {
      pattern: VALIDATION_PATTERNS.invalidTextChars,
      message: 'Text cannot contain < > " \' characters',
    },
    {
      pattern: VALIDATION_PATTERNS.dangerousContent,
      message: 'Invalid content detected',
    },
  ],
} as const

/**
 * Sanitization patterns used for cleaning user input.
 * These patterns define what characters to REMOVE during sanitization.
 */
export const SANITIZATION_PATTERNS = {
  /** Characters to remove from emails during sanitization */
  emailUnsafeChars: /[<>"']/g,

  /** Characters to remove from text during sanitization */
  textUnsafeChars: /[<>"]/g,

  /** Characters to keep in names (Unicode letters, marks, spaces, and common punctuation) */
  nameAllowedChars: /[^\p{L}\p{M}\s\-\.']/gu,
} as const

/**
 * Utility function to test if a value passes validation for a specific field type.
 */
export const validateFieldContent = (
  value: string,
  fieldType: keyof typeof FIELD_VALIDATION,
): { isValid: boolean; errorMessage?: string } => {
  const rules = FIELD_VALIDATION[fieldType]

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
 * Type definition for a validation rule with pattern and message.
 */
export type ValidationRule = {
  pattern: RegExp
  message: string
}

/**
 * Flexible validation rule sets that can be customized.
 * Use these with createValidatedField for full control over validation.
 */
export const VALIDATION_RULE_SETS = {
  /** Standard name validation rules */
  name: () => [...FIELD_VALIDATION.name],
  
  /** Standard email validation rules */
  email: () => [...FIELD_VALIDATION.email],
  
  /** Standard phone validation rules */
  phone: () => [...FIELD_VALIDATION.phone],
  
  /** Standard text validation rules */
  text: () => [...FIELD_VALIDATION.text],
  
  /** Only dangerous content validation (no character restrictions) */
  dangerousContentOnly: (): ValidationRule[] => [
    {
      pattern: VALIDATION_PATTERNS.dangerousContent,
      message: 'Invalid content detected',
    },
  ],
  
  /** Only basic character validation (no dangerous content check) */
  basicCharsOnly: {
    name: (): ValidationRule[] => [
      {
        pattern: VALIDATION_PATTERNS.invalidNameChars,
        message: 'Names cannot contain special characters like < > " \' ; { } [ ] \\',
      },
    ],
    email: (): ValidationRule[] => [
      {
        pattern: VALIDATION_PATTERNS.invalidEmailChars,
        message: 'Email cannot contain special characters like < > " \' { } [ ] \\',
      },
    ],
    phone: (): ValidationRule[] => [
      {
        pattern: VALIDATION_PATTERNS.invalidPhoneChars,
        message: 'Phone numbers can only contain digits, spaces, +, -, (, ), and .',
      },
    ],
    text: (): ValidationRule[] => [
      {
        pattern: VALIDATION_PATTERNS.invalidTextChars,
        message: 'Text cannot contain < > " \' characters',
      },
    ],
  },
} as const
