# Validation & Sanitization Strategy

This document explains the centralized validation and sanitization system for secure, consistent form handling across the application.

## 🎯 Philosophy: Lenient Validation with Strong Security

This system follows a **minimal restriction** approach:

- **Allow all printable characters** - Users can input apostrophes, quotes, comparison operators, and any legitimate text
- **Block only dangerous patterns** - We specifically detect and block script tags, javascript: protocols, and event handlers
- **Multi-layer security** - Protection comes from Prisma's parameterized queries (prevents SQL injection), React's automatic HTML escaping (prevents XSS), and dangerous pattern detection
- **Perfect alignment** - What passes validation will never be altered by sanitization (except whitespace normalization and dangerous pattern removal)

## 📊 Field Types

The system uses `StringFieldType` to categorize string fields:

```typescript
type StringFieldType = 'name' | 'email' | 'phone' | 'uuid' | 'general'
```

- **`name`** - Person/organization names (allows apostrophes, hyphens, Unicode)
- **`email`** - Email addresses (format validation + dangerous pattern checking)
- **`phone`** - Phone numbers (allows digits, spaces, +, -, (, ), .)
- **`uuid`** - UUIDs/tokens (alphanumeric, hyphens, underscores only)
- **`general`** - Catch-all for general text content (most lenient)

## 🎯 Quick Start (TL;DR)

**For most form schemas:** Use `fieldBuilder.text({ type: 'name' })`, `fieldBuilder.text({ type: 'email' })`, etc.  
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
│  • fieldBuilder.text({ type: ... })                        │
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
│  • sanitizedField.text({ type: ... }) for sanitization     │
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

### For Form Schemas: `fieldBuilder.text()`

**Use this 95% of the time** for Zod form schemas:

```typescript
import { fieldBuilder } from '@/utils/zod'

const schema = z.object({
  // Basic required name field with label-generated messages
  firstName: fieldBuilder.text({
    type: 'name',
    label: 'First name',
    required: true,
  }), // → "First name is required"

  // Optional name with custom message (overrides label)
  lastName: fieldBuilder.text({
    type: 'name',
    label: 'Last name',
    required: false,
  }),

  // Email with custom validation level and label
  email: fieldBuilder.text({
    type: 'email',
    label: 'Email address',
    required: true,
    ruleSet: 'dangerousOnly', // Only block dangerous content
  }), // → "Email address is required", "Please enter a valid email address"

  // Phone number that allows empty string
  phone: fieldBuilder.text({ type: 'phone' }).or(z.literal('')),

  // UUID/token field
  inviteToken: fieldBuilder.text({ type: 'uuid' }),

  // General text with custom validation
  description: fieldBuilder.text({
    type: 'general',
    label: 'Description',
    customRules: [
      {
        pattern: /^\s+$/,
        message: 'Description cannot be only whitespace',
      },
    ],
  }),
})
```

**Field Types:**

- `type: 'name'` - Person/organization names
- `type: 'email'` - Email addresses with format validation
- `type: 'phone'` - Phone numbers
- `type: 'uuid'` - UUIDs and secure tokens
- `type: 'general'` - General text content (default if type omitted)

**Label-based error messages:**

The `label` option automatically generates contextual error messages:

- `label: 'First name'` → `"First name is required"`
- `label: 'Email address'` → `"Email address is required"`, `"Please enter a valid email address"`
- Custom `requiredMessage` always overrides label-generated messages

**Available rule sets:**

- `'standard'` (default) - Full validation including dangerous content checks
- `'dangerousOnly'` - Only blocks dangerous content (scripts, XSS attempts, etc.)
- `'none'` - No validation rules (use for completely custom validation)

**For advanced control:** You can also disable specific rules using the low-level API:

```typescript
import { VALIDATION_RULE_SETS } from '@/utils/data/validate'

// Get name validation without dangerous content check
const rules = VALIDATION_RULE_SETS.name({ dangerousContent: false })

// Get phone validation without character restrictions
const rules = VALIDATION_RULE_SETS.phone({ invalidPhoneChars: false })

// Disable multiple rules (returns only rules not excluded)
const rules = VALIDATION_RULE_SETS.uuid({
  invalidUuidChars: false,
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
    description: 'general',
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
    description: 'general',
  })

  await createUser.mutateAsync(sanitizedData)
}
```

### For API Schemas: `sanitizedField.text()`

