# Organization Permissions Security Implementation

## Overview

This document outlines the security-focused implementation of organization permissions in our application, specifically addressing the critical security concern where users might gain unintended access to organization resources.

## The Security Problem

**Scenario**: A user has edit permissions for Organization A (active org) but only view permissions for Organization B. When they navigate to Organization B's page, if permissions are based on the active organization instead of the page-specific organization, they could mistakenly gain edit access to Organization B.

## Solution Architecture

### 1. Dual Permission System

We implement two distinct permission hooks for different use cases:

#### A. Global Navigation Permissions (`useActiveOrgPermissions`)

- **Purpose**: For navigation elements, sidebars, and global UI components
- **Scope**: Always reflects the currently active organization
- **Usage**: Navigation menus, global action buttons, sidebar elements

```tsx
// For navigation/global UI - uses active org
const { can } = useActiveOrgPermissions()
```

#### B. Page-Specific Permissions (`usePermissions`)

- **Purpose**: For page content and actions related to a specific organization
- **Scope**: Always uses the explicitly provided organization ID
- **Usage**: Organization pages, forms, and any component operating on a specific org

```tsx
// For page-specific content - uses explicit org ID
const { can } = usePermissions({
  organizationId: specificOrgId, // The org this page/component is about
})
```

### 2. Security Boundaries

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                        │
├─────────────────────────────────────────────────────────────┤
│  Navigation (Active Org)  │  Page Content (Specific Org)    │
│                           │                                 │
│  useActiveOrgPermissions   │  usePermissions({              │
│  - Sidebar                │    organizationId: "specific"   │
│  - Header menus           │  })                             │
│  - Global actions         │  - Organization pages           │
│                           │  - Forms                        │
│                           │  - Specific org actions         │
└─────────────────────────────────────────────────────────────┘
```

## Permission Logic

### Core Permission Functions

The application uses two core functions for permission management:

#### `getUserPermissions(organizationId)`

- **Purpose**: Returns all permission actions a user has for a specific organization
- **Logic**:
  - If permission `requiresOwner` is `true`: User must be the owner (roles are ignored)
  - If permission `requiresOwner` is `false/undefined`: User must have required role(s)
    - `roleConstraint: 'any'` (default): User needs **at least one** of the required roles
    - `roleConstraint: 'all'`: User needs **all** of the required roles
- **Returns**: Array of `PermissionAction[]`
- **Caching**: Results are cached by React Query for performance

````typescript
// Example: Owner-only permissions
'organization:delete': { roles: [], requiresOwner: true }
// Only owner gets this, regardless of roles

// Example: Role-based permissions with 'any' constraint (default)
'members:edit': { roles: ['admin'], roleConstraint: 'any' }
// Users with admin role get this

'orders:view': { roles: ['admin', 'manager', 'appraiser'] }
// Users with ANY of these roles get this (default behavior)

// Example: Role-based permissions with 'all' constraint
'advanced:action': { roles: ['admin', 'manager'], roleConstraint: 'all' }
// Only users with BOTH admin AND manager roles get this
```#### `userCan(action, organizationId)`

- **Purpose**: Check if user has a specific permission
- **Implementation**: Leverages `getUserPermissions()` for consistency
- **Returns**: `Promise<boolean>`

