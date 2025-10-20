import { type CrumbMeta, buildCrumbsFromSegments } from '../breadcrumbs'

describe('buildCrumbsFromSegments()', () => {
  it('should build crumbs from basic path segments without overrides', () => {
    const segments = ['users', 'profile', 'settings']
    const result = buildCrumbsFromSegments(segments)

    expect(result).toEqual([
      {
        segment: 'users',
        path: '/users',
        name: 'users',
        hidden: false,
        link: true,
      },
      {
        segment: 'profile',
        path: '/users/profile',
        name: 'profile',
        hidden: false,
        link: true,
      },
      {
        segment: 'settings',
        path: '/users/profile/settings',
        name: 'settings',
        hidden: false,
        link: true,
      },
    ])
  })

  it('should handle empty segments array', () => {
    const segments: string[] = []
    const result = buildCrumbsFromSegments(segments)

    expect(result).toEqual([])
  })

  it('should handle single segment', () => {
    const segments = ['dashboard']
    const result = buildCrumbsFromSegments(segments)

    expect(result).toEqual([
      {
        segment: 'dashboard',
        path: '/dashboard',
        name: 'dashboard',
        hidden: false,
        link: true,
      },
    ])
  })

  it('should apply overrides correctly without filtering hidden crumbs', () => {
    const segments = ['org', '123', 'members']
    const overrides: Omit<CrumbMeta, 'path'>[] = [
      { segment: 'org', name: 'Organization' },
      { segment: '123', name: 'Acme Corp', hidden: true },
      { segment: 'members', name: 'Team Members' },
    ]

    const result = buildCrumbsFromSegments(segments, overrides)

    expect(result).toEqual([
      {
        segment: 'org',
        path: '/org',
        name: 'Organization',
        hidden: false,
        link: true,
      },
      {
        segment: '123',
        path: '/org/123',
        name: 'Acme Corp',
        hidden: true,
        link: true,
      },
      {
        segment: 'members',
        path: '/org/123/members',
        name: 'Team Members',
        hidden: false,
        link: true,
      },
    ])
  })

  it('should handle partial overrides', () => {
    const segments = ['projects', '456', 'tasks']
    const overrides: Omit<CrumbMeta, 'path'>[] = [
      { segment: '456', name: 'Project Alpha', hidden: true },
    ]

    const result = buildCrumbsFromSegments(segments, overrides)

    expect(result).toEqual([
      {
        segment: 'projects',
        path: '/projects',
        name: 'projects',
        hidden: false,
        link: true,
      },
      {
        segment: '456',
        path: '/projects/456',
        name: 'Project Alpha',
        hidden: true,
        link: true,
      },
      {
        segment: 'tasks',
        path: '/projects/456/tasks',
        name: 'tasks',
        hidden: false,
        link: true,
      },
    ])
  })

  it('should handle link property overrides', () => {
    const segments = ['organizations', '123', 'settings']
    const overrides: Omit<CrumbMeta, 'path'>[] = [
      { segment: 'organizations', hidden: true },
      { segment: '123', name: 'Acme Corp' },
      { segment: 'settings', link: false },
    ]

    const result = buildCrumbsFromSegments(segments, overrides)

    expect(result).toEqual([
      {
        segment: 'organizations',
        path: '/organizations',
        name: 'organizations',
        hidden: true,
        link: true,
      },
      {
        segment: '123',
        path: '/organizations/123',
        name: 'Acme Corp',
        hidden: false,
        link: true,
      },
      {
        segment: 'settings',
        path: '/organizations/123/settings',
        name: 'settings',
        hidden: false,
        link: false,
      },
    ])
  })

  it('should handle undefined segments gracefully', () => {
    const result = buildCrumbsFromSegments(undefined as unknown as string[])

    expect(result).toEqual([])
  })

  it('should handle null segments gracefully', () => {
    const result = buildCrumbsFromSegments(null as unknown as string[])

    expect(result).toEqual([])
  })

  it('should handle undefined overrides gracefully', () => {
    const segments = ['home', 'about']
    const result = buildCrumbsFromSegments(segments, undefined)

    expect(result).toEqual([
      {
        segment: 'home',
        path: '/home',
        name: 'home',
        hidden: false,
        link: true,
      },
      {
        segment: 'about',
        path: '/home/about',
        name: 'about',
        hidden: false,
        link: true,
      },
    ])
  })

  it('should maintain correct paths even when middle segments are hidden', () => {
    const segments = ['dashboard', 'organizations', '123', 'members']
    const overrides: Omit<CrumbMeta, 'path'>[] = [
      { segment: 'organizations', hidden: true },
    ]

    const result = buildCrumbsFromSegments(segments, overrides)

    expect(result).toEqual([
      {
        segment: 'dashboard',
        path: '/dashboard',
        name: 'dashboard',
        hidden: false,
        link: true,
      },
      {
        segment: 'organizations',
        path: '/dashboard/organizations',
        name: 'organizations',
        hidden: true,
        link: true,
      },
      {
        segment: '123',
        path: '/dashboard/organizations/123',
        name: '123',
        hidden: false,
        link: true,
      },
      {
        segment: 'members',
        path: '/dashboard/organizations/123/members',
        name: 'members',
        hidden: false,
        link: true,
      },
    ])
  })

  it('should handle segments with special characters', () => {
    const segments = ['users', 'user-123', 'edit']
    const overrides: Omit<CrumbMeta, 'path'>[] = [
      { segment: 'user-123', name: 'John Doe' },
    ]

    const result = buildCrumbsFromSegments(segments, overrides)

    expect(result).toEqual([
      {
        segment: 'users',
        path: '/users',
        name: 'users',
        hidden: false,
        link: true,
      },
      {
        segment: 'user-123',
        path: '/users/user-123',
        name: 'John Doe',
        hidden: false,
        link: true,
      },
      {
        segment: 'edit',
        path: '/users/user-123/edit',
        name: 'edit',
        hidden: false,
        link: true,
      },
    ])
  })

  it('should handle multiple hidden segments', () => {
    const segments = [
      'admin',
      'organizations',
      '456',
      'users',
      '789',
      'profile',
    ]
    const overrides: Omit<CrumbMeta, 'path'>[] = [
      { segment: 'organizations', hidden: true },
      { segment: 'users', hidden: true },
    ]

    const result = buildCrumbsFromSegments(segments, overrides)

    expect(result).toEqual([
      {
        segment: 'admin',
        path: '/admin',
        name: 'admin',
        hidden: false,
        link: true,
      },
      {
        segment: 'organizations',
        path: '/admin/organizations',
        name: 'organizations',
        hidden: true,
        link: true,
      },
      {
        segment: '456',
        path: '/admin/organizations/456',
        name: '456',
        hidden: false,
        link: true,
      },
      {
        segment: 'users',
        path: '/admin/organizations/456/users',
        name: 'users',
        hidden: true,
        link: true,
      },
      {
        segment: '789',
        path: '/admin/organizations/456/users/789',
        name: '789',
        hidden: false,
        link: true,
      },
      {
        segment: 'profile',
        path: '/admin/organizations/456/users/789/profile',
        name: 'profile',
        hidden: false,
        link: true,
      },
    ])
  })

  it('should handle all overridable properties', () => {
    const segments = ['shop', 'products', '123']
    const overrides: Omit<CrumbMeta, 'path'>[] = [
      { segment: 'shop', name: 'Store', hidden: false, link: true },
      { segment: 'products', name: 'Products', hidden: true, link: false },
      { segment: '123', name: 'Cool T-Shirt', hidden: false, link: false },
    ]

    const result = buildCrumbsFromSegments(segments, overrides)

    expect(result).toEqual([
      {
        segment: 'shop',
        path: '/shop',
        name: 'Store',
        hidden: false,
        link: true,
      },
      {
        segment: 'products',
        path: '/shop/products',
        name: 'Products',
        hidden: true,
        link: false,
      },
      {
        segment: '123',
        path: '/shop/products/123',
        name: 'Cool T-Shirt',
        hidden: false,
        link: false,
      },
    ])
  })

  it('should handle empty string segments', () => {
    const segments = ['users', '', 'profile']
    const result = buildCrumbsFromSegments(segments)

    expect(result).toEqual([
      {
        segment: 'users',
        path: '/users',
        name: 'users',
        hidden: false,
        link: true,
      },
      {
        segment: '',
        path: '/users/',
        name: '',
        hidden: false,
        link: true,
      },
      {
        segment: 'profile',
        path: '/users//profile',
        name: 'profile',
        hidden: false,
        link: true,
      },
    ])
  })
})