Use in server-side API schemas for automatic sanitization:

```typescript
// In schema files
export const userSchema = {
  form: z.object({
    firstName: fieldBuilder.text({ type: 'name', required: true }),
    email: fieldBuilder.text({ type: 'email', required: true }),
  }),
  api: z.object({
    firstName: sanitizedField.text({ type: 'name' }), // Auto-sanitizing
    email: sanitizedField.text({ type: 'email' }),
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
  name: fieldBuilder.text({ type: 'name', label: 'Full name', required: true }),
  email: fieldBuilder.text({
    type: 'email',
    label: 'Email address',
    required: true,
    ruleSet: 'dangerousOnly',
  }),
})

// API schema - for backend validation with automatic sanitization
const api = z.object({
  name: sanitizedField.text({ type: 'name' }),
  email: sanitizedField.text({ type: 'email' }),
})

export const exampleSchema = { form, api } satisfies SchemaBundle
export type ExampleFormData = z.infer<typeof exampleSchema.form>
```

### Advanced Customization

```typescript
const form = z.object({
  // Custom validation rules with label
  username: fieldBuilder.text({
    type: 'name',
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
    type: 'general',
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
    description: 'general',
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
  if (isStatusCodeSuccess(result.status)) {
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
    description: 'general',
  })

  // 3. Send to API handler
  const result = await createUser.mutateAsync(sanitizedData)

  // 4. Handle response
  if (isStatusCodeSuccess(result.status)) {
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

### Validation Rule Sets

The validation system provides **granular control** at the field level:

```typescript
import { VALIDATION_RULE_SETS } from '@/utils/data/validate'

// Standard validation (dangerous patterns only for name/email/general)
VALIDATION_RULE_SETS.name()
// Returns: [dangerousContent]

VALIDATION_RULE_SETS.email()
// Returns: [dangerousContent]

VALIDATION_RULE_SETS.general()
// Returns: [dangerousContent]

// Dangerous content only (explicit)
VALIDATION_RULE_SETS.dangerousContentOnly()
// Returns: [dangerousContent]

// Disable dangerous content checking (use with caution!)
VALIDATION_RULE_SETS.name({ dangerousContent: false })
// Returns: [] (no validation)

// Phone has character-specific validation
VALIDATION_RULE_SETS.phone()
// Returns: [invalidPhoneChars]

// UUID has both character and dangerous content validation
VALIDATION_RULE_SETS.uuid()
// Returns: [invalidUuidChars, dangerousContent]

// Disable specific UUID rules
VALIDATION_RULE_SETS.uuid({ invalidUuidChars: false })
// Returns: [dangerousContent]
```

**Available Rule IDs:**

- `dangerousContent` - Security patterns (scripts, javascript:, event handlers) - **Used by default for name/email/general**
- `invalidPhoneChars` - Character restrictions for phone numbers (digits, +, -, (, ), ., spaces only)
- `invalidUuidChars` - Character restrictions for UUIDs (alphanumeric, hyphens, underscores only)

### When to Use Lower-Level APIs

- **Building custom field types** not covered by fieldBuilder
- **Advanced sanitization** with specific character sets
- **Custom validation logic** beyond standard patterns
- **Direct pattern testing** for specific security checks
- **Disabling dangerous content validation** (rare, security-sensitive use cases only)

### Pattern Testing

```typescript
import { validateFieldContent } from '@/utils/data/validate'

// Test if content passes validation
const result = validateFieldContent('user input', 'name')
if (!result.isValid) {
  console.log(result.errorMessage)
}

// Examples
validateFieldContent("O'Brien", 'name') // { isValid: true }
validateFieldContent('<script>alert(1)</script>', 'name')
// { isValid: false, errorMessage: "Content contains potentially unsafe code or scripts" }
```

### Custom Sanitization

```typescript
import { sanitizeTextInput } from '@/utils/data/sanitize'

// Field-specific sanitization
const cleanName = sanitizeTextInput(input, { fieldType: 'name' })
const cleanEmail = sanitizeTextInput(input, { fieldType: 'email' })
const cleanPhone = sanitizeTextInput(input, { fieldType: 'phone' })

// Context-specific sanitization (now equivalent - both preserve all chars except dangerous patterns)
const serverSafe = sanitizeTextInput(input, { context: 'server' })
const clientFriendly = sanitizeTextInput(input, { context: 'client' })

