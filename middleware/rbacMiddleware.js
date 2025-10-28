const User = require('../models/User');
const RolePermission = require('../models/RolePermission');
const Permission = require('../models/Permission'); // Although getPermissionsForRole returns names, it's good to have for consistency if needed elsewhere.

/**
 * Middleware to authorize user based on required permissions.
 * Assumes req.user.id is populated by a preceding authentication middleware.
 * @param {string} requiredPermission - The name of the permission required to access the route.
 */
const authorize = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      const userId = req.user && req.user.id;

      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized: User ID not found. Please ensure authentication middleware is run.' });
      }

      // Fetch user's role_id
      const user = await User.findById(userId);
      if (!user || !user.role_id) {
        return res.status(403).json({ message: 'Forbidden: User role not assigned or found.' });
      }

      // Get permissions for the user's role
      // RolePermission.getPermissionsForRole is expected to return an array of permission objects,
      // where each object has a 'name' property.
      const rolePermissions = await RolePermission.getPermissionsForRole(user.role_id);
      const userPermissionNames = rolePermissions.map(p => p.name);

      // Check if the user has the required permission
      if (userPermissionNames.includes(requiredPermission)) {
        next(); // User has permission, proceed to the next middleware/route handler
      } else {
        return res.status(403).json({ message: 'Forbidden: Insufficient permissions.' });
      }
    } catch (error) {
      console.error('RBAC Middleware Error:', error);
      return res.status(500).json({ message: 'Internal server error during authorization.' });
    }
  };
};

module.exports = authorize;