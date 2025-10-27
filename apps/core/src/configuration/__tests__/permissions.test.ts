import { APP_PERMISSIONS, PermissionArea } from '../permissions'

describe('APP_PERMISSIONS configuration', () => {
  const areas: PermissionArea[] = ['organization', 'orders']

  it('should have all permission areas defined', () => {
    expect(Object.keys(APP_PERMISSIONS)).toEqual(expect.arrayContaining(areas))
  })

  describe('organization permissions', () => {
    it('should restrict edit_org_info to owner only', () => {
      expect(APP_PERMISSIONS.organization.edit_org_info).toEqual(['owner'])
    })

    it('should allow only owner to edit members', () => {
      expect(APP_PERMISSIONS.organization.edit_org_members).toEqual(['owner'])
    })

    it('should restrict delete_org to owner only', () => {
      expect(APP_PERMISSIONS.organization.delete_org).toEqual(['owner'])
    })

    it('should restrict transfer_org to owner only', () => {
      expect(APP_PERMISSIONS.organization.transfer_org).toEqual(['owner'])
    })
  })

  describe('orders permissions', () => {
    it('should allow all roles to create orders', () => {
      expect(APP_PERMISSIONS.orders.create_order).toEqual([
        'owner',
        'manager',
        'appraiser',
      ])
    })

    it('should allow all roles to edit orders', () => {
      expect(APP_PERMISSIONS.orders.edit_order).toEqual([
        'owner',
        'manager',
        'appraiser',
      ])
    })

    it('should restrict delete_order to owner and manager', () => {
      expect(APP_PERMISSIONS.orders.delete_order).toEqual(['owner', 'manager'])
    })

    it('should allow all roles to view orders', () => {
      expect(APP_PERMISSIONS.orders.view_orders).toEqual([
        'owner',
        'manager',
        'appraiser',
      ])
    })
  })

  describe('type safety', () => {
    it('should have all actions defined for each area', () => {
      // Organization actions
      expect(APP_PERMISSIONS.organization).toHaveProperty('edit_org_info')
      expect(APP_PERMISSIONS.organization).toHaveProperty('edit_org_members')
      expect(APP_PERMISSIONS.organization).toHaveProperty('delete_org')
      expect(APP_PERMISSIONS.organization).toHaveProperty('transfer_org')

      // Orders actions
      expect(APP_PERMISSIONS.orders).toHaveProperty('create_order')
      expect(APP_PERMISSIONS.orders).toHaveProperty('edit_order')
      expect(APP_PERMISSIONS.orders).toHaveProperty('delete_order')
      expect(APP_PERMISSIONS.orders).toHaveProperty('view_orders')
    })
  })
})