// Custom character control
const custom = sanitizeTextInput(input, {
  blacklist: ['!', '@', '#'], // Remove specific characters
  trim: true,
})

// Only remove dangerous patterns (default for name/email/general)
const safe = sanitizeTextInput(input, { fieldType: 'general' })
```

### Creating Custom Fields

```typescript
import { VALIDATION_RULE_SETS, createValidatedField } from '@/utils/zod'

// Custom field with standard dangerous content validation
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

// Custom field with no validation (use with extreme caution!)
const noValidationField = createValidatedField('string', {
  required: true,
  ruleSet: VALIDATION_RULE_SETS.name({ dangerousContent: false }),
})

// Custom phone field with specific character validation
const strictPhoneField = createValidatedField('string', {
  required: true,
  ruleSet: VALIDATION_RULE_SETS.phone(),
  additionalRefinements: [
    {
      check: (val) => val.replace(/\D/g, '').length === 10,
      message: 'Must be exactly 10 digits',
    },
  ],
})
```

## 🔒 Security Strategy

### Multi-Layer Defense (No Character-Level Restrictions Needed)

Our security approach relies on **three independent layers** that work together, eliminating the need for character-level input restrictions:

**Layer 1: Prisma ORM - SQL Injection Protection**

- All database queries use **parameterized queries** (prepared statements)
- User input is never concatenated into SQL strings
- Special characters like quotes, semicolons, and SQL keywords are safely handled by Prisma
- **Result**: Complete SQL injection protection regardless of input characters

**Layer 2: React - XSS Protection**

- React **automatically escapes** all text content when rendering
- `<script>` becomes `&lt;script&gt;` in the DOM
- User input is treated as text, not executable code
- **Result**: XSS attacks prevented by default rendering

**Layer 3: Dangerous Pattern Detection**

- We explicitly block patterns that are **never legitimate user input**:
  - Script tags: `<script>`, `</script>`
  - JavaScript protocols: `javascript:`, `vbscript:`, `data:`
  - Event handlers: `onclick=`, `onerror=`, `onload=`
- These patterns are removed by sanitization before storage
- **Result**: Defense-in-depth against sophisticated attacks

### What This Means for UX

**Allowed inputs** (previously blocked):

```typescript
// Names with apostrophes
"O'Brien", "D'Angelo", 'José & François (LLC)'

// Text with quotes and operators
'Sales > $1M', 'Value < 100', '"Premium" Tier'

// Emails with special characters
'user+tag@example.com', 'name.surname@domain.co.uk'

// Any printable characters except dangerous patterns
;('Company A > B & Associates (2024)')
```

**Blocked inputs** (actual security threats):

```typescript
// Script injection
"<script>alert('xss')</script>"
'javascript:alert(1)'
'<img src=x onerror=alert(1)>'

// Data URIs with HTML
'data:text/html,<script>alert(1)</script>'
```

### Validation-Sanitization Alignment Guarantee

**Critical principle**: What passes validation will not be altered by sanitization (except space normalization).

This prevents UX issues where:

1. User submits form with `O'Brien`
2. Form validation passes ✓
3. Backend sanitization changes it to `OBrien` ✗
4. User sees different data than they entered ✗

**Our guarantee**:

1. User submits form with `O'Brien`
2. Form validation passes ✓
3. Backend sanitization preserves `O'Brien` ✓
4. User sees exactly what they entered ✓

### Security Patterns

Only these patterns are blocked (they are never legitimate user input):

```typescript
// From DANGEROUS_PATTERNS in validate.ts
const DANGEROUS_PATTERNS = {
  scriptTags: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  javascriptProtocol: /javascript:/gi,
  dataProtocol: /data:(?:text\/html|application\/)/gi,
  vbscriptProtocol: /vbscript:/gi,
  eventHandlers: /on\w+\s*=/gi,
}
```

## 🎯 Common Patterns

### User Profile Forms

```typescript
const schema = z.object({
  firstName: fieldBuilder.text({
    type: 'name',
    label: 'First name',
    required: true,
  }),
  lastName: fieldBuilder.text({
    type: 'name',
    label: 'Last name',
    required: false,
  }),
  email: fieldBuilder.text({
    type: 'email',
    label: 'Email address',
    required: true,
  }),
  phone: fieldBuilder
    .text({
      type: 'phone',
      label: 'Phone number',
      required: false,
    })
    .or(z.literal('')),
})
```

