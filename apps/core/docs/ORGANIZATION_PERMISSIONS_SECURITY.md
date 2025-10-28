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
  area: 'organization',
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

## Implementation Details

### Organization Provider

```tsx
// Provides global organization context
export const OrganizationProvider = ({ children }) => {
  const { activeOrgId } = useStoredSettings()

  // Permissions for the ACTIVE organization only
  const permissions = usePermissions({
    area: 'organization',
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
    area: 'organization',
    organizationId, // The org this page represents, NOT the active org
  })

  const userCanEdit = can('edit_org_info')
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
  return <nav>{can('edit_org_info') && <CreateOrgButton />}</nav>
}

// Organization page (uses specific org)
const OrganizationPage = ({ orgId }) => {
  const { can } = usePermissions({
    area: 'organization',
    organizationId: orgId,
  })

  return <div>{can('edit_org_info') && <EditButton />}</div>
}
```

### ❌ Incorrect Usage

```tsx
// WRONG: Using active org permissions for specific org page
const OrganizationPage = ({ orgId }) => {
  const { can } = useActiveOrgPermissions() // SECURITY RISK!

  return (
    <div>
      {can('edit_org_info') && <EditButton />}{' '}
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
