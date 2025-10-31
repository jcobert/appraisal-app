import {
  CHARACTER_SETS,
  DANGEROUS_PATTERNS,
  SANITIZATION_PATTERNS,
} from './validate'
import { escapeRegExp } from 'lodash'
import validator from 'validator'

/**
 * Removes characters from input string based on a blacklist.
 */
export const blacklistCharacters = (
  input: string,
  charsToRemove: string[],
): string => {
  if (typeof input !== 'string') return ''
  if (!charsToRemove?.length) return input
  const escapedChars = charsToRemove.map((char) => escapeRegExp(char))
  return validator.blacklist(input, escapedChars.join(''))
}

/**
 * Keeps only whitelisted characters from input string.
 */
export const whitelistCharacters = (
  input: string,
  charsToKeep: string[],
): string => {
  if (typeof input !== 'string' || !charsToKeep?.length) return ''
  const escapedChars = charsToKeep.map((char) => escapeRegExp(char))
  return validator.whitelist(input, escapedChars.join(''))
}

/**
 * Replaces multiple contiguous spaces with single space.
 * @param trim Trims all leading and trailing whitespace. Default `false`.
 * @example
 * normalizeSpaces('foo    bar') // => 'foo bar'
 * normalizeSpaces(' foo   bar   ') // => ' foo bar '
 * normalizeSpaces(' foo   bar   ', { trim: true }) // => 'foo bar'
 */
export const normalizeSpaces = (
  str: string,
  options?: { trim?: boolean },
): string => {
  if (typeof str !== 'string') return ''
  const { trim = false } = options || {}
  const newStr = str.replace(/\s+/g, ' ')
  return trim ? newStr.trim() : newStr
}

export type SanitizeTextInputOptions = {
  /**
   * Target context in which sanitization is used.
   *
   * - `"client"` is intended for frontend and is more lenient for better UX.
   * - `"server"` is strict and intended for safe backend operations.
   */
  context?: 'client' | 'server'
  /** Field type for context-specific sanitization */
  fieldType?: 'name' | 'email' | 'phone' | 'text' | 'html'
  /** Characters to allow. All other characters will be removed. */
  whitelist?: string[]
  /**
   * Characters to remove. All other characters will be allowed.
   * @note If `whitelist` is provided, that will take precedence.
   */
  blacklist?: string[]
  /** Trims whitespace from start and end. @default true */
  trim?: boolean
  /** Whether to escape HTML entities instead of removing them @default false */
  escapeHtml?: boolean
}

const clientSanitizeOptions = {
  context: 'client',
  trim: true,
  // Only block the most dangerous characters on client
  blacklist: [...CHARACTER_SETS.htmlUnsafe],
} as const satisfies SanitizeTextInputOptions

const serverSanitizeOptions = {
  context: 'server',
  trim: true,
  escapeHtml: false, // Default to removal, not escaping
  // More comprehensive but still allowing legitimate characters like & and ()
  blacklist: [...CHARACTER_SETS.htmlUnsafe, ...CHARACTER_SETS.injectionRisk],
} as const satisfies SanitizeTextInputOptions

/**
 * Sanitizes text input with context-aware security measures.
 * Uses proven libraries and proper Unicode support.
 */
export const sanitizeTextInput = (
  input: string,
  options: SanitizeTextInputOptions = {},
) => {
  if (typeof input !== 'string') return ''

  let newVal = input

  // Remove dangerous patterns first (always)
  for (const pattern of DANGEROUS_PATTERNS) {
    newVal = newVal.replace(pattern, '')
  }

  // Field-type specific handling (takes precedence)
  if (options?.fieldType) {
    switch (options.fieldType) {
      case 'email':
        // Use validator.js for proven email handling
        newVal = normalizeSpaces(newVal, { trim: true })
        // First remove dangerous characters that shouldn't be in emails
        newVal = newVal.replace(SANITIZATION_PATTERNS.emailUnsafeChars, '')
        if (validator.isEmail(newVal)) {
          newVal =
            validator.normalizeEmail(newVal, {
              gmail_remove_dots: false,
            }) || newVal
        }
        break
      case 'phone':
        // Keep only phone-appropriate characters (digits and common separators)
        newVal = newVal.replace(/[^\d\s+\-().]/g, '')
        // Replace multiple contiguous spaces with single space
        newVal = normalizeSpaces(newVal)
        break
      case 'name':
        // Support Unicode letters and common name characters
        // \p{L} = Unicode letters, \p{M} = Unicode marks (accents)
        newVal = newVal.replace(SANITIZATION_PATTERNS.nameUnsafeChars, '')
        break
      case 'html':
        // Use validator.js for HTML escaping
        newVal = validator.escape(newVal)
        break
      case 'text':
        // General text - remove only the most dangerous characters
        newVal = newVal.replace(SANITIZATION_PATTERNS.textUnsafeChars, '')
        break
    }
  }
  // Apply context-specific sanitization if no fieldType was specified
  else if (options?.context === 'server') {
    if (options?.escapeHtml) {
      newVal = validator.escape(newVal)
    } else {
      // Remove server-unsafe characters
      const charsToRemove =
        options?.blacklist || serverSanitizeOptions.blacklist
      newVal = blacklistCharacters(newVal, charsToRemove)
    }
  } else if (options?.context === 'client') {
    // Client-side - more lenient sanitization for UX
    const charsToRemove = options?.blacklist || clientSanitizeOptions.blacklist
    newVal = blacklistCharacters(newVal, charsToRemove)
  }

  // Apply custom whitelist/blacklist (only if no fieldType and no context)
  if (!options?.fieldType && !options?.context) {
    if (options?.whitelist?.length) {
      newVal = whitelistCharacters(newVal, options.whitelist)
    } else if (options?.blacklist?.length) {
      newVal = blacklistCharacters(newVal, options.blacklist)
    }
  }

  if (options?.trim !== false) {
    newVal = newVal.trim()
  }

  return newVal
}
