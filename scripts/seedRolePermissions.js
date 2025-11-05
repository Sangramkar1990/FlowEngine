// Import your models
const Role = require('../models/Role'); // Assuming your Role model is in ../models/Role.js
const Permission = require('../models/Permission'); // Assuming your Permission model is in ../models/Permission.js
const RolePermission = require('../models/RolePermission'); // Assuming your RolePermission model is in ../models/RolePermission.js

/**
 * Seeds default role-permission mappings into the database.
 * This function assumes roles and permissions have already been seeded.
 * @returns {Promise<void>}
 */
async function seedRolePermissions() {
  try {
    console.log('Starting role-permission seeding...');

    // Fetch all roles and permissions
    const roles = await Role.findAll();
    const permissions = await Permission.findAll();

    // Map permission names to their IDs for easy lookup
    const permissionMap = permissions.reduce((map, perm) => {
      map[perm.name] = perm.id;
      return map;
    }, {});

    // Define permission sets for each role
    const rolePermissionSets = {
      'user': [
        'view_sequence', 'view_techniques', 'view_teams', 'view_organization'
      ],
      'team lead': [
        'view_sequence', 'view_techniques', 'view_teams', 'view_organization',
        'manage_sequence', 'manage_teams', 'share_sequence'
      ],
      'admin': [
        'view_sequence', 'view_techniques', 'view_teams', 'view_organization',
        'manage_sequence', 'manage_teams', 'share_sequence', 'manage_organization'
      ],
      'super admin': [
        'view_sequence', 'manage_sequence', 'share_sequence',
        'view_teams', 'manage_teams',
        'view_techniques', 'manage_techniques',
        'view_organization', 'manage_organization'
      ]
    };

    for (const role of roles) {

        console.log(`Processing role: ${role}`);
      const permissionNamesForRole = rolePermissionSets[role.name];
      if (!permissionNamesForRole) {
        console.warn(`No permission set defined for role: ${role.name}`);
        continue;
      }

      const permissionIds = permissionNamesForRole
        .map(name => permissionMap[name])
        .filter(id => id !== undefined); // Filter out any undefined IDs if a permission name wasn't found

      if (permissionIds.length === 0 && permissionNamesForRole.length > 0) {
        console.warn(`Could not find all permissions for role: ${role.name}. Missing permissions: ${permissionNamesForRole.filter(name => permissionMap[name] === undefined).join(', ')}`);
      }

      // Insert or update role_permissions
      await RolePermission.create({
        role_id: role.id,
        permission_ids: permissionIds
      });
      console.log(`Seeded permissions for role: ${role.name}`);
    }

    console.log('Role-permission seeding completed successfully.');
  } catch (error) {
    console.error('Error seeding role-permissions:', error.message);
    throw error;
  }
}

module.exports = seedRolePermissions;