import { formDefaults, prepareFormValues } from '../form'

describe('form utilities', () => {
  describe('prepareFormValues', () => {
    it('should replace null values with empty strings', () => {
      const input = {
        name: 'John',
        email: null,
        phone: undefined,
        address: 'Some address',
      }
      const result = prepareFormValues(input)
      expect(result).toEqual({
        name: 'John',
        email: '',
        phone: '',
        address: 'Some address',
      })
    })

    it('should handle null or undefined input', () => {
      expect(prepareFormValues(null)).toBeNull()
      expect(prepareFormValues(undefined)).toBeUndefined()
    })

    it('should handle empty object', () => {
      const result = prepareFormValues({})
      expect(result).toEqual({})
    })
  })

  describe('formDefaults', () => {
    it('should merge defaults with initial data', () => {
      const defaults = {
        name: '',
        email: '',
        age: 0,
        active: false,
      }
      const initial = {
        name: 'John',
        email: 'john@example.com',
        extra: 'ignored', // Should be ignored since not in defaults
      }
      const result = formDefaults(defaults, initial)
      expect(result).toEqual({
        name: 'John',
        email: 'john@example.com',
        age: 0,
        active: false,
      })
    })

    it('should use only defaults when no initial data provided', () => {
      const defaults = {
        name: '',
        email: '',
        age: 0,
      }
      const result = formDefaults(defaults)
      expect(result).toEqual(defaults)
    })

    it('should use defaults when initial is null', () => {
      const defaults = {
        name: '',
        email: '',
      }
      const result = formDefaults(defaults, null)
      expect(result).toEqual(defaults)
    })

    it('should preserve default values for missing initial fields', () => {
      const defaults = {
        name: 'Default Name',
        email: 'default@example.com',
        phone: '',
      }
      const initial = {
        name: 'John',
        // email and phone missing from initial
      }
      const result = formDefaults(defaults, initial)
      expect(result).toEqual({
        name: 'John',
        email: 'default@example.com',
        phone: '',
      })
    })
  })
})
