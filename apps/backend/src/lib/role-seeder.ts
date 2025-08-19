import { prisma } from './prisma'

export interface RoleDefinition {
  name: string
  description: string
  permissions: string[]
}

// Define default roles and their permissions
export const DEFAULT_ROLES: RoleDefinition[] = [
  {
    name: 'admin',
    description: 'System administrator with full access',
    permissions: ['*'] // Wildcard permission for full access
  },
  {
    name: 'manager',
    description: 'Manager with access to most features',
    permissions: [
      // Product management
      'products:read',
      'products:write',
      'products:delete',
      'collections:read',
      'collections:write',
      'collections:delete',
      'categories:read',
      'categories:write',
      'categories:delete',
      
      // Inventory management
      'inventory:read',
      'inventory:write',
      'inventory:adjust',
      'inventory:transfer',
      
      // Order management
      'orders:read',
      'orders:write',
      'orders:process',
      'orders:fulfill',
      'orders:cancel',
      'orders:refund',
      
      // Customer management
      'customers:read',
      'customers:write',
      'customers:delete',
      'customers:export',
      
      // Analytics and reporting
      'analytics:read',
      'reports:read',
      'reports:export',
      
      // Shopify integration
      'shopify:read',
      'shopify:sync',
      'shopify:configure',
      
      // User management (limited)
      'users:read',
      'users:write',
      
      // System monitoring
      'system:health',
      'system:logs'
    ]
  },
  {
    name: 'employee',
    description: 'Employee with access to daily operations',
    permissions: [
      // Product management (read-only)
      'products:read',
      'collections:read',
      'categories:read',
      
      // Inventory management (limited)
      'inventory:read',
      'inventory:adjust',
      
      // Order management
      'orders:read',
      'orders:write',
      'orders:process',
      'orders:fulfill',
      
      // Customer management (limited)
      'customers:read',
      'customers:write',
      
      // Basic analytics
      'analytics:read',
      'reports:read',
      
      // Shopify sync (read-only)
      'shopify:read'
    ]
  },
  {
    name: 'user',
    description: 'Basic user with limited access',
    permissions: [
      // Basic read access
      'products:read',
      'collections:read',
      'categories:read',
      'inventory:read',
      'orders:read',
      'customers:read',
      
      // Basic analytics
      'analytics:read',
      
      // Profile management
      'profile:read',
      'profile:write'
    ]
  },
  {
    name: 'viewer',
    description: 'Read-only access for viewing data',
    permissions: [
      'products:read',
      'collections:read',
      'categories:read',
      'inventory:read',
      'orders:read',
      'customers:read',
      'analytics:read',
      'reports:read',
      'shopify:read'
    ]
  }
]

/**
 * Seed default roles into the database
 */
export async function seedRoles(): Promise<void> {
  console.log('Seeding default roles...')

  for (const roleData of DEFAULT_ROLES) {
    try {
      const existingRole = await prisma.role.findUnique({
        where: { name: roleData.name }
      })

      if (existingRole) {
        // Update existing role permissions
        await prisma.role.update({
          where: { name: roleData.name },
          data: {
            description: roleData.description,
            permissions: roleData.permissions
          }
        })
        console.log(`Updated role: ${roleData.name}`)
      } else {
        // Create new role
        await prisma.role.create({
          data: {
            name: roleData.name,
            description: roleData.description,
            permissions: roleData.permissions
          }
        })
        console.log(`Created role: ${roleData.name}`)
      }
    } catch (error) {
      console.error(`Error seeding role ${roleData.name}:`, error)
    }
  }

  console.log('Role seeding completed')
}

/**
 * Create default admin user if none exists
 */
export async function createDefaultAdmin(): Promise<void> {
  const adminCount = await prisma.user.count({
    where: {
      roles: {
        some: {
          role: {
            name: 'admin'
          }
        }
      }
    }
  })

  if (adminCount === 0) {
    console.log('Creating default admin user...')
    
    const { AuthService } = await import('./auth')
    
    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@oda.com',
        firstName: 'Admin',
        lastName: 'User',
        passwordHash: await AuthService.hashPassword('Admin123!'),
        emailVerified: true,
        emailVerifiedAt: new Date()
      }
    })

    // Assign admin role
    const adminRole = await prisma.role.findUnique({
      where: { name: 'admin' }
    })

    if (adminRole) {
      await prisma.userRole.create({
        data: {
          userId: adminUser.id,
          roleId: adminRole.id
        }
      })
    }

    console.log('Default admin user created: admin@oda.com / Admin123!')
  }
}

/**
 * Get all available permissions from roles
 */
export function getAllPermissions(): string[] {
  const permissions = new Set<string>()
  
  DEFAULT_ROLES.forEach(role => {
    role.permissions.forEach(permission => {
      if (permission !== '*') {
        permissions.add(permission)
      }
    })
  })

  return Array.from(permissions).sort()
}

/**
 * Check if a permission is valid
 */
export function isValidPermission(permission: string): boolean {
  if (permission === '*') return true
  return getAllPermissions().includes(permission)
}

/**
 * Get permissions by category
 */
export function getPermissionsByCategory(): Record<string, string[]> {
  const categories: Record<string, string[]> = {}
  
  getAllPermissions().forEach(permission => {
    const [category] = permission.split(':')
    if (!categories[category]) {
      categories[category] = []
    }
    categories[category].push(permission)
  })

  return categories
}