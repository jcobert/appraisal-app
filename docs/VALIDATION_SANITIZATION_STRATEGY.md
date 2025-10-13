# Validation & Sanitization Strategy

This document explains the centralized validation and sanitization system for secure, consistent form handling across the application.

## 🎯 Quick Start (TL;DR)

**For most form schemas:** Use `fieldBuilder.name()`, `fieldBuilder.email()`, etc.  
**For form submission:** Use `sanitize` prop in `useCoreMutation` or add `sanitizeFormData(data, { fieldName: 'fieldType' })` in your `onSubmit`  
**For API handlers:** Use the `api` schema from schema bundles for server-side validation

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [High-Level APIs (What to Reach For)](#high-level-apis-what-to-reach-for)
3. [Schema Patterns](#schema-patterns)
4. [Form Submission Pattern](#form-submission-pattern)
5. [API Handler Pattern](#api-handler-pattern)
6. [Low-Level Utilities](#low-level-utilities)
7. [Security Strategy](#security-strategy)
8. [Common Patterns](#common-patterns)
9. [Troubleshooting](#troubleshooting)
10. [Recent Improvements](#recent-improvements)

## 🏗️ Architecture Overview

The system has three main layers:

```
┌────────────────────────────────────────────────────────────┐
│                    HIGH-LEVEL APIs                         │
│  (What you should reach for in 95% of cases)               │
├────────────────────────────────────────────────────────────┤
│  • fieldBuilder.name(), fieldBuilder.email(), etc.         │
│  • useCoreMutation sanitize prop (recommended)             │
│  • sanitizeFormData() for manual form submissions          │
│  • Schema bundles (form/api) for type safety               │
└────────────────────────────────────────────────────────────┘
            ▲
            │
┌────────────────────────────────────────────────────────────┐
│                   VALIDATION LAYER                         │
│  (Flexible building blocks for custom needs)               │
├────────────────────────────────────────────────────────────┤
│  • createValidatedField() with VALIDATION_RULE_SETS        │
│  • sanitizedField.name() for automatic sanitization        │
│  • Custom validation rules and refinements                 │
└────────────────────────────────────────────────────────────┘
            ▲
            │
┌────────────────────────────────────────────────────────────┐
│                   PATTERN DEFINITIONS                      │
│  (Low-level patterns - centralized source of truth)        │
├────────────────────────────────────────────────────────────┤
│  • VALIDATION_PATTERNS - regex + messages for validation   │
│  • SANITIZATION_PATTERNS - regex for content removal       │
│  • CHARACTER_SETS - context-specific character groups      │
│  • DANGEROUS_PATTERNS - always-blocked security risks      │
└────────────────────────────────────────────────────────────┘
```

## 🚀 High-Level APIs (What to Reach For)

### For Form Schemas: `fieldBuilder`

**Use this 95% of the time** for Zod form schemas:

```typescript
import { fieldBuilder } from '@/utils/zod'

const schema = z.object({
  // Basic required name field with label-generated messages
  firstName: fieldBuilder.name({ label: 'First name' }), // → "First name is required"

  // Optional name with custom message (overrides label)
  lastName: fieldBuilder.name({
    label: 'Last name',
    required: false,
    requiredMessage: 'Last name is required for this form',
  }),

  // Email with custom validation level and label
  email: fieldBuilder.email({
    label: 'Email address', // → "Email address is required", "Please enter a valid email address"
    ruleSet: 'dangerousOnly', // Only block dangerous content
  }),

  // Phone number (optional by default)
  phone: fieldBuilder.phone({
    label: 'Phone number',
    required: false,
  }),
})
```

**Label-based error messages:**

The `label` option automatically generates contextual error messages:

- `label: 'First name'` → `"First name is required"`
- `label: 'Email address'` → `"Email address is required"`, `"Please enter a valid email address"`
- Custom `requiredMessage` always overrides label-generated messages

**Available rule sets:**

- `'standard'` (default) - Full validation including dangerous content + character restrictions
- `'dangerousOnly'` - Only blocks dangerous content (scripts, etc.)
- `'charsOnly'` - Only character restrictions (no dangerous content check)
- `'none'` - No validation rules applied

**For advanced control:** You can also disable specific rules using the low-level API:

```typescript
import { VALIDATION_RULE_SETS } from '@/utils/data/validate'

// Get name validation without dangerous content check
const rules = VALIDATION_RULE_SETS.name({ dangerousContent: false })

// Get email validation without character restrictions
const rules = VALIDATION_RULE_SETS.email({ invalidEmailChars: false })

// Disable multiple rules
const rules = VALIDATION_RULE_SETS.text({
  invalidTextChars: false,
  dangerousContent: false
})
```

### For Form Submission: `useCoreMutation` sanitize prop (Recommended)

**Use the `sanitize` prop** for automatic sanitization:

```typescript
import { useCoreMutation } from '@/hooks/use-core-mutation'

const createUser = useCoreMutation({
  url: '/api/users',
  method: 'POST',
  sanitize: {
    firstName: 'name',
    lastName: 'name',
    email: 'email',
    description: 'text',
  },
  toast: {
    messages: {
      success: ({ context }) => `User ${context?.firstName} created!`,
    },
  },
})

const onSubmit = async (data: FormData) => {
  // Sanitization happens automatically!
  await createUser.mutateAsync(data)
}
```

### For Manual Form Submission: `sanitizeFormData`

**Use this approach** when you need manual control:

```typescript
import { sanitizeFormData } from '@/utils/zod'

const onSubmit = async (data: FormData) => {
  // Manual sanitization before sending to API
  const sanitizedData = sanitizeFormData(data, {
    firstName: 'name',
    lastName: 'name',
    email: 'email',
    description: 'text',
  })

  await createUser.mutateAsync(sanitizedData)
}
```

### For Schema Bundles: Consistent Type Safety

```typescript
// In schema files
export const userSchema = {
  form: z.object({
    firstName: fieldBuilder.name(),
    email: fieldBuilder.email(),
  }),
  api: z.object({
    firstName: sanitizedField.name(), // Auto-sanitizing
    email: sanitizedField.email(),
  }),
} satisfies SchemaBundle

export type UserFormData = z.infer<typeof userSchema.form>
```

## 📝 Schema Patterns

### Basic Schema Structure

```typescript
// src/lib/db/schemas/example.ts
import { SchemaBundle, fieldBuilder, sanitizedField } from '@/utils/zod'

// Form schema - for frontend validation with custom messages/rules
const form = z.object({
  name: fieldBuilder.name({ label: 'Full name' }),
  email: fieldBuilder.email({
    label: 'Email address',
    ruleSet: 'dangerousOnly',
  }),
})

// API schema - for backend validation with automatic sanitization
const api = z.object({
  name: sanitizedField.name(),
  email: sanitizedField.email(),
})

export const exampleSchema = { form, api } satisfies SchemaBundle
export type ExampleFormData = z.infer<typeof exampleSchema.form>
```

### Advanced Customization

```typescript
const form = z.object({
  // Custom validation rules with label
  username: fieldBuilder.name({
    label: 'Username',
    required: true,
    customRules: [
      {
        pattern: /^\s*$/,
        message: 'Username cannot be only whitespace',
      },
      {
        pattern: /^admin/i,
        message: 'Username cannot start with "admin"',
      },
    ],
  }),

  // Additional Zod refinements with label
  password: fieldBuilder.text({
    label: 'Password',
    additionalRefinements: [
      {
        check: (val) => val.length >= 8,
        message: 'Password must be at least 8 characters',
      },
    ],
  }),
})
```

## 📤 Form Submission Pattern

### Recommended: useCoreMutation with sanitize prop

```typescript
const createUser = useCoreMutation({
  url: '/api/users',
  method: 'POST',
  sanitize: {
    firstName: 'name',
    lastName: 'name',
    email: 'email',
    phone: 'phone',
    description: 'text',
  },
})

const onSubmit: SubmitHandler<FormData> = async (data) => {
  // 1. Check if form is dirty (optional but recommended)
  if (!isDirty) {
    return
  }

  // 2. Send to API handler (sanitization automatic)
  const result = await createUser.mutateAsync(data)

  // 3. Handle response
  if (successful(result.status)) {
    router.push('/success')
  }
}
```

### Alternative: Manual sanitization pattern

```typescript
const onSubmit: SubmitHandler<FormData> = async (data) => {
  // 1. Check if form is dirty (optional but recommended)
  if (!isDirty) {
    return
  }

  // 2. Sanitize form data before sending to API
  const sanitizedData = sanitizeFormData(data, {
    firstName: 'name',
    lastName: 'name',
    email: 'email',
    phone: 'phone',
    description: 'text',
  })

  // 3. Send to API handler
  const result = await createUser.mutateAsync(sanitizedData)

  // 4. Handle response
  if (successful(result.status)) {
    router.push('/success')
  }
}
```

## 🔧 API Handler Pattern

**Standard pattern** for API route handlers:

```typescript
// In handler functions
export const handleCreateUser = async (payload: UserPayload) => {
  return createApiHandler(
    async ({ userProfileId }) => {
      // 1. Validate payload against API schema (includes sanitization)
      const validationResult = validatePayload(userSchema.api, payload)

      if (!validationResult.success) {
        return {
          status: 'error',
          message: 'Invalid data',
          errors: validationResult.errors,
        }
      }

      // 2. Use validated data (already sanitized)
      const result = await db.user.create({
        data: {
          ...validationResult.data,
          createdBy: userProfileId,
        },
      })

      return { status: 'success', data: result }
    },
    {
      isMutation: true,
      messages: {
        success: 'User created successfully',
      },
    },
  )
}
```

## 🔧 Low-Level Utilities

### Advanced Rule Customization (NEW)

The validation system now supports **granular rule control** at the low level:

```typescript
import { VALIDATION_RULE_SETS } from '@/utils/data/validate'

// All validation rules applied (default)
VALIDATION_RULE_SETS.name()
// Returns: [invalidNameChars, dangerousContent]

// Disable specific rules with false
VALIDATION_RULE_SETS.name({ dangerousContent: false })
// Returns: [invalidNameChars] (character validation only)

VALIDATION_RULE_SETS.email({ invalidEmailChars: false })
// Returns: [dangerousContent] (security validation only)

// Disable multiple rules
VALIDATION_RULE_SETS.text({ invalidTextChars: false, dangerousContent: false })
// Returns: [] (no validation)

// Explicit enable with true (same as default)
VALIDATION_RULE_SETS.name({ dangerousContent: true })
// Returns: [invalidNameChars, dangerousContent] (all rules)
```

**Rule IDs available for control:**

- `invalidNameChars` - Character restrictions for names
- `invalidEmailChars` - Character restrictions for emails
- `invalidPhoneChars` - Character restrictions for phone numbers
- `invalidTextChars` - Character restrictions for general text
- `dangerousContent` - Security patterns (scripts, etc.)

### When to Use Lower-Level APIs

- **Building custom field types** not covered by fieldBuilder
- **Advanced sanitization** with specific character sets
- **Custom validation logic** beyond standard patterns
- **Direct pattern testing** for specific security checks

### Pattern Testing

```typescript
import { validateFieldContent } from '@/utils/data/validate'

// Test if content passes validation
const result = validateFieldContent('user input', 'name')
if (!result.isValid) {
  console.log(result.errorMessage)
}
```

### Custom Sanitization

```typescript
import { sanitizeTextInput } from '@/utils/data/sanitize'

// Field-specific sanitization
const cleanName = sanitizeTextInput(input, { fieldType: 'name' })

// Context-specific sanitization
const serverSafe = sanitizeTextInput(input, { context: 'server' })
const clientFriendly = sanitizeTextInput(input, { context: 'client' })

// Custom character control
const custom = sanitizeTextInput(input, {
  blacklist: ['<', '>', '"'],
  trim: true,
})
```

### Creating Custom Fields

```typescript
import { VALIDATION_RULE_SETS, createValidatedField } from '@/utils/zod'

// Custom field with specific rules
const customField = createValidatedField('string', {
  required: true,
  requiredMessage: 'This field is required',
  ruleSet: VALIDATION_RULE_SETS.dangerousContentOnly(),
  additionalRefinements: [
    {
      check: (val) => val.length <= 100,
      message: 'Must be 100 characters or less',
    },
  ],
})

// Custom field with selective rule exclusion
const flexibleField = createValidatedField('string', {
  required: true,
  ruleSet: VALIDATION_RULE_SETS.name({ dangerousContent: false }), // Only character validation
})
```

## 🔒 Security Strategy

### Defense-in-Depth Approach

1. **Input Sanitization** (Form submission) - Remove/escape dangerous content before sending to server
2. **Server Validation** (API handlers) - Validate and re-sanitize on the backend
3. **Database Constraints** - Final validation at the data layer
4. **Output Encoding** - Safe rendering in the UI

### Security Patterns Blocked

- **Script injection**: `<script>`, `javascript:`, `vbscript:`, `on*=`
- **HTML injection**: Dangerous HTML tags and attributes
- **Data URI attacks**: `data:text/html` schemes
- **Special characters**: Context-specific dangerous characters

### Context-Aware Security

- **Client context**: Lenient sanitization for better UX
- **Server context**: Strict sanitization for security
- **Field-specific**: Tailored rules for names, emails, phone numbers, etc.

## 🎯 Common Patterns

### User Profile Forms

```typescript
const schema = z.object({
  firstName: fieldBuilder.name({ label: 'First name' }),
  lastName: fieldBuilder.name({
    label: 'Last name',
    required: false,
  }),
  email: fieldBuilder.email({ label: 'Email address' }),
  phone: fieldBuilder
    .phone({
      label: 'Phone number',
      required: false,
    })
    .or(z.literal('')),
})
```

### Organization Forms

```typescript
const schema = z.object({
  name: fieldBuilder.name(),
  description: fieldBuilder.text({ required: false }),
  website: z.string().url().optional(),
})
```

### Member Invitation Forms

```typescript
const schema = z.object({
  firstName: fieldBuilder.name(),
  lastName: fieldBuilder.name(),
  email: fieldBuilder.email(),
  roles: z.array(z.enum(['owner', 'admin', 'member'])).min(1),
})
```

## 🐛 Troubleshooting

### Common Issues

**"Field validation is too strict"**

- Use `ruleSet: 'dangerousOnly'` to only block dangerous content
- Use `required: false` for optional fields
- Add custom rules if you need specific validation

**"Sanitization is removing valid characters"**

- Check the field type in `sanitizeFormData()` mapping
- Use `context: 'client'` for more lenient sanitization
- Consider custom `blacklist`/`whitelist` options

**"Form validation passes but API rejects"**

- Ensure form schema uses `fieldBuilder` and API schema uses `sanitizedField`
- Check that sanitization is applied via `useCoreMutation` sanitize prop or manual `sanitizeFormData()` call
- Verify API handler uses `validatePayload()` with API schema

**"TypeScript errors with schema types"**

- Ensure schemas use `satisfies SchemaBundle`
- Import types from the correct schema file
- Check that form data type matches schema inference

### Debug Validation

```typescript
// Test what validation rules are applied
import { sanitizeTextInput } from '@/utils/data/sanitize'
import { VALIDATION_RULE_SETS } from '@/utils/data/validate'

console.log('All name rules:', VALIDATION_RULE_SETS.name())
console.log(
  'Name without dangerous content:',
  VALIDATION_RULE_SETS.name({ dangerousContent: false }),
)
console.log(
  'Email without char validation:',
  VALIDATION_RULE_SETS.email({ invalidEmailChars: false }),
)

// Test sanitization output
const input = 'test<script>alert("xss")</script>'
console.log('Sanitized:', sanitizeTextInput(input, { fieldType: 'name' }))
```

### Performance Considerations

- **Validation rules** are applied in order - dangerous content is checked first
- **Sanitization patterns** use Unicode-aware regex with appropriate flags
- **Form schemas** should be defined outside components to avoid recreation
- **Schema bundles** provide optimized validation for different contexts

---

## 🆕 Recent Improvements

### useCoreMutation Sanitize Prop (September 2025)

Added automatic sanitization support directly in `useCoreMutation` hook:

**New Feature:**

- `sanitize` prop in `useCoreMutation` for automatic form data sanitization
- Type-safe configuration using payload keys
- Applied after `transform` but before API call
- Backward compatible - existing code continues to work

**Benefits:**

- **Consistent application** - impossible to forget sanitization
- **Type safety** - TypeScript prevents invalid field configurations
- **Composable** - works with existing `transform` prop
- **Explicit** - sanitization rules visible at mutation level

**Migration:**

```typescript
// Old approach (still works)
const onSubmit = async (data) => {
  const sanitized = sanitizeFormData(data, { name: 'name' })
  await mutation.mutateAsync(sanitized)
}

// New approach (recommended)
const mutation = useCoreMutation({
  url: '/api/endpoint',
  sanitize: { name: 'name' },
})
const onSubmit = async (data) => {
  await mutation.mutateAsync(data) // Sanitization automatic!
}
```

---

## 📚 Related Documentation

- [Prisma Error Handling](./PRISMA_ERROR_HANDLING.md)
- [Organization Permissions & Security](./ORGANIZATION_PERMISSIONS_SECURITY.md)
- [DB API Patterns](./DB_API_PATTERNS.md)
