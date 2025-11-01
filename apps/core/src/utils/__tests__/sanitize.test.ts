import {
  blacklistCharacters,
  normalizeSpaces,
  sanitizeTextInput,
  whitelistCharacters,
} from '../data/sanitize'

describe('sanitize', () => {
  describe('normalizeSpaces function', () => {
    it('should replace multiple spaces with single space', () => {
      expect(normalizeSpaces('foo    bar')).toBe('foo bar')
      expect(normalizeSpaces('hello     world')).toBe('hello world')
      expect(normalizeSpaces('a  b  c  d')).toBe('a b c d')
    })

    it('should handle mixed whitespace characters', () => {
      expect(normalizeSpaces('foo\t\t\tbar')).toBe('foo bar')
      expect(normalizeSpaces('hello\n\n\nworld')).toBe('hello world')
      expect(normalizeSpaces('test \t \n \r mixed')).toBe('test mixed')
    })

    it('should preserve leading and trailing spaces by default', () => {
      expect(normalizeSpaces(' foo   bar ')).toBe(' foo bar ')
      expect(normalizeSpaces('  hello  world  ')).toBe(' hello world ')
      expect(normalizeSpaces('\tfoo\t')).toBe(' foo ')
    })

    it('should trim when trim option is true', () => {
      expect(normalizeSpaces(' foo   bar ', { trim: true })).toBe('foo bar')
      expect(normalizeSpaces('  hello  world  ', { trim: true })).toBe(
        'hello world',
      )
      expect(normalizeSpaces('\tfoo\t', { trim: true })).toBe('foo')
    })

    it('should handle edge cases', () => {
      expect(normalizeSpaces('')).toBe('')
      expect(normalizeSpaces(' ')).toBe(' ')
      expect(normalizeSpaces('   ')).toBe(' ')
      expect(normalizeSpaces('single')).toBe('single')
      expect(normalizeSpaces('no-spaces')).toBe('no-spaces')
    })

    it('should handle non-string input gracefully', () => {
      expect(normalizeSpaces(null as any)).toBe('')
      expect(normalizeSpaces(undefined as any)).toBe('')
      expect(normalizeSpaces(123 as any)).toBe('')
      expect(normalizeSpaces({} as any)).toBe('')
      expect(normalizeSpaces([] as any)).toBe('')
    })

    it('should handle only whitespace strings', () => {
      expect(normalizeSpaces('     ')).toBe(' ')
      expect(normalizeSpaces('\t\t\t')).toBe(' ')
      expect(normalizeSpaces('\n\n\n')).toBe(' ')
      expect(normalizeSpaces('     ', { trim: true })).toBe('')
      expect(normalizeSpaces('\t\t\t', { trim: true })).toBe('')
    })

    it('should work with Unicode characters', () => {
      expect(normalizeSpaces('héllo    wørld')).toBe('héllo wørld')
      expect(normalizeSpaces('José   François   Müller')).toBe(
        'José François Müller',
      )
    })

    it('should handle trim option false explicitly', () => {
      expect(normalizeSpaces(' foo   bar ', { trim: false })).toBe(' foo bar ')
      expect(normalizeSpaces('  test  ', { trim: false })).toBe(' test ')
    })
  })

  describe('blacklistCharacters function', () => {
    it('should handle non-string input gracefully', () => {
      expect(blacklistCharacters(null as any, ['a'])).toBe('')
      expect(blacklistCharacters(undefined as any, ['a'])).toBe('')
      expect(blacklistCharacters(123 as any, ['a'])).toBe('')
      expect(blacklistCharacters({} as any, ['a'])).toBe('')
      expect(blacklistCharacters([] as any, ['a'])).toBe('')
    })

    it('should remove basic characters', () => {
      const input = 'hello world!'
      const result = blacklistCharacters(input, ['!', ' '])
      expect(result).toBe('helloworld')
    })

    it('should handle empty inputs gracefully', () => {
      expect(blacklistCharacters('', ['a'])).toBe('')
      expect(blacklistCharacters('hello', [])).toBe('hello')
      expect(blacklistCharacters('hello', undefined as any)).toBe('hello')
    })

    it('should properly escape regex special characters', () => {
      const input =
        'test.with*special+chars?and[brackets]and(parens)and{braces}and^start$end|pipe'
      const regexChars = [
        '.',
        '*',
        '+',
        '?',
        '[',
        ']',
        '(',
        ')',
        '{',
        '}',
        '^',
        '$',
        '|',
      ]
      const result = blacklistCharacters(input, regexChars)
      expect(result).toBe(
        'testwithspecialcharsandbracketsandparensandbracesandstartendpipe',
      )
    })

    it('should handle backslashes and forward slashes', () => {
      const input = 'test\\backslash/forward\\slash'
      const result = blacklistCharacters(input, ['\\', '/'])
      expect(result).toBe('testbackslashforwardslash')
    })

    it('should handle quote characters', () => {
      const input = 'test"double\'single`backtick'
      const result = blacklistCharacters(input, ['"', "'", '`'])
      expect(result).toBe('testdoublesinglebacktick')
    })

    it('should handle hyphen and dash characters that are special in regex character classes', () => {
      const input = 'test-hyphen—emdash–endash'
      const result = blacklistCharacters(input, ['-', '—', '–'])
      expect(result).toBe('testhyphenemdashendash')
    })

    it('should handle multiple occurrences of the same character', () => {
      const input = 'a.b.c.d.e'
      const result = blacklistCharacters(input, ['.'])
      expect(result).toBe('abcde')
    })

    it('should handle Unicode characters in blacklist', () => {
      const input = 'héllo wørld café'
      const result = blacklistCharacters(input, ['é', 'ø'])
      expect(result).toBe('hllo wrld caf')
    })
  })

  describe('whitelistCharacters function', () => {
    it('should handle non-string input gracefully', () => {
      expect(whitelistCharacters(null as any, ['a'])).toBe('')
      expect(whitelistCharacters(undefined as any, ['a'])).toBe('')
      expect(whitelistCharacters(123 as any, ['a'])).toBe('')
      expect(whitelistCharacters({} as any, ['a'])).toBe('')
      expect(whitelistCharacters([] as any, ['a'])).toBe('')
    })

    it('should keep only whitelisted characters', () => {
      const input = 'hello123world!@#'
      const result = whitelistCharacters(input, [
        'h',
        'e',
        'l',
        'o',
        'w',
        'r',
        'd',
      ])
      expect(result).toBe('helloworld')
    })

    it('should handle empty inputs gracefully', () => {
      expect(whitelistCharacters('', ['a'])).toBe('')
      expect(whitelistCharacters('hello', [])).toBe('')
      expect(whitelistCharacters('hello', undefined as any)).toBe('')
    })

    it('should properly escape regex special characters in whitelist', () => {
      const input = 'keep.these*chars+only?'
      const allowedChars = ['.', '*', '+', '?']
      const result = whitelistCharacters(input, allowedChars)
      expect(result).toBe('.*+?')
    })

    it('should handle complex regex characters in whitelist', () => {
      const input = 'test[abc]def(ghi)jkl{mno}pqr^stu$vwx|yz'
      const allowedChars = ['[', ']', '(', ')', '{', '}', '^', '$', '|']
      const result = whitelistCharacters(input, allowedChars)
      expect(result).toBe('[](){}^$|')
    })

    it('should handle backslashes and quotes in whitelist', () => {
      const input = 'test\\slash"quote\'apostrophe`backtick123'
      const allowedChars = ['\\', '"', "'", '`']
      const result = whitelistCharacters(input, allowedChars)
      expect(result).toBe('\\"\'`')
    })

    it('should handle hyphen character in whitelist', () => {
      const input = 'test-hyphen_underscore.dot'
      const allowedChars = ['-', '_', '.']
      const result = whitelistCharacters(input, allowedChars)
      expect(result).toBe('-_.')
    })

    it('should preserve character order', () => {
      const input = 'zyxwvutsrqponmlkjihgfedcba'
      const allowedChars = ['a', 'b', 'c', 'd', 'e']
      const result = whitelistCharacters(input, allowedChars)
      expect(result).toBe('edcba')
    })

    it('should handle Unicode characters in whitelist', () => {
      const input = 'héllo wørld café  '
      const allowedChars = ['é', 'ø', ' ']
      const result = whitelistCharacters(input, allowedChars)
      expect(result).toBe('é ø é  ')
    })

    it('should handle repeated characters in whitelist', () => {
      const input = 'aabbccddee'
      const allowedChars = ['a', 'c', 'e']
      const result = whitelistCharacters(input, allowedChars)
      expect(result).toBe('aaccee')
    })
  })

  describe('regex escaping edge cases', () => {
    it('should handle all regex metacharacters in blacklist', () => {
      const metacharacters = [
        '.',
        '^',
        '$',
        '*',
        '+',
        '?',
        '(',
        ')',
        '[',
        ']',
        '{',
        '}',
        '|',
        '\\',
      ]
      const input = metacharacters.join('')
      const result = blacklistCharacters(input, metacharacters)
      expect(result).toBe('')
    })

    it('should handle all regex metacharacters in whitelist', () => {
      const metacharacters = [
        '.',
        '^',
        '$',
        '*',
        '+',
        '?',
        '(',
        ')',
        '[',
        ']',
        '{',
        '}',
        '|',
        '\\',
      ]
      const input = metacharacters.join('') + 'abcd123'
      const result = whitelistCharacters(input, metacharacters)
      expect(result).toBe(metacharacters.join(''))
    })

    it('should handle character class ranges that could break regex', () => {
      const input = 'a-z0-9A-Z'
      const result = blacklistCharacters(input, ['-'])
      expect(result).toBe('az09AZ')
    })

    it('should handle characters that are special in character classes individually', () => {
      // Test each character separately to avoid regex construction issues
      const input = 'test^caret-hyphen]bracket\\backslash'

      expect(blacklistCharacters(input, ['^'])).toBe(
        'testcaret-hyphen]bracket\\backslash',
      )
      expect(blacklistCharacters(input, ['-'])).toBe(
        'test^carethyphen]bracket\\backslash',
      )
      expect(blacklistCharacters(input, [']'])).toBe(
        'test^caret-hyphenbracket\\backslash',
      )
      expect(blacklistCharacters(input, ['\\'])).toBe(
        'test^caret-hyphen]bracketbackslash',
      )
    })
  })

  describe('custom character handling', () => {
    it('should remove characters from blacklist', () => {
      const input = 'test[brackets]and(parens)'
      const result = sanitizeTextInput(input, {
        blacklist: ['[', ']', '(', ')'],
      })
      expect(result).toBe('testbracketsandparens')
    })

    it('should keep only whitelisted characters', () => {
      const input = 'test123abc!@#'
      const result = sanitizeTextInput(input, {
        whitelist: ['t', 'e', 's', 'a', 'b', 'c'],
      })
      expect(result).toBe('testabc')
    })
  })

  describe('dangerous pattern removal', () => {
    it('should remove script tags', () => {
      const input = 'Hello <script>alert("xss")</script> World'
      const result = sanitizeTextInput(input, { context: 'server' })
      expect(result).not.toContain('<script>')
      expect(result).not.toContain('alert')
    })

    it('should remove javascript: protocols', () => {
      const input = 'javascript:alert("xss")'
      const result = sanitizeTextInput(input, { context: 'server' })
      expect(result).not.toContain('javascript:')
    })

    it('should remove event handlers', () => {
      const input = 'onclick=alert("xss")'
      const result = sanitizeTextInput(input, { context: 'server' })
      expect(result).not.toContain('onclick=')
    })

    it('should preserve Unicode characters in names', () => {
      const names = ['José', 'François', 'Müller', "O'Connor", 'Van Der Berg']
      names.forEach((name) => {
        const result = sanitizeTextInput(name, { fieldType: 'name' })
        expect(result).toBe(name)
      })
    })

    it('should handle mixed Unicode and dangerous characters in names', () => {
      const input = 'José<script>alert("xss")</script>François'
      const result = sanitizeTextInput(input, { fieldType: 'name' })
      expect(result).toBe('JoséFrançois')
      expect(result).not.toContain('<script>')
    })
  })

  describe('context-aware sanitization', () => {
    it('should be more permissive on client', () => {
      const input = "O'Brien & Company (LLC)"
      const clientResult = sanitizeTextInput(input, { context: 'client' })
      const serverResult = sanitizeTextInput(input, { context: 'server' })

      // Client should preserve more characters (only removes <, >, ")
      expect(clientResult).toContain("'")
      expect(clientResult).toContain('&')
      expect(clientResult).toContain('(')

      // Server should be more restrictive (removes {, }, [, ], ;)
      expect(serverResult).toContain("'") // Still allowed
      expect(serverResult).toContain('&') // Still allowed
      expect(serverResult).toContain('(') // Still allowed
    })

    it('should escape HTML on server when escapeHtml is true', () => {
      const input = '<div>Hello & Goodbye</div>'
      const result = sanitizeTextInput(input, {
        context: 'server',
        escapeHtml: true,
      })
      expect(result).toContain('&lt;')
      expect(result).toContain('&gt;')
      expect(result).toContain('&amp;')
    })
  })

  describe('field type specific sanitization', () => {
    describe('name field type', () => {
      it('should allow apostrophes in names', () => {
        const result = sanitizeTextInput("O'Brien", { fieldType: 'name' })
        expect(result).toBe("O'Brien")
      })

      it('should allow hyphens in names', () => {
        const result = sanitizeTextInput('Mary-Jane', { fieldType: 'name' })
        expect(result).toBe('Mary-Jane')
      })

      it('should remove numbers from names', () => {
        const result = sanitizeTextInput('John123', { fieldType: 'name' })
        expect(result).toBe('John')
      })
    })

    describe('email field type', () => {
      it('should preserve valid email characters', () => {
        const result = sanitizeTextInput('user+tag@example.com', {
          fieldType: 'email',
        })
        expect(result).toBe('user+tag@example.com')
      })

      it('should remove invalid email characters', () => {
        const result = sanitizeTextInput('user<>@example.com', {
          fieldType: 'email',
        })
        expect(result).toBe('user@example.com')
      })
    })

    describe('phone field type', () => {
      it('should preserve common phone number formats', () => {
        expect(
          sanitizeTextInput('+1 (555) 123-4567', { fieldType: 'phone' }),
        ).toBe('+1 (555) 123-4567')
        expect(sanitizeTextInput('555.123.4567', { fieldType: 'phone' })).toBe(
          '555.123.4567',
        )
        expect(sanitizeTextInput('555-123-4567', { fieldType: 'phone' })).toBe(
          '555-123-4567',
        )
      })

      it('should remove letters from phone numbers', () => {
        const result = sanitizeTextInput('555-CALL-NOW', { fieldType: 'phone' })
        expect(result).toBe('555--')
      })

      it('should remove multiple spaces from phone numbers', () => {
        const result = sanitizeTextInput('1  (555) 123-4567 ', {
          fieldType: 'phone',
        })
        expect(result).toBe('1 (555) 123-4567')
      })
    })

    describe('uuid field type', () => {
      it('should preserve valid alphanumeric characters, hyphens, and underscores', () => {
        const result = sanitizeTextInput('abc-123-def_456', {
          fieldType: 'uuid',
        })
        expect(result).toBe('abc-123-def_456')
      })

      it('should remove special characters not allowed in uuids', () => {
        const result = sanitizeTextInput('abc!@#$123<>def', {
          fieldType: 'uuid',
        })
        expect(result).toBe('abc123def')
      })

      it('should handle SQL injection attempts', () => {
        const result = sanitizeTextInput("abc'; DROP TABLE users;--", {
          fieldType: 'uuid',
        })
        expect(result).toBe('abcDROPTABLEusers--')
      })

      it('should handle script tags', () => {
        const result = sanitizeTextInput('abc<script>def</script>', {
          fieldType: 'uuid',
        })
        // DANGEROUS_PATTERNS removes the entire <script>...</script> block
        expect(result).toBe('abc')
      })

      it('should handle hex-style tokens', () => {
        const result = sanitizeTextInput('a1b2c3d4e5f6', { fieldType: 'uuid' })
        expect(result).toBe('a1b2c3d4e5f6')
      })

      it('should return empty string for non-uuid input', () => {
        const result = sanitizeTextInput('!@#$%^&*()', { fieldType: 'uuid' })
        expect(result).toBe('')
      })

      it('should trim whitespace from uuids', () => {
        const result = sanitizeTextInput('  abc-123  ', { fieldType: 'uuid' })
        expect(result).toBe('abc-123')
      })
    })
  })

  describe('edge cases', () => {
    it('should handle non-string input', () => {
      expect(sanitizeTextInput(null as any)).toBe('')
      expect(sanitizeTextInput(undefined as any)).toBe('')
      expect(sanitizeTextInput(123 as any)).toBe('')
    })

    it('should handle empty string', () => {
      expect(sanitizeTextInput('')).toBe('')
    })

    it('should trim by default', () => {
      expect(sanitizeTextInput('  hello  ')).toBe('hello')
    })

    it('should not trim when trim is false', () => {
      expect(sanitizeTextInput('  hello  ', { trim: false })).toBe('  hello  ')
    })
  })
})