```typescript
// Efficient implementation - reuses permission logic
export const userCan = async ({ action, organizationId }) => {
  const permissions = await getUserPermissions(organizationId)
  return permissions.includes(action)
}
````

**Key Benefits:**

- Single source of truth for permission logic
- No duplicate code between `getUserPermissions` and `userCan`
- Consistent behavior across the application
- Easy to maintain and test

### Role Constraint Options

The `roleConstraint` property allows fine-grained control over role requirements:

#### `roleConstraint: 'any'` (Default)

User needs **at least one** of the specified roles. This is the most common pattern.

```typescript
'orders:view': {
  roles: ['admin', 'manager', 'appraiser'],
  roleConstraint: 'any' // Optional, this is the default
}
// ✅ User with 'manager' role gets permission
// ✅ User with 'admin' role gets permission
// ✅ User with both 'admin' and 'manager' gets permission
// ❌ User with 'viewer' role does NOT get permission
```

#### `roleConstraint: 'all'`

User needs **all** of the specified roles. Use this for highly sensitive actions.

```typescript
'sensitive:action': {
  roles: ['admin', 'auditor'],
  roleConstraint: 'all'
}
// ✅ User with both 'admin' AND 'auditor' roles gets permission
// ❌ User with only 'admin' role does NOT get permission
// ❌ User with only 'auditor' role does NOT get permission
```

**When to use 'all':**

- Highly sensitive operations requiring multiple oversight roles
- Actions that require expertise from multiple domains
- Compliance requirements needing multiple role verification

**When to use 'any' (default):**

- Standard RBAC patterns
- Most application permissions
- When any authorized role should have access

## Implementation Details

### Organization Provider

```tsx
// Provides global organization context
export const OrganizationProvider = ({ children }) => {
  const { activeOrgId } = useStoredSettings()

  // Permissions for the ACTIVE organization only
  const permissions = usePermissions({
    organizationId: activeOrgId || '',
  })

  return (
    <OrganizationContext.Provider
      value={{
        activeOrgId,
        permissions, // Always for active org
        switchOrganization,
        // ...
      }}
    >
      {children}
    </OrganizationContext.Provider>
  )
}
```

### Page-Specific Implementation

```tsx
// Organization page component
const OrganizationPage = ({ organizationId }) => {
  // CRITICAL: Use permissions for the SPECIFIC organization this page is about
  const { can } = usePermissions({
    organizationId, // The org this page represents, NOT the active org
  })

  const userCanEdit = can('organization:edit')
  // ...
}
```

## Security Guarantees

### 1. Permission Isolation

- ✅ Each organization's permissions are completely isolated
- ✅ Active organization selection cannot affect page-specific permissions
- ✅ No permission leakage between organizations

### 2. Fail-Safe Defaults

- ✅ Permissions deny by default during loading states
- ✅ Permissions deny by default during error states
- ✅ Invalid organization IDs result in no permissions

### 3. Input Validation

- ✅ Malicious organization IDs are handled securely
- ✅ Non-existent organizations result in no permissions
- ✅ Type safety prevents invalid permission actions

## Usage Guidelines

### ✅ Correct Usage

```tsx
// Navigation component (uses active org)
const Navigation = () => {
  const { can } = useActiveOrgPermissions()
  return <nav>{can('organization:edit') && <CreateOrgButton />}</nav>
}

// Organization page (uses specific org)
const OrganizationPage = ({ orgId }) => {
  const { can } = usePermissions({
    organizationId: orgId,
  })

  return <div>{can('organization:edit') && <EditButton />}</div>
}
```

### ❌ Incorrect Usage

```tsx
// WRONG: Using active org permissions for specific org page
const OrganizationPage = ({ orgId }) => {
  const { can } = useActiveOrgPermissions() // SECURITY RISK!

  return (
    <div>
      {can('organization:edit') && <EditButton />}{' '}
      {/* Could show edit for wrong org! */}
    </div>
  )
}
```

## Testing Strategy

### 1. Unit Tests

- Permission isolation tests
- Error state handling
- Input validation
- Type safety verification

### 2. Integration Tests

- Cross-organization access prevention
- Active vs. page-specific permission separation
- Organization switching scenarios

### 3. Critical Security Tests

- Permission leakage prevention
- Privilege escalation prevention
- Malicious input handling
- Real-world attack scenarios

## Security Checklist

When implementing new organization-related features:

- [ ] Are you using the correct permission hook for the use case?
- [ ] Are page-specific permissions using the explicit organization ID?
- [ ] Are navigation permissions using the active organization context?
- [ ] Have you tested with users who have different permissions for different orgs?
- [ ] Are permissions properly isolated between organizations?
- [ ] Do permissions fail safely during loading/error states?

## Monitoring and Auditing

- All permission checks are logged with organization context
- Failed permission attempts are tracked for security monitoring
- Organization switches are audited for suspicious patterns
- Permission queries include organization ID for traceability

This implementation ensures that users can only access resources they're explicitly authorized for, preventing the critical security vulnerability you identified.
