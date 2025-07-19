import { type CrumbMeta, buildCrumbsFromSegments } from '../breadcrumbs'

describe('buildCrumbsFromSegments()', () => {
  it('should build crumbs from basic path segments without overrides', () => {
    const segments = ['users', 'profile', 'settings']
    const result = buildCrumbsFromSegments(segments)

    expect(result).toEqual([
      { segment: 'users', path: '/users', name: 'users', hidden: false },
      {
        segment: 'profile',
        path: '/users/profile',
        name: 'profile',
        hidden: false,
      },
      {
        segment: 'settings',
        path: '/users/profile/settings',
        name: 'settings',
        hidden: false,
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
      },
    ])
  })

  it('should apply overrides correctly', () => {
    const segments = ['org', '123', 'members']
    const overrides: Omit<CrumbMeta, 'path'>[] = [
      { segment: 'org', name: 'Organization' },
      { segment: '123', name: 'Acme Corp', hidden: true },
      { segment: 'members', name: 'Team Members' },
    ]

    const result = buildCrumbsFromSegments(segments, overrides)

    expect(result).toEqual([
      { segment: 'org', path: '/org', name: 'Organization', hidden: false },
      { segment: '123', path: '/org/123', name: 'Acme Corp', hidden: true },
      {
        segment: 'members',
        path: '/org/123/members',
        name: 'Team Members',
        hidden: false,
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
      },
      {
        segment: '456',
        path: '/projects/456',
        name: 'Project Alpha',
        hidden: true,
      },
      {
        segment: 'tasks',
        path: '/projects/456/tasks',
        name: 'tasks',
        hidden: false,
      },
    ])
  })

  it('should handle undefined segments gracefully', () => {
    const result = buildCrumbsFromSegments(undefined as unknown as string[])

    expect(result).toEqual([])
  })

  it('should handle undefined overrides gracefully', () => {
    const segments = ['home', 'about']
    const result = buildCrumbsFromSegments(segments, undefined)

    expect(result).toEqual([
      { segment: 'home', path: '/home', name: 'home', hidden: false },
      { segment: 'about', path: '/home/about', name: 'about', hidden: false },
    ])
  })
})