### Organization Forms

```typescript
const schema = z.object({
  name: fieldBuilder.text({ type: 'name', required: true }),
  description: fieldBuilder.text({ type: 'general', required: false }),
  website: z.string().url().optional(),
})
```

### Member Invitation Forms

```typescript
const schema = z.object({
  firstName: fieldBuilder.text({ type: 'name', required: true }),
  lastName: fieldBuilder.text({ type: 'name', required: true }),
  email: fieldBuilder.text({ type: 'email', required: true }),
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

### Simplified Validation - Lenient by Default (2025)

**Major simplification of validation/sanitization system** to improve UX while maintaining security:

**What Changed:**

## 📋 Recent Improvements

### Type System Consolidation (November 2024)

**Renamed and consolidated types for better semantics:**

- **Type renamed**: `FieldValidationType` → `StringFieldType` (more accurate name)
- **Field value renamed**: `'text'` → `'general'` (clearer purpose as catch-all type)
- **UUID consolidated**: Now a type option under `text()` instead of separate method
- **Reduced repetition**: `StringFieldType` union type used in function signatures

```typescript
// Type definition
type StringFieldType = 'name' | 'email' | 'phone' | 'general' | 'uuid'

// Usage
fieldBuilder.text({ type: 'general' }) // Was: fieldBuilder.text()
sanitizedField.text({ type: 'uuid' }) // Was: sanitizedField.uuid()
```

**Benefits:**

- Better semantics - `StringFieldType` clearly indicates string field types
- Clearer naming - `'general'` better describes catch-all text than `'text'`
- Reduced API surface - Single `text()` method handles all string types
- Type safety - Consistent union type usage reduces code duplication

### API Consolidation (October 2024)

**Simplified from multiple methods to single `text()` method:**

```typescript
// Before (deprecated as of October 2024)
fieldBuilder.name()
fieldBuilder.email()
fieldBuilder.phone()
fieldBuilder.uuid()

// After (current)
fieldBuilder.text({ type: 'name' })
fieldBuilder.text({ type: 'email' })
fieldBuilder.text({ type: 'phone' })
fieldBuilder.text({ type: 'uuid' })
fieldBuilder.text() // Defaults to 'general'
```

**Benefits:**

- Single, discoverable method
- Consistent API across all string fields
- Explicit type specification
- Smaller API surface to maintain

### Lenient Validation Strategy (September 2024)

**Removed all character-level restrictions** for name, email, and general text fields:

- ✅ **Apostrophes and quotes allowed** - `O'Brien`, `D'Angelo`, `"Nickname"` pass
- ✅ **Comparison operators allowed** - `Sales > $1M`, `Value < 100` valid
- ✅ **Perfect alignment** - What passes validation is preserved by sanitization
- ⚠️ **Dangerous patterns blocked** - Scripts, javascript:, event handlers removed

**Security maintained through:**

1. Prisma parameterized queries (prevents SQL injection)
2. React auto-escaping (prevents XSS)
3. Dangerous pattern detection (blocks `<script>`, `javascript:`, etc.)

**Examples:**

```typescript
// NOW PASS (previously rejected)
fieldBuilder.text({ type: 'name' }).parse("O'Brien") // ✅
fieldBuilder.text({ type: 'name' }).parse('Name "Nickname" Surname') // ✅
fieldBuilder.text({ type: 'general' }).parse('Sales > $1M') // ✅

// STILL FAIL (security threats)
fieldBuilder.text({ type: 'name' }).parse('<script>alert(1)</script>') // ❌
fieldBuilder.text({ type: 'general' }).parse('javascript:alert(1)') // ❌
```

### useCoreMutation Sanitize Prop (September 2024)

Added automatic sanitization support directly in `useCoreMutation` hook:

**Features:**

- `sanitize` prop for automatic form data sanitization
- Type-safe configuration using payload keys
- Applied after `transform` but before API call
- Backward compatible

**Benefits:**

- Consistent application - impossible to forget sanitization
- Type safety - TypeScript prevents invalid configurations
- Composable - works with existing `transform` prop
- Explicit - sanitization rules visible at mutation level

**Example:**

```typescript
// Recommended approach
const mutation = useCoreMutation({
  url: '/api/endpoint',
  sanitize: { name: 'name', email: 'email' },
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
