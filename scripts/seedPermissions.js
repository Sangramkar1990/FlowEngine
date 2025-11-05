// Import your Permission model (adjust the import path)
const Permission = require('../models/Permission'); // Assuming your Permission model is in ../models/Permission.js

// Default permissions to insert
const defaultPermissions = [
  { name: 'view_sequence' },
  { name: 'manage_sequence' },
  { name: 'share_sequence' },
  { name: 'view_teams' },
  { name: 'manage_teams' },
  { name: 'view_techniques' },
  { name: 'manage_techniques' },
  { name: 'view_organization' },
  { name: 'manage_organization' }
];

/**
 * Seeds default permissions into the database.
 * @returns {Promise<void>}
 */
async function seedPermissions() {
  try {
    console.log('Starting permission seeding...');

    for (const permData of defaultPermissions) {
      const [permission, created] = await Permission.findOrCreate({
        where: { name: permData.name },
        defaults: permData
      });
      if (created) {
        console.log(`Created permission: ${permission.name}`);
      } else {
        console.log(`Permission already exists: ${permission.name}`);
      }
    }

    console.log('Permission seeding completed successfully.');
  } catch (error) {
    console.error('Error seeding permissions:', error.message);
    throw error;
  }
}

module.exports = seedPermissions;