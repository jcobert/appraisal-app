import { APP_PERMISSIONS } from '../permissions'

describe('APP_PERMISSIONS configuration', () => {
  it('should have all permissions defined', () => {
    const expectedPermissions = [
      'organization:edit',
      'members:edit',
      'organization:delete',
      'organization:transfer',
      'orders:create',
      'orders:edit',
      'orders:delete',
      'orders:view',
    ]

    expectedPermissions.forEach((permission) => {
      expect(APP_PERMISSIONS).toHaveProperty(permission)
    })
  })

  describe('organization permissions', () => {
    it('should allow admin to edit organization', () => {
      expect(APP_PERMISSIONS['organization:edit']).toEqual({
        roles: ['admin'],
      })
    })

    it('should allow admin to edit members', () => {
      expect(APP_PERMISSIONS['members:edit']).toEqual({
        roles: ['admin'],
      })
    })

    it('should restrict organization:delete to owner only (requiresOwner flag)', () => {
      expect(APP_PERMISSIONS['organization:delete']).toEqual({
        roles: [],
        requiresOwner: true,
      })
    })

    it('should restrict organization:transfer to owner only (requiresOwner flag)', () => {
      expect(APP_PERMISSIONS['organization:transfer']).toEqual({
        roles: [],
        requiresOwner: true,
      })
    })
  })

  describe('orders permissions', () => {
    it('should allow admin, manager and appraiser roles to create orders', () => {
      expect(APP_PERMISSIONS['orders:create']).toEqual({
        roles: ['admin', 'manager', 'appraiser'],
      })
    })

    it('should allow admin, manager and appraiser roles to edit orders', () => {
      expect(APP_PERMISSIONS['orders:edit']).toEqual({
        roles: ['admin', 'manager', 'appraiser'],
      })
    })

    it('should restrict orders:delete to admin and manager roles', () => {
      expect(APP_PERMISSIONS['orders:delete']).toEqual({
        roles: ['admin', 'manager'],
      })
    })

    it('should allow admin, manager and appraiser roles to view orders', () => {
      expect(APP_PERMISSIONS['orders:view']).toEqual({
        roles: ['admin', 'manager', 'appraiser'],
      })
    })
  })

  describe('type safety', () => {
    it('should have all actions defined', () => {
      // Organization actions
      expect(APP_PERMISSIONS).toHaveProperty('organization:edit')
      expect(APP_PERMISSIONS).toHaveProperty('members:edit')
      expect(APP_PERMISSIONS).toHaveProperty('organization:delete')
      expect(APP_PERMISSIONS).toHaveProperty('organization:transfer')

      // Orders actions
      expect(APP_PERMISSIONS).toHaveProperty('orders:create')
      expect(APP_PERMISSIONS).toHaveProperty('orders:edit')
      expect(APP_PERMISSIONS).toHaveProperty('orders:delete')
      expect(APP_PERMISSIONS).toHaveProperty('orders:view')
    })
  })
})
