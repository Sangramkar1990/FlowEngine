const Role = require('../models/Role');
const Permission = require('../models/Permission');
const RolePermission = require('../models/RolePermission');

// Get all roles
const getAllRoles = async (req, res) => {
  try {
    const roles = await Role.findAll();
    res.status(200).json(roles);
  } catch (error) {
    console.error('Error getting all roles:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Get all permissions
const getAllPermissions = async (req, res) => {
  try {
    const permissions = await Permission.findAll();
    res.status(200).json(permissions);
  } catch (error) {
    console.error('Error getting all permissions:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Get permissions for a specific role
const getRolePermissions = async (req, res) => {
  try {
    const { roleId } = req.params;
    const rolePermissions = await RolePermission.getPermissionsForRole(roleId);
    res.status(200).json(rolePermissions);
  } catch (error) {
    console.error(`Error getting permissions for role ${req.params.roleId}:`, error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Update permissions for a specific role
const updateRolePermissions = async (req, res) => {
  try {
    const { roleId } = req.params;
    const { permissionIds } = req.body; // permissionIds should be an array of permission IDs

    if (!Array.isArray(permissionIds)) {
      return res.status(400).json({ message: 'permissionIds must be an array.' });
    }

    // Ensure the role exists
    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(404).json({ message: 'Role not found.' });
    }

    // Ensure all permission IDs are valid
    const existingPermissions = await Permission.findAll();
    const existingPermissionIds = existingPermissions.map(p => p.id);
    const invalidPermissionIds = permissionIds.filter(id => !existingPermissionIds.includes(id));

    if (invalidPermissionIds.length > 0) {
      return res.status(400).json({ message: `Invalid permission IDs: ${invalidPermissionIds.join(', ')}` });
    }

    // Update the role permissions
    const updatedRolePermission = await RolePermission.create(roleId, permissionIds);
    res.status(200).json({ message: 'Role permissions updated successfully.', rolePermission: updatedRolePermission });
  } catch (error) {
    console.error(`Error updating permissions for role ${req.params.roleId}:`, error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

module.exports = {
  getAllRoles,
  getAllPermissions,
  getRolePermissions,
  updateRolePermissions,
};