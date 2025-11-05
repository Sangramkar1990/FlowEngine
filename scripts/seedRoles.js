// Import your Role model (adjust the import path to match your project's model structure)
const Role = require('../models/Role');

// Default roles to insert (matches the commented-out INSERT in createTables.sql)
const defaultRoles = [
  { name: 'user', organization_id: null },
    { name: 'team lead', organization_id: null },
  { name: 'admin', organization_id: null },
  { name: 'super admin', organization_id: null }
];

/**
 * Seeds default roles into the database (runs only if roles don't already exist)
 * @returns {Promise<void>}
 */
async function seedRoles() {
  try {
    console.log('Starting role seeding...');

    // Insert each role only if it doesn't exist (matching SQL's ON CONFLICT)
    for (const roleData of defaultRoles) {
      const existingRole = await Role.findByName(
        roleData.name,
          roleData.organization_id
       );

      if (!existingRole) {
        await Role.create(roleData);
        console.log(`Created role: ${roleData.name}`);
      } else {
        console.log(`Role already exists: ${roleData.name}`);
      }
    }

    console.log('Role seeding completed successfully');
  } catch (error) {
    console.error('Error seeding roles:', error.message);
    throw error; // Re-throw to let the server handle critical failures
  }
}

// Export for server integration
module.exports = seedRoles;